import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Store, 
  Key, 
  Database, 
  Download, 
  Upload, 
  RefreshCcw, 
  Check, 
  ShieldCheck, 
  Save, 
  Palette, 
  Moon, 
  Sun, 
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PinChangePanel } from './PinChangePanel';
import { GoogleBackupPanel } from './GoogleBackupPanel';
import { THEMES, ThemeColor } from '../../utils/theme';
import { 
  exportProductsToExcel, 
  exportCustomersToExcel, 
  exportCompleteStoreExcel, 
  downloadProductExcelTemplate, 
  downloadCustomerExcelTemplate 
} from '../../utils/excelHelper';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    products,
    customers,
    exportAllDataJSON, 
    importAllDataJSON, 
    resetToSampleData, 
    resetCleanForProduction,
    factoryResetEverything,
    t, 
    currentRole 
  } = useApp();

  const theme = THEMES[settings.themeColor] || THEMES.teal;
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Business Profile Form
  const [name, setName] = useState(settings.business.name);
  const [tagline, setTagline] = useState(settings.business.tagline);
  const [phone, setPhone] = useState(settings.business.phone);
  const [altPhone, setAltPhone] = useState(settings.business.altPhone || '');
  const [email, setEmail] = useState(settings.business.email || '');
  const [address, setAddress] = useState(settings.business.address);
  const [proprietor, setProprietor] = useState(settings.business.proprietor);
  const [vatRegNo, setVatRegNo] = useState(settings.business.vatRegNo || '');
  const [footerNote, setFooterNote] = useState(settings.business.footerNote);
  const [thermalWidth, setThermalWidth] = useState<'58mm' | '80mm'>(settings.business.thermalWidth);

  // VAT
  const [enableVat, setEnableVat] = useState(settings.enableVat);
  const [defaultVatPercent, setDefaultVatPercent] = useState(String(settings.defaultVatPercent));

  // Notice
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      enableVat,
      defaultVatPercent: parseFloat(defaultVatPercent) || 5,
      business: {
        name: name.trim() || 'ibtipoint',
        tagline: tagline.trim(),
        phone: phone.trim(),
        altPhone: altPhone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim(),
        proprietor: proprietor.trim(),
        vatRegNo: vatRegNo.trim() || undefined,
        footerNote: footerNote.trim(),
        thermalWidth,
      },
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importAllDataJSON(content);
      if (success) {
        alert(t('সম্পূর্ণ ব্যাকআপ ডেটা সফলভাবে রিস্টোর হয়েছে!', 'Full data backup restored successfully!'));
      } else {
        alert(t('ফাইল ফরম্যাট সঠিক নয়!', 'Invalid backup file format!'));
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  return (
    <div className="space-y-5 pb-16 md:pb-6 max-w-4xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            <span>{t('দোকানের সেটিংস ও নিরাপত্তা (ibtipoint Settings)', 'Business Profile & Security')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('রশিদ প্রিন্ট ফরম্যাট, এডমিন ও স্টাফ পিন, এবং ফুল ডাটাবেজ ব্যাকআপ ব্যবস্থাপনা', 'Configure memo headers, staff access PINs, and full database backups')}
          </p>
        </div>

        {saveSuccess && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>{t('সফলভাবে সংরক্ষিত হয়েছে!', 'Settings Saved!')}</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-4">
        
        {/* Section 1: Business Profile */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Store className="w-4 h-4 text-teal-600" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {t('দোকানের পরিচিতি ও মেমো বিবরণ', 'Business Information on Receipt')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {t('প্রতিষ্ঠানের নাম *', 'Business Name *')}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {t('ট্যাগলাইন / স্লোগান', 'Tagline')}
              </label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {t('প্রধান মোবাইল নম্বর *', 'Primary Phone *')}
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {t('বিকল্প মোবাইল / হোয়াটসঅ্যাপ', 'Alternative Phone')}
              </label>
              <input
                type="text"
                value={altPhone}
                onChange={e => setAltPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {t('ইমেইল এড্রেস', 'Email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {t('দোকানের ঠিকানা *', 'Shop Address *')}
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {t('প্রোপ্রাইটর / স্বত্বাধিকারী', 'Proprietor Name')}
              </label>
              <input
                type="text"
                value={proprietor}
                onChange={e => setProprietor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">
              {t('মেমোর নিচের শর্তাবলী / ধন্যবাদ বার্তা', 'Receipt Footer Note')}
            </label>
            <input
              type="text"
              value={footerNote}
              onChange={e => setFooterNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {t('থার্মাল প্রিন্টার পেপার সাইজ', 'Thermal Printer Paper')}
              </label>
              <select
                value={thermalWidth}
                onChange={e => setThermalWidth(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="80mm">80mm Standard POS Printer (বড় থার্মাল রোল)</option>
                <option value="58mm">58mm Compact Mini Printer (মিনি থার্মাল রোল)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {t('ভ্যাট ও ট্যাক্স অপশন', 'VAT / Tax Toggle')}
              </label>
              <div className="flex items-center gap-3 pt-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={enableVat}
                    onChange={e => setEnableVat(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>{t('ভ্যাট চালু করুন', 'Enable VAT')}</span>
                </label>
                {enableVat && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={defaultVatPercent}
                      onChange={e => setDefaultVatPercent(e.target.value)}
                      className="w-14 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-center font-bold"
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Save button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-white font-extrabold text-sm shadow-md ${theme.primary} ${theme.primaryHover} active:scale-95 transition-all`}
          >
            <Save className="w-4 h-4" />
            <span>{t('সব সেটিংস সংরক্ষণ করুন', 'Save Settings')}</span>
          </button>
        </div>

      </form>

      <PinChangePanel />
      <GoogleBackupPanel />

      {/* Section: Excel Data Sync & Spreadsheet Backups */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {t('এক্সেল ডাটা সিঙ্ক ও ব্যাকআপ (.xlsx Excel Sync)', 'Excel Data Sync & Spreadsheet Backups')}
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('ইনভেন্টরি পণ্য ও কাস্টমার বাকি খাতার সমস্ত তথ্য এক্সেলে এক্সপোর্ট করুন অথবা নমুনা টেমপ্লেট ডাউনলোড করে পূরণ করে বাল্ক ইম্পোর্ট করুন।', 'Export products & customer ledgers to Excel spreadsheets or download ready templates for bulk offline data entry.')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {/* Export Products */}
          <button
            type="button"
            onClick={() => exportProductsToExcel(products)}
            className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 transition-colors text-left"
          >
            <div>
              <span className="font-bold text-xs block">{t('পণ্য এক্সেল এক্সপোর্ট', 'Export Products (.xlsx)')}</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400">{products.length} {t('টি পণ্য স্টকে আছে', 'products in stock')}</span>
            </div>
            <Download className="w-4 h-4 shrink-0 text-emerald-600" />
          </button>

          {/* Export Customers */}
          <button
            type="button"
            onClick={() => exportCustomersToExcel(customers)}
            className="flex items-center justify-between p-3 rounded-2xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-800 transition-colors text-left"
          >
            <div>
              <span className="font-bold text-xs block">{t('কাস্টমার বাকি এক্সপোর্ট', 'Export Customers (.xlsx)')}</span>
              <span className="text-[10px] text-teal-700 dark:text-teal-400">{customers.length} {t('জন গ্রাহকের খাতা', 'customers in khata')}</span>
            </div>
            <Download className="w-4 h-4 shrink-0 text-teal-600" />
          </button>

          {/* Master Store Workbook */}
          <button
            type="button"
            onClick={() => exportCompleteStoreExcel(products, customers)}
            className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 transition-colors text-left sm:col-span-2 lg:col-span-1"
          >
            <div>
              <span className="font-bold text-xs block">{t('অল-ইন-ওয়ান স্টোর এক্সেল', 'Master Store Excel')}</span>
              <span className="text-[10px] text-indigo-700 dark:text-indigo-400">{t('পণ্য ও কাস্টমার দুই শিট একসাথে', 'Products & Customers')}</span>
            </div>
            <Download className="w-4 h-4 shrink-0 text-indigo-600" />
          </button>
        </div>

        {/* Template Downloads */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400">
            {t('নমুনা এক্সেল টেমপ্লেট:', 'Sample Templates:')}
          </span>
          <button
            type="button"
            onClick={downloadProductExcelTemplate}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 underline decoration-dotted flex items-center gap-1"
          >
            <span>📥 {t('পণ্য ফরম্যাট টেমপ্লেট', 'Product Template (.xlsx)')}</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <button
            type="button"
            onClick={downloadCustomerExcelTemplate}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 underline decoration-dotted flex items-center gap-1"
          >
            <span>📥 {t('কাস্টমার ফরম্যাট টেমপ্লেট', 'Customer Template (.xlsx)')}</span>
          </button>
        </div>
      </div>

      {/* Section 4: Data Backup & Reset */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Database className="w-4 h-4 text-teal-600" />
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            {t('ডাটাবেজ ব্যাকআপ ও রিস্টোর (Local Backup & Restore)', 'Database Backup & Restore')}
          </h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('আপনার সকল পণ্য, খাতা, মেমো ও খরচের হিসাব এক ফাইলে ডাউনলোড করে নিরাপদ রাখুন অথবা অন্য কম্পিউটারে ট্রান্সফার করুন।', 'Export full store database to a secure file or restore onto another PC / Android device.')}
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={exportAllDataJSON}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{t('সম্পূর্ণ ব্যাকআপ ফাইল ডাউনলোড', 'Download Full Store Backup')}</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{t('ব্যাকআপ রিস্টোর করুন', 'Restore Backup JSON')}</span>
            <input
              type="file"
              ref={jsonInputRef}
              accept=".json"
              onChange={handleJsonUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (confirm(t('নতুন দোকানের জন্য সমস্ত টেস্ট মেমো ও বাকি মুছে ফ্রেশ শুরু করতে চান? (পণ্য তালিকা অক্ষত থাকবে)', 'Reset all test orders, dues and expenses for store launch? (Products will be kept)'))) {
                resetCleanForProduction();
                alert(t('সফলভাবে সমস্ত টেস্ট হিসাব রিসেট হয়েছে! দোকান এখন ফ্রেশ বিক্রির জন্য প্রস্তুত।', 'All test transactions cleared! Ready for real shop launch.'));
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-xs font-bold transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('নতুন দোকানের জন্য ফ্রেশ রিসেট (Clean Slate)', 'Clean Store Reset')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm(t('আপনি কি নিশ্চিত যে ডেমো স্যাম্পল ডেটাতে রিসেট করতে চান?', 'Reset all data to default initial sample store?'))) {
                resetToSampleData();
                alert(t('সফলভাবে প্রাথমিক স্যাম্পল ডেটায় রিসেট হয়েছে!', 'Reset completed!'));
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>{t('নমুনা ডেটায় রিসেট', 'Sample Data')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm(t('সতর্কতা: এটি সম্পূর্ণ অ্যাপ ডাটা মুছে ফ্যাক্টরি রিসেট করবে! আপনি কি নিশ্চিত?', 'Warning: This will factory reset all data. Are you sure?'))) {
                factoryResetEverything();
                alert(t('ফ্যাক্টরি রিসেট সম্পন্ন হয়েছে!', 'Factory reset complete!'));
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-colors ml-auto"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>{t('ফ্যাক্টরি রিসেট', 'Factory Reset')}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
