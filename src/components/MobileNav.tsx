import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  BookOpen, 
  Smartphone, 
  Menu, 
  X, 
  Boxes, 
  Camera, 
  ReceiptText, 
  BarChart3, 
  Settings,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { THEMES } from '../utils/theme';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, t, settings, currentRole } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = THEMES[settings.themeColor] || THEMES.teal;

  const quickNav = [
    { id: 'dashboard', labelBn: 'ড্যাশবোর্ড', labelEn: 'Home', icon: LayoutDashboard },
    { id: 'pos', labelBn: 'পিওএস', labelEn: 'POS', icon: ShoppingCart },
    { id: 'khata', labelBn: 'বাকি খাতা', labelEn: 'Khata', icon: BookOpen },
    { id: 'mobile_banking', labelBn: 'ব্যাংকিং', labelEn: 'Banking', icon: Smartphone },
  ];

  const moreNav = [
    { id: 'inventory', labelBn: 'পণ্য ও স্টক (মজুদ)', labelEn: 'Inventory & Stock', icon: Boxes },
    { id: 'photo_studio', labelBn: 'ছবি ও স্টুডিও সার্ভিস', labelEn: 'Photo Studio Orders', icon: Camera },
    { id: 'expense', labelBn: 'দৈনিক খরচ হিসাব', labelEn: 'Daily Expenses', icon: ReceiptText },
    { id: 'reports', labelBn: 'রিপোর্ট ও লাভ-ক্ষতি', labelEn: 'Financial Reports', icon: BarChart3, adminOnly: true },
    { id: 'settings', labelBn: 'সেটিংস ও নিরাপত্তা', labelEn: 'Settings & Security', icon: Settings, adminOnly: true },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Slide-over Drawer for extra menus */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 shadow-2xl max-h-[85vh] overflow-y-auto z-10 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="font-extrabold text-slate-900 dark:text-white text-base">
                {settings.business.name} {t('মেনু', 'Menu')}
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-4">
              {moreNav.map(item => {
                if (item.adminOnly && currentRole !== 'admin') {
                  return null;
                }
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex flex-col items-start p-3 rounded-2xl text-left border transition-all ${
                      isActive
                        ? `${theme.primary} text-white border-transparent shadow-sm`
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isActive ? 'text-white' : theme.text}`} />
                    <span className="font-bold text-xs leading-tight">
                      {t(item.labelBn, item.labelEn)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Tab Bar for Android & Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {quickNav.map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all active:scale-95 ${
                isActive 
                  ? `${theme.text} font-bold` 
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? theme.bgLight : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5">
                {t(item.labelBn, item.labelEn)}
              </span>
            </button>
          );
        })}

        {/* More Drawer Trigger */}
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all active:scale-95 ${
            drawerOpen ? theme.text : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <div className="p-1">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">{t('আরও', 'More')}</span>
        </button>
      </nav>
    </>
  );
};
