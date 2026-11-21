
import React, { useState, useEffect } from 'react';
import { egyptEnergyService } from '../services/egyptEnergyService';
import { Zap, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface SmartBillPredictionProps {
  language: 'ar' | 'en';
}

export const SmartBillPrediction: React.FC<SmartBillPredictionProps> = ({ language }) => {
  const [kwh, setKwh] = useState<number>(0);
  const [prediction, setPrediction] = useState<{ cost: number, tier: number } | null>(null);
  const [savings, setSavings] = useState<{ p5: number, p10: number, p15: number }>({ p5: 0, p10: 0, p15: 0 });

  useEffect(() => {
    if (kwh > 0) {
      const pred = egyptEnergyService.calculateElectricityBill(kwh);
      setPrediction(pred);

      const s5 = pred.cost - egyptEnergyService.predictNextBill(kwh, 5).cost;
      const s10 = pred.cost - egyptEnergyService.predictNextBill(kwh, 10).cost;
      const s15 = pred.cost - egyptEnergyService.predictNextBill(kwh, 15).cost;
      setSavings({ p5: s5, p10: s10, p15: s15 });
    } else {
      setPrediction(null);
    }
  }, [kwh]);

  const t = {
    title: language === 'ar' ? 'متوقع الفاتورة الذكي' : 'Smart Bill Predictor',
    inputLabel: language === 'ar' ? 'الاستهلاك المتوقع (كيلووات)' : 'Expected Consumption (kWh)',
    predictedBill: language === 'ar' ? 'الفاتورة المتوقعة' : 'Predicted Bill',
    tier: language === 'ar' ? 'الشريحة' : 'Tier',
    currency: language === 'ar' ? 'ج.م' : 'EGP',
    savingsTitle: language === 'ar' ? 'كم ستوفر إذا قللت استهلاكك؟' : 'How much will you save if you reduce?',
    reduceBy: (p: number) => language === 'ar' ? `تقليل بنسبة ${p}%` : `Reduce by ${p}%`,
    potentialSaving: language === 'ar' ? 'توفير محتمل' : 'Potential Saving'
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-yellow-500/20 rounded-2xl">
          <Zap className="w-6 h-6 text-yellow-500" />
        </div>
        <h2 className="text-xl font-bold text-white">{t.title}</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm text-white/60 mb-2">{t.inputLabel}</label>
          <input
            type="number"
            value={kwh || ''}
            onChange={(e) => setKwh(Number(e.target.value))}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="e.g. 300"
          />
        </div>

        {prediction && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-xs text-white/40 uppercase mb-1">{t.predictedBill}</p>
              <p className="text-2xl font-bold text-white">{prediction.cost.toFixed(2)} <span className="text-sm font-normal text-white/60">{t.currency}</span></p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-xs text-white/40 uppercase mb-1">{t.tier}</p>
              <p className="text-2xl font-bold text-yellow-500">{prediction.tier}</p>
            </div>
          </motion.div>
        )}

        {prediction && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-500" />
              {t.savingsTitle}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[5, 10, 15].map((p) => (
                <div key={p} className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">{t.reduceBy(p)}</p>
                  <p className="text-lg font-bold text-white">
                    {savings[`p${p}` as keyof typeof savings].toFixed(1)}
                  </p>
                  <p className="text-[10px] text-white/40">{t.currency}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!prediction && (
          <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-200/80 leading-relaxed">
              {language === 'ar' 
                ? 'أدخل استهلاكك المتوقع بالكيلووات لمعرفة التكلفة التقديرية والشريحة التي ستقع فيها.'
                : 'Enter your expected consumption in kWh to see the estimated cost and which tier you will fall into.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
