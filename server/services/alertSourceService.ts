
import Parser from 'rss-parser';
import { convert } from 'html-to-text';
import { supabase } from './supabaseClient.ts';

const parser = new Parser();

// Default fallback feeds if DB is empty
const DEFAULT_ALERT_FEEDS = [
  { name: 'هيئة الأرصاد المصرية - اليوم السابع', url: 'https://www.youm7.com/rss/356', category: 'weather' },
  { name: 'GDACS (كوارث عالمية)', url: 'https://www.gdacs.org/xml/rss.xml', category: 'emergency' },
  { name: 'سكاي نيوز - عاجل', url: 'https://www.skynewsarabia.com/feeds/rss/urgent.xml', category: 'emergency' }
];

export const alertSourceService = {
  fetchDirect: async () => {
    const allAlerts: any[] = [];
    const sourceStatus: Record<string, 'ok' | 'error'> = {};

    // 1. Get feeds from Database
    let feedsGroup = DEFAULT_ALERT_FEEDS;
    try {
      const { data: dbSources } = await supabase
        .from('rss_sources')
        .select('*')
        .eq('target_screen', 'emergency')
        .eq('is_active', true);
      
      if (dbSources && dbSources.length > 0) {
        feedsGroup = dbSources.map(s => ({
          name: s.name,
          url: s.feed_url || s.url,
          category: s.category || 'emergency'
        }));
      }
    } catch (e) {
      console.error('Failed to fetch alert sources from DB, using fallbacks');
    }

    // 2. Fetch news from identified feeds
    for (const feed of feedsGroup) {
      try {
        const feedData = await parser.parseURL(feed.url);
        const alerts = feedData.items.map(item => ({
          id: Math.random().toString(36).substring(7),
          title: item.title,
          description: convert(item.content || item.contentSnippet || '', { wordwrap: 130 }).substring(0, 300),
          type: feed.category,
          severity: alertSourceService.detectSeverity(item.title || '', item.content || ''),
          location: 'مصر والشرق الأوسط',
          source: feed.name,
          link: item.link,
          created_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
        }));
        allAlerts.push(...alerts);
        sourceStatus[feed.name] = 'ok';
      } catch (e: any) {
        console.warn(`Alert fetch warning (${feed.name}): ${e.message}`);
        sourceStatus[feed.name] = 'error';
      }
    }

    return {
      alerts: allAlerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      sourceStatus
    };
  },

  detectSeverity: (title: string, content: string): string => {
    const text = (title + ' ' + content).toLowerCase();
    if (text.includes('عاجل') || text.includes('urgent') || text.includes('critical') || text.includes('تحذير')) return 'Critical';
    if (text.includes('warning') || text.includes('تنبيه') || text.includes('high')) return 'High';
    if (text.includes('medium') || text.includes('متوسط')) return 'Medium';
    return 'Low';
  }
};
