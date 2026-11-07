// xlsx is large (~400 KB): load it only when an import/export is actually used
let xlsxPromise: Promise<typeof import('xlsx')> | null = null;
const loadXLSX = () => (xlsxPromise ??= import('xlsx'));
import { Product, ProductCategory, Customer } from '../types';
import { localDateStr } from './date';

export interface ProductExcelImportResult {
  added: number;
  updated: number;
  errors: string[];
  products: Product[];
}

export interface CustomerExcelImportResult {
  added: number;
  updated: number;
  errors: string[];
  customers: Customer[];
}

export interface CompleteStoreExcelImportResult {
  products: ProductExcelImportResult;
  customers: CustomerExcelImportResult;
}

// ==========================================
// 1. INVENTORY / PRODUCTS EXCEL UTILITIES
// ==========================================

export async function exportProductsToExcel(products: Product[], filename?: string) {
  const XLSX = await loadXLSX();
  const data = products.map((p, index) => ({
    'SL': index + 1,
    'Product ID': p.id,
    'Name (English)': p.name,
    'Name (Bangla)': p.nameBn || '',
    'Category': p.category,
    'SKU / Code': p.sku,
    'Barcode': p.barcode || '',
    'Buy Price (৳)': p.buyPrice,
    'Sale Price (৳)': p.salePrice,
    'Stock Qty': p.stock,
    'Unit': p.unit,
    'Quality': p.quality,
    'Warranty': p.warranty || '',
    'Min Stock Alert': p.minStockAlert,
    'Updated At': p.updatedAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // SL
    { wch: 16 }, // ID
    { wch: 35 }, // Name EN
    { wch: 30 }, // Name BN
    { wch: 15 }, // Category
    { wch: 16 }, // SKU
    { wch: 16 }, // Barcode
    { wch: 14 }, // Buy Price
    { wch: 14 }, // Sale Price
    { wch: 12 }, // Stock
    { wch: 8 },  // Unit
    { wch: 18 }, // Quality
    { wch: 16 }, // Warranty
    { wch: 14 }, // Alert
    { wch: 22 }, // Date
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory_Products');

  const finalName = filename || `ibtipoint_inventory_${localDateStr()}.xlsx`;
  XLSX.writeFile(workbook, finalName);
}

export async function downloadProductExcelTemplate() {
  const XLSX = await loadXLSX();
  const sampleData = [
    {
      'Product ID': '',
      'Name (English)': 'Fast Charger 25W Type-C',
      'Name (Bangla)': '২৫ ওয়াট ফাস্ট চার্জার',
      'Category': 'gadget',
      'SKU / Code': 'FC-25W-01',
      'Barcode': '890123450001',
      'Buy Price (৳)': 350,
      'Sale Price (৳)': 500,
      'Stock Qty': 20,
      'Unit': 'pcs',
      'Quality': 'Original',
      'Warranty': '6 Months',
      'Min Stock Alert': 5,
    },
    {
      'Product ID': '',
      'Name (English)': 'LED Bulb 12W Super Bright',
      'Name (Bangla)': '১২ ওয়াট এলইডি বাল্ব',
      'Category': 'electric',
      'SKU / Code': 'LED-12W-01',
      'Barcode': '890123450002',
      'Buy Price (৳)': 120,
      'Sale Price (৳)': 180,
      'Stock Qty': 50,
      'Unit': 'pcs',
      'Quality': 'Grade A',
      'Warranty': '1 Year',
      'Min Stock Alert': 10,
    },
    {
      'Product ID': '',
      'Name (English)': 'Matador Pen Ballpoint (Box)',
      'Name (Bangla)': 'ম্যাটাডোর কলম বক্স',
      'Category': 'stationery',
      'SKU / Code': 'MAT-BOX-01',
      'Barcode': '890123450003',
      'Buy Price (৳)': 85,
      'Sale Price (৳)': 100,
      'Stock Qty': 40,
      'Unit': 'box',
      'Quality': 'Standard',
      'Warranty': 'None',
      'Min Stock Alert': 5,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 32 },
    { wch: 25 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 8 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Product_Template');
  XLSX.writeFile(workbook, 'ibtipoint_products_template.xlsx');
}

export async function parseProductsExcel(file: File, existingProducts: Product[]): Promise<ProductExcelImportResult> {
  const XLSX = await loadXLSX();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Find sheet: either 'Inventory_Products', 'Products', or first sheet
        const sheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('prod') || s.toLowerCase().includes('invent')) || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve({ added: 0, updated: 0, errors: ['File is empty / ফাইলে কোন পণ্য পাওয়া যায়নি'], products: existingProducts });
          return;
        }

        const errors: string[] = [];
        let addedCount = 0;
        let updatedCount = 0;
        const currentProducts = [...existingProducts];

        rawJson.forEach((row, index) => {
          const rowNum = index + 2;
          
          const id = String(row['Product ID'] || row['ID'] || row['id'] || '').trim();
          const name = String(row['Name (English)'] || row['Name'] || row['Item Name'] || row['নাম'] || row['পণ্যের নাম'] || '').trim();
          const nameBn = String(row['Name (Bangla)'] || row['বাংলা নাম'] || '').trim();
          const rawCat = String(row['Category'] || row['ক্যাটাগরি'] || 'gadget').toLowerCase().trim();
          const sku = String(row['SKU / Code'] || row['SKU'] || row['Code'] || row['কোড'] || `SKU-${Date.now()}-${index}`).trim();
          const barcode = String(row['Barcode'] || row['বারকোড'] || '').trim();
          
          const buyPrice = parseFloat(String(row['Buy Price (৳)'] || row['Buy Price'] || row['ক্রয় মূল্য'] || row['Wholesale'] || '0'));
          const salePrice = parseFloat(String(row['Sale Price (৳)'] || row['Sale Price'] || row['বিক্রয় মূল্য'] || row['MRP'] || '0'));
          const stock = parseInt(String(row['Stock Qty'] || row['Stock'] || row['মজুদ'] || '0'), 10);
          const unit = String(row['Unit'] || row['একক'] || 'pcs').trim();
          const quality = String(row['Quality'] || row['গুণমান'] || 'Original').trim();
          const warranty = String(row['Warranty'] || row['ওয়ারেন্টি'] || '').trim();
          const minStockAlert = parseInt(String(row['Min Stock Alert'] || row['Alert Stock'] || '5'), 10);

          if (!name) {
            errors.push(`Row ${rowNum}: Product name is missing / পণ্যের নাম দেওয়া হয়নি`);
            return;
          }

          let category: ProductCategory = 'other';
          if (rawCat.includes('gadget') || rawCat.includes('mobile') || rawCat.includes('accessory')) category = 'gadget';
          else if (rawCat.includes('electric') || rawCat.includes('ইলেকট্রিক')) category = 'electric';
          else if (rawCat.includes('stationery') || rawCat.includes('স্টেশনারি')) category = 'stationery';
          else if (rawCat.includes('photo') || rawCat.includes('studio') || rawCat.includes('ছবি')) category = 'photo_studio';
          else if (rawCat.includes('telecom') || rawCat.includes('sim') || rawCat.includes('টেলিকম')) category = 'telecom';
          else if (rawCat.includes('banking') || rawCat.includes('bkash') || rawCat.includes('ব্যাংকিং')) category = 'mobile_banking';

          // Match by ID or SKU
          const existingIdx = currentProducts.findIndex(p => (id && p.id === id) || (p.sku && p.sku.toLowerCase() === sku.toLowerCase()));

          if (existingIdx >= 0) {
            currentProducts[existingIdx] = {
              ...currentProducts[existingIdx],
              name: name || currentProducts[existingIdx].name,
              nameBn: nameBn || currentProducts[existingIdx].nameBn,
              category,
              buyPrice: isNaN(buyPrice) ? currentProducts[existingIdx].buyPrice : buyPrice,
              salePrice: isNaN(salePrice) ? currentProducts[existingIdx].salePrice : salePrice,
              stock: isNaN(stock) ? currentProducts[existingIdx].stock : stock,
              unit: unit || currentProducts[existingIdx].unit,
              quality: quality || currentProducts[existingIdx].quality,
              warranty: warranty || currentProducts[existingIdx].warranty,
              minStockAlert: isNaN(minStockAlert) ? currentProducts[existingIdx].minStockAlert : minStockAlert,
              barcode: barcode || currentProducts[existingIdx].barcode,
              updatedAt: new Date().toISOString(),
            };
            updatedCount++;
          } else {
            const newProd: Product = {
              id: id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name,
              nameBn,
              category,
              sku,
              barcode,
              buyPrice: isNaN(buyPrice) ? 0 : buyPrice,
              salePrice: isNaN(salePrice) ? 0 : salePrice,
              stock: isNaN(stock) ? 0 : stock,
              unit: unit || 'pcs',
              quality: quality || 'Original',
              warranty,
              minStockAlert: isNaN(minStockAlert) ? 5 : minStockAlert,
              updatedAt: new Date().toISOString(),
            };
            currentProducts.push(newProd);
            addedCount++;
          }
        });

        resolve({
          added: addedCount,
          updated: updatedCount,
          errors,
          products: currentProducts,
        });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

// ==========================================
// 2. CUSTOMER & KHATA EXCEL UTILITIES
// ==========================================

export async function exportCustomersToExcel(customers: Customer[], filename?: string) {
  const XLSX = await loadXLSX();
  const data = customers.map((c, index) => ({
    'SL': index + 1,
    'Customer ID': c.id,
    'Customer Name': c.name,
    'Mobile / Phone': c.phone,
    'Address': c.address || '',
    'Credit Limit (৳)': c.creditLimit,
    'Total Due (৳)': c.totalDue,
    'Total Spent (৳)': c.totalSpent,
    'Created Date': c.createdAt,
    'Notes / Reference': c.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 6 },  // SL
    { wch: 16 }, // ID
    { wch: 28 }, // Customer Name
    { wch: 18 }, // Mobile
    { wch: 30 }, // Address
    { wch: 16 }, // Credit Limit
    { wch: 14 }, // Total Due
    { wch: 15 }, // Total Spent
    { wch: 14 }, // Date
    { wch: 30 }, // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers_Khata');

  const finalName = filename || `ibtipoint_customers_${localDateStr()}.xlsx`;
  XLSX.writeFile(workbook, finalName);
}

export async function downloadCustomerExcelTemplate() {
  const XLSX = await loadXLSX();
  const sampleData = [
    {
      'Customer ID': '',
      'Customer Name': 'Md. Rafiqul Islam',
      'Mobile / Phone': '01711223344',
      'Address': 'Chowrasta Bazar, Main Road',
      'Credit Limit (৳)': 15000,
      'Total Due (৳)': 2500,
      'Notes / Reference': 'Regular customer, pays weekly',
    },
    {
      'Customer ID': '',
      'Customer Name': 'Kamrul Hasan Teacher',
      'Mobile / Phone': '01819887766',
      'Address': 'Govt High School Para',
      'Credit Limit (৳)': 8000,
      'Total Due (৳)': 1000,
      'Notes / Reference': 'Stationery & photo studio client',
    },
    {
      'Customer ID': '',
      'Customer Name': 'Haji Nurul Haque',
      'Mobile / Phone': '01912334455',
      'Address': 'East Para',
      'Credit Limit (৳)': 20000,
      'Total Due (৳)': 0,
      'Notes / Reference': 'Electric & electronics cash customer',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 28 },
    { wch: 18 },
    { wch: 30 },
    { wch: 16 },
    { wch: 14 },
    { wch: 32 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers_Template');
  XLSX.writeFile(workbook, 'ibtipoint_customers_template.xlsx');
}

export async function parseCustomersExcel(file: File, existingCustomers: Customer[]): Promise<CustomerExcelImportResult> {
  const XLSX = await loadXLSX();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Find sheet: either 'Customers_Khata', 'Customers', or first sheet
        const sheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('cust') || s.toLowerCase().includes('khata')) || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve({ added: 0, updated: 0, errors: ['File is empty / ফাইলে কোন কাস্টমার তথ্য পাওয়া যায়নি'], customers: existingCustomers });
          return;
        }

        const errors: string[] = [];
        let addedCount = 0;
        let updatedCount = 0;
        const currentCustomers = [...existingCustomers];

        rawJson.forEach((row, index) => {
          const rowNum = index + 2;

          const id = String(row['Customer ID'] || row['ID'] || row['id'] || '').trim();
          const name = String(row['Customer Name'] || row['Name'] || row['কাস্টমার নাম'] || row['নাম'] || row['গ্রাহকের নাম'] || '').trim();
          const phone = String(row['Mobile / Phone'] || row['Mobile'] || row['Phone'] || row['মোবাইল'] || row['ফোন'] || '').trim();
          const address = String(row['Address'] || row['ঠিকানা'] || '').trim();
          
          const creditLimit = parseFloat(String(row['Credit Limit (৳)'] || row['Credit Limit'] || row['বাকির সীমা'] || '10000'));
          const totalDue = parseFloat(String(row['Total Due (৳)'] || row['Total Due'] || row['Current Due'] || row['বাকি'] || row['বর্তমান বাকি'] || '0'));
          const totalSpent = parseFloat(String(row['Total Spent (৳)'] || row['Total Spent'] || row['মোট খরচ'] || '0'));
          const notes = String(row['Notes / Reference'] || row['Notes'] || row['Note'] || row['মন্তব্য'] || '').trim();

          if (!name) {
            errors.push(`Row ${rowNum}: Customer name is missing / কাস্টমার নাম দেওয়া হয়নি`);
            return;
          }

          // Match by ID or phone number
          const cleanPhone = phone.replace(/[^0-9]/g, '');
          const existingIdx = currentCustomers.findIndex(c => {
            if (id && c.id === id) return true;
            if (cleanPhone && c.phone) {
              const existingClean = c.phone.replace(/[^0-9]/g, '');
              return existingClean.length >= 10 && (existingClean === cleanPhone || existingClean.endsWith(cleanPhone) || cleanPhone.endsWith(existingClean));
            }
            return false;
          });

          if (existingIdx >= 0) {
            currentCustomers[existingIdx] = {
              ...currentCustomers[existingIdx],
              name: name || currentCustomers[existingIdx].name,
              phone: phone || currentCustomers[existingIdx].phone,
              address: address || currentCustomers[existingIdx].address,
              creditLimit: isNaN(creditLimit) ? currentCustomers[existingIdx].creditLimit : creditLimit,
              totalDue: isNaN(totalDue) ? currentCustomers[existingIdx].totalDue : totalDue,
              totalSpent: isNaN(totalSpent) ? currentCustomers[existingIdx].totalSpent : totalSpent,
              notes: notes || currentCustomers[existingIdx].notes,
            };
            updatedCount++;
          } else {
            const newCust: Customer = {
              id: id || `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name,
              phone: phone || '01XXXXXXXXX',
              address,
              creditLimit: isNaN(creditLimit) ? 10000 : creditLimit,
              totalDue: isNaN(totalDue) ? 0 : totalDue,
              totalSpent: isNaN(totalSpent) ? 0 : totalSpent,
              createdAt: localDateStr(),
              notes,
            };
            currentCustomers.push(newCust);
            addedCount++;
          }
        });

        resolve({
          added: addedCount,
          updated: updatedCount,
          errors,
          customers: currentCustomers,
        });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

// ==========================================
// 3. COMPLETE STORE MASTER EXCEL (ALL-IN-ONE)
// ==========================================

export async function exportCompleteStoreExcel(products: Product[], customers: Customer[], filename?: string) {
  const XLSX = await loadXLSX();
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Products
  const prodData = products.map((p, index) => ({
    'SL': index + 1,
    'Product ID': p.id,
    'Name (English)': p.name,
    'Name (Bangla)': p.nameBn || '',
    'Category': p.category,
    'SKU / Code': p.sku,
    'Barcode': p.barcode || '',
    'Buy Price (৳)': p.buyPrice,
    'Sale Price (৳)': p.salePrice,
    'Stock Qty': p.stock,
    'Unit': p.unit,
    'Quality': p.quality,
    'Warranty': p.warranty || '',
    'Min Stock Alert': p.minStockAlert,
  }));
  const prodWorksheet = XLSX.utils.json_to_sheet(prodData);
  XLSX.utils.book_append_sheet(workbook, prodWorksheet, 'Inventory_Products');

  // Sheet 2: Customers
  const custData = customers.map((c, index) => ({
    'SL': index + 1,
    'Customer ID': c.id,
    'Customer Name': c.name,
    'Mobile / Phone': c.phone,
    'Address': c.address || '',
    'Credit Limit (৳)': c.creditLimit,
    'Total Due (৳)': c.totalDue,
    'Total Spent (৳)': c.totalSpent,
    'Created Date': c.createdAt,
    'Notes / Reference': c.notes || '',
  }));
  const custWorksheet = XLSX.utils.json_to_sheet(custData);
  XLSX.utils.book_append_sheet(workbook, custWorksheet, 'Customers_Khata');

  const finalName = filename || `ibtipoint_full_store_${localDateStr()}.xlsx`;
  XLSX.writeFile(workbook, finalName);
}
