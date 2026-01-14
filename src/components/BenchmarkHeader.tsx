import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { countries, monthNames, years } from "@/lib/data";
import { FileDown, Save, Loader2, Settings, FolderOpen, Copy, Calendar } from "lucide-react";
import { toast } from "sonner";
import efficommerceLogo from "@/assets/efficommerce-logo.png";

interface BenchmarkHeaderProps {
  country: string;
  setCountry: (country: string) => void;
  month: number;
  setMonth: (month: number) => void;
  year: number;
  setYear: (year: number) => void;
  isSaving: boolean;
  onCopyFromPeriod?: (country: string, year: number, month: number) => boolean;
  getPreviousMonth?: () => { month: number; year: number };
  hasPreviousMonthData?: () => boolean;
  getSavedPeriods?: () => Array<{ country: string; year: number; month: number }>;
}

export function BenchmarkHeader({
  country,
  setCountry,
  month,
  setMonth,
  year,
  setYear,
  isSaving,
  onCopyFromPeriod,
  getPreviousMonth,
  hasPreviousMonthData,
  getSavedPeriods,
}: BenchmarkHeaderProps) {
  const reportUrl = `/reporte?country=${encodeURIComponent(country)}&month=${month}&year=${year}`;
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [selectedSourceCountry, setSelectedSourceCountry] = useState(country);
  const [selectedSourceMonth, setSelectedSourceMonth] = useState<number | null>(null);
  const [selectedSourceYear, setSelectedSourceYear] = useState<number | null>(null);

  const handleCopyPreviousMonth = () => {
    if (getPreviousMonth && onCopyFromPeriod) {
      const { month: prevMonth, year: prevYear } = getPreviousMonth();
      const success = onCopyFromPeriod(country, prevYear, prevMonth);
      if (success) {
        toast.success(`Datos copiados de ${monthNames[prevMonth]} ${prevYear}`);
      } else {
        toast.error(`No hay datos para ${monthNames[prevMonth]} ${prevYear}`);
      }
    }
  };

  const handleCopyFromSelected = () => {
    if (selectedSourceMonth !== null && selectedSourceYear !== null && onCopyFromPeriod) {
      const success = onCopyFromPeriod(selectedSourceCountry, selectedSourceYear, selectedSourceMonth);
      if (success) {
        toast.success(`Datos copiados de ${monthNames[selectedSourceMonth]} ${selectedSourceYear}`);
        setCopyDialogOpen(false);
      } else {
        toast.error(`No hay datos disponibles para ese período`);
      }
    }
  };

  const savedPeriods = getSavedPeriods?.() || [];
  const availablePeriods = savedPeriods.filter(p => 
    !(p.country === country && p.year === year && p.month === month)
  );

  const previousMonthInfo = getPreviousMonth?.();
  const hasPrevData = hasPreviousMonthData?.() || false;
  
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <img 
            src={efficommerceLogo} 
            alt="Efficommerce" 
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Benchmark Logístico
            </h1>
            <p className="text-sm text-muted-foreground">
              Comparación de transportadoras
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Seleccionar país" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((m, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-[100px] bg-background">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Copy from previous month button */}
          {onCopyFromPeriod && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPreviousMonth}
                disabled={!hasPrevData}
                className="gap-1"
                title={hasPrevData 
                  ? `Copiar datos de ${monthNames[previousMonthInfo?.month || 0]} ${previousMonthInfo?.year}`
                  : 'No hay datos del mes anterior'
                }
              >
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copiar mes anterior</span>
              </Button>

              <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Otro período</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Copiar datos de otro período</DialogTitle>
                    <DialogDescription>
                      Selecciona el período del cual deseas copiar los datos. Esto reemplazará todos los datos actuales.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">País</label>
                      <Select value={selectedSourceCountry} onValueChange={setSelectedSourceCountry}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Mes</label>
                        <Select 
                          value={selectedSourceMonth?.toString() || ''} 
                          onValueChange={(v) => setSelectedSourceMonth(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {monthNames.map((m, i) => (
                              <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Año</label>
                        <Select 
                          value={selectedSourceYear?.toString() || ''} 
                          onValueChange={(v) => setSelectedSourceYear(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((y) => (
                              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {availablePeriods.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Períodos con datos guardados:</label>
                        <div className="flex flex-wrap gap-2">
                          {availablePeriods.map((p, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSourceCountry(p.country);
                                setSelectedSourceMonth(p.month);
                                setSelectedSourceYear(p.year);
                              }}
                              className={`text-xs ${
                                selectedSourceCountry === p.country && 
                                selectedSourceMonth === p.month && 
                                selectedSourceYear === p.year 
                                  ? 'border-primary bg-primary/10' 
                                  : ''
                              }`}
                            >
                              {p.country} - {monthNames[p.month]} {p.year}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCopyDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCopyFromSelected}
                      disabled={selectedSourceMonth === null || selectedSourceYear === null}
                    >
                      Copiar datos
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <div className="flex items-center gap-2">
            {isSaving && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </div>
            )}
            {!isSaving && (
              <div className="flex items-center gap-1 text-sm text-success">
                <Save className="h-4 w-4" />
                <span>Guardado</span>
              </div>
            )}
          </div>

          <Link to="/reportes-guardados">
            <Button variant="outline" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Reportes Guardados
            </Button>
          </Link>

          <Link to="/configuracion">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </Button>
          </Link>
          
          <Link to={reportUrl}>
            <Button className="gap-2">
              <FileDown className="h-4 w-4" />
              Generar Reporte
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
