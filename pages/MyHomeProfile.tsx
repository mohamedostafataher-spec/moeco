import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Zap,
  Droplets,
  Plus,
  Edit3,
  Trash2,
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
  Loader2,
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
import { ConsentRequiredNotice } from '../components/ConsentGateModal';
import {
  HomeUtilityRecord,
  UtilityServiceType,
  UtilityEntryKind,
  UtilityDateMode,
  LocalAttachment,
  VERIFIED_UTILITY_PORTALS,
  checkUtilityWarnings,
  analyzeUtilityTrend,
  validateAndReadAttachment,
  exportUtilityRecordsAsExcel,
  exportUtilityRecordsAsJson,
  isSafeExternalUrl,
} from '../services/personalCivicService';
import { supabaseDataService } from '../services/supabaseDataService';

const MyHomeProfile: React.FC = () => {
  const { isRtl } = useApp();
  const {
    isConfigured,
    authUser,
    hasCoreConsent,
    analyticsEnabled,
    openConsentModal,
    trackUsageEvent,
  } = usePrivacyConsent();

  const [searchParams] = useSearchParams();
  const userId = authUser?.id || '';

  const [records, setRecords] = useState<HomeUtilityRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [filterService, setFilterService] = useState<'all' | UtilityServiceType>('all');
  const [trendService, setTrendService] = useState<UtilityServiceType>('electricity');

  // Form state
  const [showForm, setShowForm] = useState(() => searchParams.get('new') === '1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<UtilityServiceType>('electricity');
  const [entryKind, setEntryKind] = useState<UtilityEntryKind>('consumption');
  const [valueInput, setValueInput] = useState('');
  const [unitOption, setUnitOption] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [dateMode, setDateMode] = useState<UtilityDateMode>('single_date');
  const [readingDate, setReadingDate] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [currencyOption, setCurrencyOption] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [attachment, setAttachment] = useState<LocalAttachment | undefined>(undefined);

  // Preview, feedback & confirmations
  const [formError, setFormError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showCo2Estimator, setShowCo2Estimator] = useState(false);

  const reloadRecords = useCallback(async () => {
    if (!isConfigured || !userId || !hasCoreConsent) {
      setRecords([]);
      return;
    }
    setLoadingRecords(true);
    setLoadError(null);
    try {
      const list = await supabaseDataService.listHouseholdReadings(userId);
      setRecords(list);
    } catch (err: any) {
      setLoadError(err?.message || 'تعذر تحميل القراءات من Supabase.');
    } finally {
      setLoadingRecords(false);
    }
  }, [isConfigured, userId, hasCoreConsent]);

  useEffect(() => {
    reloadRecords();
  }, [reloadRecords]);

  useEffect(() => {
    if (analyticsEnabled) {
      trackUsageEvent('feature_opened', { feature: 'my_home' });
    }
  }, [analyticsEnabled, trackUsageEvent]);

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
      // Strip raw binary/dataUrl so large bill photos are NOT uploaded automatically to DB/Storage
      setAttachment({ ...parsed, dataUrl: '' });
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

    if (!hasCoreConsent || !userId) {
      openConsentModal('حفظ قراءة في ملف بيتي');
      return;
    }

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

  const handleConfirmSave = async () => {
    if (!hasCoreConsent || !userId) {
      openConsentModal('حفظ قراءة في ملف بيتي');
      return;
    }

    setFormError(null);
    setSavingRecord(true);
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
        await supabaseDataService.updateHouseholdReading(userId, editingId, payload);
        setStatusMessage('تم تحديث السجل وحفظه في قاعدة بيانات Supabase.');
      } else {
        await supabaseDataService.createHouseholdReading(userId, payload);
        setStatusMessage('تم حفظ السجل في قاعدة بيانات Supabase بنجاح.');
      }

      if (analyticsEnabled) {
        trackUsageEvent('reading_saved', { feature: 'my_home', status: serviceType });
      }

      await reloadRecords();
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      setFormError(err?.message || 'تعذر حفظ السجل في Supabase.');
      setPreviewOpen(false);
    } finally {
      setSavingRecord(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!userId) return;
    try {
      await supabaseDataService.deleteHouseholdReading(userId, id);
      if (analyticsEnabled) {
        trackUsageEvent('reading_deleted', { feature: 'my_home' });
      }
      setConfirmDeleteId(null);
      await reloadRecords();
      setStatusMessage('تم حذف السجل نهائيًا من قاعدة بيانات Supabase.');
    } catch (err: any) {
      setLoadError(err?.message || 'تعذر حذف السجل.');
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!userId) return;
    try {
      await supabaseDataService.updateHouseholdReading(userId, id, { attachment: undefined });
      await reloadRecords();
      setStatusMessage('تم حذف المرجع المرفق مع الإبقاء على بيانات السجل.');
    } catch (err: any) {
      setLoadError(err?.message || 'تعذر تحديث السجل.');
    }
  };

  const handleClearAll = async () => {
    if (!userId) return;
    try {
      await supabaseDataService.deleteAllHouseholdReadings(userId);
      setConfirmClearAll(false);
      await reloadRecords();
      setStatusMessage('تم حذف جميع سجلات «ملف بيتي» من قاعدة بيانات Supabase.');
    } catch (err: any) {
      setLoadError(err?.message || 'تعذر حذف السجلات.');
    }
  };

  const filteredRecords = useMemo(() => {
    if (filterService === 'all') return records;
    return records.filter((r) => r.serviceType === filterService);
  }, [records, filterService]);

  const trend = useMemo(
    () => analyzeUtilityTrend(records, trendService),
    [records, trendService],
  );

  const optionalCo2Records = useMemo(() => {
    return records
      .map((r) => {
        if (r.entryKind !== 'consumption') return null;
        const factorMeta = VERIFIED_UTILITY_PORTALS[r.serviceType].co2Factor;
        if (!factorMeta || r.unit !== factorMeta.unitRequired) return null;
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
      className="max-w-4xl mx-auto pb-10 space-y-6 text-slate-900"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <header className="bg-white border border-slate-200 rounded-2xl p-5 md:p-7 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700">
              <Zap className="w-4 h-4" />
              <span>سجلات محفوظة في Supabase بجلستك فقط</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              ملف بيتي (المياه والكهرباء)
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              سجّل قراءات العداد أو استهلاك الفواتير لمتابعة استهلاك منزلك عبر الفترات. هذا القسم
              لا يتصل بحسابات شركات المياه أو الكهرباء ولا يغني عن بواباتها الرسمية.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!hasCoreConsent) {
                openConsentModal('إضافة قراءة في ملف بيتي');
                return;
              }
              if (showForm && !editingId) {
                setShowForm(false);
              } else {
                resetForm();
                setShowForm(true);
              }
            }}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm && !editingId ? 'إغلاق النموذج' : 'إضافة قراءة أو فاتورة'}</span>
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-slate-900">خصوصية سجلاتك:</p>
            <p>
              تُحفظ السجلات التي تضيفها في قاعدة بيانات MoEco على Supabase بمعرّف جلستك فقط وتُحمى
              بسياسات RLS، ولا تُنشر للعامة. لا يُطلب رقم الحساب أو الرقم القومي.
            </p>
          </div>
        </div>

        {/* Verified Official Portals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {(['electricity', 'water'] as UtilityServiceType[]).map((svc) => {
            const info = VERIFIED_UTILITY_PORTALS[svc];
            return (
              <div
                key={svc}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    {svc === 'electricity' ? (
                      <Zap className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Droplets className="w-4 h-4 text-sky-700" />
                    )}
                    <span>بوابات {info.nameAr} الرسمية</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 tabular-nums">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
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
                          className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-emerald-700 transition-colors"
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

      {!hasCoreConsent && <ConsentRequiredNotice featureTitle="ملف بيتي (الكهرباء والمياه)" />}

      {loadError && (
        <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {statusMessage && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 flex items-center justify-between gap-3 text-sm"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            aria-label="إغلاق الرسالة"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-emerald-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {hasCoreConsent && showForm && (
        <section
          aria-label={editingId ? 'تعديل سجل في ملف بيتي' : 'إضافة سجل جديد في ملف بيتي'}
          className="bg-white border border-emerald-200 rounded-2xl p-5 md:p-6 space-y-5 shadow-xs"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              {editingId ? 'تعديل سجل مسجل' : 'إضافة قراءة عداد أو فاتورة جديدة'}
            </h2>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="min-h-[44px] px-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              إلغاء
            </button>
          </div>

          <form onSubmit={handleOpenPreview} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="home-service" className="block text-xs font-bold text-slate-700 mb-1.5">
                  نوع الخدمة *
                </label>
                <select
                  id="home-service"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as UtilityServiceType)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
                >
                  <option value="electricity">كهرباء</option>
                  <option value="water">مياه</option>
                </select>
              </div>

              <div>
                <label htmlFor="home-entry-kind" className="block text-xs font-bold text-slate-700 mb-1.5">
                  طبيعة القيمة المدخلة *
                </label>
                <select
                  id="home-entry-kind"
                  value={entryKind}
                  onChange={(e) => setEntryKind(e.target.value as UtilityEntryKind)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
                >
                  <option value="consumption">كمية استهلاك الفاتورة</option>
                  <option value="reading">قراءة العداد</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="home-value" className="block text-xs font-bold text-slate-700 mb-1.5">
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
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="home-unit" className="block text-xs font-bold text-slate-700 mb-1.5">
                  الوحدة (كما تظهر في الفاتورة أو العداد) *
                </label>
                <select
                  id="home-unit"
                  value={unitOption}
                  onChange={(e) => setUnitOption(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
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
                    className="mt-2 w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
                  />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="home-date-mode" className="block text-xs font-bold text-slate-700 mb-1.5">
                  تاريخ القراءة أو فترة الفاتورة *
                </label>
                <select
                  id="home-date-mode"
                  value={dateMode}
                  onChange={(e) => setDateMode(e.target.value as UtilityDateMode)}
                  className="w-full sm:w-64 min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
                >
                  <option value="single_date">تاريخ محدد للقراءة</option>
                  <option value="billing_period">فترة فاتورة (من — إلى)</option>
                </select>
              </div>

              {dateMode === 'single_date' ? (
                <div>
                  <label htmlFor="home-reading-date" className="block text-xs font-bold text-slate-700 mb-1.5">
                    تاريخ القراءة *
                  </label>
                  <input
                    id="home-reading-date"
                    type="date"
                    required
                    value={readingDate}
                    onChange={(e) => setReadingDate(e.target.value)}
                    className="w-full sm:w-64 min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="home-period-start" className="block text-xs font-bold text-slate-700 mb-1.5">
                      بداية الفترة *
                    </label>
                    <input
                      id="home-period-start"
                      type="date"
                      required
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="home-period-end" className="block text-xs font-bold text-slate-700 mb-1.5">
                      نهاية الفترة *
                    </label>
                    <input
                      id="home-period-end"
                      type="date"
                      required
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="home-amount" className="block text-xs font-bold text-slate-700 mb-1.5">
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
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="home-currency" className="block text-xs font-bold text-slate-700 mb-1.5">
                  العملة (عند إدخال مبلغ)
                </label>
                <select
                  id="home-currency"
                  value={currencyOption}
                  onChange={(e) => setCurrencyOption(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
                >
                  <option value="">غير محددة</option>
                  <option value="ج.م">جنيه مصري (ج.م)</option>
                  <option value="USD">دولار أمريكي</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="home-note" className="block text-xs font-bold text-slate-700 mb-1.5">
                ملاحظة شخصية (اختياري)
              </label>
              <textarea
                id="home-note"
                rows={2}
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder="ملاحظاتك الخاصة حول هذه القراءة أو الفاتورة..."
                className="w-full p-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">توثيق اسم مرجع الفاتورة (اختياري):</p>
                  <p className="text-slate-600 mt-0.5">
                    حمايةً لخصوصيتك ولحدود الخطة المجانية، لا يتم رفع صور الفواتير تلقائيًا إلى السحابة؛
                    يُحفظ فقط اسم الملف المرجعي إن رغبت. لا ترفع صورًا تحتوي أرقام حساب أو رقم قومي.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800 cursor-pointer">
                  <ImageIcon className="w-4 h-4 text-emerald-700" />
                  <span>{attachment ? 'تغيير اسم المرجع' : 'اختر صورة مرجعية (الاسم فقط)'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>

                {attachment && (
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs">
                    <span className="truncate max-w-[180px] text-slate-800">{attachment.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachment(undefined)}
                      className="text-rose-700 hover:text-rose-800 font-bold"
                    >
                      إزالة
                    </button>
                  </div>
                )}
              </div>
            </div>

            {liveWarnings.length > 0 && (
              <div
                role="alert"
                className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5 text-xs text-amber-900"
              >
                <div className="flex items-center gap-2 font-bold text-amber-900">
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
              <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs font-bold">
                {formError}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>معاينة السجل قبل الحفظ</span>
              </button>
            </div>
          </form>

          {previewOpen && (
            <div className="bg-emerald-50/50 border border-emerald-300 rounded-xl p-5 space-y-4">
              <h3 className="text-base font-bold text-slate-900">تأكيد معاينة السجل</h3>
              <p className="text-xs text-slate-600">
                راجع التفاصيل التالية قبل الحفظ في قاعدة بيانات Supabase:
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <dt className="text-slate-500">الخدمة:</dt>
                  <dd className="font-bold text-slate-900 mt-0.5">
                    {serviceType === 'electricity' ? 'كهرباء' : 'مياه'} ({entryKind === 'reading' ? 'قراءة عداد' : 'استهلاك فترة'})
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">القيمة والوحدة:</dt>
                  <dd className="font-bold text-emerald-700 tabular-nums mt-0.5">
                    <span className="num-ltr">{numericValue} {effectiveUnit}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">التاريخ / الفترة:</dt>
                  <dd className="font-bold text-slate-900 tabular-nums mt-0.5">
                    {dateMode === 'billing_period' ? `${periodStart} → ${periodEnd}` : readingDate}
                  </dd>
                </div>
                {numericAmount !== undefined && (
                  <div>
                    <dt className="text-slate-500">المبلغ المسجل:</dt>
                    <dd className="font-bold text-slate-900 tabular-nums mt-0.5">
                      {numericAmount} {currencyOption || ''}
                    </dd>
                  </div>
                )}
                {personalNote.trim() && (
                  <div className="sm:col-span-2">
                    <dt className="text-slate-500">ملاحظة:</dt>
                    <dd className="text-slate-800 mt-0.5">{personalNote.trim()}</dd>
                  </div>
                )}
              </dl>

              <div className="flex flex-wrap gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700"
                >
                  تعديل البيانات
                </button>
                <button
                  type="button"
                  disabled={savingRecord}
                  onClick={handleConfirmSave}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs"
                >
                  {savingRecord ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>تأكيد وحفظ في Supabase</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {hasCoreConsent && (
        <>
          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">متابعة استهلاكك المسجل عبر الفترات</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  تعرض المقارنة فقط عند وجود سجلين على الأقل بنفس النوع ونفس وحدة القياس.
                </p>
              </div>
              <div className="flex gap-2">
                {(['electricity', 'water'] as UtilityServiceType[]).map((svc) => (
                  <button
                    key={svc}
                    type="button"
                    onClick={() => setTrendService(svc)}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      trendService === svc
                        ? 'bg-emerald-700 border-emerald-700 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {svc === 'electricity' ? 'الكهرباء' : 'المياه'}
                  </button>
                ))}
              </div>
            </div>

            {!trend.canCompare ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-3 text-sm text-slate-700">
                <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                <p>{trend.reasonAr}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs block">الوحدة الموحدة للعرض</span>
                    <span className="font-bold text-slate-900">{trend.unit}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">أحدث قيمة مسجلة</span>
                    <span className="font-bold text-emerald-700 tabular-nums">
                      <span className="num-ltr">{trend.series[trend.series.length - 1].value} {trend.unit}</span>
                    </span>
                  </div>
                  {trend.latestDelta !== undefined && (
                    <div>
                      <span className="text-slate-500 text-xs block">الفرق عن الفترة السابقة</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        <span className="num-ltr">{trend.latestDelta > 0 ? `+${trend.latestDelta}` : trend.latestDelta} {trend.unit}</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="h-64 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend.series} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" stroke="#475569" fontSize={11} />
                      <YAxis stroke="#475569" fontSize={11} />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        name={`الاستهلاك المسجل (${trend.unit})`}
                        fill={trendService === 'electricity' ? '#b45309' : '#0369a1'}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {optionalCo2Records.length > 0 && (
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowCo2Estimator((v) => !v)}
                  className="min-h-[44px] inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>
                    {showCo2Estimator
                      ? 'إخفاء تقدير الأثر الكربوني الاختياري'
                      : 'عرض تقدير اختياري للأثر الكربوني (تقدير مبني على معاملات منشورة)'}
                  </span>
                </button>

                {showCo2Estimator && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-amber-800">
                        تقدير حسابي فقط (لا يمثل قياسًا رسميًا ولا يشير إلى توفير متحقق)
                      </span>
                      <Link to="/methodology" className="underline text-emerald-700 font-bold">
                        صفحة المنهجية
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {optionalCo2Records.map(({ record, estimatedKgCo2, factorMeta }) => (
                        <div
                          key={record.id}
                          className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200"
                        >
                          <div>
                            <span className="font-bold text-slate-900">
                              {record.serviceType === 'electricity' ? 'كهرباء' : 'مياه'}:{' '}
                              <span className="num-ltr">{record.value} {record.unit}</span>
                            </span>
                            <p className="text-slate-600 mt-0.5">
                              المعادلة: {factorMeta.formulaAr} | المصدر: {factorMeta.sourceAr}
                            </p>
                          </div>
                          <span className="font-bold text-emerald-700 num-ltr">
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

          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">سجلات ملف بيتي</h2>
                <span className="text-xs font-bold text-slate-500 tabular-nums">
                  ({filteredRecords.length})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="تصفية حسب الخدمة"
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value as any)}
                  className="min-h-[44px] px-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
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
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                      <span>تصدير Excel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => exportUtilityRecordsAsJson(records)}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800"
                    >
                      <FileJson className="w-4 h-4 text-sky-700" />
                      <span>تصدير JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(true)}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف كل بياناتي</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {confirmClearAll && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-bold text-rose-900">
                  هل تريد حذف جميع القراءات والفواتير في «ملف بيتي» نهائيًا من قاعدة بيانات Supabase؟
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="min-h-[44px] px-4 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="min-h-[44px] px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-xs font-bold text-white"
                  >
                    نعم، احذف الكل
                  </button>
                </div>
              </div>
            )}

            {loadingRecords ? (
              <div className="py-10 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                <span>جاري تحميل سجلاتك من Supabase...</span>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3">
                <p className="text-base font-bold text-slate-900">
                  لا توجد قراءات مسجلة في «ملف بيتي» حتى الآن
                </p>
                <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                  لا يعرض MoEco أي أرقام أو فواتير افتراضية. لإضافة أول سجل حقيقي خاص بمنزلك،
                  اضغط «إضافة قراءة أو فاتورة».
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowForm(true);
                    }}
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800"
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
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
                          {r.serviceType === 'electricity' ? (
                            <Zap className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Droplets className="w-4 h-4 text-sky-700" />
                          )}
                          {r.serviceType === 'electricity' ? 'كهرباء' : 'مياه'}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {r.entryKind === 'reading' ? 'قراءة عداد' : 'استهلاك فترة'}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-sm font-extrabold text-emerald-700 tabular-nums">
                          <span className="num-ltr">{r.value} {r.unit}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span>
                          التاريخ / الفترة:{' '}
                          <strong className="text-slate-900 tabular-nums">
                            {r.dateMode === 'billing_period'
                              ? `${r.periodStart} → ${r.periodEnd}`
                              : r.readingDate}
                          </strong>
                        </span>
                        {r.amountPaid !== undefined && (
                          <span>
                            المبلغ المدفوع:{' '}
                            <strong className="text-slate-900 tabular-nums">
                              {r.amountPaid} {r.currency || ''}
                            </strong>
                          </span>
                        )}
                      </div>

                      {r.personalNote && (
                        <p className="text-xs text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200">
                          ملاحظة: {r.personalNote}
                        </p>
                      )}

                      {r.attachment && (
                        <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                          <p className="text-slate-700 font-medium">مرجع مرفق: {r.attachment.name}</p>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(r.id)}
                            className="text-rose-700 hover:text-rose-800 font-bold underline"
                          >
                            إزالة المرجع
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800"
                      >
                        <Edit3 className="w-4 h-4 text-sky-700" />
                        <span>تعديل</span>
                      </button>

                      {confirmDeleteId === r.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(r.id)}
                            className="min-h-[44px] px-3 py-2 rounded-xl bg-rose-700 text-xs font-bold text-white"
                          >
                            تأكيد الحذف
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700"
                          >
                            تراجع
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(r.id)}
                          className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-xs font-bold text-rose-700"
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
        </>
      )}
    </div>
  );
};

export default MyHomeProfile;
