
import { SectorType } from '../types';

export interface VerificationResult {
  flagged: boolean;
  reason?: string;
  reasonAr?: string;
  suggestedCorrection?: number;
}

export const AntiFraudVerifier = {
  // Realistic ranges per person per month in Egypt
  ranges: {
    Electricity: { min: 20, max: 1000 }, // kWh
    Water: { min: 1, max: 50 }, // m3
    Gas: { min: 2, max: 100 }, // m3
  } as Record<string, { min: number; max: number }>,

  verify: (
    sector: SectorType, 
    value: number, 
    members: number, 
    history: number[] = []
  ): VerificationResult => {
    const perPerson = value / members;
    const range = AntiFraudVerifier.ranges[sector as keyof typeof AntiFraudVerifier.ranges];

    // 1. Numeric validation: values in realistic range
    if (range) {
      if (perPerson < range.min) {
        return {
          flagged: true,
          reason: `Consumption too low for ${members} members.`,
          reasonAr: `الاستهلاك منخفض جداً لـ ${members} أفراد.`,
          suggestedCorrection: range.min * members
        };
      }
      if (perPerson > range.max) {
        return {
          flagged: true,
          reason: `Consumption extremely high for ${members} members. Possible leak or error.`,
          reasonAr: `الاستهلاك مرتفع جداً لـ ${members} أفراد. احتمال تسريب أو خطأ.`,
          suggestedCorrection: range.max * members
        };
      }
    }

    // 2. Historical comparison: compare with previous months
    if (history.length > 0) {
      const avg = history.reduce((a, b) => a + b, 0) / history.length;
      const deviation = Math.abs(value - avg) / avg;
      
      if (deviation > 0.8) { // 80% deviation from average
        return {
          flagged: true,
          reason: `Significant deviation (>${Math.round(deviation * 100)}%) from your historical average.`,
          reasonAr: `انحراف كبير (>${Math.round(deviation * 100)}%) عن متوسط استهلاكك التاريخي.`,
          suggestedCorrection: avg
        };
      }
    }

    // 3. Community verification (Neighbor average comparison)
    // In a real app, we'd fetch neighbor data. Here we simulate it.
    const simulatedNeighborAvg = range ? (range.min + range.max) / 2 * members : 0;
    if (simulatedNeighborAvg > 0) {
      const neighborDeviation = Math.abs(value - simulatedNeighborAvg) / simulatedNeighborAvg;
      if (neighborDeviation > 2.0) { // 200% deviation from neighbor average
        return {
          flagged: true,
          reason: `Your consumption is 3x higher than the neighborhood average.`,
          reasonAr: `استهلاكك أعلى بـ 3 أضعاف من متوسط الحي.`,
        };
      }
    }

    return { flagged: false };
  },

  logAudit: (userId: string, action: string, data: any) => {
    // In a real app, this would be an encrypted server call.
    // Here we log to console for simulation.
    const auditEntry = {
      userId: `encrypted_${userId.substring(0, 8)}`,
      timestamp: new Date().toISOString(),
      action,
      data
    };
    console.log('[AUDIT LOG]', auditEntry);
    
    // Store in local storage for simulation
    const logs = JSON.parse(localStorage.getItem('moeco_fraud_audit_logs') || '[]');
    localStorage.setItem('moeco_fraud_audit_logs', JSON.stringify([auditEntry, ...logs].slice(0, 100)));
  },

  getAuditLogs: () => {
    return JSON.parse(localStorage.getItem('moeco_fraud_audit_logs') || '[]');
  }
};
