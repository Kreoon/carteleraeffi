import type { VercelRequest, VercelResponse } from '@vercel/node';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

// Whitelist de países válidos para prevenir SSRF / abuso
const ALLOWED_COUNTRIES = new Set([
  'Colombia',
  'Ecuador',
  'Guatemala',
  'República Dominicana',
  'Costa Rica',
]);

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Aceptar POST (con datos) y GET (legacy sin datos)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let country: string;
  let month: number;
  let year: number;
  let benchmarkData: Record<string, unknown> | null = null;

  if (req.method === 'POST') {
    const body = req.body as {
      country?: string;
      month?: number;
      year?: number;
      data?: Record<string, unknown>;
    };
    country = String(body?.country || '');
    month = parseInt(String(body?.month ?? ''), 10);
    year = parseInt(String(body?.year ?? ''), 10);
    benchmarkData = body?.data ?? null;
  } else {
    country = String(req.query.country || '');
    month = parseInt(String(req.query.month || ''), 10);
    year = parseInt(String(req.query.year || ''), 10);
  }

  if (!ALLOWED_COUNTRIES.has(country)) {
    return res.status(400).json({ error: 'Invalid country' });
  }
  if (isNaN(month) || month < 0 || month > 11) {
    return res.status(400).json({ error: 'Invalid month (0-11)' });
  }
  if (isNaN(year) || year < 2020 || year > 2100) {
    return res.status(400).json({ error: 'Invalid year' });
  }

  // Construir URL absoluta del embed
  // nosave=1 evita que el reporte se auto-guarde en Supabase durante el render
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const origin = `${proto}://${host}`;
  const reportUrl = `${origin}/embed/reporte?country=${encodeURIComponent(country)}&month=${month}&year=${year}&print=1&nosave=1`;

  let browser;
  try {
    console.log('[api/pdf] Launching chromium, target:', reportUrl);
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--hide-scrollbars',
        '--disable-web-security',
        '--font-render-hinting=none',
      ],
      defaultViewport: { width: 1280, height: 1800, deviceScaleFactor: 2 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    console.log('[api/pdf] Browser launched');

    const page = await browser.newPage();

    // ─── INYECTAR DATOS EN localStorage ANTES DE QUE REACT MONTE ───────────
    // evaluateOnNewDocument corre en el contexto del documento ANTES de
    // cualquier script de la página, garantizando que useBenchmarkData
    // lea los datos correctos al inicializarse.
    if (benchmarkData) {
      const storageKey = 'efficommerce_benchmark_data';
      // La clave interna que usa useBenchmarkData es "country_year_month"
      const storageValue = JSON.stringify({
        [`${country}_${year}_${month}`]: benchmarkData,
      });

      await page.evaluateOnNewDocument(
        (key: string, val: string) => {
          try {
            localStorage.setItem(key, val);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[pdf-inject] localStorage error:', e);
          }
        },
        storageKey,
        storageValue
      );
      console.log('[api/pdf] Benchmark data injected into localStorage');
    } else {
      console.warn('[api/pdf] No benchmark data provided — PDF may render empty');
    }

    await page.goto(reportUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    console.log('[api/pdf] Page loaded, waiting for React render...');

    // Esperar al marcador de contenido o al h1 como fallback
    await page
      .waitForSelector('[data-pdf-ready="true"]', { timeout: 8000 })
      .catch(() =>
        page
          .waitForSelector('h1', { timeout: 6000 })
          .catch(() => console.warn('[api/pdf] Content selectors timed out'))
      );

    // Tiempo extra para imágenes (logos, banner) y animaciones CSS
    await new Promise((r) => setTimeout(r, 3500));

    const monthLabel = MONTH_NAMES[month] ?? String(month + 1);
    const safeCountry = country.toLowerCase().replace(/[\s]+/g, '-');

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: '14mm', right: '10mm', bottom: '18mm', left: '10mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="
          font-size:8px;
          width:100%;
          text-align:center;
          color:#94a3b8;
          padding:3px 10mm 0;
          font-family:Arial,Helvetica,sans-serif;
          border-top:1px solid #e2e8f0;
          box-sizing:border-box;
        ">
          Cartelera de Indicadores Logísticos &nbsp;·&nbsp; ${country} &nbsp;·&nbsp; ${monthLabel} ${year}
          &nbsp;|&nbsp;
          Página <span class="pageNumber"></span> de <span class="totalPages"></span>
        </div>
      `,
    });

    const buffer = Buffer.from(pdf);
    const filename = `cartelera-${safeCountry}-${monthLabel.toLowerCase()}-${year}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    // Sin cache — el PDF contiene datos del usuario
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Length', buffer.length);
    res.status(200).end(buffer);
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/pdf] Error:', message);
    return res.status(500).json({ error: 'PDF generation failed', detail: message });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
