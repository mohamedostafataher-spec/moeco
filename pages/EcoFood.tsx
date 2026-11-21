
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Utensils, 
  Leaf, 
  Search, 
  Filter, 
  ChevronRight, 
  Star, 
  Clock, 
  Flame, 
  MapPin, 
  Info,
  ArrowRight,
  TrendingDown,
  ShoppingBag,
  Heart,
  Plus,
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { foodService, FoodItem, SeasonalFood, WasteTip } from '../services/foodService';
import { smartAiService } from '../services/smartAiService';

const EcoFood: React.FC = () => {
  const { language, theme, trackCarbon } = useApp();
  const isRtl = language === 'ar';
  const [activeTab, setActiveTab] = useState<'all' | 'recipes' | 'restaurants' | 'tips' | 'pantry'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [seasonalFood, setSeasonalFood] = useState<SeasonalFood[]>([]);
  const [wasteTips, setWasteTips] = useState<WasteTip[]>([]);
  const [pantryItems, setPantryItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [showAddPantry, setShowAddPantry] = useState(false);
  const [newPantryItem, setNewPantryItem] = useState({
    name: '',
    description: '',
    expiry_date: '',
    category: 'Food'
  });
  const [dailyAiContent, setDailyAiContent] = useState<any>(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  const fetchPantry = async () => {
    try {
      const data = await storageService.getPantryItems();
      setPantryItems(data);
    } catch (err) {
      console.error("Error fetching pantry:", err);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [items, seasonal, tips] = await Promise.all([
          foodService.fetchFoodItems(),
          foodService.fetchSeasonalFoods(),
          foodService.fetchWasteTips(),
          fetchPantry()
        ]);
        setFoodItems(items);
        setSeasonalFood(seasonal);
        setWasteTips(tips);
        
        // Fetch AI Daily Content
        const aiContent = await smartAiService.generateDailyContent('food', language as any);
        setDailyAiContent(aiContent);
      } catch (err) {
        console.error("Error fetching food data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [language]);

  const handleAddPantry = async () => {
    if (!newPantryItem.name) return;
    try {
      await storageService.listPantryItem(newPantryItem);
      notificationService.success(isRtl ? 'تمت إضافة الغرض للمؤن' : 'Item added to pantry');
      setShowAddPantry(false);
      fetchPantry();
    } catch (e) {
      notificationService.error('Error adding item');
    }
  };

  const filteredItems = foodItems.filter(item => {
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const matchesSearch = (isRtl ? item.name_ar : item.name_en).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className={`min-h-screen pb-32 ${theme === 'dark' ? 'bg-aeon-obsidian text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Header */}
      <div className="relative h-80 overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'dark' ? 'from-aeon-obsidian' : 'from-zinc-50'} to-transparent`} />
        <div className="absolute bottom-12 left-8 right-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-aeon-cyan text-black rounded-3xl shadow-[0_0_30px_rgba(0,245,255,0.4)]">
                <Utensils className="w-10 h-10" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-aeon-cyan uppercase tracking-[0.4em]">Nutritional Matrix</span>
                <h1 className="text-6xl font-black font-display tracking-tighter uppercase">
                  {language === 'ar' ? 'الغذاء المستدام' : 'Eco Food'}
                </h1>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-6 -mt-6 relative z-10">
        <div className={`${theme === 'dark' ? 'bg-zinc-900/90' : 'bg-white/90'} backdrop-blur-xl p-4 rounded-3xl border ${theme === 'dark' ? 'border-white/5' : 'border-zinc-200'} shadow-2xl`}>
          <div className="relative mb-4">
            <Search className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5`} />
            <input 
              type="text"
              placeholder={isRtl ? 'ابحث عن وصفة أو مطعم...' : 'Search recipes or restaurants...'}
              className={`w-full ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'} border rounded-2xl py-3 ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} focus:border-egypt-gold/50 transition-colors outline-none font-bold`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
              { id: 'all', label: isRtl ? 'الكل' : 'All', icon: Utensils },
              { id: 'recipe', label: isRtl ? 'وصفات' : 'Recipes', icon: Flame },
              { id: 'restaurant', label: isRtl ? 'مطاعم' : 'Restaurants', icon: MapPin },
              { id: 'tip', label: isRtl ? 'نصائح' : 'Tips', icon: Info },
              { id: 'pantry', label: isRtl ? 'المؤن الدائرية' : 'Circular Pantry', icon: ShoppingBag },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-normal sm:whitespace-nowrap break-words transition-all ${
                  activeTab === tab.id 
                    ? 'bg-egypt-gold text-black font-black' 
                    : `${theme === 'dark' ? 'bg-white/5 text-zinc-400 hover:bg-white/10' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'} font-bold`
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
            <Link 
              to="/calculator" 
              state={{ type: 'food' }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-normal sm:whitespace-nowrap break-words transition-all font-black text-sm ${
                theme === 'dark' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-emerald-500 text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              {isRtl ? 'احسب أثرك' : 'Calculate'}
            </Link>
          </div>
        </div>

        {/* Link to Surplus Instead of Waste */}
        <div className="mt-4 bg-slate-900/90 border border-amber-400/30 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black text-white">
                {isRtl ? 'الفائض بدل الرمي (نموذج تجريبي)' : 'Surplus Instead of Waste (Demo)'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-400/30">
                {isRtl ? 'عرض تجريبي بدون طلب فعلي' : 'Demo Showcase'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {isRtl
                ? 'تصفّح عروض الفائض من المخابز والمتاجر والمطاعم القريبة مع توضيح فترات الاستلام وتنبيهات سلامة الغذاء.'
                : 'Browse demo surplus food offers from local bakeries, stores, and restaurants with clear pickup windows.'}
            </p>
          </div>
          <Link
            to="/surplus-food"
            className="min-h-[44px] shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition"
          >
            <span>{isRtl ? 'تصفّح عروض الفائض' : 'Browse Surplus Offers'}</span>
            <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </Link>
        </div>
      </div>

      {/* Content Grid */}
      <div className="px-6 mt-8">
        <AnimatePresence mode="wait">
          {activeTab === 'pantry' ? (
            <motion.div key="pantry" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className={`p-8 rounded-[3rem] ${theme === 'dark' ? 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-black font-arabic ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{isRtl ? 'المؤن الدائرية: شارك الفائض' : 'Circular Pantry: Share Surplus'}</h2>
                  <button 
                    onClick={() => setShowAddPantry(true)}
                    className="p-4 bg-amber-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    {isRtl ? 'إضافة غرض' : 'Add Item'}
                  </button>
                </div>
                <p className={`text-sm font-bold mb-8 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {isRtl ? 'قلل هدر الطعام من خلال مشاركة الفائض من منزلك مع جيرانك الموثوقين.' : 'Reduce food waste by sharing surplus from your home with trusted neighbors.'}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pantryItems.map((item) => (
                    <div key={item.id} className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200'} flex justify-between items-center shadow-sm`}>
                      <div>
                        <h4 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{item.name}</h4>
                        <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">{isRtl ? 'تنتهي في: ' : 'Expires: '}{item.expiry_date}</p>
                        <p className="text-xs text-amber-500 font-black mt-1">{isRtl ? 'صاحب الغرض: ' : 'Owner: '}{item.users?.full_name || item.profiles?.name}</p>
                      </div>
                      <button 
                        onClick={() => {
                          trackCarbon('food_claim', 'food_veg', 1, { item: item.name });
                          notificationService.success(isRtl ? 'تم طلب الغرض بنجاح' : 'Item claimed successfully');
                        }}
                        className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-white/5 text-white hover:bg-amber-500 hover:text-black' : 'bg-zinc-100 text-zinc-900 hover:bg-amber-500 hover:text-black'}`}
                      >
                        {isRtl ? 'طلب' : 'Claim'}
                      </button>
                    </div>
                  ))}
                  {pantryItems.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                      <ShoppingBag className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-zinc-800' : 'text-zinc-300'}`} />
                      <p className="text-zinc-600 dark:text-zinc-400 font-black uppercase tracking-widest">{isRtl ? 'لا توجد أغراض حالياً' : 'No items available'}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 gap-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-egypt-gold border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-zinc-600 dark:text-zinc-400 font-bold">{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
                </div>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => setSelectedItem(item)}
                    className={`group rounded-[2rem] overflow-hidden border transition-all cursor-pointer shadow-sm ${theme === 'dark' ? 'bg-zinc-900/50 border-white/5 hover:border-egypt-gold/30' : 'bg-white border-zinc-200 hover:border-egypt-gold/50'}`}
                  >
                    <div className="relative h-48">
                      <img 
                        src={item.image} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        alt={item.name_en}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 border border-white/10">
                        <Leaf className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                          {isRtl ? 'درجة الكربون' : 'Carbon Score'}: {item.carbon_score}/10
                        </span>
                      </div>
                      {item.category === 'recipe' && (
                        <div className="absolute bottom-4 left-4 bg-egypt-gold text-black px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                          {isRtl ? 'وصفة' : 'Recipe'}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                          {isRtl ? item.name_ar : item.name_en}
                        </h3>
                        {item.rating && (
                          <div className="flex items-center gap-1 text-egypt-gold">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm font-black">{item.rating}</span>
                          </div>
                        )}
                      </div>
                      
                      <p className={`text-sm line-clamp-2 mb-4 font-bold ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {isRtl ? item.description_ar : item.description_en}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {item.tags.map(tag => (
                          <span key={tag} className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${theme === 'dark' ? 'bg-white/5 text-zinc-500' : 'bg-zinc-100 text-zinc-500'}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20">
                  <Utensils className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-zinc-800' : 'text-zinc-300'}`} />
                  <p className="text-zinc-600 dark:text-zinc-400 font-bold">
                    {isRtl ? 'لم يتم العثور على نتائج' : 'No results found'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Pantry Modal */}
      <AnimatePresence>
        {showAddPantry && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-zinc-900 w-full max-w-md p-10 rounded-[3rem] border border-white/10 relative">
              <button onClick={() => setShowAddPantry(false)} className="absolute top-8 right-8 text-zinc-500">
                <Plus className="w-8 h-8 rotate-45" />
              </button>
              <h3 className="text-2xl font-black text-white font-arabic mb-8">{isRtl ? 'إضافة غرض للمؤن' : 'Add to Pantry'}</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400 px-2">{isRtl ? 'اسم الغرض' : 'Item Name'}</label>
                  <input 
                    type="text" 
                    value={newPantryItem.name}
                    onChange={(e) => setNewPantryItem({...newPantryItem, name: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-amber-500" 
                    placeholder={isRtl ? 'مثال: علبة أرز غير مفتوحة' : 'e.g. Unopened rice pack'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400 px-2">{isRtl ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
                  <input 
                    type="date" 
                    value={newPantryItem.expiry_date}
                    onChange={(e) => setNewPantryItem({...newPantryItem, expiry_date: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-amber-500" 
                  />
                </div>
                <button 
                  onClick={handleAddPantry}
                  className="w-full py-5 bg-amber-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                >
                  {isRtl ? 'نشر الغرض' : 'Post Item'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-zinc-900 w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative h-64">
                <img src={selectedItem.image} className="w-full h-full object-cover" alt="" />
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-6 right-6 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10"
                >
                  <ChevronRight className="w-6 h-6 rotate-90" />
                </button>
              </div>

              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    {isRtl ? 'خيار مستدام' : 'Sustainable Choice'}
                  </div>
                  <div className="px-3 py-1 bg-egypt-gold/20 text-egypt-gold rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {selectedItem.category}
                  </div>
                </div>

                <h2 className="text-3xl font-black text-white mb-4">
                  {isRtl ? selectedItem.name_ar : selectedItem.name_en}
                </h2>

                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8">
                  {isRtl ? selectedItem.description_ar : selectedItem.description_en}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-white/5 p-4 rounded-2xl text-center">
                    <Clock className="w-5 h-5 text-egypt-gold mx-auto mb-2" />
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">{isRtl ? 'الوقت' : 'Time'}</p>
                    <p className="text-sm text-white font-bold">{selectedItem.prep_time || '--'}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl text-center">
                    <Flame className="w-5 h-5 text-egypt-red mx-auto mb-2" />
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">{isRtl ? 'سعرات' : 'Cals'}</p>
                    <p className="text-sm text-white font-bold">{selectedItem.calories || '--'}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl text-center">
                    <Leaf className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">{isRtl ? 'كربون' : 'CO2'}</p>
                    <p className="text-sm text-white font-bold">{selectedItem.carbon_score}/10</p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    notificationService.success(isRtl ? 'تمت الإضافة إلى المفضلة' : 'Added to favorites');
                    setSelectedItem(null);
                  }}
                  className="w-full bg-egypt-gold text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Heart className="w-5 h-5" />
                  {isRtl ? 'حفظ في المفضلة' : 'Save to Favorites'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Carbon Calculator Section - NEW */}
      <div className="px-6 mt-12">
        <div className={`p-10 rounded-[3rem] border shadow-2xl relative overflow-hidden ${theme === 'dark' ? 'bg-gradient-to-br from-zinc-900 to-black border-emerald-500/20' : 'bg-white border-emerald-500/30'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                <TrendingDown className="w-8 h-8" />
              </div>
              <div>
                <h2 className={`text-3xl font-black leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  {isRtl ? 'حاسبة البصمة الغذائية' : 'Food Footprint Calculator'}
                </h2>
                <p className="text-emerald-500/60 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                  {isRtl ? 'احسب أثر وجبتك على الكوكب' : 'Calculate your meal\'s impact'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="space-y-4">
                  {[
                    { id: 'beef', label_ar: 'لحم بقري', label_en: 'Beef', factor: 27.0 },
                    { id: 'chicken', label_ar: 'دجاج', label_en: 'Chicken', factor: 6.9 },
                    { id: 'rice', label_ar: 'أرز', label_en: 'Rice', factor: 2.7 },
                    { id: 'vegetables', label_ar: 'خضروات', label_en: 'Vegetables', factor: 0.5 },
                    { id: 'dairy', label_ar: 'ألبان', label_en: 'Dairy', factor: 1.9 },
                  ].map(food => (
                    <div key={food.id} className={`flex items-center justify-between p-4 rounded-2xl border group transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:border-emerald-500/30' : 'bg-zinc-50 border-zinc-200 hover:border-emerald-500/50'}`}>
                      <span className={`font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{isRtl ? food.label_ar : food.label_en}</span>
                      <div className="flex items-center gap-4">
                        <input 
                          type="number" 
                          placeholder="0"
                          className={`w-20 border rounded-xl px-3 py-2 text-center font-black outline-none focus:border-emerald-500 ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const currentTotal = (window as any).foodCO2 || {};
                            currentTotal[food.id] = val * food.factor;
                            (window as any).foodCO2 = currentTotal;
                            const total = Object.values(currentTotal).reduce((a: any, b: any) => a + b, 0) as number;
                            const display = document.getElementById('total-food-co2');
                            if (display) display.innerText = total.toFixed(2);
                          }}
                        />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`flex flex-col items-center justify-center p-10 rounded-[3rem] border text-center ${theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="relative mb-6">
                  <div className={`w-40 h-40 rounded-full border-8 flex items-center justify-center ${theme === 'dark' ? 'border-emerald-500/20' : 'border-emerald-500/30'}`}>
                    <div className="text-center">
                      <span id="total-food-co2" className={`text-5xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>0.00</span>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">kg CO2e</p>
                    </div>
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-2 -right-2 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/40"
                  >
                    <Leaf className="w-6 h-6 text-white" />
                  </motion.div>
                </div>
                <h3 className={`text-xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  {isRtl ? 'إجمالي الانبعاثات' : 'Total Emissions'}
                </h3>
                <p className={`text-xs max-w-full sm:max-w-[200px] font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'}`}>
                  {isRtl 
                    ? 'هذا الرقم يمثل كمية ثاني أكسيد الكربون الناتجة عن إنتاج ونقل هذه المكونات.' 
                    : 'This number represents the amount of CO2 produced by the production and transport of these ingredients.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seasonal Food Section */}
      <div className="px-6 mt-12">
        <h2 className={`text-2xl font-black mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
          <Clock className="w-6 h-6 text-egypt-gold" />
          {isRtl ? 'الأطعمة الموسمية الحالية' : 'Current Seasonal Foods'}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {seasonalFood.length > 0 ? seasonalFood.map((food, idx) => (
            <div key={idx} className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-200 shadow-sm'}`}>
              <p className={`font-black mb-1 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{isRtl ? food.name_ar : food.name_en}</p>
              <p className="text-zinc-500 text-[10px] uppercase font-black tracking-wider">{food.month}</p>
            </div>
          )) : (
            <div className="col-span-2 text-center py-8">
              <p className="text-zinc-500 dark:text-zinc-400 font-bold">{isRtl ? 'لا توجد أطعمة موسمية حالياً' : 'No seasonal foods available currently'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Waste Reduction Tips */}
      <div className="px-6 mt-12">
        <h2 className={`text-2xl font-black mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
          <TrendingDown className="w-6 h-6 text-emerald-400" />
          {isRtl ? 'نصائح لتقليل الهدر' : 'Waste Reduction Tips'}
        </h2>
        
        {dailyAiContent && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-8 p-8 rounded-[2.5rem] border-2 border-dashed ${theme === 'dark' ? 'bg-aeon-cyan/5 border-aeon-cyan/30' : 'bg-aeon-cyan/5 border-aeon-cyan/20'}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-aeon-cyan text-black rounded-lg">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-aeon-cyan">
                {isRtl ? 'توصية الذكاء الاصطناعي اليومية' : 'Daily AI Recommendation'}
              </span>
            </div>
            <h3 className="text-xl font-black mb-2">{dailyAiContent.recipe?.title || dailyAiContent.tip}</h3>
            <p className="text-sm font-bold opacity-70 mb-4">{dailyAiContent.tip}</p>
            {dailyAiContent.recipe && (
              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-zinc-500">{isRtl ? 'المكونات:' : 'Ingredients:'}</p>
                <div className="flex flex-wrap gap-2">
                  {dailyAiContent.recipe.ingredients?.map((ing: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold">{ing}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        <div className="space-y-4">
          {wasteTips.length > 0 ? wasteTips.map((tip, idx) => (
            <div key={idx} className={`p-5 rounded-3xl border flex gap-4 ${theme === 'dark' ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-200 shadow-sm'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${theme === 'dark' ? 'bg-white/5' : 'bg-zinc-100'}`}>
                <span className="text-egypt-gold font-black">{idx + 1}</span>
              </div>
              <div>
                <h4 className={`font-black mb-1 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{isRtl ? tip.title_ar : tip.title_en}</h4>
                <p className={`text-xs leading-relaxed font-bold ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>{isRtl ? tip.desc_ar : tip.desc_en}</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-8">
              <p className="text-zinc-500 dark:text-zinc-400 font-bold">{isRtl ? 'لا توجد نصائح حالياً' : 'No tips available currently'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Carbon Tip Banner */}
      <div className="px-6 mt-12">
        <div className={`border rounded-[2rem] p-6 flex items-center gap-4 ${theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className={`font-black text-sm mb-1 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              {isRtl ? 'نصيحة اليوم الخضراء' : 'Green Tip of the Day'}
            </h4>
            <p className={`text-xs font-bold ${theme === 'dark' ? 'text-emerald-400/80' : 'text-emerald-600'}`}>
              {isRtl 
                ? 'تقليل استهلاك اللحوم الحمراء ليوم واحد في الأسبوع يقلل انبعاثاتك الكربونية بنسبة 15%.' 
                : 'Reducing red meat consumption for one day a week reduces your carbon emissions by 15%.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcoFood;
