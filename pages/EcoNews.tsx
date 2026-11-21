import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Newspaper, Globe, TrendingUp, Search, ExternalLink, RefreshCw, 
  Clock, ShieldCheck, Zap, Radio, Heart, Anchor, X, Volume2, Share2, 
  ChevronRight, ArrowUpRight, Activity, MapPin, Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { useAccessibility } from '../context/AccessibilityContext';

const EcoNews: React.FC = () => {
  const { language, isRtl } = useApp();
  const { speak } = useAccessibility();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fetchNews = async (forceSync = false) => {
    if (forceSync) setRefreshing(true);
    else setLoading(true);
    
    try {
      const { newsService } = await import('../services/newsService');
      const { articles } = await newsService.fetchEcoNews(activeCategory === 'all' ? 'all' : activeCategory, forceSync);
      setNews(articles);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [activeCategory]);

  const filteredNews = news.filter(item => 
    (item.title + ' ' + (item.description || '')).toLowerCase().includes(searchQuery.toLowerCase()) &&
    (activeCategory === 'all' || item.category === activeCategory)
  );

  const categories = [
    { id: 'all', label: isRtl ? 'الكل' : 'All', icon: Globe },
    { id: 'environment', label: isRtl ? 'البيئة' : 'Environment', icon: Zap },
    { id: 'climate', label: isRtl ? 'المناخ' : 'Climate', icon: Activity },
    { id: 'technology', label: isRtl ? 'التقنية' : 'Tech', icon: Radio },
    { id: 'economy', label: isRtl ? 'الاقتصاد' : 'Economy', icon: TrendingUp }
  ];

  const renderText = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return val[language] || val.ar || val.en || JSON.stringify(val);
    return String(val);
  };

  const handleSpeak = (text: any) => {
    const finalStr = renderText(text);
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); } 
    else { speak(finalStr); setIsSpeaking(true); }
  };

  const breakingNews = news.slice(0, 5);

  return (
    <div className="min-h-screen pb-32 space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. BREAKING NEWS TICKER */}
      <div className="bg-slate-900 overflow-hidden py-3 border-y border-white/5 relative">
         <motion.div 
           animate={{ x: isRtl ? [0, 1000] : [0, -1000] }}
           transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
           className="flex items-center gap-12 whitespace-nowrap px-10"
         >
            {breakingNews.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                 <span className="w-2 h-2 rounded-full bg-eco-green animate-pulse" />
                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{isRtl ? 'عاجل' : 'Breaking'}</span>
                 <span className="text-xs font-bold text-white/80">{renderText(item.title)}</span>
              </div>
            ))}
         </motion.div>
      </div>

      {/* 2. HERO HEADER */}
      <div className="relative bg-slate-900 rounded-3xl md:rounded-[3rem] p-6 md:p-12 overflow-hidden shadow-2xl mx-4 mt-2">
         <div className="egyptian-pattern absolute inset-0 opacity-[0.05]" />
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-10">
            <div className="space-y-3 md:space-y-4">
               <div className="inline-flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 bg-eco-green/10 rounded-full border border-eco-green/20">
                  <Activity size={14} className="text-eco-green animate-pulse" />
                  <span className="text-[9px] md:text-[10px] font-black text-eco-green uppercase tracking-widest">{isRtl ? 'بث بيئي مباشر' : 'Live Eco Pulse'}</span>
               </div>
               <h1 className="text-3xl md:text-6xl font-black text-white italic tracking-tighter">
                  {isRtl ? 'الأخبار البيئية' : 'Eco Intelligence'} <span className="text-eco-green">{isRtl ? 'الذكية' : 'News'}</span>
               </h1>
               <p className="text-sm md:text-base text-slate-400 font-bold max-w-lg">{isRtl ? 'تغطية فورية للتحولات البيئية والمبادرات الخضراء المبتكرة في مصر والعالم.' : 'Instant coverage of environmental shifts and innovative green initiatives in Egypt and worldwide.'}</p>
            </div>
            <button onClick={() => fetchNews(true)} className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl md:rounded-[2rem] flex items-center justify-center text-slate-900 hover:bg-eco-green hover:text-white transition-all shadow-xl hover:rotate-180">
               <RefreshCw className={refreshing ? 'animate-spin' : ''} />
            </button>
         </div>
      </div>

      <div className="px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
         {/* 2. SIDEBAR FILTER */}
         <aside className="lg:col-span-3 space-y-4 md:space-y-8">
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-xl">
               <div className="relative mb-6 md:mb-8">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    placeholder={isRtl ? 'ابحث في الأخبار...' : 'Search news...'}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 rounded-2xl py-4 pl-14 pr-6 text-xs font-black transition-all border-2 border-transparent focus:border-eco-green outline-none"
                  />
               </div>
               <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-4">{isRtl ? 'التصنيفات' : 'Topic Selection'}</h3>
                  {categories.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                         activeCategory === cat.id ? 'bg-eco-green text-white shadow-lg shadow-eco-green/20' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                       <div className="flex items-center gap-4">
                          <cat.icon size={20} />
                          <span className="text-xs font-black uppercase tracking-tight">{cat.label}</span>
                       </div>
                       {activeCategory === cat.id && <ChevronRight size={16} />}
                    </button>
                  ))}
               </div>
            </div>
         </aside>

         {/* 3. NEWS GRID */}
         <div className="lg:col-span-9">
            {loading ? (
               <div className="flex justify-center py-20">
                  <Loader2 size={40} className="text-eco-green animate-spin" />
               </div>
            ) : filteredNews.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredNews.map((article, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedArticle(article)}
                      className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-2"
                    >
                       <div className="aspect-video relative overflow-hidden bg-slate-100">
                          <img 
                            src={article.image_url || `https://picsum.photos/seed/${article.id}/800/450`} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          />
                          <div className="absolute top-6 left-6">
                             <span className="px-5 py-2 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest">{article.category}</span>
                          </div>
                       </div>
                       <div className="p-8 space-y-4">
                          <div className="flex items-center gap-3 text-[10px] font-black text-eco-green uppercase tracking-widest">
                             <Clock size={12} />
                             <span>{new Date(article.published_at || article.created_at).toLocaleDateString()}</span>
                          </div>
                          <h3 className="text-xl font-black text-slate-800 leading-snug group-hover:text-eco-green transition-colors">{renderText(article.title)}</h3>
                          <p className="text-sm font-bold text-slate-500 line-clamp-3 leading-relaxed">{renderText(article.description)}</p>
                       </div>
                    </motion.div>
                  ))}
               </div>
            ) : (
               <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <Newspaper size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? 'لا توجد أخبار حالياً' : 'No news flow detected'}</p>
               </div>
            )}
         </div>
      </div>

      {/* ARTICLE MODAL */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl"
            onClick={() => setSelectedArticle(null)}
          >
             <motion.div 
               initial={{ scale: 0.9, y: 40 }}
               animate={{ scale: 1, y: 0 }}
               className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white"
               onClick={e => e.stopPropagation()}
             >
                <div className="relative h-72 md:h-96 shrink-0">
                   <img src={selectedArticle.image_url || `https://picsum.photos/seed/${selectedArticle.id}/1200/600`} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                   <button onClick={() => setSelectedArticle(null)} className="absolute top-8 right-8 w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 hover:bg-eco-green hover:text-white transition-all shadow-xl">
                      <X size={24} />
                   </button>
                   <div className="absolute bottom-10 left-10 right-10">
                      <p className="text-xs font-black text-eco-green uppercase tracking-widest mb-2">{selectedArticle.category}</p>
                      <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter leading-none">{renderText(selectedArticle.title)}</h2>
                   </div>
                </div>
                <div className="p-6 md:p-16 overflow-y-auto space-y-8 md:space-y-10">
                   <div className="flex items-center gap-4 md:gap-6 pb-6 md:pb-10 border-b border-slate-100">
                      <div className="flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <Clock size={14} className="md:w-4 md:h-4" />
                         <span>{new Date(selectedArticle.published_at || selectedArticle.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <MapPin size={14} className="md:w-4 md:h-4" />
                         <span>{isRtl ? 'المكتب المركزي' : 'Bureau Central'}</span>
                      </div>
                   </div>
                   <div className="text-base md:text-lg font-bold text-slate-600 leading-relaxed font-arabic">
                      {renderText(selectedArticle.content) || renderText(selectedArticle.description)}
                   </div>
                   <div className="pt-6 md:pt-10 flex flex-wrap gap-3 md:gap-4 border-t border-slate-100">
                      <button onClick={() => handleSpeak(selectedArticle.content || selectedArticle.title)} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-eco-green transition-all">
                         <Volume2 size={18} className="md:w-5 md:h-5" />
                         {isRtl ? 'استماع ذكي' : 'Smart Voice'}
                      </button>
                      <button className="p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl text-slate-400 hover:text-eco-green transition-colors">
                         <Share2 size={18} className="md:w-5 md:h-5" />
                      </button>
                      <a href={selectedArticle.url || '#'} target="_blank" className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 md:px-8 py-3 md:py-4 border-2 border-slate-900 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                         {isRtl ? 'المصدر الأصلي' : 'Origin Source'}
                         <ExternalLink size={18} className="md:w-5 md:h-5" />
                      </a>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EcoNews;
