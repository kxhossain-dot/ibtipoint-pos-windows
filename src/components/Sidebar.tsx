import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Boxes, 
  BookOpen, 
  Smartphone, 
  Camera, 
  ReceiptText, 
  BarChart3, 
  Settings, 
  PackageCheck,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { THEMES } from '../utils/theme';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, t, settings, currentRole } = useApp();
  const theme = THEMES[settings.themeColor] || THEMES.teal;

  const navItems = [
    {
      id: 'dashboard',
      labelBn: 'ড্যাশবোর্ড',
      labelEn: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'pos',
      labelBn: 'পিওএস বিক্রয়',
      labelEn: 'POS Terminal',
      icon: ShoppingCart,
      badge: 'F2',
    },
    {
      id: 'inventory',
      labelBn: 'পণ্য ও স্টক',
      labelEn: 'Inventory & Stock',
      icon: Boxes,
      badge: null,
    },
    {
      id: 'khata',
      labelBn: 'বাকি খাতা',
      labelEn: 'Customer Khata',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'mobile_banking',
      labelBn: 'মোবাইল ব্যাংকিং',
      labelEn: 'Mobile Banking',
      icon: Smartphone,
      badge: 'bKash/Nagad',
    },
    {
      id: 'photo_studio',
      labelBn: 'ছবি ও স্টুডিও',
      labelEn: 'Photo Studio',
      icon: Camera,
      badge: null,
    },
    {
      id: 'expense',
      labelBn: 'দৈনিক খরচ',
      labelEn: 'Daily Expenses',
      icon: ReceiptText,
      badge: null,
    },
    {
      id: 'reports',
      labelBn: 'হিসাব রিপোর্ট',
      labelEn: 'Reports & P&L',
      icon: BarChart3,
      badge: null,
      adminOnly: true,
    },
    {
      id: 'settings',
      labelBn: 'সেটিংস ও নিরাপত্তা',
      labelEn: 'Settings & Security',
      icon: Settings,
      badge: null,
      adminOnly: true,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 select-none transition-colors">
      
      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-hidden">
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {t('প্রধান মেনু', 'Main Navigation')}
        </div>

        {navItems.map(item => {
          if (item.adminOnly && currentRole !== 'admin') {
            return (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-400 dark:text-slate-600 text-xs font-medium cursor-not-allowed opacity-60"
                title={t('শুধুমাত্র এডমিন এক্সেস', 'Admin Access Only')}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4" />
                  <span>{t(item.labelBn, item.labelEn)}</span>
                </div>
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
            );
          }

          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all ${
                isActive
                  ? `${theme.primary} text-white shadow-sm shadow-teal-500/20 translate-x-1`
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 lg:w-4.5 lg:h-4.5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className="truncate">{t(item.labelBn, item.labelEn)}</span>
              </div>
              
              {item.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer info in sidebar */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <span>{settings.business.name}</span>
          <span className="text-emerald-600 font-bold">● {t('সক্রিয়', 'Online')}</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
          {settings.business.phone}
        </p>
      </div>
    </aside>
  );
};
