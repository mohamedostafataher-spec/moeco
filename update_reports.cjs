const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { supabase } from '../services/supabaseClient';
import { FileText, Download, Calendar, ArrowRight, Table, Globe, Landmark, Loader2, FileDown } from 'lucide-react';
import { notificationService } from '../services/notificationService';

const Reports: React.FC = () => {
  const { language, theme, user } = useApp();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase.from('reports').select('*').order('created_at', { ascending: false });
      if (user?.role !== 'admin') {
         query = query.or(\`type.eq.country,type.eq.sector,type.eq.governorate,and(type.eq.user,reference_id.eq.\${user?.id})\`);
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

  useEffect(() => {
    fetchReports();
  }, [user]);

  const generateReport = async (type: string, payload: any) => {
    if (generating) return;
    setGenerating(type);
    try {
      const res = await fetch(\`/api/reports/generate/\${type}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to generate");
      notificationService.success(language === 'ar' ? 'تم إنشاء التقرير بنجاح' : 'Report generated successfully');
      fetchReports();
    } catch(e) {
      notificationService.error(language === 'ar' ? 'فشل إنشاء التقرير' : 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 px-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-6 mb-8 pt-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-500 text-white rounded-[2rem] shadow-lg shadow-indigo-500/20">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white font-arabic tracking-tight">{language === 'ar' ? 'نظام التقارير الذكي' : 'Smart Reporting System'}</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-bold font-arabic">{language === 'ar' ? 'التقارير الرسمية للإحصائيات والانبعاثات' : 'Official reports for statistics and emissions'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <button onClick={() => generateReport('user', { userId: user?.id })} disabled={generating !== null || !user} className="p-6 bg-indigo-50/50 dark:bg-white/5 border border-indigo-100 dark:border-white/10 rounded-[2rem] hover:bg-indigo-50 dark:hover:bg-white/10 transition-colors text-left flex flex-col gap-4">
           <FileText size={24} className="text-indigo-500 dark:text-indigo-400" />
           <div><h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">{language === 'ar' ? 'تقرير شخصي' : 'Personal Report'}</h3><p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{language === 'ar' ? 'شهري' : 'Monthly'}</p></div>
           {generating === 'user' && <Loader2 size={16} className="animate-spin text-indigo-500" />}
         </button>
         
         <button onClick={() => generateReport('country', {})} disabled={generating !== null} className="p-6 bg-indigo-50/50 dark:bg-white/5 border border-indigo-100 dark:border-white/10 rounded-[2rem] hover:bg-indigo-50 dark:hover:bg-white/10 transition-colors text-left flex flex-col gap-4">
           <Globe size={24} className="text-indigo-500 dark:text-indigo-400" />
           <div><h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">{language === 'ar' ? 'تقرير الدولة' : 'Country Report'}</h3><p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{language === 'ar' ? 'إجمالي' : 'Total'}</p></div>
           {generating === 'country' && <Loader2 size={16} className="animate-spin text-indigo-500" />}
         </button>

         <button onClick={() => generateReport('sector', { sector: 'Energy' })} disabled={generating !== null} className="p-6 bg-indigo-50/50 dark:bg-white/5 border border-indigo-100 dark:border-white/10 rounded-[2rem] hover:bg-indigo-50 dark:hover:bg-white/10 transition-colors text-left flex flex-col gap-4">
           <Table size={24} className="text-indigo-500 dark:text-indigo-400" />
           <div><h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">{language === 'ar' ? 'تقرير القطاعات' : 'Sector Report'}</h3><p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{language === 'ar' ? 'قطاع الطاقة' : 'Energy Sector'}</p></div>
           {generating === 'sector' && <Loader2 size={16} className="animate-spin text-indigo-500" />}
         </button>

         <button onClick={() => generateReport('governorate', {})} disabled={generating !== null} className="p-6 bg-indigo-50/50 dark:bg-white/5 border border-indigo-100 dark:border-white/10 rounded-[2rem] hover:bg-indigo-50 dark:hover:bg-white/10 transition-colors text-left flex flex-col gap-4">
           <Landmark size={24} className="text-indigo-500 dark:text-indigo-400" />
           <div><h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">{language === 'ar' ? 'المحافظات' : 'Governorates'}</h3><p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{language === 'ar' ? 'ترتيب' : 'Ranking'}</p></div>
           {generating === 'governorate' && <Loader2 size={16} className="animate-spin text-indigo-500" />}
         </button>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="text-indigo-500" />
            {language === 'ar' ? 'أرشيف التقارير (قاعدة البيانات)' : 'Reports Archive (Database)'}
          </h2>
        </div>
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/50 dark:bg-transparent">
          {reports.map((r, i) => (
             <div key={r.id || i} className="p-6 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-[2rem] flex flex-col gap-4 transition-all hover:border-indigo-500 hover:shadow-lg">
               <div className="flex justify-between items-start">
                  <div className="px-3 py-1.5 bg-indigo-50 dark:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-xl text-indigo-500 dark:text-zinc-300 border border-indigo-100 dark:border-transparent">
                    {r.type}
                  </div>
                  <span className="text-xs font-bold text-zinc-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg">{r.month}/{r.year}</span>
               </div>
               
               <h3 className="text-lg font-black text-slate-900 dark:text-white capitalize leading-tight">{r.type} Report - {r.reference_id === 'ALL' ? 'National' : 'Summary'}</h3>
               <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-black">{language === 'ar' ? 'تم الإنشاء:' : 'Created:'} {new Date(r.created_at).toLocaleDateString()}</p>
               
               <div className="flex gap-2 mt-2">
                 <a href={r.file_url_pdf} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-500 border border-red-100 dark:border-red-500/30 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-colors hover:bg-red-100">
                   <FileDown size={16} /> PDF
                 </a>
                 <a href={r.file_url_excel} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-500 border border-emerald-100 dark:border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-colors hover:bg-emerald-100">
                   <Table size={16} /> Excel
                 </a>
               </div>
             </div>
          ))}
          {!loading && reports.length === 0 && (
            <div className="col-span-full p-16 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[3rem]">
              <FileText className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500 font-bold text-lg dark:text-zinc-400">
                {language === 'ar' ? 'لا توجد تقارير بنظام قاعدة البيانات بعد.' : 'No database reports found.'}
              </p>
              <p className="text-sm text-zinc-400 font-medium mt-2 max-w-md mx-auto">
                {language === 'ar' ? 'استخدم الأزرار بالأعلى لإنشاء تقاريرك الأولى وحفظها في التخزين السحابي.' : 'Use the buttons above to generate your first reports and store them in the cloud.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
`;

fs.writeFileSync('pages/Reports.tsx', content);
