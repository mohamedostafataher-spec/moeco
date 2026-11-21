import fs from 'fs';

const query = `
INSERT INTO public.government_services 
(name_ar, name_en, category, description_ar, description_en, url, estimated_time, is_active, provider, carbon_factor_type, estimated_saving_kg, is_featured, popularity_score, usage_count, icon, steps, required_documents, office_location, working_hours)
VALUES
('تجديد بطاقة الرقم القومي', 'National ID Renewal', 'الأحوال المدنية', 'خدمة تجديد بطاقة الرقم القومي المنتهية المتاحة عبر المنصات الرقمية لتوفير الوقت.', 'Renew national ID online.', 'https://digital.gov.eg/', '١٥ دقيقة (أونلاين)', true, 'وزارة الداخلية', 'transport_avoided', 4.2, true, 98, 45030, 'CreditCard',
'[{"text_ar":"تسجيل الدخول لمصر الرقمية","duration":1},{"text_ar":"بدء خدمة تجديد البطاقة","duration":2},{"text_ar":"إرفاق الأوراق والتأكيد","duration":5},{"text_ar":"دفع الرسوم إلكترونيا","duration":3},{"text_ar":"اختيار التوصيل للمنزل","duration":1}]'::jsonb,
'[{"name_ar":"صورة البطاقة القديمة","type":"أساسي"},{"name_ar":"إيصال مرافق","type":"عند الحاجة"}]'::jsonb,
'{"map_query":"أقرب قطاع أحوال مدنية","address_ar":"فروع السجل المدني المتطورة","crowd_status":75,"best_time":"الثلاثاء صباحاً","is_online":true,"needs_reservation":false,"fees_ar":"٧٥ - ١٧٥ جنيها","rating":4.5}'::jsonb,
'٨ ص - ٩ م'
),
('تجديد رخصة القيادة', 'Driver License Renewal', 'المرور', 'تجديد رخصة القيادة الملاكي من خلال البوابة الرقمية.', 'Renew personal driver license online.', 'https://traffic.moi.gov.eg/', '٢٠ دقيقة (أونلاين)', true, 'الإدارة العامة للمرور', 'transport_avoided', 5.5, true, 95, 32000, 'Car',
'[{"text_ar":"استعلام مخلفات الدفع","duration":5},{"text_ar":"طلب تجديد الرخصة","duration":3}]'::jsonb,
'[{"name_ar":"شهادة براءة ذمة","type":"أساسي"},{"name_ar":"صورة الرخصة القديمة","type":"أساسي"}]'::jsonb,
'{"map_query":"وحدات المرور الالكترونية","address_ar":"وحدات المرور أو المولات التجارية","crowd_status":80,"best_time":"الخميس صباحاً","is_online":true,"needs_reservation":true,"fees_ar":"٦٥٠ - ١٢٠٠ جنيها","rating":4.1}'::jsonb,
'٨ ص - ٣ م'
),
('استخراج جواز السفر', 'Passport Issuance', 'السفر والهجرة', 'إصدار وتجديد جوازات السفر.', 'Issue/Renew passports.', 'https://passports.gov.eg/', 'ساعة', true, 'الجوازات والهجرة', 'efficiency', 2.1, false, 85, 21000, 'Briefcase',
'[{"text_ar":"حجز موعد أونلاين","duration":2},{"text_ar":"تجهيز الأوراق والذهاب للفرع","duration":0}]'::jsonb,
'[{"name_ar":"الرقم القومي الساري","type":"أساسي"},{"name_ar":"الموقف التجنيدي","type":"أساسي"}]'::jsonb,
'{"map_query":"إدارة الجوازات العباسية","address_ar":"الجوازات بالعباسية والفروع","crowd_status":90,"best_time":"الأحد صباحاً","is_online":false,"needs_reservation":true,"fees_ar":"١٠٠٠ - ١٤٥٠ جنيها","rating":4.0}'::jsonb,
'٨ ص - ٢:٣٠ م'
);
`;

fs.writeFileSync('insert_gov_services.sql', query);
console.log("SQL generated!");
