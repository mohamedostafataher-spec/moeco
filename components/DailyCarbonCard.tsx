import React, { useEffect, useMemo, useState } from 'react';
import { Footprints, Bus, Car, Zap, Salad, Beef, Check, Flame, Sprout, TreePine, Leaf } from 'lucide-react';
import { useApp } from '../context/AppContext';

// Approximate per-person daily factors (kg CO2e). Estimates for quick awareness, not an audit.
const TRANSPORT = [
  { id: 'walk', ar: 'مشي/عجلة', en: 'Walk/Bike', kg: 0, Icon: Footprints },
  { id: 'metro', ar: 'مترو/قطر', en: 'Metro/Train', kg: 0.5, Icon: Bus },
  { id: 'bus', ar: 'ميكروباص/أتوبيس', en: 'Bus/Microbus', kg: 1.2, Icon: Bus },
  { id: 'car', ar: 'عربية/تاكسي', en: 'Car/Taxi', kg: 2.6, Icon: Car },
];
const POWER = [
  { id: 'low', ar: 'قليل', en: 'Low', kg: 0.9 },
  { id: 'mid', ar: 'متوسط', en: 'Medium', kg: 1.8 },
  { id: 'high', ar: 'عالي (تكييف)', en: 'High (A/C)', kg: 3.6 },
];
const FOOD = [
  { id: 'veg', ar: 'نباتي غالبًا', en: 'Mostly veg', kg: 1.5, Icon: Salad },
  { id: 'mix', ar: 'متنوع', en: 'Mixed', kg: 3.5, Icon: Salad },
  { id: 'meat', ar: 'لحوم كتير', en: 'Meat-heavy', kg: 6, Icon: Beef },
];
const GOAL_KG = 7;
const KEY = 'moeco_daily_footprint_v1';

type Entry = { kg: number; t: string; p: string; f: string };
type Store = Record<string, Entry>;

const dayKey = (d: Date) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
const load = (): Store => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
};

const DailyCarbonCard: React.FC = () => {
  const { isRtl } = useApp();
  const [store, setStore] = useState<Store>(load);
  const today = dayKey(new Date());
  const done = store[today];
  const [t, setT] = useState<string>('');
  const [p, setP] = useState<string>('');
  const [f, setF] = useState<string>('');

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(store));
  }, [store]);

  const streak = useMemo(() => {
    let n = 0;
    const d = new Date();
    if (!store[dayKey(d)]) d.setDate(d.getDate() - 1); // today not logged yet: count up to yesterday
    while (store[dayKey(d)]) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }, [store]);

  const week = useMemo(() => {
    const out: { k: string; kg: number | null; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const e = store[dayKey(d)];
      out.push({ k: dayKey(d), kg: e ? e.kg : null, label: d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'narrow' }) });
    }
    return out;
  }, [store, isRtl]);

  const missedYesterday = !done && streak === 0 && Object.keys(store).length > 0;
  const ready = t && p && f;

  const save = () => {
    const kg =
      (TRANSPORT.find((x) => x.id === t)?.kg ?? 0) +
      (POWER.find((x) => x.id === p)?.kg ?? 0) +
      (FOOD.find((x) => x.id === f)?.kg ?? 0);
    setStore((s) => ({ ...s, [today]: { kg: Math.round(kg * 10) / 10, t, p, f } }));
  };

  const stage = streak >= 21 ? 4 : streak >= 14 ? 3 : streak >= 7 ? 2 : streak >= 3 ? 1 : 0;
  const stageNames = isRtl
    ? ['بذرة', 'نبتة', 'شجرة صغيرة', 'شجرة كبيرة', 'شجرة مثمرة']
    : ['Seed', 'Sprout', 'Young tree', 'Big tree', 'Fruiting tree'];
  const TreeIcon = stage === 0 ? Sprout : stage === 1 ? Leaf : TreePine;
  const treeSize = 28 + stage * 8;
  const nextAt = [3, 7, 14, 21][stage];
  const max = Math.max(GOAL_KG * 1.4, ...week.map((w) => w.kg || 0));

  const L = (ar: string, en: string) => (isRtl ? ar : en);
  const chip = (active: boolean) =>
    `min-h-[44px] px-3 py-2 rounded-xl border text-sm font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
      active ? 'bg-emerald-700 border-emerald-700 text-white shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400'
    }`;

  return (
    <section
      aria-label={L('بصمتك الكربونية اليومية', 'Your daily carbon footprint')}
      className="rounded-3xl p-5 md:p-6 space-y-4 text-white shadow-lg bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 style={{ color: '#fff' }} className="text-lg md:text-xl font-extrabold">{L('بصمتك النهاردة في 30 ثانية', 'Today\'s footprint in 30 seconds')}</h2>
          <p style={{ color: '#ecfdf5' }} className="text-xs mt-1">{L('3 اختيارات بس. أرقام تقريبية للتوعية.', '3 taps. Approximate numbers for awareness.')}</p>
        </div>
        <div className="flex flex-col items-center shrink-0 bg-white/15 rounded-2xl px-3 py-2 min-w-[84px]">
          <TreeIcon style={{ width: treeSize, height: treeSize }} className={`transition-all duration-500 ${missedYesterday ? 'opacity-50 grayscale' : ''}`} />
          <span style={{ color: '#fff' }} className="text-[11px] font-bold mt-1">{stageNames[stage]}</span>
        </div>
      </div>

      <div style={{ color: '#fff' }} className="flex items-center gap-2 text-sm font-bold">
        <Flame className={`w-4 h-4 ${streak > 0 ? 'text-amber-300' : 'text-white/60'}`} />
        <span>
          {streak > 0
            ? L(`${streak} يوم متتالي`, `${streak}-day streak`)
            : missedYesterday
              ? L('الشجرة ذبلت شوية. ابدأ سلسلة جديدة النهاردة', 'Your tree wilted a little. Start a new streak today')
              : L('ابدأ سلسلتك النهاردة', 'Start your streak today')}
        </span>
        {streak < 21 && streak > 0 && <span style={{ color: '#d1fae5' }} className="font-medium">{L(`(باقي ${nextAt - streak} ليوم الشجرة الجاية)`, `(${nextAt - streak} more to grow)`)}</span>}
      </div>

      {!done ? (
        <div className="bg-white rounded-2xl p-4 text-slate-800 space-y-3">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2">{L('تنقلت إزاي؟', 'How did you get around?')}</p>
            <div className="flex flex-wrap gap-2">
              {TRANSPORT.map((o) => (
                <button key={o.id} type="button" onClick={() => setT(o.id)} className={chip(t === o.id)} aria-pressed={t === o.id}>
                  <o.Icon className="w-4 h-4" />
                  {L(o.ar, o.en)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2">{L('استهلاك الكهرباء في البيت', 'Home electricity use')}</p>
            <div className="flex flex-wrap gap-2">
              {POWER.map((o) => (
                <button key={o.id} type="button" onClick={() => setP(o.id)} className={chip(p === o.id)} aria-pressed={p === o.id}>
                  <Zap className="w-4 h-4" />
                  {L(o.ar, o.en)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2">{L('أكلك النهاردة', 'Your food today')}</p>
            <div className="flex flex-wrap gap-2">
              {FOOD.map((o) => (
                <button key={o.id} type="button" onClick={() => setF(o.id)} className={chip(f === o.id)} aria-pressed={f === o.id}>
                  <o.Icon className="w-4 h-4" />
                  {L(o.ar, o.en)}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            disabled={!ready}
            onClick={save}
            className="w-full min-h-[48px] rounded-xl bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            {L('احسب وسجّل يومي', 'Calculate and log my day')}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 text-slate-800 space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p style={{ color: '#64748b' }} className="text-xs font-bold">{L('بصمتك النهاردة', 'Today\'s footprint')}</p>
              <p style={{ color: '#047857' }} className="text-4xl font-black leading-none mt-1">
                {done.kg} <span style={{ color: '#64748b' }} className="text-base font-bold">kg CO₂e</span>
              </p>
            </div>
            <p style={{ color: done.kg <= GOAL_KG ? '#047857' : '#d97706' }} className="text-sm font-extrabold">
              {done.kg <= GOAL_KG
                ? L(`تحت الهدف (${GOAL_KG} kg) 👏`, `Under the ${GOAL_KG} kg goal 👏`)
                : L(`فوق الهدف بـ ${(done.kg - GOAL_KG).toFixed(1)} kg`, `${(done.kg - GOAL_KG).toFixed(1)} kg over the goal`)}
            </p>
          </div>
          <p style={{ color: '#475569' }} className="text-xs">
            {done.kg > GOAL_KG
              ? done.t === 'car'
                ? L('أسرع توفير: مشوار واحد بالمترو بدل العربية بيوفر حوالي 2 kg.', 'Quickest cut: one metro trip instead of the car saves about 2 kg.')
                : done.p === 'high'
                  ? L('أسرع توفير: ظبط التكييف على 25 درجة وقلل ساعات التشغيل.', 'Quickest cut: set A/C to 25°C and cut running hours.')
                  : L('جرّب وجبة نباتية بكرة. بتوفر حوالي 2 kg.', 'Try a veg meal tomorrow. Saves about 2 kg.')
              : L('كمّل كده. ارجع بكرة تكبّر شجرتك.', 'Keep it up. Come back tomorrow to grow your tree.')}
          </p>
        </div>
      )}

      <div className="bg-white/10 rounded-2xl p-3">
        <div className="flex items-end gap-2 h-16" aria-label={L('آخر 7 أيام', 'Last 7 days')}>
          {week.map((w) => (
            <div key={w.k} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
              <div
                className={`w-full rounded-t-md ${w.kg === null ? 'bg-white/15' : w.kg <= GOAL_KG ? 'bg-emerald-200' : 'bg-amber-300'}`}
                style={{ height: `${w.kg === null ? 8 : Math.max(10, (w.kg / max) * 100)}%` }}
                title={w.kg === null ? '' : `${w.kg} kg`}
              />
              <span style={{ color: '#d1fae5' }} className="text-[10px]">{w.label}</span>
            </div>
          ))}
        </div>
      </div>
      <p style={{ color: '#d1fae5' }} className="text-[10px]">{L('محفوظ على جهازك فقط. القيم تقديرية (متوسط للفرد).', 'Saved on your device only. Values are estimates (per-person averages).')}</p>
    </section>
  );
};

export default DailyCarbonCard;
