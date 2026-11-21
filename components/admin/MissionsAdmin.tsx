
import React, { useState, useEffect } from 'react';
import { 
  Trophy, Plus, Edit2, Trash2, 
  RefreshCw, CheckCircle2, Clock, 
  Search, Filter, Save, X, Target,
  Zap, Star, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../services/supabaseClient';
import { notificationService } from '../../services/notificationService';

interface Mission {
  id: string;
  title: string;
  title_ar?: string;
  description: string;
  description_ar?: string;
  reward_points: number;
  reward_coins: number;
  target_value: number;
  target_type: string;
  status: 'active' | 'draft' | 'archived';
  category: string;
  expires_at?: string;
}

const MissionsAdmin: React.FC<{ isRtl: boolean }> = ({ isRtl }) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMission, setEditingMission] = useState<Partial<Mission> | null>(null);

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMissions(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingMission?.title) return;
    try {
      const isNew = !editingMission.id;
      const { error } = isNew 
        ? await supabase.from('missions').insert([editingMission])
        : await supabase.from('missions').update(editingMission).eq('id', editingMission.id);
      
      if (error) throw error;
      notificationService.success(isRtl ? 'تم الحفظ' : 'Mission saved successfully');
      setEditingMission(null);
      fetchMissions();
    } catch (e) {
      notificationService.error('Error saving mission');
    }
  };

  const deleteMission = async (id: string) => {
    if (!confirm(isRtl ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
    try {
      const { error } = await supabase.from('missions').delete().eq('id', id);
      if (error) throw error;
      setMissions(prev => prev.filter(m => m.id !== id));
      notificationService.success('Mission deleted');
    } catch (e) {
      notificationService.error('Delete failed');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3">
            <Trophy className="w-8 h-8 text-egypt-gold" />
            {isRtl ? 'إدارة المهمات والتحديات' : 'Missions & Challenges Hub'}
          </h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-2">
            Dynamic Gamification Engine
          </p>
        </div>
        <button 
          onClick={() => setEditingMission({ status: 'draft', reward_points: 100, reward_coins: 10, target_value: 10, category: 'energy' })}
          className="flex items-center gap-2 px-6 py-3 bg-egypt-gold text-egypt-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
        >
          <Plus size={16} /> {isRtl ? 'إنشاء مهمة جديدة' : 'Create Mission'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && missions.length === 0 ? (
          <div className="col-span-full py-20 flex justify-center"><RefreshCw className="animate-spin text-egypt-gold w-10 h-10" /></div>
        ) : missions.map((m) => (
          <motion.div 
            key={m.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/[0.05] p-6 rounded-[2.5rem] relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-6 relative z-10">
               <div className={`p-3 rounded-2xl bg-zinc-950 border border-white/[0.05] text-egypt-gold`}>
                  <Target size={24} />
               </div>
               <div className="flex gap-1">
                 <button onClick={() => setEditingMission(m)} className="p-2 text-zinc-500 hover:text-egypt-gold transition-colors"><Edit2 size={16} /></button>
                 <button onClick={() => deleteMission(m.id)} className="p-2 text-zinc-500 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
               </div>
            </div>

            <h4 className="text-lg font-black text-white mb-2 uppercase tracking-tight relative z-10">{isRtl && m.title_ar ? m.title_ar : m.title}</h4>
            <p className="text-xs text-zinc-500 font-bold leading-relaxed mb-6 h-12 line-clamp-3 relative z-10">
               {isRtl && m.description_ar ? m.description_ar : m.description}
            </p>

            <div className="grid grid-cols-2 gap-3 relative z-10">
               <div className="bg-zinc-950 p-3 rounded-2xl border border-white/[0.03]">
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Points</p>
                  <p className="text-sm font-black text-white">+{m.reward_points}</p>
               </div>
               <div className="bg-zinc-950 p-3 rounded-2xl border border-white/[0.03]">
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Green Coins</p>
                  <p className="text-sm font-black text-emerald-500">+{m.reward_coins}</p>
               </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/[0.05] flex justify-between items-center relative z-10">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                  m.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {m.status}
                </span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">{m.category}</span>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-1 bg-zinc-950">
               <div className="h-full bg-egypt-gold w-1/3" />
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {editingMission && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="w-full max-w-2xl bg-zinc-900 border border-white/[0.05] rounded-[3rem] p-8 md:p-12 overflow-hidden relative"
            >
               <button onClick={() => setEditingMission(null)} className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
               
               <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3 uppercase tracking-tighter">
                  <Star className="text-egypt-gold" />
                  {editingMission.id ? 'Edit Mission' : 'Deploy Mission'}
               </h3>

               <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Title (EN)</label>
                        <input className="w-full bg-zinc-950 border border-white/[0.05] rounded-2xl p-4 text-white font-bold outline-none focus:border-egypt-gold" 
                          value={editingMission.title || ''} onChange={e => setEditingMission({...editingMission, title: e.target.value})} />
                     </div>
                     <div className="space-y-2 text-right">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">العنوان (AR)</label>
                        <input className="w-full bg-zinc-950 border border-white/[0.05] rounded-2xl p-4 text-white font-bold outline-none focus:border-egypt-gold text-right" 
                          value={editingMission.title_ar || ''} onChange={e => setEditingMission({...editingMission, title_ar: e.target.value})} />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Reward Points</label>
                        <input type="number" className="w-full bg-zinc-950 border border-white/[0.05] rounded-2xl p-4 text-white font-bold outline-none focus:border-egypt-gold" 
                          value={editingMission.reward_points || 0} onChange={e => setEditingMission({...editingMission, reward_points: parseInt(e.target.value)})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Reward Coins</label>
                        <input type="number" className="w-full bg-zinc-950 border border-white/[0.05] rounded-2xl p-4 text-white font-bold outline-none focus:border-egypt-gold" 
                          value={editingMission.reward_coins || 0} onChange={e => setEditingMission({...editingMission, reward_coins: parseInt(e.target.value)})} />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Target Value</label>
                        <input type="number" className="w-full bg-zinc-950 border border-white/[0.05] rounded-2xl p-4 text-white font-bold outline-none focus:border-egypt-gold" 
                          value={editingMission.target_value || 0} onChange={e => setEditingMission({...editingMission, target_value: parseInt(e.target.value)})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Status</label>
                        <select className="w-full bg-zinc-950 border border-white/[0.05] rounded-2xl p-4 text-white font-bold outline-none focus:border-egypt-gold"
                          value={editingMission.status || 'draft'} onChange={e => setEditingMission({...editingMission, status: e.target.value as any})}
                        >
                           <option value="draft">Draft</option>
                           <option value="active">Active</option>
                           <option value="archived">Archived</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Category</label>
                        <select className="w-full bg-zinc-950 border border-white/[0.05] rounded-2xl p-4 text-white font-bold outline-none focus:border-egypt-gold"
                          value={editingMission.category || 'energy'} onChange={e => setEditingMission({...editingMission, category: e.target.value})}
                        >
                           <option value="energy">Energy</option>
                           <option value="water">Water</option>
                           <option value="transport">Transport</option>
                           <option value="recycle">Recycle</option>
                           <option value="community">Community</option>
                        </select>
                     </div>
                  </div>
               </div>

               <div className="mt-12 flex gap-4">
                  <button onClick={() => setEditingMission(null)} className="flex-1 py-4 bg-zinc-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                  <button onClick={handleSave} className="flex-1 py-4 bg-egypt-gold text-egypt-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-egypt-gold/10">Authorize & Deploy</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MissionsAdmin;
