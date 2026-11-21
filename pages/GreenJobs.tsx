
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, DollarSign, Clock, Building2, Search, Filter, ArrowRight, CheckCircle2, Globe, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';

const GreenJobs: React.FC = () => {
  const { language, theme, user } = useApp();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
    
    const channel = supabase
      .channel('public:green_jobs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'green_jobs' }, 
        (payload) => {
           setJobs((prev) => [payload.new, ...prev]);
           notificationService.info(language === 'ar' ? 'وظيفة خضراء جديدة أضيفت!' : 'New green job posted!');
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [language]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // 1. Fetch from Supabase
      const data = await storageService.getGreenJobs();
      let mergedJobs = data || [];

      // 2. Fetch from Arbeitnow (External Free API)
      try {
         const response = await fetch('https://www.arbeitnow.com/api/job-board-api');
         if (response.ok) {
           const arbeitnowData = await response.json();
           const externalJobs = (arbeitnowData.data || [])
             .filter((job: any) => 
               job.title.toLowerCase().includes('green') || 
               job.title.toLowerCase().includes('environment') ||
               job.title.toLowerCase().includes('sustainability') ||
               job.title.toLowerCase().includes('energy') ||
               job.title.toLowerCase().includes('solar')
             )
             .slice(0, 5)
             .map((job: any) => ({
               id: job.slug || String(Math.random()),
               title_en: job.title,
               title_ar: job.title,
               company_en: job.company_name,
               company_ar: job.company_name,
               location_en: job.location,
               location_ar: job.location,
               job_type: job.remote ? 'Remote' : 'On-site',
               salary_range: 'N/A',
               is_external: true,
               apply_url: job.url
             }));
           mergedJobs = [...mergedJobs, ...externalJobs];
         }
      } catch (err) {
         console.warn("Could not fetch external jobs from Arbeitnow", err);
      }

      setJobs(mergedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (job: any) => {
    if (job.is_external && job.apply_url) {
       window.open(job.apply_url, '_blank');
       return;
    }
    try {
      await storageService.applyToJob(job.id);
      notificationService.success(language === 'ar' ? 'تم تقديم الطلب بنجاح' : 'Application submitted successfully');
    } catch (error) {
      console.error("Apply error:", error);
      notificationService.error(language === 'ar' ? 'فشل تقديم الطلب' : 'Failed to apply');
    }
  };

  const [matchedJobs, setMatchedJobs] = useState<any[]>([]);

  useEffect(() => {
    if (jobs.length > 0 && user) {
      // AI-Free Matching Logic based on user's interests or role
      const matches = jobs.filter(j => 
        (j.title_en || '').toLowerCase().includes((user.role || 'citizen').toLowerCase()) ||
        (j.category || '').toLowerCase().includes((user.tier || '').toLowerCase())
      ).slice(0, 3);
      setMatchedJobs(matches);
    }
  }, [jobs, user]);

  return (
    <div className="space-y-10 pb-32" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-6 bg-blue-500 rounded-[2rem] shadow-2xl shadow-blue-500/20">
            <Briefcase className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-egypt-black dark:text-white font-arabic flex items-center gap-4">
              {language === 'ar' ? 'وظائف خضراء' : 'Green Jobs'}
              <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-black uppercase">Sovereign</span>
            </h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
              {language === 'ar' ? 'ابحث عن مستقبلك في الاقتصاد الأخضر' : 'System-Synced Recruitment Discovery'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl group transition-all hover:bg-emerald-500 hover:text-white">
          <ShieldCheck className="w-6 h-6 text-emerald-500 group-hover:text-white" />
          <span className="text-xs font-black text-emerald-500 uppercase tracking-widest group-hover:text-white">Verified by MoEco Tech</span>
        </div>
      </div>

      {/* SMART MATCHMAKER */}
      {matchedJobs.length > 0 && (
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="p-8 bg-gradient-to-br from-indigo-900 to-blue-900 rounded-[3.5rem] border border-white/10 text-white relative overflow-hidden shadow-2xl"
         >
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[100px] -translate-y-1/2 translate-x-1/2" />
           <div className="relative z-10">
             <div className="flex bg-white/10 w-fit px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 mb-6 items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">{language === 'ar' ? 'مطابقة ذكية' : 'ECO-SMART MATCH'}</span>
             </div>
             <h2 className="text-3xl font-black mb-10">{language === 'ar' ? 'وظائف تناسب مهاراتك' : 'Top Opportunities for You'}</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {matchedJobs.map((j, idx) => (
                  <div key={idx} className="p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md hover:bg-white/10 transition-all cursor-pointer group" onClick={() => handleApply(j)}>
                    <Building2 className="w-8 h-8 text-emerald-400 mb-4 group-hover:rotate-12 transition-transform" />
                    <h4 className="font-black text-sm mb-2 line-clamp-2">{language === 'ar' ? j.title_ar : j.title_en}</h4>
                    <p className="text-[10px] font-bold opacity-60 uppercase">{language === 'ar' ? j.company_ar : j.company_en}</p>
                  </div>
                ))}
             </div>
           </div>
         </motion.div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-zinc-100 dark:bg-white/5 rounded-[3rem] animate-pulse" />
          ))
        ) : jobs.length > 0 ? (
          jobs.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-[3rem] border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-8 ${theme === 'dark' ? 'bg-egypt-black border-white/5' : 'bg-white border-stone-100'}`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8 flex-1">
                <div className="w-20 h-20 bg-zinc-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center text-zinc-400 shrink-0">
                  <Building2 className="w-10 h-10" />
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black font-arabic dark:text-white">{language === 'ar' ? job.title_ar : job.title_en}</h3>
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[8px] font-black uppercase tracking-widest">{job.job_type || 'Full-time'}</span>
                    {job.is_external && <span className="px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><Globe size={10}/> External</span>}
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                      <Building2 className="w-4 h-4 text-egypt-gold" />
                      {language === 'ar' ? job.company_ar : job.company_en}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                      <MapPin className="w-4 h-4 text-egypt-red" />
                      {language === 'ar' ? job.location_ar : job.location_en}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      {job.salary_range || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <button 
                  onClick={() => handleApply(job)}
                  className="flex-1 md:flex-none px-8 py-4 bg-egypt-black dark:bg-white text-white dark:text-egypt-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-egypt-gold hover:text-black transition-all"
                >
                  {language === 'ar' ? 'قدم الآن' : 'Apply Now'}
                </button>
                <button className="p-4 bg-zinc-100 dark:bg-white/5 rounded-2xl text-zinc-400 hover:text-egypt-gold transition-all">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center text-zinc-500 font-black uppercase tracking-widest border-2 border-dashed border-zinc-200 dark:border-white/5 rounded-3xl">No green jobs available</div>
        )}
      </div>

    </div>
  );
};

export default GreenJobs;
