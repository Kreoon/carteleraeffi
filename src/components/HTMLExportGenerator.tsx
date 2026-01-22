import { BenchmarkData, fields, carriersByCountry, monthNames, currencyByCountry, normalizeCellValue, FieldDefinition } from '@/lib/data';

interface HTMLExportProps {
  country: string;
  month: number;
  year: number;
  data: BenchmarkData;
  bannerUrl?: string | null;
  getCarrierLogo: (carrier: string) => string | null;
}

// Convert image URL to base64 (for logos and banners)
async function imageToBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
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

export async function generateFullHTML({
  country,
  month,
  year,
  data,
  bannerUrl,
  getCarrierLogo
}: HTMLExportProps): Promise<string> {
  const carriers = carriersByCountry[country] || [];
  const currency = currencyByCountry[country] || 'COP';
  const monthName = monthNames[month];

  // Convert banner to base64
  const bannerBase64 = bannerUrl ? await imageToBase64(bannerUrl) : null;

  // Convert all carrier logos to base64
  const logoCache: Record<string, string | null> = {};
  for (const carrier of carriers) {
    const logoUrl = getCarrierLogo(carrier);
    if (logoUrl) {
      logoCache[carrier] = await imageToBase64(logoUrl);
    }
  }

  // Helper to get display value
  const getDisplayValue = (carrier: string, fieldId: string) => {
    const cellData = data[carrier]?.[fieldId];
    return normalizeCellValue(cellData).value;
  };

  const getCellValue = (carrier: string, fieldId: string) => {
    return normalizeCellValue(data[carrier]?.[fieldId]);
  };

  const getColorVariant = (fieldId: string, value: number): 'success' | 'warning' | 'danger' => {
    if (fieldId === 'cumplimiento_ans') {
      return value >= 95 ? 'success' : value >= 85 ? 'warning' : 'danger';
    }
    if (fieldId === 'devoluciones') {
      return value <= 2 ? 'success' : value <= 5 ? 'warning' : 'danger';
    }
    if (fieldId === 'siniestros') {
      return value <= 1 ? 'success' : value <= 3 ? 'warning' : 'danger';
    }
    return 'success';
  };

  // Helper to get color variant considering user-defined colors
  const getEffectiveColor = (fieldId: string, value: number, userColor?: string): 'success' | 'warning' | 'danger' => {
    if (userColor && userColor !== 'none') {
      return userColor === 'green' ? 'success' : userColor === 'yellow' ? 'warning' : 'danger';
    }
    return getColorVariant(fieldId, value);
  };

  // Calculate statistics
  const carrierStats = carriers.map(c => {
    const ansCell = getCellValue(c, 'cumplimiento_ans');
    const devCell = getCellValue(c, 'devoluciones');
    const sinCell = getCellValue(c, 'siniestros');
    
    const ans = parseFloat(String(ansCell.value || 0));
    const dev = parseFloat(String(devCell.value || 100));
    const sin = parseFloat(String(sinCell.value || 100));
    
    return {
      name: c,
      ans,
      dev,
      sin,
      ansColor: getEffectiveColor('cumplimiento_ans', ans, ansCell.color),
      devColor: getEffectiveColor('devoluciones', dev, devCell.color),
      sinColor: getEffectiveColor('siniestros', sin, sinCell.color),
      hasRedirect: !!getDisplayValue(c, 'redireccion_gratis'),
      hasPickup: !!getDisplayValue(c, 'reclame_oficina'),
      hasSms: !!getDisplayValue(c, 'sms_gratuitos'),
      regiones_superior: getDisplayValue(c, 'regiones_superior'),
      regiones_inferior: getDisplayValue(c, 'regiones_inferior'),
      costo_envio_nacional: getDisplayValue(c, 'costo_envio_nacional'),
      costo_promedio_con_recaudo: getDisplayValue(c, 'costo_promedio_con_recaudo'),
      costo_promedio_sin_recaudo: getDisplayValue(c, 'costo_promedio_sin_recaudo'),
    };
  });

  // Score with new weights: Dev 60%, ANS 35%, Sin 5%
  const withScore = carrierStats.map(c => ({
    ...c,
    score: (c.ans * 0.35) + ((100 - c.dev * 5) * 0.60) + ((100 - c.sin * 10) * 0.05)
  }));

  const bestOverall = [...withScore].sort((a, b) => b.score - a.score)[0];
  const bestAns = [...carrierStats].sort((a, b) => b.ans - a.ans)[0];
  const lowestDev = [...carrierStats].sort((a, b) => a.dev - b.dev)[0];
  const lowestSin = [...carrierStats].sort((a, b) => a.sin - b.sin)[0];
  const mostServices = [...carrierStats].sort((a, b) => 
    (Number(b.hasRedirect) + Number(b.hasPickup) + Number(b.hasSms)) - 
    (Number(a.hasRedirect) + Number(a.hasPickup) + Number(a.hasSms))
  )[0];

  const ranked = withScore.sort((a, b) => b.score - a.score);

  // Calculate averages
  const avgAns = (carriers.reduce((sum, c) => sum + parseFloat(String(getDisplayValue(c, 'cumplimiento_ans') || 0)), 0) / carriers.length).toFixed(1);
  const avgDev = (carriers.reduce((sum, c) => sum + parseFloat(String(getDisplayValue(c, 'devoluciones') || 0)), 0) / carriers.length).toFixed(1);
  const avgSin = (carriers.reduce((sum, c) => sum + parseFloat(String(getDisplayValue(c, 'siniestros') || 0)), 0) / carriers.length).toFixed(2);
  const withExtraServices = carriers.filter(c => getDisplayValue(c, 'redireccion_gratis') || getDisplayValue(c, 'reclame_oficina') || getDisplayValue(c, 'sms_gratuitos')).length;

  // Generate carrier logo HTML
  const getCarrierLogoHTML = (carrier: string, size: number = 40) => {
    const base64 = logoCache[carrier];
    if (base64) {
      return `<img src="${base64}" alt="${carrier}" style="width: ${size}px; height: ${size}px; object-fit: contain;" />`;
    }
    return `<div style="width: ${size}px; height: ${size}px; background: #f0f9ff; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
      <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2">
        <path d="M3 12h18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4M5 8v8a2 2 0 002 2h10a2 2 0 002-2V8" />
      </svg>
    </div>`;
  };

  // Generate progress bar HTML
  const getProgressBarHTML = (value: number, variant: 'success' | 'warning' | 'danger') => {
    const colors = {
      success: '#22c55e',
      warning: '#eab308',
      danger: '#ef4444'
    };
    return `
      <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
        <div style="width: ${value}%; height: 100%; background: ${colors[variant]}; border-radius: 9999px;"></div>
      </div>
    `;
  };

  // Generate comparison bar chart HTML with configurable max value
  const getComparisonChartHTML = (
    title: string,
    items: Array<{ name: string; value: number; variant: 'success' | 'warning' | 'danger' }>,
    valueFormatter: (v: number) => string,
    maxValue?: number
  ) => {
    const colors = { success: '#22c55e', warning: '#eab308', danger: '#ef4444' };
    const effectiveMax = maxValue || Math.max(...items.map(i => i.value), 1);
    
    return `
      <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 16px;">
        <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 16px;">${title}</h4>
        ${items.map(item => `
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
            <div style="width: 120px; display: flex; align-items: center; gap: 8px;">
              ${getCarrierLogoHTML(item.name, 24)}
              <span style="font-size: 12px; font-weight: 500; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</span>
            </div>
            <div style="flex: 1; height: 24px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
              <div style="width: ${Math.max(Math.min((item.value / effectiveMax) * 100, 100), 10)}%; height: 100%; background: ${colors[item.variant]}; border-radius: 9999px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px;">
                <span style="font-size: 11px; font-weight: 600; color: white;">${valueFormatter(item.value)}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  // Generate field value HTML for detailed table
  const getFieldValueHTML = (carrier: string, field: FieldDefinition) => {
    const cellValue = getCellValue(carrier, field.id);
    const value = cellValue.value;
    const note = cellValue.note;
    const color = cellValue.color;

    let bgColor = '';
    let borderColor = '';
    if (color === 'green') {
      bgColor = '#f0fdf4';
      borderColor = '#22c55e';
    } else if (color === 'yellow') {
      bgColor = '#fefce8';
      borderColor = '#eab308';
    } else if (color === 'red') {
      bgColor = '#fef2f2';
      borderColor = '#ef4444';
    }

    let displayContent = '-';

    if (field.type === 'boolean') {
      if (value) {
        displayContent = '<span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; background: #22c55e; color: white;">✓ Sí</span>';
      } else {
        displayContent = '<span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; background: #ef4444; color: white;">✗ No</span>';
      }
    } else if (field.type === 'percentage') {
      const numVal = parseFloat(String(value || 0));
      const variant = getColorVariant(field.id, numVal);
      const colors = { success: '#22c55e', warning: '#eab308', danger: '#ef4444' };
      displayContent = `
        <div style="text-align: center;">
          <span style="font-weight: 700; color: ${colors[variant]};">${numVal}%</span>
          <div style="margin-top: 4px; width: 100px; margin: 4px auto 0;">${getProgressBarHTML(numVal, variant)}</div>
        </div>
      `;
    } else if (field.type === 'currency' || field.type === 'multi-currency') {
      if (typeof value === 'object' && value !== null) {
        displayContent = Object.entries(value as Record<string, any>).map(([key, val]) => 
          `<div style="display: flex; justify-content: space-between; gap: 8px; font-size: 11px;">
            <span style="color: #64748b;">${key}:</span>
            <span style="font-weight: 500;">${currency} ${Number(val || 0).toLocaleString()}</span>
          </div>`
        ).join('');
      } else {
        displayContent = value ? `${currency} ${Number(value).toLocaleString()}` : '-';
      }
    } else if (field.type === 'textarea' || field.type === 'text') {
      displayContent = `<div style="max-width: 200px; word-wrap: break-word;">${String(value || '-')}</div>`;
    } else {
      displayContent = String(value || '-');
    }

    const noteHTML = note && !field.hideNote ? `<div style="margin-top: 8px; font-size: 11px; color: #64748b; font-style: italic; border-top: 1px solid #e2e8f0; padding-top: 6px;">${note}</div>` : '';

    return `
      <td style="padding: 12px; text-align: center; ${bgColor ? `background: ${bgColor}; border-left: 4px solid ${borderColor};` : ''}">
        ${displayContent}
        ${noteHTML}
      </td>
    `;
  };

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Benchmark Logístico - ${country} - ${monthName} ${year}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #1e293b;
      background: #f8fafc;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }
    
    .banner {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 16px;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .title-card {
      background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
      color: white;
      text-align: center;
      padding: 40px;
      border-radius: 16px;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(8, 145, 178, 0.3);
    }
    
    .title-card h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .title-card p {
      font-size: 20px;
      opacity: 0.9;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      margin: 32px 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    
    .card-header {
      margin-bottom: 16px;
    }
    
    .card-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }
    
    .card-description {
      font-size: 14px;
      color: #64748b;
    }
    
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    
    .grid-6 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    
    @media (max-width: 1024px) {
      .grid-3, .grid-4, .grid-6 {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 640px) {
      .grid-3, .grid-4, .grid-6 {
        grid-template-columns: 1fr;
      }
    }
    
    .recommendation-card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    
    .recommendation-card .label {
      font-size: 12px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }
    
    .recommendation-card .content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .recommendation-card .name {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
    }
    
    .recommendation-card .metric {
      font-size: 12px;
      font-weight: 500;
    }
    
    .kpi-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e2e8f0;
    }
    
    .kpi-card .label {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 8px;
    }
    
    .kpi-card .value {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
    }
    
    .kpi-card .sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    
    .ranking-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-bottom: 8px;
    }
    
    .ranking-item.gold {
      background: #fefce8;
      border-color: #fde047;
    }
    
    .ranking-item.silver {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    
    .ranking-item.bronze {
      background: #fff7ed;
      border-color: #fdba74;
    }
    
    .ranking-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      color: white;
    }
    
    .ranking-number.gold { background: #eab308; }
    .ranking-number.silver { background: #94a3b8; }
    .ranking-number.bronze { background: #f97316; }
    .ranking-number.default { background: #64748b; }
    
    .ranking-info {
      flex: 1;
    }
    
    .ranking-name {
      font-weight: 600;
      font-size: 15px;
      color: #1e293b;
    }
    
    .ranking-stats {
      font-size: 12px;
      color: #64748b;
    }
    
    .ranking-score {
      text-align: right;
    }
    
    .ranking-score .number {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
    }
    
    .ranking-score .label {
      font-size: 11px;
      color: #64748b;
    }
    
    .table-container {
      overflow-x: auto;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    
    th {
      background: #f1f5f9;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e2e8f0;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    tr:nth-child(even) {
      background: #fafafa;
    }
    
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-yellow { background: #fef3c7; color: #92400e; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-primary { background: #0891b2; color: white; }
    .badge-gray { background: #f1f5f9; color: #475569; }
    
    .check-icon { color: #22c55e; }
    .x-icon { color: #ef4444; }
    
    .footer {
      text-align: center;
      padding: 24px;
      color: #64748b;
      font-size: 14px;
      border-top: 1px solid #e2e8f0;
      margin-top: 40px;
    }
    
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    
    @media (max-width: 1024px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .text-green { color: #22c55e; }
    .text-yellow { color: #eab308; }
    .text-red { color: #ef4444; }
    .text-blue { color: #3b82f6; }
    .text-purple { color: #a855f7; }
    .text-orange { color: #f97316; }
    
    .executive-summary {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
    }
  </style>
</head>
<body>
  <div class="container">
    ${bannerBase64 ? `<img src="${bannerBase64}" alt="Banner ${country}" class="banner" />` : ''}
    
    <!-- Simple Title Header -->
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="font-size: 32px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Cartelera de Indicadores Logísticos</h1>
      <p style="font-size: 20px; color: #64748b;">${country} - ${monthName} ${year}</p>
    </div>

    <!-- Executive Summary -->
    <div class="card executive-summary">
      <div class="card-header">
        <h3 class="card-title">🎯 Resumen Ejecutivo - Recomendaciones</h3>
        <p class="card-description">Análisis basado en los indicadores clave de desempeño del período</p>
      </div>
      <div class="grid-6">
        <div class="recommendation-card">
          <div class="label">
            <span style="color: #eab308;">🏆</span>
            Mejor Desempeño General
          </div>
          <div class="content">
            ${getCarrierLogoHTML(bestOverall.name)}
            <div>
              <div class="name">${bestOverall.name}</div>
              <div class="metric" style="color: #64748b;">Puntuación: ${bestOverall.score.toFixed(0)}/100</div>
            </div>
          </div>
        </div>
        
        <div class="recommendation-card">
          <div class="label">
            <span class="text-green">✅</span>
            Mejor Cumplimiento ANS
          </div>
          <div class="content">
            ${getCarrierLogoHTML(bestAns.name)}
            <div>
              <div class="name">${bestAns.name}</div>
              <div class="metric text-green">${bestAns.ans}% de cumplimiento</div>
            </div>
          </div>
        </div>
        
        <div class="recommendation-card">
          <div class="label">
            <span class="text-blue">📦</span>
            Menor Tasa de Devoluciones
          </div>
          <div class="content">
            ${getCarrierLogoHTML(lowestDev.name)}
            <div>
              <div class="name">${lowestDev.name}</div>
              <div class="metric text-blue">${lowestDev.dev}% devoluciones</div>
            </div>
          </div>
        </div>
        
        <div class="recommendation-card">
          <div class="label">
            <span class="text-purple">🛡️</span>
            Menor Tasa de Siniestros
          </div>
          <div class="content">
            ${getCarrierLogoHTML(lowestSin.name)}
            <div>
              <div class="name">${lowestSin.name}</div>
              <div class="metric text-purple">${lowestSin.sin}% siniestros</div>
            </div>
          </div>
        </div>
        
        <div class="recommendation-card">
          <div class="label">
            <span class="text-orange">💰</span>
            Más Económica CON Recaudo
          </div>
          <div class="content">
            ${(() => {
              const cheapestWithRecaudo = carrierStats
                .map(c => ({
                  name: c.name,
                  cost: parseFloat(String(getDisplayValue(c.name, 'costo_promedio_con_recaudo') || 999999999))
                }))
                .filter(c => c.cost > 0 && c.cost < 999999999)
                .sort((a, b) => a.cost - b.cost)[0];
              
              if (!cheapestWithRecaudo) return '<p style="font-size: 12px; color: #64748b;">Sin datos</p>';
              
              return `
                ${getCarrierLogoHTML(cheapestWithRecaudo.name)}
                <div>
                  <div class="name">${cheapestWithRecaudo.name}</div>
                  <div class="metric text-orange">${currency} ${cheapestWithRecaudo.cost.toLocaleString()}</div>
                </div>
              `;
            })()}
          </div>
        </div>
        
        <div class="recommendation-card">
          <div class="label">
            <span style="color: #14b8a6;">💵</span>
            Más Económica SIN Recaudo
          </div>
          <div class="content">
            ${(() => {
              const cheapestWithoutRecaudo = carrierStats
                .map(c => ({
                  name: c.name,
                  cost: parseFloat(String(getDisplayValue(c.name, 'costo_promedio_sin_recaudo') || 999999999))
                }))
                .filter(c => c.cost > 0 && c.cost < 999999999)
                .sort((a, b) => a.cost - b.cost)[0];
              
              if (!cheapestWithoutRecaudo) return '<p style="font-size: 12px; color: #64748b;">Sin datos</p>';
              
              return `
                ${getCarrierLogoHTML(cheapestWithoutRecaudo.name)}
                <div>
                  <div class="name">${cheapestWithoutRecaudo.name}</div>
                  <div class="metric" style="color: #14b8a6;">${currency} ${cheapestWithoutRecaudo.cost.toLocaleString()}</div>
                </div>
              `;
            })()}
          </div>
        </div>
      </div>
    </div>

    <!-- Ranking General -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">🏆 Ranking General de Transportadoras</h3>
        <p class="card-description">Ordenado por puntuación ponderada: Devoluciones (60%), ANS (35%), Siniestros (5%)</p>
      </div>
      ${ranked.map((carrier, index) => `
        <div class="ranking-item ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}">
          <div class="ranking-number ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default'}">${index + 1}</div>
          ${getCarrierLogoHTML(carrier.name)}
          <div class="ranking-info">
            <div class="ranking-name">${carrier.name}</div>
            <div class="ranking-stats">ANS: ${carrier.ans}% | Dev: ${carrier.dev}% | Sin: ${carrier.sin}%</div>
          </div>
          <div class="ranking-score">
            <div class="number">${carrier.score.toFixed(0)}</div>
            <div class="label">puntos</div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- KPI Summary -->
    <h2 class="section-title">📈 Indicadores Clave de Desempeño</h2>
    <div class="grid-4">
      <div class="kpi-card">
        <div class="label">📊 Promedio ANS</div>
        <div class="value">${avgAns}%</div>
        <div class="sub">Entre todas las transportadoras</div>
      </div>
      <div class="kpi-card">
        <div class="label">📦 Promedio Devoluciones</div>
        <div class="value">${avgDev}%</div>
        <div class="sub">Tasa promedio del período</div>
      </div>
      <div class="kpi-card">
        <div class="label">⚠️ Promedio Siniestros</div>
        <div class="value">${avgSin}%</div>
        <div class="sub">Tasa promedio del período</div>
      </div>
      <div class="kpi-card">
        <div class="label">✅ Con Servicios Extra</div>
        <div class="value">${withExtraServices}</div>
        <div class="sub">De ${carriers.length} transportadoras</div>
      </div>
    </div>

    <!-- Comparison Charts -->
    <h2 class="section-title">📊 Comparación Visual</h2>
    <div class="charts-grid">
      ${getComparisonChartHTML(
        '✅ Cumplimiento a los Tiempos de Entrega (ANS) - Meta: ≥95%',
        carrierStats.map(c => ({ name: c.name, value: c.ans, variant: c.ansColor })),
        v => `${v}%`
      )}
      ${getComparisonChartHTML(
        '📦 Devoluciones - Ideal: ≤20%',
        carrierStats.map(c => ({ name: c.name, value: c.dev, variant: c.devColor })),
        v => `${v}%`,
        40
      )}
      ${getComparisonChartHTML(
        '🛡️ Siniestros - Ideal: ≤1%',
        carrierStats.map(c => ({ name: c.name, value: c.sin, variant: c.sinColor })),
        v => `${v}%`,
        5
      )}
    </div>

    <!-- Services Matrix -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">✅ Matriz de Servicios Adicionales</h3>
        <p class="card-description">Servicios de valor agregado incluidos por cada transportadora</p>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Transportadora</th>
              <th style="text-align: center;">Redirección Gratis</th>
              <th style="text-align: center;">Reclame en Oficina</th>
              <th style="text-align: center;">SMS Gratuitos</th>
              <th style="text-align: center;">Total Servicios</th>
            </tr>
          </thead>
          <tbody>
            ${carriers.map(carrier => {
              const hasRedirect = !!getDisplayValue(carrier, 'redireccion_gratis');
              const hasPickup = !!getDisplayValue(carrier, 'reclame_oficina');
              const hasSms = !!getDisplayValue(carrier, 'sms_gratuitos');
              const total = Number(hasRedirect) + Number(hasPickup) + Number(hasSms);
              return `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      ${getCarrierLogoHTML(carrier, 32)}
                      <span style="font-weight: 500;">${carrier}</span>
                    </div>
                  </td>
                  <td style="text-align: center;">${hasRedirect ? '<span class="check-icon">✓</span>' : '<span class="x-icon">✗</span>'}</td>
                  <td style="text-align: center;">${hasPickup ? '<span class="check-icon">✓</span>' : '<span class="x-icon">✗</span>'}</td>
                  <td style="text-align: center;">${hasSms ? '<span class="check-icon">✓</span>' : '<span class="x-icon">✗</span>'}</td>
                  <td style="text-align: center;">
                    <span class="badge ${total === 3 ? 'badge-primary' : total >= 1 ? 'badge-gray' : 'badge-red'}">${total}/3</span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Performance Table -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">📋 Tabla Comparativa de Desempeño</h3>
        <p class="card-description">Resumen de indicadores clave por transportadora</p>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Transportadora</th>
              <th style="text-align: center;">ANS</th>
              <th style="text-align: center;">Devoluciones</th>
              <th style="text-align: center;">Siniestros</th>
              <th style="text-align: center;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${carriers.map(carrier => {
              const stat = carrierStats.find(c => c.name === carrier);
              const ans = stat?.ans || 0;
              const dev = stat?.dev || 0;
              const sin = stat?.sin || 0;
              const ansColor = stat?.ansColor || 'danger';
              const devColor = stat?.devColor || 'danger';
              const sinColor = stat?.sinColor || 'danger';
              
              const isGood = ans >= 90 && dev <= 5 && sin <= 1;
              const isWarning = ans >= 80 && dev <= 10 && sin <= 3;
              
              const colorToBadge = (c: string) => 
                c === 'success' ? 'badge-green' : c === 'warning' ? 'badge-yellow' : 'badge-red';
              
              return `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      ${getCarrierLogoHTML(carrier, 32)}
                      <span style="font-weight: 500;">${carrier}</span>
                    </div>
                  </td>
                  <td style="text-align: center;">
                    <span class="badge ${colorToBadge(ansColor)}">${ans}%</span>
                  </td>
                  <td style="text-align: center;">
                    <span class="badge ${colorToBadge(devColor)}">${dev}%</span>
                  </td>
                  <td style="text-align: center;">
                    <span class="badge ${colorToBadge(sinColor)}">${sin}%</span>
                  </td>
                  <td style="text-align: center;">
                    <span class="badge ${isGood ? 'badge-green' : isWarning ? 'badge-yellow' : 'badge-red'}">
                      ${isGood ? '✓ Excelente' : isWarning ? '⚠ Aceptable' : '✗ Revisar'}
                    </span>
                    <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
                      ${isGood ? 'Cumple todos los criterios' : isWarning ? 'Puede mejorar' : 'Requiere análisis'}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Regions Analysis -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">🗺️ Análisis por Regiones</h3>
        <p class="card-description">Desempeño regional por transportadora</p>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Transportadora</th>
              <th style="min-width: 250px;">Regiones con Desempeño Superior</th>
              <th style="min-width: 250px;">Regiones con Desempeño Inferior</th>
            </tr>
          </thead>
          <tbody>
            ${carrierStats.map((stat, index) => `
              <tr style="background: ${index % 2 === 0 ? 'white' : '#f8fafc'};">
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    ${getCarrierLogoHTML(stat.name, 32)}
                    <span style="font-weight: 500;">${stat.name}</span>
                  </div>
                </td>
                <td style="font-size: 12px; color: #166534; background: ${stat.regiones_superior ? '#f0fdf4' : 'transparent'};">
                  ${stat.regiones_superior || '<span style="color: #64748b;">Sin información</span>'}
                </td>
                <td style="font-size: 12px; color: #991b1b; background: ${stat.regiones_inferior ? '#fef2f2' : 'transparent'};">
                  ${stat.regiones_inferior || '<span style="color: #64748b;">Sin información</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Shipping Costs -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">💰 Costos de Fletes</h3>
        <p class="card-description">Comparativa de costos de envío por transportadora</p>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Transportadora</th>
              <th style="text-align: center;">Costo Envío Nacional</th>
              <th style="text-align: center;">Costo Promedio Con Recaudo</th>
              <th style="text-align: center;">Costo Promedio Sin Recaudo</th>
            </tr>
          </thead>
          <tbody>
            ${carrierStats.map((stat, index) => {
              const formatCost = (value: any) => {
                if (!value) return '<span style="color: #64748b;">-</span>';
                if (typeof value === 'object') {
                  return Object.entries(value).map(([key, val]) => 
                    `<div style="display: flex; justify-content: space-between; gap: 8px; font-size: 11px; margin-bottom: 2px;">
                      <span style="color: #64748b;">${key}:</span>
                      <span style="font-weight: 500;">${currency} ${Number(val || 0).toLocaleString()}</span>
                    </div>`
                  ).join('');
                }
                return `${currency} ${Number(value).toLocaleString()}`;
              };
              
              return `
                <tr style="background: ${index % 2 === 0 ? 'white' : '#f8fafc'};">
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      ${getCarrierLogoHTML(stat.name, 32)}
                      <span style="font-weight: 500;">${stat.name}</span>
                    </div>
                  </td>
                  <td style="text-align: center; font-size: 12px;">${formatCost(stat.costo_envio_nacional)}</td>
                  <td style="text-align: left; padding-left: 20px;">${formatCost(stat.costo_promedio_con_recaudo)}</td>
                  <td style="text-align: left; padding-left: 20px;">${formatCost(stat.costo_promedio_sin_recaudo)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detailed Information Table -->
    ${(() => {
      // Sort carriers by devoluciones (lowest to highest)
      const sortedCarriers = [...carriers].sort((a, b) => {
        const devA = parseFloat(String(getDisplayValue(a, 'devoluciones') || 100));
        const devB = parseFloat(String(getDisplayValue(b, 'devoluciones') || 100));
        return devA - devB;
      });
      
      return `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📑 Información Completa por Transportadora</h3>
            <p class="card-description">Ordenado por % de devoluciones (menor a mayor)</p>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="min-width: 180px;">Campo</th>
                  ${sortedCarriers.map(carrier => {
                    const dev = parseFloat(String(getDisplayValue(carrier, 'devoluciones') || 0));
                    return `
                      <th style="text-align: center; min-width: 160px;">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                          ${getCarrierLogoHTML(carrier)}
                          <span>${carrier}</span>
                          <span style="font-size: 10px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 9999px;">Dev: ${dev}%</span>
                        </div>
                      </th>
                    `;
                  }).join('')}
                </tr>
              </thead>
              <tbody>
                ${fields.map((field, index) => `
                  <tr style="background: ${index % 2 === 0 ? 'white' : '#f8fafc'};">
                    <td style="font-weight: 500; color: #374151;">
                      ${field.label}
                      ${field.description ? `<div style="font-size: 11px; color: #64748b; font-weight: 400; margin-top: 2px;">${field.description}</div>` : ''}
                    </td>
                    ${sortedCarriers.map(carrier => getFieldValueHTML(carrier, field)).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    })()}

    <!-- Footer -->
    <div class="footer">
      <p><strong>Reporte generado por Efficommerce</strong></p>
      <p>${monthName} ${year} - ${country}</p>
    </div>
  </div>
</body>
</html>`;

  return html;
}
