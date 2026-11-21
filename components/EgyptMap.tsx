
import React, { useState } from 'react';
import { motion } from 'motion/react';

interface EgyptMapProps {
  data: { governorate: string; stressLevel: number; avgBill: number; userCount: number }[];
  language: 'ar' | 'en';
  onRegionClick?: (region: string) => void;
}

const EgyptMap: React.FC<EgyptMapProps> = ({ data, language, onRegionClick }) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Simplified SVG paths for Egypt Governorates (Approximate)
  // In a real app, we'd use a GeoJSON or a more detailed SVG.
  // Simplified representation.
  const regions = [
    { id: 'Cairo', name: { ar: 'القاهرة', en: 'Cairo' }, path: 'M 150 100 L 170 100 L 170 120 L 150 120 Z', x: 155, y: 115 },
    { id: 'Alexandria', name: { ar: 'الإسكندرية', en: 'Alexandria' }, path: 'M 100 50 L 130 50 L 130 70 L 100 70 Z', x: 105, y: 65 },
    { id: 'Giza', name: { ar: 'الجيزة', en: 'Giza' }, path: 'M 130 100 L 150 100 L 150 150 L 130 150 Z', x: 135, y: 130 },
    { id: 'Luxor', name: { ar: 'الأقصر', en: 'Luxor' }, path: 'M 160 250 L 180 250 L 180 270 L 160 270 Z', x: 165, y: 265 },
    { id: 'Aswan', name: { ar: 'أسوان', en: 'Aswan' }, path: 'M 160 300 L 190 300 L 190 330 L 160 330 Z', x: 170, y: 320 },
    { id: 'Red Sea', name: { ar: 'البحر الأحمر', en: 'Red Sea' }, path: 'M 200 150 L 230 150 L 230 300 L 200 300 Z', x: 210, y: 230 },
    { id: 'South Sinai', name: { ar: 'جنوب سيناء', en: 'South Sinai' }, path: 'M 210 80 L 240 80 L 230 130 L 200 110 Z', x: 215, y: 100 },
    { id: 'North Sinai', name: { ar: 'شمال سيناء', en: 'North Sinai' }, path: 'M 210 30 L 250 30 L 250 80 L 210 80 Z', x: 220, y: 60 },
    { id: 'Matrouh', name: { ar: 'مطروح', en: 'Matrouh' }, path: 'M 20 50 L 100 50 L 100 150 L 20 150 Z', x: 50, y: 100 },
    { id: 'New Valley', name: { ar: 'الوادي الجديد', en: 'New Valley' }, path: 'M 20 150 L 130 150 L 130 350 L 20 350 Z', x: 60, y: 250 },
  ];

  const getStressColor = (level: number) => {
    if (level > 80) return '#ef4444'; // Red
    if (level > 50) return '#f59e0b'; // Amber
    return '#10b981'; // Emerald
  };

  const getRegionData = (id: string) => {
    return data.find(d => d.governorate === id) || { stressLevel: 0, avgBill: 0, userCount: 0 };
  };

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] bg-zinc-900/50 rounded-[2rem] border border-white/5 overflow-hidden">
      <svg viewBox="0 0 300 400" className="w-full h-full">
        {regions.map((region) => {
          const regionData = getRegionData(region.id);
          const isHovered = hoveredRegion === region.id;
          
          return (
            <motion.path
              key={region.id}
              d={region.path}
              fill={getStressColor(regionData.stressLevel)}
              fillOpacity={isHovered ? 0.8 : 0.4}
              stroke={isHovered ? '#fff' : 'rgba(255,255,255,0.1)'}
              strokeWidth={isHovered ? 2 : 1}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              onMouseEnter={() => setHoveredRegion(region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => onRegionClick?.(region.id)}
              className="cursor-pointer transition-all"
            />
          );
        })}
        
        {/* Labels */}
        {regions.map((region) => (
          <text
            key={`label-${region.id}`}
            x={region.x}
            y={region.y}
            textAnchor="middle"
            className="text-[6px] font-bold fill-white/40 pointer-events-none uppercase"
          >
            {language === 'ar' ? region.name.ar : region.name.en}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredRegion && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-6 right-6 p-4 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl z-20"
        >
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-black text-white">
                {language === 'ar' ? regions.find(r => r.id === hoveredRegion)?.name.ar : hoveredRegion}
              </h4>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                {language === 'ar' ? 'مستوى الإجهاد' : 'Stress Level'}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-black ${getStressColor(getRegionData(hoveredRegion).stressLevel)}`}>
                {getRegionData(hoveredRegion).stressLevel.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
            <div>
              <p className="text-[8px] font-black text-zinc-500 uppercase">{language === 'ar' ? 'متوسط الفاتورة' : 'Avg Bill'}</p>
              <p className="text-xs font-bold text-white">{getRegionData(hoveredRegion).avgBill.toFixed(0)} EGP</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-zinc-500 uppercase">{language === 'ar' ? 'المستخدمون' : 'Users'}</p>
              <p className="text-xs font-bold text-white">{getRegionData(hoveredRegion).userCount}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="absolute top-6 left-6">
        <h3 className="text-xs font-black text-white uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
          {language === 'ar' ? 'خريطة الإجهاد الطاقي' : 'Energy Stress Map'}
        </h3>
      </div>
    </div>
  );
};

export default EgyptMap;
