import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Droplets, Flame, Calculator, Plus, History, TrendingUp, 
  AlertCircle, Save, Camera, X, CheckCircle2, Loader2, Info, 
  Navigation, Leaf, Wallet, Globe, Download, BarChart3, 
  Activity, TreeDeciduous, Share2, Home, Sparkles, Trash2, Send, MapPin, ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { egyptEnergyService } from '../services/egyptEnergyService';
import { notificationService } from '../services/notificationService';
import { ocrService } from '../services/ocrService';
import { supabase } from '../services/supabaseClient';

type ResourceTab = 'usage' | 'library' | 'reports';

const ResourceHub: React.FC = () => {
  const { language, theme, user, isRtl } = useApp();
  const [activeTab, setActiveTab] = useState<ResourceTab>('usage');
  const [loading, setLoading] = useState(true);

  // USAGE STATE
  const [meters, setMeters] = useState<any[]>([]);
  const [readings, setReadings] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]); // New resources state

  // AUDIT STATE
  const [auditStep, setAuditStep] = useState(0);
  const [auditAnswers, setAuditAnswers] = useState<Record<string, number>>({});
  const [showAuditResult, setShowAuditResult] = useState(false);

  // REPORTS STATE
  const [reportType, setReportType] = useState<'trash' | 'recycling' | 'leak'>('trash');
  const [reportDesc, setReportDesc] = useState('');

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('resources_hub_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eco_resources' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [m, r, b, resData] = await Promise.all([
        storageService.getMeters(),
        storageService.getReadings(),
        storageService.getBills(),
        supabase.from('eco_resources').select('*').order('created_at', { ascending: false })
      ]);
      setMeters(m);
      setReadings(r);
      setBills(b);
      setResources(resData.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBillPayment = async (billId: string) => {
     try {
       await supabase.from('bills').update({ status: 'paid' }).eq('id', billId);
       notificationService.success(isRtl ? 'تم الدفع!' : 'Paid!');
       fetchData();
     } catch (e) { console.error(e); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-egypt-gold" /></div>;

  return (
    <div className="min-h-screen pb-40 px-4 md:px-8">
       <div className="max-w-6xl mx-auto pt-8">
          
          {/* Hub Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div className="space-y-1">
               <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-none">
                  {isRtl ? 'بوابة الموارد' : 'RESOURCE HUB'}
               </h1>
               <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                  {isRtl ? 'تحكم في استهلاكك، بيتك، وبيئتك' : 'Control your usage, home, and environment'}
               </p>
            </div>
            
            <div className="flex bg-zinc-100 dark:bg-white/5 p-1 rounded-[2rem] border border-white/5">
               {(['usage', 'library', 'reports'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-6 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === tab ? 'bg-egypt-gold text-egypt-black shadow-lg' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                     {tab === 'usage' ? <Zap size={14} className="inline mr-2" /> : tab === 'library' ? <Home size={14} className="inline mr-2" /> : <Trash2 size={14} className="inline mr-2" />}
                     <span className="hidden sm:inline">
                       {tab === 'usage' ? (isRtl ? 'الاستهلاك' : 'Usage') : tab === 'library' ? (isRtl ? 'بوابة المعرفة' : 'Library') : (isRtl ? 'البلاغات' : 'Reports')}
                     </span>
                  </button>
               ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'usage' && (
              <motion.div key="usage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {meters.map(m => (
                      <div key={m.id} className="p-8 bg-white dark:bg-zinc-900 rounded-[3rem] border border-white/5 shadow-xl">
                         <div className="flex justify-between items-start mb-8">
                            <div className="w-12 h-12 bg-egypt-gold/10 text-egypt-gold rounded-2xl flex items-center justify-center">
                               {m.type === 'electricity' ? <Zap /> : m.type === 'water' ? <Droplets /> : <Flame />}
                            </div>
                            <div className="text-right">
                               <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Meter ID</p>
                               <p className="font-mono text-xs">{m.meter_number || '---'}</p>
                            </div>
                         </div>
                         <h3 className="text-xl font-black mb-1 capitalize">{m.type} Meter</h3>
                         <p className="text-zinc-500 font-bold text-xs mb-8">{m.governorate || 'Assigned Location'}</p>
                         
                         <div className="bg-zinc-100 dark:bg-black/20 p-6 rounded-2xl border border-white/5 flex items-baseline justify-between mb-8">
                            <span className="text-3xl font-black text-emerald-500 tabular-nums">{readings.find(r => r.meter_id === m.id)?.reading_value || m.initial_reading}</span>
                            <span className="text-[10px] font-black text-zinc-500">{m.type === 'electricity' ? 'kWh' : 'm³'}</span>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                            <button className="py-3 bg-zinc-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">Add Reading</button>
                            <button className="py-3 bg-zinc-100 dark:bg-white/5 text-zinc-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">History</button>
                         </div>
                      </div>
                    ))}
                 </div>
                 
                 {/* Recent Bills */}
                 <div>
                    <h3 className="text-2xl font-black mb-8 px-4 italic">{isRtl ? 'الفواتير المستحقة' : 'PENDING BILLS'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {bills.filter(b => b.status !== 'paid').map(b => (
                         <div key={b.id} className="p-8 bg-zinc-100 dark:bg-white/5 rounded-[3rem] border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                               <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center"><Wallet /></div>
                               <div>
                                  <h4 className="text-xl font-black capitalize">{b.type} Bill</h4>
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{new Date(b.created_at).toLocaleDateString()}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-8">
                               <div className="text-right">
                                  <p className="text-2xl font-black">{b.amount} EGP</p>
                                  <p className="text-[10px] font-black text-red-500 uppercase">Due Now</p>
                               </div>
                               <button onClick={() => handleBillPayment(b.id)} className="px-6 py-3 bg-egypt-gold text-black rounded-xl font-black text-[10px] uppercase tracking-widest">Pay Now</button>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </motion.div>
            )}

            {activeTab === 'library' && (
              <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                 <div className="text-center space-y-4">
                    <h2 className="text-4xl font-black italic">{isRtl ? 'بوابة المعرفة الخضراء' : 'GREEN KNOWLEDGE HUB'}</h2>
                    <p className="text-zinc-500 font-bold max-w-lg mx-auto">{isRtl ? 'تصفح أدلة التوعية البيئية واستفد من نصائح توفير الطاقة والمياه.' : 'Browse eco-awareness guides and learn energy and water saving tips.'}</p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {resources.map(res => (
                      <a key={res.id} href={res.external_url || '#'} target="_blank" rel="noreferrer" className="bg-white dark:bg-zinc-900 border border-white/5 p-8 rounded-[3rem] shadow-xl hover:border-egypt-gold transition-all group flex flex-col justify-between">
                         <div>
                            <div className="flex items-center gap-3 mb-6">
                               <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                  {res.resource_type === 'video' ? <Sparkles /> : <Leaf />}
                               </div>
                               <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">{res.category || 'Guide'}</span>
                            </div>
                            <h3 className="text-xl font-black mb-3">{isRtl ? (res.title_ar || res.title) : (res.title_en || res.title)}</h3>
                            <p className="text-xs font-bold text-zinc-500 line-clamp-3 mb-6">{isRtl ? (res.content_ar || res.content) : (res.content_en || res.content)}</p>
                         </div>
                         <div className="flex items-center text-egypt-gold font-black text-[10px] uppercase tracking-widest">
                            {isRtl ? 'اقرأ المزيد' : 'Read More'} <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                         </div>
                      </a>
                    ))}
                 </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-12">
                 <div className="bg-emerald-600 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                    <Trash2 className="absolute -bottom-10 -right-10 w-64 h-64 opacity-10" />
                    <h2 className="text-4xl font-black italic mb-2">{isRtl ? 'بلاغات البيئة' : 'ECO-ENVIRONMENTAL REPORTS'}</h2>
                    <p className="text-white/70 font-bold mb-8">{isRtl ? 'ساعدنا في الحفاظ على مصر نظيفة بالتبليغ عن مشاكل النفايات أو التسريبات.' : 'Help us keep Egypt clean by reporting waste issues or utility leaks.'}</p>
                    <div className="grid grid-cols-3 gap-4">
                       {(['trash', 'recycling', 'leak'] as const).map(type => (
                         <button
                           key={type}
                           onClick={() => setReportType(type)}
                           className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${
                             reportType === type ? 'bg-white text-emerald-600 border-white' : 'bg-white/10 text-white border-transparent'
                           }`}
                         >
                           {type === 'trash' ? <Trash2 /> : type === 'recycling' ? <Leaf /> : <Droplets />}
                           <span className="text-[10px] font-black uppercase">{type}</span>
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="bg-white dark:bg-zinc-900 border border-white/5 p-10 rounded-[3.5rem] shadow-2xl space-y-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Report Description</label>
                       <textarea 
                         value={reportDesc}
                         onChange={e => setReportDesc(e.target.value)}
                         placeholder={isRtl ? 'صف المشكلة بالتفصيل...' : 'Describe the issue clearly...'}
                         className="w-full bg-zinc-100 dark:bg-black/20 p-8 rounded-[2.5rem] min-h-[150px] font-bold outline-none border border-transparent focus:border-emerald-500 transition-all shadow-inner"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <button className="py-5 bg-zinc-100 dark:bg-white/5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest text-zinc-500"><Camera size={18} /> Take Photo</button>
                       <button className="py-5 bg-zinc-100 dark:bg-white/5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest text-zinc-500"><MapPin size={18} /> Tag Location</button>
                    </div>
                    <button onClick={() => { notificationService.success('Report Submitted!'); setReportDesc(''); }} className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black italic shadow-2xl shadow-emerald-600/30">SUBMIT FINAL REPORT</button>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

       </div>
    </div>
  );
};

export default ResourceHub;
