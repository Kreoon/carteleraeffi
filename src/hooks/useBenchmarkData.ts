import { useState, useEffect, useCallback } from 'react';
import { BenchmarkData, CellValue, carriersByCountry, fields, normalizeCellValue } from '@/lib/data';

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
          // Normalize all values to CellValue format
          const loadedData = allData[storageKey];
          const normalizedData: BenchmarkData = {};
          Object.keys(loadedData).forEach(carrier => {
            normalizedData[carrier] = {};
            Object.keys(loadedData[carrier]).forEach(fieldId => {
              normalizedData[carrier][fieldId] = normalizeCellValue(loadedData[carrier][fieldId]);
            });
          });
          setData(normalizedData);
        } else {
          // Initialize empty data structure for carriers
          initializeData();
        }
      } else {
        initializeData();
      }
    } catch (error) {
      console.error('Error loading benchmark data:', error);
      initializeData();
    }
  }, [country, year, month, storageKey]);

  const initializeData = () => {
    const carriers = carriersByCountry[country] || [];
    const initialData: BenchmarkData = {};
    carriers.forEach(carrier => {
      initialData[carrier] = {};
      fields.forEach(field => {
        const defaultValue = field.type === 'boolean' ? false : '';
        initialData[carrier][field.id] = { value: defaultValue, note: '', color: 'none' };
      });
    });
    setData(initialData);
  };

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
  const updateCell = useCallback((carrier: string, fieldId: string, cellValue: CellValue) => {
    setData(prevData => {
      const newData: BenchmarkData = {
        ...prevData,
        [carrier]: {
          ...prevData[carrier],
          [fieldId]: cellValue
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
