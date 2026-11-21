import axios from 'axios';
import * as cheerio from 'cheerio';
import { supabase } from './supabaseClient.ts';
import dotenv from 'dotenv';

export interface GovService {
  name_en: string;
  name_ar: string;
  category: string;
  description_en: string;
  description_ar: string;
  url: string;
  source: string;
  last_updated?: string;
  is_active?: boolean;
  iframe_compatible?: boolean;
}

const OFFICIAL_SOURCES = [
  { url: 'https://digital.gov.eg', category: 'خدمات عامة', source: 'مصر الرقمية', name_en: 'Digital Egypt', name_ar: 'بوابة مصر الرقمية' },
  { url: 'https://www.egypt.gov.eg', category: 'خدمات عامة', source: 'بوابة الحكومة المصرية', name_en: 'Egypt Gov Portal', name_ar: 'بوابة الحكومة المصرية' },
  { url: 'https://www.shakwa.eg', category: 'خدمات عامة', source: 'بوابة الشكاوى الحكومية', name_en: 'Government Complaints Portal', name_ar: 'منظومة الشكاوى الحكومية الموحدة' },
  { url: 'https://moi.gov.eg', category: 'خدمات أمنية', source: 'وزارة الداخلية', name_en: 'Ministry of Interior', name_ar: 'خدمات وزارة الداخلية' },
  { url: 'https://traffic.moi.gov.eg', category: 'مرور', source: 'المرور', name_en: 'Traffic Services', name_ar: 'بوابة مرور مصر' },
  { url: 'https://ppo.gov.eg', category: 'مرور', source: 'النيابة العامة', name_en: 'Public Prosecution', name_ar: 'نيابات المرور (مخالفات)' },
  { url: 'https://eservices.eehc.gov.eg', category: 'مرافق', source: 'الكهرباء', name_en: 'Electricity Services', name_ar: 'المنصة الموحدة لخدمات الكهرباء' },
  { url: 'https://www.hcww.com.eg', category: 'مرافق', source: 'المياه', name_en: 'Water Holding Company', name_ar: 'الشركة القابضة لمياه الشرب' },
  { url: 'https://petrotrade.com.eg', category: 'مرافق', source: 'الغاز', name_en: 'Petrotrade Gas Service', name_ar: 'بتروتريد (تسجيل قراءة الغاز)' },
  { url: 'https://www.tamwin.com.eg', category: 'تموين', source: 'التموين', name_en: 'Tamwin Supply Services', name_ar: 'دعم مصر (خدمات التموين)' },
  { url: 'https://www.mohp.gov.eg', category: 'صحة', source: 'الصحة', name_en: 'Ministry of Health', name_ar: 'وزارة الصحة والسكان' },
  { url: 'https://100millionseha.eg', category: 'صحة', source: '100 مليون صحة', name_en: '100 Million Healthy Lives', name_ar: 'مبادرة 100 مليون صحة' },
  { url: 'https://shmff.gov.eg', category: 'إسكان', source: 'الإسكان', name_en: 'Social Housing Fund', name_ar: 'صندوق الإسكان الاجتماعي' },
  { url: 'https://www.nosi.gov.eg', category: 'تأمينات ومعاشات', source: 'التأمينات', name_en: 'Social Insurance', name_ar: 'الهيئة القومية للتأمين الاجتماعي' },
  { url: 'https://www.eta.gov.eg', category: 'ضرائب وجمارك', source: 'الضرائب', name_en: 'Tax Authority', name_ar: 'مصلحة الضرائب المصرية' },
  { url: 'https://www.gafi.gov.eg', category: 'سجل تجاري واستثمار', source: 'الاستثمار', name_en: 'GAFI Investment', name_ar: 'الهيئة العامة للاستثمار' },
  { url: 'https://www.mot.gov.eg', category: 'نقل', source: 'النقل', name_en: 'Ministry of Transport', name_ar: 'وزارة النقل' },
  { url: 'https://enr.gov.eg', category: 'نقل', source: 'سكك حديد مصر', name_en: 'Train Tickets', name_ar: 'حجز تذاكر القطارات' },
  { url: 'https://cairometro.gov.eg', category: 'نقل', source: 'مترو الأنفاق', name_en: 'Cairo Metro', name_ar: 'شركة مترو الأنفاق' },
  { url: 'https://www.manpower.gov.eg', category: 'عمل وتوظيف', source: 'وزارة العمل', name_en: 'Ministry of Labor', name_ar: 'وزارة العمل المصرية' },
  { url: 'https://www.moj.gov.eg', category: 'خدمات قضائية', source: 'وزارة العدل', name_en: 'Ministry of Justice', name_ar: 'وزارة العدل' },
  { url: 'https://www.mfa.gov.eg', category: 'خارجية وتوثيق', source: 'وزارة الخارجية', name_en: 'Ministry of Foreign Affairs', name_ar: 'وزارة الخارجية' }
];

export const govEngine = {
  async fetchLive(): Promise<GovService[]> {
    console.log('Starting Gov Services Live Fetch...');
    const services: GovService[] = [];

    for (const target of OFFICIAL_SOURCES) {
      try {
        const response = await axios.get(target.url, {
          timeout: 8000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        // Detect X-Frame-Options or Content-Security-Policy blocking iframes
        const xFrame = response.headers['x-frame-options'];
        const csp = response.headers['content-security-policy'];
        const isCompatible = !(xFrame || (csp && csp.includes('frame-ancestors')));

        const $ = cheerio.load(response.data);
        const liveDesc = $('meta[name="description"]').attr('content') || $('title').text() || `الخدمات الرسمية المقدمة من ${target.source}`;
        
        services.push({
          ...target,
          description_ar: liveDesc.trim().substring(0, 200),
          description_en: liveDesc.trim().substring(0, 200),
          is_active: true,
          iframe_compatible: isCompatible,
          last_updated: new Date().toISOString()
        });
      } catch (error) {
        console.warn(`Could not scrape ${target.url}, using fallback logic.`);
        
        // Default heuristics for common Egyptian gov sites if they time out or fail scrape
        // Most .gov.eg sites block iframes by default
        const isGovEg = target.url.includes('.gov.eg');

        services.push({
          ...target,
          description_ar: `الخدمات الرسمية المقدمة من ${target.source}`,
          description_en: `Official services provided by ${target.source}`,
          is_active: true,
          iframe_compatible: !isGovEg, // Conservative default
          last_updated: new Date().toISOString()
        });
      }
    }
    return services;
  },

  async syncToSupabase() {
    try {
      if (!supabase) {
        console.log('Supabase client missing. Skipping gov services sync.');
        return { success: false, message: 'Supabase client missing' };
      }

      const liveData = await this.fetchLive();
      if (liveData.length > 0) {
        // Try the full update first
        const { error } = await supabase
          .from('government_services')
          .upsert(liveData, { onConflict: 'url' });
        
        if (error) {
          // If it fails, it might be due to missing columns like iframe_compatible
          // Let's filter out columns that might cause issues if schema is slightly behind
          const sanitizedData = liveData.map(({ last_updated, is_active, iframe_compatible, source, ...rest }) => rest);
          const { error: retryError } = await supabase
            .from('government_services')
            .upsert(sanitizedData, { onConflict: 'url' });
          
          if (retryError) {
            // Final attempt: Very minimal
            const minimalData = liveData.map(d => ({
              url: d.url,
              name_en: d.name_en || 'Official Service',
              name_ar: d.name_ar,
              category: d.category
            }));
            const { error: minError } = await supabase.from('government_services').upsert(minimalData, { onConflict: 'url' });
            if (minError) {
                console.warn('Gov API DB Sync warning (safe to ignore in dev): Database schema mismatch or permission denied. Relying on API/Memory fallback.');
            }
            return { success: false, error: retryError };
          }
        }
        console.log(`Successfully synced ${liveData.length} gov services to Supabase.`);
        return { success: true, count: liveData.length, data: liveData };
      }
      return { success: false, message: 'No data fetched' };
    } catch (error: any) {
      console.error('Gov Sync Error:', error.message || 'Unknown error');
      return { success: false, error };
    }
  },

  async getServices() {
    const { data, error } = await supabase.from('government_services').select('*').order('category');
    if (error || !data || data.length === 0) {
      const live = await this.fetchLive();
      this.syncToSupabase().catch(err => console.error('Gov services background sync failed:', err));
      return live;
    }
    return data;
  }
};
