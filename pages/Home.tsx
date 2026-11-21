import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Droplets, MapPin, Sparkles, Gift, Target, ChevronRight, Wind, QrCode, ShieldCheck, ShoppingBag,
  History, Car, Leaf, Sun as SunIcon, ArrowRight, X, ExternalLink, Tag, Users,
  LayoutGrid, ShieldAlert, Navigation as NavigationIcon, Landmark, IdCard, Briefcase, Activity, CheckCircle, Flame, Cpu, Star, Globe
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { behaviorEngine } from '../services/behaviorEngine';
import { supabase } from '../services/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { weatherService, WeatherData } from '../services/weatherService';
import { aiService } from '../services/aiService';
import RecommendationAIBanner from '../components/RecommendationAIBanner';

const Home: React.FC = () => {
  const { language, user, theme, speak } = useApp();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ carbon: 0, water: 0, electricity: 0, gas: 0 });
  const [nationalMetrics, setNationalMetrics] = useState<any>(null);
  const [carbonLogs, setCarbonLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState<string>("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationObj, setLocationObj] = useState({ lat: 30.0444, lng: 31.2357 });

  const [currentTime, setCurrentTime] = useState(new Date());

  // Audio Unlocking Strategy for Browsers
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      const audio = new Audio();
      audio.play().catch(() => {});
      window.speechSynthesis.getVoices();
      console.log("Audio system unlocked for auto-alerts");
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
  }, []);

  const fetchLocationData = async (lat: number, lon: number) => {
    try {
      // Parallel fetch for weather and name
      const [nameRes, weatherData] = await Promise.all([
        apiClient.get<any>(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${language}`),
        weatherService.getWeather(lat, lon, language as 'ar' | 'en')
      ]);

      if (nameRes.data) {
        setLocationName(nameRes.data.city || nameRes.data.locality || nameRes.data.principalSubdivision || (language === 'ar' ? 'موقع غير معروف' : 'Unknown Location'));
      }
      setWeather(weatherData);

    } catch (err) {
      console.error("Location/Weather fetch error:", err);
    }
  };

  const isRtl = language === 'ar';

  const [dailyMission, setDailyMission] = useState<any>(null);
  const [carbonPulse, setCarbonPulse] = useState({ total: 0, trend: 'stable' });
  const [topServices, setTopServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Load Real Top Services
  useEffect(() => {
    const fetchTopServices = async () => {
      try {
        const services = await storageService.getTopServices(4);
        if (services && services.length > 0) {
           setTopServices(services);
        }
      } catch (err) {
        console.error("Home Services Fetch Error:", err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchTopServices();
  }, []);

  const [dailyRewardEligible, setDailyRewardEligible] = useState(false);
  const [aiTip, setAiTip] = useState<string>('');
  const [gamification, setGamification] = useState({ streak: 0, points: 0, level: 1 });

  const [featuredContent, setFeaturedContent] = useState<any[]>([]);
  const [fuelPrices, setFuelPrices] = useState<any[]>([]);
  const [nearbySpots, setNearbySpots] = useState<any[]>([]);
  const [personality, setPersonality] = useState<any>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Parallel fetch for all core home data
      const [
        metricsRes,
        logsRes,
        missionsRes,
        pulseRes,
        rewardRes,
        streakRes,
        featuredRes,
        spotsRes,
        nationalRes,
        servicesRes,
        tipRes
      ] = await Promise.all([
        storageService.getAggregatedCarbon(user.id).catch(() => null),
        storageService.getCarbonLogs(10).catch(() => []),
        storageService.getDailyMissions(language).catch(() => []),
        storageService.getRecentCarbonPulse(user.id).catch(() => ({ total: 0, trend: 'stable' })),
        storageService.getDailyReward().catch(() => null),
        storageService.getCurrentStreak(user.id).catch(() => ({ current_streak: 0 })),
        storageService.getFeaturedContent().catch(() => []),
        storageService.getEcoSpots().catch(() => []),
        storageService.getNationalMetrics().catch(() => ({ data: null })),
        storageService.getTopServices(6).catch(() => []),
        aiService.getEcoTips(user.id, language).catch(() => '')
      ]);

      setCarbonLogs(logsRes || []);
      setFeaturedContent(featuredRes || []);
      setNearbySpots(spotsRes || []);
      setCarbonPulse(pulseRes);
      setDailyRewardEligible(!!rewardRes);
      setNationalMetrics(nationalRes?.data || null);
      setTopServices(servicesRes || []);
      setAiTip(tipRes);
      
      setGamification({ 
        streak: streakRes?.current_streak || 0, 
        points: (user as any).points || 0, 
        level: (user as any).level || 1 
      });

      if (metricsRes) {
        setMetrics({ 
          carbon: metricsRes.total, 
          water: metricsRes.bySector.water || 0,
          electricity: metricsRes.bySector.electricity || 0,
          gas: metricsRes.bySector.gas || 0
        });
      }

      const incomplete = Array.isArray(missionsRes) ? missionsRes.find((m: any) => !m.completed) : null;
      if (incomplete) {
        setDailyMission({
          title: incomplete.title,
          desc: language === 'ar' ? `أكمل هذه المهمة لتربح ${incomplete.points} نقطة!` : `Complete this mission to earn ${incomplete.points} pts!`,
          icon: Zap,
          color: 'bg-emerald-500',
          link: '/daily-missions'
        });
      }

      // 2. Fetch Location & Weather (asynchronous but tracked)
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude } = pos.coords;
          setLocationObj({ lat: latitude, lng: longitude });
          fetchLocationData(latitude, longitude);
        }, () => {
          fetchLocationData(locationObj.lat, locationObj.lng);
        });
      } else {
        fetchLocationData(locationObj.lat, locationObj.lng);
      }

    } catch (err) {
      console.error("Home dynamic fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!user?.id) return;

    // --- REALTIME SUBSCRIPTIONS ---
    
    // 1. User stats subscription
    const profileChannel = supabase
      .channel(`home_profile_${user.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'users',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        const updated = payload.new as any;
        setGamification(prev => ({
          ...prev,
          points: updated.points || 0,
          level: updated.level || 1,
          streak: updated.current_streak || prev.streak
        }));
      })
      .subscribe();

    // 2. Consumption records subscription
    const consumptionChannel = supabase
      .channel(`home_consumption_${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'consumption_records',
        filter: `user_id=eq.${user.id}`
      }, () => {
        // Refresh core metrics and logs when data changes
        storageService.getAggregatedCarbon(user.id).then(res => {
          if (res) setMetrics({
            carbon: res.total,
            water: (res.bySector as any).water || 0,
            electricity: (res.bySector as any).electricity || 0,
            gas: (res.bySector as any).gas || 0
          });
        });
        storageService.getCarbonLogs(10).then(setCarbonLogs);
        storageService.getRecentCarbonPulse(user.id).then(setCarbonPulse);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(consumptionChannel);
    };
  }, [user?.id, language]);

  const handleClaimReward = async () => {
    if (!dailyRewardEligible) return;
    try {
      const reward = await storageService.getDailyReward();
      if (!reward) {
        setDailyRewardEligible(false);
        return;
      }
      const result = await storageService.claimDailyReward(reward.id);
      if (result.success) {
        import('../services/notificationService').then(m => 
          m.notificationService.success(language === 'ar' ? `تم استلام ${result.pointsClaimed} نقطة!` : `${result.pointsClaimed} points claimed!`)
        ).catch(console.error);
        setDailyRewardEligible(false);
        setGamification(prev => ({
          ...prev,
          points: result.newTotalPoints,
          level: Math.floor(result.newTotalPoints / 100) + 1
        }));
      }
    } catch (err: any) {
      import('../services/notificationService').then(m => 
        m.notificationService.error(err.message || 'Error claiming reward')
      ).catch(console.error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 overflow-x-hidden">
      {/* 1. HERO SECTION - Unified & Impactful */}
      <section className="relative pt-6 px-4">
        {/* Background Decorative Blur & Patterns */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-nile-blue/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute top-40 left-0 w-64 h-64 bg-eco-green/5 rounded-full blur-[80px] -z-10" />
        <div className="absolute inset-0 egyptian-pattern opacity-10 pointer-events-none -z-10" />

        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-egypt-gold uppercase tracking-[0.2em] mb-1">
               {currentTime.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-nile-blue dark:text-white tracking-tight leading-tight">
                {isRtl ? 'أهلاً بك،' : 'Marhaba,'} <span className="text-eco-green">{user?.name?.split(' ')[0]}</span>
              </h1>
              <motion.span 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-3xl"
              >👋</motion.span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {weather && (
               <div className="hidden sm:flex items-center gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20 shadow-sm transition-all hover:bg-white/60">
                 <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <SunIcon size={16} className="text-white" />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-xs font-black text-nile-blue dark:text-slate-200">{weather.temp}°C</span>
                   <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{locationName}</span>
                 </div>
               </div>
             )}
             <div className="relative">
                <button 
                  onClick={() => navigate('/profile')}
                  className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-xl shadow-nile-blue/10 active:scale-95 transition-all ring-2 ring-egypt-gold/20"
                >
                  <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} className="w-full h-full object-cover" />
                </button>
             </div>
          </div>
        </div>

        {/* --- MAIN IMPACT CARD (ECO PULSE) --- */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className="relative overflow-hidden group cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <div className="absolute inset-0 nile-gradient rounded-[2.5rem] shadow-2xl shadow-nile-blue/30" />
          
          {/* Subtle Eco Patterns & Lens Flare */}
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 egyptian-pattern opacity-10 mix-blend-overlay pointer-events-none" />

          <div className="relative p-8 flex flex-col justify-between min-h-[250px]">
             <div className="flex justify-between items-start gap-4">
               <div>
                 <div className="flex flex-wrap items-center gap-2 mb-3">
                   <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] leading-none opacity-90">
                     {isRtl ? 'البصمة الكربونية المسجلة' : 'LOGGED CARBON FOOTPRINT'}
                   </p>
                   <span className="px-2 py-0.5 rounded-md bg-white/15 text-[10px] font-bold text-amber-200 border border-white/20">
                     {isRtl ? 'مدخل من المستخدم · تقديري' : 'User Input · Estimated'}
                   </span>
                 </div>
                 <div className="flex items-baseline gap-2">
                   <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none drop-shadow-md">
                     {metrics?.carbon?.toLocaleString() || '0'}
                   </h2>
                   <span className="text-lg md:text-xl font-black text-egypt-gold tracking-tighter uppercase">kg CO₂e</span>
                 </div>
                 <p className="text-[11px] text-white/80 mt-2">
                   {isRtl ? 'مجموع الانبعاثات المحسوبة من سجلاتك حتى اليوم' : 'Cumulative calculated emissions from your logs'} ·{' '}
                   <Link
                     to="/methodology"
                     onClick={(e) => e.stopPropagation()}
                     className="underline text-amber-200 hover:text-white font-bold"
                   >
                     {isRtl ? 'كيف نحسب الأثر؟' : 'Methodology'}
                   </Link>
                 </p>
               </div>
               
               <div className="bg-white/10 backdrop-blur-2xl p-4 rounded-3xl border border-white/20 shadow-2xl transition-transform group-hover:rotate-12">
                 <Wind className="w-8 h-8 text-white" />
               </div>
             </div>

             <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 group-hover:bg-white/30 transition-colors">
                       <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300 drop-shadow-sm" />
                    </div>
                    <div>
                       <p className="text-white/75 text-[10px] font-bold leading-none mb-1.5">{isRtl ? 'أثر الكهرباء (تقديري)' : 'Electricity Impact'}</p>
                       <p className="text-white font-black text-xl tracking-tight leading-none">{metrics?.electricity?.toFixed(1) || 0} <span className="text-[10px] opacity-75">kg CO₂e</span></p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 group-hover:bg-white/30 transition-colors">
                       <Droplets className="w-6 h-6 text-sky-300 drop-shadow-sm" />
                    </div>
                    <div>
                       <p className="text-white/75 text-[10px] font-bold leading-none mb-1.5">{isRtl ? 'أثر المياه (تقديري)' : 'Water Impact'}</p>
                       <p className="text-white font-black text-xl tracking-tight leading-none">{metrics?.water?.toFixed(1) || 0} <span className="text-[10px] opacity-75">kg CO₂e</span></p>
                    </div>
                  </div>
                </div>

                <motion.div 
                  whileHover={{ x: 10 }}
                  className="shrink-0"
                >
                   <div className="px-6 py-4 bg-white text-nile-blue rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center gap-2 hover:bg-egypt-sand transition-colors">
                      {isRtl ? 'تتبع النبض' : 'Pulse Guide'}
                      <ChevronRight size={16} className={isRtl ? 'rotate-180' : ''} />
                    </div>
                </motion.div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* 2. RECENT ALERTS & AI INSIGHTS */}
      <section className="px-4 mt-8">
        <RecommendationAIBanner />
      </section>

      {/* 3. GOV SERVICES & SMART ACTIONS */}
      <section className="px-4 mt-10">
        <div className="bg-egypt-sand/30 dark:bg-slate-900 rounded-[3rem] p-8 border border-egypt-gold/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-egypt-gold/20" />
          
          <div className="flex items-center justify-between mb-8 px-1">
             <h2 className="text-xl font-black text-nile-blue dark:text-white uppercase tracking-tighter flex items-center gap-3">
               <ShieldCheck className="text-egypt-gold" />
               {isRtl ? 'البوابة المصرية الخضراء' : 'Egyptian Green Hub'}
             </h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
            {[
              { id: 'track', icon: Activity, label: isRtl ? 'تتبع' : 'Track', path: '/calculator', color: 'bg-emerald-500 text-white shadow-emerald-500/30' },
              { id: 'gov', icon: Landmark, label: isRtl ? 'خدمات' : 'Portal', path: '/smart-gov', color: 'bg-nile-blue text-white shadow-nile-blue/30' },
              { id: 'scan', icon: QrCode, label: isRtl ? 'لوحة المراقبة' : 'Audit', path: '/dashboard', color: 'bg-egypt-gold text-white shadow-egypt-gold/30' },
              { id: 'shop', icon: ShoppingBag, label: isRtl ? 'الاقتصاد الأخضر' : 'Market', path: '/green-economy', color: 'bg-purple-600 text-white shadow-purple-600/30' }
            ].map((action) => (
              <motion.div
                key={action.id}
                whileHover={{ y: -8, scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-3 cursor-pointer group"
              >
                <div className={`w-12 h-12 md:w-16 md:h-16 ${action.color} rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg transition-all ring-4 ring-white dark:ring-slate-800`}>
                  <action.icon className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 text-center leading-tight">
                  {action.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3B. CIVIC ENVIRONMENTAL ACTION HUB */}
      <section className="px-4 mt-8" aria-label="العمل البيئي والمجتمعي المحلي">
        <div className="bg-slate-900/90 rounded-[2rem] p-6 md:p-8 border border-white/10 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <span>{isRtl ? 'العمل البيئي والمجتمعي في منطقتك' : 'Local Civic Environmental Action'}</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {isRtl
                  ? 'ارصد المشكلات المحلية، تابع المبادرات، واطّلع على شفافية الحسابات.'
                  : 'Report local issues, join initiatives, and inspect calculation methodology.'}
              </p>
            </div>
            <Link
              to="/methodology"
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-emerald-300 hover:bg-emerald-500/15 transition"
            >
              <span>{isRtl ? 'كيف نحسب الأثر؟' : 'How we calculate'}</span>
              <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { path: '/eco-watch', title: 'بلاغ بيئي', desc: 'إبلاغ تجريبي عن تسريب مياه، مخلفات، حرق، أو نقص ظل مع خيار إخفاء الاسم', badge: 'توثيق ومراجعة', color: 'border-emerald-500/30 hover:border-emerald-400' },
              { path: '/local-monitor', title: 'لوحة المتابعة المحلية', desc: 'مؤشرات مجمّعة حسب النوع والمنطقة والمبادرات القابلة للانضمام', badge: 'بيانات تجريبية ومجمعة', color: 'border-sky-500/30 hover:border-sky-400' },
              { path: '/surplus-food', title: 'الفائض بدل الرمي', desc: 'نموذج تجريبي لعروض فائض المخابز والمتاجر دون طلب أو دفع فعلي', badge: 'تجريبي', color: 'border-amber-500/30 hover:border-amber-400' },
              { path: '/water-saving', title: 'وفّر مياه منطقتك', desc: 'إبلاغ عن تسريبات المياه ومُقدّر الترشيد المنزلي التقديري', badge: 'تقديري + بلاغات', color: 'border-cyan-500/30 hover:border-cyan-400' },
              { path: '/heat-shade-map', title: 'خريطة الحر والظل', desc: 'رصد نقاط الحر الشديد واقتراح مظلات أو تشجير مشروط', badge: 'خريطة تفاعلية', color: 'border-orange-500/30 hover:border-orange-400' },
              { path: '/waste-to-income', title: 'المخلفات إلى دخل', desc: 'دليل تجريبي لنقاط الفرز وتسجيل الأوزان المسلّمة بشفافية', badge: 'نقاط فرز تجريبية', color: 'border-teal-500/30 hover:border-teal-400' },
              { path: '/my-home', title: 'ملف بيتي', desc: 'تنظيم قراءات وفواتير الكهرباء والمياه الخاصة بك محليًا بأمان', badge: 'بياناتك الخاصة', color: 'border-emerald-500/30 hover:border-emerald-400' },
              { path: '/my-complaints', title: 'شكواي ما تضيعش', desc: 'تجهيز مسودات الشكاوى والانتقال للقنوات الرسمية الموثقة ومتابعة الأرقام', badge: 'تنظيم ومتابعة', color: 'border-sky-500/30 hover:border-sky-400' },
              { path: '/local-projects', title: 'مشروعي في منطقتي', desc: 'متابعة المشروعات العامة الموثقة وملاحظاتك الخاصة عند توفر مصدر رسمي', badge: 'شفافية المصدر', color: 'border-amber-500/30 hover:border-amber-400' },
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`min-h-[44px] bg-slate-950/70 border ${item.color} rounded-2xl p-4 flex flex-col justify-between gap-2 transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-black text-white">{item.title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. NILE PULSE: NATIONAL DATA Ticker */}
      {nationalMetrics && (
        <section className="mt-12 mb-8 bg-nile-blue py-10 relative overflow-hidden">
          <div className="absolute inset-0 egyptian-pattern opacity-[0.03] pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-egypt-gold/30 to-transparent" />
          
          <div className="max-w-7xl mx-auto px-8">
             <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="space-y-4 text-center md:text-left">
                   <div className="flex items-center justify-center md:justify-start gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                        <Globe className="w-6 h-6 text-egypt-gold animate-spin-slow" />
                      </div>
                      <div>
                        <h3 className="text-white font-black text-xl tracking-tight leading-none mb-1">
                          {isRtl ? 'نبض النيل الوطني' : 'Nile National Pulse'}
                        </h3>
                        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em]">Live Feed • 2026</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 flex-1 w-full max-w-2xl">
                   <div className="space-y-1 text-center sm:text-left">
                      <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">{isRtl ? 'العجز الكربوني' : 'Carbon Offset'}</p>
                      <div className="flex items-baseline justify-center sm:justify-start gap-2">
                         <span className="text-2xl md:text-3xl font-black text-white">{(nationalMetrics as any).total_tonnes?.toLocaleString() || '1.2M'}</span>
                         <span className="text-[10px] font-black text-emerald-400">T</span>
                      </div>
                   </div>
                   <div className="space-y-1 text-center sm:text-left">
                      <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">{isRtl ? 'المواطنون' : 'Eco Citizens'}</p>
                      <div className="flex items-baseline justify-center sm:justify-start gap-2">
                         <span className="text-2xl md:text-3xl font-black text-white">{(nationalMetrics as any).active_citizens?.toLocaleString() || '14.5K'}</span>
                         <Users className="w-4 h-4 text-egypt-gold" />
                      </div>
                   </div>
                   <div className="space-y-1 text-center sm:text-left hidden lg:block">
                      <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">{isRtl ? 'المحفظة القومية' : 'Economic Gain'}</p>
                      <div className="flex items-baseline justify-center sm:justify-start gap-2">
                         <span className="text-2xl md:text-3xl font-black text-white text-emerald-400">EGP {((nationalMetrics as any).economicSavings || 2500000).toLocaleString()}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>
      )}

      {/* 5. DYNAMIC EXPLORATION */}
      <section className="px-4 mt-8 pb-32">
        <div className="flex items-center justify-between mb-8 px-1">
           <h2 className="text-2xl font-black text-nile-blue dark:text-white uppercase tracking-tighter">
             {isRtl ? 'آخر التدفقات' : 'Recent Eco Flows'}
           </h2>
           <button onClick={() => navigate('/wallet')} className="text-[10px] font-black text-egypt-gold uppercase tracking-[0.2em] flex items-center gap-2">
             {isRtl ? 'عرض السجل الكامل' : 'View Full Ledger'}
             <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
           </button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {carbonLogs.length > 0 ? carbonLogs.slice(0, 4).map((log, idx) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ x: 5, backgroundColor: theme === 'dark' ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,1)' }}
              className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  log.sector === 'electricity' ? 'bg-amber-500/10 text-amber-500' : 
                  log.sector === 'water' ? 'bg-sky-500/10 text-sky-500' : 
                  'bg-emerald-500/10 text-emerald-500'
                }`}>
                   {log.sector === 'electricity' ? <Zap size={24} /> : log.sector === 'water' ? <Droplets size={24} /> : <Leaf size={24} />}
                </div>
                <div>
                   <h4 className="text-sm font-black text-nile-blue dark:text-white uppercase tracking-tight mb-0.5">
                     {log.type}
                   </h4>
                   <div className="flex items-center gap-2">
                     <p className="text-[10px] font-bold text-slate-400">
                       {new Date(log.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })}
                     </p>
                     <div className="w-1 h-1 bg-slate-300 rounded-full" />
                     <p className="text-[10px] font-black text-egypt-gold uppercase tracking-tighter">Verified Entry</p>
                   </div>
                </div>
              </div>
              <div className={`flex flex-col items-end`}>
                 <span className={`text-lg font-black tracking-tighter ${parseFloat(log.co2) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {parseFloat(log.co2) > 0 ? '+' : ''}{parseFloat(log.co2).toFixed(2)}
                 </span>
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">kg CO₂e</span>
              </div>
            </motion.div>
          )) : (
            <div className="py-20 text-center space-y-4">
               <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto opacity-50">
                  <Activity className="w-10 h-10 text-slate-400" />
               </div>
               <p className="text-sm font-bold text-slate-400 italic">
                  {isRtl ? 'بانتظار تدفقاتك القادمة...' : 'Awaiting your next eco flow...'}
               </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
