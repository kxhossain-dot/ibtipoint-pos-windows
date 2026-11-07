export type ProductCategory = 
  | 'telecom'
  | 'mobile_banking'
  | 'photo_studio'
  | 'stationery'
  | 'electric'
  | 'gadget'
  | 'other';

export type ProductQuality = 
  | 'Original'
  | 'Grade A'
  | '1:1 Master Copy'
  | 'Standard'
  | 'Premium'
  | 'Economy'
  | 'Custom';

export interface Product {
  id: string;
  name: string;
  nameBn?: string;
  category: ProductCategory;
  sku: string;
  barcode?: string;
  buyPrice: number;    // Wholesale / Purchase rate
  salePrice: number;   // Retail / MRP
  stock: number;
  unit: string;        // pcs, pack, roll, box, etc.
  quality: ProductQuality | string; // Editable quality attribute
  warranty?: string;   // e.g. "6 Months", "No Warranty", "7 Days Replacement"
  minStockAlert: number;
  description?: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
  discount: number; // Discount per item or flat
  subtotal: number;
  note?: string;
}

export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'rocket' | 'upay' | 'due' | 'split';

export interface SaleOrder {
  id: string;
  invoiceNo: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentDetails?: {
    cash?: number;
    digital?: number;
    digitalProvider?: 'bkash' | 'nagad' | 'rocket' | 'upay';
    trxId?: string;
  };
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  servedBy: string; // Admin or Staff name
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  creditLimit: number;
  totalDue: number;
  totalSpent: number;
  createdAt: string;
  notes?: string;
}

export interface KhataTransaction {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  type: 'due_added' | 'payment_received';
  amount: number;
  balanceAfter: number;
  paymentMethod?: PaymentMethod;
  orderId?: string;
  note?: string;
  recordedBy: string;
}

export type ExpenseCategory = 
  | 'rent'
  | 'electricity'
  | 'staff_salary'
  | 'tea_snacks'
  | 'transport'
  | 'internet_bills'
  | 'maintenance'
  | 'shop_supplies'
  | 'other';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  categoryName?: string;
  amount: number;
  paidFrom: 'cash_drawer' | 'bkash' | 'nagad' | 'bank';
  note: string;
  recordedBy: string;
}

export type MobileBankingProvider = 'bkash' | 'nagad' | 'rocket' | 'upay';
export type MobileBankingTxType = 'cash_in' | 'cash_out' | 'send_money' | 'balance_add' | 'commission';

export interface MobileBankingTransaction {
  id: string;
  date: string;
  provider: MobileBankingProvider;
  type: MobileBankingTxType;
  customerPhone: string;
  amount: number;
  fee: number;
  commission: number;
  trxId?: string;
  note?: string;
  recordedBy: string;
}

export interface MobileBankingAccount {
  provider: MobileBankingProvider;
  accountType: 'Agent' | 'Personal';
  accountNumber: string;
  currentBalance: number; // Digital balance on SIM
  todayCashIn: number;
  todayCashOut: number;
  totalCommission: number;
}

export type StudioJobStatus = 'pending' | 'processing' | 'ready' | 'delivered';

export interface PhotoStudioJob {
  id: string;
  tokenNo: string;
  date: string;
  customerName: string;
  customerPhone: string;
  serviceType: 'Passport Photo' | 'Stamp Photo' | 'Visa 2x2' | 'Studio Portrait' | 'Photo Print 4R/3R' | 'Photo Frame' | 'Lamination' | 'Document Scan' | 'Graphic Design';
  copies: number;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  status: StudioJobStatus;
  deliveryDate: string;
  note?: string;
}

export interface BusinessProfile {
  name: string;
  tagline: string;
  phone: string;
  altPhone?: string;
  email?: string;
  address: string;
  proprietor: string;
  vatRegNo?: string;
  footerNote: string;
  thermalWidth: '58mm' | '80mm';
}

export type UserRole = 'admin' | 'staff';

export interface AppSettings {
  adminPin: string;
  staffPin: string;
  business: BusinessProfile;
  enableVat: boolean;
  defaultVatPercent: number;
  themeColor: 'teal' | 'emerald' | 'indigo' | 'crimson' | 'purple' | 'amber';
  receiptPaper?: 'memo' | 'a4' | 'thermal80';
  googleClientId?: string;
  themeMode: 'light' | 'dark' | 'system';
  language: 'bn' | 'en';
}
