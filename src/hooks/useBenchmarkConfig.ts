import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { countries, carriersByCountry } from '@/lib/data';

export interface BenchmarkConfigItem {
  id: string;
  config_type: 'country_banner' | 'carrier_logo';
  config_key: string;
  image_url: string;
}

export function useBenchmarkConfig() {
  const [config, setConfig] = useState<BenchmarkConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all config
  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('benchmark_config')
      .select('*');
    
    if (error) {
      console.error('Error fetching config:', error);
    } else {
      setConfig((data || []) as BenchmarkConfigItem[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Get banner for a country
  const getCountryBanner = useCallback((country: string): string | null => {
    const item = config.find(c => c.config_type === 'country_banner' && c.config_key === country);
    return item?.image_url || null;
  }, [config]);

  // Get logo for a carrier
  const getCarrierLogo = useCallback((carrier: string): string | null => {
    const item = config.find(c => c.config_type === 'carrier_logo' && c.config_key === carrier);
    return item?.image_url || null;
  }, [config]);

  // Save or update config
  const saveConfig = useCallback(async (
    configType: 'country_banner' | 'carrier_logo',
    configKey: string,
    imageUrl: string
  ) => {
    setIsSaving(true);
    
    const { error } = await supabase
      .from('benchmark_config')
      .upsert({
        config_type: configType,
        config_key: configKey,
        image_url: imageUrl
      }, {
        onConflict: 'config_type,config_key'
      });
    
    if (error) {
      console.error('Error saving config:', error);
    } else {
      await fetchConfig();
    }
    
    setIsSaving(false);
    return !error;
  }, [fetchConfig]);

  // Delete config
  const deleteConfig = useCallback(async (
    configType: 'country_banner' | 'carrier_logo',
    configKey: string
  ) => {
    setIsSaving(true);
    
    const { error } = await supabase
      .from('benchmark_config')
      .delete()
      .eq('config_type', configType)
      .eq('config_key', configKey);
    
    if (error) {
      console.error('Error deleting config:', error);
    } else {
      await fetchConfig();
    }
    
    setIsSaving(false);
    return !error;
  }, [fetchConfig]);

  // Get all carriers across all countries
  const getAllCarriers = useCallback(() => {
    const allCarriers: string[] = [];
    countries.forEach(country => {
      const carriers = carriersByCountry[country] || [];
      carriers.forEach(carrier => {
        if (!allCarriers.includes(carrier)) {
          allCarriers.push(carrier);
        }
      });
    });
    return allCarriers;
  }, []);

  return {
    config,
    isLoading,
    isSaving,
    getCountryBanner,
    getCarrierLogo,
    saveConfig,
    deleteConfig,
    getAllCarriers,
    refetch: fetchConfig
  };
}
