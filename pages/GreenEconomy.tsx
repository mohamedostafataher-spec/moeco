
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';
import { dailyServices } from '../services/dailyServices';
import { couponService } from '../services/couponService';
import { 
  Award, Trophy, Star, ArrowRight, ShieldCheck, Medal, 
  Sparkles, TrendingUp, Target, ShoppingBag, Box, Gift, 
  ExternalLink, Clock, CheckCircle2, Zap, Heart, Plus, 
  Camera, Loader2, Tag, Flame, Search, Filter, Package,
  TrendingDown, Info, ShoppingCart, RefreshCw, Ticket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GreenEconomy: React.FC = () => {
  const { user, setUser, language, theme, isRtl, trackCarbon } = useApp();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'market' | 'commodities' | 'donations' | 'savings'>('leaderboard');
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  // States
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [commodities, setCommodities] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [savingsCoupons, setSavingsCoupons] = useState<any[]>([]);
  
  // Modals
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddDonation, setShowAddDonation] = useState(false);
  const [dailyReward, setDailyReward] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);

  const handleClaimDailyBonus = async () => {
    if (claiming) return;
    if (!dailyReward) {
      notificationService.info(isRtl ? 'لا توجد مكافأة متاحة الآن - ربما استلمت مكافأة اليوم بالفعل' : 'No bonus available right now - you may have already claimed today\'s bonus');
      return;
    }
    setClaiming(true);
    try {
      await storageService.claimDailyReward(dailyReward.id);
      notificationService.success(isRtl ? 'تم استلام المكافأة! أُضيفت نقاطك' : 'Bonus claimed! Your points were added');
      setDailyReward(null);
    } catch (e) {
      notificationService.error(isRtl ? 'تعذر استلام المكافأة الآن - حاول مرة أخرى لاحقاً' : 'Could not claim the bonus right now - please try again later');
    } finally {
      setClaiming(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reward, rankings, soulItems, dons, prices, savers] = await Promise.all([
        storageService.getDailyReward(),
        storageService.getUserRankings(),
        storageService.getProducts(),
        storageService.getDonations(),
        dailyServices.getPrices(),
        couponService.fetchAllCoupons().then(res => res.coupons)
      ]);

      setDailyReward(reward);
      setLeaderboard(rankings || []);
      setProducts(soulItems || []);
      setDonations(dons || []);
      setCommodities(prices || []);
      setSavingsCoupons(savers || []);

      if (user?.id) {
        const streakData = await storageService.getCurrentStreak(user.id);
        setStreak(streakData.current_streak || 0);
      }
    } catch (error) {
      console.error("Error loading economy data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handlePurchase = async (product: any) => {
    if (!user) return;
    const priceNum = parseInt(product.price.toString().replace(/[^0-9]/g, ''));
    if (user.points < priceNum) {
      notificationService.error(isRtl ? 'نقاطك غير كافية' : 'Insufficient points');
      return;
    }
    try {
      await storageService.purchaseProduct(product.id);
      notificationService.success(isRtl ? 'تم الشراء بنجاح!' : 'Purchase successful!');
      loadData();
    } catch (error) {
      notificationService.error(isRtl ? 'فشل الشراء' : 'Purchase failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Consolidated */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-xl border border-zinc-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-egypt-gold/10 rounded-3xl flex items-center justify-center text-egypt-gold">
              <TrendingUp size={32} />
           </div>
           <div>
              <h1 className="text-3xl font-black">{isRtl ? 'السوق والاقتصاد الأخضر' : 'Green Economy Hub'}</h1>
              <p className="text-sm font-bold text-stone-500">{isRtl ? 'استبدل، تبرع، وراقب الأسعار' : 'Trade, Donate, & Track Prices'}</p>
           </div>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-stone-100 dark:bg-white/5 p-2 rounded-3xl">
           {[
             { id: 'leaderboard', icon: Trophy, label: isRtl ? 'الترتيب' : 'Rank' },
             { id: 'market', icon: ShoppingBag, label: isRtl ? 'السوق' : 'Market' },
             { id: 'commodities', icon: Tag, label: isRtl ? 'الأسعار' : 'Prices' },
             { id: 'savings', icon: Gift, label: isRtl ? 'التوفير' : 'Savings' },
             { id: 'donations', icon: Heart, label: isRtl ? 'التبرع' : 'Donations' },
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all ${
                 activeTab === tab.id ? 'bg-egypt-gold text-nile-blue shadow-lg' : 'text-stone-400 hover:text-stone-600'
               }`}
             >
               <tab.icon size={16} />
               <span className="hidden sm:inline">{tab.label}</span>
             </button>
           ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'leaderboard' && (
           <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-zinc-100 dark:border-white/5">
                 <h3 className="text-xl font-black mb-6">{isRtl ? 'لوحة الأبطال' : 'Champions Board'}</h3>
                 <div className="space-y-3">
                    {leaderboard.length === 0 && !isLoading && (
                       <div className="py-12 text-center">
                          <Trophy className="w-10 h-10 mx-auto text-stone-300 mb-4" />
                          <p className="font-black text-stone-400">{isRtl ? 'لا توجد بيانات متصدرين متاحة حالياً' : 'No leaderboard data available right now'}</p>
                          <p className="text-xs font-bold text-stone-400 mt-2">{isRtl ? 'ستظهر الترتيبات هنا عند توفر الخدمة' : 'Rankings will appear here when the service is available'}</p>
                       </div>
                    )}
                    {leaderboard.slice(0, 10).map((u, i) => (
                       <div key={u.id} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-white/5 rounded-2xl">
                          <div className="flex items-center gap-4">
                             <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${i < 3 ? 'bg-egypt-gold text-white' : 'bg-stone-200'}`}>
                                {i+1}
                             </span>
                             <span className="font-black">{u.name}</span>
                          </div>
                          <span className="font-black text-emerald-500">{u.points} pts</span>
                       </div>
                    ))}
                 </div>
              </div>
              <div className="space-y-8">
                 <div className="p-8 bg-emerald-500 text-white rounded-[3rem] shadow-xl shadow-emerald-500/20">
                    <Sparkles className="mb-4" />
                    <h4 className="text-xl font-black mb-2">{isRtl ? 'مكافأة اليوم' : 'Daily Bonus'}</h4>
                    <p className="text-xs font-bold opacity-90 mb-6">{isRtl ? 'سجل دخولك يومياً لربح نقاط إضافية' : 'Log in daily to earn extra points'}</p>
                    <button onClick={handleClaimDailyBonus} disabled={claiming} className={`w-full py-4 bg-white text-emerald-600 rounded-2xl font-black hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}>
                       {claiming && <Loader2 className="animate-spin" size={16} />}
                       {isRtl ? 'استلام' : 'Claim Now'}
                    </button>
                 </div>
              </div>
           </motion.div>
        )}

        {activeTab === 'market' && (
           <motion.div key="market" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black">{isRtl ? 'السوق المستدام' : 'Sustainable Market'}</h3>
                 <button onClick={() => setShowAddProduct(true)} className="flex items-center gap-2 px-6 py-3 bg-egypt-gold text-white rounded-2xl font-black text-xs">
                    <Plus size={18} /> {isRtl ? 'نشر منتج' : 'List Product'}
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {products.map(p => (
                    <div key={p.id} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-zinc-100 dark:border-white/5 group shadow-lg">
                       <img src={p.image} className="h-48 w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                       <div className="p-6">
                          <h4 className="font-black text-lg mb-1">{p.name}</h4>
                          <p className="text-xs text-stone-400 mb-4 line-clamp-2">{p.description}</p>
                          <div className="flex items-center justify-between mb-4">
                             <span className="text-emerald-500 font-black">{p.price}</span>
                             <span className="text-[10px] font-black uppercase text-stone-400">By {p.sellerName}</span>
                          </div>
                          <button onClick={() => handlePurchase(p)} className="w-full py-3 bg-stone-100 dark:bg-white/5 rounded-xl font-black hover:bg-egypt-gold hover:text-white transition-all">
                             {isRtl ? 'شراء' : 'Buy'}
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </motion.div>
        )}

        {activeTab === 'commodities' && (
           <motion.div key="commodities" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
              <h3 className="text-2xl font-black">{isRtl ? 'أسعار السلع' : 'Commodity Pulse'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {commodities.map((c, i) => (
                    <div key={i} className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-white/5 hover:border-egypt-gold transition-all">
                       <div className="flex justify-between mb-4">
                          <div className="p-3 bg-stone-100 dark:bg-white/5 rounded-xl text-egypt-gold">
                             <Tag size={20} />
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-black">{c.price} <span className="text-[10px]">EGP</span></p>
                             <span className="text-[10px] text-emerald-500 font-black flex items-center justify-end gap-1"><TrendingDown size={10}/> -1%</span>
                          </div>
                       </div>
                       <h4 className="font-black text-sm">{c.product}</h4>
                       <p className="text-[10px] text-stone-400 uppercase font-black tracking-widest mt-1">{c.city}</p>
                    </div>
                 ))}
              </div>
           </motion.div>
        )}

        {activeTab === 'savings' && (
           <motion.div key="savings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savingsCoupons.map((c, i) => (
                 <div key={i} className="p-8 bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed border-stone-200 dark:border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                       <Ticket size={80} />
                    </div>
                    <div className="flex justify-between items-start mb-6">
                       <div className="px-3 py-1 bg-egypt-gold/10 text-egypt-gold rounded-full text-[10px] font-black uppercase tracking-widest">{c.source}</div>
                       <span className="text-emerald-500 font-black">{c.discount_value}</span>
                    </div>
                    <h4 className="text-xl font-black mb-2">{c.title}</h4>
                    <p className="text-xs text-stone-400 font-bold mb-6">{c.description}</p>
                    <div className="flex items-center gap-2 p-3 bg-stone-100 dark:bg-white/5 rounded-xl border border-stone-200 dark:border-white/10 uppercase font-black text-center justify-center cursor-pointer hover:bg-egypt-gold hover:text-white transition-all select-all">
                       {c.code}
                    </div>
                 </div>
              ))}
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GreenEconomy;
