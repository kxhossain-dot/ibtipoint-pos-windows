import React, { useState } from 'react';
import { 
  Smartphone, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  History, 
  CheckCircle, 
  RefreshCw, 
  Coins, 
  Filter, 
  Search,
  Wallet,
  PhoneCall,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MobileBankingProvider, MobileBankingTxType } from '../../types';
import { THEMES } from '../../utils/theme';

export const MobileBankingView: React.FC = () => {
  const { 
    mobileAccounts, 
    mobileTransactions, 
    recordMobileTransaction, 
    updateMobileAccountBalance, 
    formatBDT, 
    t, 
    settings 
  } = useApp();

  const theme = THEMES[settings.themeColor] || THEMES.teal;

  // New Transaction Form
  const [provider, setProvider] = useState<MobileBankingProvider>('bkash');
  const [txType, setTxType] = useState<MobileBankingTxType>('cash_in');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [trxId, setTrxId] = useState('');
  const [note, setNote] = useState('');

  // Balance adjustment modal
  const [adjustModal, setAdjustModal] = useState<MobileBankingProvider | null>(null);
  const [adjustBalanceVal, setAdjustBalanceVal] = useState('');

  // Filter
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [searchPhone, setSearchPhone] = useState('');

  // Auto-calculated commission based on standard BD agent commission (~4.10 to 4.50 Tk per 1000 for Cash Out)
  const parsedAmount = parseFloat(amount) || 0;
  let estimatedCommission = 0;
  if (txType === 'cash_out') {
    estimatedCommission = Math.round((parsedAmount / 1000) * (provider === 'nagad' ? 4.5 : 4.1));
  }

  const handleSubmitTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) return;

    recordMobileTransaction({
      provider,
      type: txType,
      customerPhone: customerPhone.trim() || 'N/A',
      amount: parsedAmount,
      fee: 0,
      commission: estimatedCommission,
      trxId: trxId.trim() || undefined,
      note: note.trim() || undefined,
    });

    setAmount('');
    setCustomerPhone('');
    setTrxId('');
    setNote('');
  };

  const handleSaveBalanceAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModal) return;
    const newBal = parseFloat(adjustBalanceVal);
    if (isNaN(newBal)) return;

    updateMobileAccountBalance(adjustModal, newBal);
    setAdjustModal(null);
    setAdjustBalanceVal('');
  };

  const filteredTxs = mobileTransactions.filter(tx => {
    const matchProvider = filterProvider === 'all' || tx.provider === filterProvider;
    const matchPhone = !searchPhone || tx.customerPhone.includes(searchPhone) || (tx.trxId && tx.trxId.toLowerCase().includes(searchPhone.toLowerCase()));
    return matchProvider && matchPhone;
  });

  return (
    <div className="space-y-4 pb-16 md:pb-6">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t('মোবাইল ব্যাংকিং খাতা (bKash • Nagad • Rocket • Upay)', 'Mobile Banking Ledger')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('ক্যাশ ইন, ক্যাশ আউট, এজেন্ট সিমের ডিজিটাল ব্যালেন্স ফ্লোট ও কমিশন হিসাব', 'Cash In, Cash Out, SIM digital float reconciliations and agent commissions')}
          </p>
        </div>
      </div>

      {/* Account Balance Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {mobileAccounts.map(acc => {
          const styles: Record<string, { bg: string; border: string; text: string; label: string; logo: string }> = {
            bkash: {
              bg: 'bg-pink-50/70 dark:bg-pink-950/40',
              border: 'border-pink-200 dark:border-pink-900',
              text: 'text-pink-600 dark:text-pink-400',
              label: 'বিকাশ (bKash)',
              logo: '🌸',
            },
            nagad: {
              bg: 'bg-orange-50/70 dark:bg-orange-950/40',
              border: 'border-orange-200 dark:border-orange-900',
              text: 'text-orange-600 dark:text-orange-400',
              label: 'নগদ (Nagad)',
              logo: '🟠',
            },
            rocket: {
              bg: 'bg-purple-50/70 dark:bg-purple-950/40',
              border: 'border-purple-200 dark:border-purple-900',
              text: 'text-purple-600 dark:text-purple-400',
              label: 'রকেট (Rocket)',
              logo: '🚀',
            },
            upay: {
              bg: 'bg-blue-50/70 dark:bg-blue-950/40',
              border: 'border-blue-200 dark:border-blue-900',
              text: 'text-blue-600 dark:text-blue-400',
              label: 'উপায় (Upay)',
              logo: '🔷',
            },
          };
          const s = styles[acc.provider] || styles.bkash;

          return (
            <div 
              key={acc.provider}
              className={`p-4 rounded-3xl border ${s.border} ${s.bg} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{s.logo}</span>
                  <span className={`font-black text-xs sm:text-sm ${s.text}`}>{s.label}</span>
                </div>
                <button
                  onClick={() => {
                    setAdjustModal(acc.provider);
                    setAdjustBalanceVal(String(acc.currentBalance));
                  }}
                  className="p-1 rounded-lg bg-white/70 dark:bg-slate-800 text-slate-500 hover:text-slate-900 text-[10px] font-bold"
                  title={t('ব্যালেন্স আপডেট', 'Adjust SIM Balance')}
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              <div className="my-2.5">
                <div className="text-lg sm:text-xl font-black text-slate-950 dark:text-white">
                  {formatBDT(acc.currentBalance)}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {acc.accountNumber} ({acc.accountType})
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <span>আজকের ক্যাশ ইন: ৳{acc.todayCashIn}</span>
                <span className="text-emerald-600 font-bold">কমিশন: ৳{acc.totalCommission}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: New Entry Form & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Form: Fast Transaction Entry (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-rose-500" />
            <span>{t('নতুন লেনদেন এন্ট্রি (Cash In / Out)', 'Record Transaction')}</span>
          </h3>

          <form onSubmit={handleSubmitTx} className="space-y-3.5">
            
            {/* Provider Select */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {t('অপারেটর / প্রোভাইডার', 'Operator / Provider')}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['bkash', 'nagad', 'rocket', 'upay'] as MobileBankingProvider[]).map(p => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold capitalize border transition-all ${
                      provider === p 
                        ? `${theme.primary} text-white border-transparent` 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Select */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {t('লেনদেনের ধরন', 'Transaction Type')}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'cash_in', label: 'ক্যাশ ইন' },
                  { id: 'cash_out', label: 'ক্যাশ আউট' },
                  { id: 'send_money', label: 'সেন্ড মানি' },
                ].map(item => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setTxType(item.id as MobileBankingTxType)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                      txType === item.id 
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Phone */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {t('গ্রাহকের মোবাইল নম্বর *', 'Customer Phone *')}
              </label>
              <input
                type="text"
                required
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {t('টাকার পরিমাণ (৳) *', 'Amount (৳) *')}
              </label>
              <input
                type="number"
                required
                min="10"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="1000"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white"
              />
              {estimatedCommission > 0 && (
                <p className="text-[11px] font-bold text-emerald-600 mt-1">
                  ✨ {t('আনুমানিক কমিশন:', 'Est. Commission:')} {formatBDT(estimatedCommission)}
                </p>
              )}
            </div>

            {/* TrxID / Note */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('TrxID (ঐচ্ছিক)', 'TrxID (Optional)')}
                </label>
                <input
                  type="text"
                  value={trxId}
                  onChange={e => setTrxId(e.target.value)}
                  placeholder="TXN98492"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('মন্তব্য / নোট', 'Note')}
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="নগদ বুঝে পেয়েছি"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md ${theme.primary} ${theme.primaryHover} active:scale-95 transition-all`}
            >
              {t('লেনদেন সম্পন্ন ও ব্যালেন্স সমন্বয় করুন', 'Record & Sync Balance')}
            </button>
          </form>
        </div>

        {/* Right Ledger Table (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[520px]">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              {t('লেনদেন হিস্ট্রি ও খাতা', 'Transaction History')}
            </h3>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <select
                value={filterProvider}
                onChange={e => setFilterProvider(e.target.value)}
                className="py-1 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <option value="all">সব অপারেটর</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
                <option value="upay">Upay</option>
              </select>
            </div>
          </div>

          {/* Transactions list */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredTxs.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                {t('আজকের কোনো মোবাইল ব্যাংকিং লেনদেন এন্ট্রি নেই', 'No transactions recorded yet today')}
              </div>
            ) : (
              filteredTxs.map(tx => (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl uppercase font-bold text-[10px] ${
                      tx.type === 'cash_in' 
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {tx.type.replace('_', ' ')}
                    </div>

                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        <span className="capitalize text-teal-600 font-extrabold mr-1">[{tx.provider}]</span>
                        {tx.customerPhone}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {tx.date} {tx.trxId ? `• Trx: ${tx.trxId}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                      {formatBDT(tx.amount)}
                    </div>
                    {tx.commission > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 block">
                        +৳{tx.commission} {t('কমিশন', 'comm')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* Adjust Balance Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm animate-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2 capitalize">
              {adjustModal} {t('ডিজিটাল ব্যালেন্স সমন্বয়', 'Adjust Float Balance')}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {t('সিম বা মোবাইল অ্যাপে বর্তমান ব্যালেন্স প্রবেশ করুন', 'Enter actual current balance on SIM or agent app')}
            </p>

            <form onSubmit={handleSaveBalanceAdjustment} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('নতুন ব্যালেন্স (৳) *', 'New Balance (৳) *')}
                </label>
                <input
                  type="number"
                  required
                  value={adjustBalanceVal}
                  onChange={e => setAdjustBalanceVal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModal(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  {t('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold ${theme.primary}`}
                >
                  {t('আপডেট করুন', 'Update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
