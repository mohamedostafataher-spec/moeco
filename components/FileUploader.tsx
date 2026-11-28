
import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { carbonDataService, CarbonDataPoint } from '../services/carbonDataService';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';

interface FileUploaderProps {
  onComplete: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onComplete }) => {
  const { language } = useApp();
  const ar = language === 'ar';
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);

    try {
      const reader = new FileReader();
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        reader.onload = (evt) => {
          try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws) as any[];

            processData(data);
            setStatus({ type: 'success', message: 'Data updated successfully from Excel!' });
            onComplete();
          } catch (err) {
            setStatus({ type: 'error', message: 'Failed to parse Excel file.' });
          }
          setLoading(false);
        };
        reader.readAsBinaryString(file);
      } else if (file.name.endsWith('.pdf')) {
        // Basic PDF handling placeholder - PDF extraction is complex in browser
        // For a real app, we'd use a worker or a more robust library
        setStatus({ type: 'error', message: 'PDF support is currently limited. Please use Excel for structured data.' });
        setLoading(false);
      } else {
        setStatus({ type: 'error', message: 'Unsupported file format.' });
        setLoading(false);
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'An error occurred during upload.' });
      setLoading(false);
    }
  };

  const processData = (data: any[]) => {
    // Group data by location and level
    const countries: Record<string, CarbonDataPoint[]> = {};
    const governorates: Record<string, CarbonDataPoint[]> = {};
    const cities: Record<string, CarbonDataPoint[]> = {};

    data.forEach(row => {
      const year = parseInt(row.year || row.Year);
      const rate = parseFloat(row.co2 || row.CO2 || row.rate || row.Rate || row.emissions || row.Emissions);
      
      if (isNaN(year) || isNaN(rate)) return;

      const point: CarbonDataPoint = { year, rate };

      if (row.country || row.Country) {
        const loc = row.country || row.Country;
        point.level = 'country';
        point.location = loc;
        if (!countries[loc]) countries[loc] = [];
        countries[loc].push(point);
      } else if (row.governorate || row.Governorate || row.province || row.Province) {
        const loc = row.governorate || row.Governorate || row.province || row.Province;
        point.level = 'governorate';
        point.location = loc;
        if (!governorates[loc]) governorates[loc] = [];
        governorates[loc].push(point);
      } else if (row.city || row.City || row.town || row.Town) {
        const loc = row.city || row.City || row.town || row.Town;
        point.level = 'city';
        point.location = loc;
        if (!cities[loc]) cities[loc] = [];
        cities[loc].push(point);
      }
    });

    // Update service and storage
    Object.entries(countries).forEach(([loc, points]) => {
      carbonDataService.updateData('country', loc, points);
    });
    Object.entries(governorates).forEach(([loc, points]) => {
      carbonDataService.updateData('governorate', loc, points);
    });
    Object.entries(cities).forEach(([loc, points]) => {
      carbonDataService.updateData('city', loc, points);
    });

    // Persist to local storage
    storageService.saveCountriesData(Object.values(countries).flat());
    storageService.saveGovernorateData(Object.values(governorates).flat());
  };

  return (
    <div className="p-8 bg-zinc-900/50 border-2 border-dashed border-white/10 rounded-[2rem] text-center space-y-4">
      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
        {loading ? <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /> : <Upload className="w-8 h-8 text-emerald-500" />}
      </div>
      
      <div>
        <h3 className="text-xl font-black text-white font-arabic">{ar ? 'تحديث البيانات' : 'Update data'}</h3>
        <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Upload Excel or PDF</p>
      </div>

      <div className="relative">
        <input 
          type="file" 
          accept=".xlsx,.xls,.csv,.pdf"
          onChange={handleFileUpload}
          disabled={loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <button className="px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-500 transition-all w-full">
          {loading ? 'Processing...' : 'Choose File'}
        </button>
      </div>

      {status && (
        <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-bold ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {status.message}
        </div>
      )}

      <div className="pt-4 flex justify-center gap-4">
        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase">
          <FileText className="w-3 h-3" /> Excel (.xlsx)
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase">
          <FileText className="w-3 h-3" /> PDF Reports
        </div>
      </div>
    </div>
  );
};
