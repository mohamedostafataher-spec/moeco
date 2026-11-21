
import { storageService } from './storageService';

export interface DependencyStatus {
  name: string;
  type: 'Free' | 'Usage-based' | 'Paid';
  limit: string;
  replacement: string;
  status: 'PASS' | 'FAIL' | 'RISK';
}

export const FreeComplianceEngine = {
  FREE_MODE: true,

  dependencies: [
    { name: 'SQLite', type: 'Free', limit: 'Local Disk', replacement: 'None', status: 'PASS' },
    { name: 'Leaflet', type: 'Free', limit: 'Unlimited', replacement: 'None', status: 'PASS' },
    { name: 'OpenStreetMap', type: 'Free', limit: 'Fair Use', replacement: 'Static Maps', status: 'PASS' },
    { name: 'Smart Logic Engine', type: 'Free', limit: 'UNLIMITED', replacement: 'None', status: 'PASS' },
    { name: 'Firebase', type: 'Usage-based', limit: 'Spark Plan', replacement: 'Local Storage', status: 'RISK' },
    { name: 'OSRM', type: 'Free', limit: 'Public Server', replacement: 'Haversine Formula', status: 'PASS' },
  ] as DependencyStatus[],

  audit: () => {
    console.log('--- Free Compliance Audit ---');
    const risks = FreeComplianceEngine.dependencies.filter(d => d.status === 'RISK' || d.status === 'FAIL');
    
    if (risks.length > 0) {
      console.warn('Risks detected:', risks);
    }

    const isCompliant = !FreeComplianceEngine.dependencies.some(d => d.status === 'FAIL');
    return {
      status: isCompliant ? 'PASS' : 'FAIL',
      report: FreeComplianceEngine.dependencies,
      timestamp: new Date().toISOString()
    };
  },

  checkUsage: async () => {
    // Simulate usage check
    const records = await storageService.getRecords();
    const storageUsage = JSON.stringify(records).length / 1024; // KB
    
    if (storageUsage > 800) { // 800KB threshold for "Free" simulation
      return { alert: 'Approaching free limit — optimization mode activated', level: 'WARNING' };
    }
    return { status: 'OK' };
  }
};

export const TransparencyGuard = {
  features: [
    { name: 'AI Analysis', costType: 'Usage-based', limit: '15 RPM', fallback: 'Local Rules' },
    { name: 'Map Routing', costType: 'Free', limit: 'OSRM Public', fallback: 'Haversine' },
    { name: 'Data Storage', costType: 'Free', limit: 'SQLite/Local', fallback: 'None' },
  ],

  getFeatureStatus: (featureName: string) => {
    return TransparencyGuard.features.find(f => f.name === featureName);
  }
};
