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
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 1800, deviceScaleFactor: 2 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(reportUrl, { waitUntil: 'networkidle0', timeout: 25000 });

    // Esperar un poco a que terminen animaciones / lazy images
    await new Promise((r) => setTimeout(r, 800));

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
    return res.status(200).send(pdf);
  } catch (err: any) {
    console.error('[api/pdf] Error:', err);
    return res.status(500).json({ error: 'PDF generation failed', detail: err?.message });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
