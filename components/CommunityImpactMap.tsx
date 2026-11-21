
import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Globe, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CommunityImpactMap: React.FC = () => {
  const { language, theme } = useApp();
  const isRtl = language === 'ar';

  // Simulated active regions in Egypt
  const regions = [
    { name: 'Cairo', impact: 85, x: '55%', y: '25%' },
    { name: 'Alexandria', impact: 65, x: '45%', y: '15%' },
    { name: 'Giza', impact: 75, x: '53%', y: '28%' },
    { name: 'Suez', impact: 45, x: '62%', y: '26%' },
    { name: 'Luxor', impact: 35, x: '60%', y: '65%' },
    { name: 'Aswan', impact: 30, x: '62%', y: '80%' },
  ];

  return (
    <div className={`p-10 rounded-[4rem] border shadow-2xl relative overflow-hidden transition-all duration-500 ${
      theme === 'dark' ? 'bg-egypt-black border-egypt-gold/20 text-white' : 'bg-white border-egypt-gold/10'
    }`}>
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-egypt-black text-egypt-gold rounded-2xl shadow-lg border border-egypt-gold/20">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black font-arabic">{isRtl ? 'خريطة التأثير المجتمعي' : 'Community Impact Map'}</h3>
            <p className="text-[10px] font-black text-egypt-gold uppercase tracking-widest">{isRtl ? 'توزيع المساهمات الخضراء في مصر' : 'Green contribution distribution in Egypt'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-egypt-gold/10 rounded-full border border-egypt-gold/20">
          <Users className="w-4 h-4 text-egypt-gold" />
          <span className="text-[10px] font-black text-egypt-gold uppercase tracking-widest">12.5k Active</span>
        </div>
      </div>

      <div className="relative aspect-[4/5] md:aspect-video bg-egypt-black/5 rounded-[3rem] border border-egypt-gold/5 overflow-hidden group">
        {/* Simulated Map Background */}
        <div className="absolute inset-0 opacity-20 grayscale group-hover:grayscale-0 transition-all duration-1000" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/pyramid.png")' }} />
        
        {/* Impact Points */}
        {regions.map((region) => (
          <motion.div
            key={region.name}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute"
            style={{ left: region.x, top: region.y }}
          >
            <div className="relative flex items-center justify-center">
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute w-12 h-12 bg-egypt-gold rounded-full blur-xl"
              />
              <div className="relative z-10 p-2 bg-egypt-black border border-egypt-gold/30 rounded-full shadow-2xl group/pin cursor-pointer">
                <MapPin className="w-4 h-4 text-egypt-gold" />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-egypt-gold text-egypt-black text-[8px] font-black rounded-lg opacity-0 group-hover/pin:opacity-100 transition-opacity whitespace-normal sm:whitespace-nowrap break-words uppercase tracking-widest">
                  {region.name}: {region.impact}% Impact
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Legend */}
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-egypt-gold rounded-full" />
              <span className="text-[8px] font-black uppercase text-zinc-500">High Impact</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-egypt-gold/30 rounded-full" />
              <span className="text-[8px] font-black uppercase text-zinc-500">Growing</span>
            </div>
          </div>
          <p className="text-[8px] font-black uppercase text-egypt-gold tracking-widest">Real-time Data 2026</p>
        </div>
      </div>
    </div>
  );
};
