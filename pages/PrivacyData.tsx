import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Database,
  BarChart3,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  Mail,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePrivacyConsent } from '../context/PrivacyConsentContext';

const PrivacyData: React.FC = () => {
  const { isRtl } = useApp();
  const {
    isConfigured,
    authUser,
    profile,
    hasCoreConsent,
    analyticsEnabled,
    openConsentModal,
    toggleAnalyticsConsent,
    linkEmailAccount,
  } = usePrivacyConsent();

  const [toggleBusy, setToggleBusy] = useState(false);
  const [toggleFeedback, setToggleFeedback] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkResult, setLinkResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleToggleAnalytics = async (next: boolean) => {
    setToggleFeedback(null);
    setToggleBusy(true);
    const res = await toggleAnalyticsConsent(next);
    setToggleBusy(false);
    if (res.ok) {
      setToggleFeedback(
        next
          ? 'تم تفعيل إحصاءات الاستخدام العامة المحدودة.'
          : 'تم إيقاف إحصاءات الاستخدام فورًا؛ لن تُرسل أي أحداث استخدام بعد الآن.',
      );
    } else {
      setToggleFeedback(res.error || 'تعذر تحديث تفضيل التحليلات.');
    }
  };

  const handleLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkResult(null);
    setLinkBusy(true);
    const res = await linkEmailAccount(emailInput);
    setLinkBusy(false);
    setLinkResult({
      ok: res.ok,
      msg: res.ok ? res.message || 'تم إرسال طلب الربط.' : res.error || 'تعذر الربط.',
    });
    if (res.ok) setEmailInput('');
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6 text-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700">
          <ShieldCheck className="w-4 h-4" />
          <span>الشفافية والخصوصية وإدارة الجلسة</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          الخصوصية والبيانات في MoEco
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          نشرح هنا بوضوح كامل ما الذي يُحفظ في قاعدة البيانات، وأين يُحفظ، وما يراه مالك التطبيق،
          وكيفية التحكم في بياناتك أو حذفها أو ربطها اختياريًا ببريدك الإلكتروني.
        </p>
      </header>

      {/* Current Session & Connection Status */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900">حالة جلستك وموافقتك الحالية</h2>

        {!isConfigured ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">اتصال Supabase غير مضبوط بعد في البيئة الحالية</p>
              <p className="mt-1">
                لم يتم تزويد <code>VITE_SUPABASE_URL</code> و<code>VITE_SUPABASE_ANON_KEY</code>{' '}
                بعد. حتى يتم ضبطهما، لا تُحفظ أي سجلات ولا تُنشأ جلسة مجهولة.
              </p>
            </div>
          </div>
        ) : !hasCoreConsent ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-900">لم تُنشأ جلسة حفظ بعد</p>
              <p className="text-slate-600">
                لم يتم استدعاء تسجيل الدخول المجهول حتى الآن. يمكنك البدء ومراجعة الموافقة من هنا.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openConsentModal('صفحة الخصوصية')}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
            >
              <Lock className="w-4 h-4" />
              <span>تفعيل الجلسة والموافقة</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1">
              <span className="text-emerald-800 font-bold block">نوع الجلسة</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {authUser?.isAnonymous ? 'جلسة مجهولة بدون حساب' : 'حساب مرتبط بالبريد'}
              </span>
              {authUser?.email && <span className="block text-slate-600 break-all">{authUser.email}</span>}
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
              <span className="text-slate-500 font-bold block">معرّف الجلسة (UUID)</span>
              <span className="font-mono text-slate-800 break-all num-ltr">
                {authUser?.id?.slice(0, 14)}…
              </span>
              <span className="block text-slate-500">إصدار الموافقة: {profile?.consentVersion || '1.0'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
              <span className="text-slate-500 font-bold block">إحصاءات الاستخدام الاختيارية</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {analyticsEnabled ? 'مفعّلة بموافقتك' : 'متوقفة'}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Clear Disclosures */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5 text-xs leading-relaxed">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <Database className="w-4 h-4" />
            <span>ما البيانات التي تُحفظ وأين؟</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-slate-700">
            <li>
              <strong>ملف بيتي:</strong> قراءات الكهرباء والمياه، الوحدات، الفترات، المبالغ الاختيارية،
              وملاحظاتك الشخصية في جدول <code>household_readings</code> بقاعدة بيانات Supabase.
            </li>
            <li>
              <strong>شكواي ما تضيعش:</strong> مسودات الشكاوى، التصنيف، المنطقة التقريبية، وأرقام
              المتابعة التي تضيفها في جدول <code>complaint_drafts</code> (ولا تُرسل تلقائيًا لأي جهة حكومية).
            </li>
            <li>
              <strong>الموافقة والتفضيلات:</strong> سجل موافقتك وإصدارها في <code>profiles</code> و<code>consents</code>.
            </li>
            <li>
              <strong>المرفقات والصور:</strong> لا يرفع MoEco صور الفواتير أو الشكاوى تلقائيًا إلى
              التخزين السحابي؛ يُحفظ فقط اسم الملف وبياناته الوصفية ما لم يتم تفعيل رفع مُراجَع بحدود واضحة.
            </li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5 text-xs leading-relaxed">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <BarChart3 className="w-4 h-4" />
            <span>ما الذي يراه مالك التطبيق؟</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-slate-700">
            <li>
              يرى المالك الموثق <strong>أرقامًا مجمّعة فقط</strong> عبر دالة محمية: عدد المستخدمين
              النشطين، عدد القراءات الإجمالي، عدد مسودات الشكاوى الإجمالي، ومرات فتح الميزات حسب اليوم.
            </li>
            <li>
              <strong>لا يرى</strong> مالك التطبيق في لوحة الإحصاءات قيم فواتيرك أو نص شكواك أو
              عنوانك أو ملاحظاتك أو إحداثياتك أو بريدك الإلكتروني.
            </li>
            <li>
              يتم عزل كل صف في الجداول الشخصية عبر سياسات <strong>RLS</strong> (<code>auth.uid() = user_id</code>).
            </li>
          </ul>
        </div>
      </section>

      {/* Anonymous Session & Storage Exception */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 text-xs text-slate-700 leading-relaxed">
        <h2 className="text-base font-extrabold text-slate-900">
          الاستخدام بدون حساب تقليدي واستثناء الجلسة على المتصفح
        </h2>
        <p>
          يعمل MoEco عبر <strong>جلسة مجهولة الهوية في Supabase</strong> دون إلزامك بإنشاء كلمة مرور.
          لكي تظل سجلاتك متصلة بنفس المعرّف عند تحديث الصفحة، يحتفظ المتصفح فقط برمز جلسة المصادقة
          (Session Token) الخاص بـ Supabase (وهو الاستثناء التقني الوحيد، ولا تُخزن سجلاتك كنسخ محلية
          في <code>localStorage</code>).
        </p>
        <p className="font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3">
          تنبيه مهم: إذا قمت بمسح بيانات المتصفح أو انتقلت إلى متصفح أو جهاز آخر دون ربط حسابك
          ببريدك الإلكتروني اختياريًا، فسيُنشأ لك معرّف مجهول جديد ولن تظهر سجلات الجهاز السابق تلقائيًا.
        </p>
      </section>

      {/* Analytics Opt-in / Opt-out Control */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-slate-900">
              التحكم في إحصاءات الاستخدام المحدودة (Opt-in / Opt-out)
            </h2>
            <p className="text-xs text-slate-600">
              تُرسل فقط أسماء الأحداث العامة المسموحة (مثل فتح ميزة أو حفظ سجل) من دون أي محتوى نصي
              أو أرقام فواتير. يمكنك إيقافها أو تفعيلها في أي وقت.
            </p>
          </div>

          {hasCoreConsent && (
            <button
              type="button"
              disabled={toggleBusy}
              onClick={() => handleToggleAnalytics(!analyticsEnabled)}
              className={`min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                analyticsEnabled
                  ? 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
                  : 'bg-emerald-700 border-emerald-700 text-white hover:bg-emerald-800'
              }`}
            >
              {toggleBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {analyticsEnabled ? 'إيقاف إحصاءات الاستخدام الآن' : 'تفعيل إحصاءات الاستخدام الاختيارية'}
              </span>
            </button>
          )}
        </div>

        {toggleFeedback && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{toggleFeedback}</span>
          </div>
        )}
      </section>

      {/* Optional Account Linking */}
      {hasCoreConsent && authUser?.isAnonymous && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-700" />
              <span>ربط الجلسة ببريد إلكتروني (اختياري لاستعادة بياناتك عبر الأجهزة)</span>
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              لا يلزم ربط بريد للاستمرار في التطبيق. إذا رغبت في حفظ سجلاتك عند تغيير الهاتف أو مسح
              المتصفح، أدخل بريدك الإلكتروني لترقيتك عبر Supabase مع الحفاظ على جميع سجلاتك الحالية.
            </p>
          </div>

          <form onSubmit={handleLinkEmail} className="flex flex-wrap gap-3">
            <input
              type="email"
              required
              dir="ltr"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="name@example.com"
              className="flex-1 min-w-[220px] min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
            />
            <button
              type="submit"
              disabled={linkBusy}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold"
            >
              {linkBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>إرسال رابط ربط البريد</span>
            </button>
          </form>

          {linkResult && (
            <div
              role="status"
              className={`rounded-xl p-3 text-xs font-bold border ${
                linkResult.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {linkResult.msg}
            </div>
          )}
        </section>
      )}

      {/* Shortcuts to My Data */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-600">
          تريد مراجعة سجلاتك المحفوظة أو تنزيل نسخة JSON أو حذف بياناتك من Supabase؟
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/my-data"
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
          >
            <Download className="w-4 h-4" />
            <span>إدارة وتصدير وحذف بياناتي</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link
            to="/my-data#delete"
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold"
          >
            <Trash2 className="w-4 h-4" />
            <span>خيارات الحذف الكامل</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyData;
