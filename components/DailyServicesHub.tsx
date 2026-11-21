
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, MapPin, Sun, Trophy, QrCode, 
  RefreshCw, ChevronRight, ExternalLink, Navigation,
  Clock, CheckCircle2, AlertCircle, HelpCircle, Award,
  Leaf, ArrowUpRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dailyServices, CommodityPrice, PrayerTimes } from '../services/dailyServices';
import { notificationService } from '../services/notificationService';
import { Link } from 'react-router-dom';

const DailyServicesHub: React.FC = () => {
  const { language, theme, user } = useApp();
  const [prices, setPrices] = useState<CommodityPrice[]>([]);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nearby, setNearby] = useState<any[]>([]);
  const [outings, setOutings] = useState<any[]>([]);
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState({ lat: 30.0444, lng: 31.2357, city: 'Cairo' });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeNearbyTab, setActiveNearbyTab] = useState<'services' | 'outings'>('services');
  const [scheduledPrayers, setScheduledPrayers] = useState<Set<string>>(new Set());

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const estimateCarbon = (distance: number) => {
    // 0.2kg per km is a general car emission. Walking saves most of it.
    return distance * 0.21;
  };

  const prayerNamesAr: Record<string, string> = {
    Fajr: 'الفجر',
    Dhuhr: 'الظهر',
    Asr: 'العصر',
    Maghrib: 'المغرب',
    Isha: 'العشاء'
  };

  const playPrayerSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Gentle notification sound
      audio.play().catch(e => console.error('Audio play failed', e));
    } catch (e) {
      console.error('Failed to play sound', e);
    }
  };

  const schedulePrayerAlerts = (times: PrayerTimes) => {
    if (!times) return;
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    Object.entries(times).forEach(([name, time]) => {
      const [hours, minutes] = (time as string).split(':').map(Number);
      const prayerDate = new Date(today);
      prayerDate.setHours(hours, minutes, 0);

      if (prayerDate > now && !scheduledPrayers.has(name)) {
        const diff = prayerDate.getTime() - now.getTime();
        setTimeout(() => {
          const msg = language === 'ar' 
            ? `حان الآن موعد صلاة ${prayerNamesAr[name]}` 
            : `It is now time for ${name} prayer`;
          
          notificationService.info(msg);
          playPrayerSound();
          
          if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(msg);
            utterance.lang = language === 'ar' ? 'ar-EG' : 'en-US';
            window.speechSynthesis.speak(utterance);
          }
        }, diff);
        setScheduledPrayers(prev => new Set(prev).add(name));
      }
    });
  };

  useEffect(() => {
    if (prayerTimes) {
      schedulePrayerAlerts(prayerTimes);
    }
  }, [prayerTimes]);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    const performFetch = async (lat: number, lng: number) => {
      try {
        // Fetch prices
        try {
          const p = await dailyServices.getPrices();
          setPrices(p);
        } catch (e) { console.error('Prices fetch failed', e); }

        // Fetch prayer times
        try {
          const pt = await dailyServices.getPrayerTimes(lat, lng);
          setPrayerTimes(pt);
        } catch (e) { console.error('Prayer times fetch failed', e); }

        // Fetch nearby services
        try {
          const n = await dailyServices.getNearby(lat, lng);
          const processedN = n.map((item: any) => {
            const d = calculateDistance(lat, lng, item.lat || item.center?.lat, item.lon || item.center?.lon);
            return { ...item, distance: d, carbonScore: estimateCarbon(d) };
          });
          setNearby(processedN.slice(0, 15));
        } catch (e) { console.error('Nearby fetch failed', e); }

        // Fetch outings
        try {
          const o = await dailyServices.getNearbyOutings(lat, lng);
          const processedO = o.map((item: any) => {
            const d = calculateDistance(lat, lng, item.lat || item.center?.lat, item.lon || item.center?.lon);
            return { ...item, distance: d, carbonScore: estimateCarbon(d) };
          });
          setOutings(processedO.slice(0, 15));
        } catch (e) { console.error('Outings fetch failed', e); }

        // Fetch daily question
        try {
          const q = await dailyServices.getDailyQuestion(language);
          setQuestion(q);
        } catch (e) { console.error('Question fetch failed', e); }

        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error in performFetch:', error);
      }
    };

    try {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            setLocation(prev => ({ ...prev, lat: latitude, lng: longitude }));
            await performFetch(latitude, longitude);
            setLoading(false);
            setRefreshing(false);
          },
          async (error) => {
            console.warn('Geolocation failed, using default location:', error.message);
            await performFetch(location.lat, location.lng);
            setLoading(false);
            setRefreshing(false);
          },
          { timeout: 5000 }
        );
      } else {
        await performFetch(location.lat, location.lng);
        setLoading(false);
        setRefreshing(false);
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 300000); // 5 min refresh
    return () => clearInterval(interval);
  }, []);

  // Prayer Notification Logic
  useEffect(() => {
    if (!prayerTimes) return;

    const checkPrayer = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      Object.entries(prayerTimes).forEach(([name, time]) => {
        if (time === currentTime) {
          const prayerName = prayerNamesAr[name] || name;
          notificationService.sendLocalNotification(
            language === 'ar' ? `حان الآن موعد صلاة ${prayerName}` : `It is now time for ${name} prayer`,
            language === 'ar' ? `الله أكبر، الله أكبر` : `Allahu Akbar`
          );
          
          // Play sound
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(e => console.log('Audio play failed', e));
        }
      });
    };

    const prayerInterval = setInterval(checkPrayer, 60000); // Check every minute
    return () => clearInterval(prayerInterval);
  }, [prayerTimes, language]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live': return <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-lg animate-pulse">مباشر</span>;
      case 'realtime': return <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-lg">وقت حقيقي</span>;
      case 'cache': return <span className="px-2 py-0.5 bg-zinc-500 text-white text-[10px] font-bold rounded-lg">محفوظ</span>;
      case 'estimated': return <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-lg">تقديري</span>;
      default: return null;
    }
  };

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between px-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black font-arabic flex items-center gap-3 text-zinc-900 dark:text-white">
            <span className="w-1.5 h-8 bg-egypt-gold rounded-full" />
            {language === 'ar' ? 'مركز الخدمات اليومية' : 'Daily Services Hub'}
          </h2>
          <div className="flex items-center gap-2 text-xs font-medium mt-1 text-zinc-500 dark:text-zinc-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'آخر تحديث:' : 'Last Updated:'} {lastUpdated.toLocaleTimeString()}</span>
            <span className="opacity-30">|</span>
            <div className="flex items-center gap-1.5 text-aeon-cyan">
              <div className="w-1.5 h-1.5 bg-aeon-cyan rounded-full animate-pulse shadow-[0_0_5px_#00F5FF]" />
              <span className="text-[10px] font-mono font-black uppercase tracking-widest">{storageService.getCarbonPulse()} ppm</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="p-3 bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white rounded-2xl hover:bg-egypt-gold hover:text-egypt-black transition-all disabled:opacity-50 border border-zinc-200 dark:border-white/10"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {/* Commodity Prices Card */}
        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                <ShoppingBag className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
              </div>
              <h3 className="font-black text-base text-zinc-900 dark:text-white font-arabic">{language === 'ar' ? 'أسعار السلع' : 'Commodity Prices'}</h3>
            </div>
            {prices[0] && getStatusBadge(prices[0].status)}
          </div>
          <div className="space-y-3">
            {prices.slice(0, 5).map((p, i) => (
              <div key={i} className="flex flex-col p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 group-hover:border-emerald-500/20 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 font-arabic">{p.product}</span>
                  <span className="text-base font-black text-emerald-600 dark:text-egypt-gold">{p.price} <span className="text-xs opacity-60">ج.م</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-zinc-100 dark:bg-white/10 rounded-md text-zinc-500 dark:text-zinc-400">{p.source}</span>
                    <span className="text-[10px] font-medium text-zinc-400">{p.city}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                    <Leaf className="w-3 h-3" />
                    <span>{p.carbon_footprint} kg CO₂</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
              {language === 'ar' ? 'نصيحة تسوق مستدام' : 'Sustainable Shopping Tip'}
            </p>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed font-arabic">
              {language === 'ar' 
                ? 'اختيار الخضروات الموسمية يقلل بصمتك الكربونية بنسبة تصل إلى 30% مقارنة بالمنتجات المستوردة.'
                : 'Choosing seasonal vegetables reduces your carbon footprint by up to 30% compared to imported goods.'}
            </p>
          </div>
        </div>

        {/* Prayer Times Card */}
        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-500/20">
                <Sun className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
              <h3 className="font-black text-base text-zinc-900 dark:text-white font-arabic">{language === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times'}</h3>
            </div>
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{location.city}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {prayerTimes && Object.entries(prayerTimes).map(([name, time]) => (
              <div key={name} className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 text-center group-hover:border-amber-500/20 transition-all">
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 font-arabic">
                  {language === 'ar' ? (prayerNamesAr[name] || name) : name}
                </p>
                <p className="text-base font-black text-amber-600 dark:text-egypt-gold">{time as string}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Nearby Places Card */}
        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group col-span-1 md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-500" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-black text-base text-zinc-900 dark:text-white font-arabic">{language === 'ar' ? 'أماكن قريبة' : 'Nearby Places'}</h3>
                <Link to="/nearby-pulse" className="text-[10px] font-black text-aeon-cyan uppercase tracking-widest flex items-center gap-1 hover:underline">
                  {language === 'ar' ? 'عرض النبض الكامل' : 'View Full Pulse'}
                  <ArrowUpRight size={10} />
                </Link>
              </div>
            </div>
            <div className="flex bg-zinc-100 dark:bg-white/5 p-1 rounded-xl border border-zinc-200 dark:border-white/10">
              <button 
                onClick={() => setActiveNearbyTab('services')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeNearbyTab === 'services' ? 'bg-egypt-gold text-egypt-black shadow-sm' : 'text-zinc-500 dark:text-white/40'}`}
              >
                {language === 'ar' ? 'خدمات' : 'Services'}
              </button>
              <button 
                onClick={() => setActiveNearbyTab('outings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeNearbyTab === 'outings' ? 'bg-egypt-gold text-egypt-black shadow-sm' : 'text-zinc-500 dark:text-white/40'}`}
              >
                {language === 'ar' ? 'خروجات' : 'Outings'}
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {refreshing || loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-zinc-100 dark:bg-white/5 rounded-2xl animate-pulse" />
              ))
            ) : (activeNearbyTab === 'services' ? nearby : outings).length > 0 ? (activeNearbyTab === 'services' ? nearby : outings).map((place, i) => {
              const lat = place.lat || place.center?.lat;
              const lon = place.lon || place.center?.lon;
              return (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 group-hover:border-blue-500/20 transition-all"
                >
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white truncate font-arabic">{place.tags?.name || (language === 'ar' ? 'مكان غير مسمى' : 'Unnamed Place')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{place.tags?.amenity || place.tags?.leisure || 'Point of Interest'}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold text-aeon-cyan flex items-center gap-1">
                          <Navigation className="w-2 h-2" />
                          {place.distance ? `${place.distance.toFixed(1)} km` : '---'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                          <Leaf className="w-2 h-2" />
                          {place.carbonScore ? `${place.carbonScore.toFixed(1)} kg` : '---'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 rounded-xl border border-blue-100 dark:border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <Navigation className="w-4 h-4" />
                  </a>
                </motion.div>
              );
            }) : (
              <div className="py-8 text-center">
                <p className="text-xs font-bold text-zinc-500 font-arabic">
                  {language === 'ar' ? 'لا توجد نتائج حالياً في هذه المنطقة' : 'No results found in this area'}
                </p>
                <button 
                  onClick={() => fetchData(true)}
                  className="mt-2 text-[10px] font-black text-egypt-gold uppercase tracking-widest hover:underline"
                >
                  {language === 'ar' ? 'إعادة المحاولة' : 'Retry Search'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Daily Competition Card */}
        <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-2xl border border-purple-100 dark:border-purple-500/20">
              <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-500" />
            </div>
            <h3 className="font-black text-base text-zinc-900 dark:text-white font-arabic">{language === 'ar' ? 'مسابقة اليوم' : 'Daily Quiz'}</h3>
          </div>
          {question && (
            <div className="space-y-4">
              <p className="text-sm font-bold leading-relaxed text-zinc-800 dark:text-zinc-200 font-arabic">
                {typeof question.question === 'object' ? (question.question[language] || question.question.ar || question.question.en) : question.question}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {question.options.map((opt: string, i: number) => (
                  <button key={i} className="p-3 rounded-xl text-xs font-bold transition-all border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-egypt-gold hover:text-egypt-black hover:border-egypt-gold font-arabic">
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Eco Loyalty Card */}
        <div className="bg-egypt-gold p-6 rounded-[2.5rem] text-egypt-black shadow-lg shadow-egypt-gold/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-3 bg-egypt-black/10 rounded-2xl border border-egypt-black/10">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base font-arabic">{language === 'ar' ? 'بطاقة الولاء' : 'Eco Loyalty'}</h3>
          </div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-24 h-24 bg-white p-2 rounded-2xl shadow-sm">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${user?.id || 'guest'}`} alt="QR" className="w-full h-full" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-bold uppercase opacity-60 tracking-widest">{language === 'ar' ? 'رصيدك' : 'Your Balance'}</p>
              <p className="text-4xl font-black tracking-tighter">{user?.points || 0}</p>
              <div className="flex items-center gap-1 mt-2 px-3 py-1 bg-egypt-black/10 rounded-full w-fit">
                <Award className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">{language === 'ar' ? 'المستوى الذهبي' : 'Gold Tier'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Footer */}
      <div className="mt-12 p-8 bg-zinc-50 dark:bg-white/5 rounded-[2rem] border border-zinc-200 dark:border-white/10 mx-4">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed text-center max-w-4xl mx-auto font-arabic">
          {language === 'ar' 
            ? 'النظام يعتمد على البيانات المفتوحة والخدمات المجانية. يتم جلب البيانات مباشرة من المصادر الرسمية وتحديثها دورياً لضمان الدقة.'
            : 'System relies on open data and free services. Data is fetched directly from official sources and updated regularly to ensure accuracy.'}
        </p>
      </div>
    </section>
  );
};

export default DailyServicesHub;
