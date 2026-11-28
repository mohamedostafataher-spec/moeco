import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  MapPin,
  AlertTriangle,
  Trash2,
  Droplets,
  Flame,
  Sun,
  Lightbulb,
  HelpCircle,
  Plus,
  Clock,
  ShieldCheck,
  Info,
  EyeOff,
  CheckCircle2,
  Map as MapIcon,
  FileEdit,
  Send,
  BarChart3,
  Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import {
  civicActionService,
  CivicReport,
  ReportCategory,
  ReportStatus,
  REPORT_CATEGORY_META,
  REPORT_STATUS_META,
} from '../services/civicActionService';

const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'القليوبية',
  'الدقهلية',
  'الشرقية',
  'الغربية',
  'أسوان',
  'الأقصر',
  'بورسعيد',
  'السويس',
  'الإسماعيلية',
  'أسيوط',
  'المنيا',
];

const CATEGORY_ICONS: Record<ReportCategory, React.FC<{ className?: string }>> = {
  water_leak: Droplets,
  waste_pile: Trash2,
  waste_burning: Flame,
  daytime_lighting: Lightbulb,
  heat_no_shade: Sun,
  other: HelpCircle,
};

const EGYPT_GOVERNORATES_EN: Record<string, string> = {
  'القاهرة': 'Cairo',
  'الجيزة': 'Giza',
  'الإسكندرية': 'Alexandria',
  'القليوبية': 'Qalyubia',
  'الدقهلية': 'Dakahlia',
  'الشرقية': 'Sharqia',
  'الغربية': 'Gharbia',
  'أسوان': 'Aswan',
  'الأقصر': 'Luxor',
  'بورسعيد': 'Port Said',
  'السويس': 'Suez',
  'الإسماعيلية': 'Ismailia',
  'أسيوط': 'Asyut',
  'المنيا': 'Minya',
};

const EcoWatch: React.FC = () => {
  const { user, isRtl } = useApp();
  const ar = isRtl;
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'submit' | 'my_reports' | 'public_map'>('submit');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ReportCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');

  // Form states
  const [category, setCategory] = useState<ReportCategory>('water_leak');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');
  const [area, setArea] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [shareLocationConsent, setShareLocationConsent] = useState(false);
  const [lat, setLat] = useState<number>(30.0444);
  const [lng, setLng] = useState<number>(31.2357);
  const [sharePhotoConsent, setSharePhotoConsent] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [nearbyWarning, setNearbyWarning] = useState<CivicReport | null>(null);
  const [distinctIssueConfirmed, setDistinctIssueConfirmed] = useState(false);
  const [submitSuccessId, setSubmitSuccessId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await civicActionService.getAllReports();
      setReports(data);
    } catch (e) {
      console.error('Error loading reports:', e);
      notificationService.error(ar ? 'تعذر تحميل قائمة البلاغات' : 'Could not load the reports list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGetCurrentLocation = () => {
    if (!shareLocationConsent) {
      setShareLocationConsent(true);
    }
    if (!('geolocation' in navigator)) {
      notificationService.error(ar ? 'المتصفح لا يدعم تحديد الموقع الجغرافي' : 'This browser does not support geolocation');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        notificationService.success(ar ? 'تم التقاط الإحداثيات (ستُعرض كنطاق عام فقط للخصوصية)' : 'Coordinates captured (shown as a general zone only, for privacy)');
      },
      () => {
        notificationService.error(ar ? 'تعذر الوصول للموقع الجغرافي. يمكنك تحديد المنطقة نصياً.' : 'Could not access your location. You can enter the area as text.');
      }
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError(ar ? 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' : 'Image size must be under 5 MB');
      return;
    }
    setIsUploading(true);
    setFormError('');
    try {
      const uploaded = await storageService.uploadImage(file, 'environmental-reports');
      setPhotoUrl(uploaded);
      setSharePhotoConsent(true);
      notificationService.success(ar ? 'تم إرفاق الصورة بنجاح' : 'Photo attached successfully');
    } catch {
      // Safe local preview fallback for demo/offline mode without breaking user flow
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotoUrl(reader.result);
          setSharePhotoConsent(true);
          notificationService.info(ar ? 'تم حفظ معاينة الصورة محلياً ضمن البلاغ التجريبي' : 'Photo preview saved locally within the demo report');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const LocationPicker = () => {
    useMapEvents({
      click(e) {
        if (shareLocationConsent) {
          setLat(e.latlng.lat);
          setLng(e.latlng.lng);
        }
      },
    });
    return shareLocationConsent ? <Marker position={[lat, lng]} /> : null;
  };

  const handleSubmit = async (asDraft: boolean) => {
    setFormError('');
    setSubmitSuccessId(null);

    if (!area.trim() || area.trim().length < 2) {
      setFormError(ar ? 'يرجى إدخال اسم المنطقة أو الحي (مثال: المعادي، الدقي).' : 'Please enter the area or neighborhood name (e.g. Maadi, Dokki).');
      return;
    }
    if (!description.trim() || description.trim().length < 8) {
      setFormError(ar ? 'يرجى كتابة وصف مختصر واضح للمشكلة (8 أحرف على الأقل).' : 'Please write a short, clear description of the issue (at least 8 characters).');
      return;
    }

    if (!asDraft && !distinctIssueConfirmed) {
      const similar = await civicActionService.findNearbySimilarReport(
        category,
        area,
        shareLocationConsent ? lat : undefined,
        shareLocationConsent ? lng : undefined
      );
      if (similar) {
        setNearbyWarning(similar);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const computedTitle =
        title.trim() || `${REPORT_CATEGORY_META[category].labelAr} - ${area.trim()}`;
      const created = await civicActionService.submitReport({
        userId: user?.id || 'guest-user-2026',
        userName: user?.name || (ar ? 'مشارك' : 'Participant'),
        category,
        title: computedTitle,
        description,
        area,
        governorate,
        shareLocationConsent,
        latitude: shareLocationConsent ? lat : undefined,
        longitude: shareLocationConsent ? lng : undefined,
        sharePhotoConsent,
        photoUrl: sharePhotoConsent ? photoUrl : undefined,
        isAnonymous,
        asDraft,
        distinctIssueConfirmed,
      });

      setSubmitSuccessId(created.id);
      setTitle('');
      setDescription('');
      setArea('');
      setPhotoUrl('');
      setNearbyWarning(null);
      setDistinctIssueConfirmed(false);
      await loadReports();

      notificationService.success(
        asDraft
          ? (ar ? 'تم حفظ البلاغ كمسودة محلية' : 'Report saved as a local draft')
          : (ar ? 'تم حفظ البلاغ تجريبياً بحالة «تم الاستلام»' : 'Report saved (demo) with status: Received')
      );
      setActiveTab('my_reports');
    } catch (e: any) {
      setFormError(e?.message || (ar ? 'حدث خطأ أثناء حفظ البلاغ' : 'An error occurred while saving the report'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishDraft = async (id: string) => {
    await civicActionService.publishDraftReport(id);
    await loadReports();
    notificationService.success(ar ? 'تم إرسال المسودة وحفظها بحالة «تم الاستلام»' : 'Draft submitted and saved with status: Received');
  };

  const handleAnonymize = async (id: string) => {
    await civicActionService.anonymizeReport(id);
    await loadReports();
    notificationService.success(ar ? 'تم إخفاء البيانات الشخصية والصورة والموقع الدقيق لهذا البلاغ' : 'Personal data, photo, and precise location hidden for this report');
  };

  const handleDelete = async (id: string) => {
    await civicActionService.deleteReport(id);
    await loadReports();
    notificationService.info(ar ? 'تم حذف البلاغ من سجلك المحلي' : 'Report deleted from your local record');
  };

  const currentUserId = user?.id || 'guest-user-2026';
  const myReports = reports.filter((r) => r.userId === currentUserId);
  const publicReports = reports.filter((r) => {
    if (r.status === 'draft') return false;
    const catOk = categoryFilter === 'all' || r.category === categoryFilter;
    const statusOk = statusFilter === 'all' || r.status === statusFilter;
    return catOk && statusOk;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 pb-32 pt-4 space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 md:p-10 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs font-bold text-emerald-400">
              {ar ? 'المشاركة المجتمعية المحلية · نسخة تجريبية داخل التطبيق' : 'Local community participation · in-app demo version'}
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
              {ar ? 'بلاغ بيئي' : 'Eco Watch'}
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
              {ar
                ? 'سجّل مشكلة بيئية في منطقتك وتابع حالتها خطوة بخطوة. يتم حماية خصوصيتك بعدم عرض موقعك الدقيق أو بياناتك الشخصية للعامة.'
                : 'Report an environmental issue in your area and track its status step by step. Your privacy is protected: your precise location and personal data are never shown publicly.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/local-monitor"
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/10 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>{ar ? 'لوحة المتابعة المحلية' : 'Local monitoring dashboard'}</span>
            </Link>
          </div>
        </div>

        {/* Clear Experimental / No-Government-Claim Banner */}
        <div
          role="note"
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-start gap-3 text-amber-100"
        >
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm leading-relaxed space-y-1">
            <p className="font-bold text-amber-300">
              {ar ? 'تنبيه الشفافية: البلاغات في هذه النسخة تجريبية' : 'Transparency note: reports in this version are demo'}
            </p>
            <p>
              {ar
                ? 'يُحفظ البلاغ داخل التطبيق لأغراض العرض والتوثيق المجتمعي، ولا يُرسل تلقائياً إلى الحي أو جهة حكومية رسمية إلا عند ربط شريك محلي مخوّل.'
                : 'Reports are saved inside the app for display and community documentation, and are not sent automatically to any district or official government body unless an authorized local partner is connected.'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label={ar ? 'أقسام البلاغات البيئية' : 'Environmental report sections'}
          className="flex flex-wrap gap-2 bg-slate-950/60 p-2 rounded-2xl border border-white/10"
        >
          {[
            { id: 'submit', label: ar ? 'تقديم بلاغ جديد' : 'Submit a report', icon: Plus },
            { id: 'my_reports', label: ar ? `بلاغاتي (${myReports.length})` : `My reports (${myReports.length})`, icon: Clock },
            { id: 'public_map', label: ar ? `البلاغات العامة والخريطة (${publicReports.length})` : `Public reports & map (${publicReports.length})`, icon: MapIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-lg'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* TAB 1: SUBMIT REPORT */}
      {activeTab === 'submit' && (
        <section
          aria-label={ar ? 'نموذج تقديم بلاغ بيئي' : 'Environmental report form'}
          className="bg-slate-900/80 border border-white/10 rounded-[2rem] p-6 md:p-10 space-y-8 shadow-xl"
        >
          <div className="space-y-3">
            <label className="block text-sm font-bold text-white">
              {ar ? '1. نوع المشكلة البيئية' : '1. Environmental issue type'} <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.keys(REPORT_CATEGORY_META) as ReportCategory[]).map((catKey) => {
                const meta = REPORT_CATEGORY_META[catKey];
                const Icon = CATEGORY_ICONS[catKey];
                const selected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => {
                      setCategory(catKey);
                      setNearbyWarning(null);
                      setDistinctIssueConfirmed(false);
                    }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border text-right transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      selected
                        ? 'bg-emerald-500/15 border-emerald-400 text-white'
                        : 'bg-slate-950/60 border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold leading-snug">{ar ? meta.labelAr : meta.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="report-gov" className="block text-sm font-bold text-white">
                {ar ? '2. المحافظة' : '2. Governorate'} <span className="text-rose-400">*</span>
              </label>
              <select
                id="report-gov"
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-3.5 text-white font-medium focus:border-emerald-400 focus:outline-none"
              >
                {EGYPT_GOVERNORATES.map((g) => (
                  <option key={g} value={g}>
                    {ar ? g : (EGYPT_GOVERNORATES_EN[g] || g)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="report-area" className="block text-sm font-bold text-white">
                {ar ? '3. المنطقة أو العنوان التقريبي' : '3. Area or approximate address'} <span className="text-rose-400">*</span>
              </label>
              <input
                id="report-area"
                type="text"
                value={area}
                onChange={(e) => {
                  setArea(e.target.value);
                  setNearbyWarning(null);
                }}
                placeholder={ar ? 'مثال: المعادي - قرب محطة مترو المعادي' : 'e.g. Maadi - near Maadi metro station'}
                className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-3.5 text-white font-medium focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="report-title" className="block text-sm font-bold text-white">
              {ar ? 'عنوان مختصر (اختياري)' : 'Short title (optional)'}
            </label>
            <input
              id="report-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={ar ? 'مثال: تسريب مياه في ماسورة فرعية بالرصيف' : 'e.g. Water leak in a sidewalk branch pipe'}
              className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-3.5 text-white font-medium focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="report-desc" className="block text-sm font-bold text-white">
              {ar ? '4. وصف مختصر للمشكلة' : '4. Short description of the issue'} <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="report-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={ar ? 'صف المشكلة بوضوح (المدة التقريبية، تأثيرها على المارة أو السكان... دون ذكر بيانات شخصية).' : 'Describe the issue clearly (approximate duration, impact on passersby or residents... no personal data).'}
              className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-3.5 text-white font-medium focus:border-emerald-400 focus:outline-none resize-y"
            />
          </div>

          {/* Optional Location & Photo with Explicit Consent */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-white/10">
            {/* Location Consent */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareLocationConsent}
                    onChange={(e) => setShareLocationConsent(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-emerald-500 rounded"
                  />
                  <div>
                    <span className="block text-sm font-bold text-white">
                      {ar ? 'مشاركة الموقع الجغرافي (اختياري وبموافقتك)' : 'Share my location (optional, with your consent)'}
                    </span>
                    <span className="block text-xs text-slate-400 mt-0.5">
                      {ar
                        ? 'لن يُعرض موقعك الدقيق للعامة؛ يظهر النطاق العام فقط (~1 كم) لحماية الخصوصية.'
                        : 'Your precise location is never shown publicly; only the general zone (~1 km) appears, to protect privacy.'}
                    </span>
                  </div>
                </label>
              </div>

              {shareLocationConsent && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="w-full py-3 px-4 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-400/30 font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>{ar ? 'تحديد موقعي الحالي أو الضغط على الخريطة' : 'Use my current location or tap the map'}</span>
                  </button>
                  <div className="h-44 rounded-2xl overflow-hidden border border-white/10">
                    <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                      <LocationPicker />
                    </MapContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Photo Consent */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sharePhotoConsent}
                  onChange={(e) => {
                    setSharePhotoConsent(e.target.checked);
                    if (!e.target.checked) setPhotoUrl('');
                  }}
                  className="mt-1 w-5 h-5 accent-emerald-500 rounded"
                />
                <div>
                  <span className="block text-sm font-bold text-white">
                    {ar ? 'إرفاق صورة توضيحية (اختياري وبموافقتك)' : 'Attach an illustrative photo (optional, with your consent)'}
                  </span>
                  <span className="block text-xs text-slate-400 mt-0.5">
                    {ar
                      ? 'تجنّب تصوير وجوه الأشخاص أو لوحات السيارات أو أي معلومات شخصية.'
                      : 'Avoid photographing faces, license plates, or any personal information.'}
                  </span>
                </div>
              </label>

              {sharePhotoConsent && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-emerald-400 text-slate-300 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Camera className="w-5 h-5 text-emerald-400" />
                    <span>{isUploading ? (ar ? 'جاري التحميل...' : 'Uploading...') : photoUrl ? (ar ? 'تغيير الصورة المرفقة' : 'Change attached photo') : (ar ? 'اختر صورة من جهازك' : 'Choose a photo from your device')}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {photoUrl && (
                    <div className="relative rounded-xl overflow-hidden border border-white/10 max-h-40">
                      <img src={photoUrl} alt={ar ? 'معاينة الصورة المرفقة' : 'Attached photo preview'} className="w-full h-40 object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-1 w-5 h-5 accent-emerald-500 rounded"
              />
              <div>
                <span className="flex items-center gap-2 text-sm font-bold text-white">
                  <EyeOff className="w-4 h-4 text-emerald-400" />
                  <span>{ar ? 'إخفاء اسمي عن العرض العام (موصى به)' : 'Hide my name from public view (recommended)'}</span>
                </span>
                <span className="block text-xs text-slate-400 mt-0.5">
                  {ar
                    ? 'عند التفعيل، يظهر البلاغ للعامة باسم «مستخدم مجهول» ولا تظهر هويتك.'
                    : 'When enabled, the report appears publicly as Anonymous user and your identity stays hidden.'}
                </span>
              </div>
            </label>
          </div>

          {/* Nearby Similar Report Warning (Non-blocking for distinct issues) */}
          {nearbyWarning && (
            <div
              role="alert"
              className="p-5 rounded-2xl bg-amber-500/15 border border-amber-400/40 space-y-3"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-amber-200">
                    {ar ? 'يوجد بلاغ مفتوح مشابه قريب من نفس المنطقة' : 'A similar open report exists near this area'}
                  </p>
                  <p className="text-slate-200">
                    «{nearbyWarning.title}» — {ar ? 'الحالة' : 'Status'}: {ar ? REPORT_STATUS_META[nearbyWarning.status].labelAr : REPORT_STATUS_META[nearbyWarning.status].labelEn}
                  </p>
                  <p className="text-xs text-slate-300">
                    {ar
                      ? 'لتقليل التكرار، يمكنك متابعة البلاغ القائم أو تأكيد أن بلاغك يخص مشكلة مختلفة وإرساله بشكل طبيعي.'
                      : 'To reduce duplicates, you can follow the existing report, or confirm yours is a different issue and submit normally.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('public_map')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                >
                  {ar ? 'عرض البلاغات القريبة' : 'View nearby reports'}
                </button>
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 cursor-pointer text-xs font-bold text-amber-100">
                  <input
                    type="checkbox"
                    checked={distinctIssueConfirmed}
                    onChange={(e) => setDistinctIssueConfirmed(e.target.checked)}
                    className="w-4 h-4 accent-amber-400"
                  />
                  <span>{ar ? 'أؤكد أنها مشكلة مختلفة عن البلاغ القائم' : 'I confirm this is a different issue from the existing report'}</span>
                </label>
              </div>
            </div>
          )}

          {formError && (
            <div role="alert" className="p-4 rounded-2xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-sm font-bold">
              {formError}
            </div>
          )}

          {/* Pre-submit Notice + Action Buttons */}
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {ar
                  ? 'قبل الإرسال: يُحفظ هذا البلاغ في التطبيق كـ «نموذج تجريبي» ولا يُرسل تلقائياً لأي جهة حكومية ما لم يتوفر ربط شريك فعلي.'
                  : 'Before submitting: this report is saved in the app as a demo record and is not sent automatically to any government body unless a real partner integration exists.'}
              </span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(true)}
                className="sm:w-56 py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 border border-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <FileEdit className="w-4 h-4" />
                <span>{ar ? 'حفظ كمسودة' : 'Save as draft'}</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(false)}
                className="flex-1 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? (ar ? 'جاري الحفظ...' : 'Saving...') : (ar ? 'إرسال البلاغ التجريبي' : 'Submit demo report')}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: MY REPORTS */}
      {activeTab === 'my_reports' && (
        <section aria-label={ar ? 'قائمة بلاغاتي' : 'My reports list'} className="space-y-6">
          {submitSuccessId && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{ar ? 'تم حفظ البلاغ في قائمتك بنجاح. يمكنك متابعته أو إخفاء بياناته أو حذفه في أي وقت.' : 'Report saved to your list. You can track it, hide its data, or delete it at any time.'}</span>
            </div>
          )}

          {loading ? (
            <div className="p-16 text-center text-slate-400 font-bold">{ar ? 'جاري تحميل بلاغاتك...' : 'Loading your reports...'}</div>
          ) : myReports.length === 0 ? (
            <div className="p-14 bg-slate-900/60 border border-dashed border-white/15 rounded-[2rem] text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto" />
              <h2 className="text-xl font-bold text-white">{ar ? 'لا توجد بلاغات مسجلة بعد' : 'No reports recorded yet'}</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                {ar
                  ? 'يمكنك البدء بتسجيل بلاغ بيئي تجريبي أو حفظ مسودة لمتابعتها لاحقاً.'
                  : 'You can start by submitting a demo environmental report or saving a draft to follow up later.'}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('submit')}
                className="px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-sm"
              >
                {ar ? 'تقديم أول بلاغ' : 'Submit your first report'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myReports.map((rep) => {
                const catMeta = REPORT_CATEGORY_META[rep.category];
                const statusMeta = REPORT_STATUS_META[rep.status];
                const Icon = CATEGORY_ICONS[rep.category];
                return (
                  <article
                    key={rep.id}
                    className="bg-slate-900/80 border border-white/10 rounded-[2rem] p-6 space-y-4 shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${catMeta.bg} ${catMeta.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{rep.title}</h3>
                          <p className="text-xs text-slate-400">
                            {ar ? catMeta.labelAr : catMeta.labelEn} · {ar ? rep.governorate : (EGYPT_GOVERNORATES_EN[rep.governorate] || rep.governorate)} - {rep.area} · {new Date(rep.createdAt).toLocaleDateString(ar ? 'ar-EG' : 'en-GB')}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${statusMeta.badgeClass}`}>
                          {ar ? statusMeta.labelAr : statusMeta.labelEn}
                        </span>
                        {rep.isDemo && (
                          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 text-slate-300 border border-white/10">
                            {ar ? 'نموذج تجريبي' : 'Demo record'}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">{rep.description}</p>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs text-slate-400">
                      <div className="flex flex-wrap items-center gap-4">
                        <span>{ar ? 'العرض العام' : 'Public display'}: {rep.isAnonymous ? (ar ? 'مخفي (مستخدم مجهول)' : 'Hidden (anonymous user)') : rep.reporterDisplayName}</span>
                        <span>{ar ? 'الموقع' : 'Location'}: {rep.shareLocationConsent ? (ar ? `نطاق عام (${rep.publicLat}, ${rep.publicLng})` : `General zone (${rep.publicLat}, ${rep.publicLng})`) : (ar ? 'غير مشارك' : 'Not shared')}</span>
                        <span>{ar ? 'الصورة' : 'Photo'}: {rep.photoUrl ? (ar ? 'مرفقة بموافقتك' : 'Attached with your consent') : (ar ? 'غير مرفقة' : 'Not attached')}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {rep.status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => handlePublishDraft(rep.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                          >
                            {ar ? 'إرسال المسودة الآن' : 'Submit draft now'}
                          </button>
                        )}
                        {!rep.isAnonymous || rep.photoUrl || rep.shareLocationConsent ? (
                          <button
                            type="button"
                            onClick={() => handleAnonymize(rep.id)}
                            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs"
                          >
                            {ar ? 'إخفاء البيانات الشخصية والصورة' : 'Hide personal data & photo'}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleDelete(rep.id)}
                          className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs border border-rose-500/30"
                        >
                          {ar ? 'حذف البلاغ' : 'Delete report'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: PUBLIC REPORTS & SIMPLIFIED MAP */}
      {activeTab === 'public_map' && (
        <section aria-label={ar ? 'البلاغات العامة والخريطة المبسطة' : 'Public reports & simplified map'} className="space-y-6">
          {/* Privacy notice */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-xs md:text-sm text-emerald-100 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              {ar
                ? 'حماية الخصوصية مفعّلة: لا تُعرض أسماء المبلّغين المجهولين أو أي بيانات شخصية أو إحداثيات دقيقة على الخريطة العامة (تُقرّب للنطاق العام فقط).'
                : 'Privacy protection is on: anonymous reporter names, personal data, and precise coordinates are never shown on the public map (rounded to the general zone only).'}
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center justify-between bg-slate-900/70 p-4 rounded-2xl border border-white/10">
            <div className="flex flex-wrap gap-2">
              <select
                aria-label={ar ? 'تصفية حسب نوع المشكلة' : 'Filter by issue type'}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white font-bold"
              >
                <option value="all">{ar ? 'كل أنواع المشكلات' : 'All issue types'}</option>
                {(Object.keys(REPORT_CATEGORY_META) as ReportCategory[]).map((k) => (
                  <option key={k} value={k}>
                    {ar ? REPORT_CATEGORY_META[k].labelAr : REPORT_CATEGORY_META[k].labelEn}
                  </option>
                ))}
              </select>

              <select
                aria-label={ar ? 'تصفية حسب حالة البلاغ' : 'Filter by report status'}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white font-bold"
              >
                <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
                {(Object.keys(REPORT_STATUS_META) as ReportStatus[])
                  .filter((s) => s !== 'draft')
                  .map((s) => (
                    <option key={s} value={s}>
                      {ar ? REPORT_STATUS_META[s].labelAr : REPORT_STATUS_META[s].labelEn}
                    </option>
                  ))}
              </select>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {ar ? 'النتائج المعروضة' : 'Results shown'}: {publicReports.length}
            </span>
          </div>

          {/* Simplified Map */}
          <div className="h-72 md:h-96 rounded-[2rem] overflow-hidden border border-white/10 bg-slate-900">
            <MapContainer center={[30.0444, 31.2357]} zoom={10} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              {publicReports
                .filter((r) => typeof r.publicLat === 'number' && typeof r.publicLng === 'number')
                .map((r) => (
                  <Marker key={r.id} position={[r.publicLat!, r.publicLng!]}>
                    <Popup>
                      <div className="text-right font-arabic space-y-1 p-1" dir={ar ? 'rtl' : 'ltr'}>
                        <p className="font-bold text-slate-900 text-sm">{r.title}</p>
                        <p className="text-xs text-slate-600">
                          {ar ? REPORT_CATEGORY_META[r.category].labelAr : REPORT_CATEGORY_META[r.category].labelEn} · {ar ? r.governorate : (EGYPT_GOVERNORATES_EN[r.governorate] || r.governorate)} - {r.area}
                        </p>
                        <p className="text-xs font-bold text-emerald-700">
                          {ar ? 'الحالة' : 'Status'}: {ar ? REPORT_STATUS_META[r.status].labelAr : REPORT_STATUS_META[r.status].labelEn}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>

          {/* Public Reports List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publicReports.map((rep) => {
              const catMeta = REPORT_CATEGORY_META[rep.category];
              const statusMeta = REPORT_STATUS_META[rep.status];
              const Icon = CATEGORY_ICONS[rep.category];
              return (
                <article
                  key={rep.id}
                  className="bg-slate-900/80 border border-white/10 rounded-[2rem] p-6 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${catMeta.bg} ${catMeta.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{rep.title}</h3>
                        <p className="text-xs text-slate-400">
                          {ar ? rep.governorate : (EGYPT_GOVERNORATES_EN[rep.governorate] || rep.governorate)} - {rep.area} · {new Date(rep.createdAt).toLocaleDateString(ar ? 'ar-EG' : 'en-GB')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold border shrink-0 ${statusMeta.badgeClass}`}>
                      {ar ? statusMeta.labelAr : statusMeta.labelEn}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{rep.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                    <span>
                      {ar ? 'المبلّغ' : 'Reporter'}: {rep.isAnonymous ? (ar ? 'مستخدم مجهول' : 'Anonymous user') : rep.reporterDisplayName || (ar ? 'مشارك' : 'Participant')}
                    </span>
                    <span>{rep.isDemo ? (ar ? 'بيانات تجريبية / نموذجية' : 'Demo / sample data') : (ar ? 'بلاغ مسجّل' : 'Recorded report')}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default EcoWatch;
