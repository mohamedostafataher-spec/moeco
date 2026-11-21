import { supabase } from './server/services/supabaseClient.ts';

const advancedServices = [
  {
    name_ar: "تجديد بطاقة الرقم القومي",
    name_en: "National ID Renewal",
    category: "الأحوال المدنية",
    description_ar: "خدمة تجديد بطاقة الرقم القومي المنتهية المتاحة عبر المنصات الرقمية لتوفير الوقت وتقليل المشاوير والمطبوعات.",
    description_en: "Renew national ID online to save time and reduce carbon footprint.",
    url: "https://digital.gov.eg/",
    estimated_time: "١٥ دقيقة (أونلاين)",
    is_active: true,
    provider: "وزارة الداخلية",
    carbon_factor_type: "transport_avoided",
    estimated_saving_kg: 4.2,
    is_featured: true,
    popularity_score: 98,
    usage_count: 45030,
    icon: "User",
    steps: [
      { text_ar: "تسجيل الدخول لمصر الرقمية", duration: 1 },
      { text_ar: "بدء خدمة تجديد البطاقة", duration: 2 },
      { text_ar: "إرفاق الأوراق والتأكيد", duration: 5 },
      { text_ar: "دفع الرسوم إلكترونياً", duration: 3 },
      { text_ar: "اختيار التوصيل للمنزل", duration: 1 }
    ],
    required_documents: [
      { name_ar: "صورة البطاقة القديمة", type: "أساسي" },
      { name_ar: "إيصال مرافق (للعنوان الجديد)", type: "عند الحاجة" },
      { name_ar: "وثيقة إثبات الوظيفة", type: "عند الحاجة" }
    ],
    office_location: {
      map_query: "أقرب قطاع أحوال مدنية",
      address_ar: "فروع السجل المدني المتطورة",
      crowd_status: 75,
      best_time: "الثلاثاء - ٩:٠٠ صباحاً",
      is_online: true,
      needs_reservation: false,
      fees_ar: "٧٥ - ١٧٥ جنيهاً (حسب الاستمارة)",
      rating: 4.5
    },
    working_hours: "٨:٠٠ ص - ٩:٠٠ م"
  },
  {
    name_ar: "تجديد رخصة القيادة",
    name_en: "Driver's License Renewal",
    category: "المرور",
    description_ar: "تجديد رخصة القيادة الملاكي من خلال البوابة الرقمية، مع الاستعلام وتسديد المخالفات.",
    description_en: "Renew personal driver's license online.",
    url: "https://traffic.moi.gov.eg/",
    estimated_time: "٢٠ دقيقة (أونلاين)",
    is_active: true,
    provider: "الإدارة العامة للمرور",
    carbon_factor_type: "transport_avoided",
    estimated_saving_kg: 5.5,
    is_featured: true,
    popularity_score: 95,
    usage_count: 32000,
    icon: "Car",
    steps: [
      { text_ar: "الاستعلام عن المخالفات ودفعها", duration: 5 },
      { text_ar: "رفع شهادة براءة الذمة", duration: 2 },
      { text_ar: "طلب تجديد الرخصة", duration: 3 },
      { text_ar: "سداد رسوم التجديد والتوصيل", duration: 2 }
    ],
    required_documents: [
      { name_ar: "شهادة براءة ذمة", type: "أساسي" },
      { name_ar: "صورة الرخصة السابقة", type: "أساسي" },
      { name_ar: "شهادة طبية (نظر وباطنة)", type: "أساسي" }
    ],
    office_location: {
      map_query: "وحدات المرور الالكترونية",
      address_ar: "وحدات المرور أو المولات التجارية",
      crowd_status: 80,
      best_time: "الخميس - ٨:٠٠ صباحاً",
      is_online: true,
      needs_reservation: true,
      fees_ar: "٦٥٠ - ١٢٠٠ جنيهاً (تختلف حسب السيارات)",
      rating: 4.1
    },
    working_hours: "٨:٠٠ ص - ٣:٠٠ م"
  },
  {
    name_ar: "سداد فاتورة الكهرباء",
    name_en: "Pay Electricity Bill",
    category: "الكهرباء",
    description_ar: "الدفع الإلكتروني لعدادات الكهرباء القديمة أو شحن الكروت المسبقة عبر NFC.",
    description_en: "Pay electricity bills online and recharge card via NFC.",
    url: "https://www.eehc.gov.eg/",
    estimated_time: "٥ دقائق",
    is_active: true,
    provider: "وزارة الكهرباء والطاقة المتجددة",
    carbon_factor_type: "paper_avoided",
    estimated_saving_kg: 1.2,
    is_featured: true,
    popularity_score: 99,
    usage_count: 156000,
    icon: "Zap",
    steps: [
      { text_ar: "إدخال رقم السداد الإلكتروني", duration: 1 },
      { text_ar: "تأكيد قيمة الفاتورة", duration: 1 },
      { text_ar: "اختيار طريقة الدفع الآمنة", duration: 2 }
    ],
    required_documents: [],
    office_location: {
      map_query: "شركة توزيع الكهرباء",
      address_ar: "فروع ومراكز خدمة العملاء",
      crowd_status: 40,
      best_time: "أونلاين متاح ٢٤ ساعة",
      is_online: true,
      needs_reservation: false,
      fees_ar: "بدون رسوم إضافية للمدفوعات الرقمية",
      rating: 4.8
    },
    working_hours: "متاح إلكترونياً على مدار الساعة"
  },
  {
    name_ar: "استخراج جواز السفر",
    name_en: "Passport Issuance",
    category: "السفر والهجرة",
    description_ar: "إصدار وتجديد جوازات السفر الإلكترونية وحجز المواعيد إلكترونيا.",
    description_en: "Issue/Renew electronic passports.",
    url: "https://passports.gov.eg/",
    estimated_time: "ساعة (بالفرع)",
    is_active: true,
    provider: "الإدارة العامة للجوازات والهجرة",
    carbon_factor_type: "efficiency",
    estimated_saving_kg: 2.1,
    is_featured: false,
    popularity_score: 85,
    usage_count: 21000,
    icon: "Briefcase",
    steps: [
      { text_ar: "حجز موعد مسبق أونلاين", duration: 2 },
      { text_ar: "تجهيز الأوراق والذهاب للفرع", duration: 0 },
      { text_ar: "التقاط البصمة والصورة الحيوية", duration: 15 },
      { text_ar: "الدفع والاستلام في نفس اليوم", duration: 10 }
    ],
    required_documents: [
      { name_ar: "الرقم القومي الساري", type: "أساسي" },
      { name_ar: "ثلاث صور شخصية بخلفية بيضاء", type: "أساسي" },
      { name_ar: "الموقف من التجنيد (للذكور)", type: "أساسي" }
    ],
    office_location: {
      map_query: "إدارة الجوازات والهجرة العباسية",
      address_ar: "الإدارة العامة للجوازات بالعباسية والفروع",
      crowd_status: 90,
      best_time: "الأحد - ٨:٣٠ صباحاً",
      is_online: false,
      needs_reservation: true,
      fees_ar: "١٠٠٠ جنيهاً (العادي) - ١٤٥٠ جنيهاً (الفوري)",
      rating: 4.0
    },
    working_hours: "٨:٠٠ ص - ٢:٣٠ م"
  },
  {
    name_ar: "حجز عيادات التأمين الصحي الشامل",
    name_en: "UHIA Clinic Reservation",
    category: "الصحة",
    description_ar: "منظومة إلكترونية لحجز مواعيد العيادات الخارجية بالتأمين الصحي الشامل لمنع التكدس.",
    description_en: "Online reservation for Universal Health Insurance clinics.",
    url: "https://uhia.gov.eg/",
    estimated_time: "٥ دقائق",
    is_active: true,
    provider: "هيئة الرعاية الصحية",
    carbon_factor_type: "efficiency",
    estimated_saving_kg: 3.8,
    is_featured: true,
    popularity_score: 92,
    usage_count: 67000,
    icon: "Heart",
    steps: [
      { text_ar: "تسجيل الدخول برقم الهوية", duration: 1 },
      { text_ar: "اختيار التخصص والمستشفى", duration: 2 },
      { text_ar: "تأكيد الميعاد واستلام الكود", duration: 1 }
    ],
    required_documents: [
      { name_ar: "كارنيه التأمين الصحي (أو البطاقة)", type: "أساسي" },
      { name_ar: "التحويل من الوحدة الصحية", type: "للتخصصات المتقدمة" }
    ],
    office_location: {
      map_query: "مستشفيات التأمين الصحي الشامل",
      address_ar: "مراكز ووحدات طب الأسرة المحيطة",
      crowd_status: 50,
      best_time: "الفترة المسائية (إن وجدت)",
      is_online: true,
      needs_reservation: true,
      fees_ar: "مساهمة رمزية ١٠% للمنظومة الجديدة",
      rating: 4.6
    },
    working_hours: "العيادات: ٨:٠٠ ص - ٨:٠٠ م"
  }
];

async function seed() {
  console.log("Emptying old services...");
  const { error: delErr } = await supabase.from('government_services').delete().gt('id', -1);
  if(delErr) console.log("Del error:", delErr);
  
  console.log("Inserting new advanced data...");
  const { data, error } = await supabase.from('government_services').insert(advancedServices).select();
  if (error) {
    console.error("Insert error:", error.message);
  } else {
    console.log(`Successfully inserted ${data?.length} services.`);
  }
}
seed();
