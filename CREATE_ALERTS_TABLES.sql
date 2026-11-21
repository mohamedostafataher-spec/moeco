-- MOECO ALERTS ADVANCED DATABASE SETUP
-- Run this in your Supabase SQL Editor

-- 1. Create User Notifications Table for personal alerts (Smart Engine)
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title_ar TEXT,
    title_en TEXT,
    message_ar TEXT,
    message_en TEXT,
    category TEXT DEFAULT 'eco',
    severity TEXT DEFAULT 'low',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Turn on Realtime for user_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;

-- Set up RLS for user_notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can read own notifications" ON public.user_notifications;
    DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
EXCEPTION WHEN OTHERS THEN END $$;

CREATE POLICY "Users can read own notifications" ON public.user_notifications 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.user_notifications 
    FOR UPDATE USING (auth.uid() = user_id);

-- 2. Enhance Alerts Table safely
ALTER TABLE public.alerts 
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS governorate TEXT DEFAULT 'all';

-- Drop the old policy and add a public read policy for alerts
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can read alerts" ON public.alerts;
EXCEPTION WHEN OTHERS THEN END $$;

CREATE POLICY "Public can read alerts" ON public.alerts
    FOR SELECT USING (true);
