
import React, { useState, useEffect } from 'react';
import { 
  Store, Plus, Edit2, Trash2, 
  Search, Filter, Save, X, Package,
  Zap, DollarSign, Tag, ExternalLink,
  RefreshCw, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../services/supabaseClient';
import { notificationService } from '../../services/notificationService';

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  category: string;
  description: string;
}

interface Offer {
  id: string;
  partner_id: string;
  title: string;
  description: string;
  points_cost: number;
  promo_code: string;
  is_active: boolean;
  type: string;
}

const MarketplaceAdmin: React.FC<{ isRtl: boolean }> = ({ isRtl }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'partners' | 'offers'>('offers');
  const [editingOffer, setEditingOffer] = useState<Partial<Offer> | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [partnersRes, offersRes] = await Promise.all([
        supabase.from('partners').select('*').order('name'),
        supabase.from('partner_offers').select('*, partners(name)').order('created_at', { ascending: false })
      ]);
      setPartners(partnersRes.data || []);
      setOffers(offersRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOffer = async () => {
    if (!editingOffer?.title || !editingOffer.partner_id) return;
    try {
      const isNew = !editingOffer.id;
      const payload = { ...editingOffer };
      delete (payload as any).partners; // Remove joined data before save

      const { error } = isNew 
        ? await supabase.from('partner_offers').insert([payload])
        : await supabase.from('partner_offers').update(payload).eq('id', editingOffer.id);
      
      if (error) throw error;
      notificationService.success(isRtl ? 'تم الحفظ' : 'Offer saved successfully');
      setEditingOffer(null);
      fetchData();
    } catch (e) {
      notificationService.error('Error saving offer');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3">
            <Store className="w-8 h-8 text-egypt-gold" />
            {isRtl ? 'إدارة المتجر والشراكات' : 'Eco-Marketplace Admin'}
          </h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-2">
            Integrated Partner Ecosystem Control
          </p>
        </div>
        <div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl">
           {(['offers', 'partners'] as const).map((t) => (
             <button
               key={t}
               onClick={() => setActiveTab(t)}
               className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                 activeTab === t ? 'bg-egypt-gold text-egypt-black' : 'text-zinc-500 hover:text-white'
               }`}
             >
               {t}
             </button>
           ))}
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
         <h3 className="text-lg font-black text-white uppercase tracking-tight">
            {activeTab === 'offers' ? 'Live Ecosystem Offers' : 'Registered Impact Partners'}
         </h3>
         <button 
           onClick={() => activeTab === 'offers' ? setEditingOffer({ is_active: true, partner_id: partners[0]?.id }) : null}
           className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/15 transition-all"
         >
           <Plus size={14} /> New {activeTab === 'offers' ? 'Offer' : 'Partner'}
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center"><RefreshCw className="animate-spin text-egypt-gold w-10 h-10" /></div>
        ) : activeTab === 'offers' ? (
          offers.map((off) => (
            <motion.div 
              key={off.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-900 border border-white/[0.05] p-6 rounded-[2.5rem] relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-6">
                 <div className={`p-3 rounded-2xl bg-zinc-950 border border-white/[0.05] text-blue-400`}>
                    <Tag size={24} />
                 </div>
                 <div className="flex gap-1">
                   <button onClick={() => setEditingOffer(off)} className="p-2 text-zinc-500 hover:text-egypt-gold transition-colors"><Edit2 size={16} /></button>
                   <button className="p-2 text-zinc-500 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                 </div>
              </div>

              <span className="text-[8px] font-black text-egypt-gold uppercase tracking-[.2em] mb-1 block">{(off as any).partners?.name}</span>
              <h4 className="text-lg font-black text-white mb-2 tracking-tight line-clamp-1">{off.title}</h4>
              <p className="text-xs text-zinc-500 font-bold leading-relaxed mb-6 h-8 line-clamp-2">{off.description}</p>

              <div className="flex items-center justify-between pt-6 border-t border-white/[0.05]">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Cost</span>
                    <span className="text-sm font-black text-white">{off.points_cost} PTS</span>
                 </div>
                 <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                   off.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'
                 }`}>
                   {off.is_active ? 'In Store' : 'Offline'}
                 </div>
              </div>
            </motion.div>
          ))
        ) : (
          partners.map((p) => (
            <div key={p.id} className="bg-zinc-900 border border-white/[0.05] p-6 rounded-[2.5rem] text-center flex flex-col items-center">
               <img src={p.logo_url} alt="" className="w-20 h-20 rounded-2xl bg-white/5 p-4 mb-4 border border-white/5" />
               <h4 className="text-lg font-black text-white mb-1 uppercase tracking-tighter">{p.name}</h4>
               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">{p.category}</p>
               <button className="w-full py-3 bg-zinc-950 border border-white/5 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-zinc-900 transition-all">
                  Manage Partnership
               </button>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {editingOffer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="w-full max-w-xl bg-zinc-900 border border-white/[0.05] rounded-[3rem] p-8 md:p-12 overflow-hidden relative"
            >
               <button onClick={() => setEditingOffer(null)} className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
               
               <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3 uppercase tracking-tighter">
                  <Package className="text-egypt-gold" />
                  {editingOffer.id ? 'Modify Ecosystem Entry' : 'New Ecosystem Entry'}
               </h3>

               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Partner Operator</label>
                     <select className="w-full bg-zinc-950 border border-white/[0.05] rounded-2xl p-4 text-white font-bold outline-none focus:border-egypt-gold"
                       value={editingOffer.partner_id || ''} onChange={e => setEditingOffer({...editingOffer, partner_id: e.target.value})}
                     >
                        {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Offer Headline</label>
                     <input className="w-full bg-zinc-950 border border-white/[0.05] rounded-2xl p-4 text-white font-bold outline-none focus:border-egypt-gold" 
                       value={editingOffer.title || ''} 
                       onChange={e => setEditingOffer({...editingOffer, title: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Points Cost</label>
                        <input type="number" className="w-full bg-zinc-950 border border-white/[0.05] rounded-2xl p-4 text-white font-bold outline-none focus:border-egypt-gold" 
                          value={editingOffer.points_cost || 0} onChange={e => setEditingOffer({...editingOffer, points_cost: parseInt(e.target.value)})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Promo Code</label>
                        <input className="w-full bg-zinc-950 border border-white/[0.05] rounded-2xl p-4 text-white font-mono font-black outline-none focus:border-egypt-gold uppercase" 
                          value={editingOffer.promo_code || ''} onChange={e => setEditingOffer({...editingOffer, promo_code: e.target.value})} />
                     </div>
                  </div>
               </div>

               <div className="mt-12 flex gap-4">
                  <button onClick={() => setEditingOffer(null)} className="flex-1 py-4 bg-zinc-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Abort</button>
                  <button onClick={handleSaveOffer} className="flex-1 py-4 bg-egypt-gold text-egypt-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-egypt-gold/10">Authorize & List</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper for title since I missed the onChange binding in the draft above
const setNewTitle = (val: string) => {}; 

export default MarketplaceAdmin;
