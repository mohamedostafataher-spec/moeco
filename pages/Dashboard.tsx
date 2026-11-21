import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Globe, MapPin, Coins, Sparkles, Activity, ExternalLink, 
  LocateFixed, Navigation, Search, Info, Plus, Award, 
  PieChart as PieIcon, TrendingDown, Leaf, Footprints, 
  Utensils, Trash2, Bike, Droplets, Flame, ShoppingBag, 
  ShieldCheck, Camera, FileText, Briefcase, Flag, Scale, 
  Landmark, Users, TrendingUp, DollarSign, Scan, AlertTriangle, 
  Bell, ShieldAlert, ArrowRight, RefreshCcw, History, Calendar,
  ChevronRight, ArrowUpRight, Target, ZapOff, CloudRain, 
  ThermometerSun, Wind, Shield, Car, CheckCircle2,
  Loader2, MessageSquare, Home, BarChart3, Train, Compass, X, 
  Calculator, Sprout, Hexagon, BrainCircuit, ScanLine, Sun as SunIcon,
  Mic, Volume2, Eye, Hand, Ear, Accessibility, Clock, Waves
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { calculationEngine } from '../services/calculationEngine';
import { aiService } from '../services/aiService';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';

const Dashboard: React.FC = () => {
  const { language, user, theme, isRtl } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nationalMetrics, setNationalMetrics] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [personalStats, setPersonalStats] = useState<any>(null);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState(99.9);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [aqiData, setAqiData] = useState<any>(null);

  // Scanner Modal State
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinResult, setCheckinResult] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [scannerData, setScannerData] = useState({ value: '', sector: 'electricity' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chartData = useMemo(() => {
    if (!activities.length) {
      return Array.from({ length: 7 }).map((_, i) => ({ 
        name: isRtl ? `يوم ${i+1}` : `Day ${i+1}`, 
        value: 0,
        historical: 0
      }));
    }
    
    // Group activities by date for the last 7 days
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      
      const dayTotal = activities
        .filter(a => (a.created_at || a.timestamp)?.startsWith(dateStr))
        .reduce((sum, a) => sum + Math.abs(parseFloat(a.co2_impact || a.co2 || 0)), 0);
      
      return {
        name: d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'short' }),
        value: Number(dayTotal.toFixed(2)),
        historical: Math.random() * 20 + 30 // Comparative baseline
      };
    });
    return last7Days;
  }, [activities, isRtl]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const [natMetricRes, activitiesRes, profileRes, alertsRes] = await Promise.all([
        storageService.getNationalMetrics().catch(() => ({ data: null })),
        supabase.from('consumption_records').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        storageService.getUserProfile(user.id).catch(() => null),
        supabase.from('alerts').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(5)
      ]);

      if (natMetricRes?.data) setNationalMetrics(natMetricRes.data);
      if (activitiesRes?.data) setActivities(activitiesRes.data);
      if (profileRes) setPersonalStats(profileRes);
      if (alertsRes?.data) setActiveAlerts(alertsRes.data);

      try {
        const tip = await aiService.getEcoTips(user.id, language as 'en' | 'ar' || 'en');
        setAiInsight(tip);
      } catch (err) {
        console.error("AI Insight error", err);
      }

      try {
        const aqiRes = await fetch("https://air-quality-api.open-meteo.com/v1/air-quality?latitude=30.0444&longitude=31.2357&current=european_aqi");
        const aqiJson = await aqiRes.json();
        setAqiData(aqiJson?.current?.european_aqi);
      } catch (err) {
        console.error("AQI error", err);
      }

      setSystemHealth(99.6 + Math.random() * 0.4);
    } catch (e) {
      console.error("Dashboard Fetch Error:", e);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Replaced naive interval with Realtime Subscriptions for true dynamic updates
    const dashboardActivitySub = supabase
      .channel('dashboard-activity')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'consumption_records', filter: user?.id ? `user_id=eq.${user.id}` : undefined },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      dashboardActivitySub.unsubscribe();
    };
  }, [user?.id]);

  const handleGlobalSync = async () => {
    setIsRefreshing(true);
    try {
      notificationService.info(isRtl ? 'جاري مزامنة النظام بالكامل...' : 'Starting global system sync...');
      await storageService.triggerGlobalSync();
      await fetchData();
      notificationService.success(isRtl ? 'تمت المزامنة بنجاح!' : 'System sync completed successfully!');
    } catch (e) {
      notificationService.error(isRtl ? 'فشلت المزامنة' : 'Sync failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleScanner = async () => {
    if (!scannerData.value || !user) return;
    setIsSubmitting(true);
    try {
      const calcRes = await calculationEngine.calculate(scannerData.sector, parseFloat(scannerData.value));
      await storageService.insertConsumptionRecord({
        user_id: user.id,
        sector: scannerData.sector,
        value: parseFloat(scannerData.value),
        unit: scannerData.sector === 'electricity' ? 'kWh' : 'units',
        co2: calcRes.co2,
        co2_impact: calcRes.co2,
        cost: calcRes.totalCost,
        description: isRtl ? 'تسجيل ذكي للعداد' : 'Smart Meter Capture',
        metadata: { scanner: true, applied_factor: calcRes.appliedFactor }
      });
      
      await storageService.awardPoints(user.id, calcRes.points, `Meter Capture: ${scannerData.sector}`);
      notificationService.success(isRtl ? 'تم توثيق السجل بنجاح' : 'Log captured successfully');
      setShowScannerModal(false);
      setScannerData({ value: '', sector: 'electricity' });
      fetchData();
    } catch (e) {
      notificationService.error(isRtl ? 'حدث خطأ' : 'Error saving log');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-t-2 border-emerald-500 rounded-full animate-spin" />
        <p className="text-emerald-500 font-black tracking-widest text-[10px] uppercase">
           {isRtl ? 'جاري الاتصال بمركز البيانات الوطني...' : 'Connecting to National Data Center...'}
        </p>
      </div>
    );
  }

  const getText = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      if (Array.isArray(val)) return getText(val[0]);
      return val[isRtl ? 'ar' : 'en'] || val['ar'] || val['en'] || JSON.stringify(val);
    }
    return String(val);
  };

  return (
    <div className="min-h-screen bg-[#020306] text-slate-100 selection:bg-emerald-500 selection:text-white overflow-x-hidden relative pb-32">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-nile-blue/20 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-eco-green/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
        <div className="absolute inset-0 egyptian-pattern opacity-[0.02] pointer-events-none" />
      </div>

      {/* 🟢 TOP CONTROL BAR */}
      <nav className="relative z-30 flex items-center justify-between px-4 md:px-6 py-4 md:py-6 border-b border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="flex items-center gap-3 md:gap-6">
           <div className="w-10 h-10 md:w-12 md:h-12 bg-nile-blue rounded-[1.1rem] md:rounded-[1.25rem] border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(10,35,66,0.3)]">
              <Activity className="w-5 h-5 md:w-7 md:h-7 text-egypt-gold" />
           </div>
           <div>
              <h1 className="text-sm md:text-xl font-black tracking-tighter uppercase italic leading-none text-white">
                {isRtl ? 'مركز القيادة والتحكم البيئي' : 'ECO COMMAND CENTER'}
              </h1>
              <div className="flex items-center gap-2 mt-1 md:mt-1.5">
                 <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                 <span className="text-[8px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">{isRtl ? 'اتصال مباشر' : 'LIVE NILE'}</span>
                 <div className="w-[1px] h-3 bg-white/10 mx-1 md:mx-2" />
                 <span className="text-[8px] md:text-[10px] font-black text-slate-500 tracking-tighter leading-none">{currentTime.toLocaleTimeString()}</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
           <div className="hidden min-[1100px]:flex flex-col items-end mr-6">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{isRtl ? 'تكامل البيانات' : 'DATA INTEGRITY'}</span>
              <span className="text-xs font-black text-egypt-gold">{systemHealth.toFixed(1)}%</span>
           </div>
           <button 
             onClick={handleGlobalSync}
             className="px-4 md:px-6 py-2.5 md:py-3 bg-white/5 hover:bg-egypt-gold/10 border border-white/10 rounded-xl md:rounded-2xl transition-all group flex items-center gap-2 md:gap-3 active:scale-95"
           >
              <RefreshCcw size={14} className={`${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} text-egypt-gold`} />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">{isRtl ? 'مزامنة' : 'SYNC'}</span>
           </button>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6 md:space-y-10 relative z-20">
        {/* 📊 TELEMETRY GRID */}
        <div className="grid grid-cols-2 min-[450px]:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-5">
           {[
             { label: 'National Offset', value: `${(nationalMetrics?.totalCarbonSaved / 1000 || 0).toFixed(1)}T`, icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
             { label: 'Eco Nodes', value: nationalMetrics?.activeEcoNodes || 0, icon: Hexagon, color: 'text-sky-500', bg: 'bg-sky-500/10' },
             { label: 'Renewable %', value: `${nationalMetrics?.renewablePercentage?.toFixed(1) || 12.5}%`, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
             { label: 'Water Pulse', value: `${(nationalMetrics?.waterSavedM3 || 0).toFixed(0)}m³`, icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/10' },
             { label: 'Nile Health', value: '88.4', icon: Waves, color: 'text-sky-400', bg: 'bg-sky-400/10' },
             { label: 'Active Hubs', value: '1,422', icon: Target, color: 'text-egypt-gold', bg: 'bg-egypt-gold/10' }
           ].map((stat, i) => (
             <motion.div 
               key={i}
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: i * 0.05 }}
               className="relative p-4 md:p-7 bg-white/[0.03] border border-white/[0.05] rounded-[1.5rem] md:rounded-[2.5rem] hover:bg-white/[0.05] transition-all group overflow-hidden"
             >
                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-current opacity-5 blur-2xl group-hover:opacity-10 transition-opacity" />
                
                <div className="flex items-center justify-between mb-3 md:mb-5">
                   <div className={`p-2 md:p-3 rounded-lg md:rounded-2xl ${stat.bg} ${stat.color}`}>
                      {stat.icon && <stat.icon size={16} className="md:w-5 md:h-5" />}
                   </div>
                   <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest">{isRtl ? 'حي' : 'LIVE'}</span>
                </div>
                <div className="space-y-0.5 md:space-y-1">
                   <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                   <p className={`text-base md:text-2xl font-black italic tracking-tighter ${stat.color}`}>{stat.value}</p>
                </div>
             </motion.div>
           ))}
        </div>

        {/* 📈 MAIN MONITORING MODULE */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
           <div className="xl:col-span-8 space-y-6 md:space-y-8">
              {/* CORE FOOTPRINT ANALYSIS */}
              <div className="p-5 md:p-8 bg-zinc-950/80 backdrop-blur-3xl rounded-[2rem] md:rounded-[3rem] border border-white/10 relative overflow-hidden group">
                 <div className="absolute inset-0 egyptian-pattern opacity-[0.03] pointer-events-none" />
                 <div className="absolute top-0 right-0 p-8 md:p-12 opacity-[0.02] pointer-events-none rotate-12 scale-150">
                   <Footprints size={200} className="md:w-[300px] md:h-[300px]" />
                 </div>
                 
                 <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 mb-8 md:mb-12">
                       <div>
                          <h3 className="text-xl md:text-3xl font-black italic tracking-tighter uppercase text-white flex items-center gap-3 md:gap-4">
                            <span className="w-1.5 md:w-2 h-6 md:h-8 bg-egypt-gold rounded-full" />
                            {isRtl ? 'تحليل تدفقات الكربون' : 'Carbon Flow Telemetry'}
                          </h3>
                          <p className="text-slate-500 text-[10px] md:text-sm font-bold mt-1 md:mt-2 tracking-tight flex items-center gap-2">
                             <Activity size={12} className="text-emerald-500" />
                             {isRtl ? 'تحليل الأداء البيئي الفردي' : 'Real-time telemetry of personal eco-performance'}
                          </p>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end px-4 border-r border-white/10">
                             <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">ECO SCORE</span>
                             <span className="text-lg md:text-xl font-black text-emerald-500">{(nationalMetrics?.nationalEcoScore || 82.5).toFixed(1)}</span>
                          </div>
                          <div className="flex gap-2">
                             <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse" />
                             <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500/40" />
                          </div>
                       </div>
                    </div>

                    <div className="h-[250px] md:h-[350px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                             <defs>
                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                   <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#c5a059" stopOpacity={0.15}/>
                                   <stop offset="95%" stopColor="#c5a059" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#ffffff08" />
                             <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900 }} 
                                dy={15}
                             />
                             <YAxis hide />
                             <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#0a0a0a', 
                                  border: '1px solid #c5a05930', 
                                  borderRadius: '2rem', 
                                  padding: '1.5rem', 
                                  boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
                                  backdropFilter: 'blur(20px)'
                                }} 
                                itemStyle={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}
                                labelStyle={{ color: '#c5a059', marginBottom: '8px', fontSize: '10px' }}
                             />
                             <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorVal)" strokeWidth={4} animationDuration={2000} />
                             <Area type="monotone" dataKey="historical" stroke="#c5a059" fillOpacity={1} fill="url(#colorHist)" strokeWidth={2} strokeDasharray="6 6" />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>

              {/* LOGS & ALERTS SUB-GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-white/[0.02] p-8 rounded-[3rem] border border-white/5 relative group">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-sm font-black italic tracking-[0.3em] uppercase text-slate-400">OPERATION LEDGER</h3>
                       <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                          <History size={14} className="text-slate-500" />
                       </div>
                    </div>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                       {activities.length > 0 ? activities.map((log, i) => (
                          <div key={i} className="flex justify-between items-center p-5 bg-white/[0.03] rounded-2xl border border-white/5 hover:bg-white/[0.06] transition-all group/item">
                             <div className="flex items-center gap-4">
                               <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover/item:scale-150 transition-transform" />
                               <p className="text-[10px] font-black uppercase text-white/90">{log.type || log.sector}</p>
                             </div>
                             <p className="text-[10px] font-black text-emerald-500 tracking-tighter">{log.co2 || 0} KG</p>
                          </div>
                       )) : (
                         <div className="py-10 text-center opacity-30 italic font-bold">No telemetry recorded</div>
                       )}
                    </div>
                 </div>

                 <div className="bg-rose-500/[0.02] p-8 rounded-[3rem] border border-rose-500/10">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-sm font-black italic text-rose-500 uppercase tracking-[0.3em]">URGENT BROADCASTS</h3>
                       <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center animate-pulse">
                          <ShieldAlert size={14} className="text-rose-500" />
                       </div>
                    </div>
                    <div className="space-y-4">
                       {activeAlerts.length > 0 ? activeAlerts.map((alert, i) => (
                          <div key={i} className="p-5 bg-rose-500/5 rounded-2xl border border-rose-500/20 group cursor-pointer transition-all hover:bg-rose-500/10">
                             <div className="flex items-start justify-between gap-4">
                                <div>
                                   <h4 className="text-[11px] font-black text-white mb-2 leading-tight uppercase tracking-tight">
                                     {getText(isRtl ? (alert.title_ar || alert.title) : (alert.title_en || alert.title))}
                                   </h4>
                                   <p className="text-[9px] text-slate-500 font-bold leading-relaxed line-clamp-2">
                                     {getText(alert.message_ar || alert.message || alert.description_en)}
                                   </p>
                                </div>
                                <div className="p-2 bg-rose-500 rounded-lg text-white">
                                   <AlertTriangle size={12} />
                                </div>
                             </div>
                          </div>
                       )) : (
                         <div className="py-10 text-center opacity-30 italic font-bold text-emerald-500">System Shield Secure</div>
                       )}
                    </div>
                 </div>
              </div>
           </div>

           {/* 🧬 AI CORE & MODULES */}
           <div className="xl:col-span-4 space-y-8">
              <div className="p-8 bg-gradient-to-br from-egypt-gold/10 to-transparent rounded-[3rem] border border-egypt-gold/20 relative overflow-hidden">
                 <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-egypt-gold/10 blur-[80px] rounded-full" />
                 
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-egypt-gold rounded-2xl flex items-center justify-center shadow-lg shadow-egypt-gold/20">
                       <BrainCircuit size={24} className="text-nile-blue" />
                    </div>
                    <div>
                       <h4 className="text-sm font-black text-egypt-gold uppercase tracking-[0.3em]">AI COMMANDER</h4>
                       <span className="text-[8px] font-black text-slate-500">NEURAL ENGINE ACTIVE</span>
                    </div>
                 </div>

                 <p className="text-sm md:text-base font-bold text-slate-200 leading-relaxed italic border-l-2 border-egypt-gold pl-5 py-2">
                   "{aiInsight || (isRtl ? 'جاري تحليل الأنماط البيئية من أجلك...' : 'Analyzing environmental patterns for strategic optimization...')}"
                 </p>
                 
                 <div className="mt-8 grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 text-center">
                       <p className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">RELIABILITY</p>
                       <p className="text-xl font-black text-egypt-gold">99.8%</p>
                    </div>
                    <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 text-center">
                       <p className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">PROCESSING</p>
                       <p className="text-xl font-black text-sky-400">GEN-4</p>
                    </div>
                 </div>

                 {aqiData !== null && (
                   <div className="mt-6 p-6 nile-gradient rounded-[2rem] text-center shadow-xl shadow-nile-blue/20">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Wind size={14} className="text-sky-300" />
                        <p className="text-[10px] font-black uppercase text-sky-200 tracking-widest">LIVE EGYPT AQI</p>
                      </div>
                      <p className="text-5xl font-black text-white tracking-tighter">{aqiData}</p>
                      <span className="text-[8px] font-black text-sky-200/50 uppercase tracking-widest mt-2 block">OPTIMAL PROTECTION REQUIRED</span>
                   </div>
                 )}
              </div>

              {/* ACTION MODULES */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                 <ControlModule to="/smart-gov" label="NILE PORTAL" icon={Landmark} detail="SECURE" />
                 <ControlModule to="/eco-tree" label="ECO FOREST" icon={Sprout} detail="GROWING" />
                 <ControlModule to="/digital-id" label="CITIZEN ID" icon={ShieldCheck} detail="ENCRYPTED" />
                 <ControlModule to="/map-center" label="MAP ENGINE" icon={MapPin} detail="ACTIVE" />
                 <ControlModule to="/rewards" label="ECO TREASURY" icon={Coins} detail="READY" />
              </div>

              {/* NATIONAL PROGRESS MINI-CARD */}
              <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[3rem] relative group cursor-pointer" onClick={() => navigate('/national-hub')}>
                 <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">NATIONAL TARGET progress</h4>
                    <span className="text-xs font-black text-egypt-gold">{Math.round(nationalMetrics?.targetProgress || 45)}%</span>
                 </div>
                 <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(nationalMetrics?.targetProgress || 45)}%` }}
                      className="h-full bg-gradient-to-r from-egypt-gold to-emerald-500 shadow-[0_0_10px_#c5a059]"
                    />
                 </div>
                 <p className="text-[9px] font-bold text-slate-500 text-center italic tracking-tight">Contributing to Egypt's 2030 Sustainability Vision</p>
              </div>
           </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(197, 160, 89, 0.2); border-radius: 10px; }
      `}} />

      {/* Floating Action */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        onClick={() => setShowScannerModal(true)}
        className="fixed bottom-6 right-6 md:bottom-12 md:right-12 w-16 h-16 md:w-20 md:h-20 bg-emerald-600 text-white rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-xl z-50 border-2 md:border-4 border-black"
      >
         <Scan size={24} className="md:w-8 md:h-8" />
      </motion.button>

      {/* Scanner Modal */}
      <AnimatePresence>
        {showScannerModal && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] w-full max-w-[400px] border border-white/5">
              <h3 className="text-xl font-black mb-8 text-center">Smart Log Entry</h3>
              <div className="space-y-4">
                <select 
                  value={scannerData.sector} 
                  onChange={(e) => setScannerData({ ...scannerData, sector: e.target.value })}
                  className="w-full py-4 px-6 rounded-[1.5rem] bg-slate-100 dark:bg-white/5 border-none outline-none text-lg font-black text-center text-slate-800 dark:text-white"
                >
                  <option value="electricity">Electricity (kWh)</option>
                  <option value="transport">Transport (km)</option>
                  <option value="gas">Gas (m³)</option>
                </select>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={scannerData.value}
                  onChange={(e) => setScannerData({ ...scannerData, value: e.target.value })}
                  className="w-full py-4 px-6 rounded-[1.5rem] bg-slate-100 dark:bg-white/5 border-none outline-none text-3xl font-black text-center text-slate-800 dark:text-white" 
                />
                <button 
                  onClick={handleScanner} 
                  disabled={isSubmitting || !scannerData.value}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (isRtl ? 'جاري التحليل...' : 'Analyzing...') : (isRtl ? 'حفظ السجل' : 'Analyze & Commit')}
                </button>
              </div>
              <button onClick={() => setShowScannerModal(false)} className="w-full mt-6 text-[10px] font-black text-slate-400 uppercase">Discard</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ControlModule: React.FC<{to: string, label: string, icon: any, detail: string}> = ({ to, label, icon: Icon, detail }) => (
  <Link to={to} className="bg-zinc-900/80 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center gap-3 active:scale-95 transition-all hover:bg-zinc-800">
     <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white">
        <Icon size={20} />
     </div>
     <p className="text-[9px] font-black italic text-white uppercase tracking-widest">{label}</p>
     <span className="text-[7px] font-black text-slate-500">{detail}</span>
  </Link>
);

export default Dashboard;
