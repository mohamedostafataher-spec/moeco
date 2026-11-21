import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TreePine, Droplets, Sun, Star, Trophy, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { storageService } from '../services/storageService';

const EcoTree: React.FC = () => {
  const { language, isRtl, user } = useApp();
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (user?.id) {
        const profile = await storageService.getUserProfile(user.id);
        const userPoints = profile?.green_points || profile?.points || user.points || 0;
        setPoints(userPoints);
        // Level logic: every 500 points = 1 level
        setLevel(Math.max(1, Math.floor(userPoints / 500) + 1));
      }
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  const treeSizeClass = level < 2 ? 'scale-75' : level < 4 ? 'scale-100' : level < 6 ? 'scale-125' : 'scale-150';
  const treeColorClass = level < 3 ? 'text-lime-500/50' : level < 5 ? 'text-emerald-500/80' : 'text-green-600';

  return (
    <div className={`max-w-4xl mx-auto space-y-8 pb-32 px-4 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <section className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-xl border border-zinc-200 dark:border-white/10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="p-3 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors">
              <ArrowLeft className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                 <TreePine className="text-emerald-500 w-6 h-6" />
                 <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">
                    {isRtl ? 'غابتك الافتراضية' : 'Virtual Forest'}
                 </span>
              </div>
              <h1 className="text-3xl font-black font-arabic text-zinc-900 dark:text-white">
                {isRtl ? 'الشجرة الرقمية' : 'Digital Eco-Tree'}
              </h1>
              <p className="text-zinc-500 font-bold text-sm mt-1 max-w-md">
                {isRtl 
                  ? 'شجرتك تنمو مع كل نشاط صديق للبيئة تقوم به. حقق النقاط لترقية شجرتك وفتح الألقاب.' 
                  : 'Your tree grows with every eco-friendly action. Earn points to upgrade and unlock titles.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Interactive Stage */}
      <div className="bg-gradient-to-b from-sky-100 to-emerald-50 dark:from-slate-800 dark:to-zinc-900 p-8 rounded-[3rem] border border-white/20 shadow-2xl relative flex flex-col items-center justify-center min-h-[400px] overflow-hidden">
        {/* Background elements */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 100, repeat: Infinity, ease: "linear" }} className="absolute -top-10 -right-10 pointer-events-none opacity-20">
            <Sun size={150} className="text-amber-400" />
        </motion.div>
        
        {loading ? (
             <div className="animate-pulse flex flex-col items-center gap-4">
                 <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
             </div>
        ) : (
            <>
               {/* The Tree */}
               <motion.div 
                 initial={{ scale: 0, opacity: 0 }} 
                 animate={{ scale: 1, opacity: 1 }} 
                 className={`relative z-10 transition-all duration-1000 origin-bottom ${treeSizeClass}`}
               >
                 <TreePine size={180} className={`drop-shadow-2xl ${treeColorClass}`} strokeWidth={1} />
                 
                 {/* Sparkles if level > 3 */}
                 {level > 3 && (
                    <motion.div animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 2, repeat: Infinity }} className="absolute top-4 right-4">
                        <Star size={24} className="text-egypt-gold drop-shadow-lg" fill="currentColor" />
                    </motion.div>
                 )}
               </motion.div>

               {/* Ground / Base */}
               <div className="w-48 h-12 bg-emerald-900/10 dark:bg-black/30 rounded-[100%] blur-sm -mt-6 z-0"></div>

               {/* Stats Board */}
               <div className="mt-12 bg-white/50 dark:bg-black/40 backdrop-blur-md p-6 rounded-3xl flex items-center justify-center gap-8 border border-white/20">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isRtl ? 'المستوى' : 'Level'}</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{level}</p>
                  </div>
                  <div className="w-px h-12 bg-slate-300 dark:bg-slate-700"></div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isRtl ? 'النقاط' : 'Points'}</p>
                    <p className="text-3xl font-black text-egypt-gold">{points}</p>
                  </div>
               </div>
            </>
        )}
      </div>

      {/* Progress & Milestones */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-zinc-200 dark:border-white/10">
         <h2 className="text-xl font-black font-arabic mb-6">{isRtl ? 'ترقيات و ألقاب الشجرة' : 'Tree Titles & Upgrades'}</h2>
         
         <div className="space-y-4">
            {[
               { reqLvl: 1, title: isRtl ? 'بذرة الأمل' : 'Seed of Hope', icon: Droplets, color: 'text-sky-500' },
               { reqLvl: 2, title: isRtl ? 'عمود البيئة' : 'Eco Sprout', icon: TreePine, color: 'text-lime-500' },
               { reqLvl: 3, title: isRtl ? 'حارس الغابة' : 'Forest Guardian', icon: ShieldCheck, color: 'text-emerald-500' },
               { reqLvl: 5, title: isRtl ? 'التاج الأخضر' : 'The Green Crown', icon: Trophy, color: 'text-egypt-gold' },
            ].map((m, i) => {
                const unlocked = level >= m.reqLvl;
                return (
                    <div key={i} className={`p-4 rounded-2xl flex items-center justify-between border ${unlocked ? 'bg-zinc-50 dark:bg-white/5 border-emerald-500/30' : 'bg-transparent border-dashed border-zinc-200 dark:border-white/10 opacity-50'}`}>
                       <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${unlocked ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800/50'}`}>
                               <m.icon className={`w-6 h-6 ${unlocked ? m.color : 'text-zinc-400'}`} />
                           </div>
                           <div>
                               <p className="font-black">{m.title}</p>
                               <p className="text-xs font-bold text-zinc-500">{isRtl ? `يفتح عند مستوى ${m.reqLvl}` : `Unlocks at Level ${m.reqLvl}`}</p>
                           </div>
                       </div>
                       {unlocked && <ShieldCheck className="text-emerald-500 w-6 h-6" />}
                    </div>
                )
            })}
         </div>
      </div>
    </div>
  );
};

export default EcoTree;
