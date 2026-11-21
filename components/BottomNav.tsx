
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calculator, Map, FileText, User, LayoutGrid, Landmark, Train, Bell, Newspaper, Wallet, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';

import { useAccessibility } from '../context/AccessibilityContext';

const BottomNav: React.FC = () => {
  const { t, theme, language } = useApp();
  const { simplifiedMode, speak } = useAccessibility();
  const location = useLocation();
  const isRtl = language === 'ar';

  const navItems = [
    { path: '/', label: language === 'ar' ? 'الرئيسية' : 'Home', icon: Home },
    { path: '/transport-hub', label: language === 'ar' ? 'النقل' : 'Transport', icon: Train },
    { path: '/calculator', label: language === 'ar' ? 'الحاسبة' : 'Calc', icon: Calculator, isSpecial: true },
    { path: '/emergency', label: language === 'ar' ? 'الإنذارات' : 'Alerts', icon: Bell },
    { path: '/profile', label: language === 'ar' ? 'حسابي' : 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 md:bottom-6 left-0 md:left-6 right-0 md:right-6 z-[100] h-18 md:h-24 bg-slate-900/40 backdrop-blur-3xl rounded-t-[2.5rem] md:rounded-[3rem] border-t md:border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex items-center justify-around px-2 md:px-6 overflow-visible">
      {/* Decorative Neon Backlight */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none rounded-[inherit]" />
      <div className="egyptian-pattern absolute inset-0 opacity-20 pointer-events-none" />
      
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || (item.path === '/transport-hub' && location.pathname.includes('transport'));
        
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => speak(item.label)}
            className={`relative flex flex-col items-center justify-center ${item.isSpecial ? '-mt-10 md:-mt-14' : 'w-16'} h-full group z-10 transition-all duration-300 md:w-24`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.isSpecial ? (
              <div className={`p-4 md:p-5 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all duration-500 border border-white/20 relative overflow-hidden backdrop-blur-xl ${
                isActive 
                  ? 'bg-emerald-500 text-slate-950 scale-105 md:scale-110 shadow-[0_0_50px_rgba(16,185,129,0.6)]' 
                  : 'bg-slate-900/80 text-emerald-400 hover:scale-110 hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]'
              }`}>
                {/* Special Button Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/20 to-transparent pointer-events-none" />
                <Icon className="w-7 h-7 relative z-10" strokeWidth={2.5} />
              </div>
            ) : (
              <>
                <motion.div 
                  whileHover={{ y: -5 }}
                  className={`p-2.5 md:p-3.5 rounded-2xl transition-all duration-500 relative ${isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 group-hover:text-slate-300'}`}
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                {!simplifiedMode && (
                  <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest text-center transition-all mt-1 md:mt-1.5 ${
                    isActive ? 'text-emerald-400 opacity-100 shadow-neon' : 'text-slate-500 opacity-50'
                  }`}>
                    {item.label}
                  </span>
                )}
                {isActive && !item.isSpecial && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute -bottom-2 md:bottom-2 w-8 h-1 bg-emerald-500 rounded-full shadow-[0_0_15px_#10B981] blur-[1px]"
                  />
                )}
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNav;
