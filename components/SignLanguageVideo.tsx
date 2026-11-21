import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, X, Play } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useApp } from '../context/AppContext';

interface SignLanguageVideoProps {
  screenName: string;
  videoUrl?: string;
}

const SignLanguageVideo: React.FC<SignLanguageVideoProps> = ({ screenName, videoUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, theme } = useApp();
  const { reduceMotion } = useAccessibility();
  const isRtl = language === 'ar';

  return (
    <div className="fixed bottom-24 right-4 z-[90]">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
            className={`w-64 p-4 rounded-3xl border shadow-2xl overflow-hidden ${
              theme === 'dark' ? 'bg-egypt-black/95 border-egypt-gold/30' : 'bg-white border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-egypt-gold" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {isRtl ? 'لغة الإشارة' : 'Sign Language'}
                </span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            <div className="aspect-video bg-zinc-900 rounded-2xl border border-white/5 flex items-center justify-center relative group overflow-hidden">
              {videoUrl ? (
                <video 
                  src={videoUrl} 
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <div className="text-center p-4">
                  <Play className="w-8 h-8 text-egypt-gold/40 mx-auto mb-2" />
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-relaxed">
                    {isRtl ? 'فيديو توضيحي لـ' : 'Explanatory video for'} <br/>
                    <span className="text-egypt-gold">{screenName}</span> <br/>
                    {isRtl ? 'قريباً' : 'Coming Soon'}
                  </p>
                </div>
              )}
            </div>

            <p className="text-[9px] font-bold text-zinc-500 mt-3 text-center leading-relaxed">
              {isRtl 
                ? 'هذا الفيديو يشرح كيفية استخدام هذه الشاشة بلغة الإشارة المصرية.' 
                : 'This video explains how to use this screen in Egyptian Sign Language.'}
            </p>
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 bg-egypt-gold text-black rounded-full shadow-lg flex items-center justify-center border-4 border-white dark:border-egypt-black"
            aria-label={isRtl ? 'فتح فيديو لغة الإشارة' : 'Open sign language video'}
          >
            <Video className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SignLanguageVideo;
