
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { 
  Globe, TrendingUp, AlertTriangle, Leaf, 
  Map as MapIcon, Filter, Download, Calendar,
  Activity, Users, Landmark, Zap, Droplets, Trash2,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { gisService } from '../services/gisService';
import { GISFeature, SpatialAnalysis } from '../types';

interface MapDashboardProps {
  language: 'ar' | 'en';
}

export const MapDashboard: React.FC<MapDashboardProps> = ({ language }) => {
  const [features, setFeatures] = useState<GISFeature[]>([]);
  const [spatialData, setSpatialData] = useState<SpatialAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [f, s] = await Promise.all([
      gisService.getFeatures(),
      gisService.getSpatialAnalysis()
    ]);
    setFeatures(f);
    setSpatialData(s);
    setLoading(false);
  };

  const COLORS = ['#C09304', '#CE1126', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

  const categoryData = [
    { name: language === 'ar' ? 'النقل' : 'Transport', value: features.filter(f => f.category === 'Transport').length },
    { name: language === 'ar' ? 'الخدمات' : 'Gov Services', value: features.filter(f => f.category === 'GovService').length },
    { name: language === 'ar' ? 'البيئة' : 'Eco Points', value: features.filter(f => f.category === 'EcoPoint').length },
    { name: language === 'ar' ? 'المرافق' : 'Utilities', value: features.filter(f => f.category === 'Utility').length },
  ];

  const emissionData = spatialData
    .filter(s => s.analysis_type === 'EmissionDensity')
    .map(s => ({ name: s.region_name, value: s.value }));

  const serviceDensity = spatialData
    .filter(s => s.analysis_type === 'ServiceDensity')
    .map(s => ({ name: s.region_name, value: s.value }));

  return (
    <div className="space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black gold-gradient-text mb-2">
            {language === 'ar' ? 'لوحة البيانات الجغرافية' : 'Geographic Dashboard'}
          </h2>
          <p className="text-egypt-black/60 font-medium">
            {language === 'ar' ? 'تحليل مكاني شامل للانبعاثات والخدمات' : 'Comprehensive spatial analysis of emissions and services'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-egypt-gold" size={18} />
            <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white border-2 border-egypt-gold/20 rounded-2xl font-bold focus:border-egypt-gold outline-none transition-all appearance-none w-full sm:w-auto sm:min-w-full sm:max-w-[160px]"
            >
              <option value="all">{language === 'ar' ? 'كل المناطق' : 'All Regions'}</option>
              <option value="cairo">{language === 'ar' ? 'القاهرة' : 'Cairo'}</option>
              <option value="alex">{language === 'ar' ? 'الإسكندرية' : 'Alexandria'}</option>
              <option value="giza">{language === 'ar' ? 'الجيزة' : 'Giza'}</option>
            </select>
          </div>
          <button className="p-3 bg-egypt-gold text-white rounded-2xl hover:bg-egypt-gold/80 transition-all shadow-lg">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Globe className="text-blue-500" />}
          label={language === 'ar' ? 'إجمالي المواقع' : 'Total Locations'}
          value={features.length}
          trend="+12%"
          color="blue"
        />
        <StatCard 
          icon={<AlertTriangle className="text-red-500" />}
          label={language === 'ar' ? 'مناطق الانبعاثات' : 'Emission Zones'}
          value={features.filter(f => f.category === 'EmissionZone').length}
          trend="-5%"
          color="red"
        />
        <StatCard 
          icon={<Leaf className="text-green-500" />}
          label={language === 'ar' ? 'المساحات الخضراء' : 'Green Spaces'}
          value={features.filter(f => f.category === 'EcoPoint' && f.sub_category === 'park').length}
          trend="+8%"
          color="green"
        />
        <StatCard 
          icon={<Landmark className="text-egypt-gold" />}
          label={language === 'ar' ? 'تغطية الخدمات' : 'Service Coverage'}
          value="84%"
          trend="+3%"
          color="gold"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Distribution */}
        <div className="egyptian-card p-8">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
            <Layers className="text-egypt-gold" />
            {language === 'ar' ? 'توزيع الخدمات حسب النوع' : 'Service Distribution by Category'}
          </h3>
          <div className="h-[300px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151619', border: 'none', borderRadius: '1rem', color: 'white' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-sm font-medium text-egypt-black/60">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Emission Density */}
        <div className="egyptian-card p-8">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
            <TrendingUp className="text-red-500" />
            {language === 'ar' ? 'كثافة الانبعاثات حسب المنطقة' : 'Emission Density by Region'}
          </h3>
          <div className="h-[300px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emissionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#fdfaf5' }}
                  contentStyle={{ backgroundColor: '#151619', border: 'none', borderRadius: '1rem', color: 'white' }}
                />
                <Bar dataKey="value" fill="#CE1126" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Density Area Chart */}
        <div className="egyptian-card p-8 lg:col-span-2">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
            <Activity className="text-blue-500" />
            {language === 'ar' ? 'تحليل كثافة الخدمات' : 'Service Density Analysis'}
          </h3>
          <div className="h-[300px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serviceDensity}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C09304" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C09304" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151619', border: 'none', borderRadius: '1rem', color: 'white' }}
                />
                <Area type="monotone" dataKey="value" stroke="#C09304" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, trend, color }: { icon: React.ReactNode, label: string, value: string | number, trend: string, color: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="egyptian-card p-6"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl bg-${color}-500/10`}>
        {icon}
      </div>
      <span className={`text-sm font-bold ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
        {trend}
      </span>
    </div>
    <h4 className="text-egypt-black/60 font-bold text-sm mb-1">{label}</h4>
    <p className="text-3xl font-black text-egypt-black">{value}</p>
  </motion.div>
);
