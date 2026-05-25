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

interface PDFGeneratorProps {
  country: string;
  month: number;
  year: number;
  data: BenchmarkData;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Devuelve el valor normalizado de una celda */
function getCellValue(data: BenchmarkData, carrier: string, fieldId: string) {
  return normalizeCellValue(data[carrier]?.[fieldId]);
}

/** Convierte markdown básico a texto plano para el PDF */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')   // bold
    .replace(/\*(.+?)\*/g, '$1')        // italic
    .replace(/^#+\s+/gm, '')            // headings
    .replace(/`(.+?)`/g, '$1')          // inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
    .replace(/^[-*]\s+/gm, '• ')        // listas
    .trim();
}

/**
 * Renderiza el valor de un campo como HTML para el PDF.
 * Maneja todos los tipos: percentage, boolean, currency,
 * multi-currency (objetos), textarea/text.
 */
function renderFieldValueHTML(
  carrier: string,
  field: FieldDefinition,
  data: BenchmarkData,
  currency: string,
  country: string
): string {
  const cell = getCellValue(data, carrier, field.id);
  const value = cell.value;

  if (field.type === 'boolean') {
    const yes = Boolean(value);
    return `<span class="bool-${yes ? 'yes' : 'no'}">${yes ? '✓ Sí' : '✗ No'}</span>`;
  }

  if (field.type === 'percentage') {
    const num = parseFloat(String(value ?? 0));
    let cls = 'pct-neutral';
    if (field.id === 'cumplimiento_ans') {
      cls = num >= 95 ? 'pct-good' : num >= 85 ? 'pct-warn' : 'pct-bad';
    } else if (field.id === 'devoluciones') {
      cls = num <= 2 ? 'pct-good' : num <= 5 ? 'pct-warn' : 'pct-bad';
    } else if (field.id === 'siniestros') {
      cls = num <= 1 ? 'pct-good' : num <= 3 ? 'pct-warn' : 'pct-bad';
    }
    return `<span class="${cls}">${num}%</span>`;
  }

  if (field.type === 'currency') {
    if (value === '' || value === null || value === undefined) return '<span class="empty">—</span>';
    const num = Number(value);
    if (isNaN(num)) return `<span>${String(value)}</span>`;
    return `<span>${currency} ${num.toLocaleString('es-CO')}</span>`;
  }

  if (field.type === 'multi-currency') {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return '<span class="empty">—</span>';
    }

    if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value as Record<string, string>).filter(
        ([, v]) => v !== '' && v !== null && v !== undefined
      );
      if (entries.length === 0) return '<span class="empty">—</span>';
      const rows = entries
        .map(
          ([k, v]) =>
            `<div class="sub-row"><span class="sub-key">${k}:</span> <span class="sub-val">${currency} ${Number(v || 0).toLocaleString('es-CO')}</span></div>`
        )
        .join('');
      return `<div class="sub-table">${rows}</div>`;
    }

    // Fallback: valor simple
    const num = Number(value);
    if (!isNaN(num)) return `<span>${currency} ${num.toLocaleString('es-CO')}</span>`;
    return `<span>${String(value)}</span>`;
  }

  // textarea / text
  if (value === '' || value === null || value === undefined) {
    return '<span class="empty">—</span>';
  }
  const text = stripMarkdown(String(value));
  // Convertir saltos de línea en <br>
  return `<p class="text-val">${text.replace(/\n/g, '<br>')}</p>`;
}

/** Color de borde/fondo basado en el color de la celda */
function colorClass(color: string | undefined | null): string {
  if (color === 'green') return 'cell-green';
  if (color === 'yellow') return 'cell-yellow';
  if (color === 'red') return 'cell-red';
  return '';
}

// ─── Generador de barra visual para comparación ───────────────────────────────

function buildBarChartHTML(
  carriers: string[],
  data: BenchmarkData,
  fieldId: string,
  maxVal: number,
  colorFn: (v: number) => string
): string {
  const items = carriers.map(carrier => {
    const cell = getCellValue(data, carrier, fieldId);
    const val = parseFloat(String(cell.value ?? 0));
    const width = maxVal > 0 ? Math.min((val / maxVal) * 100, 100) : 0;
    const cls = colorFn(val);
    return `
      <div class="bar-row">
        <div class="bar-name">${carrier}</div>
        <div class="bar-track">
          <div class="bar-fill ${cls}" style="width:${width}%">
            <span>${isNaN(val) ? '—' : val}%</span>
          </div>
        </div>
      </div>`;
  });
  return items.join('');
}

// ─── CSS embebido ─────────────────────────────────────────────────────────────

const PDF_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --primary: #0891b2;
    --primary-dark: #164e63;
    --text: #1e293b;
    --muted: #64748b;
    --border: #e2e8f0;
    --bg-light: #f8fafc;
    --good: #16a34a;
    --warn: #ca8a04;
    --bad: #dc2626;
    --good-bg: #f0fdf4;
    --warn-bg: #fefce8;
    --bad-bg: #fef2f2;
  }

  body {
    font-family: 'Inter', Arial, sans-serif;
    color: var(--text);
    background: white;
    font-size: 13px;
    line-height: 1.55;
  }

  /* ── Página ──────────────────────────────────── */
  .page {
    width: 100%;
    padding: 32px 36px;
    page-break-after: always;
    break-after: page;
  }
  .page:last-child { page-break-after: avoid; break-after: avoid; }

  /* ── Portada ─────────────────────────────────── */
  .cover {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
    text-align: center;
    padding: 60px 40px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cover-badge {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    background: rgba(255,255,255,0.2);
    border-radius: 100px;
    padding: 5px 18px;
    margin-bottom: 28px;
  }
  .cover h1 {
    font-size: 42px;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 14px;
  }
  .cover h2 {
    font-size: 26px;
    font-weight: 500;
    opacity: 0.9;
    margin-bottom: 36px;
  }
  .cover-period {
    font-size: 18px;
    background: rgba(255,255,255,0.18);
    padding: 10px 28px;
    border-radius: 8px;
    margin-bottom: 60px;
    font-weight: 500;
  }
  .cover-logo {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 3px;
    opacity: 0.85;
    text-transform: uppercase;
  }

  /* ── Encabezados de sección ───────────────────── */
  .section-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 3px solid var(--primary);
  }
  .section-subtitle {
    font-size: 14px;
    font-weight: 600;
    color: var(--muted);
    margin: 20px 0 10px;
  }

  /* ── Gráficas de barras ───────────────────────── */
  .chart-box {
    background: var(--bg-light);
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 20px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .chart-label { font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 14px; }
  .bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .bar-name { width: 160px; font-size: 12px; font-weight: 500; color: var(--muted); flex-shrink: 0; }
  .bar-track { flex: 1; height: 22px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
  .bar-fill {
    height: 100%;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 8px;
    color: white;
    font-size: 11px;
    font-weight: 600;
    min-width: 32px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .bar-good  { background: linear-gradient(90deg,#22c55e,#16a34a); }
  .bar-warn  { background: linear-gradient(90deg,#facc15,#ca8a04); }
  .bar-bad   { background: linear-gradient(90deg,#f87171,#dc2626); }
  .bar-blue  { background: linear-gradient(90deg,#38bdf8,#0891b2); }

  /* ── Tablas comparativas ──────────────────────── */
  .cmp-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
  .cmp-table th {
    background: var(--primary);
    color: white;
    padding: 10px 10px;
    text-align: left;
    font-weight: 600;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cmp-table td { padding: 9px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
  .cmp-table tr:nth-child(even) td { background: var(--bg-light); }

  /* ── Detalle por transportadora ───────────────── */
  .carrier-header {
    font-size: 18px;
    font-weight: 700;
    color: var(--primary-dark);
    background: #f0f9ff;
    padding: 14px 20px;
    border-radius: 8px;
    margin-bottom: 18px;
    border-left: 4px solid var(--primary);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .fields-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .field-card {
    background: var(--bg-light);
    border-radius: 6px;
    padding: 10px 14px;
    border-left: 4px solid #cbd5e1;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .field-card.cell-green { border-left-color: var(--good); background: var(--good-bg); }
  .field-card.cell-yellow { border-left-color: var(--warn); background: var(--warn-bg); }
  .field-card.cell-red { border-left-color: var(--bad); background: var(--bad-bg); }
  .field-card.wide { grid-column: span 2; }

  .field-label {
    font-size: 10px;
    color: var(--muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 5px;
  }
  .field-value { font-size: 13px; color: var(--text); font-weight: 500; }
  .field-note { font-size: 11px; color: var(--muted); font-style: italic; margin-top: 4px; border-top: 1px solid var(--border); padding-top: 4px; }

  /* ── Colores de valores ───────────────────────── */
  .bool-yes { color: var(--good); font-weight: 600; }
  .bool-no  { color: var(--bad);  font-weight: 600; }
  .pct-good { color: var(--good); font-weight: 700; font-size: 15px; }
  .pct-warn { color: var(--warn); font-weight: 700; font-size: 15px; }
  .pct-bad  { color: var(--bad);  font-weight: 700; font-size: 15px; }
  .pct-neutral { color: var(--text); font-weight: 700; font-size: 15px; }
  .empty    { color: #94a3b8; }

  /* Sub-tabla para campos multi-currency */
  .sub-table { display: flex; flex-direction: column; gap: 3px; }
  .sub-row { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; }
  .sub-key { color: var(--muted); }
  .sub-val { font-weight: 600; }

  /* Texto largo */
  .text-val { font-size: 12px; line-height: 1.6; white-space: pre-line; }

  /* ── KPI Cards resumen ────────────────────────── */
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .kpi-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px;
    text-align: center;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .kpi-label { font-size: 11px; color: var(--muted); font-weight: 500; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .kpi-value { font-size: 24px; font-weight: 700; color: var(--primary); }
  .kpi-sub { font-size: 11px; color: var(--muted); margin-top: 3px; }

  /* ── Ranking ──────────────────────────────────── */
  .ranking-list { display: flex; flex-direction: column; gap: 8px; }
  .ranking-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid var(--border);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .ranking-row.rank-1 { background: #fefce8; border-color: #fde68a; }
  .ranking-row.rank-2 { background: #f8fafc; border-color: #e2e8f0; }
  .ranking-row.rank-3 { background: #fff7ed; border-color: #fed7aa; }
  .rank-num {
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 13px; color: white; flex-shrink: 0;
  }
  .rank-1 .rank-num { background: #eab308; }
  .rank-2 .rank-num { background: #94a3b8; }
  .rank-3 .rank-num { background: #f97316; }
  .rank-other .rank-num { background: #cbd5e1; color: var(--text); }
  .rank-name { font-weight: 600; flex: 1; }
  .rank-metrics { font-size: 11px; color: var(--muted); }
  .rank-score { font-size: 20px; font-weight: 700; text-align: right; }
  .rank-score-sub { font-size: 10px; color: var(--muted); text-align: right; }

  /* ── Pie de página por página ────────────────── */
  .page-footer { text-align: center; font-size: 11px; color: var(--muted); border-top: 1px solid var(--border); padding-top: 14px; margin-top: 32px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 24px 28px; }
    .cover { min-height: 100vh; }
  }
`;

// ─── Función principal ────────────────────────────────────────────────────────

export async function generatePDF({ country, month, year, data }: PDFGeneratorProps) {
  const carriers = carriersByCountry[country] || [];
  const currency = currencyByCountry[country] || 'COP';
  const monthName = monthNames[month];

  // Calcular KPIs generales
  const safeNum = (v: unknown) => {
    const n = parseFloat(String(v ?? 0));
    return isNaN(n) ? 0 : n;
  };

  const avgANS = carriers.length
    ? carriers.reduce((s, c) => s + safeNum(getCellValue(data, c, 'cumplimiento_ans').value), 0) / carriers.length
    : 0;
  const avgDev = carriers.length
    ? carriers.reduce((s, c) => s + safeNum(getCellValue(data, c, 'devoluciones').value), 0) / carriers.length
    : 0;
  const avgSin = carriers.length
    ? carriers.reduce((s, c) => s + safeNum(getCellValue(data, c, 'siniestros').value), 0) / carriers.length
    : 0;

  // Ranking (mismo peso que en Report.tsx: Dev 60%, ANS 35%, Sin 5%)
  const ranked = carriers
    .map(c => {
      const ans = safeNum(getCellValue(data, c, 'cumplimiento_ans').value);
      const dev = safeNum(getCellValue(data, c, 'devoluciones').value) || 100;
      const sin = safeNum(getCellValue(data, c, 'siniestros').value) || 100;
      const score = ans * 0.35 + (100 - dev * 5) * 0.6 + (100 - sin * 10) * 0.05;
      return { name: c, ans, dev, sin, score };
    })
    .sort((a, b) => b.score - a.score);

  // ─── Páginas por transportadora ───────────────────────────────────────────
  const carrierPages = carriers
    .map(carrier => {
      const freightSubFields = getFreightSubFields(country);

      // Inyectar subfields dinámicos a los campos que los necesiten
      const resolvedFields = fields.map(f => {
        if (f.dynamicSubFields) return { ...f, subFields: freightSubFields };
        return f;
      });

      // Clasificar campos anchos (multi-currency o textarea con texto largo)
      const fieldCards = resolvedFields.map(field => {
        const cell = getCellValue(data, carrier, field.id);
        const value = cell.value;
        const isEmpty =
          value === '' || value === null || value === undefined ||
          (typeof value === 'object' &&
            Object.values(value as Record<string, string>).every(v => !v));

        // Campos anchos: multi-currency o textarea con mucho texto
        const isWide =
          field.type === 'multi-currency' ||
          (field.type === 'textarea' && String(value || '').length > 80);

        const cls = `field-card ${isWide ? 'wide' : ''} ${colorClass(cell.color)}`;
        const valueHTML = renderFieldValueHTML(carrier, field, data, currency, country);
        const noteHTML = cell.note && !field.hideNote
          ? `<div class="field-note">${stripMarkdown(String(cell.note))}</div>`
          : '';

        if (isEmpty && !noteHTML) return ''; // omitir campos vacíos

        return `
          <div class="${cls}">
            <div class="field-label">${field.label}</div>
            <div class="field-value">${valueHTML}</div>
            ${noteHTML}
          </div>`;
      });

      return `
        <div class="page">
          <div class="carrier-header">🏢 ${carrier}</div>
          <div class="fields-grid">
            ${fieldCards.join('')}
          </div>
        </div>`;
    })
    .join('');

  // ─── Barra ANS ────────────────────────────────────────────────────────────
  const ansMax = Math.max(...carriers.map(c => safeNum(getCellValue(data, c, 'cumplimiento_ans').value)), 1);
  const ansChart = buildBarChartHTML(
    carriers, data, 'cumplimiento_ans', ansMax,
    v => v >= 95 ? 'bar-good' : v >= 85 ? 'bar-warn' : 'bar-bad'
  );

  const devMax = Math.max(...carriers.map(c => safeNum(getCellValue(data, c, 'devoluciones').value)), 1);
  const devChart = buildBarChartHTML(
    carriers, data, 'devoluciones', devMax,
    v => v <= 2 ? 'bar-good' : v <= 5 ? 'bar-warn' : 'bar-bad'
  );

  const sinMax = Math.max(...carriers.map(c => safeNum(getCellValue(data, c, 'siniestros').value)), 1);
  const sinChart = buildBarChartHTML(
    carriers, data, 'siniestros', sinMax,
    v => v <= 1 ? 'bar-good' : v <= 3 ? 'bar-warn' : 'bar-bad'
  );

  // ─── Tabla comparativa de costos ──────────────────────────────────────────
  const costRows = carriers.map(c => {
    const envioCell = getCellValue(data, c, 'costo_envio_nacional');
    const envioVal = envioCell.value;
    let envioHTML = '—';
    if (typeof envioVal === 'object' && envioVal !== null) {
      const entries = Object.entries(envioVal as Record<string, string>).filter(([, v]) => v);
      envioHTML = entries.map(([k, v]) => `${k}: ${currency} ${Number(v || 0).toLocaleString('es-CO')}`).join(' / ');
    } else if (envioVal) {
      envioHTML = `${currency} ${Number(envioVal || 0).toLocaleString('es-CO')}`;
    }

    const comision = String(getCellValue(data, c, 'comision_recaudo').value || '—');
    const manejo = String(getCellValue(data, c, 'costo_manejo').value || '—');
    const pesoPolicy = String(getCellValue(data, c, 'politica_peso').value || '—');

    return `
      <tr>
        <td><strong>${c}</strong></td>
        <td style="font-size:11px">${envioHTML}</td>
        <td>${comision}</td>
        <td>${manejo}</td>
        <td style="font-size:11px">${pesoPolicy}</td>
      </tr>`;
  }).join('');

  // ─── Tabla de servicios ───────────────────────────────────────────────────
  const serviceRows = carriers.map(c => {
    const redir = Boolean(getCellValue(data, c, 'redireccion_gratis').value);
    const reclame = Boolean(getCellValue(data, c, 'reclame_oficina').value);
    const sms = Boolean(getCellValue(data, c, 'sms_gratuitos').value);
    const intentos = String(getCellValue(data, c, 'intentos_entrega').value || '—');
    const total = Number(redir) + Number(reclame) + Number(sms);

    return `
      <tr>
        <td><strong>${c}</strong></td>
        <td class="${redir ? 'bool-yes' : 'bool-no'}">${redir ? '✓ Sí' : '✗ No'}</td>
        <td class="${reclame ? 'bool-yes' : 'bool-no'}">${reclame ? '✓ Sí' : '✗ No'}</td>
        <td class="${sms ? 'bool-yes' : 'bool-no'}">${sms ? '✓ Sí' : '✗ No'}</td>
        <td style="text-align:center">${intentos}</td>
        <td style="text-align:center;font-weight:700">${total}/3</td>
      </tr>`;
  }).join('');

  // ─── Ranking HTML ─────────────────────────────────────────────────────────
  const rankingHTML = ranked.map((r, i) => {
    const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-other';
    return `
      <div class="ranking-row ${rankClass}">
        <div class="rank-num">${i + 1}</div>
        <div>
          <div class="rank-name">${r.name}</div>
          <div class="rank-metrics">ANS: ${r.ans}% | Dev: ${r.dev}% | Sin: ${r.sin}%</div>
        </div>
        <div style="margin-left:auto">
          <div class="rank-score">${r.score.toFixed(0)}</div>
          <div class="rank-score-sub">puntos</div>
        </div>
      </div>`;
  }).join('');

  // ─── HTML completo ────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Benchmark Logístico — ${country} — ${monthName} ${year}</title>
  <style>${PDF_CSS}</style>
</head>
<body>

<!-- ══════════ PORTADA ══════════ -->
<div class="page cover">
  <div class="cover-badge">Reporte Logístico Oficial</div>
  <h1>Cartelera de Indicadores Logísticos</h1>
  <h2>${country}</h2>
  <div class="cover-period">${monthName} ${year}</div>
  <div class="cover-logo">Efficommerce</div>
</div>

<!-- ══════════ RESUMEN EJECUTIVO ══════════ -->
<div class="page">
  <h2 class="section-title">📊 Resumen Ejecutivo</h2>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Promedio ANS</div>
      <div class="kpi-value">${avgANS.toFixed(1)}%</div>
      <div class="kpi-sub">Meta ≥ 95%</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Promedio Devoluciones</div>
      <div class="kpi-value">${avgDev.toFixed(1)}%</div>
      <div class="kpi-sub">Ideal ≤ 2%</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Promedio Siniestros</div>
      <div class="kpi-value">${avgSin.toFixed(2)}%</div>
      <div class="kpi-sub">Ideal ≤ 1%</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Transportadoras</div>
      <div class="kpi-value">${carriers.length}</div>
      <div class="kpi-sub">Evaluadas</div>
    </div>
  </div>

  <h3 class="section-subtitle">🏆 Ranking General (Dev 60% · ANS 35% · Sin 5%)</h3>
  <div class="ranking-list">${rankingHTML}</div>

  <div class="page-footer">
    Reporte generado por Efficommerce · ${monthName} ${year} · ${country}
  </div>
</div>

<!-- ══════════ COMPARACIÓN VISUAL ══════════ -->
<div class="page">
  <h2 class="section-title">📈 Comparación Visual de Indicadores</h2>

  <div class="chart-box">
    <div class="chart-label">✅ Cumplimiento ANS — % de entregas a tiempo (meta ≥ 95%)</div>
    ${ansChart}
  </div>

  <div class="chart-box">
    <div class="chart-label">📦 % Devoluciones — menor es mejor (ideal ≤ 2%)</div>
    ${devChart}
  </div>

  <div class="chart-box">
    <div class="chart-label">🛡️ % Siniestros — menor es mejor (ideal ≤ 1%)</div>
    ${sinChart}
  </div>

  <div class="page-footer">
    Reporte generado por Efficommerce · ${monthName} ${year} · ${country}
  </div>
</div>

<!-- ══════════ TABLAS COMPARATIVAS ══════════ -->
<div class="page">
  <h2 class="section-title">💰 Tabla Comparativa de Costos</h2>

  <table class="cmp-table">
    <thead>
      <tr>
        <th>Transportadora</th>
        <th>Costo de Envío Nacional</th>
        <th>% Comisión Recaudo</th>
        <th>% Costo Manejo</th>
        <th>Política de Peso</th>
      </tr>
    </thead>
    <tbody>${costRows}</tbody>
  </table>

  <h2 class="section-title" style="margin-top:32px">🚚 Servicios y Políticas</h2>

  <table class="cmp-table">
    <thead>
      <tr>
        <th>Transportadora</th>
        <th>Redirección Gratis</th>
        <th>Reclame en Oficina</th>
        <th>SMS Gratuitos</th>
        <th>Intentos</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>${serviceRows}</tbody>
  </table>

  <div class="page-footer">
    Reporte generado por Efficommerce · ${monthName} ${year} · ${country}
  </div>
</div>

<!-- ══════════ DETALLE POR TRANSPORTADORA ══════════ -->
${carrierPages}

</body>
</html>`;

  // Abrir en nueva ventana e imprimir
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permite las ventanas emergentes para generar el PDF');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Esperar a que carguen fuentes e imágenes antes de imprimir
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 800);
  };
}
