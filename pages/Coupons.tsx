
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, Tag, ShoppingBag, Car, Plane, 
  Utensils, Laptop, ChevronLeft, Search, 
  ExternalLink, Copy, CheckCircle2, Filter,
  TrendingUp, Clock, Info, Heart
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { couponService, Coupon } from '../services/couponService';
import { couponCrawlerService } from '../services/couponCrawlerService';
import { notificationService } from '../services/notificationService';
import { storageService } from '../services/storageService';

const Coupons: React.FC = () => {
  const { language, isRtl, theme, user } = useApp();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [manualCoupons, setManualCoupons] = useState<any[]>([]);

  useEffect(() => {
    const fetchCoupons = async () => {
      const result = await couponService.fetchAllCoupons();
      setCoupons(result.coupons);
      setLoading(false);
    };
    fetchCoupons();

    if (user) {
      storageService.getFavorites(user.id, 'coupon').then(setFavorites).catch(console.error);
    }
  }, [user]);

  const toggleFavorite = async (couponId: string) => {
    if (!user) {
      notificationService.error(language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      return;
    }
    const isFav = favorites.includes(couponId);
    await storageService.toggleFavorite(user.id, couponId, 'coupon');
    if (isFav) {
      setFavorites(favorites.filter(id => id !== couponId));
      notificationService.success(language === 'ar' ? 'تمت الإزالة من المفضلة' : 'Removed from favorites');
    } else {
      setFavorites([...favorites, couponId]);
      notificationService.success(language === 'ar' ? 'تمت الإضافة للمفضلة' : 'Added to favorites');
    }
  };

  const categories = [
    { id: 'All', label: language === 'ar' ? 'الكل' : 'All', icon: Ticket },
    { id: 'Shopping', label: language === 'ar' ? 'تسوق' : 'Shopping', icon: ShoppingBag },
    { id: 'Transport', label: language === 'ar' ? 'نقل' : 'Transport', icon: Car },
    { id: 'Restaurants', label: language === 'ar' ? 'مطاعم' : 'Food', icon: Utensils },
    { id: 'Tech', label: language === 'ar' ? 'تكنولوجيا' : 'Tech', icon: Laptop },
    { id: 'Travel', label: language === 'ar' ? 'سفر' : 'Travel', icon: Plane },
  ];

  const filteredCoupons = coupons.filter(c => 
    (activeCategory === 'All' || c.category === activeCategory) &&
    ((c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) || 
     (c.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false)) &&
    ((c.title?.toLowerCase().includes('egypt') || c.title?.includes('مصر') || 
      c.description?.toLowerCase().includes('egypt') || c.description?.includes('مصر') || 
      c.source?.toLowerCase().includes('egypt') || c.source?.includes('مصر')) || false)
  );

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    notificationService.success(language === 'ar' ? 'تم نسخ الكود!' : 'Code copied!');
  };

  return (
    <div className="min-h-screen pb-32" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-4 mb-12">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-egypt-gold hover:text-egypt-black transition-all"
          >
            <ChevronLeft className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <h1 className="text-4xl font-black font-arabic">
              {language === 'ar' ? 'كوبونات التوفير' : 'Savings Coupons'}
            </h1>
            <p className="text-zinc-500 font-bold mt-1">
              {language === 'ar' ? 'أفضل العروض والكوبونات في مصر محدثة يومياً' : 'Best deals and coupons in Egypt updated daily'}
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-4 mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-6 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ar' ? 'ابحث عن متجر أو عرض...' : 'Search for store or deal...'}
                className="w-full pl-14 pr-6 py-5 bg-white dark:bg-egypt-black border border-zinc-100 dark:border-white/5 rounded-3xl font-bold shadow-lg focus:border-egypt-gold outline-none transition-all"
              />
            </div>
            <button
              onClick={async () => {
                const fetched = await couponCrawlerService.fetchCouponsFromFeeds();
                setManualCoupons(fetched);
                notificationService.success(language === 'ar' ? 'تم جلب الكوبونات' : 'Coupons fetched');
              }}
              className="px-6 py-5 bg-egypt-gold text-egypt-black rounded-2xl font-black text-xs uppercase"
            >
              {language === 'ar' ? 'جلب كوبونات جديدة' : 'Fetch New Coupons'}
            </button>
            {manualCoupons.length > 0 && (
              <button
                onClick={async () => {
                  for (const c of manualCoupons) await storageService.saveCoupon(c);
                  setManualCoupons([]);
                  notificationService.success(language === 'ar' ? 'تم الحفظ' : 'Saved to DB');
                  // Refresh list
                  const result = await couponService.fetchAllCoupons();
                  setCoupons(result.coupons);
                }}
                className="px-6 py-5 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase"
              >
                {language === 'ar' ? `حفظ ${manualCoupons.length} كوبون` : `Save ${manualCoupons.length} Coupons`}
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-2 transition-all whitespace-normal sm:whitespace-nowrap break-words ${
                  activeCategory === cat.id 
                    ? 'bg-egypt-gold text-egypt-black shadow-lg shadow-egypt-gold/20' 
                    : 'bg-white dark:bg-white/5 text-zinc-500 border border-zinc-100 dark:border-white/10'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Coupons Grid -> Single Coupon View */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-egypt-gold/20 border-t-egypt-gold rounded-full animate-spin" />
            <p className="text-zinc-500 font-bold">{language === 'ar' ? 'جاري جلب أفضل عرض متاح...' : 'Fetching the best deal...'}</p>
          </div>
        ) : filteredCoupons.length > 0 ? (
          <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-egypt-black rounded-[3rem] border border-zinc-100 dark:border-white/5 shadow-2xl overflow-hidden relative"
              >
                {/* Active Badge */}
                <div className="absolute top-8 right-8 rtl:left-8 rtl:right-auto px-4 py-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {language === 'ar' ? 'متاح وحصري' : 'Active & Exclusive'}
                </div>

                <div className="p-10 md:p-14">
                  <div className="flex justify-between items-start mb-8">
                    <div className="p-5 bg-zinc-50 dark:bg-white/5 rounded-3xl">
                      <Tag className="w-10 h-10 text-egypt-gold" />
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-10">
                    <span className="px-4 py-2 bg-egypt-gold/10 text-egypt-gold text-xs font-black rounded-2xl uppercase tracking-widest">
                      {filteredCoupons[0].category}
                    </span>
                    <h3 className="text-3xl font-black font-arabic leading-tight">{filteredCoupons[0].title}</h3>
                    <p className="text-lg font-bold text-zinc-500 leading-relaxed">
                      {filteredCoupons[0].description} 
                      <span className="block mt-2 text-egypt-gold">{language === 'ar' ? 'تم التحقق من هذا الكوبون اليوم.' : 'This coupon was verified today.'}</span>
                    </p>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8 bg-zinc-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-white/10 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-egypt-gold/5 rounded-full blur-2xl" />
                    <div className="flex-1 text-center md:text-left rtl:md:text-right relative z-10 w-full">
                      <p className="text-xs font-black text-zinc-400 uppercase mb-2 tracking-widest">{language === 'ar' ? 'انسخ الرمز للاستخدام' : 'TAP TO COPY PROMO CODE'}</p>
                      <p className="text-4xl font-black tracking-widest text-egypt-black dark:text-white select-all">{filteredCoupons[0].code}</p>
                    </div>
                    <button 
                      onClick={() => copyCode(filteredCoupons[0].code)}
                      className="w-full md:w-auto px-8 py-5 bg-egypt-gold text-egypt-black rounded-2xl font-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-egypt-gold/20"
                    >
                      <Copy className="w-5 h-5" />
                      {language === 'ar' ? 'نسخ الكود' : 'Copy Code'}
                    </button>
                  </div>

                  <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm font-bold text-zinc-400">
                      <Clock className="w-4 h-4 text-egypt-gold" />
                      <span>{language === 'ar' ? 'صالح حتى:' : 'Valid until:'} {filteredCoupons[0].expiry_date}</span>
                    </div>
                    <a 
                      href={filteredCoupons[0].link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-zinc-100 dark:bg-white/10 rounded-xl flex items-center gap-2 text-sm font-black hover:bg-zinc-200 dark:hover:bg-white/20 transition-all"
                    >
                      {language === 'ar' ? 'استخدم الكوبون الآن' : 'Redeem Now'}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <div className="h-3 bg-egypt-gold w-full" />
              </motion.div>
          </div>
        ) : (
          <div className="text-center py-20">
            <Ticket className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
            <p className="text-zinc-500 font-bold text-lg">{language === 'ar' ? 'لا توجد عروض متاحة حالياً.' : 'No active deals available right now.'}</p>
          </div>
        )}

        {/* Affiliate Info */}
        <div className="mt-16 p-10 bg-zinc-50 dark:bg-white/5 rounded-[4rem] border border-zinc-100 dark:border-white/10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-24 h-24 bg-egypt-gold/20 rounded-full flex items-center justify-center shrink-0">
            <TrendingUp className="w-12 h-12 text-egypt-gold" />
          </div>
          <div className="flex-1 text-center md:text-left rtl:md:text-right">
            <h3 className="text-2xl font-black font-arabic mb-4">{language === 'ar' ? 'وفر أكثر مع MoEco' : 'Save More with MoEco'}</h3>
            <p className="text-zinc-500 font-bold leading-relaxed">
              {language === 'ar' 
                ? 'نحن نبحث دائماً عن أفضل العروض التي تساعدك على توفير المال وتقليل استهلاك الموارد. بعض هذه الروابط قد تمنحنا عمولة بسيطة تساعدنا في تطوير التطبيق.' 
                : 'We always look for the best deals that help you save money and reduce resource consumption. Some of these links may give us a small commission that helps us develop the app.'}
            </p>
          </div>
          <button className="px-10 py-5 bg-egypt-black text-white rounded-[2rem] font-black hover:scale-105 transition-transform shadow-xl">
            {language === 'ar' ? 'اشترك في النشرة' : 'Join Newsletter'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Coupons;
