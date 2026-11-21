
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Leaf, Zap, Car, Utensils, Droplets, ArrowRight, Sparkles, Target, ShieldCheck, Sprout, Trophy, Activity, Footprints, BusFront, Bike, Globe, TrendingUp, Lightbulb, UserCheck, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Footer } from './Footer';
import { supabase } from '../services/supabaseClient';
import { storageService } from '../services/storageService';

interface OnboardingProps {
  onComplete: () => void;
}

type OnboardingStep = 'intro' | 'discovery' | 'setup' | 'summary';

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('intro');
  const [introSlide, setIntroSlide] = useState(0);
  const [preferences, setPreferences] = useState({
    transport: 'public',
    energy_usage: 'medium',
    interests: [] as string[],
    monthly_budget: 1000
  });
  
  const { language, theme } = useApp();
  const isRtl = language === 'ar';

  const introSlides = [
    {
      icon: Sprout,
      color: 'emerald',
      title: isRtl ? 'مرحباً في MoEco' : 'Welcome to MoEco',
      description: isRtl ? 'بوابتك الذكية لمستقبل مستدام وصديق للبيئة في مصر.' : 'Your smart gateway to a sustainable and eco-friendly future in Egypt.',
      highlight: isRtl ? 'رؤية مصر 2030' : 'Egypt Vision 2030'
    },
    {
      icon: Footprints,
      color: 'sky',
      title: isRtl ? 'تتبع بصمتك بدقة' : 'Trace Your Footprint',
      description: isRtl ? 'نستخدم الذكاء الاصطناعي لتحليل استهلاكك من الطاقة والمياه والنقل.' : 'We use AI to analyze your energy, water, and transport consumption.',
      highlight: isRtl ? 'تحليل لحظي' : 'Real-time Analytics'
    },
    {
      icon: Wallet,
      color: 'amber',
      title: isRtl ? 'وفّر المال والبيئة' : 'Save Money & Environment',
      description: isRtl ? 'كل فعل أخضر تفعله يترجم إلى نقاط وخصومات حقيقية في محفظتك.' : 'Every green action translates to points and real discounts in your wallet.',
      highlight: isRtl ? 'محفظة خضراء ذكية' : 'Smart Green Wallet'
    }
  ];

  const handleNextIntro = () => {
    if (introSlide < introSlides.length - 1) {
      setIntroSlide(s => s + 1);
    } else {
      setCurrentStep('discovery');
    }
  };

  const savePreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await storageService.saveOnboardingProgress(user.id, { 
          completed: true,
          preferences: preferences,
          completed_at: new Date().toISOString()
        });
      }
      localStorage.setItem('moeco_onboarding', 'true');
      localStorage.setItem('moeco_preferences', JSON.stringify(preferences));
    } catch (e) {
      console.error("Error saving preferences:", e);
    }
    onComplete();
  };

  const toggleInterest = (id: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(id) 
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id]
    }));
  };

  const getColorClasses = (color: string) => {
    const classes: Record<string, { bg: string, text: string, gradient: string, border: string }> = {
      emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', gradient: 'from-emerald-400 to-emerald-600', border: 'border-emerald-500/20' },
      sky: { bg: 'bg-sky-500/10', text: 'text-sky-500', gradient: 'from-sky-400 to-sky-600', border: 'border-sky-500/20' },
      amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', gradient: 'from-amber-400 to-amber-600', border: 'border-amber-500/20' }
    };
    return classes[color] || classes.emerald;
  };

  const renderIntro = () => {
    const cur = introSlides[introSlide];
    const colors = getColorClasses(cur.color);
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 sm:space-y-10 w-full lg:max-w-4xl mx-auto px-4 h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={introSlide}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full text-center space-y-6 sm:space-y-8"
          >
            <div className="relative mx-auto w-32 h-32 sm:w-48 sm:h-48 flex items-center justify-center">
               <div className={`absolute inset-0 ${colors.bg} blur-[40px] sm:blur-[60px] rounded-full`} />
               <motion.div 
                 animate={{ y: [0, -8, 0] }}
                 transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
                 className={`relative w-28 h-28 sm:w-40 sm:h-40 bg-gradient-to-br ${colors.gradient} rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-white/20 z-10 p-6 sm:p-8`}
               >
                 <cur.icon className="w-full h-full text-white" />
               </motion.div>
            </div>
            <div className="space-y-3 max-w-xl mx-auto px-2">
               <span className={`inline-block px-3.5 py-1.5 ${colors.bg} ${colors.text} font-black rounded-full text-[10px] uppercase tracking-widest`}>{cur.highlight}</span>
               <h2 className="text-2xl sm:text-4xl font-black text-slate-800 dark:text-white leading-tight font-arabic">{cur.title}</h2>
               <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed text-sm sm:text-base">{cur.description}</p>
            </div>
          </motion.div>
        </AnimatePresence>
        
        <div className="w-full max-w-xs sm:max-w-sm pt-4">
          <motion.button 
            whileTap={{ scale: 0.97 }}
            onClick={handleNextIntro}
            className={`w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black text-base shadow-lg flex items-center justify-center gap-3 transition-colors`}
          >
            {isRtl ? 'استمر' : 'Continue'}
            <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
          </motion.button>
          
          <div className="mt-6 flex justify-center gap-2">
            {introSlides.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === introSlide ? 'w-8 bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'w-2 bg-slate-200 dark:bg-slate-800'}`} 
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDiscovery = () => (
    <div className="flex-1 flex flex-col items-center justify-center space-y-6 sm:space-y-8 w-full px-4 max-w-3xl mx-auto h-full">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black font-arabic text-slate-800 dark:text-white">{isRtl ? 'لنكتشف روتينك' : 'Discover Your Routine'}</h2>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm sm:text-base">{isRtl ? 'كيف تتنقل عادةً في المدينة؟' : 'How do you usually get around?'}</p>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-xl sm:max-w-none">
        {[
          { id: 'car', icon: Car, label: isRtl ? 'سيارة خاصة' : 'Personal Car' },
          { id: 'public', icon: BusFront, label: isRtl ? 'مواصلات عامة' : 'Public Transport' },
          { id: 'bike', icon: Bike, label: isRtl ? 'دراجة' : 'Cycling' },
          { id: 'walk', icon: Footprints, label: isRtl ? 'مشياً' : 'Walking' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setPreferences(p => ({ ...p, transport: item.id }))}
            className={`p-4 sm:p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
              preferences.transport === item.id 
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-md text-emerald-600 dark:text-emerald-400' 
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
          >
            <item.icon className="w-8 h-8 sm:w-10 sm:h-10" />
            <span className="font-bold text-xs sm:text-sm">{item.label}</span>
          </button>
        ))}
      </div>

      <motion.button 
        whileTap={{ scale: 0.97 }}
        onClick={() => setCurrentStep('setup')}
        className="w-full max-w-sm py-4 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-base shadow-[0_8px_30px_rgb(16,185,129,0.25)] transition-colors"
      >
        {isRtl ? 'التالي' : 'Next'}
      </motion.button>
    </div>
  );

  const renderSetup = () => (
    <div className="flex-1 flex flex-col items-center justify-center space-y-6 sm:space-y-8 w-full px-4 max-w-3xl mx-auto h-full">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black font-arabic text-slate-800 dark:text-white">{isRtl ? 'اهتماماتك البيئية' : 'Eco Interests'}</h2>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm sm:text-base">{isRtl ? 'ما الذي يهمك أكثر؟ (اختر ما يناسبك)' : 'What matters most to you? (Select multiple)'}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg mx-auto">
        {[
          { id: 'savings', icon: Wallet, label: isRtl ? 'توفير المال' : 'Money Savings' },
          { id: 'carbon', icon: Leaf, label: isRtl ? 'بصمة الكربون' : 'Carbon Footprint' },
          { id: 'health', icon: Heart, label: isRtl ? 'الصحة العامة' : 'Public Health' },
          { id: 'tech', icon: Zap, label: isRtl ? 'تكنولوجيا المنزل' : 'Home Tech' },
          { id: 'community', icon: Globe, label: isRtl ? 'المجتمع الأخضر' : 'Green Community' },
          { id: 'challenges', icon: Trophy, label: isRtl ? 'تحديات ومنافسة' : 'Challenges' },
        ].map(item => {
          const isSelected = preferences.interests.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleInterest(item.id)}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2.5 text-center ${
                isSelected
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shadow-md ring-2 ring-sky-500/20'
                : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-500 dark:text-slate-300 hover:border-slate-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${isSelected ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400'}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs sm:text-sm tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>

      <motion.button 
        whileTap={{ scale: 0.97 }}
        onClick={() => setCurrentStep('summary')}
        className="w-full max-w-sm py-4 mt-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black text-base shadow-lg transition-colors"
      >
        {isRtl ? 'عرض بصمتي المتوقعة' : 'Preview My Footprint'}
      </motion.button>
    </div>
  );

  const renderSummary = () => (
    <div className="flex-1 flex flex-col items-center justify-center space-y-6 sm:space-y-8 w-full px-4 max-w-3xl mx-auto h-full">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl mx-auto flex items-center justify-center border border-emerald-500/20">
          <Sparkles className="text-emerald-500 w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-4xl font-black leading-tight font-arabic text-slate-800 dark:text-white">
            {isRtl ? 'بصمتك الرقمية جاهزة' : 'Your Eco-ID is Ready'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold max-w-md mx-auto text-xs sm:text-base leading-relaxed">
            {isRtl ? 'بناءً على روتينك، صممنا تجربتك لتقليل انبعاثاتك.' : 'Based on your routine, we have tailored your experience to reduce emissions.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl text-center border border-slate-200 dark:border-zinc-800 shadow-sm">
           <TrendingUp className="mx-auto text-sky-500 mb-2 w-6 h-6" />
           <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{isRtl ? 'توفير سنوي متوقع' : 'Predicted Savings'}</p>
           <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">2.4k <span className="text-xs text-sky-500">EGP</span></p>
        </div>
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl text-center border border-slate-200 dark:border-zinc-800 shadow-sm">
           <Footprints className="mx-auto text-emerald-500 mb-2 w-6 h-6" />
           <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{isRtl ? 'أثر كربوني أساسي' : 'Baseline CO2'}</p>
           <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">150 <span className="text-sm text-emerald-500 font-bold">kg</span></p>
        </div>
      </div>

      <div className="w-full max-w-md space-y-3 pt-4">
        <motion.button 
          whileTap={{ scale: 0.97 }}
          onClick={savePreferences}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-sky-600 text-white rounded-2xl font-black text-base shadow-lg transition-all flex items-center justify-center gap-3"
        >
          {isRtl ? 'ابدأ كـ مو-إيكو' : 'Start as MoEco'}
          <UserCheck className="w-5 h-5" />
        </motion.button>
        <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
           {isRtl ? 'بالمتابعة، أنت توافق على معالجة البيانات البيئية الذكية.' : 'By continuing, you agree to smart environmental data processing.'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[4000] flex flex-col overflow-hidden transition-colors duration-500 bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-[0.02]" />
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-emerald-500/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-sky-500/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center z-[10] bg-gradient-to-b from-slate-50/90 dark:from-[#0f172a]/95 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
            <Zap className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xs uppercase tracking-tighter text-slate-800 dark:text-zinc-100">MoEco</span>
        </div>
        {currentStep === 'intro' && (
          <button 
            onClick={() => setCurrentStep('discovery')}
            className="px-4 py-2 bg-slate-200 dark:bg-zinc-800 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors text-slate-600 dark:text-zinc-300"
          >
            {isRtl ? 'تخطي' : 'Skip'}
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="relative z-[5] flex-1 flex flex-col pt-20 pb-6 overflow-y-auto h-full scroll-smooth custom-scrollbar">
        <AnimatePresence mode="wait">
          {currentStep === 'intro' && <motion.div key="intro" className="flex-1 flex flex-col h-full items-center justify-center min-h-[400px]">{renderIntro()}</motion.div>}
          {currentStep === 'discovery' && <motion.div key="disc" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col h-full items-center justify-center min-h-[400px]">{renderDiscovery()}</motion.div>}
          {currentStep === 'setup' && <motion.div key="setup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col h-full items-center justify-center min-h-[400px]">{renderSetup()}</motion.div>}
          {currentStep === 'summary' && <motion.div key="sum" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="flex-1 flex flex-col h-full items-center justify-center min-h-[400px]">{renderSummary()}</motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
};


