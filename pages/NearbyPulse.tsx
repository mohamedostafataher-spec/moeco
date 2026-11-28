import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Navigation, MapPin, Search, Globe, 
  Utensils, Crosshair, Zap, Heart, ShoppingBag, Landmark,
  Footprints, Car, ArrowRight,
  Clock, Phone, AlertTriangle, CloudRain,
  Wind, ThermometerSun, Leaf, Activity, WifiOff, RefreshCcw,
  Volume2, Flame
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notificationService';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../services/supabaseClient';
import { MessageSquare } from 'lucide-react';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapUpdater: React.FC<{ coords: { lat: number; lng: number } | null }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView([coords.lat, coords.lng], 13, { animate: true });
  }, [coords, map]);
  return null;
};

interface ZoneData {
  id: number;
  lat: number;
  lng: number;
  type: 'aqi' | 'traffic' | 'eco';
  status: string;
  advice: string;
  color: string;
  radius: number;
}

interface PulseData {
  weather: { temp: number; desc: string; icon: any };
  aqi: { value: number; status: string; color: string; bg: string; border: string; advice: string };
  traffic: { status: string; color: string };
  envScore: number;
  envLevel: 'good' | 'moderate' | 'danger';
  envTitle: string;
  envAdvice: string;
  zones: ZoneData[];
  lastUpdated: Date;
}

const NearbyPulse: React.FC = () => {
  const { language, theme } = useApp();
  const isRtl = language === 'ar';
  
  const [pulseData, setPulseData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [localPosts, setLocalPosts] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);
  
  const hasSpoken = useRef(false);

  // Fetch Community Data for Map
  const fetchPulseExtras = async () => {
    if (!coords) return;
    try {
      // 1. Fetch Trending Community Posts (Nearby only in a real app with geo-queries)
      const { data: posts } = await supabase
        .from('community_posts')
        .select('*, users(full_name, avatar_url)')
        .order('likes_count', { ascending: false })
        .limit(3);
      setLocalPosts(posts || []);

      // 2. Fetch Environmental Reports as Hotspots
      const { data: reports } = await supabase
        .from('pollution_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      // 3. Fetch Environmental Data for Heatmap
      const { data: envData } = await supabase
        .from('environmental_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      const hotspotsData: any[] = [];

      if (reports) {
        reports.forEach((rep: any) => {
          if (rep.lat && rep.lng) {
            hotspotsData.push({
              id: `report-${rep.id}`,
              lat: rep.lat,
              lng: rep.lng,
              intensity: rep.level === 'high' ? 80 : 40,
              type: rep.type || 'general',
              label: isRtl ? rep.title : rep.title,
              description: isRtl ? rep.description : rep.description
            });
          }
        });
      }

      if (envData) {
        envData.forEach((log: any, i: number) => {
          if (log.lat && log.lng) {
            hotspotsData.push({
              id: `env-${log.id || i}`,
              lat: log.lat,
              lng: log.lng,
              intensity: Math.min(100, Math.round((log.aqi || 0))),
              type: 'aqi',
              label: isRtl ? 'بيانات بيئية' : 'Environmental Data'
            });
          }
        });
      }

      setHotspots(hotspotsData);
    } catch (e) {
      console.error("Pulse extras fetch failed", e);
    }
  };

  useEffect(() => {
    if (coords) {
      fetchPulseExtras();
      
      const channel = supabase.channel('pulse_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pollution_reports' }, () => fetchPulseExtras())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'environmental_data' }, () => fetchPulseExtras())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => fetchPulseExtras())
        .subscribe();
      
      return () => { supabase.removeChannel(channel); };
    }
  }, [coords]);

  // Get location
  useEffect(() => {
    const handleLocation = (lat: number, lng: number) => {
      setCoords({ lat, lng });
    };

    // Default to Cairo
    handleLocation(30.0444, 31.2357);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => handleLocation(pos.coords.latitude, pos.coords.longitude),
        () => console.warn("Location denied. Using default.")
      );
    }
  }, []);

  const speakAlert = (text: string) => {
    if (!('speechSynthesis' in window) || hasSpoken.current) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isRtl ? 'ar-SA' : 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    hasSpoken.current = true;
    
    // Also trigger haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  // Fetch Live Data & Compute Smart Analytics
  const fetchLiveData = async () => {
    if (!coords) return;
    setLoading(true);
    setErrorMessage('');
    
    try {
      // 1. Fetch Weather
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,weather_code`);
      const weatherData = await weatherRes.json();
      const temp = weatherData.current?.temperature_2m || 25;
      
      // 2. Fetch AQI
      const aqiRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.lat}&longitude=${coords.lng}&current=european_aqi`);
      const aqiData = await aqiRes.json();
      const aqiScore = aqiData.current?.european_aqi || 40;

      // Determine Base AQI Status
      let aqiStatus = { status: isRtl ? 'جيد جداً' : 'Very Good', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', advice: isRtl ? 'الهواء نقي، استمتع بوقتك بالخارج!' : 'Air is clean, enjoy outside!' };
      let aqiPoints = 4;
      
      if (aqiScore > 50 && aqiScore <= 100) {
        aqiStatus = { status: isRtl ? 'متوسط' : 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', advice: isRtl ? 'الجودة مقبولة، ولكن قلل من المجهود الشاق.' : 'Acceptable, but reduce heavy exertion.' };
        aqiPoints = 2;
      } else if (aqiScore > 100) {
        aqiStatus = { status: isRtl ? 'غير صحي' : 'Unhealthy', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', advice: isRtl ? 'تلوث عالٍ، تجنب الأنشطة الخارجية.' : 'High pollution, avoid outdoor activities.' };
        aqiPoints = 0;
      }

      // Traffic
      const currentHour = new Date().getHours();
      const isRushHour = (currentHour >= 8 && currentHour <= 10) || (currentHour >= 14 && currentHour <= 17);
      const trafficStatus = isRushHour ? { status: isRtl ? 'زحام شديد' : 'Heavy Traffic', color: 'text-rose-500' } : { status: isRtl ? 'سيولة مرورية' : 'Normal Traffic', color: 'text-emerald-500' };
      const trafficPoints = isRushHour ? 0 : 3;

      // Temp Points
      let tempPoints = 3;
      if (temp > 35 || temp < 5) tempPoints = 0;
      else if (temp > 30 || temp < 15) tempPoints = 1;

      // Smart Aggregate Score (0-10)
      const envScore = aqiPoints + trafficPoints + tempPoints;
      let envLevel: 'good' | 'moderate' | 'danger' = 'danger';
      let envTitle = '';
      let envAdvice = '';

      if (envScore >= 7) {
        envLevel = 'good';
        envTitle = isRtl ? 'مناخ ممتاز للخروج' : 'Excellent conditions';
        envAdvice = isRtl ? 'الطقس رائع والهواء نقي. استمتع بيومك بالكامل!' : 'Great weather and clean air. Enjoy your day!';
      } else if (envScore >= 4) {
        envLevel = 'moderate';
        envTitle = isRtl ? 'أجواء متوسطة الجودة' : 'Moderate conditions';
        envAdvice = isRtl ? 'الأمور مستقرة، لكن انتبه للزحام أو تقلبات الحرارة.' : 'Fair conditions, be mindful of traffic or temp shifts.';
      } else {
        envLevel = 'danger';
        envTitle = isRtl ? 'تحذير بيئي: يفضل البقاء بالداخل' : 'Alert: Better stay indoors';
        envAdvice = isRtl ? 'الظروف غير مناسبة (تلوث أو حرارة/برودة مفرطة، وزحام). يُرجى توخي الحذر.' : 'Poor conditions (pollution, extreme temp, or traffic). Be careful.';
        
        // Trigger smart alert
        speakAlert(envTitle + ". " + envAdvice);
      }

      // 3. Dynamic Zones from Supabase
      let zones: ZoneData[] = [];
      const { data: dbZones } = await supabase
        .from('environmental_pulse_zones')
        .select('*')
        .limit(10);

      if (dbZones && dbZones.length > 0) {
        zones = dbZones.map((z: any) => ({
          id: z.id,
          lat: z.lat,
          lng: z.lng,
          type: z.type as any,
          status: isRtl ? (z.status_ar || z.status_en) : (z.status_en || z.status_ar),
          advice: isRtl ? (z.advice_ar || z.advice_en) : (z.advice_en || z.advice_ar),
          color: z.color || 'blue',
          radius: z.radius || 500
        }));
      } else {
        // Fallback: Create zones based on active environmental reports if no zone table
        const { data: zoneReports } = await supabase
          .from('environmental_reports')
          .select('*')
          .eq('status', 'Pending')
          .limit(3);
        
        if (zoneReports && zoneReports.length > 0) {
          zones = zoneReports.map((r: any, idx: number) => ({
            id: idx + 100,
            lat: r.location_lat,
            lng: r.location_lng,
            type: r.category === 'garbage' ? 'aqi' : 'traffic',
            status: r.title,
            advice: r.description,
            color: r.category === 'garbage' ? 'amber' : 'red',
            radius: 400
          }));
        } else {
          zones = [];
        }
      }

      // Derive Weather Description
      const weatherCodes: Record<number, { ar: string, en: string }> = {
        0: { ar: 'صافي', en: 'Clear sky' },
        1: { ar: 'مشمس غالباً', en: 'Mainly clear' },
        2: { ar: 'غائم جزئياً', en: 'Partly cloudy' },
        3: { ar: 'غائم', en: 'Overcast' },
        45: { ar: 'ضباب', en: 'Fog' },
        48: { ar: 'ضباب جليدي', en: 'Depositing rime fog' },
        51: { ar: 'رذاذ خفيف', en: 'Light drizzle' },
        61: { ar: 'أمطار خفيفة', en: 'Light rain' },
        71: { ar: 'ثلوج خفيفة', en: 'Light snow' },
        95: { ar: 'عواصف رعدية', en: 'Thunderstorm' },
      };
      
      const weatherDesc = weatherCodes[weatherData.current?.weather_code] || { ar: 'مشمس', en: 'Sunny' };

      setPulseData({
        weather: { temp: Math.round(temp), desc: isRtl ? weatherDesc.ar : weatherDesc.en, icon: ThermometerSun },
        aqi: { value: Math.round(aqiScore), ...aqiStatus },
        traffic: trafficStatus,
        envScore,
        envLevel,
        envTitle,
        envAdvice,
        zones,
        lastUpdated: new Date()
      });

    } catch (err) {
      console.error(err);
      // Fallback
      setErrorMessage(isRtl ? 'نعتذر، لا توجد تغطية لحظية حالياً. جاري عرض داتا محفوظة.' : 'Sorry, no live data right now. Showing cached data.');
      setPulseData({
        weather: { temp: 25, desc: 'Offline', icon: WifiOff },
        aqi: { value: 0, status: 'N/A', color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', advice: 'No data' },
        traffic: { status: 'Unknown', color: 'text-slate-500' },
        envScore: 5,
        envLevel: 'moderate',
        envTitle: 'Offline Mode',
        envAdvice: isRtl ? 'البيانات غير متوفرة حالياً' : 'Data currently unavailable',
        zones: [],
        lastUpdated: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 15 * 60 * 1000); // every 15 min
    return () => clearInterval(interval);
  }, [coords]);

  const levelColor = pulseData?.envLevel === 'good' ? 'text-emerald-500' :
                     pulseData?.envLevel === 'moderate' ? 'text-amber-500' : 'text-rose-500';
  const levelBG = pulseData?.envLevel === 'good' ? 'bg-emerald-500' :
                  pulseData?.envLevel === 'moderate' ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className={`min-h-screen pb-24 overflow-x-hidden flex flex-col ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`}>
      <div className="safe-area-top" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-emerald-500/10 dark:border-white/5 py-4 px-4 sm:px-6">
        <div className="w-full max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
               <Activity className="text-emerald-500" size={24} />
               <span className="truncate">{isRtl ? 'نبض الأماكن' : 'Live Pulse'}</span>
            </h1>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 mt-1 flex items-center gap-1">
              <MapPin size={12} className="text-emerald-600" /> {isRtl ? 'تحليل لحظي وذكاء بيئي' : 'Live Environmental Intelligence'}
            </p>
          </div>
          {pulseData?.envLevel === 'danger' && (
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
               <AlertTriangle size={20} />
            </motion.div>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">
        {/* Smart Analytics Insight Panel */}
        <div className={`rounded-[2rem] p-6 shadow-xl border relative overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
          <div className="relative z-10 flex flex-col gap-6">
             <div className="flex justify-between items-center">
                <h2 className="text-sm font-black uppercase tracking-widest">{isRtl ? 'القرار الذكي' : 'Smart Decision'}</h2>
                <div className="text-[10px] sm:text-xs font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full flex items-center gap-1 shrink-0">
                  <Clock size={10} />
                  {pulseData ? pulseData.lastUpdated.toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </div>
             </div>

             {loading ? (
                <div className="space-y-4">
                   <div className={`h-20 w-full rounded-2xl animate-pulse ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`} />
                   <div className="grid grid-cols-3 gap-2">
                     <div className={`h-24 rounded-2xl animate-pulse ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`} />
                     <div className={`h-24 rounded-2xl animate-pulse ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`} />
                     <div className={`h-24 rounded-2xl animate-pulse ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`} />
                   </div>
                </div>
             ) : errorMessage && !pulseData ? (
                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 text-center border overflow-hidden border-dashed border-slate-300 dark:border-white/10">
                   <WifiOff className="mx-auto text-slate-400 mb-2" size={32} />
                   <p className="text-sm font-bold text-slate-500">{errorMessage}</p>
                   <button onClick={fetchLiveData} className="mt-4 bg-emerald-500 text-white px-6 py-2 rounded-xl text-xs font-black mx-auto">
                     {isRtl ? 'إعادة المحاولة' : 'Retry'}
                   </button>
                </div>
             ) : pulseData && (
                <div className="space-y-6">
                   {/* Big Alert Card */}
                   <div className={`p-5 rounded-2xl border flex gap-4 items-start ${pulseData.envLevel === 'danger' ? 'bg-rose-500/10 border-rose-500/20' : pulseData.envLevel === 'moderate' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg ${levelBG}`}>
                        {pulseData.envLevel === 'danger' ? <AlertTriangle size={20} /> : pulseData.envLevel === 'moderate' ? <Activity size={20} /> : <Leaf size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                         <h3 className={`text-base sm:text-lg font-black mb-1 truncate ${levelColor}`}>{pulseData.envTitle}</h3>
                         <p className={`text-xs sm:text-sm font-bold leading-relaxed opacity-90 break-words ${levelColor}`}>{pulseData.envAdvice}</p>
                      </div>
                      {pulseData.envLevel === 'danger' && (
                        <button onClick={() => speakAlert(pulseData.envAdvice)} className={`p-2 rounded-full hover:bg-white/20 transition-colors shrink-0 ${levelColor}`}>
                           <Volume2 size={20} />
                        </button>
                      )}
                   </div>
                   
                   {/* Detailed Metrics */}
                   <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      {/* AQI */}
                      <div className={`p-3 sm:p-4 rounded-2xl border ${pulseData.aqi.bg} ${pulseData.aqi.border} flex flex-col items-center justify-center text-center`}>
                         <Wind className={pulseData.aqi.color} size={20} />
                         <div className={`text-lg sm:text-2xl font-black mt-2 mb-1 ${pulseData.aqi.color}`}>{pulseData.aqi.value}</div>
                         <div className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest break-words ${pulseData.aqi.color}`}>{pulseData.aqi.status}</div>
                      </div>
                      {/* Temp */}
                      <div className={`p-3 sm:p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'} flex flex-col items-center justify-center text-center`}>
                        <pulseData.weather.icon className="text-amber-500" size={20} />
                        <div className="text-lg sm:text-2xl font-black mt-2 mb-1">{pulseData.weather.temp}°</div>
                        <div className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest break-words">{pulseData.weather.desc}</div>
                      </div>
                      {/* Traffic */}
                      <div className={`p-3 sm:p-4 rounded-2xl border ${pulseData.traffic.status.includes('زحام') || pulseData.traffic.status.includes('Heavy') ? 'bg-rose-500/10 border-rose-500/20' : theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'} flex flex-col items-center justify-center text-center`}>
                        <Car className={pulseData.traffic.color} size={20} />
                        <div className="text-sm font-black mt-3 mb-1 break-words leading-tight px-1">{pulseData.traffic.status}</div>
                        <div className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mt-1">{isRtl ? 'حالة المرور' : 'Traffic'}</div>
                      </div>
                   </div>
                </div>
             )}
          </div>
        </div>

        {/* Live Interactive Map Area */}
        <div className={`flex-1 rounded-[2.5rem] shadow-2xl border overflow-hidden min-h-[450px] relative transition-all duration-500 hover:shadow-emerald-500/10 ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
           {/* Radar Pulse Effect */}
           <div className="absolute inset-0 pointer-events-none z-0">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[length:32px_32px] animate-[pulse_8s_linear_infinite]" />
           </div>

           <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
             <div className="bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-xl px-5 py-2.5 rounded-2xl text-[10px] font-black shadow-2xl border border-white/10 flex items-center gap-3 text-white">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </div>
                <span className="tracking-widest uppercase">{isRtl ? 'خريطة النبض الحي' : 'Live Environment Radar'}</span>
             </div>
             
             {hotspots.length > 0 && (
               <motion.div 
                 initial={{ x: -20, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 className="bg-amber-500/95 backdrop-blur-md px-4 py-2 rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-xl flex items-center gap-2 border border-white/10"
               >
                 <Flame size={14} className="animate-bounce" /> {isRtl ? 'رصد بؤر انبعاثات نشطة' : 'Active Hotspots Detected'}
               </motion.div>
             )}
           </div>

           <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
              <button 
                onClick={fetchLiveData}
                className="p-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 hover:scale-105 active:scale-95 transition-all"
              >
                <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
           </div>
           
           {!loading && coords ? (
              <MapContainer center={[coords.lat, coords.lng]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer
                  url={theme === 'dark' 
                    ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                    : "https://tile.openstreetmap.org/{z}/{x}/{y}.png"}
                />
                <MapUpdater coords={coords} />
                
                {/* User Marker */}
                <Marker position={[coords.lat, coords.lng]}>
                  <Popup className="font-sans font-bold">
                    <div className="text-center">
                       <span className="block text-emerald-600 mb-1">{isRtl ? 'موقعك الحالي' : 'Your Location'}</span>
                       <span className="text-[10px] text-slate-500 font-normal">{pulseData?.envTitle}</span>
                    </div>
                  </Popup>
                </Marker>

                {/* Hotspots Analysis */}
                {hotspots.map(h => (
                   <Circle 
                    key={`hotspot-${h.id}`}
                    center={[h.lat, h.lng]} 
                    radius={h.intensity > 50 ? 300 : 150} 
                    pathOptions={{ 
                      color: h.type === 'garbage' ? '#f59e0b' : h.type === 'carbon' ? '#6366f1' : '#ef4444', 
                      fillColor: h.type === 'garbage' ? '#fbbf24' : h.type === 'carbon' ? '#818cf8' : '#f87171', 
                      fillOpacity: 0.15, 
                      weight: 0 
                    }}
                  >
                    <Popup className="font-sans">
                      <div className="p-1">
                        <strong className="block text-xs uppercase mb-1">{h.label}</strong>
                        {h.description && <p className="text-[10px] text-slate-500 leading-tight">{h.description}</p>}
                      </div>
                    </Popup>
                  </Circle>
                ))}
 
                {/* Dynamic Pulse Zones */}
                {pulseData?.zones.map(zone => (
                  <React.Fragment key={zone.id}>
                    <Circle 
                      center={[zone.lat, zone.lng]} 
                      radius={zone.radius} 
                      pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: 0.2, weight: 1 }}
                    />
                    <Marker position={[zone.lat, zone.lng]} opacity={0.8}>
                      <Popup className="font-sans">
                         <div className="p-1 min-w-[150px]">
                           <strong className={`block mb-1 text-sm ${zone.color === 'red' ? 'text-rose-500' : 'text-emerald-500'}`}>{zone.status}</strong>
                           <span className="block text-xs text-slate-600">{zone.advice}</span>
                         </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                ))}

              </MapContainer>
           ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-center p-6">
                 <div className="flex flex-col items-center gap-4">
                   <div className="relative">
                      <div className="animate-ping absolute inset-0 rounded-full bg-emerald-500/20" />
                      <div className="relative bg-emerald-500 p-4 rounded-full text-white">
                        <Activity size={32} />
                      </div>
                   </div>
                   <span className="text-xs font-black text-slate-400 tracking-[0.3em] uppercase">{isRtl ? 'جاري رسم النبض الحي...' : 'Mapping Live Pulse...'}</span>
                 </div>
              </div>
           )}
        </div>

        {/* Hotspots Analysis Legend */}
        <div className="flex flex-col gap-4">
           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">{isRtl ? 'تحليل البؤر النشطة' : 'Hotspot Intelligence'}</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-6 rounded-[2rem] border flex items-center gap-5 ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                 <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                    <Zap size={24} />
                 </div>
                 <div>
                    <h4 className="font-black text-sm mb-0.5">{isRtl ? 'نقاط الزحام' : 'Traffic Nodes'}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                       {isRtl ? 'مناطق الانبعاثات العالية بسبب كثافة السيارات' : 'High emission points due to vehicle density'}
                    </p>
                 </div>
              </div>
              <div className={`p-6 rounded-[2rem] border flex items-center gap-5 ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                 <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                    <Leaf size={24} />
                 </div>
                 <div>
                    <h4 className="font-black text-sm mb-0.5">{isRtl ? 'جيوب الأكسجين' : 'Oxygen Pockets'}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                       {isRtl ? 'مساحات خضراء قريبة ذات جودة هواء ممتازة' : 'Nearby green spaces with optimal air quality'}
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Social Pulse Section */}
        {localPosts.length > 0 && (
          <div className="flex flex-col gap-4">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={16} className="text-emerald-500" />
                  {isRtl ? 'نبض المجتمع القريب' : 'Nearby Social Pulse'}
                </h3>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               {localPosts.map((post, i) => (
                 <motion.div 
                   key={post.id} 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: i * 0.1 }}
                   className={`p-4 rounded-[1.5rem] border ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}
                 >
                   <div className="flex items-center gap-3 mb-3">
                     <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs">
                        {post.users?.avatar_url ? <img src={post.users.avatar_url} className="w-full h-full rounded-full object-cover" /> : post.users?.full_name?.charAt(0)}
                     </div>
                     <span className="text-[10px] font-bold truncate opacity-80">{post.users?.full_name}</span>
                   </div>
                   <p className="text-[10px] sm:text-xs font-medium line-clamp-2 mb-3 opacity-90 leading-relaxed italic">"{post.content}"</p>
                   <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                     <Heart size={10} className="fill-emerald-500" /> {post.likes_count} {isRtl ? 'إعجاب' : 'likes'}
                   </div>
                 </motion.div>
               ))}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NearbyPulse;
