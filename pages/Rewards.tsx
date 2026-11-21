import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { couponService, Coupon } from '../services/couponService';
import { supabase } from '../services/supabaseClient';
import { Award, Trophy, Star, Users, ArrowRight, ShieldCheck, Medal, Sparkles, TrendingUp, Target, ShoppingBag, Box, Gift, ExternalLink, Clock, CheckCircle2, Zap, Heart, Plus, Camera, Loader2, Tag, Flame } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

const Rewards: React.FC = () => {
  const { user, setUser, language, theme, isRtl } = useApp();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'badges' | 'souq' | 'donations'>('leaderboard');
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Coupons State
  const [coupons, setCoupons] = useState<any[]>([]);

  // Souq State
  const [products, setProducts] = useState<any[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Energy', description: '', image: '' });
  const [isUploading, setIsUploading] = useState(false);
  
  // Daily Reward State
  const [dailyReward, setDailyReward] = useState<any>(null);

  // Donations State
  const [donations, setDonations] = useState<any[]>([]);
  const [showAddDonation, setShowAddDonation] = useState(false);
  const [newDonation, setNewDonation] = useState({ item_name: '', category: 'Clothes', description: '' });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const reward = await storageService.getDailyReward();
      setDailyReward(reward);
      
      if (user?.id) {
        const streakData = await storageService.getCurrentStreak(user.id);
        setStreak(streakData.current_streak || 0);
      }
      
      const [rankings, itemsData, donsData] = await Promise.all([
        storageService.getUserRankings(),
        storageService.getProducts(),
        storageService.getDonations()
      ]);

      setLeaderboard(rankings || []);
      setProducts(itemsData || []);
      setDonations(donsData || []);

      // INTELLIGENT COUPON DISCOVERY
      try {
        const { data: couponsData, error: couponError } = await supabase
          .from('coupons')
          .select('*')
          .eq('is_active', true)
          .limit(20);
        
        if (!couponError && couponsData && couponsData.length > 0) {
          setCoupons(couponsData);
        } else {
          // Try legacy table
          const { data: ecoData } = await supabase.from('eco_coupons').select('*, eco_rewards(*)').order('created_at', { ascending: false });
          if (ecoData && ecoData.length > 0) {
            setCoupons(ecoData.map((c: any) => ({
               id: c.id,
               title: c.eco_rewards?.title || 'Eco Reward',
               description: c.eco_rewards?.description || 'Get a discount with your points',
               points: c.eco_rewards?.points_required || 100,
               brand: c.eco_rewards?.sponsor_name || 'Green Sponsor',
               code: c.coupon_code || 'MOECO-ACTIVE'
            })));
          } else {
             const fallback = await storageService.getPartnerOffers();
             setCoupons(fallback);
          }
        }
      } catch (e) {
        console.warn("Coupon discovery failed, using fallback", e);
        const offers = await storageService.getPartnerOffers();
        setCoupons(offers);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Setup Realtime subscriptions
    const channel = supabase
      .channel('public:eco_hub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eco_coupons' }, () => {
         if (activeTab === 'badges') loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eco_rewards' }, () => {
         if (activeTab === 'badges') loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, user?.id]);

  // --- Souq Handlers ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const publicUrl = await storageService.uploadImage(file, 'products');
      setNewProduct({ ...newProduct, image: publicUrl });
      notificationService.success(language === 'ar' ? "تم رفع الصورة بنجاح" : "Image uploaded successfully");
    } catch (error) {
      notificationService.error(language === 'ar' ? "فشل رفع الصورة" : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await storageService.saveProduct({
        sellerId: user.id,
        sellerName: user.name,
        name: newProduct.name,
        price: newProduct.price,
        category: newProduct.category,
        image: newProduct.image || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=400',
        points: 100,
        description: newProduct.description
      });
      setShowAddProduct(false);
      setNewProduct({ name: '', price: '', category: 'Energy', description: '', image: '' });
      loadData();
      notificationService.success(language === 'ar' ? 'تم إضافة المنتج بنجاح' : 'Product added successfully');
    } catch (error) {
      notificationService.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handlePurchase = async (product: any) => {
    if (!user) return;
    const priceNum = parseInt(product.price.replace(/[^0-9]/g, ''));
    if (user.points < priceNum) {
      notificationService.error(language === 'ar' ? 'نقاطك غير كافية لإتمام هذه العملية' : 'Insufficient points');
      return;
    }
    try {
      await storageService.purchaseProduct(product.id);
      notificationService.success(language === 'ar' ? 'تم الشراء بنجاح!' : 'Purchase successful!');
      loadData();
    } catch (error) {
      notificationService.error(language === 'ar' ? 'فشل الشراء' : 'Purchase failed');
    }
  };

  // --- Donation Handlers ---
  const handleAddDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await storageService.createDonation(newDonation);
      notificationService.success(language === 'ar' ? 'تمت إضافة التبرع بنجاح' : 'Donation added successfully');
      setShowAddDonation(false);
      setNewDonation({ item_name: '', category: 'Clothes', description: '' });
      loadData();
    } catch (error) {
      notificationService.error(language === 'ar' ? 'حدث خطأ أثناء الإضافة' : 'Error adding donation');
    }
  };

  const getEcoRank = () => {
    const points = user?.points || 0;
    if (points > 5000) return { title: language === 'ar' ? 'حارس الكوكب' : 'Planet Guardian', color: 'text-purple-400', icon: Trophy, bg: 'bg-purple-500/10' };
    if (points > 2000) return { title: language === 'ar' ? 'بطل البيئة' : 'Eco Hero', color: 'text-blue-400', icon: Medal, bg: 'bg-blue-500/10' };
    if (points > 500) return { title: language === 'ar' ? 'مدافع أخضر' : 'Green Defender', color: 'text-emerald-400', icon: ShieldCheck, bg: 'bg-emerald-500/10' };
    return { title: language === 'ar' ? 'مبتدئ واعي' : 'Conscious Beginner', color: 'text-stone-400', icon: Star, bg: 'bg-stone-500/10' };
  };

  const rank = getEcoRank();
  const userRank = leaderboard.findIndex(u => u.id === user?.id) + 1;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-egypt-black p-8 rounded-[3rem] shadow-xl border border-zinc-100 dark:border-white/5">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-egypt-gold/10 rounded-[2rem] flex items-center justify-center border border-egypt-gold/20">
            <Award className="w-10 h-10 text-egypt-gold" />
          </div>
          <div>
            <h1 className="text-4xl font-black font-arabic tracking-tighter">
              {language === 'ar' ? 'مركز المكافآت والسوق' : 'Rewards & Market Hub'}
            </h1>
            <div className="flex items-center gap-4 mt-2">
               <p className="text-zinc-500 font-bold">
                 {language === 'ar' ? 'استبدل نقاطك، تبرع، وشارك في الاقتصاد الدائري' : 'Redeem points, donate, and join the circular economy'}
               </p>
               <div className="flex items-center gap-1 px-3 py-1 bg-orange-500/10 text-orange-600 rounded-full text-xs font-black">
                  <Flame size={14} />
                  {streak} {language === 'ar' ? 'يوم مستمر' : 'Day Streak'}
               </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2 p-2 bg-zinc-100 dark:bg-white/5 rounded-3xl border border-zinc-200 dark:border-white/10">
          {[
            { id: 'leaderboard', label: language === 'ar' ? 'الترتيب' : 'Leaderboard', icon: Trophy },
            { id: 'badges', label: language === 'ar' ? 'شارات والمستلقيات' : 'Badges & Titles', icon: Medal },
            { id: 'souq', label: language === 'ar' ? 'السوق البيئي' : 'Eco Souq', icon: ShoppingBag },
            { id: 'donations', label: language === 'ar' ? 'التبرعات' : 'Donations', icon: Heart },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all ${
                activeTab === tab.id 
                  ? 'bg-egypt-gold text-egypt-black shadow-lg' 
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'leaderboard' && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-[2rem] border border-emerald-200 dark:border-emerald-800 flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500 text-white rounded-2xl">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black">{dailyReward?.reward_name || (language === 'ar' ? 'مكافأة اليوم' : 'Daily Reward')}</h3>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  {language === 'ar' ? `احصل على ${dailyReward?.points_amount || 0} نقطة إضافية اليوم!` : `Get ${dailyReward?.points_amount || 0} extra points today!`}
                </p>
              </div>
            </div>
            <button 
              onClick={async () => {
                if(!dailyReward) return;
                try {
                  const result = await storageService.claimDailyReward(dailyReward.id);
                  if (result.success) {
                    notificationService.success(language === 'ar' ? `تم استلام ${result.pointsClaimed} نقطة!` : `${result.pointsClaimed} points claimed!`);
                    setDailyReward(null);
                    setStreak(result.streak);
                    if (user) {
                      setUser({ ...user, points: result.newTotalPoints, streak: result.streak });
                    }
                  }
                } catch(e: any) {
                  notificationService.error(e.message || (language === 'ar' ? 'تم استلامها مسبقاً' : 'Already claimed'));
                }
              }}
              disabled={!dailyReward}
              className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <Zap size={18} className="animate-pulse" />
              {language === 'ar' ? 'استلام' : 'Claim'}
            </button>
          </div>
        )}
        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-egypt-black p-8 rounded-[3rem] shadow-xl border border-zinc-100 dark:border-white/5 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-egypt-gold/20 to-transparent" />
                <div className={`w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center mb-6 relative z-10 ${rank.bg}`}>
                  <rank.icon className={`w-12 h-12 ${rank.color}`} />
                </div>
                <h3 className="text-3xl font-black font-arabic mb-2">{user?.name}</h3>
                <p className={`text-lg font-bold ${rank.color} mb-6`}>{rank.title}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{language === 'ar' ? 'النقاط' : 'Points'}</p>
                    <span className="text-2xl font-black">{user?.points || 0}</span>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{language === 'ar' ? 'الترتيب' : 'Rank'}</p>
                    <span className="text-2xl font-black text-egypt-gold">#{userRank > 0 ? userRank : '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="bg-white dark:bg-egypt-black p-8 rounded-[3rem] shadow-xl border border-zinc-100 dark:border-white/5">
                <h3 className="text-2xl font-black font-arabic mb-6 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-egypt-gold" />
                  {language === 'ar' ? 'لوحة الشرف' : 'Leaderboard'}
                </h3>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-egypt-gold" /></div>
                  ) : leaderboard.map((u, idx) => (
                    <div key={u.id} className={`p-4 rounded-2xl flex items-center justify-between transition-all ${u.id === user?.id ? 'bg-egypt-gold/10 border border-egypt-gold/30' : 'bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 hover:border-egypt-gold/50'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${idx === 0 ? 'bg-yellow-500 text-white' : idx === 1 ? 'bg-gray-400 text-white' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-zinc-200 dark:bg-white/10 text-zinc-500'}`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-black">{u.name}</p>
                          <p className="text-xs font-bold text-zinc-500">{u.points} {language === 'ar' ? 'نقطة' : 'pts'}</p>
                        </div>
                      </div>
                      {idx < 3 && <Medal className={`w-6 h-6 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-amber-700'}`} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <motion.div
            key="badges"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
             <div className="bg-egypt-gold/10 p-6 rounded-3xl border border-egypt-gold/30 text-center mb-8">
               <ShieldCheck className="w-12 h-12 text-egypt-gold mx-auto mb-4" />
               <h3 className="text-xl font-black mb-2">{language === 'ar' ? 'الشهادات والمستلقيات الرقمية' : 'Digital Badges & Certificates'}</h3>
               <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                 {language === 'ar' 
                   ? 'استخدم نقاطك البيئية لفتح شارات وألقاب رقمية مميزة تظهر بجوار اسمك في قائمة المتصدرين!' 
                   : 'Use your eco-points to unlock digital badges and titles that appear next to your name!'}
               </p>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                 { id: '1', title: language === 'ar' ? 'صديق الشجر' : 'Tree Friend', desc: language === 'ar' ? 'شارة مستوى أول تبرز اهتمامك بالأساسيات' : 'Level one badge for eco basics', points: 100, icon: Star },
                 { id: '2', title: language === 'ar' ? 'حارس البيئة' : 'Eco Guardian', desc: language === 'ar' ? 'لقب مرموق للذين حققوا أثراً ملحوظاً' : 'Prestigious title for significant impact', points: 500, icon: ShieldCheck },
                 { id: '3', title: language === 'ar' ? 'بطل الاستدامة' : 'Sustainability Hero', desc: language === 'ar' ? 'المستوى الذهبي للأشخاص المؤثرين' : 'Gold level for true influencers', points: 2000, icon: Trophy },
                 { id: '4', title: language === 'ar' ? 'سفير المناخ' : 'Climate Ambassador', desc: language === 'ar' ? 'أعلى وسام يمكن الحصول عليه في مدينة بورسعيد' : 'Highest honor in Port Said', points: 5000, icon: Award }
              ].map((badge) => (
                  <div key={badge.id} className="bg-white dark:bg-egypt-black p-6 rounded-[2rem] shadow-lg border border-zinc-100 dark:border-white/5 hover:border-egypt-gold/50 transition-colors group relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <badge.icon className="w-24 h-24 text-egypt-gold" />
                    </div>
                    <div className="relative z-10 text-center pt-4">
                      <div className="w-16 h-16 mx-auto bg-egypt-gold/10 rounded-2xl flex items-center justify-center mb-4 border border-egypt-gold/30">
                         <badge.icon className="w-8 h-8 text-egypt-gold" />
                      </div>
                      <h3 className="text-2xl font-black mb-2">{badge.title}</h3>
                      <p className="text-sm font-bold text-zinc-500 mb-6">{badge.desc}</p>
                    </div>
                    
                    <div className="relative z-10 mt-4">
                      <button 
                        onClick={() => notificationService.success(language === 'ar' ? 'تم الفتح بنجاح!' : 'Unlocked Successfully!')}
                        className="w-full py-4 bg-zinc-100/50 dark:bg-white/5 text-zinc-900 border border-egypt-gold/20 dark:text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-egypt-gold hover:text-black transition-colors"
                      >
                         <Trophy className="w-5 h-5"/>
                         {language === 'ar' ? `احصل عليها بـ ${badge.points} نقطة` : `Unlock for ${badge.points} PTS`}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Souq Tab */}
        {activeTab === 'souq' && (
          <motion.div
            key="souq"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black font-arabic">
                {language === 'ar' ? 'السوق البيئي' : 'Eco Souq'}
              </h3>
              <button
                onClick={() => setShowAddProduct(!showAddProduct)}
                className="px-6 py-3 bg-egypt-gold text-egypt-black rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Plus className="w-5 h-5" />
                {language === 'ar' ? 'إضافة منتج' : 'Add Product'}
              </button>
            </div>

            <AnimatePresence>
              {showAddProduct && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white dark:bg-egypt-black p-8 rounded-[3rem] shadow-xl border border-zinc-100 dark:border-white/5 overflow-hidden"
                >
                  <form onSubmit={handleAddProduct} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input type="text" required placeholder={language === 'ar' ? 'اسم المنتج' : 'Product Name'} value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-6 py-4 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl font-bold" />
                      <input type="text" required placeholder={language === 'ar' ? 'السعر (مثال: 100 نقطة)' : 'Price (e.g., 100 pts)'} value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-6 py-4 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl font-bold" />
                      <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-6 py-4 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl font-bold">
                        <option value="Energy">Energy</option>
                        <option value="Food">Food</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Tech">Tech</option>
                      </select>
                      <div className="relative">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="w-full px-6 py-4 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl font-bold flex items-center justify-center gap-2">
                          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                          {newProduct.image ? (language === 'ar' ? 'تم رفع الصورة' : 'Image Uploaded') : (language === 'ar' ? 'اختر صورة' : 'Choose Image')}
                        </div>
                      </div>
                    </div>
                    <textarea required placeholder={language === 'ar' ? 'الوصف' : 'Description'} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full px-6 py-4 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl font-bold h-32 resize-none" />
                    <button type="submit" disabled={isUploading} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black disabled:opacity-50">
                      {language === 'ar' ? 'حفظ المنتج' : 'Save Product'}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-egypt-gold" /></div>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <div key={product.id} className="bg-white dark:bg-egypt-black rounded-[2rem] shadow-lg border border-zinc-100 dark:border-white/5 overflow-hidden group">
                    <div className="h-48 overflow-hidden relative">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md text-white rounded-full text-xs font-black">
                        {product.category}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-black mb-2">{product.name}</h3>
                      <p className="text-sm font-bold text-zinc-500 mb-4 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between mb-6">
                        <span className="font-black text-emerald-500">{product.price}</span>
                        <span className="text-xs font-bold text-zinc-400">By {product.sellerName}</span>
                      </div>
                      <button onClick={() => handlePurchase(product)} className="w-full py-3 bg-zinc-100 dark:bg-white/5 rounded-xl font-black hover:bg-egypt-gold hover:text-egypt-black transition-colors">
                        {language === 'ar' ? 'شراء' : 'Buy'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-zinc-500 font-bold">
                  {language === 'ar' ? 'لا توجد منتجات متاحة حالياً.' : 'No products available currently.'}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Donations Tab */}
        {activeTab === 'donations' && (
          <motion.div
            key="donations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black font-arabic">
                {language === 'ar' ? 'مركز التبرعات' : 'Donation Hub'}
              </h3>
              <button
                onClick={() => setShowAddDonation(!showAddDonation)}
                className="px-6 py-3 bg-egypt-gold text-egypt-black rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Plus className="w-5 h-5" />
                {language === 'ar' ? 'إضافة تبرع' : 'Add Donation'}
              </button>
            </div>

            <AnimatePresence>
              {showAddDonation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white dark:bg-egypt-black p-8 rounded-[3rem] shadow-xl border border-zinc-100 dark:border-white/5 overflow-hidden"
                >
                  <form onSubmit={handleAddDonation} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input type="text" required placeholder={language === 'ar' ? 'اسم العنصر' : 'Item Name'} value={newDonation.item_name} onChange={e => setNewDonation({...newDonation, item_name: e.target.value})} className="w-full px-6 py-4 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl font-bold" />
                      <select value={newDonation.category} onChange={e => setNewDonation({...newDonation, category: e.target.value})} className="w-full px-6 py-4 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl font-bold">
                        <option value="Clothes">Clothes</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Food">Food</option>
                      </select>
                    </div>
                    <textarea required placeholder={language === 'ar' ? 'الوصف' : 'Description'} value={newDonation.description} onChange={e => setNewDonation({...newDonation, description: e.target.value})} className="w-full px-6 py-4 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl font-bold h-32 resize-none" />
                    <button type="submit" className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black">
                      {language === 'ar' ? 'حفظ التبرع' : 'Save Donation'}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-egypt-gold" /></div>
              ) : donations.length > 0 ? (
                donations.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-egypt-black p-6 rounded-[2rem] shadow-lg border border-zinc-100 dark:border-white/5 hover:border-egypt-gold/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
                          <Heart className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                          <p className="font-black">{item.item_name}</p>
                          <p className="text-xs text-zinc-500 font-bold">{item.category}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-black">
                        FREE
                      </span>
                    </div>
                    <p className="text-sm font-bold text-zinc-500 mb-6">{item.description}</p>
                    <button className="w-full py-3 bg-zinc-100 dark:bg-white/5 rounded-xl font-black hover:bg-egypt-gold hover:text-egypt-black transition-colors">
                      {language === 'ar' ? 'طلب العنصر' : 'Request Item'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-zinc-500 font-bold">
                  {language === 'ar' ? 'لا توجد تبرعات متاحة حالياً.' : 'No donations available currently.'}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Rewards;
