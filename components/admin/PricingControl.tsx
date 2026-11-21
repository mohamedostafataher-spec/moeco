import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { DollarSign, Save, RefreshCw, Plus, Trash2, Zap, Droplets, Flame, Fuel, Truck } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { notificationService } from '../../services/notificationService';

const PricingControl: React.FC<{ isRtl: boolean }> = ({ isRtl }) => {
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTariff, setNewTariff] = useState({
    utility_type: 'electricity',
    segment_name: 'Residential',
    tier_min: 0,
    tier_max: 50,
    price_per_unit: 0.48,
    unit: 'kWh',
    governorate: 'All'
  });

  const fetchTariffs = async () => {
    setLoading(true);
    const { data } = await supabase.from('utility_tariffs').select('*').order('utility_type', { ascending: true }).order('tier_min', { ascending: true });
    if (data) setTariffs(data);
    else {
      // Fallback to prices if tariffs empty
      const { data: legacy } = await supabase.from('prices').select('*');
      if (legacy) {
         setTariffs(legacy.map(l => ({
           id: l.id,
           utility_type: l.category,
           segment_name: l.segment,
           price_per_unit: l.price,
           unit: l.unit,
           is_legacy: true
         })));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTariffs();
  }, []);

  const handleUpdate = async (id: number, val: number, isLegacy: boolean) => {
    try {
      if (isLegacy) {
        await supabase.from('prices').update({ price: val }).eq('id', id);
      } else {
        await supabase.from('utility_tariffs').update({ price_per_unit: val }).eq('id', id);
      }
      notificationService.success(isRtl ? 'تم التحديث بنجاح' : 'Price updated in real-time');
    } catch (e) {
      notificationService.error('Update failed');
    }
  };

  const addTariff = async () => {
     try {
       await supabase.from('utility_tariffs').insert(newTariff);
       fetchTariffs();
       notificationService.success('New tariff added');
     } catch(e) {}
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'electricity': return <Zap className="text-amber-400" size={20} />;
      case 'water': return <Droplets className="text-cyan-400" size={20} />;
      case 'gas': return <Flame className="text-orange-500" size={20} />;
      case 'fuel': return <Fuel className="text-red-500" size={20} />;
      default: return <Truck className="text-blue-500" size={20} />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5">
        <div>
           <h2 className="text-2xl font-black text-white">{isRtl ? 'مركز التحكم في التسعير الذكي' : 'Smart Pricing Engine'}</h2>
           <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Global Tariff Authority</p>
        </div>
        <button onClick={fetchTariffs} className="p-3 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white">
           <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Insights */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem]">
              <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4">Pricing Strategy</h3>
              <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                Changes here affect billing calculations for all users immediately. The system uses these rates to calculate CO2 emissions and financial burden.
              </p>
           </div>
           
           <div className="bg-zinc-900 p-6 rounded-[2rem] border border-white/5">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">Add New Tariff</h3>
              <div className="space-y-4">
                 <select 
                    value={newTariff.utility_type}
                    onChange={(e) => setNewTariff({...newTariff, utility_type: e.target.value})}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-sm text-white"
                 >
                    <option value="electricity">Electricity</option>
                    <option value="water">Water</option>
                    <option value="gas">Gas</option>
                    <option value="fuel">Fuel</option>
                    <option value="transport">Transport</option>
                 </select>
                 <input 
                    placeholder="Segment (e.g. Residential)"
                    value={newTariff.segment_name}
                    onChange={(e) => setNewTariff({...newTariff, segment_name: e.target.value})}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-sm text-white"
                 />
                 <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Min" className="bg-zinc-950 border border-white/5 rounded-xl p-3 text-sm text-white" />
                    <input type="number" placeholder="Max" className="bg-zinc-950 border border-white/5 rounded-xl p-3 text-sm text-white" />
                 </div>
                 <input 
                    type="number" 
                    placeholder="Price per Unit"
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-sm text-white font-black"
                    value={newTariff.price_per_unit}
                    onChange={(e) => setNewTariff({...newTariff, price_per_unit: parseFloat(e.target.value)})}
                 />
                 <button onClick={addTariff} className="w-full py-4 bg-egypt-gold text-egypt-black rounded-xl font-black text-xs uppercase tracking-widest">
                    Insert Live Tariff
                 </button>
              </div>
           </div>
        </div>

        {/* Live Grids */}
        <div className="lg:col-span-2 bg-zinc-900 border border-white/5 p-8 rounded-[3rem]">
           <div className="space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar pr-2">
              {tariffs.map((t) => (
                <motion.div 
                  layout
                  key={t.id} 
                  className="p-5 bg-zinc-950 border border-white/[0.03] rounded-2xl flex items-center justify-between group hover:border-egypt-gold/30 transition-all"
                >
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/5">
                         {getIcon(t.utility_type)}
                      </div>
                      <div>
                         <h4 className="font-black text-white text-sm uppercase tracking-tight">{t.segment_name}</h4>
                         <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            {t.utility_type} | {t.tier_min || 0} - {t.tier_max || '∞'} {t.unit}
                         </p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-4">
                      <div className="text-right">
                         <div className="flex items-center gap-2">
                             <input 
                                type="number" 
                                value={t.price_per_unit || t.price}
                                step="0.01"
                                onChange={(e) => {
                                   const val = parseFloat(e.target.value);
                                   setTariffs(prev => prev.map(x => x.id === t.id ? { ...x, price_per_unit: val, price: val } : x));
                                }}
                                className="w-20 bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs font-black text-egypt-gold text-center focus:border-egypt-gold outline-none"
                             />
                             <span className="text-[10px] font-black text-zinc-500 uppercase">EGP</span>
                         </div>
                      </div>
                      <button 
                         onClick={() => handleUpdate(t.id, t.price_per_unit || t.price, !!t.is_legacy)}
                         className="p-3 bg-egypt-gold/10 text-egypt-gold rounded-xl hover:bg-egypt-gold hover:text-egypt-black transition-all"
                      >
                         <Save size={18} />
                      </button>
                   </div>
                </motion.div>
              ))}
              {tariffs.length === 0 && !loading && (
                 <div className="py-20 text-center text-zinc-500 italic font-bold">No data in active grid</div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default PricingControl;
