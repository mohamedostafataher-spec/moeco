import * as XLSX from 'xlsx';


export interface VerifiedChannelLink {
  label: string;
  labelEn?: string;
  url: string;
  sourceInRepo: string;
}


export interface LocalAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  addedAt: string;
}


export type UtilityServiceType = 'electricity' | 'water';
export type UtilityEntryKind = 'reading' | 'consumption';
export type UtilityDateMode = 'single_date' | 'billing_period';


export interface HomeUtilityRecord {
  id: string;
  userId: string;
  serviceType: UtilityServiceType;
  entryKind: UtilityEntryKind;
  value: number;
  unit: string;
  dateMode: UtilityDateMode;
  readingDate: string;
  periodStart?: string;
  periodEnd?: string;
  amountPaid?: number;
  currency?: string;
  personalNote?: string;
  attachment?: LocalAttachment;
  createdAt: string;
  updatedAt: string;
}


export type ComplaintCategoryId =
  | 'environment_waste'
  | 'water_sanitation'
  | 'electricity'
  | 'transport_rail'
  | 'consumer_protection'
  | 'other';


export type ComplaintLocalStatus =
  | 'draft_moeco'
  | 'opened_official_channel'
  | 'tracking_entered'
  | 'closed_by_user';


export interface ComplaintCategoryConfig {
  id: ComplaintCategoryId;
  labelAr: string;
  labelEn?: string;
  verifiedUrls: VerifiedChannelLink[];
  verifiedHotlines: { label: string; labelEn?: string; number: string; sourceInRepo: string }[];
  missingLinkNoticeAr?: string;
  missingLinkNoticeEn?: string;
}


export interface PersonalComplaint {
  id: string;
  userId: string;
  category: ComplaintCategoryId;
  title: string;
  description: string;
  areaOrAddress: string;
  incidentDateTime: string;
  attachment?: LocalAttachment;
  privateNotes?: string;
  locationConsentGiven: boolean;
  lat?: number;
  lng?: number;
  status: ComplaintLocalStatus;
  officialChannelOpenedAt?: string;
  officialChannelUrlUsed?: string;
  trackingNumber?: string;
  officialSubmittedDate?: string;
  officialEntityName?: string;
  followUpNotes?: string;
  reminderDateTime?: string;
  createdAt: string;
  updatedAt: string;
}


export interface VerifiedPublicProject {
  id: string;
  title: string;
  governorate: string;
  sector: string;
  statusText: string;
  sourceName: string;
  sourceUrl: string;
  lastUpdated?: string;
  budgetText?: string;
  completionPercent?: number;
}


export interface SavedPublicProjectNote {
  id: string;
  userId: string;
  projectId: string;
  projectTitle: string;
  sourceName: string;
  sourceUrl: string;
  personalNote: string;
  communitySuggestion?: string;
  reportedErrorNote?: string;
  reportedErrorTag?: 'ملاحظة مستخدم غير متحققة';
  updatedAt: string;
}


export const VERIFIED_UTILITY_PORTALS: Record<
  UtilityServiceType,
  {
    nameAr: string;
    portals: VerifiedChannelLink[];
    hotline: { number: string; label: string; sourceInRepo: string };
    co2Factor?: {
      value: number;
      unitRequired: string;
      formulaAr: string;
      sourceAr: string;
      sourceUrl: string;
      lastUpdate: string;
    };
  }
> = {
  electricity: {
    nameAr: 'الكهرباء',
    portals: [
      {
        label: 'المنصة الموحدة لخدمات الكهرباء',
        labelEn: 'Unified Electricity Services Platform',
        url: 'https://eservices.eehc.gov.eg',
        sourceInRepo: 'server/services/govEngine.ts',
      },
      {
        label: 'الشركة القابضة لكهرباء مصر',
        url: 'http://www.eehc.gov.eg',
        sourceInRepo: 'services/TransparencyCenter.ts',
      },
    ],
    hotline: {
      number: '121',
      label: 'طوارئ الكهرباء',
      sourceInRepo: 'pages/EmergencyServices.tsx',
    },
    co2Factor: {
      value: 0.533,
      unitRequired: 'kWh',
      formulaAr: 'الاستهلاك (kWh) × 0.533 كجم CO₂e (تقدير)',
      sourceAr: 'الشركة القابضة لكهرباء مصر / IPCC',
      sourceUrl: 'http://www.eehc.gov.eg',
      lastUpdate: '2026-01-15',
    },
  },
  water: {
    nameAr: 'المياه',
    portals: [
      {
        label: 'الشركة القابضة لمياه الشرب والصرف الصحي',
        labelEn: 'Holding Company for Water and Wastewater',
        url: 'https://www.hcww.com.eg',
        sourceInRepo: 'server/services/govEngine.ts & services/TransparencyCenter.ts',
      },
    ],
    hotline: {
      number: '125',
      label: 'طوارئ المياه',
      sourceInRepo: 'pages/EmergencyServices.tsx',
    },
    co2Factor: {
      value: 0.298,
      unitRequired: 'm³',
      formulaAr: 'الاستهلاك (m³) × 0.298 كجم CO₂e (تقدير)',
      sourceAr: 'الشركة القابضة لمياه الشرب والصرف الصحي',
      sourceUrl: 'https://www.hcww.com.eg',
      lastUpdate: '2025-12-10',
    },
  },
};


export const VERIFIED_COMPLAINT_CATEGORIES: ComplaintCategoryConfig[] = [
  {
    id: 'environment_waste',
    labelAr: 'البيئة أو المخلفات',
    labelEn: 'Environment or Waste',
    verifiedUrls: [
      {
        label: 'منظومة الشكاوى الحكومية الموحدة',
        labelEn: 'Unified Government Complaints Portal',
        url: 'https://www.shakwa.eg',
        sourceInRepo: 'server/services/govEngine.ts',
      },
    ],
    verifiedHotlines: [
      {
        label: 'خط شكاوى البيئة',
        labelEn: 'Environment complaints hotline',
        number: '19808',
        sourceInRepo: 'pages/EmergencyServices.tsx',
      },
    ],
  },
  {
    id: 'water_sanitation',
    labelAr: 'المياه أو الصرف',
    labelEn: 'Water or Sanitation',
    verifiedUrls: [
      {
        label: 'الشركة القابضة لمياه الشرب والصرف الصحي',
        labelEn: 'Holding Company for Water and Wastewater',
        url: 'https://www.hcww.com.eg',
        sourceInRepo: 'server/services/govEngine.ts & services/TransparencyCenter.ts',
      },
      {
        label: 'منظومة الشكاوى الحكومية الموحدة',
        labelEn: 'Unified Government Complaints Portal',
        url: 'https://www.shakwa.eg',
        sourceInRepo: 'server/services/govEngine.ts',
      },
    ],
    verifiedHotlines: [
      {
        label: 'طوارئ المياه',
        labelEn: 'Water emergencies',
        number: '125',
        sourceInRepo: 'pages/EmergencyServices.tsx',
      },
    ],
  },
  {
    id: 'electricity',
    labelAr: 'الكهرباء',
    labelEn: 'Electricity',
    verifiedUrls: [
      {
        label: 'المنصة الموحدة لخدمات الكهرباء',
        labelEn: 'Unified Electricity Services Platform',
        url: 'https://eservices.eehc.gov.eg',
        sourceInRepo: 'server/services/govEngine.ts',
      },
      {
        label: 'منظومة الشكاوى الحكومية الموحدة',
        labelEn: 'Unified Government Complaints Portal',
        url: 'https://www.shakwa.eg',
        sourceInRepo: 'server/services/govEngine.ts',
      },
    ],
    verifiedHotlines: [
      {
        label: 'طوارئ الكهرباء',
        labelEn: 'Electricity emergencies',
        number: '121',
        sourceInRepo: 'pages/EmergencyServices.tsx',
      },
    ],
  },
  {
    id: 'transport_rail',
    labelAr: 'النقل أو السكك الحديدية',
    labelEn: 'Transport or Railways',
    verifiedUrls: [
      {
        label: 'وزارة النقل',
        labelEn: 'Ministry of Transport',
        url: 'https://www.mot.gov.eg',
        sourceInRepo: 'server/services/govEngine.ts',
      },
      {
        label: 'الهيئة القومية لسكك حديد مصر',
        labelEn: 'Egyptian National Railways',
        url: 'https://enr.gov.eg',
        sourceInRepo: 'server/services/govEngine.ts',
      },
      {
        label: 'الشركة المصرية لإدارة وتشغيل المترو',
        labelEn: 'Egyptian Company for Metro Management',
        url: 'https://cairometro.gov.eg',
        sourceInRepo: 'server/services/govEngine.ts',
      },
      {
        label: 'منظومة الشكاوى الحكومية الموحدة',
        labelEn: 'Unified Government Complaints Portal',
        url: 'https://www.shakwa.eg',
        sourceInRepo: 'server/services/govEngine.ts',
      },
    ],
    verifiedHotlines: [],
  },
  {
    id: 'consumer_protection',
    labelAr: 'حماية المستهلك',
    labelEn: 'Consumer Protection',
    verifiedUrls: [],
    verifiedHotlines: [],
    missingLinkNoticeAr: 'لا يتوفر رابط رسمي موثق حاليًا',
    missingLinkNoticeEn: 'No verified official link is currently available',
  },
  {
    id: 'other',
    labelAr: 'أخرى',
    labelEn: 'Other',
    verifiedUrls: [],
    verifiedHotlines: [],
    missingLinkNoticeAr: 'لا يتوفر رابط رسمي موثق حاليًا',
    missingLinkNoticeEn: 'No verified official link is currently available',
  },
];


export const COMPLAINT_STATUS_LABELS: Record<ComplaintLocalStatus, string> = {
  draft_moeco: 'مسودة داخل MoEco',
  opened_official_channel: 'تم فتح القناة الرسمية',
  tracking_entered: 'أدخل المستخدم رقم متابعة',
  closed_by_user: 'أغلق المستخدم السجل',
};

export const COMPLAINT_STATUS_LABELS_EN: Record<ComplaintLocalStatus, string> = {
  draft_moeco: 'Draft inside MoEco',
  opened_official_channel: 'Official channel opened',
  tracking_entered: 'User entered a tracking number',
  closed_by_user: 'Record closed by user',
};


// Strictly verified public project dataset from codebase: none exists currently
export const VERIFIED_PUBLIC_PROJECTS: VerifiedPublicProject[] = [];


const BLOCKED_EXTENSIONS = new Set([
  'svg',
  'html',
  'htm',
  'js',
  'mjs',
  'cjs',
  'ts',
  'tsx',
  'jsx',
  'exe',
  'bat',
  'cmd',
  'sh',
  'msi',
  'php',
  'py',
  'xml',
]);


const MAX_ATTACHMENT_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB for localStorage safety


export function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}


export async function validateAndReadAttachment(
  file: File,
  options: { allowPdf?: boolean } = {},
): Promise<LocalAttachment> {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ext || BLOCKED_EXTENSIONS.has(ext)) {
    throw new Error('نوع الملف غير مسموح لأسباب أمنية. يُسمح فقط بصور JPG/PNG/WebP' + (options.allowPdf ? ' أو PDF.' : '.'));
  }


  const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedImageExts = ['jpg', 'jpeg', 'png', 'webp'];
  const isPdfAllowed = options.allowPdf === true;


  const mimeOk =
    allowedImageMimes.includes(file.type) ||
    (isPdfAllowed && file.type === 'application/pdf');
  const extOk =
    allowedImageExts.includes(ext) || (isPdfAllowed && ext === 'pdf');


  if (!mimeOk || !extOk) {
    throw new Error(
      isPdfAllowed
        ? 'يُرجى اختيار صورة (JPG, PNG, WebP) أو ملف PDF صالح فقط.'
        : 'يُرجى اختيار صورة صالحة بصيغة JPG أو PNG أو WebP فقط.',
    );
  }


  if (file.size <= 0 || file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error('حجم الملف يجب أن يكون أقل من 2 ميجابايت لحفظه بأمان محليًا.');
  }


  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('تعذرت قراءة الملف.'));
    };
    reader.onerror = () => reject(new Error('تعذرت قراءة الملف.'));
    reader.readAsDataURL(file);
  });


  return {
    id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    dataUrl,
    addedAt: new Date().toISOString(),
  };
}


// Pure client-side validation & export helpers (zero localStorage persistence of user records)
export function checkUtilityWarnings(
  existing: HomeUtilityRecord[],
  candidate: {
    serviceType: UtilityServiceType;
    value: number;
    unit: string;
    dateMode: UtilityDateMode;
    readingDate: string;
    periodStart?: string;
    periodEnd?: string;
  },
  editingId?: string,
): string[] {
  const warnings: string[] = [];


  if (candidate.dateMode === 'billing_period' && candidate.periodStart && candidate.periodEnd) {
    if (candidate.periodEnd < candidate.periodStart) {
      warnings.push('تاريخ نهاية الفترة أقدم من تاريخ البداية؛ يُرجى مراجعة التواريخ قبل الحفظ.');
    }
  }


  const sameService = existing.filter(
    (r) => r.id !== editingId && r.serviceType === candidate.serviceType,
  );


  if (candidate.readingDate && sameService.some((r) => r.readingDate === candidate.readingDate)) {
    warnings.push('يوجد سجل سابق لنفس الخدمة في هذا التاريخ. يمكنك الحفظ إذا كان متعمدًا، ولن يتم تعديل إدخالك تلقائيًا.');
  }


  if (
    candidate.dateMode === 'billing_period' &&
    candidate.periodStart &&
    candidate.periodEnd &&
    sameService.some(
      (r) =>
        r.dateMode === 'billing_period' &&
        r.periodStart &&
        r.periodEnd &&
        candidate.periodStart! <= r.periodEnd &&
        candidate.periodEnd! >= r.periodStart,
    )
  ) {
    warnings.push('الفترة المختارة تتداخل مع فترة مسجلة سابقًا لنفس الخدمة.');
  }


  if (candidate.value > 100000) {
    warnings.push('القيمة المدخلة كبيرة جدًا؛ تأكد من مطابقتها تمامًا للرقم الموجود في الفاتورة أو العداد.');
  }


  return warnings;
}


export interface ConsumptionTrendAnalysis {
  canCompare: boolean;
  reasonAr?: string;
  unit?: string;
  series: {
    id: string;
    label: string;
    value: number;
    entryKind: UtilityEntryKind;
    amountPaid?: number;
    currency?: string;
  }[];
  latestDelta?: number;
  mixedEntryKinds?: boolean;
}


export function analyzeUtilityTrend(
  records: HomeUtilityRecord[],
  serviceType: UtilityServiceType,
): ConsumptionTrendAnalysis {
  const scoped = records
    .filter((r) => r.serviceType === serviceType)
    .sort((a, b) => (a.readingDate || '').localeCompare(b.readingDate || ''));


  if (scoped.length < 2) {
    return {
      canCompare: false,
      reasonAr: 'يلزم توفر سجلين على الأقل لهذه الخدمة لإظهار مقارنة أو رسم بياني دون افتراضات.',
      series: [],
    };
  }


  const units = Array.from(new Set(scoped.map((r) => r.unit.trim()).filter(Boolean)));
  if (units.length !== 1) {
    return {
      canCompare: false,
      reasonAr: 'لا يمكن جمع أو مقارنة سجلات بوحدات قياس مختلفة. وحّد الوحدة بين السجلات لعرض المقارنة.',
      series: [],
    };
  }


  const kinds = new Set(scoped.map((r) => r.entryKind));
  const mixedEntryKinds = kinds.size > 1;
  const series = scoped.map((r) => ({
    id: r.id,
    label:
      r.dateMode === 'billing_period' && r.periodStart && r.periodEnd
        ? `${r.periodStart} → ${r.periodEnd}`
        : r.readingDate,
    value: r.value,
    entryKind: r.entryKind,
    amountPaid: r.amountPaid,
    currency: r.currency,
  }));


  const prev = series[series.length - 2];
  const curr = series[series.length - 1];
  const latestDelta = !mixedEntryKinds ? Number((curr.value - prev.value).toFixed(2)) : undefined;


  return {
    canCompare: !mixedEntryKinds,
    reasonAr: mixedEntryKinds
      ? 'توجد سجلات مختلطة بين "قراءة عداد" و"كمية استهلاك فترة"؛ لا يُحسب الاتجاه التلقائي منعًا للخلط.'
      : undefined,
    unit: units[0],
    series,
    latestDelta,
    mixedEntryKinds,
  };
}


function sanitizeExportCell(val: unknown): string {
  const s = val === undefined || val === null ? '' : String(val);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}


export function exportUtilityRecordsAsJson(records: HomeUtilityRecord[]): void {
  const sanitized = records.map(({ attachment, ...rest }) => ({
    ...rest,
    hasAttachment: Boolean(attachment),
    attachmentName: attachment?.name || null,
  }));
  const blob = new Blob([JSON.stringify(sanitized, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `moeco-my-home-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}


export function exportUtilityRecordsAsExcel(records: HomeUtilityRecord[]): void {
  const rows = records.map((r) => ({
    الخدمة: sanitizeExportCell(r.serviceType === 'electricity' ? 'كهرباء' : 'مياه'),
    'نوع الإدخال': sanitizeExportCell(r.entryKind === 'reading' ? 'قراءة عداد' : 'استهلاك فترة'),
    القيمة: r.value,
    الوحدة: sanitizeExportCell(r.unit),
    'التاريخ / الفترة': sanitizeExportCell(
      r.dateMode === 'billing_period' && r.periodStart && r.periodEnd
        ? `${r.periodStart} إلى ${r.periodEnd}`
        : r.readingDate,
    ),
    'المبلغ المدفوع': r.amountPaid ?? '',
    العملة: sanitizeExportCell(r.currency || ''),
    ملاحظة: sanitizeExportCell(r.personalNote || ''),
    'اسم المرفق': sanitizeExportCell(r.attachment?.name || ''),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'سجل بيتي');
  XLSX.writeFile(wb, `moeco-my-home-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
