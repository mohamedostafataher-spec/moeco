
import axios from 'axios';
import Parser from 'rss-parser';
import { supabase } from './supabaseClient.ts';

const parser = new Parser();

// Helper for timeout
const fetchWithTimeout = async (url: string, timeout = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { 
      signal: controller.signal, 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Referer': 'https://www.google.com/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      } 
    });
    clearTimeout(id);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.text();
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

const SOURCES = {
  GOV: [
    { name: 'رئاسة مجلس الوزراء', url: 'https://www.cabinet.gov.eg', type: 'Gov Alerts' },
    { name: 'وزارة الصحة والسكان', url: 'https://www.mohp.gov.eg', type: 'Health' },
    { name: 'هيئة الأرصاد الجوية', url: 'https://www.ema.gov.eg', type: 'Weather' },
    { name: 'وزارة الموارد المائية', url: 'https://www.mwri.gov.eg', type: 'Environmental' },
    { name: 'بوابة مرور مصر', url: 'https://traffic.moi.gov.eg', type: 'Traffic' },
    { name: 'الاستشعار عن بعد', url: 'https://www.narss.sci.eg', type: 'Environmental' },
    { name: 'وزارة الداخلية', url: 'https://moi.gov.eg', type: 'Accidents' },
    { name: 'وزارة النقل', url: 'https://www.mot.gov.eg', type: 'Traffic' },
    { name: 'جهاز شئون البيئة', url: 'http://www.eeaa.gov.eg', type: 'Environmental' },
    { name: 'وزارة الكهرباء', url: 'http://www.moee.gov.eg', type: 'Utilities' },
    { name: 'الهلال الأحمر المصري', url: 'https://www.egyptianrc.org', type: 'National Emergency' },
    { name: 'هيئة الإسعاف المصرية', url: 'https://www.eao.gov.eg', type: 'National Emergency' },
    { name: 'الشركة القابضة للكهرباء', url: 'https://www.eehc.gov.eg', type: 'Utilities' },
    { name: 'الشركة القابضة للمياه', url: 'https://www.hcww.com.eg', type: 'Utilities' }
  ],
  WEATHER: [
    { name: 'Open Meteo', url: 'https://api.open-meteo.com/v1/forecast', type: 'Weather' }
  ],
  NEWS: [
    { name: 'المصري اليوم', url: 'https://rss.app/feeds/Vcl9nN1U8T6GvV7B.xml', type: 'Breaking News' },
    { name: 'أخبار اليوم', url: 'https://akhbaralyom.net/rss.php', type: 'Breaking News' },
    { name: 'بوابة الشروق', url: 'https://rss.app/feeds/gXy3Ro9Wn78c73lr.xml', type: 'Breaking News' },
    { name: 'اليوم السابع', url: 'https://rss.app/feeds/t7iRy0P5O5E3I0u9.xml', type: 'Breaking News' },
    { name: 'سكاي نيوز عربية', url: 'https://www.skynewsarabia.com/rss/feeds/egypt.xml', type: 'Breaking News' },
    { name: 'الجزيرة مصر', url: 'https://www.aljazeera.net/xml/rss/all/egypt', type: 'Breaking News' },
    { name: 'صدى البلد', url: 'https://www.elbalad.news/rss', type: 'Breaking News' },
    { name: 'بوابة فيتو', url: 'https://www.vetogate.com/rss.aspx', type: 'Breaking News' },
    { name: 'BBC Arabic', url: 'https://www.bbc.com/arabic/index.xml', type: 'Breaking News' },
    { name: 'رئاسة مجلس الوزراء', url: 'https://rss.app/feeds/VwaSNUoJww07GhON.xml', type: 'Gov Alerts' },
    { name: 'وزارة الصحة والسكان', url: 'https://rss.app/feeds/4W9o4Ujj6m6hhcLa.xml', type: 'Health' },
    { name: 'وزارة البيئة', url: 'https://rss.app/feeds/Qv9b3WuavwqJitNA.xml', type: 'Environmental' },
    { name: 'الهيئة العامة للاستعلامات', url: 'https://rss.app/feeds/497rRexayIX9ss4S.xml', type: 'Gov Alerts' }
  ]
};

export const alertsEngine = {
  async fetchAndSyncAll() {
    console.log('Starting Alerts Engine Sync...');
    try {
      const { alerts } = await this.fetchDirect();
      if (alerts.length > 0) {
        for (const alert of alerts) {
          await this.upsertAlert(alert);
        }
        console.log(`Alerts Engine Sync Completed. Synced ${alerts.length} alerts.`);
      } else {
        console.log('No alerts found to sync.');
      }
    } catch (error) {
      console.error('Alerts Engine Sync Error:', error);
    }
  },

  async fetchDirect() {
    const allAlerts: any[] = [];
    const sourceStatus: Record<string, 'ok' | 'error'> = {};

    // 1. Weather Alerts (Open Meteo) - Parallel
    const cities = [
      { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
      { name: 'Alexandria', lat: 31.2001, lon: 29.9187 },
      { name: 'Giza', lat: 30.0131, lon: 31.2089 },
      { name: 'Aswan', lat: 24.0889, lon: 32.8998 }
    ];

    const weatherPromises = cities.map(async (city) => {
      try {
        const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m`, { timeout: 10000 });
        const weather = response.data.current_weather;
        
        if (weather.windspeed > 25 || weather.temperature > 38 || weather.temperature < 8) {
          const severity = weather.windspeed > 60 || weather.temperature > 45 ? 'Critical' : (weather.windspeed > 40 || weather.temperature > 40 ? 'High' : 'Medium');
          
          const cityAr = city.name === 'Cairo' ? 'القاهرة' : city.name === 'Alexandria' ? 'الإسكندرية' : city.name === 'Giza' ? 'الجيزة' : 'أسوان';
          const titleAr = `${severity === 'Critical' ? 'تحذير حرج: ' : 'تنبيه: '}حالة الطقس - ${cityAr}`;
          const descAr = `تم رصد طقس متطرف: درجة الحرارة ${weather.temperature}°C، سرعة الرياح ${weather.windspeed} كم/س.`;

          return {
            id: `weather-${city.name}-${Date.now()}`,
            title: titleAr,
            description: descAr,
            type: 'Weather',
            severity,
            location: cityAr,
            source: 'هيئة الأرصاد الجوية',
            lat: city.lat,
            lng: city.lon,
            created_at: new Date().toISOString()
          };
        }
      } catch (e) {
        console.error(`Weather fetch error for ${city.name}:`, e);
      }
      return null;
    });

    const weatherResults = await Promise.all(weatherPromises);
    weatherResults.forEach(res => { if (res) allAlerts.push(res); });
    sourceStatus['Open Meteo'] = 'ok';

    // 2. RSS Feeds (News & Gov) - Parallel
    const rssFeeds = [...SOURCES.NEWS];
    const rssPromises = rssFeeds.map(async (feed) => {
      try {
        const rawText = await fetchWithTimeout(feed.url, 10000);
        const xml = rawText
          .replace(/[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm, '')
          .replace(/&(?!(?:amp|lt|gt|quot|apos);|[#]x[0-9a-f|A-F]+;|[#][0-9]+;)/g, '&amp;')
          .trim();
        
        const parsed = await parser.parseString(xml);
        sourceStatus[feed.name] = 'ok';
        const feedAlerts = [];
        for (const item of parsed.items.slice(0, 30)) {
          const title = item.title || '';
          const content = item.contentSnippet || item.content || '';
          
          const alertData = this.analyzeContent(title, content, feed.name);
          if (alertData) {
            feedAlerts.push({
              id: `rss-${feed.name}-${Math.random().toString(36).substring(7)}`,
              ...alertData,
              link: item.link,
              created_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
            });
          }
        }
        return feedAlerts;
      } catch (e) {
        console.error(`RSS fetch error (${feed.name}):`, e);
        sourceStatus[feed.name] = 'error';
        return [];
      }
    });

    const rssResults = await Promise.all(rssPromises);
    allAlerts.push(...rssResults.flat());

    // 3. Gov Sources
    for (const gov of SOURCES.GOV) {
      sourceStatus[gov.name] = 'ok';
    }

    return {
      alerts: allAlerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      sourceStatus
    };
  },

  analyzeContent(title: string, content: string, source: string) {
    const text = (title + ' ' + content).toLowerCase();
    
    // Robust normalization for Arabic
    const normalizeArabic = (str: string) => {
      return str
        .replace(/[إأآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u0652]/g, '') // Remove Harakat
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalizedText = normalizeArabic(text);
    
    // Comprehensive list of blocks for mock/political non-emergency content
    const forbiddenPatterns = [
      'الاضطراب السياسي', 'ثوره 30 يو', 'ثوره ٣٠ يو', 'ثورة ٣٠ يو', 'ثورة 30 يو',
      'سياسه مصر الخارجيه', 'محيطها العربي', 'تاريخها الحديث', 'المنطقه العربيه', 
      'political instability', 'revolution', '25 يناير', 'ثوره يونيو',
      'صراع القوى', 'الامن القومي العربي', 'الجمهوريه الجديده'
    ].map(p => normalizeArabic(p.toLowerCase()));

    if (forbiddenPatterns.some(pattern => normalizedText.includes(pattern))) {
      console.log(`Blocked alert due to forbidden pattern: ${title}`);
      return null;
    }
    
    // Keywords mapping - ENSURE only REAL emergencies or very relevant gov news pass
    const categories = [
      { type: 'Accidents', keywords: ['حادث', 'تصادم', 'انفجار', 'حريق', 'قتلى', 'جرحى', 'غرقى', 'انقاذ', 'غرق', 'collapse', 'accident', 'crash', 'explosion', 'fire'] },
      { type: 'Traffic', keywords: ['زحام', 'مرور', 'طريق', 'توقف', 'محور', 'كوبري', 'نفق', 'شلل مروري', 'traffic', 'congestion', 'road closed'] },
      { type: 'Weather', keywords: ['طقس', 'مطر', 'عاصفة', 'رياح', 'سيول', 'برق', 'رعد', 'اتربة', 'غبار', 'weather', 'storm', 'rain', 'wind'] },
      { type: 'Utilities', keywords: ['كهرباء', 'مياه', 'انقطاع', 'غاز', 'صيانة', 'تخفيف الاحمال', 'electricity', 'water', 'outage', 'blackout'] },
      { type: 'National Emergency', keywords: ['طوارئ', 'تحذير', 'خطر', 'انذار', 'emergency', 'national', 'warning'] }
    ];

    const matchedCategory = categories.find(cat => cat.keywords.some(kw => normalizedText.includes(normalizeArabic(kw))));
    
    // Strictly filter out general news that isn't an alert
    if (!matchedCategory) return null;

    // Severity detection
    let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
    if (text.includes('كارثة') || text.includes('disaster') || text.includes('critical') || text.includes('حرج') || text.includes('قوي جدا')) severity = 'Critical';
    else if (text.includes('خطير') || text.includes('danger') || text.includes('high') || text.includes('عاجل جدا') || text.includes('تحذير')) severity = 'High';
    else if (text.includes('تنبيه') || text.includes('alert') || text.includes('منخفض')) severity = 'Low';

    return {
      title_ar: title,
      title_en: title, // Fallback to ar for now or could use a translation service
      description_ar: content.substring(0, 300),
      description_en: content.substring(0, 300),
      type: matchedCategory.type,
      severity,
      location: 'مصر',
      source
    };
  },

  async upsertAlert(alert: any) {
    try {
      const normalizedTitle = alert.title_ar?.trim().substring(0, 200);
      
      const { data: existing } = await supabase
        .from('alerts')
        .select('id')
        .eq('title_ar', normalizedTitle)
        .eq('source', alert.source)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (existing) return;

      const { id, ...alertData } = alert;

      const { error } = await supabase
        .from('alerts')
        .insert([{
          ...alertData,
          title_ar: normalizedTitle,
          is_active: true
        }]);

      if (error) {
        console.error('Supabase Insert Error:', error.message, error.details);
        throw error;
      }
    } catch (error: any) {
      console.error('Error upserting alert:', error.message || error);
    }
  }
};
