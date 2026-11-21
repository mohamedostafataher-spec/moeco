-- FIX DATATYPE MISMATCH FOR CITIES AND GOVERNORATES
-- This script aligns governorates.id and cities.governorate_id to UUIDs correctly.

-- 1. Drop constraints if they exist
ALTER TABLE IF EXISTS public.cities DROP CONSTRAINT IF EXISTS cities_governorate_id_fkey;
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_governorate_id_fkey;

-- 2. Convert governorates.id to UUID
-- Note: This generates new UUIDs if the column was integer.
ALTER TABLE public.governorates 
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id SET DATA TYPE UUID USING (gen_random_uuid()),
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Ensure columns are UUID
ALTER TABLE public.cities ALTER COLUMN governorate_id SET DATA TYPE UUID;
ALTER TABLE public.profiles ALTER COLUMN governorate_id SET DATA TYPE UUID;

-- 4. Re-establish relationships
ALTER TABLE public.cities 
ADD CONSTRAINT cities_governorate_id_fkey 
FOREIGN KEY (governorate_id) REFERENCES public.governorates(id) ON DELETE CASCADE;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_governorate_id_fkey 
FOREIGN KEY (governorate_id) REFERENCES public.governorates(id) ON DELETE SET NULL;
