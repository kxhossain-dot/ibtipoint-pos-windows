import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Printer, 
  Calendar, 
  FileSpreadsheet, 
  PieChart, 
  ShoppingBag, 
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { THEMES } from '../../utils/theme';
import { localDateStr } from '../../utils/date';

export const ReportsView: React.FC = () => {
  const { 
    orders, 
    expenses, 
    products, 
    customers, 
    currentRole, 
    formatBDT, 
    t, 
    settings 
  } = useApp();

  const theme = THEMES[settings.themeColor] || THEMES.teal;

  // Filter timeframe
  const [timeframe, setTimeframe] = useState<'today' | 'this_month' | 'all'>('today');

  if (currentRole !== 'admin') {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {t('শুধুমাত্র এডমিন এক্সেস', 'Admin Access Only')}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {t('লাভ-ক্ষতি ও ব্যবসায়িক রিপোর্ট দেখতে উপরে এডমিন মোডে আনলক করুন', 'Please switch to Admin Mode using your 4-digit PIN to view financial reports.')}
        </p>
      </div>
    );
  }

  // Filter orders and expenses based on timeframe
  const todayStr = localDateStr();
  const thisMonthStr = todayStr.substring(0, 7);

  const filteredOrders = orders.filter(o => {
    if (timeframe === 'today') return o.date.startsWith(todayStr);
    if (timeframe === 'this_month') return o.date.startsWith(thisMonthStr);
    return true;
  });

  const filteredExpenses = expenses.filter(e => {
    if (timeframe === 'today') return e.date.startsWith(todayStr);
    if (timeframe === 'this_month') return e.date.startsWith(thisMonthStr);
    return true;
  });

  // Calculate Metrics
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalPaid = filteredOrders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalDueGenerated = filteredOrders.reduce((sum, o) => sum + o.dueAmount, 0);
  const totalDiscount = filteredOrders.reduce((sum, o) => sum + o.discount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Gross Profit calculation from item buy prices
  let grossProfit = 0;
  let totalCostOfGoods = 0;
  filteredOrders.forEach(o => {
    o.items.forEach(item => {
      const buyRate = item.product.buyPrice;
      const saleRate = item.customPrice ?? item.product.salePrice;
      const itemCost = buyRate * item.quantity;
      const itemRev = saleRate * item.quantity - item.discount;
      totalCostOfGoods += itemCost;
      grossProfit += (itemRev - itemCost);
    });
  });

  const netProfit = grossProfit - totalExpenses;

  // Breakdown by payment method
  const cashSales = filteredOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.paidAmount, 0);
  const digitalSales = filteredOrders.filter(o => ['bkash', 'nagad', 'rocket', 'upay'].includes(o.paymentMethod)).reduce((sum, o) => sum + o.paidAmount, 0);

  // Category sales breakdown
  const categorySales: Record<string, number> = {};
  filteredOrders.forEach(o => {
    o.items.forEach(item => {
      const cat = item.product.category;
      categorySales[cat] = (categorySales[cat] || 0) + item.subtotal;
    });
  });

  return (
    <div className="space-y-4 pb-16 md:pb-6">
      
      {/* Top Banner & Timeframe Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <span>{t('ব্যবসায়িক হিসাব ও লাভ-ক্ষতি বিবরণী (P&L Report)', 'Profit & Loss Financial Report')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('আয়, ব্যয়, ক্রয় মূল্য, বিক্রয় মার্জিন এবং খাঁটি নিট লাভের সম্পূর্ণ বিবরণী', 'Comprehensive revenue, COGS, expenses, and net profit ledger')}
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl self-start md:self-auto">
          {[
            { id: 'today', label: 'আজকের হিসাব' },
            { id: 'this_month', label: 'চলতি মাস' },
            { id: 'all', label: 'সর্বমোট' },
          ].map(tFrame => (
            <button
              key={tFrame.id}
              onClick={() => setTimeframe(tFrame.id as any)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                timeframe === tFrame.id 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tFrame.label}
            </button>
          ))}
        </div>
      </div>

      {/* P&L Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Sales */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">{t('মোট বিক্রি আয়', 'Total Revenue')}</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatBDT(totalRevenue)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {filteredOrders.length} {t('টি ইনভয়েস', 'invoices')}
          </span>
        </div>

        {/* Gross Profit */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">{t('গ্রস মার্জিন লাভ', 'Gross Profit')}</span>
          <div className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
            {formatBDT(grossProfit)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {t('ক্রয় মূল্য বাদে লাভ', 'Revenue minus Buy Price')}
          </span>
        </div>

        {/* Total Expenses */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">{t('মোট দোকান খরচ', 'Total Expenses')}</span>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatBDT(totalExpenses)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {filteredExpenses.length} {t('টি খরচ এন্ট্রি', 'expense entries')}
          </span>
        </div>

        {/* Net Profit */}
        <div className={`p-4 rounded-3xl border shadow-xs ${
          netProfit >= 0 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' 
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
        }`}>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {t('প্রকৃত নিট লাভ (Net Profit)', 'Real Net Profit')}
          </span>
          <div className={`text-xl sm:text-2xl font-black mt-1 ${netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600'}`}>
            {formatBDT(netProfit)}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            {t('গ্রস লাভ থেকে সব খরচ বাদ', 'Gross margin minus all expenses')}
          </span>
        </div>

      </div>

      {/* Two Column Section: Category Distribution & Cash Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Category-wise Sales Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-500" />
            <span>{t('বিভাগ অনুযায়ী বিক্রি (Category Breakdown)', 'Sales by Category')}</span>
          </h3>

          <div className="space-y-3">
            {Object.keys(categorySales).map(cat => {
              const amount = categorySales[cat];
              const percent = totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0;

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="capitalize">{cat.replace('_', ' ')}</span>
                    <span>{formatBDT(amount)} ({percent}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${theme.primary} rounded-full`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {Object.keys(categorySales).length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                {t('এই সময়সীমার কোনো বিক্রয় ডেটা নেই', 'No sales data for this period')}
              </div>
            )}
          </div>
        </div>

        {/* Payment Channels Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>{t('পেমেন্ট ও ক্যাশ প্রবাহ (Payment Flow)', 'Payment Channel Breakdown')}</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">
                  {t('নগদ ক্যাশ আদায় (Cash)', 'Cash Drawer')}
                </span>
                <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-1">
                  {formatBDT(cashSales)}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800">
                <span className="text-[11px] font-bold text-pink-800 dark:text-pink-300 block">
                  {t('বিকাশ / নগদ / ডিজিটাল', 'Digital M-Banking')}
                </span>
                <div className="text-lg font-black text-pink-700 dark:text-pink-400 mt-1">
                  {formatBDT(digitalSales)}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block">
                  {t('নতুন বাকি বিল তৈরি (Due)', 'Due Created')}
                </span>
                <div className="text-lg font-black text-rose-700 dark:text-rose-400 mt-1">
                  {formatBDT(totalDueGenerated)}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">
                  {t('মোট দেওয়া ছাড় (Discount)', 'Discounts Given')}
                </span>
                <div className="text-lg font-black text-amber-700 dark:text-amber-400 mt-1">
                  {formatBDT(totalDiscount)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 text-center">
            💡 {t('প্রতিদিন দোকান বন্ধের সময় এই রিপোর্ট দেখে ক্যাশ বাক্স ও খাতা মিলিয়ে নিন।', 'Reconcile your physical cash drawer and digital float with this ledger at closing.')}
          </div>
        </div>

      </div>

    </div>
  );
};
