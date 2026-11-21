import React, { useState, useEffect } from 'react';
import {
  Sun,
  MapPin,
  Trees,
  Umbrella,
  Info,
  AlertTriangle,
  Plus,
  Filter,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import {
  civicActionService,
  HeatShadePoint,
  HeatIssueType,
  InitiativeStatus,
} from '../services/civicActionService';

const ISSUE_TYPE_AR: Record<HeatIssueType, string> = {
  extreme_heat: 'منطقة شديدة الحرارة',
  lack_of_shade: 'نقص واضح في الظل',
  exposed_waiting_area: 'موقف انتظار مكشوف للشمس',
  low_greenery: 'انخفاض الغطاء النباتي',
};

const INTERVENTION_AR: Record<HeatShadePoint['suggestedIntervention'], string> = {
  add_canopy: 'اقتراح: إضافة مظلة انتظار',
  improve_waiting_station: 'اقتراح: تحسين محطة/مكان الانتظار',
  conditional_tree_planting: 'اقتراح: تشجير مشروط (بعد فحص التربة والمرافق)',
  reflective_surface: 'اقتراح: أسطح/دهانات مخففة للحرارة',
};

const STATUS_AR: Record<InitiativeStatus, { label: string; cls: string }> = {
  proposed: { label: 'مقترحة', cls: 'bg-amber-500/15 text-amber-300 border-amber-400/40' },
  coordinating: { label: 'قيد التنسيق', cls: 'bg-sky-500/15 text-sky-300 border-sky-400/40' },
  in_progress: { label: 'قيد التنفيذ', cls: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/40' },
  verified: { label: 'تم التحقق', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40' },
};

const HeatShadeMap: React.FC = () => {
  const [points, setPoints] = useState<HeatShadePoint[]>([]);
  const [govFilter, setGovFilter] = useState<string>('all');
  const [issueFilter, setIssueFilter] = useState<'all' | HeatIssueType>('all');

  useEffect(() => {
    setPoints(civicActionService.getHeatShadePoints());
  }, []);

  const governorates = Array.from(new Set(points.map((p) => p.governorate)));

  const filtered = points.filter((p) => {
    const matchGov = govFilter === 'all' || p.governorate === govFilter;
    const matchIssue = issueFilter === 'all' || p.issueType === issueFilter;
    return matchGov && matchIssue;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 pb-32 space-y-6" dir="rtl">
      {/* Header */}
      <header className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-400/30 flex items-center justify-center text-orange-400">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-white">خريطة الحر والظل</h1>
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-400/40">
                  تشمل مواقع تجريبية + بلاغات المواطنين
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                رصد المواقع شديدة الحرارة أو التي تفتقر إلى الظل مع اقتراح تدخلات ملائمة لطبيعة كل موقع.
              </p>
            </div>
          </div>

          <Link
            to="/eco-watch"
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-slate-950 font-black text-xs hover:bg-orange-400 transition focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>أبلغ عن موقع بلا ظل</span>
          </Link>
        </div>

        {/* Ecological & Engineering Honesty Note */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 flex items-start gap-3">
            <Trees className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-100 leading-relaxed">
              <strong>ملاحظة علمية مهمة:</strong> التشجير ليس مناسباً في كل مكان؛ الأرصفة الضيقة، مسارات الكابلات والمرافق الأرضية، والجزر المرورية قد تتطلب <strong>تركيب مظلة أو تحسين نقطة انتظار</strong> بدلاً من غرس أشجار لا تعيش أو تعيق الحركة.
            </p>
          </div>
          <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>الخصوصية ودقة الحالة:</strong> تُعرض الإحداثيات على مستوى النطاق العام (~1 كم) فقط، ولا تتغير حالة المبادرات إلى «قيد التنفيذ» أو «تم التحقق» إلا بتوثيق فعلي من الجهة المنفذة.
            </p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 inline-flex items-center gap-1 ml-1">
            <Filter className="w-3.5 h-3.5" />
            المحافظة:
          </span>
          <button
            type="button"
            onClick={() => setGovFilter('all')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              govFilter === 'all'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'bg-slate-950/60 text-slate-300 border-white/10'
            }`}
          >
            الكل
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

        <select
          aria-label="تصفية حسب نوع مشكلة الحرارة"
          value={issueFilter}
          onChange={(e) => setIssueFilter(e.target.value as any)}
          className="min-h-[44px] bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white focus:border-orange-400 focus:outline-none"
        >
          <option value="all">كل أنواع المشكلات</option>
          {(Object.keys(ISSUE_TYPE_AR) as HeatIssueType[]).map((k) => (
            <option key={k} value={k}>
              {ISSUE_TYPE_AR[k]}
            </option>
          ))}
        </select>
      </section>

      {/* Interactive Map */}
      <section className="bg-slate-900/75 border border-white/10 rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-base font-black text-white">الخريطة التفاعلية للنطاقات المرصودة</h2>
          <span className="text-[11px] text-slate-400">مواقع تقريبية على مستوى النطاق</span>
        </div>
        <div className="h-[320px] md:h-[380px] rounded-2xl overflow-hidden border border-white/10">
          <MapContainer center={[30.04, 31.23]} zoom={6} className="w-full h-full">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />
            {filtered.map((pt) => (
              <Marker key={pt.id} position={[pt.zoneLat, pt.zoneLng]}>
                <Popup>
                  <div className="text-right space-y-1 min-w-[180px]" dir="rtl">
                    <p className="font-black text-slate-900 text-xs">{pt.area}</p>
                    <p className="text-[11px] font-bold text-orange-600">{ISSUE_TYPE_AR[pt.issueType]}</p>
                    <p className="text-[11px] text-slate-700">{INTERVENTION_AR[pt.suggestedIntervention]}</p>
                    <p className="text-[10px] text-slate-500">الحالة: {STATUS_AR[pt.initiativeStatus].label}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </section>

      {/* Cards List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-10 text-center space-y-2">
          <Info className="w-10 h-10 text-slate-500 mx-auto" />
          <h2 className="text-lg font-black text-white">لا توجد مواقع مطابقة للتصفية</h2>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((pt) => {
            const st = STATUS_AR[pt.initiativeStatus];
            return (
              <article
                key={pt.id}
                className="bg-slate-900/75 border border-white/10 rounded-3xl p-6 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-300 bg-orange-500/15 border border-orange-400/30 px-2.5 py-1 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {ISSUE_TYPE_AR[pt.issueType]}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-black border ${st.cls}`}>
                    {st.label}
                  </span>
                </div>

                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>{pt.area}</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">{pt.description}</p>

                <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-300">
                    <Umbrella className="w-4 h-4 shrink-0" />
                    <span>{INTERVENTION_AR[pt.suggestedIntervention]}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{pt.suitabilityNote}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
                  <span>عدد الإشارات المسجلة: {pt.reportsCount}</span>
                  <span>
                    {pt.isDemo ? 'بيانات تجريبية' : 'بلاغ مجتمعي'} · أُضيف: {pt.createdAt}
                  </span>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default HeatShadeMap;
