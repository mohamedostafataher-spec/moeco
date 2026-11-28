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
  const ar = isRtl;
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
      setErrorMsg(err?.message || (ar ? 'تعذر تحميل الإحصاءات المجمّعة.' : 'Could not load the aggregated statistics.'));
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
            <span>{ar ? 'الخادم غير مهيأ بعد' : 'Server not configured yet'}</span>
          </div>
          <p>
            {ar
              ? 'أضف مفاتيح الاتصال بالخادم أولًا ثم شغّل ملفات الترحيل لعرض إحصاءات المالك المجمّعة.'
              : 'Add the server connection keys first, then run the migration files to show the aggregated owner statistics.'}
          </p>
        </div>
      </div>
    );
  }

  if (adminCheckLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-sm text-slate-600" dir={isRtl ? 'rtl' : 'ltr'}>
        {ar ? 'جاري التحقق من صلاحية المالك عبر الخادم…' : 'Verifying owner permission via the server…'}
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
            {ar ? 'لوحة إحصاءات المالك محمية بصلاحية الخادم' : 'The owner analytics dashboard is protected by server permission'}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {ar
              ? 'لا تعتمد هذه الصفحة على أي علم محلي في المتصفح أو تخمين. للوصول إليها يجب أن يكون معرّف جلستك الحالي مسجلًا داخل جدول public.app_admins في قاعدة البيانات عبر لوحة التحكم (SQL Editor).'
              : 'This page relies on no local browser flag or guesswork. Access requires your current session ID to be registered in the public.app_admins database table via the dashboard (SQL Editor).'}
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-700">
            <p className="font-bold text-slate-900">{ar ? 'كيفية منح نفسك صلاحية المالك بأمان:' : 'How to safely grant yourself owner permission:'}</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>{ar ? 'سجّل الدخول أو فعّل الجلسة في التطبيق، أو أنشئ حسابك من لوحة Authentication.' : 'Sign in or enable the session in the app, or create your account from the Authentication dashboard.'}</li>
              <li>
                {ar
                  ? 'افتح SQL Editor في الخادم وأضف صفًا إلى public.app_admins بمعرّف المستخدم الخاص بك (user_id).'
                  : 'Open the server SQL Editor and add a row to public.app_admins with your user ID (user_id).'}
              </li>
              <li>{ar ? 'أعد تحميل هذه الصفحة لقراءة الإحصاءات المجمّعة عبر دالة get_owner_usage_summary.' : 'Reload this page to read the aggregated statistics via the get_owner_usage_summary function.'}</li>
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
            <span>{ar ? 'صلاحية مالك موثقة من الخادم' : 'Server-verified owner permission'}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">{ar ? 'إحصاءات الاستخدام المجمّعة' : 'Aggregated usage statistics'}</h1>
          <p className="text-xs text-slate-600">
            {ar
              ? 'أرقام مجمّعة ومجهولة الهوية فقط — لا تعرض أي نصوص شكاوى أو قيم فواتير أو حسابات شخصية.'
              : 'Aggregated, anonymized numbers only — no complaint text, bill values, or personal accounts.'}
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
              {ar ? `آخر ${d} يوم` : `Last ${d} days`}
            </button>
          ))}
          <button
            type="button"
            onClick={loadSummary}
            disabled={loading}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{ar ? 'تحديث' : 'Refresh'}</span>
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
                <span>{ar ? `المستخدمون النشطون (${summary.window_days}ي)` : `Active users (${summary.window_days}d)`}</span>
                <Users className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                {summary.active_users_in_window}
              </p>
              <p className="text-[11px] text-slate-500">
                {ar ? 'العائدون (≥ يومين)' : 'Returning (≥2 days)'}: {summary.returning_users_in_window}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>{ar ? 'الملفات المسجلة (مجهول / مرتبط)' : 'Registered profiles (anonymous / linked)'}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                {summary.total_profiles}
              </p>
              <p className="text-[11px] text-slate-500">
                {ar ? 'مجهول' : 'Anonymous'}: {summary.anonymous_profiles} · {ar ? 'مرتبط ببريد' : 'Email-linked'}: {summary.linked_profiles}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>{ar ? 'قراءات «ملف بيتي» (عدد فقط)' : 'My Home readings (count only)'}</span>
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                {summary.total_readings_count}
              </p>
              <p className="text-[11px] text-slate-500">{ar ? 'لا تُعرض المبالغ أو القيم الفردية' : 'Amounts and individual values are not shown'}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>{ar ? 'مسودات «شكواي» (عدد فقط)' : 'Complaint drafts (count only)'}</span>
                <FileText className="w-4 h-4 text-sky-700" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
                {summary.total_complaint_drafts_count}
              </p>
              <p className="text-[11px] text-slate-500">
                {ar ? 'موافقون على التحليلات' : 'Analytics opt-ins'}: {summary.analytics_opted_in_profiles}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-700" />
                <h2 className="text-base font-extrabold text-slate-900">{ar ? 'النشاط اليومي (الأحداث المسموحة)' : 'Daily activity (allowed events)'}</h2>
              </div>

              {dailyChartData.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  {ar ? 'لا توجد أحداث استخدام مسجلة ضمن الفترة المحددة بعد.' : 'No usage events recorded in the selected period yet.'}
                </p>
              ) : (
                <div className="h-64 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="day" stroke="#475569" fontSize={11} />
                      <YAxis stroke="#475569" fontSize={11} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" name={ar ? 'عدد الأحداث' : 'Events'} fill="#047857" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-extrabold text-slate-900">{ar ? 'توزيع الأحداث حسب النوع' : 'Events by type'}</h2>
              {summary.events_by_type.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  {ar ? 'لم يُسجل أي حدث استخدام حتى الآن.' : 'No usage event recorded yet.'}
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
