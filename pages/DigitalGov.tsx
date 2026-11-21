
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Landmark, ShieldCheck, Scale, Heart, 
  Vote, MessageSquare, Fingerprint, Sparkles, Files,
  Cpu, Users, ShieldAlert, ChevronRight, Activity,
  Info, Landmark as GovIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { notificationService } from '../services/notificationService';

const DigitalGov: React.FC = () => {
  const { language, theme, user, isRtl } = useApp();
  const [activeTab, setActiveTab] = useState<'services' | 'civic' | 'transparency'>('services');
  const [loading, setLoading] = useState(true);

  // States from both hubs
  const [services, setServices] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        supabase.from('government_services').select('*').eq('is_active', true),
        supabase.from('citizen_requests').select('*, service:service_id(*)').eq('user_id', user?.id || '')
      ]);
      
      const mappedServices = (s.data || []).map(item => {
        const id = item.id || item.service_id;
        const name_ar = item.name_ar || item.service_name_ar || '';
        const name_en = item.name_en || item.service_name_en || '';
        const description_ar = item.description_ar || item.description || '';
        const description_en = item.description_en || item.description || '';
        const url = item.url || item.official_portal_url || '';
        return {
          ...item,
          id,
          name_ar,
          name_en,
          description_ar,
          description_en,
          url
        };
      });

      setServices(mappedServices);
      setProposals(p.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3.5rem] shadow-2xl border border-zinc-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-xl">
            <GovIcon size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">{isRtl ? 'الحكومة الرقمية' : 'Digital Gov'}</h1>
            <p className="text-sm font-bold text-stone-500 uppercase tracking-widest">{isRtl ? 'الخدمات، المشاركة، والشفافية' : 'Services, Civic, & Transparency'}</p>
          </div>
        </div>

        <div className="flex bg-stone-100 dark:bg-white/5 p-2 rounded-3xl">
          {[
            { id: 'services', icon: Cpu, label: isRtl ? 'الخدمات' : 'Services' },
            { id: 'civic', icon: Vote, label: isRtl ? 'المشاركة' : 'Civic' },
            { id: 'transparency', icon: ShieldCheck, label: isRtl ? 'الشفافية' : 'Transparency' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all ${
                activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'services' && (
           <motion.div key="services" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(s => (
                 <div key={s.id} className="p-8 bg-white dark:bg-zinc-900 rounded-[3rem] border border-stone-100 dark:border-white/5 shadow-xl group">
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white group-hover:bg-slate-900 group-hover:text-white transition-all">
                          <Files size={24} />
                       </div>
                       <span className="text-[10px] font-black text-emerald-500 uppercase">Verfied</span>
                    </div>
                    <h4 className="text-xl font-black mb-2">{isRtl ? s.name_ar : s.name_en}</h4>
                    <p className="text-xs font-bold text-stone-500 mb-8 line-clamp-2">{isRtl ? s.description_ar : s.description_en}</p>
                    <button className="w-full py-4 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Launch Digital Flow</button>
                 </div>
              ))}
           </motion.div>
        )}

        {activeTab === 'civic' && (
           <motion.div key="civic" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="p-12 bg-slate-900 text-white rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10 shadow-2xl overflow-hidden relative">
                 <div className="absolute inset-0 opacity-5"><Vote className="w-full h-full" /></div>
                 <div className="space-y-4 relative z-10">
                    <h3 className="text-3xl font-black italic tracking-tighter">CIVIC ACTION HUB</h3>
                    <p className="text-sm font-bold text-slate-400 max-w-md">Influence policy, vote on local projects, and engage directly with decision makers.</p>
                 </div>
                 <div className="text-right relative z-10">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Community Budget</p>
                    <p className="text-4xl font-black tabular-nums">4.2B EGP</p>
                 </div>
              </div>
           </motion.div>
        )}

        {activeTab === 'transparency' && (
           <motion.div key="transparency" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-stone-100 dark:border-white/5">
                 <div className="flex items-center gap-4 mb-8">
                    <ShieldAlert className="text-emerald-500" />
                    <h3 className="text-xl font-black italic">Live Transparency Audit</h3>
                 </div>
                 <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                       <div key={i} className="flex items-center justify-between p-6 bg-stone-50 dark:bg-white/5 rounded-2xl">
                          <div className="flex items-center gap-4">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-xs font-black uppercase text-stone-500">Resource Allocation - Delta Region</span>
                          </div>
                          <span className="text-xs font-black">2 mins ago</span>
                       </div>
                    ))}
                 </div>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DigitalGov;
