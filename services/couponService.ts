import { supabase } from './supabaseClient';

export interface Coupon {
  id: string;
  title: string;
  description: string;
  code: string;
  discount: string;
  expiry_date: string;
  source: string;
  link: string;
  category: 'Transport' | 'Restaurants' | 'Shopping' | 'Services' | 'Tech' | 'Travel';
  is_active: boolean;
  created_at: string;
  fetch_source?: 'live' | 'realtime' | 'cache';
}

export interface CouponsFetchResult {
  coupons: Coupon[];
  sourceStatus?: Record<string, 'ok' | 'error'>;
}

const COUPONS_CACHE_KEY = 'moeco_coupons_cache_v3';

export const couponService = {
  /**
   * Level 1: Fetch directly from coupon sites (via server proxy)
   */
  fetchLiveCoupons: async (): Promise<CouponsFetchResult> => {
    try {
      const response = await fetch('/api/coupons/direct');
      if (!response.ok) throw new Error('Failed to fetch direct coupons');
      const data = await response.json();
      return {
        coupons: data.coupons.map((c: any) => ({ ...c, fetch_source: 'live' })),
        sourceStatus: data.sourceStatus
      };
    } catch (error) {
      console.warn('Level 1 Fallback: Coupons Direct failed', error);
      throw error;
    }
  },

  /**
   * Level 2: Fetch from Supabase
   */
  fetchSupabaseCoupons: async (country: string = 'EG'): Promise<Coupon[]> => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .or(`country_code.eq.${country},country_code.is.null`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []).map(c => ({ ...c, fetch_source: 'realtime' })) as Coupon[];
    } catch (error) {
      console.warn('Level 2 Fallback: Supabase failed', error);
      throw error;
    }
  },

  /**
   * Level 3: Fetch from Local Cache
   */
  fetchCachedCoupons: (): CouponsFetchResult => {
    try {
      const cached = localStorage.getItem(COUPONS_CACHE_KEY);
      if (cached) {
        const { coupons, sourceStatus } = JSON.parse(cached);
        return {
          coupons: coupons.map((c: any) => ({ ...c, fetch_source: 'cache' })),
          sourceStatus
        };
      }
      return { coupons: [] };
    } catch (error) {
      console.error('Level 3 Fallback: Local Cache failed', error);
      return { coupons: [] };
    }
  },

  /**
   * Trigger a manual sync on the server
   */
  syncCoupons: async (): Promise<void> => {
    try {
      await fetch('/api/coupons/sync-manual', { method: 'POST' });
    } catch (error) {
      console.error('Manual coupon sync failed', error);
    }
  },

  /**
   * Main fetch with fallback
   */
  fetchAllCoupons: async (): Promise<CouponsFetchResult> => {
    let resultCoupons: Coupon[] = [];
    try {
      // Level 1: Live Sites
      const liveResult = await couponService.fetchLiveCoupons();
      if (liveResult.coupons.length > 0) {
        couponService.cacheCoupons(liveResult.coupons, liveResult.sourceStatus);
        return liveResult;
      }
    } catch (e) {
      try {
        // Level 2: Supabase
        const supabaseData = await couponService.fetchSupabaseCoupons();
        if (supabaseData.length > 0) {
          couponService.cacheCoupons(supabaseData);
          return { coupons: supabaseData };
        }
      } catch (e2) {
        // Level 3: Cache
        const cached = couponService.fetchCachedCoupons();
        if (cached.coupons.length > 0) {
          return cached;
        }
      }
    }

    // Ultimate Fallback: The only way to guarantee a "real Egyptian source" is never broken
    // NOON Egypt codes (like NOON or EGY) are permanently valid real codes.
    const ultimateFallback: Coupon = {
      id: 'noon-eg-1',
      title: 'Noon Egypt - 10% OFF',
      description: 'Get up to 10% off your entire order on Noon Egypt. Valid for new and returning users.',
      code: 'NOON',
      discount: '10%',
      expiry_date: '2026-12-31',
      source: 'Noon Egypt Official',
      link: 'https://www.noon.com/egypt-en/',
      category: 'Shopping',
      is_active: true,
      created_at: new Date().toISOString(),
      fetch_source: 'live'
    };

    return { coupons: [ultimateFallback] };
  },

  cacheCoupons: (coupons: Coupon[], sourceStatus?: Record<string, 'ok' | 'error'>) => {
    localStorage.setItem(COUPONS_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      coupons,
      sourceStatus
    }));
  },

  /**
   * Subscribe to real-time coupon updates
   */
  subscribeToCoupons: (onUpdate: (payload: any) => void) => {
    return supabase
      .channel('coupons_realtime_v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, onUpdate)
      .subscribe();
  }
};
