
import React from 'react';
import { useApp } from '../context/AppContext';
import DailyServicesHub from '../components/DailyServicesHub';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DailyServices: React.FC = () => {
  const { language, isRtl } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-32" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-egypt-gold hover:text-egypt-black transition-all"
          >
            <ChevronLeft className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <h1 className="text-3xl font-black font-arabic">
              {language === 'ar' ? 'خدمات السلع اليومية' : 'Daily Goods Services'}
            </h1>
            <p className="text-zinc-500 font-bold">
              {language === 'ar' ? 'أسعار السلع، مواقيت الصلاة، والخدمات القريبة' : 'Commodity prices, prayer times, and nearby services'}
            </p>
          </div>
        </div>

        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <DailyServicesHub />
        </motion.div>
      </div>
    </div>
  );
};

export default DailyServices;
