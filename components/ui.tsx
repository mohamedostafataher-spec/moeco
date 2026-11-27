import React from 'react';
import { useLocation } from 'react-router-dom';


/** Fades and lifts each screen in when the route changes. */
export const RouteTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
};


/** Self-drawn lotus mark used in heroes and empty states. */
export const LotusMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="lm-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffe9a0" />
        <stop offset=".55" stopColor="#e8b84a" />
        <stop offset="1" stopColor="#b98524" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="82" r="48" fill="#f6d777" opacity=".22" />
    <path d="M100 34C120 54 122 84 100 118C78 84 80 54 100 34Z" fill="url(#lm-g)" />
    <path d="M70 58C88 68 98 90 100 118C74 114 60 90 70 58Z" fill="url(#lm-g)" opacity=".9" />
    <path d="M130 58C112 68 102 90 100 118C126 114 140 90 130 58Z" fill="url(#lm-g)" opacity=".9" />
    <path d="M44 84C66 88 88 104 100 118C76 124 52 110 44 84Z" fill="url(#lm-g)" opacity=".8" />
    <path d="M156 84C134 88 112 104 100 118C124 124 148 110 156 84Z" fill="url(#lm-g)" opacity=".8" />
    <g fill="none" stroke="#7fe0c0" strokeWidth="5" strokeLinecap="round">
      <path d="M52 140Q64 132 76 140T100 140T124 140T148 140" />
      <path d="M64 156Q74 150 84 156T104 156T124 156" opacity=".6" />
    </g>
  </svg>
);


/** Nile-wave + papyrus pattern for hero backgrounds. */
const HeroPattern: React.FC = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[.16]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 200" aria-hidden="true">
    <g fill="none" stroke="#fff" strokeWidth="2">
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M-10 ${120 + i * 18} Q 40 ${100 + i * 18} 90 ${120 + i * 18} T 190 ${120 + i * 18} T 290 ${120 + i * 18} T 410 ${120 + i * 18}`} />
      ))}
    </g>
    <circle cx="330" cy="50" r="34" fill="#f6d777" opacity=".7" />
  </svg>
);


export const PageHero: React.FC<{
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ eyebrow, title, subtitle, icon, children }) => (
  <section className="hero-card relative overflow-hidden rounded-[28px] text-white p-5 pb-6">
    <HeroPattern />
    <LotusMark className="absolute -bottom-6 -left-4 w-36 h-36 opacity-30" />
    <div className="relative z-10 space-y-2">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center" style={{ color: '#fff' }}>
            {icon}
          </div>
        )}
        {eyebrow && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/15" style={{ color: '#fff' }}>
            {eyebrow}
          </span>
        )}
      </div>
      <h1 className="text-[26px] leading-tight font-extrabold" style={{ color: '#fff' }}>{title}</h1>
      {subtitle && (
        <p className="text-sm leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,.85)' }}>{subtitle}</p>
      )}
      {children}
    </div>
  </section>
);


export const EmptyState: React.FC<{
  title: string;
  text?: string;
  action?: React.ReactNode;
}> = ({ title, text, action }) => (
  <div className="rounded-[28px] bg-white border border-emerald-100 p-8 text-center space-y-3 shadow-[0_8px_30px_rgba(6,78,59,.06)]">
    <div className="mx-auto w-28 h-28 rounded-full bg-gradient-to-b from-emerald-50 to-emerald-100 flex items-center justify-center float-soft">
      <LotusMark className="w-20 h-20" />
    </div>
    <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
    {text && <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{text}</p>}
    {action}
  </div>
);
