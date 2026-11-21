
import React, { useState, useEffect } from 'react';
import { egyptEnergyService } from '../services/egyptEnergyService';
import { EnergyPriceConfig } from '../types';
import { Settings, Save, RefreshCw, Fuel, Zap, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { notificationService } from '../services/notificationService';

interface EnergyConfigPanelProps {
  language: 'ar' | 'en';
}

export const EnergyConfigPanel: React.FC<EnergyConfigPanelProps> = ({ language }) => {
  const [config, setConfig] = useState<EnergyPriceConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const cfg = await egyptEnergyService.getConfig();
      setConfig(cfg);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      await egyptEnergyService.saveConfig(config);
      notificationService.success(language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully');
    } catch (err) {
      notificationService.error(language === 'ar' ? 'فشل الحفظ' : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (!config) return <div className="p-20 text-center animate-pulse text-zinc-500">Loading Configuration...</div>;

  const updateTier = (type: 'electricity' | 'gas', index: number, field: string, value: number) => {
    const newConfig = { ...config };
    if (type === 'electricity') {
      (newConfig.electricity.tiers[index] as any)[field] = value;
    } else {
      (newConfig.gas.tiers[index] as any)[field] = value;
    }
    setConfig(newConfig);
  };

  const updateFuel = (field: string, value: number) => {
    const newConfig = { ...config };
    (newConfig.fuel as any)[field] = value;
    setConfig(newConfig);
  };

  const t = {
    title: language === 'ar' ? 'نظام مزامنة البيانات الشهرية' : 'Monthly Data Sync System',
    electricity: language === 'ar' ? 'أسعار الكهرباء (الشرائح)' : 'Electricity Prices (Tiers)',
    gas: language === 'ar' ? 'أسعار الغاز' : 'Gas Prices',
    fuel: language === 'ar' ? 'أسعار الوقود' : 'Fuel Prices',
    save: language === 'ar' ? 'حفظ التعديلات' : 'Save Changes',
    lastUpdated: language === 'ar' ? 'آخر تحديث' : 'Last Updated',
    min: language === 'ar' ? 'من' : 'Min',
    max: language === 'ar' ? 'إلى' : 'Max',
    price: language === 'ar' ? 'السعر' : 'Price',
    charge: language === 'ar' ? 'مقابل الخدمة' : 'Service Charge'
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 rounded-2xl">
            <RefreshCw className={`w-6 h-6 text-blue-500 ${isSaving ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{t.title}</h2>
            <p className="text-xs text-white/40">{t.lastUpdated}: {new Date(config.lastUpdated).toLocaleDateString()}</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-500 transition-all disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {t.save}
        </button>
      </div>

      <div className="space-y-8">
        {/* Electricity Tiers */}
        <section>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            {t.electricity}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.electricity.tiers.map((tier, idx) => (
              <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/10 grid grid-cols-2 gap-3">
                <div className="col-span-2 flex justify-between text-[10px] text-white/40 uppercase font-bold mb-1">
                  <span>Tier {idx + 1}</span>
                  <span>{tier.min} - {tier.max} kWh</span>
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 mb-1">{t.price}</label>
                  <input 
                    type="number" 
                    value={tier.price} 
                    onChange={(e) => updateTier('electricity', idx, 'price', Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 mb-1">{t.charge}</label>
                  <input 
                    type="number" 
                    value={tier.serviceCharge} 
                    onChange={(e) => updateTier('electricity', idx, 'serviceCharge', Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Fuel Prices */}
        <section>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-emerald-500" />
            {t.fuel}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {['petrol92', 'petrol95', 'diesel'].map((f) => (
              <div key={f} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <label className="block text-[10px] text-white/40 uppercase font-bold mb-2">{f.replace('petrol', 'Petrol ')}</label>
                <input 
                  type="number" 
                  value={(config.fuel as any)[f]} 
                  onChange={(e) => updateFuel(f, Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Gas Tiers */}
        <section>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            {t.gas}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {config.gas.tiers.map((tier, idx) => (
              <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <label className="block text-[10px] text-white/40 uppercase font-bold mb-2">{tier.min}-{tier.max} m3</label>
                <input 
                  type="number" 
                  value={tier.price} 
                  onChange={(e) => updateTier('gas', idx, 'price', Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
