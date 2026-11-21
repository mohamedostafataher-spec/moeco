
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Send, Globe, Users, MessageCircle, Sparkles, ShieldCheck, Camera, Smile, MoreVertical, Loader2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { ChatMessage } from '../types';

const ROOMS = [
  { id: 'global', name: 'Global Plaza', icon: Globe, color: 'bg-blue-500' },
  { id: 'local', name: 'Local Community', icon: Users, color: 'bg-emerald-500' },
  { id: 'tips', name: 'Eco Tips', icon: Sparkles, color: 'bg-amber-500' }
];

const CommunityChat: React.FC = () => {
  const { t, language, user, theme } = useApp();
  const [activeRoom, setActiveRoom] = useState('global');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const allHistory = await storageService.getChatHistory();
      const history = allHistory.filter(m => (m as any).roomId === activeRoom);
      if (history.length === 0) {
        const welcomeMsg: ChatMessage = {
          id: 'welcome',
          senderId: 'moeco-ai',
          senderName: 'MoEco Guide',
          text: language === 'ar' ? 'مرحباً بك في مو إيكو! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم في رحلتك لتقليل انبعاثات الكربون؟' : 'Welcome to MoEco! I am your AI Guide. How can I help you today on your journey to reduce carbon emissions?',
          timestamp: Date.now(),
          isAi: true
        };
        setMessages([welcomeMsg]);
      } else {
        setMessages(history);
      }
    };
    fetchHistory();
  }, [activeRoom, language]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: user?.id || 'guest',
      senderName: user?.name || 'User',
      text: inputText,
      timestamp: Date.now(),
    };
    (userMsg as any).roomId = activeRoom;

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    storageService.saveChatMessage(userMsg);
    const userQuery = inputText;
    setInputText("");

    // Simulate response from AI Community Guide
    setIsTyping(true);
    setTimeout(() => {
      const responseText = language === 'ar' ? 'شكراً لمشاركتك! نحن نعمل على تحسين البيئة معاً.' : 'Thanks for sharing! We are working to improve the environment together.';
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        senderId: 'moeco-ai',
        senderName: 'MoEco Guide',
        text: responseText,
        timestamp: Date.now(),
        isAi: true
      };
      (aiMsg as any).roomId = activeRoom;
      setMessages(prev => [...prev, aiMsg]);
      storageService.saveChatMessage(aiMsg);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-12rem)] gap-6 animate-in fade-in duration-700">
      
      {/* Sidebar Rooms */}
      <div className="lg:w-72 flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
        {ROOMS.map(room => (
          <button
            key={room.id}
            onClick={() => setActiveRoom(room.id)}
            className={`flex-1 lg:flex-none flex items-center gap-4 p-5 rounded-[2rem] transition-all font-black text-sm whitespace-normal sm:whitespace-nowrap break-words shadow-sm border ${
              activeRoom === room.id 
                ? 'bg-emerald-950 text-white border-emerald-400/30 shadow-xl scale-105' 
                : (theme === 'dark' ? 'bg-[#001a14] text-emerald-700 border-emerald-900/20' : 'bg-white text-stone-400 border-stone-100 hover:bg-stone-50')
            }`}
          >
            <div className={`p-2 rounded-xl ${room.color} text-white`}>
              <room.icon className="w-5 h-5" />
            </div>
            {room.name}
          </button>
        ))}
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col rounded-[3rem] shadow-2xl border overflow-hidden transition-all duration-500 ${
        theme === 'dark' ? 'bg-[#000d0a] border-emerald-900/30' : 'bg-white border-stone-100'
      }`}>
        
        {/* Header */}
        <div className="p-6 bg-emerald-950 text-white flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${ROOMS.find(r => r.id === activeRoom)?.color}`}>
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black font-arabic text-xl">{ROOMS.find(r => r.id === activeRoom)?.name}</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                <p className="text-[10px] opacity-50 uppercase font-black">Connected to Global Hub</p>
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Messages List */}
        <div className={`flex-1 overflow-y-auto p-8 space-y-6 ${theme === 'dark' ? 'bg-black/20' : 'bg-stone-50/50'}`}>
          {messages.length === 0 && !isTyping && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
               <MessageCircle className="w-16 h-16" />
               <p className="font-black uppercase text-xs tracking-widest">No messages in this room yet.<br/>Start the conversation!</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={msg.id || idx} className={`flex flex-col ${msg.senderId === user?.id ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
              <div className="flex items-center gap-2 mb-1 px-4">
                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{msg.senderName}</span>
                {msg.senderId === 'moeco-ai' && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
              </div>
              <div className={`max-w-[80%] p-5 rounded-[2.5rem] shadow-sm relative group ${
                msg.senderId === user?.id 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : (theme === 'dark' ? 'bg-[#002b22] text-emerald-100 rounded-tl-none' : 'bg-white border border-stone-100 text-emerald-950 rounded-tl-none')
              }`}>
                <p className="text-sm leading-relaxed font-arabic font-medium">{msg.text}</p>
                <span className="text-[8px] opacity-30 mt-2 block tabular-nums">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-4 px-4 animate-pulse">
               <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Guide is responding...</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-6 bg-emerald-950/5 border-t border-emerald-900/10 flex gap-4 items-center">
          <button type="button" className="p-3 text-stone-400 hover:text-emerald-500 transition-colors">
            <Camera className="w-6 h-6" />
          </button>
          <div className="flex-1 relative">
            <input 
              value={inputText} 
              onChange={e => setInputText(e.target.value)} 
              placeholder={language === 'ar' ? `اكتب رسالة في ${ROOMS.find(r => r.id === activeRoom)?.name}...` : `Message in ${ROOMS.find(r => r.id === activeRoom)?.name}...`} 
              className={`w-full px-8 py-5 rounded-[2rem] outline-none font-bold text-sm transition-all shadow-inner border ${
                theme === 'dark' ? 'bg-[#001a14] border-emerald-900/50 text-white focus:border-emerald-400' : 'bg-stone-50 border-stone-100 text-emerald-950 focus:bg-white focus:border-emerald-300'
              }`} 
            />
            <button type="button" className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-amber-500">
               <Smile className="w-5 h-5" />
            </button>
          </div>
          <button 
            type="submit" 
            disabled={!inputText.trim() || isTyping}
            className="bg-emerald-600 hover:bg-emerald-500 text-white p-5 rounded-full shadow-2xl transition-all active:scale-90 disabled:opacity-50 disabled:grayscale"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommunityChat;
