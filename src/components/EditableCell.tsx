import { useState, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldDefinition, currencyByCountry, CellValue } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Eye, Edit } from 'lucide-react';
import { MarkdownToolbar } from './MarkdownToolbar';

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
  const [localValue, setLocalValue] = useState<any>(cellValue.value);
  const [localNote, setLocalNote] = useState(cellValue.note || '');
  const [localColor, setLocalColor] = useState<CellValue['color']>(cellValue.color || 'none');
  const [isEditing, setIsEditing] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currency = currencyByCountry[country] || "COP";

  useEffect(() => {
    setLocalValue(cellValue.value);
    setLocalNote(cellValue.note || '');
    setLocalColor(cellValue.color || 'none');
  }, [cellValue]);

  const handleValueChange = useCallback((newValue: any) => {
    setLocalValue(newValue);
    onChange({ value: newValue, note: localNote, color: localColor });
  }, [localNote, localColor, onChange]);

  const handleNoteChange = useCallback((newNote: string) => {
    setLocalNote(newNote);
    onChange({ value: localValue, note: newNote, color: localColor });
  }, [localValue, localColor, onChange]);

  const handleColorChange = useCallback((color: CellValue['color']) => {
    setLocalColor(color);
    onChange({ value: localValue, note: localNote, color });
  }, [localValue, localNote, onChange]);

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

  const NoteField = () => {
    if (field.hideNote) return null;
    return (
      <Textarea
        value={localNote}
        onChange={(e) => handleNoteChange(e.target.value)}
        className="min-h-[50px] text-xs resize-none border-border bg-background/80"
        placeholder="Nota adicional..."
      />
    );
  };

  if (field.type === 'boolean') {
    return (
      <div className={cn("p-2 rounded", getColorClass())}>
        <div className="flex items-center gap-2">
          <ColorSelector />
          <Switch
            checked={Boolean(localValue)}
            onCheckedChange={(checked) => handleValueChange(checked)}
          />
          <span className="text-sm text-foreground">
            {Boolean(localValue) ? 'Sí' : 'No'}
          </span>
        </div>
        {!field.hideNote && (
          <div className="mt-2">
            <NoteField />
          </div>
        )}
      </div>
    );
  }

  if (field.type === 'textarea') {
    const hasContent = String(localValue || '').trim().length > 0;

    return (
      <div className={cn("p-2 rounded", getColorClass())}>
        <div className="flex items-center gap-2 mb-2">
          <ColorSelector />
          <div className="flex gap-1 ml-auto">
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              className="h-6 px-2"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant={!isEditing ? "default" : "outline"}
              size="sm"
              className="h-6 px-2"
              onClick={() => setIsEditing(false)}
              disabled={!hasContent}
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {isEditing ? (
          <div className="space-y-0">
            <MarkdownToolbar 
              textareaRef={textareaRef}
              value={String(localValue || '')}
              onChange={handleValueChange}
            />
            <Textarea
              ref={textareaRef}
              value={String(localValue || '')}
              onChange={(e) => handleValueChange(e.target.value)}
              className="min-h-[100px] text-sm resize-y border-border bg-background/80 font-mono rounded-t-none border-t-0"
              placeholder="Escribe usando Markdown..."
            />
          </div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert bg-background/80 border border-border rounded-md p-3 min-h-[100px] overflow-auto">
            <ReactMarkdown
              components={{
                table: ({ children }) => (
                  <table className="border-collapse border border-border text-xs w-full">{children}</table>
                ),
                th: ({ children }) => (
                  <th className="border border-border bg-muted px-2 py-1 text-left font-semibold">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-2 py-1">{children}</td>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-4 my-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-4 my-1">{children}</ol>
                ),
                p: ({ children }) => (
                  <p className="my-1">{children}</p>
                ),
              }}
            >
              {String(localValue || '')}
            </ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  if (field.type === 'multi-currency') {
    const subFields = field.subFields || [];
    const parsedValue: Record<string, string> = typeof localValue === 'object' && localValue !== null 
      ? (localValue as Record<string, string>)
      : {};

    const handleSubFieldChange = (subField: string, val: string) => {
      const newValue = { ...parsedValue, [subField]: val };
      handleValueChange(newValue);
    };

    return (
      <div className={cn("p-2 rounded", getColorClass())}>
        <div className="flex items-start gap-2 mb-2">
          <ColorSelector />
        </div>
        <div className="space-y-2">
          {subFields.map((subField) => (
            <div key={subField} className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground min-w-[80px] flex-shrink-0">
                {subField}:
              </Label>
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {currency}
                </span>
                <Input
                  type="number"
                  step="100"
                  min="0"
                  value={parsedValue[subField] || ''}
                  onChange={(e) => handleSubFieldChange(subField, e.target.value)}
                  className="pl-10 text-sm border-border bg-background/80 h-8"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>
        {!field.hideNote && (
          <div className="mt-2">
            <NoteField />
          </div>
        )}
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
              onChange={(e) => handleValueChange(e.target.value)}
              className="pr-8 text-sm border-border bg-background/80"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
        </div>
        {!field.hideNote && <NoteField />}
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
              onChange={(e) => handleValueChange(e.target.value)}
              className="pl-12 text-sm border-border bg-background/80"
              placeholder="0"
            />
          </div>
        </div>
        {!field.hideNote && <NoteField />}
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
          onChange={(e) => handleValueChange(e.target.value)}
          className="text-sm border-border bg-background/80 flex-1"
          placeholder="Escribir..."
        />
      </div>
      {!field.hideNote && <NoteField />}
    </div>
  );
}
