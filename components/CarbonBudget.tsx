
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { useApp } from '../context/AppContext';

export const CarbonBudget: React.FC = () => {
  const { t, language, theme } = useApp();
  const [budget, setBudget] = useState({ yearly: 5000, monthly: 450 });
  const [metrics, setMetrics] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setBudget(storageService.getCarbonBudget());
      const records = await storageService.getRecords();
      setMetrics(storageService.calculateMetrics(records));
    };
    fetch();
  }, []);

  const handleSave = () => {
    storageService.saveCarbonBudget(budget);
    setIsEditing(false);
  };

  if (!metrics) return null;

  const monthlyUsage = metrics.monthly || 0;
  const yearlyUsage = metrics.yearly || 0;
  
  const monthlyPercent = Math.min(100, (monthlyUsage / budget.monthly) * 100);
  const yearlyPercent = Math.min(100, (yearlyUsage / budget.yearly) * 100);

  const isRtl = language === 'ar';

  return (
    <div className={`p-10 rounded-[4rem] border shadow-2xl relative overflow-hidden transition-all duration-500 ${
      theme === 'dark' ? 'bg-egypt-black border-egypt-gold/20 text-white' : 'bg-white border-egypt-gold/10'
    }`}>
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-egypt-gold text-egypt-black rounded-2xl shadow-lg">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black font-arabic">{isRtl ? 'ميزانية الكربون' : 'Carbon Budget'}</h3>
            <p className="text-[10px] font-black text-egypt-gold uppercase tracking-widest">{isRtl ? 'تتبع استهلاكك السنوي والشهري' : 'Track your annual & monthly usage'}</p>
          </div>
        </div>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            isEditing ? 'bg-egypt-red text-white' : 'bg-egypt-gold/10 text-egypt-gold border border-egypt-gold/20'
          }`}
        >
          {isEditing ? (isRtl ? 'حفظ' : 'Save') : (isRtl ? 'تعديل' : 'Edit')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        {/* Monthly Budget */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-xs font-black uppercase text-zinc-500">{isRtl ? 'الميزانية الشهرية' : 'Monthly Budget'}</span>
            <div className="text-right">
              {isEditing ? (
                <input 
                  type="number" 
                  value={budget.monthly} 
                  onChange={(e) => setBudget({...budget, monthly: Number(e.target.value)})}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 w-24 text-right font-black text-egypt-gold"
                />
              ) : (
                <span className="text-lg font-black text-egypt-gold tabular-nums">{budget.monthly} <span className="text-[10px] text-zinc-500">kg</span></span>
              )}
            </div>
          </div>
          <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${monthlyPercent}%` }}
              className={`h-full rounded-full ${monthlyPercent > 90 ? 'bg-egypt-red' : 'bg-egypt-gold'}`}
            />
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase">
            <span className="text-zinc-500">{isRtl ? 'تم استهلاك' : 'Used'}: {monthlyUsage.toFixed(1)} kg</span>
            <span className={monthlyPercent > 90 ? 'text-egypt-red' : 'text-egypt-gold'}>{monthlyPercent.toFixed(0)}%</span>
          </div>
        </div>

        {/* Yearly Budget */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-xs font-black uppercase text-zinc-500">{isRtl ? 'الميزانية السنوية' : 'Yearly Budget'}</span>
            <div className="text-right">
              {isEditing ? (
                <input 
                  type="number" 
                  value={budget.yearly} 
                  onChange={(e) => setBudget({...budget, yearly: Number(e.target.value)})}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 w-24 text-right font-black text-egypt-gold"
                />
              ) : (
                <span className="text-lg font-black text-egypt-gold tabular-nums">{budget.yearly} <span className="text-[10px] text-zinc-500">kg</span></span>
              )}
            </div>
          </div>
          <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${yearlyPercent}%` }}
              className={`h-full rounded-full ${yearlyPercent > 90 ? 'bg-egypt-red' : 'bg-egypt-gold'}`}
            />
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase">
            <span className="text-zinc-500">{isRtl ? 'تم استهلاك' : 'Used'}: {yearlyUsage.toFixed(1)} kg</span>
            <span className={yearlyPercent > 90 ? 'text-egypt-red' : 'text-egypt-gold'}>{yearlyPercent.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {monthlyPercent > 90 && (
        <div className="mt-8 p-4 bg-egypt-red/10 rounded-2xl border border-egypt-red/20 flex items-center gap-4 animate-pulse">
          <AlertCircle className="w-5 h-5 text-egypt-red" />
          <p className="text-[10px] font-bold text-egypt-red uppercase tracking-widest">
            {isRtl ? 'تحذير: لقد اقتربت من تجاوز ميزانيتك الشهرية!' : 'Warning: You are close to exceeding your monthly budget!'}
          </p>
        </div>
      )}

      {monthlyPercent < 50 && monthlyUsage > 0 && (
        <div className="mt-8 p-4 bg-egypt-gold/10 rounded-2xl border border-egypt-gold/20 flex items-center gap-4">
          <CheckCircle2 className="w-5 h-5 text-egypt-gold" />
          <p className="text-[10px] font-bold text-egypt-gold uppercase tracking-widest">
            {isRtl ? 'رائع! أنت تستهلك أقل من نصف ميزانيتك المخططة.' : 'Great! You are consuming less than half of your planned budget.'}
          </p>
        </div>
      )}
    </div>
  );
};
