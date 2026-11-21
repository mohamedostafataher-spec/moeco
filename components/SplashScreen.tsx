import React, { useEffect, useState } from 'react';
import { Sprout } from 'lucide-react';
import { useApp } from '../context/AppContext';

const SplashScreen: React.FC<{ onSkip: () => void }> = ({ onSkip }) => {
  const { language } = useApp();
  const isRtl = language === 'ar';
  const [progress, setProgress] = useState(30);

  useEffect(() => {
    const t1 = setTimeout(() => setProgress(75), 180);
    const t2 = setTimeout(() => {
      setProgress(100);
      onSkip();
    }, 550);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onSkip]);

  return (
    <div
      className="fixed inset-0 z-[5000] flex flex-col items-center justify-center bg-slate-50 px-6 text-center"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-xs w-full space-y-6">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-700 flex items-center justify-center shadow-sm">
          <Sprout className="w-10 h-10 text-white" />
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">MoEco</h1>
          <p className="text-sm font-medium text-slate-600">
            {isRtl
              ? 'مساحتك الشخصية لمتابعة الاستهلاك والشكاوى'
              : 'Your personal utility & civic organizer'}
          </p>
        </div>

        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-700 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 underline"
        >
          {isRtl ? 'متابعة مباشرة' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;
