import React, { useState } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  Wallet, 
  BookOpen, 
  ReceiptText, 
  Smartphone, 
  Camera, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  PlusCircle, 
  Sparkles,
  DollarSign,
  PackageCheck,
  ChevronRight,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { THEMES } from '../../utils/theme';
import { localDateStr } from '../../utils/date';

interface DashboardViewProps {
  onOpenReceipt: (orderId: string) => void;
  onOpenPinModal: (role: 'admin' | 'staff') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenReceipt, onOpenPinModal }) => {
  const { 
    orders, 
    products, 
    customers, 
    expenses, 
    mobileAccounts, 
    studioJobs, 
    formatBDT, 
    t, 
    setActiveTab, 
    currentRole, 
    settings
  } = useApp();

  const theme = THEMES[settings.themeColor] || THEMES.teal;
  const [showTodayHistory, setShowTodayHistory] = useState(false);

  // Calculate Today's Stats
  const todayStr = localDateStr();
  const todayOrders = orders.filter(o => o.date.startsWith(todayStr));
  const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const todayPaid = todayOrders.reduce((sum, o) => sum + o.paidAmount, 0);

  // Total customer due
  const totalDueOutstanding = customers.reduce((sum, c) => sum + c.totalDue, 0);

  // Today's Expenses
  const todayExpensesList = expenses.filter(e => e.date.startsWith(todayStr));
  const todayExpenseTotal = todayExpensesList.reduce((sum, e) => sum + e.amount, 0);

  // Mobile Banking Float Balance Total
  const totalDigitalFloat = mobileAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  // Profit calculation (Admin Only): Gross sales profit - Expenses
  let todayGrossProfit = 0;
  todayOrders.forEach(order => {
    order.items.forEach(item => {
      const buyRate = item.product.buyPrice;
      const soldRate = item.customPrice ?? item.product.salePrice;
      const profitPerItem = (soldRate * item.quantity - item.discount) - (buyRate * item.quantity);
      todayGrossProfit += profitPerItem;
    });
  });
  const todayNetProfit = todayGrossProfit - todayExpenseTotal;

  // Low stock products
  const lowStockProducts = products.filter(p => p.stock <= p.minStockAlert);

  // Active studio jobs
  const pendingStudioJobs = studioJobs.filter(j => j.status === 'pending' || j.status === 'processing');

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      
      {/* Welcome Banner & Quick Action Shortcuts */}
      <div className={`p-4 sm:p-6 rounded-3xl ${theme.bgLight} border ${theme.border} border-opacity-30 relative overflow-hidden`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {settings.business.name} {t('হিসাব ড্যাশবোর্ড', 'Business Dashboard')}
              </h2>
              {currentRole === 'admin' ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {t('এডমিন পূর্ণ নিয়ন্ত্রণ', 'Admin Full Access')}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {t('স্টাফ মোড', 'Staff Mode')}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
              {t('আজকের হিসাব-নিকাশ, বিক্রি, বাকি খাতা ও ক্যাশ ব্যালেন্স একনজরে দেখুন', 'Real-time overview of sales, due bills, cash balances & expenses')}
            </p>
          </div>

          {/* Quick Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md ${theme.primary} ${theme.primaryHover} active:scale-95 transition-all`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{t('নতুন বিক্রি (POS)', 'New Sale (POS)')}</span>
            </button>
            <button
              onClick={() => setActiveTab('khata')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>{t('বাকি আদায়/যোগ', 'Due Khata')}</span>
            </button>
            <button
              onClick={() => setActiveTab('mobile_banking')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
            >
              <Smartphone className="w-4 h-4 text-rose-600" />
              <span>{t('বিকাশ/নগদ', 'bKash / Nagad')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Today's Sales */}
        <div
          onClick={() => setShowTodayHistory(true)}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter') setShowTodayHistory(true); }}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-teal-400 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t('আজকের বিক্রি', "Today's Sales")}</span>
            <div className={`p-2 rounded-xl ${theme.bgLight} ${theme.text}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatBDT(todaySales)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>{todayOrders.length} {t('টি অর্ডার', 'invoices')}</span>
              <span className="text-emerald-600 font-bold">নগদ: {formatBDT(todayPaid)}</span>
            </div>
          </div>
        </div>

        {/* Customer Due Khata Balance */}
        <div 
          onClick={() => setActiveTab('khata')}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-rose-400 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t('মোট গ্রাহক বাকি', 'Customer Due Khata')}</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              {formatBDT(totalDueOutstanding)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>{customers.filter(c => c.totalDue > 0).length} {t('জনের বাকি আছে', 'due customers')}</span>
              <span className="text-xs text-rose-500 font-semibold">{t('বাকি খাতা →', 'View →')}</span>
            </div>
          </div>
        </div>

        {/* Daily Expenses */}
        <div 
          onClick={() => setActiveTab('expense')}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t('আজকের খরচ', "Today's Expenses")}</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <ReceiptText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400">
              {formatBDT(todayExpenseTotal)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>{todayExpensesList.length} {t('টি আইটেম', 'entries')}</span>
              <span className="text-xs text-amber-600 font-semibold">{t('খরচ যোগ →', 'Add →')}</span>
            </div>
          </div>
        </div>

        {/* Profit (Admin) or Mobile Banking Float (Staff) */}
        {currentRole === 'admin' ? (
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>{t('আজকের নিট লাভ', "Today's Net Profit")}</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className={`text-xl sm:text-2xl font-black ${todayNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {formatBDT(todayNetProfit)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {t('গ্রস মার্জিন থেকে খরচ বাদ', 'Gross margin minus expenses')}
              </div>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => onOpenPinModal('admin')}
            className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>{t('নিট লাভ হিসাব', 'Net Profit')}</span>
              <EyeOff className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2">
              <div className="text-lg font-bold text-slate-400">
                •••••••••
              </div>
              <div className="text-[11px] text-teal-600 font-semibold mt-0.5">
                {t('এডমিন পিন দিয়ে দেখুন', 'Unlock with Admin PIN')}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Middle Row: Mobile Banking Floats & Studio Jobs Quick Glance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Mobile Banking Float Balances */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-rose-500" />
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                {t('মোবাইল ব্যাংকিং ব্যালেন্স (ডিজিটাল ফ্লোট)', 'Mobile Banking Digital Float')}
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('mobile_banking')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>{t('লেনদেন খাতা', 'Full Ledger')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {mobileAccounts.map(acc => {
              const colors: Record<string, { bg: string; text: string; label: string }> = {
                bkash: { bg: 'bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-900', text: 'text-pink-600 dark:text-pink-400', label: 'বিকাশ (bKash)' },
                nagad: { bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900', text: 'text-orange-600 dark:text-orange-400', label: 'নগদ (Nagad)' },
                rocket: { bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900', text: 'text-purple-600 dark:text-purple-400', label: 'রকেট (Rocket)' },
                upay: { bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900', text: 'text-blue-600 dark:text-blue-400', label: 'উপায় (Upay)' },
              };
              const style = colors[acc.provider] || colors.bkash;

              return (
                <div 
                  key={acc.provider}
                  className={`p-3.5 rounded-2xl border ${style.bg} flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${style.text}`}>
                      {style.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      {acc.accountType}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {formatBDT(acc.currentBalance)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {acc.accountNumber}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Photo Studio Status Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-500" />
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  {t('ছবি ও স্টুডিও অর্ডার', 'Studio Job Orders')}
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('photo_studio')}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <span>{t('সব দেখুন', 'View All')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {pendingStudioJobs.slice(0, 3).map(job => (
                <div 
                  key={job.id} 
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {job.tokenNo}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        {job.customerName}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {job.serviceType} ({job.copies} কপি)
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    job.status === 'ready' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {job.status === 'ready' ? t('রেডি', 'Ready') : t('প্রসেসিং', 'In Progress')}
                  </span>
                </div>
              ))}

              {pendingStudioJobs.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">
                  {t('কোনো জরুরি ছবি কাজ বাকি নেই', 'No pending studio jobs right now')}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('photo_studio')}
            className={`w-full mt-3 py-2 rounded-xl text-xs font-bold text-white ${theme.primary} ${theme.primaryHover} transition-colors`}
          >
            + {t('নতুন ছবি অর্ডার টোকেন তৈরি করুন', 'Create New Studio Token')}
          </button>
        </div>

      </div>

      {/* Low Stock Alerts & Recent Transactions Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Low Stock Alert Box */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                {t('কম স্টক সতর্কতা', 'Low Stock Warning')}
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-bold text-teal-600"
            >
              {t('ইনভেন্টরি', 'Manage')}
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              ✓ {t('সব পণ্যের পর্যাপ্ত স্টক আছে', 'All inventory stock levels healthy')}
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockProducts.slice(0, 4).map(prod => (
                <div 
                  key={prod.id}
                  className="p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 flex items-center justify-between"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {prod.nameBn || prod.name}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {prod.category} • {prod.quality}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-extrabold text-xs">
                      {prod.stock} {prod.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices / Sales */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              {t('সাম্প্রতিক বিক্রি রশিদ (Recent Invoices)', 'Recent Invoices')}
            </h3>
            <button
              onClick={() => setActiveTab('pos')}
              className="text-xs font-bold text-teal-600"
            >
              {t('নতুন বিক্রি', 'Go to POS')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                  <th className="pb-2 font-semibold">{t('ইনভয়েস', 'Invoice')}</th>
                  <th className="pb-2 font-semibold">{t('ক্রেতা', 'Customer')}</th>
                  <th className="pb-2 font-semibold">{t('মোট বিল', 'Total')}</th>
                  <th className="pb-2 font-semibold">{t('পেমেন্ট', 'Payment')}</th>
                  <th className="pb-2 font-semibold text-right">{t('রশিদ', 'Receipt')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {orders.slice(0, 5).map(ord => (
                  <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {ord.invoiceNo}
                      <span className="block text-[10px] text-slate-400 font-sans">{ord.date.split(' ')[1]}</span>
                    </td>
                    <td className="py-2.5">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block truncate max-w-[120px]">
                        {ord.customerName}
                      </span>
                      {ord.customerPhone && (
                        <span className="text-[10px] text-slate-400">{ord.customerPhone}</span>
                      )}
                    </td>
                    <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">
                      {formatBDT(ord.total)}
                      {ord.dueAmount > 0 && (
                        <span className="block text-[10px] text-rose-500 font-bold">
                          বাকি: {formatBDT(ord.dueAmount)}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {ord.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onOpenReceipt(ord.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-600 font-semibold"
                        title="Print / View Receipt"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>


      {/* Today's sales history modal */}
      {showTodayHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70" onClick={() => setShowTodayHistory(false)}>
          <div
            className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{t('আজকের বিক্রির ইতিহাস', "Today's Sales History")}</h3>
                <p className="text-[11px] text-slate-500">
                  {todayOrders.length} {t('টি মেমো', 'invoices')} • {t('মোট', 'Total')} {formatBDT(todaySales)} • {t('নগদ আদায়', 'Collected')} {formatBDT(todayPaid)}
                </p>
              </div>
              <button onClick={() => setShowTodayHistory(false)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {todayOrders.length === 0 ? (
                <p className="p-10 text-center text-sm text-slate-400">{t('আজ এখনো কোনো বিক্রি হয়নি', 'No sales yet today')}</p>
              ) : (
                [...todayOrders].reverse().map(o => (
                  <button
                    key={o.id}
                    onClick={() => { setShowTodayHistory(false); onOpenReceipt(o.id); }}
                    className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{o.invoiceNo} <span className="font-normal text-slate-400">• {o.date.split(' ')[1] || ''}</span></div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {o.customerName || t('নগদ ক্রেতা', 'Walk-in')} • {o.items.length} {t('পণ্য', 'items')} • {o.paymentMethod.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-slate-900 dark:text-white">{formatBDT(o.total)}</div>
                      {o.dueAmount > 0 && <div className="text-[10px] font-bold text-rose-600">{t('বাকি', 'Due')} {formatBDT(o.dueAmount)}</div>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
