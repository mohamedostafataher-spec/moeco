-- SQL fix for Calculator and Error Logs
-- Run this in your Supabase SQL Editor

-- 1. Create or replace ERROR LOGS table
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    stack TEXT,
    screen TEXT,
    user_email TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on RLS and add basic policies
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for all users" ON public.error_logs
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read for authenticated users only" ON public.error_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Create or replace CONSUMPTION RECORDS
CREATE TABLE IF NOT EXISTS public.consumption_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sector TEXT NOT NULL, -- e.g., 'energy', 'water', 'transport'
    value NUMERIC NOT NULL,
    unit TEXT,
    carbon_impact NUMERIC,
    cost NUMERIC,
    description TEXT,
    record_date DATE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own consumption records" 
    ON public.consumption_records FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own consumption records" 
    ON public.consumption_records FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own consumption records" 
    ON public.consumption_records FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consumption records" 
    ON public.consumption_records FOR DELETE 
    USING (auth.uid() = user_id);

-- 3. Create or replace TRANSPORT EMISSIONS
CREATE TABLE IF NOT EXISTS public.transport_emissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transport_type TEXT NOT NULL,
    distance_km NUMERIC NOT NULL,
    co2_emissions NUMERIC,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transport_emissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own transport emissions" 
    ON public.transport_emissions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own transport emissions" 
    ON public.transport_emissions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own transport emissions" 
    ON public.transport_emissions FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transport emissions" 
    ON public.transport_emissions FOR DELETE 
    USING (auth.uid() = user_id);

-- 4. Just in case, add green_coins and points to profiles/users
ALTER TABLE IF EXISTS public.users 
  ADD COLUMN IF NOT EXISTS green_coins INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS green_coins INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
