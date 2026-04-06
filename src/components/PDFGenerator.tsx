import { BenchmarkData, fields, carriersByCountry, monthNames, currencyByCountry, normalizeCellValue } from '@/lib/data';

interface PDFGeneratorProps {
  country: string;
  month: number;
  year: number;
  data: BenchmarkData;
}

// Helper to get display value from cell
function getCellDisplayValue(cellData: any): string | number | boolean {
  const normalized = normalizeCellValue(cellData);
  return normalized.value;
}

export async function generatePDF({ country, month, year, data }: PDFGeneratorProps) {
  const carriers = carriersByCountry[country] || [];
  const currency = currencyByCountry[country] || "COP";
  const monthName = monthNames[month];

  // Create a new window for the PDF content
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permite las ventanas emergentes para generar el PDF');
    return;
  }

  // Generate the HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Benchmark Logístico - ${country} - ${monthName} ${year}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          color: #1a1a2e;
          background: white;
          line-height: 1.5;
        }
        
        .page {
          width: 100%;
          min-height: 100vh;
          padding: 40px;
          page-break-after: always;
        }
        
        .cover {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #0891b2 0%, #164e63 100%);
          color: white;
          text-align: center;
        }
        
        .cover h1 {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 20px;
        }
        
        .cover h2 {
          font-size: 32px;
          font-weight: 500;
          margin-bottom: 40px;
          opacity: 0.9;
        }
        
        .cover .period {
          font-size: 24px;
          background: rgba(255,255,255,0.2);
          padding: 12px 32px;
          border-radius: 8px;
          margin-bottom: 60px;
        }
        
        .cover .logo-text {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 2px;
        }
        
        .section-title {
          font-size: 24px;
          font-weight: 700;
          color: #0891b2;
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 3px solid #0891b2;
        }
        
        .carrier-section {
          margin-bottom: 40px;
        }
        
        .carrier-title {
          font-size: 20px;
          font-weight: 600;
          background: #f0f9ff;
          padding: 12px 20px;
          border-radius: 8px;
          margin-bottom: 16px;
          color: #0c4a6e;
        }
        
        .data-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        .data-item {
          background: #f8fafc;
          padding: 12px 16px;
          border-radius: 6px;
          border-left: 4px solid #0891b2;
        }
        
        .data-item.color-green {
          border-left-color: #16a34a;
          background: #f0fdf4;
        }
        
        .data-item.color-yellow {
          border-left-color: #ca8a04;
          background: #fefce8;
        }
        
        .data-item.color-red {
          border-left-color: #dc2626;
          background: #fef2f2;
        }
        
        .data-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        
        .data-value {
          font-size: 14px;
          color: #1e293b;
          font-weight: 500;
        }
        
        .data-note {
          font-size: 11px;
          color: #64748b;
          margin-top: 4px;
          font-style: italic;
        }
        
        .data-value.boolean-yes {
          color: #16a34a;
        }
        
        .data-value.boolean-no {
          color: #dc2626;
        }
        
        .data-value.percentage {
          font-weight: 600;
        }
        
        .data-value.percentage.good {
          color: #16a34a;
        }
        
        .data-value.percentage.warning {
          color: #ca8a04;
        }
        
        .data-value.percentage.bad {
          color: #dc2626;
        }
        
        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 12px;
        }
        
        .comparison-table th {
          background: #0891b2;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
        }
        
        .comparison-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .comparison-table tr:nth-child(even) {
          background: #f8fafc;
        }
        
        .chart-container {
          margin: 30px 0;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
        }
        
        .chart-title {
          font-size: 16px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 20px;
        }
        
        .bar-chart {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .bar-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .bar-label {
          width: 150px;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
        }
        
        .bar-track {
          flex: 1;
          height: 24px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }
        
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
        }
        
        .bar-fill.good {
          background: linear-gradient(90deg, #22c55e, #16a34a);
        }
        
        .bar-fill.warning {
          background: linear-gradient(90deg, #facc15, #ca8a04);
        }
        
        .bar-fill.bad {
          background: linear-gradient(90deg, #f87171, #dc2626);
        }
        
        .bar-fill.neutral {
          background: linear-gradient(90deg, #38bdf8, #0891b2);
        }
        
        .footer {
          text-align: center;
          padding: 20px;
          color: #64748b;
          font-size: 12px;
          border-top: 1px solid #e2e8f0;
          margin-top: 40px;
        }
        
        @media print {
          .page {
            padding: 20px;
          }
          .cover {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <!-- Cover Page -->
      <div class="page cover">
        <h1>📦 Benchmark Logístico</h1>
        <h2>${country}</h2>
        <div class="period">${monthName} ${year}</div>
        <div class="logo-text">EFFICOMMERCE</div>
      </div>
      
      <!-- Summary Charts Page -->
      <div class="page">
        <h2 class="section-title">📊 Resumen Comparativo</h2>
        
        <!-- % Devoluciones Chart -->
        <div class="chart-container">
          <div class="chart-title">% Devoluciones por Transportadora</div>
          <div class="bar-chart">
            ${carriers.map(carrier => {
              const val = parseFloat(String(getCellDisplayValue(data[carrier]?.devoluciones) || 0));
              const width = Math.min(val * 10, 100);
              const colorClass = val <= 2 ? 'good' : val <= 5 ? 'warning' : 'bad';
              return `
                <div class="bar-item">
                  <div class="bar-label">${carrier}</div>
                  <div class="bar-track">
                    <div class="bar-fill ${colorClass}" style="width: ${width}%">${val}%</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        <!-- % Siniestros Chart -->
        <div class="chart-container">
          <div class="chart-title">% Siniestros por Transportadora</div>
          <div class="bar-chart">
            ${carriers.map(carrier => {
              const val = parseFloat(String(getCellDisplayValue(data[carrier]?.siniestros) || 0));
              const width = Math.min(val * 20, 100);
              const colorClass = val <= 1 ? 'good' : val <= 3 ? 'warning' : 'bad';
              return `
                <div class="bar-item">
                  <div class="bar-label">${carrier}</div>
                  <div class="bar-track">
                    <div class="bar-fill ${colorClass}" style="width: ${width}%">${val}%</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        <!-- Cumplimiento ANS Chart -->
        <div class="chart-container">
          <div class="chart-title">Cumplimiento ANS por Transportadora</div>
          <div class="bar-chart">
            ${carriers.map(carrier => {
              const val = parseFloat(String(getCellDisplayValue(data[carrier]?.cumplimiento_ans) || 0));
              const colorClass = val >= 95 ? 'good' : val >= 85 ? 'warning' : 'bad';
              return `
                <div class="bar-item">
                  <div class="bar-label">${carrier}</div>
                  <div class="bar-track">
                    <div class="bar-fill ${colorClass}" style="width: ${val}%">${val}%</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
      
      <!-- Comparison Table Page -->
      <div class="page">
        <h2 class="section-title">📋 Tabla Comparativa de Costos</h2>
        
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Transportadora</th>
              <th>Costo Envío Nacional</th>
              <th>% Comisión</th>
              <th>% Manejo</th>
            </tr>
          </thead>
          <tbody>
            ${carriers.map(carrier => `
              <tr>
                <td><strong>${carrier}</strong></td>
                <td>${currency} ${Number(getCellDisplayValue(data[carrier]?.costo_envio_nacional) || 0).toLocaleString()}</td>
                <td>${getCellDisplayValue(data[carrier]?.comision_recaudo) || 0}%</td>
                <td>${getCellDisplayValue(data[carrier]?.costo_manejo) || 0}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <h2 class="section-title" style="margin-top: 40px;">🚚 Servicios y Políticas</h2>
        
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Transportadora</th>
              <th>Redirección Gratis</th>
              <th>Reclame Oficina</th>
              <th>Intentos</th>
              <th>SMS Gratis</th>
            </tr>
          </thead>
          <tbody>
            ${carriers.map(carrier => {
              const redireccion = getCellDisplayValue(data[carrier]?.redireccion_gratis);
              const reclame = getCellDisplayValue(data[carrier]?.reclame_oficina);
              const sms = getCellDisplayValue(data[carrier]?.sms_gratuitos);
              return `
              <tr>
                <td><strong>${carrier}</strong></td>
                <td class="${redireccion ? 'boolean-yes' : 'boolean-no'}">${redireccion ? '✓ Sí' : '✗ No'}</td>
                <td class="${reclame ? 'boolean-yes' : 'boolean-no'}">${reclame ? '✓ Sí' : '✗ No'}</td>
                <td>${getCellDisplayValue(data[carrier]?.intentos_entrega) || '-'}</td>
                <td class="${sms ? 'boolean-yes' : 'boolean-no'}">${sms ? '✓ Sí' : '✗ No'}</td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>
      
      <!-- Individual Carrier Details -->
      ${carriers.map(carrier => `
        <div class="page">
          <h2 class="section-title">🏢 ${carrier}</h2>
          
          <div class="data-grid">
            ${fields.map(field => {
              const cellData = normalizeCellValue(data[carrier]?.[field.id]);
              let displayValue = cellData.value;
              let valueClass = 'data-value';
              let colorClass = cellData.color && cellData.color !== 'none' ? `color-${cellData.color}` : '';
              
              if (field.type === 'boolean') {
                valueClass += displayValue ? ' boolean-yes' : ' boolean-no';
                displayValue = displayValue ? '✓ Sí' : '✗ No';
              } else if (field.type === 'percentage') {
                const numVal = parseFloat(String(displayValue || 0));
                valueClass += ' percentage';
                if (field.id === 'devoluciones' || field.id === 'siniestros') {
                  valueClass += numVal <= 2 ? ' good' : numVal <= 5 ? ' warning' : ' bad';
                } else if (field.id === 'cumplimiento_ans') {
                  valueClass += numVal >= 95 ? ' good' : numVal >= 85 ? ' warning' : ' bad';
                }
                displayValue = `${displayValue || 0}%`;
              } else if (field.type === 'currency') {
                displayValue = `${currency} ${Number(displayValue || 0).toLocaleString()}`;
              } else {
                displayValue = displayValue || '-';
              }
              
              const noteHtml = cellData.note ? `<div class="data-note">${cellData.note}</div>` : '';
              
              return `
                <div class="data-item ${colorClass}">
                  <div class="data-label">${field.label}</div>
                  <div class="${valueClass}">${displayValue}</div>
                  ${noteHtml}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}
      
      <!-- Footer -->
      <div class="footer">
        <p>Reporte generado por Efficommerce | ${monthName} ${year}</p>
        <p>Benchmark Logístico - ${country}</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
}
