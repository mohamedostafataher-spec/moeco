
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, Calendar, Filter, Download, Zap, Droplets, Flame, 
  Car, ShoppingBag, Utensils, Search, ArrowLeft, Trash2, 
  ExternalLink, TrendingDown, Scale, Database, Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { supabase } from '../services/supabaseClient';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

const CalculationRecords: React.FC = () => {
  const { language, isRtl, user } = useApp();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRecords();

    const channel = supabase
      .channel('consumption_records_changes_calc')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'consumption_records' }, 
        () => {
          fetchRecords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await storageService.getRecords();
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'All', ar: 'الكل', en: 'All' },
    { id: 'electricity', ar: 'الكهرباء', en: 'Electricity', icon: Zap, color: 'text-amber-500' },
    { id: 'water', ar: 'المياه', en: 'Water', icon: Droplets, color: 'text-blue-500' },
    { id: 'gas', ar: 'الغاز', en: 'Gas', icon: Flame, color: 'text-orange-500' },
    { id: 'transport', ar: 'النقل', en: 'Transport', icon: Car, color: 'text-emerald-500' },
    { id: 'food', ar: 'الغذاء', en: 'Food', icon: Utensils, color: 'text-red-500' },
    { id: 'shopping', ar: 'التسوق', en: 'Shopping', icon: ShoppingBag, color: 'text-purple-500' },
  ];

  const filteredRecords = records.filter(r => {
    const matchesFilter = filter === 'All' || r.sector === filter;
    const matchesSearch = (r.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (r.sector || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const exportToExcel = () => {
    const data = filteredRecords.map(r => ({
      Date: new Date(r.created_at || r.timestamp || r.record_date).toLocaleString(),
      Sector: r.sector,
      Consumption: r.value,
      Unit: r.unit,
      Bill_EGP: r.cost || r.metadata?.bill_amount || 0,
      CO2_kg: r.carbon_impact || r.co2 || r.metadata?.co2_impact || 0,
      Source: r.source || 'N/A'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ecological_Records");
    XLSX.writeFile(wb, `Eco_Records_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const getIcon = (sector: string) => {
    const cat = categories.find(c => c.id === sector);
    if (!cat) return <Database className="w-5 h-5 text-zinc-400" />;
    const Icon = cat.icon || Database;
    return <Icon className={`w-5 h-5 ${cat.color}`} />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <section className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-xl border border-zinc-200 dark:border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <Link to="/calculator" className="p-3 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors">
              <ArrowLeft className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
            </Link>
            <div>
              <h1 className="text-3xl font-black font-arabic text-zinc-900 dark:text-white">
                {isRtl ? 'سجل العمليات والقياسات' : 'Calculation & Audit Records'}
              </h1>
              <p className="text-zinc-500 font-bold text-sm">
                {isRtl ? 'عرض وتحليل كافة العمليات المسجلة في قاعدة البيانات' : 'View and analyze all operations recorded in the database'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={exportToExcel}
              className="px-6 py-3 bg-egypt-gold text-egypt-black rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-egypt-gold/20"
            >
              <Download className="w-4 h-4" />
              {isRtl ? 'تصدير Excel' : 'Export Excel'}
            </button>
          </div>
        </div>
      </section>

      {/* Filters & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-white/10 shadow-sm">
            <h3 className="text-xs font-black text-zinc-400 dark:text-white/30 uppercase tracking-widest mb-6 px-2">{isRtl ? 'تصفية النوع' : 'Filter Sector'}</h3>
            <div className="space-y-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl font-bold text-sm transition-all ${
                    filter === cat.id 
                      ? 'bg-egypt-gold text-egypt-black border-transparent shadow-md' 
                      : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {cat.icon && <cat.icon className="w-4 h-4" />}
                    <span className="font-arabic">{isRtl ? cat.ar : cat.en}</span>
                  </div>
                  <span className="text-[10px] opacity-40">{records.filter(r => cat.id === 'All' || r.sector === cat.id).length}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-emerald-500/10 p-6 rounded-[2.5rem] border border-emerald-500/20 text-center">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">{isRtl ? 'مدقق من قبل' : 'Audited By'}</p>
            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Scale className="w-5 h-5" />
              <span className="text-lg font-black font-arabic">MoEco Core OS</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-egypt-gold transition-colors" size={20} />
            <input
              type="text"
              placeholder={isRtl ? 'بحث في السجلات...' : 'Search records...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-8 py-5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-[2rem] text-zinc-900 dark:text-white font-bold outline-none focus:border-egypt-gold/50 shadow-sm"
            />
          </div>

          {/* Records List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Clock className="w-10 h-10 text-egypt-gold animate-spin" />
                <p className="text-zinc-400 font-bold animate-pulse">{isRtl ? 'جاري جلب السجلات...' : 'Syncing database records...'}</p>
              </div>
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  key={record.id}
                  className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-200 dark:border-white/10 hover:border-egypt-gold/50 transition-all shadow-sm group"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 w-full">
                    <div className="flex items-center gap-4 md:gap-5 w-full md:w-auto">
                      <div className="p-3 md:p-4 bg-zinc-100 dark:bg-white/5 rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                        {getIcon(record.sector)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-1">
                          <span className="text-[9px] md:text-[10px] font-black text-egypt-gold uppercase tracking-widest truncate">{record.sector}</span>
                          <span className="text-[10px] text-zinc-300">•</span>
                          <span className="text-[9px] md:text-[10px] font-bold text-zinc-400 shrink-0">{new Date(record.created_at || record.timestamp || record.record_date).toLocaleString()}</span>
                        </div>
                        <h4 className="text-base md:text-lg font-black text-zinc-900 dark:text-white font-arabic truncate">
                          {record.value} {record.unit}
                        </h4>
                        <p className="text-[10px] md:text-xs text-zinc-500 font-medium truncate">{record.description || (isRtl ? 'عملية مسجلة عبر الحاسبة الذكية' : 'Record from Smart Calculator')}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-2 md:gap-8 w-full md:w-auto border-t md:border-t-0 border-zinc-100 dark:border-white/5 pt-4 md:pt-0 mt-2 md:mt-0">
                      <div className="text-center md:text-right flex-1 md:flex-none">
                        <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5 md:mb-1">{isRtl ? 'الانبعاث' : 'Factor'}</p>
                        <p className="text-xs md:text-sm font-black text-zinc-600 dark:text-zinc-400 truncate">
                          {Number(record.metadata?.emission_factor || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center md:text-right flex-1 md:flex-none border-l md:border-x px-2 md:px-6 border-zinc-100 dark:border-white/5 rtl:border-r rtl:border-l-0 md:rtl:border-x">
                        <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5 md:mb-1">{isRtl ? 'مكافئ الكربون' : 'Impact'}</p>
                        <p className="text-lg md:text-xl font-black text-emerald-500 truncate">
                          {Number(record.carbon_impact || record.co2 || record.co2_impact || record.metadata?.co2_impact || 0).toFixed(1)} <span className="text-[8px] md:text-[10px]">kg</span>
                        </p>
                      </div>
                      <div className="text-center md:text-right flex-1 md:flex-none">
                        <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5 md:mb-1">{isRtl ? 'المبلغ الاجمالي' : 'Total Bill'}</p>
                        <p className="text-sm md:text-xl font-black text-zinc-900 dark:text-white tabular-nums truncate">
                          {Math.round(Number(record.cost || record.metadata?.bill_amount || 0))} <span className="text-[8px] md:text-[10px]">EGP</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 bg-zinc-50 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-white/10">
                <History className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-xl font-black font-arabic text-zinc-500">{isRtl ? 'لا توجد سجلات مطابقة' : 'No matching records'}</h3>
                <p className="text-sm font-bold text-zinc-400 mt-2">{isRtl ? 'ابدأ باستخدام الحاسبة الذكية لتسجيل بياناتك' : 'Start using the Smart Calculator to record data'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculationRecords;
