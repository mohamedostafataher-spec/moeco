import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Droplets,
  Flame,
  Wind,
  Save,
  CheckCircle2,
  MapPin,
  Phone,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';

const VERIFIED_HOTLINES = [
  { id: 'elec', number: '121', labelAr: 'طوارئ الكهرباء', labelEn: 'Electricity Emergency' },
  { id: 'water', number: '125', labelAr: 'طوارئ المياه والصرف', labelEn: 'Water Emergency' },
  { id: 'gas', number: '129', labelAr: 'طوارئ الغاز الطبيعي', labelEn: 'Natural Gas Emergency' },
  { id: 'env', number: '19808', labelAr: 'خط شكاوى وزارة البيئة', labelEn: 'Env Complaints' },
];

const EmergencyServices: React.FC = () => {
  const { user, isRtl } = useApp();
  const [type, setType] = useState<'leak' | 'pollution' | 'fire' | 'other'>('leak');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  const fetchReports = async () => {
    const data = await storageService.getEmergencyReports();
    setReports(data || []);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const report = {
      user_id: user?.id || 'guest',
      type,
      location: location.trim(),
      description: description.trim(),
      status: 'saved_locally',
      created_at: new Date().toISOString(),
    };
    await storageService.saveEmergencyReport(report);
    await fetchReports();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 6000);
    setDescription('');
    setLocation('');
  };

  const t = {
    title: isRtl ? 'أرقام الطوارئ وتوثيق الحوادث' : 'Emergency Hotlines & Incident Notes',
    subtitle: isRtl
      ? 'اتصل مباشرة بالأرقام الرسمية للطوارئ، واحتفظ بملاحظة شخصية للحوادث البيئية على جهازك.'
      : 'Call official hotlines directly and save personal environmental incident notes.',
    type: isRtl ? 'تصنيف الواقعة' : 'Incident Category',
    leak: isRtl ? 'تسرب مياه' : 'Water Leak',
    pollution: isRtl ? 'تلوث / دخان' : 'Pollution',
    fire: isRtl ? 'حريق / طوارئ خطرة' : 'Fire Hazard',
    other: isRtl ? 'ملاحظة أخرى' : 'Other',
    desc: isRtl ? 'وصف الواقعة' : 'Incident Description',
    loc: isRtl ? 'الموقع أو العنوان التقريبي' : 'Location / Address',
    submit: isRtl ? 'حفظ الملاحظة في سجلي المحلي' : 'Save Note Locally',
    success: isRtl
      ? 'تم حفظ الملاحظة في سجل جهازك فقط (إدخال المستخدم). لا يقوم MoEco بإرسال بلاغات تلقائية للجهات أو تحريك وحدات تدخل؛ يُرجى الاتصال بالأرقام الرسمية أعلاه عند الحاجة.'
      : 'Saved to your local device only. MoEco does not dispatch units or contact authorities automatically.',
    history: isRtl ? 'سجل الملاحظات المحفوظة محليًا' : 'Local Incident Notes',
    hotline: isRtl ? 'أرقام الطوارئ الرسمية في مصر' : 'Official Egyptian Emergency Hotlines',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header & Honest Disclaimer */}
      <header className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{t.title}</h1>
            <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p>
            <strong>{isRtl ? 'تنبيه مهم:' : 'Important Notice:'}</strong>{' '}
            {isRtl
              ? 'في حالات الطوارئ الحقيقية (تسرب غاز، حريق، كسر خط مياه رئيسي، خطر كهرباء)، اتصل فورًا بالرقم الرسمي المختص عبر الأزرار أدناه. حفظ ملاحظة هنا يتم على جهازك الشخصي للمتابعة فقط ولا يرسل إخطارًا لأي جهة.'
              : 'For real emergencies, call the official hotlines directly. Saving a note here is local only.'}
          </p>
        </div>
      </header>

      {/* Official Hotlines First */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Phone className="w-5 h-5 text-emerald-700" />
          <span>{t.hotline}</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {VERIFIED_HOTLINES.map((h) => (
            <a
              key={h.id}
              href={`tel:${h.number}`}
              className="min-h-[56px] p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl flex items-center justify-between gap-3 transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-slate-700">{isRtl ? h.labelAr : h.labelEn}</p>
                <p className="text-lg font-extrabold text-emerald-700 num-ltr mt-0.5">{h.number}</p>
              </div>
              <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
            </a>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Local Note Form */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-extrabold text-slate-900">
            {isRtl ? 'تسجيل ملاحظة حادث في سجلي' : 'Record Incident Note'}
          </h2>

          {savedNotice && (
            <div
              role="status"
              className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-xs text-emerald-900 leading-relaxed"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <p>{t.success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-700">{t.type}</span>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'leak', label: t.leak, icon: Droplets },
                  { id: 'pollution', label: t.pollution, icon: Wind },
                  { id: 'fire', label: t.fire, icon: Flame },
                  { id: 'other', label: t.other, icon: AlertTriangle },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id as any)}
                    className={`min-h-[48px] p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-colors ${
                      type === item.id
                        ? 'bg-emerald-50 border-emerald-700 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${type === item.id ? 'text-emerald-700' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="em-loc" className="block text-xs font-bold text-slate-700">
                {t.loc}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
                <input
                  id="em-loc"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  placeholder={isRtl ? 'اسم الشارع، المنطقة، المحافظة...' : 'Street, district, governorate...'}
                  className="w-full min-h-[44px] bg-white border border-slate-300 rounded-xl ps-10 pe-4 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="em-desc" className="block text-xs font-bold text-slate-700">
                {t.desc}
              </label>
              <textarea
                id="em-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder={isRtl ? 'اكتب تفاصيل الواقعة للرجوع إليها أو إرفاقها عند الاتصال...' : 'Describe the incident...'}
                className="w-full bg-white border border-slate-300 rounded-xl p-3.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="min-h-[48px] w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{t.submit}</span>
            </button>
          </form>
        </section>

        {/* Local Incident Log */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900">{t.history}</h2>
          <div className="space-y-3 max-h-[460px] overflow-y-auto">
            {reports.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl py-12 px-4 text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-600">
                  {isRtl ? 'لا توجد ملاحظات حوادث محفوظة على جهازك حتى الآن.' : 'No local incident notes saved.'}
                </p>
              </div>
            ) : (
              reports.map((r, i) => (
                <article
                  key={i}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-md">
                      {r.type}
                    </span>
                    <span className="text-xs text-slate-500 num-ltr">
                      {new Date(r.created_at || r.date || Date.now()).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                    </span>
                  </div>
                  {r.location && <p className="text-xs font-bold text-slate-900">{r.location}</p>}
                  <p className="text-xs text-slate-600 leading-relaxed">{r.description}</p>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{isRtl ? 'محفوظ محليًا — غير مرسل لجهة رسمية' : 'Saved locally only'}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EmergencyServices;
