
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Droplets, Flame, Calculator, Plus, History, TrendingUp, 
  Leaf, Trash2, Sprout, Utensils, Home, Info, ArrowRight,
  ShoppingCart, Package, Navigation, MapPin
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';

const GreenResources: React.FC = () => {
  const { language, theme, user, isRtl } = useApp();
  const [activeTab, setActiveTab] = useState<'utility' | 'food' | 'agri' | 'waste'>('utility');
  const [loading, setLoading] = useState(true);

  // States
  const [meters, setMeters] = useState<any[]>([]);
  const [foods, setFoods] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const [m, f, c] = await Promise.all([
        storageService.getMeters(),
        supabase.from('eco_products').select('*').eq('category', 'food'),
        supabase.from('crops').select('*')
      ]);
      setMeters(m);
      setFoods(f.data || []);
      setCrops(c.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3.5rem] shadow-2xl border border-zinc-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <Zap size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">{isRtl ? 'إدارة الموارد' : 'Green Resources'}</h1>
            <p className="text-sm font-bold text-stone-500 uppercase tracking-widest">{isRtl ? 'المياه، الغذاء، الطاقة، والنفايات' : 'Food, Water, Energy, & Waste'}</p>
          </div>
        </div>

        <div className="flex bg-stone-100 dark:bg-white/5 p-2 rounded-3xl">
          {[
            { id: 'utility', icon: Zap, label: isRtl ? 'المرافق' : 'Utilities' },
            { id: 'food', icon: Utensils, label: isRtl ? 'الغذاء' : 'Food' },
            { id: 'agri', icon: Sprout, label: isRtl ? 'الزراعة' : 'Agri' },
            { id: 'waste', icon: Trash2, label: isRtl ? 'النفايات' : 'Waste' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'utility' && (
           <motion.div key="utility" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {meters.map(m => (
                 <div key={m.id} className="p-8 bg-white dark:bg-zinc-900 rounded-[3rem] border border-stone-100 dark:border-white/5 shadow-xl">
                    <div className="flex justify-between items-start mb-8">
                       <div className="w-12 h-12 bg-egypt-gold/10 text-egypt-gold rounded-2xl flex items-center justify-center">
                          {m.type === 'electricity' ? <Zap /> : <Droplets />}
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Reading</p>
                          <p className="text-2xl font-black tabular-nums">{m.initial_reading}</p>
                       </div>
                    </div>
                    <h4 className="text-xl font-black capitalize mb-1">{m.type}</h4>
                    <p className="text-xs font-bold text-stone-500 mb-8">{m.governorate}</p>
                    <button className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Update Meter</button>
                 </div>
              ))}
           </motion.div>
        )}

        {activeTab === 'food' && (
           <motion.div key="food" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {foods.map(f => (
                 <div key={f.id} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-stone-100 dark:border-white/5 shadow-xl overflow-hidden group">
                    <img src={f.image_url} className="h-48 w-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="p-6">
                       <h4 className="text-xl font-black mb-1">{isRtl ? (f.name_ar || f.name) : (f.name_en || f.name)}</h4>
                       <p className="text-xs font-bold text-emerald-500 mb-4">{f.type === 'organic' ? '100% Organic' : 'Fresh Produce'}</p>
                       <button className="w-full py-3 bg-egypt-gold text-white rounded-xl font-black text-xs">Buy Now</button>
                    </div>
                 </div>
              ))}
           </motion.div>
        )}

        {activeTab === 'agri' && (
           <motion.div key="agri" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="p-12 bg-emerald-950 text-white rounded-[4rem] text-center border border-white/10 relative overflow-hidden">
                 <div className="absolute inset-0 opacity-10"><Sprout className="w-full h-full" /></div>
                 <h3 className="text-3xl font-black italic mb-2">Egypt Agriculture Pulse</h3>
                 <p className="text-sm font-bold opacity-60 max-w-md mx-auto">Real-time monitoring of crop health and irrigation across the Nile Delta.</p>
              </div>
           </motion.div>
        )}

        {activeTab === 'waste' && (
           <motion.div key="waste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-zinc-900 p-12 rounded-[4rem] border border-stone-100 dark:border-white/5 text-center">
              <Trash2 size={80} className="mx-auto mb-6 text-stone-300" />
              <h3 className="text-3xl font-black italic mb-4">Zero Waste Initiative</h3>
              <p className="text-stone-500 font-bold max-w-lg mx-auto mb-10">Report waste collection points or track your recycling contributions to earn green points.</p>
              <button className="px-12 py-5 bg-emerald-500 text-white rounded-[2rem] font-black italic shadow-xl shadow-emerald-500/20">Report Waste Point</button>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GreenResources;
