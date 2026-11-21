import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Droplets, Leaf, TrendingDown, Award, AlertTriangle, Activity, Sun as SunIcon, Wind, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';

const NationalRationalization: React.FC = () => {
  const { language, theme, isRtl, user, trackCarbon } = useApp();
  const [loading, setLoading] = useState(false);
  const [savings, setSavings] = useState({ electricity: 0, water: 0 });

  const [nationalStats, setNationalStats] = useState({
    energySavedMW: 0,
    waterSavedM3: 0,
    carbonReducedTons: 0,
    targetProgress: 74,
    renewableShare: 20 // Percentage of renewables in mix
  });

  const [egyptianPlans, setEgyptianPlans] = useState<any[]>([]);
  const [rssFeeds, setRssFeeds] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: metrics } = await storageService.getNationalMetrics();
        if (metrics) {
          setNationalStats({
            energySavedMW: metrics.energySavedMW || 0,
            waterSavedM3: metrics.waterSavedM3 || 0,
            carbonReducedTons: metrics.carbonReducedTons || 0,
            targetProgress: metrics.targetProgress || 74,
            renewableShare: metrics.renewablePercentage || 20
          });
        }
      } catch (err) {
        console.error("Failed to fetch national stats", err);
      }

      try {
        const { data: missions } = await supabase.from('national_missions').select('*').eq('is_active', true);
        if (missions && missions.length > 0) {
          setEgyptianPlans(missions);
        }
      } catch(e) {
        console.error(e);
      }

      try {
         const feeds = await storageService.getRssFeeds();
         if (feeds && feeds.length > 0) {
            setRssFeeds(feeds);
         }
      } catch(e) {
         console.error(e);
      }
    };
    fetchStats();

    const channel = supabase.channel('national_missions_hub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'national_missions' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [language]);

  const handleLogSaving = async (type: 'electricity' | 'water', amount: number) => {
    if (!user) {
      notificationService.error(language === 'ar' ? 'يجب تسجيل الدخول' : 'Must be logged in');
      return;
    }
    setLoading(true);
    try {
      // Calculate carbon impact
      // Electricity: ~0.5 kg CO2 per kWh
      // Water: ~0.3 kg CO2 per m3
      const carbonSaved = type === 'electricity' ? amount * 0.5 : amount * 0.3;
      
      await trackCarbon('rationalization', type, amount, {
        description: `Saved ${amount} ${type === 'electricity' ? 'kWh' : 'm3'}`
      });

      setSavings(prev => ({ ...prev, [type]: prev[type] + amount }));
      notificationService.success(
        language === 'ar' 
          ? `تم تسجيل التوفير بنجاح! أنقذت ${carbonSaved.toFixed(2)} كجم من الكربون` 
          : `Savings logged! You saved ${carbonSaved.toFixed(2)} kg of CO2`
      );
    } catch (error) {
      console.error(error);
      notificationService.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen pb-32 transition-all duration-500 ${theme === 'dark' ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="w-full space-y-8 pt-8 px-4">
        
        {/* Header */}
        <div className={`p-8 rounded-[3rem] border relative overflow-hidden ${theme === 'dark' ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-white border-emerald-100 shadow-xl shadow-emerald-900/5'}`}>
          <div className="relative z-10 flex flex-col gap-6">
            <div className={`w-16 h-16 p-4 rounded-3xl shadow-lg border flex items-center justify-center ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/20'}`}>
              <Activity className={`${theme === 'dark' ? 'text-emerald-500' : 'text-white'} w-8 h-8`} />
            </div>
            <div>
              <h1 className={`text-3xl font-black font-arabic tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {language === 'ar' ? 'مبادرة الترشيد' : 'Rationalization'}
              </h1>
              <p className={`mt-2 text-xs font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>
                {language === 'ar' 
                  ? 'شارك في خطة التحول الأخضر الوطنية لتقليل الهدر.' 
                  : 'Join the national green transformation plan to reduce waste.'}
              </p>
            </div>
          </div>
        </div>

        {/* National Progress */}
        <div className="grid grid-cols-1 gap-4">
          <div className={`p-6 rounded-[2rem] border flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                <Zap size={24} />
              </div>
              <div>
                <p className={`text-[8px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>Energy Saved</p>
                <p className="text-xl font-black text-amber-500">{nationalStats.energySavedMW} <span className="text-[10px]">MW</span></p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-[2rem] border flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                <Droplets size={24} />
              </div>
              <div>
                <p className={`text-[8px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>Water Saved</p>
                <p className="text-xl font-black text-blue-500">{nationalStats.waterSavedM3.toLocaleString()} <span className="text-[10px]">m³</span></p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-[2rem] border flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                <Leaf size={24} />
              </div>
              <div>
                <p className={`text-[8px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>CO2 Reduced</p>
                <p className="text-xl font-black text-emerald-500">{nationalStats.carbonReducedTons} <span className="text-[10px]">Tons</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* User Contribution */}
        <div className={`p-8 rounded-[3rem] border space-y-8 ${theme === 'dark' ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-slate-100 shadow-xl shadow-emerald-900/5'}`}>
          <h2 className={`text-xl font-black font-arabic flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <Award className="w-6 h-6 text-emerald-500" />
            {language === 'ar' ? 'سجل توفيرك' : 'Log Savings'}
          </h2>
          
          <div className="space-y-6">
            {/* Electricity */}
            <div className={`p-6 rounded-[2rem] border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3 mb-4">
                <SunIcon className="w-5 h-5 text-amber-500" />
                <h3 className={`font-black text-sm uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>
                  {language === 'ar' ? 'الكهرباء' : 'Electricity'}
                </h3>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleLogSaving('electricity', 2)}
                  disabled={loading}
                  className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  {language === 'ar' ? '2 ك.و.س' : '2 kWh'}
                </button>
                <button 
                  onClick={() => handleLogSaving('electricity', 5)}
                  disabled={loading}
                  className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-all border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                >
                  {language === 'ar' ? '5 ك.و.س' : '5 kWh'}
                </button>
              </div>
            </div>

            {/* Water */}
            <div className={`p-6 rounded-[2rem] border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3 mb-4">
                <Droplets className="w-5 h-5 text-blue-500" />
                <h3 className={`font-black text-sm uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>
                  {language === 'ar' ? 'المياه' : 'Water'}
                </h3>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleLogSaving('water', 10)}
                  disabled={loading}
                  className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  {language === 'ar' ? '10 لتر' : '10 L'}
                </button>
                <button 
                  onClick={() => handleLogSaving('water', 50)}
                  disabled={loading}
                  className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-all border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                >
                  {language === 'ar' ? '50 لتر' : '50 L'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* National Plans Section */}
        <div className="space-y-6">
          <h2 className={`text-xs font-black uppercase tracking-widest px-4 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
             {language === 'ar' ? 'خطط الدولة' : 'National Plans'}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {egyptianPlans.map((plan, idx) => {
              const IconComp = plan.icon === 'Activity' ? Activity : plan.icon === 'Leaf' ? Leaf : SunIcon;
              return (
              <div key={idx} className={`p-6 rounded-[2rem] border flex gap-4 items-start ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className={`p-3 rounded-2xl shrink-0 ${plan.bgColor || 'bg-emerald-500/10'} ${plan.color || 'text-emerald-500'}`}>
                  <IconComp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`text-base font-black font-arabic mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{language === 'ar' ? (plan.title_ar || plan.title) : (plan.title_en || plan.title)}</h3>
                  <p className="text-[10px] font-bold text-zinc-500 leading-relaxed">{language === 'ar' ? (plan.description_ar || plan.description) : (plan.description_en || plan.description)}</p>
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* RSS Sources */}
        <div className="space-y-4 px-2">
           <div className="grid grid-cols-2 gap-3">
            {rssFeeds.map((feed, idx) => (
              <a 
                key={idx} 
                href={feed.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`p-4 rounded-2xl border transition-all text-center ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-100 hover:bg-slate-50 shadow-sm'}`}
              >
                <p className={`font-black text-[10px] uppercase tracking-widest ${theme === 'dark' ? 'text-emerald-500' : 'text-emerald-600'}`}>{feed.name}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NationalRationalization;
