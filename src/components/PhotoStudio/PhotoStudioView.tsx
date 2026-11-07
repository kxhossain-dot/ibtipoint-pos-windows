import React, { useState } from 'react';
import { 
  Camera, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Share2, 
  Printer, 
  Search, 
  User, 
  DollarSign, 
  Filter,
  Check,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PhotoStudioJob, StudioJobStatus } from '../../types';
import { THEMES } from '../../utils/theme';
import { localDateStr } from '../../utils/date';

export const PhotoStudioView: React.FC = () => {
  const { 
    studioJobs, 
    addStudioJob, 
    updateStudioJobStatus, 
    recordStudioJobPayment, 
    formatBDT, 
    t, 
    settings 
  } = useApp();

  const theme = THEMES[settings.themeColor] || THEMES.teal;

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal: New Job
  const [isAddModal, setIsAddModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceType, setServiceType] = useState<PhotoStudioJob['serviceType']>('Passport Photo');
  const [copies, setCopies] = useState('4');
  const [totalAmount, setTotalAmount] = useState('50');
  const [advancePaid, setAdvancePaid] = useState('50');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return `${localDateStr(d)} ${d.toTimeString().substring(0, 5)}`;
  });
  const [jobNote, setJobNote] = useState('');

  // Handle Preset Services Quick Pick
  const handleServicePreset = (service: PhotoStudioJob['serviceType'], defaultRate: number, defaultCopies: number) => {
    setServiceType(service);
    setTotalAmount(String(defaultRate));
    setAdvancePaid(String(defaultRate));
    setCopies(String(defaultCopies));
  };

  // Submit new job
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    const total = parseFloat(totalAmount) || 0;
    const advance = parseFloat(advancePaid) || 0;
    const due = Math.max(0, total - advance);

    addStudioJob({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      serviceType,
      copies: parseInt(copies, 10) || 1,
      totalAmount: total,
      advancePaid: advance,
      dueAmount: due,
      status: 'pending',
      deliveryDate,
      note: jobNote.trim() || undefined,
    });

    // Reset
    setCustomerName('');
    setCustomerPhone('');
    setJobNote('');
    setIsAddModal(false);
  };

  // WhatsApp Ready Notification
  const handleSendReadyWhatsApp = (job: PhotoStudioJob) => {
    if (!job.customerPhone) {
      alert(t('গ্রাহকের ফোন নম্বর নেই!', 'No customer phone!'));
      return;
    }
    const cleanPhone = job.customerPhone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('880') ? cleanPhone : cleanPhone.startsWith('0') ? `88${cleanPhone}` : `880${cleanPhone}`;

    const text = `সম্মানিত ${job.customerName},\n` +
      `আপনার ${job.serviceType} (টোকেন নং #${job.tokenNo}) প্রিন্ট ও রেডি হয়েছে।\n` +
      `বাকি টাকা: ${formatBDT(job.dueAmount)}।\n` +
      `অনুগ্রহপূর্বক ${settings.business.name} থেকে আপনার ছবি সংগ্রহ করুন।\n` +
      `যোগাযোগ: ${settings.business.phone}`;

    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredJobs = studioJobs.filter(j => {
    const matchStatus = statusFilter === 'all' || j.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchQ = !q || j.customerName.toLowerCase().includes(q) || j.tokenNo.toLowerCase().includes(q) || j.customerPhone.includes(q);
    return matchStatus && matchQ;
  });

  return (
    <div className="space-y-4 pb-16 md:pb-6">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-500" />
              <span>{t('ফটো স্টুডিও ও ছবি প্রিন্ট ট্র্যাকার', 'Photo Studio & Print Tracker')}</span>
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
              {studioJobs.filter(j => j.status !== 'delivered').length} {t('টি কাজ চলমান', 'Active Jobs')}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('পাসপোর্ট ছবি, ভিসা ছবি, ফ্রেম ও লেমিনেশন অর্ডার টোকেন এবং ডেলিভারি ট্র্যাকিং', 'Passport photos, frames, lamination orders, and token tracking')}
          </p>
        </div>

        <button
          onClick={() => setIsAddModal(true)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md ${theme.primary} ${theme.primaryHover} active:scale-95 transition-all self-start md:self-auto`}
        >
          <Plus className="w-4 h-4" />
          <span>{t('নতুন ছবি অর্ডার টোকেন', 'New Studio Order')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('টোকেন নং, গ্রাহকের নাম বা মোবাইল দিয়ে খুঁজুন...', 'Search token, name or phone...')}
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'সব কাজ' },
            { id: 'pending', label: 'পেন্ডিং' },
            { id: 'processing', label: 'এডিটিং' },
            { id: 'ready', label: 'রেডি' },
            { id: 'delivered', label: 'ডেলিভার্ড' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === s.id 
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' 
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Studio Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredJobs.map(job => {
          const isDelivered = job.status === 'delivered';
          const isReady = job.status === 'ready';

          return (
            <div
              key={job.id}
              className={`p-4 rounded-3xl border transition-all flex flex-col justify-between ${
                isDelivered
                  ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-75'
                  : isReady
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div>
                {/* Header: Token & Status */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                    {job.tokenNo}
                  </span>

                  <select
                    value={job.status}
                    onChange={e => updateStudioJobStatus(job.id, e.target.value as StudioJobStatus)}
                    className="py-1 px-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="pending">⏳ পেন্ডিং (Pending)</option>
                    <option value="processing">🖌️ এডিটিং (Editing)</option>
                    <option value="ready">✅ রেডি (Ready)</option>
                    <option value="delivered">📦 ডেলিভার্ড (Delivered)</option>
                  </select>
                </div>

                {/* Customer & Service Info */}
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  {job.customerName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  📞 {job.customerPhone || 'No phone'}
                </p>

                <div className="my-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    📷 {job.serviceType} ({job.copies} কপি)
                  </div>
                  {job.note && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      📝 {job.note}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 mt-1">
                    🕒 ডেলিভারি সময়: {job.deliveryDate}
                  </div>
                </div>
              </div>

              {/* Financials & Actions */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{t('মোট বিল:', 'Total:')} ৳{job.totalAmount}</span>
                  <span className="text-emerald-600 font-bold">{t('অগ্রিম:', 'Adv:')} ৳{job.advancePaid}</span>
                  {job.dueAmount > 0 ? (
                    <span className="text-rose-600 font-extrabold bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded">
                      {t('বাকি:', 'Due:')} {formatBDT(job.dueAmount)}
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-bold">{t('পরিশোধিত', 'Paid')}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  {/* WhatsApp ready alert */}
                  {job.customerPhone && (
                    <button
                      onClick={() => handleSendReadyWhatsApp(job)}
                      className="p-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs"
                      title="Send WhatsApp Ready SMS"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Complete & deliver with due payment collect */}
                  {job.status !== 'delivered' && (
                    <button
                      onClick={() => {
                        if (job.dueAmount > 0) {
                          recordStudioJobPayment(job.id, job.dueAmount);
                        }
                        updateStudioJobStatus(job.id, 'delivered');
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{job.dueAmount > 0 ? t('বাকি বুঝে ডেলিভারি', 'Collect Due & Deliver') : t('ডেলিভারি সম্পন্ন', 'Mark Delivered')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredJobs.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            {t('কোনো ছবি অর্ডার পাওয়া যায়নি', 'No studio orders found')}
          </div>
        )}
      </div>

      {/* Modal: Add Studio Job */}
      {isAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-500" />
              <span>{t('নতুন ফটো স্টুডিও অর্ডার টোকেন', 'Create Studio Token')}</span>
            </h3>

            {/* Quick Service Presets */}
            <div className="mb-3">
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {t('দ্রুত সেবা নির্বাচন (Quick Presets)', 'Quick Presets')}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { name: 'Passport Photo', label: 'পাসপোর্ট ছবি (৪ কপি)', rate: 50, copies: 4 },
                  { name: 'Stamp Photo', label: 'স্ট্যাম্প ছবি (৮ কপি)', rate: 40, copies: 8 },
                  { name: 'Visa 2x2', label: 'ভিসা ছবি ২x২ (৪ কপি)', rate: 120, copies: 4 },
                  { name: 'Photo Frame', label: 'ফটো ফ্রেম ৮x১২ গ্লাস', rate: 260, copies: 1 },
                  { name: 'Lamination', label: 'এ৪ সাইজ লেমিনেশন', rate: 30, copies: 1 },
                ].map(p => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleServicePreset(p.name as any, p.rate, p.copies)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-left truncate"
                  >
                    {p.label} (৳{p.rate})
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('গ্রাহকের নাম *', 'Customer Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="যেমন: ফারহানা আক্তার"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('মোবাইল নম্বর (এসএমএস ও তাগাদার জন্য)', 'Phone')}
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="01799-XXXXXX"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {t('সেবার ধরন', 'Service Type')}
                  </label>
                  <select
                    value={serviceType}
                    onChange={e => setServiceType(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Passport Photo">Passport Photo</option>
                    <option value="Stamp Photo">Stamp Photo</option>
                    <option value="Visa 2x2">Visa 2x2</option>
                    <option value="Studio Portrait">Studio Portrait</option>
                    <option value="Photo Frame">Photo Frame</option>
                    <option value="Lamination">Lamination</option>
                    <option value="Document Scan">Document Scan</option>
                    <option value="Graphic Design">Graphic Design</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {t('পরিমাণ / কপি', 'Copies')}
                  </label>
                  <input
                    type="number"
                    value={copies}
                    onChange={e => setCopies(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {t('মোট বিল (৳) *', 'Total Bill (৳) *')}
                  </label>
                  <input
                    type="number"
                    required
                    value={totalAmount}
                    onChange={e => setTotalAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {t('অগ্রিম জমা (৳) *', 'Advance Paid (৳) *')}
                  </label>
                  <input
                    type="number"
                    required
                    value={advancePaid}
                    onChange={e => setAdvancePaid(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('ডেলিভারি সময়', 'Delivery Target')}
                </label>
                <input
                  type="text"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  placeholder="2026-11-04 17:00"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('কাজের বিবরণ / স্পেসিফিকেশন', 'Job Details / Background')}
                </label>
                <input
                  type="text"
                  value={jobNote}
                  onChange={e => setJobNote(e.target.value)}
                  placeholder="সাদা ব্যাকগ্রাউন্ড, পাসপোর্ট ফরম্যাট"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  {t('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold ${theme.primary}`}
                >
                  {t('টোকেন জেনারেট করুন', 'Generate Token')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
