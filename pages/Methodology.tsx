import React, { useState } from 'react';
import {
  BookOpen,
  Database,
  Zap,
  Droplets,
  Car,
  Trash2,
  Info,
  Calculator,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

type TestSector = 'electricity' | 'water' | 'transport' | 'recycling';

const SECTOR_DEFAULTS: Record<
  TestSector,
  {
    label: string;
    labelEn: string;
    unit: string;
    unitEn: string;
    defaultAmount: number;
    defaultFactor: number;
    source: string;
    sourceEn: string;
    assumptions: string;
    assumptionsEn: string;
  }
> = {
  electricity: {
    label: 'الكهرباء المنزلية',
    labelEn: 'Home electricity',
    unit: 'كيلوواط ساعة (kWh)',
    unitEn: 'kilowatt-hour (kWh)',
    defaultAmount: 250,
    defaultFactor: 0.533,
    source: 'الشركة القابضة لكهرباء مصر (EEHC) + IPCC',
    sourceEn: 'Egyptian Electricity Holding Company (EEHC) + IPCC',
    assumptions: 'متوسط معامل الشبكة القومية المصرية لمزيج التوليد؛ يختلف حسب التحديث السنوي.',
    assumptionsEn: 'Average emission factor of the Egyptian national grid generation mix; changes with the annual update.',
  },
  water: {
    label: 'المياه والصرف',
    labelEn: 'Water & wastewater',
    unit: 'متر مكعب (m³)',
    unitEn: 'cubic meter (m³)',
    defaultAmount: 15,
    defaultFactor: 0.298,
    source: 'الشركة القابضة لمياه الشرب والصرف الصحي (HCWW)',
    sourceEn: 'Holding Company for Water and Wastewater (HCWW)',
    assumptions: 'يمثل الطاقة التقديرية للضخ والتنقية والمعالجة لكل متر مكعب؛ لا يشمل فواقد الشبكة.',
    assumptionsEn: 'Represents the estimated energy for pumping, purification and treatment per cubic meter; network losses not included.',
  },
  transport: {
    label: 'المواصلات (سيارة متوسطة)',
    labelEn: 'Transport (mid-size car)',
    unit: 'كيلومتر (km)',
    unitEn: 'kilometer (km)',
    defaultAmount: 100,
    defaultFactor: 0.185,
    source: 'الجهاز المركزي للتعبئة العامة والإحصاء (CAPMAS) ومعاملات الوقود',
    sourceEn: 'CAPMAS and published fuel emission factors',
    assumptions: 'متوسط استهلاك 8 لتر بنزين/100 كم؛ ينخفض المعامل كثيراً عند استخدام المترو أو القطار.',
    assumptionsEn: 'Average consumption of 8L gasoline/100km; the factor drops sharply when using metro or train.',
  },
  recycling: {
    label: 'تدوير البلاستيك (PET)',
    labelEn: 'Plastic recycling (PET)',
    unit: 'كيلوجرام (kg)',
    unitEn: 'kilogram (kg)',
    defaultAmount: 5,
    defaultFactor: 1.5,
    source: 'معاملات تدوير استرشادية (EPA WARM / WMRA)',
    sourceEn: 'Indicative recycling factors (EPA WARM / WMRA)',
    assumptions: 'أثر تجنّب انبعاثات تقديري فقط، ولا يُعد موثقاً دون إيصال وزن من نقطة معتمدة.',
    assumptionsEn: 'Estimated avoided-emissions impact only; not verified without a weighing receipt from an accredited point.',
  },
};

const Methodology: React.FC = () => {
  const { language } = useApp();
  const ar = language === 'ar';
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
      iconColor: 'text-amber-700',
      iconBg: 'bg-amber-50 border-amber-200',
      title: 'الكهرباء والطاقة',
      titleEn: 'Electricity & energy',
      description: 'يُحسب أثر الكهرباء بضرب الاستهلاك الشهري (kWh) في معامل الانبعاث التقديري للشبكة القومية المصرية.',
      descriptionEn: 'Electricity impact is calculated by multiplying monthly consumption (kWh) by the estimated emission factor of the Egyptian national grid.',
      formula: 'kg CO₂e = kWh × 0.533',
      formulaEn: 'kg CO₂e = kWh × 0.533',
      source: 'الشركة القابضة لكهرباء مصر (EEHC) وتقارير IPCC',
      sourceEn: 'Egyptian Electricity Holding Company (EEHC) and IPCC reports',
      unit: 'kg CO₂e لكل 1 kWh',
      unitEn: 'kg CO₂e per 1 kWh',
    },
    {
      id: 'water',
      icon: Droplets,
      iconColor: 'text-sky-700',
      iconBg: 'bg-sky-50 border-sky-200',
      title: 'المياه والصرف',
      titleEn: 'Water & wastewater',
      description: 'يمثل البصمة الكربونية للطاقة اللازمة لتحلية وضخ ومعالجة كل متر مكعب (1000 لتر) من المياه.',
      descriptionEn: 'Represents the carbon footprint of the energy needed to desalinate, pump and treat each cubic meter (1000 liters) of water.',
      formula: 'kg CO₂e = m³ × 0.298',
      formulaEn: 'kg CO₂e = m³ × 0.298',
      source: 'الشركة القابضة لمياه الشرب والصرف الصحي (HCWW)',
      sourceEn: 'Holding Company for Water and Wastewater (HCWW)',
      unit: 'kg CO₂e لكل 1 m³',
      unitEn: 'kg CO₂e per 1 m³',
    },
    {
      id: 'transport',
      icon: Car,
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-50 border-emerald-200',
      title: 'النقل والمواصلات',
      titleEn: 'Transport',
      description: 'تعتمد الحسابات على المسافة المقطوعة (km) ومتوسط كفاءة المركبة ونوع الوقود أو وسيلة النقل العام.',
      descriptionEn: 'Calculations rely on distance traveled (km), average vehicle efficiency, and fuel type or public transport mode.',
      formula: 'kg CO₂e = km × معامل الوسيلة',
      formulaEn: 'kg CO₂e = km × mode factor',
      source: 'الجهاز المركزي للتعبئة العامة والإحصاء (CAPMAS)',
      sourceEn: 'CAPMAS',
      unit: 'kg CO₂e لكل 1 km',
      unitEn: 'kg CO₂e per 1 km',
    },
    {
      id: 'waste',
      icon: Trash2,
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-50 border-emerald-200',
      title: 'المخلفات وإعادة التدوير',
      titleEn: 'Waste & recycling',
      description: 'تُحسب تقديرات المواد المفروزة بمعاملات استرشادية لكل مادة (بلاستيك، كرتون، ألومنيوم)، مع التمييز الصارم بين الموثق وغير الموثق.',
      descriptionEn: 'Sorted-material estimates use indicative factors per material (plastic, cardboard, aluminum), with a strict distinction between verified and unverified.',
      formula: 'kg CO₂e (تقديري) = kg × معامل المادة',
      formulaEn: 'kg CO₂e (est.) = kg × material factor',
      source: 'جهاز تنظيم إدارة المخلفات (WMRA) و EPA WARM',
      sourceEn: 'Waste Management Regulatory Authority (WMRA) and EPA WARM',
      unit: 'kg CO₂e لكل 1 kg مادة',
      unitEn: 'kg CO₂e per 1 kg material',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12" dir={ar ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{ar ? 'كيف نحسب الأثر؟' : 'How do we calculate impact?'}</h1>
              <p className="text-sm text-slate-600 mt-1">
                {ar
                  ? 'منهجية واضحة وبسيطة تشرح المعادلات والوحدات والفرق بين البيانات المدخلة والتقديرية والموثقة.'
                  : 'A clear, simple methodology explaining the formulas, units, and the difference between user-entered, estimated, and verified data.'}
              </p>
            </div>
          </div>

          <Link
            to="/calculator"
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors"
          >
            <Calculator className="w-4 h-4" />
            <span>{ar ? 'الانتقال إلى الحاسبة' : 'Go to the calculator'}</span>
          </Link>
        </div>

        {/* 3 Status Meanings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
            <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
              {ar ? 'إدخال المستخدم' : 'User input'}
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              {ar
                ? 'قراءات عداد أو مسافات أو أوزان كتبها المستخدم بنفسه دون مراجعة مستندية بعد.'
                : 'Meter readings, distances, or weights typed by the user, not yet document-verified.'}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
            <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {ar ? 'تقدير محسوب' : 'Calculated estimate'}
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              {ar
                ? 'ناتج حساب يعتمد على متوسطات وطنية أو معاملات استرشادية؛ مفيد للمقارنة والتوعية وليس قياسًا مخبريًا.'
                : 'A calculation based on national averages or indicative factors; useful for comparison and awareness, not a lab measurement.'}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
            <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {ar ? 'مصدر رسمي موثق' : 'Verified official source'}
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              {ar
                ? 'لا يُمنح إلا عندما يرتبط الإدخال بوثيقة أو مصدر رسمي معلن داخل التطبيق.'
                : 'Granted only when the entry is linked to a document or an official source published in the app.'}
            </p>
          </div>
        </div>
      </header>

      {/* Interactive Calculator Check */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-700" />
              {ar ? 'اختبر الحساب بنفسك أو عدّل المعامل' : 'Test the calculation yourself or adjust the factor'}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              {ar
                ? 'جرّب تغيير الكمية أو معامل الانبعاث لتفهم كيف يخرج الرقم النهائي بوضوح (الوحدة الموحدة: kg CO₂e).'
                : 'Try changing the amount or the emission factor to see clearly how the final number comes out (unified unit: kg CO₂e).'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSelectSector(testSector)}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{ar ? 'استعادة الافتراضي' : 'Reset to default'}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(SECTOR_DEFAULTS) as TestSector[]).map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => handleSelectSector(sec)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                testSector === sec
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {ar ? SECTOR_DEFAULTS[sec].label : SECTOR_DEFAULTS[sec].labelEn}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label htmlFor="meth-amount" className="block text-xs font-bold text-slate-700">
              {ar ? 'الكمية' : 'Amount'} ({ar ? currentMeta.unit : currentMeta.unitEn})
            </label>
            <input
              id="meth-amount"
              type="number"
              min="0"
              step="any"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full min-h-[44px] bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 tabular-nums focus:border-emerald-700 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="meth-factor" className="block text-xs font-bold text-slate-700">
              {ar ? 'معامل التحويل (kg CO₂e / وحدة)' : 'Conversion factor (kg CO₂e / unit)'}
            </label>
            <input
              id="meth-factor"
              type="number"
              min="0"
              step="0.001"
              value={factorInput}
              onChange={(e) => setFactorInput(e.target.value)}
              className="w-full min-h-[44px] bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 tabular-nums focus:border-emerald-700 focus:outline-none"
            />
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-xs font-bold text-emerald-800">{ar ? 'النتيجة (تقدير محسوب)' : 'Result (calculated estimate)'}</p>
            <p className="text-2xl font-extrabold text-slate-900 tabular-nums mt-0.5">
              {computedKg.toFixed(2)} <span className="text-xs font-bold text-slate-600">kg CO₂e</span>
            </p>
            <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
              {ar ? `ويعادل: ${computedTons.toFixed(4)} طن متري (1 طن = 1000 كجم)` : `Equivalent: ${computedTons.toFixed(4)} metric tons (1 ton = 1000 kg)`}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-1">
          <p>
            <strong>{ar ? 'المصدر:' : 'Source:'}</strong> {ar ? currentMeta.source : currentMeta.sourceEn}
          </p>
          <p className="text-slate-600">
            <strong>{ar ? 'الافتراضات:' : 'Assumptions:'}</strong> {ar ? currentMeta.assumptions : currentMeta.assumptionsEn}
          </p>
        </div>
      </section>

      {/* Sector Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <article
              key={section.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${section.iconBg}`}>
                    <Icon className={`w-5 h-5 ${section.iconColor}`} />
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900">{ar ? section.title : section.titleEn}</h2>
                </div>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {ar ? 'معامل تقديري' : 'Estimated factor'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{ar ? section.description : section.descriptionEn}</p>

              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3.5 space-y-1">
                <p className="text-xs text-slate-600 font-bold">{ar ? 'المعادلة والوحدة' : 'Formula & unit'} ({ar ? section.unit : section.unitEn})</p>
                <p className="text-sm font-mono font-bold text-emerald-800" dir="ltr">
                  {ar ? section.formula : (section.formulaEn || section.formula)}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Database className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  {ar ? 'المصدر:' : 'Source:'} <strong className="text-slate-900">{ar ? section.source : section.sourceEn}</strong>
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {ar
            ? 'لا يخلط MoEco بين الكيلوجرام والطن؛ جميع الأرقام الأساسية تُعرض بالكيلوجرام مكافئ ثاني أكسيد الكربون (kg CO₂e) مع ذكر الفترة ومصدر المعامل بوضوح.'
            : 'MoEco never mixes kilograms and tons; all core numbers are shown in kilograms of CO₂ equivalent (kg CO₂e) with the period and factor source stated clearly.'}
        </p>
      </div>
    </div>
  );
};

export default Methodology;

// English i18n pass completed 2026-11-28.
