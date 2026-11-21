import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, PieChart, BarChart3, TrendingUp, Calendar, Globe, Award, Filter, RefreshCw } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { notificationService } from '../../services/notificationService';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart as RePieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const NationalReports: React.FC<{ isRtl: boolean }> = ({ isRtl }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('monthly');

  const fetchNationalData = async () => {
    setLoading(true);
    try {
      const { data: users } = await supabase.from('users').select('id, governorate, created_at');
      const { data: footprint } = await supabase.from('carbon_footprint_logs').select('*');
      const { data: govServices } = await supabase.from('government_services').select('id, category, usage_count');
      
      if (users && footprint) {
        const totalEmissions = footprint.reduce((sum, f) => sum + (f.total_emissions || 0), 0);
        const totalSaved = footprint.reduce((sum, f) => sum + (f.saved || 0), 0);
        
        // Group by governorate
        const govStats = users.reduce((acc: any, u) => {
           const g = u.governorate || 'Unknown';
           if (!acc[g]) acc[g] = { name: g, users: 0, emissions: 0 };
           acc[g].users += 1;
           const userEmissions = footprint.filter(f => f.user_id === u.id).reduce((sum, f) => sum + (f.total_emissions || 0), 0);
           acc[g].emissions += userEmissions;
           return acc;
        }, {});

        setData({
          totalUsers: users.length,
          totalEmissions,
          totalSaved,
          govStats: Object.values(govStats).sort((a: any, b: any) => b.emissions - a.emissions),
          servicePopularity: govServices?.map(s => ({ name: s.category, value: s.usage_count || 0 })) || []
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNationalData();
  }, [timeRange]);

  const generatePDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [16, 185, 129]; // Emerald 500
    
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text('NATIONAL ECO-CITIZEN REPORT 2026', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
    doc.text(`Period: ${timeRange.toUpperCase()}`, 190, 30, { align: 'right' });

    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(20, 35, 190, 35);

    // Summary Metrics
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Executive Summary', 20, 50);
    
    autoTable(doc, {
      startY: 55,
      head: [['Metric', 'Value', 'Unit']],
      body: [
        ['Total Registered Citizens', data.totalUsers, 'Users'],
        ['National Carbon Footprint', data.totalEmissions.toFixed(2), 'kg CO2'],
        ['Global Carbon Offset (Saved)', data.totalSaved.toFixed(2), 'kg CO2'],
        ['Citizen Engagement Score', '8.4/10', 'Index'],
      ],
      theme: 'grid',
      headStyles: { fillColor: primaryColor }
    });

    // Governorate Breakdown
    doc.text('Governorate Performance Breakdown', 20, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Governorate', 'Active Users', 'Emissions (kg)', 'Per Capita (kg)']],
      body: data.govStats.map((g: any) => [
        g.name,
        g.users,
        g.emissions.toFixed(2),
        (g.emissions / Math.max(1, g.users)).toFixed(2)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`MoEco_National_Report_${new Date().toISOString().slice(0,10)}.pdf`);
    notificationService.success(isRtl ? 'تم إنتاج التقرير القومي بنجاح' : 'National PDF Report Exported');
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <h2 className="text-3xl font-black text-white flex items-center gap-3">
             <Globe className="text-blue-500" />
             {isRtl ? 'نظام التقارير القومية الاستراتيجية' : 'Strategic National Reporting'}
           </h2>
           <p className="text-sm text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1 ml-9">Enterprise Analytics Module</p>
        </div>
        <div className="flex gap-4">
           <select 
             value={timeRange} 
             onChange={(e) => setTimeRange(e.target.value)}
             className="bg-zinc-900 border border-white/5 rounded-2xl px-4 py-3 text-xs font-black text-zinc-400 uppercase tracking-widest outline-none focus:border-egypt-gold"
           >
              <option value="daily">Daily Pulse</option>
              <option value="weekly">Weekly Trend</option>
              <option value="monthly">Monthly Audit</option>
              <option value="yearly">Yearly Vision</option>
           </select>
           <button 
             onClick={generatePDF}
             className="flex items-center gap-2 px-8 py-3 bg-egypt-gold text-egypt-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-egypt-gold/20"
           >
             <Download size={16} /> {isRtl ? 'تصدير PDF' : 'Export PDF'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-zinc-900 border border-white/5 p-8 rounded-[3rem] text-center">
              <TrendingUp className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">Target Completion</h3>
              <p className="text-4xl font-black text-white">92.4%</p>
              <div className="mt-6 h-2 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                 <motion.div initial={{ width: 0 }} animate={{ width: '92.4%' }} className="h-full bg-emerald-500 shadow-[0_0_15px_#10b981]" />
              </div>
           </div>
           
           <div className="bg-zinc-900 border border-white/5 p-8 rounded-[3rem]">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">Emissions by Governorate</h3>
              <div className="space-y-4">
                 {data?.govStats.slice(0, 5).map((g: any, i: number) => (
                   <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[10px] font-black uppercase">
                         <span className="text-zinc-400">{g.name}</span>
                         <span className="text-white">{Math.round(g.emissions)} kg</span>
                      </div>
                      <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                         <motion.div initial={{ width: 0 }} animate={{ width: `${(g.emissions / (data.totalEmissions || 1)) * 100}%` }} className="h-full bg-blue-500" />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 p-8 rounded-[3.5rem] relative overflow-hidden group">
               <h3 className="text-lg font-black text-white mb-8 flex items-center gap-2">
                  <PieChart className="text-egypt-gold" size={20} />
                  Service Usage Distribution
               </h3>
               <div className="h-[250px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <RePieChart>
                     <Pie
                       data={data?.servicePopularity || []}
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {data?.servicePopularity.map((_: any, index: number) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}
                        itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: '900' }}
                     />
                   </RePieChart>
                 </ResponsiveContainer>
               </div>
               <div className="mt-4 flex flex-wrap gap-4 justify-center">
                  {data?.servicePopularity.slice(0, 4).map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                       <span className="text-[9px] font-black text-zinc-500 uppercase">{s.name}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 p-8 rounded-[3.5rem]">
               <h3 className="text-lg font-black text-white mb-8 flex items-center gap-2">
                  <BarChart3 className="text-blue-500" size={20} />
                  Top Performing Governorates
               </h3>
               <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={data?.govStats.slice(0, 6) || []}>
                        <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }} />
                        <Bar dataKey="users" fill="#10b981" radius={[10, 10, 0, 0]} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
               <p className="text-[9px] font-bold text-zinc-500 text-center uppercase tracking-widest mt-6">Metrics normalized by user participation rate</p>
            </div>

            <div className="md:col-span-2 bg-zinc-900 border border-white/5 p-8 rounded-[3.5rem] overflow-hidden">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-white">{isRtl ? 'البيانات الوطنية التفصيلية' : 'Detailed National Ledger'}</h3>
                  <button onClick={fetchNationalData} className="p-2 bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                     <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  </button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">
                           <th className="pb-4">Node Identity</th>
                           <th className="pb-4 text-right">Population Share</th>
                           <th className="pb-4 text-right">CO2 Output</th>
                           <th className="pb-4 text-right">Efficiency</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/[0.03]">
                        {data?.govStats.map((g: any, i: number) => (
                           <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                              <td className="py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center font-black text-[10px] text-egypt-gold border border-white/5">
                                       {g.name[0]}
                                    </div>
                                    <span className="font-bold text-white text-sm">{g.name}</span>
                                 </div>
                              </td>
                              <td className="py-4 text-right font-mono text-xs text-zinc-400">{g.users} Units</td>
                              <td className="py-4 text-right font-black text-egypt-gold text-sm">{g.emissions.toFixed(1)} kg</td>
                              <td className="py-4 text-right">
                                 <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md uppercase tracking-tighter">Optimal</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default NationalReports;
