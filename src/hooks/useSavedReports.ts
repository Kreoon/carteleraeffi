import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { BenchmarkData } from '@/lib/data';
import { Json } from '@/integrations/supabase/types';

export interface SavedReport {
  id: string;
  country: string;
  year: number;
  month: number;
  data: BenchmarkData;
  created_at: string;
  updated_at: string;
}

export function useSavedReports() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('saved_reports')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      toast.error('No se pudieron cargar los reportes guardados');
    } else if (data) {
      const mappedReports: SavedReport[] = data.map(item => ({
        id: item.id,
        country: item.country,
        year: item.year,
        month: item.month,
        data: item.data as unknown as BenchmarkData,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      setReports(mappedReports);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const saveReport = useCallback(async (country: string, year: number, month: number, data: BenchmarkData) => {
    // Check if report exists
    const { data: existing } = await supabase
      .from('saved_reports')
      .select('id')
      .eq('country', country)
      .eq('year', year)
      .eq('month', month)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('saved_reports')
        .update({ data: data as unknown as Json })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating report:', error);
        toast.error('Error al actualizar el reporte');
        return false;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('saved_reports')
        .insert({ country, year, month, data: data as unknown as Json });

      if (error) {
        console.error('Error saving report:', error);
        toast.error('Error al guardar el reporte');
        return false;
      }
    }
    
    await fetchReports();
    return true;
  }, [fetchReports]);

  const deleteReport = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('saved_reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting report:', error);
      toast.error('Error al eliminar el reporte');
      return false;
    }
    toast.success('Reporte eliminado');
    
    await fetchReports();
    return true;
  }, [fetchReports]);

  return {
    reports,
    isLoading,
    saveReport,
    deleteReport,
    refetch: fetchReports
  };
}
