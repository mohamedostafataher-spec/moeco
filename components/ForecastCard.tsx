
import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Calendar, DollarSign, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ForecastCardProps {
  title: string;
  value: string | number;
  unit: string;
  comparison: string | number;
  percentage: number;
  trend: 'up' | 'down';
  chartData: any[];
  language: 'ar' | 'en';
  type: 'consumption' | 'bill';
}

export const ForecastCard: React.FC<ForecastCardProps> = ({
  title, value, unit, comparison, percentage, trend, chartData, language, type
}) => {
  const isUp = trend === 'up';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 shadow-xl overflow-hidden relative group"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{value}</h3>
            <span className="text-sm font-bold text-zinc-400">{unit}</span>
          </div>
        </div>
        <div className={`p-3 rounded-2xl ${isUp ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
          {type === 'bill' ? <DollarSign className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black ${isUp ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {percentage}%
        </div>
        <p className="text-[10px] font-bold text-zinc-400">
          {language === 'ar' ? 'مقارنة بالشهر الماضي' : 'vs last month'} ({comparison} {unit})
        </p>
      </div>

      <div className="h-32 -mx-6 -mb-6 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`colorGradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isUp ? '#ef4444' : '#10b981'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isUp ? '#ef4444' : '#10b981'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={isUp ? '#ef4444' : '#10b981'} 
              strokeWidth={3}
              fillOpacity={1} 
              fill={`url(#colorGradient-${title})`} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
