CREATE TABLE IF NOT EXISTS public.sustainability_goals (
    id SERIAL PRIMARY KEY,
    key_name TEXT UNIQUE NOT NULL,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    target_value NUMERIC NOT NULL,
    current_value NUMERIC NOT NULL DEFAULT 0,
    unit TEXT,
    color TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.sustainability_goals (key_name, title_ar, title_en, target_value, current_value, unit, color) VALUES
('renewable_energy', 'الطاقة المتجددة', 'Renewable Energy', 42, 28.5, '%', 'bg-emerald-500'),
('carbon_reduction', 'خفض انبعاثات الكربون', 'Carbon Reduction', 30, 15.2, '%', 'bg-blue-500'),
('waste_recycling', 'إعادة تدوير المخلفات', 'Waste Recycling', 25, 14.0, '%', 'bg-amber-500')
ON CONFLICT (key_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    user_id UUID,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.audit_logs (action, details, timestamp) VALUES
('SYSTEM_START', '{"status": "System initialized"}', NOW() - INTERVAL '10 days'),
('UPDATE_METRICS', '{"source": "National Grid"}', NOW() - INTERVAL '2 days');
