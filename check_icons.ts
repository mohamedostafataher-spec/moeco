
import * as Lucide from 'lucide-react';

const icons = [
  'Home', 'Car', 'Zap', 'Droplets', 'Utensils', 'Plane', 'ShoppingBag', 'Target', 'Trophy', 
  'MessageSquare', 'FileText', 'Info', 'Menu', 'LogOut', 'ShieldCheck', 'LayoutGrid', 'Flame', 
  'Trash2', 'ShoppingCart', 'Settings', 'Moon', 'Sun', 'Briefcase', 'Lock', 'Key', 'Terminal', 
  'AlertTriangle', 'TrendingUp', 'Globe', 'Award', 'Landmark', 'DollarSign', 'Users', 'Building2', 
  'ShieldAlert', 'BarChart3', 'Download', 'Footprints', 'Sword', 'Newspaper', 'Heart', 'Sprout', 
  'Navigation', 'Calculator', 'BookOpen', 'HandHelping', 'Train', 'User', 'Bell', 'Ticket', 
  'Leaf', 'Activity', 'Fingerprint', 'X', 'Palmtree', 'CheckCircle2'
];

icons.forEach(icon => {
  if (!Lucide[icon]) {
    console.log(`Icon missing: ${icon}`);
  }
});
