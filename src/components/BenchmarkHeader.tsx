import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { countries, monthNames, years } from "@/lib/data";
import { FileDown, Save, Loader2, Settings, FolderOpen } from "lucide-react";
import efficommerceLogo from "@/assets/efficommerce-logo.png";

interface BenchmarkHeaderProps {
  country: string;
  setCountry: (country: string) => void;
  month: number;
  setMonth: (month: number) => void;
  year: number;
  setYear: (year: number) => void;
  isSaving: boolean;
}

export function BenchmarkHeader({
  country,
  setCountry,
  month,
  setMonth,
  year,
  setYear,
  isSaving,
}: BenchmarkHeaderProps) {
  const reportUrl = `/reporte?country=${encodeURIComponent(country)}&month=${month}&year=${year}`;
  
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
