
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Leaf, TrendingUp, TrendingDown, Info, 
  Search, Filter, Star, Clock, MapPin, ArrowRight,
  ShieldCheck, Zap, Droplets, Flame, Globe, Sparkles,
  ChevronRight, Heart, ShoppingCart, Tag, Package,
  AlertCircle, CheckCircle2, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dailyServices } from '../services/dailyServices';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';

const EcoMarket: React.FC = () => {
  const { language, theme, isRtl, trackCarbon, user } = useApp();
  const [activeTab, setActiveTab] = useState<'commodities' | 'products' | 'services'>('commodities');
  const [searchQuery, setSearchQuery] = useState('');
  const [commodities, setCommodities] = useState<any[]>([]);
  const [ecoProducts, setEcoProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Recycled',
    price: '',
    impact: 'Low Carbon',
    image: 'https://picsum.photos/seed/eco/800/600'
  });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      notificationService.error(language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('eco_products')
        .insert({
          name: newProduct.name,
          category: newProduct.category,
          price: parseFloat(newProduct.price) || 0,
          impact: newProduct.impact,
          image_url: newProduct.image,
          seller_id: user.id,
          rating: 5.0, // Default rating for new products
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      setEcoProducts([data, ...ecoProducts]);
      setShowAddModal(false);
      notificationService.success(language === 'ar' ? 'تم إضافة المنتج بنجاح' : 'Product added successfully');
      setNewProduct({ name: '', category: 'Recycled', price: '', impact: 'Low Carbon', image: 'https://picsum.photos/seed/eco/800/600' });
    } catch (err: any) {
      console.error("Add product error:", err);
      notificationService.error(language === 'ar' ? `فشل في إضافة المنتج: ${err.message}` : `Failed to add product: ${err.message}`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pricesData, productsData] = await Promise.all([
          dailyServices.getPrices(),
          dailyServices.getEcoProducts()
        ]);
        setCommodities(pricesData);
        setEcoProducts(productsData);
      } catch (err) {
        console.error("Error fetching market data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className={`min-h-screen pb-32 ${theme === 'dark' ? 'bg-aeon-obsidian text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Header */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'dark' ? 'from-aeon-obsidian' : 'from-zinc-50'} to-transparent`} />
        <div className="absolute bottom-8 md:bottom-16 left-4 md:left-8 right-4 md:right-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-4 md:space-y-6"
          >
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-3 md:p-4 bg-aeon-cyan text-black rounded-2xl md:rounded-3xl shadow-[0_0_30px_rgba(0,245,255,0.4)]">
                <ShoppingBag className="w-6 h-6 md:w-10 md:h-10" />
              </div>
              <div>
                <span className="text-[8px] md:text-[10px] font-mono font-bold text-aeon-cyan uppercase tracking-[0.3em] md:tracking-[0.4em]">Marketplace Alpha</span>
                <h1 className="text-3xl md:text-6xl font-black font-display tracking-tighter uppercase whitespace-normal">
                  {language === 'ar' ? 'السوق البيئي' : 'Eco Market'}
                </h1>
              </div>
            </div>
            <p className="text-sm md:text-xl max-w-2xl font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3 md:line-clamp-none">
              {language === 'ar' 
                ? 'اكتشف أسعار السلع الأساسية، وتسوق منتجات صديقة للبيئة تدعم استدامة مدينتك.' 
                : 'Discover commodity prices and shop for eco-friendly products that support your city\'s sustainability.'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-6 md:-mt-10 relative z-10 space-y-8 md:space-y-12">
        {/* Navigation Tabs */}
        <div className="aeon-glass-panel p-2 md:p-3 rounded-2xl md:rounded-[3rem] flex overflow-x-auto no-scrollbar gap-2">
          {[
            { id: 'commodities', label: language === 'ar' ? 'أسعار السلع' : 'Commodity Prices', icon: Tag },
            { id: 'products', label: language === 'ar' ? 'منتجات خضراء' : 'Green Products', icon: Package },
            { id: 'services', label: language === 'ar' ? 'خدمات بيئية' : 'Eco Services', icon: Zap },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 md:gap-3 px-6 md:px-10 py-3 md:py-5 rounded-xl md:rounded-[2rem] transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-aeon-cyan text-black font-black shadow-[0_10px_25px_rgba(0,245,255,0.3)]' 
                  : 'text-zinc-500 hover:text-aeon-cyan hover:bg-aeon-cyan/5 font-bold'
              }`}
            >
              <tab.icon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-sm uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'commodities' && (
            <motion.div
              key="commodities"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-3xl font-black font-arabic flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-egypt-gold" />
                    {language === 'ar' ? 'أسعار السلع الأساسية في مصر' : 'Essential Commodity Prices in Egypt'}
                  </h2>
                  <p className="text-zinc-500 font-bold mt-1">
                    {language === 'ar' ? 'تحديثات مباشرة من مركز المعلومات ودعم اتخاذ القرار (IDSC)' : 'Live updates from IDSC'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-black border border-emerald-500/20">
                    {language === 'ar' ? 'السوق مستقر' : 'Market Stable'}
                  </div>
                  <button className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors">
                    <RefreshCw className="w-5 h-5 text-zinc-500" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className={`h-32 rounded-3xl animate-pulse ${theme === 'dark' ? 'bg-white/5' : 'bg-zinc-100'}`} />
                  ))
                ) : commodities.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="aeon-card p-8 group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-aeon-cyan/10 rounded-2xl flex items-center justify-center border border-aeon-cyan/20 group-hover:bg-aeon-cyan/20 transition-colors">
                          <Tag className="w-7 h-7 text-aeon-cyan" />
                        </div>
                        <div>
                          <h4 className="font-black text-xl font-display">{item.product}</h4>
                          <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.2em]">{item.source}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-egypt-gold">{item.price} <span className="text-xs">EGP</span></p>
                        <div className="flex items-center gap-1 justify-end text-[10px] font-black text-emerald-500">
                          <TrendingDown className="w-3 h-3" />
                          <span>-2%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-white/5">
                      <span className="text-[10px] font-bold text-zinc-500">{item.city}</span>
                      <span className="text-[10px] font-bold text-zinc-500">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black font-arabic">
                  {language === 'ar' ? 'منتجات صديقة للبيئة' : 'Eco-Friendly Products'}
                </h2>
                <div className="flex gap-2">
                  <button className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl"><Filter className="w-5 h-5 text-zinc-500" /></button>
                  <button className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl"><Search className="w-5 h-5 text-zinc-500" /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className={`h-80 rounded-[2.5rem] animate-pulse ${theme === 'dark' ? 'bg-white/5' : 'bg-zinc-100'}`} />
                  ))
                ) : ecoProducts.length > 0 ? (
                  ecoProducts.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`group rounded-[2.5rem] overflow-hidden border transition-all ${theme === 'dark' ? 'bg-zinc-900/50 border-white/5 hover:border-egypt-gold/30' : 'bg-white border-zinc-200 shadow-xl hover:border-egypt-gold/50'}`}
                    >
                      <div className="relative h-56 overflow-hidden">
                        <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 border border-white/10">
                          <Star className="w-3 h-3 text-egypt-gold fill-egypt-gold" />
                          <span className="text-[10px] font-bold text-white">{product.rating || '4.5'}</span>
                        </div>
                        <div className="absolute bottom-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                          {product.impact}
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-black mb-1">{product.name}</h3>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{product.category}</span>
                          </div>
                          <p className="text-xl font-black text-egypt-gold">{product.price}</p>
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => {
                              trackCarbon('eco_purchase', 'waste', -1, { product: product.name, price: product.price });
                              notificationService.success(language === 'ar' ? 'تمت عملية الشراء بنجاح' : 'Purchase successful');
                            }}
                            className="flex-1 py-3 bg-egypt-gold text-egypt-black rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                          >
                            {language === 'ar' ? 'شراء الآن' : 'Buy Now'}
                          </button>
                          <button className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl hover:text-red-500 transition-colors">
                            <Heart className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-20">
                    <Package className="w-16 h-16 text-zinc-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-black text-zinc-600 dark:text-zinc-400">
                      {language === 'ar' ? 'لا توجد منتجات متاحة حالياً' : 'No products available currently'}
                    </h3>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Banner */}
        <div className={`p-10 rounded-[4rem] border flex flex-col md:flex-row items-center gap-8 ${theme === 'dark' ? 'bg-gradient-to-br from-egypt-gold/10 to-transparent border-egypt-gold/20' : 'bg-egypt-gold/5 border-egypt-gold/30'}`}>
          <div className="w-20 h-20 bg-egypt-gold text-egypt-black rounded-[2rem] flex items-center justify-center shrink-0 shadow-2xl shadow-egypt-gold/20">
            <Sparkles className="w-10 h-10" />
          </div>
          <div className="flex-1 text-center md:text-left rtl:md:text-right">
            <h3 className="text-2xl font-black font-arabic mb-2">
              {language === 'ar' ? 'هل تبيع منتجات مستدامة؟' : 'Selling Sustainable Products?'}
            </h3>
            <p className={`font-bold ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {language === 'ar' 
                ? 'انضم إلى شبكة تجار مو إيكو وساهم في بناء اقتصاد أخضر في مدينتك. احصل على مميزات حصرية ووصول لآلاف المستخدمين.' 
                : 'Join the MoEco merchant network and contribute to building a green economy in your city. Get exclusive benefits and reach thousands of users.'}
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-10 py-5 bg-egypt-black text-egypt-gold rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shrink-0"
          >
            {language === 'ar' ? 'انضم كتاجر' : 'Join as Merchant'}
          </button>
        </div>

        {/* Add Product Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className={`w-full max-w-lg p-8 rounded-[3rem] border ${theme === 'dark' ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'}`}
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black font-arabic">
                    {language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}
                  </h3>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full">
                    <AlertCircle className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleAddProduct} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'اسم المنتج' : 'Product Name'}</label>
                    <input 
                      required
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full p-4 rounded-2xl bg-zinc-100 dark:bg-white/5 border-none font-bold" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'السعر (ج.م)' : 'Price (EGP)'}</label>
                      <input 
                        required
                        type="number"
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: e.target.value + ' EGP'})}
                        className="w-full p-4 rounded-2xl bg-zinc-100 dark:bg-white/5 border-none font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'الفئة' : 'Category'}</label>
                      <select 
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                        className="w-full p-4 rounded-2xl bg-zinc-100 dark:bg-white/5 border-none font-bold"
                      >
                        <option value="Recycled">Recycled</option>
                        <option value="Organic">Organic</option>
                        <option value="Solar">Solar</option>
                        <option value="Handmade">Handmade</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{language === 'ar' ? 'الأثر البيئي' : 'Eco Impact'}</label>
                    <input 
                      value={newProduct.impact}
                      onChange={e => setNewProduct({...newProduct, impact: e.target.value})}
                      placeholder="e.g. Zero Waste, Carbon Neutral"
                      className="w-full p-4 rounded-2xl bg-zinc-100 dark:bg-white/5 border-none font-bold" 
                    />
                  </div>
                  <button type="submit" className="w-full py-5 bg-aeon-cyan text-black rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-aeon-cyan/20">
                    {language === 'ar' ? 'نشر المنتج الآن' : 'Publish Product Now'}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EcoMarket;
