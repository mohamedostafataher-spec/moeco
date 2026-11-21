
import React from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, ShieldCheck, ChevronLeft, RefreshCw } from 'lucide-react';

interface InAppWebViewProps {
  url: string;
  title: string;
  onClose: () => void;
  language: 'ar' | 'en';
}

const InAppWebView: React.FC<InAppWebViewProps> = ({ url, title, onClose, language }) => {
  const [loading, setLoading] = React.useState(true);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const handleRefresh = () => {
    if (iframeRef.current) {
      setLoading(true);
      iframeRef.current.src = url;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[1000] bg-black/90 flex flex-col"
    >
      <div className="bg-egypt-black border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ChevronLeft className={`w-6 h-6 text-white ${language === 'ar' ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex flex-col">
            <h3 className="text-white font-black text-sm">{title}</h3>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3" />
              {language === 'ar' ? 'اتصال آمن بجهة حكومية' : 'Secure Gov Connection'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className="p-2 text-white/50 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 text-white/50 hover:text-white transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          <button 
            onClick={onClose}
            className="p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 border-t border-white/5 font-arabic">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-egypt-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em]">
                {language === 'ar' ? 'جاري تحميل بوابة الخدمات...' : 'Loading Service Portal...'}
              </p>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={url}
          className="w-full h-full border-none"
          onLoad={() => setLoading(false)}
          title={title}
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
        />
      </div>
    </motion.div>
  );
};

export default InAppWebView;
