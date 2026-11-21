import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Landmark, ShieldCheck, Scale, Heart, 
  Vote, MessageSquare, Fingerprint, Sparkles, Files, 
  Activity, Info, History, AlertTriangle, TrendingDown,
  DollarSign, Users, Zap, Droplets, Flame, Search, ChevronRight,
  ArrowRight, ShieldAlert, Cpu
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

type CitizenTab = 'services' | 'civic' | 'audit';

const CitizenHub: React.FC = () => {
  const { language, isRtl, user } = useApp();
  const [activeTab, setActiveTab] = useState<CitizenTab>('services');
  const [loading, setLoading] = useState(true);

  // SERVICES STATE
  const [services, setServices] = useState<any[]>([]);
  const [activeServiceCat, setActiveServiceCat] = useState('all');

  // CIVIC STATE
  const [proposals, setProposals] = useState<any[]>([]);
  const [budget, setBudget] = useState(5000000000);
  const [activePolicies, setActivePolicies] = useState<string[]>([]);

  // AUDIT STATE
  const [auditLogs, setAuditLogs] = useState<{ alerts: any[], audits: any[] }>({ alerts: [], audits: [] });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [govtServices, reqLogs, transLogs] = await Promise.all([
        supabase.from('citizen_services').select('*').order('created_at', { ascending: false }),
        supabase.from('citizen_requests').select('*, service:service_id(*)').eq('user_id', user?.id || '').order('created_at', { ascending: false }),
        storageService.getTransparencyLogs()
      ]);
      setServices(govtServices.data || []);
      setProposals(reqLogs.data || []);
      setAuditLogs(transLogs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('citizen_hub_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citizen_services' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citizen_requests' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleCreateRequest = async (serviceId: string) => {
    if (!user) return notificationService.error(isRtl ? 'يجب تسجيل الدخول' : 'Please log in');
    try {
      const { error } = await supabase.from('citizen_requests').insert({
        user_id: user.id,
        service_id: serviceId,
        tracking_code: `REQ-${Math.floor(Math.random() * 1000000)}`
      });
      if (error) throw error;
      notificationService.success(isRtl ? 'تم تقديم الطلب بنجاح' : 'Request submitted successfully');
      fetchData();
    } catch (e) {
      notificationService.error(isRtl ? 'فشل تقديم الطلب' : 'Failed to submit request');
    }
  };

  const handleVote = async (id: string) => {
    notificationService.success(isRtl ? 'تم تسجيل صوتك!' : 'Vote recorded!');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Activity className="animate-spin text-emerald-500" /></div>;

  const getText = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      const v = val[language] || val.ar || val.en;
      if (typeof v === 'string') return v;
      if (typeof v === 'number') return String(v);
      return JSON.stringify(val);
    }
    return String(val);
  };

  return (
    <div className="min-h-screen pb-40 px-4 md:px-10">
       <div className="max-w-7xl mx-auto pt-10">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-10 mb-8 md:mb-16">
             <div className="space-y-2">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-2xl">
                      <Landmark size={18} className="md:w-6 md:h-6" />
                   </div>
                   <span className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-slate-500">{isRtl ? 'بوابة المواطن الرقمية' : 'CITIZEN DIGITAL GATEWAY'}</span>
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-7xl font-black italic tracking-tighter uppercase leading-tight text-slate-900">
                   {isRtl ? 'مركز المواطنة' : 'CITIZEN HUB'}
                </h1>
                <p className="text-[10px] md:text-sm font-bold text-slate-500 max-w-xl">{isRtl ? 'بوابتك السيادية للخدمات، المشاركة المدنية، والشفافية الحكومية المطلقة.' : 'Your sovereign portal for services, civic participation, and absolute government transparency.'}</p>
             </div>

             <div className="flex bg-slate-100 p-1 md:p-1.5 rounded-2xl md:rounded-[2.5rem] border border-slate-200 w-full md:w-auto overflow-x-auto no-scrollbar scroll-smooth">
                {(['services', 'civic', 'audit'] as const).map(tab => (
                   <button
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`flex items-center justify-center gap-2 px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-[2rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap min-w-[100px] md:min-w-0 ${
                       activeTab === tab ? 'bg-slate-900 text-white shadow-lg md:shadow-2xl scale-100 md:scale-105' : 'text-slate-500 hover:text-slate-900'
                     }`}
                   >
                     {tab === 'services' ? <Cpu size={14} /> : tab === 'civic' ? <Vote size={14} /> : <ShieldCheck size={14} />}
                     <span>
                       {tab === 'services' ? (isRtl ? 'الخدمات' : 'Services') : tab === 'civic' ? (isRtl ? 'المشاركة' : 'Civic') : (isRtl ? 'الرقابة' : 'Audit')}
                     </span>
                   </button>
                ))}
             </div>
          </div>

          <AnimatePresence mode="wait">
             {activeTab === 'services' && (
                <motion.div key="services" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                   {/* Digital ID Banner */}
                   <div className="bg-gradient-to-br from-slate-900 to-black p-6 md:p-12 rounded-3xl md:rounded-[4rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 shadow-3xl border border-white/10 relative overflow-hidden group">
                      <Fingerprint size={300} className="absolute -right-20 -bottom-20 opacity-5 group-hover:scale-110 transition-transform duration-1000 hidden md:block" />
                      <div className="space-y-4 md:space-y-6 relative z-10 w-full">
                         <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                            <ShieldCheck size={12} className="md:w-3.5 md:h-3.5" /> Identity Verified
                         </div>
                         <h2 className="text-2xl md:text-5xl font-black italic tracking-tight uppercase leading-tight">
                            {isRtl ? 'هويتك الرقمية الموحدة' : 'YOUR UNIFIED DIGITAL ID'}
                         </h2>
                         <p className="text-slate-400 text-xs md:text-base font-bold max-w-md">{isRtl ? 'تحكم في وثائقك، حسابات المرافق، والوصول للخدمات الحكومية من مكان واحد مؤمن تماماً.' : 'Manage documents, utility accounts, and government access from one ultra-secure location.'}</p>
                         <button className="w-full md:w-auto px-6 md:px-10 py-3.5 md:py-5 bg-white text-slate-900 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-2xl">Access Digital Vault</button>
                      </div>
                      <div className="relative z-10 bg-white/5 backdrop-blur-3xl p-6 md:p-10 rounded-2xl md:rounded-[3rem] border border-white/10 w-full md:w-80">
                         <div className="flex flex-col gap-4 md:gap-6">
                            <div className="flex justify-between items-center pb-2 md:pb-4 border-b border-white/10">
                               <span className="text-[8px] md:text-[10px] font-black text-white/40 uppercase">Trust Score</span>
                               <span className="text-xl md:text-2xl font-black text-emerald-500 italic">AA+</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 md:pb-4 border-b border-white/10">
                               <span className="text-[8px] md:text-[10px] font-black text-white/40 uppercase">Certificates</span>
                               <span className="text-lg md:text-xl font-black">10 Active</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-[8px] md:text-[10px] font-black text-white/40 uppercase">Security</span>
                               <span className="text-lg md:text-xl font-black italic">Biometric</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pt-8">
                      {services.map(s => (
                         <div key={s.id} className="p-5 md:p-10 bg-white border border-slate-100 rounded-2xl md:rounded-[3.5rem] shadow-xl hover:border-slate-900 transition-all group flex flex-col justify-between">
                            <div className="space-y-3 md:space-y-6">
                               <div className="flex items-center justify-between">
                                  <div className="w-8 h-8 md:w-12 md:h-12 bg-slate-50 text-slate-900 rounded-lg md:rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                                     <Files size={16} className="md:w-6 md:h-6" />
                                  </div>
                                  <span className="text-[7px] md:text-[9px] font-black text-emerald-500 uppercase">Saving {s.estimated_saving_kg}kg CO2</span>
                               </div>
                               <div>
                                  <p className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 md:mb-2">{s.category}</p>
                                  <h3 className="text-base md:text-2xl font-black italic tracking-tighter uppercase leading-tight mb-1.5 md:mb-3">{isRtl ? getText(s.name_ar || s.name) : getText(s.name_en || s.name)}</h3>
                                  <p className="text-[11px] md:text-sm font-bold text-slate-500 line-clamp-2 md:line-clamp-3 leading-relaxed">{isRtl ? getText(s.description_ar || s.description) : getText(s.description_en || s.description)}</p>
                               </div>
                            </div>
                            <button onClick={() => handleCreateRequest(s.id)} className="mt-5 md:mt-8 px-4 md:px-6 py-3 md:py-4 bg-slate-50 text-slate-900 rounded-lg md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Launch Service</button>
                         </div>
                      ))}
                   </div>
                </motion.div>
             )}

             {activeTab === 'civic' && (
                <motion.div key="civic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
                   {/* Policy Simulator Summary */}
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                      <div className="lg:col-span-2 space-y-10">
                         <div className="p-10 bg-slate-900 rounded-[3.5rem] text-white shadow-3xl relative overflow-hidden">
                            <Landmark size={200} className="absolute -left-10 -bottom-10 opacity-5" />
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-10">
                               <div className="space-y-4">
                                  <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">{isRtl ? 'محاكي السياسات الحكومية' : 'POLICY SIMULATOR'}</h2>
                                  <p className="text-slate-400 font-bold max-w-lg">{isRtl ? 'قم بمحاكاة تأثير القرارات البيئية الكبرى على ميزانية الدولة ورضا المواطنين.' : 'Simulate the impact of major environmental policies on state budget & citizen satisfaction.'}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Budget</p>
                                  <p className="text-5xl font-black italic tabular-nums">4.8B <span className="text-base text-white/40">EGP</span></p>
                               </div>
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {proposals.slice(0, 4).map(p => (
                               <div key={p.id} className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-xl flex flex-col justify-between">
                                  <div className="space-y-4">
                                     <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500"><Vote size={20}/></div>
                                        <span className="text-[9px] font-black uppercase text-slate-400">Funding Needed</span>
                                     </div>
                                     <h4 className="text-xl font-black italic tracking-tighter uppercase leading-none">{isRtl ? getText(p.title_ar || p.title) : getText(p.title_en || p.title)}</h4>
                                     <p className="text-xs font-bold text-slate-500 line-clamp-2 leading-relaxed">{isRtl ? getText(p.description_ar || p.description) : getText(p.description_en || p.description)}</p>
                                  </div>
                                  <div className="mt-8 space-y-4">
                                     <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-1/3" />
                                     </div>
                                     <button onClick={() => handleVote(p.id)} className="w-full py-4 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg">Vote for Action</button>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-10">
                         <div className="p-10 bg-emerald-600 rounded-[3.5rem] text-white shadow-3xl text-center">
                            <TrendingDown size={40} className="mx-auto mb-6" />
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-2">Simulated Impact</h3>
                            <p className="text-emerald-100 font-bold mb-8 text-sm">Collective results from active policies.</p>
                            <div className="space-y-6">
                               <div className="flex justify-between items-end border-b border-emerald-500 pb-4">
                                  <span className="text-[10px] font-black uppercase">CO2 Redux</span>
                                  <span className="text-3xl font-black italic">-12%</span>
                               </div>
                               <div className="flex justify-between items-end border-b border-emerald-500 pb-4">
                                  <span className="text-[10px] font-black uppercase">Economy</span>
                                  <span className="text-3xl font-black italic">+8pts</span>
                               </div>
                               <div className="flex justify-between items-end">
                                  <span className="text-[10px] font-black uppercase">Happiness</span>
                                  <span className="text-3xl font-black italic">88%</span>
                               </div>
                            </div>
                         </div>
                         
                         <div className="p-10 bg-slate-100 rounded-[3.5rem] space-y-6">
                            <h4 className="text-lg font-black italic uppercase flex items-center gap-3">
                               <MessageSquare size={18} /> {isRtl ? 'أحدث الاقتراحات' : 'Latest Proposals'}
                            </h4>
                            <div className="space-y-4">
                               {[1,2,3].map(i => (
                                  <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                                     <p className="text-[10px] font-black text-slate-400 mb-2 uppercase">Giza District</p>
                                     <p className="text-sm font-bold leading-tight mb-4">Community Vertical Garden in Dokki Metro Station.</p>
                                     <div className="flex gap-4">
                                        <span className="text-[9px] font-black uppercase text-emerald-600">Active</span>
                                        <span className="text-[9px] font-black uppercase text-slate-400">400 Votes</span>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
             )}

             {activeTab === 'audit' && (
                <motion.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                   <div className="flex flex-col md:flex-row gap-10">
                      <div className="flex-1 space-y-10">
                         <div className="p-10 bg-white border border-slate-100 rounded-[3.5rem] shadow-xl">
                            <div className="flex items-center gap-4 mb-10">
                               <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl"><ShieldAlert size={24} /></div>
                               <div>
                                  <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">{isRtl ? 'سجل العمليات الصريح' : 'EXPLICIT AUDIT LOG'}</h3>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'تتبع كل تعديل وتحديث في النظام لحظياً.' : 'Track every system update and modification in real-time.'}</p>
                               </div>
                            </div>

                            <div className="space-y-4">
                               {auditLogs.audits.map((a, i) => (
                                  <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-between group hover:bg-slate-100 transition-all">
                                     <div className="flex items-center gap-6">
                                        <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase">{a.action}</span>
                                        <div>
                                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entry ID</p>
                                           <p className="text-sm font-bold text-slate-800 italic">{a.user_id?.slice(0, 10)}... (Admin)</p>
                                        </div>
                                     </div>
                                     <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</p>
                                        <p className="text-sm font-bold">{new Date(a.timestamp).toLocaleTimeString()}</p>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </div>
                      </div>

                      <div className="md:w-96 space-y-8">
                         <div className="p-10 bg-slate-900 text-white rounded-[3.5rem] shadow-3xl text-center space-y-6">
                            <ShieldCheck size={48} className="text-emerald-500 mx-auto" />
                            <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Security Status</h4>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                               <p className="text-4xl font-black text-emerald-500 italic">SECURE</p>
                               <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-2">Core Kernel Active</p>
                            </div>
                            <p className="text-xs font-bold text-slate-500 italic">Last system audit performed successfully 5 mins ago.</p>
                         </div>
                         
                         <div className="p-10 bg-white border border-slate-100 rounded-[3.5rem] shadow-xl space-y-6">
                            <h4 className="text-lg font-black italic tracking-tighter uppercase">Transparent Systems</h4>
                            <div className="space-y-4">
                               {[
                                  { icon: Zap, label: 'Energy Tiering' },
                                  { icon: Droplets, label: 'Water Distro' },
                                  { icon: Activity, label: 'Carbon Engine' }
                               ].map((s, i) => (
                                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                     <div className="flex items-center gap-3">
                                        <s.icon size={16} className="text-slate-400" />
                                        <span className="text-xs font-black uppercase text-slate-700">{s.label}</span>
                                     </div>
                                     <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                  </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
             )}
          </AnimatePresence>

       </div>
    </div>
  );
};

export default CitizenHub;
