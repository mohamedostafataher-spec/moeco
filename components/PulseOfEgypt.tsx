
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, Sun, Moon, TrendingUp, TrendingDown, 
  DollarSign, Coins, Newspaper, Sparkles, 
  MapPin, ChevronRight, ArrowUpRight, CloudSun
} from 'lucide-react';
import { pulseService } from '../services/pulseService';
import { useApp } from '../context/AppContext';

const PulseOfEgypt: React.FC = () => {
  const { language, theme } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPulse = async () => {
      const pulseData = await pulseService.getDailyPulse(language);
      setData(pulseData);
      setLoading(false);
    };
    fetchPulse();
  }, [language]);

  if (loading) return (
    <div className="h-48 flex items-center justify-center bg-stone-100 dark:bg-white/5 rounded-[3rem] animate-pulse">
      <div className="w-8 h-8 border-2 border-egypt-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Daily Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-egypt-gold/10 rounded-xl">
            <Sparkles className="w-5 h-5 text-egypt-gold" />
          </div>
          <h3 className="text-xl font-black font-arabic">
            {language === 'ar' ? 'نبض مصر اليومي' : 'Daily Pulse of Egypt'}
          </h3>
        </div>
        <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
          {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long' })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Prayer Times Widget */}
        <motion.div 
          whileHover={{ y: -5 }}
          className={`p-6 rounded-[2.5rem] border shadow-lg relative overflow-hidden ${theme === 'dark' ? 'bg-egypt-black border-white/5' : 'bg-white border-stone-100'}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-4 h-4 text-egypt-gold" />
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times'}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(data.prayerTimes).slice(0, 6).map(([name, time]: any) => (
              <div key={name} className="text-center p-2 rounded-xl bg-stone-50 dark:bg-white/5">
                <p className="text-[8px] font-black text-stone-400 uppercase">{name}</p>
                <p className="text-xs font-black">{time}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Gold Prices Widget */}
        <motion.div 
          whileHover={{ y: -5 }}
          className={`p-6 rounded-[2.5rem] border shadow-lg relative overflow-hidden ${theme === 'dark' ? 'bg-egypt-black border-white/5' : 'bg-white border-stone-100'}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{language === 'ar' ? 'أسعار الذهب' : 'Gold Prices'}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold">24K</span>
              <span className="text-sm font-black">{data.goldPrices['24K']} <span className="text-[10px] opacity-50">EGP</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold">21K</span>
              <span className="text-sm font-black">{data.goldPrices['21K']} <span className="text-[10px] opacity-50">EGP</span></span>
            </div>
            <div className={`text-[10px] font-black flex items-center gap-1 ${data.goldPrices.change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {data.goldPrices.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {data.goldPrices.change > 0 ? '+' : ''}{data.goldPrices.change} EGP {language === 'ar' ? 'اليوم' : 'Today'}
            </div>
          </div>
        </motion.div>

        {/* Exchange Rates Widget */}
        <motion.div 
          whileHover={{ y: -5 }}
          className={`p-6 rounded-[2.5rem] border shadow-lg relative overflow-hidden ${theme === 'dark' ? 'bg-egypt-black border-white/5' : 'bg-white border-stone-100'}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{language === 'ar' ? 'أسعار الصرف' : 'Exchange Rates'}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold">USD</span>
              <span className="text-sm font-black">{data.exchangeRates.USD} <span className="text-[10px] opacity-50">EGP</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold">EUR</span>
              <span className="text-sm font-black">{data.exchangeRates.EUR} <span className="text-[10px] opacity-50">EGP</span></span>
            </div>
            <div className={`text-[10px] font-black flex items-center gap-1 ${data.exchangeRates.change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {data.exchangeRates.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {data.exchangeRates.change} EGP {language === 'ar' ? 'تغير' : 'change'}
            </div>
          </div>
        </motion.div>

        {/* Weather & Tip Widget */}
        <motion.div 
          whileHover={{ y: -5 }}
          className={`p-6 rounded-[2.5rem] border shadow-lg relative overflow-hidden bg-moeco-dark text-white flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <CloudSun className="w-6 h-6 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                {language === 'ar' ? 'الطقس الآن' : 'Weather Now'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black">{data.weather?.temperature}°C</span>
            </div>
          </div>
          <div className="relative z-10 p-3 bg-white/10 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 mb-1">
              <Newspaper className="w-3 h-3 text-moeco-light" />
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{language === 'ar' ? 'نصيحة اليوم' : 'Daily Tip'}</span>
            </div>
            <p className="text-xs font-bold leading-relaxed font-arabic italic opacity-90">
              "{data.dailyTip}"
            </p>
          </div>
          <div className="absolute bottom-0 right-0 p-4 opacity-10">
            <CloudSun className="w-24 h-24" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PulseOfEgypt;
