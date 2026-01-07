import { Button } from "@/components/ui/button";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Table, 
  Heading1, 
  Heading2, 
  Heading3,
  Code,
  Quote,
  Minus,
  Link
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
}

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  action: (text: string, start: number, end: number) => { newText: string; newCursorPos: number };
}

export function MarkdownToolbar({ textareaRef, value, onChange }: MarkdownToolbarProps) {
  const insertMarkdown = (action: ToolbarButton['action']) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const { newText, newCursorPos } = action(value, start, end);
    
    onChange(newText);
    
    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const wrapSelection = (prefix: string, suffix: string = prefix) => 
    (text: string, start: number, end: number) => {
      const selectedText = text.substring(start, end);
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = `${before}${prefix}${selectedText}${suffix}${after}`;
      return { 
        newText, 
        newCursorPos: start + prefix.length + selectedText.length + suffix.length 
      };
    };

  const insertAtLineStart = (prefix: string) => 
    (text: string, start: number, end: number) => {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const before = text.substring(0, lineStart);
      const after = text.substring(lineStart);
      const newText = `${before}${prefix}${after}`;
      return { 
        newText, 
        newCursorPos: start + prefix.length 
      };
    };

  const insertTable = () => 
    (text: string, start: number, _end: number) => {
      const tableTemplate = `
| Columna 1 | Columna 2 | Columna 3 |
|-----------|-----------|-----------|
| Dato 1    | Dato 2    | Dato 3    |
| Dato 4    | Dato 5    | Dato 6    |
`;
      const before = text.substring(0, start);
      const after = text.substring(start);
      const newText = `${before}${tableTemplate}${after}`;
      return { newText, newCursorPos: start + tableTemplate.length };
    };

  const insertLink = () => 
    (text: string, start: number, end: number) => {
      const selectedText = text.substring(start, end) || 'texto';
      const before = text.substring(0, start);
      const after = text.substring(end);
      const linkTemplate = `[${selectedText}](url)`;
      const newText = `${before}${linkTemplate}${after}`;
      return { newText, newCursorPos: start + linkTemplate.length };
    };

  const buttons: ToolbarButton[] = [
    { icon: <Bold className="h-3.5 w-3.5" />, label: "Negrita", action: wrapSelection("**") },
    { icon: <Italic className="h-3.5 w-3.5" />, label: "Cursiva", action: wrapSelection("*") },
    { icon: <Heading1 className="h-3.5 w-3.5" />, label: "Título 1", action: insertAtLineStart("# ") },
    { icon: <Heading2 className="h-3.5 w-3.5" />, label: "Título 2", action: insertAtLineStart("## ") },
    { icon: <Heading3 className="h-3.5 w-3.5" />, label: "Título 3", action: insertAtLineStart("### ") },
    { icon: <List className="h-3.5 w-3.5" />, label: "Lista", action: insertAtLineStart("- ") },
    { icon: <ListOrdered className="h-3.5 w-3.5" />, label: "Lista numerada", action: insertAtLineStart("1. ") },
    { icon: <Quote className="h-3.5 w-3.5" />, label: "Cita", action: insertAtLineStart("> ") },
    { icon: <Code className="h-3.5 w-3.5" />, label: "Código", action: wrapSelection("`") },
    { icon: <Minus className="h-3.5 w-3.5" />, label: "Línea horizontal", action: insertAtLineStart("\n---\n") },
    { icon: <Link className="h-3.5 w-3.5" />, label: "Enlace", action: insertLink() },
    { icon: <Table className="h-3.5 w-3.5" />, label: "Tabla", action: insertTable() },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap gap-0.5 p-1.5 bg-muted/50 border border-border rounded-t-md">
        {buttons.map((button, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-background"
                onClick={() => insertMarkdown(button.action)}
              >
                {button.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {button.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
