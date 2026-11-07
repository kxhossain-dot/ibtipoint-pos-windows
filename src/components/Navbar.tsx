import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  User, 
  Lock, 
  Unlock, 
  Moon, 
  Sun, 
  Palette, 
  Download, 
  Bell, 
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { THEMES, ThemeColor } from '../utils/theme';

interface NavbarProps {
  onOpenPinModal: (targetRole: 'admin' | 'staff') => void;
  onOpenReceiptModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPinModal }) => {
  const { 
    currentRole, 
    lockToStaff, 
    settings, 
    updateSettings, 
    t, 
    setActiveTab, 
    products, 
    studioJobs 
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString(settings.language === 'bn' ? 'bn-BD' : 'en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [settings.language]);

  const activeTheme = THEMES[settings.themeColor] || THEMES.teal;

  // Alerts count: low stock + pending studio jobs
  const lowStockCount = products.filter(p => p.stock <= p.minStockAlert).length;
  const pendingJobsCount = studioJobs.filter(j => j.status === 'pending' || j.status === 'processing').length;

  return (
    <header className="shrink-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${activeTheme.primary} flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform`}>
              <img src="./logo.png" alt="ibtipoint" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                  {settings.business.name}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  POS v2.5
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs">
                {t('টেলিকম • মোবাইল ব্যাংকিং • স্টুডিও • ইলেকট্রিক • গ্যাজেট', 'Telecom • Mobile Banking • Studio • Electric • Gadget')}
              </p>
            </div>
          </div>
        </div>

        {/* Live Clock & Alerts (Desktop) */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            🕒 {currentTime}
          </div>

          {lowStockCount > 0 && (
            <button 
              onClick={() => setActiveTab('inventory')}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors"
              title={`${lowStockCount} items have low stock`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>{lowStockCount} {t('কম স্টক', 'Low Stock')}</span>
            </button>
          )}

          {pendingJobsCount > 0 && (
            <button 
              onClick={() => setActiveTab('photo_studio')}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300 hover:bg-blue-100 transition-colors"
            >
              <span>📷 {pendingJobsCount} {t('স্টুডিও কাজ বাকি', 'Studio Jobs')}</span>
            </button>
          )}
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Role Status & Toggle Button */}
          {currentRole === 'admin' ? (
            <div className="flex items-center">
              <button
                onClick={() => lockToStaff()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition-colors"
                title={t('স্টাফ মোডে লক করুন', 'Lock into Staff Mode')}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">{t('এডমিন', 'Admin')}</span>
                <Lock className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenPinModal('admin')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950 dark:hover:bg-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 transition-colors"
              title={t('এডমিন পিন দিয়ে আনলক করুন', 'Unlock Admin with PIN')}
            >
              <User className="w-4 h-4 text-amber-700" />
              <span className="hidden sm:inline">{t('স্টাফ মোড', 'Staff Mode')}</span>
              <Unlock className="w-3.5 h-3.5 text-amber-600" />
            </button>
          )}

          {/* Theme Color Picker Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
              title={t('কালার থিম পরিবর্তন', 'Change Theme Color')}
            >
              <Palette className="w-4 h-4" />
            </button>

            {showThemeMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowThemeMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 animate-in fade-in zoom-in-95">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                    {t('থিম কালার সিলেক্ট', 'Select Theme Color')}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(THEMES) as ThemeColor[]).map(color => {
                      const c = THEMES[color];
                      const isSelected = settings.themeColor === color;
                      return (
                        <button
                          key={color}
                          onClick={() => {
                            updateSettings({ themeColor: color });
                            setShowThemeMenu(false);
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-left transition-colors ${
                            isSelected 
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full ${c.primary}`} />
                          <span className="truncate">{settings.language === 'bn' ? c.nameBn : c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => updateSettings({ themeMode: settings.themeMode === 'dark' ? 'light' : 'dark' })}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
            title={settings.themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {settings.themeMode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
