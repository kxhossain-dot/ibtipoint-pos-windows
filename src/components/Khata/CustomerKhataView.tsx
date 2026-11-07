import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  Search, 
  UserPlus, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Share2, 
  Printer, 
  PhoneCall, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  ChevronRight, 
  Check, 
  X,
  CreditCard,
  Download,
  Upload,
  FileSpreadsheet,
  Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, KhataTransaction, PaymentMethod } from '../../types';
import { THEMES } from '../../utils/theme';
import { 
  exportCustomersToExcel, 
  parseCustomersExcel, 
  downloadCustomerExcelTemplate 
} from '../../utils/excelHelper';

export const CustomerKhataView: React.FC = () => {
  const { 
    customers, 
    khataTransactions, 
    addCustomer, 
    bulkSetCustomers,
    recordKhataPayment, 
    addKhataManualDue, 
    formatBDT, 
    t, 
    settings 
  } = useApp();

  const theme = THEMES[settings.themeColor] || THEMES.teal;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [importNotice, setImportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isAddCustModal, setIsAddCustModal] = useState(false);
  const [isPaymentModal, setIsPaymentModal] = useState(false);
  const [isAddDueModal, setIsAddDueModal] = useState(false);

  // Add Customer Form
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custCreditLimit, setCustCreditLimit] = useState('10000');

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentNote, setPaymentNote] = useState('');

  // Add Due Form
  const [dueAmount, setDueAmount] = useState('');
  const [dueNote, setDueNote] = useState('');

  // Filtered customer list
  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.address && c.address.toLowerCase().includes(q));
  });

  const activeCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  // Transactions for active customer
  const customerTxs = khataTransactions.filter(tx => tx.customerId === activeCustomer?.id);

  // Total outstanding due across all customers
  const totalShopDue = customers.reduce((sum, c) => sum + c.totalDue, 0);

  // Add customer handler
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const newCust = addCustomer({
      name: custName.trim(),
      phone: custPhone.trim(),
      address: custAddress.trim(),
      creditLimit: parseFloat(custCreditLimit) || 5000,
    });

    setSelectedCustomerId(newCust.id);
    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setIsAddCustModal(false);
  };

  // Payment record handler
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!activeCustomer || isNaN(amount) || amount <= 0) return;

    recordKhataPayment(activeCustomer.id, amount, paymentMethod, paymentNote || undefined);
    setPaymentAmount('');
    setPaymentNote('');
    setIsPaymentModal(false);
  };

  // Add Due record handler
  const handleAddDue = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(dueAmount);
    if (!activeCustomer || isNaN(amount) || amount <= 0) return;

    addKhataManualDue(activeCustomer.id, amount, dueNote || 'ম্যানুয়াল বাকি যোগ');
    setDueAmount('');
    setDueNote('');
    setIsAddDueModal(false);
  };

  // WhatsApp Reminder message
  const handleSendWhatsAppReminder = (c: Customer) => {
    if (!c.phone) {
      alert(t('গ্রাহকের ফোন নম্বর নেই!', 'No phone number for customer!'));
      return;
    }
    const cleanPhone = c.phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('880') ? cleanPhone : cleanPhone.startsWith('0') ? `88${cleanPhone}` : `880${cleanPhone}`;

    const text = `সম্মানিত গ্রাহক ${c.name},\n` +
      `আপনার ${settings.business.name}-এ পূর্বের মোট বাকি বিল: ${formatBDT(c.totalDue)} টাকা।\n` +
      `দয়া করে সুবিধাজনক সময়ে এসে বাকি বিল পরিশোধ করার বিনীত অনুরোধ জানাচ্ছি।\n\n` +
      `দোকান: ${settings.business.name}\n` +
      `যোগাযোগ: ${settings.business.phone}\n` +
      `ঠিকানা: ${settings.business.address}`;

    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Excel Upload Handler for Customer Khata
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseCustomersExcel(file, customers);
      bulkSetCustomers(result.customers);
      if (result.customers.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(result.customers[0].id);
      }
      setImportNotice({
        type: 'success',
        message: t(
          `সফলভাবে ${result.added} জন নতুন গ্রাহক যোগ ও ${result.updated} জনের তথ্য/বাকি আপডেট হয়েছে!`,
          `Successfully imported! ${result.added} new customers added, ${result.updated} updated.`
        ),
      });
      setTimeout(() => setImportNotice(null), 5000);
    } catch (err: any) {
      setImportNotice({
        type: 'error',
        message: t('কাস্টমার এক্সেল ফাইল পড়তে সমস্যা হয়েছে: ' + err.message, 'Failed to import customer Excel: ' + err.message),
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4 pb-16 md:pb-6">
      
      {/* Top Banner & KPI */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {t('গ্রাহক বাকি খাতা (Customer Due Ledger)', 'Customer Due Bill Khata')}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold">
              {t('মোট বাকি:', 'Total Due:')} {formatBDT(totalShopDue)}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('গ্রাহকদের বাকি বিক্রয় হিসাব, এক্সেলে ডাটা ইম্পোর্ট/সিঙ্ক ও হোয়াটসঅ্যাপ তাগাদা পাঠান', 'Manage customer credit, import/sync via Excel, and send WhatsApp payment reminders')}
          </p>
        </div>

        {/* Action Buttons: Add, Excel Export, Excel Import, Template */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddCustModal(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md ${theme.primary} ${theme.primaryHover} active:scale-95 transition-all`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('নতুন খাতা খুলুন', 'New Customer')}</span>
          </button>

          {/* Export to Excel */}
          <button
            onClick={() => exportCustomersToExcel(customers)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold transition-colors"
            title="Export all customers to Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('এক্সেল এক্সপোর্ট', 'Export Excel')}</span>
          </button>

          {/* Import from Excel */}
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 text-xs font-bold transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>{t('এক্সেল ইম্পোর্ট', 'Import Excel')}</span>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Download Template */}
          <button
            onClick={downloadCustomerExcelTemplate}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
            title={t('কাস্টমার নমুনা এক্সেল ফাইল ডাউনলোড করুন', 'Download Sample Customer Excel Template')}
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Import Notification Banner */}
      {importNotice && (
        <div className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold ${
          importNotice.type === 'success' 
            ? 'bg-emerald-100 border border-emerald-300 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200' 
            : 'bg-rose-100 border border-rose-300 text-rose-900 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200'
        }`}>
          <span>{importNotice.message}</span>
          <button onClick={() => setImportNotice(null)} className="p-1">✕</button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Customer Directory (4 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col h-[600px]">
          
          {/* Customer Search Bar */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('নাম বা মোবাইল নম্বর দিয়ে খুঁজুন...', 'Search by customer name or phone...')}
                className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Customer List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredCustomers.map(cust => {
              const isSelected = activeCustomer?.id === cust.id;
              const hasDue = cust.totalDue > 0;

              return (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomerId(cust.id)}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected 
                      ? `${theme.bgLight} border-l-4 ${theme.border}` 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex-1 pr-2 truncate">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {cust.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      📞 {cust.phone || t('নম্বর নেই', 'No phone')}
                    </p>
                    {cust.address && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        📍 {cust.address}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`font-black text-xs sm:text-sm ${hasDue ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                      {formatBDT(cust.totalDue)}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {hasDue ? t('বাকি আছে', 'Due') : t('পরিশোধিত', 'Clear')}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredCustomers.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                {t('কোনো গ্রাহক পাওয়া যায়নি', 'No customers found')}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Customer Ledger & Action Buttons (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col h-[600px]">
          
          {activeCustomer ? (
            <>
              {/* Customer Header Card */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {activeCustomer.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>📞 {activeCustomer.phone}</span>
                      {activeCustomer.address && <span>📍 {activeCustomer.address}</span>}
                    </div>
                  </div>

                  {/* Due Amount Badge & WhatsApp trigger */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {t('বর্তমান মোট বাকি', 'Current Due')}
                      </span>
                      <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400">
                        {formatBDT(activeCustomer.totalDue)}
                      </span>
                    </div>

                    {activeCustomer.phone && activeCustomer.totalDue > 0 && (
                      <button
                        onClick={() => handleSendWhatsAppReminder(activeCustomer)}
                        className="p-2.5 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold transition-colors"
                        title={t('হোয়াটসঅ্যাপে বাকি বিল তাগাদা মেসেজ পাঠান', 'Send WhatsApp Reminder')}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Ledger Quick Action Buttons */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => setIsPaymentModal(true)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    <span>{t('টাকা জমা গ্রহণ (Payment)', 'Receive Payment')}</span>
                  </button>

                  <button
                    onClick={() => setIsAddDueModal(true)}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    <span>{t('নতুন বাকি যোগ (Add Due)', 'Add Due Bill')}</span>
                  </button>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t('লেনদেন খাতা বিবরণী (Statement)', 'Transaction History')}
                </div>

                {customerTxs.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs">
                    {t('এই গ্রাহকের কোনো পূর্বের লেনদেন নেই', 'No previous transactions recorded')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerTxs.map(tx => {
                      const isPayment = tx.type === 'payment_received';

                      return (
                        <div
                          key={tx.id}
                          className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={`p-2 rounded-xl mt-0.5 ${
                              isPayment ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {isPayment ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                {isPayment ? t('টাকা জমা নেওয়া হয়েছে', 'Payment Received') : t('বাকি যুক্ত করা হয়েছে', 'Due Added')}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {tx.note || 'No notes'}
                              </p>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                🕒 {tx.date} • {t('এন্ট্রি বাই:', 'By:')} {tx.recordedBy}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={`font-black text-xs sm:text-sm ${
                              isPayment ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {isPayment ? '-' : '+'} {formatBDT(tx.amount)}
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              {t('অবশিষ্ট বাকি:', 'Balance:')} {formatBDT(tx.balanceAfter)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <Users className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                {t('কোনো গ্রাহক খাতা খোলা হয়নি', 'No Customers in Khata Yet')}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4">
                {t('নতুন গ্রাহক যোগ করুন অথবা এক্সেলে থাকা কাস্টমার তালিকা সরাসরি ইম্পোর্ট করুন', 'Add a customer or import your existing customer list from Excel')}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setIsAddCustModal(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white font-bold text-xs shadow-sm ${theme.primary}`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t('নতুন খাতা খুলুন', 'New Customer')}</span>
                </button>
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 text-xs font-bold transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t('এক্সেল ইম্পোর্ট', 'Import Excel')}</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Modal: Add New Customer */}
      {isAddCustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm animate-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">
              {t('নতুন গ্রাহক খাতা খুলুন', 'Open New Customer Khata')}
            </h3>
            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('গ্রাহকের নাম *', 'Customer Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={e => setCustName(e.target.value)}
                  placeholder="যেমন: কামরুল হাসান"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('মোবাইল নম্বর (তাগাদার জন্য)', 'Phone (For WhatsApp reminder)')}
                </label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={e => setCustPhone(e.target.value)}
                  placeholder="01712-XXXXXX"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('ঠিকানা / দোকানের বিবরণ', 'Address / Details')}
                </label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={e => setCustAddress(e.target.value)}
                  placeholder="হাই স্কুল মোড়"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('বাকি ক্রেডিট সীমা (৳)', 'Credit Limit (৳)')}
                </label>
                <input
                  type="number"
                  value={custCreditLimit}
                  onChange={e => setCustCreditLimit(e.target.value)}
                  placeholder="10000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  {t('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold ${theme.primary}`}
                >
                  {t('খাতা তৈরি করুন', 'Create Khata')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Receive Payment */}
      {isPaymentModal && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm animate-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1">
              {t('টাকা জমা গ্রহণ করুন', 'Receive Due Payment')}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              {activeCustomer.name} • {t('বর্তমান বাকি:', 'Current Due:')} {formatBDT(activeCustomer.totalDue)}
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('জমা পরিমাণ (৳) *', 'Received Amount (৳) *')}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={activeCustomer.totalDue || 999999}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="500"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('পেমেন্ট মাধ্যম', 'Payment Method')}
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium"
                >
                  <option value="cash">নগদ ক্যাশ (Cash Drawer)</option>
                  <option value="bkash">বিকাশ (bKash)</option>
                  <option value="nagad">নগদ (Nagad)</option>
                  <option value="rocket">রকেট (Rocket)</option>
                  <option value="upay">উপায় (Upay)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('নোট বা বিবরণ (ঐচ্ছিক)', 'Note / Reference (Optional)')}
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                  placeholder="ক্যাশ কাউন্টারে জমা দিল"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  {t('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  {t('জমা সংরক্ষণ করুন', 'Confirm Payment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Due */}
      {isAddDueModal && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm animate-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1">
              {t('নতুন বাকি বিল যোগ করুন', 'Add Due to Customer')}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              {activeCustomer.name}
            </p>

            <form onSubmit={handleAddDue} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('বাকি পরিমাণ (৳) *', 'Due Amount (৳) *')}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={dueAmount}
                  onChange={e => setDueAmount(e.target.value)}
                  placeholder="400"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-rose-600 dark:text-rose-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('বিবরণ / পণ্যের নাম *', 'Reason / Product details *')}
                </label>
                <input
                  type="text"
                  required
                  value={dueNote}
                  onChange={e => setDueNote(e.target.value)}
                  placeholder="মাল্টিপ্লাগ ও চার্জার ক্যাবল নিল"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddDueModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  {t('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  {t('বাকি যোগ করুন', 'Add Due')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
