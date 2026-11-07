import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle, 
  Filter, 
  Save, 
  Tag,
  ShieldAlert,
  Sparkles,
  PackageCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory, ProductQuality } from '../../types';
import { exportProductsToExcel, downloadProductExcelTemplate, parseProductsExcel } from '../../utils/excelHelper';
import { THEMES } from '../../utils/theme';

export const InventoryView: React.FC = () => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    bulkSetProducts, 
    quickUpdateRateAndQuality, 
    currentRole, 
    formatBDT, 
    t, 
    settings 
  } = useApp();

  const theme = THEMES[settings.themeColor] || THEMES.teal;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<ProductCategory | 'all'>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');

  // Inline editing state: track edited rows { [productId]: { buyPrice, salePrice, quality, stock } }
  const [inlineEdits, setInlineEdits] = useState<Record<string, { buyPrice: number; salePrice: number; quality: string; stock: number }>>({});
  const [savedRowId, setSavedRowId] = useState<string | null>(null);

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formNameBn, setFormNameBn] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('gadget');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formBuyPrice, setFormBuyPrice] = useState('');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formQuality, setFormQuality] = useState<string>('Original');
  const [formWarranty, setFormWarranty] = useState('');
  const [formAlert, setFormAlert] = useState('5');

  // Import Status Feedback
  const [importNotice, setImportNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Quality options list
  const qualityOptions: ProductQuality[] = [
    'Original',
    'Grade A',
    '1:1 Master Copy',
    'Standard',
    'Premium',
    'Economy',
    'Custom',
  ];

  // Open modal to add
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormNameBn('');
    setFormCategory('gadget');
    setFormSku(`SKU-${Date.now().toString().slice(-6)}`);
    setFormBarcode('');
    setFormBuyPrice('');
    setFormSalePrice('');
    setFormStock('10');
    setFormUnit('pcs');
    setFormQuality('Original');
    setFormWarranty('None');
    setFormAlert('5');
    setModalOpen(true);
  };

  // Open modal to edit
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormNameBn(p.nameBn || '');
    setFormCategory(p.category);
    setFormSku(p.sku);
    setFormBarcode(p.barcode || '');
    setFormBuyPrice(String(p.buyPrice));
    setFormSalePrice(String(p.salePrice));
    setFormStock(String(p.stock));
    setFormUnit(p.unit);
    setFormQuality(p.quality);
    setFormWarranty(p.warranty || '');
    setFormAlert(String(p.minStockAlert));
    setModalOpen(true);
  };

  // Save product modal
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const buyPrice = parseFloat(formBuyPrice) || 0;
    const salePrice = parseFloat(formSalePrice) || 0;
    const stock = parseInt(formStock, 10) || 0;
    const minAlert = parseInt(formAlert, 10) || 5;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formName.trim(),
        nameBn: formNameBn.trim(),
        category: formCategory,
        sku: formSku.trim(),
        barcode: formBarcode.trim() || undefined,
        buyPrice,
        salePrice,
        stock,
        unit: formUnit.trim() || 'pcs',
        quality: formQuality.trim(),
        warranty: formWarranty.trim(),
        minStockAlert: minAlert,
      });
    } else {
      addProduct({
        name: formName.trim(),
        nameBn: formNameBn.trim(),
        category: formCategory,
        sku: formSku.trim(),
        barcode: formBarcode.trim() || undefined,
        buyPrice,
        salePrice,
        stock,
        unit: formUnit.trim() || 'pcs',
        quality: formQuality.trim(),
        warranty: formWarranty.trim(),
        minStockAlert: minAlert,
      });
    }

    setModalOpen(false);
  };

  // Handle inline change
  const handleInlineChange = (productId: string, field: 'buyPrice' | 'salePrice' | 'quality' | 'stock', value: any) => {
    const existing = inlineEdits[productId] || {
      buyPrice: products.find(p => p.id === productId)?.buyPrice || 0,
      salePrice: products.find(p => p.id === productId)?.salePrice || 0,
      quality: products.find(p => p.id === productId)?.quality || 'Original',
      stock: products.find(p => p.id === productId)?.stock || 0,
    };

    setInlineEdits(prev => ({
      ...prev,
      [productId]: {
        ...existing,
        [field]: value,
      },
    }));
  };

  // Save single inline row
  const handleSaveInlineRow = (productId: string) => {
    const edit = inlineEdits[productId];
    if (!edit) return;

    quickUpdateRateAndQuality(productId, edit.buyPrice, edit.salePrice, edit.quality, edit.stock);
    
    // Clear from active inline edits
    setInlineEdits(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });

    setSavedRowId(productId);
    setTimeout(() => setSavedRowId(null), 1500);
  };

  // Excel Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseProductsExcel(file, products);
      bulkSetProducts(result.products);
      setImportNotice({
        type: 'success',
        message: t(
          `সফলভাবে ${result.added} টি নতুন পণ্য যোগ ও ${result.updated} টি রেট/স্টক আপডেট হয়েছে!`,
          `Successfully imported! ${result.added} added, ${result.updated} updated.`
        ),
      });
      setTimeout(() => setImportNotice(null), 5000);
    } catch (err: any) {
      setImportNotice({
        type: 'error',
        message: t('এক্সেল ফাইল পড়তে সমস্যা হয়েছে: ' + err.message, 'Failed to import Excel: ' + err.message),
      });
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filtered Products
  const filteredList = products.filter(p => {
    const matchCat = filterCategory === 'all' || p.category === filterCategory;
    const matchStock = 
      filterStock === 'all' ? true :
      filterStock === 'low' ? (p.stock <= p.minStockAlert && p.stock > 0) :
      (p.stock <= 0);
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      (p.nameBn && p.nameBn.toLowerCase().includes(q)) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q)) ||
      p.quality.toLowerCase().includes(q);

    return matchCat && matchStock && matchSearch;
  });

  return (
    <div className="space-y-4 pb-16 md:pb-6">
      
      {/* Top Banner & Excel Tools */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {t('পণ্য ও ইনভেন্টরি ম্যানেজমেন্ট', 'Inventory & Stock Management')}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-bold">
              {products.length} {t('টি আইটেম', 'Items')}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('পণ্য রেট ও কোয়ালিটি সরাসরি টেবিলে এডিট করুন অথবা এক্সেলে ইম্পোর্ট/এক্সপোর্ট করুন', 'Edit prices & quality directly in-table or import/export via Excel (.xlsx)')}
          </p>
        </div>

        {/* Action Buttons: Add, Excel Export, Excel Import */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Add New Product Button */}
          <button
            onClick={handleOpenAdd}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md ${theme.primary} ${theme.primaryHover} transition-all active:scale-95`}
          >
            <Plus className="w-4 h-4" />
            <span>{t('নতুন পণ্য যোগ', 'Add Product')}</span>
          </button>

          {/* Export to Excel */}
          <button
            onClick={() => exportProductsToExcel(products)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold transition-colors"
            title="Export all products to Excel"
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
            onClick={downloadProductExcelTemplate}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
            title={t('নমুনা এক্সেল ফরম্যাট ডাউনলোড করুন', 'Download Sample Excel Template')}
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

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-3">
        
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('পণ্য খুঁজুন (নাম, SKU, কোড, গুণমান বা বারকোড)...', 'Search product by name, SKU, quality or barcode...')}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as any)}
            className="py-2 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">{t('সব ক্যাটাগরি', 'All Categories')}</option>
            <option value="gadget">{t('মোবাইল গ্যাজেট', 'Gadgets')}</option>
            <option value="electric">{t('ইলেকট্রিক', 'Electric')}</option>
            <option value="stationery">{t('স্টেশনারি', 'Stationery')}</option>
            <option value="photo_studio">{t('ফটো স্টুডিও', 'Photo Studio')}</option>
            <option value="telecom">{t('টেলিকম ও সিম', 'Telecom & SIM')}</option>
            <option value="mobile_banking">{t('মোবাইল ব্যাংকিং', 'Mobile Banking')}</option>
            <option value="other">{t('অন্যান্য', 'Other')}</option>
          </select>

          {/* Stock Filter */}
          <select
            value={filterStock}
            onChange={e => setFilterStock(e.target.value as any)}
            className="py-2 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">{t('সব স্টক', 'All Stock')}</option>
            <option value="low">{t('কম স্টক (সতর্কতা)', 'Low Stock Alert')}</option>
            <option value="out">{t('স্টক আউট (০)', 'Out of Stock')}</option>
          </select>
        </div>

      </div>

      {/* Main Inventory Table with Editable Price & Quality */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                <th className="py-3 px-3 sm:px-4 w-12 text-center">#</th>
                <th className="py-3 px-3 sm:px-4">{t('পণ্যের নাম ও বিবরণ', 'Product Name & Specs')}</th>
                <th className="py-3 px-3 sm:px-4">{t('ক্যাটাগরি', 'Category')}</th>
                <th className="py-3 px-3 sm:px-4 w-36">
                  {t('গুণমান / কোয়ালিটি', 'Quality (Editable)')}
                </th>
                {currentRole === 'admin' && (
                  <th className="py-3 px-3 sm:px-4 w-28">
                    {t('ক্রয় মূল্য (৳)', 'Buy Price (৳)')}
                  </th>
                )}
                <th className="py-3 px-3 sm:px-4 w-28">
                  {t('বিক্রয় মূল্য (৳)', 'Sale Price (৳)')}
                </th>
                <th className="py-3 px-3 sm:px-4 w-24">
                  {t('মজুদ স্টক', 'Stock Qty')}
                </th>
                <th className="py-3 px-3 sm:px-4 w-28 text-right">{t('অ্যাকশন', 'Actions')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.map((product, idx) => {
                const isEdited = !!inlineEdits[product.id];
                const activeBuy = inlineEdits[product.id]?.buyPrice ?? product.buyPrice;
                const activeSale = inlineEdits[product.id]?.salePrice ?? product.salePrice;
                const activeQuality = inlineEdits[product.id]?.quality ?? product.quality;
                const activeStock = inlineEdits[product.id]?.stock ?? product.stock;
                const isLow = product.stock <= product.minStockAlert;
                const isSaved = savedRowId === product.id;

                return (
                  <tr 
                    key={product.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isSaved ? 'bg-emerald-50 dark:bg-emerald-950/30' : ''
                    }`}
                  >
                    {/* Index */}
                    <td className="py-3 px-3 sm:px-4 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Product Name & SKU */}
                    <td className="py-3 px-3 sm:px-4">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white leading-tight">
                          {product.name}
                        </div>
                        {product.nameBn && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {product.nameBn}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>{product.sku}</span>
                          {product.warranty && <span>• 🛡️ {product.warranty}</span>}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 sm:px-4">
                      <span className="capitalize text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {product.category.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Quality (Editable inline!) */}
                    <td className="py-3 px-3 sm:px-4">
                      <select
                        value={activeQuality}
                        onChange={e => handleInlineChange(product.id, 'quality', e.target.value)}
                        className="w-full py-1 px-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        {qualityOptions.map(q => (
                          <option key={q} value={q}>{q}</option>
                        ))}
                      </select>
                    </td>

                    {/* Buy Price (Editable, Admin Only) */}
                    {currentRole === 'admin' && (
                      <td className="py-3 px-3 sm:px-4">
                        <input
                          type="number"
                          value={activeBuy}
                          onChange={e => handleInlineChange(product.id, 'buyPrice', parseFloat(e.target.value) || 0)}
                          className="w-full py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 text-right focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </td>
                    )}

                    {/* Sale Price (Editable) */}
                    <td className="py-3 px-3 sm:px-4">
                      <input
                        type="number"
                        value={activeSale}
                        onChange={e => handleInlineChange(product.id, 'salePrice', parseFloat(e.target.value) || 0)}
                        className="w-full py-1 px-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800 text-xs font-black text-teal-700 dark:text-teal-300 text-right focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </td>

                    {/* Stock Qty (Editable) */}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={activeStock}
                          onChange={e => handleInlineChange(product.id, 'stock', parseInt(e.target.value, 10) || 0)}
                          className={`w-14 py-1 px-1.5 rounded-lg text-xs font-bold text-right border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                            isLow 
                              ? 'bg-amber-50 dark:bg-amber-950 border-amber-300 text-amber-800 dark:text-amber-200' 
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                          }`}
                        />
                        <span className="text-[10px] text-slate-400">{product.unit}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Save inline changes if row modified */}
                        {isEdited && (
                          <button
                            onClick={() => handleSaveInlineRow(product.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 animate-pulse shadow-sm"
                            title={t('পরিবর্তন সংরক্ষণ করুন', 'Save Changes')}
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isSaved && (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}

                        {/* Edit modal */}
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                          title="Detailed Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete button (Admin only) */}
                        {currentRole === 'admin' && (
                          <button
                            onClick={() => {
                              if (confirm(t('এই পণ্য মুছে ফেলতে চান?', 'Delete this product?'))) {
                                deleteProduct(product.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredList.length === 0 && (
            <div className="py-12 px-4 text-center">
              {products.length === 0 ? (
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                    <PackageCheck className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                    {t('ইনভেন্টরিতে কোনো পণ্য যোগ করা হয়নি', 'No Products in Inventory Yet')}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    {t('নতুন পণ্য যোগ করুন অথবা আপনার এক্সেল তালিকা সরাসরি ইম্পোর্ট করে স্টক শুরু করুন', 'Add your first product or import your full catalog from Excel')}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={handleOpenAdd}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-sm ${theme.primary}`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t('নতুন পণ্য যোগ', 'Add Product')}</span>
                    </button>
                    <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 text-xs font-bold transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
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
              ) : (
                <p className="text-slate-400 text-xs">{t('কোনো পণ্য পাওয়া যায়নি', 'No matching products found')}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Detailed Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {editingProduct ? t('পণ্য তথ্য সংশোধন করুন', 'Edit Product Details') : t('নতুন পণ্য যোগ করুন', 'Add New Product')}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {t('পণ্যের নাম (English) *', 'Product Name (English) *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Fast Charger 20W"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {t('পণ্যের নাম (বাংলা)', 'Product Name (Bangla)')}
                  </label>
                  <input
                    type="text"
                    value={formNameBn}
                    onChange={e => setFormNameBn(e.target.value)}
                    placeholder="যেমন: ফাস্ট চার্জার ২০ ওয়াট"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {t('ক্যাটাগরি *', 'Category *')}
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="gadget">Mobile Gadget & Accessories</option>
                    <option value="electric">Electric & Lights</option>
                    <option value="stationery">Stationery & Books</option>
                    <option value="photo_studio">Photo Studio & Frames</option>
                    <option value="telecom">Telecom & SIM</option>
                    <option value="mobile_banking">Mobile Banking Service</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {t('কোয়ালিটি / গুণমান *', 'Quality (Editable) *')}
                  </label>
                  <input
                    type="text"
                    value={formQuality}
                    onChange={e => setFormQuality(e.target.value)}
                    placeholder="Original, Grade A, 1:1, etc."
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {t('ক্রয় মূল্য (৳) *', 'Buy Price (৳) *')}
                  </label>
                  <input
                    type="number"
                    required
                    value={formBuyPrice}
                    onChange={e => setFormBuyPrice(e.target.value)}
                    placeholder="350"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {t('বিক্রয় মূল্য (৳) *', 'Sale Price (৳) *')}
                  </label>
                  <input
                    type="number"
                    required
                    value={formSalePrice}
                    onChange={e => setFormSalePrice(e.target.value)}
                    placeholder="500"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-teal-600 dark:text-teal-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {t('মজুদ স্টক *', 'Stock Qty *')}
                  </label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={e => setFormStock(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {t('একক (Unit)', 'Unit')}
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={e => setFormUnit(e.target.value)}
                    placeholder="pcs, box, set"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {t('ওয়ারেন্টি', 'Warranty')}
                  </label>
                  <input
                    type="text"
                    value={formWarranty}
                    onChange={e => setFormWarranty(e.target.value)}
                    placeholder="6 Months / 7 Days"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {t('সতর্কতা স্টক', 'Low Stock Alert')}
                  </label>
                  <input
                    type="number"
                    value={formAlert}
                    onChange={e => setFormAlert(e.target.value)}
                    placeholder="5"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {t('SKU / কোড *', 'SKU / Code *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={e => setFormSku(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {t('বারকোড (ঐচ্ছিক)', 'Barcode (Optional)')}
                  </label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={e => setFormBarcode(e.target.value)}
                    placeholder="89012345..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  {t('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold ${theme.primary} ${theme.primaryHover} shadow-sm`}
                >
                  {t('সংরক্ষণ করুন', 'Save Product')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
