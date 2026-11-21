import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Thermometer, Wind, Droplets, Zap, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const HUDOverlay: React.FC = () => {
  const { language } = useApp();
  const [data, setData] = useState({
    aqi: 45,
    temp: 24,
    humidity: 35,
    energy: 1200,
  });

  useEffect(() => {
    // Simulate live updates
    const interval = setInterval(() => {
      setData(prev => ({
        aqi: Math.min(100, Math.max(0, prev.aqi + (Math.random() * 4 - 2))),
        temp: prev.temp + (Math.random() * 0.4 - 0.2),
        humidity: prev.humidity + (Math.random() * 2 - 1),
        energy: prev.energy + (Math.random() * 50 - 25),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex flex-col justify-between p-4 overflow-hidden">
      {/* Top HUD Line */}
      <div className="w-full flex justify-between items-start opacity-70">
        <div className="flex gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center gap-1 bg-slate-900/50 backdrop-blur-xl border border-emerald-500/30 p-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <Wind className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-400 font-bold">{data.aqi.toFixed(0)} AQI</span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-1 bg-slate-900/50 backdrop-blur-xl border border-sky-500/30 p-2 rounded-xl shadow-[0_0_15px_rgba(14,165,233,0.2)]"
          >
            <Thermometer className="w-4 h-4 text-sky-400" />
            <span className="text-[10px] font-mono text-sky-400 font-bold">{data.temp.toFixed(1)}°C</span>
          </motion.div>
        </div>
        
        <div className="flex gap-4">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-1 bg-slate-900/50 backdrop-blur-xl border border-amber-500/30 p-2 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-mono text-amber-400 font-bold">{data.energy.toFixed(0)}kW</span>
          </motion.div>
        </div>
      </div>

      {/* Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none" />

      {/* Decorative Target Reticle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-md max-h-md border-[0.5px] border-emerald-500/10 rounded-full border-dashed pointer-events-none opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-sm max-h-sm border-[0.5px] border-emerald-500/5 rounded-full pointer-events-none opacity-30" />
    </div>
  );
};
