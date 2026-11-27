import React, { useState } from 'react';
import {
  Zap,
  FileText,
  Building2,
  Sprout,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Car,
  BusFront,
  Bike,
  Footprints,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { storageService } from '../services/storageService';


interface OnboardingProps {
  onComplete: () => void;
}


type OnboardingStep = 'intro' | 'routine' | 'ready';


export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<OnboardingStep>('intro');
  const [transport, setTransport] = useState('public');
  const { language } = useApp();
  const isRtl = language === 'ar';
  const ForwardIcon = isRtl ? ArrowLeft : ArrowRight;


  const finishOnboarding = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await storageService.saveOnboardingProgress(user.id, {
          completed: true,
          preferences: { transport },
          completed_at: new Date().toISOString(),
        });
      }
      localStorage.setItem('moeco_onboarding', 'true');
      localStorage.setItem('moeco_preferences', JSON.stringify({ transport }));
    } catch (e) {
      console.error('Error saving onboarding preferences:', e);
    }
    onComplete();
  };


  const skipImmediately = () => {
    localStorage.setItem('moeco_onboarding', 'true');
    onComplete();
  };


  return (
    <div
      className="fixed inset-0 z-[4000] flex flex-col bg-slate-50 text-slate-900 overflow-y-auto"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Top Bar */}
      <header className="w-full max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg text-slate-900">MoEco</span>
        </div>


        <button
          type="button"
          onClick={skipImmediately}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
        >
          {isRtl ? 'تخطي والدخول للتطبيق' : 'Skip'}
        </button>
      </header>


      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-xs">
          {step === 'intro' && (
            <>
              <div className="space-y-2">
                <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                  {isRtl ? 'نظرة سريعة' : 'Quick Overview'}
                </span>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {isRtl
                    ? 'مرحبًا بك في MoEco'
                    : 'Welcome to MoEco'}
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {isRtl
                    ? 'تطبيق بسيط يساعدك على متابعة استهلاك منزلك وتنظيم شكاواك ومعرفة أثر يومك بدون تعقيد.'
                    : 'A calm space to log your household utilities, organize complaints, and calculate footprint.'}
                </p>
              </div>


              <div className="space-y-3">
                {[
                  {
                    icon: Zap,
                    title: isRtl ? 'ملف بيتي للكهرباء والمياه' : 'My Home Utilities',
                    desc: isRtl
                      ? 'سجّل قراءاتك أو فواتيرك بنفسك واحفظها في الخادم بموافقتك مع تصديرها وقتما تشاء.'
                      : 'Record your own meter readings and bills privately on your account with your consent.',
                  },
                  {
                    icon: FileText,
                    title: isRtl ? 'شكواي ما تضيعش' : 'Complaint Organizer',
                    desc: isRtl
                      ? 'جهّز مسودة شكواك وانتقل للقنوات الرسمية الموثقة واحفظ رقم المتابعة.'
                      : 'Prepare complaint drafts, access verified channels, and save tracking IDs.',
                  },
                  {
                    icon: Building2,
                    title: isRtl ? 'شفافية كاملة في الأرقام' : 'Transparent Numbers',
                    desc: isRtl
                      ? 'لا يعرض التطبيق أرقامًا أو وعودًا غير موثقة؛ كل رقم يظهر بمصدره ووحدته.'
                      : 'Every number shows whether it is your input, an estimate, or verified.',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-700 shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">{item.title}</h2>
                        <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>


              <button
                type="button"
                onClick={() => setStep('routine')}
                className="w-full min-h-[48px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl px-5 py-3 flex items-center justify-center gap-2 transition-colors"
              >
                <span>{isRtl ? 'التالي' : 'Next'}</span>
                <ForwardIcon className="w-4 h-4" />
              </button>
            </>
          )}


          {step === 'routine' && (
            <>
              <div className="space-y-1.5">
                <h1 className="text-xl font-extrabold text-slate-900">
                  {isRtl ? 'ما وسيلة تنقلك المعتادة؟ (اختياري)' : 'Usual transport mode? (Optional)'}
                </h1>
                <p className="text-sm text-slate-600">
                  {isRtl
                    ? 'يساعدنا ذلك على تهيئة خيارات الحاسبة لك دون افتراض أي استهلاك مسبق.'
                    : 'Helps tailor calculator options without assuming consumption numbers.'}
                </p>
              </div>


              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'public', icon: BusFront, label: isRtl ? 'مواصلات عامة' : 'Public Transit' },
                  { id: 'car', icon: Car, label: isRtl ? 'سيارة خاصة' : 'Private Car' },
                  { id: 'walk', icon: Footprints, label: isRtl ? 'مشيًا' : 'Walking' },
                  { id: 'bike', icon: Bike, label: isRtl ? 'دراجة' : 'Bicycle' },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const selected = transport === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTransport(opt.id)}
                      className={`min-h-[84px] p-4 rounded-xl border text-center flex flex-col items-center justify-center gap-2 transition-colors ${
                        selected
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-800 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs">{opt.label}</span>
                    </button>
                  );
                })}
              </div>


              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('intro')}
                  className="min-h-[48px] px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm"
                >
                  {isRtl ? 'السابق' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('ready')}
                  className="flex-1 min-h-[48px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl px-5 py-3 flex items-center justify-center gap-2 transition-colors"
                >
                  <span>{isRtl ? 'متابعة' : 'Continue'}</span>
                  <ForwardIcon className="w-4 h-4" />
                </button>
              </div>
            </>
          )}


          {step === 'ready' && (
            <>
              <div className="text-center space-y-3 py-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {isRtl ? 'أنت جاهز للبدء' : 'You are ready'}
                </h1>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  {isRtl
                    ? 'لم تُنشأ أي أرقام افتراضية لحسابك. يمكنك الآن تسجيل أول قراءة كهرباء أو مياه بنفسك، أو استكشاف الأدوات المتاحة.'
                    : 'No placeholder numbers have been created for your account. Start by logging your first real utility reading or exploring the tools.'}
                </p>
              </div>


              <button
                type="button"
                onClick={finishOnboarding}
                className="w-full min-h-[48px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl px-5 py-3 flex items-center justify-center gap-2 transition-colors"
              >
                <span>{isRtl ? 'ابدأ استخدام MoEco' : 'Start using MoEco'}</span>
                <ForwardIcon className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
