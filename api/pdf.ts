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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const country = String(req.query.country || '');
  const month = parseInt(String(req.query.month || ''), 10);
  const year = parseInt(String(req.query.year || ''), 10);

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
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const origin = `${proto}://${host}`;
  const reportUrl = `${origin}/embed/reporte?country=${encodeURIComponent(country)}&month=${month}&year=${year}&saved=true&print=1`;

  let browser;
  try {
    console.log('[api/pdf] Launching chromium, target:', reportUrl);
    browser = await puppeteer.launch({
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: { width: 1280, height: 1800, deviceScaleFactor: 2 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    console.log('[api/pdf] Browser launched');

    const page = await browser.newPage();
    // domcontentloaded es mucho más rápido que networkidle0 (SPA puede nunca quedar idle)
    await page.goto(reportUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    console.log('[api/pdf] Page loaded, waiting for content');

    // Esperar a que el contenido del reporte esté renderizado (título del carrier o card)
    await page
      .waitForSelector('h1', { timeout: 10000 })
      .catch(() => console.warn('[api/pdf] h1 selector timeout'));

    // Dar 2s extra para que React termine de renderizar todas las secciones y cargar imágenes
    await new Promise((r) => setTimeout(r, 2500));

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: '15mm', right: '10mm', bottom: '15mm', left: '10mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size:9px;width:100%;text-align:center;color:#666;padding:0 10mm">
          Cartelera Efficommerce · ${country} · <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="cartelera-${country.toLowerCase().replace(/\s+/g, '-')}-${month}-${year}.pdf"`
    );
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    const buffer = Buffer.from(pdf);
    res.setHeader('Content-Length', buffer.length);
    res.status(200);
    res.end(buffer);
    return;
  } catch (err: any) {
    console.error('[api/pdf] Error:', err);
    return res.status(500).json({ error: 'PDF generation failed', detail: err?.message });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
