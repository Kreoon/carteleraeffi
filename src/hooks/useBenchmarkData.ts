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

  // Get data from a specific period
  const getDataFromPeriod = useCallback((fromCountry: string, fromYear: number, fromMonth: number): BenchmarkData | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allData: StoredData = JSON.parse(stored);
        const periodKey = `${fromCountry}_${fromYear}_${fromMonth}`;
        if (allData[periodKey]) {
          const loadedData = allData[periodKey];
          const normalizedData: BenchmarkData = {};
          Object.keys(loadedData).forEach(carrier => {
            normalizedData[carrier] = {};
            Object.keys(loadedData[carrier]).forEach(fieldId => {
              normalizedData[carrier][fieldId] = normalizeCellValue(loadedData[carrier][fieldId]);
            });
          });
          return normalizedData;
        }
      }
    } catch (error) {
      console.error('Error getting data from period:', error);
    }
    return null;
  }, []);

  // Copy data from another period
  const copyFromPeriod = useCallback((fromCountry: string, fromYear: number, fromMonth: number): boolean => {
    const sourceData = getDataFromPeriod(fromCountry, fromYear, fromMonth);
    if (sourceData) {
      // Filter only carriers that exist in current country
      const currentCarriers = carriersByCountry[country] || [];
      const filteredData: BenchmarkData = {};
      currentCarriers.forEach(carrier => {
        if (sourceData[carrier]) {
          filteredData[carrier] = sourceData[carrier];
        } else {
          // Initialize empty data for carriers not in source
          filteredData[carrier] = {};
          fields.forEach(field => {
            const defaultValue = field.type === 'boolean' ? false : '';
            filteredData[carrier][field.id] = { value: defaultValue, note: '', color: 'none' };
          });
        }
      });
      setData(filteredData);
      saveData(filteredData);
      return true;
    }
    return false;
  }, [country, getDataFromPeriod, saveData]);

  // Get previous month info
  const getPreviousMonth = useCallback(() => {
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = year - 1;
    }
    return { month: prevMonth, year: prevYear };
  }, [month, year]);

  // Check if previous month has data
  const hasPreviousMonthData = useCallback(() => {
    const { month: prevMonth, year: prevYear } = getPreviousMonth();
    const data = getDataFromPeriod(country, prevYear, prevMonth);
    return data !== null && Object.keys(data).length > 0;
  }, [country, getPreviousMonth, getDataFromPeriod]);

  return {
    data,
    updateCell,
    isSaving,
    getSavedPeriods,
    copyFromPeriod,
    getPreviousMonth,
    hasPreviousMonthData,
    getDataFromPeriod
  };
}
