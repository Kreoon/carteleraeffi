import { useState, useEffect, useCallback } from 'react';
import { BenchmarkData, carriersByCountry, fields } from '@/lib/data';

const STORAGE_KEY = 'efficommerce_benchmark_data';

interface StoredData {
  [key: string]: BenchmarkData; // key format: "country_year_month"
}

export function useBenchmarkData(country: string, year: number, month: number) {
  const [data, setData] = useState<BenchmarkData>({});
  const [isSaving, setIsSaving] = useState(false);

  const storageKey = `${country}_${year}_${month}`;

  // Load data from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allData: StoredData = JSON.parse(stored);
        if (allData[storageKey]) {
          setData(allData[storageKey]);
        } else {
          // Initialize empty data structure for carriers
          const carriers = carriersByCountry[country] || [];
          const initialData: BenchmarkData = {};
          carriers.forEach(carrier => {
            initialData[carrier] = {};
            fields.forEach(field => {
              if (field.type === 'boolean') {
                initialData[carrier][field.id] = false;
              } else if (field.type === 'percentage' || field.type === 'currency') {
                initialData[carrier][field.id] = '';
              } else {
                initialData[carrier][field.id] = '';
              }
            });
          });
          setData(initialData);
        }
      } else {
        // Initialize empty data
        const carriers = carriersByCountry[country] || [];
        const initialData: BenchmarkData = {};
        carriers.forEach(carrier => {
          initialData[carrier] = {};
        });
        setData(initialData);
      }
    } catch (error) {
      console.error('Error loading benchmark data:', error);
    }
  }, [country, year, month, storageKey]);

  // Save data to localStorage
  const saveData = useCallback((newData: BenchmarkData) => {
    setIsSaving(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allData: StoredData = stored ? JSON.parse(stored) : {};
      allData[storageKey] = newData;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    } catch (error) {
      console.error('Error saving benchmark data:', error);
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  }, [storageKey]);

  // Update a single cell
  const updateCell = useCallback((carrier: string, fieldId: string, value: string | number | boolean) => {
    setData(prevData => {
      const newData = {
        ...prevData,
        [carrier]: {
          ...prevData[carrier],
          [fieldId]: value
        }
      };
      saveData(newData);
      return newData;
    });
  }, [saveData]);

  // Get all saved periods
  const getSavedPeriods = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allData: StoredData = JSON.parse(stored);
        return Object.keys(allData).map(key => {
          const [country, year, month] = key.split('_');
          return { country, year: parseInt(year), month: parseInt(month) };
        });
      }
    } catch (error) {
      console.error('Error getting saved periods:', error);
    }
    return [];
  }, []);

  return {
    data,
    updateCell,
    isSaving,
    getSavedPeriods
  };
}
