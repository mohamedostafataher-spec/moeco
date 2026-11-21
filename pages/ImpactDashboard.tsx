import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Leaf, Trophy, Award, 
  MapPin, Zap, Info, ChevronRight, Download,
  Users, Target, Sparkles, RefreshCw,
  Train, History, CheckCircle2, X, Hexagon, Volume2, ShieldAlert,
  Building2, Map, Activity, Wind, Droplets, Car, 
  AlertTriangle, BarChart3, Globe, Sun as SunIcon, ExternalLink,
  ChevronLeft, LayoutGrid, BarChart4, DollarSign
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, BarChart, Bar
} from 'recharts';
import { useApp } from '../context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { calculationEngine } from '../services/calculationEngine';
import { storageService } from '../services/storageService';
import { behaviorEngine } from '../services/behaviorEngine';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';
import { weatherService } from '../services/weatherService';
import { trafficService } from '../services/trafficService';
import { alertService } from '../services/alertService';

type ImpactTab = 'personal' | 'city' | 'national';

const ImpactDashboard: React.FC = () => {
  const { language, theme, user, isRtl, trackCarbon } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<ImpactTab>((location.state?.tab as ImpactTab) || 'personal');
  
  // STATS - Dashboard
  const [stats, setStats] = useState({
    totalCarbonSaved: 0,
    totalMoneySaved: 0,
    totalEmissions: 0,
    points: 0,
    rank: 0,
    district: language === 'ar' ? 'غير محدد' : 'Not Set'
  });

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any>(null);
  const [personality, setPersonality] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [lifeHacks, setLifeHacks] = useState<any[]>([]);
  const [neighborAvg, setNeighborAvg] = useState(450);
  
  // STATS - City/National
  const [weather, setWeather] = useState<any>(null);
  const [traffic, setTraffic] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [nationalMetrics, setNationalMetrics] = useState<any>(null);
  const [energyDist, setEnergyDist] = useState<any[]>([]);
  const [transitMetrics, setTransitMetrics] = useState({ increase: 0, count: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPersonalData();
    fetchEnvironmentData();
  }, [user, language]);

  const fetchPersonalData = async () => {
    try {
      if (!user) return;
      
      // Smart Predictions & Personality
      const [pred, history] = await Promise.all([
        storageService.getSmartPredictions(user.id),
        storageService.fetchUserHistory(user.id, 20)
      ]);
      setPredictions(pred);
      setPersonality(behaviorEngine.getPersonalityMood(history, language));
      
      // Aggregated Metrics
      const aggregated = await storageService.getAggregatedCarbon(user.id);
      setStats(prev => ({
        ...prev,
        points: user.points || 0,
        totalCarbonSaved: Math.round(aggregated.totalSaved || 0),
        totalMoneySaved: Math.round(aggregated.totalSavedMoney || 0),
        totalEmissions: Math.round(aggregated.total || 0),
        district: user.city || user.governorate || (language === 'ar' ? 'غير محدد' : 'Not Set')
      }));

      // Carbon Trend
      const logs = await storageService.getCarbonLogs(30, user.id);
      if (logs && logs.length > 0) {
        const groupedData: Record<string, number> = {};
        logs.forEach((log: any) => {
          const dateStr = new Date(log.recorded_at || log.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' });
          if (!groupedData[dateStr]) groupedData[dateStr] = 0;
          groupedData[dateStr] += log.co2_impact || log.co2 || log.total_emissions || 0;
        });
        setTrendData(Object.keys(groupedData).slice(0, 7).map(date => ({ month: date, savings: groupedData[date] })).reverse());
      }

      // Leaderboard
      const topUsers = await storageService.getLeaderboard();
      setLeaderboard((topUsers || []).slice(0, 5).map((u: any, idx) => ({
        id: idx + 1,
        name: u.full_name || u.name || (isRtl ? 'مواطن أخضر' : 'Green Citizen'),
        points: u.total_score || u.points || 0,
        trend: 'up'
      })));

      // Neighborhood Avg
      if (user.governorate) {
        const { data: nData } = await supabase.from('carbon_footprint_logs').select('carbon_value, users!inner(governorate)').eq('users.governorate', user.governorate);
        if (nData && nData.length > 0) setNeighborAvg(Math.round(nData.reduce((acc, curr) => acc + (curr.carbon_value || 0), 0) / nData.length));
      }

    } catch (e) {
      console.error("Personal fetch error", e);
    }
  };

  const fetchEnvironmentData = async () => {
    try {
      const lat = user?.location?.lat || 30.0444;
      const lng = user?.location?.lng || 31.2357;
      const [w, t, a, n] = await Promise.all([
        weatherService.getWeather(lat, lng),
        trafficService.getTrafficData(lat, lng),
        alertService.fetchAllAlerts(),
        storageService.getNationalMetrics()
      ]);
      setWeather(w);
      setTraffic(t);
      setAlerts(a.alerts.slice(0, 3));
      if (n?.data) setNationalMetrics(n.data);

      const { data: usageLogs } = await supabase.from('consumption_records').select('sector, co2, created_at').order('created_at', { ascending: false }).limit(500);
      if (usageLogs) {
        const elec = usageLogs.filter(l => l.sector === 'electricity').reduce((acc, l) => acc + (l.co2 || 0), 0);
        const gas = usageLogs.filter(l => l.sector === 'gas').reduce((acc, l) => acc + (l.co2 || 0), 0);
        const water = usageLogs.filter(l => l.sector === 'water').reduce((acc, l) => acc + (l.co2 || 0), 0);
        const total = elec + gas + water;
        if (total > 0) {
          setEnergyDist([
            { label: language === 'ar' ? 'الكهرباء' : 'Electricity', value: Math.round((elec / total) * 100), color: 'bg-amber-500' },
            { label: language === 'ar' ? 'الغاز' : 'Gas', value: Math.round((gas / total) * 100), color: 'bg-orange-500' },
            { label: language === 'ar' ? 'المياه' : 'Water', value: Math.round((water / total) * 100), color: 'bg-blue-500' },
          ]);
        }
      }
    } catch (e) {
      console.error("Env fetch failed", e);
    }
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ tips: string[], insights: any } | null>(null);

  const handleAnalyze = async () => {
    if (isAnalyzing || !user) return;
    setIsAnalyzing(true);
    try {
      const [tips, insights] = await Promise.all([
        behaviorEngine.getSmartAdvice(user.id, language),
        storageService.getMicroInsights(user.id)
      ]);
      setAnalysisResult({ tips, insights });
      storageService.speakAdvice(tips[0], language);
      notificationService.success(isRtl ? 'اكتمل التحليل الذكي!' : 'Smart Analysis Complete!');
    } catch (e) { console.error(e); } finally { setIsAnalyzing(false); }
  };

  const handleLogSaving = async (type: 'electricity' | 'water', amount: number) => {
    if (!user) return notificationService.error(isRtl ? 'يجب تسجيل الدخول' : 'Login Required');
    setLoading(true);
    try {
      const carbonSaved = type === 'electricity' ? amount * 0.5 : amount * 0.3;
      await trackCarbon('rationalization', type, amount, { description: `Saved ${amount} ${type === 'electricity' ? 'kWh' : 'm3'}` });
      notificationService.success(isRtl ? `تم تسجيل توفير ${carbonSaved.toFixed(1)} كجم` : `${carbonSaved.toFixed(1)}kg reduction logged`);
      fetchPersonalData();
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const ecoLevel = (() => {
    const p = stats.points;
    if (p > 5000) return { level: isRtl ? 'سفير المناخ' : 'Climate Ambassador', badge: '👑', next: 10000 };
    if (p > 2000) return { level: isRtl ? 'بطل البيئة' : 'Eco Champion', badge: '🌟', next: 5000 };
    if (p > 500) return { level: isRtl ? 'مدافع أخضر' : 'Green Defender', badge: '🛡️', next: 2000 };
    return { level: isRtl ? 'مبتدئ واعي' : 'Conscious Beginner', badge: '🌱', next: 500 };
  })();

  const carbonScore = Math.min(100, Math.round((stats.points / 5000) * 100)) || 15;

  return (
    <div className="min-h-screen pb-40">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        
        {/* TOP NAVIGATION TABS */}
        <div className="flex bg-zinc-100 dark:bg-white/5 p-1 rounded-3xl mb-12 border border-zinc-100 dark:border-white/10 w-full sm:w-max mx-auto shadow-xl">
           {(['personal', 'city', 'national'] as const).map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                 activeTab === tab 
                 ? 'bg-eco-green text-white shadow-lg shadow-eco-green/30' 
                 : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
               }`}
             >
               {tab === 'personal' ? <Users size={16} /> : tab === 'city' ? <Building2 size={16} /> : <Globe size={16} />}
               <span className="hidden sm:inline">
                 {tab === 'personal' ? (isRtl ? 'مساهمتي' : 'Personal') : tab === 'city' ? (isRtl ? 'مدينتي' : 'City') : (isRtl ? 'وطني' : 'National')}
               </span>
             </button>
           ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'personal' && (
            <motion.div 
              key="personal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
               {/* Personality Header */}
               {personality && (
                  <div className="p-0.5 rounded-[3rem] bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-emerald-500/20 border border-white/10 shadow-2xl overflow-hidden">
                    <div className={`p-8 rounded-[2.9rem] ${theme === 'dark' ? 'bg-slate-900/60 backdrop-blur-3xl' : 'bg-white'} flex flex-col md:flex-row items-center gap-8`}>
                       <div className="relative shrink-0">
                          <div className={`w-24 h-24 rounded-[2.2rem] flex items-center justify-center text-5xl shadow-2xl border border-white/20 bg-emerald-500/10`}>
                            {personality.mood === 'happy' ? '😊' : personality.mood === 'proud' ? '💎' : '🌱'}
                          </div>
                       </div>
                       <div className="flex-1 text-center md:text-left space-y-2">
                          <h2 className="text-3xl font-black italic tracking-tighter">{personality.greeting}</h2>
                          <p className="text-sm font-bold text-slate-400 max-w-lg">{personality.message}</p>
                       </div>
                       <div className="flex gap-3">
                          <button onClick={handleAnalyze} className="p-5 bg-blue-500/10 text-blue-500 rounded-3xl border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all"><RefreshCw className={isAnalyzing ? 'animate-spin' : ''} /></button>
                          <button onClick={() => storageService.speakAdvice(personality.message, language)} className="p-5 bg-emerald-500/10 text-emerald-500 rounded-3xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"><Volume2 /></button>
                       </div>
                    </div>
                  </div>
               )}

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Carbon Score Pulse */}
                  <div className="lg:col-span-2 bg-white dark:bg-zinc-900/50 p-8 rounded-[3rem] border border-zinc-100 dark:border-white/5 shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                     <div className="relative w-48 h-48 shrink-0">
                        <svg className="w-full h-full -rotate-90">
                           <circle cx="50%" cy="50%" r="44%" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-zinc-100 dark:text-white/5" />
                           <motion.circle 
                              cx="50%" cy="50%" r="44%" fill="transparent" stroke="#10b981" strokeWidth="10" strokeDasharray="276"
                              initial={{ strokeDashoffset: 276 }}
                              animate={{ strokeDashoffset: 276 * (1 - (carbonScore / 100)) }}
                              transition={{ duration: 1.5 }}
                              strokeLinecap="round"
                           />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-6xl font-black text-emerald-500">{carbonScore}</span>
                           <span className="text-[10px] font-black uppercase opacity-40">Pulse Score</span>
                        </div>
                     </div>
                     <div className="space-y-4 text-center md:text-left">
                        <h3 className="text-3xl font-black">{isRtl ? 'مؤشر كفاءتك' : 'Impact Efficiency'}</h3>
                        <p className="text-sm font-bold text-zinc-500 max-w-sm">{isRtl ? 'بصمتك البيئية تحت مراقبتنا الذكية لضمان أقل استهلاك ممكن.' : 'Your ecological footprint is under our smart monitoring to ensure lowest consumption.'}</p>
                        <div className="flex gap-4">
                           <div className="px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20"><span className="text-emerald-500 font-black text-xs">Better than 74%</span></div>
                           <div className="px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20"><span className="text-blue-500 font-black text-xs">Tier: Elite</span></div>
                        </div>
                     </div>
                  </div>

                  {/* Smart Forecast */}
                  <div className="bg-zinc-950 p-8 rounded-[3rem] border border-white/5 flex flex-col justify-between">
                     <div>
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6"><Sparkles className="text-white" /></div>
                        <h4 className="text-xl font-black text-white">{isRtl ? 'التوفير المستهدف' : 'Target Savings'}</h4>
                        <p className="text-xs font-bold text-zinc-500 mt-2">{isRtl ? 'بناءً على الذكاء الاصطناعي، يمكنك توفير:' : 'AI predicts you can save up to:'}</p>
                     </div>
                     <div className="mt-8">
                        <p className="text-4xl font-black text-emerald-500">~{predictions?.savingsPotential || 450} <span className="text-sm text-zinc-600">EGP</span></p>
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-2">{isRtl ? 'شهرياً' : 'PER MONTH'}</p>
                     </div>
                  </div>
               </div>

               {/* Impact Metrics Grid */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: isRtl ? 'الانبعاثات' : 'Emissions', val: stats.totalEmissions, unit: 'KG', color: 'text-blue-500', icon: Wind },
                    { label: isRtl ? 'التوفير المالي' : 'Money Saved', val: stats.totalMoneySaved, unit: 'EGP', color: 'text-emerald-500', icon: DollarSign },
                    { label: isRtl ? 'وفر الكربون' : 'Carbon Saved', val: stats.totalCarbonSaved, unit: 'KG', color: 'text-emerald-500', icon: Leaf },
                    { label: isRtl ? 'النقاط' : 'Eco Points', val: stats.points, unit: 'PTS', color: 'text-amber-500', icon: Trophy },
                  ].map((m) => (
                    <div key={m.label} className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2.5rem] border border-zinc-100 dark:border-white/5 shadow-xl relative overflow-hidden group">
                       <m.icon className="absolute top-4 right-4 w-12 h-12 opacity-[0.05] group-hover:scale-110 transition-transform" />
                       <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{m.label}</p>
                       <div className="flex items-baseline gap-1">
                          <h3 className={`text-2xl font-black ${m.color}`}>{m.val.toLocaleString()}</h3>
                          <span className="text-[8px] font-bold text-zinc-500 uppercase">{m.unit}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'city' && (
            <motion.div 
              key="city"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
               {/* City Stats Summary */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: isRtl ? 'جودة الهواء' : 'Air Quality', val: weather?.aqi || '42', status: 'Good', icon: Wind, color: 'text-emerald-500' },
                    { label: isRtl ? 'حمل الطاقة' : 'Grid Load', val: nationalMetrics?.energySavedMW ? (nationalMetrics.energySavedMW/1000).toFixed(1) : '3.2', status: 'Stable', icon: Zap, color: 'text-blue-500' },
                    { label: isRtl ? 'الزحام' : 'Traffic', val: traffic ? Math.round(traffic.congestion * 100) : '35', status: 'Normal', icon: Car, color: 'text-amber-500' },
                    { label: isRtl ? 'الحرارة' : 'Temp', val: weather?.temp || '31', status: 'Sunny', icon: SunIcon, color: 'text-orange-500' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-zinc-900/50 p-8 rounded-[3rem] border border-zinc-100 dark:border-white/5 shadow-xl text-center">
                       <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4">{s.label}</p>
                       <h3 className={`text-4xl font-black ${s.color} mb-1`}>{s.val}</h3>
                       <p className={`text-[10px] font-black uppercase tracking-tight ${s.color}`}>{s.status}</p>
                    </div>
                  ))}
               </div>

               {/* Map & Distribution */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-zinc-950 p-10 rounded-[4rem] border border-white/5 shadow-2xl h-[450px] relative overflow-hidden flex items-center justify-center">
                     <div className="absolute inset-0 opacity-[0.1] pointer-events-none scale-150"><Map className="w-full h-full text-emerald-500" /></div>
                     <div className="relative text-center">
                        <Globe className="w-20 h-20 text-emerald-500/20 animate-spin-slow mb-4" />
                        <h4 className="text-2xl font-black text-white">{isRtl ? 'تحليل المحافظة مباشر' : 'Live Region Analysis'}</h4>
                        <p className="text-sm font-bold text-zinc-500 mt-2">{isRtl ? `تغطية البيانات النشطة في القاهرة والجيزة` : `Active Data Pulse in ${user?.governorate || 'Cairo'}`}</p>
                        <div className="mt-6 flex justify-center gap-2">
                           <span className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-black uppercase border border-emerald-500/20">Grid Nodes Active</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="space-y-6">
                     <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[3rem] h-full">
                        <div className="flex items-center gap-4 mb-6">
                           <div className="p-3 bg-red-500 rounded-2xl text-white shadow-xl"><ShieldAlert /></div>
                           <h4 className="text-xl font-black text-red-500">{isRtl ? 'تنبيهات المنطقة' : 'Zone Alerts'}</h4>
                        </div>
                        <div className="space-y-4">
                           {alerts.length > 0 ? alerts.map((a, i) => (
                             <div key={i} className="p-4 bg-white/5 border border-red-500/10 rounded-2xl">
                                <p className="text-xs font-black text-white uppercase">
                                  {typeof a.title === 'string' ? a.title : (language === 'ar' ? (a.title?.ar || a.title_ar) : (a.title?.en || a.title_en))}
                                </p>
                                <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">
                                  {new Date(a.timestamp || a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                             </div>
                           )) : (
                             <p className="text-zinc-600 font-bold italic text-sm">{isRtl ? 'المنطقة مستقرة كلياً' : 'No active alerts in this sector'}</p>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'national' && (
            <motion.div 
              key="national"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
               {/* National Impact Dashboard */}
               <div className="p-12 bg-emerald-950/20 border border-emerald-500/20 rounded-[4rem] text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.05] scale-150 rotate-12"><Activity className="text-emerald-500" /></div>
                  <h3 className="text-3xl font-black text-emerald-500 mb-2">{isRtl ? 'الإنجاز الوطني الموحد' : 'Unified National Impact'}</h3>
                  <p className="text-sm font-bold text-zinc-500 max-w-2xl mx-auto mb-10">{isRtl ? 'رؤية مصر 2030 تعتمد على مساهماتك الرقمية لتقليل الهدر الكلي في الجمهورية.' : 'Digital Egypt 2030 vision relies on your digital contributions to reduce total waste across the Republic.'}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="p-8 bg-zinc-950 rounded-[2.5rem] border border-white/5">
                        <Zap className="w-10 h-10 text-amber-500 mx-auto mb-4" />
                        <p className="text-3xl font-black text-white">{nationalMetrics?.energySavedMW || 0}</p>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">MW Energy Saved</p>
                     </div>
                     <div className="p-8 bg-zinc-950 rounded-[2.5rem] border border-white/5">
                        <Droplets className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                        <p className="text-3xl font-black text-white">{(nationalMetrics?.waterSavedM3 || 0).toLocaleString()}</p>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">M3 Water Conserved</p>
                     </div>
                     <div className="p-8 bg-zinc-950 rounded-[2.5rem] border border-white/5">
                        <Leaf className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
                        <p className="text-3xl font-black text-white">{nationalMetrics?.carbonReducedTons || 0}</p>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Tons CO2 Reduced</p>
                     </div>
                  </div>
               </div>

               {/* Log Section */}
               <div className="bg-white dark:bg-zinc-900/50 p-10 rounded-[4rem] border border-zinc-100 dark:border-white/5 shadow-2xl">
                  <h4 className="text-2xl font-black mb-8 px-4">{isRtl ? 'تسجيل المساهمة الميدانية' : 'Field Contribution Logging'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="p-8 bg-zinc-100 dark:bg-black/20 rounded-[3rem] border border-zinc-200 dark:border-white/5">
                        <div className="flex items-center gap-4 mb-8">
                           <div className="p-4 bg-amber-500 rounded-3xl shadow-xl shadow-amber-500/20 text-white"><Zap size={32} /></div>
                           <div>
                              <h5 className="text-xl font-black uppercase text-amber-500">{isRtl ? 'الكهرباء' : 'Electricity'}</h5>
                              <p className="text-[10px] font-bold text-zinc-500">Log your household savings today</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <button onClick={() => handleLogSaving('electricity', 5)} className="py-6 bg-amber-500 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">5 kWh</button>
                           <button onClick={() => handleLogSaving('electricity', 10)} className="py-6 bg-zinc-950 text-white rounded-[2rem] font-black uppercase text-xs active:scale-95 transition-all">10 kWh</button>
                        </div>
                     </div>
                     <div className="p-8 bg-zinc-100 dark:bg-black/20 rounded-[3rem] border border-zinc-200 dark:border-white/5">
                        <div className="flex items-center gap-4 mb-8">
                           <div className="p-4 bg-blue-500 rounded-3xl shadow-xl shadow-blue-500/20 text-white"><Droplets size={32} /></div>
                           <div>
                              <h5 className="text-xl font-black uppercase text-blue-500">{isRtl ? 'المياه' : 'Water'}</h5>
                              <p className="text-[10px] font-bold text-zinc-500">Log metric conservation</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <button onClick={() => handleLogSaving('water', 100)} className="py-6 bg-blue-500 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">100 L</button>
                           <button onClick={() => handleLogSaving('water', 500)} className="py-6 bg-zinc-950 text-white rounded-[2rem] font-black uppercase text-xs active:scale-95 transition-all">500 L</button>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default ImpactDashboard;
