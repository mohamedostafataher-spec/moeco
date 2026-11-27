import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  Download,
  Trash2,
  Zap,
  FileText,
  Bookmark,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  LogOut,
  Mail,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePrivacyConsent } from '../context/PrivacyConsentContext';
import { ConsentRequiredNotice } from '../components/ConsentGateModal';
import { supabaseDataService, ConsentRecord } from '../services/supabaseDataService';
import {
  HomeUtilityRecord,
  PersonalComplaint,
  SavedPublicProjectNote,
  COMPLAINT_STATUS_LABELS,
  exportUtilityRecordsAsExcel,
} from '../services/personalCivicService';

const MyData: React.FC = () => {
  const { isRtl } = useApp();
  const {
    isConfigured,
    authUser,
    hasCoreConsent,
    analyticsEnabled,
    trackUsageEvent,
    linkEmailAccount,
    signOutSession,
    refreshPrivacyState,
  } = usePrivacyConsent();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [readings, setReadings] = useState<HomeUtilityRecord[]>([]);
  const [complaints, setComplaints] = useState<PersonalComplaint[]>([]);
  const [projectNotes, setProjectNotes] = useState<SavedPublicProjectNote[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);

  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const [linkEmail, setLinkEmail] = useState('');
  const [linking, setLinking] = useState(false);

  const loadData = useCallback(async () => {
    if (!isConfigured || !authUser?.id || !hasCoreConsent) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [rList, cList, nList, consList] = await Promise.all([
        supabaseDataService.listHouseholdReadings(authUser.id),
        supabaseDataService.listComplaintDrafts(authUser.id),
        supabaseDataService.listSavedProjectNotes(authUser.id),
        supabaseDataService.listConsents(authUser.id),
      ]);
      setReadings(rList);
      setComplaints(cList);
      setProjectNotes(nList);
      setConsents(consList);
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر تحميل بياناتك من الخادم.');
    } finally {
      setLoading(false);
    }
  }, [isConfigured, authUser?.id, hasCoreConsent]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportAllJson = async () => {
    if (!authUser?.id) return;
    setErrorMsg(null);
    try {
      const bundle = await supabaseDataService.fetchAllPersonalData(authUser.id);
      supabaseDataService.downloadPersonalExportJson(bundle);
      if (analyticsEnabled) {
        trackUsageEvent('data_exported', { feature: 'my_data', status: 'json' });
      }
      setStatusMsg('تم تنزيل نسخة كاملة من بياناتك المحفوظة في الخادم بصيغة JSON.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر تصدير البيانات.');
    }
  };

  const handleDeleteReading = async (id: string) => {
    if (!authUser?.id) return;
    try {
      await supabaseDataService.deleteHouseholdReading(authUser.id, id);
      setReadings((prev) => prev.filter((r) => r.id !== id));
      setStatusMsg('تم حذف القراءة من الخادم.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر الحذف.');
    }
  };

  const handleDeleteComplaint = async (id: string) => {
    if (!authUser?.id) return;
    try {
      await supabaseDataService.deleteComplaintDraft(authUser.id, id);
      setComplaints((prev) => prev.filter((c) => c.id !== id));
      setStatusMsg('تم حذف مسودة الشكوى من الخادم.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر الحذف.');
    }
  };

  const handleDeleteAllData = async () => {
    setErrorMsg(null);
    setDeletingAll(true);
    try {
      if (analyticsEnabled && authUser?.id) {
        await trackUsageEvent('data_deleted', { feature: 'my_data', status: 'full_wipe' });
      }
      await supabaseDataService.deleteAllMyMoecoData();
      setConfirmDeleteAll(false);
      setReadings([]);
      setComplaints([]);
      setProjectNotes([]);
      setConsents([]);
      await signOutSession();
      await refreshPrivacyState();
      setStatusMsg('تم حذف جميع بياناتك وسجلات الموافقة من قاعدة البيانات وإنهاء الجلسة.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر حذف جميع البيانات.');
    } finally {
      setDeletingAll(false);
    }
  };

  const handleLinkEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    setLinking(true);
    const res = await linkEmailAccount(linkEmail);
    setLinking(false);
    if (res.ok) {
      setStatusMsg(res.message || 'تم إرسال رسالة تأكيد البريد الإلكتروني.');
      setLinkEmail('');
    } else {
      setErrorMsg(res.error || 'تعذر ربط البريد الإلكتروني.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6 text-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700">
              <Database className="w-4 h-4" />
              <span>مركز التحكم في البيانات الشخصية</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">بياناتي في الخادم</h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              اعرض السجلات المرتبطة بجلستك داخل قاعدة بيانات MoEco، وصدّرها متى شئت، أو احذف أي
              سجل أو احذف حسابك المجهول بالكامل.
            </p>
          </div>

          {hasCoreConsent && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportAllJson}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
              >
                <Download className="w-4 h-4" />
                <span>تصدير كل بياناتي (JSON)</span>
              </button>
              {readings.length > 0 && (
                <button
                  type="button"
                  onClick={() => exportUtilityRecordsAsExcel(readings)}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold"
                >
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>تصدير ملف بيتي (Excel)</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {statusMsg && (
        <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!hasCoreConsent ? (
        <ConsentRequiredNotice featureTitle="بياناتي وإدارة السجلات" />
      ) : (
        <>
          {/* Identity & Optional Email Upgrade */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">الهوية الحالية في الخادم</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  المعرّف: <span className="font-mono num-ltr">{authUser?.id}</span> · الحالة:{' '}
                  <strong>{authUser?.isAnonymous ? 'جلسة مجهولة' : `مرتبطة (${authUser?.email})`}</strong>
                </p>
              </div>
              <Link
                to="/privacy"
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>إعدادات الخصوصية والتحليلات</span>
              </Link>
            </div>

            {authUser?.isAnonymous && (
              <form
                onSubmit={handleLinkEmailSubmit}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <Mail className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">اختياري: حفظ سجلاتك عبر ربط بريد إلكتروني</p>
                    <p className="mt-0.5">
                      إذا مسحت بيانات المتصفح ستضيع الجلسة المجهولة؛ ربط البريد يحافظ على هذه السجلات.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="email"
                    required
                    dir="ltr"
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="flex-1 min-w-[220px] min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={linking}
                    className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                  >
                    {linking && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>ربط البريد بالجلسة</span>
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Summary Counts */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-600 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              <span>جاري تحميل سجلاتك من الخادم...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Household Readings */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>سجلات ملف بيتي ({readings.length})</span>
                  </h2>
                  <Link to="/my-home" className="text-xs font-bold text-emerald-700 hover:underline">
                    فتح ملف بيتي
                  </Link>
                </div>
                {readings.length === 0 ? (
                  <p className="text-xs text-slate-500">لا توجد قراءات أو فواتير محفوظة في الخادم.</p>
                ) : (
                  <div className="space-y-2">
                    {readings.map((r) => (
                      <div
                        key={r.id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900">
                            {r.serviceType === 'electricity' ? 'كهرباء' : 'مياه'}:{' '}
                            <span className="num-ltr">{r.value} {r.unit}</span>
                          </span>
                          <span className="block text-slate-500 num-ltr mt-0.5">
                            {r.dateMode === 'billing_period'
                              ? `${r.periodStart} → ${r.periodEnd}`
                              : r.readingDate}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteReading(r.id)}
                          className="min-h-[44px] px-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Complaint Drafts */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>مسودات «شكواي ما تضيعش» ({complaints.length})</span>
                  </h2>
                  <Link to="/my-complaints" className="text-xs font-bold text-emerald-700 hover:underline">
                    فتح شكواي ما تضيعش
                  </Link>
                </div>
                {complaints.length === 0 ? (
                  <p className="text-xs text-slate-500">لا توجد مسودات شكاوى محفوظة.</p>
                ) : (
                  <div className="space-y-2">
                    {complaints.map((c) => (
                      <div
                        key={c.id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{c.title}</span>
                          <span className="block text-slate-500 mt-0.5">
                            {COMPLAINT_STATUS_LABELS[c.status]} · {c.areaOrAddress}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteComplaint(c.id)}
                          className="min-h-[44px] px-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Saved Project Notes */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-emerald-700" />
                  <span>ملاحظات المشروعات الموثقة ({projectNotes.length})</span>
                </h2>
                {projectNotes.length === 0 ? (
                  <p className="text-xs text-slate-500">لا توجد ملاحظات مشروعات محفوظة.</p>
                ) : (
                  <div className="space-y-2">
                    {projectNotes.map((n) => (
                      <div key={n.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                        <p className="font-bold text-slate-900">{n.projectTitle}</p>
                        {n.personalNote && <p className="text-slate-600 mt-1">{n.personalNote}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Consents Audit */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                <h2 className="text-base font-extrabold text-slate-900">سجل موافقاتك (consents)</h2>
                {consents.length === 0 ? (
                  <p className="text-xs text-slate-500">لا توجد سجلات موافقة.</p>
                ) : (
                  <div className="space-y-1.5 text-xs">
                    {consents.slice(0, 10).map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                      >
                        <span className="font-bold text-slate-800">
                          {item.consentType === 'core_storage' ? 'الحفظ الأساسي' : 'إحصاءات الاستخدام'}:{' '}
                          {item.granted ? 'موافق' : 'موقوف'}
                        </span>
                        <span className="text-slate-500 num-ltr">
                          v{item.consentVersion} · {new Date(item.acceptedAt).toLocaleString('ar-EG')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Danger Zone: Full Wipe + Sign Out */}
          <section
            id="delete"
            className="bg-rose-50 border border-rose-200 rounded-2xl p-6 space-y-4"
          >
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-rose-950">حذف جميع بياناتي من الخادم</h2>
              <p className="text-xs text-rose-900 leading-relaxed">
                يحذف هذا الإجراء جميع قراءاتك المنزلية، ومسودات الشكاوى، وملاحظات المشروعات، وأحداث
                الاستخدام، وسجل الموافقات من قاعدة البيانات بشكل نهائي ثم ينهي جلستك الحالية.
              </p>
            </div>

            {!confirmDeleteAll ? (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteAll(true)}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف كل بياناتي نهائيًا</span>
                </button>
                <button
                  type="button"
                  onClick={signOutSession}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>إنهاء الجلسة فقط</span>
                </button>
              </div>
            ) : (
              <div className="bg-white border border-rose-300 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-rose-900">
                  تأكيد نهائي: سيتم حذف كافة سجلاتك من الخادم ولا يمكن التراجع. صدّر نسخة JSON قبل
                  الحذف إذا احتجت إليها.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={deletingAll}
                    onClick={handleDeleteAllData}
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold"
                  >
                    {deletingAll && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>نعم، احذف جميع بياناتي من الخادم</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAll(false)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default MyData;
