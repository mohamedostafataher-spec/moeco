import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Accessibility, 
  Type, 
  Contrast, 
  Activity, 
  Volume2, 
  Settings, 
  X,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Target,
  HandHelping,
  LogOut,
  LayoutGrid
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const FloatingAccessibilityButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    fontSize, 
    highContrast, 
    reduceMotion, 
    ttsEnabled, 
    simplifiedMode,
    updateSettings,
    speak 
  } = useAccessibility();
  const { logout, language } = useApp();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      speak('قائمة الوصول السريع');
    }
  };

  const handleFontSize = (delta: number) => {
    const sizes: ('small' | 'medium' | 'large' | 'extra-large')[] = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(fontSize as any);
    const nextIndex = Math.min(Math.max(currentIndex + delta, 0), sizes.length - 1);
    const newSize = sizes[nextIndex];
    updateSettings({ fontSize: newSize });
    speak(`حجم الخط ${newSize}`);
  };

  const menuItems = [
    {
      icon: highContrast ? EyeOff : Eye,
      label: highContrast ? 'إيقاف التباين العالي' : 'تشغيل التباين العالي',
      onClick: () => {
        updateSettings({ highContrast: !highContrast });
        speak(highContrast ? 'تم إيقاف التباين العالي' : 'تم تشغيل التباين العالي');
      },
      active: highContrast
    },
    {
      icon: Target,
      label: 'وضع التركيز',
      onClick: () => {
        const newVal = !useAccessibility().focusMode;
        updateSettings({ focusMode: newVal });
        speak(newVal ? 'تم تشغيل وضع التركيز' : 'تم إيقاف وضع التركيز');
      },
      active: useAccessibility().focusMode
    },
    {
      icon: Activity,
      label: reduceMotion ? 'تشغيل الحركة' : 'تقليل الحركة',
      onClick: () => {
        updateSettings({ reduceMotion: !reduceMotion });
        speak(reduceMotion ? 'تم تشغيل الحركة' : 'تم تقليل الحركة');
      },
      active: reduceMotion
    },
    {
      icon: Volume2,
      label: ttsEnabled ? 'إيقاف قارئ الشاشة' : 'تشغيل قارئ الشاشة',
      onClick: () => {
        updateSettings({ ttsEnabled: !ttsEnabled });
        speak(ttsEnabled ? 'تم إيقاف قارئ الشاشة' : 'تم تشغيل قارئ الشاشة');
      },
      active: ttsEnabled
    },
    {
      icon: Volume2,
      label: 'استمع للمحتوى',
      onClick: () => {
        useAccessibility().readMainContent();
      },
      active: false
    },
    {
      icon: HandHelping,
      label: useAccessibility().signLanguageEnabled ? 'إيقاف لغة الإشارة' : 'تشغيل لغة الإشارة',
      onClick: () => {
        const newVal = !useAccessibility().signLanguageEnabled;
        updateSettings({ signLanguageEnabled: newVal });
        speak(newVal ? 'تم تشغيل مترجم لغة الإشارة' : 'تم إيقاف مترجم لغة الإشارة');
      },
      active: useAccessibility().signLanguageEnabled
    },
    {
      icon: LayoutGrid,
      label: simplifiedMode ? 'إيقاف الوضع المبسط' : 'تشغيل الوضع المبسط',
      onClick: () => {
        updateSettings({ simplifiedMode: !simplifiedMode });
        speak(simplifiedMode ? 'تم إيقاف الوضع المبسط' : 'تم تشغيل الوضع المبسط');
      },
      active: simplifiedMode
    },
    {
      icon: Settings,
      label: 'إعدادات الوصول',
      onClick: () => {
        navigate('/accessibility-settings');
        setIsOpen(false);
        speak('فتح إعدادات الوصول');
      },
      active: false
    }
  ];

  const handleLogout = () => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to logout?')) {
      logout();
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-[9999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 mb-4 flex flex-col gap-3 items-end"
          >
            {/* Font Size Controls */}
            <div className="bg-white dark:bg-zinc-900 p-2 rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 flex gap-2">
              <button 
                onClick={() => handleFontSize(-1)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                aria-label="تصغير الخط"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="flex items-center px-2 min-w-[80px] justify-center font-bold text-[10px] uppercase">
                <Type className="w-4 h-4 mr-1" />
                {fontSize}
              </div>
              <button 
                onClick={() => handleFontSize(1)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                aria-label="تكبير الخط"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Other Menu Items */}
            {menuItems.map((item, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={item.onClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl transition-all w-full justify-between ${
                  item.active 
                    ? 'bg-egypt-gold text-black italic font-black scale-105' 
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-white border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5'
                }`}
                aria-label={item.label}
              >
                <span className="text-[10px] font-bold whitespace-nowrap">{item.label}</span>
                <item.icon className="w-5 h-5 flex-shrink-0" />
              </motion.button>
            ))}

            {/* Logout Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: menuItems.length * 0.05 }}
              onClick={handleLogout}
              className="w-full flex items-center justify-between gap-3 px-4 py-4 rounded-3xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-black text-[10px] uppercase tracking-widest border border-rose-200 dark:border-rose-900 shadow-xl hover:bg-rose-500 hover:text-white transition-all"
            >
              <span>تسجيل الخروج</span>
              <LogOut className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleMenu}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-colors ${
          isOpen ? 'bg-egypt-black text-white' : 'bg-egypt-gold text-black'
        }`}
        aria-label="قائمة الوصول"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Accessibility className="w-6 h-6" />}
      </motion.button>
    </div>
  );
};
