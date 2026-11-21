import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, Zap, Droplets, Utensils, Plane, Trash2, ShoppingBag, Flame,
  ArrowRight, Sparkles, Calculator as CalcIcon, History as HistoryIcon,
  TrendingUp, Leaf, Award, ChevronLeft, Save, Info, AlertCircle,
  Camera, Upload, CheckCircle2, XCircle, RefreshCw, Ticket, Map as MapIcon,
  Gift, ExternalLink, Scan, Loader2, Tag, BookOpen, Landmark, ShieldCheck, Crown, ChevronRight, Wallet, Plus, MoreHorizontal,
  BrainCircuit, Factory, Wind, ThermometerSun, MapPin, Share2, Download, Activity
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase, getSafeSession, safeRequest } from '../services/supabaseClient';
import { notificationService } from '../services/notificationService';
import { couponService, Coupon } from '../services/couponService';
import Webcam from 'react-webcam';

import { useNavigate, Link, useLocation } from 'react-router-dom';

import { calculationEngine } from '../services/calculationEngine';
import { storageService } from '../services/storageService';
import { aiService } from '../services/aiService';
import { INTERCITY_DATA, IntercityHub, IntercityRoute } from '../constants/intercityData';
import { SERVICE_ROUTES, ServiceRoute } from '../constants/serviceRoutes';

import { errorLogger } from '../services/errorLogger';

type ActivityType = 'transport' | 'electricity' | 'water' | 'gas' | 'food' | 'shopping';

const SmartCalculator: React.FC = () => {
  const { language, user, isRtl, setRefreshKey } = useApp();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'calculate' | 'history'>('calculate');
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  
  const location = useLocation();
  const locationState = location.state as { initialType: ActivityType } | null;

  const [factors, setFactors] = useState<any>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [geoInsight, setGeoInsight] = useState<string>('');
  const [history, setHistory] = useState<any[]>([]);
  const [rewardCoupon, setRewardCoupon] = useState<Coupon | null>(null);
  const [stats, setStats] = useState({
    monthlyTotal: 0,
    previousMonthTotal: 0,
    improvementPerc: 0,
    moneySaved: 0
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await calculationEngine.init();
        setFactors(calculationEngine.emissionFactors || {});
        
        // Fetch geo insight (Default to Cairo if no valid governorate found in profile)
        const insight = await aiService.getGeoInsights('Cairo', language);
        setGeoInsight(insight);

        // Fetch dynamic sectors
        const sectors = await storageService.getSectors();
        if (sectors && sectors.length > 0) {
          const mappedCategories = sectors.map((s: any) => {
            const config = getCategoryConfig(s.id || s.name_en?.toLowerCase() || s.name?.toLowerCase());
            return {
              ...s,
              id: s.id || s.name_en?.toLowerCase() || s.name?.toLowerCase(),
              name: isRtl ? (s.name_ar || s.name) : (s.name_en || s.name),
              icon: config.icon,
              color: config.color,
              bg: config.bg,
              unit: s.unit || config.unit || 'units',
              fields: s.fields || config.fields || [{ id: 'usage', label: isRtl ? 'الاستهلاك' : 'Usage' }]
            };
          });
          setCategories(mappedCategories);
        } else {
          setCategories(defaultCategories);
        }
      } catch (err) {
        console.error("Failed to load calculator support data:", err);
        setCategories(defaultCategories);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadData();
    if (locationState?.initialType) {
      setSelectedType(locationState.initialType);
    }
    fetchHistory();
    
    // Realtime subscription for carbon records
    const channel = supabase
      .channel('consumption_records_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'consumption_records' }, 
        () => {
          fetchHistory();
          if (setRefreshKey) setRefreshKey(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationState, isRtl]);

  const getCategoryConfig = (id: string) => {
    const configs: Record<string, any> = {
      electricity: { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', unit: 'kWh', fields: [{ id: 'prevReading', label: isRtl ? 'القراءة السابقة' : 'Prev' }, { id: 'currReading', label: isRtl ? 'القراءة الحالية' : 'Curr' }] },
      water: { icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50', unit: 'm³', fields: [{ id: 'prevReading', label: isRtl ? 'القراءة السابقة' : 'Prev' }, { id: 'currReading', label: isRtl ? 'القراءة الحالية' : 'Curr' }] },
      gas: { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', unit: 'm³', fields: [{ id: 'prevReading', label: isRtl ? 'القراءة السابقة' : 'Prev' }, { id: 'currReading', label: isRtl ? 'القراءة الحالية' : 'Curr' }] },
      transport: { icon: Car, color: 'text-emerald-500', bg: 'bg-emerald-50', unit: 'km', fields: [{ id: 'distance', label: isRtl ? 'المسافة' : 'Distance' }] },
      food: { icon: Utensils, color: 'text-red-500', bg: 'bg-red-50', unit: 'kg', fields: [{ id: 'meat', label: isRtl ? 'اللحوم' : 'Meat' }, { id: 'veg', label: isRtl ? 'الخضروات' : 'Veg' }] },
      shopping: { icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-50', unit: 'items', fields: [{ id: 'items', label: isRtl ? 'القطع' : 'Items' }] }
    };
    return configs[id] || { icon: Sparkles, color: 'text-slate-500', bg: 'bg-slate-50', unit: 'units', fields: [{ id: 'usage', label: isRtl ? 'الاستهلاك' : 'Usage' }] };
  };

  const defaultCategories = [
    { id: 'electricity', name: isRtl ? 'الكهرباء' : 'Electricity', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', unit: 'kWh', fields: [{ id: 'prevReading', label: isRtl ? 'القراءة السابقة' : 'Prev' }, { id: 'currReading', label: isRtl ? 'القراءة الحالية' : 'Curr' }] },
    { id: 'water', name: isRtl ? 'المياه' : 'Water', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50', unit: 'm³', fields: [{ id: 'prevReading', label: isRtl ? 'القراءة السابقة' : 'Prev' }, { id: 'currReading', label: isRtl ? 'القراءة الحالية' : 'Curr' }] },
    { id: 'gas', name: isRtl ? 'الغاز' : 'Gas', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', unit: 'm³', fields: [{ id: 'prevReading', label: isRtl ? 'القراءة السابقة' : 'Prev' }, { id: 'currReading', label: isRtl ? 'القراءة الحالية' : 'Curr' }] },
    { id: 'transport', name: isRtl ? 'النقل' : 'Transport', icon: Car, color: 'text-emerald-500', bg: 'bg-emerald-50', unit: 'km', fields: [{ id: 'distance', label: isRtl ? 'المسافة' : 'Distance' }] },
    { id: 'food', name: isRtl ? 'الغذاء' : 'Food', icon: Utensils, color: 'text-red-500', bg: 'bg-red-50', unit: 'kg', fields: [{ id: 'meat', label: isRtl ? 'اللحوم' : 'Meat' }, { id: 'veg', label: isRtl ? 'الخضروات' : 'Veg' }] },
    { id: 'shopping', name: isRtl ? 'التسوق' : 'Shopping', icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-50', unit: 'items', fields: [{ id: 'items', label: isRtl ? 'القطع' : 'Items' }] }
  ];

  const fetchHistory = async () => {
    try {
      const session = await getSafeSession();
      const currentUserId = user?.id || session?.user?.id || 'guest';
      const records = await storageService.fetchUserHistory(currentUserId);
      setHistory(records.slice(0, 10));

      // Calculate stats for comparison
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const monthlyRecs = records.filter(r => {
        const d = new Date(r.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const prevMonthlyRecs = records.filter(r => {
        const d = new Date(r.created_at);
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
      });

      const currentTotal = monthlyRecs.reduce((sum, r) => sum + (r.carbon_impact || r.co2_impact || r.co2 || 0), 0);
      const prevTotal = prevMonthlyRecs.reduce((sum, r) => sum + (r.carbon_impact || r.co2_impact || r.co2 || 0), 0);
      
      setStats({
        monthlyTotal: currentTotal,
        previousMonthTotal: prevTotal,
        improvementPerc: prevTotal > 0 ? ((prevTotal - currentTotal) / prevTotal) * 100 : 0,
        moneySaved: currentTotal * 0.5
      });
    } catch (e) {
      errorLogger.log(e, 'SmartCalculator:fetchHistory');
    }
  };

  useEffect(() => {
    const calculateAndAutoSave = async () => {
      if (!selectedType) {
        setResult(null);
        return;
      }
      
      let consumption = 0;
      if (['electricity', 'water', 'gas'].includes(selectedType)) {
          consumption = (parseFloat(inputs.currReading) || 0) - (parseFloat(inputs.prevReading) || 0);
          if (consumption < 0) return;
      } else if (inputs.usage) consumption = parseFloat(inputs.usage);
      else if (inputs.distance) consumption = parseFloat(inputs.distance);
      else if (inputs.items) consumption = parseFloat(inputs.items);
      else if (selectedType === 'food') {
        consumption = (parseFloat(inputs.meat) || 0) + (parseFloat(inputs.veg) || 0);
      }

      const hasMeaningfulInput = consumption > 0 || (selectedType === 'food' && (parseFloat(inputs.meat) > 0 || parseFloat(inputs.veg) > 0));

      if (!hasMeaningfulInput) {
        setResult(null);
        return;
      }

      try {
        const selectedCategory = categories.find(c => c.id === selectedType);
        const metadata = { ...inputs, usage: consumption, unit: selectedCategory?.unit || 'unknown' };
        const calcResult = await calculationEngine.calculate(selectedType, consumption, metadata);
        
        const finalResult = {
          ...calcResult,
          consumption,
          insight: calculationEngine.getSmartAdvice(selectedType, consumption, language),
          timestamp: new Date().toISOString()
        };
        
        setResult(finalResult);

        // Auto-save logic with user check
        if (consumption > 0) {
          console.log(`[Auto-Save] Queuing record for ${selectedType}`);
          
          const session = await getSafeSession();
          const uid = user?.id || session?.user?.id || 'guest';
          
          storageService.insertConsumptionRecord({
            user_id: uid,
            sector: selectedType,
            value: consumption,
            unit: selectedCategory?.unit || 'unknown',
            co2: calcResult.co2,
            co2_impact: calcResult.co2,
            cost: calcResult.totalCost,
            description: `${isRtl ? 'حفظ تلقائي' : 'Auto-Save'}: ${selectedType}`,
            metadata: { ...metadata, auto_saved: true, tier: calcResult.tier }
          }).then(() => {
            // Vital update: Re-fetch the history so the user sees the new entry immediately
            fetchHistory();
            console.log("[Auto-Save] Successfully saved");
          }).catch(e => {
            console.error("Background auto-save failed:", e);
          });
        }
      } catch (error) {
         console.error("Live calculation/auto-save failed:", error);
      }
    };
    
    // Use a 2-second debounce for auto-save to ensure the user has finished inputting
    const timeout = setTimeout(() => {
      calculateAndAutoSave();
    }, 2000);
    return () => clearTimeout(timeout);
  }, [inputs, selectedType, categories, language, user?.id]);

  const handleCalculateAndSaveDirectly = async () => {
    if (!selectedType) return;
    setIsCalculating(true);

    try {
      let consumption = 0;
      if (['electricity', 'water', 'gas'].includes(selectedType)) {
          consumption = (parseFloat(inputs.currReading) || 0) - (parseFloat(inputs.prevReading) || 0);
          if (consumption < 0) {
            notificationService.error(isRtl ? 'القراءة الحالية يجب أن تكون أكبر من السابقة' : 'Current reading must be higher than previous');
            setIsCalculating(false);
            return;
          }
      } else if (inputs.usage) consumption = parseFloat(inputs.usage);
      else if (inputs.distance) consumption = parseFloat(inputs.distance);
      else if (inputs.items) consumption = parseFloat(inputs.items);
      else if (selectedType === 'food') {
        consumption = (parseFloat(inputs.meat) || 0) + (parseFloat(inputs.veg) || 0);
      }

      const hasMeaningfulInput = consumption > 0 || (selectedType === 'food' && (parseFloat(inputs.meat) > 0 || parseFloat(inputs.veg) > 0));

      if (!hasMeaningfulInput) {
        notificationService.error(isRtl ? 'يرجى إدخال قيم صالحة للاستهلاك أولاً' : 'Please enter valid consumption values first');
        setIsCalculating(false);
        return;
      }

      const selectedCategory = categories.find(c => c.id === selectedType);
      const metadata = { ...inputs, usage: consumption, unit: selectedCategory?.unit || 'unknown' };
      const calcResult = await calculationEngine.calculate(selectedType, consumption, metadata);
      
      const finalResult = {
        ...calcResult,
        consumption,
        insight: calculationEngine.getSmartAdvice(selectedType, consumption, language),
        timestamp: new Date().toISOString()
      };
      
      setResult(finalResult);

      const session = await getSafeSession();
      const uid = user?.id || session?.user?.id || 'guest';

      await storageService.insertConsumptionRecord({
        user_id: uid,
        sector: selectedType,
        value: consumption,
        unit: selectedCategory?.unit || 'unknown',
        co2: calcResult.co2,
        co2_impact: calcResult.co2,
        cost: calcResult.totalCost,
        description: `${isRtl ? 'حساب مباشر' : 'Direct Calculation'}: ${selectedType}`,
        metadata: { ...metadata, manual_saved: true, tier: calcResult.tier }
      });

      if (uid !== 'guest' && calcResult.points > 0) {
        await storageService.awardPoints(uid, calcResult.points, `Calculation: ${selectedType}`);
      }

      notificationService.success(isRtl ? 'تم الحساب وحفظ العملية بنجاح!' : 'Calculated and saved successfully!');
      fetchHistory();
    } catch (error) {
      console.error("Direct calculation failed:", error);
      notificationService.error(isRtl ? 'عذراً، فشل حساب أو حفظ العملية' : 'Sorry, calculation or save failed');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSaveRecord = async () => {
    if (!result || !selectedType) return;
    setIsCalculating(true);
    
    try {
      const selectedCategory = categories.find(c => c.id === selectedType);
      const metadata = { ...inputs, usage: result.consumption, unit: selectedCategory?.unit || 'unknown' };
      
      const session = await getSafeSession();
      const currentUserId = user?.id || session?.user?.id;

      if (currentUserId) {
        try {
          const dbTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("DB Timeout")), 6000));
          await Promise.race([
            storageService.insertConsumptionRecord({
              user_id: currentUserId,
              sector: selectedType,
              value: result.consumption,
              unit: selectedCategory?.unit || 'unknown',
              co2: result.co2,
              co2_impact: result.co2,
              cost: result.totalCost,
              description: `${isRtl ? 'حساب' : 'Calculation'}: ${selectedType}`,
              metadata: { ...metadata, tier: result.tier, emission_factor: result.appliedFactor }
            }),
            dbTimeout
          ]);
          
          if (result.points > 0) {
            await storageService.awardPoints(currentUserId, result.points, `Calculation: ${selectedType}`);
          }
        } catch (err) {
          console.warn("Soft failure on DB save:", err);
        }
        
        if (setRefreshKey) setRefreshKey(prev => prev + 1);
      }
      
      notificationService.success(isRtl ? 'تم الحفظ بنجاح' : 'Record Saved');
      
      fetchHistory();
      
      try {
        const couponTimeout = new Promise<{ coupons: any[] }>((_, reject) => 
          setTimeout(() => reject(new Error('Coupon Timeout')), 4000)
        );
        const couponsResult = await Promise.race([
          couponService.fetchAllCoupons(),
          couponTimeout
        ]);
        if (couponsResult.coupons?.length > 0) {
          setRewardCoupon(couponsResult.coupons[0]);
        }
      } catch (e) {
        console.warn("Coupons fetch skipped/failed:", e);
      }
      
      setInputs({});
      setResult(null);
      setSelectedType(null);
    } catch (error: any) {
      errorLogger.log(error, 'SmartCalculator:handleSaveRecord');
      notificationService.error(isRtl ? 'فشل الحفظ' : 'Saving failed');
    } finally {
      setIsCalculating(false);
    }
  };



  return (
    <div className="max-w-7xl mx-auto px-4 pb-32 space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. HERO HEADER */}
      <div className="relative bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 sm:p-10 md:p-16 overflow-hidden shadow-2xl">
         <div className="egyptian-pattern absolute inset-0 opacity-[0.05]" />
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12">
            <div className="space-y-4 md:space-y-6 text-center md:text-left">
               <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 bg-eco-green/10 rounded-full border border-eco-green/20">
                  <BrainCircuit size={14} className="text-eco-green animate-pulse" />
                  <span className="text-[8px] md:text-[10px] font-black text-eco-green uppercase tracking-widest leading-none">
                     {isRtl ? 'منظومة الذكاء البيئي الوطني' : 'National Eco Intelligent System'}
                  </span>
               </div>
               <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white italic tracking-tighter">
                  {isRtl ? 'حاسبة البصمة الكربونية' : 'Carbon Footprint Engine'}
               </h1>
               <p className="text-slate-400 font-bold max-w-xl text-sm md:text-lg">
                  {isRtl ? 'حلل استهلاكك، اكتشف أثرك البيئي، واربح مكافآت حصرية مقابل كل كجم كربون توفره.' : 'Analyze consumption, discover impact, and earn rewards for every kg of carbon saved.'}
               </p>
            </div>
      {/* 2. STATS OVERVIEW - Comparison Logic */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: isRtl ? 'إجمالي الشهر' : 'Monthly Total', value: `${stats.monthlyTotal.toFixed(1)} kg`, icon: Leaf, color: 'text-emerald-500', trend: stats.improvementPerc > 0 ? 'down' : 'up' },
          { label: isRtl ? 'مقارنة بالشهر السابق' : 'vs Previous Month', value: `${Math.abs(stats.improvementPerc).toFixed(0)}%`, icon: TrendingUp, color: stats.improvementPerc > 0 ? 'text-eco-green' : 'text-rose-500', 
            sub: stats.improvementPerc > 0 ? (isRtl ? 'تحسن' : 'Improvement') : (isRtl ? 'زيادة' : 'Increase') },
          { label: isRtl ? 'توفير مالي' : 'Estimated Saving', value: `${stats.moneySaved.toFixed(0)} EGP`, icon: Wallet, color: 'text-amber-500' },
          { label: isRtl ? 'معدل الذكاء البيئي' : 'Eco Intelligence', value: `${Math.min(100, 30 + stats.improvementPerc).toFixed(0)}/100`, icon: BrainCircuit, color: 'text-blue-500' }
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-3 md:p-5 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center sm:justify-between group hover:border-eco-green/30 transition-all cursor-default text-center sm:text-left rtl:sm:text-right"
          >
            <div className="space-y-0.5 md:space-y-1">
              <p className="text-[7px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
              <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-1 md:gap-2">
                 <h3 className={`text-sm md:text-xl font-black italic ${stat.color}`}>{stat.value}</h3>
                 {stat.sub && <span className="text-[7px] md:text-[10px] font-bold text-slate-400 leading-none">{stat.sub}</span>}
              </div>
            </div>
            <div className={`mt-2 sm:mt-0 p-2 md:p-3 rounded-xl md:rounded-2xl ${stat.color.replace('text', 'bg')}/10 group-hover:scale-110 transition-transform hidden xs:flex`}>
              <stat.icon size={16} className={stat.color} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center bg-white/5 backdrop-blur-xl p-1.5 md:p-2 rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl w-full">
         <div className="flex w-full sm:w-auto">
                {[
                  { id: 'calculate', label: isRtl ? 'احسب الآن' : 'Calculate Now', icon: CalcIcon },
                  { id: 'history', label: isRtl ? 'السجل' : 'History Log', icon: HistoryIcon }
                ].map(tab => (
                  <button 
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`flex-1 sm:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 sm:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-all ${
                      activeTab === tab.id ? 'bg-eco-green text-white shadow-xl shadow-eco-green/20 scale-105' : 'text-slate-400 hover:text-white'
                   }`}
                  >
                     <tab.icon size={18} />
                     <span>{tab.label}</span>
                  </button>
                ))}
         </div>
         <Link to="/edge-ai" className="mt-2 sm:mt-0 px-6 py-3 md:py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
            <BrainCircuit size={18} />
            {isRtl ? 'المحلل الذكي (Edge AI)' : 'Smart Analyst (Edge AI)'}
         </Link>
      </div>
         </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'calculate' ? (
          <motion.div 
            key="calc" 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-12"
          >
             {/* 2. CATEGORY SELECTION */}
             <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => { setSelectedType(cat.id as any); setResult(null); }}
                    className={`group relative p-4 sm:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-3 sm:gap-4 ${
                       selectedType === cat.id ? 'border-eco-green bg-eco-green/5 shadow-2xl -translate-y-1' : 'border-slate-100 bg-white hover:border-eco-green/30'
                    }`}
                  >
                     <div className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl ${cat.bg} ${cat.color} group-hover:scale-110 transition-transform`}>
                        <cat.icon size={24} className="sm:w-8 sm:h-8" />
                     </div>
                     <span className="text-[10px] sm:text-xs font-black text-slate-800 uppercase tracking-tighter text-center">{cat.name}</span>
                     {selectedType === cat.id && <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-eco-green" />}
                  </button>
                ))}
             </div>

             {/* 3. INPUT & RESULT AREA */}
             {selectedType && (
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  
                  {/* INPUT FORM */}
                  <div className="lg:col-span-12 space-y-8">
                     <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-xl relative overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                           <div className="space-y-1">
                              <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                 {isRtl ? 'إدخال البيانات العلمية' : 'Scientific Data Protocol'}
                              </h3>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                 {isRtl ? 'يرجى تزويد المنظومة بالأرقام الدقيقة' : 'Provide exact consumption metrics'}
                              </p>
                           </div>
                           <button className="flex items-center gap-2 px-5 py-2 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-eco-green hover:text-white transition-all">
                              <Camera size={14} />
                              {isRtl ? 'المسح الضوئي للعداد' : 'Scan Meter (OCR)'}
                           </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {categories.find(c => c.id === selectedType)?.fields.map(field => (
                              <div key={field.id} className="space-y-3">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{field.label}</label>
                                 <div className="relative group">
                                    <input 
                                      type="number"
                                      value={inputs[field.id] || ''}
                                      onChange={(e) => setInputs({...inputs, [field.id]: e.target.value})}
                                      className="w-full bg-slate-50 border-2 border-transparent focus:border-eco-green focus:bg-white rounded-2xl p-6 font-black text-lg transition-all outline-none"
                                      placeholder="0.00"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 uppercase">
                                       {categories.find(c => c.id === selectedType)?.unit}
                                    </span>
                                 </div>
                              </div>
                           ))}
                        </div>

                        <div className="mt-12 flex flex-col md:flex-row gap-6">
                           <button onClick={() => { setSelectedType(null); setInputs({}); setResult(null); }} className="w-full md:w-auto px-8 py-6 bg-slate-50 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors flex items-center justify-center gap-3 font-black uppercase text-sm tracking-widest">
                              <XCircle size={24} />
                              <span>{isRtl ? 'إلغاء وتفريغ' : 'Clear & Cancel'}</span>
                           </button>
                           <button 
                             onClick={handleCalculateAndSaveDirectly} 
                             disabled={isCalculating}
                             className="w-full md:flex-1 px-8 py-6 bg-eco-green hover:bg-opacity-90 text-white rounded-2xl shadow-xl hover:shadow-eco-green/20 transition-all flex items-center justify-center gap-3 font-black uppercase text-sm tracking-widest disabled:opacity-50 cursor-pointer"
                           >
                              {isCalculating ? (
                                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent inline-block" />
                              ) : (
                                <ShieldCheck size={24} />
                              )}
                              <span>{isRtl ? 'احسب العملية واحفظها الآن' : 'Calculate & Save Now'}</span>
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* RESULTS DISPLAY */}
                  <AnimatePresence>
                    {result && (
                      <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-8"
                      >
                         {/* MAIN RESULT CARD */}
                         <div className="md:col-span-8 bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 sm:p-10 md:p-16 text-white shadow-2xl relative overflow-hidden group">
                           <div className="egyptian-pattern absolute inset-0 opacity-[0.03]" />
                           <div className="absolute top-0 right-0 p-12 opacity-[0.05] text-eco-green group-hover:scale-110 transition-transform">
                              <Leaf size={150} className="md:w-[200px] md:h-[200px]" />
                           </div>
                           
                           <div className="relative z-10 space-y-8 md:space-y-12">
                              <div className="flex items-center gap-3 md:gap-4">
                                 <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-eco-green animate-ping" />
                                 <h2 className="text-base md:text-xl font-black italic tracking-widest uppercase">
                                    {isRtl ? 'شهادة الأثر البيئي' : 'Eco Impact Certificate'}
                                 </h2>
                              </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-y border-white/10 py-8 md:py-12">
                                 <div className="space-y-2 md:space-y-4">
                                    <p className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-widest">{isRtl ? 'الانبعاثات المتولدة' : 'Gross Emissions'}</p>
                                    <div className="flex items-baseline gap-2 md:gap-3">
                                       <span className="text-5xl md:text-7xl font-black italic">{result.co2.toFixed(1)}</span>
                                       <span className="text-[10px] md:text-sm font-bold text-eco-green uppercase tracking-widest">kg CO₂</span>
                                    </div>
                                 </div>
                                 <div className="space-y-2 md:space-y-4">
                                    <p className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-widest">{isRtl ? 'التكلفة الوطنية' : 'National Tariff'}</p>
                                    <div className="flex items-baseline gap-2 md:gap-3">
                                       <span className="text-5xl md:text-7xl font-black italic">{Math.round(result.totalCost)}</span>
                                       <span className="text-[10px] md:text-sm font-bold text-white/30 uppercase tracking-widest">EGP</span>
                                    </div>
                                 </div>
                              </div>

                              <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8">
                                 <div className="w-full sm:flex-1 flex items-center gap-3 md:gap-4 bg-white/5 backdrop-blur px-6 md:px-8 py-4 md:py-5 rounded-2xl border border-white/10">
                                    <ShieldCheck className="text-eco-green shrink-0" size={24} />
                                    <div>
                                       <p className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-widest">{isRtl ? 'الرتبة في المنظومة' : 'National Tier'}</p>
                                       <p className="text-base md:text-lg font-black italic text-white">{result.tier}</p>
                                    </div>
                                 </div>
                                 <div className="w-full sm:flex-1 flex items-center gap-3 md:gap-4 bg-white/5 backdrop-blur px-6 md:px-8 py-4 md:py-5 rounded-2xl border border-white/10">
                                    <Activity className="text-amber-500 shrink-0" size={24} />
                                    <div>
                                       <p className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-widest">{isRtl ? 'معامل الانبعاث' : 'Emission Factor'}</p>
                                       <p className="text-base md:text-lg font-black italic text-white">{(result.appliedFactor || 0).toFixed(3)} <span className="text-[10px] opacity-50">kg/unit</span></p>
                                    </div>
                                 </div>
                              </div>

                              <div className="flex gap-3 md:gap-4 mt-6">
                                 <div className="flex-1 py-4 md:py-5 bg-white/5 text-eco-green rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-eco-green/20">
                                    <ShieldCheck size={18} />
                                    {isRtl ? 'تم الحفظ تلقائياً في السجل' : 'Automatically Saved to History'}
                                 </div>
                              </div>
                           </div>
                         </div>

                         {/* AI INSIGHTS CARD */}
                         <div className="md:col-span-4 bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-slate-100 shadow-xl space-y-8 md:space-y-10">
                            <div className="flex items-center gap-3 text-eco-green">
                               <BrainCircuit size={20} />
                               <h4 className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{isRtl ? 'تحليل المساعد الذكي' : 'Assistant Analysis'}</h4>
                            </div>
                            <p className="text-base md:text-lg font-bold text-slate-600 leading-relaxed italic">
                               "{result.insight}"
                            </p>
                            
                            <div className="h-px bg-slate-100" />
                            
                            {rewardCoupon && (
                               <div className="space-y-4 md:space-y-6">
                                  <div className="flex items-center gap-3 text-amber-500">
                                     <Ticket size={20} />
                                     <h4 className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{isRtl ? 'مكافأة المواطن المستدام' : 'Citizens Award'}</h4>
                                  </div>
                                  <div className="p-4 md:p-6 bg-amber-50 rounded-2xl border border-amber-100 relative overflow-hidden group">
                                     <div className="relative z-10 space-y-1 md:space-y-2 text-center">
                                        <p className="text-xl md:text-2xl font-black text-slate-900">{rewardCoupon.title}</p>
                                        <p className="text-[10px] md:text-xs font-bold text-amber-600 uppercase tracking-widest">{rewardCoupon.code}</p>
                                     </div>
                                  </div>
                                  <Link to="/rewards" className="block text-center text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-eco-green">
                                     {isRtl ? 'عرض كل المكافآت' : 'View All Rewards'}
                                  </Link>
                               </div>
                            )}
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
             )}
          </motion.div>
        ) : (
          <motion.div 
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl"
          >
             <div className="flex items-center justify-between mb-12">
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{isRtl ? 'سجل العمليات التاريخي' : 'Historical Archive'}</h3>
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                   <Download size={24} />
                </div>
             </div>
             
             <div className="space-y-4">
                {history.length > 0 ? history.map((record, idx) => (
                  <motion.div 
                    initial={{opacity: 0, y: 10}} 
                    animate={{opacity: 1, y: 0}} 
                    transition={{delay: idx * 0.05}}
                    key={idx} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-gradient-to-br from-white to-slate-50 rounded-2xl sm:rounded-3xl border border-slate-100 hover:border-eco-green/30 transition-all hover:shadow-xl hover:shadow-eco-green/5 group relative overflow-hidden gap-4"
                  >
                     <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
                        <Leaf size={60} className="text-eco-green" />
                     </div>
                     <div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full sm:w-auto">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-white rounded-xl shadow-sm border border-slate-50 flex items-center justify-center text-eco-green group-hover:scale-110 transition-transform">
                           <Leaf size={20} />
                        </div>
                        <div className="flex-1">
                           <h4 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight truncate max-w-[200px] sm:max-w-xs">{record.sector} Analysis</h4>
                           <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mt-0.5">{new Date(record.created_at || record.timestamp).toLocaleDateString()}</p>
                        </div>
                     </div>
                     <div className="flex flex-row sm:flex-col items-end sm:items-end justify-between sm:justify-center w-full sm:w-auto relative z-10 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 mt-1 sm:mt-0">
                        <div className="text-left sm:text-right">
                          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest sm:hidden mb-1">{isRtl ? 'البصمة' : 'Impact'}</p>
                          <span className="text-lg sm:text-xl font-black text-eco-green">{(record.carbon_impact || record.co2_impact || record.co2 || 0).toFixed(1)} <span className="text-[9px] sm:text-[10px] opacity-50 uppercase ml-0.5">kg</span></span>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest sm:mt-1">
                            <span className="sm:hidden mr-1">{isRtl ? 'التكلفة:' : 'Cost:'}</span>
                            EGP {record.cost || 0}
                          </p>
                        </div>
                     </div>
                  </motion.div>
                )) : (
                  <div className="py-20 text-center text-slate-400 font-bold italic">
                     {isRtl ? 'لا يوجد تاريخ مسجل' : 'Archive empty'}
                  </div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartCalculator;
