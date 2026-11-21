import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  History,
  BookOpen,
  BarChart3,
  FileText,
  ShieldAlert,
  Droplets,
  Sun,
  Trash2,
  Utensils,
  Train,
  Landmark,
  User,
  Settings,
  Accessibility,
  BrainCircuit,
  Info,
  Building2,
  Zap,
  ChevronLeft,
  ChevronRight,
  Map as MapIcon,
  ShieldCheck,
  Database,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HubLinkItem {
  path: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface HubSection {
  id: string;
  headingAr: string;
  headingEn: string;
  items: HubLinkItem[];
}

const HUB_SECTIONS: HubSection[] = [
  {
    id: 'personal',
    headingAr: 'أدواتك الأساسية',
    headingEn: 'Core Personal Tools',
    items: [
      {
        path: '/my-home',
        titleAr: 'ملف بيتي (الكهرباء والمياه)',
        titleEn: 'My Home Utilities',
        descAr: 'تنظيم قراءات العداد وفواتير الكهرباء والمياه الخاصة بك في Supabase',
        descEn: 'Organize your personal electricity and water readings securely in Supabase',
        icon: Zap,
      },
      {
        path: '/my-complaints',
        titleAr: 'شكواي ما تضيعش',
        titleEn: 'Complaint Organizer',
        descAr: 'تجهيز مسودات الشكاوى والانتقال للقنوات الرسمية الموثقة ومتابعة الأرقام',
        descEn: 'Prepare complaint drafts, access verified portals, and track numbers',
        icon: FileText,
      },
      {
        path: '/local-projects',
        titleAr: 'مشروعي في منطقتي',
        titleEn: 'Local Public Projects',
        descAr: 'متابعة مشروعات منطقتك عند توفر مصدر رسمي موثق وحفظ ملاحظاتك',
        descEn: 'Follow verified public projects and keep private notes',
        icon: Building2,
      },
    ],
  },
  {
    id: 'impact',
    headingAr: 'حساب الأثر البيئي والشفافية',
    headingEn: 'Impact & Methodology',
    items: [
      {
        path: '/calculator',
        titleAr: 'حاسبة الأثر الكربوني',
        titleEn: 'Carbon Calculator',
        descAr: 'احسب الأثر التقديري لاستهلاك الطاقة والمياه والنقل بوحدة kg CO₂e',
        descEn: 'Estimate carbon footprint in kg CO₂e from your inputs',
        icon: Calculator,
      },
      {
        path: '/calculation-records',
        titleAr: 'سجل القياسات المحفوظة',
        titleEn: 'Calculation Records',
        descAr: 'مراجعة العمليات والسجلات التي أضفتها سابقًا',
        descEn: 'Review your recorded consumption calculations',
        icon: History,
      },
      {
        path: '/methodology',
        titleAr: 'كيف نحسب الأثر؟ (المنهجية)',
        titleEn: 'Methodology',
        descAr: 'المعادلات المستخدمة ومصادر المعاملات والتمييز بين التقديري والموثق',
        descEn: 'Formulas, emission factor sources, and verification policy',
        icon: BookOpen,
      },
      {
        path: '/dashboard',
        titleAr: 'لوحة المتابعة البيئية',
        titleEn: 'Environmental Dashboard',
        descAr: 'ملخص مرئي لنشاطك المسجل وجودة الهواء المباشرة',
        descEn: 'Visual summary of your logged activity and live air quality',
        icon: BarChart3,
      },
      {
        path: '/reports',
        titleAr: 'التقارير والشهادات',
        titleEn: 'Reports & Export',
        descAr: 'استعراض وتصدير تقارير الاستهلاك الخاصة بك',
        descEn: 'View and export your personal usage reports',
        icon: FileText,
      },
    ],
  },
  {
    id: 'community',
    headingAr: 'العمل المحلي والخدمات الموثقة',
    headingEn: 'Local Action & Services',
    items: [
      {
        path: '/eco-watch',
        titleAr: 'بلاغ بيئي محلي',
        titleEn: 'Environmental Report',
        descAr: 'توثيق الملاحظات البيئية المحلية مثل تسريب المياه أو تراكم المخلفات',
        descEn: 'Document local environmental issues like leaks or waste accumulation',
        icon: ShieldAlert,
      },
      {
        path: '/water-saving',
        titleAr: 'ترشيد المياه',
        titleEn: 'Water Saving',
        descAr: 'أدوات متابعة ترشيد المياه وحفظ البلاغات المرتبطة بها',
        descEn: 'Track water-saving notes and leak observations',
        icon: Droplets,
      },
      {
        path: '/heat-shade-map',
        titleAr: 'خريطة الحر والظل',
        titleEn: 'Heat & Shade Map',
        descAr: 'تحديد نقاط الحرارة المرتفعة واقتراح مناطق تشجير أو تظليل',
        descEn: 'Mark heat spots and suggest shade or tree planting points',
        icon: Sun,
      },
      {
        path: '/waste-to-income',
        titleAr: 'نقاط الفرز وإعادة التدوير',
        titleEn: 'Waste & Recycling',
        descAr: 'تسجيل أوزان الفرز الشخصية واستعراض نقاط الفرز المسجلة',
        descEn: 'Log sorted recyclable weights and inspect sorting points',
        icon: Trash2,
      },
      {
        path: '/surplus-food',
        titleAr: 'الفائض بدل الرمي',
        titleEn: 'Surplus Food',
        descAr: 'مساحة تنظيم مشاركة فائض الطعام وتقليل الهدر',
        descEn: 'Organize surplus food sharing to reduce waste',
        icon: Utensils,
      },
      {
        path: '/transport-hub',
        titleAr: 'النقل والمواصلات',
        titleEn: 'Transport Hub',
        descAr: 'مقارنة خيارات التنقل والأثر الكربوني للرحلات',
        descEn: 'Compare commute options and travel emissions',
        icon: Train,
      },
      {
        path: '/maps',
        titleAr: 'الخرائط البيئية',
        titleEn: 'Environmental Maps',
        descAr: 'عرض الخرائط والمواقع البيئية التفاعلية',
        descEn: 'Interactive environmental map views',
        icon: MapIcon,
      },
      {
        path: '/emergency',
        titleAr: 'أرقام الطوارئ والتنبيهات',
        titleEn: 'Emergency & Alerts',
        descAr: 'أرقام الطوارئ الرسمية المصرية والتنبيهات البيئية النشطة',
        descEn: 'Official Egyptian emergency hotlines and active alerts',
        icon: ShieldAlert,
      },
      {
        path: '/digital-gov',
        titleAr: 'بوابة الخدمات الرسمية',
        titleEn: 'Official Services Hub',
        descAr: 'روابط البوابات الحكومية الموثقة داخل التطبيق',
        descEn: 'Verified official government portal links',
        icon: Landmark,
      },
    ],
  },
  {
    id: 'account',
    headingAr: 'الخصوصية والبيانات وإعدادات التطبيق',
    headingEn: 'Privacy, Data & Settings',
    items: [
      {
        path: '/privacy',
        titleAr: 'الخصوصية وإدارة الموافقات',
        titleEn: 'Privacy & Consent',
        descAr: 'مراجعة الشفافية، التحكم في التحليلات الاختيارية، وربط البريد الإلكتروني',
        descEn: 'Review disclosures, manage optional analytics, and link email',
        icon: ShieldCheck,
      },
      {
        path: '/my-data',
        titleAr: 'بياناتي وتصديرها وحذفها',
        titleEn: 'My Data & Export',
        descAr: 'عرض سجلاتك في Supabase وتنزيل نسخة JSON وحذف كافة بياناتك نهائيًا',
        descEn: 'View Supabase records, download JSON export, or delete all data',
        icon: Database,
      },
      {
        path: '/owner-stats',
        titleAr: 'إحصاءات المالك المجمّعة',
        titleEn: 'Owner Usage Summary',
        descAr: 'إحصاءات استخدام مجمّعة ومجهولة الهوية محمية بصلاحية الخادم',
        descEn: 'Server-verified aggregate usage metrics for app owners',
        icon: Lock,
      },
      {
        path: '/profile',
        titleAr: 'حسابي',
        titleEn: 'My Profile',
        descAr: 'بيانات الجلسة والملف الشخصي المرتبط في التطبيق',
        descEn: 'Your session and profile details',
        icon: User,
      },
      {
        path: '/accessibility-settings',
        titleAr: 'إعدادات سهولة الوصول',
        titleEn: 'Accessibility Settings',
        descAr: 'حجم الخط، التباين العالي، القراءة الصوتية وتقليل الحركة',
        descEn: 'Font size, high contrast, voice readout, and reduced motion',
        icon: Accessibility,
      },
      {
        path: '/edge-ai',
        titleAr: 'المساعد التحليلي',
        titleEn: 'Smart Assistant',
        descAr: 'مساعد تحليل النصوص والاستهلاك عند الطلب',
        descEn: 'On-demand analysis assistant',
        icon: BrainCircuit,
      },
      {
        path: '/settings',
        titleAr: 'الإعدادات العامة',
        titleEn: 'General Settings',
        descAr: 'تفضيلات اللغة والمظهر والوصول لإعدادات البيانات',
        descEn: 'Language, appearance, and data preferences',
        icon: Settings,
      },
      {
        path: '/about',
        titleAr: 'عن MoEco',
        titleEn: 'About MoEco',
        descAr: 'رسالة التطبيق وفريق العمل والشفافية',
        descEn: 'Mission, credits, and transparency commitments',
        icon: Info,
      },
    ],
  },
];

const MoreHub: React.FC = () => {
  const { isRtl } = useApp();
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="bg-white border border-slate-200 rounded-2xl p-6 space-y-1.5">
        <h1 className="text-2xl font-extrabold text-slate-900">
          {isRtl ? 'المزيد من الأدوات والخدمات' : 'More Tools & Services'}
        </h1>
        <p className="text-sm text-slate-600">
          {isRtl
            ? 'كافة أدوات MoEco مرتبة بوضوح حسب الغرض لسهولة الوصول على الهاتف والكمبيوتر.'
            : 'All MoEco tools organized clearly by purpose.'}
        </p>
      </header>

      <div className="space-y-6">
        {HUB_SECTIONS.map((section) => (
          <section key={section.id} className="space-y-3" aria-labelledby={`hub-${section.id}`}>
            <h2
              id={`hub-${section.id}`}
              className="text-sm font-bold text-slate-500 px-1"
            >
              {isRtl ? section.headingAr : section.headingEn}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="min-h-[64px] bg-white border border-slate-200 hover:border-emerald-600/50 hover:bg-emerald-50/30 rounded-2xl p-4 flex items-center justify-between gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {isRtl ? item.titleAr : item.titleEn}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mt-0.5">
                          {isRtl ? item.descAr : item.descEn}
                        </p>
                      </div>
                    </div>
                    <ArrowIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default MoreHub;
