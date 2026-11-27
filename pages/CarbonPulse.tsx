import React, { useState, useEffect } from 'react';
import {
  Car,
  Zap,
  Droplets,
  Utensils,
  ShoppingBag,
  Flame,
  Calculator as CalcIcon,
  History as HistoryIcon,
  TrendingUp,
  Leaf,
  BookOpen,
  ShieldCheck,
  XCircle,
  BrainCircuit,
  Activity,
  Sparkles,
  FileText,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHero } from '../components/ui';
import { usePrivacyConsent } from '../context/PrivacyConsentContext';
import { supabase, getSafeSession } from '../services/supabaseClient';
import { notificationService } from '../services/notificationService';
import { Link, useLocation } from 'react-router-dom';
import { calculationEngine } from '../services/calculationEngine';
import { storageService } from '../services/storageService';
import { errorLogger } from '../services/errorLogger';


type ActivityType = 'transport' | 'electricity' | 'water' | 'gas' | 'food' | 'shopping';


const SmartCalculator: React.FC = () => {
  const { language, user, isRtl } = useApp();
  const { isConfigured, hasCoreConsent, authUser, openConsentModal } = usePrivacyConsent();
  const location = useLocation();
  const locationState = location.state as { initialType: ActivityType } | null;


  const [activeTab, setActiveTab] = useState<'calculate' | 'history'>('calculate');
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({
    monthlyTotal: 0,
    previousMonthTotal: 0,
    improvementPerc: 0,
    totalCount: 0,
    sectorsCount: 0,
  });
  const [categories, setCategories] = useState<any[]>([]);


  const getCategoryConfig = (id: string) => {
    const configs: Record<string, any> = {
      electricity: {
        icon: Zap,
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        unit: 'kWh',
        fields: [
          { id: 'prevReading', label: isRtl ? 'القراءة السابقة' : 'Prev Reading' },
          { id: 'currReading', label: isRtl ? 'القراءة الحالية' : 'Current Reading' },
        ],
      },
      water: {
        icon: Droplets,
        color: 'text-sky-700',
        bg: 'bg-sky-50',
        unit: 'm³',
        fields: [
          { id: 'prevReading', label: isRtl ? 'القراءة السابقة' : 'Prev Reading' },
          { id: 'currReading', label: isRtl ? 'القراءة الحالية' : 'Current Reading' },
        ],
      },
      gas: {
        icon: Flame,
        color: 'text-orange-700',
        bg: 'bg-orange-50',
        unit: 'm³',
        fields: [
          { id: 'prevReading', label: isRtl ? 'القراءة السابقة' : 'Prev Reading' },
          { id: 'currReading', label: isRtl ? 'القراءة الحالية' : 'Current Reading' },
        ],
      },
      transport: {
        icon: Car,
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        unit: 'km',
        fields: [{ id: 'distance', label: isRtl ? 'المسافة (كيلومتر)' : 'Distance (km)' }],
      },
      food: {
        icon: Utensils,
        color: 'text-rose-700',
        bg: 'bg-rose-50',
        unit: 'kg',
        fields: [
          { id: 'meat', label: isRtl ? 'اللحوم (كجم)' : 'Meat (kg)' },
          { id: 'veg', label: isRtl ? 'الخضروات (كجم)' : 'Vegetables (kg)' },
        ],
      },
      shopping: {
        icon: ShoppingBag,
        color: 'text-slate-700',
        bg: 'bg-slate-100',
        unit: 'items',
        fields: [{ id: 'items', label: isRtl ? 'عدد القطع' : 'Items' }],
      },
    };
    return (
      configs[id] || {
        icon: Sparkles,
        color: 'text-slate-700',
        bg: 'bg-slate-100',
        unit: 'units',
        fields: [{ id: 'usage', label: isRtl ? 'الاستهلاك' : 'Usage' }],
      }
    );
  };


  const defaultCategories = [
    {
      id: 'electricity',
      name: isRtl ? 'الكهرباء' : 'Electricity',
      ...getCategoryConfig('electricity'),
    },
    { id: 'water', name: isRtl ? 'المياه' : 'Water', ...getCategoryConfig('water') },
    { id: 'gas', name: isRtl ? 'الغاز' : 'Gas', ...getCategoryConfig('gas') },
    { id: 'transport', name: isRtl ? 'النقل' : 'Transport', ...getCategoryConfig('transport') },
    { id: 'food', name: isRtl ? 'الغذاء' : 'Food', ...getCategoryConfig('food') },
    { id: 'shopping', name: isRtl ? 'التسوق' : 'Shopping', ...getCategoryConfig('shopping') },
  ];


  const fetchHistory = async () => {
    try {
      const session = await getSafeSession();
      const currentUserId = user?.id || session?.user?.id || 'guest';
      const records = await storageService.fetchUserHistory(currentUserId);
      setHistory(records.slice(0, 15));


      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;


      const monthlyRecs = records.filter((r) => {
        const d = new Date(r.created_at || r.timestamp);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });


      const prevMonthlyRecs = records.filter((r) => {
        const d = new Date(r.created_at || r.timestamp);
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
      });


      const currentTotal = monthlyRecs.reduce(
        (sum, r) => sum + (r.carbon_impact || r.co2_impact || r.co2 || 0),
        0,
      );
      const prevTotal = prevMonthlyRecs.reduce(
        (sum, r) => sum + (r.carbon_impact || r.co2_impact || r.co2 || 0),
        0,
      );


      const distinctSectors = new Set(records.map((r) => r.sector).filter(Boolean)).size;


      setStats({
        monthlyTotal: currentTotal,
        previousMonthTotal: prevTotal,
        improvementPerc: prevTotal > 0 ? ((prevTotal - currentTotal) / prevTotal) * 100 : 0,
        totalCount: records.length,
        sectorsCount: distinctSectors,
      });
    } catch (e) {
      errorLogger.log(e, 'SmartCalculator:fetchHistory');
    }
  };


  useEffect(() => {
    const loadData = async () => {
      try {
        await calculationEngine.init();
        const sectors = await storageService.getSectors();
        if (sectors && sectors.length > 0) {
          const mappedCategories = sectors.map((s: any) => {
            const cid = s.id || s.name_en?.toLowerCase() || s.name?.toLowerCase();
            const config = getCategoryConfig(cid);
            return {
              ...s,
              id: cid,
              name: isRtl ? s.name_ar || s.name : s.name_en || s.name,
              icon: config.icon,
              color: config.color,
              bg: config.bg,
              unit: s.unit || config.unit || 'units',
              fields:
                s.fields || config.fields || [{ id: 'usage', label: isRtl ? 'الاستهلاك' : 'Usage' }],
            };
          });
          setCategories(mappedCategories);
        } else {
          setCategories(defaultCategories);
        }
      } catch (err) {
        console.error('Failed to load calculator support data:', err);
        setCategories(defaultCategories);
      }
    };
    loadData();
    if (locationState?.initialType) {
      setSelectedType(locationState.initialType);
    }
    fetchHistory();


    const channel = supabase
      .channel('consumption_records_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'consumption_records' },
        () => {
          fetchHistory();
        },
      )
      .subscribe();


    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationState, isRtl]);


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


      const hasMeaningfulInput =
        consumption > 0 ||
        (selectedType === 'food' &&
          (parseFloat(inputs.meat) > 0 || parseFloat(inputs.veg) > 0));


      if (!hasMeaningfulInput) {
        setResult(null);
        return;
      }


      try {
        const selectedCategory = categories.find((c) => c.id === selectedType);
        const metadata = { ...inputs, usage: consumption, unit: selectedCategory?.unit || 'unknown' };
        const calcResult = await calculationEngine.calculate(selectedType, consumption, metadata);


        const finalResult = {
          ...calcResult,
          consumption,
          insight: calculationEngine.getSmartAdvice(selectedType, consumption, language),
          timestamp: new Date().toISOString(),
        };


        setResult(finalResult);


        if (consumption > 0 && isConfigured && hasCoreConsent) {
          const session = await getSafeSession();
          const uid = authUser?.id || user?.id || session?.user?.id;
          if (!uid) return;


          storageService
            .insertConsumptionRecord({
              user_id: uid,
              sector: selectedType,
              value: consumption,
              unit: selectedCategory?.unit || 'unknown',
              co2: calcResult.co2,
              co2_impact: calcResult.co2,
              cost: calcResult.totalCost,
              description: `${isRtl ? 'حفظ تلقائي' : 'Auto-Save'}: ${selectedType}`,
              metadata: { ...metadata, auto_saved: true, tier: calcResult.tier },
            })
            .then(() => {
              fetchHistory();
            })
            .catch((e) => {
              console.error('Background auto-save failed:', e);
            });
        }
      } catch (error) {
        console.error('Live calculation/auto-save failed:', error);
      }
    };


    const timeout = setTimeout(() => {
      calculateAndAutoSave();
    }, 2000);
    return () => clearTimeout(timeout);
  }, [inputs, selectedType, categories, language, user?.id, authUser?.id, isConfigured, hasCoreConsent]);


  const handleCalculateAndSaveDirectly = async () => {
    if (!selectedType) return;
    setIsCalculating(true);


    try {
      let consumption = 0;
      if (['electricity', 'water', 'gas'].includes(selectedType)) {
        consumption = (parseFloat(inputs.currReading) || 0) - (parseFloat(inputs.prevReading) || 0);
        if (consumption < 0) {
          notificationService.error(
            isRtl
              ? 'القراءة الحالية يجب أن تكون أكبر من السابقة'
              : 'Current reading must be higher than previous',
          );
          setIsCalculating(false);
          return;
        }
      } else if (inputs.usage) consumption = parseFloat(inputs.usage);
      else if (inputs.distance) consumption = parseFloat(inputs.distance);
      else if (inputs.items) consumption = parseFloat(inputs.items);
      else if (selectedType === 'food') {
        consumption = (parseFloat(inputs.meat) || 0) + (parseFloat(inputs.veg) || 0);
      }


      const hasMeaningfulInput =
        consumption > 0 ||
        (selectedType === 'food' &&
          (parseFloat(inputs.meat) > 0 || parseFloat(inputs.veg) > 0));


      if (!hasMeaningfulInput) {
        notificationService.error(
          isRtl ? 'يرجى إدخال قيم صالحة للاستهلاك أولاً' : 'Please enter valid consumption values first',
        );
        setIsCalculating(false);
        return;
      }


      const selectedCategory = categories.find((c) => c.id === selectedType);
      const metadata = { ...inputs, usage: consumption, unit: selectedCategory?.unit || 'unknown' };
      const calcResult = await calculationEngine.calculate(selectedType, consumption, metadata);


      const finalResult = {
        ...calcResult,
        consumption,
        insight: calculationEngine.getSmartAdvice(selectedType, consumption, language),
        timestamp: new Date().toISOString(),
      };


      setResult(finalResult);


      if (!isConfigured || !hasCoreConsent) {
        openConsentModal(isRtl ? 'حاسبة الأثر الكربوني' : 'Carbon Calculator');
        setIsCalculating(false);
        return;
      }


      const session = await getSafeSession();
      const uid = authUser?.id || user?.id || session?.user?.id;
      if (!uid) {
        openConsentModal(isRtl ? 'حاسبة الأثر الكربوني' : 'Carbon Calculator');
        setIsCalculating(false);
        return;
      }


      await storageService.insertConsumptionRecord({
        user_id: uid,
        sector: selectedType,
        value: consumption,
        unit: selectedCategory?.unit || 'unknown',
        co2: calcResult.co2,
        co2_impact: calcResult.co2,
        cost: calcResult.totalCost,
        description: `${isRtl ? 'حساب مباشر' : 'Direct Calculation'}: ${selectedType}`,
        metadata: { ...metadata, manual_saved: true, tier: calcResult.tier },
      });


      if (calcResult.points > 0) {
        await storageService.awardPoints(uid, calcResult.points, `Calculation: ${selectedType}`);
      }


      notificationService.success(
        isRtl ? 'تم الحساب وحفظ العملية في السجل بنجاح' : 'Calculated and saved successfully',
      );
      fetchHistory();
    } catch (error) {
      console.error('Direct calculation failed:', error);
      notificationService.error(
        isRtl ? 'عذرًا، فشل حساب أو حفظ العملية' : 'Calculation or save failed',
      );
    } finally {
      setIsCalculating(false);
    }
  };


  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Calm Hero Header */}
      <PageHero
        title={isRtl ? 'حاسبة البصمة الكربونية' : 'Carbon Footprint Calculator'}
        subtitle={isRtl
                ? 'احسب الأثر الكربوني التقديري لاستهلاكك اليومي من الكهرباء والمياه والمواصلات بوحدة kg CO₂e، وتابع سجلاتك عبر الزمن.'
                : 'Estimate carbon footprint from your daily utilities and commute in kg CO₂e.'}
        icon={<CalcIcon className="w-5 h-5" />}
      >
        <div className="pt-3 flex flex-wrap gap-2">
          <Link
              to="/edge-ai"
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white backdrop-blur text-xs font-bold transition-colors"
            >
              <BrainCircuit className="w-4 h-4 text-emerald-700" />
              <span>{isRtl ? 'المساعد التحليلي' : 'Smart Analyst'}</span>
            </Link>
        </div>
      </PageHero>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-emerald-100 rounded-[24px] p-4 space-y-1 shadow-[0_8px_30px_rgba(6,78,59,.06)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600">
                {isRtl ? 'انبعاثات الشهر (تقدير محسوب)' : 'Monthly Total'}
              </p>
              <Leaf className="w-4 h-4 text-emerald-700" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 num-ltr">
              {stats.monthlyTotal.toFixed(1)}{' '}
              <span className="text-xs font-bold text-slate-500">kg CO₂e</span>
            </p>
          </div>


          <div className="bg-white border border-emerald-100 rounded-[24px] p-4 space-y-1 shadow-[0_8px_30px_rgba(6,78,59,.06)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600">
                {isRtl ? 'مقارنة بالشهر السابق' : 'vs Previous Month'}
              </p>
              <TrendingUp className="w-4 h-4 text-slate-600" />
            </div>
            {stats.previousMonthTotal > 0 ? (
              <p className="text-xl font-extrabold text-slate-900 num-ltr">
                {Math.abs(stats.improvementPerc).toFixed(0)}%{' '}
                <span className="text-xs font-bold text-slate-600">
                  {stats.improvementPerc > 0
                    ? isRtl
                      ? 'انخفاض'
                      : 'lower'
                    : isRtl
                      ? 'زيادة'
                      : 'higher'}
                </span>
              </p>
            ) : (
              <p className="text-xs font-bold text-slate-500 pt-1">
                {isRtl ? 'تظهر عند توفر بيانات الشهر السابق' : 'Needs prior month logs'}
              </p>
            )}
          </div>


          <div className="bg-white border border-emerald-100 rounded-[24px] p-4 space-y-1 shadow-[0_8px_30px_rgba(6,78,59,.06)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600">
                {isRtl ? 'السجلات المحفوظة' : 'Saved Records'}
              </p>
              <FileText className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 num-ltr">{stats.totalCount}</p>
          </div>


          <div className="bg-white border border-emerald-100 rounded-[24px] p-4 space-y-1 shadow-[0_8px_30px_rgba(6,78,59,.06)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600">
                {isRtl ? 'القطاعات المسجلة' : 'Logged Sectors'}
              </p>
              <Layers className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 num-ltr">{stats.sectorsCount}</p>
          </div>
        </div>


        {/* Transparency Metadata Bar */}
        <div className="bg-white border border-emerald-100 rounded-[24px] p-4 text-xs shadow-[0_8px_30px_rgba(6,78,59,.06)] text-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                إدخال المستخدم · تقدير محسوب
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-white text-slate-800 border border-slate-200 font-bold">
                الوحدة: kg CO₂e
              </span>
              <span className="text-slate-500">
                آخر تحديث: {new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              تعتمد التقديرات على معاملات استرشادية للشبكة المصرية والمياه والنقل ولا تُغني عن الفاتورة الرسمية.
            </p>
          </div>


          <Link
            to="/methodology"
            className="min-h-[44px] shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-emerald-700 border border-slate-200 font-bold transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>كيف نحسب الأثر؟</span>
          </Link>
        </div>


        {/* Mode Switcher */}
        <div className="flex flex-wrap gap-2 bg-emerald-50 p-1 rounded-2xl border border-emerald-100 w-fit">
          {[
            { id: 'calculate', label: isRtl ? 'احسب الآن' : 'Calculate Now', icon: CalcIcon },
            { id: 'history', label: isRtl ? 'السجل' : 'History Log', icon: HistoryIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`min-h-[44px] flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-xs transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>


      {activeTab === 'calculate' ? (
        <div className="space-y-6">
          {/* Category Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedType(cat.id as any);
                  setResult(null);
                  setInputs({});
                }}
                className={`min-h-[112px] p-4 rounded-2xl border transition-colors flex flex-col items-center justify-center gap-2.5 ${
                  selectedType === cat.id
                    ? 'border-emerald-700 bg-emerald-50/70'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`p-3 rounded-xl ${cat.bg} ${cat.color}`}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-900 text-center">{cat.name}</span>
              </button>
            ))}
          </div>


          {/* Input Form */}
          {selectedType && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {isRtl ? 'إدخال بيانات الاستهلاك' : 'Enter Consumption Data'}
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  {isRtl
                    ? 'أدخل القيم لحساب البصمة التقديرية وحفظها في سجلك.'
                    : 'Enter values to compute estimated emissions and save to history.'}
                </p>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories
                  .find((c) => c.id === selectedType)
                  ?.fields.map((field: any) => (
                    <div key={field.id} className="space-y-1.5">
                      <label htmlFor={`calc-${field.id}`} className="block text-xs font-bold text-slate-700">
                        {field.label}
                      </label>
                      <div className="relative">
                        <input
                          id={`calc-${field.id}`}
                          type="number"
                          min="0"
                          step="any"
                          value={inputs[field.id] || ''}
                          onChange={(e) => setInputs({ ...inputs, [field.id]: e.target.value })}
                          className="w-full min-h-[48px] bg-white border border-slate-300 focus:border-emerald-700 rounded-xl px-4 pe-16 font-bold text-base text-slate-900 num-ltr outline-none"
                          placeholder="0"
                        />
                        <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                          {categories.find((c) => c.id === selectedType)?.unit}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>


              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType(null);
                    setInputs({});
                    setResult(null);
                  }}
                  className="min-h-[44px] px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isRtl ? 'إلغاء وتفريغ' : 'Clear'}</span>
                </button>


                <button
                  type="button"
                  onClick={handleCalculateAndSaveDirectly}
                  disabled={isCalculating}
                  className="min-h-[44px] flex-1 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isCalculating ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>{isRtl ? 'احسب واحفظ العملية في السجل' : 'Calculate & Save'}</span>
                </button>
              </div>
            </div>
          )}


          {/* Result Display */}
          {result && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-8 bg-white border border-emerald-200 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-extrabold text-slate-900">
                    {isRtl ? 'ملخص نتيجة الحساب (تقدير محسوب)' : 'Estimated Impact Summary'}
                  </h2>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                    تم الحفظ في السجل
                  </span>
                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-500">
                      {isRtl ? 'الانبعاثات التقديرية' : 'Estimated Emissions'}
                    </p>
                    <p className="text-3xl font-extrabold text-slate-900 num-ltr mt-1">
                      {result.co2.toFixed(1)}{' '}
                      <span className="text-sm font-bold text-emerald-700">kg CO₂e</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500">
                      {isRtl ? 'معامل الحساب المطبق' : 'Emission Factor'}
                    </p>
                    <p className="text-2xl font-extrabold text-slate-900 num-ltr mt-1">
                      {(result.appliedFactor || 0).toFixed(3)}{' '}
                      <span className="text-xs font-bold text-slate-500">kg/unit</span>
                    </p>
                  </div>
                </div>


                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                  <p>
                    <strong>شفافية الحساب:</strong> {result.consumption} وحدة ×{' '}
                    {(result.appliedFactor || 0).toFixed(3)} ={' '}
                    <strong className="num-ltr">{result.co2.toFixed(2)} kg CO₂e</strong> (إدخال المستخدم · تقديري).
                  </p>
                  <p className="text-slate-500">
                    التاريخ: {new Date(result.timestamp).toLocaleString(isRtl ? 'ar-EG' : 'en-US')} ·{' '}
                    <Link to="/methodology" className="text-emerald-700 font-bold underline">
                      مراجعة المنهجية
                    </Link>
                  </p>
                </div>
              </div>


              <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Activity className="w-4 h-4" />
                  <h3 className="text-xs font-extrabold">{isRtl ? 'إرشاد مرتبط بالقراءة' : 'Usage Guidance'}</h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{result.insight}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <section className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">
              {isRtl ? 'سجل القياسات المحفوظة' : 'Saved Calculation History'}
            </h2>
            <span className="text-xs font-bold text-slate-500 num-ltr">{history.length}</span>
          </div>


          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((record, idx) => (
                <div
                  key={record.id || idx}
                  className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-emerald-700">
                      <Leaf className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{record.sector}</h3>
                      <p className="text-xs text-slate-500 num-ltr mt-0.5">
                        {new Date(record.created_at || record.timestamp || Date.now()).toLocaleDateString(
                          isRtl ? 'ar-EG' : 'en-US',
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <span className="text-base font-extrabold text-emerald-700 num-ltr">
                      {(record.carbon_impact || record.co2_impact || record.co2 || 0).toFixed(1)}{' '}
                      <span className="text-xs font-bold text-slate-500">kg CO₂e</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 font-bold">
              {isRtl ? 'لا توجد قياسات مسجلة حتى الآن' : 'No saved history yet'}
            </div>
          )}
        </section>
      )}
    </div>
  );
};


export default SmartCalculator;
