import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  isSupabaseConfigured,
  formatSupabaseErrorAr,
} from '../services/supabaseClient';
import {
  supabaseDataService,
  ALLOWED_USAGE_EVENTS,
} from '../services/supabaseDataService';
import {
  checkUtilityWarnings,
  isSafeExternalUrl,
  analyzeUtilityTrend,
} from '../services/personalCivicService';

const ROOT = path.resolve(import.meta.dirname || process.cwd(), '..');
const readText = (relPath: string) => fs.readFileSync(path.join(ROOT, relPath), 'utf8');

test('Security: no hardcoded Supabase project URL or JWT or service_role secret in repo config/clients', () => {
  const filesToInspect = [
    '.env.example',
    'services/supabaseClient.ts',
    'server/services/supabaseClient.ts',
    'services/supabaseDataService.ts',
    'context/PrivacyConsentContext.tsx',
  ];

  for (const rel of filesToInspect) {
    const content = readText(rel);
    assert.equal(
      content.includes('eiboutdvbjoipdpeqrci'),
      false,
      `Found leaked Supabase project ref in ${rel}`,
    );
    assert.equal(
      /eyJ[A-Za-z0-9_-]{20,}/.test(content),
      false,
      `Found hardcoded JWT token in ${rel}`,
    );
  }
});

test('Environment safety: unconfigured state is cleanly detected without throwing', () => {
  assert.equal(typeof isSupabaseConfigured, 'boolean');
  assert.equal(isSupabaseConfigured, false);
});

test('Error formatting: formatSupabaseErrorAr translates key Supabase & quota conditions into Arabic', () => {
  assert.match(
    formatSupabaseErrorAr({ code: 'SUPABASE_NOT_CONFIGURED' }),
    /غير مهيأة/,
  );
  assert.match(
    formatSupabaseErrorAr({ status: 429, message: 'rate limit exceeded' }),
    /حد الاستخدام/,
  );
  assert.match(
    formatSupabaseErrorAr({ code: '42501', message: 'row-level security violation' }),
    /صلاحية/,
  );
  assert.match(
    formatSupabaseErrorAr({ message: 'Anonymous sign-ins are disabled' }),
    /المجهول غير مُفعّل/,
  );
  assert.match(
    formatSupabaseErrorAr({ message: 'A user with this email address has already been registered' }),
    /مسجل مسبقًا/,
  );
});

test('Analytics minimization: metadata allowlist strips bill amounts, text, location, and PII', () => {
  const dirtyMeta = {
    feature: 'my_home',
    status: 'saved',
    amount_paid: 950,
    description: 'complaint full text',
    email: 'user@example.com',
    lat: 30.0444,
    lng: 31.2357,
    ip: '192.168.1.1',
  } as any;

  const clean = supabaseDataService.sanitizeUsageMetadata(dirtyMeta);
  assert.deepEqual(Object.keys(clean).sort(), ['feature', 'status']);
  assert.equal(clean.feature, 'my_home');
  assert.equal(clean.status, 'saved');
});

test('Analytics consent gate: logUsageEvent blocks sending when analyticsEnabled is false or unconfigured', async () => {
  const denied = await supabaseDataService.logUsageEvent(
    '00000000-0000-4000-8000-000000000001',
    false,
    'feature_opened',
    { feature: 'my_home' },
  );
  assert.equal(denied, false);
  assert.ok(ALLOWED_USAGE_EVENTS.includes('reading_saved'));
});

test('SQL migration & RLS test suite include mandatory security guarantees', () => {
  const migrationSql = readText('supabase/migrations/20261121000000_moeco_core_rls_and_analytics.sql');
  assert.match(migrationSql, /FORCE ROW LEVEL SECURITY/);
  assert.match(migrationSql, /REVOKE ALL ON .* FROM anon/);
  assert.match(migrationSql, /analytics_enabled = TRUE/);
  assert.match(migrationSql, /metadata - 'feature' - 'status'/);
  assert.match(migrationSql, /CREATE TABLE IF NOT EXISTS public\.app_admins/);
  assert.match(migrationSql, /CREATE OR REPLACE FUNCTION public\.get_owner_usage_summary/);
  assert.match(migrationSql, /CREATE OR REPLACE FUNCTION public\.delete_my_moeco_data/);
  assert.match(migrationSql, /CREATE OR REPLACE FUNCTION public\.prune_old_usage_events/);

  const rlsSql = readText('supabase/tests/rls_verification.sql');
  assert.match(rlsSql, /BEGIN;/);
  assert.match(rlsSql, /ROLLBACK;/);
  assert.match(rlsSql, /SET LOCAL ROLE anon;/);
  assert.match(rlsSql, /public\.get_owner_usage_summary/);
});

test('Personal Civic pure helpers validate utility entries, official URLs, and trend comparisons accurately', () => {
  const warnings = checkUtilityWarnings(
    [],
    {
      serviceType: 'electricity',
      value: 200000,
      unit: 'kWh',
      dateMode: 'billing_period',
      readingDate: '2026-11-20',
      periodStart: '2026-11-25',
      periodEnd: '2026-11-01',
    },
  );
  assert.ok(warnings.length >= 2);

  assert.equal(isSafeExternalUrl('https://www.shakwa.eg'), true);
  assert.equal(isSafeExternalUrl('javascript:alert(1)'), false);

  const trend = analyzeUtilityTrend(
    [
      {
        id: '1',
        userId: 'u1',
        serviceType: 'electricity',
        entryKind: 'reading',
        value: 300,
        unit: 'ك.و.س',
        dateMode: 'single_date',
        readingDate: '2026-10-01',
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z',
      },
      {
        id: '2',
        userId: 'u1',
        serviceType: 'electricity',
        entryKind: 'reading',
        value: 360,
        unit: 'ك.و.س',
        dateMode: 'single_date',
        readingDate: '2026-11-01',
        createdAt: '2026-11-01T10:00:00Z',
        updatedAt: '2026-11-01T10:00:00Z',
      },
    ],
    'electricity',
  );

  assert.equal(trend.canCompare, true);
  assert.equal(trend.latestDelta, 60);
});
