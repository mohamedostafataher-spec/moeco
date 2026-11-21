
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun as SunIcon, Moon, Clock, MapPin, ChevronLeft, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dailyServices, PrayerTimes as PrayerTimesType } from '../services/dailyServices';
import { useNavigate } from 'react-router-dom';

const PrayerTimes: React.FC = () => {
  const { language, isRtl, theme } = useApp();
  const navigate = useNavigate();
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesType | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState({ lat: 30.0444, lng: 31.2357, city: 'Cairo' });

  const fetchTimes = async () => {
    setLoading(true);
    try {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation(prev => ({ ...prev, lat: latitude, lng: longitude }));
          const pt = await dailyServices.getPrayerTimes(latitude, longitude);
          setPrayerTimes(pt);
        });
      } else {
        const pt = await dailyServices.getPrayerTimes(location.lat, location.lng);
        setPrayerTimes(pt);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimes();
  }, []);

  const prayerIcons: Record<string, any> = {
    Fajr: SunIcon,
    Dhuhr: SunIcon,
    Asr: SunIcon,
    Maghrib: Moon,
    Isha: Moon
  };

  return (
    <div className="min-h-screen pb-32" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-3 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-egypt-gold hover:text-egypt-black transition-all"
            >
              <ChevronLeft className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            <div>
              <h1 className="text-4xl font-black font-arabic">
                {language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times'}
              </h1>
              <div className="flex items-center gap-2 text-zinc-500 font-bold mt-1">
                <MapPin className="w-4 h-4 text-egypt-gold" />
                <span>{location.city}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={fetchTimes}
            className="p-4 bg-egypt-gold/10 text-egypt-gold rounded-2xl hover:bg-egypt-gold hover:text-egypt-black transition-all"
          >
            <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {prayerTimes ? Object.entries(prayerTimes).map(([name, time], idx) => {
            const Icon = prayerIcons[name] || Clock;
            return (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-8 rounded-[2.5rem] border shadow-xl flex items-center justify-between ${
                  theme === 'dark' ? 'bg-egypt-black border-white/5' : 'bg-white border-stone-100'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${
                    name === 'Maghrib' || name === 'Isha' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black font-arabic">{name}</h3>
                    <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                      {language === 'ar' ? 'الصلاة القادمة' : 'Next Prayer'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-egypt-gold">{time as string}</span>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Local Time</p>
                </div>
              </motion.div>
            );
          }) : (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-16 h-16 border-4 border-egypt-gold/20 border-t-egypt-gold rounded-full animate-spin" />
              <p className="text-zinc-500 font-bold">{language === 'ar' ? 'جاري تحميل المواقيت...' : 'Loading prayer times...'}</p>
            </div>
          )}
        </div>

        <div className="mt-12 p-8 bg-zinc-100 dark:bg-white/5 rounded-[3rem] border border-zinc-200 dark:border-white/10 text-center">
          <p className="text-xs font-bold text-zinc-500 leading-relaxed">
            {language === 'ar' 
              ? 'يتم حساب المواقيت بناءً على موقعك الحالي. تأكد من تفعيل خدمة تحديد الموقع للحصول على أدق النتائج.' 
              : 'Prayer times are calculated based on your current location. Please ensure location services are enabled for accurate results.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrayerTimes;
