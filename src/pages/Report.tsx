import { useRef, useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Code, Loader2, CheckCircle, XCircle, TrendingUp, TrendingDown, DollarSign, Truck, BarChart3, Table2, AlertTriangle, Shield, Save, Trophy, Star, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useBenchmarkData } from '@/hooks/useBenchmarkData';
import { useBenchmarkConfig } from '@/hooks/useBenchmarkConfig';
import { useSavedReports } from '@/hooks/useSavedReports';
import { carriersByCountry, fields, monthNames, currencyByCountry, normalizeCellValue, FieldDefinition } from '@/lib/data';
import { ProgressBar, ComparisonBar } from '@/components/ui/progress-bar';
import { MarkdownContent } from '@/components/MarkdownContent';
import { toast } from 'sonner';
import efficommerceLogo from "@/assets/efficommerce-logo.png";

export default function Report() {
  const [searchParams] = useSearchParams();
  const country = searchParams.get('country') || 'Colombia';
  const month = parseInt(searchParams.get('month') || '9');
  const year = parseInt(searchParams.get('year') || '2025');
  const isSavedView = searchParams.get('saved') === 'true';
  
  const { data } = useBenchmarkData(country, year, month);
  const { getCountryBanner, getCarrierLogo, isLoading: configLoading } = useBenchmarkConfig();
  const { saveReport } = useSavedReports();
  const reportRef = useRef<HTMLDivElement>(null);
  const [hasSaved, setHasSaved] = useState(false);
  
  const carriers = carriersByCountry[country] || [];
  const currency = currencyByCountry[country] || 'COP';
  const monthName = monthNames[month];
  const bannerUrl = getCountryBanner(country);

  // Auto-save report when viewing (not from saved view)
  useEffect(() => {
    if (!isSavedView && data && Object.keys(data).length > 0 && !hasSaved) {
      saveReport(country, year, month, data).then((success) => {
        if (success) {
          setHasSaved(true);
          toast.success('Reporte guardado automáticamente');
        }
      });
    }
  }, [data, country, year, month, isSavedView, saveReport, hasSaved]);

  const getCellValue = (carrier: string, fieldId: string) => {
    const cellData = data[carrier]?.[fieldId];
    return normalizeCellValue(cellData);
  };

  const getDisplayValue = (carrier: string, fieldId: string) => {
    return getCellValue(carrier, fieldId).value;
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

  const downloadHTML = () => {
    if (!reportRef.current) return;
    
    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: system-ui, sans-serif; }
        body { background: #f8fafc; color: #1e293b; line-height: 1.6; }
        .report { max-width: 1200px; margin: 0 auto; padding: 24px; }
        img { max-width: 100%; height: auto; }
        .header { background: linear-gradient(135deg, #0891b2, #0e7490); color: white; padding: 40px; border-radius: 16px; margin-bottom: 24px; text-align: center; }
        .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .grid { display: grid; gap: 16px; }
        .grid-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-3 { grid-template-columns: repeat(3, 1fr); }
        .grid-4 { grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 768px) { .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; } }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; }
        .badge { display: inline-flex; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-yellow { background: #fef3c7; color: #92400e; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .progress { height: 8px; background: #e2e8f0; border-radius: 9999px; overflow: hidden; }
        .progress-bar { height: 100%; border-radius: 9999px; }
        .text-green { color: #16a34a; }
        .text-yellow { color: #ca8a04; }
        .text-red { color: #dc2626; }
        .text-muted { color: #64748b; }
        .font-bold { font-weight: 700; }
        .text-center { text-align: center; }
        .mb-4 { margin-bottom: 16px; }
        .mt-4 { margin-top: 16px; }
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
  <div class="report">
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

  // Prepare chart data
  const ansData = carriers.map(c => ({
    label: c,
    value: parseFloat(String(getDisplayValue(c, 'cumplimiento_ans') || 0)),
    color: getColorVariant('cumplimiento_ans', parseFloat(String(getDisplayValue(c, 'cumplimiento_ans') || 0))),
    logo: getCarrierLogo(c)
  }));

  const devData = carriers.map(c => ({
    label: c,
    value: parseFloat(String(getDisplayValue(c, 'devoluciones') || 0)),
    color: getColorVariant('devoluciones', parseFloat(String(getDisplayValue(c, 'devoluciones') || 0))),
    logo: getCarrierLogo(c)
  }));

  const sinData = carriers.map(c => ({
    label: c,
    value: parseFloat(String(getDisplayValue(c, 'siniestros') || 0)),
    color: getColorVariant('siniestros', parseFloat(String(getDisplayValue(c, 'siniestros') || 0))),
    logo: getCarrierLogo(c)
  }));

  const renderFieldValue = (carrier: string, field: FieldDefinition) => {
    const cellValue = getCellValue(carrier, field.id);
    const value = cellValue.value;
    const note = cellValue.note;
    const color = cellValue.color;

    const colorClasses = {
      green: 'bg-green-50 border-green-200',
      yellow: 'bg-yellow-50 border-yellow-200',
      red: 'bg-red-50 border-red-200',
      none: ''
    };

    let displayContent: React.ReactNode = '-';

    if (field.type === 'boolean') {
      displayContent = value ? (
        <Badge variant="default" className="gap-1 bg-green-500">
          <CheckCircle className="h-3 w-3" /> Sí
        </Badge>
      ) : (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> No
        </Badge>
      );
    } else if (field.type === 'percentage') {
      const numVal = parseFloat(String(value || 0));
      const variant = getColorVariant(field.id, numVal);
      displayContent = (
        <div className="space-y-1">
          <span className={`font-bold ${variant === 'success' ? 'text-green-600' : variant === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
            {numVal}%
          </span>
          <ProgressBar value={numVal} variant={variant} size="sm" showLabel={false} />
        </div>
      );
    } else if (field.type === 'currency' || field.type === 'multi-currency') {
      if (typeof value === 'object' && value !== null) {
        displayContent = (
          <div className="space-y-1 text-sm">
            {Object.entries(value as Record<string, any>).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground">{key}:</span>
                <span className="font-medium">{currency} {Number(val || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        );
      } else {
        displayContent = value ? `${currency} ${Number(value).toLocaleString()}` : '-';
      }
    } else if (field.type === 'textarea' || field.type === 'text') {
      displayContent = <MarkdownContent content={String(value || '')} />;
    } else {
      displayContent = String(value || '-');
    }

    return (
      <div className={`p-3 rounded-lg border ${colorClasses[color || 'none']}`}>
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{field.label}</div>
        <div className="text-sm">{displayContent}</div>
        {note && (
          <div className="mt-2 text-xs text-muted-foreground italic border-t pt-2">
            <MarkdownContent content={note} />
          </div>
        )}
      </div>
    );
  };

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

        {/* Tabs for Dashboard vs Detailed Table */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto print:hidden">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="detailed" className="gap-2">
              <Table2 className="h-4 w-4" />
              Tabla Detallada
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Executive Summary - Recommendations */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  🎯 Resumen Ejecutivo - Recomendaciones
                </CardTitle>
                <CardDescription>
                  Análisis basado en los indicadores clave de desempeño del período
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Calculate rankings
                  const carrierStats = carriers.map(c => ({
                    name: c,
                    ans: parseFloat(String(getDisplayValue(c, 'cumplimiento_ans') || 0)),
                    dev: parseFloat(String(getDisplayValue(c, 'devoluciones') || 100)),
                    sin: parseFloat(String(getDisplayValue(c, 'siniestros') || 100)),
                    logo: getCarrierLogo(c),
                    hasRedirect: !!getDisplayValue(c, 'redireccion_gratis'),
                    hasPickup: !!getDisplayValue(c, 'reclame_oficina'),
                    hasSms: !!getDisplayValue(c, 'sms_gratuitos'),
                  }));

                  // Best ANS
                  const bestAns = [...carrierStats].sort((a, b) => b.ans - a.ans)[0];
                  // Lowest returns
                  const lowestDev = [...carrierStats].sort((a, b) => a.dev - b.dev)[0];
                  // Lowest claims
                  const lowestSin = [...carrierStats].sort((a, b) => a.sin - b.sin)[0];
                  // Best overall (weighted score)
                  const withScore = carrierStats.map(c => ({
                    ...c,
                    score: (c.ans * 0.4) + ((100 - c.dev * 5) * 0.3) + ((100 - c.sin * 10) * 0.3)
                  }));
                  const bestOverall = [...withScore].sort((a, b) => b.score - a.score)[0];
                  // Most services
                  const mostServices = [...carrierStats].sort((a, b) => 
                    (Number(b.hasRedirect) + Number(b.hasPickup) + Number(b.hasSms)) - 
                    (Number(a.hasRedirect) + Number(a.hasPickup) + Number(a.hasSms))
                  )[0];

                  return (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="bg-background rounded-lg p-4 border shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          Mejor Desempeño General
                        </div>
                        <div className="flex items-center gap-3">
                          {bestOverall.logo ? (
                            <img src={bestOverall.logo} alt={bestOverall.name} className="w-10 h-10 object-contain rounded bg-white p-1 border" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                              <Truck className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-lg">{bestOverall.name}</p>
                            <p className="text-xs text-muted-foreground">Puntuación: {bestOverall.score.toFixed(0)}/100</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-background rounded-lg p-4 border shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Shield className="h-4 w-4 text-green-500" />
                          Mejor Cumplimiento ANS
                        </div>
                        <div className="flex items-center gap-3">
                          {bestAns.logo ? (
                            <img src={bestAns.logo} alt={bestAns.name} className="w-10 h-10 object-contain rounded bg-white p-1 border" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                              <Truck className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-lg">{bestAns.name}</p>
                            <p className="text-xs text-green-600 font-medium">{bestAns.ans}% de cumplimiento</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-background rounded-lg p-4 border shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <TrendingDown className="h-4 w-4 text-blue-500" />
                          Menor Tasa de Devoluciones
                        </div>
                        <div className="flex items-center gap-3">
                          {lowestDev.logo ? (
                            <img src={lowestDev.logo} alt={lowestDev.name} className="w-10 h-10 object-contain rounded bg-white p-1 border" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                              <Truck className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-lg">{lowestDev.name}</p>
                            <p className="text-xs text-blue-600 font-medium">{lowestDev.dev}% devoluciones</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-background rounded-lg p-4 border shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <AlertTriangle className="h-4 w-4 text-purple-500" />
                          Menor Tasa de Siniestros
                        </div>
                        <div className="flex items-center gap-3">
                          {lowestSin.logo ? (
                            <img src={lowestSin.logo} alt={lowestSin.name} className="w-10 h-10 object-contain rounded bg-white p-1 border" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                              <Truck className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-lg">{lowestSin.name}</p>
                            <p className="text-xs text-purple-600 font-medium">{lowestSin.sin}% siniestros</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-background rounded-lg p-4 border shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Star className="h-4 w-4 text-orange-500" />
                          Más Servicios Incluidos
                        </div>
                        <div className="flex items-center gap-3">
                          {mostServices.logo ? (
                            <img src={mostServices.logo} alt={mostServices.name} className="w-10 h-10 object-contain rounded bg-white p-1 border" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                              <Truck className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-lg">{mostServices.name}</p>
                            <p className="text-xs text-orange-600 font-medium">
                              {Number(mostServices.hasRedirect) + Number(mostServices.hasPickup) + Number(mostServices.hasSms)} servicios extra
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-background rounded-lg p-4 border shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Truck className="h-4 w-4 text-primary" />
                          Total Transportadoras
                        </div>
                        <p className="font-bold text-3xl">{carriers.length}</p>
                        <p className="text-xs text-muted-foreground">Evaluadas en {monthName} {year}</p>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Ranking General */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🏆 Ranking General de Transportadoras
                </CardTitle>
                <CardDescription>
                  Ordenado por puntuación ponderada: ANS (40%), Devoluciones (30%), Siniestros (30%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const ranked = carriers.map(c => {
                    const ans = parseFloat(String(getDisplayValue(c, 'cumplimiento_ans') || 0));
                    const dev = parseFloat(String(getDisplayValue(c, 'devoluciones') || 100));
                    const sin = parseFloat(String(getDisplayValue(c, 'siniestros') || 100));
                    const score = (ans * 0.4) + ((100 - dev * 5) * 0.3) + ((100 - sin * 10) * 0.3);
                    return { name: c, ans, dev, sin, score, logo: getCarrierLogo(c) };
                  }).sort((a, b) => b.score - a.score);

                  return (
                    <div className="space-y-3">
                      {ranked.map((carrier, index) => (
                        <div key={carrier.name} className={`flex items-center gap-4 p-3 rounded-lg border ${index === 0 ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200' : index === 1 ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200' : index === 2 ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200' : 'bg-background'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-white' : index === 1 ? 'bg-slate-400 text-white' : index === 2 ? 'bg-orange-400 text-white' : 'bg-muted text-muted-foreground'}`}>
                            {index + 1}
                          </div>
                          {carrier.logo ? (
                            <img src={carrier.logo} alt={carrier.name} className="w-10 h-10 object-contain rounded bg-white p-1 border" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                              <Truck className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold">{carrier.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ANS: {carrier.ans}% | Dev: {carrier.dev}% | Sin: {carrier.sin}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{carrier.score.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground">puntos</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* KPI Summary */}
            <h2 className="text-xl font-semibold flex items-center gap-2">
              📈 Indicadores Clave de Desempeño
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Promedio ANS</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {(carriers.reduce((sum, c) => sum + parseFloat(String(getDisplayValue(c, 'cumplimiento_ans') || 0)), 0) / carriers.length).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Entre todas las transportadoras</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[300px] text-sm">
                  <p className="font-semibold mb-1">Promedio de Cumplimiento ANS</p>
                  <p>Porcentaje promedio de pedidos entregados a tiempo según la promesa de entrega de cada transportadora. Meta: ≥95%</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-sm">Promedio Devoluciones</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {(carriers.reduce((sum, c) => sum + parseFloat(String(getDisplayValue(c, 'devoluciones') || 0)), 0) / carriers.length).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Tasa promedio del período</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[300px] text-sm">
                  <p className="font-semibold mb-1">Promedio de Devoluciones</p>
                  <p>Porcentaje promedio de paquetes devueltos. Un valor más bajo indica mejor desempeño. Ideal: ≤2%</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Promedio Siniestros</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {(carriers.reduce((sum, c) => sum + parseFloat(String(getDisplayValue(c, 'siniestros') || 0)), 0) / carriers.length).toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Tasa promedio del período</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[300px] text-sm">
                  <p className="font-semibold mb-1">Promedio de Siniestros</p>
                  <p>Porcentaje promedio de paquetes que pasaron a indemnización. Un valor más bajo es mejor. Ideal: ≤1%</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Con Servicios Extra</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {carriers.filter(c => getDisplayValue(c, 'redireccion_gratis') || getDisplayValue(c, 'reclame_oficina') || getDisplayValue(c, 'sms_gratuitos')).length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">De {carriers.length} transportadoras</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[300px] text-sm">
                  <p className="font-semibold mb-1">Transportadoras con Servicios Extra</p>
                  <p>Cantidad de transportadoras que ofrecen al menos uno de: redirección gratis, reclame en oficina o SMS gratuitos.</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Comparison Charts */}
            <h2 className="text-xl font-semibold flex items-center gap-2">
              📊 Comparación Visual
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    Cumplimiento ANS
                  </CardTitle>
                  <CardDescription className="text-xs">Meta: ≥95%</CardDescription>
                </CardHeader>
                <CardContent>
                  <ComparisonBar items={ansData} max={100} valueFormatter={(v) => `${v}%`} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-yellow-500" />
                    % Devoluciones
                  </CardTitle>
                  <CardDescription className="text-xs">Ideal: ≤2%</CardDescription>
                </CardHeader>
                <CardContent>
                  <ComparisonBar items={devData} max={100} valueFormatter={(v) => `${v}%`} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    % Siniestros
                  </CardTitle>
                  <CardDescription className="text-xs">Ideal: ≤1%</CardDescription>
                </CardHeader>
                <CardContent>
                  <ComparisonBar items={sinData} max={100} valueFormatter={(v) => `${v}%`} />
                </CardContent>
              </Card>
            </div>

            {/* Services Matrix */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ✅ Matriz de Servicios Adicionales
                </CardTitle>
                <CardDescription>
                  Servicios de valor agregado incluidos por cada transportadora
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Transportadora</th>
                      <th className="text-center p-3 font-semibold">Redirección Gratis</th>
                      <th className="text-center p-3 font-semibold">Reclame en Oficina</th>
                      <th className="text-center p-3 font-semibold">SMS Gratuitos</th>
                      <th className="text-center p-3 font-semibold">Total Servicios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carriers.map(carrier => {
                      const logoUrl = getCarrierLogo(carrier);
                      const hasRedirect = !!getDisplayValue(carrier, 'redireccion_gratis');
                      const hasPickup = !!getDisplayValue(carrier, 'reclame_oficina');
                      const hasSms = !!getDisplayValue(carrier, 'sms_gratuitos');
                      const total = Number(hasRedirect) + Number(hasPickup) + Number(hasSms);
                      
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
                            {hasRedirect ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {hasPickup ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {hasSms ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={total === 3 ? 'default' : total >= 1 ? 'secondary' : 'destructive'}>
                              {total}/3
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>📋 Tabla Comparativa de Desempeño</CardTitle>
                <CardDescription>
                  Resumen de indicadores clave por transportadora
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Transportadora</th>
                      <th className="text-center p-3 font-semibold">ANS</th>
                      <th className="text-center p-3 font-semibold">Devoluciones</th>
                      <th className="text-center p-3 font-semibold">Siniestros</th>
                      <th className="text-center p-3 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carriers.map(carrier => {
                      const logoUrl = getCarrierLogo(carrier);
                      const ans = parseFloat(String(getDisplayValue(carrier, 'cumplimiento_ans') || 0));
                      const dev = parseFloat(String(getDisplayValue(carrier, 'devoluciones') || 0));
                      const sin = parseFloat(String(getDisplayValue(carrier, 'siniestros') || 0));
                      
                      const isGood = ans >= 90 && dev <= 5 && sin <= 1;
                      const isWarning = ans >= 80 && dev <= 10 && sin <= 3;
                      
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
                            <Badge 
                              variant={isGood ? 'default' : isWarning ? 'secondary' : 'destructive'}
                              className="gap-1"
                            >
                              {isGood ? (
                                <><CheckCircle className="h-3 w-3" /> Excelente</>
                              ) : isWarning ? (
                                <><AlertTriangle className="h-3 w-3" /> Aceptable</>
                              ) : (
                                <><XCircle className="h-3 w-3" /> Revisar</>
                              )}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detailed Table Tab */}
          <TabsContent value="detailed" className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] px-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Información Completa por Transportadora</h2>
              <p className="text-muted-foreground">Todos los campos y datos recopilados</p>
            </div>

            <Card className="overflow-hidden mx-auto">
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[70vh] relative">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-semibold min-w-[200px] sticky left-0 bg-slate-100 dark:bg-slate-800 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Campo</th>
                        {carriers.map(carrier => {
                          const logoUrl = getCarrierLogo(carrier);
                          return (
                            <th key={carrier} className="text-center p-4 font-semibold min-w-[180px] bg-muted/50">
                              <div className="flex flex-col items-center gap-2">
                                {logoUrl ? (
                                  <img src={logoUrl} alt={carrier} className="w-10 h-10 object-contain rounded-lg bg-white p-1 border" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Truck className="h-5 w-5 text-primary" />
                                  </div>
                                )}
                                <span>{carrier}</span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, fieldIndex) => (
                        <tr key={field.id} className={`border-b ${fieldIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                          <td className={`p-4 font-medium sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${fieldIndex % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800'}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-foreground">{field.label}</span>
                              {field.description && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help flex-shrink-0" />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-[300px] text-sm">
                                    {field.description}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                          {carriers.map(carrier => {
                            const cellValue = getCellValue(carrier, field.id);
                            const value = cellValue.value;
                            const note = cellValue.note;
                            const color = cellValue.color;

                            const colorClasses = {
                              green: 'bg-green-100 dark:bg-green-900/50 border-l-4 border-l-green-500',
                              yellow: 'bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-l-yellow-500',
                              red: 'bg-red-100 dark:bg-red-900/50 border-l-4 border-l-red-500',
                              none: ''
                            };

                            let displayContent: React.ReactNode = '-';

                            if (field.type === 'boolean') {
                              displayContent = value ? (
                                <Badge variant="default" className="gap-1 bg-green-500">
                                  <CheckCircle className="h-3 w-3" /> Sí
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1">
                                  <XCircle className="h-3 w-3" /> No
                                </Badge>
                              );
                            } else if (field.type === 'percentage') {
                              const numVal = parseFloat(String(value || 0));
                              const variant = getColorVariant(field.id, numVal);
                              displayContent = (
                                <div className="space-y-1 w-full max-w-[120px] mx-auto">
                                  <span className={`font-bold ${variant === 'success' ? 'text-green-600' : variant === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {numVal}%
                                  </span>
                                  <ProgressBar value={numVal} max={100} variant={variant} size="sm" showLabel={false} />
                                </div>
                              );
                            } else if (field.type === 'currency' || field.type === 'multi-currency') {
                              if (typeof value === 'object' && value !== null) {
                                displayContent = (
                                  <div className="space-y-1 text-xs">
                                    {Object.entries(value as Record<string, any>).map(([key, val]) => (
                                      <div key={key} className="flex justify-between gap-2">
                                        <span className="text-muted-foreground">{key}:</span>
                                        <span className="font-medium">{currency} {Number(val || 0).toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              } else {
                                displayContent = value ? `${currency} ${Number(value).toLocaleString()}` : '-';
                              }
                            } else if (field.type === 'textarea' || field.type === 'text') {
                              displayContent = <MarkdownContent content={String(value || '')} />;
                            } else {
                              displayContent = String(value || '-');
                            }

                            return (
                              <td key={carrier} className={`p-4 text-center ${colorClasses[color || 'none']}`}>
                                <div className="flex flex-col items-center gap-1">
                                  {displayContent}
                                  {note && !field.hideNote && (
                                    <div className="text-xs text-muted-foreground italic mt-1 max-w-[150px]">
                                      <MarkdownContent content={note} />
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-muted-foreground text-sm py-6 border-t mt-8">
          <p>Reporte generado por <strong>Efficommerce</strong></p>
          <p>{monthName} {year} - {country}</p>
        </div>
      </main>
    </div>
  );
}
