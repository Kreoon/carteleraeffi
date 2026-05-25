import { useRef, useEffect, useState } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Code, Loader2, CheckCircle, XCircle, TrendingUp, TrendingDown, DollarSign, Truck, BarChart3, Table2, AlertTriangle, Shield, Save, Trophy, Star, Info, Download, Share2 } from 'lucide-react';
import { getCountryTheme } from '@/lib/countryTheme';
import { ShareDialog } from '@/components/ShareDialog';
import { generateFullHTML } from '@/components/HTMLExportGenerator';
import { generatePDF } from '@/components/PDFGenerator';
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
import { IndicatorList } from '@/components/ui/indicator-list';
import { MarkdownContent } from '@/components/MarkdownContent';
import { toast } from 'sonner';
import efficommerceLogo from "@/assets/efficommerce-logo.png";

export default function Report() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isEmbed = location.pathname.startsWith('/embed');
  const isPrintMode = searchParams.get('print') === '1';
  const now = new Date();
  const country = searchParams.get('country') || 'Colombia';
  const month = parseInt(searchParams.get('month') ?? String(now.getMonth()));
  const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()));
  const isSavedView = searchParams.get('saved') === 'true';
  const isNoSave = searchParams.get('nosave') === '1';
  const theme = getCountryTheme(country);
  const [shareOpen, setShareOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const { data: localData } = useBenchmarkData(country, year, month);
  const { getCountryBanner, getCarrierLogo, isLoading: configLoading } = useBenchmarkConfig();
  const { saveReport, reports: savedReports, isLoading: savedLoading } = useSavedReports();

  // When viewing a saved report, prefer data from Supabase; otherwise use localStorage
  const savedMatch = isSavedView
    ? savedReports.find(r => r.country === country && r.year === year && r.month === month)
    : undefined;
  const data = (isSavedView && savedMatch ? savedMatch.data : localData) || {};
  const reportRef = useRef<HTMLDivElement>(null);
  const [hasSaved, setHasSaved] = useState(false);
  
  const carriers = carriersByCountry[country] || [];
  const currency = currencyByCountry[country] || 'COP';
  const monthName = monthNames[month];
  const bannerUrl = getCountryBanner(country);

  // Auto-save report when viewing (not from saved view, not from PDF render)
  useEffect(() => {
    if (!isSavedView && !isNoSave && data && Object.keys(data).length > 0 && !hasSaved) {
      saveReport(country, year, month, data).then((success) => {
        if (success) {
          setHasSaved(true);
          toast.success('Reporte guardado automáticamente');
        }
      });
    }
  }, [data, country, year, month, isSavedView, isNoSave, saveReport, hasSaved]);

  const getCellValue = (carrier: string, fieldId: string) => {
    const cellData = data[carrier]?.[fieldId];
    return normalizeCellValue(cellData);
  };

  const getDisplayValue = (carrier: string, fieldId: string) => {
    return getCellValue(carrier, fieldId).value;
  };

  // Parse float that treats 0 as valid (not falsy), only uses fallback for empty/undefined
  const safeParseFloat = (value: any, fallback: number): number => {
    if (value === '' || value === undefined || value === null) return fallback;
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? fallback : parsed;
  };

  // Calculate average cost from detail (multi-currency) field
  const getAverageCostFromDetail = (carrier: string, detailFieldId: string): number => {
    const detailValue = getDisplayValue(carrier, detailFieldId);
    if (detailValue && typeof detailValue === 'object') {
      const values = Object.values(detailValue as Record<string, string>)
        .map(v => parseFloat(String(v)))
        .filter(v => !isNaN(v) && v > 0);
      if (values.length > 0) {
        return values.reduce((sum, v) => sum + v, 0) / values.length;
      }
    }
    return NaN;
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

  const [isExporting, setIsExporting] = useState(false);

  const downloadHTML = async () => {
    setIsExporting(true);
    try {
      const html = await generateFullHTML({
        country,
        month,
        year,
        data,
        bannerUrl,
        getCarrierLogo
      });

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `benchmark-${country.toLowerCase()}-${monthName.toLowerCase()}-${year}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('HTML exportado correctamente');
    } catch (error) {
      console.error('Error exporting HTML:', error);
      toast.error('Error al exportar el HTML');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPDF = async () => {
    setIsGeneratingPDF(true);
    const toastId = toast.loading('Generando PDF premium...');
    try {
      // POST los datos actuales para que Puppeteer los inyecte en localStorage
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, month, year, data }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.detail || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `cartelera-${country.toLowerCase().replace(/\s+/g, '-')}-${monthName.toLowerCase()}-${year}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('PDF descargado correctamente', { id: toastId });
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.loading('Usando generador local...', { id: toastId });
      try {
        // Fallback: generar PDF localmente con los datos actuales en memoria
        await generatePDF({
          country,
          month,
          year,
          data,
          bannerUrl,
          getCarrierLogo,
          efficommerceLogoUrl: efficommerceLogo,
        });
        toast.success('PDF generado (modo local)', { id: toastId });
      } catch (fallbackErr) {
        console.error('Fallback PDF error:', fallbackErr);
        toast.error('No se pudo generar el PDF', { id: toastId });
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Prepare chart data - use user-defined colors if available
  const ansData = carriers.map(c => {
    const cellValue = getCellValue(c, 'cumplimiento_ans');
    const value = parseFloat(String(cellValue.value || 0));
    // Priorizar color del usuario si está definido
    const userColor = cellValue.color;
    const autoColor = getColorVariant('cumplimiento_ans', value);
    const color = userColor && userColor !== 'none' ? 
      (userColor === 'green' ? 'success' : userColor === 'yellow' ? 'warning' : 'danger') : 
      autoColor;
    return { label: c, value, color, logo: getCarrierLogo(c) };
  });

  const devData = carriers.map(c => {
    const cellValue = getCellValue(c, 'devoluciones');
    const value = parseFloat(String(cellValue.value || 0));
    const userColor = cellValue.color;
    const autoColor = getColorVariant('devoluciones', value);
    const color = userColor && userColor !== 'none' ? 
      (userColor === 'green' ? 'success' : userColor === 'yellow' ? 'warning' : 'danger') : 
      autoColor;
    return { label: c, value, color, logo: getCarrierLogo(c) };
  });

  const sinData = carriers.map(c => {
    const cellValue = getCellValue(c, 'siniestros');
    const value = parseFloat(String(cellValue.value || 0));
    const userColor = cellValue.color;
    const autoColor = getColorVariant('siniestros', value);
    const color = userColor && userColor !== 'none' ? 
      (userColor === 'green' ? 'success' : userColor === 'yellow' ? 'warning' : 'danger') : 
      autoColor;
    return { label: c, value, color, logo: getCarrierLogo(c) };
  });

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
      {/* Header - hidden in print and embed mode */}
      {!isEmbed && !isPrintMode && (
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
            <Button
              variant="outline"
              onClick={() => setShareOpen(true)}
              className="gap-2"
              aria-label="Compartir o embeber reporte"
            >
              <Share2 className="h-4 w-4" />
              Compartir / Embed
            </Button>
            <Button onClick={downloadPDF} className="gap-2" disabled={isGeneratingPDF} aria-label="Descargar PDF premium">
              {isGeneratingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}
            </Button>
          </div>
        </div>
      </header>
      )}

      {/* Report Content */}
      <main
        className="p-6 max-w-7xl mx-auto"
        ref={reportRef}
        data-pdf-ready={!configLoading ? 'true' : undefined}
      >
        {/* Country Banner */}
        {bannerUrl && (
          <img 
            src={bannerUrl} 
            alt={`Banner ${country}`}
            className="w-full h-48 object-cover rounded-xl mb-6 shadow-md print:h-32"
          />
        )}

        {/* Premium Title Header con branding por país */}
        <div
          className={`relative overflow-hidden rounded-2xl mb-8 px-8 py-10 text-center bg-gradient-to-br ${theme.gradient} shadow-lg`}
          style={{ borderTop: `4px solid ${theme.accent}` }}
        >
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" aria-hidden="true" />
          <div className="relative">
            <div
              className="inline-block px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              Reporte Logístico · {country}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Cartelera de Indicadores Logísticos</h1>
            <p className="text-xl text-slate-700 mt-2 font-medium">{monthName} {year}</p>
          </div>
        </div>

        {/* Tabs for Dashboard vs Detailed Table. En print mode se fuerzan ambas visibles */}
        <Tabs defaultValue="dashboard" className={`space-y-6 ${isPrintMode ? '[&_[role=tabpanel]]:!block [&_[role=tabpanel][hidden]]:!block' : ''}`}>
          <TabsList className={`grid w-full grid-cols-2 max-w-md mx-auto print:hidden ${isPrintMode ? 'hidden' : ''}`}>
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
          <TabsContent value="dashboard" className="space-y-6" forceMount={isPrintMode ? true : undefined}>
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
                    dev: safeParseFloat(getDisplayValue(c, 'devoluciones'), 100),
                    sin: safeParseFloat(getDisplayValue(c, 'siniestros'), 100),
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
                  // Best overall (weighted score: Dev 60%, ANS 35%, Sin 5%)
                  const withScore = carrierStats.map(c => ({
                    ...c,
                    score: (c.ans * 0.35) + ((100 - c.dev * 5) * 0.60) + ((100 - c.sin * 10) * 0.05)
                  }));
                  const bestOverall = [...withScore].sort((a, b) => b.score - a.score)[0];
                  // Most services
                  const mostServices = [...carrierStats].sort((a, b) => 
                    (Number(b.hasRedirect) + Number(b.hasPickup) + Number(b.hasSms)) - 
                    (Number(a.hasRedirect) + Number(a.hasPickup) + Number(a.hasSms))
                  )[0];

                  return (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-background rounded-lg p-4 border shadow-sm cursor-help hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Trophy className="h-4 w-4 text-yellow-500" />
                              Mejor Desempeño General
                            </div>
                            <div className="flex items-center gap-3">
                              {bestOverall.logo ? (
                                <img src={bestOverall.logo} alt={bestOverall.name} className="w-10 h-10 object-contain" />
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
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[320px] text-sm">
                          <p className="font-semibold mb-1">🏆 Mejor Desempeño General</p>
                          <p>Puntuación ponderada calculada con: Devoluciones (60%), ANS (35%), Siniestros (5%). Esta transportadora lidera en el balance general de indicadores.</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-background rounded-lg p-4 border shadow-sm cursor-help hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Shield className="h-4 w-4 text-green-500" />
                              Mejor Cumplimiento ANS
                            </div>
                            <div className="flex items-center gap-3">
                              {bestAns.logo ? (
                                <img src={bestAns.logo} alt={bestAns.name} className="w-10 h-10 object-contain" />
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
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[320px] text-sm">
                          <p className="font-semibold mb-1">✅ Mejor Cumplimiento ANS</p>
                          <p>Transportadora con mayor porcentaje de entregas a tiempo según la promesa de días de entrega. Ideal para clientes que priorizan puntualidad.</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-background rounded-lg p-4 border shadow-sm cursor-help hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <TrendingDown className="h-4 w-4 text-blue-500" />
                              Menor Tasa de Devoluciones
                            </div>
                            <div className="flex items-center gap-3">
                              {lowestDev.logo ? (
                                <img src={lowestDev.logo} alt={lowestDev.name} className="w-10 h-10 object-contain" />
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
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[320px] text-sm">
                          <p className="font-semibold mb-1">📦 Menor Tasa de Devoluciones</p>
                          <p>Transportadora con menor porcentaje de paquetes devueltos. Recomendada para reducir costos de logística inversa y mejorar la experiencia del cliente.</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-background rounded-lg p-4 border shadow-sm cursor-help hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <AlertTriangle className="h-4 w-4 text-purple-500" />
                              Menor Tasa de Siniestros
                            </div>
                            <div className="flex items-center gap-3">
                              {lowestSin.logo ? (
                                <img src={lowestSin.logo} alt={lowestSin.name} className="w-10 h-10 object-contain" />
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
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[320px] text-sm">
                          <p className="font-semibold mb-1">🛡️ Menor Tasa de Siniestros</p>
                          <p>Transportadora con menor porcentaje de paquetes que pasaron a indemnización. Ideal para envíos de productos de alto valor.</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-background rounded-lg p-4 border shadow-sm cursor-help hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <DollarSign className="h-4 w-4 text-orange-500" />
                              Más Económica CON Recaudo
                            </div>
                            <div className="flex items-center gap-3">
                              {(() => {
                                const cheapestWithRecaudo = carriers
                                  .map(c => ({
                                    name: c,
                                    cost: getAverageCostFromDetail(c, 'costo_promedio_con_recaudo_detalle'),
                                    logo: getCarrierLogo(c)
                                  }))
                                  .filter(c => !isNaN(c.cost) && c.cost > 0)
                                  .sort((a, b) => a.cost - b.cost)[0];
                                
                                if (!cheapestWithRecaudo) return <p className="text-sm text-muted-foreground">Sin datos</p>;
                                
                                return (
                                  <>
                                    {cheapestWithRecaudo.logo ? (
                                      <img src={cheapestWithRecaudo.logo} alt={cheapestWithRecaudo.name} className="w-10 h-10 object-contain" />
                                    ) : (
                                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                                        <Truck className="h-5 w-5 text-primary" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-bold text-lg">{cheapestWithRecaudo.name}</p>
                                      <p className="text-xs text-orange-600 font-medium">
                                        {currency} {Math.round(cheapestWithRecaudo.cost).toLocaleString()}
                                      </p>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[320px] text-sm">
                          <p className="font-semibold mb-1">💰 Transportadora Más Económica CON Recaudo</p>
                          <p>Transportadora con el menor costo promedio de flete para envíos con recaudo. Ideal para optimizar costos en ventas COD.</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-background rounded-lg p-4 border shadow-sm cursor-help hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <DollarSign className="h-4 w-4 text-teal-500" />
                              Más Económica SIN Recaudo
                            </div>
                            <div className="flex items-center gap-3">
                              {(() => {
                                const cheapestWithoutRecaudo = carriers
                                  .map(c => ({
                                    name: c,
                                    cost: getAverageCostFromDetail(c, 'costo_promedio_sin_recaudo_detalle'),
                                    logo: getCarrierLogo(c)
                                  }))
                                  .filter(c => !isNaN(c.cost) && c.cost > 0)
                                  .sort((a, b) => a.cost - b.cost)[0];
                                
                                if (!cheapestWithoutRecaudo) return <p className="text-sm text-muted-foreground">Sin datos</p>;
                                
                                return (
                                  <>
                                    {cheapestWithoutRecaudo.logo ? (
                                      <img src={cheapestWithoutRecaudo.logo} alt={cheapestWithoutRecaudo.name} className="w-10 h-10 object-contain" />
                                    ) : (
                                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                                        <Truck className="h-5 w-5 text-primary" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-bold text-lg">{cheapestWithoutRecaudo.name}</p>
                                      <p className="text-xs text-teal-600 font-medium">
                                        {currency} {Math.round(cheapestWithoutRecaudo.cost).toLocaleString()}
                                      </p>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[320px] text-sm">
                          <p className="font-semibold mb-1">💵 Transportadora Más Económica SIN Recaudo</p>
                          <p>Transportadora con el menor costo promedio de flete para envíos prepagados (sin recaudo). Ideal para e-commerce con pago online.</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-background rounded-lg p-4 border shadow-sm cursor-help hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Truck className="h-4 w-4 text-primary" />
                              Total Transportadoras
                            </div>
                            <p className="font-bold text-3xl">{carriers.length}</p>
                            <p className="text-xs text-muted-foreground">Evaluadas en {monthName} {year}</p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[320px] text-sm">
                          <p className="font-semibold mb-1">🚚 Total Transportadoras Evaluadas</p>
                          <p>Número de transportadoras incluidas en este benchmark para {country}. Cada una fue evaluada en múltiples indicadores de desempeño.</p>
                        </TooltipContent>
                      </Tooltip>
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
                  Ordenado por puntuación ponderada: Devoluciones (60%), ANS (35%), Siniestros (5%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const ranked = carriers.map(c => {
                    const ans = parseFloat(String(getDisplayValue(c, 'cumplimiento_ans') || 0));
                    const dev = safeParseFloat(getDisplayValue(c, 'devoluciones'), 100);
                    const sin = safeParseFloat(getDisplayValue(c, 'siniestros'), 100);
                    // Pesos: Dev 60%, ANS 35%, Sin 5%
                    const score = (ans * 0.35) + ((100 - dev * 5) * 0.60) + ((100 - sin * 10) * 0.05);
                    return { name: c, ans, dev, sin, score, logo: getCarrierLogo(c) };
                  }).sort((a, b) => b.score - a.score);

                  return (
                    <div className="space-y-3">
                      {ranked.map((carrier, index) => (
                        <Tooltip key={carrier.name}>
                          <TooltipTrigger asChild>
                            <div className={`flex items-center gap-4 p-3 rounded-lg border cursor-help hover:shadow-md transition-shadow ${index === 0 ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200' : index === 1 ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200' : index === 2 ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200' : 'bg-background'}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-white' : index === 1 ? 'bg-slate-400 text-white' : index === 2 ? 'bg-orange-400 text-white' : 'bg-muted text-muted-foreground'}`}>
                                {index + 1}
                              </div>
                              {carrier.logo ? (
                                <img src={carrier.logo} alt={carrier.name} className="w-10 h-10 object-contain" />
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
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[350px] text-sm">
                            <p className="font-semibold mb-2">{carrier.name} - Posición #{index + 1}</p>
                            <div className="space-y-1">
                              <p>• <strong>ANS:</strong> {carrier.ans}% {carrier.ans >= 95 ? '✅ Excelente' : carrier.ans >= 85 ? '⚠️ Aceptable' : '❌ Bajo'}</p>
                              <p>• <strong>Devoluciones:</strong> {carrier.dev}% {carrier.dev <= 2 ? '✅ Excelente' : carrier.dev <= 5 ? '⚠️ Aceptable' : '❌ Alto'}</p>
                              <p>• <strong>Siniestros:</strong> {carrier.sin}% {carrier.sin <= 1 ? '✅ Excelente' : carrier.sin <= 3 ? '⚠️ Aceptable' : '❌ Alto'}</p>
                            </div>
                            <p className="mt-2 text-muted-foreground">Puntuación: ANS×35% + (100-Dev×5)×60% + (100-Sin×10)×5%</p>
                          </TooltipContent>
                        </Tooltip>
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
                    Cumplimiento a los Tiempos de Entrega (ANS)
                  </CardTitle>
                  <CardDescription className="text-xs">Porcentaje de entregas a tiempo. Meta: ≥95%</CardDescription>
                </CardHeader>
                <CardContent>
                  <ComparisonBar items={ansData} max={Math.max(...ansData.map(d => d.value), 1)} valueFormatter={(v) => `${v}%`} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-yellow-500" />
                    Devoluciones
                  </CardTitle>
                  <CardDescription className="text-xs">Porcentaje de paquetes devueltos. Ideal: ≤20%</CardDescription>
                </CardHeader>
                <CardContent>
                  <ComparisonBar items={devData} max={Math.max(...devData.map(d => d.value), 1)} valueFormatter={(v) => `${v}%`} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Siniestros
                  </CardTitle>
                  <CardDescription className="text-xs">Porcentaje de paquetes indemnizados. Ideal: ≤1%</CardDescription>
                </CardHeader>
                <CardContent>
                  <ComparisonBar items={sinData} max={Math.max(...sinData.map(d => d.value), 1)} valueFormatter={(v) => `${v}%`} />
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
                                <img src={logoUrl} alt={carrier} className="w-8 h-8 object-contain" />
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
                      <th className="text-center p-3 font-semibold">
                        <Tooltip>
                          <TooltipTrigger className="cursor-help flex items-center justify-center gap-1">
                            ANS <Info className="h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent>Cumplimiento a los tiempos de entrega. Meta: ≥95%</TooltipContent>
                        </Tooltip>
                      </th>
                      <th className="text-center p-3 font-semibold">
                        <Tooltip>
                          <TooltipTrigger className="cursor-help flex items-center justify-center gap-1">
                            Devoluciones <Info className="h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent>Porcentaje de paquetes devueltos. Ideal: ≤2%</TooltipContent>
                        </Tooltip>
                      </th>
                      <th className="text-center p-3 font-semibold">
                        <Tooltip>
                          <TooltipTrigger className="cursor-help flex items-center justify-center gap-1">
                            Siniestros <Info className="h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent>Porcentaje de paquetes indemnizados. Ideal: ≤1%</TooltipContent>
                        </Tooltip>
                      </th>
                      <th className="text-center p-3 font-semibold">
                        <Tooltip>
                          <TooltipTrigger className="cursor-help flex items-center justify-center gap-1">
                            Estado <Info className="h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px]">
                            <p className="font-semibold mb-1">Estado General de la Transportadora</p>
                            <p><strong>Excelente:</strong> ANS ≥90%, Devoluciones ≤5%, Siniestros ≤1%</p>
                            <p><strong>Aceptable:</strong> ANS ≥80%, Devoluciones ≤10%, Siniestros ≤3%</p>
                            <p><strong>Revisar:</strong> No cumple los criterios mínimos, requiere análisis</p>
                          </TooltipContent>
                        </Tooltip>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {carriers.map(carrier => {
                      const logoUrl = getCarrierLogo(carrier);
                      const ansCell = getCellValue(carrier, 'cumplimiento_ans');
                      const devCell = getCellValue(carrier, 'devoluciones');
                      const sinCell = getCellValue(carrier, 'siniestros');
                      
                      const ans = parseFloat(String(ansCell.value || 0));
                      const dev = parseFloat(String(devCell.value || 0));
                      const sin = parseFloat(String(sinCell.value || 0));
                      
                      // Use user-defined colors if available, otherwise auto-calculate
                      const ansColor = ansCell.color && ansCell.color !== 'none' ? ansCell.color : (ans >= 95 ? 'green' : ans >= 85 ? 'yellow' : 'red');
                      const devColor = devCell.color && devCell.color !== 'none' ? devCell.color : (dev <= 2 ? 'green' : dev <= 5 ? 'yellow' : 'red');
                      const sinColor = sinCell.color && sinCell.color !== 'none' ? sinCell.color : (sin <= 1 ? 'green' : sin <= 3 ? 'yellow' : 'red');
                      
                      const colorToBadgeVariant = (color: string) => 
                        color === 'green' ? 'default' : color === 'yellow' ? 'secondary' : 'destructive';
                      
                      const isGood = ans >= 90 && dev <= 5 && sin <= 1;
                      const isWarning = ans >= 80 && dev <= 10 && sin <= 3;
                      
                      return (
                        <tr key={carrier} className="border-b hover:bg-muted/30">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {logoUrl ? (
                                <img src={logoUrl} alt={carrier} className="w-8 h-8 object-contain" />
                              ) : (
                                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                  <Truck className="h-4 w-4 text-primary" />
                                </div>
                              )}
                              <span className="font-medium">{carrier}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={colorToBadgeVariant(ansColor)} className={ansColor === 'green' ? 'bg-green-500' : ''}>
                              {ans}%
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={colorToBadgeVariant(devColor)} className={devColor === 'green' ? 'bg-green-500' : ''}>
                              {dev}%
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={colorToBadgeVariant(sinColor)} className={sinColor === 'green' ? 'bg-green-500' : ''}>
                              {sin}%
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant={isGood ? 'default' : isWarning ? 'secondary' : 'destructive'}
                                  className={`gap-1 cursor-help ${isGood ? 'bg-green-500' : ''}`}
                                >
                                  {isGood ? (
                                    <><CheckCircle className="h-3 w-3" /> Excelente</>
                                  ) : isWarning ? (
                                    <><AlertTriangle className="h-3 w-3" /> Aceptable</>
                                  ) : (
                                    <><XCircle className="h-3 w-3" /> Revisar</>
                                  )}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[320px]">
                                {isGood ? (
                                  <p>✅ <strong>Excelente:</strong> Cumple todos los criterios óptimos. ANS ≥90%, Devoluciones ≤5%, Siniestros ≤1%</p>
                                ) : isWarning ? (
                                  <p>⚠️ <strong>Aceptable:</strong> Cumple criterios mínimos pero puede mejorar. ANS ≥80%, Devoluciones ≤10%, Siniestros ≤3%</p>
                                ) : (
                                  <p>❌ <strong>Revisar:</strong> No cumple los criterios mínimos. Se recomienda analizar el desempeño y considerar alternativas o negociar mejoras.</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
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
          <TabsContent
            value="detailed"
            forceMount={isPrintMode ? true : undefined}
            className={isPrintMode
              ? 'px-4 mt-12 pt-12 border-t-2'
              : 'w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] px-4'
            }
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Información Completa por Transportadora</h2>
              <p className="text-muted-foreground">Ordenado por % de devoluciones (menor a mayor)</p>
            </div>

            {(() => {
              // Sort carriers by devoluciones (lowest to highest)
              const sortedCarriers = [...carriers].sort((a, b) => {
                const devA = safeParseFloat(getDisplayValue(a, 'devoluciones'), 100);
                const devB = safeParseFloat(getDisplayValue(b, 'devoluciones'), 100);
                return devA - devB;
              });

              return (
                <Card className="overflow-hidden mx-auto">
                  <CardContent className="p-0">
                    <div className={`relative ${isPrintMode ? 'overflow-visible' : 'overflow-auto max-h-[70vh]'}`}>
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-4 font-semibold min-w-[200px] sticky left-0 bg-slate-100 dark:bg-slate-800 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Campo</th>
                            {sortedCarriers.map(carrier => {
                              const logoUrl = getCarrierLogo(carrier);
                              const dev = parseFloat(String(getDisplayValue(carrier, 'devoluciones') || 0));
                              return (
                                <th key={carrier} className="text-center p-4 font-semibold min-w-[180px] bg-muted/50">
                                  <div className="flex flex-col items-center gap-2">
                                    {logoUrl ? (
                                      <img src={logoUrl} alt={carrier} className="w-10 h-10 object-contain" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Truck className="h-5 w-5 text-primary" />
                                      </div>
                                    )}
                                    <span>{carrier}</span>
                                    <Badge variant="outline" className="text-xs">Dev: {dev}%</Badge>
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {fields.filter(field => {
                            // Hide row if ALL carriers have empty values for this field
                            return sortedCarriers.some(carrier => {
                              const v = getCellValue(carrier, field.id).value;
                              if (v === null || v === undefined) return false;
                              if (typeof v === 'boolean') return true;
                              if (typeof v === 'object') {
                                return Object.values(v).some(sv => sv !== '' && sv !== null && sv !== undefined);
                              }
                              return String(v).trim() !== '';
                            });
                          }).map((field, fieldIndex) => (
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
                              {sortedCarriers.map(carrier => {
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
              );
            })()}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-muted-foreground text-sm py-6 border-t mt-8">
          <p>Reporte generado por <strong>Efficommerce</strong></p>
          <p>{monthName} {year} - {country}</p>
        </div>
      </main>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        country={country}
        year={year}
        month={month}
        onDownloadHTML={downloadHTML}
      />
    </div>
  );
}
