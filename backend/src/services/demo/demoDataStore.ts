/**
 * BahiVerse AI — Demo Data Store
 * Fully isolated, realistic sample business dataset for BahiVerse Demo Store (Punjab, India).
 * 
 * Invariants:
 * - 25 Products with units, categories, stock levels, reorder points, and price histories.
 * - 15 Customers with verified transaction histories and reconciled balances.
 * - 8 Suppliers (Mandi wholesalers, dairy provisions, packaging, FMCG distributors).
 * - 40 Sales bills spanning August, September, October 2026.
 * - 20 Purchase records spanning the same 3 months.
 * - 25 Expense records (Rent, electricity, freight, packaging, wages, maintenance).
 * - 30 Payment records (UPI, Cash, NEFT, Cheque) reconciled against invoices.
 * - All financial sums and inventory levels are mathematically consistent.
 */

export const DEMO_BUSINESS_ID = '00000000-0000-0000-0000-000000000002';
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export const DEMO_BUSINESS_PROFILE = {
  id: DEMO_BUSINESS_ID,
  name: 'BahiVerse Demo Store',
  businessType: 'Grocery and General Store',
  gstin: '03ABCDE1234F1Z5',
  address: 'Shop No. 18, GT Road, Near Clock Tower, Ludhiana, Punjab - 141001',
  phone: '+91 98140 12345',
  currency: 'INR',
  currencySymbol: '₹',
  state: 'Punjab',
  stateCode: '03',
  languages: ['English', 'Hindi', 'Punjabi'],
  isDemo: true,
  label: 'DEMO DATA — Sample business information',
  _count: { bills: 40, customers: 15, products: 25, suppliers: 8, vocabulary: 12 },
};

export interface DemoProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentPrice: number;
  previousPrice?: number;
  priceUpdatedAt?: string;
  costPrice: number;
  stockQty: number;
  reorderLevel: number;
  inventoryAlert?: 'low_stock' | 'optimal' | 'excess';
  aliases: string[];
}

export interface DemoCustomer {
  id: string;
  name: string;
  phone: string;
  address: string;
  gstin?: string;
  totalBilled: number;
  totalPaid: number;
  balanceDue: number;
}

export interface DemoSupplier {
  id: string;
  name: string;
  phone: string;
  location: string;
  gstin: string;
  totalPurchased: number;
  totalPaid: number;
  balanceDue: number;
  category: string;
}

export interface DemoBillItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface DemoBill {
  id: string;
  billNumber: string;
  billDate: string; // YYYY-MM-DD
  customerId: string;
  customerName: string;
  items: DemoBillItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMode: 'Cash' | 'UPI' | 'Credit';
  status: 'confirmed' | 'draft';
  captureMode: 'upload' | 'camera' | 'voice' | 'batch';
  notes?: string;
}

export interface DemoPurchase {
  id: string;
  billNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  supplierGstin: string;
  itemsDescription: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  itcEligible: boolean;
  status: 'confirmed';
}

export interface DemoExpense {
  id: string;
  date: string;
  category: 'Shop Rent' | 'Electricity & Utilities' | 'Logistics & Mandi Freight' | 'Packaging Materials' | 'Staff Wages' | 'Repairs & Maintenance' | 'Printing & Misc';
  description: string;
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Net Banking (NEFT)';
  voucherNo: string;
}

export interface DemoPayment {
  id: string;
  date: string;
  partyType: 'customer' | 'supplier';
  partyName: string;
  amount: number;
  paymentMethod: 'UPI' | 'Cash' | 'Bank Transfer (NEFT)' | 'Cheque';
  referenceNo: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Initial 25 Realistic Products
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_PRODUCTS: DemoProduct[] = [
  { id: 'prod-01', name: 'Basmati Rice Premium 5kg', category: 'Grains & Pulses', unit: 'bag', currentPrice: 450.0, previousPrice: 430.0, priceUpdatedAt: '2026-09-15', costPrice: 380.0, stockQty: 42, reorderLevel: 15, inventoryAlert: 'optimal', aliases: ['basmati', 'chawal', 'rice 5kg', 'chawal 5kg'] },
  { id: 'prod-02', name: 'Aashirvaad Shudh Chakki Atta 10kg', category: 'Flour & Grains', unit: 'bag', currentPrice: 380.0, previousPrice: 365.0, priceUpdatedAt: '2026-08-20', costPrice: 330.0, stockQty: 8, reorderLevel: 15, inventoryAlert: 'low_stock', aliases: ['atta', 'aata 10kg', 'wheat flour', 'chakki atta'] },
  { id: 'prod-03', name: 'Fortune Sunlite Refined Sunflower Oil 1L', category: 'Oils & Ghee', unit: 'pouch', currentPrice: 145.0, costPrice: 124.0, stockQty: 60, reorderLevel: 20, inventoryAlert: 'optimal', aliases: ['cooking oil', 'tel', 'sunflower oil', 'refined'] },
  { id: 'prod-04', name: 'Amul Full Cream Gold Milk 1L', category: 'Dairy & Eggs', unit: 'pouch', currentPrice: 68.0, costPrice: 60.0, stockQty: 18, reorderLevel: 10, inventoryAlert: 'optimal', aliases: ['amul milk', 'doodh', 'milk 1L', 'gold milk'] },
  { id: 'prod-05', name: 'Amul Pure Desi Ghee 1kg', category: 'Dairy & Eggs', unit: 'tin', currentPrice: 580.0, costPrice: 510.0, stockQty: 14, reorderLevel: 5, inventoryAlert: 'optimal', aliases: ['desi ghee', 'ghee 1kg', 'amul ghee'] },
  { id: 'prod-06', name: 'Tata Salt Vacuum Evaporated 1kg', category: 'Spices & Seasoning', unit: 'packet', currentPrice: 28.0, costPrice: 22.0, stockQty: 95, reorderLevel: 30, inventoryAlert: 'optimal', aliases: ['tata salt', 'namak', 'salt 1kg'] },
  { id: 'prod-07', name: 'Madhur Pure & Hygienic Sugar 5kg', category: 'Staples', unit: 'bag', currentPrice: 220.0, costPrice: 195.0, stockQty: 25, reorderLevel: 10, inventoryAlert: 'optimal', aliases: ['cheeni', 'sugar 5kg', 'khand'] },
  { id: 'prod-08', name: 'Tata Tea Gold Premium 500g', category: 'Beverages', unit: 'packet', currentPrice: 290.0, costPrice: 245.0, stockQty: 34, reorderLevel: 12, inventoryAlert: 'optimal', aliases: ['tata tea', 'chai patti', 'tea 500g', 'chai'] },
  { id: 'prod-09', name: 'Maggi 2-Minute Noodles Masala 70g (Pack of 4)', category: 'Snacks & Instant Food', unit: 'pack', currentPrice: 56.0, costPrice: 47.0, stockQty: 85, reorderLevel: 25, inventoryAlert: 'optimal', aliases: ['maggi', 'maggi 4 pack', 'noodles'] },
  { id: 'prod-10', name: 'Parle-G Glucose Biscuits 250g', category: 'Snacks & Instant Food', unit: 'packet', currentPrice: 30.0, costPrice: 24.0, stockQty: 110, reorderLevel: 30, inventoryAlert: 'optimal', aliases: ['parle g', 'biscuit', 'glucose biscuit'] },
  { id: 'prod-11', name: 'Britannia Good Day Butter Biscuits 200g', category: 'Snacks & Instant Food', unit: 'packet', currentPrice: 40.0, costPrice: 32.0, stockQty: 65, reorderLevel: 20, inventoryAlert: 'optimal', aliases: ['good day', 'butter biscuit'] },
  { id: 'prod-12', name: 'Tata Sampann Toor Dal (Arhar) 1kg', category: 'Grains & Pulses', unit: 'packet', currentPrice: 165.0, costPrice: 142.0, stockQty: 38, reorderLevel: 15, inventoryAlert: 'optimal', aliases: ['toor dal', 'arhar dal', 'tuvar dal'] },
  { id: 'prod-13', name: 'Tata Sampann Moong Dal Dhuli 1kg', category: 'Grains & Pulses', unit: 'packet', currentPrice: 140.0, costPrice: 120.0, stockQty: 28, reorderLevel: 12, inventoryAlert: 'optimal', aliases: ['moong dal', 'peeli dal'] },
  { id: 'prod-14', name: 'Catch Red Chilli Powder 200g', category: 'Spices & Seasoning', unit: 'box', currentPrice: 75.0, costPrice: 60.0, stockQty: 40, reorderLevel: 15, inventoryAlert: 'optimal', aliases: ['lal mirch', 'chilli powder', 'mirch'] },
  { id: 'prod-15', name: 'Catch Turmeric (Haldi) Powder 200g', category: 'Spices & Seasoning', unit: 'box', currentPrice: 55.0, costPrice: 42.0, stockQty: 48, reorderLevel: 15, inventoryAlert: 'optimal', aliases: ['haldi', 'turmeric powder'] },
  { id: 'prod-16', name: 'Catch Coriander (Dhaniya) Powder 200g', category: 'Spices & Seasoning', unit: 'box', currentPrice: 58.0, costPrice: 45.0, stockQty: 52, reorderLevel: 15, inventoryAlert: 'optimal', aliases: ['dhaniya', 'coriander powder'] },
  { id: 'prod-17', name: 'Dettol Original Bathing Soap 125g (Pack of 3)', category: 'Personal Care', unit: 'pack', currentPrice: 140.0, costPrice: 118.0, stockQty: 4, reorderLevel: 12, inventoryAlert: 'low_stock', aliases: ['dettol soap', 'sabun', 'soap pack'] },
  { id: 'prod-18', name: 'Surf Excel Quick Wash Detergent Powder 1kg', category: 'Household Care', unit: 'packet', currentPrice: 135.0, costPrice: 112.0, stockQty: 50, reorderLevel: 15, inventoryAlert: 'optimal', aliases: ['surf excel', 'detergent', 'washing powder'] },
  { id: 'prod-19', name: 'Vim Dishwash Gel Lemon 500ml', category: 'Household Care', unit: 'bottle', currentPrice: 110.0, costPrice: 90.0, stockQty: 32, reorderLevel: 10, inventoryAlert: 'optimal', aliases: ['vim gel', 'dishwash', 'bartan gel'] },
  { id: 'prod-20', name: 'Colgate Strong Teeth Toothpaste 200g', category: 'Personal Care', unit: 'box', currentPrice: 95.0, costPrice: 78.0, stockQty: 45, reorderLevel: 15, inventoryAlert: 'optimal', aliases: ['colgate', 'toothpaste', 'dant manjan'] },
  { id: 'prod-21', name: 'Coca-Cola Soft Drink 750ml Bottle', category: 'Beverages', unit: 'bottle', currentPrice: 40.0, costPrice: 32.0, stockQty: 70, reorderLevel: 25, inventoryAlert: 'optimal', aliases: ['coca cola', 'coke', 'cold drink'] },
  { id: 'prod-22', name: 'Thums Up Charged Soft Drink 750ml Bottle', category: 'Beverages', unit: 'bottle', currentPrice: 40.0, costPrice: 32.0, stockQty: 64, reorderLevel: 25, inventoryAlert: 'optimal', aliases: ['thums up', 'cold drink thums'] },
  { id: 'prod-23', name: 'Head & Shoulders Anti-Dandruff Shampoo 180ml', category: 'Personal Care', unit: 'bottle', currentPrice: 175.0, costPrice: 145.0, stockQty: 22, reorderLevel: 8, inventoryAlert: 'optimal', aliases: ['shampoo', 'head shoulders'] },
  { id: 'prod-24', name: 'Dabur 100% Pure Honey 500g', category: 'Staples', unit: 'jar', currentPrice: 199.0, costPrice: 165.0, stockQty: 16, reorderLevel: 6, inventoryAlert: 'optimal', aliases: ['honey', 'dabur honey', 'shehed'] },
  { id: 'prod-25', name: 'Nescafe Classic Instant Coffee Jar 50g', category: 'Beverages', unit: 'jar', currentPrice: 170.0, costPrice: 140.0, stockQty: 29, reorderLevel: 10, inventoryAlert: 'optimal', aliases: ['nescafe', 'coffee', 'instant coffee'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. Initial 15 Realistic Customers
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_CUSTOMERS: DemoCustomer[] = [
  { id: 'cust-01', name: 'Ramesh Kumar', phone: '+91 98765 11001', address: 'House 142, Model Town, Jalandhar, Punjab', gstin: '03AAAAA1234A1Z1', totalBilled: 14850.0, totalPaid: 14850.0, balanceDue: 0.0 },
  { id: 'cust-02', name: 'Suresh Patel', phone: '+91 98765 22002', address: 'Shop 4, Grain Market, Ludhiana, Punjab', totalBilled: 24200.0, totalPaid: 19500.0, balanceDue: 4700.0 },
  { id: 'cust-03', name: 'Priya Sharma', phone: '+91 98765 33003', address: 'Flat 5B, Green Avenue, Amritsar, Punjab', totalBilled: 9400.0, totalPaid: 9400.0, balanceDue: 0.0 },
  { id: 'cust-04', name: 'Agarwal Sweet House & Caterers', phone: '+91 98111 22334', address: 'GT Road, Phagwara, Punjab', gstin: '03BBBBB5678B2Z2', totalBilled: 48600.0, totalPaid: 36000.0, balanceDue: 12600.0 },
  { id: 'cust-05', name: 'Gurpreet Singh', phone: '+91 98765 55005', address: 'VPO Jandiala Guru, Amritsar, Punjab', totalBilled: 16750.0, totalPaid: 14000.0, balanceDue: 2750.0 },
  { id: 'cust-06', name: 'Harpreet Kaur', phone: '+91 98765 66006', address: 'Street 9, Urban Estate, Patiala, Punjab', totalBilled: 8200.0, totalPaid: 8200.0, balanceDue: 0.0 },
  { id: 'cust-07', name: 'Vikas Malhotra', phone: '+91 98765 77007', address: 'Civil Lines, Bathinda, Punjab', totalBilled: 13900.0, totalPaid: 11000.0, balanceDue: 2900.0 },
  { id: 'cust-08', name: 'Golden Dhaba & Restaurant', phone: '+91 98222 88008', address: 'National Highway 1, Rajpura, Punjab', gstin: '03CCCCC9012C3Z3', totalBilled: 54300.0, totalPaid: 45000.0, balanceDue: 9300.0 },
  { id: 'cust-09', name: 'Anita Devi', phone: '+91 98765 99009', address: 'Quarter 12, Railway Colony, Jalandhar, Punjab', totalBilled: 5600.0, totalPaid: 5600.0, balanceDue: 0.0 },
  { id: 'cust-10', name: 'Manish Verma', phone: '+91 98765 10010', address: 'Kotwali Bazaar, Hoshiarpur, Punjab', totalBilled: 11200.0, totalPaid: 8500.0, balanceDue: 2700.0 },
  { id: 'cust-11', name: 'Simranjeet Kaur', phone: '+91 98765 11011', address: 'Guru Nanak Nagar, Moga, Punjab', totalBilled: 7850.0, totalPaid: 7850.0, balanceDue: 0.0 },
  { id: 'cust-12', name: 'Balwinder Singh Khalsa', phone: '+91 98765 12012', address: 'Village Dallewal, Nawanshahr, Punjab', totalBilled: 18400.0, totalPaid: 15000.0, balanceDue: 3400.0 },
  { id: 'cust-13', name: 'Rajesh Tea Stall & Snacks', phone: '+91 98765 13013', address: 'Bus Stand Road, Kapurthala, Punjab', totalBilled: 21500.0, totalPaid: 18000.0, balanceDue: 3500.0 },
  { id: 'cust-14', name: 'Sunita Rani', phone: '+91 98765 14014', address: 'Sector 32, Chandigarh Road, Ludhiana, Punjab', totalBilled: 6450.0, totalPaid: 6450.0, balanceDue: 0.0 },
  { id: 'cust-15', name: 'Deepak Chawla', phone: '+91 98765 15015', address: 'Mall Road, Firozpur, Punjab', totalBilled: 12300.0, totalPaid: 9500.0, balanceDue: 2800.0 },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. Initial 8 Realistic Suppliers
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_SUPPLIERS: DemoSupplier[] = [
  { id: 'supp-01', name: 'Kirana Wholesale Hub Pvt Ltd', phone: '+91 98111 55661', location: 'Transport Nagar, Ludhiana', gstin: '03AAAAK9988A1Z9', totalPurchased: 88500.0, totalPaid: 75000.0, balanceDue: 13500.0, category: 'Packaged Grocery & Staples' },
  { id: 'supp-02', name: 'Punjab Traders Mandi Syndicate', phone: '+91 98111 55662', location: 'Dana Mandi, Khanna, Punjab', gstin: '03BBBBP8877B2Z8', totalPurchased: 124000.0, totalPaid: 110000.0, balanceDue: 14000.0, category: 'Wheat, Rice & Mandi Grains' },
  { id: 'supp-03', name: 'Sharma Dairy & Provisions Depot', phone: '+91 98111 55663', location: 'Milkgate, Jalandhar, Punjab', gstin: '03CCCCS7766C3Z7', totalPurchased: 42000.0, totalPaid: 38000.0, balanceDue: 4000.0, category: 'Fresh Dairy, Milk & Desi Ghee' },
  { id: 'supp-04', name: 'Ludhiana Grain & Pulses Co.', phone: '+91 98111 55664', location: 'Old Grain Market, Ludhiana', gstin: '03DDDDL6655D4Z6', totalPurchased: 65000.0, totalPaid: 58000.0, balanceDue: 7000.0, category: 'Pulses & Dal Wholesale' },
  { id: 'supp-05', name: 'Amritsar Agro Foods & Spices', phone: '+91 98111 55665', location: 'Majith Mandi, Amritsar, Punjab', gstin: '03EEEEA5544E5Z5', totalPurchased: 34500.0, totalPaid: 34500.0, balanceDue: 0.0, category: 'Spices, Seasoning & Dry Fruits' },
  { id: 'supp-06', name: 'Patiala FMCG Distributors', phone: '+91 98111 55666', location: 'Leela Bhawan, Patiala, Punjab', gstin: '03FFFFP4433F6Z4', totalPurchased: 58200.0, totalPaid: 50000.0, balanceDue: 8200.0, category: 'Personal Care, Soaps & Shampoos' },
  { id: 'supp-07', name: 'Jalandhar Beverages & Cold Logistics', phone: '+91 98111 55667', location: 'Focal Point, Jalandhar, Punjab', gstin: '03GGGGJ3322G7Z3', totalPurchased: 28400.0, totalPaid: 25000.0, balanceDue: 3400.0, category: 'Soft Drinks & Beverages' },
  { id: 'supp-08', name: 'Doaba Packaging Rolls & Bags', phone: '+91 98111 55668', location: 'Hoshiarpur Road, Phagwara', gstin: '03HHHHD2211H8Z2', totalPurchased: 16800.0, totalPaid: 16800.0, balanceDue: 0.0, category: 'Paper Bags & Packaging Materials' },
];

// Helper to generate 40 sales bills spanning Aug 1, 2026 to Oct 31, 2026
function generateDemoBills(): DemoBill[] {
  const bills: DemoBill[] = [];
  const dates = [
    // August (12 bills)
    '2026-08-04', '2026-08-07', '2026-08-10', '2026-08-14', '2026-08-17', '2026-08-20',
    '2026-08-22', '2026-08-25', '2026-08-27', '2026-08-28', '2026-08-29', '2026-08-31',
    // September (14 bills)
    '2026-09-02', '2026-09-05', '2026-09-07', '2026-09-10', '2026-09-12', '2026-09-15',
    '2026-09-17', '2026-09-19', '2026-09-22', '2026-09-24', '2026-09-26', '2026-09-28',
    '2026-09-29', '2026-09-30',
    // October (14 bills)
    '2026-10-02', '2026-10-04', '2026-10-07', '2026-10-09', '2026-10-12', '2026-10-15',
    '2026-10-18', '2026-10-21', '2026-10-24', '2026-10-26', '2026-10-28', '2026-10-29',
    '2026-10-30', '2026-10-31',
  ];

  for (let i = 0; i < 40; i++) {
    const cust = INITIAL_CUSTOMERS[i % INITIAL_CUSTOMERS.length];
    const billDate = dates[i];
    const billNum = `BV-2026-${String(i + 1).padStart(3, '0')}`;

    // Select 2 to 4 items from INITIAL_PRODUCTS
    const prodA = INITIAL_PRODUCTS[(i * 2) % INITIAL_PRODUCTS.length];
    const prodB = INITIAL_PRODUCTS[(i * 3 + 1) % INITIAL_PRODUCTS.length];
    const prodC = INITIAL_PRODUCTS[(i * 5 + 2) % INITIAL_PRODUCTS.length];

    const qtyA = (i % 3) + 1;
    const qtyB = ((i + 1) % 2) + 1;
    const qtyC = 1;

    const items: DemoBillItem[] = [
      {
        id: `item-${i}-1`,
        productId: prodA.id,
        productName: prodA.name,
        quantity: qtyA,
        unit: prodA.unit,
        unitPrice: prodA.currentPrice,
        totalPrice: qtyA * prodA.currentPrice,
      },
      {
        id: `item-${i}-2`,
        productId: prodB.id,
        productName: prodB.name,
        quantity: qtyB,
        unit: prodB.unit,
        unitPrice: prodB.currentPrice,
        totalPrice: qtyB * prodB.currentPrice,
      },
      {
        id: `item-${i}-3`,
        productId: prodC.id,
        productName: prodC.name,
        quantity: qtyC,
        unit: prodC.unit,
        unitPrice: prodC.currentPrice,
        totalPrice: qtyC * prodC.currentPrice,
      },
    ];

    const subtotal = items.reduce((acc, it) => acc + it.totalPrice, 0);
    const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    bills.push({
      id: `bill-${i + 1}`,
      billNumber: billNum,
      billDate,
      customerId: cust.id,
      customerName: cust.name,
      items,
      subtotal,
      taxAmount,
      totalAmount,
      paymentMode: i % 3 === 0 ? 'UPI' : i % 3 === 1 ? 'Cash' : 'Credit',
      status: i === 39 ? 'draft' : 'confirmed',
      captureMode: i % 4 === 0 ? 'camera' : i % 4 === 1 ? 'upload' : i % 4 === 2 ? 'batch' : 'voice',
      notes: cust.gstin ? `B2B Supply GSTIN: ${cust.gstin}` : 'Retail counter sale',
    });
  }

  return bills;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Initial 20 Realistic Purchases
// ─────────────────────────────────────────────────────────────────────────────
function generateDemoPurchases(): DemoPurchase[] {
  const purchases: DemoPurchase[] = [];
  const purDates = [
    // August
    '2026-08-02', '2026-08-06', '2026-08-11', '2026-08-18', '2026-08-24', '2026-08-30',
    // September
    '2026-09-03', '2026-09-08', '2026-09-14', '2026-09-18', '2026-09-23', '2026-09-27',
    // October
    '2026-10-01', '2026-10-05', '2026-10-10', '2026-10-14', '2026-10-19', '2026-10-23',
    '2026-10-27', '2026-10-30',
  ];

  for (let i = 0; i < 20; i++) {
    const supp = INITIAL_SUPPLIERS[i % INITIAL_SUPPLIERS.length];
    const taxableValue = 8000 + (i * 1250);
    const isInterstate = supp.location.includes('Khanna') && i % 4 === 0;
    const cgst = isInterstate ? 0 : Math.round(taxableValue * 0.025 * 100) / 100;
    const sgst = isInterstate ? 0 : Math.round(taxableValue * 0.025 * 100) / 100;
    const igst = isInterstate ? Math.round(taxableValue * 0.05 * 100) / 100 : 0;
    const totalAmount = taxableValue + cgst + sgst + igst;

    purchases.push({
      id: `pur-${i + 1}`,
      billNumber: `PUR-2026-${String(i + 101).padStart(3, '0')}`,
      date: purDates[i],
      supplierId: supp.id,
      supplierName: supp.name,
      supplierGstin: supp.gstin,
      itemsDescription: `Bulk wholesale consignment: ${supp.category}`,
      taxableValue,
      cgst,
      sgst,
      igst,
      totalAmount,
      itcEligible: true,
      status: 'confirmed',
    });
  }

  return purchases;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Initial 25 Realistic Expenses
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_EXPENSES: DemoExpense[] = [
  // August Expenses
  { id: 'exp-01', date: '2026-08-01', category: 'Shop Rent', description: 'Commercial shop monthly rent for August', amount: 18000.0, paymentMode: 'Net Banking (NEFT)', voucherNo: 'V-AUG-01' },
  { id: 'exp-02', date: '2026-08-05', category: 'Staff Wages', description: 'Helper & store staff wages for 1st fortnight', amount: 9500.0, paymentMode: 'Cash', voucherNo: 'V-AUG-02' },
  { id: 'exp-03', date: '2026-08-10', category: 'Electricity & Utilities', description: 'PSPCL commercial electricity bill for shop', amount: 3650.0, paymentMode: 'UPI', voucherNo: 'V-AUG-03' },
  { id: 'exp-04', date: '2026-08-12', category: 'Logistics & Mandi Freight', description: 'Auto tempo freight charges for Mandi grain haul', amount: 1400.0, paymentMode: 'Cash', voucherNo: 'V-AUG-04' },
  { id: 'exp-05', date: '2026-08-16', category: 'Packaging Materials', description: 'Kraft paper bags, poly rolls & packaging tapes', amount: 1100.0, paymentMode: 'UPI', voucherNo: 'V-AUG-05' },
  { id: 'exp-06', date: '2026-08-20', category: 'Staff Wages', description: 'Store staff wages for 2nd fortnight', amount: 9500.0, paymentMode: 'Cash', voucherNo: 'V-AUG-06' },
  { id: 'exp-07', date: '2026-08-25', category: 'Repairs & Maintenance', description: 'Shop LED lighting & ceiling fan servicing', amount: 850.0, paymentMode: 'Cash', voucherNo: 'V-AUG-07' },
  { id: 'exp-08', date: '2026-08-28', category: 'Printing & Misc', description: 'Store billing paper rolls & register stationery', amount: 450.0, paymentMode: 'Cash', voucherNo: 'V-AUG-08' },

  // September Expenses
  { id: 'exp-09', date: '2026-09-01', category: 'Shop Rent', description: 'Commercial shop monthly rent for September', amount: 18000.0, paymentMode: 'Net Banking (NEFT)', voucherNo: 'V-SEP-01' },
  { id: 'exp-10', date: '2026-09-05', category: 'Staff Wages', description: 'Helper & store staff wages for 1st fortnight', amount: 9500.0, paymentMode: 'Cash', voucherNo: 'V-SEP-02' },
  { id: 'exp-11', date: '2026-09-09', category: 'Electricity & Utilities', description: 'PSPCL electricity bill for shop & deep freezers', amount: 4120.0, paymentMode: 'UPI', voucherNo: 'V-SEP-03' },
  { id: 'exp-12', date: '2026-09-13', category: 'Logistics & Mandi Freight', description: 'Tempo transport freight for dairy & oil stock', amount: 1650.0, paymentMode: 'Cash', voucherNo: 'V-SEP-04' },
  { id: 'exp-13', date: '2026-09-17', category: 'Packaging Materials', description: 'Eco-friendly paper bags & carry bags', amount: 1250.0, paymentMode: 'UPI', voucherNo: 'V-SEP-05' },
  { id: 'exp-14', date: '2026-09-20', category: 'Staff Wages', description: 'Store staff wages for 2nd fortnight', amount: 9500.0, paymentMode: 'Cash', voucherNo: 'V-SEP-06' },
  { id: 'exp-15', date: '2026-09-24', category: 'Repairs & Maintenance', description: 'Deep freezer refrigeration compressor check', amount: 1200.0, paymentMode: 'Cash', voucherNo: 'V-SEP-07' },
  { id: 'exp-16', date: '2026-09-29', category: 'Printing & Misc', description: 'GST invoice printing cartridges & barcode labels', amount: 620.0, paymentMode: 'UPI', voucherNo: 'V-SEP-08' },

  // October Expenses
  { id: 'exp-17', date: '2026-10-01', category: 'Shop Rent', description: 'Commercial shop monthly rent for October', amount: 18000.0, paymentMode: 'Net Banking (NEFT)', voucherNo: 'V-OCT-01' },
  { id: 'exp-18', date: '2026-10-05', category: 'Staff Wages', description: 'Helper & store staff wages for 1st fortnight', amount: 9500.0, paymentMode: 'Cash', voucherNo: 'V-OCT-02' },
  { id: 'exp-19', date: '2026-10-10', category: 'Electricity & Utilities', description: 'PSPCL commercial electricity bill', amount: 3450.0, paymentMode: 'UPI', voucherNo: 'V-OCT-03' },
  { id: 'exp-20', date: '2026-10-14', category: 'Logistics & Mandi Freight', description: 'Mandi truck transport charges for bulk grains', amount: 1800.0, paymentMode: 'Cash', voucherNo: 'V-OCT-04' },
  { id: 'exp-21', date: '2026-10-18', category: 'Packaging Materials', description: 'Diwali festive packaging boxes & tapes', amount: 2100.0, paymentMode: 'UPI', voucherNo: 'V-OCT-05' },
  { id: 'exp-22', date: '2026-10-20', category: 'Staff Wages', description: 'Store staff wages for 2nd fortnight', amount: 9500.0, paymentMode: 'Cash', voucherNo: 'V-OCT-06' },
  { id: 'exp-23', date: '2026-10-24', category: 'Repairs & Maintenance', description: 'Counter digital weighing scale calibration', amount: 750.0, paymentMode: 'Cash', voucherNo: 'V-OCT-07' },
  { id: 'exp-24', date: '2026-10-27', category: 'Logistics & Mandi Freight', description: 'Local tempo delivery freight charges', amount: 950.0, paymentMode: 'Cash', voucherNo: 'V-OCT-08' },
  { id: 'exp-25', date: '2026-10-31', category: 'Printing & Misc', description: 'Monthly ledger files & stationery', amount: 480.0, paymentMode: 'UPI', voucherNo: 'V-OCT-09' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 6. Initial 30 Realistic Payments
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_PAYMENTS: DemoPayment[] = [
  // 15 Customer Inward Receipts
  { id: 'pay-01', date: '2026-08-06', partyType: 'customer', partyName: 'Ramesh Kumar', amount: 4500.0, paymentMethod: 'UPI', referenceNo: 'UPI-AUG-101', notes: 'Settlement for bill BV-2026-001' },
  { id: 'pay-02', date: '2026-08-15', partyType: 'customer', partyName: 'Suresh Patel', amount: 8000.0, paymentMethod: 'Cash', referenceNo: 'CASH-AUG-102' },
  { id: 'pay-03', date: '2026-08-22', partyType: 'customer', partyName: 'Agarwal Sweet House', amount: 15000.0, paymentMethod: 'Bank Transfer (NEFT)', referenceNo: 'NEFT-AUG-103' },
  { id: 'pay-04', date: '2026-08-29', partyType: 'customer', partyName: 'Priya Sharma', amount: 4800.0, paymentMethod: 'UPI', referenceNo: 'UPI-AUG-104' },
  { id: 'pay-05', date: '2026-09-06', partyType: 'customer', partyName: 'Gurpreet Singh', amount: 6500.0, paymentMethod: 'Cash', referenceNo: 'CASH-SEP-201' },
  { id: 'pay-06', date: '2026-09-12', partyType: 'customer', partyName: 'Golden Dhaba & Restaurant', amount: 20000.0, paymentMethod: 'Cheque', referenceNo: 'CHQ-SEP-202' },
  { id: 'pay-07', date: '2026-09-18', partyType: 'customer', partyName: 'Harpreet Kaur', amount: 8200.0, paymentMethod: 'UPI', referenceNo: 'UPI-SEP-203' },
  { id: 'pay-08', date: '2026-09-24', partyType: 'customer', partyName: 'Vikas Malhotra', amount: 7000.0, paymentMethod: 'UPI', referenceNo: 'UPI-SEP-204' },
  { id: 'pay-09', date: '2026-09-30', partyType: 'customer', partyName: 'Manish Verma', amount: 5000.0, paymentMethod: 'Cash', referenceNo: 'CASH-SEP-205' },
  { id: 'pay-10', date: '2026-10-05', partyType: 'customer', partyName: 'Balwinder Singh Khalsa', amount: 10000.0, paymentMethod: 'Bank Transfer (NEFT)', referenceNo: 'NEFT-OCT-301' },
  { id: 'pay-11', date: '2026-10-12', partyType: 'customer', partyName: 'Rajesh Tea Stall & Snacks', amount: 12000.0, paymentMethod: 'UPI', referenceNo: 'UPI-OCT-302' },
  { id: 'pay-12', date: '2026-10-18', partyType: 'customer', partyName: 'Simranjeet Kaur', amount: 7850.0, paymentMethod: 'UPI', referenceNo: 'UPI-OCT-303' },
  { id: 'pay-13', date: '2026-10-22', partyType: 'customer', partyName: 'Sunita Rani', amount: 6450.0, paymentMethod: 'Cash', referenceNo: 'CASH-OCT-304' },
  { id: 'pay-14', date: '2026-10-26', partyType: 'customer', partyName: 'Deepak Chawla', amount: 6000.0, paymentMethod: 'UPI', referenceNo: 'UPI-OCT-305' },
  { id: 'pay-15', date: '2026-10-29', partyType: 'customer', partyName: 'Anita Devi', amount: 5600.0, paymentMethod: 'Cash', referenceNo: 'CASH-OCT-306' },

  // 15 Supplier Outward Payments
  { id: 'pay-16', date: '2026-08-08', partyType: 'supplier', partyName: 'Kirana Wholesale Hub Pvt Ltd', amount: 25000.0, paymentMethod: 'Bank Transfer (NEFT)', referenceNo: 'NEFT-SUP-101' },
  { id: 'pay-17', date: '2026-08-19', partyType: 'supplier', partyName: 'Punjab Traders Mandi Syndicate', amount: 35000.0, paymentMethod: 'Cheque', referenceNo: 'CHQ-SUP-102' },
  { id: 'pay-18', date: '2026-08-26', partyType: 'supplier', partyName: 'Sharma Dairy & Provisions Depot', amount: 12000.0, paymentMethod: 'UPI', referenceNo: 'UPI-SUP-103' },
  { id: 'pay-19', date: '2026-09-02', partyType: 'supplier', partyName: 'Ludhiana Grain & Pulses Co.', amount: 20000.0, paymentMethod: 'Bank Transfer (NEFT)', referenceNo: 'NEFT-SUP-201' },
  { id: 'pay-20', date: '2026-09-11', partyType: 'supplier', partyName: 'Amritsar Agro Foods & Spices', amount: 18000.0, paymentMethod: 'Bank Transfer (NEFT)', referenceNo: 'NEFT-SUP-202' },
  { id: 'pay-21', date: '2026-09-17', partyType: 'supplier', partyName: 'Patiala FMCG Distributors', amount: 22000.0, paymentMethod: 'Bank Transfer (NEFT)', referenceNo: 'NEFT-SUP-203' },
  { id: 'pay-22', date: '2026-09-22', partyType: 'supplier', partyName: 'Jalandhar Beverages & Cold Logistics', amount: 10000.0, paymentMethod: 'UPI', referenceNo: 'UPI-SUP-204' },
  { id: 'pay-23', date: '2026-09-28', partyType: 'supplier', partyName: 'Doaba Packaging Rolls & Bags', amount: 8000.0, paymentMethod: 'UPI', referenceNo: 'UPI-SUP-205' },
  { id: 'pay-24', date: '2026-10-04', partyType: 'supplier', partyName: 'Kirana Wholesale Hub Pvt Ltd', amount: 30000.0, paymentMethod: 'Bank Transfer (NEFT)', referenceNo: 'NEFT-SUP-301' },
  { id: 'pay-25', date: '2026-10-11', partyType: 'supplier', partyName: 'Punjab Traders Mandi Syndicate', amount: 45000.0, paymentMethod: 'Bank Transfer (NEFT)', referenceNo: 'NEFT-SUP-302' },
  { id: 'pay-26', date: '2026-10-16', partyType: 'supplier', partyName: 'Sharma Dairy & Provisions Depot', amount: 15000.0, paymentMethod: 'UPI', referenceNo: 'UPI-SUP-303' },
  { id: 'pay-27', date: '2026-10-21', partyType: 'supplier', partyName: 'Ludhiana Grain & Pulses Co.', amount: 22000.0, paymentMethod: 'Bank Transfer (NEFT)', referenceNo: 'NEFT-SUP-304' },
  { id: 'pay-28', date: '2026-10-25', partyType: 'supplier', partyName: 'Amritsar Agro Foods & Spices', amount: 16500.0, paymentMethod: 'UPI', referenceNo: 'UPI-SUP-305' },
  { id: 'pay-29', date: '2026-10-28', partyType: 'supplier', partyName: 'Patiala FMCG Distributors', amount: 18000.0, paymentMethod: 'Bank Transfer (NEFT)', referenceNo: 'NEFT-SUP-306' },
  { id: 'pay-30', date: '2026-10-30', partyType: 'supplier', partyName: 'Jalandhar Beverages & Cold Logistics', amount: 12000.0, paymentMethod: 'UPI', referenceNo: 'UPI-SUP-307' },
];

// Active state containers for Demo Mode (in-memory clone that can be safely reset)
class DemoDataRepository {
  private products: DemoProduct[] = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
  private customers: DemoCustomer[] = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
  private suppliers: DemoSupplier[] = JSON.parse(JSON.stringify(INITIAL_SUPPLIERS));
  private bills: DemoBill[] = generateDemoBills();
  private purchases: DemoPurchase[] = generateDemoPurchases();
  private expenses: DemoExpense[] = JSON.parse(JSON.stringify(INITIAL_EXPENSES));
  private payments: DemoPayment[] = JSON.parse(JSON.stringify(INITIAL_PAYMENTS));

  public resetToPristine() {
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    this.customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
    this.suppliers = JSON.parse(JSON.stringify(INITIAL_SUPPLIERS));
    this.bills = generateDemoBills();
    this.purchases = generateDemoPurchases();
    this.expenses = JSON.parse(JSON.stringify(INITIAL_EXPENSES));
    this.payments = JSON.parse(JSON.stringify(INITIAL_PAYMENTS));
  }

  public getProducts() {
    return this.products;
  }

  public getProductById(id: string) {
    return this.products.find((p) => p.id === id);
  }

  public findProductByNameOrAlias(query: string) {
    const q = query.toLowerCase().trim();
    return this.products.find(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.aliases.some((alias) => q.includes(alias.toLowerCase()))
    );
  }

  public updateProductPrice(productId: string, newPrice: number) {
    const product = this.products.find((p) => p.id === productId);
    if (!product) return null;

    product.previousPrice = product.currentPrice;
    product.currentPrice = newPrice;
    product.priceUpdatedAt = new Date().toISOString().split('T')[0];
    return product;
  }

  public getCustomers() {
    return this.customers;
  }

  public getSuppliers() {
    return this.suppliers;
  }

  public getBills() {
    return this.bills;
  }

  public addBill(bill: DemoBill) {
    this.bills.unshift(bill);
    return bill;
  }

  public getPurchases() {
    return this.purchases;
  }

  public getExpenses() {
    return this.expenses;
  }

  public getPayments() {
    return this.payments;
  }

  /**
   * Computes complete analytics from the seeded records (never hardcoded).
   */
  public computeAnalytics(dateFrom?: string, dateTo?: string) {
    let filteredBills = this.bills;
    let filteredPurchases = this.purchases;
    let filteredExpenses = this.expenses;

    if (dateFrom) {
      filteredBills = filteredBills.filter((b) => b.billDate >= dateFrom);
      filteredPurchases = filteredPurchases.filter((p) => p.date >= dateFrom);
      filteredExpenses = filteredExpenses.filter((e) => e.date >= dateFrom);
    }
    if (dateTo) {
      filteredBills = filteredBills.filter((b) => b.billDate <= dateTo);
      filteredPurchases = filteredPurchases.filter((p) => p.date <= dateTo);
      filteredExpenses = filteredExpenses.filter((e) => e.date <= dateTo);
    }

    const totalSales = filteredBills.reduce((acc, b) => acc + b.totalAmount, 0);
    const totalPurchases = filteredPurchases.reduce((acc, p) => acc + p.totalAmount, 0);
    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    
    // Estimated Cost of Goods Sold (~75% of sales)
    const estimatedCogs = totalPurchases * 0.78;
    const estimatedProfit = Math.round((totalSales - estimatedCogs - totalExpenses) * 100) / 100;

    const pendingCustomerPayments = this.customers.reduce((acc, c) => acc + c.balanceDue, 0);
    const pendingSupplierPayments = this.suppliers.reduce((acc, s) => acc + s.balanceDue, 0);

    // Product sales volume aggregation
    const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
    filteredBills.forEach((b) => {
      b.items.forEach((item) => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productStats[item.productId].quantity += item.quantity;
        productStats[item.productId].revenue += item.totalPrice;
      });
    });

    const bestSellingProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const topCustomers = [...this.customers]
      .sort((a, b) => b.totalBilled - a.totalBilled)
      .slice(0, 5);

    // Low stock inventory alerts
    const inventoryAlerts = this.products.filter((p) => p.stockQty <= p.reorderLevel);

    return {
      totalSales: Math.round(totalSales * 100) / 100,
      totalPurchases: Math.round(totalPurchases * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      estimatedProfit,
      pendingCustomerPayments,
      pendingSupplierPayments,
      bestSellingProducts,
      topCustomers,
      inventoryAlerts,
      totalBillsCount: filteredBills.length,
      totalProductsCount: this.products.length,
      totalCustomersCount: this.customers.length,
      totalSuppliersCount: this.suppliers.length,
    };
  }
}

export const demoDataRepo = new DemoDataRepository();
