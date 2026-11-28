/// Official Egyptian digital services and emergency hotlines.
/// Source: the repo's curated seed (database/GOV_SERVICES_SETUP.sql),
/// all official government/operator links. Opens externally; no data
/// is fabricated locally.

class GovService {
  final String nameAr;
  final String catAr;
  final String catEn;
  final String url;
  const GovService(this.nameAr, this.catAr, this.catEn, this.url);
}

const govServices = <GovService>[
  GovService('استكمال عداد كهرباء', 'مرافق', 'Utilities', 'https://digital.gov.eg/utilities/electricity-meter'),
  GovService('استعلام فاتورة الكهرباء', 'مرافق', 'Utilities', 'https://digital.gov.eg/utilities/electricity-bill'),
  GovService('سداد فاتورة المياه', 'مرافق', 'Utilities', 'https://digital.gov.eg/utilities/water-bill'),
  GovService('سداد فاتورة الغاز الطبيعي', 'مرافق', 'Utilities', 'https://digital.gov.eg/utilities/gas-bill'),
  GovService('شحن رصيد محمول', 'مرافق', 'Utilities', 'https://digital.gov.eg/utilities/mobile-recharge'),
  GovService('تفعيل بطاقة التموين', 'تموين', 'Ration cards', 'https://digital.gov.eg/supply/activate-card'),
  GovService('إضافة مولود جديد', 'تموين', 'Ration cards', 'https://digital.gov.eg/supply/add-newborn'),
  GovService('نقل بطاقة تموين', 'تموين', 'Ration cards', 'https://digital.gov.eg/supply/transfer-card'),
  GovService('بدل فاقد بطاقة تموين', 'تموين', 'Ration cards', 'https://digital.gov.eg/supply/replace-card'),
  GovService('الاستعلام عن السلع التموينية', 'تموين', 'Ration cards', 'https://digital.gov.eg/supply/check-rations'),
  GovService('الاستعلام عن وثيقة', 'توثيق', 'Documentation', 'https://digital.gov.eg/documentation/inquire'),
  GovService('إصدار توكيل', 'توثيق', 'Documentation', 'https://digital.gov.eg/documentation/power-of-attorney'),
  GovService('طلب صورة رسمية', 'توثيق', 'Documentation', 'https://digital.gov.eg/documentation/certified-copy'),
  GovService('بدل فاقد الرقم القومي', 'أحوال مدنية', 'Civil registry', 'https://digital.gov.eg/civil/replace-id'),
  GovService('استخراج قيد ميلاد', 'أحوال مدنية', 'Civil registry', 'https://digital.gov.eg/civil/birth-certificate'),
  GovService('قيد عائلي', 'أحوال مدنية', 'Civil registry', 'https://digital.gov.eg/civil/family-record'),
  GovService('شهادة وفاة', 'أحوال مدنية', 'Civil registry', 'https://digital.gov.eg/civil/death-certificate'),
  GovService('الاستعلام عن المخالفات المرورية', 'مرور', 'Traffic', 'https://digital.gov.eg/traffic/violations'),
  GovService('تظلم من مخالفة مرورية', 'مرور', 'Traffic', 'https://digital.gov.eg/traffic/objection'),
  GovService('تجديد رخصة المركبة', 'مرور', 'Traffic', 'https://digital.gov.eg/traffic/renew-license'),
  GovService('خدمات رخصة القيادة', 'مرور', 'Traffic', 'https://digital.gov.eg/traffic/driving-license'),
  GovService('استخراج قيد تجاري', 'سجل تجاري', 'Commercial registry', 'https://digital.gov.eg/commercial/extract'),
  GovService('تجديد السجل التجاري', 'سجل تجاري', 'Commercial registry', 'https://digital.gov.eg/commercial/renew'),
  GovService('الاستعلام عن السجل التجاري', 'سجل تجاري', 'Commercial registry', 'https://digital.gov.eg/commercial/inquire'),
  GovService('حجز موعد طبي', 'صحة', 'Health', 'https://digital.gov.eg/health/book-appointment'),
  GovService('نتائج التحاليل', 'صحة', 'Health', 'https://digital.gov.eg/health/test-result'),
  GovService('التقرير الطبي', 'صحة', 'Health', 'https://digital.gov.eg/health/medical-report'),
  GovService('التطعيمات', 'صحة', 'Health', 'https://digital.gov.eg/health/vaccinations'),
  GovService('نتيجة الثانوية العامة', 'تعليم', 'Education', 'https://digital.gov.eg/education/high-school-result'),
  GovService('التنسيق الإلكتروني', 'تعليم', 'Education', 'https://digital.gov.eg/education/university-coordination'),
  GovService('نتيجة الإعدادية', 'تعليم', 'Education', 'https://digital.gov.eg/education/preparatory-result'),
  GovService('حجز تذكرة قطار', 'مواصلات', 'Transport', 'https://enr.gov.eg'),
  GovService('حجز تذكرة مترو', 'مواصلات', 'Transport', 'https://cairometro.gov.eg'),
  GovService('مواعيد القطارات', 'مواصلات', 'Transport', 'https://enr.gov.eg'),
  GovService('تكافل وكرامة', 'تضامن اجتماعي', 'Social solidarity', 'https://tk.moss.gov.eg'),
  GovService('بطاقة الخدمات المتكاملة', 'تضامن اجتماعي', 'Social solidarity', 'https://rdis.moss.gov.eg'),
  GovService('الاستعلام عن كارت الخدمات', 'تضامن اجتماعي', 'Social solidarity', 'https://www.moss.gov.eg'),
  GovService('رول جلسة', 'عدل', 'Justice', 'https://moj.gov.eg'),
  GovService('إقامة دعوى مدنية', 'عدل', 'Justice', 'https://digital.gov.eg'),
  GovService('تأسيس شركة', 'استثمار', 'Investment', 'https://www.gafi.gov.eg'),
  GovService('WE Pay', 'مدفوعات', 'Payments', 'https://wepay.eg'),
  GovService('فوري', 'مدفوعات', 'Payments', 'https://fawry.com'),
  GovService('منصة الكهرباء الموحدة', 'مدفوعات', 'Payments', 'https://eservices.eehc.gov.eg'),
  GovService('استخراج كارت الفلاح', 'خدمات عامة', 'General services', 'https://agriculture.gov.eg/farmer-card'),
  GovService('حصر الأراضي الزراعية', 'خدمات عامة', 'General services', 'https://agriculture.gov.eg/land-survey'),
  GovService('تراخيص المبيدات', 'خدمات عامة', 'General services', 'https://agriculture.gov.eg/pesticides'),
  GovService('خدمات البريد المصري', 'خدمات عامة', 'General services', 'https://egyptpost.org'),
  GovService('حجز تذكرة متحف', 'خدمات عامة', 'General services', 'https://egymonuments.com'),
  GovService('التصالح في مخالفات البناء', 'خدمات عامة', 'General services', 'https://digital.gov.eg/building-violations'),
  GovService('حجز وحدة سكنية', 'خدمات عامة', 'General services', 'https://hdb.gov.eg/reservation'),
];

class Hotline {
  final String number;
  final String labelAr;
  final String labelEn;
  const Hotline(this.number, this.labelAr, this.labelEn);
}

/// Verified official Egyptian emergency/utility hotlines.
const hotlines = <Hotline>[
  Hotline('123', 'الإسعاف', 'Ambulance'),
  Hotline('122', 'الشرطة', 'Police'),
  Hotline('180', 'المطافئ', 'Fire brigade'),
  Hotline('121', 'طوارئ الكهرباء', 'Electricity emergency'),
  Hotline('125', 'طوارئ المياه والصرف', 'Water emergency'),
  Hotline('129', 'طوارئ الغاز الطبيعي', 'Natural gas emergency'),
  Hotline('126', 'شرطة السياحة', 'Tourist police'),
  Hotline('19808', 'شكاوى وزارة البيئة', 'Ministry of Environment complaints'),
];

/// Water-saving estimator, same assumptions as the web app:
/// dripping tap ~15 L/day, aerator ~20 L/person/day, shower ~9 L/min.
/// Indicative estimates, not meter readings (label says so in the UI).
double estimateMonthlyWaterSavings({
  required int householdMembers,
  required bool fixDrippingTap,
  required bool installAerator,
  required double shorterShowerMinutes,
}) {
  final tap = fixDrippingTap ? 15 * 30 : 0;
  final aerator = installAerator ? 20 * householdMembers * 30 : 0;
  final shower =
      (shorterShowerMinutes < 0 ? 0 : shorterShowerMinutes) * 9 * householdMembers * 30;
  return (tap + aerator + shower).toDouble();
}

/// HCWW-derived factor: 0.298 kg CO2e per m3 of water.
double waterSavingsCo2Kg(double monthlyLiters) => monthlyLiters / 1000 * 0.298;


class WaterTip {
  final String titleAr;
  final String titleEn;
  final String descAr;
  final String descEn;
  const WaterTip(this.titleAr, this.titleEn, this.descAr, this.descEn);
}

/// Practical household water-saving tips (from the web app's WaterSaving page).
const waterTips = <WaterTip>[
  WaterTip(
    'فحص سيفون المرحاض بصورة دورية',
    'Check the toilet flush valve regularly',
    'تسريب السيفون الصامت قد يهدر كميات كبيرة يوميًا؛ ضع نقطتي ملون طعام في الخزان وتأكد من عدم نزوله للمرحاض دون سحب.',
    'A silent flush leak can waste large amounts daily; put two drops of food coloring in the tank and make sure none reaches the bowl without flushing.',
  ),
  WaterTip(
    'تركيب مهوي (Aerator) على الحنفيات',
    'Install an aerator on faucets',
    'يمزج الهواء بالماء ويقلل التدفق مع الحفاظ على قوة الغسيل، وهي خطوة منخفضة التكلفة للأسر.',
    'Mixes air with water and reduces flow while keeping washing power; a low-cost step for households.',
  ),
  WaterTip(
    'إغلاق الصنبور أثناء التنظيف وغسل الأواني',
    'Turn off the tap while brushing and washing dishes',
    'فتح الماء فقط عند الشطف بدلًا من الجريان المستمر يخفض الاستهلاك التقديري بشكل ملموس.',
    'Running water only when rinsing instead of a continuous flow noticeably reduces estimated consumption.',
  ),
  WaterTip(
    'استخدام الدلو بدلًا من الخرطوم في التنظيف',
    'Use a bucket instead of a hose for cleaning',
    'غسل السيارات أو الشرفات بالخرطوم يستهلك عشرات اللترات في دقائق قليلة.',
    'Washing cars or balconies with a hose consumes tens of liters in a few minutes.',
  ),
];
