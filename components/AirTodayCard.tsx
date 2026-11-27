import React, { useEffect, useState } from 'react';
import { Wind, Thermometer, Sun } from 'lucide-react';

const CITIES: { id: string; ar: string; lat: number; lon: number }[] = [
  { id: 'cairo', ar: 'القاهرة', lat: 30.0444, lon: 31.2357 },
  { id: 'giza', ar: 'الجيزة', lat: 30.0131, lon: 31.2089 },
  { id: 'alex', ar: 'الإسكندرية', lat: 31.2001, lon: 29.9187 },
  { id: 'mansoura', ar: 'المنصورة', lat: 31.0409, lon: 31.3785 },
  { id: 'tanta', ar: 'طنطا', lat: 30.7865, lon: 31.0004 },
  { id: 'portsaid', ar: 'بورسعيد', lat: 31.2653, lon: 32.3019 },
  { id: 'suez', ar: 'السويس', lat: 29.9668, lon: 32.5498 },
  { id: 'asyut', ar: 'أسيوط', lat: 27.1809, lon: 31.1837 },
  { id: 'luxor', ar: 'الأقصر', lat: 25.6872, lon: 32.6396 },
  { id: 'aswan', ar: 'أسوان', lat: 24.0889, lon: 32.8998 },
  { id: 'hurghada', ar: 'الغردقة', lat: 27.2579, lon: 33.8116 },
];

// US EPA AQI bands
const band = (aqi: number) => {
  if (aqi <= 50) return { t: 'هواء نضيف', c: '#16a34a', tip: 'يوم كويس للمشي أو العجلة بدل العربية.' };
  if (aqi <= 100) return { t: 'مقبول', c: '#ca8a04', tip: 'الحساسين يقللوا المجهود بره البيت.' };
  if (aqi <= 150) return { t: 'مش كويس للحساسين', c: '#ea580c', tip: 'لو عندك حساسية صدر قلل الخروج.' };
  if (aqi <= 200) return { t: 'مش صحي', c: '#dc2626', tip: 'قلل المجهود بره البيت وقفل الشبابيك.' };
  return { t: 'خطر', c: '#7f1d1d', tip: 'ابعد عن الخروج لو تقدر.' };
};

interface Data { aqi: number | null; pm25: number | null; temp: number | null; uv: number | null; time: string }

const AirTodayCard: React.FC = () => {
  const [cityId, setCityId] = useState<string>(() => localStorage.getItem('moeco_city') || 'cairo');
  const [data, setData] = useState<Data | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const city = CITIES.find((c) => c.id === cityId) || CITIES[0];

  useEffect(() => {
    let alive = true;
    setState('loading');
    const aq = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=us_aqi,pm2_5`;
    const wx = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=apparent_temperature,uv_index&timezone=auto`;
    Promise.all([fetch(aq).then((r) => r.json()), fetch(wx).then((r) => r.json())])
      .then(([a, w]) => {
        if (!alive) return;
        if (!a?.current && !w?.current) throw new Error('no data');
        setData({
          aqi: a?.current?.us_aqi ?? null,
          pm25: a?.current?.pm2_5 ?? null,
          temp: w?.current?.apparent_temperature ?? null,
          uv: w?.current?.uv_index ?? null,
          time: a?.current?.time || w?.current?.time || '',
        });
        setState('ok');
      })
      .catch(() => alive && setState('error'));
    return () => { alive = false; };
  }, [city.id]);

  const b = data?.aqi != null ? band(data.aqi) : null;

  return (
    <section className="rounded-[28px] bg-white border border-emerald-100 p-5 shadow-[0_8px_30px_rgba(6,78,59,.07)] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center" style={{ color: '#0b6b54' }}><Wind className="w-5 h-5" /></span>
          <h2 className="text-base font-extrabold text-slate-900">هواء النهارده</h2>
        </div>
        <select
          aria-label="المدينة"
          value={cityId}
          onChange={(e) => { setCityId(e.target.value); localStorage.setItem('moeco_city', e.target.value); }}
          className="text-sm font-bold rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-slate-800"
        >
          {CITIES.map((c) => <option key={c.id} value={c.id}>{c.ar}</option>)}
        </select>
      </div>

      {state === 'loading' && <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />}
      {state === 'error' && <p className="text-sm text-slate-500">مقدرناش نجيب بيانات الهواء دلوقتي. جرّب بعد شوية.</p>}
      {state === 'ok' && data && (
        <>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full flex flex-col items-center justify-center shrink-0" style={{ background: b ? b.c : '#94a3b8' }}>
              <span className="text-3xl font-extrabold leading-none" style={{ color: '#fff' }}>{data.aqi != null ? Math.round(data.aqi) : '—'}</span>
              <span className="text-[10px] font-bold mt-1" style={{ color: 'rgba(255,255,255,.9)' }}>AQI</span>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-extrabold" style={{ color: b?.c }}>{b ? b.t : 'غير متاح'}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{b?.tip}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-slate-50 p-3"><Wind className="w-4 h-4 mx-auto text-slate-500" /><p className="text-sm font-extrabold mt-1 num-ltr">{data.pm25 != null ? data.pm25.toFixed(0) : '—'}</p><p className="text-[10px] text-slate-500">PM2.5 µg/m³</p></div>
            <div className="rounded-2xl bg-slate-50 p-3"><Thermometer className="w-4 h-4 mx-auto text-slate-500" /><p className="text-sm font-extrabold mt-1 num-ltr">{data.temp != null ? data.temp.toFixed(0) + '°' : '—'}</p><p className="text-[10px] text-slate-500">الإحساس</p></div>
            <div className="rounded-2xl bg-slate-50 p-3"><Sun className="w-4 h-4 mx-auto text-slate-500" /><p className="text-sm font-extrabold mt-1 num-ltr">{data.uv != null ? data.uv.toFixed(0) : '—'}</p><p className="text-[10px] text-slate-500">الأشعة UV</p></div>
          </div>
          <p className="text-[11px] text-slate-400">المصدر: Open-Meteo (نموذج CAMS للهواء). تقدير بالنموذج مش قياس محطة.</p>
        </>
      )}
    </section>
  );
};

export default AirTodayCard;
