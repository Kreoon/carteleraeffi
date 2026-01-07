import { useState, useEffect } from 'react';
import { BenchmarkHeader } from '@/components/BenchmarkHeader';
import { BenchmarkTable } from '@/components/BenchmarkTable';
import { useBenchmarkData } from '@/hooks/useBenchmarkData';
import { CellValue } from '@/lib/data';
import { seedSampleData } from '@/lib/sampleData';

const Index = () => {
  const [country, setCountry] = useState('Colombia');
  const [month, setMonth] = useState(9); // October (0-indexed)
  const [year, setYear] = useState(2025);
  
  // Seed sample data on first load
  useEffect(() => {
    seedSampleData();
  }, []);

  const { data, updateCell, isSaving } = useBenchmarkData(country, year, month);

  const handleCellChange = (carrier: string, fieldId: string, value: CellValue) => {
    updateCell(carrier, fieldId, value);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <BenchmarkHeader
        country={country}
        setCountry={setCountry}
        month={month}
        setMonth={setMonth}
        year={year}
        setYear={setYear}
        isSaving={isSaving}
      />
      
      <main className="flex-1 overflow-auto">
        <BenchmarkTable
          country={country}
          data={data}
          onCellChange={handleCellChange}
        />
      </main>
    </div>
  );
};

export default Index;
