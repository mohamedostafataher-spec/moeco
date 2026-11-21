
export interface TransportModeGuide {
  id: string;
  titleAr: string;
  titleEn: string;
  lastUpdated: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  color: string;
  sections: {
    titleAr: string;
    titleEn: string;
    type: 'list' | 'grid' | 'table' | 'text';
    content: any;
  }[];
  tipsAr: string[];
  tipsEn: string[];
}

export const TRANSPORT_GUIDES: Record<string, TransportModeGuide> = {
  metro: {
    id: 'metro',
    titleAr: 'دليل مترو أنفاق القاهرة الكبرى 2026',
    titleEn: 'Cairo Metro Network Guide 2026',
    lastUpdated: 'أبريل 2026',
    descriptionAr: 'شبكة المترو تربط كبرى أحياء القاهرة الكبرى بخطوط سريعة وآمنة.',
    descriptionEn: 'The metro network connects major districts of Greater Cairo with fast and safe lines.',
    icon: 'Train',
    color: 'blue',
    sections: [
      {
        titleAr: 'أسعار التذاكر والاشتراكات',
        titleEn: 'Tickets & Subscriptions',
        type: 'grid',
        content: [
          { labelAr: 'المنطقة 1 (1-9 محطات)', labelEn: 'Zone 1 (1-9 St)', price: 10 },
          { labelAr: 'المنطقة 2 (10-16 محطة)', labelEn: 'Zone 2 (10-16 St)', price: 12 },
          { labelAr: 'المنطقة 3 (17-23 محطة)', labelEn: 'Zone 3 (17-23 St)', price: 15 },
          { labelAr: 'المنطقة 4 (+23 محطة)', labelEn: 'Zone 4 (+23 St)', price: 20 },
        ]
      },
      {
        titleAr: 'المحطات التبادلية',
        titleEn: 'Interchange Hubs',
        type: 'list',
        content: [
          { nameAr: 'الشهداء', nameEn: 'Shohadaa', lines: 'Line 1 & 2' },
          { nameAr: 'السادات', nameEn: 'Sadat', lines: 'Line 1 & 2' },
          { nameAr: 'العتبة', nameEn: 'Attaba', lines: 'Line 2 & 3' },
          { nameAr: 'جمال عبد الناصر', nameEn: 'Nasser', lines: 'Line 1 & 3' },
        ]
      }
    ],
    tipsAr: [
      'مكاتب الاشتراكات تعمل من 7 ص حتى 8 م.',
      'يمكنك استخدام محفظة "مواصلات" للدفع الرقمي.'
    ],
    tipsEn: [
      'Subscription offices work from 7 AM to 8 PM.',
      'You can use the "Mowaslat" wallet for digital payment.'
    ]
  },
  bus: {
    id: 'bus',
    titleAr: 'شبكة الأتوبيسات الموحدة 2026',
    titleEn: 'Unified Bus Network 2026',
    lastUpdated: 'مارس 2026',
    descriptionAr: '500+ خط • 67 محطة نهائية • هيئة النقل والقطاع الخاص.',
    descriptionEn: '500+ Lines • 67 Terminals • CTA & Private Sector.',
    icon: 'Bus',
    color: 'emerald',
    sections: [
      {
        titleAr: 'تعريفة الخطوط',
        titleEn: 'Line Fares',
        type: 'list',
        content: [
          { labelAr: 'التعريفة العادية (CTA)', labelEn: 'Ordinary (CTA)', price: 13 },
          { labelAr: 'التعريفة المميزة (CTA)', labelEn: 'Premium (CTA)', price: 25 },
          { labelAr: 'نقل جماعي عادي', labelEn: 'Collective Mini-bus', price: 19 },
          { labelAr: 'نقل جماعي مكيف', labelEn: 'AC Collective', price: 25 },
        ]
      }
    ],
    tipsAr: ['جميع الأتوبيسات تدعم تكنولوجيا التتبع المباشر.'],
    tipsEn: ['All buses support live tracking technology.']
  },
  train: {
    id: 'train',
    titleAr: 'دليل السكك الحديدية المصرية 2026',
    titleEn: 'ENR Railway Guide 2026',
    lastUpdated: 'أبريل 2026',
    descriptionAr: 'السكك الحديدية تربط شمال مصر بجنوبها.',
    descriptionEn: 'ENR connects North and South Egypt.',
    icon: 'Navigation',
    color: 'indigo',
    sections: [
      {
        titleAr: 'أسعار الخطوط الرئيسية',
        titleEn: 'Main Line Pricing',
        type: 'list',
        content: [
          { labelAr: 'القاهرة - أسوان (تالجو)', labelEn: 'Cairo - Aswan (Talgo)', price: '1000ج' },
          { labelAr: 'القاهرة - الإسكندرية (تالجو)', labelEn: 'Cairo - Alex (Talgo)', price: '400ج' },
          { labelAr: 'روسي مكيف', labelEn: 'Russian AC', price: '70ج-220ج' },
        ]
      }
    ],
    tipsAr: ['محطة بشتيل الذكية هي المحطة الرئيسية لقطارات الصعيد الآن.'],
    tipsEn: ['Bachtil Smart Station is now the main hub for Upper Egypt trains.']
  },
  river_bus: {
    id: 'river_bus',
    titleAr: 'دليل الأتوبيس النهري المطور 2026',
    titleEn: 'Smart River Bus Guide 2026',
    lastUpdated: 'مارس 2026',
    descriptionAr: 'شريان النقل الأخضر الموازي للنيل • صفر انبعاثات.',
    descriptionEn: 'The Green Spine of the Nile • Zero Emissions.',
    icon: 'Ship',
    color: 'cyan',
    sections: [
      {
        titleAr: 'الخدمات المتاحة',
        titleEn: 'Available Services',
        type: 'grid',
        content: [
          { labelAr: 'رحلات عادية', labelEn: 'Regular Service', price: '10-15ج' },
          { labelAr: 'رحلات مكيفة', labelEn: 'AC Service', price: '25-40ج' },
        ]
      }
    ],
    tipsAr: ['يدعم الأتوبيس النهري كارت النقل الذكي الموحد.'],
    tipsEn: ['The River Bus supports the Unified Smart Transport Card.']
  },
  monorail: {
    id: 'monorail',
    titleAr: 'دليل مونوريل القاهرة 2026',
    titleEn: 'Cairo Monorail Guide 2026',
    lastUpdated: 'أبريل 2026',
    descriptionAr: 'أطول خط مونوريل في العالم يربط شرق وغرب القاهرة.',
    descriptionEn: 'The longest monorail line in the world connecting East and West Cairo.',
    icon: 'Train',
    color: 'purple',
    sections: [
      {
        titleAr: 'الخطوط والتعريفة',
        titleEn: 'Lines & Fares',
        type: 'list',
        content: [
          { labelAr: 'مونوريل شرق النيل', labelEn: 'East Nile Monorail', price: '15-25ج' },
          { labelAr: 'مونوريل غرب النيل', labelEn: 'West Nile Monorail', price: '15-25ج' },
        ]
      }
    ],
    tipsAr: ['يربط المونوريل العاصمة الإدارية الجديدة بقلب القاهرة.'],
    tipsEn: ['The Monorail connects the New Capital with central Cairo.']
  },
  lrt: {
    id: 'lrt',
    titleAr: 'القطار الكهربائي الخفيف (LRT)',
    titleEn: 'Light Rail Transit (LRT)',
    lastUpdated: 'أبريل 2026',
    descriptionAr: 'يربط القاهرة بالمدن الجديدة (العاصمة، الشروق، العبور).',
    descriptionEn: 'Connects Cairo to new cities (New Capital, Shorouk, Obour).',
    icon: 'Train',
    color: 'emerald',
    sections: [
      {
        titleAr: 'الأسعار التقديرية',
        titleEn: 'Estimated Fares',
        type: 'list',
        content: [
          { labelAr: '3 محطات', labelEn: '3 Stations', price: 10 },
          { labelAr: '7 محطات', labelEn: '7 Stations', price: 15 },
          { labelAr: 'أكثر من 7 محطات', labelEn: 'More than 7 Stations', price: 25 },
        ]
      }
    ],
    tipsAr: ['نقطة التبادل الرئيسية في محطة عدلي منصور.'],
    tipsEn: ['Major interchange at Adly Mansour station.']
  },
  microbus: {
    id: 'microbus',
    titleAr: 'دليل ميكروباص الخدمات 2026',
    titleEn: 'Microbus Service Guide 2026',
    lastUpdated: 'مارس 2026',
    descriptionAr: 'الدليل الرسمي للخطوط الداخلية والتعريفة المعتمدة.',
    descriptionEn: 'Official guide for internal routes and approved fares.',
    icon: 'Bus',
    color: 'orange',
    sections: [
      {
        titleAr: 'تعريفة الخطوط (عينة)',
        titleEn: 'Route Fares (Sample)',
        type: 'list',
        content: [
          { labelAr: 'مصر الجديدة - السيدة عائشة', labelEn: 'Heliopolis - Sayeda Aisha', price: '8ج' },
          { labelAr: 'الجيزة - شبرامنت', labelEn: 'Giza - Shabramant', price: '7ج' },
          { labelAr: 'عبد المنعم رياض - التجمع', labelEn: 'Riad - Tagamoa', price: '12-15ج' },
        ]
      }
    ],
    tipsAr: ['تأكد من وجود ملصق التعريفة على الزجاج الأمامي.'],
    tipsEn: ['Ensure the fare sticker is visible on the windshield.']
  },
  microbus_intercity: {
    id: 'microbus_intercity',
    titleAr: 'دليل ميكروباص الأقاليم 2026',
    titleEn: 'Intercity Microbus Guide 2026',
    lastUpdated: 'مارس 2026',
    descriptionAr: 'ربط القاهرة بجميع محافظات مصر عبر المواقف الرئيسية.',
    descriptionEn: 'Connecting Cairo to all governorates via major hubs.',
    icon: 'Bus',
    color: 'orange',
    sections: [
      {
        titleAr: 'أهم المواقف ومناطق الخدمة',
        titleEn: 'Main Hubs & Service Areas',
        type: 'grid',
        content: [
          { labelAr: 'موقف عبود', labelEn: 'Abboud Hub', price: 'الدلتا والقناة' },
          { labelAr: 'موقف المنيب', labelEn: 'Moneib Hub', price: 'الصعيد' },
          { labelAr: 'موقف بشتيل', labelEn: 'Bashtil Hub', price: 'الجيزة والأقاليم' },
        ]
      }
    ],
    tipsAr: ['يفضل السفر في الصباح الباكر لتوفر السيارات.'],
    tipsEn: ['Early morning travel is recommended for more available cars.']
  }
};
