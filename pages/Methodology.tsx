import React, { useState } from 'react';
import {
  BookOpen,
  Database,
  Zap,
  Droplets,
  Car,
  Trash2,
  ShieldCheck,
  Info,
  Calculator,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type TestSector = 'electricity' | 'water' | 'transport' | 'recycling';

const SECTOR_DEFAULTS: Record<
  TestSector,
  {
    label: string;
    unit: string;
    defaultAmount: number;
    defaultFactor: number;
    source: string;
    assumptions: string;
  }
> = {
  electricity: {
    label: 'الكهرباء المنزلية',
    unit: 'كيلوواط ساعة (kWh)',
    defaultAmount: 250,
    defaultFactor: 0.533,
    source: 'الشركة القابضة لكهرباء مصر (EEHC) + IPCC',
    assumptions: 'متوسط معامل الشبكة القومية المصرية لمزيج التوليد؛ يختلف حسب التحديث السنوي.',
  },
  water: {
    label: 'المياه والصرف',
    unit: 'متر مكعب (m³)',
    defaultAmount: 15,
    defaultFactor: 0.298,
    source: 'الشركة القابضة لمياه الشرب والصرف الصحي (HCWW)',
    assumptions: 'يمثل الطاقة التقديرية للضخ والتنقية والمعالجة لكل متر مكعب؛ لا يشمل فواقد الشبكة.',
  },
  transport: {
    label: 'المواصلات (سيارة متوسطة)',
    unit: 'كيلومتر (km)',
    defaultAmount: 100,
    defaultFactor: 0.185,
    source: 'الجهاز المركزي للتعبئة العامة والإحصاء (CAPMAS) ومعاملات الوقود',
    assumptions: 'متوسط استهلاك 8 لتر بنزين/100 كم؛ ينخفض المعامل كثيراً عند استخدام المترو أو القطار.',
  },
  recycling: {
    label: 'تدوير البلاستيك (PET)',
    unit: 'كيلوجرام (kg)',
    defaultAmount: 5,
    defaultFactor: 1.5,
    source: 'معاملات تدوير استرشادية (EPA WARM / WMRA)',
    assumptions: 'أثر تجنّب انبعاثات تقديري فقط، ولا يُعد موثقاً دون إيصال وزن من نقطة معتمدة.',
  },
};

const Methodology: React.FC = () => {
  const [testSector, setTestSector] = useState<TestSector>('electricity');
  const [amountInput, setAmountInput] = useState<string>(String(SECTOR_DEFAULTS.electricity.defaultAmount));
  const [factorInput, setFactorInput] = useState<string>(String(SECTOR_DEFAULTS.electricity.defaultFactor));

  const currentMeta = SECTOR_DEFAULTS[testSector];
  const parsedAmount = Math.max(0, parseFloat(amountInput) || 0);
  const parsedFactor = Math.max(0, parseFloat(factorInput) || 0);
  const computedKg = parsedAmount * parsedFactor;
  const computedTons = computedKg / 1000;

  const handleSelectSector = (sec: TestSector) => {
    setTestSector(sec);
    setAmountInput(String(SECTOR_DEFAULTS[sec].defaultAmount));
    setFactorInput(String(SECTOR_DEFAULTS[sec].defaultFactor));
  };

  const sections = [
    {
      id: 'electricity',
      icon: Zap,
      iconColor: 'text-amber-400',
      title: 'الكهرباء والطاقة',
      description: 'يُحسب أثر الكهرباء بضرب الاستهلاك الشهري (kWh) في معامل الانبعاث التقديري للشبكة القومية المصرية.',
      formula: 'kg CO₂e = kWh × 0.533',
      source: 'الشركة القابضة لكهرباء مصر (EEHC) وتقارير IPCC',
      unit: 'kg CO₂e لكل 1 kWh',
    },
    {
      id: 'water',
      icon: Droplets,
      iconColor: 'text-sky-400',
      title: 'المياه والصرف',
      description: 'يمثل البصمة الكربونية للطاقة اللازمة لتحلية وضخ ومعالجة كل متر مكعب (1000 لتر) من المياه.',
      formula: 'kg CO₂e = m³ × 0.298',
      source: 'الشركة القابضة لمياه الشرب والصرف الصحي (HCWW)',
      unit: 'kg CO₂e لكل 1 m³',
    },
    {
      id: 'transport',
      icon: Car,
      iconColor: 'text-emerald-400',
      title: 'النقل والمواصلات',
      description: 'تعتمد الحسابات على المسافة المقطوعة (km) ومتوسط كفاءة المركبة ونوع الوقود أو وسيلة النقل العام.',
      formula: 'kg CO₂e = km × معامل الوسيلة',
      source: 'الجهاز المركزي للتعبئة العامة والإحصاء (CAPMAS)',
      unit: 'kg CO₂e لكل 1 km',
    },
    {
      id: 'waste',
      icon: Trash2,
      iconColor: 'text-teal-400',
      title: 'المخلفات وإعادة التدوير',
      description: 'تُحسب تقديرات المواد المفروزة بمعاملات استرشادية لكل مادة (بلاستيك، كرتون، ألومنيوم)، مع التمييز الصارم بين الموثق وغير الموثق.',
      formula: 'kg CO₂e (تقديري) = kg × معامل المادة',
      source: 'جهاز تنظيم إدارة المخلفات (WMRA) و EPA WARM',
      unit: 'kg CO₂e لكل 1 kg مادة',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 pb-32 space-y-6" dir="rtl">
      {/* Header */}
      <header className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">كيف نحسب الأثر؟</h1>
              <p className="text-sm text-slate-300 mt-1">
                منهجية واضحة وبسيطة تشرح المعادلات والوحدات والفرق بين البيانات المدخلة والتقديرية والموثقة.
              </p>
            </div>
          </div>

          <Link
            to="/calculator"
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition"
          >
            <Calculator className="w-4 h-4" />
            <span>العودة إلى الحاسبة</span>
          </Link>
        </div>

        {/* 3 Status Meanings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-400/30">
              مدخل من المستخدم
            </span>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              قراءات عداد أو مسافات أو أوزان كتبها المستخدم بنفسه دون مراجعة مستندية بعد.
            </p>
          </div>
          <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-400/30">
              تقديري
            </span>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              ناتج حساب يعتمد على متوسطات وطنية أو معاملات استرشادية؛ مفيد للمقارنة والتوعية وليس قياساً مخبرياً.
            </p>
          </div>
          <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
              تم التحقق منه
            </span>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              لا يُمنح إلا عندما يرتبط الإدخال بوثيقة/إيصال أو مراجعة من شريك أو مسؤول مخول.
            </p>
          </div>
        </div>
      </header>

      {/* Interactive Calculator Check / Override */}
      <section className="bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              اختبر الحساب بنفسك أو صحّح المعامل
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              جرّب تغيير الكمية أو معامل الانبعاث لتفهم كيف يخرج الرقم النهائي بوضوح (الوحدة الموحدة: kg CO₂e).
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSelectSector(testSector)}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(SECTOR_DEFAULTS) as TestSector[]).map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => handleSelectSector(sec)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold border transition ${
                testSector === sec
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-950/60 text-slate-300 border-white/10 hover:text-white'
              }`}
            >
              {SECTOR_DEFAULTS[sec].label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label htmlFor="meth-amount" className="block text-xs font-bold text-slate-300">
              الكمية ({currentMeta.unit})
            </label>
            <input
              id="meth-amount"
              type="number"
              min="0"
              step="any"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full min-h-[44px] bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-sm font-black text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="meth-factor" className="block text-xs font-bold text-slate-300">
              معامل التحويل (kg CO₂e / وحدة)
            </label>
            <input
              id="meth-factor"
              type="number"
              min="0"
              step="0.001"
              value={factorInput}
              onChange={(e) => setFactorInput(e.target.value)}
              className="w-full min-h-[44px] bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-sm font-black text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4">
            <p className="text-[11px] font-bold text-slate-400">النتيجة (تقديري)</p>
            <p className="text-2xl font-black text-emerald-300 tabular-nums mt-0.5">
              {computedKg.toFixed(2)} <span className="text-xs">kg CO₂e</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ويعادل: {computedTons.toFixed(4)} طن متري (1 طن = 1000 كجم)
            </p>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-white/10 rounded-xl p-3.5 text-xs text-slate-300 space-y-1">
          <p>
            <strong>المصدر:</strong> {currentMeta.source}
          </p>
          <p className="text-slate-400">
            <strong>الافتراضات:</strong> {currentMeta.assumptions}
          </p>
        </div>
      </section>

      {/* Sector Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <article
              key={section.id}
              className="bg-slate-900/75 border border-white/10 rounded-3xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${section.iconColor}`} />
                  </div>
                  <h2 className="text-lg font-black text-white">{section.title}</h2>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-400/30">
                  معامل تقديري
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{section.description}</p>

              <div className="bg-slate-950/70 border border-dashed border-white/15 rounded-2xl p-3.5 space-y-1">
                <p className="text-[11px] text-slate-400 font-bold">المعادلة والوحدة ({section.unit})</p>
                <p className="text-sm font-mono font-bold text-emerald-300" dir="ltr">
                  {section.formula}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Database className="w-4 h-4 text-sky-400 shrink-0" />
                <span>المصدر: <strong className="text-slate-200">{section.source}</strong></span>
              </div>
            </article>
          );
        })}
      </section>

      <div className="bg-slate-900/75 border border-white/10 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          لا يخلط MoEco بين الكيلوجرام والطن؛ جميع الأرقام الأساسية تُعرض بالكيلوجرام مكافئ ثاني أكسيد الكربون (kg CO₂e) مع ذكر الفترة ومصدر المعامل بوضوح.
        </p>
      </div>
    </div>
  );
};

export default Methodology;
