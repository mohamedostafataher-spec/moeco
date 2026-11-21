import React, { useState, useEffect } from 'react';
import {
  Recycle,
  MapPin,
  Clock,
  Phone,
  Info,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notificationService';
import {
  civicActionService,
  DEMO_RECYCLING_POINTS,
  RECYCLING_MATERIAL_META,
  RecyclingLog,
} from '../services/civicActionService';

const WasteToIncome: React.FC = () => {
  const { user } = useApp();
  const [govFilter, setGovFilter] = useState('all');
  const [logs, setLogs] = useState<RecyclingLog[]>([]);

  // Handover logging state
  const [pointId, setPointId] = useState(DEMO_RECYCLING_POINTS[0].id);
  const [material, setMaterial] = useState<RecyclingLog['material']>('pet_plastic');
  const [weightKg, setWeightKg] = useState('2');
  const [isDocumented, setIsDocumented] = useState(false);
  const [receiptNote, setReceiptNote] = useState('');
  const [formError, setFormError] = useState('');

  const userId = user?.id || 'guest-user-2026';

  useEffect(() => {
    setLogs(civicActionService.getRecyclingLogs(userId));
  }, [userId]);

  const governorates = Array.from(new Set(DEMO_RECYCLING_POINTS.map((p) => p.governorate)));
  const visiblePoints = DEMO_RECYCLING_POINTS.filter(
    (p) => govFilter === 'all' || p.governorate === govFilter
  );

  const handleLogHandover = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const w = parseFloat(weightKg);
    if (Number.isNaN(w) || w <= 0 || w > 500) {
      setFormError('يرجى إدخال وزن صالح بين 0.1 و 500 كجم.');
      return;
    }
    const point = DEMO_RECYCLING_POINTS.find((p) => p.id === pointId) || DEMO_RECYCLING_POINTS[0];

    const created = civicActionService.addRecyclingLog({
      userId,
      pointId: point.id,
      pointName: point.name,
      material,
      weightKg: w,
      isDocumented,
      receiptNote,
    });
    setLogs((prev) => [created, ...prev]);
    setReceiptNote('');
    notificationService.success(
      created.verificationStatus === 'needs_review'
        ? 'تم تسجيل عملية التسليم مع الملاحظة وهي بانتظار المراجعة (أثر تقديري).'
        : 'تم تسجيل الوزن ذاتياً في السجل كأثر تقديري غير موثق.'
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-32 space-y-6" dir="rtl">
      {/* Header */}
      <header className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Recycle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-white">المخلفات إلى دخل</h1>
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-400/40">
                  نقاط تجريبية للعرض
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                دليل نقاط فرز وتجميع المواد القابلة للتدوير، مع تسجيل اختياري للكميات المسلّمة وبيان معامل الأثر بوضوح.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs md:text-sm text-amber-100 leading-relaxed">
            <strong>توضيح مهم:</strong> النقاط المعروضة هنا نماذج تجريبية لبيان الخدمة وليست شراكات تعاقدية نشطة أو وعوداً بعائد مالي مضمون. يتم تمييز أي وزن يُسجل ذاتياً كـ <strong>«أثر تقديري غير موثق»</strong> ما لم يرتبط بتوثيق من نقطة جمع معتمدة.
          </p>
        </div>
      </header>

      {/* Recycling Points Directory */}
      <section className="bg-slate-900/75 border border-white/10 rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-white">دليل نقاط الفرز والتجميع</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setGovFilter('all')}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                govFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-950/60 text-slate-300 border-white/10'
              }`}
            >
              كل المحافظات
            </button>
            {governorates.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGovFilter(g)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                  govFilter === g
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-950/60 text-slate-300 border-white/10'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visiblePoints.map((pt) => (
            <article
              key={pt.id}
              className="bg-slate-950/70 border border-white/10 rounded-2xl p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-black text-white">{pt.name}</h3>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-400/30">
                  {pt.isVerifiedPartner ? 'نقطة معتمدة' : 'نقطة تجريبية'}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {pt.acceptedMaterials.map((mat) => (
                  <span
                    key={mat}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/20"
                  >
                    {mat}
                  </span>
                ))}
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>{pt.governorate} - {pt.area}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{pt.workingHours}</span>
                </p>
                <p className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{pt.contactInfo || 'غير متاح حالياً'}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Handover Logging Form & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 bg-slate-900/75 border border-white/10 rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            تسجيل كمية مواد مسلّمة (اختياري)
          </h2>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-xs font-bold">
              {formError}
            </div>
          )}

          <form onSubmit={handleLogHandover} className="space-y-3.5">
            <div className="space-y-1">
              <label htmlFor="rec-point" className="block text-xs font-bold text-slate-300">
                نقطة التجميع
              </label>
              <select
                id="rec-point"
                value={pointId}
                onChange={(e) => setPointId(e.target.value)}
                className="w-full min-h-[44px] bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:border-emerald-400 focus:outline-none"
              >
                {DEMO_RECYCLING_POINTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="rec-mat" className="block text-xs font-bold text-slate-300">
                  نوع المادة
                </label>
                <select
                  id="rec-mat"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value as RecyclingLog['material'])}
                  className="w-full min-h-[44px] bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:border-emerald-400 focus:outline-none"
                >
                  {(Object.keys(RECYCLING_MATERIAL_META) as RecyclingLog['material'][]).map((k) => (
                    <option key={k} value={k}>
                      {RECYCLING_MATERIAL_META[k].labelAr}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="rec-weight" className="block text-xs font-bold text-slate-300">
                  الوزن (كجم)
                </label>
                <input
                  id="rec-weight"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-sm font-black text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-950/60 border border-white/10 rounded-xl p-3 text-[11px] text-slate-300 space-y-1">
              <p className="flex items-center gap-1.5 font-bold text-emerald-300">
                <Scale className="w-3.5 h-3.5" />
                معامل الحساب التقديري للمادة المختارة:
              </p>
              <p>
                {RECYCLING_MATERIAL_META[material].factorKgCo2PerKg} كجم CO₂e لكل 1 كجم —{' '}
                {RECYCLING_MATERIAL_META[material].source}
              </p>
            </div>

            <label className="min-h-[44px] flex items-start gap-2.5 bg-slate-950/60 border border-white/10 rounded-xl p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isDocumented}
                onChange={(e) => setIsDocumented(e.target.checked)}
                className="accent-emerald-500 w-4 h-4 mt-0.5"
              />
              <span className="text-xs text-slate-200 leading-relaxed">
                لدي إيصال وزن أو مرجع استلام من النقطة (يُحال للمراجعة بدلاً من التسجيل الذاتي غير الموثق)
              </span>
            </label>

            {isDocumented && (
              <div className="space-y-1">
                <label htmlFor="rec-note" className="block text-xs font-bold text-slate-300">
                  رقم الإيصال أو ملاحظة التوثيق
                </label>
                <input
                  id="rec-note"
                  type="text"
                  value={receiptNote}
                  onChange={(e) => setReceiptNote(e.target.value)}
                  placeholder="مثال: إيصال رقم 412 - نقطة المعادي"
                  className="w-full min-h-[44px] bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[44px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl py-3 transition focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none"
            >
              تسجيل التسليم (تقديري)
            </button>
          </form>
        </section>

        <section className="lg:col-span-7 bg-slate-900/75 border border-white/10 rounded-3xl p-6 space-y-4">
          <h2 className="text-lg font-black text-white">سجل الكميات المسجلة</h2>
          {logs.length === 0 ? (
            <div className="py-12 text-center space-y-2 border border-dashed border-white/10 rounded-2xl">
              <Recycle className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-slate-300">لم تسجل أي تسليمات تدوير بعد</p>
              <p className="text-xs text-slate-400">
                سجّل كمية من النموذج المجاور؛ ستظهر كل عملية مع حالة توثيقها ومعامل حسابها.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-white">
                        {RECYCLING_MATERIAL_META[log.material].labelAr} — {log.weightKg} كجم
                      </span>
                      {log.verificationStatus === 'needs_review' ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-sky-500/15 text-sky-300 border border-sky-400/40 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          بحاجة إلى مراجعة (تقديري)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-400/40 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          أثر تقديري غير موثق
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{log.pointName}</p>
                    {log.receiptNote && (
                      <p className="text-[11px] text-sky-300">مرجع التوثيق: {log.receiptNote}</p>
                    )}
                    <p className="text-[10px] text-slate-500">{log.factorSource}</p>
                  </div>

                  <div className="text-left sm:text-left shrink-0">
                    <p className="text-lg font-black text-emerald-300 tabular-nums">
                      ~{log.estimatedCo2SavedKg} kg CO₂e
                    </p>
                    <p className="text-[10px] text-slate-400">
                      تقديري (معامل {log.factorUsed})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default WasteToIncome;
