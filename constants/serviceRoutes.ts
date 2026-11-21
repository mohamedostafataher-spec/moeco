
export interface ServiceRoute {
  id: string | number;
  nameAr: string;
  nameEn: string;
  fare: number;
  category: string;
  categoryEn: string;
}

export const SERVICE_ROUTES: ServiceRoute[] = [
  // 1. Sayeda Aisha & Old Cairo
  { id: 1, nameAr: 'عزبة خير الله – السيدة عائشة', nameEn: 'Ezbet Khairallah - Sayeda Aisha', fare: 8, category: 'السيدة عائشة ومصر القديمة', categoryEn: 'Sayeda Aisha & Old Cairo' },
  { id: 2, nameAr: 'السيدة عائشة – الملك الصالح – الجيزة', nameEn: 'Sayeda Aisha - El Malek El Saleh - Giza', fare: 8, category: 'السيدة عائشة ومصر القديمة', categoryEn: 'Sayeda Aisha & Old Cairo' },
  { id: 3, nameAr: 'السيدة عائشة – المقطم (النافورة)', nameEn: 'Sayeda Aisha - El Mokattam (Fountain)', fare: 9.50, category: 'السيدة عائشة ومصر القديمة', categoryEn: 'Sayeda Aisha & Old Cairo' },
  { id: 4, nameAr: 'السيدة عائشة – كارفور – القطامية', nameEn: 'Sayeda Aisha - Carrefour - Katameya', fare: 11.50, category: 'السيدة عائشة ومصر القديمة', categoryEn: 'Sayeda Aisha & Old Cairo' },
  { id: 5, nameAr: 'السيدة عائشة – القاهرة الجديدة', nameEn: 'Sayeda Aisha - New Cairo', fare: 19, category: 'السيدة عائشة ومصر القديمة', categoryEn: 'Sayeda Aisha & Old Cairo' },
  { id: 6, nameAr: 'السيدة زينب – القصر العيني – الجيزة', nameEn: 'Sayeda Zeinab - Kasr El Aini - Giza', fare: 8, category: 'السيدة عائشة ومصر القديمة', categoryEn: 'Sayeda Aisha & Old Cairo' },

  // 2. Ahmed Helmy & Mazallat
  { id: 7, nameAr: 'أحمد حلمي – الشيخ زايد (البنزينة)', nameEn: 'Ahmed Helmy - Sheikh Zayed (Gas Station)', fare: 8.50, category: 'أحمد حلمي والمظلات وشبرا', categoryEn: 'Ahmed Helmy & Mazallat' },
  { id: 8, nameAr: 'أحمد حلمي – عبود – مسطرد', nameEn: 'Ahmed Helmy - Abboud - Mostorod', fare: 8.50, category: 'أحمد حلمي والمظلات وشبرا', categoryEn: 'Ahmed Helmy & Mazallat' },
  { id: 9, nameAr: 'المظلات – رمسيس – العباسية', nameEn: 'Mazallat - Ramses - Abbassia', fare: 8, category: 'أحمد حلمي والمظلات وشبرا', categoryEn: 'Ahmed Helmy & Mazallat' },
  { id: 10, nameAr: 'دوران شبرا – العباسية – الحي السابع', nameEn: 'Doran Shoubra - Abbassia - 7th District', fare: 12.50, category: 'أحمد حلمي والمظلات وشبرا', categoryEn: 'Ahmed Helmy & Mazallat' },
  { id: 11, nameAr: 'دوران شبرا – جامعة القاهرة – الهرم', nameEn: 'Doran Shoubra - Cairo University - Haram', fare: 12.50, category: 'أحمد حلمي والمظلات وشبرا', categoryEn: 'Ahmed Helmy & Mazallat' },
  { id: 12, nameAr: 'الزاوية الحمراء – عتبة', nameEn: 'Zawya El Hamra - Ataba', fare: 8, category: 'أحمد حلمي والمظلات وشبرا', categoryEn: 'Ahmed Helmy & Mazallat' },
  { id: 13, nameAr: 'الشرابية – القللي – العتبة', nameEn: 'Sharabia - El Koulali - Ataba', fare: 8, category: 'أحمد حلمي والمظلات وشبرا', categoryEn: 'Ahmed Helmy & Mazallat' },

  // 3. Helwan & 15 May
  { id: 35, nameAr: 'حلوان – عبد المنعم رياض (كورنيش)', nameEn: 'Helwan - Abdel Moneim Riad (Corniche)', fare: 12, category: 'حلوان و15 مايو', categoryEn: 'Helwan & 15 May' },
  { id: 36, nameAr: 'حلوان – منشأة ناصر – حدائق القبة', nameEn: 'Helwan - Manshiyat Nasir - Hadayek El Kobba', fare: 14, category: 'حلوان و15 مايو', categoryEn: 'Helwan & 15 May' },
  { id: 37, nameAr: 'حلوان – منشأة ناصر – مساكن الشروق', nameEn: 'Helwan - Manshiyat Nasir - Shorouk Housing', fare: 18, category: 'حلوان و15 مايو', categoryEn: 'Helwan & 15 May' },
  { id: 38, nameAr: 'حلوان – كفر الشرفا – الصف', nameEn: 'Helwan - Kafr El Sharafa - El Saff', fare: 13.50, category: 'حلوان و15 مايو', categoryEn: 'Helwan & 15 May' },
  { id: 39, nameAr: 'حلوان – رابعة العدوية – العبور', nameEn: 'Helwan - Rabia El Adawiya - Obour', fare: 23, category: 'حلوان و15 مايو', categoryEn: 'Helwan & 15 May' },
  { id: 40, nameAr: 'حلوان – رابعة العدوية – مدينة السلام', nameEn: 'Helwan - Rabia El Adawiya - Salam City', fare: 20, category: 'حلوان و15 مايو', categoryEn: 'Helwan & 15 May' },
  { id: 41, nameAr: '15 مايو – منشأة ناصر – العباسية', nameEn: '15 May - Manshiyat Nasir - Abbassia', fare: 16, category: 'حلوان و15 مايو', categoryEn: 'Helwan & 15 May' },
  { id: 42, nameAr: 'التبين – حلوان – أحمد حلمي', nameEn: 'El Tebbin - Helwan - Ahmed Helmy', fare: 16.50, category: 'حلوان و15 مايو', categoryEn: 'Helwan & 15 May' },
  { id: 43, nameAr: 'حلوان – المنيب – الجيزة', nameEn: 'Helwan - Moneeb - Giza', fare: 14, category: 'حلوان و15 مايو', categoryEn: 'Helwan & 15 May' },
  { id: 44, nameAr: 'حلوان – المقطم', nameEn: 'Helwan - Mokattam', fare: 16, category: 'حلوان و15 مايو', categoryEn: 'Helwan & 15 May' },
  { id: 45, nameAr: 'حلوان – بدر', nameEn: 'Helwan - Badr City', fare: 28, category: 'حلوان و15 مايو', categoryEn: 'Helwan & 15 May' },
  { id: 46, nameAr: 'حلوان – العاصمة الإدارية (اللوتس)', nameEn: 'Helwan - New Administrative Capital (Lotus)', fare: 28, category: 'حلوان و15 مايو', categoryEn: 'Helwan & 15 May' },

  // 4. Maadi & Basatin
  { id: 76, nameAr: 'المعادي – عبد المنعم رياض – أحمد حلمي', nameEn: 'Maadi - Abdel Moneim Riad - Ahmed Helmy', fare: 12.50, category: 'المعادي والبساتين والقطامية', categoryEn: 'Maadi & Basatin' },
  { id: 77, nameAr: 'المعادي – مدينة المعراج', nameEn: 'Maadi - Meraj City', fare: 12, category: 'المعادي والبساتين والقطامية', categoryEn: 'Maadi & Basatin' },
  { id: 78, nameAr: 'المعادي – صقر قريش', nameEn: 'Maadi - Saqr Quraish', fare: 8, category: 'المعادي والبساتين والقطامية', categoryEn: 'Maadi & Basatin' },
  { id: 79, nameAr: 'البساتين – السيدة عائشة – القلعة', nameEn: 'Basatin - Sayeda Aisha - Citadel', fare: 8, category: 'المعادي والبساتين والقطامية', categoryEn: 'Maadi & Basatin' },
  { id: 80, nameAr: 'المعادي – الهرم', nameEn: 'Maadi - Haram', fare: 13, category: 'المعادي والبساتين والقطامية', categoryEn: 'Maadi & Basatin' },
  { id: 81, nameAr: 'المعادي – كارفور – القطامية', nameEn: 'Maadi - Carrefour - Katameya', fare: 11.50, category: 'المعادي والبساتين والقطامية', categoryEn: 'Maadi & Basatin' },

  // 5. Sabtia & Abdel Moneim Riad
  { id: 100, nameAr: 'السبتية – أكتوبر (المحور)', nameEn: 'Sabtia - 6th of October (Mehouar)', fare: 17, category: 'السبتية وعبد المنعم رياض', categoryEn: 'Sabtia & Downtown' },
  { id: 101, nameAr: 'السبتية – ميدان الرماية – أكتوبر (فيصل)', nameEn: 'Sabtia - Remaya Sq - 6th of October (Faisal)', fare: 17, category: 'السبتية وعبد المنعم رياض', categoryEn: 'Sabtia & Downtown' },
  { id: 102, nameAr: 'السبتية – جامعة القاهرة – الجيزة', nameEn: 'Sabtia - Cairo University - Giza', fare: 8.50, category: 'السبتية وعبد المنعم رياض', categoryEn: 'Sabtia & Downtown' },
  { id: 103, nameAr: 'عبد المنعم رياض – المؤسسة', nameEn: 'Abdel Moneim Riad - Mossasa', fare: 9.50, category: 'السبتية وعبد المنعم رياض', categoryEn: 'Sabtia & Downtown' },
  { id: 104, nameAr: 'عبد المنعم رياض – القناطر الخيرية', nameEn: 'Abdel Moneim Riad - Kanater El Khaireya', fare: 12, category: 'السبتية وعبد المنعم رياض', categoryEn: 'Sabtia & Downtown' },
  { id: 105, nameAr: 'عبد المنعم رياض – أكتوبر (الهرم)', nameEn: 'Abdel Moneim Riad - 6th of October (Haram)', fare: 17, category: 'السبتية وعبد المنعم رياض', categoryEn: 'Sabtia & Downtown' },

  // 6. Salam & Marg
  { id: 120, nameAr: 'مدينة السلام (سبيكو) – العباسية', nameEn: 'Salam City (Speco) - Abbassia', fare: 11.50, category: 'مدينة السلام والمرج والنهضة', categoryEn: 'Salam & Marg' },
  { id: 121, nameAr: 'مدينة السلام – النهضة – سوق العبور', nameEn: 'Salam City - Nahda - Obour Market', fare: 12, category: 'مدينة السلام والمرج والنهضة', categoryEn: 'Salam & Marg' },
  { id: 122, nameAr: 'موقف السلام – الشروق', nameEn: 'Salam Hub - Shorouk', fare: 11, category: 'مدينة السلام والمرج والنهضة', categoryEn: 'Salam & Marg' },
  { id: 123, nameAr: 'المرج – القلج – أبو زعبل', nameEn: 'Marg - Kalag - Abu Zaabal', fare: 8.50, category: 'مدينة السلام والمرج والنهضة', categoryEn: 'Salam & Marg' },
  { id: 124, nameAr: 'المرج – الفلكي – الخانكة', nameEn: 'Marg - Falaki - Khanka', fare: 8.50, category: 'مدينة السلام والمرج والنهضة', categoryEn: 'Salam & Marg' },
  { id: 130, nameAr: 'موقف السلام – العاصمة الإدارية', nameEn: 'Salam Hub - New Administrative Capital', fare: 30, category: 'مدينة السلام والمرج والنهضة', categoryEn: 'Salam & Marg' },

  // 7. New Cairo & Lotus
  { id: 288, nameAr: 'التجمع الثالث – رابعة العدوية – العباسية', nameEn: '3rd Settlement - Rabia - Abbassia', fare: 11.50, category: 'القاهرة الجديدة (التجمع واللوتس)', categoryEn: 'New Cairo & Lotus' },
  { id: 289, nameAr: 'التجمع الخامس – رابعة العدوية (الخامس)', nameEn: '5th Settlement - Rabia (5th)', fare: 17.50, category: 'القاهرة الجديدة (التجمع واللوتس)', categoryEn: 'New Cairo & Lotus' },
  { id: 290, nameAr: 'اللوتس – السيدة عائشة', nameEn: 'Lotus - Sayeda Aisha', fare: 17.50, category: 'القاهرة الجديدة (التجمع واللوتس)', categoryEn: 'New Cairo & Lotus' },
  { id: 291, nameAr: 'اللوتس – السبتية', nameEn: 'Lotus - Sabtia', fare: 18.50, category: 'القاهرة الجديدة (التجمع واللوتس)', categoryEn: 'New Cairo & Lotus' },
  { id: 292, nameAr: 'اللوتس – الحي العاشر', nameEn: 'Lotus - 10th District', fare: 9.50, category: 'القاهرة الجديدة (التجمع واللوتس)', categoryEn: 'New Cairo & Lotus' },
  
  // High Fares / Long Routes
  { id: 293, nameAr: 'حلوان – بدر', nameEn: 'Helwan - Badr City (Premium)', fare: 57, category: 'الخطوط النهائية والبعيدة', categoryEn: 'Final & Distant Routes' },
  { id: 294, nameAr: 'حلوان – القاهرة الجديدة – اللوتس', nameEn: 'Helwan - New Cairo - Lotus', fare: 30.50, category: 'الخطوط النهائية والبعيدة', categoryEn: 'Final & Distant Routes' },
];
