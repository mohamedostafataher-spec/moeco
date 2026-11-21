
import React from 'react';
import { motion } from 'motion/react';
import { Leaf, Droplets, Sun, Wind } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DigitalTreeProps {
  score: number; // 0 to 100
}

export const DigitalTree: React.FC<DigitalTreeProps> = ({ score }) => {
  const { language, theme } = useApp();
  const isRtl = language === 'ar';

  // Tree growth stages based on score
  const getStage = () => {
    if (score < 20) return { label: isRtl ? 'بذرة' : 'Seed', size: 'scale-50', color: 'text-amber-600' };
    if (score < 40) return { label: isRtl ? 'برعم' : 'Sprout', size: 'scale-75', color: 'text-emerald-500' };
    if (score < 70) return { label: isRtl ? 'شجيرة' : 'Sapling', size: 'scale-90', color: 'text-emerald-600' };
    return { label: isRtl ? 'شجرة ناضجة' : 'Mature Tree', size: 'scale-110', color: 'text-emerald-700' };
  };

  const stage = getStage();

  return (
    <div className={`p-10 rounded-[4rem] border shadow-2xl relative overflow-hidden transition-all duration-500 ${
      theme === 'dark' ? 'bg-egypt-black border-egypt-gold/20 text-white' : 'bg-white border-egypt-gold/10'
    }`}>
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black font-arabic">{isRtl ? 'شجرتك الرقمية' : 'Your Digital Tree'}</h3>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{isRtl ? 'تنمو مع كل قرار بيئي تتخذه' : 'Grows with every eco-decision you make'}</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{stage.label}</span>
        </div>
      </div>

      <div className="relative h-64 flex items-center justify-center overflow-hidden">
        {/* Background Glow */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl"
        />

        {/* The Tree Visualization */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`relative z-10 transition-transform duration-1000 ${stage.size}`}
        >
          <div className={`relative ${stage.color}`}>
             {/* Simple SVG Tree */}
             <svg width="120" height="160" viewBox="0 0 120 160" fill="currentColor">
                {/* Trunk */}
                <rect x="55" y="100" width="10" height="60" rx="2" fill="#5D4037" />
                {/* Leaves Layers */}
                <motion.path 
                  animate={{ rotate: [-1, 1, -1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  d="M60 10 L100 80 L20 80 Z" 
                />
                <motion.path 
                  animate={{ rotate: [1, -1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  d="M60 30 L110 110 L10 110 Z" 
                />
                {score > 70 && (
                  <motion.circle 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    cx="60" cy="60" r="40" fillOpacity="0.2" 
                  />
                )}
             </svg>
          </div>
        </motion.div>

        {/* Environmental Particles */}
        <div className="absolute inset-0 pointer-events-none">
           {[...Array(6)].map((_, i) => (
             <motion.div
               key={i}
               animate={{ 
                 y: [-20, -100], 
                 x: [Math.random() * 100 - 50, Math.random() * 100 - 50],
                 opacity: [0, 1, 0] 
               }}
               transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: i * 0.5 }}
               className="absolute bottom-10 left-1/2 text-emerald-400/30"
             >
               <Leaf className="w-4 h-4" />
             </motion.div>
           ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4 relative z-10">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
          <Droplets className="w-4 h-4 text-blue-400 mx-auto mb-2" />
          <p className="text-[8px] font-black text-zinc-500 uppercase">Hydration</p>
          <p className="text-xs font-black text-white">{score}%</p>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
          <Sun className="w-4 h-4 text-amber-400 mx-auto mb-2" />
          <p className="text-[8px] font-black text-zinc-500 uppercase">Energy</p>
          <p className="text-xs font-black text-white">{Math.min(100, score + 10)}%</p>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
          <Wind className="w-4 h-4 text-zinc-400 mx-auto mb-2" />
          <p className="text-[8px] font-black text-zinc-500 uppercase">Resilience</p>
          <p className="text-xs font-black text-white">{Math.max(0, score - 5)}%</p>
        </div>
      </div>
    </div>
  );
};
