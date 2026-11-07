import { Product, Customer, Expense, MobileBankingAccount, PhotoStudioJob, AppSettings, SaleOrder, KhataTransaction } from '../types';

export const initialSettings: AppSettings = {
  adminPin: '1234',
  staffPin: '0000',
  business: {
    name: 'ibtipoint',
    tagline: 'Telecom, Mobile Banking, Photo Studio & Electronics Solution',
    phone: '',
    altPhone: '',
    email: 'ibtipoint.bd@gmail.com',
    address: 'Station Road, Main Bazar, Bangladesh',
    proprietor: '',
    vatRegNo: '',
    footerNote: 'ধন্যবাদ! আবার আসবেন।',
    thermalWidth: '80mm',
  },
  enableVat: false,
  defaultVatPercent: 5,
  themeColor: 'teal',
  themeMode: 'light',
  language: 'bn',
};

// Clean out-of-the-box store state (User will add or import via Excel after install)
export const initialProducts: Product[] = [];
export const initialCustomers: Customer[] = [];
export const initialKhataTransactions: KhataTransaction[] = [];
export const initialExpenses: Expense[] = [];
export const initialOrders: SaleOrder[] = [];
export const initialStudioJobs: PhotoStudioJob[] = [];

export const initialMobileAccounts: MobileBankingAccount[] = [
  {
    provider: 'bkash',
    accountType: 'Agent',
    accountNumber: '',
    currentBalance: 0,
    todayCashIn: 0,
    todayCashOut: 0,
    totalCommission: 0,
  },
  {
    provider: 'nagad',
    accountType: 'Agent',
    accountNumber: '',
    currentBalance: 0,
    todayCashIn: 0,
    todayCashOut: 0,
    totalCommission: 0,
  },
  {
    provider: 'rocket',
    accountType: 'Agent',
    accountNumber: '',
    currentBalance: 0,
    todayCashIn: 0,
    todayCashOut: 0,
    totalCommission: 0,
  },
  {
    provider: 'upay',
    accountType: 'Agent',
    accountNumber: '',
    currentBalance: 0,
    todayCashIn: 0,
    todayCashOut: 0,
    totalCommission: 0,
  },
];

// Optional demo sample data for optional preview/testing in Settings
export const sampleProducts: Product[] = [
  {
    id: 'prod-g1',
    name: 'Remax 20W PD Type-C Fast Charger',
    nameBn: 'রেম্যাক্স ২০ ওয়াট পিডি ফাস্ট চার্জার',
    category: 'gadget',
    sku: 'RMX-20W-01',
    barcode: '890123456001',
    buyPrice: 380,
    salePrice: 550,
    stock: 24,
    unit: 'pcs',
    quality: 'Original',
    warranty: '6 Months',
    minStockAlert: 5,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-g2',
    name: 'Baseus 100W Type-C to Type-C Braided Cable',
    nameBn: 'বেসিয়াস ১০০ ওয়াট টাইপ-সি ফাস্ট ক্যাবল',
    category: 'gadget',
    sku: 'BAS-100W-02',
    barcode: '890123456002',
    buyPrice: 190,
    salePrice: 320,
    stock: 35,
    unit: 'pcs',
    quality: 'Original',
    warranty: '3 Months',
    minStockAlert: 8,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-e1',
    name: 'Havells 15W High Lumens LED Bulb (B22)',
    nameBn: 'হ্যাভেলস ১৫ ওয়াট হাই লুমেন এলইডি বাল্ব',
    category: 'electric',
    sku: 'HVL-15W-07',
    barcode: '890123456007',
    buyPrice: 145,
    salePrice: 220,
    stock: 65,
    unit: 'pcs',
    quality: 'Original',
    warranty: '1 Year Warranty',
    minStockAlert: 15,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-s1',
    name: 'Double A A4 80GSM Photocopy Paper (Ream - 500 Sheets)',
    nameBn: 'ডাবল এ এ৪ ৮০ জিএসএম কাগজ রিম',
    category: 'stationery',
    sku: 'DA-A4-80-10',
    barcode: '890123456010',
    buyPrice: 420,
    salePrice: 500,
    stock: 40,
    unit: 'ream',
    quality: 'Original',
    warranty: 'Sealed Pack',
    minStockAlert: 10,
    updatedAt: new Date().toISOString(),
  },
];

export const sampleCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Md. Rafiqul Islam (Shopkeeper)',
    phone: '01711-223344',
    address: 'Chowrasta Bazar, Shop #12',
    creditLimit: 15000,
    totalDue: 3450,
    totalSpent: 42600,
    createdAt: '2026-08-10',
    notes: 'Regular customer, pays weekly',
  },
  {
    id: 'cust-2',
    name: 'Kamrul Hasan (Teacher)',
    phone: '01819-887766',
    address: 'Govt High School Para',
    creditLimit: 8000,
    totalDue: 1200,
    totalSpent: 18500,
    createdAt: '2026-09-02',
    notes: 'Takes photo studio prints & stationery',
  },
];
