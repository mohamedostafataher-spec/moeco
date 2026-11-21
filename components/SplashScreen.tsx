
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sprout } from 'lucide-react';
import { useApp } from '../context/AppContext';

const SplashScreen: React.FC<{ onSkip: () => void }> = ({ onSkip }) => {
  const { language } = useApp();
  const isRtl = language === 'ar';
  const [status, setStatus] = useState(isRtl ? 'جاري تهيئة مو إيكو...' : 'Initializing MoEco...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const sequence = async () => {
      // Step 1: Branding
      setProgress(20);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 2: Connection
      setStatus(isRtl ? 'التحقق من الاتصالات...' : 'Verifying Connections...');
      setProgress(50);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 3: Global Data Sync
      setStatus(isRtl ? 'مزامنة البيانات البيئية...' : 'Syncing Environmental Data...');
      setProgress(80);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 4: Ready
      setStatus(isRtl ? 'جاهز للانطلاق' : 'Ready to Launch');
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      onSkip();
    };

    sequence();
  }, [onSkip, isRtl]);

  return (
    <div className="fixed inset-0 z-[5000] flex flex-col items-center justify-center overflow-hidden bg-eco-light">
      <div className="egyptian-pattern absolute inset-0 opacity-10 pointer-events-none" />
      
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-eco-green/10 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-eco-accent/10 blur-[120px] rounded-full" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.1 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-28 h-28 bg-eco-green rounded-[2.5rem] flex items-center justify-center shadow-2xl relative overflow-hidden"
          >
            <Sprout className="w-14 h-14 text-white relative z-10" />
            <motion.div 
               animate={{ x: ['-200%', '200%'] }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
            />
          </motion.div>
        </div>

        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-1">
              MoEco
            </h1>
            <p className="text-xs font-bold text-eco-green/60 uppercase tracking-widest">
              Smart Eco-Missions System
            </p>
          </motion.div>
          
          <div className="flex flex-col items-center gap-4 pt-4">
            <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden relative border border-white/10">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-eco-green shadow-lg shadow-eco-green/20"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            <motion.p 
              key={status}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-bold text-slate-400 uppercase tracking-widest h-4"
            >
              {status}
            </motion.p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-20 flex flex-col items-center gap-1.5 text-center"
        >
          <p className="font-bold text-sm text-slate-500 mb-0.5">
            تحت إشراف د/ أمل معتوق
          </p>
          <div className="space-y-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <p>كلية الآداب – جامعة العاصمة</p>
            <p>جميع حقوق الملكية محفوظة للمشروع © ٢٠٢٤</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
