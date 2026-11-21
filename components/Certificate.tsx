
import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Award, Download, Printer, ShieldCheck, Globe, Leaf } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Certificate: React.FC<{ userName?: string; score?: number; rank?: string; data?: any }> = ({ userName, score, rank, data }) => {
  const { language, user } = useApp();
  const certRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-end gap-4 no-print">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-egypt-black text-egypt-gold rounded-2xl font-black shadow-xl hover:scale-105 transition-all"
        >
          <Printer className="w-5 h-5" />
          {language === 'ar' ? 'طباعة الشهادة' : 'Print Certificate'}
        </button>
      </div>

      <div 
        ref={certRef}
        className="certificate-container relative bg-white p-12 md:p-20 border-[16px] border-double border-egypt-gold shadow-2xl overflow-hidden mx-auto max-w-4xl"
        style={{ aspectRatio: '1.414/1' }}
      >
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <Globe className="absolute -top-20 -left-10 sm:-left-20 w-full sm:w-96 h-96" />
          <Leaf className="absolute -bottom-20 -right-10 sm:-right-20 w-full sm:w-96 h-96" />
        </div>

        {/* Header */}
        <div className="relative z-10 text-center space-y-6">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-egypt-black rounded-full shadow-xl">
              <Award className="w-16 h-16 text-egypt-gold" />
            </div>
          </div>
          
          <h1 className="text-5xl font-black text-egypt-black tracking-tighter uppercase mb-2">MoEco 2026</h1>
          <p className="text-egypt-gold font-black tracking-[0.3em] uppercase text-sm">Official Sustainability Certification</p>
          
          <div className="h-px bg-egypt-gold/30 w-1/2 mx-auto my-8" />
          
          <p className="text-zinc-500 font-serif italic text-xl">This is to certify that</p>
          <h2 className="text-4xl font-black text-egypt-black font-arabic my-6">{userName || (user as any)?.full_name || user?.name || 'Eco Hero'}</h2>
          
          <p className="text-zinc-600 max-w-2xl mx-auto leading-relaxed font-medium">
            {language === 'ar' 
              ? 'قد أتم بنجاح متطلبات برنامج الاستدامة الوطني، وساهم بشكل فعال في تقليل الانبعاثات الكربونية وحماية الموارد الطبيعية لجمهورية مصر العربية.'
              : 'has successfully completed the national sustainability requirements and actively contributed to reducing carbon emissions and protecting the natural resources of the Arab Republic of Egypt.'}
          </p>

          <div className="grid grid-cols-3 gap-8 mt-16 pt-12 border-t border-egypt-gold/20">
            <div className="text-center">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Impact Score</p>
              <p className="text-2xl font-black text-egypt-black">{score || data?.totalCO2 || 0} kg CO₂</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Rank</p>
              <p className="text-lg font-black text-egypt-black">{rank || 'Eco Hero'}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Issue Date</p>
              <p className="text-lg font-black text-egypt-black">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Certificate ID</p>
              <p className="text-lg font-black text-egypt-black">MO-{Date.now().toString(36).toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Official Stamp */}
        <div className="absolute bottom-12 right-12 md:bottom-20 md:right-20 transform rotate-[-15deg]">
          <div className="relative w-32 h-32 md:w-40 md:h-40 border-4 border-egypt-red/40 rounded-full flex items-center justify-center p-2 opacity-80">
            <div className="absolute inset-0 border-2 border-egypt-red/20 rounded-full m-1" />
            <div className="text-center">
              <p className="text-[8px] md:text-[10px] font-black text-egypt-red uppercase leading-tight">MoEco Official<br/>Verification</p>
              <ShieldCheck className="w-8 h-8 md:w-12 md:h-12 text-egypt-red mx-auto my-1" />
              <p className="text-[8px] md:text-[10px] font-black text-egypt-red uppercase">Approved 2026</p>
            </div>
          </div>
        </div>

        {/* Footer Branding */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-zinc-300 uppercase tracking-[0.5em]">
          Empowering a Greener Future
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .certificate-container, .certificate-container * { visibility: visible; }
          .certificate-container { 
            position: fixed; 
            left: 0; 
            top: 0; 
            width: 100%; 
            height: auto;
            border: none;
            box-shadow: none;
          }
          .no-print { display: none !important; }
        }
      `}} />
    </div>
  );
};

// export default Certificate;
