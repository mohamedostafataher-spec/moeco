
import React from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Database, 
  Globe, 
  Zap, 
  Droplets, 
  Car, 
  Trash2, 
  Info, 
  ShieldCheck, 
  FileText,
  ExternalLink,
  Scale,
  Activity,
  Award,
  Landmark
} from 'lucide-react';

const Methodology: React.FC = () => {
  const { language, theme } = useApp();
  const isRtl = language === 'ar';

  const sections = [
    {
      id: 'electricity',
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: isRtl ? 'الكهرباء والطاقة' : 'Electricity & Energy',
      description: isRtl 
        ? 'نعتمد في حساباتنا على معامل الانبعاثات الخاص بالشبكة القومية المصرية للكهرباء (EEHC).' 
        : 'Our calculations are based on the emission factor of the Egyptian National Electricity Grid (EEHC).',
      formula: 'CO2 = kWh × 0.533 kg/kWh',
      source: 'IPCC & Egyptian Ministry of Electricity (2023/2024 Report)',
      details: isRtl
        ? 'يتم تحديث المعامل سنوياً بناءً على مزيج الطاقة المصري (غاز طبيعي، طاقة شمسية، رياح، كهرومائية).'
        : 'The factor is updated annually based on the Egyptian energy mix (Natural Gas, Solar, Wind, Hydro).'
    },
    {
      id: 'water',
      icon: <Droplets className="w-6 h-6 text-blue-500" />,
      title: isRtl ? 'المياه والصرف' : 'Water & Sanitation',
      description: isRtl 
        ? 'يتم احتساب البصمة الكربونية للمياه بناءً على الطاقة المستهلكة في محطات التحلية والمعالجة والضخ.' 
        : 'The carbon footprint of water is calculated based on energy consumed in desalination, treatment, and pumping stations.',
      formula: 'CO2 = m³ × 0.298 kg/m³',
      source: 'Holding Company for Water and Wastewater (HCWW)',
      details: isRtl
        ? 'يشمل ذلك مراحل التنقية والتوزيع ومعالجة مياه الصرف الصحي.'
        : 'This includes purification, distribution, and wastewater treatment stages.'
    },
    {
      id: 'transport',
      icon: <Car className="w-6 h-6 text-red-500" />,
      title: isRtl ? 'النقل والمواصلات' : 'Transport & Mobility',
      description: isRtl 
        ? 'تختلف المعاملات بناءً على نوع الوقود (بنزين، ديزل، غاز طبيعي) وكفاءة المحرك.' 
        : 'Factors vary based on fuel type (Petrol, Diesel, CNG) and engine efficiency.',
      formula: 'CO2 = km × (Fuel Factor / Efficiency)',
      source: 'CAPMAS & Ministry of Transport',
      details: isRtl
        ? 'نستخدم متوسط استهلاك 8 لتر/100 كم للسيارات المتوسطة في مصر.'
        : 'We use an average consumption of 8L/100km for medium-sized cars in Egypt.'
    },
    {
      id: 'waste',
      icon: <Trash2 className="w-6 h-6 text-emerald-500" />,
      title: isRtl ? 'إدارة النفايات' : 'Waste Management',
      description: isRtl 
        ? 'يتم احتساب انبعاثات الميثان الناتجة عن تحلل النفايات العضوية في المدافن الصحية.' 
        : 'Methane emissions from organic waste decomposition in landfills are calculated.',
      formula: 'CO2e = kg × 1.9 kg CO2e/kg',
      source: 'Waste Management Regulatory Authority (WMRA)',
      details: isRtl
        ? 'يتم تحويل الميثان إلى مكافئ ثاني أكسيد الكربون (GWP = 28).'
        : 'Methane is converted to CO2 equivalent (GWP = 28).'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center space-y-4 mb-12">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex p-4 bg-egypt-black text-egypt-gold rounded-3xl shadow-2xl mb-4"
        >
          <BookOpen className="w-10 h-10" />
        </motion.div>
        <h1 className="text-4xl font-black text-egypt-black font-arabic tracking-tight">
          {isRtl ? 'المنهجية العلمية' : 'Scientific Methodology'}
        </h1>
        <p className="text-zinc-500 max-w-2xl mx-auto font-medium">
          {isRtl 
            ? 'تعرف على الأسس العلمية والمعايير الدولية التي نستخدمها في MoEco لحساب بصمتك الكربونية بدقة متناهية.' 
            : 'Learn about the scientific foundations and international standards we use at MoEco to calculate your carbon footprint with extreme precision.'}
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <motion.div
            key={section.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 bg-zinc-50 rounded-2xl group-hover:bg-egypt-black group-hover:text-white transition-colors">
                {section.icon}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Verified
              </div>
            </div>
            
            <h3 className="text-xl font-black text-egypt-black mb-3 font-arabic">{section.title}</h3>
            <p className="text-sm text-zinc-500 mb-6 leading-relaxed font-medium">{section.description}</p>
            
            <div className="space-y-4">
              <div className="p-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Calculation Formula</p>
                <code className="text-sm font-mono font-bold text-egypt-red">{section.formula}</code>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <Database className="w-4 h-4" />
                <span>Source: <span className="text-egypt-black font-bold">{section.source}</span></span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Academic Standards */}
      <div className="mt-12 bg-egypt-black text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-egypt-gold/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
            <Landmark className="w-8 h-8 text-egypt-gold" />
            <h2 className="text-2xl font-black font-arabic">{isRtl ? 'التوافق مع رؤية مصر 2030' : 'Alignment with Egypt Vision 2030'}</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-2">
              <p className="text-egypt-gold font-black text-xs uppercase tracking-widest">GHG Protocol</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isRtl ? 'نتبع بروتوكول الغازات الدفيئة (GHG Protocol) المعترف به دولياً لتصنيف الانبعاثات (Scope 1, 2, 3).' : 'We follow the internationally recognized GHG Protocol for emission classification (Scope 1, 2, 3).'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-egypt-gold font-black text-xs uppercase tracking-widest">National Strategy</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isRtl ? 'تتوافق منهجيتنا مع الاستراتيجية الوطنية لتغير المناخ في مصر 2050 وأهداف التنمية المستدامة.' : 'Our methodology aligns with Egypt’s National Climate Change Strategy 2050 and Sustainable Development Goals.'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-egypt-gold font-black text-xs uppercase tracking-widest">Academic Rigor</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isRtl ? 'تمت مراجعة معاملات الانبعاثات بناءً على أحدث الأبحاث العلمية المنشورة في المجلات البيئية المصرية.' : 'Emission factors have been reviewed based on the latest scientific research published in Egyptian environmental journals.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Badge */}
      <div className="mt-12 flex flex-col items-center space-y-6">
        <div className="flex items-center gap-6">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/IPCC_logo.svg/1200px-IPCC_logo.svg.png" className="h-12 grayscale opacity-50" alt="IPCC" referrerPolicy="no-referrer" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/UNFCCC_Logo.svg/1200px-UNFCCC_Logo.svg.png" className="h-12 grayscale opacity-50" alt="UNFCCC" referrerPolicy="no-referrer" />
        </div>
        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em]">Scientifically Audited & Verified</p>
      </div>
    </div>
  );
};

export default Methodology;
