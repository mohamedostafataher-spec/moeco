
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { 
  BarChart3, PieChart, TrendingUp, Users, ShieldCheck, Zap, 
  Target, Rocket, Coins, Briefcase, Globe, ArrowUpRight, CheckCircle2, DollarSign 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { storageService } from '../services/storageService';

const InvestorHub: React.FC = () => {
  const { t, language, theme } = useApp();
  const [globalStats, setGlobalStats] = useState({ totalUsers: 0, totalCO2: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const stats = await storageService.getGlobalMetrics();
      setGlobalStats({
        totalUsers: stats.totalUsers || 0,
        totalCO2: stats.totalCO2Saved || 0
      });
      setLoading(false);
    };
    loadData();
  }, []);

  // Illustrative target scenario for the pitch — NOT actual onboarding data.
  const growthProjection = [
    { month: 'Month 1', users: 100 },
    { month: 'Month 3', users: 500 },
    { month: 'Month 6', users: 1500 },
    { month: 'Month 9', users: 4000 },
    { month: 'Month 12', users: 10000 },
  ];

  return (
    <div className={`max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-1000 ${theme === 'dark' ? 'text-emerald-100' : ''}`}>
      
      {/* Premium Investor Header */}
      <div className={`p-16 rounded-[4rem] text-white relative overflow-hidden transition-all duration-1000 ${
        theme === 'dark' ? 'bg-[#001a14] border border-emerald-400/20 shadow-2xl' : 'bg-emerald-950 shadow-2xl'
      }`}>
        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
             <span className="bg-emerald-400 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Real-time KPI Dashboard</span>
             <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-6xl font-black font-arabic mb-6 tracking-tighter leading-tight flex items-center gap-4">
            {language === 'ar' ? 'استثمر في السيادة البيئية القادمة' : 'Invest in Next-Gen Eco Sovereignty'}
            <span className="bg-emerald-400 text-black px-3 py-1 rounded-xl text-xs font-black">FREE</span>
          </h1>
          <p className="text-emerald-100/80 text-xl font-medium leading-relaxed mb-10">
            {language === 'ar' 
              ? 'تطبيق مو إيكو ليس مجرد أداة حسابية، بل هو محرك بيانات ضخم يربط السلوك الاستهلاكي بالعوائد الإعلانية المستدامة.'
              : 'MoEco is a massive data engine connecting green consumer behavior with sustainable ad-revenue streams.'}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/presentation" className="bg-emerald-400 text-black px-10 py-5 rounded-[2rem] font-black text-lg flex items-center gap-3 hover:scale-105 transition-transform shadow-2xl">
              <Briefcase className="w-6 h-6" />
              {language === 'ar' ? 'عرض الاستثمار' : 'View Pitch Deck'}
            </Link>
            <div className="bg-white/10 backdrop-blur-md px-8 py-5 rounded-[2rem] border border-white/10 flex flex-col justify-center">
               <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">{language === 'ar' ? 'مستخدمو التطبيق الآن' : 'Live App Users'}</p>
               <p className="text-2xl font-black tabular-nums">{globalStats.totalUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <Globe className="absolute top-[-40px] right-[-40px] w-full sm:w-96 h-96 opacity-10 rotate-12 animate-pulse" />
      </div>

      {/* Market Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {[
           { icon: TrendingUp, label: "Market Scalability", value: 'High', sub: 'Ready for Global Expansion' },
           { icon: Users, label: "Active User Base", value: String(globalStats.totalUsers), sub: 'Live count from the app' },
           { icon: Coins, label: "Eco-Economy Vol.", value: `${globalStats.totalCO2.toFixed(1)} kg`, sub: 'Real Impact Tracked' }
         ].map((item, i) => (
           <div key={i} className={`p-10 rounded-[3rem] border shadow-xl transition-all ${
             theme === 'dark' ? 'bg-[#000d0a] border-emerald-900/30' : 'bg-white border-stone-100'
           }`}>
             <item.icon className="w-10 h-10 text-emerald-500 mb-6" />
             <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">{item.label}</p>
             <h3 className="text-4xl font-black text-emerald-900 mb-2 tabular-nums">{item.value}</h3>
             <p className="text-xs font-bold text-stone-500">{item.sub}</p>
           </div>
         ))}
      </div>

      {/* Real Data Projection */}
      <div className={`p-12 rounded-[4rem] border shadow-sm flex flex-col lg:flex-row gap-16 transition-all ${
        theme === 'dark' ? 'bg-[#00120f] border-emerald-900/30' : 'bg-white border-stone-100'
      }`}>
        <div className="flex-1 space-y-8">
           <h2 className="text-4xl font-black font-arabic text-emerald-950">
             {language === 'ar' ? 'تحليل النمو السحابي' : 'Cloud Growth Analytics'}
           </h2>
           <div className="space-y-6">
             <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
                <p className="text-stone-500 text-sm leading-relaxed">
                  {language === 'ar' 
                    ? 'يعتمد نموذج التمويل المستدام لدينا على المساهمات من خلال الإعلانات داخل التطبيق (Rewarded Ads)، ونستهدف متوسط عائد قدره 1.5 دولار شهرياً لكل مستخدم نشط لدعم البيئة.'
                    : 'Our sustainable funding model relies on Rewarded Ads, targeting an average of $1.5/month per active user for environmental support.'}
                </p>
             </div>
             <div className="flex gap-4 items-center p-4 bg-emerald-50 rounded-2xl">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <span className="font-black text-emerald-900 text-sm">{language === 'ar' ? 'بيانات مباشرة من التطبيق' : 'Live data from the app'}</span>
             </div>
           </div>
        </div>

        <div className="flex-1 h-[300px] sm:h-[400px]">
           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">{language === 'ar' ? 'سيناريو النمو المستهدف' : 'Target Growth Scenario'}</p>
           <p className="text-[10px] font-bold text-stone-400 mb-6">{language === 'ar' ? 'توقع توضيحي للعرض الاستثماري — ليس بيانات فعلية' : 'Illustrative projection for the pitch, not actual data'}</p>
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthProjection}>
                <defs>
                   <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 10}} />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#10b981" strokeWidth={5} fillOpacity={1} fill="url(#colorGrowth)" />
              </AreaChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default InvestorHub;
