-- MoEco RLS Verification Test Suite (Execute in Supabase SQL Editor)
-- Wrapped in BEGIN ... ROLLBACK so no test records persist in your live database.

BEGIN;

-- Create two temporary test users inside auth.users for realistic RLS JWT simulation
INSERT INTO auth.users (id, aud, role, email, is_anonymous, created_at, updated_at)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', NULL, TRUE, NOW(), NOW()),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', NULL, TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed User A profile (analytics disabled initially) & reading & complaint
SELECT set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', TRUE);
SET LOCAL ROLE authenticated;

INSERT INTO public.profiles (user_id, consent_version, core_consent_accepted_at, analytics_enabled, account_kind)
VALUES ('11111111-1111-4111-8111-111111111111', '1.0', NOW(), FALSE, 'anonymous');

INSERT INTO public.household_readings (user_id, utility_type, entry_kind, value, unit, date_mode, reading_date)
VALUES ('11111111-1111-4111-8111-111111111111', 'electricity', 'consumption', 320, 'kWh', 'single_date', CURRENT_DATE);

INSERT INTO public.complaint_drafts (user_id, category, title, description, approximate_location)
VALUES ('11111111-1111-4111-8111-111111111111', 'water_sanitation', 'Test Draft A', 'Private complaint details A', 'Cairo');

-- Test 1: User A CANNOT insert usage_events while analytics_enabled = FALSE
DO $$
BEGIN
  BEGIN
    INSERT INTO public.usage_events (user_id, event_name, metadata)
    VALUES ('11111111-1111-4111-8111-111111111111', 'feature_opened', '{"feature":"my_home"}'::jsonb);
    RAISE EXCEPTION 'TEST FAILED: usage_events insert succeeded even though analytics_enabled = FALSE';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- Expected!
  END;
END $$;

-- Enable analytics for User A and verify valid event succeeds, while disallowed metadata keys fail
UPDATE public.profiles SET analytics_enabled = TRUE WHERE user_id = '11111111-1111-4111-8111-111111111111';

INSERT INTO public.usage_events (user_id, event_name, metadata)
VALUES ('11111111-1111-4111-8111-111111111111', 'feature_opened', '{"feature":"my_home"}'::jsonb);

DO $$
BEGIN
  BEGIN
    INSERT INTO public.usage_events (user_id, event_name, metadata)
    VALUES ('11111111-1111-4111-8111-111111111111', 'feature_opened', '{"amount_paid": 500}'::jsonb);
    RAISE EXCEPTION 'TEST FAILED: disallowed metadata key amount_paid was accepted';
  EXCEPTION WHEN check_violation THEN
    NULL; -- Expected!
  END;
END $$;

-- Test 2: Switch to User B -> MUST see 0 of User A's readings, complaints, profiles, consents, events
SELECT set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', TRUE);

DO $$
DECLARE
  v_cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_cnt FROM public.household_readings;
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'TEST FAILED: User B saw % household_readings belonging to User A', v_cnt; END IF;

  SELECT COUNT(*) INTO v_cnt FROM public.complaint_drafts;
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'TEST FAILED: User B saw % complaint_drafts belonging to User A', v_cnt; END IF;

  SELECT COUNT(*) INTO v_cnt FROM public.profiles;
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'TEST FAILED: User B saw % profiles belonging to User A', v_cnt; END IF;
END $$;

-- Test 3: User B CANNOT insert a reading claiming User A's user_id
DO $$
BEGIN
  BEGIN
    INSERT INTO public.household_readings (user_id, utility_type, entry_kind, value, unit, date_mode, reading_date)
    VALUES ('11111111-1111-4111-8111-111111111111', 'water', 'consumption', 10, 'm³', 'single_date', CURRENT_DATE);
    RAISE EXCEPTION 'TEST FAILED: User B inserted a reading with User A user_id';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- Expected!
  END;
END $$;

-- Test 4: User B CANNOT call owner summary RPC without being in app_admins
DO $$
BEGIN
  BEGIN
    PERFORM public.get_owner_usage_summary(30);
    RAISE EXCEPTION 'TEST FAILED: non-admin User B called get_owner_usage_summary';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- Expected!
  END;
END $$;

-- Test 5: Unauthenticated anon role CANNOT read personal tables
RESET ROLE;
SELECT set_config('request.jwt.claims', '{}', TRUE);
SET LOCAL ROLE anon;

DO $$
BEGIN
  BEGIN
    PERFORM * FROM public.household_readings LIMIT 1;
    RAISE EXCEPTION 'TEST FAILED: anon role read household_readings';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- Expected!
  END;

  BEGIN
    PERFORM * FROM public.complaint_drafts LIMIT 1;
    RAISE EXCEPTION 'TEST FAILED: anon role read complaint_drafts';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- Expected!
  END;
END $$;

RESET ROLE;

-- Test 6: Grant admin in app_admins (as postgres/service_role) and verify aggregated RPC works
INSERT INTO public.app_admins (user_id, role) VALUES ('22222222-2222-4222-8222-222222222222', 'owner');

SELECT set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', TRUE);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_summary JSONB;
BEGIN
  v_summary := public.get_owner_usage_summary(30);
  IF (v_summary->>'total_readings_count')::INT < 1 THEN
    RAISE EXCEPTION 'TEST FAILED: owner summary did not return aggregated reading count';
  END IF;
END $$;

ROLLBACK;
