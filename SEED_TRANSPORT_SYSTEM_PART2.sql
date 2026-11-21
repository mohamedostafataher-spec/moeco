-- ============================================================================
-- الجزء الثاني: تغذية قاعدة البيانات والمحطات والأسعار والمعاملات بالكامل (Part 2)
-- تحديث: تم إصلاح جميع معرفات UUID لتكون متوافقة تماماً وبحيث لا تحتوي على أخطاء تركيبية
-- ============================================================================

-- A. بذر وتغذية البيانات التاريخية/Legacy للـ transport_services لمنع كسر الشاشات القديمة
INSERT INTO public.transport_services (
    id, name, type, route_name, price, carbon_impact_kg, live_status,
    stops, current_location, service_name, service_type, base_fare, coverage_area
) VALUES 
(
    'ef85ad1c-d06f-41ae-a854-3fc9bbb24612',
    'الخط الأول للمترو (حلوان - المرج الجديدة)', 'metro', 'metro_l1', 10, 0.040, 'active',
    '["حلوان", "عين حلوان", "جامعة حلوان", "المعادي", "زهراء المعادي", "دار السلام", "مار جرجس", "السيدة زينب", "السادات", "جمال عبد الناصر", "عرابي", "الشهداء", "عزبة النخل", "المرج الجديدة"]'::jsonb,
    '{"lat": 30.0444, "lng": 31.2357}'::jsonb,
    'Metro Line 1 (Helwan - Marg)', 'metro', 10, 'Greater Cairo (Cairo, Giza, Qalyubia)'
),
(
    'a376b8b2-f64d-4639-8e8e-d03c3f09122b',
    'الخط الثاني للمترو (شبرا - المنيب)', 'metro', 'metro_l2', 10, 0.040, 'active',
    '["شبرا الخيمة", "كلية الزراعة", "الخلفاوي", "الشهداء", "العتبة", "السادات", "الدقي", "جامعة القاهرة", "الجيزة", "المنيب"]'::jsonb,
    '{"lat": 30.0636, "lng": 31.2467}'::jsonb,
    'Metro Line 2 (Shobra - Mounib)', 'metro', 10, 'Greater Cairo (Cairo, Giza, Qalyubia)'
),
(
    '9a1dc1d7-1fef-486f-a9bb-3d2fb6fd9cb1',
    'الخط الثالث للمترو (عدلي منصور - الكيت كات)', 'metro', 'metro_l3', 10, 0.040, 'active',
    '["عدلي منصور", "الهايكستب", "هشام بركات", "ألف مسكن", "هارون", "العباسية", "العتبة", "جمال عبد الناصر", "الكيت كات"]'::jsonb,
    '{"lat": 30.0519, "lng": 31.2464}'::jsonb,
    'Metro Line 3 (Green Line)', 'metro', 10, 'Greater Cairo (Cairo, Giza)'
),
(
    '4ae3c7e5-2702-454c-8761-dca79243a0c8',
    'الخط الرابع للمترو (حدائق الأشجار - الفسطاط)', 'metro', 'metro_l4', 15, 0.040, 'active',
    '["حدائق الأشجار", "المتحف المصري الكبير", "الرماية", "الأهرامات", "المريوطية", "الجيزة", "الملك الصالح", "الفسطاط"]'::jsonb,
    '{"lat": 29.9954, "lng": 31.1152}'::jsonb,
    'Metro Line 4 (Pharaonic Line)', 'metro', 15, 'Giza, Pyramids, October 6'
),
(
    'cee44cfa-d5f4-4bf2-b8ff-650a132bfc19',
    'مونوريل شرق النيل (الاستاد - العاصمة الإدارية)', 'monorail', 'monorail_east', 20, 0.030, 'active',
    '["الاستاد", "هشام بركات", "المشير طنطاوي", "مسجد الفتاح العليم", "حي المال والأعمال", "مدينة الفنون والثقافة", "مدينة العدالة"]'::jsonb,
    '{"lat": 30.0712, "lng": 31.3258}'::jsonb,
    'East Nile Monorail (Stadium - Administrative Capital)', 'monorail', 20, 'Cairo, New Cairo, Administrative Capital'
),
(
    '897dd7b2-c0e4-46df-a8b2-b12e3f4da891',
    'مونوريل غرب النيل (وادي النيل - أكتوبر الجديدة)', 'monorail', 'monorail_west', 20, 0.030, 'active',
    '["وادي النيل", "بشتيل", "الشيخ زايد", "مول مصر", "جامعة 6 أكتوبر", "أكتوبر الجديدة"]'::jsonb,
    '{"lat": 30.0642, "lng": 31.1982}'::jsonb,
    'West Nile Monorail (Wadi El-Nile - New October)', 'monorail', 20, 'Giza, Sheikh Zayed, October 6'
),
(
    '7892b1da-f155-4422-91f1-33124df8ac12',
    'القطار الكهربائي الخفيف (LRT)', 'lrt', 'lrt_egypt', 10, 0.035, 'active',
    '["عدلي منصور", "العبور", "المستقبل", "الشروق", "بدر", "نيو كابيتال 1", "مدينة الفنون والثقافة"]'::jsonb,
    '{"lat": 30.145, "lng": 31.406}'::jsonb,
    'Light Rail Transit (LRT)', 'lrt', 10, 'Cairo, Shorouk, Badr, New Capital'
),
(
    '5b172a91-faab-467f-972a-9e12ff48123a',
    'الأوتوبيس الترددي السريع (BRT) - الطريق الدائري', 'bus', 'brt_ring_road', 15, 0.050, 'active',
    '["المشير طنطاوي", "كايرو فيستيفال سيتي", "طريق السويس", "موقف العاشر", "المرج", "مسطرد", "قليوب", "الوراق", "المريوطية", "المنيب"]'::jsonb,
    '{"lat": 30.035, "lng": 31.405}'::jsonb,
    'Bus Rapid Transit (BRT) - Ring Road', 'bus', 15, 'Ring Road Highway (Greater Cairo)'
);


-- B. بذر بيانات مسارات النقل التفصيلية (transport_routes)
INSERT INTO public.transport_routes (route_id, route_name_ar, route_name_en, mode_type, operator_name, line_color) VALUES 
('ef85ad1c-d06f-41ae-a854-3fc9bbb24612', 'الخط الأول للمترو', 'Metro Line 1', 'metro', 'Egyptian Co. for Metro', '#0000FF'),
('a376b8b2-f64d-4639-8e8e-d03c3f09122b', 'الخط الثاني للمترو', 'Metro Line 2', 'metro', 'Egyptian Co. for Metro', '#FF0000'),
('9a1dc1d7-1fef-486f-a9bb-3d2fb6fd9cb1', 'الخط الثالث للمترو', 'Metro Line 3', 'metro', 'RATP Dev Cairo', '#00FF00'),
('4ae3c7e5-2702-454c-8761-dca79243a0c8', 'الخط الرابع للمترو', 'Metro Line 4', 'metro', 'Ministry of Transport', '#FFFF00'),
('cee44cfa-d5f4-4bf2-b8ff-650a132bfc19', 'مونوريل شرق النيل', 'East Nile Monorail', 'monorail', 'Alstom Egypt', '#FFA500'),
('897dd7b2-c0e4-46df-a8b2-b12e3f4da891', 'مونوريل غرب النيل', 'West Nile Monorail', 'monorail', 'Alstom Egypt', '#800080'),
('7892b1da-f155-4422-91f1-33124df8ac12', 'القطار الكهربائي الخفيف (LRT)', 'Light Rail Transit (LRT)', 'lrt', 'RATP Dev Cairo', '#00FFFF'),
('5b172a91-faab-467f-972a-9e12ff48123a', 'الأوتوبيس الترددي السريع (BRT)', 'Bus Rapid Transit (BRT)', 'brt', 'Ministry of Transport', '#FF4500'),
('a87f1cb2-2e11-4775-812d-a1288cd916c2', 'ترام الإسكندرية (الخط الأزرق)', 'Alexandria Tram (Blue Line)', 'tram', 'Alex Alexandria Transit', '#1E90FF');


-- C. بذر المحطات الجغرافية الاستراتيجية الحقيقية بنظام إحداثيات (WGS 84 EPSG:4326)
INSERT INTO public.transport_stations (station_id, station_name_ar, station_name_en, geom, station_type, governorate, operating_hours_start, operating_hours_end, station_density_level, estimated_emissions_factor, station_status) VALUES
('5c0f1ab1-789a-413d-815d-a123bc456e71', 'حلوان', 'Helwan', 'SRID=4326;POINT(31.3258 29.8415)'::geometry, 'at-grade', 'Cairo', '05:00:00', '01:00:00', 'high', 0.0000, 'active'),
('d7890a1c-324b-4b10-85f1-3d2f9bc24a12', 'السادات', 'Sadat', 'SRID=4326;POINT(31.2336 30.0469)'::geometry, 'interchange', 'Cairo', '05:00:00', '01:00:00', 'critical', 0.0000, 'active'),
('f156bc8a-45d2-43fa-b12e-a12fbc45ea13', 'الشهداء', 'Al-Shohadaa', 'SRID=4326;POINT(31.2467 30.0636)'::geometry, 'interchange', 'Cairo', '05:00:00', '01:00:00', 'critical', 0.0000, 'active'),
('bc8fab1c-bcde-4211-85fd-e1bcdef24a14', 'جامعة القاهرة', 'Cairo University', 'SRID=4326;POINT(31.2008 30.0263)'::geometry, 'interchange', 'Giza', '05:00:00', '01:00:00', 'high', 0.0000, 'active'),
('ad12b34c-45ef-45fa-b12f-3bcdef123abc', 'عدلي منصور', 'Adly Mansour', 'SRID=4326;POINT(31.4211 30.1450)'::geometry, 'interchange', 'Cairo', '05:00:00', '01:00:00', 'high', 0.0000, 'active'),
('d156ef12-42ef-45fa-b15a-4bcdef156bc2', 'الاستاد', 'Stadium', 'SRID=4326;POINT(31.3258 30.0712)'::geometry, 'elevated', 'Cairo', '05:00:00', '01:00:00', 'moderate', 0.0000, 'active'),
('a89dec12-3df4-411a-12eb-f12bcde45f12', 'مدينة الفنون والثقافة', 'Arts & Culture City', 'SRID=4326;POINT(31.7589 30.0051)'::geometry, 'elevated', 'Cairo', '05:00:00', '23:00:00', 'low', 0.0000, 'active'),
('a15bc82d-45df-4a11-85fa-a123cbfa3412', 'فيكتوريا', 'Victoria', 'SRID=4326;POINT(29.9052 31.1947)'::geometry, 'at-grade', 'Alexandria', '05:00:00', '23:00:00', 'high', 0.0000, 'active'),
('b782cda1-23ef-4df1-81bc-d12fbea45612', 'طريق السويس', 'Suez Road', 'SRID=4326;POINT(31.4050 30.0350)'::geometry, 'at-grade', 'Cairo', '05:00:00', '23:00:00', 'moderate', 0.0000, 'active'),
('e7ef1ab1-12cd-4ef1-85bc-a123fbcdef12', 'العين السخنة', 'Ain Sokhna', 'SRID=4326;POINT(32.3251 29.5891)'::geometry, 'at-grade', 'Suez', '06:00:00', '22:00:00', 'low', 0.0000, 'planned');


-- D. ربط المسارات بالمحطات بالترتيب التسلسلي (transport_route_stations)
INSERT INTO public.transport_route_stations (route_id, station_id, station_order) VALUES
('ef85ad1c-d06f-41ae-a854-3fc9bbb24612', '5c0f1ab1-789a-413d-815d-a123bc456e71', 1),
('ef85ad1c-d06f-41ae-a854-3fc9bbb24612', 'd7890a1c-324b-4b10-85f1-3d2f9bc24a12', 12),
('ef85ad1c-d06f-41ae-a854-3fc9bbb24612', 'f156bc8a-45d2-43fa-b12e-a12fbc45ea13', 15),
('a376b8b2-f64d-4639-8e8e-d03c3f09122b', 'f156bc8a-45d2-43fa-b12e-a12fbc45ea13', 5),
('a376b8b2-f64d-4639-8e8e-d03c3f09122b', 'd7890a1c-324b-4b10-85f1-3d2f9bc24a12', 8),
('a376b8b2-f64d-4639-8e8e-d03c3f09122b', 'bc8fab1c-bcde-4211-85fd-e1bcdef24a14', 12),
('9a1dc1d7-1fef-486f-a9bb-3d2fb6fd9cb1', 'bc8fab1c-bcde-4211-85fd-e1bcdef24a14', 1),
('9a1dc1d7-1fef-486f-a9bb-3d2fb6fd9cb1', 'ad12b34c-45ef-45fa-b12f-3bcdef123abc', 25),
('cee44cfa-d5f4-4bf2-b8ff-650a132bfc19', 'd156ef12-42ef-45fa-b15a-4bcdef156bc2', 1),
('cee44cfa-d5f4-4bf2-b8ff-650a132bfc19', 'a89dec12-3df4-411a-12eb-f12bcde45f12', 22),
('7892b1da-f155-4422-91f1-33124df8ac12', 'ad12b34c-45ef-45fa-b12f-3bcdef123abc', 1),
('7892b1da-f155-4422-91f1-33124df8ac12', 'a89dec12-3df4-411a-12eb-f12bcde45f12', 9),
('5b172a91-faab-467f-972a-9e12ff48123a', 'ad12b34c-45ef-45fa-b12f-3bcdef123abc', 1),
('5b172a91-faab-467f-972a-9e12ff48123a', 'b782cda1-23ef-4df1-81bc-d12fbea45612', 12);


-- E. بذر تعرفة تذاكر النقل الرسمية بالكامل لعام 2026 (الزيادة الكلية والشرائح)
INSERT INTO public.transport_prices (route_id, units_min, units_max, price_egp, egp_price_concession, is_subscription_only) VALUES
('ef85ad1c-d06f-41ae-a854-3fc9bbb24612', 1, 9, 10.00, 5.00, false),
('ef85ad1c-d06f-41ae-a854-3fc9bbb24612', 10, 16, 12.00, 6.00, false),
('ef85ad1c-d06f-41ae-a854-3fc9bbb24612', 17, 23, 15.00, 7.50, false),
('ef85ad1c-d06f-41ae-a854-3fc9bbb24612', 24, 39, 20.00, 10.00, false),
('a376b8b2-f64d-4639-8e8e-d03c3f09122b', 1, 9, 10.00, 5.00, false),
('a376b8b2-f64d-4639-8e8e-d03c3f09122b', 10, 16, 12.00, 6.00, false),
('a376b8b2-f64d-4639-8e8e-d03c3f09122b', 17, 23, 15.00, 7.50, false),
('a376b8b2-f64d-4639-8e8e-d03c3f09122b', 24, 39, 20.00, 10.00, false),
('9a1dc1d7-1fef-486f-a9bb-3d2fb6fd9cb1', 1, 9, 10.00, 5.00, false),
('9a1dc1d7-1fef-486f-a9bb-3d2fb6fd9cb1', 10, 16, 12.00, 6.00, false),
('9a1dc1d7-1fef-486f-a9bb-3d2fb6fd9cb1', 17, 23, 15.00, 7.50, false),
('9a1dc1d7-1fef-486f-a9bb-3d2fb6fd9cb1', 24, 39, 20.00, 10.00, false),
('cee44cfa-d5f4-4bf2-b8ff-650a132bfc19', 1, 5, 20.00, 10.00, false),
('cee44cfa-d5f4-4bf2-b8ff-650a132bfc19', 6, 10, 40.00, 20.00, false),
('cee44cfa-d5f4-4bf2-b8ff-650a132bfc19', 11, 15, 55.00, 27.50, false),
('cee44cfa-d5f4-4bf2-b8ff-650a132bfc19', 16, 22, 80.00, 40.00, false),
('7892b1da-f155-4422-91f1-33124df8ac12', 1, 3, 10.00, 5.00, false),
('7892b1da-f155-4422-91f1-33124df8ac12', 4, 5, 15.00, 7.50, false),
('7892b1da-f155-4422-91f1-33124df8ac12', 6, 20, 20.00, 10.00, false),
('5b172a91-faab-467f-972a-9e12ff48123a', 1, 99, 15.00, 8.00, false),
('a87f1cb2-2e11-4775-812d-a1288cd916c2', 1, 99, 5.00, 2.50, false);


-- F. بذر الأماكن والمزارات السياحية بأسمائها ووصفها الثنائي ورسوم تذاكرها وإحداثياتها
INSERT INTO public.tourist_places (place_id, place_name_ar, place_name_en, place_description_ar, place_description_en, geom, foreigner_adult_fee, foreigner_student_fee, egyptian_adult_fee, egyptian_student_fee, working_hours, place_category, official_website, ratings, image_url) VALUES
(
    'a01ef1ab-bcde-4ef1-85bc-a123bcdef123', 'المتحف المصري الكبير', 'Grand Egyptian Museum',
    'أكبر متحف أثري في العالم مخصص لحضارة واحدة، يقع بجوار أهرامات الجيزة ويضم مجموعة توت عنخ آمون الكاملة والمتاحف الفرعية المتألقة.',
    'The largest archaeological museum in the world dedicated to a single civilization, housing Tutankhamuns complete treasures near Giza Pyramids.',
    'SRID=4326;POINT(31.1152 29.9954)'::geometry, 1500.00, 750.00, 250.00, 125.00,
    '{"summer": "08:30-18:00", "winter": "09:00-17:00", "ramadan": "09:00-15:00"}'::jsonb,
    'museum', 'https://visit-gem.com', 4.9, 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=600'
),
(
    'a02ef1ab-bcde-4ef1-85bc-a123bcdef124', 'المتحف المصري بالتحرير', 'Egyptian Museum Tahrir',
    'المتحف التاريخي الكلاسيكي في قلب القاهرة بميدان التحرير، يضم مئات الآلاف من المومياوات الذهبية والتماثيل العريقة الفرعونية.',
    'The historic classic museum situated in Midan Tahrir, housing hundreds of thousands of pharaonic monuments and golden statues.',
    'SRID=4326;POINT(31.2336 30.0469)'::geometry, 550.00, 280.00, 180.00, 90.00,
    '{"normal": "09:00-17:00"}'::jsonb,
    'museum', 'https://egymonuments.gov.eg', 4.8, 'https://images.unsplash.com/photo-1600577916048-804c9191e36c?q=80&w=600'
),
(
    'a03ef1ab-bcde-4ef1-85bc-a123bcdef125', 'مجمع أهرامات الجيزة', 'Giza Pyramids Complex',
    'إحدى عجائب الدنيا السبع القديمة، تشمل الهرم الأكبر للملك خوفو، خفرع، ومنقرع بجوار تمثال أبو الهول العظيم.',
    'One of the Seven Wonders of the Ancient World, containing the Great Pyramids of Khufu, Khafre, Menkaure, and the Great Sphinx.',
    'SRID=4326;POINT(31.1313 29.9772)'::geometry, 700.00, 350.00, 120.00, 60.00,
    '{"daily": "07:00-17:00"}'::jsonb,
    'monument', 'https://egymonuments.gov.eg', 4.9, 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?q=80&w=600'
),
(
    'a04ef1ab-bcde-4ef1-85bc-a123bcdef126', 'الكنيسة المعلقة', 'The Hanging Church',
    'واحدة من أقدم الكنائس المسيحية الأثرية في مصر، تقع بمنطقة مصر القديمة (مجمع الأديان) فوق برجين من حصن بابليون الأثري العريق.',
    'One of Eygpts oldest Christian basilicas, located in Coptic Cairo suspended above the towers of the fortress of Babylon.',
    'SRID=4326;POINT(31.2302 30.0052)'::geometry, 0.00, 0.00, 0.00, 0.00,
    '{"daily": "09:00-16:00"}'::jsonb,
    'church', NULL, 4.7, 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=600'
),
(
    'a05ef1ab-bcde-4ef1-85bc-a123bcdef127', 'مسجد السلطان حسن', 'Sultan Hassan Mosque',
    'درة العمارة الإسلامية المملوكية في العالم، يقع بجوار القلعة ويمثل قمة الفخامة والديناميكية والاتساع الهندسي المهيب.',
    'A masterpiece of Mamluk Islamic architecture, located near the Citadel of Cairo and revered for its majestic proportions.',
    'SRID=4326;POINT(31.2563 30.0321)'::geometry, 200.00, 100.00, 80.00, 40.00,
    '{"normal": "09:00-17:00"}'::jsonb,
    'mosque', NULL, 4.8, 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=600'
);


-- G. ربط المعالم بالمحطات المجاورة عبر مسار قابل للمشي (station_landmarks)
INSERT INTO public.station_landmarks (station_id, place_id, distance_meters, is_walkable) VALUES
('d7890a1c-324b-4b10-85f1-3d2f9bc24a12', 'a02ef1ab-bcde-4ef1-85bc-a123bcdef124', 250.00, true),
('5c0f1ab1-789a-413d-815d-a123bc456e71', 'a04ef1ab-bcde-4ef1-85bc-a123bcdef126', 1200.00, true);


-- H. دليل معاملات بوابة مصر الرقمية والخدمات الحكومية والروابط المؤكدة في الجدول (government_services)
INSERT INTO public.government_services (service_id, service_name_ar, service_name_en, official_portal_url, category, description, schedule_fees, required_documents, working_hours, office_coordinates, closest_station_id) VALUES
(
    'a01ef1ab-bcde-4ef1-a122-bcdef123abc1', 'الاستعلام عن المخالفات المرورية وسدادها', 'Enquiry & Payment of Traffic Violations',
    'https://traffic.moi.gov.eg', 'traffic', 
    'خدمة فورية تتيح الاستعلام عن مخالفات رخص القيادة وتراخيص السيارات وسداد الغرامات المترتبة عليها إلكترونياً دون مغادرة المنزل.',
    '{"inquiry": 0, "admin_fee_min": 10, "admin_fee_max": 50, "currency": "EGP"}'::jsonb,
    'الرقم القومي لمالك المركبة، رخصة القيادة السارية، رقم اللوحة المعدنية', 'ساعات العمل الرسمية للبوابة: 24 ساعة طوال أيام الأسبوع',
    'SRID=4326;POINT(31.4211 30.1450)'::geometry, 'ad12b34c-45ef-45fa-b12f-3bcdef123abc'
),
(
    'a02ef1ab-bcde-4ef1-a122-bcdef123abc2', 'استخراج شهادة الميلاد الرقمية وتجديد قيد العائلة', 'Digital Birth Certificate Issuance',
    'https://digital.gov.eg', 'civic_records',
    'طلب ميكنة شهادات الميلاد الرسمية والقيود العائلية الرقمية وتوصيلها حتى باب المنزل برسوم مخفضة بالتعاون مع البريد المصري وقسم الأحوال المدنية.',
    '{"base_rate": 80.00, "additional_copies": 40.00, "delivery_fee": 20.00, "currency": "EGP"}'::jsonb,
    'الرقم القومي لصاحب الطلب، بيانات الأب والأم والدرجة العائلية السليمة لصلة القرابة', 'الخدمة الرقمية متوفرة متواصلة 24/7',
    'SRID=4326;POINT(31.2563 30.0321)'::geometry, 'd7890a1c-324b-4b10-85f1-3d2f9bc24a12'
),
(
    'a03ef1ab-bcde-4ef1-a122-bcdef123abc3', 'تقديم تسويات الضريبة العقارية للوحدات السكنية', 'Property Tax Unit Settlement / Submission',
    'https://digital.gov.eg', 'tax',
    'بوابة حرة مخصصة لتقديم طلبات تسوية الموقف الضريبي للمنشآت والعقارات وعرض الفواتير وتظلمات معايير التقييم العقاري الوطني لتوفير المشقة.',
    '{"submission_fee": 0, "property_audit_fee": 0, "currency": "EGP"}'::jsonb,
    'الرقم القومي السري لمالك العقار، عقد ملكية الوحدة المسجل، إيصال مرافق حديث مياه أو غاز أو كهرباء', 'بوابة الضرائب العقارية الرقمية مفتوحة بشكل متواصل',
    'SRID=4326;POINT(31.2336 30.0469)'::geometry, 'd7890a1c-324b-4b10-85f1-3d2f9bc24a12'
),
(
    'a04ef1ab-bcde-4ef1-a122-bcdef123abc4', 'رفع وقيد الدعاوى القضائية عبر بوابات العدالة الإلكترونية', 'Lawsuit Filing Portal',
    'https://esc.gov.eg/en/e-justice-portal/', 'justice',
    'منصة المحاماة والقضاء المتكاملة لقيد الدعاوى التجارية والمدنية والإدارية وجدول الجلسات الرقمي دون الحضور الفعلي للمقرات.',
    '{"minimum_lawsuit_fee": 200.00, "maximum_lawsuit_fee": 1000.00, "currency": "EGP"}'::jsonb,
    'كارنيه نقابة المحامين الساري، توكيل رسمي بالقضايا، عريضة الدعوى الموقعة من المحامي المقبول إلكترونياً', 'متوافق مع مواعيد العمل الرسمية للمحاكم والنيابات من 09:00 صباحاً حتى 03:00 مساءً',
    'SRID=4326;POINT(31.2008 30.0263)'::geometry, 'bc8fab1c-bcde-4211-85fd-e1bcdef24a14'
);


-- I. تفعيل الرصد الهوائي اللحظي ومحطات الرصد الهوائي المحدثة (air_quality_logs)
INSERT INTO public.air_quality_logs (sensor_id, sensor_name, geom, current_aqi, primary_pollutant, recorded_at) VALUES
('13842', 'US Embassy Cairo Air Monitor', 'SRID=4326;POINT(31.2336 30.0469)'::geometry, 42, 'PM2.5', NOW() - INTERVAL '10 minutes'),
('248281', 'Mokattam Street 17 Air Monitor', 'SRID=4326;POINT(31.2514 29.9812)'::geometry, 112, 'PM10', NOW() - INTERVAL '15 minutes');


-- J. إدخال مؤشرات الاستهلاك السنوية والبيئية التفصيلية (environmental_data)
INSERT INTO public.environmental_data (station_id, aqi_us, pm25_concentration, pm10_concentration, co_concentration, so2_concentration, temperature_celsius, humidity_percentage, wind_speed_kmh, kwh_consumption_energy, water_consumption_m3) VALUES
('5c0f1ab1-789a-413d-815d-a123bc456e71', 48, 12.50, 24.00, 1.20, 0.05, 28.5, 45, 14.50, 42100.50, 1540.00),
('d7890a1c-324b-4b10-85f1-3d2f9bc24a12', 124, 44.20, 89.10, 3.80, 0.22, 29.0, 50, 10.20, 125000.00, 4800.50);


-- K. بذر مضلعات وجغرافية الحدود الإقليمية للمحافظات لـ GIS الافتراضي (gis_layers)
INSERT INTO public.gis_layers (layer_name, layer_type, geom, metadata_payload) VALUES
(
    'حدود محافظة القاهرة الكبرى الأثرية', 'boundary_governorate',
    'SRID=4326;POLYGON((31.15 29.90, 31.45 29.90, 31.45 30.20, 31.15 30.20, 31.15 29.90))'::geometry,
    '{"area_km2": 3085.12, "population_2026": 10450000, "capital": "Cairo"}'::jsonb
),
(
    'حدود محافظة الجيزة والواحات', 'boundary_governorate',
    'SRID=4326;POLYGON((31.00 29.50, 31.30 29.50, 31.30 30.15, 31.00 30.15, 31.00 29.50))'::geometry,
    '{"area_km2": 13184.00, "population_2026": 9100000, "capital": "Giza"}'::jsonb
);

-- تحديث فوري فائق لذاكرة الكاش لـ Supabase لعرض الجداول الجديدة بأعلى سرعة
NOTIFY pgrst, 'reload schema';
