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
      setLoadError(err?.message || (isRtl ? 'تعذر تحميل القراءات من الخادم.' : 'Could not load readings from the server.'));
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
      setFormError(err?.message || (isRtl ? 'تعذر التحقق من الملف.' : 'Could not verify the file.'));
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
      openConsentModal(isRtl ? 'حفظ قراءة في ملف بيتي' : 'Saving a reading in My Home');
      return;
    }

    if (!valueInput.trim() || isNaN(numericValue) || numericValue <= 0) {
      setFormError((isRtl ? 'يُرجى إدخال رقم صحيح أكبر من صفر كما يظهر في الفاتورة أو العداد.' : 'Please enter a valid number greater than zero as shown on the bill or meter.'));
      return;
    }
    if (!effectiveUnit) {
      setFormError((isRtl ? 'يُرجى اختيار أو كتابة وحدة القياس الظاهرة في المصدر (لا يتم افتراض وحدة تلقائيًا).' : 'Please select or type the measurement unit shown on the source (no unit is assumed).'));
      return;
    }
    if (dateMode === 'single_date' && !readingDate) {
      setFormError((isRtl ? 'يُرجى تحديد تاريخ القراءة.' : 'Please set the reading date.'));
      return;
    }
    if (dateMode === 'billing_period' && (!periodStart || !periodEnd)) {
      setFormError((isRtl ? 'يُرجى تحديد تاريخ بداية ونهاية فترة الفاتورة.' : 'Please set the billing period start and end dates.'));
      return;
    }
    if (numericAmount !== undefined && (isNaN(numericAmount) || numericAmount < 0)) {
      setFormError((isRtl ? 'المبلغ المدفوع يجب أن يكون رقمًا صحيحًا صفرًا أو أكبر.' : 'The paid amount must be a valid number, zero or greater.'));
      return;
    }

    setPreviewOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!hasCoreConsent || !userId) {
      openConsentModal(isRtl ? 'حفظ قراءة في ملف بيتي' : 'Saving a reading in My Home');
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
        setStatusMessage((isRtl ? 'تم تحديث السجل وحفظه في قاعدة البيانات.' : 'Record updated and saved to the database.'));
      } else {
        await supabaseDataService.createHouseholdReading(userId, payload);
        setStatusMessage((isRtl ? 'تم حفظ السجل في قاعدة البيانات بنجاح.' : 'Record saved to the database successfully.'));
      }

      if (analyticsEnabled) {
        trackUsageEvent('reading_saved', { feature: 'my_home', status: serviceType });
      }

      await reloadRecords();
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      setFormError(err?.message || (isRtl ? 'تعذر حفظ السجل في الخادم.' : 'Could not save the record to the server.'));
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
      setStatusMessage((isRtl ? 'تم حذف السجل نهائيًا من قاعدة البيانات.' : 'Record permanently deleted from the database.'));
    } catch (err: any) {
      setLoadError(err?.message || (isRtl ? 'تعذر حذف السجل.' : 'Could not delete the record.'));
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!userId) return;
    try {
      await supabaseDataService.updateHouseholdReading(userId, id, { attachment: undefined });
      await reloadRecords();
      setStatusMessage((isRtl ? 'تم حذف المرجع المرفق مع الإبقاء على بيانات السجل.' : 'Attached reference removed; record data kept.'));
    } catch (err: any) {
      setLoadError(err?.message || (isRtl ? 'تعذر تحديث السجل.' : 'Could not update the record.'));
    }
  };

  const handleClearAll = async () => {
    if (!userId) return;
    try {
      await supabaseDataService.deleteAllHouseholdReadings(userId);
      setConfirmClearAll(false);
      await reloadRecords();
      setStatusMessage((isRtl ? 'تم حذف جميع سجلات «ملف بيتي» من قاعدة البيانات.' : 'All My Home records deleted from the database.'));
    } catch (err: any) {
      setLoadError(err?.message || (isRtl ? 'تعذر حذف السجلات.' : 'Could not delete the records.'));
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
              <span>{isRtl ? 'سجلات محفوظة في الخادم بجلستك فقط' : 'Records saved on the server, tied to your session only'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              {isRtl ? 'ملف بيتي (المياه والكهرباء)' : 'My Home (Water & Electricity)'}
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              {isRtl
                ? 'سجّل قراءات العداد أو استهلاك الفواتير لمتابعة استهلاك منزلك عبر الفترات. هذا القسم لا يتصل بحسابات شركات المياه أو الكهرباء ولا يغني عن بواباتها الرسمية.'
                : 'Log meter readings or bill consumption to track your home usage over time. This section does not connect to utility company accounts and does not replace their official portals.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!hasCoreConsent) {
                openConsentModal(isRtl ? 'إضافة قراءة في ملف بيتي' : 'Adding a reading in My Home');
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
            <span>{showForm && !editingId ? (isRtl ? 'إغلاق النموذج' : 'Close form') : (isRtl ? 'إضافة قراءة أو فاتورة' : 'Add reading or bill')}</span>
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-slate-900">{isRtl ? 'خصوصية سجلاتك:' : 'Your records privacy:'}</p>
            <p>
              {isRtl
                ? 'تُحفظ السجلات التي تضيفها في قاعدة بيانات MoEco على الخادم بمعرّف جلستك فقط وتُحمى بسياسات خصوصية صارمة، ولا تُنشر للعامة. لا يُطلب رقم الحساب أو الرقم القومي.'
                : 'Records you add are saved in the MoEco database on the server under your session ID only, protected by strict privacy policies, and never published. No account number or national ID is requested.'}
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
                    <span>{isRtl ? `بوابات ${info.nameAr} الرسمية` : (svc === 'electricity' ? 'Official electricity portals' : 'Official water portals')}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 tabular-nums">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    {isRtl ? info.hotline.label : (svc === 'electricity' ? 'Electricity emergency' : 'Water emergency')}: {info.hotline.number}
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
                          <span>{isRtl ? p.label : (p.labelEn || p.label)}</span>
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

      {!hasCoreConsent && <ConsentRequiredNotice featureTitle={isRtl ? "ملف بيتي (الكهرباء والمياه)" : "My Home (Electricity & Water)"} />}

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
            aria-label={isRtl ? 'إغلاق الرسالة' : 'Close message'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-emerald-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {hasCoreConsent && showForm && (
        <section
          aria-label={editingId ? (isRtl ? 'تعديل سجل في ملف بيتي' : 'Edit a My Home record') : (isRtl ? 'إضافة سجل جديد في ملف بيتي' : 'Add a new My Home record')}
          className="bg-white border border-emerald-200 rounded-2xl p-5 md:p-6 space-y-5 shadow-xs"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              {editingId ? (isRtl ? 'تعديل سجل مسجل' : 'Edit saved record') : (isRtl ? 'إضافة قراءة عداد أو فاتورة جديدة' : 'Add a new meter reading or bill')}
            </h2>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="min-h-[44px] px-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
          </div>

          <form onSubmit={handleOpenPreview} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="home-service" className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRtl ? 'نوع الخدمة *' : 'Service type *'}
                </label>
                <select
                  id="home-service"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as UtilityServiceType)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
                >
                  <option value="electricity">{isRtl ? 'كهرباء' : 'Electricity'}</option>
                  <option value="water">{isRtl ? 'مياه' : 'Water'}</option>
                </select>
              </div>

              <div>
                <label htmlFor="home-entry-kind" className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRtl ? 'طبيعة القيمة المدخلة *' : 'Nature of entered value *'}
                </label>
                <select
                  id="home-entry-kind"
                  value={entryKind}
                  onChange={(e) => setEntryKind(e.target.value as UtilityEntryKind)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
                >
                  <option value="consumption">{isRtl ? 'كمية استهلاك الفاتورة' : 'Bill consumption amount'}</option>
                  <option value="reading">{isRtl ? 'قراءة العداد' : 'Meter reading'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="home-value" className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRtl ? 'القيمة الرقمية (كما تظهر في المصدر) *' : 'Numeric value (as shown on the source) *'}
                </label>
                <input
                  id="home-value"
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  placeholder={isRtl ? 'أدخل الرقم بدقة من العداد أو الفاتورة' : 'Enter the number exactly from the meter or bill'}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="home-unit" className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRtl ? 'الوحدة (كما تظهر في الفاتورة أو العداد) *' : 'Unit (as shown on the bill or meter) *'}
                </label>
                <select
                  id="home-unit"
                  value={unitOption}
                  onChange={(e) => setUnitOption(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
                >
                  <option value="">{isRtl ? 'اختر الوحدة من المصدر (بدون افتراض)' : 'Select the unit from the source (no assumption)'}</option>
                  <option value="kWh">{isRtl ? 'كيلوواط ساعة (kWh)' : 'Kilowatt-hour (kWh)'}</option>
                  <option value="m³">{isRtl ? 'متر مكعب (m³)' : 'Cubic meter (m³)'}</option>
                  <option value="لتر">{isRtl ? 'لتر' : 'Liter'}</option>
                  <option value="other">{isRtl ? 'وحدة أخرى (أكتبها يدويًا)' : 'Other unit (type it manually)'}</option>
                </select>
                {unitOption === 'other' && (
                  <input
                    type="text"
                    aria-label={isRtl ? 'وحدة القياس المخصصة' : 'Custom measurement unit'}
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder={isRtl ? 'اكتب اسم الوحدة كما ورد في الفاتورة' : 'Type the unit name as written on the bill'}
                    className="mt-2 w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
                  />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="home-date-mode" className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRtl ? 'تاريخ القراءة أو فترة الفاتورة *' : 'Reading date or billing period *'}
                </label>
                <select
                  id="home-date-mode"
                  value={dateMode}
                  onChange={(e) => setDateMode(e.target.value as UtilityDateMode)}
                  className="w-full sm:w-64 min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
                >
                  <option value="single_date">{isRtl ? 'تاريخ محدد للقراءة' : 'Specific reading date'}</option>
                  <option value="billing_period">{isRtl ? 'فترة فاتورة (من — إلى)' : 'Billing period (from - to)'}</option>
                </select>
              </div>

              {dateMode === 'single_date' ? (
                <div>
                  <label htmlFor="home-reading-date" className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRtl ? 'تاريخ القراءة *' : 'Reading date *'}
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
                      {isRtl ? 'بداية الفترة *' : 'Period start *'}
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
                      {isRtl ? 'نهاية الفترة *' : 'Period end *'}
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
                  {isRtl ? 'المبلغ المدفوع (اختياري)' : 'Paid amount (optional)'}
                </label>
                <input
                  id="home-amount"
                  type="number"
                  step="any"
                  min="0"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder={isRtl ? 'اتركه فارغًا إن لم يتوفر' : 'Leave empty if unavailable'}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="home-currency" className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isRtl ? 'العملة (عند إدخال مبلغ)' : 'Currency (when entering an amount)'}
                </label>
                <select
                  id="home-currency"
                  value={currencyOption}
                  onChange={(e) => setCurrencyOption(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
                >
                  <option value="">{isRtl ? 'غير محددة' : 'Unspecified'}</option>
                  <option value="ج.م">{isRtl ? 'جنيه مصري (ج.م)' : 'Egyptian pound (EGP)'}</option>
                  <option value="USD">{isRtl ? 'دولار أمريكي' : 'US Dollar'}</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="home-note" className="block text-xs font-bold text-slate-700 mb-1.5">
                {isRtl ? 'ملاحظة شخصية (اختياري)' : 'Personal note (optional)'}
              </label>
              <textarea
                id="home-note"
                rows={2}
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder={isRtl ? 'ملاحظاتك الخاصة حول هذه القراءة أو الفاتورة...' : 'Your private notes about this reading or bill...'}
                className="w-full p-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">{isRtl ? 'توثيق اسم مرجع الفاتورة (اختياري):' : 'Document a bill reference name (optional):'}</p>
                  <p className="text-slate-600 mt-0.5">
                    {isRtl
                      ? 'حمايةً لخصوصيتك ولحدود الخطة المجانية، لا يتم رفع صور الفواتير تلقائيًا إلى السحابة؛ يُحفظ فقط اسم الملف المرجعي إن رغبت. لا ترفع صورًا تحتوي أرقام حساب أو رقم قومي.'
                      : 'To protect your privacy and stay within the free plan, bill photos are not uploaded to the cloud; only the reference file name is saved if you wish. Do not upload images containing account numbers or a national ID.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800 cursor-pointer">
                  <ImageIcon className="w-4 h-4 text-emerald-700" />
                  <span>{attachment ? (isRtl ? 'تغيير اسم المرجع' : 'Change reference name') : (isRtl ? 'اختر صورة مرجعية (الاسم فقط)' : 'Choose a reference image (name only)')}</span>
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
                      {isRtl ? 'إزالة' : 'Remove'}
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
                  <span>{isRtl ? 'تنبيهات للمراجعة (لن يتم تعديل بياناتك تلقائيًا):' : 'Review warnings (your data will not be modified automatically):'}</span>
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
                <span>{isRtl ? 'معاينة السجل قبل الحفظ' : 'Preview record before saving'}</span>
              </button>
            </div>
          </form>

          {previewOpen && (
            <div className="bg-emerald-50/50 border border-emerald-300 rounded-xl p-5 space-y-4">
              <h3 className="text-base font-bold text-slate-900">{isRtl ? 'تأكيد معاينة السجل' : 'Confirm record preview'}</h3>
              <p className="text-xs text-slate-600">
                {isRtl ? 'راجع التفاصيل التالية قبل الحفظ في قاعدة البيانات:' : 'Review the following details before saving to the database:'}
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <dt className="text-slate-500">{isRtl ? 'الخدمة:' : 'Service:'}</dt>
                  <dd className="font-bold text-slate-900 mt-0.5">
                    {serviceType === 'electricity' ? (isRtl ? 'كهرباء' : 'Electricity') : (isRtl ? 'مياه' : 'Water')} ({entryKind === 'reading' ? (isRtl ? 'قراءة عداد' : 'Meter reading') : (isRtl ? 'استهلاك فترة' : 'Period consumption')})
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">{isRtl ? 'القيمة والوحدة:' : 'Value & unit:'}</dt>
                  <dd className="font-bold text-emerald-700 tabular-nums mt-0.5">
                    <span className="num-ltr">{numericValue} {effectiveUnit}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">{isRtl ? 'التاريخ / الفترة:' : 'Date / period:'}</dt>
                  <dd className="font-bold text-slate-900 tabular-nums mt-0.5">
                    {dateMode === 'billing_period' ? `${periodStart} → ${periodEnd}` : readingDate}
                  </dd>
                </div>
                {numericAmount !== undefined && (
                  <div>
                    <dt className="text-slate-500">{isRtl ? 'المبلغ المسجل:' : 'Recorded amount:'}</dt>
                    <dd className="font-bold text-slate-900 tabular-nums mt-0.5">
                      {numericAmount} {currencyOption || ''}
                    </dd>
                  </div>
                )}
                {personalNote.trim() && (
                  <div className="sm:col-span-2">
                    <dt className="text-slate-500">{isRtl ? 'ملاحظة:' : 'Note:'}</dt>
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
                  {isRtl ? 'تعديل البيانات' : 'Edit data'}
                </button>
                <button
                  type="button"
                  disabled={savingRecord}
                  onClick={handleConfirmSave}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs"
                >
                  {savingRecord ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{isRtl ? 'تأكيد وحفظ في الخادم' : 'Confirm and save to server'}</span>
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
                <h2 className="text-lg font-bold text-slate-900">{isRtl ? 'متابعة استهلاكك المسجل عبر الفترات' : 'Track your recorded consumption over time'}</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {isRtl ? 'تعرض المقارنة فقط عند وجود سجلين على الأقل بنفس النوع ونفس وحدة القياس.' : 'The comparison appears only with at least two records of the same type and unit.'}
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
                    {svc === 'electricity' ? (isRtl ? 'الكهرباء' : 'Electricity') : (isRtl ? 'المياه' : 'Water')}
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
                    <span className="text-slate-500 text-xs block">{isRtl ? 'الوحدة الموحدة للعرض' : 'Unified display unit'}</span>
                    <span className="font-bold text-slate-900">{trend.unit}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">{isRtl ? 'أحدث قيمة مسجلة' : 'Latest recorded value'}</span>
                    <span className="font-bold text-emerald-700 tabular-nums">
                      <span className="num-ltr">{trend.series[trend.series.length - 1].value} {trend.unit}</span>
                    </span>
                  </div>
                  {trend.latestDelta !== undefined && (
                    <div>
                      <span className="text-slate-500 text-xs block">{isRtl ? 'الفرق عن الفترة السابقة' : 'Change from previous period'}</span>
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
                        name={isRtl ? `الاستهلاك المسجل (${trend.unit})` : `Recorded consumption (${trend.unit})`}
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
                      ? (isRtl ? 'إخفاء تقدير الأثر الكربوني الاختياري' : 'Hide optional carbon impact estimate')
                      : (isRtl ? 'عرض تقدير اختياري للأثر الكربوني (تقدير مبني على معاملات منشورة)' : 'Show optional carbon impact estimate (based on published factors)')}
                  </span>
                </button>

                {showCo2Estimator && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-amber-800">
                        {isRtl ? 'تقدير حسابي فقط (لا يمثل قياسًا رسميًا ولا يشير إلى توفير متحقق)' : 'Computational estimate only (not an official measurement and does not indicate realized savings)'}
                      </span>
                      <Link to="/methodology" className="underline text-emerald-700 font-bold">
                        {isRtl ? 'صفحة المنهجية' : 'Methodology page'}
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
                              {record.serviceType === 'electricity' ? (isRtl ? 'كهرباء' : 'Electricity') : (isRtl ? 'مياه' : 'Water')}:{' '}
                              <span className="num-ltr">{record.value} {record.unit}</span>
                            </span>
                            <p className="text-slate-600 mt-0.5">
                              {isRtl ? `المعادلة: ${factorMeta.formulaAr} | المصدر: ${factorMeta.sourceAr}` : `Formula: consumption × ${factorMeta.value} kg CO2e (estimate) | Source: ${factorMeta.sourceUrl}`}
                            </p>
                          </div>
                          <span className="font-bold text-emerald-700 num-ltr">
                            ≈ {estimatedKgCo2} kg CO₂e {isRtl ? '(تقدير)' : '(estimate)'}
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
                <h2 className="text-lg font-bold text-slate-900">{isRtl ? 'سجلات ملف بيتي' : 'My Home records'}</h2>
                <span className="text-xs font-bold text-slate-500 tabular-nums">
                  ({filteredRecords.length})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label={isRtl ? 'تصفية حسب الخدمة' : 'Filter by service'}
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value as any)}
                  className="min-h-[44px] px-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
                >
                  <option value="all">{isRtl ? 'كل الخدمات' : 'All services'}</option>
                  <option value="electricity">{isRtl ? 'الكهرباء فقط' : 'Electricity only'}</option>
                  <option value="water">{isRtl ? 'المياه فقط' : 'Water only'}</option>
                </select>

                {records.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => exportUtilityRecordsAsExcel(records)}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                      <span>{isRtl ? 'تصدير Excel' : 'Export Excel'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => exportUtilityRecordsAsJson(records)}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800"
                    >
                      <FileJson className="w-4 h-4 text-sky-700" />
                      <span>{isRtl ? 'تصدير JSON' : 'Export JSON'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(true)}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{isRtl ? 'حذف كل بياناتي' : 'Delete all my data'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {confirmClearAll && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-bold text-rose-900">
                  {isRtl ? 'هل تريد حذف جميع القراءات والفواتير في «ملف بيتي» نهائيًا من قاعدة البيانات؟' : 'Do you want to permanently delete all readings and bills in My Home from the database?'}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="min-h-[44px] px-4 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="min-h-[44px] px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-xs font-bold text-white"
                  >
                    {isRtl ? 'نعم، احذف الكل' : 'Yes, delete all'}
                  </button>
                </div>
              </div>
            )}

            {loadingRecords ? (
              <div className="py-10 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                <span>{isRtl ? 'جاري تحميل سجلاتك من الخادم...' : 'Loading your records from the server...'}</span>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3">
                <p className="text-base font-bold text-slate-900">
                  {isRtl ? 'لا توجد قراءات مسجلة في «ملف بيتي» حتى الآن' : 'No readings recorded in My Home yet'}
                </p>
                <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                  {isRtl
                    ? 'لا يعرض MoEco أي أرقام أو فواتير افتراضية. لإضافة أول سجل حقيقي خاص بمنزلك، اضغط «إضافة قراءة أو فاتورة».'
                    : 'MoEco never shows placeholder numbers or bills. To add your first real home record, press "Add reading or bill".'}
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
                    <span>{isRtl ? 'سجّل أول قراءة الآن' : 'Log your first reading now'}</span>
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
                          {r.serviceType === 'electricity' ? (isRtl ? 'كهرباء' : 'Electricity') : (isRtl ? 'مياه' : 'Water')}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {r.entryKind === 'reading' ? (isRtl ? 'قراءة عداد' : 'Meter reading') : (isRtl ? 'استهلاك فترة' : 'Period consumption')}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-sm font-extrabold text-emerald-700 tabular-nums">
                          <span className="num-ltr">{r.value} {r.unit}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span>
                          {isRtl ? 'التاريخ / الفترة:' : 'Date / period:'}{' '}
                          <strong className="text-slate-900 tabular-nums">
                            {r.dateMode === 'billing_period'
                              ? `${r.periodStart} → ${r.periodEnd}`
                              : r.readingDate}
                          </strong>
                        </span>
                        {r.amountPaid !== undefined && (
                          <span>
                            {isRtl ? 'المبلغ المدفوع:' : 'Paid amount:'}{' '}
                            <strong className="text-slate-900 tabular-nums">
                              {r.amountPaid} {r.currency || ''}
                            </strong>
                          </span>
                        )}
                      </div>

                      {r.personalNote && (
                        <p className="text-xs text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200">
                          {isRtl ? 'ملاحظة' : 'Note'}: {r.personalNote}
                        </p>
                      )}

                      {r.attachment && (
                        <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                          <p className="text-slate-700 font-medium">{isRtl ? 'مرجع مرفق' : 'Attached reference'}: {r.attachment.name}</p>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(r.id)}
                            className="text-rose-700 hover:text-rose-800 font-bold underline"
                          >
                            {isRtl ? 'إزالة المرجع' : 'Remove reference'}
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
                        <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                      </button>

                      {confirmDeleteId === r.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(r.id)}
                            className="min-h-[44px] px-3 py-2 rounded-xl bg-rose-700 text-xs font-bold text-white"
                          >
                            {isRtl ? 'تأكيد الحذف' : 'Confirm deletion'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700"
                          >
                            {isRtl ? 'تراجع' : 'Undo'}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(r.id)}
                          className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-xs font-bold text-rose-700"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{isRtl ? 'حذف' : 'Delete'}</span>
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
