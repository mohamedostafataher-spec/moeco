import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, MessageSquare, Heart, Share2, Award, TrendingUp, 
  Plus, Image as ImageIcon, Globe, Flag, ShieldCheck
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { useApp } from '../context/AppContext';

export const CommunityFeed: React.FC = () => {
  const { theme, language } = useApp();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);

  useEffect(() => {
    setPosts(storageService.getSocialFeed());
  }, []);

  const handlePost = () => {
    if (!newPost.trim()) return;
    const post = {
      userName: 'You',
      action: newPost,
      impact: 'Calculated Impact',
    };
    storageService.postToFeed(post);
    setPosts(storageService.getSocialFeed());
    setNewPost('');
    setShowPostModal(false);
  };

  const isRtl = language === 'ar';

  return (
    <div className={`p-8 rounded-[3rem] border shadow-2xl overflow-hidden ${
      theme === 'dark' ? 'bg-egypt-black border-egypt-gold/20' : 'bg-white border-egypt-gold/10'
    }`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-egypt-gold text-egypt-black rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black font-arabic">{isRtl ? 'مجتمع MoEco' : 'MoEco Community'}</h3>
            <p className="text-[10px] font-black text-egypt-gold uppercase tracking-widest">{isRtl ? 'شارك إنجازاتك البيئية' : 'Share your eco-achievements'}</p>
          </div>
        </div>
        <button 
          onClick={() => setShowPostModal(true)}
          className="p-4 bg-egypt-red text-white rounded-2xl hover:scale-105 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6 max-h-[300px] sm:h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {posts.map((post) => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-3xl border ${
              theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-egypt-gold flex items-center justify-center font-black text-egypt-black">
                  {post.userName[0]}
                </div>
                <div>
                  <h4 className="font-black text-sm">{post.userName}</h4>
                  <p className="text-[8px] text-zinc-500 uppercase tracking-widest">
                    {new Date(post.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[8px] font-black uppercase tracking-widest">
                {post.impact}
              </div>
            </div>
            
            <p className="text-sm leading-relaxed mb-6 opacity-80">{post.action}</p>
            
            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-egypt-red transition-colors">
                <Heart className="w-4 h-4" /> {post.likes}
              </button>
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-egypt-gold transition-colors">
                <MessageSquare className="w-4 h-4" /> {isRtl ? 'تعليق' : 'Comment'}
              </button>
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                <Share2 className="w-4 h-4" /> {isRtl ? 'مشاركة' : 'Share'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-md w-full p-10 bg-egypt-black border border-egypt-gold/20 rounded-[3rem] shadow-2xl space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-black text-white font-arabic mb-2">{isRtl ? 'انشر إنجازك' : 'Post Achievement'}</h2>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{isRtl ? 'ألهم الآخرين بخطواتك الخضراء' : 'Inspire others with your green steps'}</p>
              </div>
              
              <textarea 
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-egypt-gold transition-all h-32 resize-none"
                placeholder={isRtl ? 'ماذا فعلت اليوم للبيئة؟' : 'What did you do for the environment today?'}
              />

              <div className="flex gap-4">
                <button onClick={() => setShowPostModal(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-zinc-400 font-black uppercase tracking-widest text-[10px]">
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button onClick={handlePost} className="flex-1 py-4 rounded-2xl bg-egypt-gold text-egypt-black font-black uppercase tracking-widest text-[10px]">
                  {isRtl ? 'نشر الآن' : 'Post Now'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
