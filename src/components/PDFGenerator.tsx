/**
 * PDFGenerator — Generador de PDF vía window.print()
 *
 * Usado como fallback cuando /api/pdf no está disponible (entorno local).
 * Genera un documento HTML completo con imágenes en base64,
 * diseño premium por páginas A4 y abre el diálogo de impresión.
 */
import {
  BenchmarkData,
  fields,
  FieldDefinition,
  carriersByCountry,
  monthNames,
  currencyByCountry,
  normalizeCellValue,
  getFreightSubFields,
} from '@/lib/data';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PDFGeneratorProps {
  country: string;
  month: number;
  year: number;
  data: BenchmarkData;
  bannerUrl?: string | null;
  getCarrierLogo: (carrier: string) => string | null;
  efficommerceLogoUrl?: string | null;
}

// ─── Helpers de imágenes ──────────────────────────────────────────────────────

/** Convierte una URL de imagen a base64 para incrustarla en el HTML */
async function imageToBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** HTML de logo de transportadora (img base64 o ícono SVG placeholder).
 *  alt="" para logos decorativos — evita que el text-layer del PDF duplique el nombre. */
function logoHTML(base64: string | null | undefined, _name: string, size = 40): string {
  if (base64) {
    return `<img src="${base64}" alt="" style="width:${size}px;height:${size}px;object-fit:contain;flex-shrink:0;" />`;
  }
  return `<div style="width:${size}px;height:${size}px;background:#f0f9ff;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
    <svg width="${size * 0.55}" height="${size * 0.55}" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2">
      <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  </div>`;
}

// ─── Helpers de datos ─────────────────────────────────────────────────────────

function cell(data: BenchmarkData, carrier: string, fieldId: string) {
  return normalizeCellValue(data[carrier]?.[fieldId]);
}

function num(data: BenchmarkData, carrier: string, fieldId: string, fallback = 0): number {
  const v = cell(data, carrier, fieldId).value;
  if (v === '' || v === null || v === undefined) return fallback;
  const n = parseFloat(String(v));
  return isNaN(n) ? fallback : n;
}

function stripMd(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // imágenes markdown → solo alt text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^[-*]\s+/gm, '• ')
    .trim();
}

/**
 * Escanea todos los campos textarea/text del data y precarga como base64
 * las imágenes referenciadas con sintaxis markdown ![alt](url).
 */
async function preloadMarkdownImages(
  data: BenchmarkData,
  carriers: string[]
): Promise<Record<string, string | null>> {
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const urls = new Set<string>();

  for (const carrier of carriers) {
    if (!data[carrier]) continue;
    for (const raw of Object.values(data[carrier])) {
      const normalized = normalizeCellValue(raw);
      const val = normalized.value;
      if (typeof val === 'string') {
        imgRegex.lastIndex = 0;
        let match;
        while ((match = imgRegex.exec(val)) !== null) {
          urls.add(match[2]);
        }
      }
    }
  }

  const cache: Record<string, string | null> = {};
  await Promise.all(
    Array.from(urls).map(async (url) => {
      cache[url] = await imageToBase64(url);
    })
  );

  return cache;
}

/**
 * Renderiza texto con formato markdown para HTML:
 * - Las imágenes ![alt](url) se convierten en <img> incrustadas (base64 si disponible)
 * - El resto del markdown se convierte a HTML básico
 */
function renderTextareaHTML(
  text: string,
  mdImageCache: Record<string, string | null>
): string {
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = imgRegex.exec(text)) !== null) {
    // Texto antes de esta imagen
    const before = text.slice(lastIndex, match.index);
    if (before.trim()) {
      const safe = stripMd(before).replace(/\n/g, '<br>');
      result += `<div style="white-space:pre-line;margin-bottom:4px;">${safe}</div>`;
    }

    // La imagen incrustada
    const [, alt, url] = match;
    const src = mdImageCache[url] || url;
    result += `<img src="${src}" alt="${alt}" style="max-width:100%;border-radius:6px;margin:6px 0;display:block;" />`;

    lastIndex = match.index + match[0].length;
  }

  // Texto restante después de la última imagen
  const remaining = text.slice(lastIndex);
  if (remaining.trim()) {
    const safe = stripMd(remaining).replace(/\n/g, '<br>');
    result += `<div style="white-space:pre-line;">${safe}</div>`;
  }

  return result;
}

function colorClass(c: string | null | undefined): 'green' | 'yellow' | 'red' | '' {
  if (c === 'green') return 'green';
  if (c === 'yellow') return 'yellow';
  if (c === 'red') return 'red';
  return '';
}

function pctColor(fieldId: string, val: number): string {
  if (fieldId === 'cumplimiento_ans') return val >= 95 ? '#16a34a' : val >= 85 ? '#ca8a04' : '#dc2626';
  if (fieldId === 'devoluciones') return val <= 2 ? '#16a34a' : val <= 5 ? '#ca8a04' : '#dc2626';
  if (fieldId === 'siniestros') return val <= 1 ? '#16a34a' : val <= 3 ? '#ca8a04' : '#dc2626';
  return '#1e293b';
}

function statusBadge(ans: number, dev: number, sin: number): string {
  const good = ans >= 90 && dev <= 5 && sin <= 1;
  const warn = ans >= 80 && dev <= 10 && sin <= 3;
  if (good) return `<span style="background:#dcfce7;color:#166534;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;">✓ Excelente</span>`;
  if (warn) return `<span style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;">⚠ Aceptable</span>`;
  return `<span style="background:#fee2e2;color:#991b1b;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;">✗ Revisar</span>`;
}

// ─── Renderizado de campos ────────────────────────────────────────────────────

function renderField(
  carrier: string,
  field: FieldDefinition,
  data: BenchmarkData,
  currency: string,
  mdImageCache: Record<string, string | null> = {}
): string {
  const c = cell(data, carrier, field.id);
  const value = c.value;

  if (field.type === 'boolean') {
    const yes = Boolean(value);
    return yes
      ? `<span style="color:#16a34a;font-weight:600;">✓ Sí</span>`
      : `<span style="color:#dc2626;font-weight:600;">✗ No</span>`;
  }

  if (field.type === 'percentage') {
    const n = parseFloat(String(value ?? 0));
    const color = pctColor(field.id, n);
    const barPct = field.id === 'cumplimiento_ans' ? n : field.id === 'siniestros' ? Math.min((n / 3) * 100, 100) : Math.min(n * 8, 100);
    return `
      <div style="text-align:center;">
        <span style="font-size:17px;font-weight:700;color:${color};">${n}%</span>
        <div style="margin:6px auto 0;width:90%;height:7px;background:#e2e8f0;border-radius:99px;overflow:hidden;">
          <div style="width:${barPct}%;height:100%;background:${color};border-radius:99px;"></div>
        </div>
      </div>`;
  }

  if (field.type === 'currency') {
    if (!value && value !== 0) return `<span style="color:#94a3b8;">—</span>`;
    return `${currency} ${Number(value).toLocaleString('es-CO')}`;
  }

  if (field.type === 'multi-currency') {
    if (!value) return `<span style="color:#94a3b8;">—</span>`;
    if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value as Record<string, string>).filter(([, v]) => v);
      if (!entries.length) return `<span style="color:#94a3b8;">—</span>`;
      return entries.map(([k, v]) =>
        `<div style="display:flex;justify-content:space-between;gap:6px;font-size:11px;margin-bottom:2px;">
          <span style="color:#64748b;">${k}:</span>
          <span style="font-weight:600;">${currency} ${Number(v || 0).toLocaleString('es-CO')}</span>
        </div>`
      ).join('');
    }
    const n = Number(value);
    return isNaN(n) ? String(value) : `${currency} ${n.toLocaleString('es-CO')}`;
  }

  // textarea / text — incrustar imágenes markdown y formatear el resto
  if (!value) return `<span style="color:#94a3b8;">—</span>`;
  const rawText = String(value);
  const rendered = renderTextareaHTML(rawText, mdImageCache);
  if (!rendered) return `<span style="color:#94a3b8;">—</span>`;
  return `<div style="font-size:12px;line-height:1.6;">${rendered}</div>`;
}

// ─── CSS de impresión ─────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

:root{
  --p:#0891b2; --pd:#164e63;
  --text:#1e293b; --muted:#64748b; --border:#e2e8f0;
  --bg:#f8fafc;
  --good:#16a34a; --goodbg:#f0fdf4;
  --warn:#ca8a04; --warnbg:#fefce8;
  --bad:#dc2626;  --badbg:#fef2f2;
}

body{
  font-family:'Inter',Arial,sans-serif;
  color:var(--text);
  background:white;
  font-size:13px;
  line-height:1.6;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}

/* ── Páginas ── */
.page{
  width:100%;
  padding:28px 36px;
  page-break-after:always;
  break-after:page;
}
.page:last-child{page-break-after:avoid;break-after:avoid;}

/* ── Portada ── */
.cover{
  min-height:100vh;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
  padding:0;
  overflow:hidden;
  position:relative;
}
.cover-banner{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit:cover;
  opacity:.18;
}
.cover-overlay{
  position:relative;
  z-index:1;
  background:linear-gradient(135deg,var(--p) 0%,var(--pd) 100%);
  width:100%;
  min-height:100vh;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  padding:60px 48px;
  color:white;
}
.cover-logo-wrap{
  margin-bottom:36px;
  opacity:.95;
}
.cover-badge{
  font-size:11px;font-weight:700;letter-spacing:2px;
  text-transform:uppercase;
  background:rgba(255,255,255,.18);
  padding:5px 20px;border-radius:99px;
  margin-bottom:28px;
  display:inline-block;
}
.cover h1{font-size:40px;font-weight:700;line-height:1.2;margin-bottom:12px;}
.cover h2{font-size:25px;font-weight:500;opacity:.9;margin-bottom:36px;}
.cover-period{
  font-size:17px;font-weight:500;
  background:rgba(255,255,255,.15);
  padding:10px 28px;border-radius:8px;
  margin-bottom:56px;
}
.cover-brand{font-size:13px;font-weight:600;letter-spacing:3px;opacity:.7;text-transform:uppercase;}

/* ── Sección ── */
.section-title{
  font-size:18px;font-weight:700;color:var(--p);
  padding-bottom:9px;margin-bottom:18px;
  border-bottom:3px solid var(--p);
}
.section-sub{
  font-size:13px;font-weight:600;color:var(--muted);
  margin:20px 0 10px;
}

/* ── Cards ── */
.card{
  background:white;border-radius:10px;
  border:1px solid var(--border);
  padding:20px 22px;
  margin-bottom:16px;
  box-shadow:0 1px 4px rgba(0,0,0,.06);
}
.card-title{font-size:15px;font-weight:700;margin-bottom:4px;}
.card-desc{font-size:12px;color:var(--muted);margin-bottom:14px;}

/* ── KPI grid ── */
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
.kpi{
  border:1px solid var(--border);border-radius:10px;
  padding:16px 14px;text-align:center;
}
.kpi-label{font-size:11px;color:var(--muted);font-weight:500;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;}
.kpi-val{font-size:26px;font-weight:700;color:var(--p);}
.kpi-sub{font-size:11px;color:var(--muted);margin-top:3px;}

/* ── Recomendaciones ── */
.reco-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.reco-card{
  border:1px solid var(--border);border-radius:10px;
  padding:14px 16px;background:white;
}
.reco-label{font-size:11px;color:var(--muted);margin-bottom:8px;display:flex;align-items:center;gap:6px;}
.reco-content{display:flex;align-items:center;gap:12px;}
.reco-name{font-size:15px;font-weight:700;}
.reco-metric{font-size:12px;font-weight:500;}

/* ── Ranking ── */
.rank-row{
  display:flex;align-items:center;gap:14px;
  padding:10px 14px;border-radius:8px;border:1px solid var(--border);
  margin-bottom:8px;
}
.rank-row.gold{background:#fefce8;border-color:#fde68a;}
.rank-row.silver{background:#f8fafc;border-color:#e2e8f0;}
.rank-row.bronze{background:#fff7ed;border-color:#fed7aa;}
.rank-num{
  width:28px;height:28px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-weight:700;font-size:12px;color:white;flex-shrink:0;
}
.gold .rank-num{background:#eab308;}
.silver .rank-num{background:#94a3b8;}
.bronze .rank-num{background:#f97316;}
.rank-other .rank-num{background:#cbd5e1;color:var(--text);}
.rank-info{flex:1;}
.rank-name{font-weight:600;font-size:14px;}
.rank-stats{font-size:11px;color:var(--muted);margin-top:1px;}
.rank-score{text-align:right;min-width:52px;}
.rank-score-num{font-size:20px;font-weight:700;}
.rank-score-lbl{font-size:10px;color:var(--muted);}

/* ── Gráficas de barras ── */
.chart-box{background:var(--bg);border-radius:10px;padding:18px 20px;margin-bottom:14px;}
.chart-title{font-size:12px;font-weight:600;color:#374151;margin-bottom:14px;}
.bar-row{display:flex;align-items:center;gap:10px;margin-bottom:9px;}
.bar-name{
  width:150px;font-size:12px;font-weight:500;color:var(--muted);
  flex-shrink:0;display:flex;align-items:center;gap:8px;
  overflow:hidden;white-space:nowrap;text-overflow:ellipsis;
}
.bar-track{flex:1;height:22px;background:#e2e8f0;border-radius:4px;overflow:hidden;}
.bar-fill{
  height:100%;border-radius:4px;
  display:flex;align-items:center;justify-content:flex-end;
  padding-right:7px;color:white;font-size:11px;font-weight:600;
  min-width:36px;
}
.good-fill{background:linear-gradient(90deg,#22c55e,#16a34a);}
.warn-fill{background:linear-gradient(90deg,#facc15,#ca8a04);}
.bad-fill{background:linear-gradient(90deg,#f87171,#dc2626);}
.blue-fill{background:linear-gradient(90deg,#38bdf8,#0891b2);}

/* ── Tablas ── */
.cmp-table{width:100%;border-collapse:collapse;font-size:12px;margin-top:10px;}
.cmp-table th{
  background:var(--p);color:white;
  padding:10px 12px;text-align:left;font-weight:600;
}
.cmp-table td{padding:9px 12px;border-bottom:1px solid var(--border);vertical-align:top;}
.cmp-table tr:nth-child(even) td{background:var(--bg);}
.cmp-table .carrier-cell{display:flex;align-items:center;gap:10px;}

/* ── Detalle por transportadora ── */
.carrier-header{
  font-size:16px;font-weight:700;color:var(--pd);
  background:#f0f9ff;padding:14px 18px;border-radius:8px;
  margin-bottom:16px;
  border-left:4px solid var(--p);
  display:flex;align-items:center;gap:14px;
}
.fields-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;}
.fcard{
  background:var(--bg);border-radius:6px;
  padding:10px 14px;
  border-left:4px solid #cbd5e1;
}
.fcard.wide{grid-column:span 2;}
.fcard.green{border-left-color:var(--good);background:var(--goodbg);}
.fcard.yellow{border-left-color:var(--warn);background:var(--warnbg);}
.fcard.red{border-left-color:var(--bad);background:var(--badbg);}
.flabel{font-size:10px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px;}
.fval{font-size:13px;font-weight:500;}
.fnote{font-size:11px;color:var(--muted);font-style:italic;margin-top:5px;border-top:1px solid var(--border);padding-top:4px;}

/* ── Footer ── */
.page-footer{
  text-align:center;font-size:11px;color:var(--muted);
  border-top:1px solid var(--border);
  padding-top:14px;margin-top:28px;
}

@media print{
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .page{padding:20px 28px;}
}
`;

// ─── Función principal ────────────────────────────────────────────────────────

export async function generatePDF({
  country, month, year, data,
  bannerUrl, getCarrierLogo, efficommerceLogoUrl,
}: PDFGeneratorProps): Promise<void> {

  const carriers = carriersByCountry[country] || [];
  const currency  = currencyByCountry[country] || 'COP';
  const monthName = monthNames[month];

  // ── Precargar todas las imágenes como base64 ────────────────────────────
  const [bannerB64, effiLogoB64, mdImageCache] = await Promise.all([
    bannerUrl ? imageToBase64(bannerUrl) : Promise.resolve(null),
    efficommerceLogoUrl ? imageToBase64(efficommerceLogoUrl) : Promise.resolve(null),
    preloadMarkdownImages(data, carriers),
  ]);

  const logoCache: Record<string, string | null> = {};
  await Promise.all(
    carriers.map(async (c) => {
      const url = getCarrierLogo(c);
      logoCache[c] = url ? await imageToBase64(url) : null;
    })
  );

  // ── Función de logo (usa caché) ─────────────────────────────────────────
  const logo = (carrier: string, size = 40) => logoHTML(logoCache[carrier], carrier, size);

  // ── KPIs generales ──────────────────────────────────────────────────────
  const safeNum = (v: unknown) => { const n = parseFloat(String(v ?? 0)); return isNaN(n) ? 0 : n; };
  const avgANS = carriers.length ? carriers.reduce((s, c) => s + num(data, c, 'cumplimiento_ans'), 0) / carriers.length : 0;
  const avgDev = carriers.length ? carriers.reduce((s, c) => s + num(data, c, 'devoluciones', 0), 0) / carriers.length : 0;
  const avgSin = carriers.length ? carriers.reduce((s, c) => s + num(data, c, 'siniestros', 0), 0) / carriers.length : 0;
  const withExtra = carriers.filter(c =>
    cell(data, c, 'redireccion_gratis').value ||
    cell(data, c, 'reclame_oficina').value ||
    cell(data, c, 'sms_gratuitos').value
  ).length;

  // ── Ranking (Dev 60% · ANS 35% · Sin 5%) ───────────────────────────────
  const ranked = carriers.map(c => {
    const ans = num(data, c, 'cumplimiento_ans');
    const dev = num(data, c, 'devoluciones', 100);
    const sin = num(data, c, 'siniestros', 100);
    const score = ans * 0.35 + (100 - dev * 5) * 0.60 + (100 - sin * 10) * 0.05;
    return { name: c, ans, dev, sin, score };
  }).sort((a, b) => b.score - a.score);

  const rankClass = (i: number) => i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'rank-other';

  // ── Recomendaciones ─────────────────────────────────────────────────────
  const stats = carriers.map(c => ({
    name: c,
    ans: num(data, c, 'cumplimiento_ans'),
    dev: num(data, c, 'devoluciones', 100),
    sin: num(data, c, 'siniestros', 100),
    hasRedirect: Boolean(cell(data, c, 'redireccion_gratis').value),
    hasPickup:   Boolean(cell(data, c, 'reclame_oficina').value),
    hasSms:      Boolean(cell(data, c, 'sms_gratuitos').value),
  }));

  const bestOverall = [...stats].map(c => ({
    ...c,
    score: c.ans * 0.35 + (100 - c.dev * 5) * 0.60 + (100 - c.sin * 10) * 0.05,
  })).sort((a, b) => b.score - a.score)[0];
  const bestAns    = [...stats].sort((a, b) => b.ans - a.ans)[0];
  const lowestDev  = [...stats].sort((a, b) => a.dev - b.dev)[0];
  const lowestSin  = [...stats].sort((a, b) => a.sin - b.sin)[0];

  const getAvgCost = (c: string, fieldId: string) => {
    const v = cell(data, c, fieldId).value;
    if (v && typeof v === 'object') {
      const vals = Object.values(v as Record<string, string>).map(x => parseFloat(x)).filter(x => !isNaN(x) && x > 0);
      return vals.length ? vals.reduce((s, x) => s + x, 0) / vals.length : NaN;
    }
    return NaN;
  };

  const cheapestCon = carriers
    .map(c => ({ name: c, cost: getAvgCost(c, 'costo_promedio_con_recaudo_detalle') }))
    .filter(c => !isNaN(c.cost) && c.cost > 0)
    .sort((a, b) => a.cost - b.cost)[0];

  const cheapestSin = carriers
    .map(c => ({ name: c, cost: getAvgCost(c, 'costo_promedio_sin_recaudo_detalle') }))
    .filter(c => !isNaN(c.cost) && c.cost > 0)
    .sort((a, b) => a.cost - b.cost)[0];

  // ── Gráficas de barras ──────────────────────────────────────────────────
  const buildBar = (
    fieldId: string,
    maxVal: number,
    colorFn: (v: number) => string
  ) => carriers.map(c => {
    const v = num(data, c, fieldId, 0);
    const w = maxVal > 0 ? Math.min((v / maxVal) * 100, 100) : 0;
    const cls = colorFn(v);
    return `
      <div class="bar-row">
        <div class="bar-name">${logo(c, 22)} ${c}</div>
        <div class="bar-track">
          <div class="bar-fill ${cls}" style="width:${w}%">${v}%</div>
        </div>
      </div>`;
  }).join('');

  const ansMax = Math.max(...carriers.map(c => num(data, c, 'cumplimiento_ans')), 1);
  const devMax = Math.max(...carriers.map(c => num(data, c, 'devoluciones', 0)), 1);
  const sinMax = Math.max(...carriers.map(c => num(data, c, 'siniestros', 0)), 1);

  const ansBar = buildBar('cumplimiento_ans', ansMax, v => v >= 95 ? 'good-fill' : v >= 85 ? 'warn-fill' : 'bad-fill');
  const devBar = buildBar('devoluciones', devMax, v => v <= 2 ? 'good-fill' : v <= 5 ? 'warn-fill' : 'bad-fill');
  const sinBar = buildBar('siniestros', sinMax, v => v <= 1 ? 'good-fill' : v <= 3 ? 'warn-fill' : 'bad-fill');

  // ── Tabla de costos ─────────────────────────────────────────────────────
  const costRows = carriers.map(c => {
    const envio = cell(data, c, 'costo_envio_nacional').value;
    let envioHTML = '—';
    if (envio && typeof envio === 'object') {
      const ent = Object.entries(envio as Record<string, string>).filter(([, v]) => v);
      envioHTML = ent.map(([k, v]) =>
        `<div style="font-size:11px;"><span style="color:#64748b;">${k}:</span> <b>${currency} ${Number(v || 0).toLocaleString('es-CO')}</b></div>`
      ).join('');
    } else if (envio) {
      envioHTML = `${currency} ${Number(envio).toLocaleString('es-CO')}`;
    }

    const comisionVal = cell(data, c, 'comision_recaudo').value;
    const costoManejoVal = cell(data, c, 'costo_manejo').value;
    const politicaPesoVal = cell(data, c, 'politica_peso').value;

    const renderMdCell = (val: unknown) => {
      if (!val) return '—';
      const html = renderTextareaHTML(String(val), mdImageCache);
      return html || '—';
    };

    return `<tr>
      <td><div class="carrier-cell">${logo(c, 28)} <strong>${c}</strong></div></td>
      <td style="font-size:11px;">${envioHTML}</td>
      <td style="font-size:11px;">${renderMdCell(comisionVal)}</td>
      <td style="font-size:11px;">${renderMdCell(costoManejoVal)}</td>
      <td style="font-size:11px;">${politicaPesoVal || '—'}</td>
    </tr>`;
  }).join('');

  // ── Tabla de servicios ──────────────────────────────────────────────────
  const serviceRows = carriers.map(c => {
    const rd = Boolean(cell(data, c, 'redireccion_gratis').value);
    const ro = Boolean(cell(data, c, 'reclame_oficina').value);
    const sm = Boolean(cell(data, c, 'sms_gratuitos').value);
    const it = cell(data, c, 'intentos_entrega').value || '—';
    const tot = Number(rd) + Number(ro) + Number(sm);
    const totColor = tot === 3 ? '#0891b2' : tot >= 1 ? '#64748b' : '#dc2626';

    return `<tr>
      <td><div class="carrier-cell">${logo(c, 28)} <strong>${c}</strong></div></td>
      <td style="text-align:center;color:${rd ? '#16a34a' : '#dc2626'};font-weight:600;">${rd ? '✓ Sí' : '✗ No'}</td>
      <td style="text-align:center;color:${ro ? '#16a34a' : '#dc2626'};font-weight:600;">${ro ? '✓ Sí' : '✗ No'}</td>
      <td style="text-align:center;color:${sm ? '#16a34a' : '#dc2626'};font-weight:600;">${sm ? '✓ Sí' : '✗ No'}</td>
      <td style="text-align:center;">${it}</td>
      <td style="text-align:center;"><span style="background:${totColor};color:white;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;">${tot}/3</span></td>
    </tr>`;
  }).join('');

  // ── Tabla comparativa de desempeño ──────────────────────────────────────
  const perfRows = carriers.map(c => {
    const ansCl = cell(data, c, 'cumplimiento_ans');
    const devCl = cell(data, c, 'devoluciones');
    const sinCl = cell(data, c, 'siniestros');
    const a = safeNum(ansCl.value), d = safeNum(devCl.value), s = safeNum(sinCl.value);
    const ac = pctColor('cumplimiento_ans', a), dc = pctColor('devoluciones', d), sc = pctColor('siniestros', s);
    return `<tr>
      <td><div class="carrier-cell">${logo(c, 28)} <strong>${c}</strong></div></td>
      <td style="text-align:center;font-weight:700;color:${ac};">${a}%</td>
      <td style="text-align:center;font-weight:700;color:${dc};">${d}%</td>
      <td style="text-align:center;font-weight:700;color:${sc};">${s}%</td>
    </tr>`;
  }).join('');

  // ── Páginas de detalle por transportadora ───────────────────────────────
  const freightSubs = getFreightSubFields(country);
  const resolvedFields = fields.map(f => f.dynamicSubFields ? { ...f, subFields: freightSubs } : f);

  const carrierPages = carriers.map(c => {
    const cards = resolvedFields.map(f => {
      const cl = cell(data, c, f.id);
      const val = cl.value;
      const isEmpty = val === '' || val === null || val === undefined ||
        (typeof val === 'object' && Object.values(val as Record<string, string>).every(v => !v));

      const isWide = f.type === 'multi-currency' || (f.type === 'textarea' && String(val || '').length > 60);
      const cc = colorClass(cl.color);
      const valHTML = renderField(c, f, data, currency, mdImageCache);
      const noteHTML = cl.note && !f.hideNote
        ? `<div class="fnote">${stripMd(String(cl.note))}</div>` : '';

      if (isEmpty && !noteHTML) return '';

      return `<div class="fcard ${isWide ? 'wide' : ''} ${cc}">
        <div class="flabel">${f.label}</div>
        <div class="fval">${valHTML}</div>
        ${noteHTML}
      </div>`;
    }).join('');

    return `
    <div class="page">
      <div class="carrier-header">
        ${logo(c, 46)}
        <div>
          <div style="font-size:18px;font-weight:700;color:#164e63;">${c}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">Detalle completo de indicadores · ${monthName} ${year}</div>
        </div>
      </div>
      <div class="fields-grid">${cards}</div>
      <div class="page-footer">Cartelera de Indicadores Logísticos · ${country} · ${monthName} ${year}</div>
    </div>`;
  }).join('');

  // ── HTML completo ────────────────────────────────────────────────────────

  const recoCard = (icon: string, label: string, carrier: string, metric: string, metricColor = '#64748b') =>
    `<div class="reco-card">
      <div class="reco-label">${icon} ${label}</div>
      <div class="reco-content">
        ${logo(carrier, 38)}
        <div>
          <div class="reco-name">${carrier}</div>
          <div class="reco-metric" style="color:${metricColor};">${metric}</div>
        </div>
      </div>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Benchmark Logístico — ${country} — ${monthName} ${year}</title>
  <style>${CSS}</style>
</head>
<body>

<!-- ════════ PORTADA ════════ -->
<div class="page cover">
  <div class="cover-overlay">
    ${bannerB64 ? `<img src="${bannerB64}" alt="" class="cover-banner" />` : ''}
    ${effiLogoB64 ? `<div class="cover-logo-wrap"><img src="${effiLogoB64}" alt="Efficommerce" style="height:52px;object-fit:contain;opacity:.95;" /></div>` : ''}
    <div class="cover-badge">Reporte Logístico Oficial</div>
    <h1>Cartelera de Indicadores Logísticos</h1>
    <h2>${country}</h2>
    <div class="cover-period">${monthName} ${year}</div>
    <div class="cover-brand">Efficommerce &nbsp;·&nbsp; ${new Date().getFullYear()}</div>
  </div>
</div>

<!-- ════════ RESUMEN EJECUTIVO ════════ -->
<div class="page">
  <h2 class="section-title">🎯 Resumen Ejecutivo — Recomendaciones</h2>

  <div class="reco-grid">
    ${recoCard('🏆', 'Mejor Desempeño General', bestOverall.name,
        `Puntuación: ${(bestOverall as typeof bestOverall & {score:number}).score.toFixed(0)}/100`, '#64748b')}
    ${recoCard('✅', 'Mejor Cumplimiento ANS', bestAns.name, `${bestAns.ans}% de cumplimiento`, '#16a34a')}
    ${recoCard('📦', 'Menor Tasa de Devoluciones', lowestDev.name, `${lowestDev.dev}% devoluciones`, '#0891b2')}
    ${recoCard('🛡️', 'Menor Tasa de Siniestros', lowestSin.name, `${lowestSin.sin}% siniestros`, '#a855f7')}
    ${cheapestCon
      ? recoCard('💰', 'Más Económica CON Recaudo', cheapestCon.name, `${currency} ${Math.round(cheapestCon.cost).toLocaleString('es-CO')}`, '#f97316')
      : `<div class="reco-card"><div class="reco-label">💰 Más Económica CON Recaudo</div><p style="font-size:12px;color:#64748b;">Sin datos de costos</p></div>`}
    ${cheapestSin
      ? recoCard('💵', 'Más Económica SIN Recaudo', cheapestSin.name, `${currency} ${Math.round(cheapestSin.cost).toLocaleString('es-CO')}`, '#14b8a6')
      : `<div class="reco-card"><div class="reco-label">💵 Más Económica SIN Recaudo</div><p style="font-size:12px;color:#64748b;">Sin datos de costos</p></div>`}
  </div>

  <h3 class="section-sub">📊 Indicadores Clave de Desempeño</h3>
  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-label">Promedio ANS</div>
      <div class="kpi-val">${avgANS.toFixed(1)}%</div>
      <div class="kpi-sub">Meta ≥ 95%</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Promedio Devoluciones</div>
      <div class="kpi-val">${avgDev.toFixed(1)}%</div>
      <div class="kpi-sub">Ideal ≤ 2%</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Promedio Siniestros</div>
      <div class="kpi-val">${avgSin.toFixed(2)}%</div>
      <div class="kpi-sub">Ideal ≤ 1%</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Con Servicios Extra</div>
      <div class="kpi-val">${withExtra} / ${carriers.length}</div>
      <div class="kpi-sub">Transportadoras</div>
    </div>
  </div>

  <h3 class="section-sub">🏆 Ranking General (Dev 60% · ANS 35% · Sin 5%)</h3>
  ${ranked.map((r, i) => `
    <div class="rank-row ${rankClass(i)}">
      <div class="rank-num">${i + 1}</div>
      ${logo(r.name, 36)}
      <div class="rank-info">
        <div class="rank-name">${r.name}</div>
        <div class="rank-stats">ANS: ${r.ans}% &nbsp;|&nbsp; Dev: ${r.dev}% &nbsp;|&nbsp; Sin: ${r.sin}%</div>
      </div>
      <div class="rank-score">
        <div class="rank-score-num">${r.score.toFixed(0)}</div>
        <div class="rank-score-lbl">puntos</div>
      </div>
    </div>`).join('')}

  <div class="page-footer">Cartelera de Indicadores Logísticos · ${country} · ${monthName} ${year}</div>
</div>

<!-- ════════ COMPARACIÓN VISUAL ════════ -->
<div class="page">
  <h2 class="section-title">📈 Comparación Visual de Indicadores</h2>

  <div class="chart-box">
    <div class="chart-title">✅ Cumplimiento ANS — % de entregas a tiempo (meta ≥ 95%)</div>
    ${ansBar}
  </div>
  <div class="chart-box">
    <div class="chart-title">📦 Devoluciones — menor es mejor (ideal ≤ 2%)</div>
    ${devBar}
  </div>
  <div class="chart-box">
    <div class="chart-title">🛡️ Siniestros — menor es mejor (ideal ≤ 1%)</div>
    ${sinBar}
  </div>

  <div class="page-footer">Cartelera de Indicadores Logísticos · ${country} · ${monthName} ${year}</div>
</div>

<!-- ════════ TABLAS COMPARATIVAS ════════ -->
<div class="page">
  <h2 class="section-title">📋 Tabla Comparativa de Desempeño</h2>

  <table class="cmp-table">
    <thead>
      <tr>
        <th>Transportadora</th>
        <th style="text-align:center;">ANS</th>
        <th style="text-align:center;">Devoluciones</th>
        <th style="text-align:center;">Siniestros</th>
      </tr>
    </thead>
    <tbody>${perfRows}</tbody>
  </table>

  <h2 class="section-title" style="margin-top:24px;">✅ Matriz de Servicios Adicionales</h2>

  <table class="cmp-table">
    <thead>
      <tr>
        <th>Transportadora</th>
        <th style="text-align:center;">Redirección Gratis</th>
        <th style="text-align:center;">Reclame en Oficina</th>
        <th style="text-align:center;">SMS Gratuitos</th>
        <th style="text-align:center;">Intentos</th>
        <th style="text-align:center;">Total</th>
      </tr>
    </thead>
    <tbody>${serviceRows}</tbody>
  </table>

  <div class="page-footer">Cartelera de Indicadores Logísticos · ${country} · ${monthName} ${year}</div>
</div>

<!-- ════════ COSTOS DE FLETES ════════ -->
<div class="page">
  <h2 class="section-title">💰 Costos de Fletes y Políticas</h2>

  <table class="cmp-table">
    <thead>
      <tr>
        <th>Transportadora</th>
        <th>Costo Envío Nacional</th>
        <th>% Comisión Recaudo</th>
        <th>% Costo Manejo</th>
        <th>Política de Peso</th>
      </tr>
    </thead>
    <tbody>${costRows}</tbody>
  </table>

  <div class="page-footer">Cartelera de Indicadores Logísticos · ${country} · ${monthName} ${year}</div>
</div>

<!-- ════════ DETALLE POR TRANSPORTADORA ════════ -->
${carrierPages}

</body>
</html>`;

  // ── Abrir en nueva ventana e imprimir ────────────────────────────────────
  const win = window.open('', '_blank');
  if (!win) {
    alert('Permite ventanas emergentes para generar el PDF');
    return;
  }

  win.document.write(html);
  win.document.close();

  // Esperar a que carguen las fuentes Google antes de imprimir
  win.onload = () => setTimeout(() => win.print(), 1000);
}
