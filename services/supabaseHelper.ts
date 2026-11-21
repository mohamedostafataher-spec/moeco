
import { supabase } from './supabaseClient';

const DEFAULT_TIMEOUT = 5000;

export const supabaseWithTimeout = async <T>(
  query: Promise<{ data: T | null; error: any }>,
  timeout = DEFAULT_TIMEOUT
): Promise<{ data: T | null; error: any }> => {
  const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), timeout)
  );

  try {
    return await Promise.race([query, timeoutPromise]);
  } catch (error: any) {
    return { data: null, error };
  }
};

export const getWithCache = async <T>(
  key: string,
  fetcher: () => Promise<{ data: T | null; error: any }>,
  timeout = DEFAULT_TIMEOUT
): Promise<T | null> => {
  // Try to get from cache first if offline
  if (!navigator.onLine) {
    const cached = localStorage.getItem(`moeco_cache_${key}`);
    return cached ? JSON.parse(cached) : null;
  }

  const { data, error } = await supabaseWithTimeout(fetcher(), timeout);

  if (error || !data) {
    console.warn(`Supabase error for ${key}:`, error);
    const cached = localStorage.getItem(`moeco_cache_${key}`);
    return cached ? JSON.parse(cached) : null;
  }

  // Update cache
  localStorage.setItem(`moeco_cache_${key}`, JSON.stringify(data));
  return data;
};
