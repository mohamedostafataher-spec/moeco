import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapIcon, Users, Zap, Globe, TrendingUp, Activity, Search, RefreshCw } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const GovernorateAnalytics: React.FC<{ isRtl: boolean }> = ({ isRtl }) => {
  const [govs, setGovs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGov, setSelectedGov] = useState<any>(null);

  const fetchGovData = async () => {
    setLoading(true);
    try {
      const { data: governorates } = await supabase.from('governorates').select('*');
      const { data: users } = await supabase.from('users').select('id, governorate');
      const { data: footprints } = await supabase.from('carbon_footprint_logs').select('user_id, total_emissions');

      if (governorates) {
        const enriched = governorates.map(g => {
          const govUsers = users?.filter(u => u.governorate === g.name_en) || [];
          const userIds = govUsers.map(u => u.id);
          const govEmissions = footprints?.filter(f => userIds.includes(f.user_id)).reduce((sum, f) => sum + (f.total_emissions || 0), 0) || 0;
          
          return {
            ...g,
            userCount: govUsers.length,
            totalEmissions: govEmissions,
            avgEmissions: govEmissions / Math.max(1, govUsers.length)
          };
        }).sort((a,b) => b.totalEmissions - a.totalEmissions);
        
        setGovs(enriched);
        if (!selectedGov && enriched.length > 0) setSelectedGov(enriched[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGovData();
  }, []);

  const COLORS = ['#d4af37', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-zinc-900 border border-white/5 p-8 rounded-[3rem]">
         <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <MapIcon size={28} className="text-blue-500" />
              {isRtl ? 'نظام التحليل الجغرافي القومي' : 'National Governorate Intelligence'}
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1 ml-10">Real-time Regional Data Grid</p>
         </div>
         <button onClick={fetchGovData} className="p-3 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Map/List Sidebar */}
         <div className="lg:col-span-1 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
            {govs.map((g, i) => (
              <button 
                key={g.id}
                onClick={() => setSelectedGov(g)}
                className={`w-full text-left p-5 rounded-2xl border transition-all flex flex-col gap-2 ${
                  selectedGov?.id === g.id 
                    ? 'bg-egypt-gold/10 border-egypt-gold/30 ring-1 ring-egypt-gold/20' 
                    : 'bg-zinc-900/50 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-center">
                   <span className="font-black text-white uppercase tracking-tight text-sm">{g.name_en}</span>
                   <span className="text-[10px] font-black text-zinc-500 uppercase">{g.userCount} Units</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-1 flex-1 bg-zinc-950 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(g.totalEmissions / (govs[0].totalEmissions || 1)) * 100}%` }}
                        className="h-full bg-egypt-gold"
                      />
                   </div>
                   <span className="text-[10px] font-mono text-egypt-gold">{Math.round(g.totalEmissions)}kg</span>
                </div>
              </button>
            ))}
         </div>

         {/* Detailed Insights */}
         <div className="lg:col-span-3 space-y-8">
            <AnimatePresence mode="wait">
               {selectedGov && (
                  <motion.div 
                    key={selectedGov.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                     <div className="md:col-span-2 bg-zinc-900/50 backdrop-blur-md border border-white/5 p-8 rounded-[3.5rem] relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8 relative z-10">
                           <div>
                              <h3 className="font-black text-white text-2xl uppercase tracking-tighter">{selectedGov.name_en} Analysis</h3>
                              <p className="text-[10px] font-black text-egypt-gold uppercase tracking-[0.3em]">{isRtl ? selectedGov.name_ar : 'Regional Sector Data'}</p>
                           </div>
                           <Globe className="text-zinc-800 absolute -right-4 -top-4" size={160} />
                        </div>
                        
                        <div className="h-[250px] w-full relative z-10">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={govs.slice(0, 8)}>
                                 <XAxis dataKey="name_en" stroke="#3f3f46" fontSize={9} axisLine={false} tickLine={false} />
                                 <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px' }} />
                                 <Bar dataKey="totalEmissions" radius={[10, 10, 0, 0]}>
                                    {govs.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.id === selectedGov.id ? '#d4af37' : '#1e1e24'} />
                                    ))}
                                 </Bar>
                              </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="bg-zinc-900 border border-white/5 p-8 rounded-[3rem] text-center">
                           <Users className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Citizen Base</p>
                           <p className="text-3xl font-black text-white">{selectedGov.userCount}</p>
                        </div>
                        <div className="bg-zinc-900 border border-white/5 p-8 rounded-[3rem] text-center">
                           <Zap className="w-10 h-10 text-amber-400 mx-auto mb-4" />
                           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Avg Footprint</p>
                           <p className="text-3xl font-black text-white">{selectedGov.avgEmissions.toFixed(1)} <span className="text-xs text-zinc-500">kg</span></p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2.5rem]">
                           <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Efficiency Rating</h4>
                           <div className="flex items-center gap-3">
                              <TrendingUp className="text-emerald-500" />
                              <span className="text-xl font-black text-white">Top 15%</span>
                           </div>
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>

            <div className="bg-zinc-900 border border-white/5 p-8 rounded-[3rem] overflow-hidden relative">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />
               <h3 className="text-lg font-black text-white mb-6 uppercase flex items-center gap-2">
                  <Activity className="text-blue-500" />
                  National Consumption Heatmap Logic
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {govs.map((g, i) => {
                     const intensity = (g.totalEmissions / Math.max(1, govs[0].totalEmissions)) * 100;
                     return (
                        <div key={i} className="bg-zinc-950 p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
                           <div className="w-full h-12 rounded-xl" style={{ backgroundColor: `rgba(212,175,55, ${intensity / 100})`, border: `1px solid rgba(212,175,55, ${Math.min(1, intensity/50)})` }} />
                           <span className="text-[9px] font-black text-zinc-500 uppercase whitespace-nowrap">{g.name_en}</span>
                        </div>
                     );
                  })}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default GovernorateAnalytics;
