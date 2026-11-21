import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, CheckCircle2, Circle, Target, 
  TrendingDown, Zap, Award, Clock
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { useApp } from '../context/AppContext';

export const ActionPlan: React.FC = () => {
  const { theme, language } = useApp();
  const [plan, setPlan] = useState<any>(null);

  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date');

  useEffect(() => {
    const loadData = async () => {
      const p = await storageService.getActionPlan();
      // Ensure tasks have priority and due date if missing
      const enhancedTasks = (p.tasks || []).map((t: any, idx: number) => ({
        ...t,
        priority: t.priority || (idx === 0 ? 'High' : idx === 1 ? 'Medium' : 'Low'),
        dueDate: t.dueDate || new Date(Date.now() + (idx + 1) * 86400000).toISOString()
      }));
      setPlan({ ...p, tasks: enhancedTasks });
    };
    loadData();
  }, []);

  const toggleTask = (taskId: number) => {
    const newTasks = plan.tasks.map((t: any) => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const newPlan = { ...plan, tasks: newTasks };
    setPlan(newPlan);
    storageService.saveActionPlan(newPlan);
    
    if (!plan.tasks.find((t: any) => t.id === taskId).completed) {
      // Simulate local notification
      setTimeout(() => {
        alert(isRtl ? 'تذكير: لديك مهمة قادمة غداً!' : 'Reminder: You have a task due tomorrow!');
      }, 1000);
    }
  };

  if (!plan) return null;

  const isRtl = language === 'ar';
  
  const sortedTasks = [...plan.tasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const weights = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return weights[b.priority as keyof typeof weights] - weights[a.priority as keyof typeof weights];
    }
    if (sortBy === 'status') return a.completed === b.completed ? 0 : a.completed ? 1 : -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const progress = (plan.tasks.filter((t: any) => t.completed).length / plan.tasks.length) * 100;

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'High': return 'text-egypt-red bg-egypt-red/10';
      case 'Medium': return 'text-egypt-gold bg-egypt-gold/10';
      default: return 'text-emerald-500 bg-emerald-500/10';
    }
  };

  return (
    <div className={`p-8 rounded-[3rem] border shadow-2xl overflow-hidden ${
      theme === 'dark' ? 'bg-egypt-black border-egypt-gold/20' : 'bg-white border-egypt-gold/10'
    }`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-egypt-red text-white rounded-2xl">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black font-arabic">
              {plan.type === '30-day' ? (isRtl ? 'خطة الـ 30 يوماً' : '30-Day Action Plan') : (isRtl ? 'خطة الـ 6 أشهر' : '6-Month Action Plan')}
            </h3>
            <p className="text-[10px] font-black text-egypt-red uppercase tracking-widest">{isRtl ? 'برنامج تغيير السلوك البيئي' : 'Behavioral change program'}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-egypt-gold">{Math.round(progress)}%</div>
          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{isRtl ? 'مستوى الإنجاز' : 'Completion Level'}</p>
        </div>
      </div>

      <div className="w-full h-2 bg-white/5 rounded-full mb-8 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-egypt-gold shadow-[0_0_10px_rgba(192,178,131,0.5)]"
        />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        {(['date', 'priority', 'status'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-normal sm:whitespace-nowrap break-words ${
              sortBy === s ? 'bg-egypt-gold text-black' : 'bg-white/5 text-zinc-500'
            }`}
          >
            {isRtl ? (s === 'date' ? 'حسب التاريخ' : s === 'priority' ? 'حسب الأولوية' : 'حسب الحالة') : `Sort by ${s}`}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {sortedTasks.map((task: any) => (
          <button 
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`w-full p-6 rounded-2xl border flex flex-col gap-4 transition-all ${
              task.completed 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                : 'bg-white/5 border-white/10 text-zinc-400 hover:border-egypt-gold/30'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                <span className="font-black text-sm font-arabic">{task.title}</span>
              </div>
              <Award className={`w-4 h-4 ${task.completed ? 'opacity-100' : 'opacity-20'}`} />
            </div>
            
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <div className="flex items-center gap-1 text-[8px] font-bold opacity-60">
                  <Calendar className="w-3 h-3" />
                  {new Date(task.dueDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </div>
              </div>
              {task.completed && (
                <span className="text-[8px] font-black uppercase text-emerald-500">
                  {isRtl ? 'مكتمل' : 'Completed'}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 p-6 bg-egypt-gold/5 rounded-3xl border border-egypt-gold/10 flex items-center gap-4">
        <Clock className="w-5 h-5 text-egypt-gold" />
        <p className="text-[10px] font-black text-zinc-500 leading-relaxed uppercase tracking-widest">
          {isRtl ? 'استمر لمدة 21 يوماً لتثبيت العادة الجديدة' : 'Continue for 21 days to lock in the new habit'}
        </p>
      </div>
    </div>
  );
};
