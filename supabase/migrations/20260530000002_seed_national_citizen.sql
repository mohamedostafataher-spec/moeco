-- Insert fallback services
INSERT INTO citizen_services (service_name_ar, service_name_en, category, fees)
SELECT 'شهادة التصالح البيئي', 'Environmental Reconciliation Certificate', 'Certificates', 50
WHERE NOT EXISTS (SELECT 1 FROM citizen_services WHERE service_name_en = 'Environmental Reconciliation Certificate');

INSERT INTO citizen_services (service_name_ar, service_name_en, category, fees)
SELECT 'رخصة تركيب طاقة شمسية', 'Solar Panel Installation Permit', 'Permits', 200
WHERE NOT EXISTS (SELECT 1 FROM citizen_services WHERE service_name_en = 'Solar Panel Installation Permit');

INSERT INTO national_missions (title_ar, title_en, description_ar, description_en)
SELECT 'أسبوع التشجير القومي', 'National Afforestation Week', 'شارك في زراعة ١٠٠٠ شجرة في محافظتك.', 'Participate in planting 1000 trees in your governorate.'
WHERE NOT EXISTS (SELECT 1 FROM national_missions WHERE title_en = 'National Afforestation Week');

INSERT INTO eco_resources (title_ar, title_en, category, content_ar, content_en)
SELECT 'دليل توفير الطاقة', 'Energy Saving Guide', 'Energy', 'خطوات بسيطة لخفض فاتورة الكهرباء', 'Simple steps to reduce your electric bill'
WHERE NOT EXISTS (SELECT 1 FROM eco_resources WHERE title_en = 'Energy Saving Guide');
