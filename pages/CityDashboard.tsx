
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Map, Activity, Wind, 
  Droplets, Zap, Car, ChevronLeft,
  TrendingUp, TrendingDown, AlertTriangle,
  BarChart3, Globe, Info, Target
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { weatherService } from '../services/weatherService';
import { trafficService } from '../services/trafficService';
import { alertService } from '../services/alertService';
import { supabase } from '../services/supabaseClient';

import { storageService } from '../services/storageService';
import EgyptMap from '../components/EgyptMap';

const CityDashboard: React.FC = () => {
  const { language, isRtl, theme, user } = useApp();
  const navigate = useNavigate();
  const [weather, setWeather] = useState<any>(null);
  const [traffic, setTraffic] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [nationalMetrics, setNationalMetrics] = useState<any>(null);
  const [allGovData, setAllGovData] = useState<any[]>([]);
  const [currentGov, setCurrentGov] = useState<any>(null);

  // Discovered Dynamic DB Feature Stats
  const [energyDist, setEnergyDist] = useState<any[]>([]);
  const [transitMetrics, setTransitMetrics] = useState({ increase: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Default to Cairo coordinates if user location is not available
        const lat = user?.location?.lat || 30.0444;
        const lng = user?.location?.lng || 31.2357;
        
        const [weatherData, trafficData, alertsData, natRes, govAll] = await Promise.all([
          weatherService.getWeather(lat, lng),
          trafficService.getTrafficData(lat, lng),
          alertService.fetchAllAlerts(),
          storageService.getNationalMetrics(),
          supabase.from('governorates').select('*')
        ]);
        
        setWeather(weatherData);
        setTraffic(trafficData);
        setAlerts((alertsData.alerts || []).slice(0, 3));
        if (natRes && natRes.data) setNationalMetrics(natRes.data);

        if (govAll.data) {
          setAllGovData(govAll.data.map(g => ({
            governorate: g.name_en,
            stressLevel: g.water_stress_percent || 30,
            avgBill: 0,
            userCount: 0
          })));

          const govName = user?.governorate || 'Cairo';
          const govStats = govAll.data.find(g => 
            g.name_en.toLowerCase() === govName.toLowerCase() || 
            g.name_ar === govName ||
            g.name_en.includes(govName)
          );

          if (govStats) {
             setCurrentGov(govStats);
          }
        }

        // Fetch activity-based energy distribution
        const { data: usageLogs } = await supabase
          .from('consumption_records')
          .select('sector, co2, created_at')
          .order('created_at', { ascending: false })
          .limit(1000);

        if (usageLogs && usageLogs.length > 0) {
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

          const transportLogs = usageLogs.filter(l => l.sector === 'transport');
          const recentCount = transportLogs.filter(l => new Date(l.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;
          const increase = transportLogs.length > 0 ? Math.round((recentCount / transportLogs.length) * 100) : 0;
          setTransitMetrics({ increase, count: transportLogs.length });
        }
      } catch (e) {
        console.error("CityDashboard Fetch Error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, language]);

  // Use a combination of fetched govStats and live APIs
  const cityStats = [
    { 
      label: language === 'ar' ? 'جودة الهواء' : 'Air Quality', 
      value: currentGov?.air_quality_idx || weather?.aqi || 0, 
      unit: 'AQI', 
      status: (currentGov?.air_quality_idx || weather?.aqi || 0) < 50 ? (language === 'ar' ? 'جيد' : 'Good') : (language === 'ar' ? 'متوسط' : 'Moderate'), 
      color: 'text-emerald-500' 
    },
    { 
      label: language === 'ar' ? 'إجهاد المياه' : 'Water Stress', 
      value: currentGov?.water_stress_percent ? `${Math.round(currentGov.water_stress_percent)}%` : '0%',
      unit: language === 'ar' ? 'حرج' : 'Critical', 
      status: language === 'ar' ? 'مراقب' : 'Monitoring', 
      color: 'text-egypt-gold' 
    },
    { 
      label: language === 'ar' ? 'حمل الشبكة' : 'Grid Load', 
      value: currentGov?.electricity_grid_load ? `${currentGov.electricity_grid_load}%` : (nationalMetrics?.energySavedMW ? (nationalMetrics.energySavedMW / 1000 + 85).toFixed(1) : '0'), 
      unit: currentGov?.electricity_grid_load ? '%' : 'GW', 
      status: language === 'ar' ? 'مستقر' : 'Stable', 
      color: 'text-blue-500' 
    },
    { 
      label: language === 'ar' ? 'مؤشر المدينة' : 'City Index', 
      value: currentGov?.smart_city_score || 0, 
      unit: '/ 100', 
      status: language === 'ar' ? 'متطور' : 'Evolving', 
      color: 'text-purple-500' 
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-egypt-gold border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-black animate-pulse text-zinc-500 uppercase tracking-widest">{language === 'ar' ? 'جاري الاتصال بالعاصمة الإدارية...' : 'Connecting to Administrative Capital...'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={() => navigate(-1)}
              className="p-3 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-egypt-gold hover:text-egypt-black transition-all"
            >
              <ChevronLeft className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-black font-arabic">
                {language === 'ar' ? 'لوحة تحكم المدينة الذكية' : 'Smart City Dashboard'}
              </h1>
              <p className="text-zinc-500 font-bold mt-1">
                {language === 'ar' ? `بيانات حية عن حالة ${user?.governorate || 'القاهرة'} والجمهورية` : `Live data on ${user?.governorate || 'Cairo'} and the Republic`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 self-start">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">LIVE DATA SYNC</span>
          </div>
        </div>

        {/* City Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          {cityStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-egypt-black p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-zinc-100 dark:border-white/5 shadow-xl group hover:border-egypt-gold transition-colors"
            >
              <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">{stat.label}</p>
              <div className="flex items-baseline gap-1 sm:gap-2 mb-2">
                <h3 className={`text-2xl sm:text-4xl font-black ${stat.color}`}>{stat.value}</h3>
                <span className="text-xs font-bold text-zinc-400">{stat.unit}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${stat.color.replace('text', 'bg')}`} />
                <span className={`text-[9px] sm:text-[10px] font-black uppercase ${stat.color}`}>{stat.status}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Map/Visualization Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-egypt-black p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[4rem] border border-zinc-100 dark:border-white/5 shadow-2xl h-[300px] sm:h-[500px] relative overflow-hidden group">
              <div className="absolute inset-0 opacity-[0.2] pointer-events-none group-hover:scale-105 transition-transform duration-1000">
                <Map className="w-full h-full text-egypt-gold" />
              </div>
              <div className="埃及-pattern absolute inset-0 opacity-[0.03] pointer-events-none" />
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                  <h3 className="text-xl sm:text-2xl font-black font-arabic">{language === 'ar' ? 'خريطة الاستدامة الحيـة' : 'Live Sustainability Map'}</h3>
                  <div className="flex gap-2 flex-wrap">
                    <button className="px-3 sm:px-4 py-2 bg-zinc-100 dark:bg-white/5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase hover:bg-egypt-gold hover:text-egypt-black transition-all">Traffic</button>
                    <button className="px-3 sm:px-4 py-2 bg-egypt-gold text-egypt-black rounded-xl text-[9px] sm:text-[10px] font-black uppercase">Energy</button>
                    <button className="px-3 sm:px-4 py-2 bg-zinc-100 dark:bg-white/5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase hover:bg-egypt-gold hover:text-egypt-black transition-all">Air</button>
                  </div>
                </div>
                <div className="flex-1 min-h-0 bg-zinc-50/50 dark:bg-black/20 rounded-[2rem] sm:rounded-[3rem] overflow-hidden">
                  <EgyptMap 
                    data={allGovData.length > 0 ? allGovData : []} 
                    language={language}
                    onRegionClick={(reg) => console.log('Selected:', reg)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-egypt-black p-8 rounded-[2.5rem] sm:rounded-[3rem] border border-zinc-100 dark:border-white/5 shadow-xl">
                <h4 className="text-lg font-black font-arabic mb-6">{language === 'ar' ? 'توزيع استهلاك الطاقة' : 'Energy Distribution'}</h4>
                <div className="space-y-5">
                  {(energyDist.length > 0 ? energyDist : [
                    { label: language === 'ar' ? 'الكهرباء' : 'Electricity', value: 0, color: 'bg-amber-500' },
                    { label: language === 'ar' ? 'الغاز' : 'Gas', value: 0, color: 'bg-orange-500' },
                    { label: language === 'ar' ? 'المياه' : 'Water', value: 0, color: 'bg-blue-500' },
                  ]).map((item) => (
                    <div key={item.label} className="group">
                      <div className="flex justify-between text-[10px] font-black uppercase mb-2 group-hover:text-white transition-colors">
                        <span>{item.label}</span>
                        <span className="text-egypt-gold">{item.value}%</span>
                      </div>
                      <div className="w-full h-3 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden border border-zinc-200 dark:border-white/10 shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full ${item.color} shadow-lg`} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white dark:bg-egypt-black p-8 rounded-[2.5rem] sm:rounded-[3rem] border border-zinc-100 dark:border-white/5 shadow-xl flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-black font-arabic mb-3">{language === 'ar' ? 'مؤشرات النقل الذكي' : 'Smart Transit Metrics'}</h4>
                  <div className="flex items-center justify-center p-4">
                    <Activity className="w-16 h-16 text-egypt-gold opacity-30 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/10">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">{language === 'ar' ? 'النمو اليومي' : 'Daily Growth'}</p>
                    <div className="flex items-center gap-2">
                       <TrendingUp className="text-emerald-500" size={20} />
                       <span className="text-2xl font-black text-emerald-500">{transitMetrics.increase}%</span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-zinc-500 text-center">
                    {language === 'ar' 
                       ? `الاستخدام المسجل اليوم: ${transitMetrics.count} رحلة` 
                       : `Recorded usage today: ${transitMetrics.count} trips`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2.5rem] sm:rounded-[3rem] shadow-xl relative overflow-hidden">
               <div className="Egyptian-pattern absolute inset-0 opacity-[0.05] pointer-events-none" />
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-500 rounded-xl text-white shadow-lg shadow-red-500/30">
                       <AlertTriangle size={20} />
                    </div>
                    <h4 className="text-lg font-black font-arabic text-red-500">{language === 'ar' ? 'تنبيهات المدينة البارزة' : 'City Priority Alerts'}</h4>
                  </div>
                  <div className="space-y-4">
                    {alerts.length > 0 ? alerts.map((alert, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.2 }}
                        key={i} 
                        className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-red-500/10 hover:border-red-500/40 transition-colors cursor-pointer group"
                      >
                        <p className="text-xs font-black mb-1 group-hover:text-red-500 transition-colors uppercase tracking-tight">
                          {typeof alert.title === 'string' ? alert.title : (language === 'ar' ? (alert.title?.ar || alert.title_ar) : (alert.title?.en || alert.title_en))}
                        </p>
                        <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500">
                           <span>{alert.type || 'Alert'}</span>
                           <span>{new Date(alert.timestamp || alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </motion.div>
                    )) : (
                      <div className="p-8 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center">
                         <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Activity className="text-emerald-500 w-6 h-6" />
                         </div>
                        <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">{language === 'ar' ? 'النظام مستقر كلياً' : 'System Fully Stable'}</p>
                        <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-tight">{language === 'ar' ? 'لا توجد حوادث حالية' : 'NO ACTIVE INCIDENTS'}</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>

            <div className="bg-white dark:bg-egypt-black p-8 rounded-[2.5rem] sm:rounded-[3rem] border border-zinc-100 dark:border-white/5 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                 <Target size={120} className="text-egypt-gold" />
              </div>
              <h4 className="text-lg font-black font-arabic mb-6 relative z-10">{language === 'ar' ? 'أهداف الاستدامة 2030' : '2030 Sustainability Goals'}</h4>
              <div className="space-y-6 relative z-10">
                {[
                  { label: language === 'ar' ? 'الطاقة المتجددة' : 'Renewable Energy', progress: nationalMetrics?.renewablePercentage ? Math.round(nationalMetrics.renewablePercentage) : 0, target: 42, color: 'bg-emerald-500' },
                  { label: language === 'ar' ? 'خفض انبعاثات الكربون' : 'Carbon Reduction', progress: nationalMetrics?.targetProgress ? Math.round(nationalMetrics.targetProgress) : 0, target: 100, color: 'bg-blue-500' },
                  { label: language === 'ar' ? 'إعادة تدوير المخلفات' : 'Waste Recycling', progress: nationalMetrics?.wasteRecycling ? Math.round(nationalMetrics.wasteRecycling) : 0, target: 25, color: 'bg-amber-500' },
                ].map((goal) => (
                  <div key={goal.label}>
                    <div className="flex justify-between text-[11px] font-black uppercase mb-2">
                      <span className="text-zinc-500">{goal.label}</span>
                      <span className="text-egypt-gold">{goal.progress}% / {goal.target}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden border border-zinc-200 dark:border-white/10">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(goal.progress / goal.target) * 100}%` }}
                        className={`h-full ${goal.color} shadow-[0_0_8px_rgba(255,255,255,0.2)]`} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-egypt-gold/10 border border-egypt-gold/20 rounded-[2.5rem] sm:rounded-[3rem] text-center relative overflow-hidden group hover:bg-egypt-gold/20 transition-colors">
              <div className="absolute -bottom-6 -left-6 opacity-10 group-hover:rotate-12 transition-transform">
                 <Info size={80} />
              </div>
              <Info className="w-12 h-12 text-egypt-gold mx-auto mb-4" />
              <h4 className="text-lg font-black font-arabic text-egypt-gold mb-2">{language === 'ar' ? 'عن مركز البيانات' : 'Data Insight'}</h4>
              <p className="text-xs font-bold text-zinc-500 leading-relaxed italic">
                {language === 'ar' 
                  ? 'يتم دمج البيانات من تحليلات المستخدمين في مصر مع الإحصائيات الرسمية لتقديم رؤية دقيقة لكل محافظة.' 
                  : 'User impact data across Egypt is merged with official stats to provide granular insights for each governorate.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityDashboard;
