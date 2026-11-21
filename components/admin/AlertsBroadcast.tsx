
import React, { useState, useEffect } from 'react';
import { 
  Bell, Send, AlertTriangle, Info, 
  CheckCircle, ShieldAlert, X,
  Globe, Users, Radio, Zap,
  Clock, Trash2, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../services/supabaseClient';
import { notificationService } from '../../services/notificationService';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: 'Info' | 'Success' | 'Warning' | 'Alert';
  audience: 'all' | 'governors' | 'verified' | 'top_savers';
  is_active: boolean;
  created_at: string;
}

const AlertsBroadcast: React.FC<{ isRtl: boolean }> = ({ isRtl }) => {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAlert, setNewAlert] = useState<Partial<Broadcast>>({
    type: 'Info',
    audience: 'all',
    title: '',
    message: ''
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data } = await supabase.from('alerts').select('*').order('created_at', { ascending: false });
      setBroadcasts(data || []);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!newAlert.title || !newAlert.message) return;
    try {
      const { error } = await supabase.from('alerts').insert([{ ...newAlert, is_active: true }]);
      if (error) throw error;
      notificationService.success(isRtl ? 'تم إرسال التنبيه' : 'Alert Broadcasted Successfully');
      setNewAlert({ type: 'Info', audience: 'all', title: '', message: '' });
      fetchAlerts();
    } catch (e) {
      notificationService.error('Broadcast failed');
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      await supabase.from('alerts').delete().eq('id', id);
      setBroadcasts(prev => prev.filter(b => b.id !== id));
    } catch (e) {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Alert': return <ShieldAlert className="text-red-500" />;
      case 'Warning': return <AlertTriangle className="text-amber-500" />;
      case 'Success': return <CheckCircle className="text-emerald-500" />;
      default: return <Info className="text-blue-500" />;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3">
            <Radio className="w-8 h-8 text-egypt-gold animate-pulse" />
            {isRtl ? 'مركز البث والتحذيرات' : 'National Alert Console'}
          </h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-2">
            Integrated Emergency & Info Broadcast
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 border border-white/[0.05] p-8 rounded-[2.5rem] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Send size={120} />
             </div>
             <h3 className="text-[10px] font-black text-egypt-gold uppercase tracking-[0.3em] mb-8 relative z-10">Compose Broadcast</h3>
             
             <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Type</label>
                   <div className="flex gap-2">
                      {['Info', 'Success', 'Warning', 'Alert'].map(t => (
                        <button 
                          key={t}
                          onClick={() => setNewAlert({...newAlert, type: t as any})}
                          className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                            newAlert.type === t ? 'bg-egypt-gold/10 border-egypt-gold/30 text-egypt-gold' : 'bg-zinc-950 border-white/5 text-zinc-500'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Audience Segment</label>
                   <select 
                     value={newAlert.audience}
                     onChange={e => setNewAlert({...newAlert, audience: e.target.value as any})}
                     className="w-full bg-zinc-950 border border-white/5 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-egypt-gold"
                   >
                     <option value="all">Every Citizen (Global)</option>
                     <option value="governors">Governorate Admins</option>
                     <option value="verified">Verified Users Only</option>
                     <option value="top_savers">Top 100 Carbon Savers</option>
                   </select>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Headline</label>
                   <input 
                     value={newAlert.title}
                     onChange={e => setNewAlert({...newAlert, title: e.target.value})}
                     placeholder="Urgent Infrastructure Notification"
                     className="w-full bg-zinc-950 border border-white/5 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-egypt-gold"
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Payload Message</label>
                   <textarea 
                     value={newAlert.message}
                     onChange={e => setNewAlert({...newAlert, message: e.target.value})}
                     placeholder="Content of the alert..."
                     className="w-full bg-zinc-950 border border-white/5 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-egypt-gold h-32 resize-none"
                   />
                </div>

                <button 
                  onClick={handleSend}
                  className="w-full py-5 bg-egypt-gold text-egypt-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-egypt-gold/10 flex items-center justify-center gap-3"
                >
                  <Radio size={16} /> Authorize & Transmit
                </button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
           <div className="bg-zinc-900 border border-white/[0.05] p-6 rounded-[2.5rem]">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Transmission Log</h3>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[9px] font-black text-zinc-500 uppercase">Live Node</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 {broadcasts.map((b) => (
                   <motion.div 
                     layout
                     key={b.id} 
                     className="flex items-start gap-4 p-5 bg-zinc-950 border border-white/[0.03] rounded-[2rem] group hover:border-egypt-gold/20 transition-all"
                   >
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/[0.05] shrink-0">
                         {getIcon(b.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-black text-white uppercase tracking-tight truncate pr-4">{b.title}</h4>
                            <span className="text-[9px] font-mono text-zinc-600 whitespace-nowrap">{new Date(b.created_at).toLocaleString()}</span>
                         </div>
                         <p className="text-xs text-zinc-500 font-bold mb-3">{b.message}</p>
                         <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black text-zinc-500 uppercase tracking-widest border border-white/5">Audience: {b.audience}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                              b.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'
                            }`}>
                              {b.is_active ? 'In Air' : 'Terminated'}
                            </span>
                         </div>
                      </div>
                      <button onClick={() => deleteAlert(b.id)} className="p-2 text-zinc-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                   </motion.div>
                 ))}
                 
                 {broadcasts.length === 0 && !loading && (
                    <div className="py-20 text-center flex flex-col items-center">
                       <Radio className="w-12 h-12 text-zinc-800 mb-4" />
                       <p className="text-zinc-600 font-black text-xs uppercase tracking-widest">No active transmissions in this sector</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsBroadcast;
