
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibility } from '../context/AccessibilityContext';
import { useApp } from '../context/AppContext';
import { useLocation } from 'react-router-dom';
import { X, Maximize2, Minimize2, Play, Pause, Volume2, VolumeX, Hand, Sparkles, MessageCircle } from 'lucide-react';
import { aiService } from '../services/aiService';

const SignLanguageAssistant: React.FC = () => {
  const { signLanguageEnabled, updateSettings, speak } = useAccessibility();
  const { language } = useApp();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  const [guide, setGuide] = useState<{title: string; description: string; videoUrl: string} | null>(null);

  useEffect(() => {
    if (!signLanguageEnabled) return;
    
    // Auto-fetch explanation for current screen
    const fetchGuide = async () => {
      const result = await aiService.generateScreenExplanation(location.pathname, language as 'ar' | 'en');
      setGuide(result);
      
      // Auto-speak the AI explanation if expanded (or maybe always)
      // Small timeout to let screen render
      setTimeout(() => {
        speak(result.description);
      }, 1000);
    };
    
    fetchGuide();
  }, [location.pathname, language, signLanguageEnabled]);

  if (!signLanguageEnabled) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 50 }}
      drag
      dragMomentum={false}
      className={`fixed top-24 left-6 z-[9999] flex flex-col items-start gap-3 cursor-grab active:cursor-grabbing`}
    >
      <div className={`relative group overflow-hidden rounded-[2rem] border-2 border-aeon-cyan shadow-[0_0_30px_rgba(34,211,238,0.25)] transition-all duration-500 bg-slate-900 ${
        isExpanded ? 'w-[calc(100vw-3rem)] sm:w-96 h-auto min-h-[400px]' : 'w-28 h-28'
      }`}>
        {/* Placeholder for Sign Language Video / AI Avatar */}
        <div className={`relative ${isExpanded ? 'h-64' : 'h-full'} w-full bg-black/50`}>
          {guide ? (
            <video 
              key={guide.videoUrl + location.pathname}
              src={guide.videoUrl} 
              autoPlay 
              loop 
              muted={isMuted}
              className="w-full h-full object-cover rounded-t-[1.8rem]"
            />
          ) : (
             <div className="w-full h-full flex items-center justify-center">
                 <Sparkles className="w-8 h-8 text-aeon-cyan animate-pulse" />
             </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 bg-aeon-cyan rounded-xl text-black hover:scale-110 transition-transform shadow-lg"
                >
                  {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                {isExpanded && (
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/30 transition-colors"
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                )}
              </div>
              
              {isExpanded && (
                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  <Hand className="w-4 h-4 text-aeon-cyan" />
                  <span className="text-[10px] font-black text-aeon-cyan uppercase tracking-widest">
                    {language === 'ar' ? 'مترجم الإشارة' : 'Sign Interpreter'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {!isExpanded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-overlay">
              <Hand size={40} className="text-white/50 animate-pulse" />
            </div>
          )}
        </div>

        {/* AI Explanation Panel */}
        <AnimatePresence>
          {isExpanded && guide && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-6 bg-slate-900 border-t border-aeon-cyan/20"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-aeon-cyan/10 flex items-center justify-center border border-aeon-cyan/30">
                  <MessageCircle className="w-5 h-5 text-aeon-cyan" />
                </div>
                <div>
                  <h4 className="text-white font-black text-lg">{guide.title}</h4>
                  <p className="text-[10px] text-aeon-cyan font-bold uppercase tracking-widest">{language === 'ar' ? 'شرح تفاعلي' : 'Interactive Guide'}</p>
                </div>
              </div>
              <p className="text-slate-300 font-bold leading-relaxed text-sm bg-black/30 p-4 rounded-2xl border border-white/5">
                {guide.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button 
        onClick={() => updateSettings({ signLanguageEnabled: false })}
        className="px-4 py-2 bg-rose-500/90 backdrop-blur-md text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-rose-600 transition-colors shadow-lg border border-rose-400/30"
      >
        <X size={14} />
        {language === 'ar' ? 'إغلاق المترجم' : 'Close Assistant'}
      </button>
    </motion.div>
  );
};

export default SignLanguageAssistant;
