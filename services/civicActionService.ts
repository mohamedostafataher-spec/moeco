import { supabase } from './supabaseClient';

export type ReportCategory =
  | 'water_leak'
  | 'waste_pile'
  | 'waste_burning'
  | 'daytime_lighting'
  | 'heat_no_shade'
  | 'other';

export type ReportStatus =
  | 'draft'
  | 'received'
  | 'under_review'
  | 'referred_to_partner'
  | 'verified_resolved'
  | 'unverifiable';

export type VerificationStatus = 'logged' | 'needs_review' | 'verified';

export interface CivicReport {
  id: string;
  userId: string;
  reporterDisplayName?: string;
  isAnonymous: boolean;
  category: ReportCategory;
  title: string;
  description: string;
  area: string;
  governorate: string;
  shareLocationConsent: boolean;
  latitude?: number;
  longitude?: number;
  // Public rounded coordinates (~1km zone) so exact location is never exposed publicly
  publicLat?: number;
  publicLng?: number;
  sharePhotoConsent: boolean;
  photoUrl?: string;
  status: ReportStatus;
  verificationLevel: VerificationStatus;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
  closedAt?: string;
  isDemo?: boolean;
  distinctIssueConfirmed?: boolean;
  note?: string;
}

export interface LocalInitiative {
  id: string;
  title: string;
  description: string;
  area: string;
  governorate: string;
  category: 'water' | 'waste' | 'heat_shade' | 'awareness';
  status: 'proposed' | 'coordinating' | 'in_progress' | 'verified';
  participantsCount: number;
  joinedByMe?: boolean;
  isDemo: boolean;
  lastUpdated: string;
}

export type SurplusStatus = 'available' | 'reserved' | 'picked_up' | 'expired';

export interface SurplusOffer {
  id: string;
  partnerName: string;
  partnerType: 'bakery' | 'store' | 'restaurant';
  foodType: string;
  quantityAvailable?: string;
  pickupWindow: string;
  expiresAt: string;
  areaRange: string;
  priceText: string;
  isDonation: boolean;
  pickupTerms: string;
  status: SurplusStatus;
  isVerifiedPartner: boolean;
  isDemo: boolean;
  reservedByMe?: boolean;
}

export type HeatIssueType = 'extreme_heat' | 'lack_of_shade' | 'exposed_waiting_area' | 'low_greenery';
export type InitiativeStatus = 'proposed' | 'coordinating' | 'in_progress' | 'verified';

export interface HeatShadePoint {
  id: string;
  area: string;
  governorate: string;
  issueType: HeatIssueType;
  description: string;
  suggestedIntervention: 'add_canopy' | 'improve_waiting_station' | 'conditional_tree_planting' | 'reflective_surface';
  suitabilityNote: string;
  initiativeStatus: InitiativeStatus;
  zoneLat: number;
  zoneLng: number;
  reportsCount: number;
  createdAt: string;
  isDemo: boolean;
}

export interface RecyclingPoint {
  id: string;
  name: string;
  area: string;
  governorate: string;
  acceptedMaterials: string[];
  workingHours: string;
  contactInfo?: string;
  isDemo: boolean;
  isVerifiedPartner: boolean;
}

export interface RecyclingLog {
  id: string;
  userId: string;
  pointId: string;
  pointName: string;
  material: 'pet_plastic' | 'cardboard_paper' | 'aluminum_metal' | 'glass' | 'ewaste';
  weightKg: number;
  isDocumented: boolean;
  receiptNote?: string;
  estimatedCo2SavedKg: number;
  factorUsed: number;
  factorSource: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export interface CivicChallenge {
  id: string;
  title: string;
  description: string;
  actionType: 'verified_report' | 'recycling_delivery' | 'local_campaign' | 'initiative_followup';
  symbolicPoints: number;
  verifiedPoints: number;
  verificationRule: string;
  cooldownHours: number;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  evidenceSummary: string;
  referenceId?: string;
  status: VerificationStatus;
  symbolicPointsAwarded: number;
  verifiedPointsAwarded: number;
  submittedAt: string;
}

const STORAGE_KEYS = {
  REPORTS: 'moeco_civic_reports_v1',
  INITIATIVES: 'moeco_local_initiatives_v1',
  SURPLUS: 'moeco_surplus_offers_v1',
  HEAT_POINTS: 'moeco_heat_shade_v1',
  RECYCLING_LOGS: 'moeco_recycling_logs_v1',
  CHALLENGE_SUBS: 'moeco_challenge_subs_v1',
};

export const REPORT_CATEGORY_META: Record<
  ReportCategory,
  { labelAr: string; labelEn: string; color: string; bg: string }
> = {
  water_leak: {
    labelAr: 'تسريب مياه',
    labelEn: 'Water Leak',
    color: 'text-sky-400',
    bg: 'bg-sky-500/15',
  },
  waste_pile: {
    labelAr: 'تراكم مخلفات أو حاوية ممتلئة',
    labelEn: 'Waste Accumulation / Full Bin',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
  },
  waste_burning: {
    labelAr: 'حرق مخلفات',
    labelEn: 'Waste Burning',
    color: 'text-rose-400',
    bg: 'bg-rose-500/15',
  },
  daytime_lighting: {
    labelAr: 'إنارة عامة تعمل نهارًا',
    labelEn: 'Daytime Public Lighting',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/15',
  },
  heat_no_shade: {
    labelAr: 'موقع شديد الحرارة أو يفتقر إلى الظل',
    labelEn: 'Extreme Heat / No Shade',
    color: 'text-orange-400',
    bg: 'bg-orange-500/15',
  },
  other: {
    labelAr: 'مشكلة بيئية أخرى',
    labelEn: 'Other Environmental Issue',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
  },
};

export const REPORT_STATUS_META: Record<
  ReportStatus,
  { labelAr: string; labelEn: string; badgeClass: string; isOpen: boolean }
> = {
  draft: {
    labelAr: 'مسودة',
    labelEn: 'Draft',
    badgeClass: 'bg-slate-700/60 text-slate-200 border-slate-500/40',
    isOpen: true,
  },
  received: {
    labelAr: 'تم الاستلام',
    labelEn: 'Received',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-400/40',
    isOpen: true,
  },
  under_review: {
    labelAr: 'قيد المراجعة',
    labelEn: 'Under Review',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-400/40',
    isOpen: true,
  },
  referred_to_partner: {
    labelAr: 'أُحيل إلى شريك',
    labelEn: 'Referred to Partner',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/40',
    isOpen: true,
  },
  verified_resolved: {
    labelAr: 'تم التحقق من الحل',
    labelEn: 'Verified Resolved',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40',
    isOpen: false,
  },
  unverifiable: {
    labelAr: 'تعذّر التحقق',
    labelEn: 'Could Not Verify',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-400/40',
    isOpen: false,
  },
};

export const RECYCLING_MATERIAL_META: Record<
  RecyclingLog['material'],
  { labelAr: string; factorKgCo2PerKg: number; source: string }
> = {
  pet_plastic: {
    labelAr: 'بلاستيك (PET / عبوات)',
    factorKgCo2PerKg: 1.5,
    source: 'متوسط معامل التدوير التقديري (EPA WARM / WMRA)',
  },
  cardboard_paper: {
    labelAr: 'كرتون وورق',
    factorKgCo2PerKg: 0.9,
    source: 'متوسط معامل التدوير التقديري (EPA WARM / WMRA)',
  },
  aluminum_metal: {
    labelAr: 'ألومنيوم ومعادن',
    factorKgCo2PerKg: 8.0,
    source: 'متوسط معامل التدوير التقديري (EPA WARM)',
  },
  glass: {
    labelAr: 'زجاج',
    factorKgCo2PerKg: 0.3,
    source: 'متوسط معامل التدوير التقديري (EPA WARM)',
  },
  ewaste: {
    labelAr: 'مخلفات إلكترونية صغيرة',
    factorKgCo2PerKg: 1.2,
    source: 'متوسط استرشادي للمكونات القابلة للاستخلاص',
  },
};

export const roundPublicCoord = (coord?: number): number | undefined => {
  if (typeof coord !== 'number' || Number.isNaN(coord)) return undefined;
  return Math.round(coord * 100) / 100; // ~1.1 km zone precision
};

const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const SEED_DEMO_REPORTS: CivicReport[] = [
  {
    id: 'demo-rep-1',
    userId: 'demo-community-1',
    reporterDisplayName: 'مشارك مجتمعي',
    isAnonymous: true,
    category: 'water_leak',
    title: 'تسريب مياه مستمر بجوار محطة مترو دار السلام',
    description: 'تسريب ظاهر من وصلة مياه فرعية على الرصيف منذ الصباح.',
    area: 'دار السلام',
    governorate: 'القاهرة',
    shareLocationConsent: true,
    publicLat: 30.01,
    publicLng: 31.24,
    sharePhotoConsent: false,
    status: 'under_review',
    verificationLevel: 'needs_review',
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    isDemo: true,
  },
  {
    id: 'demo-rep-2',
    userId: 'demo-community-2',
    reporterDisplayName: 'أحمد م.',
    isAnonymous: false,
    category: 'waste_pile',
    title: 'حاوية مخلفات ممتلئة تحتاج تفريغًا',
    description: 'تراكم أكياس بجوار نقطة التجميع في شارع فرعي قرب السوق.',
    area: 'الدقي',
    governorate: 'الجيزة',
    shareLocationConsent: true,
    publicLat: 30.04,
    publicLng: 31.21,
    sharePhotoConsent: false,
    status: 'received',
    verificationLevel: 'logged',
    createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    isDemo: true,
  },
  {
    id: 'demo-rep-3',
    userId: 'demo-community-3',
    reporterDisplayName: 'مشارك مجتمعي',
    isAnonymous: true,
    category: 'daytime_lighting',
    title: 'أعمدة إنارة تعمل نهارًا على الكورنيش الفرعي',
    description: '4 أعمدة إنارة مضاءة في منتصف النهار.',
    area: 'سيدي جابر',
    governorate: 'الإسكندرية',
    shareLocationConsent: true,
    publicLat: 31.22,
    publicLng: 29.94,
    sharePhotoConsent: false,
    status: 'referred_to_partner',
    verificationLevel: 'needs_review',
    createdAt: new Date(Date.now() - 50 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    isDemo: true,
  },
  {
    id: 'demo-rep-4',
    userId: 'demo-community-4',
    reporterDisplayName: 'مشارك مجتمعي',
    isAnonymous: true,
    category: 'heat_no_shade',
    title: 'موقف انتظار حافلات مكشوف للشمس ظهراً',
    description: 'منطقة انتظار مكتظة بالركاب ولا يوجد أي تظليل أو أشجار قريبة.',
    area: 'مدينة نصر',
    governorate: 'القاهرة',
    shareLocationConsent: true,
    publicLat: 30.06,
    publicLng: 31.34,
    sharePhotoConsent: false,
    status: 'under_review',
    verificationLevel: 'needs_review',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
    isDemo: true,
  },
];

const SEED_DEMO_INITIATIVES: LocalInitiative[] = [
  {
    id: 'init-1',
    title: 'مبادرة تظليل موقف انتظار مدينة نصر',
    description: 'تقييم تركيب مظلة خفيفة ومقاعد انتظار مناسبة للرصيف بالتنسيق مع جمعية أهلية محلية.',
    area: 'مدينة نصر',
    governorate: 'القاهرة',
    category: 'heat_shade',
    status: 'proposed',
    participantsCount: 14,
    isDemo: true,
    lastUpdated: '2026-05-01',
  },
  {
    id: 'init-2',
    title: 'حملة رصد وإصلاح التسريبات المنزلية - الدقي',
    description: 'توزيع منشورات توعية وفحص الحنفيات والأدوات الموفرة في المباني السكنية بمشاركة متطوعين.',
    area: 'الدقي',
    governorate: 'الجيزة',
    category: 'water',
    status: 'coordinating',
    participantsCount: 22,
    isDemo: true,
    lastUpdated: '2026-05-03',
  },
  {
    id: 'init-3',
    title: 'يوم فرز البلاستيك والكرتون المجتمعي',
    description: 'تجميع أسبوعي للمواد المفروزة وتسليمها لمركز فرز محلي مع توثيق الأوزان.',
    area: 'المعادي',
    governorate: 'القاهرة',
    category: 'waste',
    status: 'in_progress',
    participantsCount: 31,
    isDemo: true,
    lastUpdated: '2026-05-05',
  },
];

const SEED_SURPLUS_OFFERS: SurplusOffer[] = [
  {
    id: 'surplus-1',
    partnerName: 'مخبز النيل البلدي (نموذج تجريبي)',
    partnerType: 'bakery',
    foodType: 'خبز بلدي وفينو طازج متبقي من إنتاج اليوم',
    quantityAvailable: '8 عبوات (تقديري)',
    pickupWindow: 'اليوم 8:30 م - 10:00 م',
    expiresAt: 'اليوم 10:00 م',
    areaRange: 'نطاق المعادي - قرب ميدان الحرية',
    priceText: 'تبرع مجاني للأسر أو 15 ج.م للعبوة',
    isDonation: true,
    pickupTerms: 'الاستلام الشخصي بالحضور في الموعد المحدد مع إحضار كيس قابل لإعادة الاستخدام.',
    status: 'available',
    isVerifiedPartner: false,
    isDemo: true,
  },
  {
    id: 'surplus-2',
    partnerName: 'سوق الخضار المحلي - الدقي (نموذج تجريبي)',
    partnerType: 'store',
    foodType: 'صندوق خضروات وفاكهة صالحة للاستهلاك المباشر',
    quantityAvailable: '5 صناديق',
    pickupWindow: 'اليوم 6:00 م - 8:30 م',
    expiresAt: 'اليوم 8:30 م',
    areaRange: 'نطاق الدقي - محيط شارع التحرير',
    priceText: '25 ج.م (بدل 65 ج.م)',
    isDonation: false,
    pickupTerms: 'يفضّل الاستهلاك خلال 24 ساعة. الفحص الظاهري عند الاستلام مسؤولية المستلم والعارض.',
    status: 'available',
    isVerifiedPartner: false,
    isDemo: true,
  },
  {
    id: 'surplus-3',
    partnerName: 'مطعم البيت المصري (نموذج تجريبي)',
    partnerType: 'restaurant',
    foodType: 'وجبات أرز وخضار مطهوة لم تُقدّم',
    quantityAvailable: 'غير محددة بدقة (بحد أقصى 6 وجبات)',
    pickupWindow: 'اليوم 9:30 م - 10:30 م',
    expiresAt: 'اليوم 10:30 م',
    areaRange: 'نطاق مصر الجديدة - قرب روكسي',
    priceText: 'تبرع مجاني',
    isDonation: true,
    pickupTerms: 'الالتزام بالاستلام قبل الإغلاق؛ الوجبات محفوظة ساخنة وحتى نفاد الكمية.',
    status: 'reserved',
    isVerifiedPartner: false,
    isDemo: true,
  },
  {
    id: 'surplus-4',
    partnerName: 'مخبز الحلواني (نموذج تجريبي)',
    partnerType: 'bakery',
    foodType: 'مخبوزات صباحية وباتيه',
    quantityAvailable: '0 (نفدت الكمية)',
    pickupWindow: 'أمس 9:00 م - 10:00 م',
    expiresAt: 'انتهى العرض',
    areaRange: 'نطاق سيدي جابر - الإسكندرية',
    priceText: '20 ج.م',
    isDonation: false,
    pickupTerms: 'انتهت فترة الاستلام.',
    status: 'expired',
    isVerifiedPartner: false,
    isDemo: true,
  },
];

const SEED_HEAT_POINTS: HeatShadePoint[] = [
  {
    id: 'heat-1',
    area: 'مدينة نصر - محور مصطفى النحاس',
    governorate: 'القاهرة',
    issueType: 'exposed_waiting_area',
    description: 'موقف انتظار مواصلات عام مكشوف بالكامل دون مظلة أو شجر قريب في ساعات الذروة.',
    suggestedIntervention: 'add_canopy',
    suitabilityNote: 'الأولوية لتركيب مظلة انتظار خفيفة؛ الرصيف ضيق وتحته كابلات مرافق قد تمنع الحفر للتشجير.',
    initiativeStatus: 'proposed',
    zoneLat: 30.06,
    zoneLng: 31.34,
    reportsCount: 6,
    createdAt: '2026-05-01',
    isDemo: true,
  },
  {
    id: 'heat-2',
    area: 'الجيزة - ميدان الجيزة',
    governorate: 'الجيزة',
    issueType: 'extreme_heat',
    description: 'تجمع أسفلتي مرتفع الحرارة نهاراً للمشاة عند نقاط العبور.',
    suggestedIntervention: 'improve_waiting_station',
    suitabilityNote: 'يحتاج تقييم هندسي للتهوية والظل؛ التشجير المباشر غير مناسب في الجزيرة المرورية الوسطى.',
    initiativeStatus: 'coordinating',
    zoneLat: 30.01,
    zoneLng: 31.21,
    reportsCount: 9,
    createdAt: '2026-04-28',
    isDemo: true,
  },
  {
    id: 'heat-3',
    area: 'المعادي - محيط شارع 9',
    governorate: 'القاهرة',
    issueType: 'low_greenery',
    description: 'فجوة ظل في مقطع مشاة مفتوح رغم وجود أرصفة عريضة نسبياً.',
    suggestedIntervention: 'conditional_tree_planting',
    suitabilityNote: 'موقع مرشح للتشجير بشرط التأكد من عدم تعارضه مع خطوط المياه والكهرباء وتحديد جهة للري.',
    initiativeStatus: 'in_progress',
    zoneLat: 29.96,
    zoneLng: 31.26,
    reportsCount: 4,
    createdAt: '2026-04-22',
    isDemo: true,
  },
  {
    id: 'heat-4',
    area: 'الإسكندرية - محطة مصر',
    governorate: 'الإسكندرية',
    issueType: 'lack_of_shade',
    description: 'ساحة انتظار مفتوحة دون حماية كافية من الشمس والرياح.',
    suggestedIntervention: 'add_canopy',
    suitabilityNote: 'مظلات مقاومة للرطوبة والرياح الساحلية أفضل من الأشجار في الساحة المبلطة.',
    initiativeStatus: 'proposed',
    zoneLat: 31.19,
    zoneLng: 29.91,
    reportsCount: 5,
    createdAt: '2026-05-04',
    isDemo: true,
  },
];

export const DEMO_RECYCLING_POINTS: RecyclingPoint[] = [
  {
    id: 'rec-pt-1',
    name: 'نقطة فرز مجتمعية - المعادي (نقطة تجريبية)',
    area: 'المعادي',
    governorate: 'القاهرة',
    acceptedMaterials: ['بلاستيك (PET)', 'كرتون وورق', 'ألومنيوم'],
    workingHours: 'يومياً 10:00 ص - 6:00 م (عدا الجمعة)',
    contactInfo: 'متاح عبر التطوع المحلي فقط (بيانات عرض تجريبية)',
    isDemo: true,
    isVerifiedPartner: false,
  },
  {
    id: 'rec-pt-2',
    name: 'مركز تجميع الورق والبلاستيك - الدقي (نقطة تجريبية)',
    area: 'الدقي',
    governorate: 'الجيزة',
    acceptedMaterials: ['كرتون وورق', 'بلاستيك (PET)', 'زجاج'],
    workingHours: 'السبت - الخميس 9:00 ص - 5:00 م',
    contactInfo: 'غير متاح حالياً',
    isDemo: true,
    isVerifiedPartner: false,
  },
  {
    id: 'rec-pt-3',
    name: 'نقطة فرز إلكترونيات ومعادن - مدينة نصر (نقطة تجريبية)',
    area: 'مدينة نصر',
    governorate: 'القاهرة',
    acceptedMaterials: ['مخلفات إلكترونية صغيرة', 'ألومنيوم ومعادن'],
    workingHours: 'الخميس والسبت 11:00 ص - 4:00 م',
    contactInfo: 'غير متاح حالياً',
    isDemo: true,
    isVerifiedPartner: false,
  },
  {
    id: 'rec-pt-4',
    name: 'نقطة فرز سيدي جابر - الإسكندرية (نقطة تجريبية)',
    area: 'سيدي جابر',
    governorate: 'الإسكندرية',
    acceptedMaterials: ['بلاستيك (PET)', 'كرتون وورق', 'ألومنيوم'],
    workingHours: '10:00 ص - 5:00 م',
    contactInfo: 'غير متاح حالياً',
    isDemo: true,
    isVerifiedPartner: false,
  },
];

export const REAL_IMPACT_CHALLENGES: CivicChallenge[] = [
  {
    id: 'chg-verified-report',
    title: 'توثيق مشكلة بيئية حقيقية ومراجعتها',
    description: 'قدّم بلاغاً بيئياً بوصف دقيق ومنطقة واضحة. لا تُمنح النقاط المؤكدة عند الإرسال بل بعد مراجعة البلاغ والتحقق منه.',
    actionType: 'verified_report',
    symbolicPoints: 5,
    verifiedPoints: 40,
    verificationRule: 'يتحول من «بحاجة إلى مراجعة» إلى «تم التحقق» عند مراجعة البلاغ واعتماده.',
    cooldownHours: 12,
  },
  {
    id: 'chg-recycling-handover',
    title: 'تسليم مواد قابلة للتدوير لنقطة جمع',
    description: 'سجّل وزن المواد المفروزة المُسلّمة لنقطة تجميع. بدون إيصال أو وزن موثق تُمنح شارة مشاركة رمزية فقط.',
    actionType: 'recycling_delivery',
    symbolicPoints: 5,
    verifiedPoints: 50,
    verificationRule: 'يشترط تسجيل تسليم موثق بوزن حقيقي ومعامل أثر معلوم لحساب النقاط المؤكدة.',
    cooldownHours: 24,
  },
  {
    id: 'chg-local-campaign',
    title: 'المشاركة في مبادرة أو حملة محلية',
    description: 'انضم إلى مبادرة محلية لترشيد المياه أو التظليل أو النظافة في منطقتك ووثّق مشاركتك.',
    actionType: 'local_campaign',
    symbolicPoints: 10,
    verifiedPoints: 60,
    verificationRule: 'تأكيد الحضور أو المشاركة من منسق المبادرة.',
    cooldownHours: 24,
  },
  {
    id: 'chg-initiative-followup',
    title: 'متابعة مبادرة حتى إغلاقها والتحقق من الحل',
    description: 'تابع بلاغاً أو مبادرة من مرحلة المقترح/المراجعة وحتى توثيق إغلاقها.',
    actionType: 'initiative_followup',
    symbolicPoints: 5,
    verifiedPoints: 75,
    verificationRule: 'يرتبط بحالة «تم التحقق من الحل» على بلاغ أو مبادرة متابَعة.',
    cooldownHours: 48,
  },
];

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, val: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('LocalStorage write warning:', e);
  }
};

export const civicActionService = {
  // --- 1. Environmental Reports ---
  getAllReports: async (): Promise<CivicReport[]> => {
    const localReports = readJson<CivicReport[]>(STORAGE_KEYS.REPORTS, []);
    const mergedMap = new Map<string, CivicReport>();

    // Include clearly-badged demo baseline reports first
    for (const demo of SEED_DEMO_REPORTS) {
      mergedMap.set(demo.id, demo);
    }
    // Override or append user's local/saved reports
    for (const rep of localReports) {
      mergedMap.set(rep.id, rep);
    }

    // Best-effort read from Supabase if available
    try {
      const { data, error } = await supabase
        .from('environmental_reports')
        .select('id, user_id, category, title, description, location_lat, location_lng, photo_url, status, created_at')
        .order('created_at', { ascending: false })
        .limit(25);
      if (!error && Array.isArray(data)) {
        for (const row of data) {
          if (!mergedMap.has(row.id)) {
            const mappedCategory: ReportCategory =
              row.category === 'water' || row.category === 'water_pollution'
                ? 'water_leak'
                : row.category === 'garbage' || row.category === 'trash'
                  ? 'waste_pile'
                  : row.category === 'burning'
                    ? 'waste_burning'
                    : 'other';
            const mappedStatus: ReportStatus =
              row.status === 'verified' ? 'verified_resolved' : 'received';
            mergedMap.set(row.id, {
              id: row.id,
              userId: row.user_id || 'community',
              reporterDisplayName: 'مشارك',
              isAnonymous: true,
              category: mappedCategory,
              title: row.title || REPORT_CATEGORY_META[mappedCategory].labelAr,
              description: row.description || '',
              area: 'نطاق عام',
              governorate: 'مصر',
              shareLocationConsent: Boolean(row.location_lat && row.location_lng),
              publicLat: roundPublicCoord(row.location_lat),
              publicLng: roundPublicCoord(row.location_lng),
              sharePhotoConsent: Boolean(row.photo_url),
              photoUrl: row.photo_url,
              status: mappedStatus,
              verificationLevel: row.status === 'verified' ? 'verified' : 'logged',
              createdAt: row.created_at || new Date().toISOString(),
              updatedAt: row.created_at || new Date().toISOString(),
              isDemo: false,
            });
          }
        }
      }
    } catch {
      // Offline or unconfigured Supabase fallback silently uses local+demo
    }

    return Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  findNearbySimilarReport: async (
    category: ReportCategory,
    area: string,
    lat?: number,
    lng?: number
  ): Promise<CivicReport | null> => {
    const reports = await civicActionService.getAllReports();
    const openReports = reports.filter((r) => REPORT_STATUS_META[r.status]?.isOpen);
    const normalizedArea = area.trim().toLowerCase();

    for (const r of openReports) {
      if (r.category !== category) continue;

      if (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        typeof r.publicLat === 'number' &&
        typeof r.publicLng === 'number'
      ) {
        const dist = haversineMeters(lat, lng, r.publicLat, r.publicLng);
        if (dist <= 300) return r;
      }

      if (normalizedArea && r.area.trim().toLowerCase() === normalizedArea) {
        const ageHours = (Date.now() - new Date(r.createdAt).getTime()) / 3600000;
        if (ageHours <= 72) return r;
      }
    }
    return null;
  },

  submitReport: async (input: {
    userId: string;
    userName?: string;
    category: ReportCategory;
    title: string;
    description: string;
    area: string;
    governorate: string;
    shareLocationConsent: boolean;
    latitude?: number;
    longitude?: number;
    sharePhotoConsent: boolean;
    photoUrl?: string;
    isAnonymous: boolean;
    asDraft?: boolean;
    distinctIssueConfirmed?: boolean;
  }): Promise<CivicReport> => {
    const now = new Date().toISOString();
    const id = `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const report: CivicReport = {
      id,
      userId: input.userId,
      reporterDisplayName: input.isAnonymous ? 'مستخدم مجهول' : input.userName || 'مشارك',
      isAnonymous: input.isAnonymous,
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      area: input.area.trim(),
      governorate: input.governorate.trim() || 'القاهرة',
      shareLocationConsent: input.shareLocationConsent,
      latitude: input.shareLocationConsent ? input.latitude : undefined,
      longitude: input.shareLocationConsent ? input.longitude : undefined,
      publicLat: input.shareLocationConsent ? roundPublicCoord(input.latitude) : undefined,
      publicLng: input.shareLocationConsent ? roundPublicCoord(input.longitude) : undefined,
      sharePhotoConsent: input.sharePhotoConsent,
      photoUrl: input.sharePhotoConsent ? input.photoUrl : undefined,
      status: input.asDraft ? 'draft' : 'received',
      verificationLevel: input.asDraft ? 'logged' : 'needs_review',
      createdAt: now,
      updatedAt: now,
      isDemo: true,
      distinctIssueConfirmed: input.distinctIssueConfirmed,
    };

    const existing = readJson<CivicReport[]>(STORAGE_KEYS.REPORTS, []);
    writeJson(STORAGE_KEYS.REPORTS, [report, ...existing]);

    // If heat_no_shade, also reflect in Heat & Shade Map local points
    if (!input.asDraft && input.category === 'heat_no_shade') {
      const existingHeat = readJson<HeatShadePoint[]>(STORAGE_KEYS.HEAT_POINTS, []);
      const newPoint: HeatShadePoint = {
        id: `heat-rep-${id}`,
        area: `${input.governorate} - ${input.area}`,
        governorate: input.governorate,
        issueType: 'lack_of_shade',
        description: input.description,
        suggestedIntervention: 'add_canopy',
        suitabilityNote: 'بلاغ مواطن بانتظار تقييم ميداني لتحديد أنسب تدخل (مظلة أو تشجير مشروط).',
        initiativeStatus: 'proposed',
        zoneLat: report.publicLat || 30.04,
        zoneLng: report.publicLng || 31.23,
        reportsCount: 1,
        createdAt: now.split('T')[0],
        isDemo: true,
      };
      writeJson(STORAGE_KEYS.HEAT_POINTS, [newPoint, ...existingHeat]);
    }

    // Best-effort non-blocking save to Supabase when not draft and user isn't guest
    if (!input.asDraft && input.userId && !input.userId.startsWith('guest')) {
      try {
        await supabase.from('environmental_reports').insert([
          {
            user_id: input.userId,
            category: input.category,
            title: report.title,
            description: report.description,
            location_lat: report.publicLat ?? 30.04,
            location_lng: report.publicLng ?? 31.23,
            photo_url: report.photoUrl || null,
            status: 'pending',
          },
        ]);
      } catch {
        // Local storage already persisted safely
      }
    }

    return report;
  },

  publishDraftReport: async (id: string): Promise<CivicReport | null> => {
    const existing = readJson<CivicReport[]>(STORAGE_KEYS.REPORTS, []);
    let updated: CivicReport | null = null;
    const next = existing.map((r) => {
      if (r.id === id && r.status === 'draft') {
        updated = {
          ...r,
          status: 'received',
          verificationLevel: 'needs_review',
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }
      return r;
    });
    writeJson(STORAGE_KEYS.REPORTS, next);
    return updated;
  },

  anonymizeReport: async (id: string): Promise<void> => {
    const existing = readJson<CivicReport[]>(STORAGE_KEYS.REPORTS, []);
    const next = existing.map((r) =>
      r.id === id
        ? {
            ...r,
            isAnonymous: true,
            reporterDisplayName: 'مستخدم مجهول',
            latitude: undefined,
            longitude: undefined,
            sharePhotoConsent: false,
            photoUrl: undefined,
            updatedAt: new Date().toISOString(),
          }
        : r
    );
    writeJson(STORAGE_KEYS.REPORTS, next);
  },

  deleteReport: async (id: string): Promise<void> => {
    const existing = readJson<CivicReport[]>(STORAGE_KEYS.REPORTS, []);
    writeJson(
      STORAGE_KEYS.REPORTS,
      existing.filter((r) => r.id !== id)
    );
  },

  // --- 2. Local Monitor & Initiatives ---
  getInitiatives: (): LocalInitiative[] => {
    const saved = readJson<LocalInitiative[] | null>(STORAGE_KEYS.INITIATIVES, null);
    if (!saved || saved.length === 0) {
      writeJson(STORAGE_KEYS.INITIATIVES, SEED_DEMO_INITIATIVES);
      return SEED_DEMO_INITIATIVES;
    }
    return saved;
  },

  toggleJoinInitiative: (id: string): LocalInitiative[] => {
    const list = civicActionService.getInitiatives();
    const updated = list.map((item) => {
      if (item.id !== id) return item;
      const joined = !item.joinedByMe;
      return {
        ...item,
        joinedByMe: joined,
        participantsCount: Math.max(0, item.participantsCount + (joined ? 1 : -1)),
      };
    });
    writeJson(STORAGE_KEYS.INITIATIVES, updated);
    return updated;
  },

  getLocalMonitorMetrics: async (includeDemo: boolean) => {
    const all = await civicActionService.getAllReports();
    const reports = includeDemo ? all : all.filter((r) => !r.isDemo);

    const byCategory: Record<string, number> = {};
    const byGovernorate: Record<string, number> = {};
    let openCount = 0;
    let closedCount = 0;
    const responseDurationsHours: number[] = [];

    for (const r of reports) {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
      const gov = r.governorate || 'غير محدد';
      byGovernorate[gov] = (byGovernorate[gov] || 0) + 1;

      if (r.status !== 'draft') {
        if (REPORT_STATUS_META[r.status]?.isOpen) openCount += 1;
        else closedCount += 1;
      }

      if (r.respondedAt && r.createdAt) {
        const diffHours =
          (new Date(r.respondedAt).getTime() - new Date(r.createdAt).getTime()) / 3600000;
        if (diffHours >= 0) responseDurationsHours.push(diffHours);
      }
    }

    const topIssues = Object.entries(byCategory)
      .map(([category, count]) => ({
        category: category as ReportCategory,
        label: REPORT_CATEGORY_META[category as ReportCategory]?.labelAr || category,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const byRegionList = Object.entries(byGovernorate)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalReports: reports.length,
      openCount,
      closedCount,
      hasResponseTimestamps: responseDurationsHours.length > 0,
      avgResponseHours:
        responseDurationsHours.length > 0
          ? Number(
              (
                responseDurationsHours.reduce((s, v) => s + v, 0) /
                responseDurationsHours.length
              ).toFixed(1)
            )
          : null,
      topIssues,
      byRegionList,
      hasDemoData: reports.some((r) => r.isDemo),
    };
  },

  // --- 3. Surplus Food (Demo) ---
  getSurplusOffers: (): SurplusOffer[] => {
    const saved = readJson<SurplusOffer[] | null>(STORAGE_KEYS.SURPLUS, null);
    if (!saved || saved.length === 0) {
      writeJson(STORAGE_KEYS.SURPLUS, SEED_SURPLUS_OFFERS);
      return SEED_SURPLUS_OFFERS;
    }
    return saved;
  },

  toggleDemoSurplusReservation: (id: string): SurplusOffer[] => {
    const offers = civicActionService.getSurplusOffers();
    const updated = offers.map((o) => {
      if (o.id !== id) return o;
      if (o.status === 'expired' || o.status === 'picked_up') return o;
      if (o.reservedByMe) {
        return { ...o, status: 'available' as SurplusStatus, reservedByMe: false };
      }
      if (o.status === 'available') {
        return { ...o, status: 'reserved' as SurplusStatus, reservedByMe: true };
      }
      return o;
    });
    writeJson(STORAGE_KEYS.SURPLUS, updated);
    return updated;
  },

  markDemoSurplusPickedUp: (id: string): SurplusOffer[] => {
    const offers = civicActionService.getSurplusOffers();
    const updated = offers.map((o) =>
      o.id === id && o.reservedByMe ? { ...o, status: 'picked_up' as SurplusStatus } : o
    );
    writeJson(STORAGE_KEYS.SURPLUS, updated);
    return updated;
  },

  // --- 4. Heat & Shade Map ---
  getHeatShadePoints: (): HeatShadePoint[] => {
    const localAdded = readJson<HeatShadePoint[]>(STORAGE_KEYS.HEAT_POINTS, []);
    const map = new Map<string, HeatShadePoint>();
    for (const p of SEED_HEAT_POINTS) map.set(p.id, p);
    for (const p of localAdded) map.set(p.id, p);
    return Array.from(map.values());
  },

  // --- 5. Waste to Income ---
  getRecyclingLogs: (userId?: string): RecyclingLog[] => {
    const all = readJson<RecyclingLog[]>(STORAGE_KEYS.RECYCLING_LOGS, []);
    if (!userId) return all;
    return all.filter((l) => l.userId === userId);
  },

  addRecyclingLog: (input: {
    userId: string;
    pointId: string;
    pointName: string;
    material: RecyclingLog['material'];
    weightKg: number;
    isDocumented: boolean;
    receiptNote?: string;
  }): RecyclingLog => {
    const meta = RECYCLING_MATERIAL_META[input.material];
    const log: RecyclingLog = {
      id: `rec-${Date.now()}`,
      userId: input.userId,
      pointId: input.pointId,
      pointName: input.pointName,
      material: input.material,
      weightKg: input.weightKg,
      isDocumented: input.isDocumented,
      receiptNote: input.receiptNote?.trim() || undefined,
      estimatedCo2SavedKg: Number((input.weightKg * meta.factorKgCo2PerKg).toFixed(2)),
      factorUsed: meta.factorKgCo2PerKg,
      factorSource: meta.source,
      verificationStatus: input.isDocumented && input.receiptNote?.trim() ? 'needs_review' : 'logged',
      createdAt: new Date().toISOString(),
    };
    const existing = readJson<RecyclingLog[]>(STORAGE_KEYS.RECYCLING_LOGS, []);
    writeJson(STORAGE_KEYS.RECYCLING_LOGS, [log, ...existing]);
    return log;
  },

  // --- 6. Real-Impact Challenges & Anti-Abuse ---
  getChallengeSubmissions: (userId: string): ChallengeSubmission[] => {
    const all = readJson<ChallengeSubmission[]>(STORAGE_KEYS.CHALLENGE_SUBS, []);
    return all.filter((s) => s.userId === userId);
  },

  submitChallengeClaim: async (input: {
    userId: string;
    challenge: CivicChallenge;
    evidenceSummary: string;
    referenceId?: string;
  }): Promise<{ ok: boolean; message: string; submission?: ChallengeSubmission }> => {
    const all = readJson<ChallengeSubmission[]>(STORAGE_KEYS.CHALLENGE_SUBS, []);
    const userSubs = all.filter((s) => s.userId === input.userId && s.challengeId === input.challenge.id);

    // Anti-abuse cooldown check
    const latest = userSubs[0];
    if (latest) {
      const hoursSince = (Date.now() - new Date(latest.submittedAt).getTime()) / 3600000;
      if (hoursSince < input.challenge.cooldownHours) {
        const waitHrs = Math.ceil(input.challenge.cooldownHours - hoursSince);
        return {
          ok: false,
          message: `يرجى الانتظار ${waitHrs} ساعة قبل إرسال مطالبة جديدة لنفس التحدي لمنع التكرار.`,
        };
      }
    }

    // Verify real backing record where applicable
    let status: VerificationStatus = 'needs_review';
    let verifiedPointsAwarded = 0;

    if (input.challenge.actionType === 'verified_report') {
      const reports = await civicActionService.getAllReports();
      const myReports = reports.filter((r) => r.userId === input.userId && r.status !== 'draft');
      if (myReports.length === 0) {
        return {
          ok: false,
          message: 'يجب تقديم بلاغ بيئي فعلي أولاً من قسم «بلاغ بيئي» قبل المطالبة بهذا التحدي.',
        };
      }
      const hasVerified = myReports.some((r) => r.status === 'verified_resolved');
      if (hasVerified) {
        status = 'verified';
        verifiedPointsAwarded = input.challenge.verifiedPoints;
      }
    } else if (input.challenge.actionType === 'recycling_delivery') {
      const logs = civicActionService.getRecyclingLogs(input.userId);
      if (logs.length === 0) {
        return {
          ok: false,
          message: 'يجب تسجيل تسليم مواد من قسم «المخلفات إلى دخل» أولاً.',
        };
      }
    } else if (input.challenge.actionType === 'local_campaign') {
      const joined = civicActionService.getInitiatives().some((i) => i.joinedByMe);
      if (!joined) {
        return {
          ok: false,
          message: 'يرجى الانضمام إلى إحدى المبادرات المحلية أولاً في لوحة المتابعة المحلية.',
        };
      }
    } else if (input.challenge.actionType === 'initiative_followup') {
      const reports = await civicActionService.getAllReports();
      const resolved = reports.some(
        (r) => r.userId === input.userId && r.status === 'verified_resolved'
      );
      if (!resolved) {
        status = 'logged';
      } else {
        status = 'verified';
        verifiedPointsAwarded = input.challenge.verifiedPoints;
      }
    }

    const submission: ChallengeSubmission = {
      id: `sub-${Date.now()}`,
      challengeId: input.challenge.id,
      userId: input.userId,
      evidenceSummary: input.evidenceSummary.trim(),
      referenceId: input.referenceId,
      status,
      symbolicPointsAwarded: input.challenge.symbolicPoints,
      verifiedPointsAwarded,
      submittedAt: new Date().toISOString(),
    };

    writeJson(STORAGE_KEYS.CHALLENGE_SUBS, [submission, ...all]);
    return {
      ok: true,
      message:
        status === 'verified'
          ? `تم التحقق ومنح ${verifiedPointsAwarded} نقطة مؤكدة!`
          : `تم تسجيل المشاركة (${input.challenge.symbolicPoints} نقطة رمزية) وبحاجة إلى مراجعة قبل منح النقاط المؤكدة.`,
      submission,
    };
  },

  clearMyLocalCivicData: (userId: string) => {
    const reports = readJson<CivicReport[]>(STORAGE_KEYS.REPORTS, []);
    writeJson(
      STORAGE_KEYS.REPORTS,
      reports.filter((r) => r.userId !== userId)
    );
    const logs = readJson<RecyclingLog[]>(STORAGE_KEYS.RECYCLING_LOGS, []);
    writeJson(
      STORAGE_KEYS.RECYCLING_LOGS,
      logs.filter((l) => l.userId !== userId)
    );
    const subs = readJson<ChallengeSubmission[]>(STORAGE_KEYS.CHALLENGE_SUBS, []);
    writeJson(
      STORAGE_KEYS.CHALLENGE_SUBS,
      subs.filter((s) => s.userId !== userId)
    );
  },
};
