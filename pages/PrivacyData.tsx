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
  const ar = isRtl;
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
          ? (ar ? 'تم تفعيل إحصاءات الاستخدام العامة المحدودة.' : 'Limited general usage statistics enabled.')
          : (ar ? 'تم إيقاف إحصاءات الاستخدام فورًا؛ لن تُرسل أي أحداث استخدام بعد الآن.' : 'Usage statistics stopped immediately; no usage events will be sent anymore.'),
      );
    } else {
      setToggleFeedback(res.error || (ar ? 'تعذر تحديث تفضيل التحليلات.' : 'Could not update the analytics preference.'));
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
      msg: res.ok ? res.message || (ar ? 'تم إرسال طلب الربط.' : 'Link request sent.') : res.error || (ar ? 'تعذر الربط.' : 'Linking failed.'),
    });
    if (res.ok) setEmailInput('');
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6 text-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700">
          <ShieldCheck className="w-4 h-4" />
          <span>{ar ? 'الشفافية والخصوصية وإدارة الجلسة' : 'Transparency, privacy & session management'}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          {ar ? 'الخصوصية والبيانات في MoEco' : 'Privacy & data in MoEco'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {ar
            ? 'نشرح هنا بوضوح كامل ما الذي يُحفظ في قاعدة البيانات، وأين يُحفظ، وما يراه مالك التطبيق، وكيفية التحكم في بياناتك أو حذفها أو ربطها اختياريًا ببريدك الإلكتروني.'
            : 'We explain here, in full clarity, what is stored in the database, where it is stored, what the app owner can see, and how to control, delete, or optionally link your data to your email.'}
        </p>
      </header>

      {/* Current Session & Connection Status */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900">{ar ? 'حالة جلستك وموافقتك الحالية' : 'Your current session & consent status'}</h2>

        {!isConfigured ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{ar ? 'اتصال الخادم غير مضبوط بعد في البيئة الحالية' : 'Server connection is not configured in this environment yet'}</p>
              <p className="mt-1">
                {ar
                  ? 'لم يتم تزويد مفاتيح الاتصال بالخادم بعد. حتى يتم ضبطها، لا تُحفظ أي سجلات ولا تُنشأ جلسة مجهولة.'
                  : 'Server connection keys have not been provided yet. Until they are set, no records are saved and no anonymous session is created.'}
              </p>
            </div>
          </div>
        ) : !hasCoreConsent ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-900">{ar ? 'لم تُنشأ جلسة حفظ بعد' : 'No storage session created yet'}</p>
              <p className="text-slate-600">
                {ar
                  ? 'لم يتم استدعاء تسجيل الدخول المجهول حتى الآن. يمكنك البدء ومراجعة الموافقة من هنا.'
                  : 'Anonymous sign-in has not been invoked yet. You can start and review consent from here.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openConsentModal(ar ? 'صفحة الخصوصية' : 'Privacy page')}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
            >
              <Lock className="w-4 h-4" />
              <span>{ar ? 'تفعيل الجلسة والموافقة' : 'Enable session & consent'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1">
              <span className="text-emerald-800 font-bold block">{ar ? 'نوع الجلسة' : 'Session type'}</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {authUser?.isAnonymous ? (ar ? 'جلسة مجهولة بدون حساب' : 'Anonymous session, no account') : (ar ? 'حساب مرتبط بالبريد' : 'Email-linked account')}
              </span>
              {authUser?.email && <span className="block text-slate-600 break-all">{authUser.email}</span>}
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
              <span className="text-slate-500 font-bold block">{ar ? 'معرّف الجلسة (UUID)' : 'Session ID (UUID)'}</span>
              <span className="font-mono text-slate-800 break-all num-ltr">
                {authUser?.id?.slice(0, 14)}…
              </span>
              <span className="block text-slate-500">{ar ? 'إصدار الموافقة' : 'Consent version'}: {profile?.consentVersion || '1.0'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
              <span className="text-slate-500 font-bold block">{ar ? 'إحصاءات الاستخدام الاختيارية' : 'Optional usage statistics'}</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {analyticsEnabled ? (ar ? 'مفعّلة بموافقتك' : 'Enabled with your consent') : (ar ? 'متوقفة' : 'Off')}
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
            <span>{ar ? 'ما البيانات التي تُحفظ وأين؟' : 'What data is stored, and where?'}</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-slate-700">
            <li>
              <strong>{ar ? 'ملف بيتي:' : 'My Home profile:'}</strong>{' '}
              {ar
                ? 'قراءات الكهرباء والمياه، الوحدات، الفترات، المبالغ الاختيارية، وملاحظاتك الشخصية في جدول household_readings بقاعدة البيانات.'
                : 'Electricity and water readings, units, periods, optional amounts, and your personal notes in the household_readings database table.'}
            </li>
            <li>
              <strong>{ar ? 'شكواي ما تضيعش:' : 'Complaint assistant:'}</strong>{' '}
              {ar
                ? 'مسودات الشكاوى، التصنيف، المنطقة التقريبية، وأرقام المتابعة التي تضيفها في جدول complaint_drafts (ولا تُرسل تلقائيًا لأي جهة حكومية).'
                : 'Complaint drafts, category, approximate area, and follow-up numbers you add, in the complaint_drafts table (never sent automatically to any government body).'}
            </li>
            <li>
              <strong>{ar ? 'الموافقة والتفضيلات:' : 'Consent & preferences:'}</strong>{' '}
              {ar
                ? 'سجل موافقتك وإصدارها في جدولي profiles و consents.'
                : 'A record of your consent and its version in the profiles and consents tables.'}
            </li>
            <li>
              <strong>{ar ? 'المرفقات والصور:' : 'Attachments & photos:'}</strong>{' '}
              {ar
                ? 'لا يرفع MoEco صور الفواتير أو الشكاوى تلقائيًا إلى التخزين السحابي؛ يُحفظ فقط اسم الملف وبياناته الوصفية ما لم يتم تفعيل رفع مُراجَع بحدود واضحة.'
                : 'MoEco never uploads bill or complaint photos to cloud storage automatically; only the file name and metadata are kept unless a clearly scoped, reviewed upload is enabled.'}
            </li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5 text-xs leading-relaxed">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <BarChart3 className="w-4 h-4" />
            <span>{ar ? 'ما الذي يراه مالك التطبيق؟' : 'What does the app owner see?'}</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-slate-700">
            <li>
              {ar
                ? 'يرى المالك الموثق أرقامًا مجمّعة فقط عبر دالة محمية: عدد المستخدمين النشطين، عدد القراءات الإجمالي، عدد مسودات الشكاوى الإجمالي، ومرات فتح الميزات حسب اليوم.'
                : 'The verified owner sees aggregated numbers only, via a protected function: active user count, total readings, total complaint drafts, and per-day feature opens.'}
            </li>
            <li>
              {ar
                ? 'لا يرى مالك التطبيق في لوحة الإحصاءات قيم فواتيرك أو نص شكواك أو عنوانك أو ملاحظاتك أو إحداثياتك أو بريدك الإلكتروني.'
                : 'The app owner does NOT see in the analytics dashboard your bill values, complaint text, address, notes, coordinates, or email address.'}
            </li>
            <li>
              {ar
                ? 'يتم عزل كل صف في الجداول الشخصية عبر سياسات أمان على مستوى الصف (كل مستخدم يرى صفوفه فقط).'
                : 'Every row in the personal tables is isolated by row-level security policies (each user sees only their own rows).'}
            </li>
          </ul>
        </div>
      </section>

      {/* Anonymous Session & Storage Exception */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 text-xs text-slate-700 leading-relaxed">
        <h2 className="text-base font-extrabold text-slate-900">
          {ar ? 'الاستخدام بدون حساب تقليدي واستثناء الجلسة على المتصفح' : 'Use without a traditional account, and the browser session exception'}
        </h2>
        <p>
          {ar
            ? 'يعمل MoEco عبر جلسة مجهولة الهوية في الخادم دون إلزامك بإنشاء كلمة مرور. لكي تظل سجلاتك متصلة بنفس المعرّف عند تحديث الصفحة، يحتفظ المتصفح فقط برمز جلسة المصادقة (Session Token) الخاص بالخادم (وهو الاستثناء التقني الوحيد، ولا تُخزن سجلاتك كنسخ محلية في localStorage).'
            : 'MoEco works through an anonymous server session without requiring a password. To keep your records tied to the same ID across page refreshes, the browser keeps only the server session token (the only technical exception; your records are not stored as local copies in localStorage).'}
        </p>
        <p className="font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3">
          {ar
            ? 'تنبيه مهم: إذا قمت بمسح بيانات المتصفح أو انتقلت إلى متصفح أو جهاز آخر دون ربط حسابك ببريدك الإلكتروني اختياريًا، فسيُنشأ لك معرّف مجهول جديد ولن تظهر سجلات الجهاز السابق تلقائيًا.'
            : 'Important: if you clear browser data or move to another browser or device without optionally linking your account to your email, a new anonymous ID is created and your previous device records will not appear automatically.'}
        </p>
      </section>

      {/* Analytics Opt-in / Opt-out Control */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-slate-900">
              {ar ? 'التحكم في إحصاءات الاستخدام المحدودة (Opt-in / Opt-out)' : 'Control limited usage statistics (opt-in / opt-out)'}
            </h2>
            <p className="text-xs text-slate-600">
              {ar
                ? 'تُرسل فقط أسماء الأحداث العامة المسموحة (مثل فتح ميزة أو حفظ سجل) من دون أي محتوى نصي أو أرقام فواتير. يمكنك إيقافها أو تفعيلها في أي وقت.'
                : 'Only allowed generic event names (like opening a feature or saving a record) are sent, with no text content or bill numbers. You can turn them off or on at any time.'}
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
                {analyticsEnabled ? (ar ? 'إيقاف إحصاءات الاستخدام الآن' : 'Turn off usage statistics now') : (ar ? 'تفعيل إحصاءات الاستخدام الاختيارية' : 'Enable optional usage statistics')}
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
              <span>{ar ? 'ربط الجلسة ببريد إلكتروني (اختياري لاستعادة بياناتك عبر الأجهزة)' : 'Link session to an email (optional, to restore your data across devices)'}</span>
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {ar
                ? 'لا يلزم ربط بريد للاستمرار في التطبيق. إذا رغبت في حفظ سجلاتك عند تغيير الهاتف أو مسح المتصفح، أدخل بريدك الإلكتروني لترقيتك عبر الخادم مع الحفاظ على جميع سجلاتك الحالية.'
                : 'Linking an email is not required to keep using the app. If you want to keep your records when changing phones or clearing the browser, enter your email to upgrade via the server while keeping all your current records.'}
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
              <span>{ar ? 'إرسال رابط ربط البريد' : 'Send email link'}</span>
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
          {ar
            ? 'تريد مراجعة سجلاتك المحفوظة أو تنزيل نسخة JSON أو حذف بياناتك من الخادم؟'
            : 'Want to review your saved records, download a JSON copy, or delete your data from the server?'}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/my-data"
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
          >
            <Download className="w-4 h-4" />
            <span>{ar ? 'إدارة وتصدير وحذف بياناتي' : 'Manage, export & delete my data'}</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link
            to="/my-data#delete"
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold"
          >
            <Trash2 className="w-4 h-4" />
            <span>{ar ? 'خيارات الحذف الكامل' : 'Full deletion options'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyData;
