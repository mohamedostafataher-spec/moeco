import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlatformDataEngine } from '../services/PlatformDataEngine';
import { DollarSign, Landmark, MapPin, Sparkles, AlertCircle, CloudRain, ThermometerSun, Leaf, Droplets, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SmartLifeWidgets: React.FC = () => {
  const { language, theme, isRtl } = useApp();
  const [prices, setPrices] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [envData, setEnvData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [loadedPrices, loadedPlaces, loadedEnv] = await Promise.all([
          PlatformDataEngine.getEconomyPrices('Cairo'),
          PlatformDataEngine.getPlaces('Cairo'),
          PlatformDataEngine.getEnvironmentalData('Cairo')
        ]);
        setPrices(loadedPrices.slice(0, 3));
        setPlaces(loadedPlaces.slice(0, 2));
        setEnvData(loadedEnv.slice(0, 2));
      } catch (error) {
        console.error("Error fetching Smart Life data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {/* Economy Widget */}
      <div className={`p-6 rounded-[2rem] border transition-all ${theme === 'dark' ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
            <DollarSign size={16} />
            {language === 'ar' ? 'مؤشر الأسعار' : 'Price Index'}
          </h3>
          <Link to="/smart-life/economy" className="text-[10px] text-zinc-400 hover:text-emerald-500 transition-colors uppercase font-bold tracking-widest">
            {language === 'ar' ? 'عرض الكل' : 'View All'}
          </Link>
        </div>
        <div className="space-y-3">
          {prices.map((p, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                {language === 'ar' ? p.name : p.name_en}
              </span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                {p.price} {p.currency} <span className="text-[10px] opacity-60 font-bold">/{p.unit}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Environment Widget */}
      <div className={`p-6 rounded-[2rem] border transition-all ${theme === 'dark' ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
            <CloudRain size={16} />
            {language === 'ar' ? 'الحالة البيئية' : 'Environment Status'}
          </h3>
          <Link to="/smart-life/environment" className="text-[10px] text-zinc-400 hover:text-blue-500 transition-colors uppercase font-bold tracking-widest">
            {language === 'ar' ? 'عرض الكل' : 'View All'}
          </Link>
        </div>
        <div className="space-y-4 pt-2">
          {envData.map((e, i) => (
            <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-blue-500/5">
              <div className="flex items-center gap-3">
                {e.category === 'AQI' ? <Leaf size={16} className="text-emerald-500" /> : <ThermometerSun size={16} className="text-amber-500" />}
                <span className="text-xs font-bold">{language === 'ar' ? e.name : e.name_en}</span>
              </div>
              <span className={`text-lg font-black ${e.severity === 'high' ? 'text-rose-500' : 'text-blue-500'}`}>
                {e.value} <span className="text-[10px] font-bold opacity-60 uppercase">{e.unit}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Lifestyle Widget */}
      <div className={`p-6 rounded-[2rem] border transition-all ${theme === 'dark' ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-100 shadow-sm'} md:col-span-2 lg:col-span-1`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-purple-500 flex items-center gap-2">
            <MapPin size={16} />
            {language === 'ar' ? 'أماكن بالقرب منك' : 'Nearby Places'}
          </h3>
          <Link to="/smart-life/places" className="text-[10px] text-zinc-400 hover:text-purple-500 transition-colors uppercase font-bold tracking-widest">
            {language === 'ar' ? 'اكتشف المزيد' : 'Discover'}
          </Link>
        </div>
        <div className="space-y-3">
          {places.map((place, i) => (
            <div key={i} className="flex flex-col p-3 rounded-xl border border-zinc-100 dark:border-white/5">
              <span className="text-xs font-black text-purple-600 dark:text-purple-400">{language === 'ar' ? place.name : place.name_en}</span>
              <span className="text-[10px] text-zinc-500 mt-1 line-clamp-1">{language === 'ar' ? place.description : place.description_en}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
