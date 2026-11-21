import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const sanitizeUrl = (val?: string) => {
  let clean = (val || '').trim();
  if (!clean || clean === 'undefined' || clean === 'null') return '';
  if (clean.endsWith('/')) clean = clean.slice(0, -1);
  if (clean.includes('/rest/v1')) clean = clean.split('/rest/v1')[0];
  return clean;
};

const supabaseUrl = sanitizeUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('your-project') &&
    !supabaseKey.includes('your-anon-key') &&
    /^https?:\/\//i.test(supabaseUrl),
);

const createServerStubQuery = () => {
  const err = { message: 'Server Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' };
  const result = { data: null, error: err, count: 0 };
  const builder: any = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') return (resolve: (val: any) => void) => resolve(result);
        return () => builder;
      },
    },
  );
  return builder;
};

export const supabase: any = isServerSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : {
      from: () => createServerStubQuery(),
      rpc: async () => ({
        data: null,
        error: { message: 'Server Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' },
      }),
    };
