
import { supabase } from './supabaseClient';
import { Language } from '../types';
import { apiClient } from './apiClient';
import { storageService } from './storageService';

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  description?: string;
  url: string;
  image_url?: string;
  source: string;
  category: string;
  published_at: string;
  fetch_source?: 'live' | 'realtime' | 'cache';
  is_alert?: boolean;
  target_screen?: string;
  country?: string;
}

export interface NewsFetchResult {
  articles: NewsArticle[];
  sourceStatus?: Record<string, 'ok' | 'error'>;
}

export const newsService = {
  fetchEcoNews: async (category: string = 'all', forceSync?: boolean): Promise<NewsFetchResult> => {
    try {
      let articles: NewsArticle[] = [];
      
      // Try fetching live RSS via Free API (rss2json)
      const feedUrl = encodeURIComponent("https://www.unep.org/rss/news"); // UNEP environmental news
      const rssApiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}&api_key=`;
      
      try {
        const res = await fetch(rssApiUrl);
        const data = await res.json();
        if (data.status === 'ok' && data.items) {
          const liveArticles = data.items.map((item: any, index: number) => ({
            id: `unep-${index}-${Date.now()}`,
            title: item.title,
            content: item.content || item.description,
            description: item.description,
            url: item.link,
            image_url: item.thumbnail || item.enclosure?.link,
            source: 'UN Environment',
            category: 'environment',
            published_at: item.pubDate,
            fetch_source: 'live'
          }));
          articles = [...liveArticles];
        }
      } catch (err) {
        console.warn("Failed fetching live rss via free API", err);
      }

      // Also get from supabase
      let query = supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(20); 

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (!error && data) {
        const dbArticles = data.map(a => ({
          id: a.id,
          title: a.title,
          content: a.content,
          description: a.description || a.content?.substring(0, 100),
          url: a.url || a.source_url || '',
          source: a.source || 'EcoNews DB',
          category: a.category || 'general',
          published_at: a.published_at || a.created_at,
          fetch_source: 'supabase',
          is_alert: a.is_emergency,
          image_url: a.image_url
        })) as NewsArticle[];
        articles = [...articles, ...dbArticles];
      }
      
      // Sort all combined descending
      articles.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
      
      // Filter category if needed
      if (category !== 'all') {
        articles = articles.filter(a => a.category === category);
      }

      return { articles };
    } catch (e) {
      console.error('News fetch failed', e);
      return { articles: [] };
    }
  },

  processLiveEngine: async () => {
    console.log("News Engine: Syncing feeds via client...");
  },

  subscribeToNews: (onUpdate: (payload: any) => void) => {
    return supabase
      .channel('news_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news' }, onUpdate)
      .subscribe();
  }
};

