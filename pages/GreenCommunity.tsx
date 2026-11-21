import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MessageSquare, Heart, Share2, Search, 
  ImageIcon, Send, Sparkles, Globe, Leaf,
  TrendingUp, Award, MoreHorizontal, X, Camera, Zap, Activity, Flame, Clock, BookOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { smartAiService } from '../services/smartAiService';
import { notificationService } from '../services/notificationService';
import { storageService } from '../services/storageService';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  users?: { full_name: string; avatar_url: string; level: number; };
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  users?: { full_name: string; avatar_url: string; level: number; };
  hasLiked?: boolean;
  comments?: Comment[];
  smartScore?: number;
}

const GreenCommunity: React.FC = () => {
  const { language, theme, user } = useApp();
  const isRtl = language === 'ar';
  
  const [rawPosts, setRawPosts] = useState<Post[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  
  const [filter, setFilter] = useState<'smart' | 'trending' | 'latest'>('smart');
  const [activeCategory, setActiveCategory] = useState('all');
  
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [wikiNews, setWikiNews] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'all', label: isRtl ? 'الكل' : 'All', icon: Globe },
    { id: 'energy', label: isRtl ? 'طاقة' : 'Energy', icon: Zap },
    { id: 'agriculture', label: isRtl ? 'زراعة' : 'Planting', icon: Leaf },
    { id: 'recycling', label: isRtl ? 'إعادة تدوير' : 'Recycling', icon: Activity }
  ];

  const categoryKeywords: Record<string, string[]> = {
    energy: ['طاقة', 'كهرباء', 'شمسية', 'energy', 'solar', 'power', 'electricity'],
    agriculture: ['زراعة', 'نبات', 'شجرة', 'زرع', 'زرعت', 'agriculture', 'plant', 'tree', 'farm'],
    recycling: ['تدوير', 'بلاستيك', 'مخلفات', 'قمامة', 'recycling', 'plastic', 'waste', 'trash']
  };

  useEffect(() => {
    fetchPosts();
    fetchAIEcoNews();

    const channel = supabase.channel('community_hub_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => fetchPosts(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_likes' }, () => fetchPosts(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_comments' }, () => fetchPosts(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_reactions' }, () => fetchPosts(false))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchPosts = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          users(full_name, avatar_url, level),
          comments:community_comments(
            *,
            users(full_name, avatar_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const enriched = (data || []).map((p: any) => ({ 
        ...p, 
        hasLiked: false, // In a real app, check community_likes table for currentUser.id
        comments: (p.comments || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }));
      
      setRawPosts(enriched);
    } catch (err) {
      console.error("Community fetch error:", err);
    } finally {
      if (showLoading) setLoading(false);
      setIsSyncing(false);
    }
  };

  const fetchAIEcoNews = async () => {
    try {
       const article = await smartAiService.generateDailyContent('story', language as any);
       if (article && (article as any).title) {
          // Transform single AI story object into an array of search-like results for the UI
          setWikiNews([
            { title: (article as any).title, snippet: (article as any).content || (article as any).lesson || 'Learn more about sustainability.' }
          ]);
       } else {
         // Fallback to Wikipedia if AI fails
         const query = isRtl ? 'الطاقة المجددة' : 'Renewable energy';
         const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&utf8=1&origin=*`);
         const data = await res.json();
         if (data?.query?.search) {
            setWikiNews(data.query.search.slice(0, 3));
         }
       }
    } catch (e) {
       console.error("News fetch error", e);
    }
  };

  // Apply Smart Engine Logic
  useEffect(() => {
    let processed = [...rawPosts];

    // 1. Category Filtering
    if (activeCategory !== 'all') {
      const keywords = categoryKeywords[activeCategory] || [];
      processed = processed.filter(post => {
        const content = post.content.toLowerCase();
        return keywords.some(kw => content.includes(kw));
      });
    }

    const now = Date.now();

    // 2. Ranking & Filtering
    if (filter === 'smart') {
      // Smart: score = likes * 2 + comments * 3 + recentFactor
      processed.forEach(post => {
        const timeDiffHours = (now - new Date(post.created_at).getTime()) / 3600000;
        const recentFactor = Math.max(0, 24 - timeDiffHours); // Up to 24 points for very recent
        post.smartScore = (post.likes_count * 2) + (post.comments_count * 3) + recentFactor;
      });
      processed.sort((a, b) => (b.smartScore || 0) - (a.smartScore || 0));
    } else if (filter === 'trending') {
      // Trending: Only posts within last 24h, sorted by total engagement
      processed = processed.filter(post => {
        const timeDiffHours = (now - new Date(post.created_at).getTime()) / 3600000;
        return timeDiffHours <= 24;
      });
      processed.sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count));
    } else if (filter === 'latest') {
      processed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setDisplayedPosts(processed);
  }, [rawPosts, filter, activeCategory]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async () => {
    if (!user) {
      notificationService.info(isRtl ? 'يجب تسجيل الدخول لنشر مشاركة' : 'Login required to post');
      return;
    }
    if (!newPost.trim() && !imageFile) return;

    setIsPosting(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        try {
          imageUrl = await storageService.uploadImage(imageFile, 'community');
        } catch (uploadErr) {
          console.warn("Upload failed, using preview as fallback", uploadErr);
          imageUrl = imagePreview; 
        }
      }

      const data = await storageService.createCommunityPost({
        content: newPost.trim(),
        image_url: imageUrl,
        likes_count: 0,
        comments_count: 0
      });

      const freshPost = { ...data, hasLiked: false, comments: [] };
      setRawPosts(prev => [freshPost, ...prev]);
      
      setNewPost('');
      setImageFile(null);
      setImagePreview(null);
      notificationService.success(isRtl ? 'تم النشر بنجاح!' : 'Posted successfully!');
    } catch (err: any) {
      notificationService.error(err.message || 'Post failed');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return notificationService.info(isRtl ? 'سجل دخول للإعجاب' : 'Login to like');
    const post = rawPosts.find(p => p.id === postId);
    if (!post) return;
    
    const isLiked = post.hasLiked;
    
    setRawPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { 
          ...p, 
          likes_count: isLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1,
          hasLiked: !isLiked
        };
      }
      return p;
    }));

    try {
      await storageService.togglePostLike(postId, isLiked);
    } catch (err) {
       console.error("Like update error", err);
    }
  };

  const toggleComments = async (postId: string) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }
    setActiveCommentsPostId(postId);
    try {
      const data = await storageService.getCommunityComments(postId);
      if (data) {
        setRawPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: data } : p));
      }
    } catch (e) { 
      console.error('Comment fetch error', e); 
    }
  };

  const submitComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;
    const content = newComment;
    setNewComment('');

    try {
      const data = await storageService.submitCommunityComment(postId, content);
      if (data) {
        setRawPosts(prev => prev.map(p => p.id === postId ? { 
          ...p, 
          comments: [...(p.comments || []), data], 
          comments_count: (p.comments_count || 0) + 1 
        } : p));
      }
    } catch (e) {
      console.error("Comment submission error", e);
    }
  };

  const getUserBadge = (level: number) => {
    if (level >= 10) return { icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10', title: isRtl ? 'بطل البيئة' : 'Eco Hero' };
    if (level >= 5) return { icon: Sparkles, color: 'text-blue-500', bg: 'bg-blue-500/10', title: isRtl ? 'مؤثر' : 'Influencer' };
    return { icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-500/10', title: isRtl ? 'عضو' : 'Member' };
  };

  return (
    <div className={`min-h-screen pb-24 overflow-x-hidden flex flex-col ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`}>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-emerald-500/10 dark:border-white/5 py-4 px-4 sm:px-6 safe-area-top">
        <div className="w-full max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
               <Globe className="text-emerald-500" size={24} />
               <span className="truncate flex-1">{isRtl ? 'المجتمع الأخضر' : 'Green Community'}</span>
            </h1>
            <p className="text-[10px] sm:text-xs font-bold text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <Users size={12} /> {isRtl ? 'بث مباشر للبيئة' : 'Eco Live Feed'}
            </p>
          </div>
          <motion.div 
            whileTap={{ scale: 0.9 }}
            onClick={() => fetchPosts()}
            className={`${isSyncing ? 'animate-spin' : ''}`}
          >
            <Award className="text-amber-500 cursor-pointer" size={28} />
          </motion.div>
        </div>
        
        {/* Categories / Interests Filtering */}
        <div className="max-w-3xl mx-auto mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map(cat => {
             const Icon = cat.icon;
             const isActive = activeCategory === cat.id;
             return (
               <button
                 key={cat.id}
                 onClick={() => setActiveCategory(cat.id)}
                 className={`flex-none flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all ${isActive ? 'bg-emerald-500 text-white shadow-md' : theme === 'dark' ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'}`}
               >
                 <Icon size={14} /> {cat.label}
               </button>
             );
          })}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 flex flex-col">
        
        {/* Post Creator */}
        <div className={`p-4 sm:p-6 rounded-[2rem] border shadow-xl transition-all ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
          <div className="flex gap-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0 flex items-center justify-center font-black text-white bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md`}>
              {user?.full_name?.charAt(0) || 'E'}
            </div>
            <div className="flex-1 min-w-0">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder={isRtl ? 'شارك أفكارك وإنجازاتك البيئية...' : 'Share your environmental thoughts...'}
                className="w-full bg-transparent border-none focus:ring-0 text-sm sm:text-base font-medium resize-none outline-none min-h-[60px]"
              />
              
              <AnimatePresence>
                {imagePreview && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative mt-2 mb-4">
                    <img src={imagePreview} alt="Preview" className="rounded-2xl max-h-48 object-cover w-full border border-slate-200 dark:border-white/10" />
                    <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-md">
                      <X size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 sm:mt-0 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 flex-wrap">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
              <button onClick={() => fileInputRef.current?.click()} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase transition-colors ${theme === 'dark' ? 'bg-white/5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10' : 'bg-slate-50 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                <Camera size={16} /> <span>{isRtl ? 'صورة' : 'Photo'}</span>
              </button>
            </div>
            <button 
              onClick={handleCreatePost}
              disabled={isPosting || (!newPost.trim() && !imageFile)}
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50 active:scale-95 transition-all shrink-0"
            >
              {isPosting ? <Sparkles className="animate-spin" size={16} /> : <Send size={16} />} 
              <span className="hidden sm:inline">{isRtl ? 'نشر' : 'Post'}</span>
            </button>
          </div>
        </div>
        
        {/* Wiki News Alert */}
        {wikiNews.length > 0 && (
          <div className={`p-4 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-indigo-900/20 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3 flex items-center gap-1">
              <BookOpen size={12} /> {isRtl ? 'أخبار بيئية عالمية مصدرها Wikipedia API' : 'Global Eco News sourced via Wikipedia API'}
            </h3>
            <div className="space-y-3">
               {wikiNews.map((news, idx) => (
                 <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(news.title)}`} target="_blank" rel="noreferrer" key={idx} className="block group">
                    <h4 className="text-sm font-black group-hover:text-indigo-600 transition-colors mb-1">{news.title}</h4>
                    <p className="text-xs font-medium text-slate-500 line-clamp-2" dangerouslySetInnerHTML={{ __html: news.snippet }} />
                 </a>
               ))}
            </div>
          </div>
        )}

        {/* Smart Filter Tabs */}
        <div className={`flex rounded-2xl p-1.5 border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
          {[
            { id: 'smart', icon: Sparkles, ar: 'ذكاء', en: 'Smart' }, 
            { id: 'trending', icon: Flame, ar: 'تريند', en: 'Trending' },
            { id: 'latest', icon: Clock, ar: 'الأحدث', en: 'Latest' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${filter === f.id ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              <f.icon size={14} /> {isRtl ? f.ar : f.en}
            </button>
          ))}
        </div>

        {/* Feed Area */}
        <div className="space-y-6">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className={`h-48 rounded-[2.5rem] animate-pulse border ${theme === 'dark' ? 'bg-slate-900/50 border-white/5' : 'bg-white/50 border-slate-100'}`} />
            ))
          ) : displayedPosts.length === 0 ? (
            <div className={`text-center py-20 rounded-[3rem] border border-dashed ${theme === 'dark' ? 'border-slate-700 bg-slate-900/50' : 'border-slate-300 bg-slate-50'}`}>
               {activeCategory !== 'all' ? (
                 <>
                   <Search size={48} className="mx-auto text-slate-300 mb-4" />
                   <p className="text-sm font-black text-slate-400">{isRtl ? 'لا يوجد محتوى في هذا القسم حالياً' : 'No content in this category yet'}</p>
                 </>
               ) : filter === 'trending' ? (
                 <>
                   <Flame size={48} className="mx-auto text-slate-300 mb-4" />
                   <p className="text-sm font-black text-slate-400">{isRtl ? 'لا توجد بوستات تريند اليوم' : 'No trending posts today'}</p>
                 </>
               ) : (
                 <>
                   <Users size={48} className="mx-auto text-slate-300 mb-4" />
                   <p className="text-sm font-black text-slate-400">{isRtl ? 'كن أول من يشارك في المجتمع' : 'Be the first to post'}</p>
                 </>
               )}
            </div>
          ) : (
            displayedPosts.map(post => {
              const badge = getUserBadge(post.users?.level || 1);
              return (
              <motion.div layout key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[2.5rem] p-5 sm:p-6 shadow-md border transition-all ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-white font-black text-lg shadow-inner shrink-0 relative">
                      {post.users?.full_name?.charAt(0) || 'E'}
                      {/* Gamification Badge Icon overlay */}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-white dark:bg-slate-900 ${badge.color}`}>
                         <badge.icon size={12} className="drop-shadow-sm" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                         <p className="text-sm font-black truncate">{post.users?.full_name || 'Eco Warrior'}</p>
                         <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${badge.bg} ${badge.color}`}>
                           {badge.title} LVL{post.users?.level || 1}
                         </div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate flex items-center gap-1">
                        {filter === 'smart' && post.smartScore ? (
                          <span className="text-emerald-500 font-black"><Sparkles size={10} className="inline" /> Score {post.smartScore.toFixed(0)} •</span>
                        ) : null}
                        {new Date(post.created_at).toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-emerald-500 transition-colors bg-slate-50 dark:bg-white/5 rounded-full shrink-0">
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                <p className="text-sm sm:text-base font-medium leading-relaxed mb-4 whitespace-pre-wrap break-words">
                  {post.content}
                </p>

                {post.image_url && (
                  <div className="mb-4 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img src={post.image_url} alt="Post media" className="w-full max-h-96 object-cover" loading="lazy" />
                  </div>
                )}

                <div className="flex items-center gap-4 sm:gap-6 pt-4 border-t border-slate-100 dark:border-white/5">
                  <button onClick={() => handleLike(post.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors ${post.hasLiked ? 'text-rose-500 bg-rose-500/10' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                    <Heart size={18} className={post.hasLiked ? 'fill-rose-500' : ''} />
                    <span className="text-xs sm:text-sm font-black">{post.likes_count}</span>
                  </button>
                  <button onClick={() => toggleComments(post.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors ${activeCommentsPostId === post.id ? 'text-blue-500 bg-blue-500/10' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                    <MessageSquare size={18} className={activeCommentsPostId === post.id ? 'fill-blue-500/20' : ''} />
                    <span className="text-xs sm:text-sm font-black">{post.comments_count}</span>
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 ml-auto transition-colors">
                    <Share2 size={18} />
                  </button>
                </div>

                <AnimatePresence>
                  {activeCommentsPostId === post.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                      <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar pb-2">
                        {post.comments && post.comments.length > 0 ? (
                          post.comments.map(comment => (
                            <div key={comment.id} className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-black shrink-0">
                                {comment.users?.full_name?.charAt(0) || 'U'}
                              </div>
                              <div className={`p-3 rounded-2xl rounded-tl-none text-sm break-words flex-1 min-w-0 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                                <div className="font-black text-xs mb-1 opacity-70 truncate">{comment.users?.full_name || 'User'}</div>
                                {comment.content}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-xs font-bold text-slate-400 py-4">{isRtl ? 'كن أول من يعلق' : 'Be the first to comment'}</div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-2 pt-2 bg-white dark:bg-slate-900 sticky bottom-0 z-10">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}
                          placeholder={isRtl ? 'اكتب تعليقاً...' : 'Write a comment...'}
                          className={`flex-1 rounded-xl px-4 py-2 text-sm outline-none min-w-0 ${theme === 'dark' ? 'bg-white/5 focus:bg-white/10' : 'bg-slate-100 focus:bg-slate-200'}`}
                        />
                        <button onClick={() => submitComment(post.id)} disabled={!newComment.trim()} className="bg-emerald-500 text-white p-2 rounded-xl disabled:opacity-50 hover:bg-emerald-600 transition-colors shrink-0">
                          <Send size={18} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )})
          )}
        </div>
      </main>
    </div>
  );
};

export default GreenCommunity;
