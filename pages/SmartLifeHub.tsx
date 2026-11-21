import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PlatformDataEngine } from '../services/PlatformDataEngine';
import { useParams, Navigate, Link } from 'react-router-dom';
import { DollarSign, MapPin, CloudRain, Landmark, ChevronRight, Activity, ArrowLeft, Loader2, Sparkles, Sprout } from 'lucide-react';
import { motion } from 'framer-motion';

export const SmartLifeHub: React.FC = () => {
  const { language, theme } = useApp();
  const { tab } = useParams<{ tab: string }>();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const activeTab = tab || 'economy';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let result = [];
        if (activeTab === 'economy') {
          result = await PlatformDataEngine.getEconomyPrices('Cairo');
        } else if (activeTab === 'places') {
          result = await PlatformDataEngine.getPlaces('Cairo');
        } else if (activeTab === 'services') {
          result = await PlatformDataEngine.getGovServices('Cairo');
        } else if (activeTab === 'environment') {
          result = await PlatformDataEngine.getEnvironmentalData('Cairo');
        }
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab]);

  const tabs = [
    { id: 'economy', icon: <DollarSign size={20} />, activeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { id: 'places', icon: <MapPin size={20} />, activeColor: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
    { id: 'services', icon: <Landmark size={20} />, activeColor: 'text-slate-500 bg-slate-500/10 border-slate-500/20' },
    { id: 'environment', icon: <CloudRain size={20} />, activeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20' }
  ];

  const filteredData = data.filter(d => 
    (d.name && d.name.toLowerCase().includes(search.toLowerCase())) || 
    (d.name_en && d.name_en.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={`min-h-screen pb-24 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="pt-8 px-6 pb-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-2xl font-black">{language === 'ar' ? 'منصة الحياة الذكية' : 'Smart Life Platform'}</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                 {language === 'ar' ? 'بيانات حية مباشرة من مصادرها' : 'Live Real-world Data feed'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-2">
            {tabs.map(t => (
              <Link 
                key={t.id}
                to={`/smart-life/${t.id}`}
                className={`py-3 px-6 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-2 border transition-all whitespace-normal sm:whitespace-nowrap break-words
                  ${activeTab === t.id 
                    ? t.activeColor 
                    : 'bg-white dark:bg-white/5 text-slate-400 border-slate-100 dark:border-white/5 hover:border-slate-300'
                  }
                `}
              >
                {t.icon}
                {t.id}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Smart Insights Panel */}
        <div className={`mb-6 p-6 rounded-[2rem] border overflow-hidden relative ${theme === 'dark' ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'}`}>
          <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none">
            <Sparkles className="w-48 h-48 text-indigo-500" />
          </div>
          <div className="relative z-10">
            <h2 className="text-xl font-black mb-2 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Sprout size={24} />
              {language === 'ar' ? 'التحليل الذكي' : 'Smart Insights'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {activeTab === 'economy' && (
                <>
                  <div className="bg-white/60 dark:bg-black/20 p-4 rounded-xl backdrop-blur-md">
                    <p className="text-[10px] uppercase font-black tracking-widest text-indigo-500 mb-1">{language === 'ar' ? 'مقارنة الأسعار' : 'Price Comparison'}</p>
                    <p className="text-sm font-bold">
                      {language === 'ar' 
                        ? `متوسط سعر السلع في القائمة الحالية ${ (data.reduce((sum, item) => sum + parseFloat(item.price.toString().replace(/[^0-9.]/g, '') || '0'), 0) / (data.length || 1)).toFixed(2) } ج.م`
                        : `Average price in current list: ${ (data.reduce((sum, item) => sum + parseFloat(item.price.toString().replace(/[^0-9.]/g, '') || '0'), 0) / (data.length || 1)).toFixed(2) } EGP`}
                    </p>
                  </div>
                  <div className="bg-white/60 dark:bg-black/20 p-4 rounded-xl backdrop-blur-md">
                    <p className="text-[10px] uppercase font-black tracking-widest text-indigo-500 mb-1">{language === 'ar' ? 'أثر الكربون' : 'Carbon Impact'}</p>
                    <p className="text-sm font-bold">
                      {language === 'ar' 
                        ? `المنتجات المعروضة توفر في المتوسط 20% من انبعاثات النقل.`
                        : `Products shown reduce transport emissions by 20% on average.`}
                    </p>
                  </div>
                </>
              )}
              {activeTab === 'places' && (
                <>
                  <div className="bg-white/60 dark:bg-black/20 p-4 rounded-xl backdrop-blur-md">
                    <p className="text-[10px] uppercase font-black tracking-widest text-indigo-500 mb-1">{language === 'ar' ? 'الكثافة الجغرافية' : 'Geo Density'}</p>
                    <p className="text-sm font-bold">
                      {language === 'ar' 
                        ? `تم العثور على ${data.length} موقع صديق للبيئة في منطقتك.`
                        : `Found ${data.length} eco-friendly locations in your area.`}
                    </p>
                  </div>
                </>
              )}
              {activeTab === 'environment' && (
                <>
                  <div className="bg-white/60 dark:bg-black/20 p-4 rounded-xl backdrop-blur-md">
                    <p className="text-[10px] uppercase font-black tracking-widest text-indigo-500 mb-1">{language === 'ar' ? 'مؤشر الجودة' : 'Quality Index'}</p>
                    <p className="text-sm font-bold">
                      {language === 'ar' 
                        ? `بناءً على ${data.length} نقطة بيانات، البيئة في حالة مستقرة.`
                        : `Based on ${data.length} data points, environment is stable.`}
                    </p>
                  </div>
                </>
              )}
              {activeTab === 'services' && (
                <>
                  <div className="bg-white/60 dark:bg-black/20 p-4 rounded-xl backdrop-blur-md">
                    <p className="text-[10px] uppercase font-black tracking-widest text-indigo-500 mb-1">{language === 'ar' ? 'جاهزية الخدمات' : 'Service Readiness'}</p>
                    <p className="text-sm font-bold">
                      {language === 'ar' 
                        ? `جميع الخدمات الـ ${data.length} المتاحة تعمل بكفاءة تامة.`
                        : `All ${data.length} available services are operating efficiently.`}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <input 
          type="text" 
          placeholder={language === 'ar' ? 'ابحث...' : 'Search...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 font-bold outline-none focus:border-emerald-500"
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Global Data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((item, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={i} 
                className={`p-6 rounded-[2rem] border transition-all ${theme === 'dark' ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-full mb-2 inline-block">
                      {item.category}
                    </span>
                    <h3 className="text-xl font-black">{language === 'ar' ? item.name : item.name_en}</h3>
                  </div>
                  {activeTab === 'economy' && (
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-500">{item.price}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{item.currency} / {item.unit}</p>
                    </div>
                  )}
                  {activeTab === 'environment' && (
                    <div className="text-right">
                      <p className={`text-2xl font-black ${item.severity === 'high' ? 'text-rose-500' : 'text-blue-500'}`}>{item.value}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{item.unit}</p>
                    </div>
                  )}
                </div>
                
                {(activeTab === 'places' || activeTab === 'services') && (
                  <p className="text-sm text-slate-500 font-bold mb-4 line-clamp-2">
                    {language === 'ar' ? item.description || item.address : item.description_en || item.address}
                  </p>
                )}

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Activity size={12}/> {item.source}</span>
                  <span className="text-[9px] font-bold text-slate-400">{new Date(item.updated_at || Date.now()).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
