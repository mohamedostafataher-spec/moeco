
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Zap, Leaf, Globe, Users, Trophy, 
  Smartphone, Database, Cpu, BarChart3, Shield, Sword,
  ArrowRight, CheckCircle2, Star, Sparkles, Landmark,
  Scale, FileText, AlertTriangle, MessageSquare,
  TrendingUp, Wallet, Car, Info, ChevronRight, ChevronLeft,
  Target, Award, Heart, Sprout, Footprints, Flame, Droplets,
  Building2, ShieldAlert, Newspaper, HandHelping
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Presentation: React.FC = () => {
  const { language, theme } = useApp();
  const isAr = language === 'ar';
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      id: 'intro',
      title: isAr ? 'مقدمة المشروع' : 'Project Introduction',
      content: (
        <div className="space-y-8 text-center">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 bg-egypt-gold/10 rounded-[3rem] flex items-center justify-center mx-auto mb-8"
          >
            <Landmark className="w-16 h-16 text-egypt-gold" />
          </motion.div>
          <h1 className="text-5xl font-black font-arabic tracking-tighter leading-tight">
            MoEco – Smart Life for Egypt
          </h1>
          <p className="text-2xl text-stone-500 font-bold max-w-3xl mx-auto leading-relaxed">
            {isAr 
              ? 'تطبيق ذكي يجمع بين الخدمات اليومية + الحفاظ على البيئة + التوفير للمواطن.'
              : 'A smart app combining daily services + environmental protection + citizen savings.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
            {[
              { icon: Wallet, label: isAr ? 'توفير مالي' : 'Financial Savings', color: 'text-emerald-500' },
              { icon: Leaf, label: isAr ? 'حماية البيئة' : 'Eco Protection', color: 'text-emerald-600' },
              { icon: Zap, label: isAr ? 'كفاءة الموارد' : 'Resource Efficiency', color: 'text-amber-500' },
            ].map((item, i) => (
              <div key={i} className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-100'}`}>
                <item.icon className={`w-8 h-8 ${item.color} mx-auto mb-3`} />
                <p className="font-black text-sm uppercase tracking-widest">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'demo',
      title: isAr ? 'تجربة التطبيق' : 'App Demo',
      content: (
        <div className="space-y-8">
          <div className="aspect-video bg-stone-900 rounded-[3rem] overflow-hidden relative shadow-2xl border-8 border-stone-800">
            <video 
              className="w-full h-full object-cover opacity-80"
              autoPlay 
              muted 
              loop 
              playsInline
              poster="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000"
            >
              <source src="https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-his-laptop-4330-large.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="text-center space-y-6 p-10">
                <div className="w-20 h-20 bg-egypt-gold rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Smartphone className="w-10 h-10 text-egypt-black" />
                </div>
                <h3 className="text-3xl font-black text-white">
                  {isAr ? 'شاهد التطبيق في الواقع' : 'See the App in Action'}
                </h3>
                <p className="text-white/70 font-bold max-w-md mx-auto">
                  {isAr 
                    ? 'فيديو توضيحي يشرح كيفية استخدام المميزات، تتبع الاستهلاك، وحجز التذاكر.'
                    : 'A demo video explaining how to use features, track consumption, and book tickets.'}
                </p>
                <button className="px-8 py-4 bg-white text-egypt-black rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all">
                  {isAr ? 'تشغيل العرض الكامل' : 'Play Full Demo'}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4">
             <button 
              onClick={() => window.open('https://github.com', '_blank')}
              className="px-8 py-4 bg-egypt-black text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-egypt-gold hover:text-egypt-black transition-all"
            >
              <Smartphone className="w-5 h-5" />
              {isAr ? 'تحميل نسخة الأندرويد (APK)' : 'Download Android (APK)'}
            </button>
            <button 
              onClick={() => window.open('https://apple.com', '_blank')}
              className="px-8 py-4 bg-stone-100 dark:bg-white/5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all"
            >
              <Smartphone className="w-5 h-5" />
              {isAr ? 'تحميل من App Store' : 'Download on App Store'}
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'backend',
      title: isAr ? 'البنية التحتية (Backend)' : 'Backend Infrastructure',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className={`p-10 rounded-[4rem] border space-y-6 ${theme === 'dark' ? 'bg-zinc-900 border-white/5' : 'bg-white border-stone-100 shadow-xl'}`}>
            <Database className="w-12 h-12 text-blue-500" />
            <h3 className="text-2xl font-black font-arabic">{isAr ? 'نظام الخادم المقترح' : 'Proposed الخادم System'}</h3>
            <p className="text-stone-500 font-bold leading-relaxed">
              {isAr 
                ? 'نظام سحابي متكامل يعتمد على PostgreSQL، قادر على استيعاب ملايين المستخدمين. يوفر قاعدة بيانات حقيقية، نظام توثيق (Auth)، وتخزين ملفات.'
                : 'A cloud-native system based on PostgreSQL, capable of handling millions of users. Provides real-time DB, Auth, and Storage.'}
            </p>
            <ul className="space-y-3 text-sm font-black text-emerald-500">
              <li>✓ {isAr ? 'مستوى مجاني سخي (بدون تكاليف مستقبلية)' : 'Generous Free Tier (No future costs)'}</li>
              <li>✓ {isAr ? 'توسع تلقائي مع زيادة الضغط' : 'Auto-scaling for High Traffic'}</li>
              <li>✓ {isAr ? 'أمان عالي وتشفير بيانات' : 'High Security & Encryption'}</li>
              <li>✓ {isAr ? 'حلول مفتوحة المصدر بالكامل' : 'Fully Open Source Solutions'}</li>
            </ul>
          </div>
          <div className={`p-10 rounded-[4rem] border space-y-6 ${theme === 'dark' ? 'bg-zinc-900 border-white/5' : 'bg-white border-stone-100 shadow-xl'}`}>
            <Cpu className="w-12 h-12 text-egypt-gold" />
            <h3 className="text-2xl font-black font-arabic">{isAr ? 'لماذا هذا الاختيار؟' : 'Why This Choice?'}</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-white/5 flex items-center justify-center font-black">1</div>
                <p className="text-xs font-bold text-stone-500">{isAr ? 'يدعم الملايين من العمليات في الثانية' : 'Supports millions of operations per second'}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-white/5 flex items-center justify-center font-black">2</div>
                <p className="text-xs font-bold text-stone-500">{isAr ? 'تكلفة مرنة (ادفع فقط مقابل ما تستخدمه)' : 'Flexible cost (Pay only for what you use)'}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-white/5 flex items-center justify-center font-black">3</div>
                <p className="text-xs font-bold text-stone-500">{isAr ? 'سهولة الربط مع تطبيقات الموبايل والويب' : 'Easy integration with Mobile & Web'}</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'problem',
      title: isAr ? 'المشكلة والحل' : 'Problem & Solution',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black font-arabic text-red-500 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8" />
              {isAr ? 'المشكلة اللي بنحلها' : 'The Problem'}
            </h2>
            <ul className="space-y-4">
              {[
                isAr ? 'المواطن مش عارف استهلاكه كام بالظبط' : 'Citizens don\'t know their exact consumption',
                isAr ? 'الفاتورة بتيجي فجأة وبمبالغ كبيرة' : 'Bills come as a surprise with high amounts',
                isAr ? 'مفيش وعي بيئي كفاية أو تحفيز للتوفير' : 'Lack of environmental awareness or saving incentives',
                isAr ? 'الخدمات الحكومية متفرقة وصعبة الوصول' : 'Scattered and hard-to-access gov services',
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-stone-500 font-bold">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-black font-arabic text-emerald-500 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8" />
              {isAr ? 'الحل اللي بنقدمه' : 'The Solution'}
            </h2>
            <ul className="space-y-4">
              {[
                isAr ? 'حساب استهلاك الكهرباء والمياه والغاز بدقة' : 'Accurate tracking of Electricity, Water, and Gas',
                isAr ? 'توقع الفاتورة قبل ما تيجي بناءً على الاستهلاك' : 'Bill prediction based on current consumption',
                isAr ? 'نظام نقل ذكي يجمع كل الوسائل في مكان واحد' : 'Integrated smart transport system',
                isAr ? 'نظام مكافآت ونقاط لتحفيز السلوك الأخضر' : 'Rewards and points for green behavior',
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-stone-500 font-bold">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'features',
      title: isAr ? 'أهم المميزات' : 'Key Features',
      content: (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Wallet, title: isAr ? 'مدير المصاريف' : 'Expense Manager', desc: isAr ? 'تتبع العدادات وتوقع الفواتير' : 'Track meters & predict bills' },
            { icon: Target, title: isAr ? 'تحديات يومية' : 'Daily Missions', desc: isAr ? 'مهام بسيطة لنقاط حقيقية' : 'Simple tasks for real points' },
            { icon: Trophy, title: isAr ? 'نظام المكافآت' : 'Rewards System', desc: isAr ? 'شارات وشهادات تقدير' : 'Badges & certificates' },
            { icon: Car, title: isAr ? 'النقل الذكي' : 'Smart Transport', desc: isAr ? 'حجز تذاكر ومعرفة مسارات' : 'Tickets & route planning' },
            { icon: Building2, title: isAr ? 'خدمات حكومية' : 'Gov Services', desc: isAr ? 'دفع فواتير وحجز مواعيد' : 'Bill payments & appointments' },
            { icon: ShieldAlert, title: isAr ? 'إنذار مبكر' : 'Early Warning', desc: isAr ? 'تنبيهات تلوث وكوارث' : 'Pollution & disaster alerts' },
            { icon: Globe, title: isAr ? 'خريطة تفاعلية' : 'Interactive Map', desc: isAr ? 'رصد الاستهلاك والإنذارات' : 'Monitor usage & alerts' },
            { icon: Cpu, title: isAr ? 'توثيق ذكي' : 'Smart Doc', desc: isAr ? 'تصوير العداد وحسابه تلقائياً' : 'Photo meter & auto-calc' },
          ].map((f, i) => (
            <div key={i} className={`p-6 rounded-3xl border text-center space-y-3 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-stone-100 shadow-lg'}`}>
              <f.icon className="w-8 h-8 text-egypt-gold mx-auto" />
              <h4 className="font-black text-xs uppercase tracking-tighter">{f.title}</h4>
              <p className="text-[10px] text-stone-500 font-bold">{f.desc}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'innovation',
      title: isAr ? 'الميزة المبتكرة' : 'Innovative Feature',
      content: (
        <div className="space-y-10 text-center">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
            <Sword className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-4xl font-black font-arabic">
            {isAr ? 'حرب المحافظات (The Governorates War)' : 'The Governorates War'}
          </h2>
          <p className="text-xl text-stone-500 font-bold max-w-2xl mx-auto leading-relaxed">
            {isAr 
              ? 'أكبر نظام منافسة بيئي في مصر يهدف لتحفيز المواطنين من خلال روح المنافسة بين المحافظات. مين هيوفر أكتر؟ مين هيقلل استهلاك أكتر؟ المنافسة بتخلي المستخدم يرجع للتطبيق كل يوم ويحس إنه جزء من تغيير حقيقي.'
              : 'Egypt\'s largest environmental competition system aiming to motivate citizens through inter-governorate rivalry. Who saves more? Who reduces consumption more? Competition keeps users coming back daily.'}
          </p>
          <div className="flex justify-center gap-4">
            <div className="px-6 py-3 bg-egypt-gold text-egypt-black rounded-2xl font-black text-xs uppercase tracking-widest">
              {isAr ? 'القاهرة vs الإسكندرية' : 'Cairo vs Alexandria'}
            </div>
            <div className="px-6 py-3 bg-stone-100 dark:bg-white/5 rounded-2xl font-black text-xs uppercase tracking-widest">
              {isAr ? 'المنصورة تتصدر!' : 'Mansoura Leads!'}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'comparison',
      title: isAr ? 'لماذا نحن مختلفون؟' : 'Why We Are Different?',
      content: (
        <div className="space-y-8">
          <div className={`rounded-[3rem] border overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-egypt-black border-white/5' : 'bg-white border-stone-100'}`}>
            <table className="w-full text-right border-collapse" dir={isAr ? 'rtl' : 'ltr'}>
              <thead>
                <tr className="bg-stone-50 dark:bg-white/5">
                  <th className="p-6 font-black uppercase text-xs tracking-widest text-right">{isAr ? 'الميزة' : 'Feature'}</th>
                  <th className="p-6 font-black uppercase text-xs tracking-widest text-center text-egypt-gold">MoEco</th>
                  <th className="p-6 font-black uppercase text-xs tracking-widest text-center text-stone-400">Rabbit Mobility</th>
                  <th className="p-6 font-black uppercase text-xs tracking-widest text-center text-stone-400">{isAr ? 'تطبيقات الدفع' : 'Payment Apps'}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { f: isAr ? 'تتبع استهلاك المرافق' : 'Utility Tracking', mo: true, r: false, p: false },
                  { f: isAr ? 'توقع الفواتير' : 'Bill Prediction', mo: true, r: false, p: false },
                  { f: isAr ? 'النقل الذكي المتكامل' : 'Integrated Transport', mo: true, r: true, p: false },
                  { f: isAr ? 'الخدمات الحكومية' : 'Gov Services', mo: true, r: false, p: true },
                  { f: isAr ? 'نظام المكافآت والتحفيز' : 'Gamification & Rewards', mo: true, r: false, p: false },
                  { f: isAr ? 'إنذار مبكر بيئي' : 'Early Warning', mo: true, r: false, p: false },
                  { f: isAr ? 'مجاني بالكامل' : '100% Free', mo: true, r: false, p: true },
                ].map((row, i) => (
                  <tr key={i} className="border-t border-stone-100 dark:border-white/5">
                    <td className="p-6 font-bold text-sm">{row.f}</td>
                    <td className="p-6 text-center"><CheckCircle2 className="inline w-6 h-6 text-emerald-500" /></td>
                    <td className="p-6 text-center">{row.r ? <CheckCircle2 className="inline w-6 h-6 text-stone-400" /> : <ShieldAlert className="inline w-6 h-6 text-stone-200" />}</td>
                    <td className="p-6 text-center">{row.p ? <CheckCircle2 className="inline w-6 h-6 text-stone-400" /> : <ShieldAlert className="inline w-6 h-6 text-stone-200" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-stone-500 font-bold italic">
            {isAr 
              ? 'نحن التطبيق الوحيد الذي يجمع "التوفير" مع "الخدمات" مع "المتعة" في منصة واحدة.' 
              : 'We are the only app that combines "Saving" with "Services" and "Fun" in one platform.'}
          </p>
        </div>
      )
    },
    {
      id: 'future',
      title: isAr ? 'المستقبل والنمو' : 'Future & Growth',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className={`p-10 rounded-[4rem] border space-y-6 ${theme === 'dark' ? 'bg-zinc-900 border-white/5' : 'bg-white border-stone-100 shadow-xl'}`}>
            <TrendingUp className="w-12 h-12 text-blue-500" />
            <h3 className="text-2xl font-black font-arabic">{isAr ? 'خطة التوسع' : 'Expansion Plan'}</h3>
            <ul className="space-y-4 text-stone-500 font-bold">
              <li>• {isAr ? 'الانتشار في جميع محافظات الجمهورية' : 'Spreading across all governorates'}</li>
              <li>• {isAr ? 'الربط المباشر مع شركات الخدمات' : 'Direct integration with utility companies'}</li>
              <li>• {isAr ? 'تحويل النقاط لمكافآت حقيقية (كوبونات خصم)' : 'Converting points to real rewards (coupons)'}</li>
            </ul>
          </div>
          <div className={`p-10 rounded-[4rem] border space-y-6 ${theme === 'dark' ? 'bg-zinc-900 border-white/5' : 'bg-white border-stone-100 shadow-xl'}`}>
            <HandHelping className="w-12 h-12 text-egypt-gold" />
            <h3 className="text-2xl font-black font-arabic">{isAr ? 'الدعم والشراكات' : 'Support & Partnerships'}</h3>
            <ul className="space-y-4 text-stone-500 font-bold">
              <li>• {isAr ? 'دعم من وزارة الكهرباء والطاقة' : 'Support from Ministry of Electricity'}</li>
              <li>• {isAr ? 'شراكة مع الشركة القابضة للمياه' : 'Partnership with Water Holding Co.'}</li>
              <li>• {isAr ? 'التكامل مع منصة مصر الرقمية' : 'Integration with Digital Egypt'}</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => setActiveSlide(prev => (prev + 1) % slides.length);
  const prevSlide = () => setActiveSlide(prev => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="max-w-6xl mx-auto pb-32 pt-10 px-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Progress Bar */}
      <div className="flex gap-2 mb-10">
        {slides.map((_, i) => (
          <div 
            key={i} 
            className={`h-2 flex-1 rounded-full transition-all duration-500 ${i <= activeSlide ? 'bg-egypt-gold' : 'bg-stone-200 dark:bg-white/10'}`}
          />
        ))}
      </div>

      {/* Slide Container */}
      <div className="min-h-[60vh] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, x: isAr ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isAr ? -50 : 50 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <div className="mb-12">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-egypt-gold mb-2 block">
                Slide {activeSlide + 1} / {slides.length}
              </span>
              <h1 className="text-4xl font-black font-arabic">{slides[activeSlide].title}</h1>
            </div>
            
            {slides[activeSlide].content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="fixed bottom-10 left-0 right-0 z-50 px-6 pointer-events-none">
        <div className="max-w-6xl mx-auto flex justify-between items-center pointer-events-auto">
          <button 
            onClick={prevSlide}
            className="w-16 h-16 bg-egypt-black text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-egypt-gold hover:text-egypt-black transition-all active:scale-90"
          >
            {isAr ? <ChevronRight className="w-8 h-8" /> : <ChevronLeft className="w-8 h-8" />}
          </button>
          
          <div className="bg-egypt-black/80 backdrop-blur-xl px-8 py-4 rounded-full border border-white/10 text-white font-black text-xs uppercase tracking-widest hidden md:block">
            {slides[activeSlide].id.toUpperCase()}
          </div>

          <button 
            onClick={nextSlide}
            className="w-16 h-16 bg-egypt-gold text-egypt-black rounded-full flex items-center justify-center shadow-2xl hover:bg-egypt-black hover:text-white transition-all active:scale-90"
          >
            {isAr ? <ChevronLeft className="w-8 h-8" /> : <ChevronRight className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {/* Summary Section (Visible on last slide or as a footer) */}
      {activeSlide === slides.length - 1 && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-20 p-16 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-[5rem] text-white text-center space-y-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <h2 className="text-5xl font-black font-arabic relative z-10">{isAr ? 'الخلاصة' : 'Conclusion'}</h2>
          <p className="text-2xl font-bold opacity-90 max-w-3xl mx-auto relative z-10 leading-relaxed">
            {isAr 
              ? 'مو إيكو ليس مجرد تطبيق، بل هو نظام حياة ذكي للمواطن المصري يساعده على توفير المال، العيش بشكل أفضل، والحفاظ على بيئة وطنه.'
              : 'MoEco is not just an app, it is a smart lifestyle for the Egyptian citizen that helps save money, live better, and preserve the environment.'}
          </p>
          <div className="flex justify-center gap-6 pt-6 relative z-10">
            <button 
              onClick={() => window.open('https://github.com', '_blank')}
              className="px-10 py-5 bg-white text-emerald-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-110 transition-all shadow-2xl"
            >
              {isAr ? 'تحميل التطبيق' : 'Download App'}
            </button>
            <button className="px-10 py-5 bg-egypt-gold text-egypt-black rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-110 transition-all shadow-2xl">
              {isAr ? 'تواصل معنا' : 'Contact Us'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Presentation;
