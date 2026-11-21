import React from 'react';

interface FooterProps {
  language?: string;
}

export const Footer: React.FC<FooterProps> = ({ language = 'ar' }) => {
  const isRtl = language === 'ar';

  return (
    <footer className="fixed bottom-0 left-0 w-full p-4 text-center z-50 pointer-events-none">
     <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 d-inline-block pointer-events-auto">
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold leading-tight">
          {isRtl ? (
            <>
              تحت إشراف د/ أمل معتوق <br/>
              كلية الآداب – جامعة العاصمة <br/>
              جميع حقوق الملكية محفوظة <br/>
              مطور التطبيق: Mohamed Mostafa Taher
            </>
          ) : (
            <>
              Supervised by Dr. Amal Matouk <br/>
              Faculty of Arts – Cairo University <br/>
              All rights reserved <br/>
              App Developer: Mohamed Mostafa Taher
            </>
          )}
        </p>
     </div>
    </footer>
  );
};
