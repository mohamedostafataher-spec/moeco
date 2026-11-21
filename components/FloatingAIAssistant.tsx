import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Mic, Send, Minimize2, CloudRain, Sun, Brain } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { aiService } from '../services/aiService';

export const FloatingAIAssistant: React.FC = () => {
  const { language, theme, isRtl } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', t: string}[]>([
    { role: 'ai', t: isRtl ? 'مرحباً، أنا الذكاء الاصطناعي لـ MoEco. كيف أساعدك اليوم؟' : 'Hello, I am MoEco AI. How can I help you today?' }
  ]);
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!query.trim()) return;
    const userQ = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', t: userQ }]);
    setIsTyping(true);

    try {
      await new Promise(res => setTimeout(res, 800));
      const tip = await aiService.getEcoTips('system_user', language as 'ar' | 'en');
      let text = '';
      if (userQ.toLowerCase().includes('carbon') || userQ.toLowerCase().includes('كربون')) {
         text = isRtl 
           ? "متوسط استهلاك المواطن هو 4 طن سنوياً. لتحسين بصمتك: " + tip
           : "The average citizen emits 4 tons yearly. To improve: " + tip;
      } else {
         text = tip;
      }
      setMessages(prev => [...prev, { role: 'ai', t: text }]);
    } catch {
       setMessages(prev => [...prev, { role: 'ai', t: isRtl ? 'عذراً، فشل الاتصال بخوادم الـ AI.' : 'Sorry, failed to connect to AI server.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <motion.button 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 md:bottom-32 right-4 md:right-8 z-[200] w-14 h-14 md:w-16 md:h-16 bg-emerald-500 rounded-full shadow-[0_0_30px_#10b981] flex items-center justify-center cursor-pointer group"
      >
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity" />
        <Brain className="w-6 h-6 md:w-8 md:h-8 text-slate-900 group-hover:rotate-12 transition-transform" />
      </motion.button>
    );
  }

  const containerClasses = [
    "fixed",
    isMinimized ? "bottom-28 right-4 w-64" : "bottom-0 md:bottom-28 right-0 md:right-8 w-full md:w-[400px] h-[75vh] md:h-[600px]",
    "z-[200] bg-slate-950 md:rounded-[2rem] border-t md:border border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
  ].join(" ");

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={containerClasses}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
       {/* Header */}
       <div className="p-4 bg-emerald-500 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Brain className="text-slate-900 w-5 h-5" />
             </div>
             <div>
               <h3 className="font-black text-slate-900 leading-none">{isRtl ? 'الذكاء البيئي' : 'Eco AI'}</h3>
               <span className="text-[10px] font-bold text-slate-900/70">{isRtl ? 'متصل' : 'Online'}</span>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-black/10 rounded-full transition-colors text-slate-900">
               <Minimize2 size={16} />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-black/10 rounded-full transition-colors text-slate-900">
               <X size={16} />
            </button>
          </div>
       </div>

       {/* Chat Area */}
       {!isMinimized && (
         <>
           <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-900/50">
             {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={m.role === 'user' ? "flex justify-end" : "flex justify-start"}
                >
                   <div className={m.role === 'user' ? "p-4 max-w-[85%] rounded-[1.5rem] bg-emerald-500/20 border border-emerald-500/30 text-emerald-100 rounded-tr-sm" : "p-4 max-w-[85%] rounded-[1.5rem] bg-white/5 border border-white/10 text-slate-300 rounded-tl-sm"}>
                      <p className="text-sm font-medium leading-relaxed">{m.t}</p>
                   </div>
                </motion.div>
             ))}
             {isTyping && (
               <div className="flex justify-start">
                  <div className="p-4 bg-white/5 rounded-[1.5rem] rounded-tl-sm border border-white/10 flex items-center gap-2">
                     <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                     <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                     <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
               </div>
             )}
           </div>

           {/* Input Area */}
           <div className="p-4 bg-slate-950 border-t border-white/5 flex gap-2 shrink-0">
             <button className="w-12 h-12 bg-white/5 hover:bg-white/10 flex items-center justify-center rounded-2xl text-slate-400 transition-colors shrink-0">
                <Mic size={20} />
             </button>
             <input 
               type="text" 
               value={query}
               onChange={e => setQuery(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleSend()}
               placeholder={isRtl ? 'اسأل المساعد الذكي...' : 'Ask Eco AI...'}
               className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm text-white focus:outline-none focus:border-emerald-500/50"
             />
             <button disabled={!query.trim()} onClick={handleSend} className="w-12 h-12 bg-emerald-500 disabled:opacity-50 flex items-center justify-center rounded-2xl text-slate-900 transition-all active:scale-95 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
               <Send size={20} className={isRtl ? 'rotate-180' : ''} />
             </button>
           </div>
         </>
       )}
    </motion.div>
  );
};
