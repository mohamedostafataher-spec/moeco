import React from 'react';
import { Link } from 'react-router-dom';
import {
  ScrollText,
  ShieldCheck,
  Leaf,
  UserCheck,
  AlertTriangle,
  Mail,
  Scale,
  Database,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Terms: React.FC = () => {
  const { language } = useApp();
  const ar = language === 'ar';

  const sections = [
    {
      icon: Leaf,
      iconBg: 'bg-emerald-50 border-emerald-200',
      iconColor: 'text-emerald-700',
      titleAr: '١. ما هو MoEco؟',
      titleEn: '1. What is MoEco?',
      bodyAr:
        'MoEco تطبيق توعية بيئية مجاني لمصر: حاسبة بصمة كربونية، تنظيم مسودات الشكاوى، أسعار وقود ومرافق، ومشاريع محلية من مصادر موثقة. الأرقام تقديرات للتوعية وليست بديلاً عن الفواتير أو القياسات الرسمية أو الاستشارة المتخصصة.',
      bodyEn:
        'MoEco is a free environmental awareness app for Egypt: a carbon footprint calculator, a complaint-draft organizer, fuel and utility prices, and local projects from verified sources. Numbers are awareness estimates, not a substitute for bills, official measurements, or professional advice.',
    },
    {
      icon: UserCheck,
      iconBg: 'bg-sky-50 border-sky-200',
      iconColor: 'text-sky-700',
      titleAr: '٢. حسابك واستخدامك',
      titleEn: '2. Your account and use',
      bodyAr:
        'استخدم التطبيق ببيانات صحيحة ولأغراض قانونية فقط. لا تحاول اختراق الخدمة أو إساءة استخدامها أو جمع بيانات مستخدمين آخرين. يحق لنا إيقاف أي حساب يسيء الاستخدام.',
      bodyEn:
        'Use the app with accurate information and for lawful purposes only. Do not attempt to breach the service, abuse it, or collect other users\' data. We may suspend any account that misuses the service.',
    },
    {
      icon: ShieldCheck,
      iconBg: 'bg-violet-50 border-violet-200',
      iconColor: 'text-violet-700',
      titleAr: '٣. الشكاوى تُقدَّم بنفسك',
      titleEn: '3. Complaints are submitted by you',
      bodyAr:
        'MoEco لا يرسل أي شكوى لأي جهة حكومية نيابة عنك. التطبيق ينظم مسودتك على جهازك ويرشدك للقنوات الرسمية الموثقة، وأنت من يقدّم الشكوى بنفسك ويتحمل مسؤولية محتواها.',
      bodyEn:
        'MoEco never sends complaints to any government body on your behalf. The app organizes your draft on your device and points you to verified official channels; you submit the complaint yourself and are responsible for its content.',
    },
    {
      icon: Database,
      iconBg: 'bg-amber-50 border-amber-200',
      iconColor: 'text-amber-700',
      titleAr: '٤. بياناتك وخصوصيتك',
      titleEn: '4. Your data and privacy',
      bodyAr:
        'بياناتك تخصك. سياسة الخصوصية تشرح بالتفصيل ما نجمعه وكيف تتحكم فيه وتصدّره أو تحذفه.',
      bodyEn:
        'Your data belongs to you. The privacy policy explains in detail what we collect and how you control, export, or delete it.',
      bodyLink: true,
    },
    {
      icon: AlertTriangle,
      iconBg: 'bg-rose-50 border-rose-200',
      iconColor: 'text-rose-700',
      titleAr: '٥. حدود المسؤولية',
      titleEn: '5. Limits of liability',
      bodyAr:
        'الخدمة تُقدَّم "كما هي" مجانًا. نسعى لدقة الأسعار والبيانات من مصادرها الرسمية ونحدّثها دوريًا، لكن قد تتأخر أو تتغير دون إشعار. لا نتحمل مسؤولية قرارات تُبنى على التقديرات المعروضة.',
      bodyEn:
        'The service is provided free, "as is". We work to keep prices and data accurate from official sources and update them regularly, but they may lag or change without notice. We are not liable for decisions made based on the estimates shown.',
    },
    {
      icon: Scale,
      iconBg: 'bg-slate-100 border-slate-300',
      iconColor: 'text-slate-700',
      titleAr: '٦. تعديل الشروط',
      titleEn: '6. Changes to these terms',
      bodyAr:
        'قد نحدّث هذه الشروط مع تطور التطبيق، وسنوضح تاريخ آخر تحديث أعلى الصفحة. استمرارك في الاستخدام بعد التحديث يعني موافقتك على النسخة الجديدة.',
      bodyEn:
        'We may update these terms as the app evolves, and the last-updated date at the top will change. Continued use after an update means you accept the new version.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12" dir={ar ? 'rtl' : 'ltr'}>
      <header className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {ar ? 'شروط الاستخدام' : 'Terms of Service'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {ar
                ? 'آخر تحديث: ٢٨ نوفمبر ٢٠٢٦. مكتوبة بلغة بسيطة عن قصد.'
                : 'Last updated: November 28, 2026. Written in plain language on purpose.'}
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-4">
          {ar
            ? 'باستخدامك MoEco أنت توافق على هذه الشروط. لو مش موافق على أي بند، ممكن تمسح حسابك وبياناتك في أي وقت من صفحة بياناتي.'
            : 'By using MoEco you agree to these terms. If you disagree with any part, you can delete your account and data at any time from the My Data page.'}
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <article
              key={sec.titleEn}
              className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${sec.iconBg}`}>
                  <Icon className={`w-5 h-5 ${sec.iconColor}`} />
                </div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {ar ? sec.titleAr : sec.titleEn}
                </h2>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {ar ? sec.bodyAr : sec.bodyEn}
              </p>
              {sec.bodyLink && (
                <Link
                  to="/privacy"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {ar ? 'افتح صفحة الخصوصية والبيانات' : 'Open the Privacy & Data page'}
                </Link>
              )}
            </article>
          );
        })}
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              {ar ? 'سؤال عن الشروط؟' : 'Question about the terms?'}
            </h2>
            <p className="text-xs text-slate-600">
              {ar ? 'راسلنا من صفحة "المزيد" داخل التطبيق.' : 'Reach us from the More page inside the app.'}
            </p>
          </div>
        </div>
        <Link
          to="/more"
          className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors"
        >
          {ar ? 'صفحة المزيد' : 'Open More'}
        </Link>
      </section>
    </div>
  );
};

export default Terms;
