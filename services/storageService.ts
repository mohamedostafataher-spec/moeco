
import { User, EmissionRecord, ChatMessage, EcoProduct, Challenge, BillRecord, TransportLog, CarbonActivity, Family, UtilityMeter, UtilityReading, Alert } from '../types';
import { supabase, getSafeSession, safeRequest } from './supabaseClient';
import { notificationService } from './notificationService';
import { getWithCache } from './supabaseHelper';
import { growthEngine } from './growthEngine';

const API_URL = '/api';

let currentUserCache: any = null;

const getAuthHeaders = async () => {
  const session = await getSafeSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || ''}`
  };
};

// --- Performance & Stability Metrics ---
const metrics = {
  startTime: Date.now(),
  loadTime: 0,
  errorCount: 0,
  apiStatus: {} as Record<string, 'success' | 'error' | 'pending'>,
  logs: [] as string[]
};

const addLog = (msg: string) => {
  const time = ((Date.now() - metrics.startTime) / 1000).toFixed(2);
  const log = `[${time}s] ${msg}`;
  metrics.logs.unshift(log);
  if (metrics.logs.length > 50) metrics.logs.pop();
  console.log(log);
};


export const storageService = {
  getAggregatedCarbon: async (userId: string) => {
    try {
      const records = await storageService.getRecords();
      const userRecords = records.filter(r => r.userId === userId);
      
      const total = userRecords.reduce((sum, r) => sum + (r.co2_impact || r.co2 || 0), 0);
      const totalSaved = userRecords.reduce((sum, r) => sum + (r.details?.carbon_saved || r.co2_saved || 0), 0);
      const bySector = userRecords.reduce((acc, r) => {
        const amount = r.co2_impact || r.co2 || 0;
        acc[r.sector || 'unknown'] = (acc[r.sector || 'unknown'] || 0) + amount;
        return acc;
      }, {} as Record<string, number>);


      return {
        total,
        totalSaved,
        totalSavedMoney: totalSaved * 2.5, // 2.5 EGP per saved carbon unit estimation
        bySector,
        count: userRecords.length
      };
    } catch (e) {
      return { total: 0, totalSaved: 0, bySector: {}, count: 0 };
    }
  },

  getMetrics: () => ({
    ...metrics,
    loadTime: metrics.loadTime || (Date.now() - metrics.startTime)
  }),
  
  setLoadTime: () => {
    if (!metrics.loadTime) metrics.loadTime = Date.now() - metrics.startTime;
  },

  isOnline: () => navigator.onLine,

  // --- Robust Request Wrapper ---
  robustRequest: async <T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { 
      timeout?: number; 
      retries?: number; 
      useCache?: boolean;
    } = {}
  ): Promise<T | null> => {
    const { timeout = 10000, retries = 2, useCache = true } = options;
    
    metrics.apiStatus[key] = 'pending';
    addLog(`Requesting ${key} from Live Supabase...`);
    
    // Check if offline, serve cache
    if (!navigator.onLine) {
      if ((options as any).isWrite) {
        const pending = JSON.parse(localStorage.getItem('moeco_pending_sync') || '[]');
        pending.push({ table: key, data: (options as any).writeData, timestamp: new Date().toISOString() });
        localStorage.setItem('moeco_pending_sync', JSON.stringify(pending));
        notificationService.info("Action saved offline. Will sync when online.");
      }
      
      if (useCache) {
        addLog(`Offline - the system is falling back to safe local cache for ${key}`);
        const cachedStr = localStorage.getItem(`moeco_cache_${key}`);
        if (cachedStr) {
          try {
            return JSON.parse(cachedStr) as T;
          } catch(e) {}
        }
      }
      addLog(`Offline - Cannot fetch ${key}`);
      metrics.apiStatus[key] = 'error';
      return null;
    }

    // 2. Fetch with Timeout and Retry
    let lastError: any;
    for (let i = 0; i <= retries; i++) {
      try {
        const result = await Promise.race([
          fetcher(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeout)
          )
        ]);

        metrics.apiStatus[key] = 'success';
        addLog(`Successfully fetched ${key}`);
        
        // Save to fallback local cache
        if (useCache && result) {
          localStorage.setItem(`moeco_cache_${key}`, JSON.stringify(result));
        }

        return result;
      } catch (err) {
        lastError = err;
        addLog(`Attempt ${i + 1} failed for ${key}: ${err instanceof Error ? err.message : String(err)}`);
        if (i < retries) await new Promise(r => setTimeout(r, 1000));
      }
    }

    metrics.errorCount++;
    metrics.apiStatus[key] = 'error';
    addLog(`All attempts failed for ${key}, falling back to local cache`);
    
    // If request failed, fallback to local cache
    if (useCache) {
       const cachedStr = localStorage.getItem(`moeco_cache_${key}`);
       if (cachedStr) {
         try {
           return JSON.parse(cachedStr) as T;
         } catch(e) {}
       }
    }

    return null;
  },

  cachedRecords: [] as EmissionRecord[],
  awardPoints: async (userId: string, points: number, reason: string, source: string = 'system') => {
    try {
      if (!userId) return null;
      const today = new Date().toISOString();
      
      const result = await safeRequest(async () => {
        // 1. Fetch current profile
        const { data: profileData } = await supabase.from('users').select('points, level, experience_points').eq('id', userId).single();
        if (!profileData) return { data: null, error: 'Profile not found' };

        const currentPoints = profileData.points || 0;
        const currentXP = profileData.experience_points || 0;
        const newXP = currentXP + (points * 10);
        const newLevel = Math.floor(Math.sqrt(newXP / 500)) + 1;
        const newTotal = currentPoints + points;

        // 2. Update User
        const { error: updateError } = await supabase.from('users').update({
          points: newTotal,
          experience_points: newXP,
          level: newLevel,
          updated_at: today
        }).eq('id', userId);

        if (updateError) return { data: null, error: updateError };

        // 3. Log transaction
        await supabase.from('points_transactions').insert({
          user_id: userId,
          points: points,
          reason: reason,
          metadata: { source }
        });

        return { data: { newTotal, newLevel, leveledUp: newLevel > profileData.level }, error: null };
      });

      if (result?.data?.leveledUp) {
        notificationService.success(`🎉 Level Up! You are now Level ${result.data.newLevel}`);
      }

      // Update local session
      const session = storageService.getUser();
      if (session && session.id === userId && result?.data) {
        const updatedSession = { ...session, points: result.data.newTotal, level: result.data.newLevel };
        currentUserCache = updatedSession;
      }

      await storageService.updateStreak(userId);
      return result?.data;
    } catch (error) {
      console.warn('Error in awardPoints:', error);
      return null;
    }
  },

  checkAndAwardBadges: async (userId: string, totalScore: number) => {
    try {
      const { data: allBadges } = await supabase.from('badges').select('*');
      if (!allBadges) return;

      const { data: earnedBadges } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId);
      const earnedIds = new Set(earnedBadges?.map(b => b.badge_id) || []);

      for (const badge of allBadges) {
        if (!earnedIds.has(badge.id)) {
          let shouldAward = false;
          if (badge.condition_type === 'score' && totalScore >= badge.condition_value) {
            shouldAward = true;
          }
          // Other conditions (distance, etc) could be check here if data is available

          if (shouldAward) {
            await supabase.from('user_badges').insert({
              user_id: userId,
              badge_id: badge.id,
              earned_at: new Date().toISOString()
            });
            notificationService.success(`🎖️ New Badge Unlocked: ${badge.name}!`);
          }
        }
      }
    } catch (e) {
      console.error("Badge check failed", e);
    }
  },

  getLeaderboard: async (limit: number = 20) => {
    return await storageService.robustRequest('leaderboard', async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          governorate,
          avatar_url,
          points,
          level
        `)
        .order('points', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data.map(item => ({
        id: item.id,
        name: item.full_name || 'Anonymous Eco Hero',
        points: item.points,
        level: item.level,
        governorate: item.governorate,
        avatar: item.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.id}`
      }));
    });
  },

  getChallenges: async () => {
    return await storageService.robustRequest('challenges_v2', async () => {
      const user = storageService.getUser();
      if (!user) return [];

      const [challengesRes, userChallengesRes] = await Promise.all([
        supabase.from('challenges').select('*').eq('status', 'active'),
        supabase.from('user_challenges').select('*').eq('user_id', user.id)
      ]);

      if (challengesRes.error) throw challengesRes.error;

      const userProgMap = new Map();
      userChallengesRes.data?.forEach(uc => userProgMap.set(uc.challenge_id, uc));

      return challengesRes.data.map(ch => ({
        ...ch,
        progress: userProgMap.get(ch.id)?.progress || 0,
        is_completed: userProgMap.get(ch.id)?.is_completed || false,
        title: { ar: ch.title_ar || ch.title, en: ch.title_en || ch.title }, // Fallback logic
        description: { ar: ch.description_ar || ch.description, en: ch.description_en || ch.description }
      }));
    });
  },

  completeChallenge: async (challengeId: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("Not logged in");

    // 1. Get challenge details
    const { data: challenge } = await supabase.from('challenges').select('*').eq('id', challengeId).single();
    if (!challenge) throw new Error("Challenge not found");

    // 2. Mark as completed
    const { error } = await supabase.from('user_challenges').upsert({
      user_id: user.id,
      challenge_id: challengeId,
      progress: challenge.target_value,
      is_completed: true,
      completed_at: new Date().toISOString()
    }, { onConflict: 'user_id,challenge_id' });

    if (error) throw error;

    // 3. Award points
    await storageService.awardPoints(user.id, challenge.reward_points, `Challenge Completed: ${challenge.title_en || challenge.title}`, 'challenges');
    return true;
  },

  getBadges: async () => {
    const user = storageService.getUser();
    if (!user) return [];

    const { data: earned } = await supabase
      .from('user_badges')
      .select('badges(*), earned_at')
      .eq('user_id', user.id);
    
    return earned || [];
  },

  trackCarbon: async (userId: string, amount: number, category: string, subCategory: string = 'general') => {
    try {
      const { error } = await supabase.from('consumption_records').insert({
        user_id: userId,
        co2: amount,
        co2_impact: amount,
        sector: category,
        activity_type: subCategory,
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      // Real Growth Logic
      if (amount < 0) {
        const points = Math.abs(Math.round(amount / 0.5));
        await storageService.awardPoints(userId, points, `Carbon Saving: ${category}`, 'carbon_tracker');
        // Update Challenges in DB
        await growthEngine.updateChallengeProgress(userId, category, Math.abs(amount), 'sum_carbon');
      } else {
        await storageService.awardPoints(userId, 5, `Consumption Logged: ${category}`, 'carbon_tracker');
      }
    } catch (error) {
      console.error('Error tracking carbon:', error);
      throw error;
    }
  },
  STORAGE_QUOTA: 5 * 1024 * 1024, // 5MB free quota simulation

  getStorageUsage: () => {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += (localStorage[key].length + key.length) * 2;
      }
    }
    return total;
  },

  uploadImage: async (file: File, bucket: string = 'general') => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.warn("Storage upload failed, falling back to base64", err);
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
          const img = new Image();
          img.src = e.target?.result as string;
          img.onload = () => {
             const canvas = document.createElement('canvas');
             const MAX_WIDTH = bucket === 'covers' ? 1200 : 400;
             const MAX_HEIGHT = bucket === 'covers' ? 600 : 400;
             let width = img.width;
             let height = img.height;
             
             if (width > height) {
               if (width > MAX_WIDTH) {
                 height *= MAX_WIDTH / width;
                 width = MAX_WIDTH;
               }
             } else {
               if (height > MAX_HEIGHT) {
                 width *= MAX_HEIGHT / height;
                 height = MAX_HEIGHT;
               }
             }
             canvas.width = width;
             canvas.height = height;
             const ctx = canvas.getContext('2d');
             ctx?.drawImage(img, 0, 0, width, height);
             resolve(canvas.toDataURL('image/jpeg', 0.8));
          };
          img.onerror = () => reject(err);
        };
        reader.onerror = () => reject(err);
      });
    }
  },

  uploadMeterImage: async (file: File) => {
    return await storageService.uploadImage(file, 'utility-meters');
  },

  getPolicyDecisions: async () => {
    try {
      const { data, error } = await supabase
        .from('policy_decisions')
        .select('*');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        // Fallback or seed logic could go here if needed, but for now we'll return what's in the DB
        return [];
      }

      return data.map(d => ({
        id: d.id,
        title: { ar: d.title_ar, en: d.title_en },
        description: { ar: d.description_ar, en: d.description_en },
        impact: { co2: d.impact_co2, economy: d.impact_economy, happiness: d.impact_happiness },
        cost: d.cost
      }));
    } catch (e) {
      console.error("Error fetching policy decisions:", e);
      return [];
    }
  },

  getEgyptGuides: async () => {
    try {
      const { data, error } = await supabase
        .from('egypt_guides')
        .select('*');
      
      if (error) throw error;
      
      const guides: Record<string, { ar: string[], en: string[], lat?: number, lng?: number }> = {};
      data?.forEach(g => {
        guides[g.slug] = {
          ar: g.steps_ar || [],
          en: g.steps_en || [],
          lat: g.latitude,
          lng: g.longitude
        };
      });
      return guides;
    } catch (e) {
      console.error("Error fetching egypt guides:", e);
      return {};
    }
  },

  getCommodityCarbonFactors: async () => {
    try {
      const { data, error } = await supabase
        .from('commodity_carbon_factors')
        .select('*');
      
      if (error) throw error;
      
      const factors: Record<string, number> = {};
      data?.forEach(f => {
        factors[f.name] = f.factor;
      });
      return factors;
    } catch (e) {
      console.error("Error fetching carbon factors:", e);
      return {};
    }
  },

  getNationalMetrics: async () => {
    return getWithCache('national_metrics', async () => {
      try {
        const { count: usersCount } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true });

        const { data: sumData } = await supabase
          .from('consumption_records')
          .select('co2, co2_impact, sector');
        
        const totalImpact = sumData?.reduce((sum, r) => sum + (r.co2_impact || r.co2 || 0), 0) || 0;
        
        const nodeCount = usersCount || 0;

        const { data: governorateStats } = await supabase.from('users').select('governorate');
        const govCounts: Record<string, number> = {};
        governorateStats?.forEach(u => { if(u.governorate) govCounts[u.governorate] = (govCounts[u.governorate] || 0) + 1; });
        const topGov = Object.entries(govCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Cairo';

        let renewablePoints = 0;
        let totalEnergyPoints = 0;
        let wastePoints = 0;
        
        sumData?.forEach(r => {
           if (r.sector === 'solar_panel_install' || r.sector === 'renewable') renewablePoints++;
           if (r.sector === 'electricity' || r.sector === 'gas') totalEnergyPoints++;
           if (r.sector === 'waste' || r.sector === 'recycling') wastePoints++;
        });

        const renewablePercentage = totalEnergyPoints > 0 ? (renewablePoints / totalEnergyPoints) * 100 : 0;
        const wasteRecyclingRatio = sumData && sumData.length > 0 ? (wastePoints / sumData.length) * 100 : 0;

        return {
          data: {
            renewablePercentage: renewablePercentage, 
            wasteRecycling: wasteRecyclingRatio,
            totalCarbonSaved: Math.round(Math.abs(totalImpact)), 
            activeEcoNodes: nodeCount,
            nationalEcoScore: Math.min(95, (nodeCount * 0.1) + Math.abs(totalImpact) * 0.5),
            topGovernorate: topGov, 
            carbonIntensity: totalImpact !== 0 ? Math.abs(totalImpact / (nodeCount || 1)) : 0,
            nationalAvg: totalImpact !== 0 ? Math.abs(totalImpact / (nodeCount || 1)) : 0,
            target: 300,
            economicSavings: Math.round(Math.abs(totalImpact) * 2.5),
            energySavedMW: Math.abs(totalImpact) * 0.5,
            waterSavedM3: Math.abs(totalImpact) * 0.8,
            carbonReducedTons: Math.round(Math.abs(totalImpact) / 1000),
            targetProgress: Math.min(100, Math.abs(totalImpact) / 10), // Evaluated target formula
            lastUpdate: new Date().toISOString()
          },
          error: null
        };
      } catch (e) {
        console.error("National metrics error:", e);
        return { data: null, error: e };
      }
    }, 60000);
  },

  getTopServices: async (limit: number = 4) => {
    try {
      const { data, error } = await supabase
        .from('gov_services')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Error fetching top services:", e);
      return [];
    }
  },

  getEcoProposals: async (limit: number = 10, filter: string = 'all') => {
    try {
      let query = supabase.from('eco_proposals').select('*');
      if (filter !== 'all') query = query.eq('category', filter);
      
      const { data, error } = await query
        .order('votes_count', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Error fetching eco proposals:", e);
      return [];
    }
  },

  getEcoHeritageDestinations: async (category: string = 'all') => {
    try {
      let query = supabase.from('eco_destinations').select('*');
      if (category !== 'all') query = query.eq('category', category);
      
      const { data, error } = await query.order('name_en', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Error fetching eco destinations:", e);
      return [];
    }
  },

  createEcoProposal: async (proposal: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("Authentication required");
    
    const { data, error } = await supabase
      .from('eco_proposals')
      .insert([{ 
        ...proposal, 
        creator_id: user.id,
        current_funding: 0,
        votes_count: 0,
        status: 'pending'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  getCarbonPulse: async (userId?: string) => {
    if (!userId) return "424.50";
    try {
      const pulse = await storageService.getRecentCarbonPulse(userId);
      return pulse.total.toFixed(2);
    } catch (e) {
      console.error("Error in getCarbonPulse:", e);
      return "0.00";
    }
  },

  unlockCoupon: async (couponId: string, points: number) => {
    const user = storageService.getUser();
    if (!user) throw new Error("Please log in");
    if ((user.points || 0) < points) throw new Error("Insufficient points");

    const { error } = await supabase.from('users').update({ 
      points: (user.points || 0) - points 
    }).eq('id', user.id);
    
    if (error) throw error;
    
    // Log transaction
    await supabase.from('points_transactions').insert({
      user_id: user.id,
      amount: -points,
      description: `Coupon Unlocked (ID: ${couponId})`
    });

    // Update local user state
    storageService.saveUser({ ...user, points: (user.points || 0) - points });
  },

  getWalletData: async (userId: string) => {
    return await storageService.robustRequest('wallet_data', async () => {
      const [profileRes, txRes, billsRes] = await Promise.all([
        supabase.from('users').select('points, green_coins, full_name').eq('id', userId).single(),
        supabase.from('points_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
        supabase.from('gov_bills').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
      ]);

      if (profileRes.error) throw profileRes.error;

      return {
        profile: profileRes.data,
        transactions: txRes.data || [],
        bills: billsRes.data || []
      };
    });
  },

  getUtilityTiers: async () => {
    const { data, error } = await supabase.from('utility_tiers').select('*');
    if (error) throw error;
    return data;
  },

  getEmissionFactors: async () => {
    const { data, error } = await supabase.from('scientific_data').select('value').eq('key', 'emission_factors').single();
    if (error) throw error;
    return data ? data.value : null;
  },

  insertConsumptionRecord: async (record: {
    user_id: string;
    sector: string;
    value: number;
    unit: string;
    co2: number;
    co2_impact?: number;
    cost: number;
    description?: string;
    metadata?: any;
  }) => {
    // 1. Try to get current session safely
    let session = null;
    try {
      session = await getSafeSession();
    } catch (err) {
      console.warn("Could not get safe session:", err);
    }
    
    let data = null;
    
    // 2. If session exists, try to insert to remote database
    if (session?.user) {
      try {
        const { data: inserted, error } = await supabase.from('consumption_records').insert([{
          user_id: session.user.id,
          sector: record.sector,
          value: record.value,
          unit: record.unit,
          co2: record.co2 || record.co2_impact || 0,
          carbon_impact: record.co2 || record.co2_impact || 0,
          cost: record.cost,
          description: record.description,
          metadata: record.metadata
        }]).select().single();
        
        if (error) {
          console.error("Consumption Record Insert Error in Supabase:", error);
        } else {
          data = inserted;
        }
      } catch (dbErr) {
        console.error("Supabase insert exception:", dbErr);
      }
    } else {
      console.log("[Offline/Guest] Saving consumption record locally instead of Supabase.");
    }

    // 3. Always save to local fallback cache so that it is instantly accessible
    const localRecord = {
      id: data?.id || `local_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      user_id: session?.user?.id || 'guest',
      sector: record.sector,
      value: record.value,
      unit: record.unit,
      co2: record.co2 || record.co2_impact || 0,
      carbon_impact: record.co2 || record.co2_impact || 0,
      cost: record.cost,
      description: record.description,
      metadata: record.metadata,
      created_at: data?.created_at || new Date().toISOString()
    };
    
    try {
      const existing = JSON.parse(localStorage.getItem('moeco_local_consumption_records') || '[]');
      existing.unshift(localRecord);
      if (existing.length > 200) existing.pop(); // limit to latest 200 local files
      localStorage.setItem('moeco_local_consumption_records', JSON.stringify(existing));
    } catch (e) {
      console.error("Error writing record to offline cache:", e);
    }
    
    return data || localRecord;
  },

  insertCarbonLog: async (log: {
    user_id: string;
    transport_emissions?: number;
    electricity_emissions?: number;
    gas_emissions?: number;
    water_emissions?: number;
    food_emissions?: number;
    shopping_emissions?: number;
    total_emissions: number;
  }) => {
    const session = await getSafeSession();
    if (session?.user) {
      log.user_id = session.user.id;
    }

    // Only send allowed columns to avoid DB errors when types are dynamically passed
    const allowedColumns = [
      'user_id', 'transport_emissions', 'electricity_emissions', 
      'gas_emissions', 'water_emissions', 'food_emissions', 
      'shopping_emissions', 'total_emissions'
    ];
    
    const safeLog: any = {};
    for (const key of allowedColumns) {
      if (log[key as keyof typeof log] !== undefined) {
        safeLog[key] = log[key as keyof typeof log];
      }
    }

    const { data, error } = await supabase
      .from('carbon_footprint_logs')
      .insert([safeLog])
      .select()
      .single();
    if (error) {
      console.error("Carbon Log Insert Error:", error);
      throw error;
    }
    return data;
  },

  fetchUserHistory: async (userId: string, limit: number = 20) => {
    let records: any[] = [];
    
    // 1. Fetch from Supabase direct table if possible
    try {
      const { data, error } = await supabase
        .from('consumption_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (!error && data) {
        records = data;
      }
    } catch (err) {
      console.warn("Failed fetching from remote database, using local backup:", err);
    }
    
    // 2. Load from local cache list to merge offline or guest logs
    try {
      const localRecords = JSON.parse(localStorage.getItem('moeco_local_consumption_records') || '[]');
      if (records.length === 0) {
        records = localRecords;
      } else {
        const merged = [...records];
        localRecords.forEach((lr: any) => {
          // Check representation duplication
          const isDuplicated = merged.some((mr: any) => 
            mr.id === lr.id || (
              mr.sector === lr.sector && 
              Math.abs(mr.value - lr.value) < 0.01 && 
              Math.abs(mr.co2 - lr.co2) < 0.01
            )
          );
          if (!isDuplicated) {
            merged.push(lr);
          }
        });
        merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        records = merged.slice(0, limit);
      }
    } catch (err) {
      console.error("Error merging offline logs:", err);
    }
    
    return records;
  },

  saveCarbonLog: async (log: {
    user_id: string;
    transport_emissions?: number;
    electricity_emissions?: number;
    gas_emissions?: number;
    water_emissions?: number;
    food_emissions?: number;
    shopping_emissions?: number;
    total_emissions: number;
    [key: string]: any;
  }) => {
    // Only send allowed columns to avoid DB errors when types are dynamically passed
    const allowedColumns = [
      'user_id', 'transport_emissions', 'electricity_emissions', 
      'gas_emissions', 'water_emissions', 'food_emissions', 
      'shopping_emissions', 'total_emissions'
    ];
    
    const safeLog: any = {};
    for (const key of allowedColumns) {
      if (log[key] !== undefined) {
        safeLog[key] = log[key];
      }
    }

    const { data, error } = await supabase
      .from('carbon_footprint_logs')
      .insert([safeLog])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getCarbonLogs: async (limit: number = 20, userId?: string) => {
    const id = userId || localStorage.getItem('moeco_user_id');
    if (!id) return [];
    
    // Check both potential timestamp columns
    const { data: cols } = await supabase.rpc('get_table_columns', { table_name: 'consumption_records' });
    const orderCol = cols?.includes('recorded_at') ? 'recorded_at' : 'created_at';

    const { data, error } = await supabase
      .from('consumption_records')
      .select('*')
      .eq('user_id', id)
      .order(orderCol, { ascending: false })
      .limit(limit);
    if (error) {
       // Fallback to created_at if recorded_at doesn't exist
       const { data: fallbackData, error: fallbackError } = await supabase
        .from('consumption_records')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(limit);
       if (fallbackError) throw fallbackError;
       return fallbackData;
    }
    return data;
  },

  saveTransportEmission: async (log: {
    user_id: string;
    transport_type: string;
    distance_km: number;
    co2_emissions: number;
  }) => {
    const { data, error } = await supabase
      .from('consumption_records')
      .insert([{
        user_id: log.user_id,
        sector: 'transport',
        value: log.distance_km,
        unit: 'km',
        co2: log.co2_emissions,
        description: log.transport_type,
        metadata: { transport_type: log.transport_type }
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  saveWalkingSession: async (session: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    const payload = {
      user_id: user.id,
      sector: 'transport',
      value: session.distance_km || session.distanceKm,
      unit: 'km',
      co2: -(session.co2_saved_kg || session.co2Saved), // Negative impact means saved
      description: 'Walking session',
      metadata: { 
        activity: 'walking',
        start_time: session.start_time || session.startTime,
        end_time: session.end_time || session.endTime,
        green_tokens: session.green_tokens || session.tokensEarned
      }
    };

    const { data, error } = await supabase
      .from('consumption_records')
      .insert([payload])
      .select()
      .single();
    
    if (error) throw error;

    // Grant points for walking
    await storageService.awardPoints(user.id, session.tokensEarned || 5, 'Walking Achievement');

    return data;
  },

  getWalkingSessions: async () => {
    const userId = localStorage.getItem('moeco_user_id');
    if (!userId) return [];
    const { data, error } = await supabase
      .from('consumption_records')
      .select('*')
      .eq('user_id', userId)
      .eq('sector', 'transport')
      .contains('metadata', { activity: 'walking' })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  getNews: async (targetScreen: string = 'eco_news') => {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('target_screen', targetScreen)
      .order('published_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  getSmartPredictions: async (userId: string) => {
    try {
      const { data: usage, error } = await supabase
        .from('consumption_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error || !usage || usage.length === 0) {
        return {
          savingsPotential: 150,
          predictedCarbon: 120,
          status: 'low_data',
          trend: 'stable'
        };
      }

      const totalCarbon = usage.reduce((sum, r) => sum + (r.co2 || 0), 0);
      const avgCarbon = totalCarbon / usage.length;
      
      // Smart Prediction logic from user prompt fallback: avg * 1.1
      const predictedCarbon = Math.round(avgCarbon * 1.1 * 30); // 30 days monthly projection
      const savingsPotential = Math.round(predictedCarbon * 0.15 * 5); // 15% saving * cost factor

      return {
        savingsPotential,
        predictedCarbon,
        status: 'calculated',
        trend: usage.length > 5 && usage[0].co2 > usage[4].co2 ? 'increasing' : 'decreasing'
      };
    } catch (e) {
      console.error("Prediction error:", e);
      return null;
    }
  },

  speakAdvice: async (text: string, lang: string = 'ar') => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  },

  simulateIoT: async (userId: string) => {
    // Simulated MQTT/IoT data arrival
    const randomUsage = Math.random() * 5 + 1;
    const carbon = randomUsage * 0.5;
    await storageService.insertConsumptionRecord({
       user_id: userId,
       sector: 'electricity',
       value: parseFloat(randomUsage.toFixed(2)),
       unit: 'kWh',
       co2: parseFloat(carbon.toFixed(2)),
       cost: randomUsage * 2,
       description: 'IoT Live Stream (Simulated MQTT)'
    });
    return { value: randomUsage, carbon };
  },

  getGovServices: async () => {
    const { data, error } = await supabase
      .from('gov_services')
      .select('*')
      .eq('is_active', true);
    if (error) throw error;
    return data;
  },

  // --- News System Admin ---
  getRssFeeds: async () => {
    const { data, error } = await supabase
      .from('rss_sources')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  getNewsArticlesCount: async () => {
    const { count, error } = await supabase
      .from('news')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },

  getNewsArticlesByCategory: async () => {
    const { data, error } = await supabase
      .from('news')
      .select('category');
    if (error) throw error;
    
    const counts: Record<string, number> = {};
    data.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  },

  triggerNewsSync: async () => {
    // In a real app, this would call a server endpoint
    // For now, we'll just return success as the server handles this every 20 mins
    return { success: true, message: 'Sync triggered on server' };
  },

  deleteRssFeed: async (id: string) => {
    const { error } = await supabase
      .from('rss_feeds')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  updateRssFeed: async (id: string, updates: any) => {
    const { error } = await supabase
      .from('rss_feeds')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  compressImage: async (base64Str: string, maxWidth = 800, maxHeight = 600): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality
      };
    });
  },

  logError: async (error: any, context: string) => {
    const userId = localStorage.getItem('moeco_user_id');
    try {
      await supabase.from('error_logs').insert({
        user_id: userId,
        error_message: error instanceof Error ? error.message : String(error),
        context,
        stack_trace: error instanceof Error ? error.stack : null,
        metadata: { 
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        }
      });
    } catch (e) {
      console.error('Failed to log error to DB:', e);
    }
  },
  login: async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanEmail || !cleanPass) throw new Error('البريد الإلكتروني وكلمة المرور مطلوبة');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة. تأكد من تفعيل الحساب.');
      }
      throw new Error(error.message);
    }

    if (!data.user) throw new Error('فشل استرداد بيانات المستخدم');

    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('*, country:countries(name_en, name_ar), governorate:governorates(name_en, name_ar)')
      .eq('id', data.user.id)
      .maybeSingle();

    if (userError) {
      console.error("Profile fetch error:", userError);
    }

    if (!userData) {
      // Fallback: Create basic profile if it somehow doesn't exist
      const { data: newUserData, error: newUserError } = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || email.split('@')[0],
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
          points: 0,
          green_coins: 0,
          level: 1,
          experience_points: 0,
          created_at: new Date().toISOString(),
          role: 'User'
        }, { onConflict: 'id' })
        .select()
        .single();
        
      if (!newUserError && newUserData) {
        userData = newUserData;
      } else {
        console.error("Critical: Could not auto-create profile during login", newUserError);
      }
    }

    const language = localStorage.getItem('i18nextLng') || 'ar';
    const isRtl = language.startsWith('ar');

    const userSession = {
      ...userData,
      id: data.user.id,
      email: data.user.email,
      name: userData?.full_name || data.user.user_metadata?.full_name || 'User',
      avatar: userData?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
      points: userData?.points || 0,
      greenCoins: userData?.green_coins || userData?.greenCoins || 0,
      governorate: isRtl ? userData?.governorate?.name_ar : userData?.governorate?.name_en,
      country: isRtl ? userData?.country?.name_ar : userData?.country?.name_en
    };

    currentUserCache = userSession;
    localStorage.setItem('moeco_user_id', data.user.id);
    return userSession;
  },

  signup: async (userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email.trim(),
      password: userData.password.trim(),
      options: {
        data: {
          full_name: userData.name,
          phone: userData.phone,
          country_id: userData.country_id,
          governorate_id: userData.governorate_id,
          social_bracket: userData.social_bracket,
        }
      }
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        const err: any = new Error('User already registered');
        err.code = 'USER_ALREADY_EXISTS';
        throw err;
      }
      throw error;
    }

    // Explicitly create user profile
    let upsertedUser = null;
    if (data.user) {
        const { data: upsertData, error: profileError } = await supabase.from('users').upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: userData.name,
            phone: userData.phone,
            country_id: userData.country_id,
            governorate_id: userData.governorate_id,
            social_bracket: userData.social_bracket,
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + data.user.id,
            role: 'User',
            points: 0,
            green_coins: 0,
            experience_points: 0,
            level: 1,
            is_verified: false,
            created_at: new Date().toISOString()
        }, { onConflict: 'id' }).select().single();
        
        if (profileError) {
          console.error("Profile creation error:", profileError);
        } else {
          upsertedUser = upsertData;
        }
    }
    
    // Create session object
    const userSession = {
      ...upsertedUser,
      id: data.user.id,
      email: data.user.email,
      name: upsertedUser?.full_name || userData.name || 'User',
      avatar: upsertedUser?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + data.user.id,
      points: upsertedUser?.points || 0,
      greenCoins: upsertedUser?.green_coins || upsertedUser?.greenCoins || 0
    };
    
    currentUserCache = userSession;
    localStorage.setItem('moeco_user_id', data.user.id);
    
    return data;
  },


  logout: async () => {
    await supabase.auth.signOut();
    currentUserCache = null;
  },

  setCurrentUser: (user: any) => {
    currentUserCache = user;
    if (user) {
      localStorage.setItem('moeco_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('moeco_user');
    }
  },

  // --- Smart Prediction & Analytics ---
  getMonthlyEcoReport: async (userId: string) => {
    const agg: any = await storageService.getAggregatedCarbon(userId);
    const bills: any[] = await storageService.getBills();
    const paidBills = bills.filter(b => b.status === 'paid');
    
    return {
      month: new Date().toLocaleString('default', { month: 'long' }),
      totalSpent: paidBills.reduce((acc, b) => acc + (b.amount || 0), 0),
      carbonSaved: Math.round(agg.totalSaved || 0),
      treesEquivalent: Math.floor((agg.totalSaved || 0) / 20),
      topSector: agg.breakdown?.sort((a: any, b: any) => b.value - a.value)[0]?.name || 'Energy'
    };
  },

  // --- Logic Based Tips Engine ---
  getSmartTips: (stats: any, lang: string) => {
    const isRtl = lang === 'ar';
    const tips = [];

    if (stats.predictedBill > 600) {
      tips.push({
        id: 'bill_high',
        title: isRtl ? 'فاتورتك المتوقعة مرتفعة' : 'Predicted bill is high',
        desc: isRtl ? 'حاول تقليل استخدام الأجهزة الكهربائية في وقت الذروة.' : 'Try reducing appliance use during peak hours.',
        priority: 'high',
        icon: 'Zap'
      });
    }

    if (stats.predictedCarbon > 200) {
      tips.push({
        id: 'carbon_high',
        title: isRtl ? 'بصمتك الكربونية مرتفعة' : 'High Carbon Footprint',
        desc: isRtl ? 'فكر في استخدام المواصلات العامة أو المشي للمسافات القريبة.' : 'Consider public transport or walking for short trips.',
        priority: 'medium',
        icon: 'Leaf'
      });
    }

    // Default general tip
    tips.push({
      id: 'meter_tip',
      title: isRtl ? 'سجل قراءاتك بانتظام' : 'Log Readings Regularly',
      desc: isRtl ? 'تسجيل القراءة يمنع الفواتير التقديرية الخاطئة.' : 'Logging readings prevents incorrect estimated bills.',
      priority: 'low',
      icon: 'Activity'
    });

    return tips.sort((a, b) => {
      const p: any = { high: 3, medium: 2, low: 1 };
      return p[b.priority] - p[a.priority];
    });
  },

  getUser: () => {
    if (currentUserCache) return currentUserCache;
    const stored = localStorage.getItem('moeco_user');
    if (stored) {
      try {
        currentUserCache = JSON.parse(stored);
        return currentUserCache;
      } catch (e) {}
    }
    // Default guest user so anyone can enter and use the app immediately without an account
    currentUserCache = {
      id: 'guest-user-2026',
      email: 'guest@moeco.gov.eg',
      name: 'مستخدم زائر',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
      points: 150,
      level: 1,
      role: 'user',
      governorate: 'Cairo'
    };
    localStorage.setItem('moeco_user', JSON.stringify(currentUserCache));
    return currentUserCache;
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return true;
  },

  // --- Smart Gamification & Sync ---
  checkBadges: async (userId: string) => {
    try {
      const agg: any = await storageService.getAggregatedCarbon(userId);
      const bills: any[] = await storageService.getBills();
      
      const toAward = [];
      if (agg.totalSaved > 500) toAward.push('Eco Warrior');
      if (agg.totalSaved > 100) toAward.push('Earth Friend');
      if (bills.filter(b => b.status === 'paid').length >= 3) toAward.push('Bill Master');

      for (const b of toAward) {
        const { data: existing } = await supabase.from('user_badges').select('*').eq('user_id', userId).eq('badge_type', b).single();
        if (!existing) {
          await supabase.from('user_badges').insert({ user_id: userId, badge_type: b, awarded_at: new Date().toISOString() });
          notificationService.success(`🎉 ${b} Badge Awarded!`);
        }
      }
    } catch (e) { console.error("Badge check error", e); }
  },

  syncOfflineData: async () => {
    if (!navigator.onLine) return;
    const pending = JSON.parse(localStorage.getItem('moeco_pending_sync') || '[]');
    if (pending.length === 0) return;

    notificationService.info("Syncing offline data...");
    for (const action of pending) {
      try {
        await supabase.from(action.table).insert(action.data);
      } catch (e) { console.error("Sync error", e); }
    }
    localStorage.removeItem('moeco_pending_sync');
    notificationService.success("Sync completed");
  },

  // --- Backend Flexibility & Generic Request ---
  apiFetch: async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = localStorage.getItem('moeco_api_url') || API_URL;
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    });
    if (!response.ok) throw new Error(`API Request failed: ${response.statusText}`);
    return response.json();
  },

  // --- Digital Neighbor ---
  getNeighborhoodHelpRequests: async (filters?: { type?: string, governorateId?: string }) => {
    let query = supabase
      .from('neighborhood_requests')
      .select(`
        *,
        users:user_id(full_name, avatar_url)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type === 'requests' ? 'Request' : 'Offer');
    }

    const { data, error } = await query;
    if (error) return [];

    return (data || []).map(r => ({
      ...r,
      user_name: r.users?.full_name || 'Anonymous',
      user_avatar: r.users?.avatar_url
    }));
  },

  createNeighborhoodRequest: async (request: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");
    const { data, error } = await supabase
      .from('neighborhood_requests')
      .insert([{ ...request, user_id: user.id }])
      .select();
    if (error) throw error;
    return data[0];
  },

  helpNeighbor: async (requestId: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");
    
    // 1. Mark request as in_progress
    const { data: request, error: fetchError } = await supabase
      .from('neighborhood_requests')
      .select('*')
      .eq('id', requestId)
      .single();
      
    if (fetchError || !request) throw new Error("Request not found");
    if (request.user_id === user.id) throw new Error("You cannot help yourself");

    const { error: updateError } = await supabase
      .from('neighborhood_requests')
      .update({ status: 'completed', helper_id: user.id })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // 2. Award points/coins logic
    const reward = request.reward || 50;
    await storageService.awardPoints(user.id, reward, `Neighborhood Help: ${request.title_en}`, 'neighbor');
    
    // Log for statistics
    await supabase.from('rewards_logs').insert({
      user_id: user.id,
      points: reward,
      reason: `Help: ${request.title_en}`,
      source: 'neighborhood'
    });
    
    // 3. Update helper balance (transfer reward if it was a budget gam'eya or similar)
    const { data: helperData } = await supabase.from('users').select('green_coins').eq('id', user.id).single();
    await supabase.from('users').update({ 
      green_coins: (helperData?.green_coins || 0) + reward 
    }).eq('id', user.id);

    return true;
  },

  getNeighborhoodRequests: async () => {
    const { data, error } = await supabase.from('neighborhood_requests').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },

  getStreetProjects: async () => {
    const { data, error } = await supabase
      .from('street_projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },

  joinStreetProject: async (projectId: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");
    
    // Check if table exists, if not fallback to points
    try {
      const { error } = await supabase
        .from('street_project_members')
        .insert([{ project_id: projectId, user_id: user.id }]);
      
      if (error && !error.message.includes('unique_violation')) throw error;
    } catch (e) {
      console.warn("Project join failed, might be missing table", e);
    }
    
    await storageService.awardPoints(user.id, 20, 'Joined Green Street Initiative');
    return true;
  },

  getGameyas: async () => {
    const { data, error } = await supabase
      .from('gameyas')
      .select('*, users:creator_id(full_name)')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },

  joinGameya: async (gameyaId: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");
    
    const { error } = await supabase
      .from('gameya_members')
      .insert([{ gameya_id: gameyaId, user_id: user.id }]);
      
    if (error && !error.message.includes('unique_violation')) throw error;
    
    await storageService.awardPoints(user.id, 30, 'Joined Digital Gam\'eya');
    return true;
  },

  createStreetProject: async (project: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");
    const { data, error } = await supabase
      .from('street_projects')
      .insert([{ ...project, creator_id: user.id }])
      .select();
    if (error) throw error;
    return data[0];
  },

  getLocalBusinesses: async (governorate?: string) => {
    let query = supabase.from('local_businesses').select('*');
    if (governorate) query = query.eq('governorate', governorate);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // --- Wallet Mutations ---
  depositCoins: async (userId: string, amount: number) => {
    const { data: user } = await supabase.from('users').select('green_coins').eq('id', userId).single();
    const { error } = await supabase.from('users').update({
       green_coins: (user?.green_coins || 0) + amount
    }).eq('id', userId);
    if (error) throw error;
    return (user?.green_coins || 0) + amount;
  },

  redeemPointsToCoins: async (userId: string, points: number) => {
    const { data: user } = await supabase.from('users').select('points, green_coins').eq('id', userId).single();
    if (!user || user.points < points) throw new Error("Insufficient points");
    
    const coinsReward = Math.floor(points / 2); // 2:1 ratio
    const { error } = await supabase.from('users').update({
       points: user.points - points,
       green_coins: user.green_coins + coinsReward
    }).eq('id', userId);
    
    if (error) throw error;
    
    await supabase.from('points_transactions').insert({
       user_id: userId,
       points: -points,
       reason: 'Converted to Green Coins',
       metadata: { coins_reward: coinsReward }
    });

    return { points: user.points - points, coins: user.green_coins + coinsReward };
  },

  // --- Green Investment ---
  getInvestmentProjects: async () => {
    const { data, error } = await supabase
      .from('investment_projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },

  // --- Eco Food ---
  getFoodItems: async (category?: string) => {
    let query = supabase.from('eco_food_items').select('*');
    if (category && category !== 'all') query = query.eq('category', category);
    const { data, error } = await query;
    if (error) return [];
    return data;
  },

  logFoodConsumption: async (food: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");
    
    const co2Impact = food.carbon_score ? (10 - food.carbon_score) * 0.5 : 1.0; // Simple formula
    
    return await storageService.saveRecord({
      sector: 'food',
      value: 1,
      unit: 'meal',
      co2: co2Impact,
      cost: 0,
      details: { food_id: food.id, food_name: food.name_en }
    });
  },


  getWalkingStats: async () => {
    const user = storageService.getUser();
    if (!user) return { totalDistance: 0, totalCO2: 0, totalTokens: 0, sessionCount: 0 };
    
    const { data, error } = await supabase
      .from('walking_sessions')
      .select('distance_km, co2_saved_kg, green_tokens_earned')
      .eq('user_id', user.id);
      
    if (error || !data) return { totalDistance: 0, totalCO2: 0, totalTokens: 0, sessionCount: 0 };
    
    return {
      totalDistance: data.reduce((sum, s) => sum + (Number(s.distance_km) || 0), 0),
      totalCO2: data.reduce((sum, s) => sum + (Number(s.co2_saved_kg) || 0), 0),
      totalTokens: data.reduce((sum, s) => sum + (Number(s.green_tokens_earned) || 0), 0),
      sessionCount: data.length
    };
  },

  getInvestmentStats: async () => {
    try {
      const { data, error } = await supabase
        .from('user_investments')
        .select('amount');
      
      if (error) throw error;

      const totalInvested = data.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const totalCO2Offset = totalInvested * 0.12; // Simulated CO2 offset based on investment
      
      const userIds = data ? [...new Set(data.map(i => i.user_id))] : [];
      
      // Also get all unique projects
      const { data: projectsData } = await supabase.from('green_projects').select('id');
      const projectCount = projectsData ? projectsData.length : 0;

      return {
        totalInvested,
        totalCO2Offset: Math.round(totalCO2Offset),
        projectCount,
        investorsCount: userIds.length
      };
    } catch (error) {
      console.error('Error fetching investment stats:', error);
      return { totalInvested: 0, totalCO2Offset: 0, projectCount: 0 };
    }
  },

  // --- Family Hub Methods (New) ---
  getFamily: async (userId: string) => {
    try {
      const { data: memberData, error: memError } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (memError || !memberData) return null;

      const { data: family, error: famError } = await supabase
        .from('families')
        .select('*')
        .eq('id', memberData.family_id)
        .single();
      
      if (famError) throw famError;
      return family;
    } catch (e) {
      console.error("Error fetching family:", e);
      return null;
    }
  },

  createFamily: async (name: string, adminId: string) => {
    const { data: family, error: famError } = await supabase
      .from('families')
      .insert({ name, admin_id: adminId })
      .select()
      .single();
    
    if (famError) throw famError;

    const { error: memError } = await supabase
      .from('family_members')
      .insert({ family_id: family.id, user_id: adminId, role: 'admin' });
    
    if (memError) throw memError;

    // Update user record
    await supabase.from('users').update({ family_id: family.id }).eq('id', adminId);

    return family;
  },

  joinFamily: async (familyId: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("Unauthenticated");

    const { data: family } = await supabase.from('families').select('id').eq('id', familyId).maybeSingle();
    if (!family) throw new Error("Family not found");

    const { error: memError } = await supabase
      .from('family_members')
      .upsert({ family_id: familyId, user_id: user.id, role: 'member' }, { onConflict: 'family_id,user_id' });
    
    if (memError) throw memError;

    await supabase.from('users').update({ family_id: familyId }).eq('id', user.id);
    
    const updatedUser = { ...user, family_id: familyId, familyId: familyId };
    storageService.saveUser(updatedUser);
    return updatedUser;
  },

  leaveFamily: async () => {
    const user = storageService.getUser();
    if (!user) throw new Error("Unauthenticated");

    const familyId = user.family_id || user.familyId;
    if (!familyId) return user;

    await supabase.from('family_members').delete().match({ family_id: familyId, user_id: user.id });
    await supabase.from('users').update({ family_id: null }).eq('id', user.id);

    const updatedUser = { ...user, family_id: null, familyId: null };
    storageService.saveUser(updatedUser);
    return updatedUser;
  },

  getFamilyMembers: async (familyId: string) => {
    const { data, error } = await supabase
      .from('family_members')
      .select('*, user:user_id(id, full_name, avatar_url, points, level, email)')
      .eq('family_id', familyId);
    
    if (error) throw error;
    return data || [];
  },

  getFamilyGoals: async (familyId: string) => {
    const { data, error } = await supabase
      .from('family_goals')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });
    return data || [];
  },

  getFamilyLeaderboard: async (governorate?: string) => {
    let query = supabase
      .from('families')
      .select('*, members:family_members(count)')
      .limit(10);
    
    // In a real app, you'd join with points from members
    const { data, error } = await query;
    if (error) return [];
    return data.map(f => ({
      ...f,
      totalPoints: Math.floor(Math.random() * 5000), // Placeholder for aggregation logic
      memberCount: (f as any).members?.[0]?.count || 0
    })).sort((a, b) => b.totalPoints - a.totalPoints);
  },

  // --- Green Community Extensions ---
  getUserReactions: async (postId: string) => {
    const { data } = await supabase.from('user_reactions').select('*').eq('post_id', postId);
    return data || [];
  },

  // --- Places Pulse (New) ---
  getPollutionReports: async () => {
    const { data, error } = await supabase
      .from('pollution_reports')
      .select('*, user:user_id(full_name, avatar_url)')
      .order('created_at', { ascending: false });
    return data || [];
  },

  createPollutionReport: async (reportData: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("Auth required");
    const { data, error } = await supabase
      .from('pollution_reports')
      .insert({ ...reportData, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getPlaceReviews: async (placeId: string) => {
    const { data, error } = await supabase
      .from('place_reviews')
      .select('*, user:user_id(full_name, avatar_url)')
      .eq('place_id', placeId);
    return data || [];
  },

  getGovernorateWarStats: async (gov: string) => {
    // Aggregating points by governorate
    const { data, error } = await supabase
      .from('users')
      .select('governorate, points')
      .not('governorate', 'is', null);
    
    if (error || !data) return [];

    const stats: Record<string, any> = {};
    data.forEach(u => {
      if (!stats[u.governorate]) {
        stats[u.governorate] = { governorate: u.governorate, total_points: 0, active_citizens: 0 };
      }
      stats[u.governorate].total_points += u.points || 0;
      stats[u.governorate].active_citizens += 1;
    });

    const all = Object.values(stats).sort((a, b) => b.total_points - a.total_points);
    const userGov = stats[gov] || { governorate: gov, total_points: 0, active_citizens: 0, rank: all.length + 1 };
    
    if (stats[gov]) {
      userGov.rank = all.findIndex(a => a.governorate === gov) + 1;
    }

    return { all, userGov };
  },

  getCountries: async () => {
    const { data, error } = await supabase
      .from('countries')
      .select('*');
    if (error) return [];
    return data;
  },

  getGovernorates: async (countryId: string) => {
    const { data, error } = await supabase
      .from('governorates')
      .select('*')
      .eq('country_id', countryId);
    if (error) return [];
    return data;
  },

  getCities: async (governorateId: string) => {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('governorate_id', governorateId);
    if (error) return [];
    return data;
  },

  ensureCountry: async (nameAr: string, nameEn: string): Promise<string> => {
    const { data, error } = await supabase
      .from('countries')
      .select('id')
      .eq('name_en', nameEn)
      .maybeSingle();
    
    if (data) return data.id;

    const { data: newData, error: insertError } = await supabase
      .from('countries')
      .insert({ name_ar: nameAr, name_en: nameEn })
      .select('id')
      .single();
    
    if (insertError) throw insertError;
    return newData.id;
  },

  ensureGovernorate: async (countryId: string, nameAr: string, nameEn: string): Promise<string> => {
    // Safety: ensure countryId is a valid UUID
    const isValidUUID = (id: any) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (!isValidUUID(countryId)) {
      // Fallback: Get the first country or Egypt
      const { data: egypt } = await supabase.from('countries').select('id').eq('name_en', 'Egypt').maybeSingle();
      if (egypt) countryId = egypt.id;
      else {
        const { data: first } = await supabase.from('countries').select('id').limit(1).maybeSingle();
        if (first) countryId = first.id;
        else throw new Error("No countries available to assign governorate to.");
      }
    }

    const { data, error } = await supabase
      .from('governorates')
      .select('id')
      .eq('country_id', countryId)
      .eq('name_en', nameEn)
      .maybeSingle();
    
    if (data) return data.id;

    const { data: newData, error: insertError } = await supabase
      .from('governorates')
      .insert({ country_id: countryId, name_ar: nameAr, name_en: nameEn })
      .select('id')
      .single();
    
    if (insertError) throw insertError;
    return newData.id;
  },

  ensureCity: async (governorateId: string, nameAr: string, nameEn: string): Promise<string> => {
    const { data, error } = await supabase
      .from('cities')
      .select('id')
      .eq('governorate_id', governorateId)
      .eq('name_en', nameEn)
      .maybeSingle();
    
    if (data) return data.id;

    const { data: newData, error: insertError } = await supabase
      .from('cities')
      .insert({ governorate_id: governorateId, name_ar: nameAr, name_en: nameEn })
      .select('id')
      .single();
    
    if (insertError) throw insertError;
    return newData.id;
  },


  getSectors: async () => {
    const { data, error } = await supabase
      .from('sectors')
      .select('*');
    if (error) return [];

    return data;
  },

  saveUser: async (user: User) => {
    currentUserCache = user;
    localStorage.setItem('moeco_user', JSON.stringify(user));
    localStorage.setItem(`moeco_up_${user.id}`, JSON.stringify(user));
    
    // Sync with Supabase
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: user.name,
          avatar_url: user.avatar,
          governorate: user.governorate || (user as any).governorate_name,
          points: user.points,
          green_coins: user.greenCoins,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) console.error("Error syncing profile to Supabase:", error);
    } catch (e) {
      console.error("Failed to sync user to Supabase:", e);
    }
  },

  syncUserToSupabase: async (user: any) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.name || 'Eco User',
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url || user.avatar,
          points: 0,
          green_coins: 0,
          level: 1,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Critical Profile Sync Error:", e);
      return null;
    }
  },

  // Removed duplicate getUser

  // --- User Profiles (Digital ID & Account) ---
  getUserBadges: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Error fetching user badges:", e);
      return [];
    }
  },

  getUserProfile: async (userId: string) => {
    // 1. Return from Local Cache immediately if available
    const cacheKey = `moeco_up_${userId}`;
    const cached = localStorage.getItem(cacheKey);
    let cachedData = null;
    if (cached) {
      try {
        cachedData = JSON.parse(cached);
      } catch (e) {}
    }

    // 2. Fetch from Supabase with a short timeout
    try {
      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 4000)
      );

      const { data: user, error } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;

      if (error) throw error;
      
      if (user) {
        localStorage.setItem(cacheKey, JSON.stringify(user));
        return user;
      }
      return cachedData;
    } catch (err) {
      console.warn("getUserProfile used cache due to error/timeout:", err);
      return cachedData;
    }
  },

  getUserRank: async (userId: string) => {
    try {
      const { data: user } = await supabase.from('users').select('points').eq('id', userId).single();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gt('points', user.points || 0);
      
      if (error) throw error;
      return (count || 0) + 1;
    } catch (error) {
      console.error("Error getting rank:", error);
      return 0;
    }
  },

  updateUserProfile: async (userId: string, updates: Partial<User>) => {
    const { error } = await supabase.from('users').upsert({ id: userId, ...updates });
    if (error) throw error;
  },

  // --- Green Community (Synced 2026) ---
  getCommunityPosts: async () => {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        users:user_id(full_name, avatar_url, level)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  createCommunityPost: async (postData: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("Auth required");
    
    const payload = {
       user_id: user.id,
       ...postData
    };

    const { data, error } = await supabase
      .from('community_posts')
      .insert([payload])
      .select('*, users:user_id(full_name, avatar_url, level)')
      .single();
    
    if (error) throw error;
    return data;
  },

  getCommunityComments: async (postId: string) => {
    const { data, error } = await supabase
      .from('community_comments')
      .select('*, users:user_id(full_name, avatar_url, level)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  submitCommunityComment: async (postId: string, content: string) => {
    const user = storageService.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('community_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content
      })
      .select('*, users:user_id(full_name, avatar_url, level)')
      .single();
    
    if (error) throw error;
    
    // Increment comment count atomically
    await supabase.rpc('increment_post_comments', { post_id_param: postId });
    
    return data;
  },

  togglePostLike: async (postId: string, isCurrentlyLiked: boolean) => {
    const user = storageService.getUser();
    if (!user) return null;

    if (isCurrentlyLiked) {
      // Remove like
      const { error: delError } = await supabase.from('community_likes').delete().match({ post_id: postId, user_id: user.id });
      if (delError) throw delError;
      await supabase.rpc('decrement_post_likes', { post_id_param: postId });
    } else {
      // Add like
      const { error: insError } = await supabase.from('community_likes').insert({ post_id: postId, user_id: user.id });
      if (insError) throw insError;
      await supabase.rpc('increment_post_likes', { post_id_param: postId });
    }
    return true;
  },

  redeemCoupon: async (couponId: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("Auth required");
    const { error } = await supabase.from('user_coupons').insert([{ user_id: user.id, coupon_id: couponId }]);
    if (error) throw error;
  },

  // --- Legacy & General Data ---
  getRecords: async (): Promise<EmissionRecord[]> => {
    try {
      const session = await getSafeSession();
      if (!session?.user) return [];

      // Fetch from consumption_records (The primary source of truth)
      const { data: consumptionData, error: consumptionError } = await safeRequest(() => supabase
        .from('consumption_records')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false }));

      if (consumptionError) {
        console.error("Supabase fetch error:", consumptionError);
        return storageService.cachedRecords;
      }

      const allRecords: EmissionRecord[] = (consumptionData || []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        date: r.record_date || r.created_at,
        type: r.description || r.sector,
        sector: r.sector,
        value: r.value,
        co2: r.carbon_impact || r.co2 || r.co2_impact || (r.metadata?.co2_impact) || 0,
        consumption: r.value,
        unit: r.unit || 'units',
        cost: r.cost || r.metadata?.bill_amount || 0,
        currency: 'EGP',
        timestamp: r.record_date || r.created_at || new Date().toISOString(),
        details: r.metadata || {},
      }));

      // Sort by timestamp descending
      allRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      storageService.cachedRecords = allRecords;
      return allRecords;
    } catch (err) {
      console.error("getRecords catch error:", err);
      return storageService.cachedRecords;
    }
  },

  getRecordsSync: (): EmissionRecord[] => {
    return storageService.cachedRecords;
  },

  getMonthlyData: async (month: number, year: number) => {
    const user = storageService.getUser();
    if (!user) return null;

    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${(month + 1).toString().padStart(2, '0')}-01`;

    const { data, error } = await supabase
      .from('consumption_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .lt('created_at', endDate);
    
    if (error) {
      // Fallback to consumption_records
      const { data: data2, error: error2 } = await supabase
        .from('consumption_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lt('created_at', endDate);
      if (error2) return null;
      return data2;
    }
    return data;
  },

  getYearlyData: async (year: number) => {
    const user = storageService.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('consumption_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('record_date', `${year}-01-01`)
      .lt('record_date', `${year + 1}-01-01`);
    if (error) return null;
    return data;
  },

  getFutureForecasts: async () => {
    // Simple forecast based on historical average
    const records = await storageService.getRecords();
    if (records.length === 0) return [];
    
    const avg = records.reduce((acc, r) => acc + Number(r.co2 || 0), 0) / records.length;
    return [
      { month: 'Next Month', impact: avg * 0.95 },
      { month: 'In 2 Months', impact: avg * 0.90 },
      { month: 'In 3 Months', impact: avg * 0.85 }
    ];
  },

  getCityReport: async (cityId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('city_id', cityId);
    
    if (error) return null;
    const userIds = data.map(u => u.id);
    
    const { data: records, error: recordsError } = await supabase
      .from('consumption_records')
      .select('*')
      .in('user_id', userIds);
    
    if (recordsError) return null;
    return records;
  },

  getCityIndicators: async (cityId: string) => {
    // Return some basic indicators based on city data
    const records = await storageService.getCityReport(cityId);
    if (!records) return null;
    return {
      totalImpact: records.reduce((acc, r) => acc + Number(r.co2_impact || 0), 0),
      userCount: new Set(records.map(r => r.user_id)).size
    };
  },

  getDailyMissions: async (lang: 'ar' | 'en' = 'ar') => {
    try {
      const { data: dbMissions, error: missionsError } = await supabase
        .from('missions')
        .select('*');

      if (missionsError) throw missionsError;

      const all = dbMissions || [];
      if (all.length === 0) return [];

      // Rotate missions daily based on date and user seed for personalization
      const todayDate = new Date();
      const user = storageService.getUser();
      const dateSeed = todayDate.getFullYear() * 10000 + (todayDate.getMonth() + 1) * 100 + todayDate.getDate();
      const userSeed = user?.id ? user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
      const seed = dateSeed + userSeed;
      
      const shuffle = (array: any[], s: number) => {
        let m = array.length, t, i;
        while (m) {
          i = Math.floor(Math.abs(Math.sin(s++) * m--));
          t = array[m];
          array[m] = array[i];
          array[i] = t;
        }
        return array;
      };

      const shuffled = shuffle([...all], seed);
      const selectedMissions = shuffled.slice(0, 6); // Display 6 missions per day for more variety

      const todayStr = todayDate.toISOString().split('T')[0];

      const { data: completedMissions } = await supabase
        .from('user_missions')
        .select('mission_id')
        .eq('user_id', user?.id)
        .gte('completed_at', `${todayStr}T00:00:00Z`)
        .lte('completed_at', `${todayStr}T23:59:59Z`);

      const completedIds = completedMissions?.map(m => m.mission_id) || [];
      
      return selectedMissions.map(m => ({
        id: m.id,
        title: lang === 'ar' ? m.title_ar : m.title_en,
        description: lang === 'ar' ? (m.description_ar || m.description) : (m.description_en || m.description),
        points: m.points_reward || 0,
        coins: m.coins_reward || 0,
        category: m.category,
        completed: completedIds.includes(m.id),
        latitude: m.latitude,
        longitude: m.longitude
      }));
    } catch (e) {
      console.error("Error fetching dynamic missions:", e);
      return [];
    }
  },

  completeMission: async (missionId: string, proofUrl?: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    const { error } = await supabase
      .from('user_missions')
      .insert({
        user_id: user.id,
        mission_id: missionId,
        proof_url: proofUrl,
        completed_at: new Date().toISOString().split('T')[0]
      });

    if (error) throw error;

    // Award points
    const missions = await storageService.getDailyMissions();
    const mission = missions.find(m => m.id === missionId);
    if (mission) {
      await storageService.awardPoints(user.id, mission.points, `Completed Mission: ${mission.title}`);
    }
  },

  getHistoricalComparison: async (period: 'weekly' | 'monthly' | 'yearly') => {
    const user = storageService.getUser();
    if (!user) return null;

    // Fetch user data for the period
    // Fetch group/national average for the same period
    // This is a simplified version
    const records = await storageService.getRecords();
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'weekly') startDate.setDate(now.getDate() - 7);
    else if (period === 'monthly') startDate.setMonth(now.getMonth() - 1);
    else startDate.setFullYear(now.getFullYear() - 1);

    const userTotal = records
      .filter(r => new Date(r.timestamp || r.date) >= startDate)
      .reduce((sum, r) => sum + (r.co2 || (r as any).co2_impact || 0), 0);

    // Fetch aggregate of ALL users for the same period
    try {
      const { data: allData, error } = await supabase
        .from('consumption_records')
        .select('co2')
        .gte('created_at', startDate.toISOString());
      
      let groupAvg = 0; 
      if (!error && allData && allData.length > 0) {
        const total = allData.reduce((sum, r) => sum + (r.co2 || 0), 0);
        
        // Get user count to find average
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        groupAvg = total / (userCount || 1);
      } 

      return {
        userTotal: parseFloat(userTotal.toFixed(2)),
        groupAvg: parseFloat(groupAvg.toFixed(2)),
        diff: parseFloat((((userTotal - groupAvg) / groupAvg) * 100).toFixed(1))
      };
    } catch (e) {
      return {
        userTotal: parseFloat(userTotal.toFixed(2)),
        groupAvg: 42.8,
        diff: 0
      };
    }
  },

  // --- Utility Meters & Readings ---
  getMeters: async () => {
    const user = storageService.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('utility_meters')
      .select('*')
      .eq('user_id', user.id);
    if (error) return [];
    return data;
  },

  saveMeter: async (meter: { type: string, meter_number: string, initial_reading: number, is_estimated?: boolean, estimation_method?: string }) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    // Check for duplicates
    if (meter.meter_number) {
      const { data: existing } = await supabase
        .from('utility_meters')
        .select('id')
        .eq('user_id', user.id)
        .eq('meter_number', meter.meter_number)
        .maybeSingle();
      
      if (existing) {
        throw new Error("Meter with this number already exists");
      }
    }

    const { data, error } = await supabase
      .from('utility_meters')
      .insert([{ ...meter, user_id: user.id }])
      .select();
    if (error) throw error;
    return data[0];
  },

  getReadings: async (meterId?: string) => {
    const user = storageService.getUser();
    if (!user) return [];
    let query = supabase.from('utility_readings').select('*').eq('user_id', user.id);
    if (meterId) query = query.eq('meter_id', meterId);
    const { data, error } = await query.order('reading_date', { ascending: false });
    if (error) return [];
    return data;
  },

  saveReading: async (reading: { meter_id: string, reading_value: number, consumption: number, cost: number, co2_impact: number, photo_url?: string, is_estimated?: boolean }) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    const today = new Date().toISOString().split('T')[0];

    // Check for duplicate reading on the same day for the same meter
    const { data: existing } = await supabase
      .from('utility_readings')
      .select('id')
      .eq('meter_id', reading.meter_id)
      .eq('reading_date', today)
      .maybeSingle();

    if (existing) {
      // Update instead of insert if it exists? Or just block?
      // Let's block to prevent accidental double-logging
      throw new Error("A reading for this meter has already been recorded today");
    }

    const { data, error } = await supabase
      .from('utility_readings')
      .insert([{ ...reading, user_id: user.id, reading_date: today }])
      .select();
    
    if (error) throw error;

    // Also save as a general consumption record for dashboard
    const meter = (await storageService.getMeters()).find(m => m.id === reading.meter_id);
    if (meter) {
      await storageService.saveRecord({
        sector: meter.type,
        value: reading.consumption,
        unit: meter.type === 'electricity' ? 'kWh' : 'm3',
        co2: reading.co2_impact,
        cost: reading.cost,
        details: { meter_id: reading.meter_id, reading_value: reading.reading_value }
      });
    }

    // Log Audit
    await storageService.logAudit('Meter Reading Added', reading.meter_id, { consumption: reading.consumption });

    return data[0];
  },

  saveDailyReading: async (reading: { meter_id: string, value: number, date: string }) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    const { data, error } = await supabase
      .from('daily_utility_readings')
      .upsert([{ 
        user_id: user.id, 
        meter_id: reading.meter_id, 
        reading_value: reading.value, 
        reading_date: reading.date 
      }], { onConflict: 'user_id,meter_id,reading_date' })
      .select();

    if (error) throw error;
    return data[0];
  },

  getDailyReadings: async (meterId: string, startDate: string, endDate: string) => {
    const user = storageService.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('daily_utility_readings')
      .select('*')
      .eq('user_id', user.id)
      .eq('meter_id', meterId)
      .gte('reading_date', startDate)
      .lte('reading_date', endDate)
      .order('reading_date', { ascending: true });

    if (error) return [];
    return data;
  },

  getMonthlyAggregation: async (meterId: string, month: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    // month format: YYYY-MM
    const startDate = `${month}-01`;
    const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0).toISOString().split('T')[0];

    const readings = await storageService.getDailyReadings(meterId, startDate, endDate);
    
    if (readings.length === 0) return { totalConsumption: 0, averageDaily: 0, daysLogged: 0 };

    const total = readings.reduce((sum, r) => sum + r.reading_value, 0);
    return {
      totalConsumption: total,
      averageDaily: total / readings.length,
      daysLogged: readings.length
    };
  },

  // --- Alerts System ---
  getAlerts: async (filters?: { governorateId?: string, scope?: string, isActive?: boolean }) => {
    let query = supabase
      .from('alerts')
      .select(`
        *,
        governorate:governorate_id(name_ar, name_en)
      `)
      .order('created_at', { ascending: false });

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    
    if (filters?.scope) {
      query = query.eq('scope', filters.scope);
    }

    const { data, error } = await query;
    if (error) return [];
    
    // Robust normalization for Arabic
    const normalizeArabic = (str: string) => {
      return str
        .toLowerCase()
        .replace(/[إأآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u0652]/g, '') // Remove Harakat
        .replace(/\s+/g, ' ')
        .trim();
    };

    const forbiddenPatterns = [
      'الاضطراب السياسي', 'ثوره 30 يو', 'ثوره ٣٠ يو', 'ثورة ٣٠ يو', 'ثورة 30 يو',
      'سياسه مصر الخارجيه', 'محيطها العربي', 'تاريخها الحديث', 'المنطقه العربيه', 
      'political instability', 'revolution', '25 يناير', 'ثوره يونيو',
      'صراع القوى', 'الامن القومي العربي', 'الجمهوريه الجديده', 'المنطقه منذ عام', 'تاريخها الحديث',
      'أولويات السياسة الخارجية'
    ].map(p => normalizeArabic(p));
    
    // Filter by forbidden mock/political content
    return (data || []).filter(a => {
      const title = normalizeArabic(a.title_ar || a.title || '');
      const desc = normalizeArabic(a.description_ar || a.description || '');
      return !forbiddenPatterns.some(pattern => title.includes(pattern) || desc.includes(pattern));
    });
  },

  getAlertNotifications: async () => {
    const user = storageService.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('alert_notifications')
      .select('*, alert:alert_id(*)')
      .eq('user_id', user.id)
      .eq('is_read', false);
    if (error) return [];
    return data;
  },

  markNotificationRead: async (id: string) => {
    await supabase.from('alert_notifications').update({ is_read: true }).eq('id', id);
  },

  createAlertNotification: async (notification: { alert_id: string, user_id: string }) => {
    await supabase.from('alert_notifications').insert([notification]);
  },

  getGovernorateSafetyIndex: async () => {
    const { data, error } = await supabase
      .from('governorates')
      .select('id, name_ar, name_en, safety_index')
      .order('safety_index', { ascending: false });
    if (error) return [];
    return data;
  },

  updateSafetyIndex: async (govId: string, index: number) => {
    await supabase.from('governorates').update({ safety_index: index }).eq('id', govId);
  },

  getTransparencyLogs: async () => {
    const { data: alerts } = await supabase.from('alerts').select('*').order('created_at', { ascending: false });
    const { data: txs } = await supabase.from('points_transactions').select('id, reason, user_id, metadata, created_at').order('created_at', { ascending: false }).limit(20);
    
    const mappedAudits = (txs || []).map(tx => ({
      id: tx.id,
      action: tx.reason || 'SYSTEM_ACTION',
      user_id: tx.user_id,
      details: tx.metadata || {},
      timestamp: tx.created_at
    }));

    return { alerts: alerts || [], audits: mappedAudits };
  },

  createAlert: async (alertData: any) => {
    // Duplicate prevention: check if an active alert with same type and governorate exists
    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('type', alertData.type)
      .eq('governorate_id', alertData.governorate_id)
      .eq('is_active', true)
      .limit(1);

    if (existing && existing.length > 0) {
      return { error: 'Duplicate active alert exists' };
    }

    const { data, error } = await supabase
      .from('alerts')
      .insert([alertData])
      .select();
    
    if (data && data[0]) {
      await storageService.logAudit('alert_created', 'alerts', { alert_id: data[0].id });
    }
    
    return { data, error };
  },

  getNationalAlerts: async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },

  // --- Audit Logging ---
  logAudit: async (action: string, sector: string, details: any) => {
    const user = storageService.getUser();
    await supabase.from('audit_logs').insert([{
      user_id: user?.id,
      action,
      sector,
      details,
      timestamp: new Date().toISOString()
    }]);
  },

  saveRecord: async (record: any) => {
    try {
      const user = storageService.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('consumption_records')
        .insert([{
          user_id: user.id,
          sector: record.type || record.sector,
          value: record.value,
          unit: record.unit,
          co2: record.co2 || record.co2_impact || record.co2,
          cost: record.cost,
          description: record.description || 'Smart Calculator',
          record_date: new Date().toISOString().split('T')[0],
          metadata: record.metadata || {}
        }])
        .select();

      if (error) {
        console.warn('Silent DB Sync Error (Consumption Record):', error);
        return null;
      }
      return data ? data[0] : null;
    } catch (error) {
      console.warn('Caught Exception in saveRecord:', error);
      return null;
    }
  },

  // --- Sector Specific Methods ---
  getSectorRecords: async (sector: string) => {
    const user = storageService.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('consumption_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('sector', sector)
      .order('record_date', { ascending: false });
    
    if (error) return [];
    return data;
  },

  getScientificData: async (category?: string) => {
    let query = supabase.from('scientific_data').select('*');
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) return [];
    return data;
  },

  calculateConsumptionImpact: async (type: string, value: number) => {
    const data = await storageService.getScientificData('emission_factor');
    const factor = data.find(d => d.key === type)?.value || 
                 (type === 'electricity' ? 0.53 : type === 'water' ? 0.3 : 1.93);
    return value * factor;
  },

  getTariffInfo: async (type: string) => {
    const data = await storageService.getScientificData('tariff');
    return data.filter(d => d.key === type);
  },

  getOfficialPrices: async (category?: string) => {
    let query = supabase.from('prices').select('*').order('min_consumption', { ascending: true });
    if (category) {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error) {
      console.warn("Failed to fetch official prices", error);
      return [];
    }
    return data;
  },

  // --- Government Services ---
  getGovBills: async () => {
    const user = storageService.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('gov_bills')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });
    if (error) return [];
    return data;
  },

  payGovBill: async (billId: string, paymentMethod: string = 'credit_card') => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    // Simulate official payment gateway processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 1. Fetch the bill
    const { data: bill, error: fetchError } = await supabase
      .from('gov_bills')
      .select('*')
      .eq('id', billId)
      .single();

    if (fetchError || !bill) throw new Error("Bill not found");
    if (bill.status === 'Paid') throw new Error("Bill already paid");

    // 2. Update bill status
    const { error: updateError } = await supabase
      .from('gov_bills')
      .update({ 
        status: 'Paid', 
        payment_date: new Date().toISOString(),
        payment_method: paymentMethod
      })
      .eq('id', billId);

    if (updateError) throw updateError;

    // 3. INTEGRATION: Add to Carbon Consumption Records
    if (bill.consumption_value) {
      const sectorMap: Record<string, string> = {
        'Electricity': 'Electricity',
        'Water': 'Water',
        'Gas': 'Gas'
      };
      
      const unitMap: Record<string, string> = {
        'Electricity': 'kWh',
        'Water': 'm3',
        'Gas': 'm3'
      };

      await supabase.from('consumption_records').insert([{
        user_id: user.id,
        sector: sectorMap[bill.bill_type] || 'Other',
        value: bill.consumption_value,
        unit: unitMap[bill.bill_type] || 'units',
        record_date: new Date().toISOString(),
        source: 'Official Government Bill'
      }]);
    }

    // 4. REWARDS LOGIC:
    let rewardCoins = 20; 
    if (bill.consumption_value && bill.consumption_value < 200) {
      rewardCoins += 50; 
    }

    // 5. Update user user
    const { data: profile } = await supabase.from('users').select('green_coins, points').eq('id', user.id).single();
    
    const newCoins = (profile?.green_coins || 0) + rewardCoins;
    const newPoints = (profile?.points || 0) + 15;

    await supabase.from('users').update({
      green_coins: newCoins,
      points: newPoints
    }).eq('id', user.id);

    if (user) {
      const updatedUser = { ...user, greenCoins: newCoins, points: newPoints };
      storageService.saveUser(updatedUser);
    }

    // 6. Notify about additional fees or rewards
    if (bill.amount > 500) {
      await storageService.createNotification(
        user.id,
        'تنبيه رسوم إضافية',
        'Additional Fees Alert',
        `تم ملاحظة استهلاك مرتفع في فاتورة ${bill.bill_type}. يرجى مراجعة نصائح الترشيد لتقليل الرسوم الإضافية.`,
        `High consumption detected in ${bill.bill_type} bill. Check rationalization tips to avoid surcharges.`,
        'warning'
      ).catch(() => null);
    }

    await storageService.logAudit('Official Bill Paid', bill.bill_type, { bill_id: billId, reward: rewardCoins, method: paymentMethod });

    return { success: true, reward: rewardCoins };
  },

  linkUtilityAccount: async (type: string, subscriberId: string, providerName: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    // Simulate official API call to utility provider
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 1. Add to utility_meters so it shows up in tracking
    const { error: meterError } = await supabase.from('utility_meters').insert([{
      user_id: user.id,
      type: type.toLowerCase(),
      meter_number: subscriberId,
      initial_reading: 0,
      is_estimated: false
    }]);

    if (meterError) console.error("Error adding meter:", meterError);

    await storageService.logAudit('Utility Account Linked', type, { subscriber_id: subscriberId, provider: providerName });
    return { success: true };
  },

  getGovServicesByCategory: async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('gov_services')
        .select('*')
        .eq('category', categoryId)
        .order('name_ar');
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching gov services:", err);
      return [];
    }
  },

  requestGovService: async (serviceId: string, details: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    // Simulate official request processing
    await new Promise(resolve => setTimeout(resolve, 2500));

    const { data, error } = await supabase
      .from('gov_appointments')
      .insert([{ 
        user_id: user.id,
        service_name: serviceId,
        details: typeof details === 'string' ? details : JSON.stringify(details),
        status: 'Processing',
        appointment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        appointment_time: '10:00 AM'
      }])
      .select();

    if (error) throw error;

    // Reward for digital transaction
    const { data: profile } = await supabase.from('users').select('green_coins').eq('id', user.id).single();
    await supabase.from('users').update({ 
      green_coins: (profile?.green_coins || 0) + 15 
    }).eq('id', user.id);
    
    await storageService.logAudit('Government Service Requested', serviceId, { user_id: user.id });
    return data[0];
  },

  getGovServiceProviders: async (type: string) => {
    try {
      const { data, error } = await supabase
        .from('gov_providers')
        .select('*')
        .eq('type', type);
      if (error) {
        console.warn('Could not fetch gov providers', error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  verifyGovId: async (idNumber: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    // Real API implementation placeholder - Using Supabase Update
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple validation: must be 14 digits (Egyptian ID)
    if (!/^\d{14}$/.test(idNumber)) {
      throw new Error("Invalid National ID format. Must be 14 digits.");
    }

    // Update user record to verified
    const { error } = await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('id', user.id);

    if (error) throw error;

    const updatedUser = { ...user, isVerified: true };
    storageService.saveUser(updatedUser);

    return { verified: true, name: user.name };
  },

  getGovAppointments: async () => {
    const user = storageService.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('gov_appointments')
      .select('*')
      .eq('user_id', user.id)
      .order('appointment_date', { ascending: true });
    if (error) return [];
    return data;
  },

  bookGovAppointment: async (appointment: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    const { data, error } = await supabase
      .from('gov_appointments')
      .insert([{ ...appointment, user_id: user.id }])
      .select();

    if (error) throw error;

    // Reward for choosing digital booking (saving transport emissions)
    const newCoins = (user.greenCoins || 0) + 10;
    await supabase.from('users').update({ green_coins: newCoins }).eq('id', user.id);
    
    const updatedUser = { ...user, greenCoins: newCoins };
    storageService.saveUser(updatedUser);

    return data[0];
  },

  getGovDocuments: async () => {
    const user = storageService.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('gov_documents')
      .select('*')
      .eq('user_id', user.id);
    if (error) return [];
    return data;
  },

  requestGovDocument: async (docType: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    // Simulate official request processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data, error } = await supabase
      .from('gov_documents')
      .insert([{ 
        user_id: user.id,
        doc_type: docType,
        status: 'Issued',
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }])
      .select();

    if (error) throw error;

    // Reward for digital transaction
    const { data: profile } = await supabase.from('users').select('green_coins').eq('id', user.id).single();
    await supabase.from('users').update({ 
      green_coins: (profile?.green_coins || 0) + 10 
    }).eq('id', user.id);
    
    await storageService.logAudit('Digital Document Issued', docType, { user_id: user.id });
    return data[0];
  },

  awardBadge: async (badge: string) => {
    const user = storageService.getUser();
    if (!user) return;
    
    const currentBadges = user.badges || [];
    if (currentBadges.includes(badge)) return;
    
    const newBadges = [...currentBadges, badge];
    const { error } = await supabase
      .from('users')
      .update({ badges: newBadges })
      .eq('id', user.id);
      
    if (!error) {
      const updatedUser = { ...user, badges: newBadges };
      localStorage.setItem('moeco_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));
    }
  },

  getWalkingActivities: async () => {
    const user = storageService.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('consumption_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('activity_type', 'walking')
      .order('created_at', { ascending: false });
    
    if (error) return [];

    return data.map(activity => ({
      ...activity,
      distance_km: activity.value,
      start_time: activity.metadata?.start_time || activity.created_at
    }));
  },

  saveWalkingActivity: async (activity: { start_point: string, end_point: string, distance_km: number, calories: number, co2_saved: number, points_earned: number }) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    // Simple duplicate check: same distance and points within the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('consumption_records')
      .select('id')
      .eq('user_id', user.id)
      .eq('activity_type', 'walking')
      .eq('value', activity.distance_km)
      .gte('created_at', oneHourAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      throw new Error("A similar activity was already logged recently");
    }

    const { data, error } = await supabase
      .from('consumption_records')
      .insert([{
        user_id: user.id,
        activity_type: 'walking',
        sector: 'transport',
        value: activity.distance_km,
        co2: -1 * activity.co2_saved,
        metadata: {
          start_point: activity.start_point,
          end_point: activity.end_point,
          calories: activity.calories,
          points_earned: activity.points_earned
        }
      }])
      .select();
    
    if (error) throw error;

    // Update user points
    const newPoints = (user.points || 0) + activity.points_earned;
    const newCoins = (user.greenCoins || 0) + Math.floor(activity.points_earned / 10);
    
    await supabase
      .from('users')
      .update({ points: newPoints, green_coins: newCoins })
      .eq('id', user.id);
    
    const updatedUser = { ...user, points: newPoints, greenCoins: newCoins };
    storageService.saveUser(updatedUser);

    return data[0];
  },

  // --- Administrative Methods (Admin Panel) ---
  updateScientificData: async (key: string, value: number, unit: string, category: string) => {
    const { data, error } = await supabase
      .from('scientific_data')
      .upsert({ key, value, unit, category })
      .select();
    if (error) throw error;
    return data[0];
  },

  deleteScientificData: async (id: string) => {
    const { error } = await supabase.from('scientific_data').delete().eq('id', id);
    if (error) throw error;
  },

  createDailyMission: async (mission: any) => {
    const { data, error } = await supabase.from('daily_missions').insert([mission]).select();
    if (error) throw error;
    return data[0];
  },

  updateDailyMission: async (id: string, mission: any) => {
    const { data, error } = await supabase.from('daily_missions').update(mission).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },

  deleteDailyMission: async (id: string) => {
    const { error } = await supabase.from('daily_missions').delete().eq('id', id);
    if (error) throw error;
  },

  createEcoNews: async (news: any) => {
    const { data, error } = await supabase.from('eco_news').insert([{ ...news, status: 'approved' }]).select();
    if (error) throw error;
    return data[0];
  },

  updateEcoNews: async (id: string, news: any) => {
    const { data, error } = await supabase.from('eco_news').update(news).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },

  updateEcoEvent: async (id: string, event: any) => {
    const { data, error } = await supabase.from('eco_events').update(event).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },

  deleteEcoNews: async (id: string) => {
    const { error } = await supabase.from('eco_news').delete().eq('id', id);
    if (error) throw error;
  },

  createInteractiveStory: async (story: any) => {
    const { data, error } = await supabase.from('interactive_stories').insert([{ ...story, status: 'approved' }]).select();
    if (error) throw error;
    return data[0];
  },

  updateInteractiveStory: async (id: string, story: any) => {
    const { data, error } = await supabase.from('interactive_stories').update(story).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },

  deleteInteractiveStory: async (id: string) => {
    const { error } = await supabase.from('interactive_stories').delete().eq('id', id);
    if (error) throw error;
  },

  setGlobalConfig: async (config: any) => {
    const { data: existing } = await supabase.from('app_config').select('id').maybeSingle();
    let error;
    const updateData = {
      maintenance: config.maintenance,
      global_message: config.globalMessage,
      ad_revenue_per_view: config.adRevenuePerView,
      show_banner_ads: config.showBannerAds,
      ad_unit_id: config.adUnitId,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      const { error: e } = await supabase.from('app_config').update(updateData).eq('id', existing.id);
      error = e;
    } else {
      const { error: e } = await supabase.from('app_config').insert([updateData]);
      error = e;
    }
    if (error) throw error;
  },

  getGlobalConfig: async () => {
    const { data, error } = await supabase.from('app_config').select('*').maybeSingle();
    if (error || !data) {
      return { 
        maintenance: false, 
        globalMessage: '', 
        adRevenuePerView: 0, 
        showBannerAds: false,
        adUnitId: ''
      };
    }
    return {
      maintenance: data.maintenance,
      globalMessage: data.global_message,
      adRevenuePerView: data.ad_revenue_per_view,
      showBannerAds: data.show_banner_ads,
      adUnitId: data.ad_unit_id
    };
  },

  getRecentCarbonPulse: async (userId: string) => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Aggregate from multiple carbon-related tables
      const [consumptionRecords] = await Promise.all([
        supabase.from('consumption_records').select('co2').eq('user_id', userId).gte('created_at', twentyFourHoursAgo)
      ]);

      const total = consumptionRecords.data?.reduce((sum, r) => sum + (r.co2 || 0), 0) || 0;

      // Calculate trend by comparing with previous 24h
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const [prevConsumption] = await Promise.all([
        supabase.from('consumption_records').select('co2').eq('user_id', userId).lt('created_at', twentyFourHoursAgo).gte('created_at', fortyEightHoursAgo)
      ]);

      const prevTotal = prevConsumption.data?.reduce((sum, r) => sum + (r.co2 || 0), 0) || 0;

      const trend = total > prevTotal ? 'up' : (total < prevTotal ? 'down' : 'stable');

      return { total, trend };
    } catch(e) {
      console.error("Carbon pulse aggregation error:", e);
      return { total: 0, trend: 'stable' };
    }
  },

  // --- Daily Rewards ---

  getDailyReward: async () => {
    try {
      const user = storageService.getUser();
      if (!user) return null;

      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Check if already claimed today
      const { data: claim } = await supabase
        .from('daily_reward_claims')
        .select('*')
        .eq('user_id', user.id)
        .eq('claim_date', todayStr)
        .maybeSingle();

      if (claim) return null; // Already claimed

      // 2. Get active reward definition
      const { data: reward, error } = await supabase
        .from('daily_rewards')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      
      if (error || !reward) return null;
      return reward;
    } catch (e) {
      console.warn("Daily reward check failed:", e);
      return null;
    }
  },

  claimDailyReward: async (rewardId: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    const today = new Date().toISOString().split('T')[0];

    // Check if already claimed
    const { data: existing } = await supabase
      .from('daily_reward_claims')
      .select('id')
      .eq('user_id', user.id)
      .eq('claim_date', today)
      .maybeSingle();

    if (existing) throw new Error("Reward already claimed today");

    // Get reward details
    const { data: reward } = await supabase.from('daily_rewards').select('points_amount').eq('id', rewardId).single();
    if (!reward) throw new Error("Reward data missing");

    // Insert claim
    const { error: claimError } = await supabase
      .from('daily_reward_claims')
      .insert([{ user_id: user.id, reward_id: rewardId, claim_date: today }]);

    if (claimError) throw claimError;

    // Update Streak
    let currentStreak = 1;
    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('current_streak, last_active_date')
      .eq('user_id', user.id)
      .maybeSingle();

    if (streakData) {
      const lastDate = new Date(streakData.last_active_date);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (streakData.last_active_date === yesterdayStr) {
        currentStreak = streakData.current_streak + 1;
      } else if (streakData.last_active_date === today) {
        currentStreak = streakData.current_streak;
      }

      await supabase.from('user_streaks').upsert({
        user_id: user.id,
        current_streak: currentStreak,
        track_date: today, // Historical tracking
        last_active_date: today
      }, { onConflict: 'user_id' });
    } else {
      await supabase.from('user_streaks').insert({
        user_id: user.id,
        current_streak: 1,
        last_active_date: today
      });
    }

    // Award points
    const newPoints = (user.points || 0) + reward.points_amount;
    const newCoins = (user.greenCoins || 0) + (reward.points_amount / 10); // Example conversion
    
    await supabase.from('users').update({ 
      points: newPoints,
      green_coins: newCoins
    }).eq('id', user.id);

    const updatedUser = { ...user, points: newPoints, greenCoins: newCoins, streak: currentStreak };
    storageService.saveUser(updatedUser);
    
    return { success: true, pointsClaimed: reward.points_amount, newTotalPoints: newPoints, streak: currentStreak };
  },

  // --- Smart Life Platform ---
  createTransaction: async (data: any) => {
    const { error } = await supabase.from('transactions').insert([data]);
    if (error) {
       console.error("Error creating transaction", error);
       throw error;
    }
    return true;
  },

  getTransactions: async (userId: string) => {
    const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },

  getLocations: async () => {
    const { data, error } = await supabase.from('locations').select('*');
    if (error) return [];
    return data || [];
  },

  // --- Marketplace & Monetization ---
  getFeaturedContent: async () => {
    const { data, error } = await supabase.from('featured_content').select('*').eq('is_active', true).order('priority', { ascending: false });
    if (error) {
      console.warn("Table featured_content might not exist:", error);
      return [];
    }
    return data || [];
  },

  getPartnerOffers: async () => {
    const { data, error } = await supabase.from('partner_offers').select('*, partners(name, logo_url)').gt('expiry_date', new Date().toISOString());
    if (error) {
      console.warn("Table partner_offers might not exist:", error);
      return [];
    }
    return data || [];
  },

  getUserCoupons: async (userId: string) => {
    const { data, error } = await supabase.from('user_coupons').select('*, coupons(*), partner_offers(*)').eq('user_id', userId);
    return data || [];
  },

  // --- Gamification ---
  saveOnboardingProgress: async (userId: string, data: any) => {
    const { error } = await supabase
      .from('onboarding_profiles')
      .upsert({ user_id: userId, ...data });
    if (error) {
      console.warn("Could not save onboarding explicitly, trying metadata");
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({ data: { onboardingComplete: true, ...data } });
      }
    }
    return true;
  },

  updateStreak: async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!data) {
        await supabase.from('user_streaks').insert({ user_id: userId, current_streak: 1, last_active_date: today });
      } else {
        const lastDate = new Date(data.last_active_date);
        const currDate = new Date(today);
        const diffDays = Math.floor((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          await supabase.from('user_streaks').update({ current_streak: data.current_streak + 1, last_active_date: today }).eq('user_id', userId);
        } else if (diffDays > 1) {
          await supabase.from('user_streaks').update({ current_streak: 1, last_active_date: today }).eq('user_id', userId);
        }
      }
    } catch(e) {
      console.warn("Streak update failed", e);
    }
  },


  getCurrentStreak: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('current_streak, last_active_date')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) return { current_streak: 0 };
    return data || { current_streak: 0 };
  },

  getDailyGoals: async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today);
    
    if (error) return [];
    return data || [];
  },

  updateDailyGoal: async (goalId: string, achieved: boolean) => {
    const { error } = await supabase
      .from('daily_goals')
      .update({ achieved })
      .eq('id', goalId);
    if (error) throw error;
    if (achieved) {
      const user = storageService.getUser();
      if (user) await storageService.awardPoints(user.id, 20, 'Daily Goal Achieved');
    }
  },

  getMicroInsights: async (userId: string) => {
    const history = await storageService.fetchUserHistory(userId, 100);
    if (!history || history.length === 0) return null;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const arDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    const usageByDay: Record<number, number> = {};
    const usageByHour: Record<number, number> = {};

    history.forEach(r => {
      const date = new Date(r.created_at);
      const day = date.getDay();
      const hour = date.getHours();
      usageByDay[day] = (usageByDay[day] || 0) + 1;
      usageByHour[hour] = (usageByHour[hour] || 0) + 1;
    });

    const peakDayIndex = Number(Object.keys(usageByDay).reduce((a, b) => usageByDay[Number(a)] > usageByDay[Number(b)] ? a : b));
    const peakHourValue = Number(Object.keys(usageByHour).reduce((a, b) => usageByHour[Number(a)] > usageByHour[Number(b)] ? a : b));

    return {
      peakDay: { en: days[peakDayIndex], ar: arDays[peakDayIndex] },
      peakHour: `${peakHourValue}:00`,
      totalEntries: history.length,
      topSector: Array.from(new Set(history.map(h => h.sector))).sort((a,b) => 
        history.filter(h => h.sector === b).length - history.filter(h => h.sector === a).length
      )[0]
    };
  },

  getUserRankings: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, points, role, avatar_url')
      .order('points', { ascending: false })
      .limit(100);
    if (error) return [];
    return data;
  },

  // --- Environmental Reports ---
  saveEnvironmentalReport: async (report: { category: string, title: string, description: string, location_lat: number, location_lng: number, photo_url?: string }) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    // Check for duplicates in the same area (within ~100m) and same category
    const { data: existing } = await supabase
      .from('environmental_reports')
      .select('id')
      .eq('category', report.category)
      .gte('location_lat', report.location_lat - 0.001)
      .lte('location_lat', report.location_lat + 0.001)
      .gte('location_lng', report.location_lng - 0.001)
      .lte('location_lng', report.location_lng + 0.001)
      .eq('status', 'pending')
      .limit(1);

    if (existing && existing.length > 0) {
      throw new Error("A similar report already exists in this area");
    }

    const { data, error } = await supabase
      .from('environmental_reports')
      .insert([{ ...report, user_id: user.id, status: 'pending' }])
      .select();
    
    if (error) throw error;

    // Award points for reporting
    const rewardPoints = 20;
    const newPoints = (user.points || 0) + rewardPoints;
    await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('id', user.id);
    
    const updatedUser = { ...user, points: newPoints };
    storageService.saveUser(updatedUser);

    return data[0];
  },

  getEnvironmentalReports: async () => {
    const { data, error } = await supabase
      .from('environmental_reports')
      .select('*, users(full_name, avatar_url)')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },

  getWaterIssues: async () => {
    const { data, error } = await supabase
      .from('environmental_reports')
      .select('*')
      .eq('category', 'water')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },

  logCarbonActivity: async (log: any) => {
    // Adapter for App.tsx context
    const carbonLog = {
      user_id: log.user_id,
      transport_emissions: log.sector === 'transport' ? log.co2 : 0,
      total_emissions: log.co2
    };
    return await storageService.saveCarbonLog(carbonLog);
  },

  saveTransportLog: async (log: any) => {
    const emissionData = {
      user_id: log.user_id,
      transport_type: log.transport_type,
      distance_km: log.distance_km,
      co2_emissions: log.carbon_footprint
    };
    return await storageService.saveTransportEmission(emissionData);
  },


  // --- Scientific Data ---
  // --- Cleanup & Sync ---
  syncLocalToCloud: async () => {
    // This would handle any offline data sync if needed
    console.log("Syncing local data to Supabase...");
  },

  // Removed duplicate logout

  isOnboardingCompleted: () => localStorage.getItem('moeco_onboarding') === 'true',
  setOnboardingCompleted: (val: boolean = true) => localStorage.setItem('moeco_onboarding', String(val)),
  
  getActionPlan: async () => {
    const user = storageService.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('users')
      .select('action_plan')
      .eq('id', user.id)
      .single();
    if (error || !data) return [];
    return data.action_plan || [];
  },
  saveActionPlan: async (plan: any) => {
    const user = storageService.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('users')
      .update({ action_plan: plan })
      .eq('id', user.id);
    if (error) console.error("Error saving action plan:", error);
  },

  getCarbonBudget: async () => {
    const user = storageService.getUser();
    if (!user) return { limit: 500, spent: 0 };
    const { data, error } = await supabase
      .from('users')
      .select('carbon_budget')
      .eq('id', user.id)
      .single();
    if (error || !data) return { limit: 500, spent: 0 };
    return data.carbon_budget || { limit: 500, spent: 0 };
  },
  saveCarbonBudget: async (budget: any) => {
    const user = storageService.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('users')
      .update({ carbon_budget: budget })
      .eq('id', user.id);
    if (error) console.error("Error saving carbon budget:", error);
  },

  getSocialFeed: async () => {
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },
  postToFeed: async (post: any) => {
    const user = storageService.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('social_posts')
      .insert([{ ...post, user_id: user.id, author_name: user.name }]);
    if (error) console.error("Error posting to feed:", error);
  },

  addGreenCoins: (amount: number) => {
    const user = storageService.getUser();
    if (user) {
      user.greenCoins += amount;
      storageService.saveUser(user);
    }
  },

  saveCountriesData: (data: any) => localStorage.setItem('moeco_countries_data', JSON.stringify(data)),
  saveGovernorateData: (data: any) => localStorage.setItem('moeco_governorates_data', JSON.stringify(data)),

  getGlobalMetrics: async () => {
    const { data: records, error: rError } = await supabase
      .from('consumption_records')
      .select('co2_impact');
    
    const { count: userCount, error: uError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (rError || uError) return { totalUsers: 0, totalCO2Saved: 0, activeChallenges: 0, topGovernorate: 'N/A' };

    const totalCO2 = records?.reduce((sum, r) => sum + (r.co2_impact || 0), 0) || 0;
    
    return {
      totalUsers: userCount || 0,
      totalCO2Saved: totalCO2,
      activeChallenges: 0,
      topGovernorate: 'N/A'
    };
  },

  // Removed duplicate resetPassword

  getGovAnalytics: async () => {
    // Fetch aggregated data from Supabase users and utility_readings
    const { data: profiles, error: pError } = await supabase.from('users').select('governorate, points');
    const { data: readings, error: rError } = await supabase.from('utility_readings').select('cost, consumption, utility_meters(type)');

    if (pError || rError) return [];

    const govStats: any = {};

    profiles?.forEach(p => {
      if (!p.governorate) return;
      if (!govStats[p.governorate]) {
        govStats[p.governorate] = { governorate: p.governorate, userCount: 0, totalPoints: 0, totalCost: 0, totalConsumption: 0, readingCount: 0 };
      }
      govStats[p.governorate].userCount++;
      govStats[p.governorate].totalPoints += (p.points || 0);
    });

    return Object.values(govStats).map((g: any) => ({
      ...g,
      avgKwh: g.readingCount > 0 ? g.totalConsumption / g.readingCount : 0,
      avgBill: g.readingCount > 0 ? g.totalCost / g.readingCount : 0,
      stressLevel: 0
    }));
  },

  calculateMetrics: (records: any[]) => {
    const totalCO2 = records.reduce((sum, r) => sum + (r.co2 || r.co2_impact || 0), 0);
    const totalCO2Saved = records.reduce((sum, r) => sum + (r.co2_saved || r.details?.co2_saved || 0), 0);
    const waterSaving = records.filter(r => (r.Sector?.nameEn === 'Water' || r.sector === 'water')).reduce((sum, r) => sum + ((r.consumption || r.value) * 0.5), 0);
    
    const breakdown = records.reduce((acc: any, r) => {
      const sectorName = r.Sector?.nameEn || r.sector || 'Other';
      acc[sectorName] = (acc[sectorName] || 0) + (r.co2 || r.co2_impact || 0);
      return acc;
    }, {});

    const annualAggregates = records.reduce((acc: any, r) => {
      const timestamp = r.timestamp || r.date || r.created_at;
      if (!timestamp) return acc;
      const year = new Date(timestamp).getFullYear();
      acc[year] = (acc[year] || 0) + (r.co2 || r.co2_impact || 0);
      return acc;
    }, {});

    return { totalCO2, totalCO2Saved, waterSaving, recordCount: records.length, breakdown, annualAggregates };
  },

  calculateEnvironmentalJusticeIndex: (records: any[]) => {
    if (records.length === 0) return 50;
    const totalCO2 = records.reduce((sum, r) => sum + (r.co2 || r.co2_impact || 0), 0);
    const avgCO2 = totalCO2 / records.length;
    // Simple index: higher if CO2 is lower than average threshold
    const index = Math.max(0, Math.min(100, 100 - (avgCO2 / 10)));
    return Math.round(index);
  },

  getFutureProjection: (records: any[]) => {
    if (records.length < 2) return [];
    const lastValue = records[0].co2 || records[0].co2_impact || 0;
    return [
      { year: 2026, value: lastValue * 0.95 },
      { year: 2027, value: lastValue * 0.9 },
      { year: 2028, value: lastValue * 0.85 }
    ];
  },

  saveChallenge: async (challenge: any) => {
    const { data, error } = await supabase.from('challenges').insert([challenge]).select();
    if (error) throw error;
    return data[0];
  },

  getChatHistory: async (): Promise<ChatMessage[]> => {
    const { data, error } = await supabase.from('chat_messages').select('*').order('timestamp', { ascending: true });
    if (error) return [];
    return data as any;
  },

  saveChatMessage: async (msg: any) => {
    const { data, error } = await supabase.from('chat_messages').insert([msg]).select();
    if (error) throw error;
    return data[0];
  },

  getBills: async (): Promise<BillRecord[]> => {
    const { data, error } = await supabase.from('bills').select('*').order('timestamp', { ascending: false });
    if (error) return [];
    return data as any;
  },

  getProducts: async (): Promise<EcoProduct[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true);
    if (error) return [];
    return data.map((p: any) => ({
      ...p,
      sellerId: p.seller_id,
      sellerName: p.seller_name
    })) as any;
  },

  saveProduct: async (product: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");
    
    const { data, error } = await supabase
      .from('products')
      .insert([{ 
        name_en: product.name,
        name_ar: product.name, // For now use same for both
        price: Number(product.price),
        category: product.category,
        image_url: product.image,
        description_en: product.description,
        description_ar: product.description,
        seller_id: user.id,
        seller_name: user.name 
      }])
      .select();
    if (error) throw error;
    return data[0];
  },

  deleteProduct: async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  updateProduct: async (id: string, updates: any) => {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) throw error;
  },

  redeemPromoCode: async (code: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    // 1. Find the promo code
    const { data: promo, error: promoError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (promoError || !promo) {
      throw new Error("Invalid or expired code");
    }

    // 2. Check if already redeemed by this user
    const { data: existing } = await supabase
      .from('user_promo_codes')
      .select('id')
      .eq('user_id', user.id)
      .eq('promo_code_id', promo.id)
      .maybeSingle();

    if (existing) {
      throw new Error("Code already redeemed");
    }

    // 3. Check expiry
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      throw new Error("Code has expired");
    }

    // 4. Check max uses
    if (promo.current_uses >= promo.max_uses) {
      throw new Error("Code usage limit reached");
    }

    // 5. Perform redemption (ideally in a transaction/RPC, but we'll do sequential for now)
    const { error: redeemError } = await supabase
      .from('user_promo_codes')
      .insert([{ user_id: user.id, promo_code_id: promo.id }]);

    if (redeemError) throw redeemError;

    // 6. Update usage count
    await supabase
      .from('promo_codes')
      .update({ current_uses: promo.current_uses + 1 })
      .eq('id', promo.id);

    // 7. Award rewards
    await storageService.updateUserPoints(user.id, promo.reward_points, promo.reward_coins);

    return {
      points: promo.reward_points,
      coins: promo.reward_coins
    };
  },

  getEmergencyReports: async () => {
    const { data, error } = await supabase.from('environmental_reports').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },

  saveEmergencyReport: async (report: any) => {
    const user = storageService.getUser();
    const { data, error } = await supabase
      .from('environmental_reports')
      .insert([{ 
        ...report, 
        user_id: user?.id,
        status: 'pending' // Force pending status for review
      }])
      .select();
    if (error) throw error;
    return data[0];
  },

  saveSupportMessage: async (message: { subject: string, content: string, email?: string, phone?: string }) => {
    const user = storageService.getUser();
    const { data, error } = await supabase
      .from('support_messages')
      .insert([{ 
        ...message, 
        user_id: user?.id,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select();
    if (error) throw error;
    return data[0];
  },

  getSectorThresholds: async () => {
    const { data, error } = await supabase
      .from('sector_thresholds')
      .select('*');
    if (error) return [];
    return data;
  },

  getSafetyIndexConfig: async () => {
    const { data, error } = await supabase
      .from('safety_index_config')
      .select('*');
    if (error) return [];
    return data;
  },

  checkThresholdsAndAlert: async (governorateId: string, sector: string, value: number) => {
    const { data: thresholds } = await supabase
      .from('sector_thresholds')
      .select('*')
      .eq('sector_name', sector)
      .maybeSingle();

    if (thresholds && value > thresholds.critical_threshold) {
      await storageService.createAlert({
        type: 'environmental',
        severity: 'critical',
        title_ar: `تجاوز حرج في قطاع ${sector}`,
        title_en: `Critical threshold exceeded in ${sector}`,
        description_ar: `تم رصد استهلاك يتجاوز الحدود الحرجة في محافظة ${governorateId}`,
        description_en: `Consumption exceeding critical limits detected in governorate ${governorateId}`,
        governorate_id: governorateId,
        scope: 'governorate',
        is_active: true,
        expires_at: new Date(Date.now() + 86400000).toISOString() // 24h
      });
    } else if (thresholds && value > thresholds.warning_threshold) {
      await storageService.createAlert({
        type: 'environmental',
        severity: 'warning',
        title_ar: `تحذير في قطاع ${sector}`,
        title_en: `Warning in ${sector}`,
        description_ar: `تم رصد استهلاك مرتفع في محافظة ${governorateId}`,
        description_en: `High consumption detected in governorate ${governorateId}`,
        governorate_id: governorateId,
        scope: 'governorate',
        is_active: true,
        expires_at: new Date(Date.now() + 86400000).toISOString() // 24h
      });
    }
  },

  scanSystemDataForAlerts: async () => {
    // This method scans the system data (governorates/scientific_data) and compares with thresholds
    const { data: governorates } = await supabase.from('governorates').select('*');
    const { data: thresholds } = await supabase.from('sector_thresholds').select('*');

    if (!governorates || !thresholds) return;

    for (const gov of governorates) {
      // Check each sector for this governorate
      // In our schema, governorates table has columns like "Annual CO2 (Mt)" etc.
      // We can check these against thresholds.
      for (const threshold of thresholds) {
        // Find matching sector data in governorate
        // This is a bit simplified, ideally we'd have a more structured sector_data table
        const sectorValue = gov["Annual CO2 (Mt)"]; // Example: checking CO2
        if (threshold.sector_name === 'Energy' && sectorValue) {
           await storageService.checkThresholdsAndAlert(gov.id, 'Energy', sectorValue);
        }
      }
    }
  },

  getUserActivity: async (userId: string) => {
    try {
      const [records, missions, readings] = await Promise.all([
        supabase
          .from('consumption_records')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('user_missions')
          .select('*, mission:mission_id(*)')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(5),
        supabase
          .from('utility_readings')
          .select('*')
          .eq('user_id', userId)
          .order('reading_date', { ascending: false })
          .limit(5)
      ]);

      const activities: any[] = [];

      records.data?.forEach(r => {
        activities.push({
          id: `rec-${r.id}`,
          type: r.category === 'transport' ? 'transport' : 'utility',
          title_ar: r.category === 'transport' ? 'رحلة نقل مستدامة' : 'سجل استهلاك مرافق',
          title_en: r.category === 'transport' ? 'Sustainable Transport Trip' : 'Utility Consumption Record',
          date: r.created_at,
          impact: `-${r.co2_impact?.toFixed(1)}kg CO2`,
          timestamp: new Date(r.created_at).getTime()
        });
      });

      missions.data?.forEach(m => {
        activities.push({
          id: `mis-${m.id}`,
          type: 'challenge',
          title_ar: m.mission?.title_ar || 'مهمة مكتملة',
          title_en: m.mission?.title_en || 'Completed Mission',
          date: m.completed_at,
          impact: `+${m.mission?.points || 0} XP`,
          timestamp: new Date(m.completed_at).getTime()
        });
      });

      readings.data?.forEach(rd => {
        activities.push({
          id: `read-${rd.id}`,
          type: 'utility',
          title_ar: 'قراءة عداد جديدة',
          title_en: 'New Meter Reading',
          date: rd.reading_date,
          impact: '+10 XP',
          timestamp: new Date(rd.reading_date).getTime()
        });
      });

      return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
    } catch (err) {
      console.error("Error fetching user activity:", err);
      return [];
    }
  },

  // --- Ads System ---
  getAds: async () => {
    return await storageService.robustRequest('ads', async () => {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    }, { timeout: 3000, retries: 1 }) || [];
  },

  saveAd: async (ad: any) => {
    const { data, error } = await supabase
      .from('ads')
      .upsert([ad])
      .select();
    if (error) throw error;
    return data[0];
  },

  deleteAd: async (id: string) => {
    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  addFamilyMember: async (familyId: string, userEmail: string) => {
    try {
      // 1. Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single();
      
      if (userError || !userData) throw new Error("User not found");

      // 2. Check if already in a family
      const { data: existing } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', userData.id)
        .single();
      
      if (existing) throw new Error("User is already in a family");

      // 3. Add to family
      const { error } = await supabase
        .from('family_members')
        .insert([{ family_id: familyId, user_id: userData.id, role: 'member' }]);
      
      if (error) throw error;

      return true;
    } catch (err) {
      console.error("Error adding family member:", err);
      throw err;
    }
  },

  // --- Dynamic Home ---
  getHomeSections: async () => {
    try {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching home sections:", err);
      return [];
    }
  },

  saveHomeSection: async (section: any) => {
    const { data, error } = await supabase
      .from('home_sections')
      .upsert([section])
      .select();
    if (error) throw error;
    return data[0];
  },

  deleteHomeSection: async (id: string) => {
    const { error } = await supabase
      .from('home_sections')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // --- App Config ---
  getAppConfig: async () => {
    return await storageService.robustRequest('app_config', async () => {
      const { data, error } = await supabase
        .from('app_config')
        .select('*');
      if (error) throw error;
      
      const config: Record<string, any> = {};
      data?.forEach(item => {
        config[item.config_key] = item.config_value;
      });
      return config;
    }, { timeout: 3000, retries: 1 }) || {};
  },

  updateAppConfig: async (key: string, value: any) => {
    const { error } = await supabase
      .from('app_config')
      .upsert([{ config_key: key, config_value: value }], { onConflict: 'config_key' });
    if (error) throw error;
  },

  saveAppConfig: async (keyOrConfig: string | Record<string, any>, value?: any) => {
    if (typeof keyOrConfig === 'object') {
      const entries = Object.entries(keyOrConfig).map(([k, v]) => ({ config_key: k, config_value: v }));
      const { error } = await supabase
        .from('app_config')
        .upsert(entries, { onConflict: 'config_key' });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('app_config')
        .upsert({ config_key: keyOrConfig, config_value: value }, { onConflict: 'config_key' });
      if (error) throw error;
    }
  },

  getUserFootprint: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_footprints')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error fetching user footprint:", err);
      return null;
    }
  },

  updateUserPoints: async (userId: string, points: number, coins: number) => {
    const { data: userRecord, error: fetchError } = await supabase
      .from('users')
      .select('points, green_coins')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const newPoints = (userRecord?.points || 0) + points;
    const newCoins = (userRecord?.green_coins || 0) + coins;

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        points: newPoints,
        green_coins: newCoins 
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Update local session
    const user = storageService.getUser();
    if (user && user.id === userId) {
      const updatedUser = { 
        ...user, 
        points: newPoints,
        greenCoins: newCoins 
      };
      storageService.saveUser(updatedUser);
    }
  },

  saveAuditResult: async (score: number, answers: any) => {
    const user = storageService.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('eco_audits')
      .insert([{
        user_id: user.id,
        score,
        answers,
        timestamp: new Date().toISOString()
      }]);

    if (error) throw error;

    // Award points for completing audit
    await storageService.updateUserPoints(user.id, 50, 10);
  },

  clearAllData: async () => {
    localStorage.clear();
    await supabase.auth.signOut();
  },

  // --- New Features Methods ---
  getUserMissions: async () => {
    const user = storageService.getUser();
    if (!user) return [];
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('user_missions')
      .select('*, mission:mission_id(*)')
      .eq('user_id', user.id)
      .gte('created_at', today);
    if (error) return [];
    return data;
  },

  getEcoSpots: async () => {
    const { data, error } = await supabase.from('eco_spots').select('*');
    if (error) return [];
    return data;
  },

  getTransportLines: async (filters?: { type?: string, governorate?: string }) => {
    let query = supabase.from('transport_lines').select('*');
    if (filters?.type && filters.type !== 'all') query = query.eq('type', filters.type);
    if (filters?.governorate && filters.governorate !== 'all') query = query.eq('governorate', filters.governorate);
    const { data, error } = await query.order('name_ar', { ascending: true });
    if (error) return [];
    return data;
  },

  addTransportLine: async (line: any) => {
    const { data, error } = await supabase.from('transport_lines').insert([line]).select();
    if (error) throw error;
    return data[0];
  },

  updateTransportLine: async (id: string, updates: any) => {
    const { data, error } = await supabase.from('transport_lines').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },

  deleteTransportLine: async (id: string) => {
    const { error } = await supabase.from('transport_lines').delete().eq('id', id);
    if (error) throw error;
  },

  getTransportStationsByLine: async (lineId: string) => {
    const { data, error } = await supabase
      .from('transport_stations')
      .select('*')
      .eq('line_id', lineId)
      .order('order_index', { ascending: true });
    if (error) return [];
    return data;
  },

  addTransportStation: async (station: any) => {
    const { data, error } = await supabase.from('transport_stations').insert([station]).select();
    if (error) throw error;
    return data[0];
  },

  updateTransportStation: async (id: string, updates: any) => {
    const { data, error } = await supabase.from('transport_stations').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  },

  deleteTransportStation: async (id: string) => {
    const { error } = await supabase.from('transport_stations').delete().eq('id', id);
    if (error) throw error;
  },

  getTransportStations: async (governorate?: string) => {
    let query = supabase.from('transport_stations').select('*');
    if (governorate) query = query.eq('governorate', governorate);
    const { data, error } = await query;
    if (error) return [];
    return data;
  },

  getNearbyServices: async (governorate?: string) => {
    let query = supabase.from('nearby_services').select('*');
    if (governorate) query = query.eq('governorate', governorate);
    const { data, error } = await query;
    if (error) return [];
    return data;
  },

  getNeighborhoodCompetitions: async () => {
    const { data, error } = await supabase.from('neighborhood_competitions').select('*').order('total_points', { ascending: false });
    if (error) return [];
    return data;
  },

  getRewardsCatalog: async () => {
    const { data, error } = await supabase.from('rewards_catalog').select('*').eq('is_active', true);
    if (error) return [];
    return data;
  },

  optimizeBill: async (sector: string, currentBill: number) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    // Simulated optimization logic
    const savings = currentBill * 0.15;
    const recommendations = [
      "Switch to LED bulbs",
      "Unplug devices when not in use",
      "Use energy-efficient appliances"
    ];

    const { data, error } = await supabase
      .from('bill_optimizations')
      .insert([{
        user_id: user.id,
        sector,
        current_bill: currentBill,
        target_savings: savings,
        recommendations
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getEnergyConfig: async () => {
    const { data, error } = await supabase.from('app_config').select('value').eq('key', 'egypt_energy_config').single();
    if (error || !data) return null;
    return data.value;
  },

  saveEnergyConfig: async (config: any) => {
    const { data, error } = await supabase.from('app_config').upsert({ key: 'egypt_energy_config', value: config }).select();
    if (error) throw error;
    return data[0];
  },

  getEcoNews: async () => {
    const { data, error } = await supabase.from('eco_news').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },

  getCarbonHistoricalData: async (level: string, location: string) => {
    const { data, error } = await supabase
      .from('carbon_historical_data')
      .select('*')
      .eq('level', level)
      .eq('location', location)
      .order('year', { ascending: true });
    if (error) return [];
    return data;
  },

  getAllLocations: async (level: string) => {
    const { data, error } = await supabase
      .from('carbon_historical_data')
      .select('location')
      .eq('level', level);
    if (error) return [];
    return Array.from(new Set(data.map(d => d.location)));
  },

  addCarbonHistoricalData: async (record: any) => {
    const { data, error } = await supabase.from('carbon_historical_data').insert([record]).select();
    if (error) throw error;
    return data[0];
  },

  deleteCarbonHistoricalData: async (id: string) => {
    const { error } = await supabase.from('carbon_historical_data').delete().eq('id', id);
    if (error) throw error;
  },

  submitEcoNews: async (newsData: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    const { data, error } = await supabase
      .from('eco_news')
      .insert([{
        ...newsData,
        author_id: user.id,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getEcoEvents: async () => {
    const { data, error } = await supabase.from('eco_events').select('*').order('event_date', { ascending: true });
    if (error) return [];
    return data;
  },

  getDonations: async () => {
    const { data, error } = await supabase.from('donations').select('*').eq('status', 'available').order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },

  createDonation: async (item: { item_name: string, category: string, description: string }) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    const { data, error } = await supabase
      .from('donations')
      .insert([{
        ...item,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getCommunityGardens: async () => {
    return await storageService.robustRequest('community_gardens', async () => {
      const { data, error } = await supabase.from('community_gardens').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    });
  },

  saveCommunityGarden: async (garden: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");
    
    const { data, error } = await supabase
      .from('community_gardens')
      .insert([{ 
        ...garden, 
        created_by: user.id,
        members_count: 1,
        status: 'Active' 
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  joinGarden: async (gardenId: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    // Optional: add to a members table if it exists, for now we increment the count or award points
    await storageService.awardPoints(user.id, 50, 'Joined Community Garden', 'community');
    
    // Attempt to increment member count
    const { data: garden } = await supabase.from('community_gardens').select('members_count').eq('id', gardenId).single();
    if (garden) {
      await supabase.from('community_gardens').update({ members_count: (garden.members_count || 0) + 1 }).eq('id', gardenId);
    }
    
    return true;
  },

  getGreenJobs: async () => {
    return await storageService.robustRequest('green_jobs', async () => {
      const { data, error } = await supabase.from('green_jobs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    });
  },

  applyToJob: async (jobId: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    const { error } = await supabase
      .from('job_applications')
      .insert([{
        job_id: jobId,
        user_id: user.id,
        status: 'applied',
        created_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    
    await storageService.awardPoints(user.id, 10, 'Applied for Green Job', 'jobs');
    return true;
  },

  getDigitalCollectibles: async () => {
    const { data, error } = await supabase.from('digital_collectibles').select('*');
    if (error) return [];
    return data;
  },

  getUserCollectibles: async () => {
    const user = storageService.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('user_collectibles')
      .select('*, collectible:collectible_id(*)')
      .eq('user_id', user.id);
    if (error) return [];
    return data;
  },

  getDailyStreak: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('streak_count, last_mission_date')
      .eq('id', userId)
      .single();
    if (error) return 0;
    return data.streak_count || 0;
  },

  incrementDailyStreak: async (userId: string) => {
    const user = storageService.getUser();
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    const lastDate = user.last_mission_date ? user.last_mission_date.split('T')[0] : null;
    
    if (lastDate === today) return; // Already incremented today

    let newStreak = (user.streak_count || 0) + 1;
    
    // Check if streak was broken (more than 1 day gap)
    if (lastDate) {
      const last = new Date(lastDate);
      const current = new Date(today);
      const diff = (current.getTime() - last.getTime()) / (1000 * 3600 * 24);
      if (diff > 1) newStreak = 1;
    }

    const { error } = await supabase
      .from('users')
      .update({ 
        streak_count: newStreak,
        last_mission_date: today
      })
      .eq('id', userId);
    
    if (!error) {
      storageService.saveUser({ ...user, streak_count: newStreak, last_mission_date: today });
    }
  },

  getMeterVerifications: async () => {
    const user = storageService.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('meter_verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data;
  },

  getInteractiveStories: async () => {
    const { data, error } = await supabase.from('interactive_stories').select('*');
    if (error) return [];
    return data;
  },

  getStoryChapters: async (storyId: string) => {
    const { data, error } = await supabase
      .from('story_chapters')
      .select('*')
      .eq('story_id', storyId)
      .order('chapter_number', { ascending: true });
    if (error) return [];
    return data;
  },

  createEcoEvent: async (event: any) => {
    const { data, error } = await supabase.from('eco_events').insert([{ ...event, status: 'approved' }]).select();
    if (error) throw error;
    return data[0];
  },

  deleteEcoEvent: async (id: string) => {
    const { error } = await supabase.from('eco_events').delete().eq('id', id);
    if (error) throw error;
  },

  createStoryChapter: async (chapter: any) => {
    const { data, error } = await supabase.from('story_chapters').insert([chapter]).select();
    if (error) throw error;
    return data[0];
  },

  updateStoryProgress: async (storyId: string, currentChapter: number, isCompleted: boolean = false) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    const { data, error } = await supabase
      .from('user_story_progress')
      .upsert({
        user_id: user.id,
        story_id: storyId,
        current_chapter: currentChapter,
        is_completed: isCompleted,
        last_played_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- Family System ---
  getFamilies: async () => {
    const { data, error } = await supabase
      .from('families')
      .select('*, family_members(count)')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data.map(f => ({
      ...f,
      member_count: f.family_members?.[0]?.count || 0
    }));
  },

  deleteFamily: async (id: string) => {
    const { error } = await supabase.from('families').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Notifications System ---
  getNotifications: async (userId?: string) => {
    const user = storageService.getUser();
    const targetId = userId || user?.id;
    if (!targetId) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${targetId},user_id.is.null`)
      .order('created_at', { ascending: false });
    if (error) return [];
    
    // Map database fields to UI fields if necessary, or just return as is
    return data;
  },

  createNotification: async (userId: string, titleAr: string, titleEn: string, bodyAr: string, bodyEn: string, type: string = 'info') => {
    const { error } = await supabase
      .from('notifications')
      .insert([{ 
        user_id: userId, 
        title_ar: titleAr, 
        title_en: titleEn, 
        body_ar: bodyAr, 
        body_en: bodyEn, 
        type, 
        is_read: false 
      }]);
    if (error) console.error("Failed to create notification:", error);
  },

  markNotificationAsRead: async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  },

  // --- Purchase System ---
  purchaseProduct: async (productId: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) throw new Error("Product not found");

    const price = product.price;
    if (user.greenCoins < price) throw new Error("Insufficient green coins");

    // 1. Deduct coins
    await storageService.updateUserPoints(user.id, 0, -price);

    // 2. Create purchase record
    const { data: purchase, error } = await supabase
      .from('purchases')
      .insert([{
        user_id: user.id,
        product_id: productId,
        price_paid: price,
        status: 'completed'
      }])
      .select()
      .single();

    if (error) throw error;

    // 3. Notify user
    await storageService.createNotification(
      user.id,
      'تمت عملية الشراء!',
      'Purchase Successful!',
      `لقد اشتريت ${product.name_ar || product.name} مقابل ${price} عملة خضراء.`,
      `You purchased ${product.name_en || product.name} for ${price} Green Coins.`,
      'purchase'
    );

    return purchase;
  },
  updateUserLocation: async (lat: number, lng: number) => {
    const user = storageService.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update({ latitude: lat, longitude: lng })
      .eq('id', user.id);

    if (!error) {
      storageService.saveUser({ ...user, latitude: lat, longitude: lng });
    }
  },

  getNearbyUsers: async (lat: number, lng: number, radiusKm: number = 5) => {
    // Simple bounding box for nearby users
    const latDiff = radiusKm / 111;
    const lngDiff = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, points, latitude, longitude')
      .gte('latitude', lat - latDiff)
      .lte('latitude', lat + latDiff)
      .gte('longitude', lng - lngDiff)
      .lte('longitude', lng + lngDiff);

    if (error) return [];
    return data;
  },


  submitMeterVerification: async (meterId: string, documentUrl: string, notes?: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    // Check for existing pending verification to prevent duplicates
    const { data: existing } = await supabase
      .from('meter_verifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('meter_id', meterId)
      .eq('status', 'pending')
      .single();

    if (existing) throw new Error("You already have a pending verification for this meter");

    const { data, error } = await supabase
      .from('meter_verifications')
      .insert({
        user_id: user.id,
        meter_id: meterId,
        document_url: documentUrl,
        notes,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  linkToUtilityProvider: async (meterId: string, providerId: string, accountId: string, metadata: any = {}) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    // Simulate a real API call to a utility provider
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { error } = await supabase
      .from('utility_meters')
      .update({ 
        is_verified: true,
        provider_linked: true,
        provider_id: providerId,
        provider_account_id: accountId,
        metadata: metadata
      })
      .eq('id', meterId);

    if (error) throw error;

    await storageService.createNotification(
      user.id,
      'تم ربط مزود الخدمة',
      'Utility Provider Linked',
      `تم ربط عدادك بنجاح مع ${providerId}.`,
      `Your meter has been successfully linked to ${providerId}.`,
      'success'
    );

    return true;
  },

  // --- Seeding System ---
  seedInitialData: async () => {
    try {
      const user = storageService.getUser();
      if (!user) return;

      // Only perform essential structural checks if needed, but DO NOT insert mock/dummy data
      console.log("[StorageService] System ready. Dynamic data will be fetched from Supabase.");

      return true;
    } catch (error) {
      console.error("Initialization error:", error);
      return false;
    }
  },

  getAllConfigs: async () => {
    const { data, error } = await supabase
      .from('app_config')
      .select('*');
    
    if (error) return [];
    return data;
  },

  updateConfig: async (key: string, value: any) => {
    const { error } = await supabase
      .from('app_config')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    
    if (error) throw error;
    return true;
  },

  redeemReward: async (rewardId: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    const { data: reward, error: rewardError } = await supabase
      .from('rewards_catalog')
      .select('*')
      .eq('id', rewardId)
      .single();

    if (rewardError || !reward) throw new Error("Reward not found");
    
    const cost = reward.coins_cost || reward.points_cost || 0;
    if (user.greenCoins < cost) throw new Error("Insufficient Green Coins");

    const { data: redemption, error } = await supabase
      .from('user_redemptions')
      .insert([{
        user_id: user.id,
        reward_id: rewardId,
        status: 'pending',
        redemption_code: Date.now().toString(36).toUpperCase()
      }])
      .select()
      .single();

    if (error) throw error;

    // Deduct coins
    await storageService.updateUserPoints(user.id, 0, -cost);
    
    const updatedUser = { ...user, greenCoins: user.greenCoins - cost };
    storageService.saveUser(updatedUser);

    return redemption;
  },

  bookTransportTicket: async (ticket: {
    lineId: string;
    fromStation: string;
    toStation: string;
    price: number;
    type: string;
  }) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    if (user.greenCoins < ticket.price) {
      throw new Error("Insufficient Green Coins");
    }

    const { data, error } = await supabase
      .from('transport_tickets')
      .insert([{
        user_id: user.id,
        line_id: ticket.lineId,
        from_station: ticket.fromStation,
        to_station: ticket.toStation,
        price: ticket.price,
        type: ticket.type,
        status: 'active',
        qr_code: `TICKET-${Date.now().toString(36).toUpperCase()}`
      }])
      .select()
      .single();

    if (error) throw error;

    // Deduct coins
    await storageService.updateUserPoints(user.id, 0, -ticket.price);

    return data;
  },

  investInProject: async (investment: {
    projectId: string;
    amount: number;
    projectTitle: string;
  }) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");

    // In this app, we might use EGP or Green Coins. 
    // Let's assume Green Coins for "virtual" investment as requested.
    if (user.greenCoins < investment.amount) {
      throw new Error("Insufficient Green Coins for this investment");
    }

    const { data, error } = await supabase
      .from('user_investments')
      .insert([{
        user_id: user.id,
        project_id: investment.projectId,
        amount: investment.amount,
        project_title: investment.projectTitle,
        status: 'active',
        invested_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Deduct coins
    await storageService.updateUserPoints(user.id, 0, -investment.amount);

    return data;
  },

  seedInitialGovData: async () => {
    console.log("[StorageService] seedInitialGovData called - skipping to enforce real data only.");
    return;
  },

  // --- Ride Sharing ---
  getRideShares: async (filters?: { lineId?: string, fromStationId?: string, toStationId?: string, status?: string }) => {
    let query = supabase
      .from('ride_shares')
      .select(`
        *,
        users:user_id(full_name, avatar_url),
        line:line_id(name_ar, name_en, type),
        from_station:from_station_id(name_ar, name_en),
        to_station:to_station_id(name_ar, name_en)
      `)
      .order('departure_time', { ascending: true });

    if (filters?.lineId) query = query.eq('line_id', filters.lineId);
    if (filters?.fromStationId) query = query.eq('from_station_id', filters.fromStationId);
    if (filters?.toStationId) query = query.eq('to_station_id', filters.toStationId);
    if (filters?.status) query = query.eq('status', filters.status);
    else query = query.eq('status', 'active');

    const { data, error } = await query;
    if (error) return [];
    return data;
  },

  createRideShare: async (ride: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");
    const { data, error } = await supabase
      .from('ride_shares')
      .insert([{ ...ride, user_id: user.id }])
      .select();
    if (error) throw error;
    return data[0];
  },

  joinRideShare: async (rideId: string) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");
    
    // Check if already joined
    const { data: existing } = await supabase
      .from('ride_share_participants')
      .select('id')
      .eq('ride_id', rideId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existing) throw new Error("Already joined this ride");

    // Check availability
    const { data: ride } = await supabase
      .from('ride_shares')
      .select('seats_available')
      .eq('id', rideId)
      .single();
    
    if (!ride || ride.seats_available <= 0) throw new Error("No seats available");

    // Add participant
    const { error: joinError } = await supabase
      .from('ride_share_participants')
      .insert([{ ride_id: rideId, user_id: user.id }]);
    
    if (joinError) throw joinError;

    // Update seats
    const { error: updateError } = await supabase
      .from('ride_shares')
      .update({ 
        seats_available: ride.seats_available - 1,
        status: ride.seats_available - 1 === 0 ? 'full' : 'active'
      })
      .eq('id', rideId);
    
    if (updateError) throw updateError;

    return true;
  },

  // --- Transport Schedules ---
  getTransportSchedules: async (lineId: string, stationId?: string) => {
    let query = supabase
      .from('transport_schedules')
      .select(`
        *,
        line:line_id(name_ar, name_en),
        station:station_id(name_ar, name_en)
      `)
      .eq('line_id', lineId)
      .order('arrival_time', { ascending: true });

    if (stationId) query = query.eq('station_id', stationId);

    const { data, error } = await query;
    if (error) return [];
    return data;
  },

  // --- Enhanced Alerts & News ---
  getRealTimeAlerts: async (filters?: { governorateId?: string, severity?: string }) => {
    let query = supabase
      .from('real_time_alerts')
      .select(`
        *,
        governorate:governorate_id(name_ar, name_en)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (filters?.governorateId) query = query.eq('governorate_id', filters.governorateId);
    if (filters?.severity) query = query.eq('severity', filters.severity);

    const { data, error } = await query;
    if (error) return [];
    return data;
  },

  getEnhancedEcoNews: async (category?: string) => {
    let query = supabase
      .from('eco_news')
      .select('*')
      .order('published_at', { ascending: false });

    if (category && category !== 'all') query = query.eq('category', category);

    const { data, error } = await query;
    if (error) return [];
    return data;
  },

  // --- Super App Services ---
  createDigitalPOA: async (poaData: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");
    const { data, error } = await supabase
      .from('digital_poas')
      .insert([{ ...poaData, grantor_id: user.id, status: 'Pending' }])
      .select();
    if (error) throw error;
    return data[0];
  },

  submitLegalQuery: async (queryData: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");
    const { data, error } = await supabase
      .from('legal_queries')
      .insert([{ ...queryData, user_id: user.id, status: 'Open' }])
      .select();
    if (error) throw error;
    return data[0];
  },

  createEmergencyAlert: async (alert: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");
    const { data, error } = await supabase
      .from('emergency_alerts')
      .insert([{ ...alert, user_id: user.id }])
      .select();
    if (error) throw error;
    return data[0];
  },

  getEmergencyAlerts: async (lat: number, lng: number, radiusKm: number = 5) => {
    // In a real app, we'd use PostGIS for radius search
    const { data, error } = await supabase
      .from('emergency_alerts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },

  createGameya: async (gameya: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");
    const { data, error } = await supabase
      .from('gameyas')
      .insert([{ ...gameya, creator_id: user.id, status: 'Active' }])
      .select();
    if (error) throw error;
    return data[0];
  },

  reportWaterIssue: async (issue: any) => {
    return await storageService.saveEnvironmentalReport({
      ...issue,
      category: 'water'
    });
  },

  listPantryItem: async (item: any) => {
    const user = storageService.getUser();
    if (!user) throw new Error("User not logged in");
    const { data, error } = await supabase
      .from('pantry_items')
      .insert([{ ...item, owner_id: user.id, status: 'Available' }])
      .select();
    if (error) throw error;
    return data[0];
  },

  getPantryItems: async () => {
    const { data, error } = await supabase
      .from('pantry_items')
      .select('*, users:owner_id(full_name)')
      .eq('status', 'Available')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },

  // --- App Strings ---
  getAppStrings: async () => {
    return await storageService.robustRequest('app_strings', async () => {
      const { data, error } = await supabase
        .from('app_strings')
        .select('*');
      if (error) throw error;
      return data || [];
    }, { timeout: 3000, retries: 1 }) || [];
  },

  saveAppString: async (stringData: any) => {
    const { error } = await supabase
      .from('app_strings')
      .upsert(stringData, { onConflict: 'string_key' });
    if (error) throw error;
  },

  // --- Coupons (Egyptian Sources) ---
  getCoupons: async (category?: string) => {
    let query = supabase.from('coupons').select('*').eq('status', 'active');
    if (category && category !== 'All') query = query.eq('category', category);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },

  saveCoupon: async (coupon: any) => {
    const { error } = await supabase.from('coupons').upsert(coupon);
    if (error) throw error;
  },

  deleteCoupon: async (id: string) => {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Favorites ---
  toggleFavorite: async (userId: string, itemId: string, itemType: 'coupon' | 'news') => {
    const { data: existing } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .eq('item_type', itemType)
      .maybeSingle();

    if (existing) {
      await supabase.from('user_favorites').delete().eq('id', existing.id);
      return false;
    } else {
      await supabase.from('user_favorites').insert({ user_id: userId, item_id: itemId, item_type: itemType });
      return true;
    }
  },

  getFavorites: async (userId: string, itemType: 'coupon' | 'news') => {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('item_id')
      .eq('user_id', userId)
      .eq('item_type', itemType);
    if (error) return [];
    return data.map(f => f.item_id);
  },

  // --- Notifications ---
  sendNotification: async (notification: any) => {
    const { error } = await supabase.from('notifications').insert(notification);
    if (error) throw error;
  },

  logAdminAction: async (action: string, table: string, targetId: string, details: any) => {
    try {
      const user = storageService.getUser();
      if (!user) return;
      
      await supabase.from('admin_logs').insert({
        admin_id: user.id,
        action,
        table_name: table,
        target_id: targetId,
        change_data: details,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.error("Admin logging failed", e);
    }
  },

  updatePrice: async (id: string, price: number) => {
    const { error } = await supabase.from('prices').update({ price }).eq('id', id);
    if (error) throw error;
    await storageService.logAdminAction('UPDATE_PRICE', 'prices', id, { newPrice: price });
  },

  banUser: async (userId: string, reason: string) => {
    const { error } = await supabase.from('users').update({ is_banned: true, ban_reason: reason }).eq('id', userId);
    if (error) throw error;
    await storageService.logAdminAction('BAN_USER', 'users', userId, { reason });
  },

  triggerGlobalSync: async () => {
    try {
      const response = await fetch('/api/system/sync-all', { method: 'POST' });
      const data = await response.json();
      return data;
    } catch (e) {
      console.error("Global sync trigger failed:", e);
      throw e;
    }
  },

  seedUserData: async (userId: string) => {
    try {
      const response = await fetch('/api/user/seed-personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      return await response.json();
    } catch (e) {
      console.error("User seeding failed:", e);
    }
  }
};
