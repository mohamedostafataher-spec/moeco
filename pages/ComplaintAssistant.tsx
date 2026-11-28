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
import { PageHero } from '../components/ui';
import {
  ComplaintCategoryId,
  ComplaintLocalStatus,
  LocalAttachment,
  PersonalComplaint,
  VERIFIED_COMPLAINT_CATEGORIES,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_STATUS_LABELS_EN,
  validateAndReadAttachment,
  isSafeExternalUrl,
} from '../services/personalCivicService';
import { supabaseDataService } from '../services/supabaseDataService';

const ComplaintAssistant: React.FC = () => {
  const { isRtl } = useApp();
  const T = (ar: string, en: string) => (isRtl ? ar : en);
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
      setErrorMsg(err?.message || T('تعذر تحميل مسودات الشكاوى من الخادم.', 'Could not load your complaint drafts.'));
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
      openConsentModal(T('تجهيز مسودة شكوى', 'Preparing a complaint draft'));
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
      setErrorMsg(err?.message || T('تعذر التحقق من الملف المرفق.', 'Could not verify the attached file.'));
      e.target.value = '';
    }
  };

  const handleRequestLocationWithConsent = () => {
    setErrorMsg(null);
    if (!locationConsentGiven) {
      setErrorMsg(T('يُرجى تأكيد موافقتك على إرفاق الإحداثيات قبل طلب الموقع الجغرافي.', 'Please confirm your consent to attach coordinates before requesting your location.'));
      return;
    }
    if (!('geolocation' in navigator)) {
      setErrorMsg(T('المتصفح الحالي لا يدعم تحديد الموقع الجغرافي.', 'This browser does not support geolocation.'));
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
        setErrorMsg(T('لم يتم الحصول على إذن الموقع من المتصفح. يمكنك كتابة العنوان يدويًا.', 'Location permission was not granted. You can type the address manually.'));
        setLocLoading(false);
      },
      { timeout: 10000 },
    );
  };

  const handleProceedToReview = () => {
    setErrorMsg(null);
    if (!title.trim()) {
      setErrorMsg(T('يُرجى كتابة عنوان مختصر للمشكلة.', 'Please enter a short title for the issue.'));
      return;
    }
    if (!description.trim()) {
      setErrorMsg(T('يُرجى كتابة وصف واضح للمشكلة.', 'Please write a clear description of the issue.'));
      return;
    }
    if (!areaOrAddress.trim()) {
      setErrorMsg(T('يُرجى تحديد المنطقة أو العنوان التقريبي.', 'Please specify the area or approximate address.'));
      return;
    }
    setStep(3);
  };

  const handleSaveDraft = async () => {
    if (!hasCoreConsent || !userId) {
      openConsentModal(T('حفظ مسودة شكوى', 'Saving a complaint draft'));
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
        setStatusNotice(T('تم تحديث مسودة الشكوى في قاعدة البيانات.', 'Complaint draft updated.'));
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
        setStatusNotice(T('تم حفظ المسودة بحالة «مسودة داخل MoEco» في الخادم. يمكنك الآن فتح القناة الرسمية وتقديم الشكوى بنفسك.', 'Draft saved as "Draft inside MoEco". You can now open the official channel and submit it yourself.'));
      }
      await reload();
      resetDraftForm();
      setWizardOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || T('تعذر حفظ مسودة الشكوى.', 'Could not save the complaint draft.'));
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
      setErrorMsg(err?.message || T('تعذر تسجيل فتح القناة الرسمية.', 'Could not record opening the official channel.'));
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
      setStatusNotice(T('تم تحديث بيانات المتابعة الشخصية بنجاح.', 'Follow-up details updated.'));
    } catch (err: any) {
      setErrorMsg(err?.message || T('تعذر تحديث بيانات المتابعة.', 'Could not update follow-up details.'));
    }
  };

  const handleMarkClosedByUser = async (complaint: PersonalComplaint) => {
    if (!userId) return;
    try {
      await supabaseDataService.updateComplaintDraft(userId, complaint.id, { status: 'closed_by_user' });
      await reload();
      setStatusNotice(T('تم تحديث حالة السجل إلى «أغلق المستخدم السجل».', 'Record status updated to "closed by user".'));
    } catch (err: any) {
      setErrorMsg(err?.message || T('تعذر إغلاق السجل.', 'Could not close the record.'));
    }
  };

  const handleCopySummary = async (complaint: PersonalComplaint) => {
    const catLabel =
      VERIFIED_COMPLAINT_CATEGORIES.find((c) => c.id === complaint.category)?.[isRtl ? 'labelAr' : 'labelEn'] ||
      complaint.category;
    const summaryText = [
      `${isRtl ? 'موضوع الشكوى' : 'Complaint subject'}: ${complaint.title}`,
      `${isRtl ? 'التصنيف' : 'Category'}: ${catLabel}`,
      `${isRtl ? 'المنطقة / العنوان' : 'Area / Address'}: ${complaint.areaOrAddress}`,
      `${isRtl ? 'تاريخ ووقت الواقعة' : 'Incident date and time'}: ${complaint.incidentDateTime}`,
      complaint.lat && complaint.lng ? `${isRtl ? 'إحداثيات (بموافقة المستخدم)' : 'Coordinates (with user consent)'}: ${complaint.lat}, ${complaint.lng}` : '',
      `${isRtl ? 'التفاصيل' : 'Details'}: ${complaint.description}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedId(complaint.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setErrorMsg(T('تعذر النسخ التلقائي إلى الحافظة.', 'Automatic copy to clipboard failed.'));
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
      <PageHero
        eyebrow={T("تنظيم ومتابعة الشكاوى الشخصية (محفوظة في الخادم)", "Organize and track your personal complaints, saved to your account")}
        title={T("شكواي ما تضيعش", "My Complaints, Never Lost")}
        subtitle={T("جهّز مسودة شكواك وملاحظاتك الخاصة، وافتح القناة الرسمية الموثقة لتقديمها بنفسك، ثم احتفظ برقم المتابعة وتذكير المراجعة في جلستك الخاصة.", "Prepare your complaint draft and private notes, open the verified official channel to submit it yourself, then keep the tracking number and review reminder in your own session.")}
        icon={<FileText className="w-5 h-5" />}
      >
        <div className="pt-3">
          <button
            type="button"
            onClick={openNewWizard}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <Plus className="w-4 h-4" />
            <span>{T('تجهيز مسودة شكوى جديدة', 'Prepare a new complaint draft')}</span>
          </button>
        </div>
      </PageHero>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">{T('تنبيه شفافية مهم:', 'Important transparency note:')}</p>
            <p>
              {T('MoEco لا يرسل شكاوى لأي جهة حكومية تلقائيًا، بل ينظم بياناتك في مسودتك الخاصة على الخادم (معزولة بسياسات خصوصية صارمة) ويحيلك للروابط الرسمية الموثقة لتقديمها ومتابعتها بنفسك.', 'MoEco never sends complaints to any government body automatically. It organizes your data in your own private draft on your account (isolated by strict privacy policies) and refers you to verified official links to submit and follow up yourself.')}
            </p>
          </div>
        </div>

        {dueRemindersCount > 0 && (
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-center gap-3 text-xs text-sky-900 font-bold">
            <Bell className="w-5 h-5 text-sky-700 shrink-0" />
            <span>
              {isRtl
                ? `لديك ${dueRemindersCount} ${dueRemindersCount === 1 ? 'سجل شكوى' : 'سجلات شكاوى'} حان موعد التذكير الشخصي لمراجعته.`
                : `You have ${dueRemindersCount} complaint record${dueRemindersCount === 1 ? '' : 's'} due for a personal review reminder.`}
            </span>
          </div>
        )}

      {!hasCoreConsent && <ConsentRequiredNotice featureTitle={T("شكواي ما تضيعش", "My Complaints")} />}

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
            aria-label={T("إغلاق الإشعار", "Dismiss notification")}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-emerald-100 text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {hasCoreConsent && wizardOpen && (
        <section
          aria-label={T("نموذج تجهيز مسودة الشكوى", "Complaint draft form")}
          className="bg-white border border-emerald-200 rounded-2xl p-6 space-y-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {editingId ? T('تعديل مسودة الشكوى', 'Edit complaint draft') : T('تجهيز شكوى خطوة بخطوة', 'Prepare a complaint, step by step')}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                {T('الخطوة', 'Step')} {step} {T('من', 'of')} 3:{' '}
                {step === 1 ? T('اختيار نوع المشكلة', 'Choose the issue type') : step === 2 ? T('تفاصيل البلاغ', 'Report details') : T('مراجعة البلاغ وحفظ المسودة', 'Review and save the draft')}
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
              {T('إلغاء', 'Cancel')}
            </button>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-900">{T('1. اختر تصنيف المشكلة:', '1. Choose the issue category:')}</p>
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
                    <p className="font-bold text-sm">{T(cat.labelAr, cat.labelEn || cat.labelAr)}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {cat.verifiedUrls.length > 0
                        ? (isRtl ? `روابط رسمية موثقة (${cat.verifiedUrls.length})` : `Verified official links (${cat.verifiedUrls.length})`)
                        : (isRtl ? cat.missingLinkNoticeAr : cat.missingLinkNoticeEn) || T('لا يتوفر رابط رسمي موثق حاليًا', 'No verified official link is currently available')}
                    </p>
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-900">
                  {T('القنوات الرسمية الموثقة في التطبيق لتصنيف', 'Verified official channels in the app for the category')} «{isRtl ? activeCategoryConfig.labelAr : (activeCategoryConfig.labelEn || activeCategoryConfig.labelAr)}»:
                </p>
                {activeCategoryConfig.verifiedUrls.length === 0 &&
                activeCategoryConfig.verifiedHotlines.length === 0 ? (
                  <p className="text-amber-800 font-bold">
                    {T('لا يتوفر رابط رسمي موثق حاليًا داخل التطبيق لهذا التصنيف. يمكنك تجهيز المسودة وحفظها ثم متابعة الجهة المختصة يدويًا.', 'No verified official link is currently available in the app for this category. You can still prepare and save the draft, then follow up with the authority manually.')}
                  </p>
                ) : (
                  <div className="space-y-1.5 text-slate-700">
                    {activeCategoryConfig.verifiedUrls.map((u) => (
                      <p key={u.url}>
                        • {T(u.label, u.labelEn || u.label)}: <span className="text-emerald-700 font-bold break-all" dir="ltr">{u.url}</span>
                      </p>
                    ))}
                    {activeCategoryConfig.verifiedHotlines.map((h) => (
                      <p key={h.number}>
                        • {T(h.label, h.labelEn || h.label)}: <strong className="text-slate-900 num-ltr">{h.number}</strong>
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
                  <span>{T('التالي: كتابة التفاصيل', 'Next: write the details')}</span>
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
                    {T('عنوان مختصر للشكوى *', 'Short complaint title *')}
                  </label>
                  <input
                    id="cmp-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={T("مثال: تراكم مخلفات أو انقطاع مياه مستمر", "Example: garbage accumulation or a continuous water outage")}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="cmp-time" className="block text-xs font-bold text-slate-700 mb-1.5">
                    {T('وقت وتاريخ المشكلة (اختياري)', 'Problem time and date (optional)')}
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
                  {T('المنطقة أو العنوان التقريبي (تكتبه بنفسك) *', 'Approximate area or address (you write it) *')}
                </label>
                <input
                  id="cmp-area"
                  type="text"
                  required
                  value={areaOrAddress}
                  onChange={(e) => setAreaOrAddress(e.target.value)}
                  placeholder={T("المحافظة / الحي / الشارع أو أقرب معلم", "Governorate / district / street or nearest landmark")}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cmp-desc" className="block text-xs font-bold text-slate-700 mb-1.5">
                  {T('وصف المشكلة *', 'Problem description *')}
                </label>
                <textarea
                  id="cmp-desc"
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={T("اكتب وصفًا واضحًا ومحددًا للواقعة لتسهيل تقديمه في الجهة المختصة...", "Write a clear, specific description of the incident to make it easy to submit to the right authority...")}
                  className="w-full p-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cmp-private-notes" className="block text-xs font-bold text-slate-700 mb-1.5">
                  {T('ملاحظات شخصية خاصة (تُحفظ لجلستك فقط ولا تُنشر)', 'Personal private notes (saved to your session only, never published)')}
                </label>
                <textarea
                  id="cmp-private-notes"
                  rows={2}
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  placeholder={T("أي تفاصيل إضافية تود تذكرها لنفسك...", "Any extra details you want to remember for yourself...")}
                  className="w-full p-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                <p className="font-bold text-slate-900">{T('توثيق اسم المستند أو الصورة المرجعية (اختياري):', 'Reference document or image name (optional):')}</p>
                <p className="text-slate-600">
                  {T('حفاظًا على خصوصيتك وعلى حدود التخزين، لا يرفع التطبيق الصور أو المستندات تلقائيًا إلى السحابة؛ يُحفظ اسم المرجع فقط لتتذكر أي ملف أرفقته عند التقديم في البوابة الرسمية.', 'To protect your privacy and keep storage lean, the app does not upload photos or documents automatically; only the reference name is saved so you remember which file to attach when you submit through the official portal.')}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 font-bold text-slate-800 cursor-pointer">
                    <Paperclip className="w-4 h-4 text-emerald-700" />
                    <span>{attachment ? T('تغيير اسم المرفق', 'Change attachment name') : T('اختيار مرجع صورة أو PDF', 'Choose an image or PDF reference')}</span>
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
                        {T('حذف المرجع', 'Remove reference')}
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
                    <strong>{T('إرفاق موقع GPS اختياري (بموافقتي الصريحة):', 'Attach an optional GPS location (with my explicit consent):')}</strong> {T('أوافق على حفظ إحداثيات الموقع داخل مسودتي الخاصة في الخادم لمساعدتي عند التقديم.', 'I agree to save the coordinates inside my private draft on the server to help me when submitting.')}
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
                      <span>{locLoading ? T('جاري تحديد الإحداثيات...', 'Locating...') : T('تحديد موقعي الحالي الآن', 'Locate me now')}</span>
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
                  <span>{T('السابق', 'Previous')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToReview}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                >
                  <span>{T('الخطوة التالية: مراجعة البلاغ', 'Next step: review the report')}</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-emerald-200 rounded-xl p-5 space-y-3">
                <h3 className="text-base font-extrabold text-slate-900">{T('مراجعة البلاغ قبل حفظ المسودة', 'Review the report before saving the draft')}</h3>
                <p className="text-xs text-slate-600">
                  {T('لن يتم إرسال أي شيء لأي جهة حكومية عند الضغط على «حفظ المسودة»؛ تُحفظ المسودة في جلستك الخاصة على الخادم بالحالة «مسودة داخل MoEco».', 'Nothing is sent to any government body when you tap "Save draft"; the draft is saved in your private server session with the status "Draft inside MoEco".')}
                </p>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-slate-200">
                  <div>
                    <dt className="text-slate-500">{T('التصنيف:', 'Category:')}</dt>
                    <dd className="font-bold text-slate-900 mt-0.5">{isRtl ? activeCategoryConfig.labelAr : (activeCategoryConfig.labelEn || activeCategoryConfig.labelAr)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">{T('العنوان المختصر:', 'Short title:')}</dt>
                    <dd className="font-bold text-slate-900 mt-0.5">{title}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">{T('المنطقة / العنوان:', 'Area / Address:')}</dt>
                    <dd className="font-bold text-slate-900 mt-0.5">{areaOrAddress}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">{T('الوقت:', 'Time:')}</dt>
                    <dd className="font-bold text-slate-900 tabular-nums mt-0.5">
                      {incidentDateTime || T('غير محدد', 'Not specified')}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-slate-500">{T('الوصف:', 'Description:')}</dt>
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
                  <span>{T('تعديل التفاصيل', 'Edit details')}</span>
                </button>

                <button
                  type="button"
                  disabled={savingDraft}
                  onClick={handleSaveDraft}
                  className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs"
                >
                  {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{T('حفظ المسودة في الخادم', 'Save the draft')}</span>
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
              <h2 className="text-lg font-extrabold text-slate-900">{T('سجل شكاواي الخاص', 'My complaints log')}</h2>
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
                <span>{T('حذف كل مسوداتي', 'Delete all my drafts')}</span>
              </button>
            )}
          </div>

          {confirmClearAll && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold text-rose-900">
                {T('هل تريد حذف جميع مسودات الشكاوى من قاعدة البيانات نهائيًا؟', 'Permanently delete all complaint drafts from your account?')}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="min-h-[44px] px-4 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
                >
                  {T('إلغاء', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!userId) return;
                    await supabaseDataService.deleteAllComplaintDrafts(userId);
                    setConfirmClearAll(false);
                    await reload();
                    setStatusNotice(T('تم حذف جميع مسودات «شكواي ما تضيعش» من الخادم.', 'All your complaint drafts were deleted.'));
                  }}
                  className="min-h-[44px] px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-xs font-bold text-white"
                >
                  {T('تأكيد الحذف الكلي', 'Confirm full deletion')}
                </button>
              </div>
            </div>
          )}

          {loadingList ? (
            <div className="py-10 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              <span>{T('جاري تحميل مسوداتك من الخادم...', 'Loading your drafts...')}</span>
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3">
              <p className="text-base font-extrabold text-slate-900">{T('لا توجد مسودات شكاوى محفوظة حاليًا', 'No saved complaint drafts yet')}</p>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                {T('لا يعرض MoEco شكاوى وهمية أو أرقام متابعة افتراضية. اضغط «تجهيز مسودة شكوى جديدة» لتنظيم بياناتها وحفظها في حسابك المجهول ثم تقديمها عبر القناة الرسمية.', 'MoEco never shows fake complaints or made-up tracking numbers. Tap "Prepare a new complaint draft" to organize your data, save it to your account, then submit it through the official channel.')}
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
                            {(isRtl ? COMPLAINT_STATUS_LABELS : COMPLAINT_STATUS_LABELS_EN)[cmp.status]}
                          </span>
                          {isReminderDue && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-sky-50 text-sky-900 border border-sky-200">
                              <Bell className="w-3.5 h-3.5" />
                              {T('موعد التذكير الشخصي', 'Personal reminder due')}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span>{T('التصنيف: ', 'Category: ')}{T(cat.labelAr, cat.labelEn || cat.labelAr)}</span>
                          <span>{T('المنطقة: ', 'Area: ')}{cmp.areaOrAddress}</span>
                          <span className="tabular-nums">{T('التاريخ: ', 'Date: ')}{cmp.incidentDateTime || T('غير محدد', 'Not specified')}</span>
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
                          <span>{copiedId === cmp.id ? T('تم نسخ النص', 'Copied') : T('نسخ الملخص', 'Copy summary')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => startEditDraft(cmp)}
                          className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800"
                        >
                          <Edit3 className="w-4 h-4 text-sky-700" />
                          <span>{T('تعديل', 'Edit')}</span>
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
                              {T('تأكيد الحذف', 'Confirm deletion')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
                            >
                              {T('تراجع', 'Undo')}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(cmp.id)}
                            className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>{T('حذف', 'Delete')}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {cmp.description}
                    </p>

                    {cmp.privateNotes && (
                      <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                        {T('ملاحظاتك الخاصة: ', 'Your private notes: ')}{cmp.privateNotes}
                      </p>
                    )}

                    {cmp.attachment && (
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                        <span className="text-slate-900 font-bold">{T('مرجع مرفق: ', 'Attached reference: ')}{cmp.attachment.name}</span>
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
                          {T('إزالة المرجع', 'Remove reference')}
                        </button>
                      </div>
                    )}

                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900">
                          {T('تقديم الشكوى عبر القناة الرسمية الموثقة', 'Submit the complaint through the verified official channel')}
                        </p>
                        {cat.verifiedHotlines.map((h) => (
                          <span
                            key={h.number}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 tabular-nums"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-700" />
                            {T(h.label, h.labelEn || h.label)}: <span className="num-ltr">{h.number}</span>
                          </span>
                        ))}
                      </div>

                      {cat.verifiedUrls.length === 0 ? (
                        <p className="text-xs font-bold text-amber-800">
                          {T('لا يتوفر رابط رسمي موثق حاليًا', 'No verified official link is currently available')}
                        </p>
                      ) : (
                        <div className="flex flex-wrap items-center gap-3">
                          {cat.verifiedUrls.length > 1 && (
                            <select
                              aria-label={T("اختيار القناة الرسمية الموثقة", "Choose the verified official channel")}
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
                                  {T(u.label, u.labelEn || u.label)} ({u.url})
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
                            <span>{T('فتح القناة الرسمية', 'Open the official channel')}</span>
                          </a>
                          {cat.verifiedUrls.length === 1 && (
                            <span className="text-xs text-slate-600 break-all">
                              {T(cat.verifiedUrls[0].label, cat.verifiedUrls[0].labelEn || cat.verifiedUrls[0].label)}
                            </span>
                          )}
                        </div>
                      )}

                      {(openedBannerId === cmp.id || cmp.status === 'opened_official_channel') && (
                        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs font-bold text-sky-900 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                          <span>
                            {T('فتحت القناة الرسمية. قدّم الشكوى هناك بنفسك، ثم ارجع لإضافة رقم المتابعة إن حصلت عليه.', 'Official channel opened. Submit the complaint there yourself, then come back to add the tracking number if you receive one.')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900">
                          {T('متابعتك الشخصية (إدخال يدوي من المستخدم)', 'Your personal follow-up (manual user input)')}
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
                              ? T('إغلاق لوحة المتابعة', 'Close follow-up panel')
                              : cmp.trackingNumber
                                ? T('تحديث رقم المتابعة / التذكير', 'Update tracking number / reminder')
                                : T('إضافة رقم المتابعة وتاريخ التقديم', 'Add tracking number and submission date')}
                          </button>
                          {cmp.status !== 'closed_by_user' && (
                            <button
                              type="button"
                              onClick={() => handleMarkClosedByUser(cmp)}
                              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                            >
                              {T('إغلاق السجل شخصيًا', 'Close the record personally')}
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
                                {T('رقم المتابعة (أدخله المستخدم):', 'Tracking number (entered by user):')}{' '}
                                <strong className="text-emerald-800 num-ltr">
                                  {cmp.trackingNumber}
                                </strong>
                              </p>
                            )}
                            {cmp.officialSubmittedDate && (
                              <p>
                                {T('تاريخ التقديم:', 'Submission date:')}{' '}
                                <strong className="num-ltr">{cmp.officialSubmittedDate}</strong>
                              </p>
                            )}
                            {cmp.officialEntityName && (
                              <p>
                                {T('الجهة المقدَّم إليها:', 'Submitted to:')} <strong>{cmp.officialEntityName}</strong>
                              </p>
                            )}
                            {cmp.reminderDateTime && (
                              <p>
                                {T('تذكير شخصي للمراجعة:', 'Personal review reminder:')}{' '}
                                <strong className="num-ltr">{cmp.reminderDateTime}</strong>
                              </p>
                            )}
                            {cmp.followUpNotes && (
                              <p className="sm:col-span-2">{T('ملاحظات المتابعة: ', 'Follow-up notes: ')}{cmp.followUpNotes}</p>
                            )}
                          </div>
                        )}

                      {followUpEditId === cmp.id && (
                        <div className="space-y-3 pt-2 border-t border-slate-200">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                {T('رقم المتابعة الرسمي (إن حصلت عليه)', 'Official tracking number (if received)')}
                              </label>
                              <input
                                type="text"
                                value={trackingNumberInput}
                                onChange={(e) => setTrackingNumberInput(e.target.value)}
                                placeholder={T("الرقم الذي أصدرته البوابة الرسمية", "The number issued by the official portal")}
                                className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 tabular-nums"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                {T('تاريخ التقديم الفعلي', 'Actual submission date')}
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
                                {T('اسم الجهة الرسمية', 'Official entity name')}
                              </label>
                              <input
                                type="text"
                                value={entityNameInput}
                                onChange={(e) => setEntityNameInput(e.target.value)}
                                placeholder={T("مثال: منظومة الشكاوى الموحدة", "Example: Unified Complaints Portal")}
                                className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                {T('تذكير مراجعة اختياري', 'Optional review reminder')}
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
                                {T('ملاحظات المتابعة', 'Follow-up notes')}
                              </label>
                              <input
                                type="text"
                                value={followUpNotesInput}
                                onChange={(e) => setFollowUpNotesInput(e.target.value)}
                                placeholder={T("ما حدث بعد تقديم الشكوى...", "What happened after submitting the complaint...")}
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
                              {T('إلغاء', 'Cancel')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveFollowUp(cmp)}
                              className="min-h-[44px] px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                            >
                              {T('حفظ بيانات المتابعة', 'Save follow-up details')}
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
