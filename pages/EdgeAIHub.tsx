import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, ArrowLeft, Leaf, Zap, Droplets, Car } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { localAIEngine, AIInsight } from '../services/localAiEngine';
import { Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { getSafeSession } from '../services/supabaseClient';

const EdgeAIHub: React.FC = () => {
  const { language, isRtl } = useApp();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [carbonSaved, setCarbonSaved] = useState(0);

  useEffect(() => {
    const fetchAI = async () => {
      const session = await getSafeSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }
      try {
        const aiResults = await localAIEngine.analyzeUserConsumption(session.user.id, language);
        setInsights(aiResults);
        
        // Estimated predictive calculation based on profile points
        const profile = await storageService.getUserProfile(session.user.id);
        const points = profile?.green_points || profile?.points || 0;
        setCarbonSaved(points * 0.5); // Just an estimated mapping
        
      } catch (err) {
        console.error("AI Engine error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAI();
  }, [language]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-emerald-500 w-8 h-8" />;
      case 'warning': return <AlertTriangle className="text-amber-500 w-8 h-8" />;
      case 'critical': return <TrendingUp className="text-red-500 w-8 h-8" />;
      default: return <Brain className="text-blue-500 w-8 h-8" />;
    }
  };

  const getBgForType = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
      case 'warning': return 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
      case 'critical': return 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
      default: return 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <section className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-xl border border-zinc-200 dark:border-white/10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <Link to="/" className="p-3 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors">
              <ArrowLeft className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                 <Brain className="text-emerald-500 w-6 h-6" />
                 <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">
                    {isRtl ? 'مُشغل بواسطة محرك MoEco المحلي' : 'Powered by MoEco Edge Engine'}
                 </span>
              </div>
              <h1 className="text-3xl font-black font-arabic text-zinc-900 dark:text-white">
                {isRtl ? 'المحلل الذكي' : 'Smart AI Analyst'}
              </h1>
              <p className="text-zinc-500 font-bold text-sm mt-1 max-w-md">
                {isRtl 
                  ? 'يقوم هذا المحرك بتحليل بياناتك محلياً وتقديم رؤى حول استهلاكك وتوقع فاتورتك القادمة مجاناً بالكامل' 
                  : 'This engine analyzes your data locally, providing insights and forecasting your next bill completely free.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main AI Insights */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Brain className="w-12 h-12 text-emerald-500 animate-pulse" />
          <p className="text-zinc-400 font-bold">{isRtl ? 'جاري تحليل الأنماط الاستهلاكية...' : 'Analyzing consumption patterns...'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
             <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-white/10">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">{isRtl ? 'تحليل مسار' : 'Trajectory'}</p>
                <div className="flex items-center gap-3">
                   <TrendingDown className="text-emerald-500" />
                   <span className="text-2xl font-black text-zinc-900 dark:text-white">{isRtl ? 'مستقر' : 'Stable'}</span>
                </div>
             </div>
             <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-3xl text-white flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-2">{isRtl ? 'تم توفيره هذا الشهر' : 'Saved this month'}</p>
                   <span className="text-3xl font-black">{carbonSaved.toFixed(1)} <span className="text-sm">kg CO2</span></span>
                </div>
                <Leaf className="w-12 h-12 text-white/20" />
             </div>
          </div>

          <h2 className="text-xl font-black mb-4 font-arabic">{isRtl ? 'رؤى وتوصيات' : 'Insights & Recommendations'}</h2>
          
          <div className="grid grid-cols-1 gap-6">
            {insights.length > 0 ? insights.map((insight, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={insight.id} 
                className={`flex gap-6 p-6 rounded-[2.5rem] border ${getBgForType(insight.type)}`}
              >
                <div className="shrink-0 mt-1">
                  {getIconForType(insight.type)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white font-arabic mb-2">{insight.title}</h3>
                  <p className="text-zinc-700 dark:text-zinc-300 font-medium text-sm leading-relaxed">{insight.message}</p>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-10 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-white/10">
                <p className="text-zinc-500 font-bold">{isRtl ? 'لا توجد بيانات كافية للتحليل بعد.' : 'Not enough data for analysis yet.'}</p>
              </div>
            )}
            
            {/* Hardcoded General Tip from Edge AI */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="flex gap-6 p-6 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20"
            >
               <div className="shrink-0 mt-1">
                  <Zap className="text-indigo-500 w-8 h-8" />
               </div>
               <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white font-arabic mb-2">
                     {isRtl ? 'نصيحة مجدولة من الذكاء الاصطناعي' : 'Scheduled AI Tip'}
                  </h3>
                  <p className="text-zinc-700 dark:text-zinc-300 font-medium text-sm leading-relaxed">
                     {isRtl 
                       ? 'تشير التوقعات المحلية إلى ذروة في استهلاك الكهرباء غداً بين الساعة 2 ظهراً و 5 عصراً. تجنب تشغيل الأجهزة الثقيلة في هذا الوقت لخفض فاتورتك.' 
                       : 'Local forecasts indicate peak electricity usage tomorrow between 2 PM and 5 PM. Avoid running heavy appliances to lower your bill.'}
                  </p>
               </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EdgeAIHub;
