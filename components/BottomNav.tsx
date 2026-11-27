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
      className="bottom-dock lg:hidden"
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
              className={`min-h-[52px] flex flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                isActive
                  ? 'dock-active font-bold'
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
