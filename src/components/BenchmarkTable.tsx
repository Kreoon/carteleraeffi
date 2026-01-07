import { fields, carriersByCountry, FieldDefinition, BenchmarkData, CellValue, normalizeCellValue } from '@/lib/data';
import { EditableCell } from './EditableCell';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface BenchmarkTableProps {
  country: string;
  data: BenchmarkData;
  onCellChange: (carrier: string, fieldId: string, value: CellValue) => void;
}

export function BenchmarkTable({ country, data, onCellChange }: BenchmarkTableProps) {
  const carriers = carriersByCountry[country] || [];

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-max">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-secondary">
              <th className="sticky left-0 z-20 bg-secondary min-w-[280px] max-w-[320px] p-3 text-left text-sm font-semibold text-secondary-foreground border-b border-r border-border">
                Campo
              </th>
              {carriers.map((carrier) => (
                <th 
                  key={carrier} 
                  className="min-w-[250px] max-w-[300px] p-3 text-center text-sm font-semibold text-secondary-foreground border-b border-r border-border"
                >
                  {carrier}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <>
                {field.id === 'cumplimiento_ans' && (
                  <SectionHeader 
                    key="section-indicadores"
                    title="INDICADORES DE SERVICIO" 
                    colSpan={carriers.length + 1} 
                  />
                )}
                {field.id === 'beneficios' && (
                  <SectionHeader 
                    key="section-beneficios"
                    title="BENEFICIOS Y DIFERENCIALES" 
                    colSpan={carriers.length + 1} 
                  />
                )}
                <FieldRow
                  key={field.id}
                  field={field}
                  carriers={carriers}
                  data={data}
                  country={country}
                  onCellChange={onCellChange}
                  isEven={index % 2 === 0}
                />
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  colSpan: number;
}

function SectionHeader({ title, colSpan }: SectionHeaderProps) {
  return (
    <tr>
      <td 
        colSpan={colSpan} 
        className="bg-primary/10 p-3 text-sm font-bold text-primary border-b border-border"
      >
        {title}
      </td>
    </tr>
  );
}

interface FieldRowProps {
  field: FieldDefinition;
  carriers: string[];
  data: BenchmarkData;
  country: string;
  onCellChange: (carrier: string, fieldId: string, value: CellValue) => void;
  isEven: boolean;
}

function FieldRow({ field, carriers, data, country, onCellChange, isEven }: FieldRowProps) {
  return (
    <tr className={isEven ? 'bg-card' : 'bg-background'}>
      <td className={`sticky left-0 z-10 min-w-[280px] max-w-[320px] p-3 border-b border-r border-border font-medium text-sm text-foreground ${isEven ? 'bg-card' : 'bg-background'}`}>
        <div className="flex items-start gap-2">
          <span className="flex-1">{field.label}</span>
          {field.description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px]">
                <p className="text-xs">{field.description}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </td>
      {carriers.map((carrier) => (
        <td 
          key={carrier} 
          className="min-w-[250px] max-w-[300px] p-1 border-b border-r border-border align-top"
        >
          <EditableCell
            field={field}
            cellValue={normalizeCellValue(data[carrier]?.[field.id])}
            onChange={(value) => onCellChange(carrier, field.id, value)}
            country={country}
          />
        </td>
      ))}
    </tr>
  );
}
