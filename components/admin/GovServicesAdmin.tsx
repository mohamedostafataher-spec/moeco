import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Plus, Edit2, Trash2, Save, X, Search, Filter, Globe, Zap, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { notificationService } from '../../services/notificationService';

const GovServicesAdmin: React.FC<{ isRtl: boolean }> = ({ isRtl }) => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchServices = async () => {
    setLoading(true);
    const { data } = await supabase.from('government_services').select('*').order('category', { ascending: true });
    if (data) setServices(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSave = async () => {
    if (!editingService) return;
    try {
      const { id, ...data } = editingService;
      if (id) {
        await supabase.from('government_services').update(data).eq('id', id);
      } else {
        await supabase.from('government_services').insert(data);
      }
      notificationService.success(isRtl ? 'تم الحفظ بنجاح' : 'Service record synchronized');
      setEditingService(null);
      fetchServices();
    } catch (e) {
      notificationService.error('Sync failed');
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm(isRtl ? 'هل أنت متأكد من الحذف؟' : 'Permanent delete?')) return;
    await supabase.from('government_services').delete().eq('id', id);
    fetchServices();
  };

  const filtered = services.filter(s => 
    s.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.name_ar?.includes(searchQuery) ||
    s.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-zinc-900 border border-white/5 p-8 rounded-[3rem]">
        <div>
           <h2 className="text-2xl font-black text-white flex items-center gap-3">
             <Shield className="text-egypt-gold" />
             {isRtl ? 'مركز إدارة الخدمات الحكومية' : 'Gov-Services Mission Control'}
           </h2>
           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">Smart Government Portal Admin</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-zinc-950 px-4 py-2 rounded-2xl border border-white/5 flex items-center gap-3">
              <Search size={16} className="text-zinc-500" />
              <input 
                type="text" 
                placeholder={isRtl ? 'بحث في الخدمات...' : 'Search hub...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-white outline-none focus:ring-0 min-w-[200px]"
              />
           </div>
           <button 
             onClick={() => setEditingService({ name_en: '', name_ar: '', category: 'General', is_active: true, emission_factor: 0.5 })}
             className="px-6 py-3 bg-egypt-gold text-egypt-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-egypt-gold/20 flex items-center gap-2"
           >
             <Plus size={16} /> {isRtl ? 'إضافة خدمة' : 'Register Service'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {loading ? (
             <div className="col-span-full py-20 flex justify-center"><RefreshCw className="animate-spin text-egypt-gold w-10 h-10" /></div>
         ) : filtered.map(s => (
            <motion.div 
               layout 
               key={s.id} 
               className="bg-zinc-900 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-between group hover:border-egypt-gold/30 transition-all"
            >
               <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center border border-white/5 text-egypt-gold font-black shadow-inner">
                     {s.category ? s.category[0] : 'S'}
                  </div>
                  <div className="flex flex-col items-end">
                     <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${s.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {s.is_active ? 'Online' : 'Offline'}
                     </span>
                     <span className="text-[10px] font-mono text-zinc-500 mt-1">ID: {s.id.slice(0,8)}</span>
                  </div>
               </div>
               
               <div className="space-y-1">
                  <h3 className="font-black text-white text-lg leading-tight uppercase">{s.name_en}</h3>
                  <h3 className="font-bold text-zinc-400 font-arabic text-sm">{s.name_ar}</h3>
                  <div className="flex items-center gap-2 mt-2">
                     <Globe size={12} className="text-zinc-600" />
                     <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{s.category} Portal</span>
                  </div>
               </div>

               <div className="mt-8 pt-6 border-t border-white/[0.03] flex items-center justify-between">
                  <div>
                     <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Emission Factor</p>
                     <p className="text-sm font-black text-egypt-gold">{s.emission_factor} <span className="text-[9px]">kg/req</span></p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => setEditingService(s)} className="p-2 text-zinc-500 hover:text-white bg-white/5 rounded-lg"><Edit2 size={16} /></button>
                     <button onClick={() => deleteService(s.id)} className="p-2 text-zinc-500 hover:text-red-500 bg-white/5 rounded-lg"><Trash2 size={16} /></button>
                  </div>
               </div>
            </motion.div>
         ))}
      </div>

      <AnimatePresence>
         {editingService && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="w-full max-w-2xl bg-zinc-950 border border-white/5 p-10 rounded-[3.5rem] shadow-2xl space-y-8 relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                     <Zap size={200} />
                  </div>
                  
                  <div className="flex justify-between items-center relative z-10">
                     <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                        {editingService.id ? 'Edit Service Payload' : 'New Service Deployment'}
                     </h3>
                     <button onClick={() => setEditingService(null)} className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-white hover:bg-white/10 transition-all"><X size={20}/></button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Public Label (EN)</label>
                        <input 
                           value={editingService.name_en}
                           onChange={e => setEditingService({...editingService, name_en: e.target.value})}
                           className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-egypt-gold outline-none font-bold"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Public Label (AR)</label>
                        <input 
                           value={editingService.name_ar}
                           onChange={e => setEditingService({...editingService, name_ar: e.target.value})}
                           className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-egypt-gold outline-none font-bold text-right font-arabic"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Portal Classification</label>
                        <select 
                           value={editingService.category}
                           onChange={e => setEditingService({...editingService, category: e.target.value})}
                           className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-egypt-gold outline-none font-black uppercase tracking-widest"
                        >
                           <option>General</option>
                           <option>Transport</option>
                           <option>Utility</option>
                           <option>Civil</option>
                           <option>Financial</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Eco Impact Core (kg/req)</label>
                        <input 
                           type="number"
                           step="0.01"
                           value={editingService.emission_factor}
                           onChange={e => setEditingService({...editingService, emission_factor: parseFloat(e.target.value)})}
                           className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-egypt-gold outline-none font-black"
                        />
                     </div>
                  </div>

                  <div className="flex gap-4 relative z-10 pt-4">
                     <button 
                        onClick={handleSave}
                        className="flex-1 py-5 bg-egypt-gold text-egypt-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-egypt-gold/20 flex items-center justify-center gap-3"
                     >
                        <Save size={18} />
                        Execute Deployment
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default GovServicesAdmin;
