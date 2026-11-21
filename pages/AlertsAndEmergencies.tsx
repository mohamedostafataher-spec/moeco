import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { weatherService, WeatherData } from '../services/weatherService';
import { 
  ShieldAlert, AlertTriangle, Globe, MapPin, 
  X, Activity, Zap, Volume2, VolumeX, Share2, RefreshCw, 
  Droplets, Flame, ExternalLink, Search, Sun, Wind, CheckCircle, Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { alertService } from '../services/alertService';
import { supabase } from '../services/supabaseClient';
import { notificationService } from '../services/notificationService';
import { useAccessibility } from '../context/AccessibilityContext';
import { aiService } from '../services/aiService';
import { EcoAlert } from '../types';

const CATEGORY_ICONS: Record<string, any> = {
  emergency: ShieldAlert,
  environmental: Wind,
  weather: Sun,
  energy: Zap,
  water: Droplets,
  gas: Flame,
  government: Globe,
  general: Info
};

const CATEGORY_NAMES_AR: Record<string, string> = {
  emergency: 'طوارئ',
  environmental: 'بيئة',
  weather: 'طقس',
  energy: 'طاقة',
  water: 'مياه',
  gas: 'غاز',
  government: 'حكومي',
  general: 'عام'
};

const SEVERITY_LOGIC = {
   critical: { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
   high: { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
   medium: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
   low: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
};

const EMERGENCY_NUMBERS = [
  { name: { ar: 'الإسعاف', en: 'Ambulance' }, phone: '123', color: 'bg-rose-500' },
  { name: { ar: 'النجدة', en: 'Police' }, phone: '122', color: 'bg-sky-500' },
  { name: { ar: 'المطافئ', en: 'Fire' }, phone: '180', color: 'bg-orange-500' },
  { name: { ar: 'الكهرباء', en: 'Electricity' }, phone: '121', color: 'bg-amber-500' },
  { name: { ar: 'الغاز', en: 'Gas' }, phone: '129', color: 'bg-zinc-500' }
];

const AlertsAndEmergencies: React.FC = () => {
  const { language, theme, isRtl } = useApp();
  const { speak } = useAccessibility();
  
  const [alerts, setAlerts] = useState<EcoAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<EcoAlert | null>(null);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('moeco_alerts_muted') === 'true');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [aiBriefing, setAiBriefing] = useState<string>('');
  
  const handleShare = async (alert: EcoAlert) => {
    const title = language === 'ar' ? alert.title.ar : alert.title.en;
    const text = language === 'ar' ? alert.message.ar : alert.message.en;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: window.location.href });
      } catch (e) {
        console.warn("Share failed", e);
      }
    } else {
      notificationService.info(isRtl ? 'تم نسخ الرابط' : 'Link copied');
    }
  };

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await alertService.fetchAlerts();
      setAlerts(data);
      
      const weatherData = await weatherService.getWeather(30.0444, 31.2357, language);
      setWeather(weatherData);

      try {
          // AI briefing now runs even if alerts are 0 because it includes seasonal data
          const briefing = await aiService.getEmergencyBriefing(data.slice(0,3), [], language);
          setAiBriefing(briefing);
      } catch (e) {
          console.warn("Briefing error", e);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchAlerts();
    
    // Realtime Supabase Listeners
    const alertChannel = supabase.channel('public:alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, () => {
         fetchAlerts();
         if (!isMuted) alertService.playEmergencySound('New Alert', 'Please check the alerts dashboard.', language);
      })
      .subscribe();
      
    const userChannel = supabase.channel('public:user_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_notifications' }, () => {
         fetchAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(alertChannel);
      supabase.removeChannel(userChannel);
    };
  }, [fetchAlerts, isMuted, language]);

  const toggleMute = () => {
     const newVal = !isMuted;
     setIsMuted(newVal);
     localStorage.setItem('moeco_alerts_muted', String(newVal));
     if (!newVal) {
         alertService.stopEmergencySound();
     }
  };

  const markAsRead = async (id: string, isPersonal: boolean, e: React.MouseEvent) => {
     e.stopPropagation();
     // Optimistically remove from UI
     setAlerts(prev => prev.filter(a => a.id !== id));
     
     if (isPersonal) {
        try {
           await supabase.from('user_notifications').update({ is_read: true }).eq('id', id);
        } catch (e) {
            console.error(e);
        }
     }
  };

  const categories = Array.from(new Set(alerts.map(a => a.category).filter(Boolean)));
  
  const filteredAlerts = alerts.filter(a => {
     const matchesSearch = searchQuery === '' || 
        a.title.ar.includes(searchQuery) || 
        a.title.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.message.ar.includes(searchQuery) ||
        a.message.en.toLowerCase().includes(searchQuery.toLowerCase());
     const matchesCategory = activeFilter === 'all' || a.category === activeFilter;
     return matchesSearch && matchesCategory;
  });

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0a0a0c] text-white' : 'bg-slate-50 text-slate-900'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* HEADER */}
      <header className="px-6 py-10 md:px-12 border-b border-zinc-200 dark:border-white/5 relative overflow-hidden bg-white dark:bg-[#0d0d0f]">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-sky-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-rose-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-rose-500/10 text-rose-500 text-[10px] uppercase font-black tracking-widest border border-rose-500/20">
               <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_#f43f5e]" />
               {isRtl ? 'مركز الطوارئ الذكي' : 'SMART EMERGENCY CENTER'}
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-tight font-display text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-rose-500">
               {isRtl ? 'تنبيهات مصر' : 'MoEco Alerts'}
            </h1>
            <p className="mt-4 text-sm font-bold text-zinc-500 max-w-xl leading-relaxed">
               {isRtl 
                  ? 'منصتك المباشرة لمتابعة الطوارئ البيئية، إشعارات الاستهلاك الخاصة بك، وتوجيهات الحكومة اللحظية.'
                  : 'Your live platform for environmental emergencies, personal consumption alerts, and real-time government directives.'}
            </p>
          </div>
          
          <div className="flex gap-3">
             <button onClick={toggleMute} className={`p-4 rounded-2xl flex items-center justify-center transition-all ${isMuted ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'}`}>
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
             </button>
             <button onClick={fetchAlerts} className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                <RefreshCw size={24} className={loading ? 'animate-spin text-sky-500' : ''} />
             </button>
          </div>
        </div>

        {weather && weather.aqi > 100 && (
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-7xl mx-auto mt-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3">
                <AlertTriangle className="text-rose-500" />
                <span className="text-sm font-bold text-rose-500">{isRtl ? 'تحذير تلوث: جودة الهواء الحالية غير صحية. يرجى البقاء في الداخل إذا أمكن.' : 'Pollution Alert: Current air quality is unhealthy. Stay indoors if possible.'}</span>
            </motion.div>
        )}

        {aiBriefing && (
           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-7xl mx-auto mt-8 p-6 bg-gradient-to-r from-slate-900 to-slate-800 border-l-4 border-sky-500 rounded-[2rem] shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-3xl -mr-10 -mt-10" />
              <div className="flex items-center gap-4 relative z-10">
                 <div className="w-12 h-12 bg-sky-500/20 rounded-2xl flex items-center justify-center border border-sky-500/30 shrink-0 group-hover:scale-110 transition-transform">
                    <Activity className="text-sky-400 animate-pulse" />
                 </div>
                 <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-sky-400">{isRtl ? 'المحلل الذكي (MoEco)' : 'MoEco Smart Analyzer'}</h4>
                       <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-500 text-[8px] font-black rounded uppercase">{isRtl ? 'مجاني' : 'FREE'}</span>
                    </div>
                    <p className="text-sm font-bold text-sky-50 leading-relaxed">{aiBriefing}</p>
                 </div>
              </div>
           </motion.div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-8">
         {/* EMERGENCY NUMBERS */}
         <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
            {EMERGENCY_NUMBERS.map((num) => (
               <a 
                  key={num.phone}
                  href={`tel:${num.phone}`}
                  className="flex items-center justify-between p-4 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl hover:scale-[1.02] transition-all group"
               >
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">{isRtl ? num.name.ar : num.name.en}</p>
                    <p className="text-lg font-black font-mono">{num.phone}</p>
                  </div>
                  <div className={`w-8 h-8 ${num.color} rounded-xl flex items-center justify-center text-white shadow-lg opacity-80 group-hover:opacity-100 group-hover:rotate-12 transition-all`}>
                     <RefreshCw size={14} className="group-hover:animate-spin" />
                  </div>
               </a>
            ))}
         </div>
         {/* CONTROLS */}
         <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
            <div className="relative w-full md:w-96">
               <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
               <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={isRtl ? 'ابحث في التنبيهات...' : 'Search alerts...'}
                  className="w-full h-14 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl px-6 pr-14 text-sm font-bold outline-none focus:border-sky-500 transition-colors"
               />
            </div>
            
            <div className="flex w-full md:w-auto overflow-x-auto no-scrollbar gap-2 pb-2 md:pb-0">
               <button 
                  onClick={() => setActiveFilter('all')}
                  className={`min-w-fit px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${activeFilter === 'all' ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-lg' : 'bg-white dark:bg-white/5 text-zinc-500 border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/10'}`}
               >
                  {isRtl ? 'الكل' : 'All'}
               </button>
               {categories.map((cat: any) => (
                  <button 
                     key={cat} onClick={() => setActiveFilter(cat)}
                     className={`min-w-fit px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 ${activeFilter === cat ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'bg-white dark:bg-white/5 text-zinc-500 border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/10'}`}
                  >
                     {isRtl ? CATEGORY_NAMES_AR[cat.toLowerCase()] || cat : cat}
                  </button>
               ))}
            </div>
         </div>

         {/* ALERTS GRID */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
               {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 rounded-[2rem] bg-zinc-200 dark:bg-white/5 animate-pulse" />)
               ) : filteredAlerts.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 flex flex-col items-center justify-center opacity-50">
                     <ShieldAlert size={64} className="text-emerald-500 mb-6 opacity-50" />
                     <p className="text-xl font-black text-emerald-500 uppercase tracking-widest">{isRtl ? 'الوضع مستقر.. لا إنذارات حالياً' : 'All Clear.. No Active Alerts'}</p>
                  </motion.div>
               ) : (
                  filteredAlerts.map((alert, i) => {
                     const severityKey = alert.severity?.toLowerCase() as keyof typeof SEVERITY_LOGIC;
                     const severityConfig = SEVERITY_LOGIC[severityKey] || SEVERITY_LOGIC.low;
                     const Icon = CATEGORY_ICONS[alert.category?.toLowerCase()] || AlertTriangle;
                     const isPersonal = (alert as any).isPersonal;

                     return (
                        <motion.div 
                           key={alert.id}
                           layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                           onClick={() => {
                              setSelectedAlert(alert);
                              if (!isMuted) {
                                 alertService.playEmergencySound(isRtl ? alert.title.ar : alert.title.en, isRtl ? alert.message.ar : alert.message.en, language);
                                 if ('vibrate' in navigator) navigator.vibrate([500, 200, 500]);
                              }
                           }}
                           className={`p-6 rounded-[2rem] border backdrop-blur-md cursor-pointer transition-transform hover:scale-[1.02] flex flex-col h-[320px] ${severityConfig.bg} ${severityConfig.border} shadow-lg shadow-black/5 ${alert.severity?.toLowerCase() === 'critical' ? 'animate-shake' : ''}`}
                           dir={isRtl ? 'rtl' : 'ltr'}
                        >
                           <div className="flex justify-between items-start mb-6">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white dark:bg-black/50 shadow-sm ${severityConfig.color}`}>
                                 <Icon size={24} />
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                 {isPersonal && <span className="px-2 py-1 bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-lg text-[9px] font-black uppercase tracking-widest">{isRtl ? 'إشعار شخصي' : 'Personal'}</span>}
                                 <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white dark:bg-black/50 shadow-sm ${severityConfig.color}`}>
                                    {alert.severity}
                                 </span>
                                 <span className="text-[10px] font-bold text-zinc-500">{new Date(alert.created_at).toLocaleDateString()}</span>
                              </div>
                           </div>

                           <h3 className={`text-lg font-black leading-tight mb-3 line-clamp-2 ${severityConfig.color}`}>{isRtl ? alert.title.ar : alert.title.en}</h3>
                           <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-6 flex-1">
                              {isRtl ? alert.message.ar : alert.message.en}
                           </p>

                           <div className="flex items-center justify-between pt-4 border-t border-zinc-200/50 dark:border-white/10 mt-auto">
                              <div className="flex items-center gap-1.5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                 <MapPin size={12} />
                                 <span className="truncate max-w-[150px]">{alert.location?.city || (isRtl ? 'كل مصر' : 'All Egypt')}</span>
                              </div>
                              <button
                                 onClick={(e) => markAsRead(alert.id, !!isPersonal, e)}
                                 className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors"
                              >
                                 <X size={18} />
                              </button>
                           </div>
                        </motion.div>
                     );
                  })
               )}
            </AnimatePresence>
         </div>
      </main>

      {/* DETAIL MODAL */}
      <AnimatePresence>
         {selectedAlert && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setSelectedAlert(null)}>
               <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden border border-zinc-200 dark:border-white/10">
                  
                  <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] -mx-20 -my-20 rounded-full opacity-50 ${SEVERITY_LOGIC[selectedAlert.severity?.toLowerCase() as keyof typeof SEVERITY_LOGIC]?.bg}`} />

                  <div className="relative z-10">
                     <button onClick={() => setSelectedAlert(null)} className="absolute top-0 right-0 p-3 bg-zinc-100 dark:bg-white/10 rounded-full hover:bg-rose-100 hover:text-rose-500 transition-colors text-zinc-500">
                        <X size={18} />
                     </button>
                     
                     <div className="mb-6 pt-4">
                        <span className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest mb-4 ${SEVERITY_LOGIC[selectedAlert.severity?.toLowerCase() as keyof typeof SEVERITY_LOGIC]?.bg} ${SEVERITY_LOGIC[selectedAlert.severity?.toLowerCase() as keyof typeof SEVERITY_LOGIC]?.color}`}>
                           {selectedAlert.severity} PRIORITY
                        </span>
                        <h2 className="text-2xl font-black leading-tight mb-2">{isRtl ? selectedAlert.title.ar : selectedAlert.title.en}</h2>
                        <p className="text-xs font-bold text-zinc-500">{new Date(selectedAlert.created_at).toLocaleString()}</p>
                     </div>

                     <div className="p-6 bg-zinc-50 dark:bg-white/5 rounded-3xl mb-8">
                        <p className="text-sm font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
                           {isRtl ? selectedAlert.message.ar : selectedAlert.message.en}
                        </p>
                     </div>

                     <div className="flex gap-3">
                        {selectedAlert.source?.url && selectedAlert.source.url !== '#' && (
                           <a href={selectedAlert.source.url} target="_blank" rel="noopener noreferrer" className="flex-[2] py-4 bg-sky-500 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-sky-500/30 hover:bg-sky-600 transition-all">
                              <ExternalLink size={16} />
                              {isRtl ? 'المصدر والتفاصيل' : 'Source Details'}
                           </a>
                        )}
                        <button onClick={() => speak(isRtl ? selectedAlert.message.ar : selectedAlert.message.en)} className="flex-1 py-4 bg-zinc-100 dark:bg-white/10 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest text-zinc-700 dark:text-white">
                           <Volume2 size={16} />
                           {isRtl ? 'استماع' : 'Listen'}
                        </button>
                        <button onClick={() => handleShare(selectedAlert)} className="flex-1 py-4 bg-zinc-100 dark:bg-white/10 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest text-zinc-700 dark:text-white">
                           <Share2 size={16} />
                           {isRtl ? 'مشاركة' : 'Share'}
                        </button>
                     </div>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
};

export default AlertsAndEmergencies;
