
export type Language = 'ar' | 'en';

export interface Country {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  currency: string;
}

export interface Governorate {
  id: string;
  countryId: string;
  nameAr: string;
  nameEn: string;
}

export interface City {
  id: string;
  governorateId: string;
  nameAr: string;
  nameEn: string;
}

export interface Sector {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  unit: string;
}

export type UserRole = 'citizen' | 'sector_admin' | 'gov_admin' | 'supervisor';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string; 
  countryId: string;
  governorateId: string;
  cityId: string;
  familySize: number;
  points: number;
  greenCoins: number; 
  rank: number;
  tier: 'Seed' | 'Sprout' | 'Tree' | 'Forest';
  badges: string[];
  socialBracket: 'low' | 'middle' | 'high' | 'elite';
  role?: UserRole;
  bio?: string;
  phone?: string;
  city?: string;
  cover_url?: string;
  password?: string;
  familyId?: string;
  governorate?: string;
  level?: number;
  experience_points?: number;
  avatar_url?: string;
  streak_count?: number;
  last_mission_date?: string;
  latitude?: number;
  longitude?: number;
  isVerified?: boolean;
  font_size?: number;
  high_contrast?: boolean;
  language?: string;
  theme?: string;
}

export interface GISFeature {
  id: string;
  name_ar: string;
  name_en: string;
  category: 'Transport' | 'GovService' | 'EcoPoint' | 'Utility' | 'EmissionZone';
  sub_category: string;
  geometry: any; // GeoJSON
  properties: any;
  created_at?: string;
  updated_at?: string;
}

export interface UserPath {
  id: string;
  user_id: string;
  path_geometry: any; // GeoJSON LineString
  distance_km: number;
  duration_minutes: number;
  carbon_impact_kg: number;
  transport_mode: 'Walking' | 'Cycling' | 'PublicTransport';
  created_at?: string;
}

export interface SpatialAnalysis {
  id: string;
  region_name: string;
  analysis_type: 'PopulationDensity' | 'ServiceDensity' | 'EmissionDensity';
  value: number;
  geometry: any; // GeoJSON Polygon
  created_at?: string;
}

export interface GeofenceZone {
  id: string;
  name_ar: string;
  name_en: string;
  zone_type: 'Danger' | 'Eco' | 'Service';
  geometry: any; // GeoJSON Polygon or Circle
  alert_message_ar?: string;
  alert_message_en?: string;
  created_at?: string;
}

export interface UtilityMeter {
  id: string;
  user_id: string;
  type: 'electricity' | 'water' | 'gas';
  meter_number: string;
  initial_reading: number;
  is_estimated?: boolean;
  estimation_method?: 'average' | 'shared' | 'informal';
  created_at?: string;
}

export interface UtilityReading {
  id: string;
  meter_id: string;
  user_id: string;
  reading_value: number;
  consumption: number;
  cost: number;
  co2_impact: number;
  photo_url?: string;
  reading_date: string;
  is_verified: boolean;
  created_at?: string;
}

export interface WalkingActivity {
  id: string;
  user_id: string;
  distance_km: number;
  start_point?: string;
  end_point?: string;
  calories: number;
  co2_saved: number;
  points_earned: number;
  created_at: string;
}

export interface Alert {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  severity_score: number;
  latitude?: number;
  longitude?: number;
  city?: string;
  governorate?: string;
  country?: string;
  source: string;
  source_url?: string;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  published_at: string;
  metadata?: any;
}

export interface Family {
  id: string;
  name: string;
  members: string[]; // User IDs
  totalPoints: number;
  challenges: {
    id: string;
    targetReduction: number; // percentage
    status: 'active' | 'completed' | 'failed';
    startDate: string;
  }[];
}

export type GovRole = 'Admin' | 'Official' | 'Researcher';

export interface GovUser {
  id: string;
  country: string;
  role: GovRole;
  lastLogin: number;
}

export interface GovAuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: number;
  ip?: string;
}

export interface GovDecision {
  id: string;
  title: string;
  content: string;
  isEncrypted: boolean;
  sector: string;
  timestamp: number;
}

export interface GovMetrics {
  topRegions: { name: string; value: number }[];
  riskGrowth: { name: string; rate: number }[];
  energyPovertyIndex: number;
  demandForecast: { year: number; energy: number; water: number; gas: number }[];
  strategicIndicators: {
    carbonIntensity: number;
    sustainabilityScore: number;
    sdgTracking: number;
  };
}

export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical' | 'Extreme Emergency' | 'Danger' | 'Important';

export type SectorType = 
  | 'Energy' 
  | 'Electricity' 
  | 'Water' 
  | 'Gas'
  | 'Transport' 
  | 'Waste' 
  | 'Agriculture' 
  | 'Health' 
  | 'Education' 
  | 'Economy' 
  | 'Digital' 
  | 'Disaster' 
  | 'Aviation' 
  | 'Food'
  | 'Fires'
  | 'Earthquake'
  | 'Floods'
  | 'Security'
  | 'Environment'
  | 'Tech'
  | 'Fuel';

export type AlertCategory = 
  | 'Weather' 
  | 'Outage' 
  | 'Pollution' 
  | 'Traffic' 
  | 'Carbon' 
  | 'Health' 
  | 'Disaster' 
  | 'Security';

export interface GovernmentService {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  category: string;
  url: string;
  icon: string;
  carbon_impact_kg: number;
  carbon_impact_type: 'digital' | 'transport' | 'paper' | 'energy';
  steps: { step: number; text_ar: string; text_en: string; duration: number }[];
  required_documents: { name_ar: string; name_en: string; type: string }[];
  fees: { name_ar: string; name_en: string; amount: number }[];
  office_locations: { name: string; lat: number; lng: number; address?: string; accuracy?: number }[];
  working_hours?: string;
  phone?: string;
  request_template_ar?: string;
  request_template_en?: string;
}

export interface EcoAlert {
  id: string;
  title: { ar: string; en: string };
  message: { ar: string; en: string };
  severity: AlertSeverity;
  severityScore?: number;
  category: string;
  sectorImpact?: string;
  affectedPopulation?: number;
  co2Impact?: number;
  instructions: { ar: string; en: string };
  location?: any;
  timestamp?: number | string;
  created_at: string;
  governorate?: string;
  source: { name: string; url: string };
  isRealTime?: boolean;
}

export interface HazardData {
  city: string;
  hazardType: string;
  probability: number; // 0-1
  estimatedImpact: number; // 0-100
}

export interface EnergyPriceConfig {
  electricity: {
    tiers: { min: number; max: number; price: number; serviceCharge: number }[];
  };
  gas: {
    tiers: { min: number; max: number; price: number }[];
  };
  water: {
    tiers: { min: number; max: number; price: number }[];
    wasteWaterPercent: number;
  };
  fuel: {
    petrol92: number;
    petrol95: number;
    diesel: number;
  };
  lastUpdated: string;
}

export interface GovMetric {
  governorate: string;
  month: string;
  avgElectricityBill: number;
  avgGasBill: number;
  totalUsers: number;
  stressLevel: number; // 0-100
}

export interface EcoProduct {
  id: string;
  sellerId: string;
  sellerName: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  price: string;
  category: string;
  image: string;
  points: number;
  description: string;
  timestamp: number;
}

export interface BillRecord {
  id?: string;
  user_id: string;
  sector: 'electricity' | 'water' | 'gas';
  previous_reading: number;
  current_reading: number;
  consumption: number;
  bill_amount: number;
  tier: string;
  carbon_footprint: number;
  created_at?: string;
}

export interface TransportLog {
  id?: string;
  user_id: string;
  origin: string;
  destination: string;
  distance_km: number;
  duration_minutes: number;
  transport_type: 'car' | 'metro' | 'bus';
  carbon_footprint: number;
  cost: number;
  created_at?: string;
}

export interface CarbonActivity {
  id?: string;
  user_id: string;
  activity_type: string;
  sector: string;
  value: number;
  carbon_impact: number;
  metadata?: any;
  created_at?: string;
}

export interface EmissionRecord {
  id: string;
  userId: string;
  date: string;
  type: string;
  sector?: string;
  value: number; 
  co2: number;
  co2_impact?: number;
  co2_saved?: number;
  consumption: number;
  unit: string;
  cost: number;
  currency: string;
  timestamp: string;
  details: any;
  Sector?: Sector;
  location?: {
    country: string;
    governorate: string;
    city: string;
  };
  // Estimation & Verification
  status?: 'Actual' | 'Estimated - Shared' | 'Estimated - Informal' | 'Estimated - Average';
  method?: string;
  methodAr?: string;
  flagged?: boolean;
  reason?: string;
  reasonAr?: string;
  householdMembers?: number;
  rooms?: number;
  areaType?: 'formal' | 'informal';
  lat?: number;
  lng?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isAi?: boolean;
}

export interface Challenge {
  id: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  points: number;
  icon: string;
  progress: number;
  category: 'daily' | 'epic' | 'community';
}
