
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, TrendingDown, TrendingUp, Receipt, 
  PieChart, ArrowRight, Plus, CreditCard, 
  ChevronLeft, ShoppingBag, Zap, Droplets, Flame
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { dailyServices } from '../services/dailyServices';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

const EcoWallet: React.FC = () => {
  const { language, isRtl, theme, user } = useApp();
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'bills'>('overview');

  useEffect(() => {
    if (user) {
      storageService.getWalletData(user.id).then((data) => {
        setWalletData(data);
        setLoading(false);
      }).catch(console.error);
    }
  }, [user]);

  const handleDeposit = async () => {
    try {
      const amount = prompt(language === 'ar' ? 'أدخل المبلغ للإيداع (EGP)' : 'Enter amount to deposit (EGP)');
      if (amount && !isNaN(Number(amount))) {
        await storageService.depositCoins(user!.id, Number(amount));
        notificationService.success(language === 'ar' ? 'تم الإيداع بنجاح' : 'Deposit successful');
        const updated = await storageService.getWalletData(user!.id);
        setWalletData(updated);
      }
    } catch (e) {
      notificationService.error(language === 'ar' ? 'فشل الإيداع' : 'Deposit failed');
    }
  };

  const handleRedeem = async () => {
    try {
      const points = prompt(language === 'ar' ? 'أدخل عدد النقاط للاستبدال (نسبة 2:1)' : 'Enter points to redeem (2:1 ratio)');
      if (points && !isNaN(Number(points))) {
        await storageService.redeemPointsToCoins(user!.id, Number(points));
        notificationService.success(language === 'ar' ? 'تم تحويل النقاط إلى عملات' : 'Points converted to coins');
        const updated = await storageService.getWalletData(user!.id);
        setWalletData(updated);
      }
    } catch (e: any) {
      notificationService.error(e.message);
    }
  };

  if (loading) return <div className="text-center pt-20">Loading...</div>;
  if (!walletData) return <div className="text-center pt-20">No data found</div>;

  const { profile, transactions, bills } = walletData;

  return (
    <div className="section-container min-h-screen pb-32 pt-8 bg-slate-950" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-16">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 md:w-14 md:h-14 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-500 transition-all border border-white/5"
          >
            <ChevronLeft className={`w-5 h-5 md:w-8 md:h-8 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <h1 className="text-3xl md:text-6xl font-black font-arabic tracking-tighter italic leading-none mb-1 md:mb-2 text-white">
              {language === 'ar' ? 'البنك البيئي' : 'ECO RESERVE'}
            </h1>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[8px] md:text-[10px] flex items-center gap-2">
              <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {language === 'ar' ? 'إجمالي الرصيد الرقمي والأصول المستدامة' : 'TOTAL DIGITAL RESERVE & SUSTAINABLE ASSETS'}
            </p>
          </div>
        </div>

        {/* Balance Card - The "Credit Hub" */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="aeon-glass-panel p-1 border-white/10 shadow-2xl mb-8 md:mb-12 overflow-hidden group"
        >
          <div className="relative p-6 sm:p-10 bg-gradient-to-br from-rose-600/20 via-transparent to-transparent rounded-[1.8rem] md:rounded-[2.8rem]">
             <div className="absolute top-0 right-0 w-full sm:w-96 h-96 bg-rose-500/10 blur-[120px] rounded-full -mr-48 -mt-48 transition-all group-hover:scale-110" />
             
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 mb-8 md:mb-12">
                <div className="space-y-3 md:space-y-4">
                   <div className="flex items-center gap-2 md:gap-3">
                      <Wallet className="w-4 h-4 md:w-5 md:h-5 text-rose-500" />
                      <span className="text-[8px] md:text-[10px] font-black uppercase text-zinc-500 tracking-widest leading-none">{language === 'ar' ? 'محفظة نشطة' : 'ACTIVE WALLET'}</span>
                   </div>
                   <h2 className="text-4xl md:text-7xl font-black tabular-nums tracking-tighter text-white">
                      {profile.points.toLocaleString()} <span className="text-sm md:text-xl font-black text-rose-500 uppercase">PTS</span>
                   </h2>
                </div>
                <div className="space-y-1 md:space-y-2 text-left md:text-right">
                   <p className="text-[8px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest">{language === 'ar' ? 'القيمة التقديرية' : 'ESTIMATED VALUE'}</p>
                   <p className="text-xl md:text-3xl font-black tabular-nums text-white">≈ {(profile.points / 10).toFixed(2)} <span className="text-[10px] text-zinc-500 italic uppercase">EGP</span></p>
                </div>
             </div>

             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <button 
                  onClick={handleDeposit}
                  className="flex-1 py-3.5 md:py-5 bg-white text-black rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                >
                   <Plus className="w-4 h-4 md:w-5 md:h-5" />
                   {language === 'ar' ? 'تمويل' : 'Deposit'}
                </button>
                <button 
                  onClick={handleRedeem}
                  className="flex-1 py-3.5 md:py-5 bg-white/5 border border-white/10 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 hover:bg-white/10 transition-all active:scale-95"
                >
                   <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
                   {language === 'ar' ? 'صرف' : 'Redeem'}
                </button>
             </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-10 overflow-x-auto no-scrollbar pb-2">
          {(['overview', 'bills'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border whitespace-normal sm:whitespace-nowrap break-words ${
                activeTab === tab 
                ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' 
                : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/20'
              }`}
            >
              {language === 'ar' 
                ? (tab === 'overview' ? 'التدفق المالي' : 'الفواتير المستحقة')
                : tab.toUpperCase()}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              <div className="aeon-glass-panel p-10 border-white/5">
                <div className="flex items-center justify-between mb-10">
                   <h3 className="text-xl font-black font-arabic italic">{language === 'ar' ? 'سجل التدفقات' : 'FLOW LOGS'}</h3>
                   <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                      <TrendingUp className="text-emerald-500" size={14} />
                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">+12% Monthly Growth</span>
                   </div>
                </div>
                <div className="space-y-4">
                  {transactions.map((tx: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-white/10 transition-all">
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110 ${tx.points > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          <Receipt className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-black text-lg tracking-tight uppercase group-hover:text-rose-500 transition-colors">{tx.reason || 'Asset Sync'}</p>
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className={`text-2xl font-black tabular-nums transition-all ${tx.points > 0 ? 'text-emerald-500' : 'text-white'}`}>
                           {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()}
                         </span>
                         <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">ECO-CREDITS</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'bills' && (
            <motion.div
              key="bills"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-6">
                {bills.map((bill: any) => {
                  const billType = bill.bill_type?.toLowerCase() || 'electricity';
                  const isWater = billType === 'water';
                  const isGas = billType === 'gas';
                  const iconColor = isWater ? 'text-blue-500' : isGas ? 'text-orange-500' : 'text-amber-500';
                  
                  const consumption = bill.consumption_value || 0;
                  const eFactor = isWater ? 0.1 : isGas ? 2.31 : 0.53;
                  const emissions = consumption * eFactor;
                  const tier = consumption > 500 ? 'High' : consumption > 200 ? 'Medium' : 'Low';
                  const tierColor = tier === 'High' ? 'text-red-500' : tier === 'Medium' ? 'text-amber-500' : 'text-emerald-500';

                  return (
                    <div key={bill.id} className="aeon-glass-panel p-6 md:p-10 border-white/5 relative overflow-hidden group">
                      <div className={`absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-current via-transparent opacity-[0.03] transition-opacity group-hover:opacity-[0.06] ${iconColor.replace('text-', 'bg-')}`} />
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 mb-8 md:mb-10">
                        <div className="flex items-center gap-4 md:gap-6">
                          <div className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[1.8rem] bg-white/5 flex items-center justify-center border border-white/10 shadow-xl transition-all group-hover:scale-110 group-hover:rotate-3 ${iconColor}`}>
                            {isWater ? <Droplets className="w-7 h-7 md:w-10 md:h-10" /> : isGas ? <Flame className="w-7 h-7 md:w-10 md:h-10" /> : <Zap className="w-7 h-7 md:w-10 md:h-10" />}
                          </div>
                          <div>
                            <h4 className="text-xl md:text-3xl font-black font-arabic tracking-tight mb-1 uppercase text-white">{language === 'ar' ? (isWater ? 'دورة المياه' : isGas ? 'تدفق الغاز' : 'الشبكة الذكية') : billType}</h4>
                            <p className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">{language === 'ar' ? 'تاريخ الاستحقاق' : 'NEXT CYCLE'} {bill.due_date ? new Date(bill.due_date).toLocaleDateString() : 'REAL-TIME'}</p>
                          </div>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-3xl md:text-5xl font-black tabular-nums tracking-tighter mb-1 text-white">{bill.amount.toLocaleString()} <span className="text-[10px] md:text-xs opacity-40 uppercase">EGP</span></p>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest border ${
                             bill.status === 'Paid' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-rose-500/20 text-rose-500 bg-rose-500/5'
                           }`}>
                            {language === 'ar' ? (bill.status === 'Paid' ? 'مدفوع بالكامل' : 'قيد الانتظار') : bill.status}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-8 md:pt-10 border-t border-white/5">
                        <div className="space-y-1">
                          <p className="text-[8px] md:text-[9px] font-black text-zinc-600 uppercase tracking-widest">{language === 'ar' ? 'الاستهلاك' : 'CONSUMPTION'}</p>
                          <p className="text-lg md:text-xl font-black tabular-nums text-white">{consumption.toLocaleString()} <span className="text-[8px] md:text-[10px] opacity-40 uppercase font-bold">{isWater || isGas ? 'm³' : 'kWh'}</span></p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] md:text-[9px] font-black text-emerald-600 uppercase tracking-widest">{language === 'ar' ? 'البصمة' : 'CARBON COST'}</p>
                          <p className="text-lg md:text-xl font-black tabular-nums text-emerald-500">{(emissions).toFixed(1)} <span className="text-[8px] md:text-[10px] opacity-40 uppercase font-bold">kg</span></p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] md:text-[9px] font-black text-zinc-600 uppercase tracking-widest">{language === 'ar' ? 'المعامل' : 'EFFICIENCY'}</p>
                          <p className="text-lg md:text-xl font-black tabular-nums text-white">{eFactor} <span className="text-[8px] md:text-[10px] opacity-40 uppercase font-bold text-white">x</span></p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] md:text-[9px] font-black text-zinc-600 uppercase tracking-widest">{language === 'ar' ? 'التصنيف' : 'EFF-TIER'}</p>
                          <p className={`text-lg md:text-xl font-black uppercase tracking-tighter ${tierColor}`}>{language === 'ar' ? (tier === 'High' ? 'حرج' : tier === 'Medium' ? 'طبيعي' : 'مثالي') : tier}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EcoWallet;
