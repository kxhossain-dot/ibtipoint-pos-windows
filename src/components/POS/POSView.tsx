import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  UserCheck, 
  UserPlus, 
  Receipt, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Percent, 
  Tag, 
  Clock,
  Layers,
  ArrowRight,
  ScanLine
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory, Customer, PaymentMethod } from '../../types';
import { THEMES } from '../../utils/theme';
import { BarcodeScanner } from '../Common/BarcodeScanner';

interface POSViewProps {
  onOpenReceipt: (orderId: string) => void;
}

export const POSView: React.FC<POSViewProps> = ({ onOpenReceipt }) => {
  const { 
    products, 
    cart, 
    addToCart, 
    updateCartQty, 
    updateCartCustomPrice, 
    updateCartDiscount, 
    removeFromCart, 
    clearCart, 
    processSale, 
    customers, 
    addCustomer, 
    formatBDT, 
    t, 
    settings 
  } = useApp();

  const theme = THEMES[settings.themeColor] || THEMES.teal;

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Checkout & Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [tenderCashAmount, setTenderCashAmount] = useState<string>('');
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [digitalProvider, setDigitalProvider] = useState<'bkash' | 'nagad' | 'rocket' | 'upay'>('bkash');
  const [trxId, setTrxId] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Quick custom item modal (for on-the-spot recharge or custom photo service)
  const [customItemModal, setCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemCat, setCustomItemCat] = useState<ProductCategory>('telecom');

  // Categories list for POS top tabs
  const categories: { id: ProductCategory | 'all'; labelBn: string; labelEn: string; icon: string }[] = [
    { id: 'all', labelBn: 'সব আইটেম', labelEn: 'All Items', icon: '⚡' },
    { id: 'gadget', labelBn: 'মোবাইল গ্যাজেট', labelEn: 'Gadgets', icon: '🎧' },
    { id: 'electric', labelBn: 'ইলেকট্রিক লাইট', labelEn: 'Electric', icon: '💡' },
    { id: 'stationery', labelBn: 'স্টেশনারি ও খাতা', labelEn: 'Stationery', icon: '📝' },
    { id: 'photo_studio', labelBn: 'ফটো স্টুডিও', labelEn: 'Photo Studio', icon: '📷' },
    { id: 'telecom', labelBn: 'টেলিকম ও সিম', labelEn: 'Telecom', icon: '📶' },
    { id: 'mobile_banking', labelBn: 'মোবাইল ব্যাংকিং', labelEn: 'M-Banking', icon: '📱' },
  ];

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        (p.nameBn && p.nameBn.toLowerCase().includes(q)) || 
        p.sku.toLowerCase().includes(q) || 
        (p.barcode && p.barcode.includes(q)) ||
        p.quality.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.customPrice ?? item.product.salePrice) * item.quantity, 0);
  const itemsDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const totalDiscount = itemsDiscount + overallDiscount;
  const vat = settings.enableVat ? (subtotal - totalDiscount) * (settings.defaultVatPercent / 100) : 0;
  const grandTotal = Math.max(0, subtotal - totalDiscount + vat);

  const parsedTender = parseFloat(tenderCashAmount) || 0;
  const returnChange = paymentMethod === 'cash' && parsedTender > grandTotal ? parsedTender - grandTotal : 0;

  // Selected customer info
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Camera barcode result: add matching product to cart, otherwise show it in search
  const handleBarcodeDetected = (code: string) => {
    setIsScannerOpen(false);
    const clean = code.trim().toLowerCase();
    const match = products.find(p => (p.barcode && p.barcode.trim().toLowerCase() === clean) || p.sku.toLowerCase() === clean);
    if (match) {
      addToCart(match, 1);
    } else {
      setSearchQuery(code.trim());
      alert(t('এই বারকোডের পণ্য পাওয়া যায়নি', 'No product found for this barcode'));
    }
  };

  // Handle New Customer Quick Add
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const created = addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim(),
      creditLimit: 5000,
    });

    setSelectedCustomerId(created.id);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setIsNewCustomerModalOpen(false);
  };

  // Add custom on-the-spot product to cart
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(customItemPrice);
    if (!customItemName.trim() || isNaN(price) || price <= 0) return;

    const tempProduct: Product = {
      id: `custom-${Date.now()}`,
      name: customItemName.trim(),
      nameBn: customItemName.trim(),
      category: customItemCat,
      sku: 'CUSTOM-ITEM',
      buyPrice: price * 0.9, // Estimated wholesale
      salePrice: price,
      stock: 9999,
      unit: 'item',
      quality: 'Custom',
      minStockAlert: 0,
      updatedAt: new Date().toISOString(),
    };

    addToCart(tempProduct, 1);
    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemModal(false);
  };

  // Process Checkout
  const handleCheckout = () => {
    if (cart.length === 0) return;

    // If due payment selected but no customer chosen
    if (paymentMethod === 'due' && !selectedCustomerId) {
      alert(t('বাকি বিক্রির জন্য গ্রাহক নির্বাচন করুন অথবা নতুন গ্রাহক যোগ করুন', 'Please select or add a customer for due sales!'));
      return;
    }

    let paid = grandTotal;
    if (paymentMethod === 'due') {
      paid = parsedTender > 0 ? Math.min(parsedTender, grandTotal) : 0;
    } else if (paymentMethod === 'cash') {
      paid = parsedTender > 0 ? Math.min(parsedTender, grandTotal) : grandTotal;
    }

    const completed = processSale({
      paymentMethod,
      paidAmount: paid,
      customerId: selectedCustomerId || undefined,
      overallDiscount,
      notes: orderNotes,
      digitalDetails: ['bkash', 'nagad', 'rocket', 'upay'].includes(paymentMethod) ? {
        provider: digitalProvider,
        trxId: trxId.trim() || undefined,
      } : undefined,
    });

    if (completed) {
      // Trigger celebrate confetti
      import('canvas-confetti')
        .then(m => m.default({ particleCount: 60, spread: 60, origin: { y: 0.7 } }))
        .catch(() => {});

      // Reset form
      setTenderCashAmount('');
      setOverallDiscount(0);
      setTrxId('');
      setOrderNotes('');
      setSelectedCustomerId('');

      // Open receipt automatically
      onOpenReceipt(completed.id);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-5.5rem)] pb-16 lg:pb-0">
      
      {/* Left Column: Product Catalog & Quick Filter Tabs */}
      <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        
        {/* Top Header: Search & Quick Custom Item */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('পণ্য খুঁজুন (নাম, SKU, বারকোড, গুণমান)...', 'Search items (name, sku, barcode, quality)...')}
                className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold shrink-0 transition-colors"
              title={t('ক্যামেরায় বারকোড স্ক্যান', 'Scan barcode with camera')}
            >
              <ScanLine className="w-4 h-4 text-teal-600" />
              <span className="hidden sm:inline">{t('স্ক্যান', 'Scan')}</span>
            </button>

            {/* Quick On-the-spot Custom Item (e.g. Instant Recharge / Studio Custom) */}
            <button
              onClick={() => setCustomItemModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold shrink-0 transition-colors"
              title="Add Custom Item"
            >
              <Plus className="w-4 h-4 text-teal-600" />
              <span className="hidden sm:inline">{t('কাস্টম আইটেম', 'Custom Item')}</span>
            </button>

          </div>

          {/* Category Chips Scrollable */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? `${theme.primary} text-white shadow-xs`
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{t(cat.labelBn, cat.labelEn)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto max-h-[60vh] lg:max-h-none">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Layers className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">{t('কোনো পণ্য পাওয়া যায়নি', 'No products found')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('অন্য কোনো নাম দিয়ে সার্চ করুন অথবা ক্যাটাগরি পরিবর্তন করুন', 'Try another search query or switch category')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
              {filteredProducts.map(product => {
                const inCartItem = cart.find(item => item.product.id === product.id);
                const isOutOfStock = product.stock <= 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product, 1)}
                    className={`relative p-3 rounded-2xl border transition-all flex flex-col justify-between select-none ${
                      isOutOfStock
                        ? 'opacity-50 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800/80 hover:border-teal-500 border-slate-200 dark:border-slate-700/80 hover:shadow-md cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    {/* Quality & Category Badge */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 truncate max-w-[80px]">
                        {product.quality}
                      </span>
                      <span className={`text-[10px] font-semibold ${product.stock <= product.minStockAlert ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                        {product.stock} {product.unit}
                      </span>
                    </div>

                    {/* Product Name */}
                    <div className="flex-1 my-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {product.nameBn || product.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {product.sku}
                      </p>
                    </div>

                    {/* Price and Add Icon */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 mt-1">
                      <span className="text-xs sm:text-sm font-extrabold text-teal-600 dark:text-teal-400">
                        {formatBDT(product.salePrice)}
                      </span>
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                        inCartItem ? `${theme.primary} text-white font-bold text-xs` : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {inCartItem ? inCartItem.quantity : <Plus className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Right Column: Cart, Customer & Checkout Sidebar */}
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs shrink-0 lg:min-h-0">
        
        {/* Cart Header & Clear Button */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
              {t('বিক্রয় কার্ট', 'Sale Cart')}
            </span>
            <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold flex items-center justify-center">
              {cart.length}
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('খালি করুন', 'Clear')}</span>
            </button>
          )}
        </div>

        {/* Customer Selector Dropdown */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-1.5">
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:outline-none"
            >
              <option value="">{t('নগদ ক্রেতা (Walk-in Customer)', 'Walk-in Cash Customer')}</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) - {t('বাকি', 'Due')}: ৳{c.totalDue}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="p-1.5 rounded-xl bg-teal-100 hover:bg-teal-200 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-bold text-xs"
              title={t('নতুন গ্রাহক যোগ করুন', 'Add Customer')}
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>

          {selectedCustomer && (
            <div className="mt-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] flex justify-between">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                {selectedCustomer.name}
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {t('পূর্বের বাকি:', 'Prev Due:')} {formatBDT(selectedCustomer.totalDue)}
              </span>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 min-h-[160px]">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <p>{t('কার্ট খালি আছে', 'Cart is currently empty')}</p>
              <p className="text-[11px] mt-1">{t('বামপাশের তালিকা থেকে পণ্যে ক্লিক করুন', 'Tap products from the list to add')}</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="py-2.5 first:pt-0 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {item.product.nameBn || item.product.name}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {item.product.quality} • @{formatBDT(item.customPrice ?? item.product.salePrice)}
                    </span>
                  </div>
                  <div className="text-right font-extrabold text-xs text-slate-900 dark:text-white">
                    {formatBDT(item.subtotal)}
                  </div>
                </div>

                {/* Controls: Qty, Custom Price, Discount, Delete */}
                <div className="flex items-center justify-between text-xs pt-1">
                  
                  {/* Quantity Counter */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                    <button
                      onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                      className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                      className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Inline Price edit */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">দর:</span>
                    <input
                      type="number"
                      value={item.customPrice ?? item.product.salePrice}
                      onChange={e => updateCartCustomPrice(item.product.id, parseFloat(e.target.value) || 0)}
                      className="w-16 px-1.5 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-right"
                    />
                  </div>

                  {/* Delete Item */}
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Calculations & Payment Options */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-2.5">
          
          {/* Subtotal & Discount row */}
          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span>{t('উপমোট (Subtotal):', 'Subtotal:')}</span>
              <span className="font-semibold">{formatBDT(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>{t('বিশেষ ছাড় (Discount ৳):', 'Discount (৳):')}</span>
              <input
                type="number"
                min="0"
                value={overallDiscount || ''}
                onChange={e => setOverallDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-20 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right text-xs font-bold text-rose-500"
              />
            </div>

            {settings.enableVat && (
              <div className="flex justify-between">
                <span>{t(`ভ্যাট (${settings.defaultVatPercent}%):`, `VAT (${settings.defaultVatPercent}%):`)}</span>
                <span>+{formatBDT(vat)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>{t('সর্বমোট বিল:', 'Grand Total:')}</span>
              <span className="text-teal-600 dark:text-teal-400">{formatBDT(grandTotal)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
              {t('পরিশোধের মাধ্যম (Payment Method)', 'Payment Method')}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'cash', label: 'নগদ', icon: '💵' },
                { id: 'bkash', label: 'বিকাশ', icon: '🌸' },
                { id: 'nagad', label: 'নগদ App', icon: '🟠' },
                { id: 'due', label: 'বাকি খাতা', icon: '📖' },
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                  className={`py-1.5 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center border transition-all ${
                    paymentMethod === method.id
                      ? `${theme.primary} text-white border-transparent shadow-xs`
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-xs">{method.icon}</span>
                  <span className="text-[10px] mt-0.5 truncate">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash Change Calculator */}
          {paymentMethod === 'cash' && (
            <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">{t('ক্যাশ গ্রহণ (৳):', 'Received Cash (৳):')}</span>
                <input
                  type="number"
                  value={tenderCashAmount}
                  onChange={e => setTenderCashAmount(e.target.value)}
                  placeholder={String(grandTotal)}
                  className="w-24 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-right font-bold text-slate-900 dark:text-white"
                />
              </div>
              {returnChange > 0 && (
                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                  <span>{t('ফেরত দিতে হবে:', 'Return Change:')}</span>
                  <span>{formatBDT(returnChange)}</span>
                </div>
              )}
            </div>
          )}

          {/* Due Bill Info */}
          {paymentMethod === 'due' && (
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs">
              <p className="text-rose-700 dark:text-rose-300 font-bold">
                ⚠️ {t('এই বিল সম্পূর্ণ গ্রাহকের বাকি খাতায় যোগ হবে', 'This bill will be recorded into customer due khata')}
              </p>
            </div>
          )}

          {/* Digital Mobile Payment TrxID */}
          {['bkash', 'nagad', 'rocket', 'upay'].includes(paymentMethod) && (
            <div className="space-y-1 text-xs">
              <input
                type="text"
                value={trxId}
                onChange={e => setTrxId(e.target.value)}
                placeholder={t('TrxID বা রেফারেন্স (ঐচ্ছিক)', 'TrxID or Reference (Optional)')}
                className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Complete Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-2xl text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 ${
              cart.length === 0
                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'
                : `${theme.primary} ${theme.primaryHover} shadow-teal-500/20`
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{t('বিক্রি সম্পন্ন ও ক্যাশ মেমো প্রিন্ট', 'Complete Sale & Print Receipt')}</span>
          </button>

        </div>

      </div>

      <BarcodeScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onDetected={handleBarcodeDetected} />

      {/* Modal: Quick Create Customer */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm animate-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">
              {t('নতুন গ্রাহক যোগ করুন', 'Add New Customer')}
            </h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('গ্রাহকের নাম *', 'Customer Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  placeholder="যেমন: রফিকুল ইসলাম"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('মোবাইল নম্বর', 'Phone Number')}
                </label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                  placeholder="01712-XXXXXX"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('ঠিকানা / বিবরণ', 'Address / Details')}
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={e => setNewCustAddress(e.target.value)}
                  placeholder="বাজার রোড"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  {t('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold ${theme.primary}`}
                >
                  {t('সংরক্ষণ করুন', 'Save Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Custom Item */}
      {customItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm animate-in zoom-in-95">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">
              {t('কাস্টম আইটেম / সরাসরি সেবা যোগ', 'Add Custom Sale Item')}
            </h3>
            <form onSubmit={handleAddCustomItem} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('আইটেম / সেবার বিবরণ *', 'Item / Service Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={customItemName}
                  onChange={e => setCustomItemName(e.target.value)}
                  placeholder="যেমন: ফ্লেক্সিলোড ১০০ টাকা / পাসপোর্ট ছবি এমার্জেন্সি"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('বিক্রয় মূল্য (৳) *', 'Sale Price (৳) *')}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={customItemPrice}
                  onChange={e => setCustomItemPrice(e.target.value)}
                  placeholder="100"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {t('ক্যাটাগরি', 'Category')}
                </label>
                <select
                  value={customItemCat}
                  onChange={e => setCustomItemCat(e.target.value as ProductCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                >
                  <option value="telecom">Telecom / Flexiload</option>
                  <option value="mobile_banking">Mobile Banking</option>
                  <option value="photo_studio">Photo Studio</option>
                  <option value="stationery">Stationery</option>
                  <option value="electric">Electric</option>
                  <option value="gadget">Gadget</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomItemModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  {t('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold ${theme.primary}`}
                >
                  {t('কার্টে যোগ করুন', 'Add to Cart')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
