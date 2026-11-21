
import axios from 'axios';
import * as cheerio from 'cheerio';
import { supabase } from './supabaseClient.ts';
import dotenv from 'dotenv';

dotenv.config();

export interface Coupon {
  id?: string;
  title: string;
  description: string;
  code: string;
  discount: string;
  expiry_date: string;
  source: string;
  link: string;
  category: 'Transport' | 'Restaurants' | 'Shopping' | 'Services' | 'Tech' | 'Travel';
  is_active: boolean;
  created_at?: string;
}

export const couponEngine = {
  sources: [
    { name: 'AlCoupon Egypt', url: 'https://egypt.alcoupon.com', type: 'scraping' },
    { name: 'EgCoupons', url: 'https://www.egcoupons.com', category: 'Shopping' },
    { name: 'Arabic Coupon', url: 'https://eg.arabiccoupon.com', type: 'scraping' },
    { name: 'Otlob Coupons', url: 'https://otlobcoupon.com', type: 'scraping' },
    { name: 'Waffarha', url: 'https://waffarha.com', type: 'scraping' },
    { name: 'CouponDomi', url: 'https://coupondomi.com', type: 'scraping' },
    { name: 'VoucherCodes Egypt', url: 'https://www.vouchercodes.co.eg', type: 'scraping' },
    { name: 'Coupon5sm', url: 'https://coupon5sm.com/eg/', type: 'scraping' },
    { name: 'Rezkna', url: 'https://rezkna.com/', type: 'scraping' },
    { name: 'Telegram Coupons', url: 'https://t.me/s/MarcoCouponEgypt', type: 'telegram' },
    { name: 'RSS Feed 1', url: 'https://rss.app/feeds/WsY2K8uMEVobplUb.xml', type: 'rss' },
    { name: 'RSS Feed 2', url: 'https://rss.app/feeds/kRy3Pglx5gI8Hj6d.xml', type: 'rss' },
    { name: 'RSS Feed 3', url: 'https://rss.app/feeds/7JlQzhwZDN1GYM3o.xml', type: 'rss' },
    { name: 'RSS Feed 4', url: 'https://rss.app/feeds/NBx6Y5Q2V52i50VG.xml', type: 'rss' },
    { name: 'RSS Feed 5', url: 'https://rss.app/feeds/tKRJv0fd7xxRVYaD.xml', type: 'rss' }
  ],

  fetchAndSyncAll: async () => {
    console.log('Starting Global Coupon Sync...');
    const allCoupons = await couponEngine.fetchDirect();
    
    if (allCoupons.coupons.length > 0) {
      await couponEngine.syncToSupabase(allCoupons.coupons);
    }
    console.log(`Sync completed. Processed ${allCoupons.coupons.length} coupons.`);
  },

  fetchDirect: async (): Promise<{ coupons: Coupon[], sourceStatus: Record<string, 'ok' | 'error'> }> => {
    const sourceStatus: Record<string, 'ok' | 'error'> = {};

    const results = await Promise.allSettled(
      couponEngine.sources.map(async (source) => {
        try {
          const sourceCoupons = await couponEngine.fetchFromSource(source);
          if (sourceCoupons.length > 0) {
            sourceStatus[source.name] = 'ok';
            return sourceCoupons;
          }
          sourceStatus[source.name] = 'error';
          return [];
        } catch (error) {
          console.error(`Failed to fetch from ${source.name}:`, error);
          sourceStatus[source.name] = 'error';
          return [];
        }
      })
    );

    const coupons: Coupon[] = [];
    results.forEach((res) => {
      if (res.status === 'fulfilled') {
        coupons.push(...res.value);
      }
    });

    // Deduplicate by code and source
    const uniqueCoupons = Array.from(new Map(coupons.map(c => [`${c.code}-${c.source}`, c])).values());
    
    return { coupons: uniqueCoupons, sourceStatus };
  },

  fetchFromSource: async (source: any): Promise<Coupon[]> => {
    try {
      const response = await axios.get(source.url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data, { xmlMode: source.type === 'rss' });
      const items: Coupon[] = [];

      if (source.type === 'telegram') {
        $('.tgme_widget_message_text').each((i, el) => {
          const text = $(el).text();
          const coupon = couponEngine.parseTelegramText(text, source.name, source.url);
          if (coupon) items.push(coupon);
        });
      } else if (source.type === 'rss') {
        $('item').each((i, el) => {
          const title = $(el).find('title').text().trim();
          const description = $(el).find('description').text().trim();
          const link = $(el).find('link').text().trim();
          
          // Try to extract code from title or description
          const codeMatch = (title + ' ' + description).match(/[A-Z]{3,}\d+/);
          const code = codeMatch ? codeMatch[0] : 'DEAL';
          
          if (title) {
            items.push({
              title,
              description: description.replace(/<[^>]*>?/gm, '').substring(0, 200),
              code,
              discount: (title + description).match(/\d+%/)?.[0] || 'Special Offer',
              expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              source: source.name,
              link: link || source.url,
              category: couponEngine.autoCategorize(title + ' ' + description),
              is_active: true
            });
          }
        });
      } else {
        // Generic Scraping logic with site-specific refinements
        const selectors = [
          '.coupon-item', '.offer-card', '.deal-box', '.coupon-card', 
          '.voucher-item', '.store-offer', '.coupon-list-item', '.card-body'
        ];

        selectors.forEach(selector => {
          $(selector).each((i, el) => {
            const title = $(el).find('h2, h3, .title, .offer-title, .coupon-name').text().trim();
            const description = $(el).find('p, .desc, .details, .offer-description').text().trim();
            const code = $(el).find('.code, .promo-code, .coupon-code, .copy-code').text().trim() || 'DEAL';
            const discount = $(el).find('.discount, .off, .percentage, .save-amount').text().trim() || 'Special Offer';
            
            if (title && title.length > 5) {
              items.push({
                title,
                description: description || title,
                code: code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'DEAL',
                discount: discount.match(/\d+%/)?.[0] || discount || 'Sale',
                expiry_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                source: source.name,
                link: source.url,
                category: couponEngine.autoCategorize(title + ' ' + description),
                is_active: true
              });
            }
          });
        });
      }

      return items.slice(0, 15); // Limit per source
    } catch (error) {
      return [];
    }
  },

  parseTelegramText: (text: string, sourceName: string, sourceUrl: string): Coupon | null => {
    // Simple regex to find codes like MARCO20 or SAVE50
    const codeMatch = text.match(/[A-Z]{2,}\d+/);
    const discountMatch = text.match(/\d+%/);
    
    if (codeMatch) {
      return {
        title: text.split('\n')[0].substring(0, 50),
        description: text.substring(0, 150),
        code: codeMatch[0],
        discount: discountMatch ? discountMatch[0] : 'Discount',
        expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        source: sourceName,
        link: sourceUrl,
        category: couponEngine.autoCategorize(text),
        is_active: true
      };
    }
    return null;
  },

  autoCategorize: (text: string): any => {
    const t = text.toLowerCase();
    if (t.includes('uber') || t.includes('careem') || t.includes('نقل') || t.includes('توصيل') || t.includes('indriver')) return 'Transport';
    if (t.includes('food') || t.includes('restaurant') || t.includes('مطعم') || t.includes('أكل') || t.includes('talabat') || t.includes('elmenus')) return 'Restaurants';
    if (t.includes('travel') || t.includes('hotel') || t.includes('سفر') || t.includes('فندق') || t.includes('booking')) return 'Travel';
    if (t.includes('tech') || t.includes('mobile') || t.includes('laptop') || t.includes('تكنولوجيا') || t.includes('موبايل')) return 'Tech';
    if (t.includes('service') || t.includes('cleaning') || t.includes('خدمات') || t.includes('صيانة')) return 'Services';
    return 'Shopping';
  },

  syncToSupabase: async (coupons: Coupon[]) => {
    try {
      const couponsToSync = coupons.map(c => ({
        ...c,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('coupons')
        .upsert(couponsToSync, { onConflict: 'code,source' });
      
      if (error) {
        console.warn('Coupon Sync Database Error:', error.message);
        // Fallback: If it's a schema error, try syncing without expiry_date as a last resort
        if (error.message.includes('expiry_date') || error.message.includes('schema cache')) {
           const { error: retryError } = await supabase
            .from('coupons')
            .upsert(couponsToSync.map(({ expiry_date, ...rest }) => rest), { onConflict: 'code,source' });
           if (retryError) console.error('Retry Sync also failed:', retryError.message);
        }
      }
    } catch (error) {
      console.error('Coupon Sync Exception:', error);
    }
  }
};
