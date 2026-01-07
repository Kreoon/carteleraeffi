import { useState, useCallback, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FieldDefinition, currencyByCountry, CellValue } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface EditableCellProps {
  field: FieldDefinition;
  cellValue: CellValue;
  onChange: (value: CellValue) => void;
  country: string;
}

const colorOptions = [
  { value: 'none', label: 'Sin color', className: 'bg-background border-border' },
  { value: 'green', label: 'Verde', className: 'bg-success-bg border-success' },
  { value: 'yellow', label: 'Amarillo', className: 'bg-warning-bg border-warning' },
  { value: 'red', label: 'Rojo', className: 'bg-danger-bg border-danger' },
] as const;

export function EditableCell({ field, cellValue, onChange, country }: EditableCellProps) {
  const [localValue, setLocalValue] = useState(cellValue.value);
  const [localNote, setLocalNote] = useState(cellValue.note || '');
  const [localColor, setLocalColor] = useState<CellValue['color']>(cellValue.color || 'none');
  const currency = currencyByCountry[country] || "COP";

  useEffect(() => {
    setLocalValue(cellValue.value);
    setLocalNote(cellValue.note || '');
    setLocalColor(cellValue.color || 'none');
  }, [cellValue]);

  const handleBlur = useCallback(() => {
    if (localValue !== cellValue.value || localNote !== cellValue.note || localColor !== cellValue.color) {
      onChange({ value: localValue, note: localNote, color: localColor });
    }
  }, [localValue, localNote, localColor, cellValue, onChange]);

  const handleColorChange = useCallback((color: CellValue['color']) => {
    setLocalColor(color);
    onChange({ value: localValue, note: localNote, color });
  }, [localValue, localNote, onChange]);

  const handleNoteBlur = useCallback(() => {
    if (localNote !== cellValue.note) {
      onChange({ value: localValue, note: localNote, color: localColor });
    }
  }, [localValue, localNote, localColor, cellValue, onChange]);

  const getColorClass = () => {
    switch (localColor) {
      case 'green': return 'bg-success-bg';
      case 'yellow': return 'bg-warning-bg';
      case 'red': return 'bg-danger-bg';
      default: return '';
    }
  };

  const ColorSelector = () => (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className={cn(
            "w-5 h-5 rounded border-2 flex-shrink-0 hover:scale-110 transition-transform",
            localColor === 'green' && 'bg-success border-success',
            localColor === 'yellow' && 'bg-warning border-warning',
            localColor === 'red' && 'bg-danger border-danger',
            localColor === 'none' && 'bg-muted border-border'
          )}
          title="Cambiar color"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 bg-popover border-border" align="start">
        <div className="flex gap-2">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleColorChange(option.value)}
              className={cn(
                "w-6 h-6 rounded border-2 hover:scale-110 transition-transform",
                option.value === 'green' && 'bg-success border-success',
                option.value === 'yellow' && 'bg-warning border-warning',
                option.value === 'red' && 'bg-danger border-danger',
                option.value === 'none' && 'bg-muted border-border',
                localColor === option.value && 'ring-2 ring-primary ring-offset-1'
              )}
              title={option.label}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  if (field.type === 'boolean') {
    return (
      <div className={cn("p-2 rounded", getColorClass())}>
        <div className="flex items-center gap-2">
          <ColorSelector />
          <Switch
            checked={Boolean(localValue)}
            onCheckedChange={(checked) => {
              setLocalValue(checked);
              onChange({ value: checked, note: localNote, color: localColor });
            }}
          />
          <span className="text-sm text-foreground">
            {Boolean(localValue) ? 'Sí' : 'No'}
          </span>
        </div>
        <Textarea
          value={localNote}
          onChange={(e) => setLocalNote(e.target.value)}
          onBlur={handleNoteBlur}
          className="mt-2 min-h-[50px] text-xs resize-none border-border bg-background/80"
          placeholder="Nota adicional..."
        />
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className={cn("p-2 rounded", getColorClass())}>
        <div className="flex items-start gap-2 mb-2">
          <ColorSelector />
        </div>
        <Textarea
          value={String(localValue || '')}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          className="min-h-[80px] text-sm resize-none border-border bg-background/80"
          placeholder="Escribir..."
        />
      </div>
    );
  }

  if (field.type === 'percentage') {
    return (
      <div className={cn("p-2 rounded", getColorClass())}>
        <div className="flex items-center gap-2 mb-2">
          <ColorSelector />
          <div className="relative flex-1">
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={String(localValue || '')}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleBlur}
              className="pr-8 text-sm border-border bg-background/80"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
        </div>
        <Textarea
          value={localNote}
          onChange={(e) => setLocalNote(e.target.value)}
          onBlur={handleNoteBlur}
          className="min-h-[50px] text-xs resize-none border-border bg-background/80"
          placeholder="Nota adicional..."
        />
      </div>
    );
  }

  if (field.type === 'currency') {
    return (
      <div className={cn("p-2 rounded", getColorClass())}>
        <div className="flex items-center gap-2 mb-2">
          <ColorSelector />
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {currency}
            </span>
            <Input
              type="number"
              step="100"
              min="0"
              value={String(localValue || '')}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleBlur}
              className="pl-12 text-sm border-border bg-background/80"
              placeholder="0"
            />
          </div>
        </div>
        <Textarea
          value={localNote}
          onChange={(e) => setLocalNote(e.target.value)}
          onBlur={handleNoteBlur}
          className="min-h-[50px] text-xs resize-none border-border bg-background/80"
          placeholder="Nota adicional..."
        />
      </div>
    );
  }

  // Default text input
  return (
    <div className={cn("p-2 rounded", getColorClass())}>
      <div className="flex items-center gap-2 mb-2">
        <ColorSelector />
        <Input
          type="text"
          value={String(localValue || '')}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          className="text-sm border-border bg-background/80 flex-1"
          placeholder="Escribir..."
        />
      </div>
      <Textarea
        value={localNote}
        onChange={(e) => setLocalNote(e.target.value)}
        onBlur={handleNoteBlur}
        className="min-h-[50px] text-xs resize-none border-border bg-background/80"
        placeholder="Nota adicional..."
      />
    </div>
  );
}
