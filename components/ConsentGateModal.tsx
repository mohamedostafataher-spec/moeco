import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, BarChart3, AlertTriangle, X, Loader2, Database } from 'lucide-react';
import { usePrivacyConsent } from '../context/PrivacyConsentContext';
import { useApp } from '../context/AppContext';


export const ConsentRequiredNotice: React.FC<{
  featureTitle: string;
  onStartConsent?: () => void;
}> = ({ featureTitle, onStartConsent }) => {
  const { isConfigured, loading, openConsentModal } = usePrivacyConsent();
  const { isRtl } = useApp();


  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-sm text-slate-600">
        {isRtl ? 'جاري التحقق من حالة الجلسة...' : 'Checking your session status...'}
      </div>
    );
  }


  if (!isConfigured) {
    return (
      <div
        role="alert"
        className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2 text-slate-900"
      >
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs leading-relaxed">
            <h2 className="text-sm font-extrabold text-amber-950">
              {isRtl ? 'الحفظ السحابي مش متاح دلوقتي' : 'Cloud saving is not available right now'}
            </h2>
            <p className="text-amber-900">
              {isRtl ? `لحفظ «${featureTitle}» محتاجين الاتصال بالخادم. جرّب بعد شوية.` : `Saving "${featureTitle}" needs a server connection. Please try again shortly.`}
            </p>
            <p className="text-amber-800">
              {isRtl ? 'يمكنك استعراض البوابات الرسمية الموثقة والمنهجية وصفحة الخصوصية الآن دون حفظ بيانات.' : 'You can still browse the verified official portals, the methodology, and the privacy page now without saving any data.'}
            </p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="bg-white border border-emerald-200 rounded-2xl p-5 md:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-extrabold text-slate-900">
            {isRtl ? `موافقتك مطلوبة قبل حفظ بيانات «${featureTitle}»` : `Your consent is required before saving "${featureTitle}" data`}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isRtl
              ? 'لا يتطلب MoEco إنشاء حساب تقليدي أو كلمة مرور. عند موافقتك، يتم إنشاء جلسة مجهولة الهوية برمز عشوائي (UUID) لحفظ سجلاتك بأمان في قاعدة بيانات MoEco على الخادم، مع إمكانية عرضها وتصديرها وحذفها في أي وقت.'
              : 'MoEco does not require a traditional account or password. With your consent, an anonymous session is created with a random ID (UUID) to keep your records safe in the MoEco database on the server, and you can view, export, or delete them at any time.'}
          </p>
        </div>
      </div>


      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => (onStartConsent ? onStartConsent() : openConsentModal(featureTitle))}
          className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors"
        >
          <Lock className="w-4 h-4" />
          <span>{isRtl ? 'مراجعة شروط الخصوصية والبدء دون حساب' : 'Review privacy terms and start without an account'}</span>
        </button>
        <Link
          to="/privacy"
          className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700"
        >
          {isRtl ? 'اقرأ صفحة الخصوصية والبيانات' : 'Read the privacy and data page'}
        </Link>
      </div>
    </div>
  );
};


export const ConsentGateModal: React.FC = () => {
  const {
    isConfigured,
    consentModalOpen,
    consentReason,
    closeConsentModal,
    acceptConsentAndSignIn,
  } = usePrivacyConsent();
  const { isRtl } = useApp();


  const [analyticsOptIn, setAnalyticsOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);


  if (!consentModalOpen) return null;


  const handleAccept = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    const res = await acceptConsentAndSignIn({ analyticsOptIn });
    setSubmitting(false);
    if (!res.ok) {
      setErrorMsg(res.error || (isRtl ? 'تعذر تفعيل الجلسة المجهولة.' : 'Could not start the anonymous session.'));
    }
  };


  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 md:p-7 space-y-5 shadow-xl my-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="consent-modal-title" className="text-lg font-extrabold text-slate-900">
                {isRtl ? 'الخصوصية والموافقة قبل حفظ بياناتك' : 'Privacy and consent before saving your data'}
              </h2>
              {consentReason && (
                <p className="text-xs text-slate-500 mt-0.5">{isRtl ? `الميزة المطلوبة: ${consentReason}` : `Requested feature: ${consentReason}`}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={closeConsentModal}
            aria-label={isRtl ? 'إغلاق نافذة الموافقة' : 'Close consent dialog'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>


        <div className="space-y-3 text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="font-bold text-slate-900">{isRtl ? '1. حفظ البيانات الأساسية (مطلوب للحفظ في التطبيق):' : '1. Essential data saving (required to save in the app):'}</p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>
              {isRtl
                ? <>تُحفظ قراءاتك المنزلية، ومسودات الشكاوى، وملاحظاتك في قاعدة بيانات MoEco على <strong>الخادم</strong> بحيث تقتصر قراءتها وتعديلها وحذفها على جلستك فقط (RLS).</>
                : <>Your home readings, complaint drafts, and notes are saved in the MoEco database on the <strong>server</strong>, readable, editable, and deletable only by your session (RLS).</>}
            </li>
            <li>
              {isRtl
                ? 'للاستخدام دون إنشاء حساب تقليدي، ينشئ التطبيق جلسة مجهولة الهوية بمعرّف عشوائي (UUID) دون طلب اسمك الحقيقي أو رقمك القومي أو كلمة مرور.'
                : 'To use the app without a traditional account, it creates an anonymous session with a random ID (UUID), without asking for your real name, national ID, or password.'}
            </li>
            <li>
              {isRtl
                ? <><strong>استثناء الجلسة على المتصفح:</strong> يحتفظ المتصفح فقط برمز جلسة المصادقة (Session Token) لإبقاء معرّفك مرتبطًا بسجلاتك عند تحديث الصفحة.</>
                : <><strong>Browser session exception:</strong> the browser only keeps the session token to keep your ID linked to your records across refreshes.</>}
            </li>
            <li>
              {isRtl
                ? <><strong>حدود الجلسة المجهولة:</strong> إذا مسحت بيانات المتصفح أو فتحت MoEco من جهاز آخر دون ربط بريد إلكتروني اختياريًا، فسيتم إنشاء معرّف جديد ولن تظهر السجلات القديمة تلقائيًا.</>
                : <><strong>Anonymous session limits:</strong> if you clear browser data or open MoEco on another device without optionally linking an email, a new ID is created and old records will not appear automatically.</>}
            </li>
            <li>
              {isRtl
                ? <>تستطيع في أي وقت عرض بياناتك أو تصديرها أو حذفها بالكامل من صفحة <strong>«بياناتي»</strong> أو صفحة <strong>«الخصوصية»</strong>.</>
                : <>You can view, export, or fully delete your data at any time from the <strong>"My Data"</strong> or <strong>"Privacy"</strong> page.</>}
            </li>
          </ul>
        </div>


        {/* Separate Optional Analytics Toggle */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-2.5 bg-white">
          <div className="flex items-start gap-2.5">
            <BarChart3 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-bold text-slate-900">
                {isRtl ? '2. إحصاءات الاستخدام المحدودة (اختياري تمامًا)' : '2. Limited usage statistics (completely optional)'}
              </p>
              <p className="text-slate-600 leading-relaxed">
                {isRtl
                  ? <>عند التفعيل، تُرسل فقط أسماء أحداث عامة (مثل فتح صفحة أو حفظ قراءة) لتحسين التطبيق لصاحب المشروع بأرقام مجمّعة. <strong>لا تُسجل</strong> مبالغ الفواتير أو نصوص الشكاوى أو الملاحظات أو الإحداثيات أو عنوان IP. رفض هذا الخيار لا يمنعك من استخدام أي ميزة في التطبيق.</>
                  : <>When enabled, only generic event names (like opening a page or saving a reading) are sent as aggregate numbers to improve the app for the project owner. Bill amounts, complaint texts, notes, coordinates, and IP addresses are <strong>never</strong> recorded. Declining does not block any feature.</>}
              </p>
            </div>
          </div>


          <label className="flex items-center gap-2.5 pt-1 cursor-pointer text-xs font-bold text-slate-800">
            <input
              type="checkbox"
              checked={analyticsOptIn}
              onChange={(e) => setAnalyticsOptIn(e.target.checked)}
              className="w-4 h-4 accent-emerald-700"
            />
            <span>{isRtl ? 'أوافق اختياريًا على إرسال إحصاءات استخدام عامة ومحدودة (بدون أي نصوص أو أرقام فواتير)' : 'I optionally agree to send limited, generic usage statistics (no texts or bill numbers)'}</span>
          </label>
        </div>


        {!isConfigured && (
          <div role="alert" className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
            <span>
              {isRtl ? 'الاتصال بالخادم مش متاح دلوقتي. جرّب بعد شوية.' : 'The server connection is not available right now. Please try again shortly.'}
            </span>
          </div>
        )}


        {errorMsg && (
          <div role="alert" className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs font-bold text-rose-800">
            {errorMsg}
          </div>
        )}


        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <Link
            to="/privacy"
            onClick={closeConsentModal}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            {isRtl ? 'التفاصيل الكاملة في صفحة الخصوصية' : 'Full details on the privacy page'}
          </Link>


          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeConsentModal}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
            >
              {isRtl ? 'تصفح دون حفظ' : 'Browse without saving'}
            </button>
            <button
              type="button"
              disabled={submitting || !isConfigured}
              onClick={handleAccept}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold transition-colors"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isRtl ? 'أوافق وأبدأ جلسة الحفظ الآمنة' : 'I agree, start my secure saving session'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
