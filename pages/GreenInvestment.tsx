
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Leaf, ArrowRight, ShieldCheck, ExternalLink, Loader2, Zap, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { smartAiService } from '../services/smartAiService';

const GreenInvestment: React.FC = () => {
  const { language, theme, user } = useApp();
  const isRtl = language === 'ar';
  const [isInvesting, setIsInvesting] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalInvested: 0, totalCO2Offset: 0, projectCount: 0 });
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyAiInsight, setDailyAiInsight] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, projectsData] = await Promise.all([
          storageService.getInvestmentStats(),
          storageService.getInvestmentProjects()
        ]);
        
        setStats(statsData);
        if (projectsData && projectsData.length > 0) {
          setProjects(projectsData);
        }

        // Fetch AI Insight
        const insight = await smartAiService.generateDailyContent('investment', language as any);
        setDailyAiInsight(insight);
      } catch (error) {
        console.error('Error fetching investment data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [language]);

  const handleInvest = async (project: any) => {
    if (!user) {
      notificationService.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      return;
    }

    // Virtual investment amount (e.g., 10% of minInvest in coins)
    const minInvestValue = typeof project.minInvest === 'string' 
      ? parseInt(project.minInvest.replace(/[^0-9]/g, '')) 
      : project.min_invest || 1000;
    
    const amount = minInvestValue * 0.1;

    setIsInvesting(project.id);
    try {
      await storageService.investInProject({
        projectId: project.id,
        amount: amount,
        projectTitle: isRtl ? (project.title?.ar || project.name_ar) : (project.title?.en || project.name_en)
      });
      
      // Refresh stats
      const newStats = await storageService.getInvestmentStats();
      setStats(newStats);
      
      notificationService.success(isRtl 
        ? `تم الاستثمار في ${project.title?.ar || project.name_ar} بنجاح!` 
        : `Successfully invested in ${project.title?.en || project.name_en}!`);
    } catch (error: any) {
      notificationService.error(error.message || (isRtl ? 'فشل الاستثمار' : 'Investment failed'));
    } finally {
      setIsInvesting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-egypt-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-6 bg-egypt-gold text-egypt-black rounded-[2rem] shadow-2xl">
            <DollarSign className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-egypt-black font-arabic flex items-center gap-3">
              {isRtl ? 'مركز الاستثمار الأخضر' : 'Green Investment Hub'}
              <span className="bg-egypt-black text-egypt-gold px-2 py-0.5 rounded text-[8px] font-black">OFFICIAL</span>
            </h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{isRtl ? 'استثمر أموالك في مستقبل الكوكب' : 'Invest your money in the planet\'s future'}</p>
          </div>
        </div>

        <div className="flex gap-4">
           {user?.role === 'admin' && (
             <button 
               onClick={() => setShowAddModal(true)}
               className="px-6 py-3 bg-egypt-gold text-black rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
             >
               <Plus className="w-4 h-4" />
               {isRtl ? 'إضافة مشروع' : 'Add Project'}
             </button>
           )}
           <div className="p-4 bg-white border border-egypt-gold/20 rounded-2xl shadow-sm text-center">
              <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Invested</p>
              <h4 className="text-xl font-black text-egypt-black">{stats.totalInvested.toLocaleString()} <span className="text-[10px]">Coins</span></h4>
           </div>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 egyptian-card bg-egypt-black text-white border-egypt-gold/20 flex flex-col items-center text-center space-y-4">
           <TrendingUp className="w-8 h-8 text-egypt-gold" />
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Market Trend</p>
             <h4 className="text-2xl font-black text-egypt-gold">BULLISH</h4>
           </div>
        </div>
        <div className="p-8 egyptian-card flex flex-col items-center text-center space-y-4">
           <Leaf className="w-8 h-8 text-emerald-500" />
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total CO2 Offset</p>
             <h4 className="text-2xl font-black text-egypt-black">{stats.totalCO2Offset.toLocaleString()} t</h4>
           </div>
        </div>
        <div className="p-8 egyptian-card flex flex-col items-center text-center space-y-4">
           <ShieldCheck className="w-8 h-8 text-blue-500" />
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Verified Projects</p>
             <h4 className="text-2xl font-black text-egypt-black">{stats.projectCount}</h4>
           </div>
        </div>
      </div>

      {/* AI Daily Insight */}
      {dailyAiInsight && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-10 rounded-[4rem] border-2 border-dashed relative overflow-hidden ${theme === 'dark' ? 'bg-aeon-cyan/5 border-aeon-cyan/30' : 'bg-aeon-cyan/5 border-aeon-cyan/20'}`}
        >
          <div className="absolute top-0 right-0 p-8">
            <Zap className="w-16 h-16 text-aeon-cyan opacity-10 animate-pulse" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
            <div className="w-24 h-24 bg-aeon-cyan text-black rounded-[2rem] flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(0,245,255,0.3)]">
              <TrendingUp className="w-12 h-12" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1 bg-aeon-cyan text-black text-[10px] font-black rounded-full uppercase tracking-widest">
                  {isRtl ? 'تحليل السوق بالذكاء الاصطناعي' : 'AI Market Analysis'}
                </span>
              </div>
              <h2 className="text-2xl font-black">{dailyAiInsight.insight}</h2>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                <h4 className="text-egypt-gold font-black text-sm mb-2 uppercase tracking-widest">{isRtl ? 'فكرة مشروع مقترحة:' : 'Suggested Project Idea:'}</h4>
                <p className="text-lg font-bold leading-relaxed">{dailyAiInsight.project_idea}</p>
                <p className="text-xs text-emerald-500 font-black mt-4 uppercase tracking-widest">{isRtl ? 'الأثر المتوقع: ' : 'Potential Impact: '}{dailyAiInsight.potential_impact}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Projects List */}
      <div className="space-y-6">
        <h3 className="text-xl font-black font-arabic px-4">{isRtl ? 'فرص استثمارية متاحة' : 'Available Investment Opportunities'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p: any) => (
            <motion.div
              key={p.id}
              whileHover={{ y: -10 }}
              className="p-8 bg-white border border-egypt-gold/10 rounded-[3rem] shadow-xl flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="px-3 py-1 bg-egypt-gold/10 text-egypt-gold text-[8px] font-black rounded-full uppercase tracking-widest">
                    {p.category || p.type}
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-zinc-400 uppercase">Est. ROI</p>
                    <p className="text-lg font-black text-emerald-600">{p.roi || p.expected_roi || '12-15%'}</p>
                  </div>
                </div>
                <h4 className="text-xl font-black font-arabic mb-2 text-egypt-black">
                  {isRtl ? (p.title?.ar || p.name_ar) : (p.title?.en || p.name_en)}
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                  {isRtl ? (p.description?.ar || p.desc_ar) : (p.description?.en || p.desc_en)}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <div className="text-center flex-1 border-r border-zinc-200">
                    <p className="text-[8px] font-black text-zinc-400 uppercase">Min. Invest</p>
                    <p className="text-xs font-black text-egypt-black">{p.minInvest || p.min_invest || '5,000'} <span className="text-[8px]">EGP</span></p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-[8px] font-black text-zinc-400 uppercase">CO2 Offset</p>
                    <p className="text-xs font-black text-emerald-600">{p.co2Saved || p.co2_offset || '2.5t / year'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleInvest(p)}
                  disabled={isInvesting === p.id}
                  className="w-full py-4 bg-egypt-black text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all group disabled:opacity-50"
                >
                  {isInvesting === p.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {isRtl ? 'استثمر الآن' : 'Invest Now'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Carbon Offset Marketplace */}
      <div className="p-10 rounded-[4rem] bg-egypt-black text-white border border-egypt-gold/20 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
          <div className="max-w-md">
            <h3 className="text-3xl font-black font-arabic mb-4">{isRtl ? 'سوق تعويض الكربون' : 'Carbon Offset Marketplace'}</h3>
            <p className="text-sm text-white/60 leading-relaxed mb-6">
              {isRtl 
                ? 'قم بشراء أرصدة كربونية لتعويض بصمتك البيئية مباشرة عبر دعم مشاريع الطاقة المتجددة المعتمدة.' 
                : 'Purchase carbon credits to offset your environmental footprint directly by supporting certified renewable energy projects.'}
            </p>
            <div className="flex gap-4">
              <button className="px-8 py-4 bg-egypt-gold text-egypt-black font-black rounded-2xl shadow-xl flex items-center gap-2">
                {isRtl ? 'تصفح السوق' : 'Browse Market'} <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-10 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-md text-center">
            <p className="text-[10px] font-black text-egypt-gold uppercase tracking-widest mb-2">Current Price</p>
            <h4 className="text-5xl font-black tabular-nums text-white">24.50 <span className="text-sm">EGP / t</span></h4>
            <p className="text-[8px] text-white/40 mt-2 uppercase tracking-widest">Per Ton of CO2 Verified</p>
          </div>
        </div>
        <Leaf className="absolute top-[-40px] left-[-40px] w-64 h-64 text-egypt-gold/5 -rotate-45" />
      </div>
    </div>
  );
};

export default GreenInvestment;
