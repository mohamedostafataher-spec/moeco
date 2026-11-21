export interface IntercityRoute {
  destination: string;
  price: number;
}

export interface IntercityHub {
  id: string;
  nameAr: string;
  nameEn: string;
  regions: {
    regionAr: string;
    regionEn: string;
    routes: IntercityRoute[];
  }[];
}

export const INTERCITY_DATA: IntercityHub[] = [
  {
    id: 'aboud',
    nameAr: 'موقف عبود',
    nameEn: 'Aboud Hub',
    regions: [
      {
        regionAr: 'محافظة دمياط',
        regionEn: 'Domiat Prefecture',
        routes: [
          { destination: 'دمياط', price: 130 },
          { destination: 'دمياط الجديدة', price: 135 },
          { destination: 'رأس البر', price: 160 },
        ]
      },
      {
        regionAr: 'محافظة كفر الشيخ',
        regionEn: 'Kafr El Sheikh Prefecture',
        routes: [
          { destination: 'كفر الشيخ', price: 69 },
          { destination: 'قلين', price: 70 },
          { destination: 'الحامول', price: 76 },
          { destination: 'بيلا', price: 77 },
          { destination: 'بلطيم', price: 100 },
          { destination: 'دسوق', price: 79 },
          { destination: 'فوه', price: 87 },
          { destination: 'مطوبس', price: 91 },
        ]
      },
      {
        regionAr: 'محافظة البحيرة',
        regionEn: 'Beheira Prefecture',
        routes: [
          { destination: 'دمنهور', price: 85 },
          { destination: 'أبو المطامير', price: 86 },
          { destination: 'الدلنجات', price: 85 },
          { destination: 'شبراخيت', price: 75 },
          { destination: 'إيتاي البارود', price: 70 },
          { destination: 'مديرية التحرير', price: 54 },
          { destination: 'مدينة بدر', price: 55 },
          { destination: 'كوم حمادة', price: 58 },
          { destination: 'رشيد', price: 160 },
          { destination: 'كفر الدوار', price: 87 },
        ]
      },
      {
        regionAr: 'محافظة الغربية',
        regionEn: 'Gharbia Prefecture',
        routes: [
          { destination: 'طنطا', price: 53 },
          { destination: 'السنطة', price: 53 },
          { destination: 'كفر الزيات', price: 58 },
          { destination: 'المحلة', price: 70 },
          { destination: 'زفتى', price: 53 },
        ]
      },
      {
        regionAr: 'محافظة المنوفية',
        regionEn: 'Menofia Prefecture',
        routes: [
          { destination: 'شبين الكوم', price: 38 },
          { destination: 'تلا', price: 50 },
          { destination: 'نادر', price: 50 },
          { destination: 'الشهداء', price: 50 },
          { destination: 'منوف', price: 38 },
          { destination: 'قويسنا', price: 36 },
          { destination: 'بركة السبع', price: 38 },
        ]
      },
      {
        regionAr: 'محافظة الشرقية',
        regionEn: 'Sharqia Prefecture',
        routes: [
          { destination: 'الزقازيق', price: 52 },
          { destination: 'أبو حماد', price: 46 },
          { destination: 'منيا القمح', price: 35 },
          { destination: 'بلبيس', price: 35 },
          { destination: 'ديرب نجم', price: 58 },
          { destination: 'فاقوس', price: 65 },
          { destination: 'أبو كبير', price: 58 },
          { destination: 'ههيا', price: 46 },
          { destination: 'كفر صقر', price: 70 },
          { destination: 'الإبراهيمية', price: 58 },
          { destination: 'الحسينية', price: 78 },
          { destination: 'أولاد صقر', price: 72 },
        ]
      },
      {
        regionAr: 'محافظة الدقهلية',
        regionEn: 'Daqahlia Prefecture',
        routes: [
          { destination: 'المنصورة', price: 68 },
          { destination: 'دكرنس', price: 75 },
          { destination: 'السنبلاوين', price: 70 },
          { destination: 'شربين', price: 73 },
          { destination: 'المنزلة', price: 100 },
          { destination: 'منية النصر', price: 76 },
          { destination: 'بلقاس', price: 76 },
          { destination: 'ميت غمر', price: 50 },
          { destination: 'جمصة', price: 95 },
          { destination: 'طلخا', price: 66 },
        ]
      },
      {
        regionAr: 'إسكندرية والفيوم والوجه القبلي',
        regionEn: 'Alex, Fayoum & Upper Egypt',
        routes: [
          { destination: 'الإسكندرية', price: 140 },
          { destination: 'الإسكندرية مكيف', price: 150 },
          { destination: 'الفيوم', price: 65 },
          { destination: 'يوسف الصديق', price: 70 },
          { destination: 'بني سويف', price: 80 },
          { destination: 'الواسطي', price: 80 },
          { destination: 'المنيا', price: 195 },
          { destination: 'أسيوط', price: 235 },
          { destination: 'سوهاج', price: 290 },
          { destination: 'الوادي الجديد', price: 330 },
        ]
      }
    ]
  },
  {
    id: 'salam',
    nameAr: 'موقف السلام',
    nameEn: 'El-Salam Hub',
    regions: [
      {
        regionAr: 'محافظة الشرقية',
        regionEn: 'Sharqia Prefecture',
        routes: [
          { destination: 'الزقازيق', price: 45 },
          { destination: 'فاقوس', price: 60 },
          { destination: 'الحسينية', price: 65 },
          { destination: 'أبو كبير', price: 53 },
          { destination: 'كفر صقر', price: 58 },
          { destination: 'أولاد صقر', price: 70 },
          { destination: 'ديرب نجم', price: 53 },
          { destination: 'الإبراهيمية', price: 53 },
          { destination: 'القرين', price: 50 },
          { destination: 'بلبيس', price: 27 },
          { destination: 'أبو حماد', price: 43 },
          { destination: 'ههيا', price: 46 },
        ]
      },
      {
        regionAr: 'محافظة الغربية',
        regionEn: 'Gharbia Prefecture',
        routes: [
          { destination: 'العاشر من رمضان', price: 30 },
          { destination: 'الصالحية الجديدة', price: 64 },
          { destination: 'طنطا', price: 60 },
          { destination: 'المحلة الكبرى', price: 70 },
          { destination: 'سمنود', price: 70 },
          { destination: 'زفتى', price: 49 },
          { destination: 'السنطة', price: 53 },
          { destination: 'بسيون', price: 75 },
        ]
      },
      {
        regionAr: 'محافظة الدقهلية والبحيرة',
        regionEn: 'Daqahlia & Beheira',
        routes: [
          { destination: 'المنصورة', price: 73 },
          { destination: 'السنبلاوين', price: 70 },
          { destination: 'أجا', price: 55 },
          { destination: 'المنزلة', price: 100 },
          { destination: 'دكرنس', price: 75 },
          { destination: 'منية النصر', price: 75 },
          { destination: 'ميت غمر', price: 53 },
          { destination: 'شربين', price: 75 },
          { destination: 'دمنهور', price: 82 },
          { destination: 'أبو حمص', price: 85 },
          { destination: 'حوش عيسى', price: 84 },
          { destination: 'كفر الدوار', price: 92 },
        ]
      },
      {
        regionAr: 'محافظة القليوبية والمنوفية',
        regionEn: 'Qalyubia & Menofia',
        routes: [
          { destination: 'بنها', price: 30 },
          { destination: 'كفر شكر', price: 35 },
          { destination: 'المؤسسة', price: 11 },
          { destination: 'العبور', price: 15 },
          { destination: 'شبين الكوم', price: 40 },
          { destination: 'قويسنا', price: 37 },
          { destination: 'بركة السبع', price: 38 },
          { destination: 'السادات', price: 70 },
        ]
      },
      {
        regionAr: 'محافظة دمياط',
        regionEn: 'Domiat Prefecture',
        routes: [
          { destination: 'دمياط', price: 125 },
          { destination: 'دمياط الجديدة', price: 155 },
          { destination: 'رأس البر', price: 150 },
        ]
      },
      {
        regionAr: 'المدن الجديدة والوجه القبلي',
        regionEn: 'New Cities & Upper Egypt',
        routes: [
          { destination: 'العبور الجديدة', price: 18 },
          { destination: 'بني سويف', price: 85 },
          { destination: 'الفيوم', price: 70 },
          { destination: 'الإسكندرية', price: 142 },
          { destination: 'الإسكندرية مكيف', price: 150 },
          { destination: 'الهرم', price: 20 },
          { destination: 'أكتوبر', price: 30 },
          { destination: 'العاصمة الإدارية', price: 52 },
          { destination: 'التجمع الخامس', price: 26 },
          { destination: 'مدينتي', price: 36 },
          { destination: 'الرحاب', price: 20 },
          { destination: 'الشروق', price: 20 },
        ]
      }
    ]
  },
  {
    id: 'marg',
    nameAr: 'موقف المرج',
    nameEn: 'El-Marg Hub',
    regions: [
      {
        regionAr: 'محافظة السويس',
        regionEn: 'Suez Prefecture',
        routes: [
          { destination: 'السويس بيجو', price: 75 },
          { destination: 'السويس ميكروباص', price: 75 },
          { destination: 'بورتو السخنة', price: 100 },
        ]
      },
      {
        regionAr: 'محافظة الإسماعيلية',
        regionEn: 'Ismailia Prefecture',
        routes: [
          { destination: 'الإسماعيلية بيجو', price: 65 },
          { destination: 'الإسماعيلية ميكروباص', price: 65 },
          { destination: 'فايد', price: 65 },
          { destination: 'القصاصين', price: 60 },
          { destination: 'القنطرة', price: 80 },
          { destination: 'التل الكبير', price: 61 },
        ]
      },
      {
        regionAr: 'محافظة بورسعيد',
        regionEn: 'Port Said Prefecture',
        routes: [
          { destination: 'بورسعيد بيجو', price: 137 },
          { destination: 'بورسعيد ميكروباص', price: 137 },
        ]
      },
      {
        regionAr: 'جنوب وشمال سيناء',
        regionEn: 'South & North Sinai',
        routes: [
          { destination: 'الطور', price: 300 },
          { destination: 'نويبع', price: 330 },
          { destination: 'رأس سدر', price: 145 },
          { destination: 'طابا', price: 340 },
          { destination: 'ذهب', price: 340 },
          { destination: 'العريش', price: 185 },
          { destination: 'رفح', price: 200 },
        ]
      },
      {
        regionAr: 'الوجه القبلي (صعيد مصر)',
        regionEn: 'Upper Egypt',
        routes: [
          { destination: 'أسيوط', price: 245 },
          { destination: 'سوهاج', price: 275 },
          { destination: 'قنا', price: 310 },
          { destination: 'ملوي', price: 215 },
          { destination: 'المنيا', price: 195 },
          { destination: 'أبو قرقاص', price: 195 },
          { destination: 'بني سويف', price: 85 },
          { destination: 'الوادي الجديد', price: 335 },
        ]
      },
      {
        regionAr: 'مرسى مطروح',
        regionEn: 'Marsa Matrouh',
        routes: [
          { destination: 'العلمين عادي', price: 190 },
          { destination: 'العلمين مكيف', price: 220 },
        ]
      }
    ]
  },
  {
    id: 'helwan',
    nameAr: 'موقف عين حلوان',
    nameEn: 'Ain Helwan Hub',
    regions: [
      {
        regionAr: 'الوجه القبلي',
        regionEn: 'Upper Egypt',
        routes: [
          { destination: 'بني سويف', price: 70 },
          { destination: 'الواسطي', price: 65 },
          { destination: 'المنيا', price: 170 },
          { destination: 'أسيوط', price: 235 },
          { destination: 'سوهاج', price: 245 },
          { destination: 'قنا', price: 250 },
          { destination: 'الوادي الجديد', price: 290 },
          { destination: 'الفيوم', price: 73 },
          { destination: 'أبشواي', price: 74 },
          { destination: 'طامية', price: 65 },
          { destination: 'سنورس', price: 65 },
        ]
      },
      {
        regionAr: 'محافظة الجيزة',
        regionEn: 'Giza Prefecture',
        routes: [
          { destination: 'الصف', price: 30 },
          { destination: 'أطفيح', price: 52 },
          { destination: 'البرميل', price: 59 },
        ]
      },
      {
        regionAr: 'المدن الجديدة',
        regionEn: 'New Cities',
        routes: [
          { destination: 'بدر', price: 38 },
          { destination: 'أكتوبر', price: 33 },
          { destination: 'العبور', price: 40 },
        ]
      }
    ]
  },
  {
    id: 'sabteya',
    nameAr: 'موقف السبتية',
    nameEn: 'Sabteya Hub',
    regions: [
      {
        regionAr: 'الوجه البحري والدلتا',
        regionEn: 'Nile Delta & North',
        routes: [
          { destination: 'الإسكندرية عادي', price: 165 },
          { destination: 'الإسكندرية مكيف', price: 180 },
          { destination: 'طنطا', price: 64 },
          { destination: 'المحلة', price: 75 },
          { destination: 'المنصورة', price: 87 },
        ]
      }
    ]
  },
  {
    id: 'riad',
    nameAr: 'عبد المنعم رياض (خطوط الجيزة)',
    nameEn: 'Abdel Moneim Riad (Giza Lines)',
    regions: [
      {
        regionAr: 'خطوط الجيزة',
        regionEn: 'Giza Lines',
        routes: [
          { destination: 'فيصل', price: 11.5 },
          { destination: 'الوراق', price: 8.5 },
          { destination: 'البوهي', price: 10 },
          { destination: 'إمبابة', price: 8 },
          { destination: 'أكتوبر', price: 19.5 },
          { destination: 'الدقي', price: 10.5 },
          { destination: 'القناطر الدائري', price: 12 },
        ]
      }
    ]
  }
];
