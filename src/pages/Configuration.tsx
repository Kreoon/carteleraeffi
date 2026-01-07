import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Trash2, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { countries, carriersByCountry } from '@/lib/data';
import { useBenchmarkConfig } from '@/hooks/useBenchmarkConfig';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import efficommerceLogo from "@/assets/efficommerce-logo.png";

export default function Configuration() {
  const { 
    isLoading, 
    isSaving, 
    getCountryBanner, 
    getCarrierLogo, 
    saveConfig, 
    deleteConfig,
    getAllCarriers 
  } = useBenchmarkConfig();

  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const handleImageUpload = async (
    file: File,
    configType: 'country_banner' | 'carrier_logo',
    configKey: string
  ) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande (máximo 5MB)');
      return;
    }

    setUploadingFor(`${configType}-${configKey}`);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${configType}/${configKey.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('markdown-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('markdown-images')
        .getPublicUrl(fileName);

      await saveConfig(configType, configKey, urlData.publicUrl);
      toast.success('Imagen guardada correctamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setUploadingFor(null);
    }
  };

  const handleDelete = async (
    configType: 'country_banner' | 'carrier_logo',
    configKey: string
  ) => {
    const success = await deleteConfig(configType, configKey);
    if (success) {
      toast.success('Imagen eliminada correctamente');
    } else {
      toast.error('Error al eliminar la imagen');
    }
  };

  const allCarriers = getAllCarriers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <img 
            src={efficommerceLogo} 
            alt="Efficommerce" 
            className="h-10 w-auto"
          />
          <div>
            <h1 className="text-xl font-semibold text-foreground">Configuración</h1>
            <p className="text-sm text-muted-foreground">Gestión de banners y logos</p>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        <Tabs defaultValue="banners" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="banners">Banners por País</TabsTrigger>
            <TabsTrigger value="logos">Logos Transportadoras</TabsTrigger>
          </TabsList>

          <TabsContent value="banners" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Banners por País
                </CardTitle>
                <CardDescription>
                  Configura un banner personalizado para cada país que aparecerá en el reporte generado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {countries.map(country => {
                    const bannerUrl = getCountryBanner(country);
                    const isUploading = uploadingFor === `country_banner-${country}`;
                    
                    return (
                      <Card key={country} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{country}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {bannerUrl ? (
                            <div className="relative">
                              <img 
                                src={bannerUrl} 
                                alt={`Banner ${country}`}
                                className="w-full h-32 object-cover rounded-md border"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8"
                                onClick={() => handleDelete('country_banner', country)}
                                disabled={isSaving}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="w-full h-32 border-2 border-dashed rounded-md flex items-center justify-center bg-muted/50">
                              <span className="text-sm text-muted-foreground">Sin banner</span>
                            </div>
                          )}
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, 'country_banner', country);
                              }}
                              disabled={isUploading}
                            />
                            <Button 
                              variant="outline" 
                              className="w-full gap-2"
                              disabled={isUploading}
                              asChild
                            >
                              <span>
                                {isUploading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                                {bannerUrl ? 'Cambiar banner' : 'Subir banner'}
                              </span>
                            </Button>
                          </label>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Logos de Transportadoras
                </CardTitle>
                <CardDescription>
                  Configura el logo de cada transportadora que aparecerá en el reporte generado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {allCarriers.map(carrier => {
                    const logoUrl = getCarrierLogo(carrier);
                    const isUploading = uploadingFor === `carrier_logo-${carrier}`;
                    
                    return (
                      <Card key={carrier} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm truncate" title={carrier}>
                            {carrier}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {logoUrl ? (
                            <div className="relative">
                              <img 
                                src={logoUrl} 
                                alt={`Logo ${carrier}`}
                                className="w-full h-20 object-contain rounded-md border bg-white p-2"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6"
                                onClick={() => handleDelete('carrier_logo', carrier)}
                                disabled={isSaving}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="w-full h-20 border-2 border-dashed rounded-md flex items-center justify-center bg-muted/50">
                              <span className="text-xs text-muted-foreground">Sin logo</span>
                            </div>
                          )}
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, 'carrier_logo', carrier);
                              }}
                              disabled={isUploading}
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full gap-1 text-xs"
                              disabled={isUploading}
                              asChild
                            >
                              <span>
                                {isUploading ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Upload className="h-3 w-3" />
                                )}
                                {logoUrl ? 'Cambiar' : 'Subir'}
                              </span>
                            </Button>
                          </label>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
