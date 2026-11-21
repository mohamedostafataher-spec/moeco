import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Calculator, Percent, ShieldAlert, Save, RefreshCw, Layers } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { notificationService } from '../../services/notificationService';

const BillingControl: React.FC<{ isRtl: boolean }> = ({ isRtl }) => {
  const [billingConfig, setBillingConfig] = useState<any>({
    tax_rate: 14,
    service_fee: 5,
    government_subsidy: 10,
    late_fee: 2,
    billing_cycle: 'monthly',
    tiers: [
      { name: 'Social', min: 0, max: 50, discount: 50 },
      { name: 'Standard', min: 51, max: 200, discount: 0 },
      { name: 'High', min: 201, max: 1000, discount: -10 },
    ]
  });
  const [loading, setLoading] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    const { data } = await supabase.from('app_settings').select('*').eq('id', 'billing_engine').single();
    if (data && data.settings_data) {
      setBillingConfig(data.settings_data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
     try {
       const { error } = await supabase.from('app_settings').upsert({
         id: 'billing_engine',
         category: 'finance',
         settings_data: billingConfig,
         label: 'Billing Engine Configuration',
         updated_at: new Date().toISOString()
       });
       if (error) throw error;
       notificationService.success(isRtl ? 'تم تحديث قواعد الفوترة' : 'Billing Engine Rules Synchronized');
     } catch (e) {
       notificationService.error('Update failed');
     }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-center bg-zinc-900 border border-white/5 p-8 rounded-[3rem]">
         <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Calculator className="text-indigo-500" />
              {isRtl ? 'محرك الفوترة الذكي' : 'Smart Billing Engine'}
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1 ml-9">Financial Logic Gateway</p>
         </div>
         <button onClick={handleSave} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">
            Apply Global Rules
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-zinc-900 border border-white/5 p-8 rounded-[3.5rem] space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
               <Percent size={18} className="text-indigo-400" />
               Global Parameters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">VAT / Taxes (%)</label>
                  <input type="number" value={billingConfig.tax_rate} onChange={e => setBillingConfig({...billingConfig, tax_rate: parseFloat(e.target.value)})} className="w-full bg-zinc-950 border border-white/5 p-4 rounded-2xl text-white font-black" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Fixed Admin Fee (EGP)</label>
                  <input type="number" value={billingConfig.service_fee} onChange={e => setBillingConfig({...billingConfig, service_fee: parseFloat(e.target.value)})} className="w-full bg-zinc-950 border border-white/5 p-4 rounded-2xl text-white font-black" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Social Subsidy (%)</label>
                  <input type="number" value={billingConfig.government_subsidy} onChange={e => setBillingConfig({...billingConfig, government_subsidy: parseFloat(e.target.value)})} className="w-full bg-zinc-950 border border-white/5 p-4 rounded-2xl text-emerald-500 font-black" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Late Penalty (%)</label>
                  <input type="number" value={billingConfig.late_fee} onChange={e => setBillingConfig({...billingConfig, late_fee: parseFloat(e.target.value)})} className="w-full bg-zinc-950 border border-white/5 p-4 rounded-2xl text-red-500 font-black" />
               </div>
            </div>
         </div>

         <div className="bg-zinc-900 border border-white/5 p-8 rounded-[3.5rem] space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
               <Layers size={18} className="text-egypt-gold" />
               Consumption Tiers & Surcharges
            </h3>
            <div className="space-y-4">
               {billingConfig.tiers.map((tier: any, i: number) => (
                  <div key={i} className="bg-zinc-950 p-5 rounded-2xl border border-white/[0.05] group hover:border-egypt-gold/30 transition-all flex items-center justify-between">
                     <div>
                        <p className="font-black text-white text-xs uppercase">{tier.name}</p>
                        <p className="text-[9px] font-black text-zinc-500 uppercase">{tier.min} - {tier.max} Units</p>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="text-right">
                           <p className="text-[8px] font-black text-zinc-500 uppercase">Adjustment</p>
                           <p className={`text-sm font-black ${tier.discount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {tier.discount}%
                           </p>
                        </div>
                        <button className="p-2 text-zinc-700 hover:text-white"><RefreshCw size={14} /></button>
                     </div>
                  </div>
               ))}
            </div>
            <button className="w-full py-4 border border-zinc-800 rounded-2xl text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all">
               Modify Tier Structure
            </button>
         </div>

         <div className="lg:col-span-2 bg-indigo-600/10 border border-indigo-600/20 p-8 rounded-[3rem] flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
               <ShieldAlert className="text-white" size={32} />
            </div>
            <div>
               <h4 className="font-black text-white text-lg uppercase">{isRtl ? 'وضع الحماية المالية' : 'Financial Integrity Guard'}</h4>
               <p className="text-xs text-zinc-400 font-bold max-w-2xl leading-relaxed">
                  {isRtl ? 'يتم تطبيق هذه القواعد على جميع عمليات إصدار الفواتير التلقائية. تأكد من دقة البيانات قبل الحفظ لتجنب الأخطاء القومية في الحسابات.' : 'These rules apply globally to all automated billing cycles. Verify parameters before synchronization to prevent national financial discrepancies.'}
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default BillingControl;
