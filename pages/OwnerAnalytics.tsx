import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  ShieldCheck,
  Users,
  Zap,
  FileText,
  RefreshCcw,
  Lock,
  AlertTriangle,
  Database,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { usePrivacyConsent } from '../context/PrivacyConsentContext';
import { supabaseDataService, OwnerUsageSummary } from '../services/supabaseDataService';

const OwnerAnalytics: React.FC = () => {
  const { isRtl } = useApp();
  const { isConfigured, authUser, isOwnerAdmin, adminCheckLoading } = usePrivacyConsent();

  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summary, setSummary] = useState<OwnerUsageSummary | null>(null);

  const loadSummary = useCallback(async () => {
    if (!isConfigured || !authUser || !isOwnerAdmin) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await supabaseDataService.getOwnerUsageSummary(days);
      setSummary(data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر تحميل الإحصاءات المجمّعة.');
    } finally {
      setLoading(false);
    }
  }, [isConfigured, authUser, isOwnerAdmin, days]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Group daily feature counts for bar chart (declared before any conditional returns)
  const dailyChartData = useMemo(() => {
    if (!summary?.feature_opens_by_day?.length) return [];
    const byDay: Record<string, number> = {};
    summary.feature_opens_by_day.forEach((row) => {
      byDay[row.day] = (byDay[row.day] || 0) + Number(row.count || 0);
    });
    return Object.entries(byDay).map(([day, count]) => ({ day, count }));
  }, [summary]);

  if (!isConfigured) {
    return (
      <div className="max-w-4xl mx-auto pb-12 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-2 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-extrabold text-sm text-amber-950">
            <Database className="w-5 h-5 text-amber-700" />
            <span>Supabase غير مهيأ بعد</span>
          </div>
          <p>
            أضف <code>VITE_SUPABASE_URL</code> و<code>VITE_SUPABASE_ANON_KEY</code> أولًا ثم شغّل
            ملفات الترحيل لعرض إحصاءات المالك المجمّعة.
          </p>
        </div>
      </div>
    );
  }

  if (adminCheckLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-sm text-slate-600" dir={isRtl ? 'rtl' : 'ltr'}>
        جاري التحقق من صلاحية المالك عبر الخادم…
      </div>
    );
  }

  if (!authUser || !isOwnerAdmin) {
    return (
      <div className="max-w-3xl mx-auto pb-12 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            لوحة إحصاءات المالك محمية بصلاحية الخادم
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            لا تعتمد هذه الصفحة على أي علم محلي في المتصفح أو تخمين. للوصول إليها يجب أن يكون
            معرّف جلستك الحالي مسجلًا داخل جدول <code>public.app_admins</code> في قاعدة Supabase
            عبر لوحة التحكم (SQL Editor).
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-700">
            <p className="font-bold text-slate-900">كيفية منح نفسك صلاحية المالك بأمان:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>سجّل الدخول أو فعّل الجلسة في التطبيق، أو أنشئ حسابك من لوحة Authentication.</li>
              <li>
                افتح <strong>SQL Editor</strong> في Supabase وأضف صفًا إلى <code>public.app_admins</code>{' '}
                بمعرّف المستخدم الخاص بك (<code>user_id</code>).
              </li>
              <li>أعد تحميل هذه الصفحة لقراءة الإحصاءات المجمّعة عبر دالة <code>get_owner_usage_summary</code>.</li>
            </ol>
            {authUser?.id && (
              <p className="pt-2 font-mono text-[11px] text-slate-600 num-ltr break-all">
                Current Session UUID: {authUser.id}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6 text-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            <span>صلاحية مالك موثقة من الخادم</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">إحصاءات الاستخدام المجمّعة</h1>
          <p className="text-xs text-slate-600">
            أرقام مجمّعة ومجهولة الهوية فقط — لا تعرض أي نصوص شكاوى أو قيم فواتير أو حسابات شخصية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border ${
                days === d
                  ? 'bg-emerald-700 border-emerald-700 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              آخر {d} يوم
            </button>
          ))}
          <button
            type="button"
            onClick={loadSummary}
            disabled={loading}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </header>

      {errorMsg && (
        <div role="alert" className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {summary && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>المستخدمون النشطون ({summary.window_days}ي)</span>
                <Users className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                {summary.active_users_in_window}
              </p>
              <p className="text-[11px] text-slate-500">
                العائدون (≥ يومين): {summary.returning_users_in_window}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>الملفات المسجلة (مجهول / مرتبط)</span>
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                {summary.total_profiles}
              </p>
              <p className="text-[11px] text-slate-500">
                مجهول: {summary.anonymous_profiles} · مرتبط ببريد: {summary.linked_profiles}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>قراءات «ملف بيتي» (عدد فقط)</span>
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                {summary.total_readings_count}
              </p>
              <p className="text-[11px] text-slate-500">لا تُعرض المبالغ أو القيم الفردية</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>مسودات «شكواي» (عدد فقط)</span>
                <FileText className="w-4 h-4 text-sky-700" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                {summary.total_complaint_drafts_count}
              </p>
              <p className="text-[11px] text-slate-500">
                موافقون على التحليلات: {summary.analytics_opted_in_profiles}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-700" />
                <h2 className="text-base font-extrabold text-slate-900">النشاط اليومي (الأحداث المسموحة)</h2>
              </div>

              {dailyChartData.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  لا توجد أحداث استخدام مسجلة ضمن الفترة المحددة بعد.
                </p>
              ) : (
                <div className="h-64 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="day" stroke="#475569" fontSize={11} />
                      <YAxis stroke="#475569" fontSize={11} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" name="عدد الأحداث" fill="#047857" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">توزيع الأحداث حسب النوع</h2>
              {summary.events_by_type.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  لم يُسجل أي حدث استخدام حتى الآن.
                </p>
              ) : (
                <div className="space-y-2 text-xs">
                  {summary.events_by_type.map((ev) => (
                    <div
                      key={ev.event_name}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                    >
                      <span className="font-mono font-bold text-slate-800">{ev.event_name}</span>
                      <span className="font-extrabold text-emerald-700 tabular-nums">{ev.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default OwnerAnalytics;
