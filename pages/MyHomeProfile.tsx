import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Droplets,
  Plus,
  Edit3,
  Trash2,
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Image as ImageIcon,
  X,
  Phone,
  BookOpen,
  FileSpreadsheet,
  FileJson,
  Eye,
  Info,
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
import {
  HomeUtilityRecord,
  UtilityServiceType,
  UtilityEntryKind,
  UtilityDateMode,
  LocalAttachment,
  VERIFIED_UTILITY_PORTALS,
  getHomeUtilityRecords,
  saveHomeUtilityRecord,
  updateHomeUtilityRecord,
  deleteHomeUtilityRecord,
  deleteHomeUtilityAttachment,
  clearAllHomeUtilityRecords,
  checkUtilityWarnings,
  analyzeUtilityTrend,
  validateAndReadAttachment,
  exportUtilityRecordsAsExcel,
  exportUtilityRecordsAsJson,
  isSafeExternalUrl,
} from '../services/personalCivicService';

const MyHomeProfile: React.FC = () => {
  const { user, isRtl } = useApp();
  const userId = user?.id || 'guest-local';

  const [records, setRecords] = useState<HomeUtilityRecord[]>([]);
  const [filterService, setFilterService] = useState<'all' | UtilityServiceType>('all');
  const [trendService, setTrendService] = useState<UtilityServiceType>('electricity');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<UtilityServiceType>('electricity');
  const [entryKind, setEntryKind] = useState<UtilityEntryKind>('consumption');
  const [valueInput, setValueInput] = useState('');
  const [unitOption, setUnitOption] = useState(''); // Must NOT be auto-assumed
  const [customUnit, setCustomUnit] = useState('');
  const [dateMode, setDateMode] = useState<UtilityDateMode>('single_date');
  const [readingDate, setReadingDate] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [currencyOption, setCurrencyOption] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [attachment, setAttachment] = useState<LocalAttachment | undefined>(undefined);

  // Preview, feedback & confirmations (no window.alert/confirm)
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showCo2Estimator, setShowCo2Estimator] = useState(false);

  const reloadRecords = () => {
    setRecords(getHomeUtilityRecords(userId));
  };

  useEffect(() => {
    reloadRecords();
  }, [userId]);

  const effectiveUnit = useMemo(() => {
    if (unitOption === 'other') return customUnit.trim();
    return unitOption.trim();
  }, [unitOption, customUnit]);

  const resetForm = () => {
    setEditingId(null);
    setServiceType('electricity');
    setEntryKind('consumption');
    setValueInput('');
    setUnitOption('');
    setCustomUnit('');
    setDateMode('single_date');
    setReadingDate('');
    setPeriodStart('');
    setPeriodEnd('');
    setAmountInput('');
    setCurrencyOption('');
    setPersonalNote('');
    setAttachment(undefined);
    setFormError(null);
    setPreviewOpen(false);
  };

  const startEdit = (record: HomeUtilityRecord) => {
    setEditingId(record.id);
    setServiceType(record.serviceType);
    setEntryKind(record.entryKind);
    setValueInput(String(record.value));
    if (['kWh', 'm³', 'لتر'].includes(record.unit)) {
      setUnitOption(record.unit);
      setCustomUnit('');
    } else {
      setUnitOption('other');
      setCustomUnit(record.unit);
    }
    setDateMode(record.dateMode);
    setReadingDate(record.readingDate || '');
    setPeriodStart(record.periodStart || '');
    setPeriodEnd(record.periodEnd || '');
    setAmountInput(record.amountPaid !== undefined ? String(record.amountPaid) : '');
    setCurrencyOption(record.currency || '');
    setPersonalNote(record.personalNote || '');
    setAttachment(record.attachment);
    setFormError(null);
    setPreviewOpen(false);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await validateAndReadAttachment(file, { allowPdf: false });
      setAttachment(parsed);
    } catch (err: any) {
      setFormError(err?.message || 'تعذر التحقق من الملف.');
      e.target.value = '';
    }
  };

  const numericValue = Number(valueInput);
  const numericAmount = amountInput.trim() ? Number(amountInput) : undefined;
  const referenceDateForSort =
    dateMode === 'billing_period' ? periodEnd || periodStart : readingDate;

  const liveWarnings = useMemo(() => {
    if (!valueInput.trim() || isNaN(numericValue) || numericValue <= 0) return [];
    return checkUtilityWarnings(
      records,
      {
        serviceType,
        value: numericValue,
        unit: effectiveUnit,
        dateMode,
        readingDate: referenceDateForSort,
        periodStart,
        periodEnd,
      },
      editingId || undefined,
    );
  }, [
    records,
    serviceType,
    numericValue,
    effectiveUnit,
    dateMode,
    referenceDateForSort,
    periodStart,
    periodEnd,
    editingId,
    valueInput,
  ]);

  const handleOpenPreview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!valueInput.trim() || isNaN(numericValue) || numericValue <= 0) {
      setFormError('يُرجى إدخال رقم صحيح أكبر من صفر كما يظهر في الفاتورة أو العداد.');
      return;
    }
    if (!effectiveUnit) {
      setFormError('يُرجى اختيار أو كتابة وحدة القياس الظاهرة في المصدر (لا يتم افتراض وحدة تلقائيًا).');
      return;
    }
    if (dateMode === 'single_date' && !readingDate) {
      setFormError('يُرجى تحديد تاريخ القراءة.');
      return;
    }
    if (dateMode === 'billing_period' && (!periodStart || !periodEnd)) {
      setFormError('يُرجى تحديد تاريخ بداية ونهاية فترة الفاتورة.');
      return;
    }
    if (numericAmount !== undefined && (isNaN(numericAmount) || numericAmount < 0)) {
      setFormError('المبلغ المدفوع يجب أن يكون رقمًا صحيحًا صفرًا أو أكبر.');
      return;
    }

    setPreviewOpen(true);
  };

  const handleConfirmSave = () => {
    setFormError(null);
    try {
      const payload = {
        serviceType,
        entryKind,
        value: numericValue,
        unit: effectiveUnit,
        dateMode,
        readingDate: referenceDateForSort,
        periodStart: dateMode === 'billing_period' ? periodStart : undefined,
        periodEnd: dateMode === 'billing_period' ? periodEnd : undefined,
        amountPaid: numericAmount,
        currency: numericAmount !== undefined && currencyOption ? currencyOption : undefined,
        personalNote: personalNote.trim() || undefined,
        attachment,
      };

      if (editingId) {
        updateHomeUtilityRecord(userId, editingId, payload);
        setStatusMessage('تم تحديث السجل بنجاح في ملف بيتي المحلي.');
      } else {
        saveHomeUtilityRecord(userId, payload);
        setStatusMessage('تم حفظ السجل بنجاح في ملف بيتي المحلي.');
      }

      reloadRecords();
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      setFormError(err?.message || 'تعذر حفظ السجل.');
      setPreviewOpen(false);
    }
  };

  const handleDeleteRecord = (id: string) => {
    deleteHomeUtilityRecord(userId, id);
    setConfirmDeleteId(null);
    reloadRecords();
    setStatusMessage('تم حذف السجل نهائيًا من جهازك.');
  };

  const handleDeleteAttachment = (id: string) => {
    deleteHomeUtilityAttachment(userId, id);
    reloadRecords();
    setStatusMessage('تم حذف صورة الفاتورة/العداد مع الإبقاء على بيانات السجل.');
  };

  const handleClearAll = () => {
    clearAllHomeUtilityRecords(userId);
    setConfirmClearAll(false);
    reloadRecords();
    setStatusMessage('تم مسح جميع سجلات ومرفقات «ملف بيتي» من هذا الجهاز.');
  };

  const filteredRecords = useMemo(() => {
    if (filterService === 'all') return records;
    return records.filter((r) => r.serviceType === filterService);
  }, [records, filterService]);

  const trend = useMemo(
    () => analyzeUtilityTrend(records, trendService),
    [records, trendService],
  );

  // Optional CO2 estimates strictly labeled "تقدير", only when unit matches source exactly
  const optionalCo2Records = useMemo(() => {
    return records
      .map((r) => {
        if (r.entryKind !== 'consumption') return null;
        const factorMeta = VERIFIED_UTILITY_PORTALS[r.serviceType].co2Factor;
        if (!factorMeta) return null;
        if (r.unit !== factorMeta.unitRequired) return null;
        return {
          record: r,
          estimatedKgCo2: Number((r.value * factorMeta.value).toFixed(2)),
          factorMeta,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [records]);

  return (
    <div
      className="max-w-5xl mx-auto px-4 pb-24 space-y-6 text-slate-100"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <header className="bg-slate-950/90 border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Zap className="w-4 h-4" />
              <span>مساحة متابعة شخصية اختيارية</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              ملف بيتي (المياه والكهرباء)
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              سجّل قراءات العداد أو استهلاك الفواتير بنفسك لمتابعة استهلاك منزلك عبر الفترات.
              هذا القسم لا يتصل بحسابات شركات المياه أو الكهرباء ولا يغني عن بواباتها الرسمية.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (showForm && !editingId) {
                setShowForm(false);
              } else {
                resetForm();
                setShowForm(true);
              }
            }}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm && !editingId ? 'إغلاق النموذج' : 'إضافة قراءة أو فاتورة'}</span>
          </button>
        </div>

        {/* Privacy & Local Storage Transparency Notice */}
        <div className="bg-slate-900/90 border border-sky-500/25 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-300 leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white">خصوصية سجلاتك:</p>
            <p>
              تُحفظ هذه البيانات والمرفقات محليًا على هذا المتصفح/الجهاز فقط (بمعرّف حسابك الحالي)
              ولا تُرفع إلى خادم مشترك أو قاعدة عامة، وبالتالي لن تظهر تلقائيًا على أجهزة أخرى.
              لا يُطلب إدخال رقم الحساب أو الرقم القومي أو الموقع الجغرافي.
            </p>
          </div>
        </div>

        {/* Verified Official Portals in Codebase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {(['electricity', 'water'] as UtilityServiceType[]).map((svc) => {
            const info = VERIFIED_UTILITY_PORTALS[svc];
            return (
              <div
                key={svc}
                className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    {svc === 'electricity' ? (
                      <Zap className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Droplets className="w-4 h-4 text-sky-400" />
                    )}
                    <span>بوابات {info.nameAr} الرسمية (الموثقة بالتطبيق)</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-300 tabular-nums">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    {info.hotline.label}: {info.hotline.number}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {info.portals.map(
                    (p) =>
                      isSafeExternalUrl(p.url) && (
                        <a
                          key={p.url}
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-emerald-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        >
                          <span>{p.label}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </header>

      {/* Status Banner */}
      {statusMessage && (
        <div
          role="status"
          className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-sm"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            aria-label="إغلاق الرسالة"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <section
          aria-label={editingId ? 'تعديل سجل في ملف بيتي' : 'إضافة سجل جديد في ملف بيتي'}
          className="bg-slate-950/90 border border-emerald-500/30 rounded-3xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-white">
              {editingId ? 'تعديل سجل مسجل' : 'إضافة قراءة عداد أو فاتورة جديدة'}
            </h2>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="min-h-[44px] px-3 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5"
            >
              إلغاء
            </button>
          </div>

          <form onSubmit={handleOpenPreview} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="home-service" className="block text-xs font-bold text-slate-300 mb-1.5">
                  نوع الخدمة *
                </label>
                <select
                  id="home-service"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as UtilityServiceType)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <option value="electricity">كهرباء</option>
                  <option value="water">مياه</option>
                </select>
              </div>

              <div>
                <label htmlFor="home-entry-kind" className="block text-xs font-bold text-slate-300 mb-1.5">
                  طبيعة القيمة المدخلة *
                </label>
                <select
                  id="home-entry-kind"
                  value={entryKind}
                  onChange={(e) => setEntryKind(e.target.value as UtilityEntryKind)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <option value="consumption">كمية استهلاك الفاتورة</option>
                  <option value="reading">قراءة العداد</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="home-value" className="block text-xs font-bold text-slate-300 mb-1.5">
                  القيمة الرقمية (كما تظهر في المصدر) *
                </label>
                <input
                  id="home-value"
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  placeholder="أدخل الرقم بدقة من العداد أو الفاتورة"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                />
              </div>

              <div>
                <label htmlFor="home-unit" className="block text-xs font-bold text-slate-300 mb-1.5">
                  الوحدة (كما تظهر في الفاتورة أو العداد) *
                </label>
                <select
                  id="home-unit"
                  value={unitOption}
                  onChange={(e) => setUnitOption(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <option value="">اختر الوحدة من المصدر (بدون افتراض)</option>
                  <option value="kWh">كيلوواط ساعة (kWh)</option>
                  <option value="m³">متر مكعب (m³)</option>
                  <option value="لتر">لتر</option>
                  <option value="other">وحدة أخرى (أكتبها يدويًا)</option>
                </select>
                {unitOption === 'other' && (
                  <input
                    type="text"
                    aria-label="وحدة القياس المخصصة"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="اكتب اسم الوحدة كما ورد في الفاتورة"
                    className="mt-2 w-full min-h-[44px] px-3.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="home-date-mode" className="block text-xs font-bold text-slate-300 mb-1.5">
                  تاريخ القراءة أو فترة الفاتورة *
                </label>
                <select
                  id="home-date-mode"
                  value={dateMode}
                  onChange={(e) => setDateMode(e.target.value as UtilityDateMode)}
                  className="w-full sm:w-64 min-h-[44px] px-3.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <option value="single_date">تاريخ محدد للقراءة</option>
                  <option value="billing_period">فترة فاتورة (من — إلى)</option>
                </select>
              </div>

              {dateMode === 'single_date' ? (
                <div>
                  <label htmlFor="home-reading-date" className="block text-xs font-bold text-slate-300 mb-1.5">
                    تاريخ القراءة *
                  </label>
                  <input
                    id="home-reading-date"
                    type="date"
                    required
                    value={readingDate}
                    onChange={(e) => setReadingDate(e.target.value)}
                    className="w-full sm:w-64 min-h-[44px] px-3.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="home-period-start" className="block text-xs font-bold text-slate-300 mb-1.5">
                      بداية الفترة *
                    </label>
                    <input
                      id="home-period-start"
                      type="date"
                      required
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="home-period-end" className="block text-xs font-bold text-slate-300 mb-1.5">
                      نهاية الفترة *
                    </label>
                    <input
                      id="home-period-end"
                      type="date"
                      required
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="home-amount" className="block text-xs font-bold text-slate-300 mb-1.5">
                  المبلغ المدفوع (اختياري)
                </label>
                <input
                  id="home-amount"
                  type="number"
                  step="any"
                  min="0"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="اتركه فارغًا إن لم يتوفر"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                />
              </div>

              <div>
                <label htmlFor="home-currency" className="block text-xs font-bold text-slate-300 mb-1.5">
                  العملة (عند إدخال مبلغ)
                </label>
                <select
                  id="home-currency"
                  value={currencyOption}
                  onChange={(e) => setCurrencyOption(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <option value="">غير محددة</option>
                  <option value="ج.م">جنيه مصري (ج.م)</option>
                  <option value="USD">دولار أمريكي</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="home-note" className="block text-xs font-bold text-slate-300 mb-1.5">
                ملاحظة شخصية (اختياري — مثل: تم إصلاح تسريب، تم تغيير جهاز)
              </label>
              <textarea
                id="home-note"
                rows={2}
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder="ملاحظاتك الخاصة حول هذه القراءة أو الفاتورة..."
                className="w-full p-3.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              />
            </div>

            {/* Optional Bill / Meter Photo */}
            <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-amber-200 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">إرفاق صورة فاتورة أو عداد (اختياري):</p>
                  <p className="text-slate-300 mt-0.5">
                    تُحفظ الصورة داخل جهازك فقط ولا تُرسل لأي جهة. يُنصح بإخفاء أو عدم تصوير رقم الحساب
                    أو الرقم القومي أو البيانات الحساسة غير الضرورية.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-white cursor-pointer">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>{attachment ? 'تغيير الصورة' : 'اختر صورة (JPG / PNG / WebP)'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>

                {attachment && (
                  <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-white/10 text-xs">
                    <span className="truncate max-w-[180px] text-slate-200">{attachment.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachment(undefined)}
                      className="text-rose-400 hover:text-rose-300 font-bold"
                    >
                      إزالة
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Non-blocking Warnings */}
            {liveWarnings.length > 0 && (
              <div
                role="alert"
                className="bg-amber-500/10 border border-amber-500/35 rounded-2xl p-4 space-y-1.5 text-xs text-amber-200"
              >
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>تنبيهات للمراجعة (لن يتم تعديل بياناتك تلقائيًا):</span>
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {liveWarnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {formError && (
              <div role="alert" className="bg-rose-500/15 border border-rose-500/40 text-rose-200 rounded-xl p-3 text-xs font-bold">
                {formError}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <Eye className="w-4 h-4" />
                <span>معاينة السجل قبل الحفظ</span>
              </button>
            </div>
          </form>

          {/* Preview & Explicit Confirmation Step */}
          {previewOpen && (
            <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-black text-white">تأكيد معاينة السجل</h3>
              <p className="text-xs text-slate-300">
                راجع التفاصيل التالية قبل الحفظ محليًا في جهازك:
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/80 p-4 rounded-xl border border-white/10">
                <div>
                  <dt className="text-slate-400">الخدمة:</dt>
                  <dd className="font-bold text-white mt-0.5">
                    {serviceType === 'electricity' ? 'كهرباء' : 'مياه'} ({entryKind === 'reading' ? 'قراءة عداد' : 'استهلاك فترة'})
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">القيمة والوحدة:</dt>
                  <dd className="font-bold text-emerald-300 tabular-nums mt-0.5">
                    {numericValue} {effectiveUnit}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">التاريخ / الفترة:</dt>
                  <dd className="font-bold text-white tabular-nums mt-0.5">
                    {dateMode === 'billing_period' ? `${periodStart} → ${periodEnd}` : readingDate}
                  </dd>
                </div>
                {numericAmount !== undefined && (
                  <div>
                    <dt className="text-slate-400">المبلغ المسجل:</dt>
                    <dd className="font-bold text-white tabular-nums mt-0.5">
                      {numericAmount} {currencyOption || ''}
                    </dd>
                  </div>
                )}
                {personalNote.trim() && (
                  <div className="sm:col-span-2">
                    <dt className="text-slate-400">ملاحظة:</dt>
                    <dd className="text-slate-200 mt-0.5">{personalNote.trim()}</dd>
                  </div>
                )}
                {attachment && (
                  <div className="sm:col-span-2">
                    <dt className="text-slate-400">مرفق محفوظ محليًا:</dt>
                    <dd className="text-slate-200 mt-0.5">{attachment.name}</dd>
                  </div>
                )}
              </dl>

              <div className="flex flex-wrap gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200"
                >
                  تعديل البيانات
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد وحفظ في ملف بيتي</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Consumption Trend Section (Only when real compatible records >= 2 exist) */}
      <section className="bg-slate-950/90 border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white">متابعة استهلاكك المسجل عبر الفترات</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تعرض المقارنة فقط عند وجود سجلين على الأقل بنفس النوع ونفس وحدة القياس.
            </p>
          </div>
          <div className="flex gap-2">
            {(['electricity', 'water'] as UtilityServiceType[]).map((svc) => (
              <button
                key={svc}
                type="button"
                onClick={() => setTrendService(svc)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold border transition ${
                  trendService === svc
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {svc === 'electricity' ? 'الكهرباء' : 'المياه'}
              </button>
            ))}
          </div>
        </div>

        {!trend.canCompare ? (
          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 flex items-start gap-3 text-sm text-slate-300">
            <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <p>{trend.reasonAr}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 border border-white/10 rounded-2xl p-4 text-sm">
              <div>
                <span className="text-slate-400 text-xs block">الوحدة الموحدة للعرض</span>
                <span className="font-black text-white">{trend.unit}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">أحدث قيمة مسجلة في هذه الفترة</span>
                <span className="font-black text-emerald-300 tabular-nums">
                  {trend.series[trend.series.length - 1].value} {trend.unit}
                </span>
              </div>
              {trend.latestDelta !== undefined && (
                <div>
                  <span className="text-slate-400 text-xs block">الفرق عن الفترة السابقة المسجلة</span>
                  <span className="font-black text-white tabular-nums">
                    {trend.latestDelta > 0 ? `+${trend.latestDelta}` : trend.latestDelta} {trend.unit}
                  </span>
                </div>
              )}
            </div>

            <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend.series} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name={`الاستهلاك المسجل (${trend.unit})`}
                    fill={trendService === 'electricity' ? '#f59e0b' : '#38bdf8'}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Optional Clearly Labeled CO2 Estimate Helper */}
        {optionalCo2Records.length > 0 && (
          <div className="border-t border-white/10 pt-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowCo2Estimator((v) => !v)}
              className="min-h-[44px] inline-flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-emerald-200"
            >
              <BookOpen className="w-4 h-4" />
              <span>
                {showCo2Estimator
                  ? 'إخفاء تقدير الأثر الكربوني الاختياري'
                  : 'عرض تقدير اختياري للأثر الكربوني (تقدير مبني على معاملات منشورة)'}
              </span>
            </button>

            {showCo2Estimator && (
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-amber-300">
                    تقدير حسابي فقط (لا يمثل قياسًا رسميًا ولا يشير إلى توفير متحقق)
                  </span>
                  <Link
                    to="/methodology"
                    className="underline text-emerald-300 hover:text-emerald-200 font-bold"
                  >
                    صفحة المنهجية
                  </Link>
                </div>
                <div className="space-y-2">
                  {optionalCo2Records.map(({ record, estimatedKgCo2, factorMeta }) => (
                    <div
                      key={record.id}
                      className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/70 p-3 rounded-xl border border-white/5"
                    >
                      <div>
                        <span className="font-bold text-white">
                          {record.serviceType === 'electricity' ? 'كهرباء' : 'مياه'}:{' '}
                          <span className="tabular-nums">
                            {record.value} {record.unit}
                          </span>{' '}
                          (
                          {record.dateMode === 'billing_period'
                            ? `${record.periodStart} → ${record.periodEnd}`
                            : record.readingDate}
                          )
                        </span>
                        <p className="text-slate-400 mt-0.5">
                          المعادلة: {factorMeta.formulaAr} | المصدر: {factorMeta.sourceAr} (تحديث {factorMeta.lastUpdate})
                        </p>
                      </div>
                      <span className="font-black text-emerald-300 tabular-nums">
                        ≈ {estimatedKgCo2} kg CO₂e (تقدير)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Records List & Export / Delete All */}
      <section className="bg-slate-950/90 border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-white">سجلات ملف بيتي</h2>
            <span className="text-xs font-bold text-slate-400 tabular-nums">
              ({filteredRecords.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="تصفية حسب الخدمة"
              value={filterService}
              onChange={(e) => setFilterService(e.target.value as any)}
              className="min-h-[44px] px-3 rounded-xl bg-slate-900 border border-white/15 text-xs text-white"
            >
              <option value="all">كل الخدمات</option>
              <option value="electricity">الكهرباء فقط</option>
              <option value="water">المياه فقط</option>
            </select>

            {records.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => exportUtilityRecordsAsExcel(records)}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>تصدير Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportUtilityRecordsAsJson(records)}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white"
                >
                  <FileJson className="w-4 h-4 text-sky-400" />
                  <span>تصدير JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(true)}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold text-rose-300"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف كل بياناتي</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Confirm Clear All Banner */}
        {confirmClearAll && (
          <div className="bg-rose-500/15 border border-rose-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold text-rose-200">
              هل تريد حذف جميع القراءات والفواتير والصور المرفقة في «ملف بيتي» نهائيًا من هذا الجهاز؟
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
                onClick={handleClearAll}
                className="min-h-[44px] px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white"
              >
                نعم، احذف الكل
              </button>
            </div>
          </div>
        )}

        {/* Helpful Empty State — ZERO fake or sample records */}
        {filteredRecords.length === 0 ? (
          <div className="bg-slate-900/60 border border-dashed border-white/15 rounded-2xl p-8 text-center space-y-3">
            <p className="text-base font-black text-white">
              لا توجد قراءات مسجلة في «ملف بيتي» حتى الآن
            </p>
            <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
              لا يعرض MoEco أي أرقام أو فواتير افتراضية. لإضافة أول سجل حقيقي خاص بمنزلك،
              اضغط «إضافة قراءة أو فاتورة» وأدخل الرقم والوحدة (مثل kWh للكهرباء أو m³ للمياه)
              وتاريخ القراءة كما يظهران في فاتورتك أو عدادك.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400"
              >
                <Plus className="w-4 h-4" />
                <span>سجّل أول قراءة الآن</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((r) => (
              <article
                key={r.id}
                className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-black text-white">
                      {r.serviceType === 'electricity' ? (
                        <Zap className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Droplets className="w-4 h-4 text-sky-400" />
                      )}
                      {r.serviceType === 'electricity' ? 'كهرباء' : 'مياه'}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-bold text-slate-300">
                      {r.entryKind === 'reading' ? 'قراءة عداد' : 'استهلاك فترة'}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-sm font-black text-emerald-300 tabular-nums">
                      {r.value} {r.unit}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>
                      التاريخ / الفترة:{' '}
                      <strong className="text-slate-200 tabular-nums">
                        {r.dateMode === 'billing_period'
                          ? `${r.periodStart} → ${r.periodEnd}`
                          : r.readingDate}
                      </strong>
                    </span>
                    {r.amountPaid !== undefined && (
                      <span>
                        المبلغ المدفوع:{' '}
                        <strong className="text-slate-200 tabular-nums">
                          {r.amountPaid} {r.currency || ''}
                        </strong>
                      </span>
                    )}
                  </div>

                  {r.personalNote && (
                    <p className="text-xs text-slate-300 bg-slate-950/60 px-3 py-2 rounded-xl border border-white/5">
                      ملاحظة: {r.personalNote}
                    </p>
                  )}

                  {r.attachment && (
                    <div className="pt-1 flex flex-wrap items-center gap-3">
                      <img
                        src={r.attachment.dataUrl}
                        alt={`مرفق ${r.attachment.name}`}
                        className="w-16 h-16 object-cover rounded-xl border border-white/15"
                      />
                      <div className="space-y-1 text-xs">
                        <p className="text-slate-300">{r.attachment.name}</p>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(r.id)}
                          className="text-rose-400 hover:text-rose-300 font-bold underline"
                        >
                          حذف المرفق فقط
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(r)}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white"
                  >
                    <Edit3 className="w-4 h-4 text-sky-400" />
                    <span>تعديل</span>
                  </button>

                  {confirmDeleteId === r.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(r.id)}
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
                      onClick={() => setConfirmDeleteId(r.id)}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-300"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyHomeProfile;
