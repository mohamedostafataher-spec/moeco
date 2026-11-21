
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Flag, CheckCircle2, Circle, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Goal {
  id: string;
  title: { ar: string, en: string };
  target: number;
  current: number;
  unit: string;
  reward: number;
}

export const EcoGoals: React.FC = () => {
  const { language, theme } = useApp();
  const isRtl = language === 'ar';

  const [goals, setGoals] = useState<Goal[]>([
    { 
      id: '1', 
      title: { ar: 'تقليل استهلاك اللحوم', en: 'Reduce Meat Consumption' }, 
      target: 10, 
      current: 7, 
      unit: 'Meals', 
      reward: 100 
    },
    { 
      id: '2', 
      title: { ar: 'استخدام المواصلات العامة', en: 'Use Public Transport' }, 
      target: 20, 
      current: 12, 
      unit: 'Trips', 
      reward: 200 
    },
    { 
      id: '3', 
      title: { ar: 'توفير المياه', en: 'Save Water' }, 
      target: 500, 
      current: 450, 
      unit: 'Liters', 
      reward: 150 
    },
  ]);

  return (
    <div className={`p-10 rounded-[4rem] border shadow-2xl relative overflow-hidden transition-all duration-500 ${
      theme === 'dark' ? 'bg-egypt-black border-egypt-gold/20 text-white' : 'bg-white border-egypt-gold/10'
    }`}>
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-egypt-gold text-egypt-black rounded-2xl shadow-lg">
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black font-arabic">{isRtl ? 'أهدافي البيئية' : 'Eco Goals'}</h3>
            <p className="text-[10px] font-black text-egypt-gold uppercase tracking-widest">{isRtl ? 'تحديات شخصية لتحسين بصمتك' : 'Personal challenges to improve footprint'}</p>
          </div>
        </div>
        <Trophy className="w-6 h-6 text-egypt-gold opacity-20" />
      </div>

      <div className="space-y-6 relative z-10">
        {goals.map((goal) => {
          const progress = (goal.current / goal.target) * 100;
          return (
            <div key={goal.id} className="p-6 bg-white/5 rounded-[2rem] border border-white/10 hover:border-egypt-gold/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-sm font-black font-arabic mb-1">{isRtl ? goal.title.ar : goal.title.en}</h4>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    {goal.current} / {goal.target} {goal.unit}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-egypt-gold uppercase">+{goal.reward} Coins</span>
                </div>
              </div>
              
              <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-egypt-gold rounded-full"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black text-zinc-500 uppercase">{progress.toFixed(0)}% Complete</span>
                {progress >= 100 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Circle className="w-4 h-4 text-zinc-700" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
