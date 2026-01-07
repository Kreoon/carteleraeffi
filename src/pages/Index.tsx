import { useState } from 'react';
import { BenchmarkHeader } from '@/components/BenchmarkHeader';
import { BenchmarkTable } from '@/components/BenchmarkTable';
import { useBenchmarkData } from '@/hooks/useBenchmarkData';
import { generatePDF } from '@/components/PDFGenerator';

const Index = () => {
  const currentDate = new Date();
  const [country, setCountry] = useState('Colombia');
  const [month, setMonth] = useState(currentDate.getMonth());
  const [year, setYear] = useState(currentDate.getFullYear());

  const { data, updateCell, isSaving } = useBenchmarkData(country, year, month);

  const handleGeneratePDF = () => {
    generatePDF({ country, month, year, data });
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
        onGeneratePDF={handleGeneratePDF}
      />
      
      <main className="flex-1 overflow-auto">
        <BenchmarkTable
          country={country}
          data={data}
          onCellChange={updateCell}
        />
      </main>
    </div>
  );
};

export default Index;
