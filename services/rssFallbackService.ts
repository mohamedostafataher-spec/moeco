import { supabase } from './supabaseClient';
import { XMLParser } from 'fast-xml-parser';

const FALLBACK_SOURCES = [
  { name: 'Almasry Alyoum', url: 'https://www.almasryalyoum.com/rss/rssfeeds', category: 'general' },
  { name: 'El Watan', url: 'https://www.elwatannews.com/rss/home', category: 'general' },
  { name: 'Sada El Balad', url: 'https://www.elbalad.news/rssfeeds', category: 'general' },
  { name: 'Akhbar Elyom', url: 'https://akhbarelyom.com/rss', category: 'general' },
  { name: 'Ahram Gate', url: 'https://gate.ahram.org.eg/rss.aspx', category: 'general' },
  { name: 'Cairo 24', url: 'https://www.cairo24.com/rss', category: 'general' },
  { name: 'Veto', url: 'https://www.vetogate.com/rss', category: 'general' },
  { name: 'Dostor', url: 'https://www.dostor.org/rss.aspx', category: 'general' },
  { name: 'NASA Climate', url: 'https://climate.nasa.gov/feeds/news-featured.xml', category: 'environment' },
  { name: 'UNEP Environment', url: 'https://www.unep.org/rss.xml', category: 'environment' }
];

const keywords = {
  ar: ['عاجل', 'تحذير', 'كارثة', 'حرب', 'انفجار', 'زلزال', 'حادث', 'حريق', 'تلوث', 'خطر', 'طوارئ', 'انقطاع', 'تسرب'],
  en: ['breaking', 'urgent', 'alert', 'warning', 'emergency', 'disaster', 'explosion', 'war', 'fire', 'accident', 'pollution', 'critical', 'danger']
};

export const rssFallbackService = {
  detectSeverity: (text: string) => {
    const t = text.toLowerCase();
    
    // Severity mapping exactly as requested
    // critical → حرب / انفجار / زلزال / war / explosion
    if (t.includes('حرب') || t.includes('انفجار') || t.includes('زلزال') || t.includes('war') || t.includes('explosion')) {
      return 'critical';
    }
    // high → تحذير / storm / fire
    if (t.includes('تحذير') || t.includes('storm') || t.includes('fire') || t.includes('حريق') || t.includes('عاصفة')) {
      return 'high';
    }
    // medium → حادث / pollution
    if (t.includes('حادث') || t.includes('pollution') || t.includes('تلوث')) {
      return 'medium';
    }
    // low → others
    for (const kw of [...keywords.ar, ...keywords.en]) {
      if (t.includes(kw)) return 'low';
    }
    return 'none';
  },

  fetchRssFromUrl: async (url: string) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        // Use Sovereign Proxy with increased timeout for better reliability
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 30000); 
        
        let xmlText = '';
        
        try {
          const proxyResponse = await fetch(`/api/proxy/rss?url=${encodeURIComponent(url)}`, { signal: controller.signal });
          if (proxyResponse.ok) {
             xmlText = await proxyResponse.text();
          } else {
             // If we get a 408 or 5xx from our proxy, it means the source is truly struggling
             if (proxyResponse.status === 408) throw new Error("Source Timeout (408)");
             throw new Error(`Proxy failed: ${proxyResponse.status}`);
          }
        } catch (proxyError: any) {
          console.warn(`Sovereign proxy issue for ${url}: ${proxyError.message}. Trying AllOrigins fallback...`);
          const fallbackResponse = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: controller.signal });
          if (!fallbackResponse.ok) throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
          const data = await fallbackResponse.json();
          xmlText = data.contents;
        }
        
        clearTimeout(id);
        
        const parser = new XMLParser({ 
          ignoreAttributes: false, 
          attributeNamePrefix: '@_',
          trimValues: true,
          parseAttributeValue: true
        });
        return parser.parse(xmlText);
      } catch (e) {
        if (retries === 0) {
           console.error('Failed to fetch/parse RSS after retries:', url, e);
           return null;
        }
        retries--;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    return null;
  },

  syncFallback: async () => {
    console.warn('RUNNING MOECO RSS CORE ENGINE (PRODUCTION MODE)...');
    try {
      // 1. Fetch RSS Sources from DB if available
      let mergedSources = [...FALLBACK_SOURCES];
      try {
        const { data: dbSources } = await supabase.from('rss_sources').select('*').eq('is_active', true);
        if (dbSources && dbSources.length > 0) {
           const dbMapped = dbSources.map(s => ({ name: s.category, url: s.feed_url || s.url, category: s.category }));
           // Merge taking care of duplicates
           for (const dbSrc of dbMapped) {
              if (dbSrc.url && !mergedSources.some(m => m.url === dbSrc.url)) {
                 mergedSources.push(dbSrc as any);
              }
           }
        }
      } catch (e) {
        console.warn("Could not fetch DB sources, relying solely on FALLBACK_SOURCES");
      }

      const sourcesToUse = mergedSources;

      const allNews: any[] = [];
      const alertsToInsert: any[] = [];
      
      for (const source of sourcesToUse) {
        const parsed = await rssFallbackService.fetchRssFromUrl(source.url);
        if (parsed?.rss?.channel?.item) {
          let items = parsed.rss.channel.item;
          if (!Array.isArray(items)) items = [items];
          
          for (const item of items) {
            const title = item.title || '';
            const description = item.description || '';
            const content = item['content:encoded'] || description;
            const fullText = `${title} ${description} ${content}`;
            const severity = rssFallbackService.detectSeverity(fullText);
            const isAlert = severity !== 'none';
            // Extract Image
            let imageUrl = null;
            if (item.enclosure?.['@_url']) imageUrl = item.enclosure['@_url'];
            else if (item['media:content']?.['@_url']) imageUrl = item['media:content']['@_url'];
            else if (item['media:thumbnail']?.['@_url']) imageUrl = item['media:thumbnail']['@_url'];
            
            const articleId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);

            let publishedAt: string;
            try {
              const dateSrc = item.pubDate;
              let dateObj: Date;
              
              if (typeof dateSrc === 'string' && dateSrc.trim()) {
                dateObj = new Date(dateSrc);
              } else if (typeof dateSrc === 'number') {
                dateObj = new Date(dateSrc);
              } else {
                dateObj = new Date();
              }

              if (isNaN(dateObj.getTime())) {
                publishedAt = new Date().toISOString();
              } else {
                publishedAt = dateObj.toISOString();
              }
            } catch (err) {
              publishedAt = new Date().toISOString();
            }

            const newsItem = {
              id: articleId,
              title,
              description: description.substring(0, 500),
              content,
              image_url: imageUrl,
              url: item.link,
              source: source.name || 'RSS Source',
              source_url: source.url,
              category: source.category || 'general',
              target_screen: source.category === 'emergency' ? 'emergency' : 'eco_news',
              published_at: publishedAt,
            };

            allNews.push(newsItem);

            if (isAlert) {
               alertsToInsert.push({
                 title_ar: title,
                 description_ar: description.substring(0, 500),
                 severity: severity,
                 is_active: true,
                 news_id: articleId,
                 created_at: new Date().toISOString()
               });
            }
          }
        }
      }

      if (allNews.length > 0) {
        for (const newsObj of allNews) {
          const { data: existing } = await supabase.from('news').select('id').eq('url', newsObj.url).maybeSingle();
          if (!existing) {
             const { error: insertErr } = await supabase.from('news').insert(newsObj);
             if (!insertErr) {
                // If it was an alert, insert it
                const alertMatch = alertsToInsert.find(a => a.news_id === newsObj.id);
                if (alertMatch) {
                   await supabase.from('alerts').insert(alertMatch);
                }
             }
          }
        }
      }
      return allNews;
    } catch (e) {
      console.error('Failover system encountered error:', e);
      return [];
    }
  }
}
