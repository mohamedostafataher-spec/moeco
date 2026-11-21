import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, X, ExternalLink } from 'lucide-react';
import { storageService } from '../services/storageService';

const AdBanner: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const load = async () => {
      const c = await storageService.getGlobalConfig();
      setConfig(c);
    };
    load();
  }, []);

  if (!config || !config.show_banner_ads || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 z-40"
      >
        <div className="bg-white/90 backdrop-blur-xl border border-zinc-200 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2 rounded-lg">
              <Tag className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Sponsored Content</p>
              <h4 className="text-xs font-bold text-zinc-900">Support MoEco - Keep it FREE!</h4>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.open('https://moeco.app/ads', '_blank')}
              className="px-4 py-2 bg-zinc-900 text-white text-[10px] font-black rounded-xl flex items-center gap-2"
            >
              LEARN MORE <ExternalLink className="w-3 h-3" />
            </button>
            <button 
              onClick={() => setIsVisible(false)}
              className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdBanner;
