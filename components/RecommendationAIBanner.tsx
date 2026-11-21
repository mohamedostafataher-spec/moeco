import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ThumbsUp, ThumbsDown, ArrowRight,
  TrendingUp, Leaf, Car, Zap, Droplets, Trash2,
  X, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ruleEngineService, Recommendation } from '../services/ruleEngineService';
import { supabase } from '../services/supabaseClient';
import { notificationService } from '../services/notificationService';

const RecommendationAIBanner: React.FC = () => {
  const { user, isRtl, language } = useApp();
  const navigate = useNavigate();
  const isAr = language === 'ar';
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAndAnalyzeData();
    }
  }, [user]);

  const fetchAndAnalyzeData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch user's recent carbon activities to feed the rule engine
      const { data: activities } = await supabase
        .from('carbon_activities')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: recycling } = await supabase
        .from('environmental_reports')
        .select('*')
        .eq('user_id', user?.id)
        .eq('category', 'garbage');

      // 2. Prepare consumption object for the engine
      const consumption = {
        transport_impact: activities?.filter(a => a.sector === 'transport').reduce((sum, a) => sum + (a.carbon_impact || 0), 0) || 0,
        water_consumption: activities?.filter(a => a.sector === 'water').reduce((sum, a) => sum + (a.value || 0), 0) || 0,
        peak_energy_use: activities?.filter(a => a.sector === 'electricity').reduce((sum, a) => sum + (a.value || 0), 0) || 0,
        recycling_history: recycling || []
      };

      // 3. Get recommendations from local rule engine
      const recs = ruleEngineService.analyzeConsumption(consumption, isAr);
      setRecommendations(recs);
    } catch (error) {
      console.error('Recommendation engine error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (recId: string, rating: number) => {
    if (!user) return;
    
    try {
      await ruleEngineService.submitFeedback(user.id, recId, rating);
      setFeedbackGiven(prev => ({ ...prev, [recId]: true }));
      notificationService.success(isAr ? 'شكراً لتعليقك! نستخدم ملاحظاتك لتحسين التوصيات.' : 'Thanks for your feedback! We use this to improve your recommendations.');
      
      // Auto move to next after 2 seconds if index is current
      setTimeout(() => {
        if (recommendations.length > 1) {
           setCurrentIndex((prev) => (prev + 1) % recommendations.length);
        }
      }, 2000);
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  if (isLoading || recommendations.length === 0) return null;

  const currentRec = recommendations[currentIndex];
  
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Truck': return <Car className="w-6 h-6 text-blue-500" />;
      case 'Droplets': return <Droplets className="w-6 h-6 text-blue-400" />;
      case 'Zap': return <Zap className="w-6 h-6 text-amber-500" />;
      case 'Trash2': return <Trash2 className="w-6 h-6 text-green-500" />;
      default: return <Sparkles className="w-6 h-6 text-egypt-gold" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-white dark:bg-egypt-black rounded-[2.5rem] border border-zinc-100 dark:border-white/5 shadow-2xl group"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-egypt-gold via-blue-500 to-green-500 opacity-30" />
      
      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
        {/* Visual Badge */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 bg-egypt-gold/10 rounded-3xl flex items-center justify-center shadow-inner">
            <Sparkles className="w-10 h-10 text-egypt-gold animate-pulse" />
          </div>
          <div className="absolute -top-2 -right-2 bg-egypt-black text-[8px] font-black uppercase tracking-widest text-egypt-gold px-2 py-1 rounded-full border border-egypt-gold/20 shadow-lg">
            AI INSIGHT
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRec.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-center md:justify-start gap-3">
                {getIcon(currentRec.icon)}
                <h3 className="text-xl font-black font-arabic text-zinc-900 dark:text-white leading-tight">
                  {currentRec.title}
                </h3>
              </div>
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
                {currentRec.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <button
               onClick={() => navigate(currentRec.actionUrl)}
               className="px-6 py-3 bg-egypt-gold text-egypt-black rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-egypt-gold/20"
            >
              {isAr ? 'اتخاذ إجراء الآن' : 'Take Action Now'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="h-8 w-[1px] bg-zinc-200 dark:bg-white/10 mx-2 hidden sm:block" />

            {/* Feedback Mechanism */}
            {!feedbackGiven[currentRec.id] ? (
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  {isAr ? 'هل كانت التوصية مفيدة؟' : 'Was this helpful?'}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleFeedback(currentRec.id, 1)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg text-zinc-400 hover:text-green-500 transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleFeedback(currentRec.id, -1)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{isAr ? 'شكراً لك!' : 'Thanks!'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Dots if multiple */}
        {recommendations.length > 1 && (
          <div className="flex md:flex-col gap-2">
            {recommendations.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentIndex === idx ? 'bg-egypt-gold w-6 md:w-2 md:h-6' : 'bg-zinc-300 dark:bg-white/10'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Decorative pulse */}
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-egypt-gold/5 blur-3xl rounded-full pointer-events-none" />
    </motion.div>
  );
};

export default RecommendationAIBanner;
