import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Droplets, Sun, Wind, Sprout, Info, CheckCircle2, ArrowRight, Sparkles, Loader2, Search, Camera, Plus, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { smartAiService } from '../services/smartAiService';

const GreenAgriculture: React.FC = () => {
  const { language, theme, isRtl, user } = useApp();
  const [activeTab, setActiveTab] = useState<'roofs' | 'balcony' | 'water'>('roofs');
  const [plantQuery, setPlantQuery] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dailyAiContent, setDailyAiContent] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTip, setNewTip] = useState({ title: '', desc: '' });

  React.useEffect(() => {
    const fetchAiContent = async () => {
      const content = await smartAiService.generateDailyContent('agriculture', language as any);
      setDailyAiContent(content);
    };
    fetchAiContent();
  }, [language]);

  const handlePlantAnalysis = async () => {
    if (!plantQuery) return;
    setIsAnalyzing(true);
    try {
      // Local Smart Assistant Logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const query = plantQuery.toLowerCase();
      let result = '';

      if (query.includes('طماطم') || query.includes('tomato')) {
        result = language === 'ar'
          ? 'الطماطم: تحتاج لشمس مباشرة (6-8 ساعات) وري منتظم. امتصاص الكربون: 0.5 كجم/سنة. مناسبة جداً للأسطح المصرية في الربيع والخريف.'
          : 'Tomatoes: Need direct sunlight (6-8 hours) and regular watering. Carbon sequestration: 0.5kg/year. Very suitable for Egyptian roofs in Spring and Autumn.';
      } else if (query.includes('نعناع') || query.includes('mint')) {
        result = language === 'ar'
          ? 'النعناع: يحتاج لتربة رطبة وشمس جزئية. امتصاص الكربون: 0.2 كجم/سنة. يطرد الحشرات طبيعياً ومثالي للبلكونات.'
          : 'Mint: Needs moist soil and partial sun. Carbon sequestration: 0.2kg/year. Naturally repels insects and is ideal for balconies.';
      } else {
        result = language === 'ar'
          ? `بخصوص ${plantQuery}: معظم النباتات المنزلية في مصر تحتاج لتربة جيدة التصريف وري في الصباح الباكر. الزراعة الحضرية تقلل حرارة منزلك بنسبة تصل لـ 5 درجات.`
          : `Regarding ${plantQuery}: Most home plants in Egypt need well-draining soil and early morning watering. Urban farming reduces your home temperature by up to 5 degrees.`;
      }
      
      setAiResult(result);
    } catch (error) {
      console.error(error);
      setAiResult(language === 'ar' ? 'عذراً، حدث خطأ في النظام.' : 'Sorry, a system error occurred.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const content = {
    ar: {
      title: 'الزراعة الخضراء وزراعة الأسطح',
      subtitle: 'ساهم في تقليل الانبعاثات الكربونية وتبريد منزلك من خلال زراعة المساحات المتاحة.',
      tabs: {
        roofs: 'زراعة الأسطح',
        balcony: 'زراعة البلكونات',
        water: 'ترشيد المياه'
      },
      benefits: [
        'تقليل درجة حرارة المبنى (يوفر استهلاك التكييف)',
        'امتصاص ثاني أكسيد الكربون وإنتاج الأكسجين',
        'توفير مساحات خضراء مريحة للأعصاب',
        'إمكانية زراعة خضروات عضوية آمنة للاستخدام المنزلي'
      ],
      steps: [
        { title: 'التنظيف والعزل', desc: 'تأكد من عزل السطح جيداً لمنع تسرب المياه.' },
        { title: 'اختيار الحاويات', desc: 'استخدم صناديق خشبية أو بلاستيكية مع فتحات تصريف.' },
        { title: 'التربة المناسبة', desc: 'استخدم تربة خفيفة (بيتموس + بيرلايت) لتقليل الحمل على السطح.' },
        { title: 'الزراعة والري', desc: 'اختر نباتات تتحمل الشمس (مثل الطماطم، النعناع، الريحان) واروها بانتظام.' }
      ]
    },
    en: {
      title: 'Green Agriculture & Roof Farming',
      subtitle: 'Help reduce carbon emissions and cool your home by planting in available spaces.',
      tabs: {
        roofs: 'Roof Farming',
        balcony: 'Balcony Planting',
        water: 'Water Conservation'
      },
      benefits: [
        'Reduces building temperature (saves AC usage)',
        'Absorbs CO2 and produces Oxygen',
        'Provides relaxing green spaces',
        'Possibility to grow safe organic vegetables for home use'
      ],
      steps: [
        { title: 'Cleaning & Insulation', desc: 'Ensure the roof is well insulated to prevent water leaks.' },
        { title: 'Choosing Containers', desc: 'Use wooden or plastic boxes with drainage holes.' },
        { title: 'Proper Soil', desc: 'Use light soil (Peatmoss + Perlite) to reduce load on the roof.' },
        { title: 'Planting & Watering', desc: 'Choose sun-tolerant plants (Tomato, Mint, Basil) and water regularly.' }
      ]
    }
  };

  const t = content[language as keyof typeof content];

  return (
    <div className={`min-h-screen pb-32 ${theme === 'dark' ? 'bg-egypt-black text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      <div className="max-w-6xl mx-auto space-y-8 pt-8 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
        
        {/* Header */}
        <div className={`p-8 rounded-[3rem] border ${theme === 'dark' ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-200 shadow-xl'}`}>
          <div className="flex items-center gap-6 mb-4">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center border border-emerald-500/20">
              <Sprout className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black font-arabic tracking-tighter">{t.title}</h1>
              <p className={`mt-2 font-bold ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>{t.subtitle}</p>
            </div>
          </div>
          {user?.role === 'admin' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-egypt-gold text-black rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {language === 'ar' ? 'إضافة نصيحة يدوياً' : 'Add Tip Manually'}
            </button>
          )}
        </div>

        {/* AI Daily Tip */}
        {dailyAiContent && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-8 rounded-[3rem] border-2 border-dashed ${theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-500/30'}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500 text-white rounded-lg">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-500">
                {language === 'ar' ? 'نصيحة زراعية ذكية اليوم' : 'Daily AI Agriculture Tip'}
              </span>
            </div>
            <h3 className="text-xl font-black mb-2">{dailyAiContent.seasonal_plant || dailyAiContent.tip}</h3>
            <p className="text-sm font-bold opacity-70 mb-4">{dailyAiContent.tip}</p>
            {dailyAiContent.instructions && (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs font-bold leading-relaxed">{dailyAiContent.instructions}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* AI Plant Doctor Section */}
        <section className={`p-8 rounded-[3rem] border overflow-hidden relative group ${theme === 'dark' ? 'bg-zinc-900/50 border-emerald-500/20' : 'bg-white border-emerald-500/30 shadow-xl'}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <Sparkles className="w-12 h-12 text-emerald-500 animate-pulse-glow" />
            </div>
            <div className="flex-1 text-center md:text-left rtl:md:text-right">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <span className="px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-mono font-bold rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  {language === 'ar' ? 'طبيب النباتات الذكي' : 'AI Plant Doctor'}
                </span>
              </div>
              <h2 className="text-2xl font-black mb-2">
                {language === 'ar' ? 'اسأل عن أي نبات أو مشكلة زراعية' : 'Ask about any plant or farming issue'}
              </h2>
              <p className={`text-sm font-bold ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {language === 'ar' ? 'احصل على نصائح رعاية مخصصة وتقدير لامتصاص الكربون' : 'Get personalized care tips and carbon sequestration estimates'}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row gap-4 relative z-10">
            <div className="flex-1 relative">
              <Search className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} w-5 h-5 text-emerald-500`} />
              <input 
                type="text"
                placeholder={language === 'ar' ? 'مثال: كيف أزرع الطماطم على السطح؟ أو ما هي فوائد النعناع؟' : 'Example: How to grow tomatoes on roof? or Benefits of Mint?'}
                className={`w-full ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 rounded-2xl border font-bold outline-none focus:border-emerald-500 ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                }`}
                value={plantQuery}
                onChange={(e) => setPlantQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePlantAnalysis()}
              />
            </div>
            <button 
              onClick={handlePlantAnalysis}
              disabled={isAnalyzing || !plantQuery}
              className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {language === 'ar' ? 'تحليل' : 'Analyze'}
            </button>
          </div>

          <AnimatePresence>
            {aiResult && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-8 p-8 rounded-[2.5rem] border leading-relaxed font-medium whitespace-pre-wrap relative z-10 ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3 mb-4 text-emerald-500">
                  <Info className="w-5 h-5" />
                  <span className="font-black uppercase text-xs tracking-widest">{language === 'ar' ? 'تقرير الطبيب الذكي' : 'AI Doctor Report'}</span>
                </div>
                {aiResult}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {t.benefits.map((benefit, idx) => (
            <div key={idx} className={`p-6 rounded-2xl border flex flex-col gap-4 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'}`}>
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <p className="font-bold text-sm">{benefit}</p>
            </div>
          ))}
        </div>

        {/* Steps Section */}
        <div className={`p-8 rounded-[3rem] border ${theme === 'dark' ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-200 shadow-xl'}`}>
          <h3 className="text-2xl font-black font-arabic mb-8 flex items-center gap-3">
            <Leaf className="w-6 h-6 text-emerald-500" />
            {language === 'ar' ? 'خطوات زراعة الأسطح' : 'Roof Farming Steps'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {t.steps.map((step, idx) => (
              <div key={idx} className={`p-6 rounded-2xl border flex gap-4 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-100'}`}>
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-black text-xl shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="font-black text-lg mb-2">{step.title}</h4>
                  <p className={`text-sm font-bold ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default GreenAgriculture;
