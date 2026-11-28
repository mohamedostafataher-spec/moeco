import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  Zap,
  Droplets,
  Leaf,
  Wind,
  AlertTriangle,
  History,
  RefreshCcw,
  Plus,
  BookOpen,
  ShieldAlert,
  Calculator,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { usePrivacyConsent } from '../context/PrivacyConsentContext';
import { storageService } from '../services/storageService';
import { calculationEngine } from '../services/calculationEngine';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';

const Dashboard: React.FC = () => {
  const { language, user, isRtl } = useApp();
  const { isConfigured, hasCoreConsent, authUser, openConsentModal } = usePrivacyConsent();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nationalMetrics, setNationalMetrics] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [aqiData, setAqiData] = useState<{ value: number; updatedAt: string } | null>(null);

  // Quick Log Modal State
  const [showQuickLogModal, setShowQuickLogModal] = useState(false);
  const [scannerData, setScannerData] = useState({ value: '', sector: 'electricity' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chartData = useMemo(() => {
    if (!activities.length) return [];

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];

      const dayTotal = activities
        .filter((a) => (a.created_at || a.timestamp)?.startsWith(dateStr))
        .reduce((sum, a) => sum + Math.abs(parseFloat(a.co2_impact || a.co2 || 0)), 0);

      return {
        name: d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'short' }),
        value: Number(dayTotal.toFixed(2)),
      };
    });

    return last7Days;
  }, [activities, isRtl]);

  const totalLoggedCo2 = useMemo(
    () =>
      activities.reduce(
        (sum, a) => sum + Math.abs(parseFloat(a.co2_impact || a.co2 || 0)),
        0,
      ),
    [activities],
  );

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const activeUserId = user?.id;
      const [natMetricRes, activitiesRes, alertsRes] = await Promise.all([
        storageService.getNationalMetrics().catch(() => ({ data: null })),
        activeUserId
          ? supabase
              .from('consumption_records')
              .select('*')
              .eq('user_id', activeUserId)
              .order('created_at', { ascending: false })
              .limit(50)
          : Promise.resolve({ data: [] }),
        supabase
          .from('alerts')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      setNationalMetrics(natMetricRes?.data || null);
      if (activitiesRes?.data) {
        setActivities(activitiesRes.data);
      } else {
        setActivities([]);
      }

      if (alertsRes?.data) setActiveAlerts(alertsRes.data);

      try {
        const aqiRes = await fetch(
          'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=30.0444&longitude=31.2357&current=european_aqi',
        );
        const aqiJson = await aqiRes.json();
        if (typeof aqiJson?.current?.european_aqi === 'number') {
          setAqiData({
            value: aqiJson.current.european_aqi,
            updatedAt: new Date().toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          });
        }
      } catch (err) {
        console.error('AQI fetch error', err);
      }
    } catch (e) {
      console.error('Dashboard Fetch Error:', e);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const dashboardActivitySub = supabase
      .channel('dashboard-activity')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consumption_records',
          filter: user?.id ? `user_id=eq.${user.id}` : undefined,
        },
        () => {
          fetchData();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      dashboardActivitySub.unsubscribe();
    };
  }, [user?.id]);

  const handleGlobalSync = async () => {
    setIsRefreshing(true);
    try {
      await storageService.triggerGlobalSync();
      await fetchData();
      notificationService.success(isRtl ? 'تم تحديث البيانات بنجاح' : 'Data refreshed successfully');
    } catch {
      notificationService.error(isRtl ? 'تعذر تحديث البيانات' : 'Refresh failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericVal = parseFloat(scannerData.value);
    if (!numericVal || numericVal <= 0) return;

    if (!isConfigured || !hasCoreConsent) {
      openConsentModal(isRtl ? 'التسجيل السريع للاستهلاك' : 'Quick Consumption Log');
      return;
    }

    const uid = authUser?.id || user?.id;
    if (!uid) {
      openConsentModal(isRtl ? 'التسجيل السريع للاستهلاك' : 'Quick Consumption Log');
      return;
    }

    setIsSubmitting(true);
    try {
      const calcRes = await calculationEngine.calculate(scannerData.sector, numericVal);
      await storageService.insertConsumptionRecord({
        user_id: uid,
        sector: scannerData.sector,
        value: numericVal,
        unit: scannerData.sector === 'electricity' ? 'kWh' : scannerData.sector === 'transport' ? 'km' : 'm³',
        co2: calcRes.co2,
        co2_impact: calcRes.co2,
        cost: calcRes.totalCost,
        description: isRtl ? 'تسجيل سريع للاستهلاك' : 'Quick Consumption Log',
        metadata: { quick_log: true, applied_factor: calcRes.appliedFactor },
      });

      notificationService.success(isRtl ? 'تم حفظ القياس في سجلك' : 'Log saved to your records');
      setShowQuickLogModal(false);
      setScannerData({ value: '', sector: 'electricity' });
      fetchData();
    } catch {
      notificationService.error(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error saving log');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getText = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      if (Array.isArray(val)) return getText(val[0]);
      return val[isRtl ? 'ar' : 'en'] || val['ar'] || val['en'] || '';
    }
    return String(val);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center space-y-3" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="w-10 h-10 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-600">
          {isRtl ? 'جاري تحميل ملخص المتابعة...' : 'Loading environmental summary...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {isRtl ? 'لوحة المتابعة البيئية' : 'Environmental Dashboard'}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {isRtl
                ? 'ملخص القياسات المسجلة فعليًا ومؤشر جودة الهواء المباشر.'
                : 'Summary of your logged consumption and live air quality reading.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQuickLogModal(true)}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'إضافة قراءة سريعة' : 'Quick Log'}</span>
          </button>

          <button
            type="button"
            onClick={handleGlobalSync}
            disabled={isRefreshing}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 transition-colors"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRtl ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Summary Cards - Only real data */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Logged Personal Records Total */}
        <article className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              {isRtl ? 'الأثر التقديري المسجل' : 'Logged Estimated Impact'}
            </span>
            <Leaf className="w-4 h-4 text-emerald-700" />
          </div>
          {activities.length > 0 ? (
            <>
              <p className="text-2xl font-extrabold text-slate-900 num-ltr">
                {totalLoggedCo2.toFixed(1)}{' '}
                <span className="text-xs font-bold text-slate-500">kg CO₂e</span>
              </p>
              <p className="text-[11px] text-slate-500">
                {isRtl ? `تقدير محسوب من ${activities.length} سجل أدخله المستخدم` : `Estimate computed from ${activities.length} user-logged records`}
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-500 font-bold pt-1">
              {isRtl ? 'لا توجد قياسات مسجلة بعد' : 'No logged records yet'}
            </p>
          )}
        </article>

        {/* Live Open-Meteo AQI */}
        <article className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              {isRtl ? 'مؤشر جودة الهواء (القاهرة)' : 'Cairo Air Quality (AQI)'}
            </span>
            <Wind className="w-4 h-4 text-sky-700" />
          </div>
          {aqiData !== null ? (
            <>
              <p className="text-2xl font-extrabold text-slate-900 num-ltr">
                {aqiData.value}{' '}
                <span className="text-xs font-bold text-slate-500">EU AQI</span>
              </p>
              <p className="text-[11px] text-slate-500">
                {isRtl ? 'مصدر خارجي حي (Open-Meteo)' : 'Live external feed (Open-Meteo)'} · {aqiData.updatedAt}
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-500 font-bold pt-1">
              {isRtl ? 'تعذر جلب قراءة جودة الهواء الآن' : 'AQI feed unavailable right now'}
            </p>
          )}
        </article>

        {/* Active Official Alerts Count */}
        <article className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              {isRtl ? 'التنبيهات النشطة' : 'Active Alerts'}
            </span>
            <ShieldAlert className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 num-ltr">
            {activeAlerts.length}
          </p>
          <p className="text-[11px] text-slate-500">
            {activeAlerts.length > 0
              ? isRtl
                ? 'من قاعدة بيانات التنبيهات المسجلة'
                : 'From registered alerts database'
              : isRtl
                ? 'لا توجد تنبيهات نشطة حاليًا'
                : 'No active alerts currently'}
          </p>
        </article>
      </section>

      {/* Optional verified national metrics ONLY if present in backend */}
      {nationalMetrics && (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-slate-900">
              {isRtl ? 'بيانات مؤشرات مجمّعة (من الخادم)' : 'Server Metrics'}
            </h2>
            <span className="text-[11px] text-slate-500">{isRtl ? 'مصدر قاعدة البيانات المسجلة' : 'Recorded database source'}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {typeof nationalMetrics.totalCarbonSaved === 'number' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-slate-500">{isRtl ? 'الأثر المجمع' : 'Aggregate impact'}</p>
                <p className="text-base font-extrabold text-slate-900 num-ltr mt-0.5">
                  {(nationalMetrics.totalCarbonSaved / 1000).toFixed(1)} t CO₂e
                </p>
              </div>
            )}
            {typeof nationalMetrics.waterSavedM3 === 'number' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-slate-500">{isRtl ? 'كمية المياه' : 'Water saved'}</p>
                <p className="text-base font-extrabold text-slate-900 num-ltr mt-0.5">
                  {nationalMetrics.waterSavedM3.toFixed(0)} m³
                </p>
              </div>
            )}
            {typeof nationalMetrics.renewablePercentage === 'number' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-slate-500">{isRtl ? 'نسبة الطاقة المتجددة' : 'Renewable share'}</p>
                <p className="text-base font-extrabold text-slate-900 num-ltr mt-0.5">
                  {nationalMetrics.renewablePercentage.toFixed(1)}%
                </p>
              </div>
            )}
            {typeof nationalMetrics.activeEcoNodes === 'number' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-slate-500">{isRtl ? 'نقاط مسجلة' : 'Registered nodes'}</p>
                <p className="text-base font-extrabold text-slate-900 num-ltr mt-0.5">
                  {nationalMetrics.activeEcoNodes}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Personal Chart or Honest Empty State */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {isRtl ? 'توزيع الأثر التقديري لآخر 7 أيام' : '7-Day Estimated Impact'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRtl
                ? 'يعتمد على سجلات الاستهلاك التي أضفتها بنفسك (تقدير محسوب بوحدة kg CO₂e).'
                : 'Computed strictly from your own logged records.'}
            </p>
          </div>
          <Link
            to="/methodology"
            className="min-h-[40px] inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
          >
            <BookOpen className="w-4 h-4" />
            <span>{isRtl ? 'كيف نحسب الأثر؟' : 'How do we calculate impact?'}</span>
          </Link>
        </div>

        {chartData.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl py-10 px-4 text-center space-y-3">
            <p className="text-sm font-bold text-slate-800">
              {isRtl ? 'لا توجد قياسات مسجلة لعرض الرسم البياني' : 'No logged measurements yet'}
            </p>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              {isRtl
                ? 'أضف أول قراءة كهرباء أو مياه أو رحلة في الحاسبة ليظهر منحنى استهلاكك الشخصي هنا.'
                : 'Add your first utility or carbon calculation to visualize your personal trend.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <Link
                to="/calculator"
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
              >
                <Calculator className="w-4 h-4" />
                <span>{isRtl ? 'الذهاب إلى الحاسبة' : 'Go to the calculator'}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="h-[260px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="calmCo2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#15803d" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#15803d" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="kg CO₂e"
                  stroke="#15803d"
                  fill="url(#calmCo2)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Logs & Active Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <span>{isRtl ? 'أحدث القياسات المسجلة' : 'Recent Logged Records'}</span>
            </h2>
            <Link to="/calculation-records" className="text-xs font-bold text-emerald-700 hover:underline">
              {isRtl ? 'عرض الكل' : 'View All'}
            </Link>
          </div>

          {activities.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              {isRtl ? 'لا توجد سجلات محفوظة بعد.' : 'No records saved yet.'}
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
              {activities.slice(0, 10).map((log, i) => (
                <div
                  key={log.id || i}
                  className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{log.sector || log.type}</p>
                    <p className="text-slate-500 num-ltr mt-0.5">
                      {new Date(log.created_at || log.timestamp || Date.now()).toLocaleDateString(
                        isRtl ? 'ar-EG' : 'en-US',
                      )}
                    </p>
                  </div>
                  <p className="font-extrabold text-emerald-700 num-ltr">
                    {Number(log.co2_impact || log.co2 || 0).toFixed(1)} kg CO₂e
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>{isRtl ? 'التنبيهات المسجلة' : 'Active Broadcasts'}</span>
            </h2>
            <Link to="/alerts-hub" className="text-xs font-bold text-emerald-700 hover:underline">
              {isRtl ? 'مركز التنبيهات' : 'Alerts Center'}
            </Link>
          </div>

          {activeAlerts.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center text-xs text-slate-600">
              {isRtl ? 'لا توجد تنبيهات نشطة في قاعدة البيانات حاليًا.' : 'No active alerts in database.'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeAlerts.map((alert, i) => (
                <div key={alert.id || i} className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <h3 className="text-xs font-extrabold text-slate-900">
                    {getText(isRtl ? alert.title_ar || alert.title : alert.title_en || alert.title)}
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                    {getText(alert.message_ar || alert.message || alert.description_en)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick Log Modal */}
      {showQuickLogModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={isRtl ? 'تسجيل قراءة سريعة' : 'Quick Consumption Log'}
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">
                {isRtl ? 'إضافة قياس سريع' : 'Quick Log Entry'}
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickLogModal(false)}
                aria-label={isRtl ? 'إغلاق' : 'Close'}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickLog} className="space-y-4">
              <div>
                <label htmlFor="ql-sector" className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRtl ? 'القطاع' : 'Sector'}
                </label>
                <select
                  id="ql-sector"
                  value={scannerData.sector}
                  onChange={(e) => setScannerData({ ...scannerData, sector: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-900"
                >
                  <option value="electricity">{isRtl ? 'الكهرباء (kWh)' : 'Electricity (kWh)'}</option>
                  <option value="water">{isRtl ? 'المياه (m³)' : 'Water (m³)'}</option>
                  <option value="transport">{isRtl ? 'المواصلات (km)' : 'Transport (km)'}</option>
                  <option value="gas">{isRtl ? 'الغاز (m³)' : 'Gas (m³)'}</option>
                </select>
              </div>

              <div>
                <label htmlFor="ql-value" className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRtl ? 'القيمة' : 'Value'}
                </label>
                <input
                  id="ql-value"
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  placeholder="0.00"
                  value={scannerData.value}
                  onChange={(e) => setScannerData({ ...scannerData, value: e.target.value })}
                  className="w-full min-h-[48px] px-4 rounded-xl bg-white border border-slate-300 text-lg font-extrabold text-slate-900 num-ltr"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickLogModal(false)}
                  className="min-h-[44px] px-4 rounded-xl bg-slate-100 text-xs font-bold text-slate-700"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !scannerData.value}
                  className="min-h-[44px] px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold disabled:opacity-50"
                >
                  {isSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : isRtl ? 'حفظ في السجل' : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
