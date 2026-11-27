import React, { useState } from 'react';
import { Zap, TrendingDown, TrendingUp } from 'lucide-react';

// Egypt grid average, 2025: 0.559 kg CO2e per kWh (carbonrecycling.co.uk/emission-factors/electricity/egypt,
// derived from public generation data). Shown to the user with its source.
const GRID_KG_PER_KWH = 0.559;
const KEY = 'moeco_kwh_months';

type Rec = Record<string, number>;
const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const prevKey = () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return monthKey(d); };
const load = (): Rec => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };

const BillCO2Card: React.FC = () => {
  const [recs, setRecs] = useState<Rec>(load);
  const [input, setInput] = useState('');
  const cur = recs[monthKey()];
  const prev = recs[prevKey()];
  const kg = cur != null ? cur * GRID_KG_PER_KWH : null;
  const diff = cur != null && prev != null ? cur * GRID_KG_PER_KWH - prev * GRID_KG_PER_KWH : null;

  const save = () => {
    const v = Number(input);
    if (!isFinite(v) || v <= 0 || v > 20000) return;
    const next = { ...recs, [monthKey()]: v };
    localStorage.setItem(KEY, JSON.stringify(next));
    setRecs(next);
    setInput('');
  };

  return (
    <section className="rounded-[28px] bg-white border border-emerald-100 p-5 shadow-[0_8px_30px_rgba(6,78,59,.07)] space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center" style={{ color: '#b45309' }}><Zap className="w-5 h-5" /></span>
        <h2 className="text-base font-extrabold text-slate-900">فاتورة الكهربا = كام كجم كربون؟</h2>
      </div>

      {kg != null ? (
        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-extrabold num-ltr" style={{ color: '#0b6b54' }}>{kg.toFixed(0)}<span className="text-base font-bold text-slate-500 mr-1"> كجم CO₂e</span></p>
            <p className="text-xs text-slate-500 mt-1">استهلاك الشهر ده: <span className="num-ltr font-bold">{cur} kWh</span></p>
          </div>
          {diff != null && (
            <span className="inline-flex items-center gap-1 text-sm font-extrabold px-3 py-1.5 rounded-full" style={diff <= 0 ? { background: '#dcfce7', color: '#166534' } : { background: '#fee2e2', color: '#991b1b' }}>
              {diff <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              <span className="num-ltr">{Math.abs(diff).toFixed(0)} كجم</span>
              <span>{diff <= 0 ? 'أقل من الشهر اللي فات' : 'أكتر من الشهر اللي فات'}</span>
            </span>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500 leading-relaxed">اكتب عدد الكيلووات ساعة من فاتورتك (أو من العدّاد) وهنحوّله لكربون.</p>
      )}

      <div className="flex gap-2">
        <input
          inputMode="decimal"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="kWh الشهر ده"
          className="flex-1 min-h-[48px] px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 num-ltr"
          aria-label="كيلووات ساعة هذا الشهر"
        />
        <button type="button" onClick={save} className="min-h-[48px] px-6 rounded-2xl font-bold active:scale-95 transition-transform" style={{ background: '#0b6b54', color: '#fff' }}>
          احسب
        </button>
      </div>
      <p className="text-[11px] text-slate-400">معامل الشبكة المصرية 2025: 0.559 كجم CO₂e لكل kWh (تقدير منشور من بيانات التوليد العامة). الأرقام بتتحفظ على جهازك بس.</p>
    </section>
  );
};

export default BillCO2Card;
