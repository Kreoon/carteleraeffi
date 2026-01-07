import { useState, useCallback, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FieldDefinition, currencyByCountry } from '@/lib/data';
import { cn } from '@/lib/utils';

interface EditableCellProps {
  field: FieldDefinition;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
  country: string;
}

export function EditableCell({ field, value, onChange, country }: EditableCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const currency = currencyByCountry[country] || "COP";

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = useCallback(() => {
    if (localValue !== value) {
      onChange(localValue);
    }
  }, [localValue, value, onChange]);

  const handleChange = useCallback((newValue: string | number | boolean) => {
    setLocalValue(newValue);
  }, []);

  // Performance indicator color for percentage fields
  const getPerformanceColor = (val: string | number) => {
    if (field.type !== 'percentage') return '';
    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(numVal)) return '';
    
    // For devoluciones and siniestros, lower is better
    if (field.id === 'devoluciones' || field.id === 'siniestros') {
      if (numVal <= 2) return 'bg-success-bg border-success';
      if (numVal <= 5) return 'bg-warning-bg border-warning';
      return 'bg-danger-bg border-danger';
    }
    
    // For cumplimiento_ans, higher is better
    if (field.id === 'cumplimiento_ans') {
      if (numVal >= 95) return 'bg-success-bg border-success';
      if (numVal >= 85) return 'bg-warning-bg border-warning';
      return 'bg-danger-bg border-danger';
    }
    
    return '';
  };

  if (field.type === 'boolean') {
    return (
      <div className="flex items-center justify-center h-full py-2">
        <Switch
          checked={Boolean(localValue)}
          onCheckedChange={(checked) => {
            setLocalValue(checked);
            onChange(checked);
          }}
        />
        <span className="ml-2 text-sm text-foreground">
          {Boolean(localValue) ? 'Sí' : 'No'}
        </span>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <Textarea
        value={String(localValue || '')}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className="min-h-[80px] text-sm resize-none border-border bg-background"
        placeholder="Escribir..."
      />
    );
  }

  if (field.type === 'percentage') {
    return (
      <div className="relative">
        <Input
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={String(localValue || '')}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className={cn(
            "pr-8 text-sm border-border bg-background",
            getPerformanceColor(localValue as string | number)
          )}
          placeholder="0.00"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          %
        </span>
      </div>
    );
  }

  if (field.type === 'currency') {
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {currency}
        </span>
        <Input
          type="number"
          step="100"
          min="0"
          value={String(localValue || '')}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className="pl-12 text-sm border-border bg-background"
          placeholder="0"
        />
      </div>
    );
  }

  // Default text input
  return (
    <Input
      type="text"
      value={String(localValue || '')}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      className="text-sm border-border bg-background"
      placeholder="Escribir..."
    />
  );
}
