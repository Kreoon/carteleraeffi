import { useState } from 'react';
import { Copy, Check, Link as LinkIcon, Code, FileCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  country: string;
  year: number;
  month: number;
  onDownloadHTML?: () => void;
}

export function ShareDialog({ open, onOpenChange, country, year, month, onDownloadHTML }: ShareDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://carteleraeffi.vercel.app';

  const embedUrl = `${origin}/embed/reporte?country=${encodeURIComponent(country)}&month=${month}&year=${year}&saved=true`;
  const iframeSnippet = `<iframe src="${embedUrl}" width="100%" height="1800" style="border:0;max-width:100%" loading="lazy" title="Cartelera ${country} ${month}/${year}"></iframe>`;
  const scriptSnippet = `<div data-cartelera-report data-country="${country}" data-month="${month}" data-year="${year}"></div>\n<script src="${origin}/embed.js" async></script>`;

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success('Copiado al portapapeles');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compartir reporte</DialogTitle>
          <DialogDescription>
            Elige cómo compartir el reporte de {country} — {month}/{year}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="iframe" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="iframe" className="gap-2">
              <Code className="h-4 w-4" /> Iframe
            </TabsTrigger>
            <TabsTrigger value="script" className="gap-2">
              <FileCode className="h-4 w-4" /> Script
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <LinkIcon className="h-4 w-4" /> URL
            </TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>

          <TabsContent value="iframe" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pega este código en cualquier web para mostrar el reporte embebido.
            </p>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all">
                {iframeSnippet}
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 gap-2"
                onClick={() => copyToClipboard(iframeSnippet, 'iframe')}
                aria-label="Copiar iframe"
              >
                {copied === 'iframe' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copiar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="script" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Loader con altura automática. Ideal si usas WordPress, Webflow o un CMS.
            </p>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all">
                {scriptSnippet}
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 gap-2"
                onClick={() => copyToClipboard(scriptSnippet, 'script')}
                aria-label="Copiar script"
              >
                {copied === 'script' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copiar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enlace directo al reporte sin navegación (ideal para compartir por WhatsApp/Email).
            </p>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all">
                {embedUrl}
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 gap-2"
                onClick={() => copyToClipboard(embedUrl, 'url')}
                aria-label="Copiar URL"
              >
                {copied === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copiar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="html" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Descarga un archivo HTML autocontenido (con imágenes embebidas) para alojarlo donde quieras.
            </p>
            {onDownloadHTML && (
              <Button onClick={onDownloadHTML} className="w-full">
                Descargar HTML autocontenido
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
