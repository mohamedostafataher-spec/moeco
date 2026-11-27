import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileText,
  ExternalLink,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Copy,
  Check,
  Bell,
  Phone,
  Paperclip,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePrivacyConsent } from '../context/PrivacyConsentContext';
import { ConsentRequiredNotice } from '../components/ConsentGateModal';
import {
  ComplaintCategoryId,
  ComplaintLocalStatus,
  LocalAttachment,
  PersonalComplaint,
  VERIFIED_COMPLAINT_CATEGORIES,
  COMPLAINT_STATUS_LABELS,
  validateAndReadAttachment,
  isSafeExternalUrl,
} from '../services/personalCivicService';
import { supabaseDataService } from '../services/supabaseDataService';

const ComplaintAssistant: React.FC = () => {
  const { isRtl } = useApp();
  const {
    isConfigured,
    authUser,
    hasCoreConsent,
    analyticsEnabled,
    openConsentModal,
    trackUsageEvent,
  } = usePrivacyConsent();
  const userId = authUser?.id || '';

  const [complaints, setComplaints] = useState<PersonalComplaint[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Draft form fields
  const [category, setCategory] = useState<ComplaintCategoryId>('environment_waste');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [areaOrAddress, setAreaOrAddress] = useState('');
  const [incidentDateTime, setIncidentDateTime] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [attachment, setAttachment] = useState<LocalAttachment | undefined>(undefined);
  const [locationConsentGiven, setLocationConsentGiven] = useState(false);
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [locLoading, setLocLoading] = useState(false);

  // Follow-up editor state for saved items
  const [followUpEditId, setFollowUpEditId] = useState<string | null>(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [submittedDateInput, setSubmittedDateInput] = useState('');
  const [entityNameInput, setEntityNameInput] = useState('');
  const [followUpNotesInput, setFollowUpNotesInput] = useState('');
  const [reminderInput, setReminderInput] = useState('');
  const [selectedOfficialUrls, setSelectedOfficialUrls] = useState<Record<string, string>>({});

  // UI feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [openedBannerId, setOpenedBannerId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const reload = useCallback(async () => {
    if (!isConfigured || !userId || !hasCoreConsent) {
      setComplaints([]);
      return;
    }
    setLoadingList(true);
    try {
      const list = await supabaseDataService.listComplaintDrafts(userId);
      setComplaints(list);
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر تحميل مسودات الشكاوى من الخادم.');
    } finally {
      setLoadingList(false);
    }
  }, [isConfigured, userId, hasCoreConsent]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (analyticsEnabled) {
      trackUsageEvent('feature_opened', { feature: 'my_complaints' });
    }
  }, [analyticsEnabled, trackUsageEvent]);

  const activeCategoryConfig = useMemo(
    () =>
      VERIFIED_COMPLAINT_CATEGORIES.find((c) => c.id === category) ||
      VERIFIED_COMPLAINT_CATEGORIES[0],
    [category],
  );

  const resetDraftForm = () => {
    setEditingId(null);
    setStep(1);
    setCategory('environment_waste');
    setTitle('');
    setDescription('');
    setAreaOrAddress('');
    setIncidentDateTime('');
    setPrivateNotes('');
    setAttachment(undefined);
    setLocationConsentGiven(false);
    setLat(undefined);
    setLng(undefined);
    setErrorMsg(null);
  };

  const openNewWizard = () => {
    if (!hasCoreConsent) {
      openConsentModal('تجهيز مسودة شكوى');
      return;
    }
    resetDraftForm();
    setWizardOpen(true);
  };

  const startEditDraft = (item: PersonalComplaint) => {
    setEditingId(item.id);
    setCategory(item.category);
    setTitle(item.title);
    setDescription(item.description);
    setAreaOrAddress(item.areaOrAddress);
    setIncidentDateTime(item.incidentDateTime);
    setPrivateNotes(item.privateNotes || '');
    setAttachment(item.attachment);
    setLocationConsentGiven(item.locationConsentGiven);
    setLat(item.lat);
    setLng(item.lng);
    setStep(2);
    setErrorMsg(null);
    setWizardOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await validateAndReadAttachment(file, { allowPdf: true });
      // Save metadata reference only — never auto-upload raw documents to cloud Storage
      setAttachment({ ...parsed, dataUrl: '' });
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر التحقق من الملف المرفق.');
      e.target.value = '';
    }
  };

  const handleRequestLocationWithConsent = () => {
    setErrorMsg(null);
    if (!locationConsentGiven) {
      setErrorMsg('يُرجى تأكيد موافقتك على إرفاق الإحداثيات قبل طلب الموقع الجغرافي.');
      return;
    }
    if (!('geolocation' in navigator)) {
      setErrorMsg('المتصفح الحالي لا يدعم تحديد الموقع الجغرافي.');
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setLocLoading(false);
      },
      () => {
        setErrorMsg('لم يتم الحصول على إذن الموقع من المتصفح. يمكنك كتابة العنوان يدويًا.');
        setLocLoading(false);
      },
      { timeout: 10000 },
    );
  };

  const handleProceedToReview = () => {
    setErrorMsg(null);
    if (!title.trim()) {
      setErrorMsg('يُرجى كتابة عنوان مختصر للمشكلة.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('يُرجى كتابة وصف واضح للمشكلة.');
      return;
    }
    if (!areaOrAddress.trim()) {
      setErrorMsg('يُرجى تحديد المنطقة أو العنوان التقريبي.');
      return;
    }
    setStep(3);
  };

  const handleSaveDraft = async () => {
    if (!hasCoreConsent || !userId) {
      openConsentModal('حفظ مسودة شكوى');
      return;
    }
    setErrorMsg(null);
    setSavingDraft(true);
    try {
      const nowTime = incidentDateTime || new Date().toISOString().slice(0, 16);
      if (editingId) {
        await supabaseDataService.updateComplaintDraft(userId, editingId, {
          category,
          title: title.trim(),
          description: description.trim(),
          areaOrAddress: areaOrAddress.trim(),
          incidentDateTime: nowTime,
          attachment,
          privateNotes: privateNotes.trim() || undefined,
          locationConsentGiven,
          lat: locationConsentGiven ? lat : undefined,
          lng: locationConsentGiven ? lng : undefined,
        });
        setStatusNotice('تم تحديث مسودة الشكوى في قاعدة البيانات.');
      } else {
        await supabaseDataService.createComplaintDraft(userId, {
          category,
          title: title.trim(),
          description: description.trim(),
          areaOrAddress: areaOrAddress.trim(),
          incidentDateTime: nowTime,
          attachment,
          privateNotes: privateNotes.trim() || undefined,
          locationConsentGiven,
          lat: locationConsentGiven ? lat : undefined,
          lng: locationConsentGiven ? lng : undefined,
          status: 'draft_moeco',
        });
        if (analyticsEnabled) {
          trackUsageEvent('complaint_draft_created', { feature: 'my_complaints', status: category });
        }
        setStatusNotice('تم حفظ المسودة بحالة «مسودة داخل MoEco» في الخادم. يمكنك الآن فتح القناة الرسمية وتقديم الشكوى بنفسك.');
      }
      await reload();
      resetDraftForm();
      setWizardOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر حفظ مسودة الشكوى.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleRecordOfficialChannelOpen = async (complaint: PersonalComplaint, url: string) => {
    if (!userId) return;
    const nextStatus: ComplaintLocalStatus =
      complaint.status === 'draft_moeco' ? 'opened_official_channel' : complaint.status;

    try {
      await supabaseDataService.updateComplaintDraft(userId, complaint.id, {
        status: nextStatus,
        officialChannelOpenedAt: new Date().toISOString(),
        officialChannelUrlUsed: url,
      });
      if (analyticsEnabled) {
        trackUsageEvent('complaint_external_opened', { feature: 'my_complaints' });
      }
      await reload();
      setOpenedBannerId(complaint.id);
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر تسجيل فتح القناة الرسمية.');
    }
  };

  const openFollowUpEditor = (complaint: PersonalComplaint) => {
    setFollowUpEditId(complaint.id);
    setTrackingNumberInput(complaint.trackingNumber || '');
    setSubmittedDateInput(complaint.officialSubmittedDate || '');
    setEntityNameInput(complaint.officialEntityName || '');
    setFollowUpNotesInput(complaint.followUpNotes || '');
    setReminderInput(complaint.reminderDateTime || '');
  };

  const handleSaveFollowUp = async (complaint: PersonalComplaint) => {
    if (!userId) return;
    const trimmedTracking = trackingNumberInput.trim();
    const nextStatus: ComplaintLocalStatus = trimmedTracking
      ? 'tracking_entered'
      : complaint.status;

    try {
      await supabaseDataService.updateComplaintDraft(userId, complaint.id, {
        trackingNumber: trimmedTracking || undefined,
        officialSubmittedDate: submittedDateInput || undefined,
        officialEntityName: entityNameInput.trim() || undefined,
        followUpNotes: followUpNotesInput.trim() || undefined,
        reminderDateTime: reminderInput || undefined,
        status: nextStatus,
      });
      await reload();
      setFollowUpEditId(null);
      setStatusNotice('تم تحديث بيانات المتابعة الشخصية بنجاح.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر تحديث بيانات المتابعة.');
    }
  };

  const handleMarkClosedByUser = async (complaint: PersonalComplaint) => {
    if (!userId) return;
    try {
      await supabaseDataService.updateComplaintDraft(userId, complaint.id, { status: 'closed_by_user' });
      await reload();
      setStatusNotice('تم تحديث حالة السجل إلى «أغلق المستخدم السجل».');
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر إغلاق السجل.');
    }
  };

  const handleCopySummary = async (complaint: PersonalComplaint) => {
    const catLabel =
      VERIFIED_COMPLAINT_CATEGORIES.find((c) => c.id === complaint.category)?.labelAr ||
      complaint.category;
    const summaryText = [
      `موضوع الشكوى: ${complaint.title}`,
      `التصنيف: ${catLabel}`,
      `المنطقة / العنوان: ${complaint.areaOrAddress}`,
      `تاريخ ووقت الواقعة: ${complaint.incidentDateTime}`,
      complaint.lat && complaint.lng ? `إحداثيات (بموافقة المستخدم): ${complaint.lat}, ${complaint.lng}` : '',
      `التفاصيل: ${complaint.description}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedId(complaint.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setErrorMsg('تعذر النسخ التلقائي إلى الحافظة.');
    }
  };

  const dueRemindersCount = useMemo(() => {
    const nowIso = new Date().toISOString().slice(0, 16);
    return complaints.filter(
      (c) => c.status !== 'closed_by_user' && c.reminderDateTime && c.reminderDateTime <= nowIso,
    ).length;
  }, [complaints]);

  return (
    <div
      className="max-w-5xl mx-auto pb-12 space-y-6 text-slate-900"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <header className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700">
              <FileText className="w-4 h-4" />
              <span>تنظيم ومتابعة الشكاوى الشخصية (محفوظة في الخادم)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">شكواي ما تضيعش</h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              جهّز مسودة شكواك وملاحظاتك الخاصة، وافتح القناة الرسمية الموثقة لتقديمها بنفسك، ثم
              احتفظ برقم المتابعة وتذكير المراجعة في جلستك الخاصة.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewWizard}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <Plus className="w-4 h-4" />
            <span>تجهيز مسودة شكوى جديدة</span>
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">تنبيه شفافية مهم:</p>
            <p>
              MoEco لا يرسل شكاوى لأي جهة حكومية تلقائيًا، بل ينظم بياناتك في مسودتك الخاصة على
              الخادم (معزولة بسياسات RLS) ويحيلك للروابط الرسمية الموثقة لتقديمها ومتابعتها بنفسك.
            </p>
          </div>
        </div>

        {dueRemindersCount > 0 && (
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-center gap-3 text-xs text-sky-900 font-bold">
            <Bell className="w-5 h-5 text-sky-700 shrink-0" />
            <span>
              لديك <span className="num-ltr">{dueRemindersCount}</span>{' '}
              {dueRemindersCount === 1 ? 'سجل شكوى' : 'سجلات شكاوى'} حان موعد التذكير الشخصي لمراجعته.
            </span>
          </div>
        )}
      </header>

      {!hasCoreConsent && <ConsentRequiredNotice featureTitle="شكواي ما تضيعش" />}

      {errorMsg && (
        <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {statusNotice && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 flex items-center justify-between gap-3 text-sm"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{statusNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            aria-label="إغلاق الإشعار"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-emerald-100 text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {hasCoreConsent && wizardOpen && (
        <section
          aria-label="نموذج تجهيز مسودة الشكوى"
          className="bg-white border border-emerald-200 rounded-2xl p-6 space-y-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {editingId ? 'تعديل مسودة الشكوى' : 'تجهيز شكوى خطوة بخطوة'}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                الخطوة {step} من 3:{' '}
                {step === 1 ? 'اختيار نوع المشكلة' : step === 2 ? 'تفاصيل البلاغ' : 'مراجعة البلاغ وحفظ المسودة'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetDraftForm();
                setWizardOpen(false);
              }}
              className="min-h-[44px] px-3.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              إلغاء
            </button>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-900">1. اختر تصنيف المشكلة:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {VERIFIED_COMPLAINT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`min-h-[44px] text-right p-4 rounded-xl border transition-colors ${
                      category === cat.id
                        ? 'bg-emerald-50 border-emerald-700 text-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <p className="font-bold text-sm">{cat.labelAr}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {cat.verifiedUrls.length > 0
                        ? `روابط رسمية موثقة (${cat.verifiedUrls.length})`
                        : cat.missingLinkNoticeAr || 'لا يتوفر رابط رسمي موثق حاليًا'}
                    </p>
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-900">
                  القنوات الرسمية الموثقة في التطبيق لتصنيف «{activeCategoryConfig.labelAr}»:
                </p>
                {activeCategoryConfig.verifiedUrls.length === 0 &&
                activeCategoryConfig.verifiedHotlines.length === 0 ? (
                  <p className="text-amber-800 font-bold">
                    لا يتوفر رابط رسمي موثق حاليًا داخل التطبيق لهذا التصنيف. يمكنك تجهيز المسودة
                    وحفظها لتقديمها عبر القناة الرسمية التي تختارها خارج MoEco.
                  </p>
                ) : (
                  <div className="space-y-1.5 text-slate-700">
                    {activeCategoryConfig.verifiedUrls.map((u) => (
                      <p key={u.url}>
                        • {u.label}: <span className="text-emerald-700 font-bold break-all" dir="ltr">{u.url}</span>
                      </p>
                    ))}
                    {activeCategoryConfig.verifiedHotlines.map((h) => (
                      <p key={h.number}>
                        • {h.label}: <strong className="text-slate-900 num-ltr">{h.number}</strong>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors"
                >
                  <span>التالي: كتابة التفاصيل</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cmp-title" className="block text-xs font-bold text-slate-700 mb-1.5">
                    عنوان مختصر للشكوى *
                  </label>
                  <input
                    id="cmp-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: تراكم مخلفات أو انقطاع مياه مستمر"
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="cmp-time" className="block text-xs font-bold text-slate-700 mb-1.5">
                    وقت وتاريخ المشكلة (اختياري)
                  </label>
                  <input
                    id="cmp-time"
                    type="datetime-local"
                    value={incidentDateTime}
                    onChange={(e) => setIncidentDateTime(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cmp-area" className="block text-xs font-bold text-slate-700 mb-1.5">
                  المنطقة أو العنوان التقريبي (تكتبه بنفسك) *
                </label>
                <input
                  id="cmp-area"
                  type="text"
                  required
                  value={areaOrAddress}
                  onChange={(e) => setAreaOrAddress(e.target.value)}
                  placeholder="المحافظة / الحي / الشارع أو أقرب معلم"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cmp-desc" className="block text-xs font-bold text-slate-700 mb-1.5">
                  وصف المشكلة *
                </label>
                <textarea
                  id="cmp-desc"
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب وصفًا واضحًا ومحددًا للواقعة لتسهيل تقديمه في الجهة المختصة..."
                  className="w-full p-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cmp-private-notes" className="block text-xs font-bold text-slate-700 mb-1.5">
                  ملاحظات شخصية خاصة (تُحفظ لجلستك فقط ولا تُنشر)
                </label>
                <textarea
                  id="cmp-private-notes"
                  rows={2}
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  placeholder="أي تفاصيل إضافية تود تذكرها لنفسك..."
                  className="w-full p-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                <p className="font-bold text-slate-900">توثيق اسم المستند أو الصورة المرجعية (اختياري):</p>
                <p className="text-slate-600">
                  حفاظًا على خصوصيتك وعلى حدود التخزين، لا يرفع التطبيق الصور أو المستندات تلقائيًا
                  إلى السحابة؛ يُحفظ اسم المرجع فقط لتتذكر أي ملف أرفقته عند التقديم في البوابة الرسمية.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 font-bold text-slate-800 cursor-pointer">
                    <Paperclip className="w-4 h-4 text-emerald-700" />
                    <span>{attachment ? 'تغيير اسم المرفق' : 'اختيار مرجع صورة أو PDF'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleAttachmentUpload}
                      className="sr-only"
                    />
                  </label>
                  {attachment && (
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
                      <span className="truncate max-w-[200px] text-slate-800">{attachment.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachment(undefined)}
                        className="text-rose-700 font-bold"
                      >
                        حذف المرجع
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={locationConsentGiven}
                    onChange={(e) => {
                      setLocationConsentGiven(e.target.checked);
                      if (!e.target.checked) {
                        setLat(undefined);
                        setLng(undefined);
                      }
                    }}
                    className="mt-1 w-4 h-4 accent-emerald-700"
                  />
                  <span className="text-slate-700 leading-relaxed">
                    <strong>إرفاق موقع GPS اختياري (بموافقتي الصريحة):</strong> أوافق على حفظ
                    إحداثيات الموقع داخل مسودتي الخاصة في الخادم لمساعدتي عند التقديم.
                  </span>
                </label>

                {locationConsentGiven && (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={locLoading}
                      onClick={handleRequestLocationWithConsent}
                      className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 font-bold text-sky-900"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{locLoading ? 'جاري تحديد الإحداثيات...' : 'تحديد موقعي الحالي الآن'}</span>
                    </button>
                    {lat !== undefined && lng !== undefined && (
                      <span className="text-emerald-800 font-bold num-ltr">
                        {lat}, {lng}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToReview}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                >
                  <span>الخطوة التالية: مراجعة البلاغ</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-emerald-200 rounded-xl p-5 space-y-3">
                <h3 className="text-base font-extrabold text-slate-900">مراجعة البلاغ قبل حفظ المسودة</h3>
                <p className="text-xs text-slate-600">
                  لن يتم إرسال أي شيء لأي جهة حكومية عند الضغط على «حفظ المسودة»؛ تُحفظ المسودة
                  في جلستك الخاصة على الخادم بالحالة «مسودة داخل MoEco».
                </p>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-slate-200">
                  <div>
                    <dt className="text-slate-500">التصنيف:</dt>
                    <dd className="font-bold text-slate-900 mt-0.5">{activeCategoryConfig.labelAr}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">العنوان المختصر:</dt>
                    <dd className="font-bold text-slate-900 mt-0.5">{title}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">المنطقة / العنوان:</dt>
                    <dd className="font-bold text-slate-900 mt-0.5">{areaOrAddress}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">الوقت:</dt>
                    <dd className="font-bold text-slate-900 tabular-nums mt-0.5">
                      {incidentDateTime || 'غير محدد'}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-slate-500">الوصف:</dt>
                    <dd className="text-slate-800 mt-0.5 whitespace-pre-wrap">{description}</dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>تعديل التفاصيل</span>
                </button>

                <button
                  type="button"
                  disabled={savingDraft}
                  onClick={handleSaveDraft}
                  className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs"
                >
                  {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>حفظ المسودة في الخادم</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {hasCoreConsent && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">سجل شكاواي الخاص</h2>
              <span className="text-xs font-bold text-slate-500 tabular-nums">
                ({complaints.length})
              </span>
            </div>

            {complaints.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف كل مسوداتي</span>
              </button>
            )}
          </div>

          {confirmClearAll && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold text-rose-900">
                هل تريد حذف جميع مسودات الشكاوى من قاعدة البيانات نهائيًا؟
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="min-h-[44px] px-4 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!userId) return;
                    await supabaseDataService.deleteAllComplaintDrafts(userId);
                    setConfirmClearAll(false);
                    await reload();
                    setStatusNotice('تم حذف جميع مسودات «شكواي ما تضيعش» من الخادم.');
                  }}
                  className="min-h-[44px] px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-xs font-bold text-white"
                >
                  تأكيد الحذف الكلي
                </button>
              </div>
            </div>
          )}

          {loadingList ? (
            <div className="py-10 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              <span>جاري تحميل مسوداتك من الخادم...</span>
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3">
              <p className="text-base font-extrabold text-slate-900">لا توجد مسودات شكاوى محفوظة حاليًا</p>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                لا يعرض MoEco شكاوى وهمية أو أرقام متابعة افتراضية. اضغط «تجهيز مسودة شكوى جديدة»
                لتنظيم بياناتها وحفظها في حسابك المجهول ثم تقديمها عبر القناة الرسمية.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((cmp) => {
                const cat =
                  VERIFIED_COMPLAINT_CATEGORIES.find((c) => c.id === cmp.category) ||
                  VERIFIED_COMPLAINT_CATEGORIES[0];
                const isReminderDue =
                  cmp.status !== 'closed_by_user' &&
                  cmp.reminderDateTime &&
                  cmp.reminderDateTime <= new Date().toISOString().slice(0, 16);
                const selectedUrlForCmp = selectedOfficialUrls[cmp.id];
                const chosenUrl =
                  selectedUrlForCmp && cat.verifiedUrls.some((u) => u.url === selectedUrlForCmp)
                    ? selectedUrlForCmp
                    : cat.verifiedUrls[0]?.url || '';

                return (
                  <article
                    key={cmp.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900">{cmp.title}</h3>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {COMPLAINT_STATUS_LABELS[cmp.status]}
                          </span>
                          {isReminderDue && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-sky-50 text-sky-900 border border-sky-200">
                              <Bell className="w-3.5 h-3.5" />
                              موعد التذكير الشخصي
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span>التصنيف: {cat.labelAr}</span>
                          <span>المنطقة: {cmp.areaOrAddress}</span>
                          <span className="tabular-nums">التاريخ: {cmp.incidentDateTime || 'غير محدد'}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopySummary(cmp)}
                          className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800"
                        >
                          {copiedId === cmp.id ? (
                            <Check className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-600" />
                          )}
                          <span>{copiedId === cmp.id ? 'تم نسخ النص' : 'نسخ الملخص'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => startEditDraft(cmp)}
                          className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800"
                        >
                          <Edit3 className="w-4 h-4 text-sky-700" />
                          <span>تعديل</span>
                        </button>

                        {confirmDeleteId === cmp.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={async () => {
                                await supabaseDataService.deleteComplaintDraft(userId, cmp.id);
                                setConfirmDeleteId(null);
                                await reload();
                              }}
                              className="min-h-[44px] px-3 py-2 rounded-xl bg-rose-700 text-xs font-bold text-white"
                            >
                              تأكيد الحذف
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
                            >
                              تراجع
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(cmp.id)}
                            className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {cmp.description}
                    </p>

                    {cmp.privateNotes && (
                      <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                        ملاحظاتك الخاصة: {cmp.privateNotes}
                      </p>
                    )}

                    {cmp.attachment && (
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                        <span className="text-slate-900 font-bold">مرجع مرفق: {cmp.attachment.name}</span>
                        <button
                          type="button"
                          onClick={async () => {
                            await supabaseDataService.updateComplaintDraft(userId, cmp.id, {
                              attachment: undefined,
                            });
                            await reload();
                          }}
                          className="text-rose-700 hover:text-rose-800 font-bold underline"
                        >
                          إزالة المرجع
                        </button>
                      </div>
                    )}

                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900">
                          تقديم الشكوى عبر القناة الرسمية الموثقة
                        </p>
                        {cat.verifiedHotlines.map((h) => (
                          <span
                            key={h.number}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 tabular-nums"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-700" />
                            {h.label}: <span className="num-ltr">{h.number}</span>
                          </span>
                        ))}
                      </div>

                      {cat.verifiedUrls.length === 0 ? (
                        <p className="text-xs font-bold text-amber-800">
                          لا يتوفر رابط رسمي موثق حاليًا
                        </p>
                      ) : (
                        <div className="flex flex-wrap items-center gap-3">
                          {cat.verifiedUrls.length > 1 && (
                            <select
                              aria-label="اختيار القناة الرسمية الموثقة"
                              value={chosenUrl}
                              onChange={(e) =>
                                setSelectedOfficialUrls((prev) => ({
                                  ...prev,
                                  [cmp.id]: e.target.value,
                                }))
                              }
                              className="min-h-[44px] px-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
                            >
                              {cat.verifiedUrls.map((u) => (
                                <option key={u.url} value={u.url}>
                                  {u.label} ({u.url})
                                </option>
                              ))}
                            </select>
                          )}
                          <a
                            href={isSafeExternalUrl(chosenUrl) ? chosenUrl : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              if (!isSafeExternalUrl(chosenUrl)) {
                                e.preventDefault();
                                return;
                              }
                              handleRecordOfficialChannelOpen(cmp, chosenUrl);
                            }}
                            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>فتح القناة الرسمية</span>
                          </a>
                          {cat.verifiedUrls.length === 1 && (
                            <span className="text-xs text-slate-600 break-all">
                              {cat.verifiedUrls[0].label}
                            </span>
                          )}
                        </div>
                      )}

                      {(openedBannerId === cmp.id || cmp.status === 'opened_official_channel') && (
                        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs font-bold text-sky-900 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                          <span>
                            فتحت القناة الرسمية. قدّم الشكوى هناك بنفسك، ثم ارجع لإضافة رقم المتابعة
                            إن حصلت عليه.
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900">
                          متابعتك الشخصية (إدخال يدوي من المستخدم)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              followUpEditId === cmp.id
                                ? setFollowUpEditId(null)
                                : openFollowUpEditor(cmp)
                            }
                            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800"
                          >
                            {followUpEditId === cmp.id
                              ? 'إغلاق لوحة المتابعة'
                              : cmp.trackingNumber
                                ? 'تحديث رقم المتابعة / التذكير'
                                : 'إضافة رقم المتابعة وتاريخ التقديم'}
                          </button>
                          {cmp.status !== 'closed_by_user' && (
                            <button
                              type="button"
                              onClick={() => handleMarkClosedByUser(cmp)}
                              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                            >
                              إغلاق السجل شخصيًا
                            </button>
                          )}
                        </div>
                      </div>

                      {(cmp.trackingNumber ||
                        cmp.officialSubmittedDate ||
                        cmp.officialEntityName ||
                        cmp.followUpNotes ||
                        cmp.reminderDateTime) &&
                        followUpEditId !== cmp.id && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                            {cmp.trackingNumber && (
                              <p>
                                رقم المتابعة (أدخله المستخدم):{' '}
                                <strong className="text-emerald-800 num-ltr">
                                  {cmp.trackingNumber}
                                </strong>
                              </p>
                            )}
                            {cmp.officialSubmittedDate && (
                              <p>
                                تاريخ التقديم:{' '}
                                <strong className="num-ltr">{cmp.officialSubmittedDate}</strong>
                              </p>
                            )}
                            {cmp.officialEntityName && (
                              <p>
                                الجهة المقدَّم إليها: <strong>{cmp.officialEntityName}</strong>
                              </p>
                            )}
                            {cmp.reminderDateTime && (
                              <p>
                                تذكير شخصي للمراجعة:{' '}
                                <strong className="num-ltr">{cmp.reminderDateTime}</strong>
                              </p>
                            )}
                            {cmp.followUpNotes && (
                              <p className="sm:col-span-2">ملاحظات المتابعة: {cmp.followUpNotes}</p>
                            )}
                          </div>
                        )}

                      {followUpEditId === cmp.id && (
                        <div className="space-y-3 pt-2 border-t border-slate-200">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                رقم المتابعة الرسمي (إن حصلت عليه)
                              </label>
                              <input
                                type="text"
                                value={trackingNumberInput}
                                onChange={(e) => setTrackingNumberInput(e.target.value)}
                                placeholder="الرقم الذي أصدرته البوابة الرسمية"
                                className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 tabular-nums"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                تاريخ التقديم الفعلي
                              </label>
                              <input
                                type="date"
                                value={submittedDateInput}
                                onChange={(e) => setSubmittedDateInput(e.target.value)}
                                className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                اسم الجهة الرسمية
                              </label>
                              <input
                                type="text"
                                value={entityNameInput}
                                onChange={(e) => setEntityNameInput(e.target.value)}
                                placeholder="مثال: منظومة الشكاوى الموحدة"
                                className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                تذكير مراجعة اختياري
                              </label>
                              <input
                                type="datetime-local"
                                value={reminderInput}
                                onChange={(e) => setReminderInput(e.target.value)}
                                className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                ملاحظات المتابعة
                              </label>
                              <input
                                type="text"
                                value={followUpNotesInput}
                                onChange={(e) => setFollowUpNotesInput(e.target.value)}
                                placeholder="ما حدث بعد تقديم الشكوى..."
                                className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setFollowUpEditId(null)}
                              className="min-h-[44px] px-4 rounded-xl bg-slate-100 text-xs font-bold text-slate-700"
                            >
                              إلغاء
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveFollowUp(cmp)}
                              className="min-h-[44px] px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                            >
                              حفظ بيانات المتابعة
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ComplaintAssistant;
