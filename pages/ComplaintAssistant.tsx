import React, { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ComplaintCategoryId,
  ComplaintLocalStatus,
  LocalAttachment,
  PersonalComplaint,
  VERIFIED_COMPLAINT_CATEGORIES,
  COMPLAINT_STATUS_LABELS,
  getPersonalComplaints,
  savePersonalComplaint,
  updatePersonalComplaint,
  deletePersonalComplaint,
  deleteComplaintAttachment,
  clearAllPersonalComplaints,
  validateAndReadAttachment,
  isSafeExternalUrl,
} from '../services/personalCivicService';

const ComplaintAssistant: React.FC = () => {
  const { user, isRtl } = useApp();
  const userId = user?.id || 'guest-local';

  const [complaints, setComplaints] = useState<PersonalComplaint[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: category, 2: details, 3: review & save
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

  // Follow-up modal / inline editor state for saved items
  const [followUpEditId, setFollowUpEditId] = useState<string | null>(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [submittedDateInput, setSubmittedDateInput] = useState('');
  const [entityNameInput, setEntityNameInput] = useState('');
  const [followUpNotesInput, setFollowUpNotesInput] = useState('');
  const [reminderInput, setReminderInput] = useState('');
  const [selectedOfficialUrl, setSelectedOfficialUrl] = useState<string>('');

  // UI feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [openedBannerId, setOpenedBannerId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const reload = () => setComplaints(getPersonalComplaints(userId));

  useEffect(() => {
    reload();
  }, [userId]);

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
      setAttachment(parsed);
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر التحقق من الملف المرفق.');
      e.target.value = '';
    }
  };

  const handleRequestLocationWithConsent = () => {
    setErrorMsg(null);
    if (!locationConsentGiven) {
      setErrorMsg('يُرجى تأكيد موافقتك على حفظ الإحداثيات محليًا قبل طلب الموقع الجغرافي.');
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

  const handleSaveDraft = () => {
    setErrorMsg(null);
    try {
      const nowTime = incidentDateTime || new Date().toISOString().slice(0, 16);
      if (editingId) {
        updatePersonalComplaint(userId, editingId, {
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
        setStatusNotice('تم تحديث مسودة الشكوى داخل MoEco.');
      } else {
        savePersonalComplaint(userId, {
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
        setStatusNotice('تم حفظ المسودة بحالة «مسودة داخل MoEco». يمكنك الآن فتح القناة الرسمية وتقديم الشكوى بنفسك.');
      }
      reload();
      resetDraftForm();
      setWizardOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر حفظ مسودة الشكوى.');
    }
  };

  const handleOpenOfficialChannel = (complaint: PersonalComplaint, url: string) => {
    if (!isSafeExternalUrl(url)) return;
    window.open(url, '_blank', 'noopener,noreferrer');

    const nextStatus: ComplaintLocalStatus =
      complaint.status === 'draft_moeco' ? 'opened_official_channel' : complaint.status;

    updatePersonalComplaint(userId, complaint.id, {
      status: nextStatus,
      officialChannelOpenedAt: new Date().toISOString(),
      officialChannelUrlUsed: url,
    });
    reload();
    setOpenedBannerId(complaint.id);
  };

  const openFollowUpEditor = (complaint: PersonalComplaint) => {
    setFollowUpEditId(complaint.id);
    setTrackingNumberInput(complaint.trackingNumber || '');
    setSubmittedDateInput(complaint.officialSubmittedDate || '');
    setEntityNameInput(complaint.officialEntityName || '');
    setFollowUpNotesInput(complaint.followUpNotes || '');
    setReminderInput(complaint.reminderDateTime || '');
  };

  const handleSaveFollowUp = (complaint: PersonalComplaint) => {
    const trimmedTracking = trackingNumberInput.trim();
    const nextStatus: ComplaintLocalStatus = trimmedTracking
      ? 'tracking_entered'
      : complaint.status;

    updatePersonalComplaint(userId, complaint.id, {
      trackingNumber: trimmedTracking || undefined,
      officialSubmittedDate: submittedDateInput || undefined,
      officialEntityName: entityNameInput.trim() || undefined,
      followUpNotes: followUpNotesInput.trim() || undefined,
      reminderDateTime: reminderInput || undefined,
      status: nextStatus,
    });
    reload();
    setFollowUpEditId(null);
    setStatusNotice('تم تحديث بيانات المتابعة الشخصية بنجاح.');
  };

  const handleMarkClosedByUser = (complaint: PersonalComplaint) => {
    updatePersonalComplaint(userId, complaint.id, { status: 'closed_by_user' });
    reload();
    setStatusNotice('تم تحديث حالة السجل إلى «أغلق المستخدم السجل».');
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
      className="max-w-5xl mx-auto px-4 pb-24 space-y-6 text-slate-100"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header & Mandatory Non-Gov Claim Disclaimer */}
      <header className="bg-slate-950/90 border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400">
              <FileText className="w-4 h-4" />
              <span>مساعد تنظيم ومتابعة الشكاوى الشخصية</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">شكواي ما تضيعش</h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              جهّز مسودة شكواك مع المرفقات وملاحظاتك الخاصة، وافتح القناة الرسمية الموثقة لتقديمها
              بنفسك، ثم احتفظ برقم المتابعة وتذكير المراجعة في مكان واحد خاص بك.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewWizard}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <Plus className="w-4 h-4" />
            <span>تجهيز مسودة شكوى جديدة</span>
          </button>
        </div>

        {/* Mandatory Clear Notice */}
        <div className="bg-amber-500/10 border border-amber-500/35 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-100 leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">تنبيه شفافية مهم:</p>
            <p>
              MoEco يساعدك على تنظيم بيانات الشكوى والوصول إلى القناة الرسمية. ما لم يظهر تكامل رسمي
              موثق، يجب تقديم الشكوى ومتابعتها مباشرةً لدى الجهة المختصة. جميع مسوداتك وملاحظاتك
              تُحفظ محليًا على هذا الجهاز لحسابك فقط ولا تُنشر للعامة.
            </p>
          </div>
        </div>

        {dueRemindersCount > 0 && (
          <div className="bg-sky-500/15 border border-sky-400/40 rounded-2xl p-4 flex items-center gap-3 text-xs text-sky-200 font-bold">
            <Bell className="w-5 h-5 text-sky-400 shrink-0" />
            <span>
              لديك {dueRemindersCount} {dueRemindersCount === 1 ? 'سجل شكوى' : 'سجلات شكاوى'} حان
              موعد التذكير الشخصي لمراجعته.
            </span>
          </div>
        )}
      </header>

      {statusNotice && (
        <div
          role="status"
          className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-sm"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{statusNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            aria-label="إغلاق الإشعار"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Guided Wizard (Steps 1 -> 3: Select Type -> Details -> Review & Save Draft) */}
      {wizardOpen && (
        <section
          aria-label="نموذج تجهيز مسودة الشكوى"
          className="bg-slate-950/90 border border-emerald-500/30 rounded-3xl p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-white">
                {editingId ? 'تعديل مسودة الشكوى' : 'تجهيز شكوى خطوة بخطوة'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
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
              className="min-h-[44px] px-3 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5"
            >
              إلغاء
            </button>
          </div>

          {/* Step 1: Choose Problem Type & Inspect Verified Official Links */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-white">1. اختر تصنيف المشكلة:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {VERIFIED_COMPLAINT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`min-h-[44px] text-right p-4 rounded-2xl border transition ${
                      category === cat.id
                        ? 'bg-emerald-500/15 border-emerald-400 text-white'
                        : 'bg-slate-900/70 border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <p className="font-black text-sm">{cat.labelAr}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {cat.verifiedUrls.length > 0
                        ? `روابط رسمية موثقة (${cat.verifiedUrls.length})`
                        : cat.missingLinkNoticeAr || 'لا يتوفر رابط رسمي موثق حاليًا'}
                    </p>
                  </button>
                ))}
              </div>

              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                <p className="font-bold text-white">
                  القنوات الرسمية الموثقة في التطبيق لتصنيف «{activeCategoryConfig.labelAr}»:
                </p>
                {activeCategoryConfig.verifiedUrls.length === 0 &&
                activeCategoryConfig.verifiedHotlines.length === 0 ? (
                  <p className="text-amber-300 font-bold">
                    لا يتوفر رابط رسمي موثق حاليًا داخل التطبيق لهذا التصنيف. يمكنك تجهيز المسودة
                    وحفظها محليًا لتقديمها عبر القناة الرسمية التي تختارها خارج MoEco.
                  </p>
                ) : (
                  <div className="space-y-1.5 text-slate-300">
                    {activeCategoryConfig.verifiedUrls.map((u) => (
                      <p key={u.url}>
                        • {u.label}: <span className="text-emerald-300 break-all">{u.url}</span>
                      </p>
                    ))}
                    {activeCategoryConfig.verifiedHotlines.map((h) => (
                      <p key={h.number}>
                        • {h.label}: <strong className="text-white tabular-nums">{h.number}</strong>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
                >
                  <span>التالي: كتابة التفاصيل</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Brief Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cmp-title" className="block text-xs font-bold text-slate-300 mb-1.5">
                    عنوان مختصر للشكوى *
                  </label>
                  <input
                    id="cmp-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: تراكم مخلفات أو انقطاع مياه مستمر"
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  />
                </div>

                <div>
                  <label htmlFor="cmp-time" className="block text-xs font-bold text-slate-300 mb-1.5">
                    وقت وتاريخ المشكلة (اختياري)
                  </label>
                  <input
                    id="cmp-time"
                    type="datetime-local"
                    value={incidentDateTime}
                    onChange={(e) => setIncidentDateTime(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cmp-area" className="block text-xs font-bold text-slate-300 mb-1.5">
                  المنطقة أو العنوان (تكتبه بنفسك) *
                </label>
                <input
                  id="cmp-area"
                  type="text"
                  required
                  value={areaOrAddress}
                  onChange={(e) => setAreaOrAddress(e.target.value)}
                  placeholder="المحافظة / الحي / الشارع أو أقرب معلم"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                />
              </div>

              <div>
                <label htmlFor="cmp-desc" className="block text-xs font-bold text-slate-300 mb-1.5">
                  وصف المشكلة *
                </label>
                <textarea
                  id="cmp-desc"
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب وصفًا واضحًا ومحددًا للواقعة لتسهيل تقديمه في الجهة المختصة..."
                  className="w-full p-3.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                />
              </div>

              <div>
                <label htmlFor="cmp-private-notes" className="block text-xs font-bold text-slate-300 mb-1.5">
                  ملاحظات شخصية خاصة (لا تُنشر مطلقًا وتبقى على جهازك فقط)
                </label>
                <textarea
                  id="cmp-private-notes"
                  rows={2}
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  placeholder="أي تفاصيل إضافية تود تذكرها لنفسك..."
                  className="w-full p-3.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                />
              </div>

              {/* Optional Attachment with Clear Pre-Save Privacy Disclosure */}
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-3 text-xs">
                <p className="font-bold text-white">صورة أو مستند توضيحي (اختياري):</p>
                <p className="text-slate-300">
                  يُحفظ الملف داخل مساحة المتصفح المحلية على جهازك فقط ولن يُرفع لخادم عام أو يُرسل
                  تلقائيًا لأي جهة. يُسمح بصور JPG / PNG / WebP أو PDF بحد أقصى 2 ميجابايت.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 font-bold text-white cursor-pointer">
                    <Paperclip className="w-4 h-4 text-emerald-400" />
                    <span>{attachment ? 'تغيير المرفق' : 'إرفاق صورة أو PDF'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleAttachmentUpload}
                      className="sr-only"
                    />
                  </label>
                  {attachment && (
                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-white/10">
                      <span className="truncate max-w-[200px] text-slate-200">{attachment.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachment(undefined)}
                        className="text-rose-400 font-bold"
                      >
                        حذف المرفق
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional GPS ONLY with Explicit Consent */}
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-3 text-xs">
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
                    className="mt-1 w-4 h-4 accent-emerald-500"
                  />
                  <span className="text-slate-200 leading-relaxed">
                    <strong>إرفاق موقع GPS اختياري (بموافقتي الصريحة):</strong> أوافق على تحديد وحفظ
                    إحداثيات الموقع الجغرافي محليًا داخل مسودتي على هذا الجهاز فقط لمساعدتي عند
                    التقديم.
                  </span>
                </label>

                {locationConsentGiven && (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={locLoading}
                      onClick={handleRequestLocationWithConsent}
                      className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 font-bold text-sky-200"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{locLoading ? 'جاري تحديد الإحداثيات...' : 'تحديد موقعي الحالي الآن'}</span>
                    </button>
                    {lat !== undefined && lng !== undefined && (
                      <span className="text-emerald-300 font-bold tabular-nums">
                        الإحداثيات المحفوظة: {lat}, {lng}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {errorMsg && (
                <div role="alert" className="bg-rose-500/15 border border-rose-500/40 text-rose-200 rounded-xl p-3 text-xs font-bold">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToReview}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
                >
                  <span>الخطوة التالية: مراجعة البلاغ</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Mandatory Review Step Before Saving */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 space-y-3">
                <h3 className="text-base font-black text-white">مراجعة البلاغ قبل حفظ المسودة</h3>
                <p className="text-xs text-slate-300">
                  تحقق من صحة البيانات. لن يتم إرسال أي شيء لأي جهة حكومية عند الضغط على «حفظ المسودة»؛
                  تُحفظ المسودة داخل جهازك بالحالة «مسودة داخل MoEco».
                </p>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/70 p-4 rounded-xl border border-white/10">
                  <div>
                    <dt className="text-slate-400">التصنيف:</dt>
                    <dd className="font-bold text-white mt-0.5">{activeCategoryConfig.labelAr}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">العنوان المختصر:</dt>
                    <dd className="font-bold text-white mt-0.5">{title}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">المنطقة / العنوان:</dt>
                    <dd className="font-bold text-white mt-0.5">{areaOrAddress}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">الوقت:</dt>
                    <dd className="font-bold text-white tabular-nums mt-0.5">
                      {incidentDateTime || 'غير محدد'}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-slate-400">الوصف:</dt>
                    <dd className="text-slate-200 mt-0.5 whitespace-pre-wrap">{description}</dd>
                  </div>
                  {privateNotes && (
                    <div className="sm:col-span-2">
                      <dt className="text-slate-400">ملاحظات خاصة:</dt>
                      <dd className="text-slate-300 mt-0.5">{privateNotes}</dd>
                    </div>
                  )}
                  {attachment && (
                    <div className="sm:col-span-2">
                      <dt className="text-slate-400">المرفق المحلي:</dt>
                      <dd className="text-slate-200 mt-0.5">{attachment.name}</dd>
                    </div>
                  )}
                  {lat !== undefined && lng !== undefined && (
                    <div className="sm:col-span-2">
                      <dt className="text-slate-400">الإحداثيات (بموافقة المستخدم):</dt>
                      <dd className="text-emerald-300 tabular-nums mt-0.5">
                        {lat}, {lng}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {errorMsg && (
                <div role="alert" className="bg-rose-500/15 border border-rose-500/40 text-rose-200 rounded-xl p-3 text-xs font-bold">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>تعديل التفاصيل</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ المسودة (داخل MoEco)</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Personal Complaints List */}
      <section className="bg-slate-950/90 border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white">سجل شكاواي الخاص</h2>
            <span className="text-xs font-bold text-slate-400 tabular-nums">
              ({complaints.length})
            </span>
          </div>

          {complaints.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClearAll(true)}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold text-rose-300"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف كل مسوداتي</span>
            </button>
          )}
        </div>

        {confirmClearAll && (
          <div className="bg-rose-500/15 border border-rose-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold text-rose-200">
              هل تريد حذف جميع مسودات الشكاوى والمرفقات المحفوظة من هذا الجهاز نهائيًا؟
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="min-h-[44px] px-4 rounded-xl bg-white/10 text-xs font-bold text-white"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllPersonalComplaints(userId);
                  setConfirmClearAll(false);
                  reload();
                  setStatusNotice('تم حذف جميع مسودات ومرفقات «شكواي ما تضيعش» من جهازك.');
                }}
                className="min-h-[44px] px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white"
              >
                تأكيد الحذف الكلي
              </button>
            </div>
          </div>
        )}

        {complaints.length === 0 ? (
          <div className="bg-slate-900/60 border border-dashed border-white/15 rounded-2xl p-8 text-center space-y-3">
            <p className="text-base font-black text-white">لا توجد مسودات شكاوى محفوظة حاليًا</p>
            <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
              لا يعرض MoEco شكاوى وهمية أو أرقام متابعة افتراضية. عندما تواجه مشكلة بيئية أو خدمية،
              اضغط «تجهيز مسودة شكوى جديدة» لتنظيم بياناتها وحفظها ثم تقديمها عبر القناة الرسمية.
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
              const chosenUrl =
                selectedOfficialUrl && cat.verifiedUrls.some((u) => u.url === selectedOfficialUrl)
                  ? selectedOfficialUrl
                  : cat.verifiedUrls[0]?.url || '';

              return (
                <article
                  key={cmp.id}
                  className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-white">{cmp.title}</h3>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-300 border border-white/10">
                          {COMPLAINT_STATUS_LABELS[cmp.status]}
                        </span>
                        {isReminderDue && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-200 border border-sky-400/30">
                            <Bell className="w-3.5 h-3.5" />
                            موعد التذكير الشخصي
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>التصنيف: {cat.labelAr}</span>
                        <span>المنطقة: {cmp.areaOrAddress}</span>
                        <span className="tabular-nums">التاريخ: {cmp.incidentDateTime}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopySummary(cmp)}
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white"
                      >
                        {copiedId === cmp.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-300" />
                        )}
                        <span>{copiedId === cmp.id ? 'تم نسخ النص' : 'نسخ الملخص'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => startEditDraft(cmp)}
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white"
                      >
                        <Edit3 className="w-4 h-4 text-sky-400" />
                        <span>تعديل</span>
                      </button>

                      {confirmDeleteId === cmp.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              deletePersonalComplaint(userId, cmp.id);
                              setConfirmDeleteId(null);
                              reload();
                            }}
                            className="min-h-[44px] px-3 py-2 rounded-xl bg-rose-600 text-xs font-bold text-white"
                          >
                            تأكيد الحذف
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="min-h-[44px] px-3 py-2 rounded-xl bg-white/10 text-xs font-bold text-slate-200"
                          >
                            تراجع
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(cmp.id)}
                          className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-300"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>حذف</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {cmp.description}
                  </p>

                  {cmp.privateNotes && (
                    <p className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-white/5">
                      ملاحظاتك الخاصة: {cmp.privateNotes}
                    </p>
                  )}

                  {cmp.attachment && (
                    <div className="flex flex-wrap items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-white/5 text-xs">
                      {cmp.attachment.mimeType.startsWith('image/') && (
                        <img
                          src={cmp.attachment.dataUrl}
                          alt={`مرفق ${cmp.attachment.name}`}
                          className="w-14 h-14 object-cover rounded-lg border border-white/15"
                        />
                      )}
                      <div className="space-y-1">
                        <p className="text-slate-200 font-bold">{cmp.attachment.name}</p>
                        <button
                          type="button"
                          onClick={() => {
                            deleteComplaintAttachment(userId, cmp.id);
                            reload();
                          }}
                          className="text-rose-400 hover:text-rose-300 font-bold underline"
                        >
                          حذف المرفق فقط
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Independent "Open Official Channel" Action */}
                  <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-200">
                        الخطوة 5: تقديم الشكوى عبر القناة الرسمية الموثقة
                      </p>
                      {cat.verifiedHotlines.map((h) => (
                        <span
                          key={h.number}
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-300 tabular-nums"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          {h.label}: {h.number}
                        </span>
                      ))}
                    </div>

                    {cat.verifiedUrls.length === 0 ? (
                      <p className="text-xs font-bold text-amber-300">
                        لا يتوفر رابط رسمي موثق حاليًا
                      </p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
                        {cat.verifiedUrls.length > 1 && (
                          <select
                            aria-label="اختيار القناة الرسمية الموثقة"
                            value={chosenUrl}
                            onChange={(e) => setSelectedOfficialUrl(e.target.value)}
                            className="min-h-[44px] px-3 rounded-xl bg-slate-900 border border-white/15 text-xs text-white"
                          >
                            {cat.verifiedUrls.map((u) => (
                              <option key={u.url} value={u.url}>
                                {u.label} ({u.url})
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenOfficialChannel(cmp, chosenUrl)}
                          className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>فتح القناة الرسمية</span>
                        </button>
                        {cat.verifiedUrls.length === 1 && (
                          <span className="text-xs text-slate-400 break-all">
                            {cat.verifiedUrls[0].label}
                          </span>
                        )}
                      </div>
                    )}

                    {(openedBannerId === cmp.id || cmp.status === 'opened_official_channel') && (
                      <div className="bg-sky-500/15 border border-sky-400/40 rounded-xl p-3 text-xs font-bold text-sky-200 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <span>
                          فتحت القناة الرسمية. قدّم الشكوى هناك بنفسك، ثم ارجع لإضافة رقم المتابعة
                          إن حصلت عليه.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Step 6: Manual Follow-Up Log (Tracking Number, Date, Entity, Reminder) */}
                  <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-200">
                        الخطوة 6: متابعتك الشخصية (إدخال يدوي من المستخدم)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            followUpEditId === cmp.id
                              ? setFollowUpEditId(null)
                              : openFollowUpEditor(cmp)
                          }
                          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-emerald-300"
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
                            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300"
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                          {cmp.trackingNumber && (
                            <p>
                              رقم المتابعة (أدخله المستخدم):{' '}
                              <strong className="text-emerald-300 tabular-nums">
                                {cmp.trackingNumber}
                              </strong>
                            </p>
                          )}
                          {cmp.officialSubmittedDate && (
                            <p>
                              تاريخ التقديم: <strong className="tabular-nums">{cmp.officialSubmittedDate}</strong>
                            </p>
                          )}
                          {cmp.officialEntityName && (
                            <p>
                              الجهة المقدَّم إليها: <strong>{cmp.officialEntityName}</strong>
                            </p>
                          )}
                          {cmp.reminderDateTime && (
                            <p>
                              تذكير شخصي للمراجعة: <strong className="tabular-nums">{cmp.reminderDateTime}</strong>
                            </p>
                          )}
                          {cmp.followUpNotes && (
                            <p className="sm:col-span-2">ملاحظات المتابعة: {cmp.followUpNotes}</p>
                          )}
                        </div>
                      )}

                    {followUpEditId === cmp.id && (
                      <div className="space-y-3 pt-2 border-t border-white/10">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              رقم المتابعة الرسمي (إن حصلت عليه)
                            </label>
                            <input
                              type="text"
                              value={trackingNumberInput}
                              onChange={(e) => setTrackingNumberInput(e.target.value)}
                              placeholder="الرقم الذي أصدرته البوابة الرسمية"
                              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-900 border border-white/15 text-xs text-white tabular-nums"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              تاريخ التقديم الفعلي
                            </label>
                            <input
                              type="date"
                              value={submittedDateInput}
                              onChange={(e) => setSubmittedDateInput(e.target.value)}
                              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-900 border border-white/15 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              اسم الجهة الرسمية
                            </label>
                            <input
                              type="text"
                              value={entityNameInput}
                              onChange={(e) => setEntityNameInput(e.target.value)}
                              placeholder="مثال: منظومة الشكاوى الموحدة"
                              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-900 border border-white/15 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              تذكير مراجعة اختياري
                            </label>
                            <input
                              type="datetime-local"
                              value={reminderInput}
                              onChange={(e) => setReminderInput(e.target.value)}
                              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-900 border border-white/15 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              ملاحظات المتابعة
                            </label>
                            <input
                              type="text"
                              value={followUpNotesInput}
                              onChange={(e) => setFollowUpNotesInput(e.target.value)}
                              placeholder="ما حدث بعد تقديم الشكوى..."
                              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-900 border border-white/15 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setFollowUpEditId(null)}
                            className="min-h-[44px] px-4 rounded-xl bg-white/5 text-xs font-bold text-slate-300"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveFollowUp(cmp)}
                            className="min-h-[44px] px-5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs"
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
    </div>
  );
};

export default ComplaintAssistant;
