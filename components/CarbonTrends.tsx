
import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend 
} from 'recharts';
import { carbonDataService, CarbonDataPoint } from '../services/carbonDataService';
import { TrendingUp, AlertCircle, Info, MapPin, Globe, Building, Landmark, Scale } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CarbonTrends: React.FC = () => {
  const { language, user } = useApp();
  const [level, setLevel] = useState<'global' | 'country' | 'governorate' | 'city'>('global');
  const [compareWith, setCompareWith] = useState<string | null>(null);

  const currentData = useMemo(() => {
    switch (level) {
      case 'global': return carbonDataService.getGlobalData();
      case 'country': return carbonDataService.getCountryData(user?.country || 'Egypt');
      case 'governorate': return carbonDataService.getGovernorateData(user?.governorate || 'Cairo');
      case 'city': return carbonDataService.getCityData(user?.city || 'Maadi');
      default: return [];
    }
  }, [level, user]);

  const comparisonData = useMemo(() => {
    if (!compareWith) return null;
    switch (level) {
      case 'country': return carbonDataService.getCountryData(compareWith);
      case 'governorate': return carbonDataService.getGovernorateData(compareWith);
      case 'city': return carbonDataService.getCityData(compareWith);
      default: return null;
    }
  }, [level, compareWith]);

  const combinedData = useMemo(() => {
    if (!comparisonData) return currentData;
    
    // Merge data by year for comparison
    const years = Array.from(new Set([...currentData.map(d => d.year), ...comparisonData.map(d => d.year)])).sort();
    return years.map(year => {
      const current = currentData.find(d => d.year === year);
      const compare = comparisonData.find(d => d.year === year);
      return {
        year,
        current: current?.rate,
        compare: compare?.rate,
        currentName: current?.location || 'Current',
        compareName: compare?.location || 'Comparison'
      };
    });
  }, [currentData, comparisonData]);

  const unit = level === 'global' ? 'GtCO2' : (level === 'city' ? 'ktCO2' : 'MtCO2');

  return (
    <div className="bg-egypt-black border border-egypt-gold/20 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-egypt-red" />
            <span className="text-[10px] font-black text-egypt-red uppercase tracking-widest">Hierarchical Analysis</span>
          </div>
          <h2 className="text-3xl font-black text-white font-arabic">
            {language === 'ar' ? 'تحليل الانبعاثات الجغرافي' : 'Geographic Emission Analysis'}
          </h2>
          <p className="text-zinc-500 text-xs mt-1">
            {language === 'ar' ? 'قارن بين مستويات مختلفة من البيانات' : 'Compare different data levels and locations'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'global', icon: Globe, label: 'Global' },
            { id: 'country', icon: Landmark, label: 'Country' },
            { id: 'governorate', icon: Building, label: 'Gov' },
            { id: 'city', icon: MapPin, label: 'City' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => { setLevel(btn.id as any); setCompareWith(null); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                level === btn.id ? 'bg-egypt-red text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'
              }`}
            >
              <btn.icon className="w-3 h-3" /> {btn.label}
            </button>
          ))}
        </div>
      </div>

      {level !== 'global' && (
        <div className="flex items-center gap-4 p-4 bg-black/20 rounded-2xl border border-white/5">
          <Scale className="w-5 h-5 text-egypt-gold" />
          <span className="text-xs font-bold text-white">{language === 'ar' ? 'مقارنة مع:' : 'Compare with:'}</span>
          <div className="flex gap-2">
            {level === 'country' && ['Saudi Arabia', 'USA', 'China'].map(c => (
              <button 
                key={c} 
                onClick={() => setCompareWith(c)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold ${compareWith === c ? 'bg-egypt-red text-white' : 'bg-zinc-800 text-zinc-400'}`}
              >
                {c}
              </button>
            ))}
            {level === 'governorate' && ['Alexandria'].map(c => (
              <button 
                key={c} 
                onClick={() => setCompareWith(c)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold ${compareWith === c ? 'bg-egypt-red text-white' : 'bg-zinc-800 text-zinc-400'}`}
              >
                {c}
              </button>
            ))}
            {level === 'city' && ['Nasr City'].map(c => (
              <button 
                key={c} 
                onClick={() => setCompareWith(c)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold ${compareWith === c ? 'bg-egypt-red text-white' : 'bg-zinc-800 text-zinc-400'}`}
              >
                {c}
              </button>
            ))}
            {compareWith && (
              <button onClick={() => setCompareWith(null)} className="text-[10px] text-egypt-red font-bold ml-2">Clear</button>
            )}
          </div>
        </div>
      )}

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={combinedData}>
            <defs>
              <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#CE1126" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#CE1126" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCompare" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C09304" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#C09304" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis dataKey="year" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', border: '1px solid #C09304', borderRadius: '12px', fontSize: '12px' }}
              labelStyle={{ color: '#fff', fontWeight: 'bold' }}
            />
            <Legend verticalAlign="top" height={36}/>
            <Area 
              type="monotone" 
              dataKey={compareWith ? "current" : "rate"} 
              stroke="#CE1126" 
              strokeWidth={3}
              fill="url(#colorCurrent)" 
              name={compareWith ? (currentData[0]?.location || 'Current') : `Emissions (${unit})`}
            />
            {compareWith && (
              <Area 
                type="monotone" 
                dataKey="compare" 
                stroke="#C09304" 
                strokeWidth={3}
                fill="url(#colorCompare)" 
                name={compareWith}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-black/20 rounded-[2rem] border border-white/5 space-y-2">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Current Scale</p>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-egypt-red/10 rounded-lg">
              <Landmark className="w-4 h-4 text-egypt-red" />
            </div>
            <h4 className="text-xl font-black text-white">{level.toUpperCase()}</h4>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            {language === 'ar' 
              ? `يتم عرض البيانات بوحدة ${unit}. هذا المستوى يساعد في فهم التأثير الجغرافي المحدد.`
              : `Data is displayed in ${unit}. This level helps understand the specific geographic impact.`}
          </p>
        </div>

        <div className="p-6 bg-black/20 rounded-[2rem] border border-white/5 space-y-2">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Analysis Insight</p>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-egypt-gold/10 rounded-lg">
              <Info className="w-4 h-4 text-egypt-gold" />
            </div>
            <h4 className="text-xl font-black text-white">Scale Factor</h4>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            {language === 'ar'
              ? 'تتأثر الانبعاثات بالكثافة السكانية والنشاط الصناعي في كل منطقة.'
              : 'Emissions are influenced by population density and industrial activity in each region.'}
          </p>
        </div>
      </div>
    </div>
  );
};
