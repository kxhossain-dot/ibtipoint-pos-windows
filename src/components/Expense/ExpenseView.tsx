import React, { useState } from 'react';
import { 
  ReceiptText, 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar, 
  TrendingDown, 
  Filter, 
  Search,
  Wallet,
  CheckCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Expense, ExpenseCategory } from '../../types';
import { THEMES } from '../../utils/theme';
import { localDateStr } from '../../utils/date';

export const ExpenseView: React.FC = () => {
  const { 
    expenses, 
    addExpense, 
    deleteExpense, 
    currentRole, 
    formatBDT, 
    t, 
    settings 
  } = useApp();

  const theme = THEMES[settings.themeColor] || THEMES.teal;

  // New Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('tea_snacks');
  const [paidFrom, setPaidFrom] = useState<Expense['paidFrom']>('cash_drawer');
  const [note, setNote] = useState('');

  // Filter
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchNote, setSearchNote] = useState('');

  const categoriesConfig: Record<ExpenseCategory, { nameBn: string; nameEn: string; icon: string }> = {
    tea_snacks: { nameBn: 'চা ও নাস্তা', nameEn: 'Tea & Snacks', icon: '☕' },
    transport: { nameBn: 'যাতায়াত ও মালামাল পরিবহন', nameEn: 'Transport & Carriage', icon: '🚚' },
    electricity: { nameBn: 'দোকান বিদ্যুৎ বিল', nameEn: 'Electricity Bill', icon: '⚡' },
    rent: { nameBn: 'দোকান ভাড়া', nameEn: 'Shop Rent', icon: '🏢' },
    staff_salary: { nameBn: 'কর্মচারী বেতন / খাবার', nameEn: 'Staff Salary & Food', icon: '👥' },
    internet_bills: { nameBn: 'ইন্টারনেট ও ডিশ বিল', nameEn: 'Internet Bill', icon: '🌐' },
    maintenance: { nameBn: 'মেরামত ও ডেকোরেশন', nameEn: 'Shop Maintenance', icon: '🔧' },
    shop_supplies: { nameBn: 'প্যাকেজিং ও শপ সামগ্রী', nameEn: 'Packaging & Supplies', icon: '🛍️' },
    other: { nameBn: 'অন্যান্য জরুরি খরচ', nameEn: 'Other Miscellaneous', icon: '📌' },
  };

  // Calculations
  const todayStr = localDateStr();
  const todayExpenses = expenses.filter(e => e.date.startsWith(todayStr));
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const currentMonthStr = todayStr.substring(0, 7);
  const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonthStr));
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const now = new Date();
    const dateStr = `${localDateStr(now)} ${now.toTimeString().substring(0, 5)}`;
    const catDetails = categoriesConfig[category];

    addExpense({
      date: dateStr,
      category,
      categoryName: `${catDetails.nameBn} (${catDetails.nameEn})`,
      amount: parsedAmount,
      paidFrom,
      note: note.trim() || catDetails.nameBn,
      recordedBy: currentRole === 'admin' ? 'Admin' : 'Staff',
    });

    setAmount('');
    setNote('');
    setIsModalOpen(false);
  };

  const filteredExpenses = expenses.filter(e => {
    const matchCat = filterCategory === 'all' || e.category === filterCategory;
    const matchSearch = !searchNote || e.note.toLowerCase().includes(searchNote.toLowerCase()) || (e.categoryName && e.categoryName.toLowerCase().includes(searchNote.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4 pb-16 md:pb-6">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-amber-500" />
            <span>{t('দৈনিক দোকান খরচ হিসাব (Daily Expense Ledger)', 'Daily Expense Ledger')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('চা, নাস্তা, পরিবহন, বিদ্যুৎ ও দোকান খরচের হিসাব যা সরাসরি নিট লাভ থেকে সমন্বয় হয়', 'Track petty cash, bills and daily business expenditures')}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md ${theme.primary} ${theme.primaryHover} active:scale-95 transition-all self-start md:self-auto`}
        >
          <Plus className="w-4 h-4" />
          <span>{t('নতুন খরচ এন্ট্রি', 'Add Expense')}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">
            {t('আজকের মোট খরচ', "Today's Total Expense")}
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatBDT(todayTotal)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {todayExpenses.length} {t('টি খরচ এন্ট্রি', 'entries today')}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">
            {t('চলতি মাসের মোট খরচ', 'This Month Expense')}
          </span>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatBDT(monthTotal)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {monthExpenses.length} {t('টি খরচ চলতি মাসে', 'entries this month')}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-xs font-semibold text-slate-500 block">
            {t('ক্যাশ ড্রয়ার থেকে খরচ', 'Cash Drawer Outflow')}
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatBDT(todayExpenses.filter(e => e.paidFrom === 'cash_drawer').reduce((sum, e) => sum + e.amount, 0))}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {t('সরাসরি ক্যাশ বাক্স থেকে পরিশোধ', 'Paid from cash drawer')}
          </span>
        </div>
      </div>

      {/* Expense Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        
        {/* Table Filters */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchNote}
              onChange={e => setSearchNote(e.target.value)}
              placeholder={t('খরচের বিবরণ দিয়ে খুঁজুন...', 'Search by expense note...')}
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="py-2 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 w-full sm:w-auto"
          >
            <option value="all">{t('সব ধরনের খরচ', 'All Categories')}</option>
            {Object.keys(categoriesConfig).map(k => (
              <option key={k} value={k}>{categoriesConfig[k as ExpenseCategory].nameBn}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                <th className="py-3 px-4">{t('তারিখ ও সময়', 'Date & Time')}</th>
                <th className="py-3 px-4">{t('খরচের খাত / ক্যাটাগরি', 'Category')}</th>
                <th className="py-3 px-4">{t('বিস্তারিত বিবরণ', 'Description / Note')}</th>
                <th className="py-3 px-4">{t('পরিশোধ মাধ্যম', 'Paid From')}</th>
                <th className="py-3 px-4 text-right">{t('টাকার পরিমাণ', 'Amount')}</th>
                {currentRole === 'admin' && (
                  <th className="py-3 px-4 w-16 text-center">{t('অ্যাকশন', 'Action')}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {exp.date}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{categoriesConfig[exp.category]?.icon || '📌'}</span>
                      <span>{categoriesConfig[exp.category]?.nameBn || exp.category}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {exp.note}
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {exp.paidFrom.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-black text-rose-600 dark:text-rose-400">
                    {formatBDT(exp.amount)}
                  </td>
                  {currentRole === 'admin' && (
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (confirm(t('এই খরচ মুছে ফেলতে চান?', 'Delete this expense entry?'))) {
                            deleteExpense(exp.id);
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredExpenses.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              {t('কোনো খরচ এন্ট্রি পাওয়া যায়নি', 'No expense entries found')}
            </div>
          )}
        </div>

      </div>

      {/* Modal: New Expense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm animate-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-amber-500" />
              <span>{t('নতুন দৈনিক খরচ এন্ট্রি', 'Add Daily Expense')}</span>
            </h3>

            <form onSubmit={handleCreateExpense} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('খরচের খাত / ক্যাটাগরি *', 'Expense Category *')}
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {Object.keys(categoriesConfig).map(k => {
                    const c = categoriesConfig[k as ExpenseCategory];
                    return (
                      <option key={k} value={k}>
                        {c.icon} {c.nameBn} ({c.nameEn})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('খরচের পরিমাণ (৳) *', 'Amount (৳) *')}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="150"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-rose-600 dark:text-rose-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('পরিশোধ কোথা থেকে করা হল?', 'Paid From?')}
                </label>
                <select
                  value={paidFrom}
                  onChange={e => setPaidFrom(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium"
                >
                  <option value="cash_drawer">দোকানের ক্যাশ ড্রয়ার (Cash Drawer)</option>
                  <option value="bkash">বিকাশ (bKash Agent/Personal)</option>
                  <option value="nagad">নগদ (Nagad)</option>
                  <option value="bank">ব্যাংক একাউন্ট (Bank)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('খরচের বিস্তারিত বিবরণ', 'Details / Note')}
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="যেমন: দুপুরের নাস্তা ও চা"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  {t('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold ${theme.primary}`}
                >
                  {t('খরচ সংরক্ষণ করুন', 'Save Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
