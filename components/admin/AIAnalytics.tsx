
import React, { useState, useEffect } from 'react';
import { 
  Brain, Shield,Zap, AlertCircle, 
  Settings, Save, RefreshCw, 
  Play, Pause, Plus, Trash2, Cpu,
  Search, Filter, ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../services/supabaseClient';
import { notificationService } from '../../services/notificationService';

interface AIRule {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  threshold: number;
  action_type: 'alert' | 'restrict' | 'reward' | 'report';
  condition_json: any;
}

interface AIAnalyticsProps {
  isRtl: boolean;
}

const AIAnalytics: React.FC<AIAnalyticsProps> = ({ isRtl }) => {
  const [rules, setRules] = useState<AIRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'behavior' | 'system'>('rules');

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_behavior_rules')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRules(data || []);
    } catch (e) {
      console.error("Rules fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_behavior_rules')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));
      notificationService.success(isRtl ? 'تم تحديث القاعدة' : 'Rule updated successfully');
    } catch (e) {
      notificationService.error('Error updating rule');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-3">
            <Brain className="w-8 h-8 text-egypt-gold" />
            {isRtl ? 'نظام التحليل السلوكي الذكي' : 'AI Behavior Intelligence'}
          </h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-2">
            Automated Governance & Pattern Analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl">
             {['rules', 'behavior', 'system'].map((t) => (
               <button
                 key={t}
                 onClick={() => setActiveTab(t as any)}
                 className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                   activeTab === t ? 'bg-egypt-gold text-egypt-black' : 'text-zinc-500 hover:text-white'
                 }`}
               >
                 {t}
               </button>
             ))}
          </div>
        </div>
      </div>

      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-zinc-900/50 border-2 border-dashed border-zinc-800 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center group cursor-pointer hover:border-egypt-gold/30 transition-all"
          >
            <div className="w-16 h-16 rounded-full bg-zinc-950 flex items-center justify-center mb-4 group-hover:bg-egypt-gold/10 transition-colors">
              <Plus className="w-8 h-8 text-zinc-600 group-hover:text-egypt-gold transition-colors" />
            </div>
            <h3 className="font-black text-white uppercase tracking-widest text-xs">{isRtl ? 'إرساء قاعدة ذكية جديدة' : 'Deploy New AI Rule'}</h3>
            <p className="text-[10px] text-zinc-500 font-bold mt-2 uppercase">{isRtl ? 'تحديد أنماط سلوكية مراقبة' : 'Define Behavior Patterns'}</p>
          </motion.div>

          {rules.map((rule) => (
            <motion.div 
              key={rule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 border border-white/[0.05] p-6 rounded-[2.5rem] relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${rule.is_active ? 'bg-emerald-500/10' : 'bg-zinc-950'}`}>
                  <Shield className={`w-6 h-6 ${rule.is_active ? 'text-emerald-500' : 'text-zinc-600'}`} />
                </div>
                <button 
                  onClick={() => toggleRule(rule.id, rule.is_active)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${rule.is_active ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${rule.is_active ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <h4 className="text-lg font-black text-white mb-2 uppercase tracking-tight">{rule.name}</h4>
              <p className="text-xs text-zinc-500 font-bold leading-relaxed mb-6 h-12 line-clamp-3">
                {rule.description}
              </p>

              <div className="space-y-4 pt-6 border-t border-white/[0.05]">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sensitivity Threshold</span>
                    <span className="text-xs font-black text-egypt-gold">{rule.threshold}%</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Trigger Action</span>
                    <span className="px-2 py-0.5 bg-zinc-950 rounded text-[10px] font-black text-blue-400 uppercase border border-blue-500/10">
                      {rule.action_type}
                    </span>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'behavior' && (
        <div className="bg-zinc-900 border border-white/[0.05] rounded-[3rem] p-8">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-egypt-gold/10 rounded-2xl flex items-center justify-center">
                 <Cpu className="text-egypt-gold w-6 h-6" />
              </div>
              <div>
                 <h3 className="text-xl font-black text-white uppercase tracking-widest">{isRtl ? 'تحليلات الأنماط الحية' : 'Live Pattern Analytics'}</h3>
                 <p className="text-xs text-zinc-500 font-bold uppercase">{isRtl ? 'اكتشاف التهديدات وإساءة استخدام النظام' : 'Threat Detection & Abuse Monitoring'}</p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">{isRtl ? 'التنبيهات السلوكية' : 'Behavioral Alerts'}</h4>
                 {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 bg-zinc-950 border border-white/[0.03] rounded-2xl group hover:border-red-500/20 transition-all">
                       <div className="flex items-center gap-4">
                          <AlertCircle size={20} className="text-red-500" />
                          <div>
                             <p className="text-xs font-black text-white uppercase">{isRtl ? 'نمط استهلاك غير طبيعي' : 'Abnormal Consumption Pattern'}</p>
                             <p className="text-[10px] text-zinc-600 font-mono">User: ID_92...28 | Cairo | 02:40 PM</p>
                          </div>
                       </div>
                       <button className="p-2 text-zinc-600 hover:text-white transition-colors"><ChevronRight size={20} /></button>
                    </div>
                 ))}
              </div>

              <div className="bg-zinc-950/50 border border-white/[0.03] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center">
                 <div className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-500 flex items-center justify-center mb-6 animate-spin-slow">
                    <Zap className="w-12 h-12 text-emerald-500" />
                 </div>
                 <h4 className="text-2xl font-black text-white tracking-widest uppercase mb-2">{isRtl ? 'النظام مستقر' : 'Nexus Stable'}</h4>
                 <p className="text-sm text-zinc-500 font-bold max-w-xs">{isRtl ? 'جميع الأنماط الحالية تقع ضمن الحدود الآمنة للنظام' : 'All current patterns are within the safety benchmarks of the Egypt Central system.'}</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalytics;
