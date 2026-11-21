import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, CloudRain, ShieldAlert, Sparkles, Activity, Clock, 
  Leaf, ThermometerSun, MapPin, HeartPulse, ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { storageService } from '../services/storageService';
import { useNavigate } from 'react-router-dom';

export const MoEcoSmartIsland: React.FC = () => {
  const { language, user, isRtl } = useApp();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [pulse, setPulse] = useState({ state: 'stable', value: '420.5' });
  const [time, setTime] = useState(new Date());
  const [vitalStat, setVitalStat] = useState({ label: '', val: '' });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const fetchPulse = async () => {
      try {
         const val = await storageService.getCarbonPulse(user.id);
         setPulse(prev => ({ ...prev, value: val }));
         setVitalStat({
           label: isRtl ? 'النقاط الخضراء' : 'Green Points',
           val: (user?.points || 0).toString()
         });
      } catch (e) {
         // Silently fail
      }
    };
    fetchPulse();
    
    const realtimeSub = supabase
      .channel('island_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consumption_records', filter: `user_id=eq.${user.id}` }, () => {
        fetchPulse();
        setPulse(prev => ({ ...prev, state: 'pulsing' }));
        setTimeout(() => setPulse(prev => ({ ...prev, state: 'stable' })), 3000);
      })
      .subscribe();

    return () => { supabase.removeChannel(realtimeSub); };
  }, [user]);

  if (!user) return null;

  return (
    <div className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[200] max-w-[95vw] sm:max-w-md w-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]" dir={isRtl ? 'rtl' : 'ltr'}>
      <motion.div 
        layout
        onClick={() => setIsOpen(!isOpen)}
        className={`mx-auto bg-black/80 backdrop-blur-3xl border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] cursor-pointer overflow-hidden relative group hover:border-emerald-500/30 transition-colors ${isOpen ? 'rounded-[2.5rem]' : 'rounded-full'}`}
      >
        {/* Dynamic Glows */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(16,185,129,0.3)_360deg)] animate-spin-slow pointer-events-none opacity-20 ${isOpen ? 'hidden' : 'block'}`} />
        
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        <motion.div layout className="relative p-2 md:p-3 flex items-center justify-between z-10 w-full min-w-[200px]">
           <div className="flex items-center gap-2 md:gap-3 pl-2">
              <div className="relative">
                <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${pulse.state === 'pulsing' ? 'bg-emerald-400 shadow-[0_0_15px_#34d399] animate-ping' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`} />
                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-[2px]" />
              </div>
              <span className="text-[10px] md:text-sm font-black text-white tracking-widest uppercase">
                 Mo<span className="text-emerald-400">Eco</span> {isOpen ? 'System' : ''}
              </span>
           </div>
           
           {!isOpen && (
             <motion.div layout className="flex items-center gap-3 md:gap-4 pr-3">
               <div className="flex items-center gap-1.5 opacity-80">
                 <Leaf size={12} className="text-emerald-400" />
                 <span className="text-[10px] md:text-xs font-black text-emerald-100">{pulse.value}</span>
               </div>
               <div className="w-px h-3 bg-white/20" />
               <VolumeIndicator />
             </motion.div>
           )}

           {isOpen && (
             <div className="pr-3 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center shadow-inner">
               <ShieldCheck size={14} className="text-emerald-400" />
             </div>
           )}
        </motion.div>

        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 pb-6 pt-2 relative z-10 w-full"
            >
               <div className="grid grid-cols-2 gap-4">
                  {/* Realtime Carbon Pulse */}
                  <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                     <div className="flex items-center gap-2 mb-2">
                       <Activity size={14} className="text-emerald-500" />
                       <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{isRtl ? 'بصمة الكربون' : 'Carbon Pulse'}</span>
                     </div>
                     <span className="text-3xl font-black text-white tracking-tighter">{pulse.value}</span>
                     <span className="text-xs text-emerald-500 font-bold ml-1">KG</span>
                  </div>

                   {/* Points / Vital Stat */}
                   <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                     <div className="flex items-center gap-2 mb-2">
                       <Sparkles size={14} className="text-amber-400" />
                       <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{vitalStat.label}</span>
                     </div>
                     <span className="text-3xl font-black text-white tracking-tighter">{vitalStat.val}</span>
                     <span className="text-xs text-amber-400 font-bold ml-1">PTS</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex gap-2">
                     <button onClick={() => navigate('/calculator')} className="flex-1 py-3 bg-white/10 hover:bg-emerald-500 hover:text-black transition-colors rounded-2xl text-[10px] font-black uppercase tracking-widest text-white border border-white/5">
                        {isRtl ? 'فتح الحاسبة' : 'Open Calculator'}
                     </button>
                     <button onClick={() => navigate('/emergency')} className="w-12 h-12 bg-rose-500/20 hover:bg-rose-500 text-rose-500 flex items-center justify-center rounded-2xl transition-colors border border-rose-500/30">
                        <ShieldAlert size={16} />
                     </button>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const VolumeIndicator = () => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4].map(i => (
      <motion.div 
        key={i}
        animate={{ height: [6, 12, 6] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
        className="w-0.5 bg-emerald-500 rounded-full shadow-[0_0_4px_#10b981]"
      />
    ))}
  </div>
);
