import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Code, Loader2, CheckCircle, XCircle, TrendingUp, TrendingDown, DollarSign, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBenchmarkData } from '@/hooks/useBenchmarkData';
import { useBenchmarkConfig } from '@/hooks/useBenchmarkConfig';
import { carriersByCountry, fields, monthNames, currencyByCountry, normalizeCellValue } from '@/lib/data';
import efficommerceLogo from "@/assets/efficommerce-logo.png";

export default function Report() {
  const [searchParams] = useSearchParams();
  const country = searchParams.get('country') || 'Colombia';
  const month = parseInt(searchParams.get('month') || '9');
  const year = parseInt(searchParams.get('year') || '2025');
  
  const { data } = useBenchmarkData(country, year, month);
  const { getCountryBanner, getCarrierLogo, isLoading: configLoading } = useBenchmarkConfig();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const carriers = carriersByCountry[country] || [];
  const currency = currencyByCountry[country] || 'COP';
  const monthName = monthNames[month];
  const bannerUrl = getCountryBanner(country);

  const getCellValue = (carrier: string, fieldId: string) => {
    const cellData = data[carrier]?.[fieldId];
    return normalizeCellValue(cellData);
  };

  const getDisplayValue = (carrier: string, fieldId: string) => {
    return getCellValue(carrier, fieldId).value;
  };

  const downloadHTML = () => {
    if (!reportRef.current) return;
    
    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: system-ui, sans-serif; }
        body { background: #f8fafc; color: #1e293b; line-height: 1.5; }
        .report-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .report-header { background: linear-gradient(135deg, #0891b2, #0e7490); color: white; padding: 40px; border-radius: 16px; margin-bottom: 24px; text-align: center; }
        .report-header h1 { font-size: 32px; margin-bottom: 8px; }
        .report-header p { opacity: 0.9; font-size: 18px; }
        .banner-img { width: 100%; max-height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 24px; }
        .section { background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .section-title { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #0891b2; }
        .cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
        .carrier-card { background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; }
        .carrier-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .carrier-logo { width: 48px; height: 48px; object-fit: contain; border-radius: 8px; background: white; padding: 4px; }
        .carrier-name { font-size: 18px; font-weight: 600; }
        .metric { margin-bottom: 12px; }
        .metric-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
        .metric-value { font-size: 16px; font-weight: 500; }
        .metric-value.good { color: #16a34a; }
        .metric-value.warning { color: #ca8a04; }
        .metric-value.bad { color: #dc2626; }
        .badge { display: inline-flex; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
        .badge.success { background: #dcfce7; color: #166534; }
        .badge.danger { background: #fee2e2; color: #991b1b; }
        .comparison-table { width: 100%; border-collapse: collapse; }
        .comparison-table th { background: #0891b2; color: white; padding: 12px; text-align: left; }
        .comparison-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .comparison-table tr:hover { background: #f1f5f9; }
      </style>
    `;
    
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Benchmark Logístico - ${country} - ${monthName} ${year}</title>
  ${styles}
</head>
<body>
  <div class="report-container">
    ${reportRef.current.innerHTML}
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark-${country.toLowerCase()}-${monthName.toLowerCase()}-${year}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    window.print();
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Header - hidden in print */}
      <header className="bg-card border-b border-border px-6 py-4 print:hidden sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <img src={efficommerceLogo} alt="Efficommerce" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Reporte Generado</h1>
              <p className="text-sm text-muted-foreground">{country} - {monthName} {year}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={downloadHTML} className="gap-2">
              <Code className="h-4 w-4" />
              Descargar HTML
            </Button>
            <Button onClick={downloadPDF} className="gap-2">
              <FileText className="h-4 w-4" />
              Descargar PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Report Content */}
      <main className="p-6 max-w-7xl mx-auto" ref={reportRef}>
        {/* Banner */}
        {bannerUrl && (
          <img 
            src={bannerUrl} 
            alt={`Banner ${country}`}
            className="w-full h-48 object-cover rounded-xl mb-6 shadow-md print:h-32"
          />
        )}

        {/* Title Card */}
        <Card className="mb-6 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
          <CardHeader className="text-center py-8">
            <CardTitle className="text-3xl font-bold">📦 Benchmark Logístico</CardTitle>
            <CardDescription className="text-primary-foreground/90 text-xl mt-2">
              {country} - {monthName} {year}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Truck className="h-4 w-4" />
                <span className="text-sm">Transportadoras</span>
              </div>
              <p className="text-2xl font-bold">{carriers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Mejor ANS</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {Math.max(...carriers.map(c => parseFloat(String(getDisplayValue(c, 'cumplimiento_ans') || 0)))).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm">Menor Devolución</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {Math.min(...carriers.map(c => parseFloat(String(getDisplayValue(c, 'devoluciones') || 100)))).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Moneda</span>
              </div>
              <p className="text-2xl font-bold">{currency}</p>
            </CardContent>
          </Card>
        </div>

        {/* Carrier Cards */}
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Detalle por Transportadora
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {carriers.map(carrier => {
            const logoUrl = getCarrierLogo(carrier);
            const ans = parseFloat(String(getDisplayValue(carrier, 'cumplimiento_ans') || 0));
            const dev = parseFloat(String(getDisplayValue(carrier, 'devoluciones') || 0));
            const sin = parseFloat(String(getDisplayValue(carrier, 'siniestros') || 0));
            
            return (
              <Card key={carrier} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3 bg-muted/30">
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt={carrier}
                        className="w-12 h-12 object-contain rounded-lg bg-white p-1 border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Truck className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <CardTitle className="text-lg">{carrier}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">ANS</p>
                      <p className={`text-lg font-bold ${ans >= 95 ? 'text-green-600' : ans >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {ans}%
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Dev.</p>
                      <p className={`text-lg font-bold ${dev <= 2 ? 'text-green-600' : dev <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {dev}%
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Sin.</p>
                      <p className={`text-lg font-bold ${sin <= 1 ? 'text-green-600' : sin <= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {sin}%
                      </p>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="flex flex-wrap gap-2">
                    {getDisplayValue(carrier, 'redireccion_gratis') && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="h-3 w-3" /> Redirección gratis
                      </Badge>
                    )}
                    {getDisplayValue(carrier, 'reclame_oficina') && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="h-3 w-3" /> Reclame oficina
                      </Badge>
                    )}
                    {getDisplayValue(carrier, 'sms_gratuitos') && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="h-3 w-3" /> SMS gratis
                      </Badge>
                    )}
                  </div>

                  {/* Costs */}
                  <div className="pt-2 border-t space-y-1">
                    <p className="text-sm text-muted-foreground">Comisión recaudo</p>
                    <p className="font-medium">{getDisplayValue(carrier, 'comision_recaudo') || '-'}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comparison Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>📊 Tabla Comparativa</CardTitle>
            <CardDescription>Métricas principales de todas las transportadoras</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Transportadora</th>
                  <th className="text-center p-3 font-semibold">ANS</th>
                  <th className="text-center p-3 font-semibold">Devoluciones</th>
                  <th className="text-center p-3 font-semibold">Siniestros</th>
                  <th className="text-center p-3 font-semibold">Redirección</th>
                  <th className="text-center p-3 font-semibold">SMS</th>
                </tr>
              </thead>
              <tbody>
                {carriers.map(carrier => {
                  const logoUrl = getCarrierLogo(carrier);
                  const ans = parseFloat(String(getDisplayValue(carrier, 'cumplimiento_ans') || 0));
                  const dev = parseFloat(String(getDisplayValue(carrier, 'devoluciones') || 0));
                  const sin = parseFloat(String(getDisplayValue(carrier, 'siniestros') || 0));
                  const redir = getDisplayValue(carrier, 'redireccion_gratis');
                  const sms = getDisplayValue(carrier, 'sms_gratuitos');
                  
                  return (
                    <tr key={carrier} className="border-b hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {logoUrl ? (
                            <img src={logoUrl} alt={carrier} className="w-8 h-8 object-contain rounded bg-white p-0.5 border" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                              <Truck className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <span className="font-medium">{carrier}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={ans >= 95 ? 'default' : ans >= 85 ? 'secondary' : 'destructive'}>
                          {ans}%
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={dev <= 2 ? 'default' : dev <= 5 ? 'secondary' : 'destructive'}>
                          {dev}%
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={sin <= 1 ? 'default' : sin <= 3 ? 'secondary' : 'destructive'}>
                          {sin}%
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        {redir ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {sms ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-muted-foreground text-sm py-6 border-t">
          <p>Reporte generado por <strong>Efficommerce</strong></p>
          <p>{monthName} {year} - {country}</p>
        </div>
      </main>
    </div>
  );
}
