CREATE TABLE IF NOT EXISTS public.metro_lines (
  id text PRIMARY KEY,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  color text NOT NULL,
  stations jsonb NOT NULL
);

INSERT INTO public.metro_lines (id, name_en, name_ar, color, stations) VALUES 
('metro-1', 'Metro Line 1 (Helwan - Marg)', 'مترو الخط الأول (حلوان - المرج)', 'bg-blue-600', '[
  {"name_en": "Helwan", "name_ar": "حلوان", "lat": 29.8402, "lng": 31.3308},
  {"name_en": "Ain Helwan", "name_ar": "عين حلوان", "lat": 29.8532, "lng": 31.3288},
  {"name_en": "Helwan University", "name_ar": "جامعة حلوان", "lat": 29.8692, "lng": 31.3248},
  {"name_en": "Maadi", "name_ar": "المعادي", "lat": 29.9602, "lng": 31.2569},
  {"name_en": "Zahraa El Maadi", "name_ar": "زهراء المعادي", "lat": 29.9802, "lng": 31.2469},
  {"name_en": "Dar El Salam", "name_ar": "دار السلام", "lat": 29.9982, "lng": 31.2369},
  {"name_en": "Mari Gerges", "name_ar": "مار جرجس", "lat": 30.0056, "lng": 31.2301},
  {"name_en": "Al-Sayeda Zeinab", "name_ar": "السيدة زينب", "lat": 30.0302, "lng": 31.2369},
  {"name_en": "Sadat (Tahrir)", "name_ar": "السادات (التحرير)", "lat": 30.0444, "lng": 31.2357},
  {"name_en": "Nasser", "name_ar": "جمال عبد الناصر", "lat": 30.0532, "lng": 31.2399},
  {"name_en": "Orabi", "name_ar": "عرابي", "lat": 30.0582, "lng": 31.2429},
  {"name_en": "Al-Shohada (Ramses)", "name_ar": "الشهداء (رمسيس)", "lat": 30.0636, "lng": 31.2467},
  {"name_en": "Ghamra", "name_ar": "غمرة", "lat": 30.0702, "lng": 31.2569},
  {"name_en": "El-Demerdash", "name_ar": "الدمرداش", "lat": 30.0772, "lng": 31.2669},
  {"name_en": "Manshiet El-Sadr", "name_ar": "منشية الصدر", "lat": 30.0842, "lng": 31.2759},
  {"name_en": "Kobri El-Qobba", "name_ar": "كوبري القبة", "lat": 30.0912, "lng": 31.2859},
  {"name_en": "Hammamat El-Qobba", "name_ar": "حمامات القبة", "lat": 30.1002, "lng": 31.2959},
  {"name_en": "Saray El-Qobba", "name_ar": "سراي القبة", "lat": 30.1082, "lng": 31.3059},
  {"name_en": "Hadayeq El-Zaitoun", "name_ar": "حدائق الزيتون", "lat": 30.1152, "lng": 31.3159},
  {"name_en": "Matareya", "name_ar": "المطرية", "lat": 30.1252, "lng": 31.3259},
  {"name_en": "Ain Shams", "name_ar": "عين شمس", "lat": 30.1352, "lng": 31.3359},
  {"name_en": "Ezbet El-Nakhl", "name_ar": "عزبة النخل", "lat": 30.1452, "lng": 31.3459},
  {"name_en": "El-Marg", "name_ar": "المرج", "lat": 30.1552, "lng": 31.3559},
  {"name_en": "New El-Marg", "name_ar": "المرج الجديدة", "lat": 30.1652, "lng": 31.3659}
]'::jsonb)
ON CONFLICT (id) DO UPDATE SET stations = EXCLUDED.stations;

INSERT INTO public.metro_lines (id, name_en, name_ar, color, stations) VALUES 
('metro-2', 'Metro Line 2 (Shobra - Mounib)', 'مترو الخط الثاني (شبرا - المنيب)', 'bg-red-600', '[
  {"name_en": "Shobra El-Kheima", "name_ar": "شبرا الخيمة", "lat": 30.1219, "lng": 31.2458},
  {"name_en": "Kolleyyet El-Zeraa", "name_ar": "كلية الزراعة", "lat": 30.1152, "lng": 31.2489},
  {"name_en": "El-Mazallat", "name_ar": "المظلات", "lat": 30.1082, "lng": 31.2469},
  {"name_en": "Khalafawy", "name_ar": "الخلفاوي", "lat": 30.0982, "lng": 31.2459},
  {"name_en": "St. Teresa", "name_ar": "سانت تريزا", "lat": 30.0882, "lng": 31.2449},
  {"name_en": "Rod El-Farag", "name_ar": "روض الفرج", "lat": 30.0802, "lng": 31.2439},
  {"name_en": "Massara", "name_ar": "مسرة", "lat": 30.0722, "lng": 31.2429},
  {"name_en": "Al-Shohada (Ramses)", "name_ar": "الشهداء (رمسيس)", "lat": 30.0636, "lng": 31.2467},
  {"name_en": "Ataba", "name_ar": "العتبة", "lat": 30.0519, "lng": 31.2464},
  {"name_en": "Mohamed Naguib", "name_ar": "محمد نجيب", "lat": 30.0462, "lng": 31.2429},
  {"name_en": "Sadat (Tahrir)", "name_ar": "السادات (التحرير)", "lat": 30.0444, "lng": 31.2357},
  {"name_en": "Opera", "name_ar": "الأوبرا", "lat": 30.0422, "lng": 31.2269},
  {"name_en": "Dokki", "name_ar": "الدقي", "lat": 30.0382, "lng": 31.2119},
  {"name_en": "El Bohoth", "name_ar": "البحوث", "lat": 30.0352, "lng": 31.2019},
  {"name_en": "Cairo University", "name_ar": "جامعة القاهرة", "lat": 30.0252, "lng": 31.2059},
  {"name_en": "Faisal", "name_ar": "فيصل", "lat": 30.0152, "lng": 31.2019},
  {"name_en": "Giza", "name_ar": "الجيزة", "lat": 30.0076, "lng": 31.2066},
  {"name_en": "Omm El-Masryeen", "name_ar": "أم المصريين", "lat": 29.9982, "lng": 31.2089},
  {"name_en": "Sakiat Mekki", "name_ar": "ساقية مكي", "lat": 29.9882, "lng": 31.2109},
  {"name_en": "El-Mounib", "name_ar": "المنيب", "lat": 29.9814, "lng": 31.2117}
]'::jsonb)
ON CONFLICT (id) DO UPDATE SET stations = EXCLUDED.stations;

INSERT INTO public.metro_lines (id, name_en, name_ar, color, stations) VALUES 
('metro-3', 'Metro Line 3 (Green)', 'مترو الخط الثالث (الأخضر)', 'bg-green-600', '[
  {"name_en": "Adly Mansour", "name_ar": "عدلي منصور", "lat": 30.1466, "lng": 31.4228},
  {"name_en": "Hikestep", "name_ar": "الهايكستب", "lat": 30.1382, "lng": 31.4028},
  {"name_en": "Omar Ibn El-Khattab", "name_ar": "عمر بن الخطاب", "lat": 30.1282, "lng": 31.3828},
  {"name_en": "Qobba El-Jedda", "name_ar": "قباء", "lat": 30.1182, "lng": 31.3628},
  {"name_en": "Hesham Barakat", "name_ar": "هشام بركات", "lat": 30.1252, "lng": 31.3418},
  {"name_en": "El-Nozha", "name_ar": "النزهة", "lat": 30.1152, "lng": 31.3218},
  {"name_en": "Nadi El-Shams", "name_ar": "نادي الشمس", "lat": 30.1102, "lng": 31.3108},
  {"name_en": "Alf Maskan", "name_ar": "ألف مسكن", "lat": 30.1082, "lng": 31.3028},
  {"name_en": "Heliopolis", "name_ar": "مصر الجديدة", "lat": 30.1012, "lng": 31.3128},
  {"name_en": "Haroun", "name_ar": "هارون", "lat": 30.0952, "lng": 31.3218},
  {"name_en": "Al-Ahram", "name_ar": "الأهرام", "lat": 30.0922, "lng": 31.3328},
  {"name_en": "Koleyt El-Banat", "name_ar": "كلية البنات", "lat": 30.0882, "lng": 31.3428},
  {"name_en": "Stadium", "name_ar": "الاستاد", "lat": 30.0712, "lng": 31.3258},
  {"name_en": "Fair Zone", "name_ar": "أرض المعارض", "lat": 30.0732, "lng": 31.3158},
  {"name_en": "Abbassiya", "name_ar": "العباسية", "lat": 30.0683, "lng": 31.2828},
  {"name_en": "Abdou Pasha", "name_ar": "عبده باشا", "lat": 30.0622, "lng": 31.2728},
  {"name_en": "El-Geish", "name_ar": "الجيش", "lat": 30.0572, "lng": 31.2628},
  {"name_en": "Bab El-Shaaria", "name_ar": "باب الشعرية", "lat": 30.0532, "lng": 31.2528},
  {"name_en": "Ataba", "name_ar": "العتبة", "lat": 30.0519, "lng": 31.2464},
  {"name_en": "Nasser", "name_ar": "جمال عبد الناصر", "lat": 30.0532, "lng": 31.2399},
  {"name_en": "Maspero", "name_ar": "ماسبيرو", "lat": 30.0552, "lng": 31.2319},
  {"name_en": "Safaa Hegazy", "name_ar": "صفاء حجازي", "lat": 30.0622, "lng": 31.2229},
  {"name_en": "Kit Kat", "name_ar": "الكيت كات", "lat": 30.0652, "lng": 31.2129}
]'::jsonb)
ON CONFLICT (id) DO UPDATE SET stations = EXCLUDED.stations;
