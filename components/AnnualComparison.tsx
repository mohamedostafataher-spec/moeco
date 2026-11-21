
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { History, TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import { storageService } from '../services/storageService';
import { useApp } from '../context/AppContext';

export const AnnualComparison: React.FC = () => {
  const { t, language, theme } = useApp();
  const [data, setData] = useState<any[]>([]);
  const isRtl = language === 'ar';

  useEffect(() => {
    const fetch = async () => {
      const records = await storageService.getRecords();
      const metrics = storageService.calculateMetrics(records);
      
      // Calculate annual aggregates manually if not provided
      const annuals: Record<string, number> = {};
      records.forEach(r => {
        const year = new Date(r.date).getFullYear().toString();
        annuals[year] = (annuals[year] || 0) + r.co2;
      });
      
      const chartData = Object.entries(annuals).map(([year, value]) => ({
        year,
        value: Number(value).toFixed(1),
        originalValue: Number(value)
      })).sort((a, b) => Number(a.year) - Number(b.year));

      setData(chartData);
    };
    fetch();
  }, []);

  if (data.length < 1) return null;

  const latestYear = data[data.length - 1];
  const previousYear = data.length > 1 ? data[data.length - 2] : null;
  const diff = previousYear ? latestYear.originalValue - previousYear.originalValue : 0;
  const percentChange = previousYear ? (diff / previousYear.originalValue) * 100 : 0;

  return (
    <div className={`p-10 rounded-[4rem] border shadow-2xl relative overflow-hidden transition-all duration-500 ${
      theme === 'dark' ? 'bg-egypt-black border-egypt-gold/20 text-white' : 'bg-white border-egypt-gold/10'
    }`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-egypt-red text-white rounded-2xl shadow-lg">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black font-arabic">{isRtl ? 'مقارنة السنوات' : 'Yearly Comparison'}</h3>
            <p className="text-[10px] font-black text-egypt-red uppercase tracking-widest">{isRtl ? 'تطور انبعاثاتك الشخصية عبر السنين' : 'Personal emission evolution over years'}</p>
          </div>
        </div>

        {previousYear && (
          <div className={`px-6 py-4 rounded-[2rem] border flex items-center gap-4 ${
            diff <= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-egypt-red/10 border-egypt-red/20 text-egypt-red'
          }`}>
            {diff <= 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
            <div>
              <p className="text-[8px] font-black uppercase opacity-60">{isRtl ? 'التغير عن العام الماضي' : 'Change vs Last Year'}</p>
              <p className="text-lg font-black tabular-nums">{Math.abs(percentChange).toFixed(1)}%</p>
            </div>
          </div>
        )}
      </div>

      <div className="h-[300px] sm:h-[300px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.1} />
            <XAxis 
              dataKey="year" 
              stroke="#666" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              cursor={{ fill: 'rgba(192, 147, 4, 0.05)' }}
              contentStyle={{ backgroundColor: '#000', border: '1px solid #C09304', borderRadius: '12px', fontSize: '12px' }}
              labelStyle={{ color: '#fff', fontWeight: 'bold' }}
            />
            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === data.length - 1 ? '#CE1126' : '#C09304'} 
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
        {data.slice(-3).map((item) => (
          <div key={item.year} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-egypt-gold" />
              <span className="text-xs font-black text-zinc-500">{item.year}</span>
            </div>
            <span className="font-black text-egypt-gold">{item.value} <span className="text-[8px] opacity-50">kg</span></span>
          </div>
        ))}
      </div>
    </div>
  );
};
