
import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, ShoppingBag, Award, AlertTriangle, Info, Loader2, Trash2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  title_ar: string;
  title_en: string;
  body_ar: string;
  body_en: string;
  type: 'reward' | 'purchase' | 'alert' | 'info';
  is_read: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { language, theme } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const isRtl = language === 'ar';

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await storageService.getNotifications();
    setNotifications(data);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await storageService.markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'reward': return <Award className="w-5 h-5 text-egypt-gold" />;
      case 'purchase': return <ShoppingBag className="w-5 h-5 text-emerald-500" />;
      case 'alert': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]" 
          />
          <motion.div 
            initial={{ x: isRtl ? -400 : 400 }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? -400 : 400 }}
            className={`fixed top-0 bottom-0 ${isRtl ? 'left-0' : 'right-0'} w-full max-w-md z-[201] shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-[#001a14] border-l border-emerald-400/20' : 'bg-white'}`}
          >
            <div className="p-8 border-b border-stone-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl">
                  <Bell className="w-6 h-6 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black font-arabic">{isRtl ? 'التنبيهات' : 'Notifications'}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-white/5 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                  <p className="text-stone-400 font-bold">{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                  <div className="p-6 bg-stone-50 dark:bg-white/5 rounded-full">
                    <Bell className="w-12 h-12 text-stone-200" />
                  </div>
                  <p className="text-stone-400 font-bold">{isRtl ? 'لا توجد تنبيهات جديدة' : 'No new notifications'}</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div 
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                    className={`p-6 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden group ${
                      notification.is_read 
                        ? (theme === 'dark' ? 'bg-white/5 border-white/5 opacity-60' : 'bg-stone-50 border-stone-100 opacity-60') 
                        : (theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20 shadow-lg' : 'bg-white border-stone-200 shadow-md')
                    }`}
                  >
                    {!notification.is_read && (
                      <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500" />
                    )}
                    <div className="flex gap-5">
                      <div className={`p-4 rounded-2xl h-fit ${theme === 'dark' ? 'bg-black/40' : 'bg-stone-100'}`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-sm">{isRtl ? notification.title_ar : notification.title_en}</h3>
                          <span className="text-[9px] font-bold text-stone-400">
                            {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-stone-500 leading-relaxed">
                          {isRtl ? notification.body_ar : notification.body_en}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="p-8 border-t border-stone-100 dark:border-white/5">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 transition-all active:scale-95"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
