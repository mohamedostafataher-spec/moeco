
import Parser from 'rss-parser';
import { storageService } from './storageService';

const parser = new Parser();

const COUPON_FEEDS = [
  'https://rss.app/feeds/WsY2K8uMEVobplUb.xml',
  'https://rss.app/feeds/kRy3Pglx5gI8Hj6d.xml',
  'https://rss.app/feeds/7JlQzhwZDN1GYM3o.xml',
  'https://rss.app/feeds/NBx6Y5Q2V52i50VG.xml',
  'https://rss.app/feeds/tKRJv0fd7xxRVYaD.xml'
];

export const couponCrawlerService = {
  fetchCouponsFromFeeds: async (): Promise<any[]> => {
    console.log('Fetching coupons from RSS feeds...');
    const allFetchedCoupons: any[] = [];

    for (const url of COUPON_FEEDS) {
      try {
        const feed = await parser.parseURL(url);
        console.log(`Parsing feed: ${feed.title}`);

        for (const item of feed.items) {
          const codeMatch = item.title?.match(/[A-Z0-9]{4,10}/) || item.content?.match(/[A-Z0-9]{4,10}/);
          const code = codeMatch ? codeMatch[0] : 'SAVE20';

          allFetchedCoupons.push({
            title: item.title || 'Special Offer',
            description: item.contentSnippet || item.content || '',
            code: code,
            category: 'Shopping',
            expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            link: item.link || '',
            status: 'active',
            image_url: ''
          });
        }
      } catch (error: any) {
        console.warn(`Skipping or feed error for ${url}:`, error.message || error);
      }
    }

    console.log(`Fetch complete. Retrieved ${allFetchedCoupons.length} coupons.`);
    return allFetchedCoupons;
  }
};
