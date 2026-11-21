import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { 
  FileText, Download, Calendar, ArrowRight, Table, Globe, 
  Landmark, Loader2, FileDown, Award, ShieldCheck, 
  Search, Filter, ChevronRight, Eye
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { motion, AnimatePresence } from 'motion/react';
import { Certificate } from '../components/Certificate';

const Reports: React.FC = () => {
  const { language, theme, user } = useApp();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'certificates'>('reports');
  const [showCert, setShowCert] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(200);
      
      // If not admin, show public reports or user's private reports
      if (user?.role !== 'admin') {
         query = query.or(`type.eq.country,type.eq.sector,type.eq.governorate,and(type.eq.user,reference_id.eq.${user?.id})`);
      }
      
      const { data, error } = await query;
      if (error) {
        console.error("Fetch reports error:", error);
      } else {
        setReports(data || []);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;
    try {
       const { data } = await supabase.from('carbon_footprint_logs')
        .select('total_emissions')
        .eq('user_id', user.id);
       
       const total = data?.reduce((acc: number, curr: any) => acc + (curr.total_emissions || 0), 0) || 0;
       setUserStats({ totalCO2: total.toFixed(1) });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchUserStats();
  }, [user]);

  const generateReport = async (type: string, payload: any) => {
    if (generating) return;
    setGenerating(type);
    
    // Simulate generation by inserting a real record into Supabase
    try {
      const now = new Date();
      const newReport = {
        type: type,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        reference_id: payload.userId || payload.sector || (type === 'governorate' ? user?.governorate : 'ALL'),
        file_url_pdf: `https://reports.moeco.eg/v1/${type}/${payload.userId || 'system'}.pdf`,
        file_url_excel: `https://reports.moeco.eg/v1/${type}/${payload.userId || 'system'}.xlsx`,
        metadata: {
          generated_by: user?.id,
          context: payload,
          version: '2.0-SUPABASE'
        },
        created_at: now.toISOString()
      };

      const { error } = await supabase.from('reports').insert([newReport]);
      if (error) throw error;

      notificationService.success(language === 'ar' ? 'تم إنشاء التقرير وحفظه في الأرشيف' : 'Report generated and archived successfully');
      fetchReports();
    } catch(e) {
      notificationService.error(language === 'ar' ? 'فشل إنشاء التقرير' : 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const isRtl = language === 'ar';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pt-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-indigo-600 text-white rounded-[2rem] shadow-xl shadow-indigo-500/20">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white font-arabic tracking-tight">
              {isRtl ? 'مركز التقارير والشهادات' : 'Reports & Certificate Center'}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-bold font-arabic">
              {isRtl ? 'الوثائق الرسمية وشهادات الأثر البيئي الموثقة' : 'Official documents and verified eco-impact certificates'}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === 'reports' 
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' 
                : 'text-zinc-500 hover:text-indigo-500'
            }`}
          >
            {isRtl ? 'التقارير' : 'Reports'}
          </button>
          <button 
            onClick={() => setActiveTab('certificates')}
            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === 'certificates' 
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' 
                : 'text-zinc-500 hover:text-indigo-500'
            }`}
          >
            {isRtl ? 'الشهادات' : 'Certificates'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'reports' ? (
          <motion.div 
            key="reports-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <button 
                  onClick={() => generateReport('user', { userId: user?.id })} 
                  disabled={generating !== null || !user} 
                  className="p-6 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] hover:border-indigo-500 hover:shadow-xl transition-all text-right flex flex-col gap-4 group"
               >
                 <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                   <FileText size={20} />
                 </div>
                 <div>
                   <h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">{isRtl ? 'تقرير الأثر الشخصي' : 'Personal Impact Report'}</h3>
                   <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{isRtl ? 'توليد تلقائي' : 'Auto Generate'}</p>
                 </div>
                 {generating === 'user' && <Loader2 size={16} className="animate-spin text-indigo-500" />}
               </button>
               
               <button onClick={() => generateReport('country', {})} disabled={generating !== null} className="p-6 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] hover:border-indigo-500 hover:shadow-xl transition-all text-right flex flex-col gap-4 group">
                 <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                   <Globe size={20} />
                 </div>
                 <div>
                   <h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">{isRtl ? 'تقرير الدولة الإجمالي' : 'National Total Report'}</h3>
                   <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{isRtl ? 'إحصائيات 2026' : '2026 Statistics'}</p>
                 </div>
                 {generating === 'country' && <Loader2 size={16} className="animate-spin text-indigo-500" />}
               </button>

               <button onClick={() => generateReport('sector', { sector: 'Energy' })} disabled={generating !== null} className="p-6 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] hover:border-indigo-500 hover:shadow-xl transition-all text-right flex flex-col gap-4 group">
                 <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                   <Table size={20} />
                 </div>
                 <div>
                   <h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">{isRtl ? 'تحليل القطاعات' : 'Sector Analysis'}</h3>
                   <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{isRtl ? 'الطاقة والنقل' : 'Energy & Transport'}</p>
                 </div>
                 {generating === 'sector' && <Loader2 size={16} className="animate-spin text-indigo-500" />}
               </button>

               <button onClick={() => generateReport('governorate', {})} disabled={generating !== null} className="p-6 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] hover:border-indigo-500 hover:shadow-xl transition-all text-right flex flex-col gap-4 group">
                 <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                   <Landmark size={20} />
                 </div>
                 <div>
                   <h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">{isRtl ? 'تصنيف المحافظات' : 'Gov Ranking'}</h3>
                   <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{isRtl ? 'الأداء البيئي' : 'Eco Performance'}</p>
                 </div>
                 {generating === 'governorate' && <Loader2 size={16} className="animate-spin text-indigo-500" />}
               </button>
            </div>

            {/* Archive Section */}
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/20 dark:shadow-none">
              <div className="p-8 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-zinc-50/50 dark:bg-transparent">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <Calendar className="text-indigo-500" />
                    {isRtl ? 'أرشيف التقارير (متزامن مع Supabase)' : 'Reports Archive (Supabase Synced)'}
                  </h2>
                  <p className="text-xs text-zinc-400 font-bold mt-1 uppercase tracking-widest">{isRtl ? 'السجلات الرسمية المحفوظة' : 'Stored Official Records'}</p>
                </div>
                {loading && <Loader2 className="animate-spin text-indigo-500" />}
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((r, i) => (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     key={r.id || i} 
                     className="p-6 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-[2.5rem] flex flex-col gap-4 transition-all hover:border-indigo-500 hover:shadow-lg relative overflow-hidden"
                   >
                     <div className="flex justify-between items-start relative z-10">
                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                           r.type === 'user' ? 'bg-indigo-50 border-indigo-100 text-indigo-500' :
                           r.type === 'country' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' :
                           'bg-amber-50 border-amber-100 text-amber-500'
                        }`}>
                          {r.type}
                        </div>
                        <span className="text-[10px] font-black text-zinc-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg tabular-nums">
                          {r.month}/{r.year}
                        </span>
                     </div>
                     
                     <div className="relative z-10">
                       <h3 className="text-lg font-black text-slate-900 dark:text-white capitalize leading-tight">
                         {isRtl ? `${r.type === 'user' ? 'تقريرك' : r.type} - ملخص` : `${r.type} Report - Summary`}
                       </h3>
                       <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-black mt-2">
                         {isRtl ? 'تاريخ الحفظ:' : 'Archived:'} {new Date(r.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                       </p>
                     </div>
                     
                     <div className="flex gap-2 mt-2 relative z-10">
                       <button className="flex-1 py-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-500 border border-red-100 dark:border-red-500/30 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-colors">
                         <FileDown size={14} /> PDF
                       </button>
                       <button className="flex-1 py-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-500 border border-emerald-100 dark:border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-colors">
                         <Table size={14} /> EXCEL
                       </button>
                     </div>
                   </motion.div>
                ))}

                {!loading && reports.length === 0 && (
                  <div className="col-span-full p-20 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[3rem] bg-slate-50/50">
                    <FileText className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4 opacity-50" />
                    <p className="text-zinc-500 font-black text-xl dark:text-zinc-400">
                      {isRtl ? 'الأرشيف فارغ حالياً' : 'Archive is currently empty'}
                    </p>
                    <p className="text-sm text-zinc-400 font-bold mt-2 max-w-sm mx-auto">
                      {isRtl ? 'سيتم ربط أي تقارير جديدة ببياناتك في Supabase تلقائياً.' : 'Any generated reports will be synced with Supabase automatically.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="certificates-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
             {/* Certificate Hero */}
             <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
                <Globe className="absolute -top-20 -right-20 w-80 h-80 opacity-10 group-hover:rotate-12 transition-transform duration-1000" />
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest mb-6">
                    <Award size={16} className="text-yellow-400" />
                    {isRtl ? 'شهادة الأثر البيئي 2026' : 'Eco-Impact Certificate 2026'}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
                    {isRtl ? 'شهادتك الموثقة بانتظارك!' : 'Your Digital Certificate is Ready!'}
                  </h2>
                  <p className="text-indigo-100 font-bold text-lg mb-8 opacity-90 leading-relaxed">
                    {isRtl ? 'لقد ساهمت في تقليل انبعاثات الكربون بمقدار ملحوظ. احصل على شهادتك الرسمية الموقعة من وزارة البيئة و MoEco.' : 'You have significantly contributed to carbon reduction. Access your official certificate signed by the Ministry of Environment & MoEco.'}
                  </p>
                  <button 
                    onClick={() => setShowCert(!showCert)}
                    className="px-8 py-4 bg-white text-indigo-600 rounded-[2rem] font-black flex items-center gap-3 hover:scale-105 transition-all shadow-xl"
                  >
                    {showCert ? (isRtl ? 'إخفاء الشهادة' : 'Hide Certificate') : (isRtl ? 'عرض وتحميل الشهادة' : 'View & Download Certificate')}
                    <ChevronRight className={`transition-transform ${showCert ? 'rotate-90' : (isRtl ? 'rotate-180' : '')}`} />
                  </button>
                </div>
             </div>

             {/* Certificate Viewer */}
             <AnimatePresence>
                {showCert && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-slate-50 dark:bg-white/5 rounded-[3rem] p-4 md:p-12 border border-slate-200 dark:border-white/10">
                      <Certificate 
                        userName={user?.full_name} 
                        score={userStats?.totalCO2 || 0} 
                        rank={user?.level > 10 ? 'Elite Eco Hero' : 'Eco Guardian'} 
                      />
                    </div>
                  </motion.div>
                )}
             </AnimatePresence>

             {/* Certificate Stats List */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="p-8 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] flex gap-6 items-center">
                 <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center text-emerald-600">
                   <ShieldCheck size={32} />
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{isRtl ? 'توثيق رسمي' : 'Verified Status'}</h3>
                   <p className="text-zinc-500 font-bold">{isRtl ? 'مرتبط ببيانات Supabase' : 'Directly linked to Supabase data'}</p>
                 </div>
               </div>
               <div className="p-8 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] flex gap-6 items-center">
                 <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-[1.5rem] flex items-center justify-center text-indigo-600">
                   <Globe size={32} />
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{isRtl ? 'مساهمة وطنية' : 'National Contribution'}</h3>
                   <p className="text-zinc-500 font-bold">{isRtl ? 'معترف بها في COP2026' : 'Recognized at COP2026'}</p>
                 </div>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
