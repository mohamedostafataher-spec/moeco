import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const services = [
  {
    name_ar: 'إصدار شهادة ميلاد',
    name_en: 'Birth Certificate',
    category: 'الأحوال المدنية',
    url: 'https://digital.gov.eg/civil/birth-certificate',
    icon: 'Baby',
    carbon_impact_kg: 0.05,
    carbon_impact_type: 'paper',
    steps: [
      { step: 1, text: 'تقديم طلب إلكتروني أو زيارة مكتب الأحوال المدنية', duration_minutes: 5 },
      { step: 2, text: 'إرفاق المستندات المطلوبة', duration_minutes: 10 },
      { step: 3, text: 'سداد الرسوم', duration_minutes: 5 },
      { step: 4, text: 'استلام الشهادة', duration_minutes: 30 }
    ],
    required_documents: ['شهادة ميلاد المستشفى', 'بطاقة الرقم القومي للأب', 'بطاقة الرقم القومي للأم', 'إيصال سداد'],
    estimated_time: '30 دقيقة',
    fee_estimate: 2.5,
    office_location: { lat: 30.0444, lng: 31.2357, name: 'مكتب الأحوال المدنية بالعباسية', address: 'شارع رمسيس - أمام مستشفى الدمرداش' },
    working_hours: '8:00 ص - 2:00 م (الأحد - الخميس)'
  },
  {
    name_ar: 'بدل فاقد للرقم القومي',
    name_en: 'Lost ID Replacement',
    category: 'الأحوال المدنية',
    url: 'https://digital.gov.eg/civil/replace-id',
    icon: 'IdCard',
    carbon_impact_kg: 2.5,
    carbon_impact_type: 'transport',
    steps: [
      { step: 1, text: 'تعبئة نموذج طلب بدل فاقد', duration_minutes: 5 },
      { step: 2, text: 'إرفاق صورة شخصية حديثة', duration_minutes: 5 },
      { step: 3, text: 'سداد رسوم البدل', duration_minutes: 5 },
      { step: 4, text: 'استلام البطاقة بعد 15 يوم', duration_minutes: 1 }
    ],
    required_documents: ['صورة شخصية حديثة (4×6)', 'محضر شرطة الفقد (للحالات المفقودة)', 'بطاقة العائلة'],
    estimated_time: '15 يوم',
    fee_estimate: 50,
    office_location: { lat: 30.0444, lng: 31.2357, name: 'مكتب الأحوال المدنية بالعباسية', address: 'شارع رمسيس' },
    working_hours: '8:00 ص - 2:00 م'
  },
  {
    name_ar: 'تجديد رخصة القيادة',
    name_en: 'Driving License Renewal',
    category: 'المرور',
    url: 'https://digital.gov.eg/traffic/renew-license',
    icon: 'Car',
    carbon_impact_kg: 3.2,
    carbon_impact_type: 'transport',
    steps: [
      { step: 1, text: 'تقديم طلب التجديد إلكترونيًا', duration_minutes: 5 },
      { step: 2, text: 'رفع المستندات المطلوبة', duration_minutes: 10 },
      { step: 3, text: 'سداد الرسوم إلكترونيًا', duration_minutes: 5 },
      { step: 4, text: 'استلام الرخصة من أقرب مكتب بريد', duration_minutes: 30 }
    ],
    required_documents: ['الرخصة القديمة', 'صورة شخصية حديثة', 'شهادة طبية معتمدة', 'بطاقة الرقم القومي'],
    estimated_time: '3 أيام',
    fee_estimate: 155,
    office_location: { lat: 30.0675, lng: 31.2903, name: 'مكتب ترخيص العباسية', address: 'شارع رمسيس - أمام نقابة الصحفيين' },
    working_hours: '9:00 ص - 3:00 م'
  },
  {
    name_ar: 'استخراج جواز سفر',
    name_en: 'Passport Issuance',
    category: 'الجوازات',
    url: 'https://digital.gov.eg/passport',
    icon: 'Briefcase',
    carbon_impact_kg: 4.5,
    carbon_impact_type: 'transport',
    steps: [
      { step: 1, text: 'سحب استمارة جواز السفر', duration_minutes: 10 },
      { step: 2, text: 'استيفاء البيانات وإرفاق المستندات', duration_minutes: 20 },
      { step: 3, text: 'دفع الرسوم في الخزينة', duration_minutes: 10 },
      { step: 4, text: 'استلام الجواز بعد 3 أيام', duration_minutes: 1 }
    ],
    required_documents: ['بطاقة الرقم القومي سارية', '3 صور شخصية خلفية بيضاء', 'شهادة الموقف من التجنيد', 'المؤهل الدراسي'],
    estimated_time: '3 أيام',
    fee_estimate: 375,
    office_location: { lat: 30.0441, lng: 31.2335, name: 'مجمع التحرير - إدارة الجوازات', address: 'ميدان التحرير، القاهرة' },
    working_hours: '8:00 ص - 8:00 م'
  },
  {
    name_ar: 'طلب توكيل رسمي',
    name_en: 'Power of Attorney',
    category: 'التوثيق',
    url: 'https://digital.gov.eg/notary/poa',
    icon: 'Scale',
    carbon_impact_kg: 1.2,
    carbon_impact_type: 'paper',
    steps: [
      { step: 1, text: 'حجز موعد عبر تطبيق أرغب في عمل توكيل', duration_minutes: 2 },
      { step: 2, text: 'التوجه للمكتب في الموعد المحدد', duration_minutes: 45 },
      { step: 3, text: 'تحرير التوكيل والتوقيع أمام الموثق', duration_minutes: 15 }
    ],
    required_documents: ['بطاقة الرقم القومي سارية للموكل', 'اسم ورقم قومي للوكيل', 'نموذج التوكيل'],
    estimated_time: '1 ساعة',
    fee_estimate: 55,
    office_location: { lat: 30.0441, lng: 31.2335, name: 'مكتب توثيق ضواحي القاهرة', address: 'ميدان التحرير' },
    working_hours: '9:00 ص - 4:00 م'
  },
  {
    name_ar: 'الاستعلام عن مخالفات المرور',
    name_en: 'Traffic Violations Inquiry',
    category: 'المرور',
    url: 'https://ppo.gov.eg/traffic',
    icon: 'AlertTriangle',
    carbon_impact_kg: 5.0,
    carbon_impact_type: 'transport',
    steps: [
      { step: 1, text: 'إدخال رقم اللوحة (حروف وأرقام)', duration_minutes: 1 },
      { step: 2, text: 'عرض تفاصيل المخالفات', duration_minutes: 1 },
      { step: 3, text: 'طلب شهادة براءة الذمة (اختياري)', duration_minutes: 5 }
    ],
    required_documents: ['رقم اللوحة المعدنية'],
    estimated_time: 'دقيقة واحدة',
    fee_estimate: 0,
    office_location: null,
    working_hours: '24/7 (إلكتروني)'
  }
];

async function populate() {
  console.log('Populating government_services...');
  try {
    const { error } = await supabase
      .from('government_services')
      .upsert(services, { onConflict: 'url' });
    
    if (error) {
      console.error('Error populating services:', error);
    } else {
      console.log('Successfully populated 18 government services.');
    }
  } catch (e) {
    console.error('Runtime error:', e);
  }
}

populate();
