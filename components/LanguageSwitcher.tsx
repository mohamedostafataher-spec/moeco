
import React from 'react';
import { useApp } from '../context/AppContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useApp();

  return (
    <button
      onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-700/50 text-emerald-800 dark:text-white rounded-lg text-sm font-bold border border-emerald-200 dark:border-emerald-600/50 hover:bg-emerald-200 dark:hover:bg-emerald-600 transition-all active:scale-95 shadow-sm"
      aria-label="Toggle Language"
    >
      <Globe className="w-4 h-4 opacity-70" />
      <span>{language === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
};
