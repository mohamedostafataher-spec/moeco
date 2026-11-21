
import { supabase } from './supabaseClient';
import { storageService } from './storageService';

/**
 * Internal API Layer
 * Reads from Master Database (Supabase)
 * Supports Role-Based Access & Logging
 */
export const internalApiService = {
  logAccess: async (endpoint: string, role: string) => {
    try {
      await supabase.from('api_logs').insert({
        endpoint,
        role,
        status: 'SUCCESS'
      });
    } catch (err) {
      console.warn("Could not write API log to Supabase", err);
    }
  },

  getUserData: async (userId: string, role: string) => {
    await internalApiService.logAccess('/api/user/data', role);
    const { data: user, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error || !user) return { error: 'User not found' };
    
    // Anonymize if not admin
    if (role !== 'Admin') {
      return {
        id: btoa(user.id).substring(0, 12),
        governorate: user.governorate,
        points: user.points
      };
    }
    return user;
  },

  getMonthlyData: async (month: number, year: number, role: string) => {
    await internalApiService.logAccess('/api/monthly/data', role);
    const analytics = (await storageService.getGovAnalytics()) as any[];
    if (!analytics) return [];
    return analytics.map(g => ({
      governorate: g.governorate,
      co2: (g.avgKwh * g.userCount * 0.53).toFixed(2),
      bill: g.avgBill
    }));
  },

  getAnnualData: async (year: number, role: string) => {
    await internalApiService.logAccess('/api/annual/data', role);
    const analytics = (await storageService.getGovAnalytics()) as any[];
    if (!analytics) return [];
    return analytics.map(g => ({
      governorate: g.governorate,
      annual_co2: (g.avgKwh * g.userCount * 12 * 0.53).toFixed(2),
      growth: "1.5%"
    }));
  },

  getProvinceIndicators: async (province: string, role: string) => {
    await internalApiService.logAccess('/api/province/indicators', role);
    const analytics = (await storageService.getGovAnalytics()) as any[];
    if (!analytics) return { error: 'No data' };
    const gov = analytics.find(g => g.governorate === province);
    if (!gov) return { error: 'Province not found' };
    return {
      stress_index: (gov.stressLevel / 100).toFixed(2),
      energy_poverty: (gov.avgBill / 5000).toFixed(3),
      sustainability_score: (100 - gov.stressLevel).toFixed(0)
    };
  },

  getGovernmentReports: async (role: string) => {
    if (role !== 'Government' && role !== 'Admin') return { error: 'Unauthorized' };
    await internalApiService.logAccess('/api/government/reports', role);
    return [
      { id: 'REP-001', title: 'National Energy Efficiency 2025', date: '2025-12-01' },
      { id: 'REP-002', title: 'Governorate Waste Management Audit', date: '2026-01-15' }
    ];
  },

  getForecast: async (province: string, role: string) => {
    await internalApiService.logAccess('/api/forecast', role);
    return {
      next_month_bill: "+2.4%",
      five_year_co2: "+12.5%",
      risk_level: "Moderate"
    };
  }
};
