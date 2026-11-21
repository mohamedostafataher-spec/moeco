
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Leaf, Trophy, Activity, Building2, 
  Map as MapIcon, Zap, Wind, Droplets, Car, 
  ShieldAlert, Globe, Activity as PulseIcon,
  LayoutGrid, BarChart3, Info, ExternalLink,
  Target, ChevronRight, TrendingDown, DollarSign
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { behaviorEngine } from '../services/behaviorEngine';
import { notificationService } from '../services/notificationService';
import EgyptMap from '../components/EgyptMap';

const SustainHub: React.FC = () => {
  const { language, theme, user, isRtl, trackCarbon } = useApp();
  const [activeTab, setActiveTab] = useState<'personal' | 'city' | 'system'>('personal');
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [personalStats, setPersonalStats] = useState<any>(null);
  const [cityStats, setCityStats] = useState<any>(null);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [personality, setPersonality] = useState<any>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (!user) return;
      
      const [aggregated, history, cityMeta, performance] = await Promise.all([
        storageService.getAggregatedCarbon(user.id),
        storageService.fetchUserHistory(user.id, 20),
        storageService.getNationalMetrics(),
        storageService.getMetrics()
      ]);

      setPersonalStats(aggregated);
      setPersonality(behaviorEngine.getPersonalityMood(history, language));
      setCityStats(cityMeta?.data);
      setSystemMetrics(performance);
    } catch (error) {
      console.error("SustainHub load failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Dynamic Header */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3.5rem] shadow-2xl border border-zinc-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <PulseIcon size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">{isRtl ? 'مركز الاستدامة' : 'Sustain Hub'}</h1>
            <p className="text-sm font-bold text-stone-500 uppercase tracking-widest">{isRtl ? 'تحليل الأثر الشخصي والوطني' : 'Personal & National Impact Audit'}</p>
          </div>
        </div>

        <div className="flex bg-stone-100 dark:bg-white/5 p-2 rounded-3xl">
          {[
            { id: 'personal', icon: Leaf, label: isRtl ? 'شخصي' : 'Personal' },
            { id: 'city', icon: Building2, label: isRtl ? 'المدينة' : 'City' },
            { id: 'system', icon: Activity, label: isRtl ? 'النظام' : 'System' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all ${
                activeTab === tab.id ? 'bg-emerald-500 text-white shadow-lg' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'personal' && (
          <motion.div key="personal" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-8">
             {personality && (
                <div className="p-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-[3.5rem] text-white shadow-2xl flex flex-col md:flex-row items-center gap-8 border border-white/20">
                   <div className="text-6xl">{personality.mood === 'happy' ? '😊' : '🌱'}</div>
                   <div className="flex-1 text-center md:text-left">
                      <h2 className="text-3xl font-black mb-2">{personality.greeting}</h2>
                      <p className="text-sm font-bold opacity-80">{personality.message}</p>
                   </div>
                </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: isRtl ? 'الانبعاثات' : 'Emissions', val: Math.round(personalStats?.total || 0), unit: 'KG', color: 'bg-blue-500' },
                  { label: isRtl ? 'التوفير' : 'Savings', val: Math.round(personalStats?.totalSavedMoney || 0), unit: 'EGP', color: 'bg-emerald-500' },
                  { label: isRtl ? 'النقاط' : 'Points', val: user?.points || 0, unit: 'PTS', color: 'bg-amber-500' },
                  { label: isRtl ? 'المستوى' : 'Level', val: user?.level || 1, unit: 'LVL', color: 'bg-purple-500' },
                ].map(m => (
                  <div key={m.label} className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-stone-100 dark:border-white/5 shadow-xl text-center">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">{m.label}</p>
                    <h3 className="text-4xl font-black text-stone-800 dark:text-white tabular-nums">{m.val}</h3>
                    <span className="text-[8px] font-black uppercase text-stone-500">{m.unit}</span>
                  </div>
                ))}
             </div>
          </motion.div>
        )}

        {activeTab === 'city' && (
           <motion.div key="city" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="md:col-span-2 bg-stone-900 rounded-[4rem] h-[500px] relative overflow-hidden border border-white/5 flex items-center justify-center p-12">
                    <div className="absolute inset-0 opacity-10"><MapIcon className="w-full h-full" /></div>
                    <div className="relative text-center z-10">
                       <h3 className="text-3xl font-black text-white mb-4">{isRtl ? 'خريطة الاستدامة الوطنية' : 'National Sustainability Map'}</h3>
                       <p className="text-sm font-bold text-stone-500 max-w-md mx-auto mb-8">{isRtl ? 'بيانات حية مباشرة من كافة المحافظات تدعم قرار المستقبل.' : 'Live data feeds from all governorates supporting future decisions.'}</p>
                       <div className="flex justify-center gap-4">
                          <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                             <p className="text-emerald-500 font-black">Cairo: Normal</p>
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="p-8 bg-white dark:bg-zinc-900 rounded-[3rem] border border-stone-100 dark:border-white/5 shadow-xl">
                       <h4 className="text-xl font-black mb-6">{isRtl ? 'تنبيهات المدن' : 'City Alerts'}</h4>
                       <div className="space-y-4">
                          <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                             <p className="text-xs font-black text-red-500">AQI Update: Moderate in Giza</p>
                             <p className="text-[10px] font-bold text-stone-400 mt-1">2 mins ago</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </motion.div>
        )}

        {activeTab === 'system' && (
           <motion.div key="system" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-stone-100 dark:border-white/5">
                    <h4 className="text-xl font-black mb-6">System Health</h4>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center p-4 bg-stone-50 dark:bg-white/5 rounded-2xl">
                          <span className="text-xs font-bold text-stone-500">Load Time</span>
                          <span className="font-black">{(systemMetrics?.loadTime / 1000).toFixed(2)}s</span>
                       </div>
                       <div className="flex justify-between items-center p-4 bg-stone-50 dark:bg-white/5 rounded-2xl">
                          <span className="text-xs font-bold text-stone-500">Sync Status</span>
                          <span className="text-emerald-500 font-black">ACTIVE</span>
                       </div>
                    </div>
                 </div>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SustainHub;
