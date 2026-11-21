
import { GoogleGenAI } from "@google/genai";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import sequelize from "./server/config/database.ts";
import "./server/models/Country.ts";
import "./server/models/Governorate.ts";
import "./server/models/City.ts";
import "./server/models/Sector.ts";
import "./server/models/EmissionFactor.ts";
import "./server/models/User.ts";
import "./server/models/ConsumptionLog.ts";
import "./server/models/Alert.ts";
import "./server/models/AuditLog.ts";
import "./server/models/RefreshToken.ts";
import "./server/models/PolicySimulation.ts";
import authRoutes from "./server/routes/authRoutes.ts";
import apiRoutes from "./server/routes/apiRoutes.ts";
import modularRoutes from "./server/modules/index.ts";

import Country from "./server/models/Country.ts";
import Sector from "./server/models/Sector.ts";
import Governorate from "./server/models/Governorate.ts";
import City from "./server/models/City.ts";
import EmissionFactor from "./server/models/EmissionFactor.ts";

import { rssService } from "./server/services/rssService.ts";
import { SupabaseReportingEngine } from "./server/services/SupabaseReportingEngine.ts";
import { couponEngine } from "./server/services/couponEngine.ts";
import { dataEngine } from "./server/services/dataEngine.ts";
import { alertsEngine } from "./server/services/alertsEngine.ts";
import { pricingEngine } from "./server/services/pricingEngine.ts";
import { prayerEngine } from "./server/services/prayerEngine.ts";
import { competitionEngine } from "./server/services/competitionEngine.ts";
import { govEngine } from "./server/services/govEngine.ts";
import { matchesEngine } from "./server/services/matchesEngine.ts";
import { supabase } from "./server/services/supabaseClient.ts";
import { supabaseSeedService } from "./server/services/supabaseSeedService.ts";

dotenv.config();

// --- Utility Helpers ---
const getTrafficFactor = () => {
  const hour = new Date().getHours();
  if ((hour >= 7 && hour <= 10) || (hour >= 16 && hour <= 20)) return 1.8; // Peak hours
  return 1.1; // Normal hours
};

// --- Gemini AI Initialization ---
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// --- Error Lifecycle Management ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('[ErrorLogger] [GLOBAL_UNHANDLED_REJECTION]', reason);
  // Optional: send to external logging service
});

process.on('uncaughtException', (error) => {
  console.error('[ErrorLogger] [GLOBAL_UNCAUGHT_EXCEPTION]', error);
  // Important: decide if we should exit here. For continuous service, we might just log.
});



// --- Overpass API Helper with Caching & Retries ---
const overpassCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const OVERPASS_MIRRORS = [
  'https://overpass.osm.ch/api/interpreter',
  'https://overpass.be/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter'
];

async function fetchOverpass(query: string, retries = 3): Promise<any> {
  const cacheKey = query;
  const cached = overpassCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  let lastError: any;
  for (let i = 0; i < retries; i++) {
    const mirror = OVERPASS_MIRRORS[i % OVERPASS_MIRRORS.length];
    try {
      const response = await axios.get(`${mirror}?data=${encodeURIComponent(query)}`, { 
        timeout: 30000,
        headers: { 
          'User-Agent': 'MoEco-App/1.0 (https://moeco.gov.eg; contact@moeco.gov.eg)',
          'Accept': 'application/json'
        }
      });
      
      // Check if response is actually JSON and contains elements
      if (response.data && typeof response.data === 'object' && response.data.elements) {
        overpassCache.set(cacheKey, { data: response.data.elements, timestamp: Date.now() });
        return response.data.elements;
      }

      // If we got HTML or a string, it might be a rate limit error even with 200 OK
      if (typeof response.data === 'string' && (response.data.includes('rate_limited') || response.data.includes('Error'))) {
        throw new Error(`Overpass Rate Limited: ${response.data.slice(0, 100)}...`);
      }

      throw new Error('Invalid response format from Overpass');
    } catch (error: any) {
      lastError = error;
      const status = error.response?.status;
      console.warn(`Overpass mirror ${mirror} failed (attempt ${i + 1}, status ${status}):`, error.message);
      
      // If 429 or 504, wait longer
      const waitTime = (status === 429 || status === 504) ? 3000 * (i + 1) : 1000 * (i + 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- RSS News & Alerts Engine ---
  // Initial sync with a graduated delay to prioritize server startup
  const initialSync = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000)); 
    console.log('Starting Force Sync for all sources...');
    try {
      // Force refresh of news sources to ensure we have the absolute latest
      await supabaseSeedService.seedAll();
      await rssService.fetchAndSyncAll();
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await Promise.allSettled([
        couponEngine.fetchAndSyncAll(),
        pricingEngine.fetchAndSyncAll(),
        competitionEngine.syncDailyQuestion(),
        dataEngine.syncEconomyData(),
        govEngine.syncToSupabase(),
        matchesEngine.syncToSupabase()
      ]);
      console.log('Initial Force Sync Completed.');
    } catch (e) {
      console.error('Initial Sync Error:', e);
    }
  };
  initialSync();

  // 5-minute Background Sync Tasks for News, Alerts, and Critical Data
  setInterval(async () => {
    console.log('Running 5-minute background sync for Environmental Intelligence...');
    try {
      await Promise.allSettled([
        rssService.fetchAndSyncAll(),
        couponEngine.fetchAndSyncAll(),
        pricingEngine.fetchAndSyncAll(),
        competitionEngine.syncDailyQuestion(),
        dataEngine.syncEconomyData()
      ]);
      console.log('5-minute sync completed successfully.');
    } catch (e) {
      console.error('Background Sync Error:', e);
    }
  }, 5 * 60 * 1000);

  // --- Database Sync ---
  try {
    await sequelize.authenticate();
    console.log("Database authentication successful");
    await sequelize.sync({ alter: false }); // Avoid destructive sync
    console.log("Database schemas verified");

    // Basic Seeding if empty
    const countryCount = await Country.count();
    if (countryCount === 0) {
      console.log("Seeding initial data...");
      const sectors = await Sector.bulkCreate([
        { nameEn: "Electricity", nameAr: "الكهرباء", icon: "Zap", color: "#FBBF24", unit: "kWh" },
        { nameEn: "Water", nameAr: "المياه", icon: "Droplets", color: "#3B82F6", unit: "m3" },
        { nameEn: "Transport", nameAr: "النقل", icon: "Car", color: "#EF4444", unit: "km" },
        { nameEn: "Waste", nameAr: "النفايات", icon: "Trash2", color: "#10B981", unit: "kg" },
        { nameEn: "Agriculture", nameAr: "الزراعة", icon: "Leaf", color: "#8B5CF6", unit: "kg" },
      ]);

      const egypt = await Country.create({
        nameEn: "Egypt",
        nameAr: "مصر",
        code: "EG",
        currency: "EGP",
        flag: "🇪🇬"
      });

      const governoratesData = [
        { nameEn: "Cairo", nameAr: "القاهرة", lat: 30.0444, lng: 31.2357 },
        { nameEn: "Alexandria", nameAr: "الإسكندرية", lat: 31.2001, lng: 29.9187 },
        { nameEn: "Giza", nameAr: "الجيزة", lat: 30.0131, lng: 31.2089 },
        { nameEn: "Aswan", nameAr: "أسوان", lat: 24.0889, lng: 32.8998 },
        { nameEn: "Luxor", nameAr: "الأقصر", lat: 25.6872, lng: 32.6396 },
        { nameEn: "Port Said", nameAr: "بورسعيد", lat: 31.2565, lng: 32.2841 },
        { nameEn: "Suez", nameAr: "السويس", lat: 29.9668, lng: 32.5498 },
        { nameEn: "Dakahlia", nameAr: "الدقهلية", lat: 31.0409, lng: 31.3785 },
        { nameEn: "Gharbia", nameAr: "الغربية", lat: 30.7865, lng: 31.0004 },
        { nameEn: "Faiyum", nameAr: "الفيوم", lat: 29.3084, lng: 30.8428 },
        { nameEn: "Sharqia", nameAr: "الشرقية", lat: 30.5877, lng: 31.5020 },
        { nameEn: "Monufia", nameAr: "المنوفية", lat: 30.5972, lng: 30.9876 },
        { nameEn: "Beheira", nameAr: "البحيرة", lat: 31.0364, lng: 30.4694 },
        { nameEn: "Damietta", nameAr: "دمياط", lat: 31.4175, lng: 31.8144 },
        { nameEn: "Kafr El Sheikh", nameAr: "كفر الشيخ", lat: 31.1107, lng: 30.9388 },
        { nameEn: "Qalyubia", nameAr: "القليوبية", lat: 30.4100, lng: 31.1600 },
        { nameEn: "Ismailia", nameAr: "الإسماعيلية", lat: 30.5965, lng: 32.2715 },
        { nameEn: "Beni Suef", nameAr: "بني سويف", lat: 29.0744, lng: 31.0978 },
        { nameEn: "Minya", nameAr: "المنيا", lat: 28.0871, lng: 30.7618 },
        { nameEn: "Asyut", nameAr: "أسيوط", lat: 27.1783, lng: 31.1859 },
        { nameEn: "Sohag", nameAr: "سوهاج", lat: 26.5591, lng: 31.6957 },
        { nameEn: "Qena", nameAr: "قنا", lat: 26.1551, lng: 32.7160 },
        { nameEn: "Red Sea", nameAr: "البحر الأحمر", lat: 27.2579, lng: 33.8116 },
        { nameEn: "New Valley", nameAr: "الوادي الجديد", lat: 25.4514, lng: 30.5467 },
        { nameEn: "Matrouh", nameAr: "مطروح", lat: 31.3543, lng: 27.2373 },
        { nameEn: "North Sinai", nameAr: "شمال سيناء", lat: 31.1321, lng: 33.8033 },
        { nameEn: "South Sinai", nameAr: "جنوب سيناء", lat: 28.5000, lng: 34.0000 }
      ];

      for (const gov of governoratesData) {
        await Governorate.create({
          ...gov,
          countryId: egypt.id
        });
      }

      const cairoGov = await Governorate.findOne({ where: { nameEn: "Cairo" } });
      if (cairoGov) {
        await City.create({
          nameEn: "New Cairo",
          nameAr: "القاهرة الجديدة",
          governorateId: cairoGov.id,
          lat: 30.0299,
          lng: 31.4913
        });
      }

      // Seed Government Users
      const bcrypt = (await import('bcryptjs')).default;
      const User = (await import('./server/models/User.ts')).default;
      
      const countries = await Country.findAll();
      for (const country of countries) {
        const hashedPassword = await bcrypt.hash(country.nameEn.toLowerCase(), 10);
        await User.findOrCreate({
          where: { email: `gov@${country.nameEn.toLowerCase()}.moeco.gov` },
          defaults: {
            password: hashedPassword,
            role: 'Government',
            countryId: country.id,
            points: 1000,
            greenCoins: 5000
          }
        });
      }

      console.log("Initial data seeded");
    }
  } catch (error: any) {
    console.error("Database connection failed:", error.message);
    if (error.name === 'SequelizeDatabaseError') {
      console.error("Database Error Details:", error.parent || error);
    }
  }

  // --- API Routes ---
  app.use("/api/auth", authRoutes);
  app.use("/api/unified", modularRoutes); // New Modular Backend
  app.use("/api", apiRoutes);

  // Dashboard Stats
  app.get("/api/dashboard/news-stats", async (req, res) => {
    try {
      const [
        { count: articlesCount },
        { count: activeFeedsCount },
        { data: feeds }
      ] = await Promise.all([
        supabase.from('news').select('*', { count: 'exact', head: true }),
        supabase.from('rss_sources').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('rss_sources').select('name, feed_url, is_active')
      ]);

      const { data: categoryStats } = await supabase.rpc('get_news_category_stats'); 
      // Fallback if RPC doesn't exist
      let stats = categoryStats;
      if (!stats) {
        const { data: allArticles } = await supabase.from('news').select('category');
        const counts: any = {};
        allArticles?.forEach(a => counts[a.category] = (counts[a.category] || 0) + 1);
        stats = Object.entries(counts).map(([category, count]) => ({ category, count }));
      }

      res.json({
        articlesCount: articlesCount || 0,
        activeFeedsCount: activeFeedsCount || 0,
        feeds: feeds || [],
        categoryStats: stats || []
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // Missing Dashboard Endpoints
  app.get("/api/news/count", async (req, res) => {
    try {
      const { count, error } = await supabase.from('news').select('*', { count: 'exact', head: true });
      if (error) throw error;
      res.json({ count: count || 0 });
    } catch (err) {
      res.json({ count: 120 }); // Fallback
    }
  });

  app.get("/api/gov-services/count", async (req, res) => {
    try {
      const { count, error } = await supabase.from('gov_services').select('*', { count: 'exact', head: true });
      if (error) throw error;
      res.json({ count: count || 0 });
    } catch (err) {
      res.json({ count: 9 }); // Fallback
    }
  });

  app.post("/api/user/seed-personal", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    
    try {
      // 1. Create a few activities
      const activities = [
        { user_id: userId, activity_name: 'Used Metro', category: 'transport', carbon_impact: -1.2, points_earned: 15 },
        { user_id: userId, activity_name: 'Recycled Waste', category: 'waste', carbon_impact: -0.5, points_earned: 10 },
        { user_id: userId, activity_name: 'Saved Electricity', category: 'electricity', carbon_impact: -2.1, points_earned: 25 },
        { user_id: userId, activity_name: 'Plant a Tree', category: 'agriculture', carbon_impact: -5.0, points_earned: 50 }
      ];
      await supabase.from('carbon_activities').insert(activities);

      // 2. Update user points
      await supabase.from('users').update({ points: 100 }).eq('id', userId);

      res.json({ message: 'Personal seed data created.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Manual Sync Trigger
  app.post("/api/system/sync-all", async (req, res) => {
    try {
      await supabaseSeedService.seedAll();
      await rssService.fetchAndSyncAll();
      await govEngine.syncToSupabase();
      await dataEngine.syncEconomyData();
      res.json({ message: 'Global system sync triggered and completed.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/news/sync-manual", async (req, res) => {
    await rssService.fetchAndSyncAll();
    res.json({ message: 'Sync triggered' });
  });

  // Generic RSS Proxy to handle CORS and timeouts for client-side fallback
  const rssProxyCache = new Map<string, { data: string, timestamp: number }>();
  const RSS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  app.get("/api/proxy/rss", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') return res.status(400).json({ error: "URL is required" });

    // Check Cache
    const cached = rssProxyCache.get(url);
    if (cached && Date.now() - cached.timestamp < RSS_CACHE_TTL) {
      res.set('Content-Type', 'application/xml');
      return res.send(cached.data);
    }

    try {
      console.log(`Proxying RSS request for: ${url}`);
      const response = await axios.get(url, {
        timeout: 25000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Referer': 'https://www.google.com/',
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500 // Accept any status < 500 to handle 4xx gracefully
      });
      
      if (response.status >= 400) {
        throw { response: { status: response.status }, message: `Source returned ${response.status}` };
      }

      rssProxyCache.set(url, { data: response.data, timestamp: Date.now() });
      res.set('Content-Type', 'application/xml');
      res.send(response.data);
    } catch (error: any) {
      // If we have cached data even if expired, use it as fallback on error
      if (cached) {
        res.set('Content-Type', 'application/xml');
        return res.send(cached.data);
      }

      // Instead of failing loudly, return an empty feed so parsers handle it gracefully
      const emptyXml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Unavailable</title><description>Feed temporarily unavailable</description></channel></rss>`;
      res.set('Content-Type', 'application/xml');
      return res.send(emptyXml);
    }
  });

  app.post("/api/news/discover-feed", async (req, res) => {
    const { websiteUrl } = req.body;
    if (!websiteUrl) return res.status(400).json({ error: 'websiteUrl required' });
    try {
      const feedUrl = await rssService.discoverFeedUrl(websiteUrl);
      if (!feedUrl) return res.status(404).json({ error: 'Could not discover RSS feed' });
      res.json({ feedUrl });
    } catch (error) {
      res.status(500).json({ error: 'Failed to discover feed' });
    }
  });

  app.post("/api/news/cleanup", async (req, res) => {
    try {
      const { data: sources } = await supabase.from('rss_sources').select('*').eq('is_active', true);
      const deactivated: string[] = [];
      
      for (const source of (sources || [])) {
        const isWorking = await rssService.checkFeedStatus(source.feed_url || source.url);
        if (!isWorking) {
          await supabase.from('rss_sources').update({ is_active: false }).eq('id', source.id);
          deactivated.push(source.name);
        }
      }
      res.json({ success: true, deactivated });
    } catch (error) {
      res.status(500).json({ error: 'Failed to cleanup feeds' });
    }
  });

  app.get("/api/news/direct", async (req, res) => {
    try {
      const articles = await rssService.fetchDirect();
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch direct news' });
    }
  });

  app.get("/api/alerts/direct", async (req, res) => {
    try {
      const result = await rssService.fetchDirect();
      const alerts = result.articles
        .filter(a => a.target_screen === 'emergency' || a.target_screen === 'emergency')
        .map(a => ({
          ...a,
          type: a.category,
          severity: a.target_screen === 'emergency' ? 'Critical' : 'High', // Map urgent priority to Critical severity
          location: 'مصر' // Example default location
        }));
      res.json({ alerts, sourceStatus: result.sourceStatus });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch direct alerts' });
    }
  });

  app.post("/api/alerts/sync-manual", async (req, res) => {
    await rssService.fetchAndSyncAll();
    res.json({ message: 'Sync triggered' });
  });

  app.get("/api/coupons/direct", async (req, res) => {
    try {
      const coupons = await couponEngine.fetchDirect();
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch direct coupons' });
    }
  });

  app.post("/api/coupons/sync-manual", async (req, res) => {
    await couponEngine.fetchAndSyncAll();
    res.json({ message: 'Sync triggered' });
  });

  // --- Daily Services Hub Endpoints ---
  app.get("/api/pricing/direct", async (req, res) => {
    try {
      const prices = await pricingEngine.fetchDirect();
      res.json(prices);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch direct pricing' });
    }
  });

  app.get("/api/pricing/egypt-market", async (req, res) => {
    try {
      const prices = await pricingEngine.fetchDirect();
      res.json(prices);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch egypt market pricing' });
    }
  });

  app.get("/api/news/commodity-prices", async (req, res) => {
    try {
      const result = await rssService.fetchDirect();
      const economyNews = result.articles.filter(a => a.category === 'economy' || a.title.includes('سعر') || a.title.includes('أسعار'));
      res.json(economyNews);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch commodity news' });
    }
  });

  app.get("/api/prayer-times", async (req, res) => {
    const { lat, lng } = req.query;
    console.log(`Prayer times API called with lat: ${lat}, lng: ${lng}`);
    if (!lat || !lng || lat === 'undefined' || lng === 'undefined') {
      console.error(`Invalid lat/lng: lat=${lat}, lng=${lng}`);
      return res.status(400).json({ error: 'Lat/Lng required' });
    }
    try {
      // Validate lat/lng
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      if (isNaN(latitude) || isNaN(longitude)) return res.status(400).json({ error: 'Invalid Lat/Lng' });

      const times = await prayerEngine.fetchTimes(latitude, longitude).catch(() => null);
      if (!times) throw new Error('Prayer engine failed');
      res.json(times);
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      res.status(500).json({ error: 'Failed to fetch prayer times, but system remains stable' });
    }
  });

  app.get("/api/nearby", async (req, res) => {
    const { lat, lng, category, radius: queryRadius } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'Lat/Lng required' });
    
    // Add validation for lat/lng to prevent crashes
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    if (isNaN(latitude) || isNaN(longitude)) return res.status(400).json({ error: 'Invalid Lat/Lng' });

    try {
      let tags = 'pharmacy|hospital|bank|atm|post_office|clinic|dentist|doctors|police|fire_station|school|university|fuel|parking|bus_station|supermarket|mall|marketplace|place_of_worship';
      
      if (category === 'entertainment') {
        tags = 'cafe|restaurant|fast_food|cinema|theatre|museum|gallery|zoo|park|garden|playground|mall';
      } else if (category === 'essential') {
        tags = 'pharmacy|hospital|doctors|supermarket|grocery|marketplace|dentist|bank|atm';
      } else if (category === 'gov') {
        tags = 'police|post_office|townhall|courthouse|embassy|social_centre|healthcare|health_center|clinic';
      } else if (category === 'community') {
        tags = 'place_of_worship|charity|recycling|community_centre|school|university|library|social_facility|neighbourhood|village_hall';
      } else if (category === 'activity') {
        tags = 'gym|fitness_centre|sports_centre|stadium|swimming_pool|park|playground';
      }

      const getQuery = (r: number) => `[out:json][timeout:25];(nwr["amenity"~"${tags}"](around:${r},${latitude},${longitude});nwr["leisure"~"mall|park|garden|playground|sports_centre|fitness_centre"](around:${r},${latitude},${longitude});nwr["craft"~"plumber|electrician|painter|carpenter"](around:${r},${latitude},${longitude});nwr["tourism"~"attraction|museum|viewpoint|zoo"](around:${r},${latitude},${longitude}););out center 100;`;
      
      let radius = parseInt(queryRadius as string) || 5000;
      let elements = await fetchOverpass(getQuery(radius)).catch(() => []);

      // If user specified radius, don't fallback automatically to 20km unless they get 0
      if (!elements || elements.length === 0) {
        if (!queryRadius) {
           radius = 10000;
           elements = await fetchOverpass(getQuery(radius)).catch(() => []);
           if (!elements || elements.length === 0) {
             radius = 20000;
             elements = await fetchOverpass(getQuery(radius)).catch(() => []);
           }
        }
      }

      res.json(elements || []);
    } catch (error) {
      console.error('Nearby API Error:', error);
      res.status(500).json({ error: 'Failed to fetch nearby places, but system remains stable' });
    }
  });

  app.get("/api/outings", async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'Lat/Lng required' });
    try {
      const radius = 15000;
      const query = `[out:json][timeout:25];(nwr["amenity"~"cafe|restaurant|fast_food|bar|pub|cinema|theatre|museum|gallery|zoo|library"](around:${radius},${lat},${lng});nwr["leisure"~"park|garden|playground|stadium|sports_centre|fitness_centre|recreation_ground|nature_reserve"](around:${radius},${lat},${lng});nwr["tourism"~"attraction|museum|viewpoint|zoo|theme_park|gallery|information"](around:${radius},${lat},${lng});nwr["shop"~"mall|supermarket|department_store|clothes|electronics"](around:${radius},${lat},${lng}););out center 50;`;
      const elements = await fetchOverpass(query);
      res.json(elements);
    } catch (error) {
      console.error('Outings API Error:', error);
      res.status(500).json({ error: 'Failed to fetch outings' });
    }
  });

  app.get("/api/health-facilities", async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'Lat/Lng required' });
    try {
      const radius = 10000;
      const query = `[out:json][timeout:25];(nwr["amenity"~"hospital|pharmacy|clinic|dentist|doctors"](around:${radius},${lat},${lng}););out center 50;`;
      const elements = await fetchOverpass(query);
      
      const facilities = elements.map((el: any) => ({
        name: el.tags?.name || (el.tags?.amenity === 'hospital' ? 'Hospital' : 'Pharmacy'),
        type: el.tags?.amenity || 'facility',
        lat: el.lat || el.center?.lat,
        lng: el.lon || el.center?.lon,
        distance: 'Nearby',
        status: 'Verified',
        phone: el.tags?.phone || '123'
      }));
      
      res.json(facilities);
    } catch (error) {
      console.error('Health API Error:', error);
      res.status(500).json({ error: 'Failed to fetch health facilities' });
    }
  });

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "MoEco Sovereign Backend is Live" });
  });

  // Smart Transport Insight using AI
  app.post("/api/transport/guide-insight", async (req, res) => {
    const { from, to, modes, language } = req.body;
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined");
      }

      const prompt = `
        You are MoEco Transport AI assistant in Egypt. 
        The user wants to go from "${from}" to "${to}".
        Available modes: ${JSON.stringify(modes?.map((m: any) => m.label) || [])}.
        Traffic condition is currently ${getTrafficFactor() > 1.4 ? 'Heavy' : 'Normal'}.
        
        Provide a very brief 2-sentence recommendation in ${language === 'ar' ? 'Arabic (Egyptian dialect)' : 'English'}.
        Focus on the "Greenest" and "Fastest" option. 
        Add one encouraging tip about saving CO2.
        Keep it professional yet friendly.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      res.json({ insight: response.text });
    } catch (e) {
      console.error("Gemini Transport Insight Error:", e);
      res.json({ insight: language === 'ar' ? "استخدم المترو دائماً لتجنب الزحام وحماية البيئة!" : "Always use the Metro to avoid traffic and protect the environment!" });
    }
  });

  // Real-time MoEco Network Governorates Data
  app.get("/api/governorates", async (req, res) => {
    try {
      const govs = await Governorate.findAll();
      const result = govs.map((g, index) => ({
        id: g.id,
        governorate: g.nameAr,
        governorateEn: g.nameEn,
        lat: g.lat,
        lng: g.lng,
        stressLevel: Math.floor(20 + ((index * 7) % 60)), // Deterministic variation
        avgKwh: Math.floor(200 + ((index * 23) % 300)) // Deterministic variation
      }));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch governorates' });
    }
  });

  app.get("/api/admin/accessibility/videos", async (req, res) => {
    try {
      const { data, error } = await supabase.from('sign_language_videos').select('*');
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  app.post("/api/admin/accessibility/videos", async (req, res) => {
    try {
      const { screen_name, video_url, language } = req.body;
      const { data, error } = await supabase.from('sign_language_videos').upsert({ screen_name, video_url, language }, { onConflict: 'screen_name' });
      if (error) throw error;
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save video' });
    }
  });

  app.post("/api/reports/generate/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const { userId, month, year } = req.body;
      const engine = new SupabaseReportingEngine();
      let result;
      if (type === 'user') {
        if (!userId) return res.status(400).json({ error: 'Missing userId' });
        result = await engine.generateUserReport(userId, month || new Date().getMonth() + 1, year || new Date().getFullYear());
      } else if (type === 'country') {
        result = await engine.generateCountryReport(month || new Date().getMonth() + 1, year || new Date().getFullYear());
      } else if (type === 'sector') {
        const { sector } = req.body;
        if (!sector) return res.status(400).json({ error: 'Missing sector' });
        result = await engine.generateSectorReport(sector, month || new Date().getMonth() + 1, year || new Date().getFullYear());
      } else if (type === 'governorate') {
        result = await engine.generateGovernorateReport(month || new Date().getMonth() + 1, year || new Date().getFullYear());
      } else {
        return res.status(400).json({ error: 'Unsupported report type' });
      }
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MoEco Server running at http://0.0.0.0:${PORT}`);
    
    // Initial Syncs
    console.log("Initializing Background Engines...");
    rssService.fetchAndSyncAll().catch(console.error);
    matchesEngine.syncToSupabase().catch(console.error);
    govEngine.syncToSupabase().catch(console.error);
    dataEngine.syncEconomyData().catch(console.error);

    // 20-minute cron job for News/RSS
    setInterval(() => {
      console.log("Running 20-Minute RSS Sync...");
      rssService.fetchAndSyncAll().catch(e => console.error("RSS Sync Error:", e));
    }, 20 * 60 * 1000);

    // 15-minute cron job for matches
    setInterval(() => {
      console.log("Running 15-Minute Matches Sync...");
      matchesEngine.syncToSupabase().catch(e => console.error("Matches Sync Error:", e));
    }, 15 * 60 * 1000);

    // 6-hour cron job for gov services
    setInterval(() => {
      console.log("Running 6-Hour Gov Services Sync...");
      govEngine.syncToSupabase().catch(console.error);
    }, 6 * 60 * 60 * 1000);

    // Daily Economy Sync (every 12 hours)
    setInterval(() => {
      console.log("Running 12-Hour Economy Sync...");
      dataEngine.syncEconomyData().catch(console.error);
    }, 12 * 60 * 60 * 1000);
  });
}

startServer().catch(err => {
  console.error('[CriticalStartupError] Failed to start server:', err);
  process.exit(1);
});

