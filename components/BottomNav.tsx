import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Zap, FileText, Building2, Menu } from 'lucide-react';
import { useApp } from '../context/AppContext';

const BottomNav: React.FC = () => {
  const { language } = useApp();
  const location = useLocation();
  const isAr = language === 'ar';

  const navItems = [
    {
      path: '/',
      label: isAr ? 'الرئيسية' : 'Home',
      icon: Home,
    },
    {
      path: '/my-home',
      label: isAr ? 'ملف بيتي' : 'My Home',
      icon: Zap,
    },
    {
      path: '/my-complaints',
      label: isAr ? 'شكواي' : 'Complaints',
      icon: FileText,
    },
    {
      path: '/local-projects',
      label: isAr ? 'منطقتي' : 'Projects',
      icon: Building2,
    },
    {
      path: '/more',
      label: isAr ? 'المزيد' : 'More',
      icon: Menu,
    },
  ];

  return (
    <nav
      aria-label={isAr ? 'التنقل الرئيسي على الهاتف' : 'Primary mobile navigation'}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1.5 shadow-[0_-2px_10px_rgba(15,23,42,0.05)]"
    >
      <div className="max-w-lg mx-auto grid grid-cols-5 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                isActive
                  ? 'text-emerald-700 bg-emerald-50 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.4 : 1.8} />
              <span className="text-[11px] leading-tight truncate max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
