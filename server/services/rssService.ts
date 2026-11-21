
import Parser from 'rss-parser';
import { convert } from 'html-to-text';
import { load } from 'cheerio';
import { supabase } from './supabaseClient.ts';
import dotenv from 'dotenv';

dotenv.config();

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  }
});

// Hardcoded fallback sources in case DB is empty/unreachable
const FALLBACK_SOURCES = [
  { name: 'Almasry Alyoum', url: 'https://www.almasryalyoum.com/rss/rssfeeds', target_screen: 'general', category: 'general', is_active: true },
  { name: 'El Watan', url: 'https://www.elwatannews.com/rss/home', target_screen: 'general', category: 'general', is_active: true },
  { name: 'Sada El Balad', url: 'https://www.elbalad.news/rssfeeds', target_screen: 'general', category: 'general', is_active: true },
  { name: 'Akhbar Elyom', url: 'https://akhbarelyom.com/rss', target_screen: 'general', category: 'general', is_active: true },
  { name: 'Ahram Gate', url: 'https://gate.ahram.org.eg/rss.aspx', target_screen: 'general', category: 'general', is_active: true },
  { name: 'Cairo 24', url: 'https://www.cairo24.com/rss', target_screen: 'general', category: 'general', is_active: true },
  { name: 'Veto', url: 'https://www.vetogate.com/rss', target_screen: 'general', category: 'general', is_active: true },
  { name: 'Dostor', url: 'https://www.dostor.org/rss.aspx', target_screen: 'general', category: 'general', is_active: true },
  { name: 'NASA Climate', url: 'https://climate.nasa.gov/feeds/news-featured.xml', target_screen: 'eco_news', category: 'climate', is_active: true },
  { name: 'UNEP Environment', url: 'https://www.unep.org/rss.xml', target_screen: 'eco_news', category: 'environment', is_active: true }
];

// Helper for timeout with retries
const fetchWithTimeout = async (url: string, timeout = 35000, retries = 3) => {
  let lastError: any;
  // problematic domains that need extra patience
  const isSlowDomain = url.includes('egyptoil-gas.com') || url.includes('masrawy.com') || url.includes('ahram.org.eg') || url.includes('dostor.org');
  const isBrokenYoum7 = url.includes('m.youm7.com/rss/SectionRss?SectionID=');
  
  if (isBrokenYoum7) {
     console.warn(`Blocking known broken mobile youm7 feed: ${url}`);
     return "DEACTIVATE";
  }

  const actualTimeout = isSlowDomain ? 45000 : timeout;

  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => {
      try {
        controller.abort();
      } catch (e) {}
    }, actualTimeout);

    try {
      if (i > 0) console.log(`Retry ${i} for RSS Source: ${url}`);
      
      const response = await fetch(url, { 
        signal: controller.signal, 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://www.google.com/',
          'Cache-Control': 'no-cache',
        } 
      });
      clearTimeout(id);

      if (!response.ok) {
         // Some sources sometimes block direct requests or return transient 403/503
         if (response.status === 402 || response.status === 503 || response.status === 403 || response.status === 429) {
           console.warn(`RSS Source transient failure (${response.status}): ${url}`);
           if (i < retries) {
             await new Promise(resolve => setTimeout(resolve, 3000 * (i + 1)));
             continue;
           }
           return ""; // Skip after reaching max retries for these specific statuses
         } else if (response.status === 404) {
           console.error(`RSS Source 404 Not Found: ${url}`);
           return "DEACTIVATE";
         } else {
           throw new Error(`HTTP error! status: ${response.status}`);
         }
      }
      return await response.text();
    } catch (e: any) {
      clearTimeout(id);
      lastError = e;
      const isAbort = e.name === 'AbortError' || e.code === 'ECONNABORTED' || e.message?.includes('aborted');
      if (isAbort) {
        console.warn(`RSS Fetch Aborted/Timeout (${i + 1}/${retries + 1}): ${url}`);
      } else {
        console.warn(`RSS Fetch Error for ${url}: ${e.message}`);
      }
      
      if (i < retries) {
        const waitTime = isAbort ? 4000 * (i + 1) : 2000 * (i + 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
    }
  }
  return ""; 
};

const cleanXml = (xml: string) => {
  return xml
    .replace(/[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm, '') 
    .replace(/&(?!(?:amp|lt|gt|quot|apos);|[#]x[0-9a-fA-F]+;|[#][0-9]+;)/g, '&amp;') 
    .replace(/encoding="windows-1256"/i, 'encoding="utf-8"') 
    .trim();
};

export const rssService = {
  getActiveSources: async () => {
    const { data, error } = await supabase
      .from('rss_sources')
      .select('*')
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  fetchAndSyncAll: async () => {
    try {
      console.log('Starting RSS Sync for all feeds...');
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      await supabase.from('news').delete().lt('published_at', sevenDaysAgo.toISOString());
      await supabase.from('alerts').delete().lt('created_at', sevenDaysAgo.toISOString());

      let { data: sources, error } = await supabase.from('rss_sources').select('*').eq('is_active', true);
      
      if (error || !sources || sources.length === 0) {
        console.warn('DB sources empty or inaccessible, using FALLBACK_SOURCES for sync');
        sources = FALLBACK_SOURCES;
      }

      const results = await Promise.allSettled(sources.map(feed => rssService.syncFeed(feed)));
      const totalSynced = results.reduce((acc, res) => acc + (res.status === 'fulfilled' ? res.value : 0), 0);
      console.log(`RSS Sync completed. Total synced: ${totalSynced}`);
    } catch (error) {
      console.error('Error in RSS Sync:', error);
    }
  },

  fetchDirect: async () => {
    let { data: sources, error } = await supabase.from('rss_sources').select('*').eq('is_active', true);
    
    if (error || !sources || sources.length === 0) {
       sources = FALLBACK_SOURCES;
    }

    const sourceStatus: Record<string, 'ok' | 'error'> = {};
    
    const fetchPromises = sources.map(async (feed) => {
      try {
        const urlToFetch = feed.feed_url || feed.url;
        if (!urlToFetch) return [];
        
        const rawText = await fetchWithTimeout(urlToFetch, 30000);
        const xml = cleanXml(rawText);
        const feedData = await parser.parseString(xml);
        sourceStatus[feed.url || feed.name] = 'ok';
        
        return feedData.items.slice(0, 30).map(item => {
            const title = item.title || "";
            const content = item.content || item.contentSnippet || "";
            const description = convert(content, { wordwrap: 130 }).substring(0, 500);
            return {
              id: Math.random().toString(36).substring(7),
              title: title,
              description: description,
              content: content,
              url: item.link || item.id,
              image_url: rssService.extractImage(item),
              source: feed.url,
              source_url: urlToFetch,
              category: feed.category || 'general',
              target_screen: feed.category === 'emergency' ? 'emergency' : 'eco_news',
              published_at: rssService.parseDate(item.pubDate)
            };
        });
      } catch (e: any) {
        sourceStatus[feed.url || feed.name || 'unknown'] = 'error';
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    const allArticles = results.flat();
    const sortedArticles = allArticles.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    const uniqueArticles = Array.from(new Map(sortedArticles.map(item => [item.url || item.id, item])).values());
    
    return { articles: uniqueArticles, sourceStatus };
  },

  parseDate: (dateStr: any): string => {
    try {
      if (!dateStr) return new Date().toISOString();
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    } catch (e) {
      return new Date().toISOString();
    }
  },

  syncFeed: async (feed: any): Promise<number> => {
    try {
      if (!supabase) return 0;

      let targetUrl = feed.feed_url || feed.url;
      if (!targetUrl) return 0;

      // Increased timeout for better handling of slow Egyptian news sites
      const rawText = await fetchWithTimeout(targetUrl, 30000);
      
      if (rawText === "DEACTIVATE") {
         console.warn(`Deactivating broken RSS source: ${targetUrl}`);
         await supabase.from('rss_sources').update({ is_active: false }).eq('id', feed.id);
         return 0;
      }

      if (!rawText || rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<html') || rawText.includes('Oops...')) {
         console.warn(`RSS Source returned HTML instead of XML: ${targetUrl}`);
         return 0;
      }

      const xml = cleanXml(rawText);
      let feedData;
      try {
        feedData = await parser.parseString(xml);
      } catch (parseError) {
        console.warn(`Failed to parse XML from ${targetUrl}: ${parseError}`);
        return 0;
      }

      if (!feedData || !feedData.items || feedData.items.length === 0) return 0;

      let syncedCount = 0;
      const alertsToInsert: any[] = [];

      for (const item of feedData.items.slice(0, 40)) {
         const description = convert(item.content || item.contentSnippet || '', { wordwrap: 130 }).substring(0, 500);
         const title = item.title || "";
         const content = item.content || item.contentSnippet || description;
         const articleId = crypto.randomUUID();
         const fullText = (title + " " + description + " " + content).toLowerCase();
         
         const url = item.link || item.id || `fallback-${Math.random()}`;
         const { data: existing } = await supabase.from('news').select('id').eq('url', url).maybeSingle();
         if (existing) continue;

         const article = {
            id: articleId,
            title: title,
            description: description,
            content: content,
            url: url,
            image_url: rssService.extractImage(item),
            source: typeof feed.name === 'string' ? feed.name : (feed.url || targetUrl),
            source_url: targetUrl,
            category: feed.category || 'general',
            target_screen: feed.category === 'emergency' ? 'emergency' : 'eco_news',
            published_at: rssService.parseDate(item.pubDate)
         };

         const { error } = await supabase.from('news').insert(article);
         if (!error) {
            syncedCount++;
            
            // Smart Alert Detection
            const severity = rssService.detectSeverity(fullText);
            if (severity) {
               alertsToInsert.push({
                  title_ar: title,
                  description_ar: description,
                  severity: severity,
                  is_active: true,
                  news_id: articleId
               });
            }
         }
      }

      if (alertsToInsert.length > 0) {
         await supabase.from('alerts').insert(alertsToInsert);
      }

      await supabase.from('rss_sources').update({ last_fetched_at: new Date().toISOString() }).eq('id', feed.id);

      return syncedCount;
    } catch (error: any) {
      console.warn(`Warning syncing feed ${feed.url || feed.feed_url}: ${error.message || 'Unknown error'}`);
      return 0;
    }
  },

  detectSeverity: (text: string): string | null => {
     const criticalWords = ['حرب', 'انفجار', 'زلزال', 'war', 'explosion'];
     const highWords = ['تحذير', 'عاصفة', 'حريق', 'storm', 'fire', 'اعصار'];
     const mediumWords = ['حادث', 'تلوث', 'pollution', 'تكدس'];
     const otherAlertWords = ["عاجل", "كارثة", "خطر", "طوارئ", "انقطاع", "تسرب", "breaking", "urgent", "alert", "warning", "emergency", "disaster", "accident", "critical", "danger"];

     if (criticalWords.some(w => text.includes(w))) return 'critical';
     if (highWords.some(w => text.includes(w))) return 'high';
     if (mediumWords.some(w => text.includes(w))) return 'medium';
     if (otherAlertWords.some(w => text.includes(w))) return 'low';
     return null;
  },

  extractImage: (item: any): string | null => {
    if (item.enclosure && item.enclosure.url) return item.enclosure.url;
    if (item['media:content'] && item['media:content'].$) return item['media:content'].$.url;
    const imgMatch = item.content?.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) return imgMatch[1];
    return null;
  },

  discoverFeedUrl: async (websiteUrl: string): Promise<string | null> => {
    try {
      const html = await fetchWithTimeout(websiteUrl);
      const $ = load(html);
      let feedUrl = $('link[type="application/rss+xml"]').attr('href') || $('link[type="application/atom+xml"]').attr('href');
      if (feedUrl) {
        if (!feedUrl.startsWith('http')) {
          const base = new URL(websiteUrl);
          feedUrl = `${base.protocol}//${base.hostname}${feedUrl.startsWith('/') ? '' : '/'}${feedUrl}`;
        }
        return feedUrl;
      }
      return null;
    } catch (error) {
       return null;
    }
  },

  checkFeedStatus: async (feedUrl: string): Promise<boolean> => {
      try {
        await fetchWithTimeout(feedUrl, 10000);
        return true;
      } catch (e) {
        return false;
      }
  }
};
