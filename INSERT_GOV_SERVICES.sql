-- Run this script in the Supabase SQL Editor to populate the government services!
INSERT INTO public.government_services 
(name_ar, name_en, category, description_ar, description_en, url, estimated_time, is_active, provider, carbon_factor_type, estimated_saving_kg, is_featured, popularity_score, usage_count, icon, steps, required_documents, office_location, working_hours)
VALUES
('تجديد بطاقة الرقم القومي', 'National ID Renewal', 'الأحوال المدنية', 'خدمة تجديد بطاقة الرقم القومي المنتهية المتاحة عبر المنصات الرقمية لتوفير الوقت وتقليل البصمة الكربونية للمواصلات.', 'Renew national ID online to save time and reduce transport carbon footprint.', 'https://digital.gov.eg/', '١٥ دقيقة (أونلاين)', true, 'وزارة الداخلية', 'transport_avoided', 4.2, true, 98, 45030, 'CreditCard',
'[{"text_ar":"تسجيل الدخول لمصر الرقمية","duration":1},{"text_ar":"بدء خدمة تجديد البطاقة","duration":2},{"text_ar":"إرفاق الأوراق والتأكيد","duration":5},{"text_ar":"دفع الرسوم إلكترونيا","duration":3},{"text_ar":"اختيار التوصيل للمنزل","duration":1}]'::jsonb,
'[{"name_ar":"صورة البطاقة القديمة","type":"أساسي"},{"name_ar":"إيصال مرافق","type":"عند الحاجة"}]'::jsonb,
'{"map_query":"أقرب قطاع أحوال مدنية","address_ar":"فروع السجل المدني المتطورة","crowd_status":75,"best_time":"الثلاثاء صباحاً","is_online":true,"needs_reservation":false,"fees_ar":"٧٥ - ١٧٥ جنيها","rating":4.5}'::jsonb,
'٨ ص - ٩ م'
),

('تجديد رخصة القيادة', 'Driver License Renewal', 'المرور', 'تجديد رخصة القيادة الملاكي من خلال البوابة الرقمية.', 'Renew personal driver license online.', 'https://traffic.moi.gov.eg/', '٢٠ دقيقة (أونلاين)', true, 'الإدارة العامة للمرور', 'transport_avoided', 5.5, true, 95, 32000, 'Car',
'[{"text_ar":"استعلام مخالفات الدفع","duration":5},{"text_ar":"طلب تجديد الرخصة","duration":3}]'::jsonb,
'[{"name_ar":"شهادة براءة ذمة","type":"أساسي"},{"name_ar":"صورة الرخصة القديمة","type":"أساسي"}]'::jsonb,
'{"map_query":"وحدات المرور الالكترونية","address_ar":"وحدات المرور أو المولات التجارية","crowd_status":80,"best_time":"الخميس صباحاً","is_online":true,"needs_reservation":true,"fees_ar":"٦٥٠ - ١٢٠٠ جنيها","rating":4.1}'::jsonb,
'٨ ص - ٣ م'
),

('استخراج شهادة ميلاد', 'Birth Certificate Issuance', 'الأحوال المدنية', 'استخراج شهادة ميلاد مميكنة وتوصيلها إلى المنزل.', 'Issue a digital birth certificate and get it delivered home.', 'https://digital.gov.eg/', '١٠ دقائق (أونلاين)', true, 'وزارة الداخلية', 'transport_avoided', 3.8, false, 96, 50000, 'Baby',
'[{"text_ar":"تسجيل الدخول بالرقم القومي","duration":2},{"text_ar":"تحديد بيانات المولود","duration":2},{"text_ar":"دفع الرسوم وتحديد العنوان","duration":3}]'::jsonb,
'[{"name_ar":"الرقم القومي للوالدين","type":"أساسي"}]'::jsonb,
'{"map_query":"السجل المدني","address_ar":"أقرب سجل مدني وتوصيل للمنازل","crowd_status":40,"best_time":"طوال اليوم (أونلاين)","is_online":true,"needs_reservation":false,"fees_ar":"٧٥ جنيها","rating":4.8}'::jsonb,
'٢٤ ساعة (أونلاين)'
),

('حجز استشارة طبية بالتأمين الصحي', 'Health Insurance Checkup', 'الصحة', 'حجز موعد إلكتروني لعيادات التأمين الصحي وتقليل الانتظار.', 'Book a health insurance clinic appointment.', 'https://www.hiocares.com/', '٥ دقائق', true, 'هيئة التأمين الصحي', 'efficiency', 2.0, false, 70, 15000, 'Heart',
'[{"text_ar":"إدخال كود التأمين","duration":1},{"text_ar":"اختيار التخصص والعيادة","duration":2},{"text_ar":"تحديد الموعد التأكيدي","duration":1}]'::jsonb,
'[{"name_ar":"بطاقة التأمين الصحي","type":"أساسي"},{"name_ar":"بطاقة الرقم القومي","type":"أساسي"}]'::jsonb,
'{"map_query":"عيادات التأمين الصحي","address_ar":"العيادات الحكومية الشاملة","crowd_status":60,"best_time":"الصباح الباكر","is_online":false,"needs_reservation":true,"fees_ar":"مجاناً","rating":4.2}'::jsonb,
'٨ ص - ٤ م'
),

('دفع فواتير الكهرباء', 'Pay Electricity Bills', 'المالية', 'الاستعلام عن ودفع فواتير الكهرباء إلكترونياً مع نصائح لترشيد الاستهلاك.', 'Inquire and pay electricity bills digitally.', 'https://www.eehc.gov.eg/', '٥ دقائق', true, 'وزارة الكهرباء', 'efficiency', 1.5, true, 80, 70000, 'Zap',
'[{"text_ar":"إدخال كود الدفع الإلكتروني","duration":1},{"text_ar":"مراجعة قيمة الفاتورة","duration":2},{"text_ar":"تأكيد الدفع","duration":1}]'::jsonb,
'[{"name_ar":"كود الدفع الموحد (العداد)","type":"أساسي"}]'::jsonb,
'{"map_query":"شركات توزيع الكهرباء","address_ar":"منافذ فوري أو محفظة إلكترونية","crowd_status":10,"best_time":"متوفر دائما","is_online":true,"needs_reservation":false,"fees_ar":"بدون رسوم إضافية","rating":4.9}'::jsonb,
'٢٤ ساعة'
),

('الاستعلام عن الشقق الاسكان', 'Housing Inquiry', 'الإسكان', 'متابعة حالة حجوزات شقق الاسكان الاجتماعي.', 'Inquire about social housing reservations.', 'https://cservices.shmff.gov.eg/', '١٥ دقيقة', true, 'صندوق الإسكان الاجتماعي', 'transport_avoided', 4.0, false, 65, 12000, 'Building2',
'[{"text_ar":"تسجيل الدخول بالموقع","duration":2},{"text_ar":"الاستعلام عن حالة الطلب","duration":2}]'::jsonb,
'[{"name_ar":"الرقم القومي","type":"أساسي"},{"name_ar":"رقم كراسة الشروط","type":"أساسي"}]'::jsonb,
'{"map_query":"وزارة الاسكان","address_ar":"أونلاين عبر البوابة","crowd_status":30,"best_time":"متوفر دائما","is_online":true,"needs_reservation":false,"fees_ar":"مجاناً","rating":4.6}'::jsonb,
'٢٤ ساعة'
),

('استخراج جواز السفر', 'Passport Issuance', 'الصحة', 'إصدار وتجديد جوازات السفر.', 'Issue/Renew passports.', 'https://passports.gov.eg/', 'ساعة', true, 'الجوازات والهجرة', 'efficiency', 2.1, false, 85, 21000, 'Briefcase',
'[{"text_ar":"حجز موعد أونلاين","duration":2},{"text_ar":"تجهيز الأوراق والذهاب للفرع","duration":0}]'::jsonb,
'[{"name_ar":"الرقم القومي الساري","type":"أساسي"},{"name_ar":"الموقف التجنيدي","type":"أساسي"}]'::jsonb,
'{"map_query":"إدارة الجوازات العباسية","address_ar":"الجوازات بالعباسية والفروع","crowd_status":90,"best_time":"الأحد صباحاً","is_online":false,"needs_reservation":true,"fees_ar":"١٠٠٠ - ١٤٥٠ جنيها","rating":4.0}'::jsonb,
'٨ ص - ٢:٣٠ م'
);
