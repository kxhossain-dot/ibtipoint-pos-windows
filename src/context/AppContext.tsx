import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Customer,
  KhataTransaction,
  Expense,
  SaleOrder,
  MobileBankingAccount,
  MobileBankingTransaction,
  PhotoStudioJob,
  AppSettings,
  UserRole,
  CartItem,
  PaymentMethod,
  ProductCategory,
  ProductQuality
} from '../types';
import { parseProductsExcel } from '../utils/excelHelper';
import {
  initialProducts,
  initialCustomers,
  initialKhataTransactions,
  initialExpenses,
  initialOrders,
  initialMobileAccounts,
  initialStudioJobs,
  initialSettings,
  sampleProducts,
  sampleCustomers
} from '../data/initialData';
import { localDateStr } from '../utils/date';

interface AppContextType {
  // Navigation & UI State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: UserRole;
  isUnlocked: boolean;
  unlockWithPin: (pin: string) => boolean;
  lockToStaff: () => void;
  switchToRole: (role: UserRole, pin?: string) => boolean;

  // Settings & Theme
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  t: (bn: string, en: string) => string;
  formatBDT: (amount: number) => string;

  // Inventory
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => boolean;
  bulkSetProducts: (products: Product[]) => void;
  quickUpdateRateAndQuality: (id: string, buyPrice: number, salePrice: number, quality: string, stock: number) => void;

  // POS & Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQty: (productId: string, quantity: number) => void;
  updateCartCustomPrice: (productId: string, price: number) => void;
  updateCartDiscount: (productId: string, discount: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  processSale: (saleData: {
    paymentMethod: PaymentMethod;
    paidAmount: number;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    overallDiscount?: number;
    notes?: string;
    digitalDetails?: { provider: 'bkash' | 'nagad' | 'rocket' | 'upay'; trxId?: string };
  }) => SaleOrder | null;

  // Orders & Invoices
  orders: SaleOrder[];
  latestOrder: SaleOrder | null;
  setLatestOrder: (order: SaleOrder | null) => void;

  // Customer Due Khata
  customers: Customer[];
  khataTransactions: KhataTransaction[];
  addCustomer: (cust: Omit<Customer, 'id' | 'totalDue' | 'totalSpent' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  bulkSetCustomers: (customers: Customer[]) => void;
  recordKhataPayment: (customerId: string, amount: number, paymentMethod: PaymentMethod, note?: string) => void;
  addKhataManualDue: (customerId: string, amount: number, note: string) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => boolean;

  // Mobile Banking
  mobileAccounts: MobileBankingAccount[];
  mobileTransactions: MobileBankingTransaction[];
  recordMobileTransaction: (tx: Omit<MobileBankingTransaction, 'id' | 'date' | 'recordedBy'>) => void;
  updateMobileAccountBalance: (provider: string, newBalance: number) => void;

  // Photo Studio
  studioJobs: PhotoStudioJob[];
  addStudioJob: (job: Omit<PhotoStudioJob, 'id' | 'tokenNo' | 'date'>) => PhotoStudioJob;
  updateStudioJobStatus: (id: string, status: PhotoStudioJob['status']) => void;
  recordStudioJobPayment: (id: string, paymentAmount: number) => void;

  // Data Reset & Backup
  exportAllDataJSON: () => void;
  getBackupJSON: () => string;
  importAllDataJSON: (jsonString: string) => boolean;
  resetToSampleData: () => void;
  resetCleanForProduction: () => void;
  factoryResetEverything: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// One-time clean reset for fresh store launch: clear leftover demo data.
// Runs once at module load (not on every render) so state initialisers read clean storage.
(() => {
  const CLEAN_STATE_KEY = 'ibtipoint_clean_v3_ready';
  try {
    if (typeof window !== 'undefined' && localStorage.getItem(CLEAN_STATE_KEY) !== 'yes') {
      const demoKeys = ['products', 'customers', 'khata_tx', 'expenses', 'orders', 'studio_jobs', 'mobile_tx'];
      demoKeys.forEach(k => localStorage.removeItem(`ibtipoint_${k}`));
      localStorage.setItem(CLEAN_STATE_KEY, 'yes');
    }
  } catch (e) {
    console.error('Clean initialization check failed', e);
  }
})();

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  // Load LocalStorage helper
  const loadState = <T,>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(`ibtipoint_${key}`);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage`, e);
      return fallback;
    }
  };

  const saveState = (key: string, value: any) => {
    try {
      localStorage.setItem(`ibtipoint_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage`, e);
    }
  };

  // State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true); // default admin session

  const [settings, setSettings] = useState<AppSettings>(() => loadState('settings', initialSettings));
  const [products, setProducts] = useState<Product[]>(() => loadState('products', initialProducts));
  const [customers, setCustomers] = useState<Customer[]>(() => loadState('customers', initialCustomers));
  const [khataTransactions, setKhataTransactions] = useState<KhataTransaction[]>(() => loadState('khata_tx', initialKhataTransactions));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadState('expenses', initialExpenses));
  const [orders, setOrders] = useState<SaleOrder[]>(() => loadState('orders', initialOrders));
  const [mobileAccounts, setMobileAccounts] = useState<MobileBankingAccount[]>(() => loadState('mobile_acc', initialMobileAccounts));
  const [mobileTransactions, setMobileTransactions] = useState<MobileBankingTransaction[]>(() => loadState('mobile_tx', []));
  const [studioJobs, setStudioJobs] = useState<PhotoStudioJob[]>(() => loadState('studio_jobs', initialStudioJobs));

  const [cart, setCart] = useState<CartItem[]>([]);
  const [latestOrder, setLatestOrder] = useState<SaleOrder | null>(null);

  // Sync to LocalStorage on updates
  useEffect(() => { saveState('settings', settings); }, [settings]);
  useEffect(() => { saveState('products', products); }, [products]);
  useEffect(() => { saveState('customers', customers); }, [customers]);
  useEffect(() => { saveState('khata_tx', khataTransactions); }, [khataTransactions]);
  useEffect(() => { saveState('expenses', expenses); }, [expenses]);
  useEffect(() => { saveState('orders', orders); }, [orders]);
  useEffect(() => { saveState('mobile_acc', mobileAccounts); }, [mobileAccounts]);
  useEffect(() => { saveState('mobile_tx', mobileTransactions); }, [mobileTransactions]);
  useEffect(() => { saveState('studio_jobs', studioJobs); }, [studioJobs]);

  // Sync Dark/Light class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (settings.themeMode === 'dark') {
      root.classList.add('dark');
    } else if (settings.themeMode === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [settings.themeMode]);

  // First launch: auto-import bundled seed spreadsheet(s) from src/data/seed/*.xlsx
  useEffect(() => {
    const SEED_KEY = 'ibtipoint_seed_imported_v1';
    try {
      if (localStorage.getItem(SEED_KEY) === 'yes') return;
      const urls = Object.values(
        import.meta.glob('../data/seed/*.xlsx', { query: '?url', import: 'default', eager: true })
      ) as string[];
      if (urls.length === 0) return;
      (async () => {
        let merged: Product[] = products;
        for (const url of urls) {
          const blob = await (await fetch(url)).blob();
          const file = new File([blob], 'seed.xlsx');
          const res = await parseProductsExcel(file, merged);
          merged = res.products;
        }
        setProducts(merged);
        localStorage.setItem(SEED_KEY, 'yes');
      })().catch(err => console.error('Seed import failed', err));
    } catch (e) {
      console.error('Seed import check failed', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helpers
  const t = (bn: string, en: string) => {
    return settings.language === 'bn' ? bn : en;
  };

  const formatBDT = (amount: number) => {
    const formatted = Math.round(amount).toLocaleString('en-IN');
    return `৳${formatted}`;
  };

  // Auth / Role management
  const unlockWithPin = (pin: string): boolean => {
    if (pin === settings.adminPin) {
      setCurrentRole('admin');
      setIsUnlocked(true);
      return true;
    }
    if (pin === settings.staffPin) {
      setCurrentRole('staff');
      setIsUnlocked(true);
      return true;
    }
    return false;
  };

  const lockToStaff = () => {
    setCurrentRole('staff');
    setIsUnlocked(false);
  };

  const switchToRole = (role: UserRole, pin?: string): boolean => {
    if (role === 'staff') {
      setCurrentRole('staff');
      return true;
    }
    if (role === 'admin') {
      if (pin === settings.adminPin) {
        setCurrentRole('admin');
        setIsUnlocked(true);
        return true;
      }
      return false;
    }
    return false;
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Inventory actions
  const addProduct = (prodData: Omit<Product, 'id' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
  };

  const deleteProduct = (id: string): boolean => {
    if (currentRole !== 'admin') return false;
    setProducts(prev => prev.filter(p => p.id !== id));
    return true;
  };

  const bulkSetProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
  };

  const quickUpdateRateAndQuality = (id: string, buyPrice: number, salePrice: number, quality: string, stock: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          buyPrice,
          salePrice,
          quality,
          stock,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    }));
  };

  // POS / Cart Actions
  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.customPrice ?? item.product.salePrice) * (item.quantity + quantity) - item.discount,
              }
            : item
        );
      }
      const initialPrice = product.salePrice;
      return [
        ...prev,
        {
          product,
          quantity,
          customPrice: initialPrice,
          discount: 0,
          subtotal: initialPrice * quantity,
        },
      ];
    });
  };

  const updateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const price = item.customPrice ?? item.product.salePrice;
          return {
            ...item,
            quantity,
            subtotal: price * quantity - item.discount,
          };
        }
        return item;
      })
    );
  };

  const updateCartCustomPrice = (productId: string, price: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          return {
            ...item,
            customPrice: price,
            subtotal: price * item.quantity - item.discount,
          };
        }
        return item;
      })
    );
  };

  const updateCartDiscount = (productId: string, discount: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const price = item.customPrice ?? item.product.salePrice;
          return {
            ...item,
            discount: Math.max(0, discount),
            subtotal: Math.max(0, price * item.quantity - discount),
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const processSale = ({
    paymentMethod,
    paidAmount,
    customerId,
    customerName,
    customerPhone,
    overallDiscount = 0,
    notes,
    digitalDetails,
  }: {
    paymentMethod: PaymentMethod;
    paidAmount: number;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    overallDiscount?: number;
    notes?: string;
    digitalDetails?: { provider: 'bkash' | 'nagad' | 'rocket' | 'upay'; trxId?: string };
  }): SaleOrder | null => {
    if (cart.length === 0) return null;

    const subtotal = cart.reduce((sum, item) => sum + (item.customPrice ?? item.product.salePrice) * item.quantity, 0);
    const itemDiscounts = cart.reduce((sum, item) => sum + item.discount, 0);
    const totalDiscount = itemDiscounts + overallDiscount;
    const tax = settings.enableVat ? (subtotal - totalDiscount) * (settings.defaultVatPercent / 100) : 0;
    const grandTotal = Math.max(0, subtotal - totalDiscount + tax);
    const due = Math.max(0, grandTotal - paidAmount);

    const now = new Date();
    const invoiceNo = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(orders.length + 1).padStart(3, '0')}`;

    const newOrder: SaleOrder = {
      id: `ord-${Date.now()}`,
      invoiceNo,
      date: `${localDateStr(now)} ${now.toTimeString().substring(0, 5)}`,
      items: [...cart],
      subtotal,
      discount: totalDiscount,
      tax,
      total: grandTotal,
      paidAmount,
      dueAmount: due,
      paymentMethod,
      customerId,
      customerName: customerName || (customerId ? customers.find(c => c.id === customerId)?.name : 'Walk-in Customer'),
      customerPhone: customerPhone || (customerId ? customers.find(c => c.id === customerId)?.phone : ''),
      servedBy: currentRole === 'admin' ? 'Admin' : 'Staff',
      notes,
      paymentDetails: digitalDetails ? {
        digital: paidAmount,
        digitalProvider: digitalDetails.provider,
        trxId: digitalDetails.trxId,
      } : undefined,
    };

    // 1. Decrement Stock for tangible products
    setProducts(prev =>
      prev.map(p => {
        const inCart = cart.find(ci => ci.product.id === p.id);
        if (inCart) {
          return {
            ...p,
            stock: Math.max(0, p.stock - inCart.quantity),
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    // 2. If customer has due, record to Customer Khata automatically!
    if (due > 0 && customerId) {
      addKhataManualDue(customerId, due, `Due from invoice #${invoiceNo}`);
    }

    // 3. Update customer total spent
    if (customerId) {
      setCustomers(prev =>
        prev.map(c => c.id === customerId ? { ...c, totalSpent: c.totalSpent + grandTotal } : c)
      );
    }

    // 4. Save order
    setOrders(prev => [newOrder, ...prev]);
    setLatestOrder(newOrder);
    clearCart();

    return newOrder;
  };

  // Khata / Customer methods
  const addCustomer = (custData: Omit<Customer, 'id' | 'totalDue' | 'totalSpent' | 'createdAt'>): Customer => {
    const newCust: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      totalDue: 0,
      totalSpent: 0,
      createdAt: localDateStr(),
    };
    setCustomers(prev => [newCust, ...prev]);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const bulkSetCustomers = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
  };

  const recordKhataPayment = (customerId: string, amount: number, paymentMethod: PaymentMethod, note?: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || amount <= 0) return;

    const newDue = Math.max(0, customer.totalDue - amount);
    const now = new Date();
    const dateStr = `${localDateStr(now)} ${now.toTimeString().substring(0, 5)}`;

    const tx: KhataTransaction = {
      id: `ktx-${Date.now()}`,
      customerId,
      customerName: customer.name,
      date: dateStr,
      type: 'payment_received',
      amount,
      balanceAfter: newDue,
      paymentMethod,
      note: note || 'Due payment received / বাকি পরিশোধ গ্রহণ',
      recordedBy: currentRole === 'admin' ? 'Admin' : 'Staff',
    };

    setKhataTransactions(prev => [tx, ...prev]);
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, totalDue: newDue } : c));
  };

  const addKhataManualDue = (customerId: string, amount: number, note: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || amount <= 0) return;

    const newDue = customer.totalDue + amount;
    const now = new Date();
    const dateStr = `${localDateStr(now)} ${now.toTimeString().substring(0, 5)}`;

    const tx: KhataTransaction = {
      id: `ktx-${Date.now()}`,
      customerId,
      customerName: customer.name,
      date: dateStr,
      type: 'due_added',
      amount,
      balanceAfter: newDue,
      note,
      recordedBy: currentRole === 'admin' ? 'Admin' : 'Staff',
    };

    setKhataTransactions(prev => [tx, ...prev]);
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, totalDue: newDue } : c));
  };

  // Expenses
  const addExpense = (expData: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...expData,
      id: `exp-${Date.now()}`,
    };
    setExpenses(prev => [newExp, ...prev]);
  };

  const deleteExpense = (id: string): boolean => {
    if (currentRole !== 'admin') return false;
    setExpenses(prev => prev.filter(e => e.id !== id));
    return true;
  };

  // Mobile Banking
  const recordMobileTransaction = (txData: Omit<MobileBankingTransaction, 'id' | 'date' | 'recordedBy'>) => {
    const now = new Date();
    const dateStr = `${localDateStr(now)} ${now.toTimeString().substring(0, 5)}`;
    const newTx: MobileBankingTransaction = {
      ...txData,
      id: `mbtx-${Date.now()}`,
      date: dateStr,
      recordedBy: currentRole === 'admin' ? 'Admin' : 'Staff',
    };

    // Update account balance
    setMobileAccounts(prev =>
      prev.map(acc => {
        if (acc.provider === txData.provider) {
          let updatedBal = acc.currentBalance;
          let todayIn = acc.todayCashIn;
          let todayOut = acc.todayCashOut;
          let totalComm = acc.totalCommission + (txData.commission || 0);

          if (txData.type === 'cash_in') {
            // Customer gives cash, agent SIM balance decreases
            updatedBal -= txData.amount;
            todayIn += txData.amount;
          } else if (txData.type === 'cash_out') {
            // Customer sends digital money, agent SIM balance increases, agent pays physical cash
            updatedBal += txData.amount;
            todayOut += txData.amount;
          } else if (txData.type === 'balance_add') {
            updatedBal += txData.amount;
          }

          return {
            ...acc,
            currentBalance: updatedBal,
            todayCashIn: todayIn,
            todayCashOut: todayOut,
            totalCommission: totalComm,
          };
        }
        return acc;
      })
    );

    setMobileTransactions(prev => [newTx, ...prev]);
  };

  const updateMobileAccountBalance = (provider: string, newBalance: number) => {
    setMobileAccounts(prev =>
      prev.map(acc => acc.provider === provider ? { ...acc, currentBalance: newBalance } : acc)
    );
  };

  // Photo Studio
  const addStudioJob = (jobData: Omit<PhotoStudioJob, 'id' | 'tokenNo' | 'date'>): PhotoStudioJob => {
    const now = new Date();
    const tokenNo = `ST-${100 + studioJobs.length + 1}`;
    const newJob: PhotoStudioJob = {
      ...jobData,
      id: `job-${Date.now()}`,
      tokenNo,
      date: `${localDateStr(now)} ${now.toTimeString().substring(0, 5)}`,
    };
    setStudioJobs(prev => [newJob, ...prev]);
    return newJob;
  };

  const updateStudioJobStatus = (id: string, status: PhotoStudioJob['status']) => {
    setStudioJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
  };

  const recordStudioJobPayment = (id: string, paymentAmount: number) => {
    setStudioJobs(prev =>
      prev.map(j => {
        if (j.id === id) {
          const newAdvance = j.advancePaid + paymentAmount;
          const newDue = Math.max(0, j.totalAmount - newAdvance);
          return {
            ...j,
            advancePaid: newAdvance,
            dueAmount: newDue,
          };
        }
        return j;
      })
    );
  };

  // Backup & Restore
  const getBackupJSON = (): string => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      business: settings.business,
      settings,
      products,
      customers,
      khataTransactions,
      expenses,
      orders,
      mobileAccounts,
      mobileTransactions,
      studioJobs,
    };
    return JSON.stringify(backup, null, 2);
  };

  const exportAllDataJSON = () => {
    const blob = new Blob([getBackupJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ibtipoint_full_backup_${localDateStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importAllDataJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.products) setProducts(data.products);
      if (data.customers) setCustomers(data.customers);
      if (data.khataTransactions) setKhataTransactions(data.khataTransactions);
      if (data.expenses) setExpenses(data.expenses);
      if (data.orders) setOrders(data.orders);
      if (data.mobileAccounts) setMobileAccounts(data.mobileAccounts);
      if (data.mobileTransactions) setMobileTransactions(data.mobileTransactions);
      if (data.studioJobs) setStudioJobs(data.studioJobs);
      if (data.settings) setSettings(data.settings);
      return true;
    } catch (e) {
      console.error('Failed to import JSON data', e);
      return false;
    }
  };

  const resetToSampleData = () => {
    saveState('products', sampleProducts);
    saveState('customers', sampleCustomers);
    saveState('khata_tx', []);
    saveState('expenses', []);
    saveState('orders', []);
    saveState('mobile_acc', initialMobileAccounts);
    saveState('mobile_tx', []);
    saveState('studio_jobs', []);
    saveState('settings', initialSettings);

    setProducts(sampleProducts);
    setCustomers(sampleCustomers);
    setKhataTransactions([]);
    setExpenses([]);
    setOrders([]);
    setMobileAccounts(initialMobileAccounts);
    setMobileTransactions([]);
    setStudioJobs([]);
    setSettings(initialSettings);
    setCart([]);
    setLatestOrder(null);
  };

  // Clean Reset for Real Store Launch (Keep zero test records)
  const resetCleanForProduction = () => {
    setOrders([]);
    setLatestOrder(null);
    setKhataTransactions([]);
    setExpenses([]);
    setMobileTransactions([]);
    setStudioJobs([]);
    setCart([]);
    setCustomers([]);
    // Product catalog (names, rates, stock) is intentionally kept.
    setMobileAccounts(initialMobileAccounts);
  };

  // Factory Reset: Completely wipe all data & restart 100% clean
  const factoryResetEverything = () => {
    try { localStorage.removeItem('ibtipoint_seed_imported_v1'); } catch (e) {}
    const keys = ['settings', 'products', 'customers', 'khata_tx', 'expenses', 'orders', 'mobile_acc', 'mobile_tx', 'studio_jobs'];
    keys.forEach(k => {
      try { localStorage.removeItem(`ibtipoint_${k}`); } catch (e) {}
    });
    setOrders([]);
    setLatestOrder(null);
    setKhataTransactions([]);
    setExpenses([]);
    setMobileTransactions([]);
    setStudioJobs([]);
    setCart([]);
    setCustomers([]);
    setProducts([]);
    setMobileAccounts(initialMobileAccounts);
    setSettings(initialSettings);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentRole,
        isUnlocked,
        unlockWithPin,
        lockToStaff,
        switchToRole,
        settings,
        updateSettings,
        t,
        formatBDT,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        bulkSetProducts,
        quickUpdateRateAndQuality,
        cart,
        addToCart,
        updateCartQty,
        updateCartCustomPrice,
        updateCartDiscount,
        removeFromCart,
        clearCart,
        processSale,
        orders,
        latestOrder,
        setLatestOrder,
        customers,
        khataTransactions,
        addCustomer,
        updateCustomer,
        bulkSetCustomers,
        recordKhataPayment,
        addKhataManualDue,
        expenses,
        addExpense,
        deleteExpense,
        mobileAccounts,
        mobileTransactions,
        recordMobileTransaction,
        updateMobileAccountBalance,
        studioJobs,
        addStudioJob,
        updateStudioJobStatus,
        recordStudioJobPayment,
        exportAllDataJSON,
        getBackupJSON,
        importAllDataJSON,
        resetToSampleData,
        resetCleanForProduction,
        factoryResetEverything,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
