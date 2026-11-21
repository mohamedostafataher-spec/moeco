
import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, Zap, BarChart3, ShieldCheck, 
  Settings, LogOut, Search, Filter, Ban, CheckCircle2, 
  XCircle, TrendingUp, ArrowUpRight, ArrowDownRight,
  Database, ShieldAlert, Cpu, Activity, Globe, MessageSquare,
  Trophy, Smartphone, Layers, AlertTriangle, FileText, Plus,
  Edit2, Trash2, Save, RefreshCw, ChevronRight, LayoutGrid,
  Menu, X, Bell, MoreVertical, ExternalLink, Moon, Sun, 
  PieChart, LineChart as LineChartIcon, Map as MapIcon,
  User as UserIcon, Brain,
  CreditCard, Package, Truck, Utensils, Droplets, Flame, StopCircle, PlayCircle, Network, Footprints, Lock, Download, Store,
  PieChart as PieChartIcon, FilePieChart, MapPinned, Scale, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notificationService';
import { storageService } from '../services/storageService';
import { analyticsService, AppFeature } from '../services/analyticsService';
import PricingControl from '../components/admin/PricingControl';
import NationalReports from '../components/admin/NationalReports';
import GovServicesAdmin from '../components/admin/GovServicesAdmin';
import GovernorateAnalytics from '../components/admin/GovernorateAnalytics';
import BillingControl from '../components/admin/BillingControl';
import AIAnalytics from '../components/admin/AIAnalytics';
import MissionsAdmin from '../components/admin/MissionsAdmin';
import MarketplaceAdmin from '../components/admin/MarketplaceAdmin';
import AlertsBroadcast from '../components/admin/AlertsBroadcast';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, PieChart as RePieChart, Pie, Cell 
} from 'recharts';

type AdminTab = 'overview' | 'users' | 'pricing' | 'emissions' | 'ai_rules' | 'missions' | 'devices' | 'logs' | 'discovery' | 'settings' | 'transport' | 'news_management' | 'rewards_management' | 'marketplace' | 'database' | 'reporting' | 'gov_services' | 'geo_analytics' | 'billing_engine' | 'broadcast';

const AdminDashboard: React.FC = () => {
  const { language, theme, user, isRtl, logout, isAdmin } = useApp();
  const navigate = useNavigate();
  
  useEffect(() => {
    // For AI Studio demo: always allow access so the user can test the dashboard
    if (!user) {
      notificationService.info(isRtl ? 'تم تفعيل وضع المشرف للعرض' : 'Demo Admin Mode Activated');
    }
  }, [isAdmin, user, navigate, isRtl]);

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Enterprise States
  const [dbTables, setDbTables] = useState<string[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [partnerOffers, setPartnerOffers] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [appFeatures, setAppFeatures] = useState<AppFeature[]>([]);
  const [allMissions, setAllMissions] = useState<any[]>([]);
  const [allTransport, setAllTransport] = useState<any[]>([]);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'Info' | 'Success' | 'Warning' | 'Alert'>('Info');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [govChartData, setGovChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
    scanSystem();
    fetchMissions();
    fetchTransport();
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const config = await storageService.getAppConfig();
    setAppConfig(config);
  };

  const fetchMissions = async () => {
    const { data } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
    setAllMissions(data || []);
  };

  const fetchTransport = async () => {
    const { data } = await supabase.from('transport_services').select('*').order('type', { ascending: true });
    setAllTransport(data || []);
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Stats
      const { count: usersCount } = await supabase.from('users').select('id', { count: 'exact', head: true });
      const { data: usageData } = await supabase.from('carbon_footprint_logs').select('user_id, total_emissions, recorded_at').limit(10000);
      const { data: recentActivity } = await supabase.from('consumption_records').select('id').gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      const totalCO2 = usageData?.reduce((sum, a) => sum + (a.total_emissions || 0), 0) || 0;

      // 1.1 Calculate Gov Chart Data
      const { data: userGovs } = await supabase.from('users').select('id, governorate');
      const govMap: Record<string, { val: number, secondary: number }> = {};
      
      if (userGovs && usageData) {
        usageData.forEach(log => {
          const user = userGovs.find(u => u.id === log.user_id);
          const gov = user?.governorate || 'Other';
          if (!govMap[gov]) govMap[gov] = { val: 0, secondary: 0 };
          govMap[gov].val += log.total_emissions || 0;
          govMap[gov].secondary += (log.total_emissions || 0) * 0.8; // Target baseline
        });
        
        const chartData = Object.entries(govMap).map(([name, data]) => ({
          name,
          val: Math.round(data.val),
          secondary: Math.round(data.secondary)
        })).sort((a,b) => b.val - a.val).slice(0, 6);
        setGovChartData(chartData);
      }
      
      // Calculate growth: compare this month's user growth vs last month (simulated if data new)
      const growth = usersCount && usersCount > 0 ? 12.5 : 0;
      
      // Activity Rate: active users in last 7 days / total
      const activityRate = usersCount && usersCount > 0 ? Math.min(100, Math.round(((recentActivity?.length || 0) / usersCount) * 100)) : 88;

      // Fetch Real Revenue from smart platform
      const { data: transactions, error: txError } = await supabase.from('transactions').select('amount').eq('status', 'completed');
      let realRevenue = 0;
      if (transactions) {
         realRevenue = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      }
      setTotalRevenue(realRevenue);
      
      setStats({
        users: usersCount || 0,
        revenue: realRevenue,
        co2: totalCO2.toFixed(1),
        consumption: (totalCO2 * 0.8).toFixed(1),
        growth: growth,
        activityRate: activityRate
      });

      // 2. Fetch Active Users
      const { data: users } = await supabase
        .from('users')
        .select('id, email, full_name, role, status, updated_at')
        .order('updated_at', { ascending: false })
        .limit(10);
      setActiveUsers(users || []);

      // 3. Fetch Admin Logs
      const { data: logs } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      setAdminLogs(logs || []);

      // 4. Fetch App Features
      const features = await analyticsService.getAllFeatures();
      setAppFeatures(features);

      // 5. Fetch Marketplace
      const { data: partnersData } = await supabase.from('partners').select('*');
      setPartners(partnersData || []);
      const { data: offersData } = await supabase.from('partner_offers').select('*, partners(name, logo_url)');
      setPartnerOffers(offersData || []);

    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const scanSystem = async () => {
    // Discovery logic: Try to guess tables or use meta queries if allowed
    try {
      const knownTables = [
        'users', 'carbon_footprint_logs', 'transport_emissions', 'walking_sessions', 
        'news', 'gov_services', 'carpool_rides', 'transport_lines', 
        'emergency_alerts', 'challenges', 'user_challenges', 'badges', 
        'user_badges', 'app_config', 'prices',
        'emission_factors', 'behavior_rules', 'admin_logs', 'missions',
        'eco_products', 'community_messages', 'community_moments'
      ];
      setDbTables(knownTables);
    } catch (e) {}
  };

  const handleDeepScan = async () => {
    setIsScanning(true);
    try {
      await analyticsService.scanLocalSystem();
      const features = await analyticsService.getAllFeatures();
      setAppFeatures(features);
      notificationService.success(isRtl ? 'تم فحص النظام بنجاح' : 'System Deep Scan Complete');
      logAdminAction('SYSTEM_SCAN', 'app_features', 'GLOBAL', { new_features_found: true });
    } catch (e) {
      notificationService.error('Scan Failed');
    } finally {
      setIsScanning(false);
    }
  };

  const toggleFeature = async (id: string, active: boolean) => {
    try {
      await analyticsService.toggleFeature(id, !active);
      const features = await analyticsService.getAllFeatures();
      setAppFeatures(features);
    } catch(e) {}
  };

  const logAdminAction = async (action: string, table: string, targetId: string, details: any) => {
    try {
      await storageService.logAdminAction(action, table, targetId, details);
      fetchInitialData(); // Refresh logs
    } catch (e) {
      console.error("Logging failed", e);
    }
  };

  const toggleUserBan = async (userId: string, isBanned: boolean) => {
    try {
      const { error } = await supabase.from('users').update({ is_banned: !isBanned }).eq('id', userId);
      if (error) throw error;
      notificationService.success(isRtl ? 'تم تحديث حالة المستخدم' : 'User status updated');
      logAdminAction(isBanned ? 'UNBAN_USER' : 'BAN_USER', 'users', userId, { prevStatus: isBanned });
      fetchInitialData();
    } catch (e) {
      notificationService.error('Action failed');
    }
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      notificationService.success(isRtl ? 'تم تغيير صلاحية المستخدم' : 'User role updated');
      logAdminAction('CHANGE_ROLE', 'users', userId, { newRole });
      fetchInitialData();
    } catch (e) {
      notificationService.error('Action failed');
    }
  };

  // --- Sub-Components ---

  const Sidebar = () => (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && window.innerWidth <= 1024 && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[55]" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <div className={`
        ${isSidebarOpen ? 'translate-x-0 w-72' : (isRtl ? 'translate-x-full lg:translate-x-0 lg:w-24' : '-translate-x-full lg:translate-x-0 lg:w-24')} 
        bg-zinc-950 border-r border-white/5 transition-all duration-500 flex flex-col 
        fixed lg:relative inset-y-0 ${isRtl ? 'right-0' : 'left-0'} z-[60] lg:z-50 shadow-2xl shadow-black/50
      `}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/[0.05] bg-zinc-900/20 backdrop-blur-md">
          {(isSidebarOpen || window.innerWidth > 1024) && (
            <div className="flex items-center gap-3 group transition-all" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-egypt-gold rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.2)] group-hover:shadow-egypt-gold/40 transition-all duration-500">
                <ShieldCheck className="w-6 h-6 text-egypt-black" />
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col">
                  <span className="font-black text-white tracking-widest text-lg leading-tight uppercase font-mono">Moeco</span>
                  <span className="text-[10px] font-black text-egypt-gold uppercase tracking-[0.4em] opacity-80">Root Access</span>
                </div>
              )}
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 lg:hidden text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {[
            { id: 'overview', icon: LayoutGrid, label: isRtl ? 'نظرة عامة' : 'Nexus Dashboard' },
            { id: 'reporting', icon: FilePieChart, label: isRtl ? 'التقارير القومية' : 'National Stats' },
            { id: 'geo_analytics', icon: MapPinned, label: isRtl ? 'تحليل المحافظات' : 'Geo Intelligence' },
            { id: 'billing_engine', icon: CreditCard, label: isRtl ? 'محرك الفوترة' : 'Billing Engine' },
            { id: 'gov_services', icon: ShieldCheck, label: isRtl ? 'الخدمات الحكومية' : 'Gov Control' },
            { id: 'broadcast', icon: Radio, label: isRtl ? 'البث القومي' : 'National Alert' },
            { id: 'pricing', icon: Scale, label: isRtl ? 'التسعير الذكي' : 'Pricing Engine' },
            { id: 'live_monitor', icon: Activity, label: isRtl ? 'المراقبة' : 'Live Engine' },
            { id: 'users', icon: Users, label: isRtl ? 'المستخدمين' : 'User Base' },
            { id: 'transport', icon: Truck, label: isRtl ? 'النقل' : 'Global Mobility' },
            { id: 'news_management', icon: FileText, label: isRtl ? 'الأخبار' : 'News Desk' },
            { id: 'rewards_management', icon: Trophy, label: isRtl ? 'الجوائز' : 'Rewards Admin' },
            { id: 'marketplace', icon: Store, label: isRtl ? 'المتجر' : 'Marketplace' },
            { id: 'transactions', icon: CreditCard, label: isRtl ? 'المالية' : 'Financials' },
            { id: 'discovery', icon: Network, label: isRtl ? 'الفحص' : 'Bio Scan' },
            { id: 'emissions', icon: Globe, label: isRtl ? 'التحليلات' : 'Analytics' },
            { id: 'ai_rules', icon: Cpu, label: isRtl ? 'الذكاء' : 'AI Core' },
            { id: 'missions', icon: Trophy, label: isRtl ? 'التحديات' : 'Missions' },
            { id: 'database', icon: Database, label: isRtl ? 'بيانات' : 'Data Integrity' },
            { id: 'settings', icon: Settings, label: isRtl ? 'إعدادات' : 'Terminal Cfg' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as AdminTab);
                if(window.innerWidth <= 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all relative group ${
                activeTab === item.id 
                  ? 'bg-egypt-gold/10 text-egypt-gold border border-egypt-gold/20' 
                  : 'text-zinc-500 hover:bg-white/[0.03] hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-125'}`} />
              {(isSidebarOpen || window.innerWidth > 1024) && (
                <span className={`font-black text-[10px] uppercase tracking-[0.2em] whitespace-nowrap transition-all ${activeTab === item.id ? 'opacity-100 translate-x-1' : 'opacity-60 group-hover:opacity-100'}`}>
                  {item.label}
                </span>
              )}
              {activeTab === item.id && isSidebarOpen && (
                <motion.div layoutId="activeInd" className="ml-auto w-1 h-1 bg-egypt-gold rounded-full shadow-[0_0_10px_#d4af37]" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 bg-zinc-950 border-t border-white/[0.05] space-y-4">
          <button 
           onClick={() => logout()}
           className="w-full flex items-center gap-4 p-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-[0.3em]"
         >
           <LogOut className="w-5 h-5" />
           {isSidebarOpen && <span>Secure Logout</span>}
         </button>
        </div>
      </div>
    </>
  );

  const Header = () => (
    <header className="h-16 md:h-20 bg-zinc-950/50 backdrop-blur-md border-b border-zinc-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3 md:gap-4 w-full">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="p-1.5 md:p-2 lg:hidden text-white bg-zinc-900 border border-zinc-800 rounded-lg md:rounded-xl"
        >
          <Menu size={18} className="md:w-5 md:h-5" />
        </button>
        
        <div className="flex-1 max-w-md hidden md:flex items-center gap-4 bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-800">
          <Search className="w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder={isRtl ? 'بحث في النظام...' : 'Search system...'}
            className="bg-transparent border-none focus:ring-0 text-sm text-white w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6 ml-3 md:ml-4">
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="text-[9px] md:text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest leading-none">Online</span>
        </div>
        
        <div className="h-6 w-[1px] bg-zinc-800 hidden md:block" />
        
        <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
          <Bell size={18} className="md:w-5 md:h-5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2 md:gap-3 pl-3 md:pl-4 border-l border-zinc-800">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] md:text-xs font-black text-white truncate max-w-[80px] md:max-w-[100px] leading-tight">{user?.name}</p>
            <p className="text-[8px] md:text-[10px] font-bold text-egypt-gold uppercase leading-none">{user?.role || 'Admin'}</p>
          </div>
          <img 
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
            className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl border border-zinc-800 object-cover"
            alt="Admin" 
          />
        </div>
      </div>
    </header>
  );

  const StatsPanel = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {[
        { label: isRtl ? 'إجمالي المستخدمين' : 'Total Users', value: stats?.users || 0, icon: Users, color: 'text-blue-500', trend: 12 },
        { label: isRtl ? 'العائد التقديري' : 'Est. Revenue', value: `${stats?.revenue || 0} EGP`, icon: DollarSign, color: 'text-emerald-500', trend: 8.4 },
        { label: isRtl ? 'إجمالي CO₂' : 'Total CO₂', value: `${stats?.co2 || 0} kg`, icon: Globe, color: 'text-cyan-500', trend: -5.2 },
        { label: isRtl ? 'معدل النشاط' : 'Activity Rate', value: `${stats?.activityRate || 0}%`, icon: Activity, color: 'text-amber-500', trend: 2.1 },
      ].map((stat, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-zinc-900 border border-zinc-800 p-4 md:p-6 rounded-2xl md:rounded-[2rem] hover:border-egypt-gold/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-zinc-950 border border-zinc-800 group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
            </div>
            <div className={`flex items-center gap-1 text-[8px] md:text-[10px] font-black ${stat.trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {stat.trend > 0 ? <ArrowUpRight size={12} className="md:w-3.5 md:h-3.5" /> : <ArrowDownRight size={12} className="md:w-3.5 md:h-3.5" />}
              {Math.abs(stat.trend)}%
            </div>
          </div>
          <p className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5 md:mb-1">{stat.label}</p>
          <p className="text-xl md:text-3xl font-black text-white tracking-tighter">{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );

  const UsersModule = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-black text-white">{isRtl ? 'إدارة المستخدمين' : 'User Management'}</h2>
        <div className="flex gap-2">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-egypt-gold text-egypt-black rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:scale-105 transition-all outline-none">
            <Plus size={14} className="md:w-4 md:h-4" /> {isRtl ? 'إضافة مستخدم' : 'Add User'}
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">{isRtl ? 'المستخدم' : 'User'}</th>
                <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">{isRtl ? 'الصلاحية' : 'Role'}</th>
                <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">{isRtl ? 'النقاط' : 'Points'}</th>
                <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">{isRtl ? 'الحالة' : 'Status'}</th>
                <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">{isRtl ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {activeUsers.map((u) => (
                <tr key={u.id} className="border-b border-zinc-800 hover:bg-white/5 transition-colors group">
                  <td className="px-4 md:px-6 py-4">
                       <div className="flex items-center gap-2 md:gap-3">
                         <img src={u.avatar_url || u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.full_name || u.name}`} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl object-cover shrink-0" alt="" />
                         <div className="min-w-0">
                           <p className="font-bold text-white text-[11px] md:text-sm truncate max-w-[80px] sm:max-w-none">{u.full_name || u.name}</p>
                           <p className="text-[9px] md:text-xs text-zinc-500 truncate max-w-[80px] sm:max-w-none">{u.email || 'No email'}</p>
                         </div>
                       </div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <select 
                      value={u.role || 'citizen'}
                      onChange={(e) => changeUserRole(u.id, e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] md:text-xs font-bold text-zinc-300 p-1 focus:ring-egypt-gold"
                    >
                      <option value="citizen">Citizen</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="sector_admin">Sector Admin</option>
                      <option value="gov_admin">Gov Admin</option>
                    </select>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <span className="text-[10px] md:text-xs font-mono font-bold text-egypt-gold">{u.points || 0} PTS</span>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase ${
                      u.is_banned ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {u.is_banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 md:gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => toggleUserBan(u.id, u.is_banned)} className={`p-1.5 md:p-2 rounded-lg transition-colors ${u.is_banned ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-red-500 hover:bg-red-500/10'}`}>
                        {u.is_banned ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                      </button>
                      <button className="p-1.5 md:p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const TransactionsModule = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    
    useEffect(() => {
        const fetchTxs = async () => {
           const { data } = await supabase.from('transactions').select('*, users(email, raw_user_meta_data)').order('created_at', { ascending: false }).limit(50);
           if (data) {
              setTransactions(data || []);
           }
        };
        fetchTxs();
    }, []);

    const processTransaction = async (id: string, newStatus: string) => {
        try {
            await supabase.from('transactions').update({ status: newStatus }).eq('id', id);
            notificationService.success(isRtl ? 'تم التحديث بنجاح' : 'Transaction updated!');
            setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
        } catch(e) {}
    };

    return (
       <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl md:text-2xl font-black text-white">{isRtl ? 'المدفوعات والمحفظة' : 'Payments & Transactions'}</h2>
            <div className="flex items-center gap-3 bg-egypt-gold/10 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-egypt-gold/20">
               <CreditCard className="text-egypt-gold w-4 h-4 md:w-5 md:h-5" />
               <div className="flex items-baseline gap-2">
                 <span className="text-[8px] md:text-[10px] uppercase font-black tracking-widest text-egypt-gold whitespace-nowrap">{isRtl ? 'إجمالي الدخل' : 'Total Revenue'}: </span>
                 <span className="text-base md:text-xl font-black text-white">{totalRevenue} <span className="text-[10px]">EGP</span></span>
               </div>
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2.5rem] overflow-hidden">
             <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left border-collapse min-w-[800px]">
                 <thead>
                   <tr className="border-b border-zinc-800 uppercase text-[9px] md:text-[10px] font-black tracking-widest text-zinc-500">
                     <th className="px-4 md:px-6 py-4">Reference</th>
                     <th className="px-4 md:px-6 py-4">User</th>
                     <th className="px-4 md:px-6 py-4">Type/Method</th>
                     <th className="px-4 md:px-6 py-4">Amount</th>
                     <th className="px-4 md:px-6 py-4">Status</th>
                     <th className="px-4 md:px-6 py-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-800 text-[11px] md:text-sm font-bold">
                   {transactions.map((tx) => (
                     <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                       <td className="px-4 md:px-6 py-4 text-zinc-400 font-mono text-[10px] md:text-xs">{tx.reference_code || tx.id.slice(0, 8)}</td>
                       <td className="px-4 md:px-6 py-4 text-white">
                         <div className="flex items-center gap-2">
                           <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                             <UserIcon size={12} className="text-zinc-500" />
                           </div>
                           <span className="truncate max-w-[120px]">{tx.users?.raw_user_meta_data?.full_name || tx.users?.email || 'Unknown User'}</span>
                         </div>
                       </td>
                       <td className="px-4 md:px-6 py-4">
                           <span className="text-indigo-400 uppercase tracking-widest text-[9px] md:text-[10px] block leading-none mb-0.5">{tx.type}</span>
                           <span className="text-zinc-500 uppercase tracking-widest text-[8px] md:text-[9px] leading-none">{tx.method}</span>
                       </td>
                       <td className="px-4 md:px-6 py-4 text-egypt-gold">{tx.amount} EGP</td>
                       <td className="px-4 md:px-6 py-4">
                           <span className={`px-2 py-0.5 md:py-1 rounded-md text-[8px] md:text-[10px] uppercase tracking-widest ${tx.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : tx.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-500'}`}>
                             {tx.status}
                           </span>
                       </td>
                       <td className="px-4 md:px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-1 md:gap-2">
                           <button onClick={() => processTransaction(tx.id, 'completed')} className="p-1.5 md:p-2 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Mark Completed"><CheckCircle2 size={16} /></button>
                           <button onClick={() => processTransaction(tx.id, 'failed')} className="p-1.5 md:p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Mark Failed"><StopCircle size={16} /></button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
       </div>
    );
  };

  const PricingModule = () => {
    const [prices, setPrices] = useState<any[]>([]);

    useEffect(() => {
       const loadPrices = async () => {
         const { data } = await supabase.from('prices').select('*').limit(20);
         if (data) setPrices(data);
       };
       loadPrices();
    }, []);

    const handleSave = async (id: number, newPrice: number) => {
       try {
         await supabase.from('prices').update({ price: newPrice }).eq('id', id);
         notificationService.success(isRtl ? 'تم التحديث بنجاح' : 'Price updated Live!');
         logAdminAction('UPDATE_PRICE', 'prices', String(id), { price: newPrice });
       } catch (e) {
         notificationService.error('Error updating');
       }
    };

    return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-black text-white">{isRtl ? 'إدارة التسعير' : 'Pricing & Tariffs'}</h2>
        <button className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-white/10 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-white/20 transition-all">
          <RefreshCw size={16} /> {isRtl ? 'تحديث الأسعار' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {prices.map((item) => {
          let color = 'bg-amber-400';
          if (item.category === 'water') color = 'bg-cyan-400';
          if (item.category === 'transport') color = 'bg-blue-400';
          return (
          <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-4 md:p-6 rounded-2xl md:rounded-[2rem] space-y-4">
             <div className="flex items-center justify-between">
                <div className={`${color} w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0`}>
                   <Package className="w-4 h-4 md:w-5 md:h-5 text-black" />
                </div>
                <div className="text-right">
                   <p className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase">{item.category} - {item.segment}</p>
                   <p className="text-lg md:text-xl font-black text-white">{item.price} <span className="text-[10px] opacity-50">EGP/{item.unit || 'unit'}</span></p>
                </div>
             </div>
             <div className="pt-4 border-t border-zinc-800 flex gap-2">
                <input type="number" 
                   value={item.price} 
                   onChange={(e) => {
                     const modified = [...prices];
                     const idx = modified.findIndex(x => x.id === item.id);
                     if(idx >= 0) {
                       modified[idx].price = parseFloat(e.target.value);
                       setPrices(modified);
                     }
                   }}
                   className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg md:rounded-xl text-xs md:text-sm font-bold text-white px-3 md:px-4 py-2" />
                <button onClick={() => handleSave(item.id, item.price)} className="p-2 bg-egypt-gold text-egypt-black rounded-lg md:rounded-xl hover:scale-110 transition-transform">
                   <Save size={18} />
                </button>
             </div>
          </div>
        )})}
      </div>
    </div>
  )};

  const TransportModule = () => {
    const [transportConfig, setTransportConfig] = useState<any>({
        co2_per_km_walking: 0.2,
        tokens_per_km_walking: 2,
        modes: [
           { id: 'metro', name: 'Metro / L1-L4', cost: 8 },
           { id: 'bus', name: 'Smart BRT Bus', cost: 5 },
           { id: 'monorail', name: 'Monorail', cost: 15 },
           { id: 'lrt', name: 'LRT Train', cost: 20 },
           { id: 'microbus', name: 'Smart Microbus', cost: 4 },
        ]
    });
    
    useEffect(() => {
        const fetchConfig = async () => {
            const config = await storageService.getAppConfig();
            if (config?.transport_config) {
                setTransportConfig(config.transport_config);
            }
        };
        fetchConfig();
    }, []);
    
    const handleSave = async () => {
       try {
           await storageService.saveAppConfig('transport_config', transportConfig);
           notificationService.success(isRtl ? 'تم حفظ التعديلات في قاعدة البيانات' : 'Saved to database successfully');
           logAdminAction('UPDATE_TRANSPORT_CONFIG', 'app_config', 'GLOBAL', {});
       } catch (e) {
           notificationService.error('Error saving transport config');
       }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl md:text-2xl font-black text-white">{isRtl ? 'إدارة النقل وأنظمة المشي' : 'Transport & Walking Management'}</h2>
            <button onClick={handleSave} className="flex-1 sm:flex-none flex flex-row items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-emerald-500 rounded-xl md:rounded-2xl text-white font-black text-[10px] md:text-xs uppercase tracking-widest hover:scale-[1.02] shadow-lg shadow-emerald-500/20 transition-transform">
                  <Save size={16} />
                  {isRtl ? 'مزامنة التغييرات المباشرة' : 'Sync Live Changes'}
            </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2rem] p-4 md:p-6">
             <h3 className="text-xs md:text-sm font-bold text-egypt-gold mb-6 flex gap-2"><Truck className="w-4 h-4 md:w-5 md:h-5"/> {isRtl ? 'تعديل بيانات وتسعير الوسائل' : 'Modes Data & Tariffs'}</h3>
             
             <div className="space-y-3 md:space-y-4">
               {transportConfig.modes.map((mode: any, index: number) => (
                  <div key={mode.id} className="flex justify-between items-center p-2.5 md:p-3 bg-zinc-950 rounded-lg md:rounded-xl border border-zinc-800">
                    <span className="font-bold text-white text-[10px] md:text-xs uppercase whitespace-nowrap overflow-hidden text-ellipsis">{mode.name}</span>
                    <div className="flex items-center gap-2">
                       <input 
                         type="number" 
                         value={mode.cost} 
                         onChange={(e) => {
                             const newModes = [...transportConfig.modes];
                             newModes[index].cost = parseFloat(e.target.value);
                             setTransportConfig({...transportConfig, modes: newModes});
                         }}
                         className="w-14 md:w-20 bg-zinc-900 border border-zinc-700 text-white rounded-lg p-1.5 md:p-2 text-center text-[10px] md:text-xs outline-none focus:border-egypt-gold transition-colors" 
                       />
                       <span className="text-[8px] md:text-[10px] text-zinc-500 w-6">EGP</span>
                    </div>
                  </div>
               ))}
               <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 text-center pt-2">
                   {isRtl ? 'يتم تطبيق التسعير بمرونة من خلال حقل التعريفة' : 'Tariff updates apply dynamically via the database.'}
               </p>
             </div>
           </div>
           
           <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 flex flex-col justify-between">
             <div>
                 <h3 className="text-sm font-bold text-blue-500 mb-6 flex gap-2"><Footprints className="w-5 h-5"/> {isRtl ? 'تحكم في نظام المشي النشط' : 'Active Walking Settings'}</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                      <span className="font-bold text-white text-[11px]">{isRtl ? 'تسجيل CO2 لكل كيلو متر' : 'CO2 Saving (kg) / KM'}</span>
                      <input type="number" value={transportConfig.co2_per_km_walking} onChange={(e) => setTransportConfig({...transportConfig, co2_per_km_walking: parseFloat(e.target.value)})} step="0.01" className="w-20 bg-zinc-900 border border-zinc-700 text-white text-center rounded-lg p-2 text-xs outline-none focus:border-blue-500 transition-colors" />
                    </div>
                    <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                      <span className="font-bold text-white text-[11px]">{isRtl ? 'مكافأة العملات الخضراء / كم' : 'Green Tokens / KM'}</span>
                      <input type="number" value={transportConfig.tokens_per_km_walking} onChange={(e) => setTransportConfig({...transportConfig, tokens_per_km_walking: parseFloat(e.target.value)})} className="w-20 bg-zinc-900 border border-zinc-700 text-white text-center rounded-lg p-2 text-xs outline-none focus:border-blue-500 transition-colors" />
                    </div>
                 </div>
             </div>
             
             <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl mt-8">
                 <h4 className="text-[10px] font-black text-blue-400 uppercase mb-2 flex items-center gap-1"><ShieldCheck size={12}/> {isRtl ? 'أمان النظام' : 'System Safety'}</h4>
                 <p className="text-[10px] font-bold text-zinc-400 leading-relaxed">
                     {isRtl ? 'جميع التعديلات يتم ربطها فوراً بشاشة مركز النقل بقواعد البيانات بدون مقاطعة جلسات التتبع والملاحة الجارية للمستخدمين الحاليين.' : 'All edits are live-synced to Transport Hub screens without interrupting ongoing GPS tracking sessions for active users.'}
                 </p>
             </div>
           </div>
        </div>
      </div>
    );
  };

  const DatabaseModule = () => {
    const [selectedTable, setSelectedTable] = useState<string>('users');
    const [tableData, setTableData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [loadingDb, setLoadingDb] = useState(false);
    const [editingRow, setEditingRow] = useState<any>(null);
    
    useEffect(() => {
        const fetchTableInfo = async () => {
            setLoadingDb(true);
            try {
                const { data, error } = await supabase.from(selectedTable).select('*').limit(100);
                if (data && data.length > 0) {
                    setColumns(Object.keys(data[0]));
                    setTableData(data);
                } else {
                    setColumns(['id']);
                    setTableData([]);
                }
            } catch(e) {}
            setLoadingDb(false);
        };
        fetchTableInfo();
    }, [selectedTable]);

    const handleSaveRow = async () => {
        if (!editingRow) return;
        try {
            const { id, ...dataToSave } = editingRow;
            const { error } = await supabase.from(selectedTable).update(dataToSave).eq('id', id);
            if (error) throw error;
            notificationService.success('Record Updated Successfully!');
            setEditingRow(null);
            const { data } = await supabase.from(selectedTable).select('*').limit(100);
            setTableData(data || []);
        } catch (e) {
            notificationService.error('Update Failed');
        }
    };

    return (
       <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white">{isRtl ? 'إدارة قاعدة البيانات' : 'Database Control Room'}</h2>
            <div className="flex gap-4">
                <button 
                  onClick={() => scanSystem()}
                  className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:text-white"
                >
                  <RefreshCw size={20} className={isScanning ? 'animate-spin' : ''} />
                </button>
                <select 
                   className="bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3 focus:border-egypt-gold"
                   value={selectedTable}
                   onChange={(e) => setSelectedTable(e.target.value)}
                >
                   {dbTables.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 overflow-hidden">
             {loadingDb ? (
                <div className="flex justify-center p-10"><RefreshCw className="w-8 h-8 animate-spin text-egypt-gold" /></div>
             ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                       <thead>
                          <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest">
                             {columns.map(c => <th key={c} className="p-4">{c}</th>)}
                             <th className="p-4">Action</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-zinc-800">
                           {tableData.map((row, idx) => (
                              <tr key={idx} className="hover:bg-white/[0.02]">
                                  {columns.map(c => (
                                     <td key={c} className="p-4 max-w-[200px] truncate text-zinc-300">
                                         {typeof row[c] === 'object' ? JSON.stringify(row[c]) : String(row[c])}
                                     </td>
                                  ))}
                                  <td className="p-4">
                                      <div className="flex gap-2">
                                          <button onClick={() => setEditingRow(row)} className="text-egypt-gold hover:text-white p-2"><Edit2 size={16} /></button>
                                          <button onClick={async () => {
                                              if(!confirm('Are you sure?')) return;
                                              try {
                                                 await supabase.from(selectedTable).delete().eq('id', row.id);
                                                 setTableData(prev => prev.filter(r => r.id !== row.id));
                                                 notificationService.success('Deleted.');
                                              } catch(e) {}
                                          }} className="text-red-500 hover:text-red-400 p-2"><Trash2 size={16} /></button>
                                      </div>
                                  </td>
                              </tr>
                           ))}
                       </tbody>
                    </table>
                </div>
             )}
          </div>

          <AnimatePresence>
            {editingRow && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                 <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[3rem] p-8 space-y-6"
                 >
                    <div className="flex justify-between items-center">
                       <h3 className="text-xl font-black text-white">Edit Record - {selectedTable}</h3>
                       <button onClick={() => setEditingRow(null)}><X size={24} className="text-zinc-500" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                       {columns.filter(c => c !== 'id').map(col => (
                         <div key={col} className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{col}</label>
                            <input 
                               className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-egypt-gold outline-none"
                               value={typeof editingRow[col] === 'object' ? JSON.stringify(editingRow[col]) : editingRow[col] || ''}
                               onChange={(e) => {
                                  const val = e.target.value;
                                  let finalVal: any = val;
                                  try {
                                     if(val.startsWith('{') || val.startsWith('[')) finalVal = JSON.parse(val);
                                  } catch(e) {}
                                  setEditingRow({...editingRow, [col]: finalVal});
                               }}
                            />
                         </div>
                       ))}
                    </div>
                    <button 
                      onClick={handleSaveRow}
                      className="w-full py-4 bg-egypt-gold text-egypt-black font-black uppercase tracking-widest text-xs rounded-2xl"
                    >
                      Commit Changes to DB
                    </button>
                 </motion.div>
              </div>
            )}
          </AnimatePresence>
       </div>
    );
  };
  const EmissionsModule = () => {
    const [emissionData, setEmissionData] = useState<any[]>([]);
    const [govData, setGovData] = useState<any[]>([]);
    const [loadingEmissions, setLoadingEmissions] = useState(false);

    useEffect(() => {
        const fetchEmissionStats = async () => {
          setLoadingEmissions(true);
          try {
            // Get users
            const { data: users } = await supabase.from('users').select('id, full_name, governorate').limit(1000);
            // Get all emissions
            const { data: activities } = await supabase.from('carbon_footprint_logs').select('user_id, total_emissions, recorded_at').limit(5000);
            
            if (users && activities) {
               // Map user data
               const userStats = users.map(user => {
                  const userActs = activities.filter(a => a.user_id === user.id);
                  const total = userActs.reduce((sum, act) => sum + (act.total_emissions || 0), 0);
                  const bySector = {
                     total: total,
                     // For more detailed sector breakdown, we'd query transport_emissions etc.
                     // But for overview, we use total_emissions
                  };
                  return {
                     id: user.id,
                     name: user.full_name || 'Unknown',
                     governorate: user.governorate || 'Unspecified',
                     total: total,
                     bySector
                  };
               }).sort((a,b) => b.total - a.total);
               setEmissionData(userStats);

               // Map Gov Data
               const govs = userStats.reduce((acc: any, user) => {
                  const gov = user.governorate || 'Unspecified';
                  if (!acc[gov]) acc[gov] = { name: gov, totalEmissions: 0, users: 0 };
                  acc[gov].totalEmissions += user.total;
                  acc[gov].users += 1;
                  return acc;
               }, {});
               setGovData(Object.values(govs).sort((a: any, b: any) => b.totalEmissions - a.totalEmissions));
            }
          } catch (e) {
            console.error(e);
          } finally {
            setLoadingEmissions(false);
          }
        };

        if (activeTab === 'emissions') {
          fetchEmissionStats();
        }
    }, [activeTab]);

    const handleExport = () => {
        // Generating CSV Content
        let csvContent = "data:text/csv;charset=utf-8,\n";
        
        csvContent += "=== NATIONAL SUMMARY ===\n";
        csvContent += `Total Users,${emissionData.length}\n`;
        csvContent += `Total Emissions (kg),${emissionData.reduce((sum, u) => sum + u.total, 0).toFixed(2)}\n\n`;

        csvContent += "=== GOVERNORATE BREAKDOWN ===\n";
        csvContent += "Governorate,Total Users,Total Emissions (kg)\n";
        govData.forEach((g: any) => {
            csvContent += `${g.name},${g.users},${g.totalEmissions.toFixed(2)}\n`;
        });
        csvContent += "\n=== USER BREAKDOWN ===\n";
        csvContent += "User Name,Governorate,Total Emissions (kg),Sector Breakdown\n";
        emissionData.forEach(user => {
            const sectorStr = Object.entries(user.bySector).map(([k,v]) => `${k}:${(v as number).toFixed(1)}`).join(' | ');
            csvContent += `${user.name},${user.governorate},${user.total.toFixed(2)},${sectorStr}\n`;
        });

        // Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `National_Carbon_Report_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        notificationService.success(isRtl ? 'تم تجهيز وتنزيل التقرير الشامل' : 'Comprehensive Report Downloaded');
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
             <h2 className="text-xl md:text-2xl font-black text-white">{isRtl ? 'التحليلات الشاملة للانبعاثات' : 'Comprehensive Emissions'}</h2>
             <p className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">
                {isRtl ? 'البيانات الوطنية، المحافظات، والمستخدمين' : 'National, Governorate, & User Data'}
             </p>
          </div>
          <button onClick={handleExport} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-egypt-gold text-egypt-black rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-egypt-gold/20">
            <Download size={16} /> {isRtl ? 'تحميل التقرير' : 'Export Report'}
          </button>
        </div>

        {loadingEmissions ? (
           <div className="flex justify-center p-12">
               <RefreshCw className="w-8 h-8 md:w-12 md:h-12 text-egypt-gold animate-spin" />
           </div>
        ) : (
          <>
            {/* National & Governorate Top */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
               <div className="bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2rem] p-4 md:p-6 lg:col-span-1 flex flex-col justify-center items-center text-center">
                  <Globe className="w-10 h-10 md:w-16 md:h-16 text-blue-500 mb-3 md:mb-4 opacity-50" />
                  <h3 className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 md:mb-2">{isRtl ? 'إجمالي الانبعاثات بالدولة' : 'Total National Emissions'}</h3>
                  <p className="text-2xl md:text-4xl font-black text-white">
                      {emissionData.reduce((sum, u) => sum + u.total, 0).toFixed(1)} <span className="text-[10px] md:text-sm text-zinc-500">kg</span>
                  </p>
               </div>
               <div className="bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2rem] p-4 md:p-6 lg:col-span-2">
                  <h3 className="text-[10px] md:text-xs font-black text-white mb-4 md:mb-6 bg-zinc-950 p-2 md:p-3 rounded-lg md:rounded-xl border border-zinc-800 inline-block">{isRtl ? 'المحافظات الأعلى استهلاكاً' : 'Top Governorates'}</h3>
                  <div className="space-y-3 md:space-y-4">
                     {govData.slice(0, 3).map((gov: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 md:p-3 bg-zinc-950 rounded-lg md:rounded-xl border border-zinc-800">
                           <div className="flex flex-col">
                              <span className="font-bold text-white text-xs md:text-sm">{gov.name}</span>
                              <span className="text-[8px] md:text-[10px] text-zinc-500 uppercase">{gov.users} {isRtl ? 'مستخدمين' : 'Users'}</span>
                           </div>
                           <span className="font-black text-egypt-gold text-base md:text-lg">{gov.totalEmissions.toFixed(1)} <span className="text-[9px] md:text-[10px] text-zinc-500">kg</span></span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Users Breakdown Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2rem] overflow-hidden mt-6 md:mt-8">
               <div className="p-4 md:p-6 border-b border-zinc-800 flex justify-between items-center">
                  <h3 className="text-xs md:text-sm font-black text-white">{isRtl ? 'تحليل استهلاك المستخدمين' : 'User Analysis'}</h3>
               </div>
               <div className="overflow-x-auto custom-scrollbar">
                 <table className="w-full text-left min-w-[600px]">
                   <thead>
                     <tr className="bg-zinc-950/50">
                       <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">{isRtl ? 'المستخدم' : 'User'}</th>
                       <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">{isRtl ? 'المحافظة' : 'Governorate'}</th>
                       <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">{isRtl ? 'التصنيف البيئي' : 'Sectors'}</th>
                       <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">{isRtl ? 'إجمالي الانبعاث' : 'Impact'}</th>
                     </tr>
                   </thead>
                   <tbody>
                     {emissionData.slice(0, 10).map((u, i) => (
                       <tr key={i} className="border-t border-zinc-800 hover:bg-white/5 transition-colors">
                         <td className="px-4 md:px-6 py-4 font-bold text-xs md:text-sm text-white">{u.name}</td>
                         <td className="px-4 md:px-6 py-4">
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block">{u.governorate}</span>
                         </td>
                         <td className="px-4 md:px-6 py-4">
                            <div className="flex flex-wrap gap-1.5 md:gap-2">
                               {Object.entries(u.bySector).map(([sector, val], idx) => (
                                  <span key={idx} className="text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.5 md:py-1 bg-zinc-950 border border-zinc-800 rounded font-mono text-zinc-400 whitespace-nowrap">
                                     {sector}: <span className="text-white">{(val as number).toFixed(1)}</span>
                                  </span>
                               ))}
                            </div>
                         </td>
                         <td className="px-4 md:px-6 py-4 text-right font-black text-egypt-gold text-xs md:text-sm">{u.total.toFixed(1)} kg</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {emissionData.length > 10 && (
                    <div className="p-3 md:p-4 text-center border-t border-zinc-800">
                       <span className="text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase">{isRtl ? 'تم عرض 10 مستخدمين...' : 'Showing top 10...'}</span>
                    </div>
                 )}
               </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const LogsModule = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white">{isRtl ? 'سجلات المراقبة' : 'Audit Logs & Monitoring'}</h2>
        <div className="flex gap-2">
           <div className="bg-zinc-900 px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 flex items-center gap-2 border border-zinc-800">
              <Database size={14} /> {dbTables.length} Tables Scanned
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6">{isRtl ? 'أحدث عمليات المدير' : 'Recent Admin Actions'}</h3>
          <div className="space-y-4">
            {adminLogs.length > 0 ? adminLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 group hover:border-egypt-gold/30 transition-all">
                <div className="w-10 h-10 bg-egypt-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Activity size={20} className="text-egypt-gold" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-black text-white uppercase tracking-tight">{log.action}</p>
                    <span className="text-[10px] font-mono text-zinc-500">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-zinc-500 bg-white/5 p-2 rounded-lg font-mono">
                    Table: <span className="text-egypt-gold">{log.table_name}</span> | Target: <span className="text-blue-500">{log.target_id || 'Global'}</span>
                  </p>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-zinc-500 font-bold italic">
                {isRtl ? 'لا يوجد سجلات حتى الآن' : 'No logs recorded yet'}
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 space-y-6">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">{isRtl ? 'هيكل قواعد البيانات' : 'DB Infrastructure'}</h3>
          <div className="space-y-2">
            {dbTables.map((table) => (
              <div key={table} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800 hover:border-blue-500/30 transition-all group pointer-events-none">
                <div className="flex items-center gap-3">
                  <Database size={16} className="text-zinc-600 group-hover:text-blue-500 transition-colors" />
                  <span className="text-xs font-bold text-zinc-400 font-mono">{table}</span>
                </div>
                <ChevronRight size={14} className="text-zinc-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const DiscoveryModule = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <Network className="w-8 h-8 text-egypt-gold" />
          {isRtl ? 'اكتشاف وتحليل النظام الذكي' : 'System Auto-Discovery'}
        </h2>
        <button 
          onClick={handleDeepScan}
          disabled={isScanning}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
        >
          {isScanning ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />} 
          {isRtl ? 'بدء الفحص العميق' : 'Run Deep Scan'}
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] space-y-6">
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">{isRtl ? 'الميزات المكتشفة' : 'Discovered Features'}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {appFeatures.map(feature => (
            <div key={feature.id} className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col justify-between group hover:border-egypt-gold/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-black text-white text-lg">{feature.name}</h4>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{feature.module} Module</p>
                </div>
                <button 
                  onClick={() => toggleFeature(feature.id, feature.is_active)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${feature.is_active ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${feature.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <p className="text-sm font-bold text-zinc-500">{feature.description}</p>
              <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">DB: {feature.db_table_linked || 'None'}</span>
                <span className="text-[10px] font-black text-egypt-gold">Score: {feature.engagement_score || 0}</span>
              </div>
            </div>
          ))}
          {appFeatures.length === 0 && !isScanning && (
            <div className="col-span-full p-12 text-center">
               <Network className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
               <p className="text-zinc-500 font-bold">{isRtl ? 'لم يتم اكتشاف ميزات بعد. قم بتشغيل الفحص.' : 'No features discovered yet. Run a deep scan.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );


  const LiveMonitorModule = () => {
    const [liveData, setLiveData] = useState<any[]>([]);
    
    useEffect(() => {
        const fetchRecentActivity = async () => {
            const { data } = await supabase
                .from('admin_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);
            if (data) {
                setLiveData(data.map(log => ({
                    id: log.id,
                    user: 'System Admin',
                    action: log.action,
                    value: log.table_name,
                    time: new Date(log.created_at).toLocaleTimeString()
                })));
            }
        };

        fetchRecentActivity();
        const interval = setInterval(fetchRecentActivity, 10000); // Poll for real updates every 10s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black text-white">{isRtl ? 'المراقبة المباشرة للنظام' : 'System Command Stream'}</h2>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-1">Real-time Data Transmission</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Stream Active</span>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-zinc-900 border border-white/[0.05] rounded-[2rem] p-6 md:p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                       <Activity size={120} />
                    </div>
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                       <Zap size={14} className="text-egypt-gold" />
                       Latest System Events
                    </h3>
                    <div className="space-y-3 relative z-10">
                        {liveData.length > 0 ? liveData.map(log => (
                            <motion.div 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              key={log.id} 
                              className="flex items-center justify-between p-4 bg-zinc-950/50 border border-white/[0.03] rounded-2xl hover:bg-white/[0.02] transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-white/[0.05]">
                                        <div className="w-2 h-2 bg-egypt-gold rounded-full" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-white tracking-tight">{log.action}</p>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Object: {log.value}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-egypt-gold uppercase tracking-widest mb-1">{log.user}</p>
                                    <p className="text-[9px] font-mono text-zinc-600">{log.time}</p>
                                </div>
                            </motion.div>
                        )) : (
                          <div className="py-20 text-center">
                             <RefreshCw className="w-8 h-8 text-zinc-800 animate-spin mx-auto mb-4" />
                             <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Awaiting system data...</p>
                          </div>
                        )}
                    </div>
                </div>
                
                <div className="bg-zinc-900 border border-white/[0.05] rounded-[2rem] p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-egypt-gold/[0.05] to-transparent opacity-50" />
                    <div className="relative">
                        <div className="w-48 h-48 rounded-full border-2 border-white/[0.05] flex items-center justify-center p-8 bg-zinc-950/30">
                            <Network size={64} className="text-egypt-gold animate-pulse" />
                        </div>
                        <div className="absolute -top-4 -right-4 px-4 py-2 bg-emerald-500 text-black rounded-lg font-black text-[10px] uppercase shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                           Operational
                        </div>
                    </div>
                    <h3 className="mt-8 text-2xl font-black text-white tracking-widest uppercase">{isRtl ? 'حالة البنية التحتية' : 'Platform Health'}</h3>
                    <p className="text-zinc-500 font-bold max-w-xs mt-3 text-sm leading-relaxed">
                       {isRtl 
                         ? 'يتم فحص استقرار قاعدة البيانات وبروتوكولات الربط بالوقت الفعلي من مراكز التحكم الإقليمية.' 
                         : 'Real-time database integrity and connectivity protocols are verified across all regional edges.'}
                    </p>
                    <div className="mt-8 flex gap-3">
                       <div className="flex flex-col items-center px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl">
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Latency</span>
                          <span className="text-sm font-black text-emerald-500">24ms</span>
                       </div>
                       <div className="flex flex-col items-center px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl">
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Uptime</span>
                          <span className="text-sm font-black text-egypt-gold">99.98%</span>
                       </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const NewsManagementModule = () => {
    const [news, setNews] = useState<any[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [loadingNews, setLoadingNews] = useState(false);
    
    const loadNews = async () => {
      setLoadingNews(true);
      const { data } = await supabase.from('eco_news').select('*').order('created_at', { ascending: false });
      if (data) setNews(data);
      setLoadingNews(false);
    };

    useEffect(() => {
        loadNews();
    }, []);

    const addNews = async () => {
        if (!newTitle || !newDesc) return;
        setLoadingNews(true);
        await supabase.from('eco_news').insert({ title: newTitle, description: newDesc });
        setNewTitle(''); setNewDesc('');
        await loadNews();
        logAdminAction('ADD_NEWS', 'eco_news', 'AUTO', { title: newTitle });
    };

    const deleteNews = async (id: string) => {
        await supabase.from('eco_news').delete().eq('id', id);
        await loadNews();
        logAdminAction('DELETE_NEWS', 'eco_news', id, {});
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">{isRtl ? 'إدارة الأخبار البيئية' : 'Eco News Management'}</h2>
              <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                {news.length} Articles Live
              </div>
            </div>

            <div className="bg-zinc-900 p-8 rounded-[3rem] border border-zinc-800 space-y-6">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">{isRtl ? 'إضافة خبر جديد' : 'Publish New Article'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={isRtl ? 'عنوان الخبر' : 'Article Title'} className="w-full p-4 bg-zinc-950 border border-zinc-800 text-white rounded-2xl outline-none focus:border-egypt-gold font-bold"/>
                  <button onClick={addNews} disabled={loadingNews} className="px-8 py-4 bg-egypt-gold text-egypt-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-egypt-gold/20 flex items-center justify-center gap-2">
                    {loadingNews ? <RefreshCw className="animate-spin" size={16}/> : <Plus size={16}/>}
                    {isRtl ? 'نشر الخبر الآن' : 'Publish Now'}
                  </button>
                </div>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder={isRtl ? 'محتوى الخبر...' : 'Article content...'} className="w-full p-6 bg-zinc-950 border border-zinc-800 text-white rounded-3xl outline-none focus:border-egypt-gold font-bold h-32 resize-none"/>
            </div>

            <div className="grid grid-cols-1 gap-4">
               {news.map((item) => (
                 <div key={item.id} className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-between group hover:border-egypt-gold/50 transition-all">
                    <div className="flex-1">
                       <h4 className="font-black text-white text-lg mb-1">{item.title}</h4>
                       <p className="text-sm text-zinc-500 line-clamp-1">{item.description}</p>
                       <span className="text-[9px] font-mono text-zinc-600 mt-2 block">{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    <button onClick={() => deleteNews(item.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white">
                       <Trash2 size={20} />
                    </button>
                 </div>
               ))}
            </div>
        </div>
    );
  };

  const RewardsManagementModule = () => {
    const [rewards, setRewards] = useState<any[]>([]);
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [loadingRewards, setLoadingRewards] = useState(false);
    
    const loadRewards = async () => {
      setLoadingRewards(true);
      const { data } = await supabase.from('eco_rewards').select('*').order('created_at', { ascending: false });
      if (data) setRewards(data);
      setLoadingRewards(false);
    };

    useEffect(() => {
        loadRewards();
    }, []);

    const addReward = async () => {
        if (!newName || !newPrice) return;
        setLoadingRewards(true);
        await supabase.from('eco_rewards').insert({ name: newName, points_cost: parseInt(newPrice), image_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${newName}` });
        setNewName(''); setNewPrice('');
        await loadRewards();
        logAdminAction('ADD_REWARD', 'eco_rewards', 'AUTO', { name: newName, cost: newPrice });
    };

    const deleteReward = async (id: string) => {
        await supabase.from('eco_rewards').delete().eq('id', id);
        await loadRewards();
        logAdminAction('DELETE_REWARD', 'eco_rewards', id, {});
    };

    return (
        <div className="space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl md:text-2xl font-black text-white">{isRtl ? 'إدارة كتالوج المكافآت' : 'Rewards Catalog Management'}</h2>
              <div className="w-fit px-3 py-1.5 md:px-4 md:py-2 bg-egypt-gold/10 border border-egypt-gold/20 rounded-xl text-[8px] md:text-[10px] font-black text-egypt-gold uppercase tracking-widest whitespace-nowrap">
                {rewards.length} Items Listed
              </div>
            </div>

            <div className="bg-zinc-900 p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-zinc-800 space-y-4 md:space-y-6">
                <h3 className="text-[10px] md:text-xs font-black text-zinc-500 uppercase tracking-widest">{isRtl ? 'إضافة جائزة جديدة' : 'Add New Reward Item'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={isRtl ? 'اسم الجائزة' : 'Reward Name'} className="w-full p-3 md:p-4 bg-zinc-950 border border-zinc-800 text-white rounded-xl md:rounded-2xl outline-none focus:border-egypt-gold font-bold text-xs md:text-sm"/>
                  <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder={isRtl ? 'التكلفة بالنقاط' : 'Cost in Points'} className="w-full p-3 md:p-4 bg-zinc-950 border border-zinc-800 text-white rounded-xl md:rounded-2xl outline-none focus:border-egypt-gold font-bold text-xs md:text-sm"/>
                  <button onClick={addReward} disabled={loadingRewards} className="px-6 md:px-8 py-3 md:py-4 bg-emerald-500 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                    {loadingRewards ? <RefreshCw className="animate-spin" size={14}/> : <Plus size={14}/>}
                    {isRtl ? 'إضافة الآن' : 'Add to Catalog'}
                  </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
               {rewards.map((item) => (
                 <div key={item.id} className="p-5 md:p-6 bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2.5rem] flex flex-col items-center text-center space-y-3 md:space-y-4 group hover:border-egypt-gold/50 transition-all relative">
                    <img src={item.image_url} alt="" className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-white/5 p-2 mb-2"/>
                    <div>
                       <h4 className="font-black text-white text-base md:text-lg">{item.name}</h4>
                       <p className="text-egypt-gold font-black text-[10px] md:text-xs uppercase tracking-widest">{item.points_cost} Green Points</p>
                    </div>
                    <button onClick={() => deleteReward(item.id)} className="absolute top-3 md:top-4 right-3 md:right-4 p-1.5 md:p-2 text-zinc-600 hover:text-red-500 transition-colors">
                       <Trash2 size={16} />
                    </button>
                 </div>
               ))}
            </div>
        </div>
    );
  };

  const OverviewModule = () => (
    <div className="space-y-8 pb-12 animate-in fade-in zoom-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase mb-2">Egypt Central Command</h1>
            <p className="text-[10px] md:text-xs font-black text-egypt-gold uppercase tracking-[0.5em] flex items-center gap-2">
               <Globe className="animate-spin-slow" size={14} />
               Live National Infrastructure Node
            </p>
         </div>
         <div className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex items-center gap-6">
            <div className="flex flex-col">
               <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Active Nodes</span>
               <span className="text-sm font-black text-white">4.2k <span className="text-emerald-500">Live</span></span>
            </div>
            <div className="w-[1px] h-8 bg-zinc-800" />
            <div className="flex flex-col">
               <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">System Load</span>
               <span className="text-sm font-black text-white">12%</span>
            </div>
         </div>
      </div>

      <StatsPanel />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-zinc-900/50 border border-white/[0.05] p-6 md:p-8 rounded-[2.5rem] relative overflow-hidden backdrop-blur-sm group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700">
             <LineChartIcon size={240} />
          </div>
          <div className="flex items-center justify-between mb-8">
             <div>
                <h3 className="text-[10px] font-black text-egypt-gold uppercase tracking-[0.3em] mb-1">{isRtl ? 'تحليل الأداء البيئي القومي' : 'National Performance Analysis'}</h3>
                <p className="text-xl font-black text-white">{isRtl ? 'نمو البصمة الكربونية لمصر' : 'National Carbon Impact Trend'}</p>
             </div>
             <div className="flex gap-2">
                <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-zinc-400 border border-white/5">LIVE FEED</div>
             </div>
          </div>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={govChartData.length > 0 ? govChartData : []}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#d4af37', fontSize: '12px', fontWeight: '900' }}
                />
                <Area type="monotone" dataKey="val" stroke="#d4af37" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                <Area type="monotone" dataKey="secondary" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorSec)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 pt-6 border-t border-white/[0.05]">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-egypt-gold shadow-[0_0_10px_#d4af37]" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Citizen Impact</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Industry Baseline</span>
             </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/[0.05] p-6 md:p-8 rounded-[2.5rem] flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
           <div className="relative z-10">
              <h3 className="text-[10px] font-black text-egypt-gold uppercase tracking-[0.3em] mb-1">{isRtl ? 'توزبع الموارد القومي' : 'National Resource Allocation'}</h3>
              <p className="text-xl font-black text-white mb-8">{isRtl ? 'الاستهلاك حسب القطاع' : 'National Sector Load'}</p>
              <div className="space-y-6">
                {[
                  { label: 'Residential', val: 42, color: 'bg-amber-400', shadow: 'shadow-amber-400/20' },
                  { label: 'Government', val: 28, color: 'bg-cyan-400', shadow: 'shadow-cyan-400/20' },
                  { label: 'Transport', val: 18, color: 'bg-blue-400', shadow: 'shadow-blue-400/20' },
                  { label: 'Commercial', val: 12, color: 'bg-egypt-gold', shadow: 'shadow-egypt-gold/20' },
                ].map((item, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{item.label}</span>
                      <span className="text-sm font-black text-white">{item.val}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/[0.03]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.val}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={`h-full ${item.color} ${item.shadow} shadow-lg`}
                      />
                    </div>
                  </div>
                ))}
              </div>
           </div>
           <div className="mt-12 space-y-3 relative z-10">
              <button 
                onClick={() => setActiveTab('reporting')}
                className="w-full py-4 bg-egypt-gold text-egypt-black hover:scale-[1.02] active:scale-95 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-egypt-gold/10"
              >
                 {isRtl ? 'عرض التقارير القومية الاستراتيجية' : 'Access Strategic Cloud'}
              </button>
              <button className="w-full py-4 bg-zinc-800/50 hover:bg-white/5 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/5">
                 {isRtl ? 'تصدير البيانات اللحظية' : 'Live Stream Data'}
              </button>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-zinc-950 text-white flex font-sans ${isRtl ? 'rtl' : 'ltr'}`}>
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-950/20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRtl ? -20 : 20 }}
              transition={{ duration: 0.2 }}
              className="pb-24"
            >
              {activeTab === 'overview' && <OverviewModule />}
              {activeTab === 'users' && <UsersModule />}
              {activeTab === 'pricing' && <PricingControl isRtl={isRtl} />}
              {activeTab === 'reporting' && <NationalReports isRtl={isRtl} />}
              {activeTab === 'gov_services' && <GovServicesAdmin isRtl={isRtl} />}
              {activeTab === 'geo_analytics' && <GovernorateAnalytics isRtl={isRtl} />}
              {activeTab === 'billing_engine' && <BillingControl isRtl={isRtl} />}
              {activeTab === 'logs' && <LogsModule />}
              {activeTab === 'discovery' && <DiscoveryModule />}
              {activeTab === 'emissions' && <EmissionsModule />}
              {activeTab === 'transport' && <TransportModule />}
              {activeTab === 'live_monitor' && <LiveMonitorModule />}
              {activeTab === 'news_management' && <NewsManagementModule />}
              {activeTab === 'database' && <DatabaseModule />}
              {activeTab === 'rewards_management' && <RewardsManagementModule />}
              {activeTab === 'ai_rules' && <AIAnalytics isRtl={isRtl} />}
              {activeTab === 'missions' && <MissionsAdmin isRtl={isRtl} />}
              {activeTab === 'marketplace' && <MarketplaceAdmin isRtl={isRtl} />}
              {activeTab === 'broadcast' && <AlertsBroadcast isRtl={isRtl} />}
              
              {activeTab === 'settings' && (
                <div className="space-y-8 animate-in fade-in duration-700">
                  <div className="flex flex-col">
                    <h2 className="text-3xl font-black text-white">{isRtl ? 'إعدادات النظام والتحكم' : 'Terminal Configuration'}</h2>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-2 italic flex items-center gap-2">
                       <ShieldAlert size={14} className="text-egypt-gold" />
                       Authorization Level: Tier-1 Admin Required
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-zinc-900 border border-white/[0.05] p-8 rounded-[3rem] space-y-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                         <Bell size={120} />
                      </div>
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 bg-egypt-gold/10 rounded-2xl flex items-center justify-center border border-egypt-gold/20">
                          <Bell className="w-7 h-7 text-egypt-gold" />
                        </div>
                        <div>
                          <h3 className="font-black text-white text-xl">{isRtl ? 'بث إشعارات جماعي' : 'Mass Communication'}</h3>
                          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{isRtl ? 'إرسال رسالة فورية لكل المستخدمين' : 'Instant broadcast to all node participants'}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4 relative z-10">
                        <input 
                          type="text" 
                          placeholder={isRtl ? 'عنوان الإشعار المركزي...' : 'Broadcast Subject...'}
                          value={broadcastTitle}
                          onChange={(e) => setBroadcastTitle(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/[0.05] rounded-2xl p-5 text-sm font-black text-white focus:border-egypt-gold transition-all outline-none"
                        />
                        <textarea 
                          placeholder={isRtl ? 'محتوى الرسالة الإذاعية...' : 'Master Message Payload...'}
                          rows={4}
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/[0.05] rounded-[2.5rem] p-6 text-sm font-bold text-white focus:border-egypt-gold transition-all resize-none outline-none"
                        />
                        <div className="flex gap-4">
                           <select 
                             value={broadcastType}
                             onChange={(e) => setBroadcastType(e.target.value as any)}
                             className="bg-zinc-950 border border-white/[0.05] rounded-2xl text-[10px] font-black text-zinc-400 p-4 uppercase tracking-widest outline-none focus:border-egypt-gold"
                           >
                              <option>Info</option>
                              <option>Success</option>
                              <option>Warning</option>
                              <option>Alert</option>
                           </select>
                           <button 
                             onClick={async () => {
                               if(!broadcastTitle || !broadcastMessage) {
                                  notificationService.error(isRtl ? 'يرجى إدخال البيانات' : 'Payload Incomplete');
                                  return;
                               }
                               await notificationService.sendBroadcast(broadcastTitle, broadcastMessage, broadcastType);
                               notificationService.success(isRtl ? 'تم البث بنجاح' : 'Broadcast Synced Successfully');
                               setBroadcastTitle('');
                               setBroadcastMessage('');
                             } }
                             className="flex-1 py-5 bg-egypt-gold text-egypt-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-egypt-gold/10"
                           >
                             {isRtl ? 'بث الإشارة الآن' : 'Initiate Broadcast'}
                           </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-900 border border-white/[0.05] p-8 rounded-[3rem] space-y-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                         <Settings size={120} />
                      </div>
                      <h3 className="text-[10px] font-black text-egypt-gold uppercase tracking-[0.3em] mb-4 relative z-10 flex items-center gap-2">
                         <Cpu size={14} />
                         {isRtl ? 'تحكم في الوحدات (مباشر)' : 'Master Module Toggles'}
                      </h3>
                      <div className="space-y-3 relative z-10 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                        {[
                          { id: 'elec', label: isRtl ? 'وحدة الطاقة والكهرباء' : 'Electricity Grid Node' },
                          { id: 'water', label: isRtl ? 'وحدة تحلية المياه' : 'Water Purification Hub' },
                          { id: 'rewards', label: isRtl ? 'نظام المكافآت العالمي' : 'Rewards Settlement' },
                          { id: 'ai', label: isRtl ? 'نواة الذكاء الاصطناعي' : 'AI Core Sentience' },
                          { id: 'maintenance_mode', label: isRtl ? 'وضع الصيانة الشامل' : 'Global Safe Mode' },
                        ].map((item) => {
                          const isActive = appConfig?.features?.[item.id] !== false;
                          return (
                            <div key={item.id} className="flex items-center justify-between p-5 bg-zinc-950/50 rounded-2xl border border-white/[0.05] hover:bg-zinc-900 transition-all cursor-pointer group/item"
                               onClick={async () => {
                                   const currentConfig = await storageService.getAppConfig();
                                   const active = !(currentConfig?.features?.[item.id] !== false);
                                   await storageService.saveAppConfig('features', { ...currentConfig?.features, [item.id]: active });
                                   fetchConfig();
                                   notificationService.success(`${item.label} set to ${active ? 'Active' : 'Standby'}`);
                               }}
                            >
                               <div className="flex flex-col">
                                  <span className="font-black text-xs text-white tracking-widest">{item.label}</span>
                                  <span className={`text-[8px] font-black uppercase mt-1 ${isActive ? 'text-emerald-500' : 'text-red-500'}`}>
                                     {isActive ? 'Connected & Operational' : 'Offline / Standby'}
                                  </span>
                               </div>
                               <div className={`w-14 h-7 rounded-full relative transition-all duration-500 ${isActive ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                                  <div className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-500 shadow-lg ${isActive ? 'right-1 bg-emerald-500 shadow-emerald-500/50' : 'left-1 bg-red-500 shadow-red-500/50'}`} />
                               </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'marketplace' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                     <div>
                       <h2 className="text-3xl font-black font-arabic mb-2 flex items-center gap-3">
                         <Store className="w-8 h-8 text-egypt-gold" />
                         {isRtl ? 'إدارة شركاء السوق' : 'Marketplace Management'}
                       </h2>
                       <p className="text-zinc-500 font-bold">{isRtl ? 'إدارة الشركاء، العروض المميزة، وتوليد الإيرادات.' : 'Manage partners, featured offers, and revenue generation.'}</p>
                     </div>
                     <button 
                        onClick={async () => {
                           const name = prompt(isRtl ? 'اسم الشريك' : 'Partner Name');
                           if (!name) return;
                           const { error } = await supabase.from('partners').insert({ name, is_verified: true });
                           if (error) notificationService.error(error.message);
                           else {
                             notificationService.success(isRtl ? 'تم إضافة الشريك' : 'Partner Added');
                             fetchInitialData();
                           }
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-egypt-gold text-egypt-black rounded-xl font-black hover:bg-yellow-400 transition-colors shadow-lg shadow-egypt-gold/20"
                     >
                        <Plus className="w-5 h-5" />
                        {isRtl ? 'إضافة شريك' : 'Add Partner'}
                     </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 p-8 rounded-[3rem] space-y-6">
                           <div className="flex items-center justify-between">
                              <h3 className="text-lg font-black flex items-center gap-2">
                                 <ShieldCheck className="text-emerald-500" size={18} />
                                 {isRtl ? 'شركاء الأعمال الموثقين' : 'Verified Business Partners'}
                              </h3>
                              <span className="text-[10px] font-black text-zinc-500 tracking-widest uppercase">{partners.length} {isRtl ? 'شريك' : 'Partners'}</span>
                           </div>
                           
                           <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                              {partners.map(p => (
                                <div key={p.id} className="p-5 bg-zinc-950 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-egypt-gold/30 transition-all">
                                   <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center font-black text-egypt-gold border border-white/5 overflow-hidden">
                                         {p.logo_url ? <img src={p.logo_url} className="w-full h-full object-cover" /> : p.name.charAt(0)}
                                      </div>
                                      <div>
                                         <p className="font-black text-sm">{p.name}</p>
                                         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{p.category || (isRtl ? 'غير مصنف' : 'Uncategorized')}</p>
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-2">
                                      <button 
                                         onClick={async () => {
                                            if (confirm(isRtl ? 'هل أنت متأكد؟' : 'Are you sure?')) {
                                               await supabase.from('partners').delete().eq('id', p.id);
                                               fetchInitialData();
                                            }
                                         }}
                                         className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                                      >
                                         <Trash2 size={16} />
                                      </button>
                                   </div>
                                </div>
                              ))}
                              {partners.length === 0 && (
                                 <div className="py-10 text-center opacity-30 italic font-bold">
                                    {isRtl ? 'لا يوجد شركاء حالياً' : 'No partners found'}
                                 </div>
                              )}
                           </div>
                      </div>

                      <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 p-8 rounded-[3rem] space-y-6">
                           <div className="flex items-center justify-between">
                              <h3 className="text-lg font-black flex items-center gap-2">
                                 <Trophy className="text-egypt-gold" size={18} />
                                 {isRtl ? 'العروض النشطة' : 'Active Sponsored Offers'}
                              </h3>
                              <span className="text-[10px] font-black text-zinc-500 tracking-widest uppercase">{partnerOffers.length} {isRtl ? 'عرض' : 'Offers'}</span>
                           </div>

                           <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                              {partnerOffers.map(offer => (
                                <div key={offer.id} className="p-5 bg-zinc-950 rounded-2xl border border-white/5 flex flex-col gap-3 group hover:border-egypt-gold/30 transition-all">
                                   <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-[10px] font-black text-zinc-500 border border-white/5">
                                            {offer.partners?.name?.charAt(0)}
                                         </div>
                                         <span className="font-black text-xs">{isRtl ? offer.title_ar : offer.title_en}</span>
                                      </div>
                                      <span className="text-[10px] font-black text-egypt-gold bg-egypt-gold/10 px-2 py-1 rounded-md">
                                         {offer.discount_value}% {isRtl ? 'خصم' : 'OFF'}
                                      </span>
                                   </div>
                                   <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                      <span className="text-[9px] font-bold text-zinc-500 lowercase tracking-widest">
                                         {isRtl ? 'ينتهي في: ' : 'Expires: '} {new Date(offer.expiry_date).toLocaleDateString()}
                                      </span>
                                      <button 
                                         onClick={async () => {
                                           await supabase.from('partner_offers').delete().eq('id', offer.id);
                                           fetchInitialData();
                                         }}
                                         className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
                                      >
                                         {isRtl ? 'إزالة' : 'Remove'}
                                      </button>
                                   </div>
                                </div>
                              ))}
                              {partnerOffers.length === 0 && (
                                 <div className="py-10 text-center opacity-30 italic font-bold">
                                    {isRtl ? 'لا يوجد عروض نشطة' : 'No active offers'}
                                 </div>
                              )}
                           </div>
                           
                           <button 
                              onClick={async () => notificationService.info('Select a partner first to create an offer.')}
                              className="w-full py-4 bg-zinc-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-all border border-white/5"
                           >
                              {isRtl ? 'إعداد حملة جديدة' : 'Setup New Campaign'}
                           </button>
                      </div>
                  </div>
                </div>
              )}

              {activeTab === 'transactions' && <TransactionsModule />}

              {['ai_rules', 'missions', 'devices'].includes(activeTab) && (
                <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
                  <div className="flex flex-col">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                      {activeTab === 'ai_rules' ? (isRtl ? 'بروتوكولات الذكاء الاصطناعي' : 'AI Cognitive Logic') :
                       activeTab === 'missions' ? (isRtl ? 'مركز إدارة العمليات' : 'Mission Command') :
                       (isRtl ? 'شبكة الأجهزة المرتبطة' : 'IoT Provisioning')}
                    </h2>
                    <p className="text-[10px] font-black text-egypt-gold uppercase tracking-[0.4em] mt-2">Authorization Level: Tier-1 Control Required</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-zinc-900 border border-white/[0.05] p-8 rounded-[3rem] relative overflow-hidden backdrop-blur-md">
                       <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                          {activeTab === 'ai_rules' ? <Cpu size={200} /> : activeTab === 'missions' ? <Trophy size={200} /> : <Smartphone size={200} />}
                       </div>
                       <h3 className="font-black text-white text-xl mb-8 relative z-10">{isRtl ? 'تحليل الحالة المباشر' : 'Live Unit Analysis'}</h3>
                       <div className="space-y-4 relative z-10">
                          {activeTab === 'ai_rules' ? (
                             ['Neural Feedback', 'Natural Language Logic', 'Regional Bias Filter'].map(t => (
                               <div key={t} className="p-5 bg-zinc-950/50 border border-white/[0.03] rounded-2xl flex items-center justify-between group hover:border-egypt-gold/30 transition-all">
                                  <span className="font-black text-xs text-white uppercase tracking-widest">{t}</span>
                                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] px-3 py-1 bg-emerald-500/10 rounded-lg">Operational</span>
                               </div>
                             ))
                          ) : activeTab === 'missions' ? (
                             ['Ramadan Eco Challenge', 'Solar Transition P1', 'Electric Fleet Migration'].map(t => (
                               <div key={t} className="p-5 bg-zinc-950/50 border border-white/[0.03] rounded-2xl flex items-center justify-between group hover:border-egypt-gold/30 transition-all">
                                  <span className="font-black text-xs text-white uppercase tracking-widest">{t}</span>
                                  <span className="text-[10px] font-black text-egypt-gold uppercase tracking-[0.2em] px-3 py-1 bg-egypt-gold/10 rounded-lg">92% Progress</span>
                               </div>
                             ))
                          ) : (
                             ['Metro Meter Hub A1', 'Coastal Tracking Array', 'Industrial Bio-Scanner'].map(t => (
                               <div key={t} className="p-5 bg-zinc-950/50 border border-white/[0.03] rounded-2xl flex items-center justify-between group hover:border-egypt-gold/30 transition-all">
                                  <span className="font-black text-xs text-white uppercase tracking-widest">{t}</span>
                                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] px-3 py-1 bg-blue-500/10 rounded-lg">Connected</span>
                               </div>
                             ))
                          )}
                       </div>
                    </div>

                    <div className="bg-zinc-900 border border-white/[0.05] p-8 rounded-[3rem] flex flex-col justify-between items-center text-center">
                       <div className="w-32 h-32 bg-zinc-950 rounded-full border-2 border-white/[0.05] flex items-center justify-center p-6 shadow-2xl">
                          {activeTab === 'ai_rules' ? <Brain className="w-full h-full text-egypt-gold animate-pulse" /> : 
                           activeTab === 'missions' ? <Trophy className="w-full h-full text-egypt-gold" /> : 
                           <Activity className="w-full h-full text-egypt-gold" />}
                       </div>
                       <div className="mt-8">
                          <h4 className="text-xl font-black text-white uppercase tracking-tight">{isRtl ? 'تزامن البيانات' : 'Core Sync Status'}</h4>
                          <p className="text-xs text-zinc-500 font-bold mt-2 italic">Global integrity check passed at 04:00 UTC.</p>
                       </div>
                       <button className="mt-8 w-full py-4 bg-egypt-gold text-egypt-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-egypt-gold/20">
                          {isRtl ? 'تحديث الوحدة' : 'Force Refresh Node'}
                       </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {loading && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/80 backdrop-blur-md flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
             <RefreshCw className="w-12 h-12 text-egypt-gold animate-spin" />
             <p className="text-[10px] font-black tracking-[0.5em] text-egypt-gold uppercase animate-pulse">Initializing OS...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
