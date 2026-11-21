
import React, { useState } from 'react';
import { egyptEnergyService } from '../services/egyptEnergyService';
import { Lightbulb, ArrowRight, DollarSign, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface SavingRecommendationsProps {
  language: 'ar' | 'en';
}

export const SavingRecommendations: React.FC<SavingRecommendationsProps> = ({ language }) => {
  const [appliances, setAppliances] = useState([
    { name: language === 'ar' ? 'تكييف' : 'Air Conditioner', watts: 1500, hoursPerDay: 8 },
    { name: language === 'ar' ? 'سخان مياه' : 'Water Heater', watts: 2000, hoursPerDay: 3 },
    { name: language === 'ar' ? 'ثلاجة' : 'Refrigerator', watts: 200, hoursPerDay: 24 },
    { name: language === 'ar' ? 'غسالة' : 'Washing Machine', watts: 500, hoursPerDay: 1 },
  ]);

  const recommendations = egyptEnergyService.getSavingRecommendations(appliances);

  const t = {
    title: language === 'ar' ? 'محرك توصيات التوفير' : 'Saving Recommendation Engine',
    subtitle: language === 'ar' ? 'كيف توفر في فاتورتك الشهرية؟' : 'How to save on your monthly bill?',
    monthly: language === 'ar' ? 'شهرياً' : 'Monthly',
    yearly: language === 'ar' ? 'سنوياً' : 'Yearly',
    currency: language === 'ar' ? 'ج.م' : 'EGP',
    hours: language === 'ar' ? 'ساعة' : 'hrs'
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-emerald-500/20 rounded-2xl">
          <Lightbulb className="w-6 h-6 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-white">{t.title}</h2>
      </div>
      <p className="text-white/40 text-sm mb-6">{t.subtitle}</p>

      <div className="space-y-4">
        {recommendations.map((rec, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition-all group"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-white font-bold flex items-center gap-2">
                  {rec.appliance}
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-emerald-500 transition-colors" />
                </h3>
                <p className="text-xs text-white/60 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" /> {rec.suggestion}
                </p>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 font-bold text-lg">+{rec.monthlySavingEGP.toFixed(0)} <span className="text-[10px]">{t.currency}</span></p>
                <p className="text-[10px] text-white/40 uppercase">{t.monthly}</p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-white/5 flex justify-between items-center">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{t.yearly}</span>
              <span className="text-white/80 font-mono font-bold">+{rec.yearlySavingEGP.toFixed(0)} {t.currency}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
