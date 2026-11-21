
import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, CheckCircle2, Clock, Terminal } from 'lucide-react';

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState(storageService.getMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(storageService.getMetrics());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">System Performance</h1>
        <p className="text-aeon-cyan/60 font-mono text-xs uppercase tracking-widest">Real-time Stability Monitor</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          icon={<Clock className="w-5 h-5 text-aeon-cyan" />}
          label="Startup Time"
          value={`${(metrics.loadTime / 1000).toFixed(2)}s`}
          subValue="App Initialization"
        />
        <MetricCard 
          icon={<AlertCircle className="w-5 h-5 text-aeon-plasma" />}
          label="Error Count"
          value={metrics.errorCount.toString()}
          subValue="Total Failures"
        />
        <MetricCard 
          icon={<Activity className="w-5 h-5 text-aeon-gold" />}
          label="Network Status"
          value={navigator.onLine ? 'ONLINE' : 'OFFLINE'}
          subValue="Connectivity"
        />
        <MetricCard 
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          label="API Health"
          value={`${Object.values(metrics.apiStatus).filter(s => s === 'success').length}/${Object.keys(metrics.apiStatus).length}`}
          subValue="Requests Success Rate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="aeon-card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-aeon-cyan" />
            <h2 className="text-xl font-bold text-white">System Logs</h2>
          </div>
          <div className="bg-black/50 rounded-2xl p-6 h-[300px] sm:h-[400px] overflow-y-auto font-mono text-[10px] space-y-2 border border-white/5">
            {metrics.logs.map((log, i) => (
              <div key={i} className={`pb-2 border-b border-white/5 ${log.includes('failed') ? 'text-aeon-plasma' : 'text-aeon-cyan/70'}`}>
                {log}
              </div>
            ))}
          </div>
        </div>

        <div className="aeon-card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-aeon-gold" />
            <h2 className="text-xl font-bold text-white">API Status Map</h2>
          </div>
          <div className="space-y-4">
            {Object.entries(metrics.apiStatus).map(([key, status]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs font-mono text-white/60 uppercase">{key}</span>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                  status === 'success' ? 'bg-green-500/20 text-green-500' :
                  status === 'pending' ? 'bg-aeon-gold/20 text-aeon-gold animate-pulse' :
                  'bg-aeon-plasma/20 text-aeon-plasma'
                }`}>
                  {String(status).toUpperCase()}
                </span>
              </div>
            ))}
            {Object.keys(metrics.apiStatus).length === 0 && (
              <p className="text-center text-white/20 py-10 font-mono text-xs">No API requests recorded yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ icon: React.ReactNode, label: string, value: string, subValue: string }> = ({ icon, label, value, subValue }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="aeon-card p-8 space-y-4"
  >
    <div className="flex items-center justify-between">
      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
        {icon}
      </div>
      <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{label}</span>
    </div>
    <div>
      <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
      <p className="text-[10px] font-mono text-aeon-cyan/50 uppercase tracking-widest mt-1">{subValue}</p>
    </div>
  </motion.div>
);

export default PerformanceDashboard;
