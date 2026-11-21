import React, { useState, useEffect } from 'react';
import {
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  Info,
  MapPin,
  EyeOff,
  Send,
  ShieldCheck,
  Wrench,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notificationService';
import {
  civicActionService,
  CivicReport,
  REPORT_STATUS_META,
} from '../services/civicActionService';

const EGYPT_GOVS = ['القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الدقهلية', 'الشرقية', 'أسوان', 'أسيوط'];

const WATER_TIPS = [
  {
    id: 'tip-1',
    title: 'فحص سيفون المرحاض بصورة دورية',
    desc: 'تسريب السيفون الصامت قد يهدر كميات كبيرة يومياً؛ ضع نقطتي ملون طعام في الخزان وتأكد من عدم نزوله للمرحاض دون سحب.',
  },
  {
    id: 'tip-2',
    title: 'تركيب مهوي (Aerator) على الحنفيات',
    desc: 'يمزج الهواء بالماء ويقلل التدفق مع الحفاظ على قوة الغسيل، وهي خطوة منخفضة التكلفة للأسر.',
  },
  {
    id: 'tip-3',
    title: 'إغلاق الصنبور أثناء التنظيف وغسل الأواني',
    desc: 'فتح الماء فقط عند الشطف بدلاً من الجريان المستمر يخفض الاستهلاك التقديري بشكل ملموس.',
  },
  {
    id: 'tip-4',
    title: 'استخدام الدلو بدلاً من الخرطوم في التنظيف',
    desc: 'غسل السيارات أو الشرفات بالخرطوم يستهلك عشرات اللترات في دقائق قليلة.',
  },
];

const WaterSaving: React.FC = () => {
  const { user } = useApp();
  const [waterReports, setWaterReports] = useState<CivicReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Leak Report Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');
  const [area, setArea] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [shareLocationConsent, setShareLocationConsent] = useState(false);
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Household Estimator (Strictly labeled «تقديري»)
  const [fixDrippingTap, setFixDrippingTap] = useState(true);
  const [installAerator, setInstallAerator] = useState(false);
  const [shorterShowerMin, setShorterShowerMin] = useState(2); // minutes cut per day
  const [householdMembers, setHouseholdMembers] = useState(3);

  const loadWaterReports = async () => {
    setLoading(true);
    try {
      const all = await civicActionService.getAllReports();
      setWaterReports(all.filter((r) => r.category === 'water_leak'));
    } catch (e) {
      console.error('Error loading water reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWaterReports();
  }, []);

  const handleGetLocation = () => {
    if (!('geolocation' in navigator)) {
      notificationService.error('المتصفح لا يدعم تحديد الموقع الجغرافي');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setShareLocationConsent(true);
        notificationService.success('تم التقاط الإحداثيات (ستُقرب للنطاق العام فقط)');
      },
      () => notificationService.warning('تعذر الحصول على الموقع؛ يمكنك الاكتفاء بكتابة المنطقة.')
    );
  };

  const handleSubmitLeak = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim() || !area.trim()) {
      setFormError('يرجى إدخال وصف مختصر للتسريب والمنطقة على الأقل.');
      return;
    }
    setSubmitting(true);
    try {
      await civicActionService.submitReport({
        userId: user?.id || 'guest-user-2026',
        userName: user?.name || 'مشارك',
        category: 'water_leak',
        title: title.trim(),
        description: description.trim() || title.trim(),
        area: area.trim(),
        governorate,
        shareLocationConsent: Boolean(shareLocationConsent && lat && lng),
        latitude: lat,
        longitude: lng,
        sharePhotoConsent: false,
        isAnonymous,
      });
      notificationService.success('تم حفظ بلاغ تسريب المياه تجريبياً في التطبيق.');
      setTitle('');
      setDescription('');
      setArea('');
      await loadWaterReports();
    } catch {
      setFormError('حدث خطأ أثناء حفظ البلاغ. حاول مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  // Transparent Estimation Math (explicitly labeled «تقديري» with assumptions):
  // - Fixing 1 slow dripping tap (~10 drips/min ≈ 15 L/day = 450 L/month)
  // - Aerator reducing faucet flow from ~12 L/min to ~7 L/min across ~4 min/person/day ≈ 20 L/person/day
  // - Shorter shower reducing flow (~9 L/min) × minutes saved × householdMembers
  const drippingLitersPerMonth = fixDrippingTap ? 15 * 30 : 0;
  const aeratorLitersPerMonth = installAerator ? 20 * householdMembers * 30 : 0;
  const showerLitersPerMonth = Math.max(0, shorterShowerMin) * 9 * householdMembers * 30;
  const totalEstimatedMonthlyLiters =
    drippingLitersPerMonth + aeratorLitersPerMonth + showerLitersPerMonth;
  const estimatedMonthlyM3 = totalEstimatedMonthlyLiters / 1000;
  // HCWW energy/water factor from Methodology.tsx: 0.298 kg CO2e / m³
  const estimatedCo2Kg = Number((estimatedMonthlyM3 * 0.298).toFixed(2));

  return (
    <div className="max-w-6xl mx-auto px-4 pb-32 space-y-6" dir="rtl">
      {/* Header */}
      <header className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">وفّر مياه منطقتك</h1>
              <p className="text-sm text-slate-300 mt-1">
                توعية عملية وإبلاغ عن تسريبات المياه ومتابعة حالتها دون مبالغة أو أرقام غير محسوبة.
              </p>
            </div>
          </div>

          <Link
            to="/methodology"
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 border border-white/10 font-bold text-xs hover:bg-slate-700 transition focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>كيف نحسب الأثر؟</span>
          </Link>
        </div>

        <div className="bg-sky-500/10 border border-sky-400/30 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <p className="text-xs md:text-sm text-sky-100 leading-relaxed">
            <strong>مبدأ الدقة:</strong> لا يمكن حساب كمية المياه المهدورة أو الموفرة من صورة تسريب أو من إغلاق البلاغ وحده؛ لذا نفصل تماماً بين «حالة بلاغ التسريب» وبين «حاسبة التوفير المنزلي التقديري».
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Water Leak Report Form */}
        <section className="lg:col-span-6 bg-slate-900/75 border border-white/10 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-sky-400" />
              إبلاغ عن تسريب مياه
            </h2>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-400/30">
              نموذج تجريبي
            </span>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-xs font-bold">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmitLeak} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="water-title" className="block text-xs font-bold text-slate-300">
                وصف التسريب وموضعه *
              </label>
              <input
                id="water-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تسريب من ماسورة رصيف أو صنبور مكسور"
                className="w-full min-h-[44px] bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="water-gov" className="block text-xs font-bold text-slate-300">
                  المحافظة
                </label>
                <select
                  id="water-gov"
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
                >
                  {EGYPT_GOVS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="water-area" className="block text-xs font-bold text-slate-300">
                  المنطقة أو الحي *
                </label>
                <input
                  id="water-area"
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="مثال: المعادي / حي الجامعة"
                  className="w-full min-h-[44px] bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="water-desc" className="block text-xs font-bold text-slate-300">
                تفاصيل إضافية (اختياري)
              </label>
              <textarea
                id="water-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="هل التسريب مستمر أم متقطع؟ هل يعوق المارة؟"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGetLocation}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs font-bold text-slate-200 hover:bg-slate-700 transition focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
              >
                <MapPin className="w-4 h-4 text-sky-400" />
                <span>{shareLocationConsent ? 'تمت إضافة الموقع التقريبي' : 'مشاركة الموقع (اختياري وبموافقتك)'}</span>
              </button>

              <label className="min-h-[44px] inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-bold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4"
                />
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>إخفاء اسمي عن العرض العام</span>
              </label>
            </div>

            <div className="bg-amber-500/10 border border-amber-400/30 rounded-xl p-3 text-xs text-amber-100 leading-relaxed">
              تنبيه: يُحفظ البلاغ في التطبيق فقط ولا يُرسل حالياً لشركة المياه أو الحي؛ للإبلاغ الرسمي الطارئ يُرجى الاتصال بالخط الساخن <strong>125</strong>.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[44px] bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm rounded-xl py-3 flex items-center justify-center gap-2 transition disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:outline-none"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'جاري الحفظ...' : 'حفظ بلاغ تسريب المياه'}</span>
            </button>
          </form>
        </section>

        {/* Household Water Savings Estimator (Strictly «تقديري») */}
        <section className="lg:col-span-6 bg-slate-900/75 border border-white/10 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              مُقدّر الترشيد المنزلي
            </h2>
            <span className="px-3 py-1 rounded-lg text-xs font-black bg-amber-500/15 text-amber-300 border border-amber-400/40">
              تقديري (ليس قياس عداد)
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-950/60 border border-white/10 rounded-xl p-3.5">
              <label htmlFor="hh-members" className="text-xs font-bold text-slate-200">
                عدد أفراد الأسرة
              </label>
              <input
                id="hh-members"
                type="number"
                min={1}
                max={15}
                value={householdMembers}
                onChange={(e) => setHouseholdMembers(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 min-h-[44px] text-center bg-slate-900 border border-white/15 rounded-xl text-sm font-black text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <label className="min-h-[44px] flex items-center justify-between gap-3 bg-slate-950/60 border border-white/10 rounded-xl p-3.5 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-white">إصلاح حنفية تنقط باستمرار</p>
                <p className="text-[11px] text-slate-400">افتراض تقديري: ~15 لتر/يوم للحنفية الواحدة</p>
              </div>
              <input
                type="checkbox"
                checked={fixDrippingTap}
                onChange={(e) => setFixDrippingTap(e.target.checked)}
                className="accent-emerald-500 w-5 h-5"
              />
            </label>

            <label className="min-h-[44px] flex items-center justify-between gap-3 bg-slate-950/60 border border-white/10 rounded-xl p-3.5 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-white">تركيب مهوي ترشيد على الحنفية (Aerator)</p>
                <p className="text-[11px] text-slate-400">افتراض تقديري: ~20 لتر/فرد/يوم عند الاستخدام المعتدل</p>
              </div>
              <input
                type="checkbox"
                checked={installAerator}
                onChange={(e) => setInstallAerator(e.target.checked)}
                className="accent-emerald-500 w-5 h-5"
              />
            </label>

            <div className="bg-slate-950/60 border border-white/10 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <label htmlFor="shower-range" className="text-white">
                  تقصير مدة الاستحمام اليومي
                </label>
                <span className="text-sky-300 tabular-nums">{shorterShowerMin} دقائق/يوم</span>
              </div>
              <input
                id="shower-range"
                type="range"
                min={0}
                max={10}
                value={shorterShowerMin}
                onChange={(e) => setShorterShowerMin(Number(e.target.value))}
                className="w-full accent-sky-400"
              />
              <p className="text-[11px] text-slate-400">افتراض تدفق الدش القياسي: ~9 لتر/دقيقة</p>
            </div>
          </div>

          <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">الوفر الشهري التقديري (تقديري)</span>
              <span className="text-2xl font-black text-sky-300 tabular-nums">
                {totalEstimatedMonthlyLiters.toLocaleString()} لتر
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>ما يعادل تقريباً بالمتر المكعب</span>
              <span className="font-bold text-white tabular-nums">{estimatedMonthlyM3.toFixed(2)} م³ / شهر</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>الطاقة المكافئة للضخ والمعالجة (تقديري)</span>
              <span className="font-bold text-emerald-300 tabular-nums">{estimatedCo2Kg} kg CO₂e</span>
            </div>
            <p className="text-[11px] text-slate-400 pt-2 border-t border-white/10 leading-relaxed">
              المعادلة: (مجموع اللترات اليومية المفترضة × 30 يوماً) ÷ 1000 × 0.298 كجم CO₂e/م³ (الشركة القابضة لمياه الشرب والصرف الصحي HCWW). هذه أرقام إرشادية تقديرية وليست قراءة عداد فعلية.
            </p>
          </div>
        </section>
      </div>

      {/* Water Leak Tracker */}
      <section className="bg-slate-900/75 border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black text-white">متابعة بلاغات تسريب المياه</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تعرض حالة البلاغ المسجلة فعلياً فقط دون ادعاء كميات مياه موفرة.
            </p>
          </div>
          <Link
            to="/eco-watch"
            className="text-xs font-bold text-sky-400 hover:underline min-h-[44px] inline-flex items-center"
          >
            إدارة بلاغاتي في «بلاغ بيئي»
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 py-6 text-center">جاري تحميل بلاغات المياه...</p>
        ) : waterReports.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">لا توجد بلاغات تسريب مياه مسجلة حالياً.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {waterReports.map((rep) => {
              const st = REPORT_STATUS_META[rep.status];
              return (
                <article
                  key={rep.id}
                  className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-black text-white">{rep.title}</h3>
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border shrink-0 ${st.badgeClass}`}>
                      {st.labelAr}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{rep.description}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      {rep.governorate} - {rep.area}
                    </span>
                    {rep.isDemo && <span className="text-amber-300 font-bold">عينة تجريبية</span>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Practical Household Tips */}
      <section className="bg-slate-900/75 border border-white/10 rounded-3xl p-6 space-y-4">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          نصائح عملية للترشيد المنزلي
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WATER_TIPS.map((tip) => (
            <div key={tip.id} className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 space-y-1.5">
              <h3 className="text-sm font-black text-emerald-300">{tip.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>تنطبق الأرقام التقديرية على حالات الاستخدام المنزلي الشائعة وتختلف من أسرة لأخرى.</span>
        </div>
      </section>
    </div>
  );
};

export default WaterSaving;
