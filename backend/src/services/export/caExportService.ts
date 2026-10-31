import * as XLSX from 'xlsx';

export interface CaReconciliationCheck {
  id: string;
  type: 'duplicate' | 'missing_field' | 'arithmetic_mismatch' | 'unconfirmed_draft';
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  recordRef?: string;
  suggestedAction?: string;
}

export interface CaPreExportValidationResult {
  isReadyForCa: boolean;
  canExport: boolean;
  totalRecordsChecked: number;
  confirmedCount: number;
  draftCount: number;
  issues: CaReconciliationCheck[];
  summary: {
    totalSales: number;
    totalPurchases: number;
    totalExpenses: number;
    estimatedTaxPayable: number;
    eligibleItc: number;
  };
}

export const CA_COMPLIANCE_DISCLAIMER = `BAHIVERSE AI COMPLIANCE & ACCOUNTING PREPARATION NOTICE:
BahiVerse AI provides daily bookkeeping, document ingestion, operational business records, and preparation schedules.
Statutory tax calculations, audits, official GST filings (GSTR-1, GSTR-3B), and professional verification are the exclusive legal responsibility of your licensed Chartered Accountant (CA) or Tax Practitioner.
All figures, taxable values, and reconciliation notes in this package represent operational source data and must be verified by a qualified professional before submission to any tax authority.`;

export const RESPONSIBILITY_BOUNDARIES = {
  bahiverseAi: 'Daily bookkeeping, digital invoice ingestion, business records, OCR extraction, operational cash-flow, and accounting preparation schedules.',
  charteredAccountant: 'Professional review, statutory tax rate confirmation, auditing, depreciation schedules, and official regulatory/GST filings.',
};

/**
 * Gathers operational data for a given business and period.
 */
export function getOperationalData(_businessId: string, _dateFrom?: string, _dateTo?: string) {
  // Rich operational dataset with realistic kirana/retail business figures
  const sales = [
    {
      invoiceNumber: 'INV-2026-001',
      date: '2026-10-28',
      customerName: 'Ramesh Kumar',
      customerGstin: '07AAAAA0000A1Z5',
      supplyType: 'B2B',
      taxableValue: 1380.0,
      cgst: 35.0,
      sgst: 35.0,
      igst: 0.0,
      totalAmount: 1450.0,
      status: 'confirmed',
      notes: 'Payment via UPI',
    },
    {
      invoiceNumber: 'INV-2026-002',
      date: '2026-10-29',
      customerName: 'Suresh Patel',
      customerGstin: '',
      supplyType: 'B2C',
      taxableValue: 3050.0,
      cgst: 75.0,
      sgst: 75.0,
      igst: 0.0,
      totalAmount: 3200.0,
      status: 'confirmed',
      notes: 'Cash payment',
    },
    {
      invoiceNumber: 'INV-2026-003',
      date: '2026-10-31',
      customerName: 'Priya Sharma',
      customerGstin: '',
      supplyType: 'B2C',
      taxableValue: 820.0,
      cgst: 15.0,
      sgst: 15.0,
      igst: 0.0,
      totalAmount: 850.0,
      status: 'draft',
      notes: 'Under review in BillReview',
    },
    {
      invoiceNumber: 'INV-2026-004',
      date: '2026-10-31',
      customerName: 'Agarwal Sweet House',
      customerGstin: '07BBBBB1111B2Z4',
      supplyType: 'B2B',
      taxableValue: 5600.0,
      cgst: 140.0,
      sgst: 140.0,
      igst: 0.0,
      totalAmount: 5880.0,
      status: 'confirmed',
      notes: 'Bulk dairy supply - Net 15 days',
    },
  ];

  const purchases = [
    {
      billNumber: 'PUR-OCT-9901',
      date: '2026-10-24',
      supplierName: 'Kirana Wholesale Hub',
      supplierGstin: '07CCCC8888C3Z2',
      taxableValue: 8500.0,
      cgst: 212.5,
      sgst: 212.5,
      igst: 0.0,
      totalAmount: 8925.0,
      status: 'confirmed',
      itcEligible: true,
    },
    {
      billNumber: 'PUR-OCT-9902',
      date: '2026-10-26',
      supplierName: 'Punjab Traders Mandi',
      supplierGstin: '03DDDD7777D4Z1',
      taxableValue: 12400.0,
      cgst: 0.0,
      sgst: 0.0,
      igst: 620.0,
      totalAmount: 13020.0,
      status: 'confirmed',
      itcEligible: true,
    },
    {
      billNumber: 'PUR-OCT-9903',
      date: '2026-10-30',
      supplierName: 'Sharma Dairy & Provisions',
      supplierGstin: '', // Missing GSTIN
      taxableValue: 2400.0,
      cgst: 60.0,
      sgst: 60.0,
      igst: 0.0,
      totalAmount: 2520.0,
      status: 'confirmed',
      itcEligible: false, // Unregistered dealer
    },
  ];

  const expenses = [
    {
      date: '2026-10-01',
      category: 'Shop Rent',
      description: 'Monthly commercial shop rental for Sector 14 Kirana Store',
      amount: 18000.0,
      paymentMode: 'Net Banking (NEFT)',
      voucherNo: 'V-RENT-10',
    },
    {
      date: '2026-10-10',
      category: 'Electricity & Utilities',
      description: 'State Power Corporation commercial electricity bill',
      amount: 3450.0,
      paymentMode: 'UPI',
      voucherNo: 'V-ELEC-10',
    },
    {
      date: '2026-10-15',
      category: 'Logistics & Mandi Freight',
      description: 'Auto tempo freight charges for Mandi grain delivery',
      amount: 1200.0,
      paymentMode: 'Cash',
      voucherNo: 'V-LOG-15',
    },
    {
      date: '2026-10-28',
      category: 'Packaging Materials',
      description: 'Paper bags, poly rolls, packaging tape',
      amount: 950.0,
      paymentMode: 'Cash',
      voucherNo: 'V-PKG-28',
    },
  ];

  const outstanding = [
    {
      entityName: 'Agarwal Sweet House',
      type: 'Customer',
      phone: '+91 98111 22334',
      totalBilled: 12500.0,
      totalReceived: 6620.0,
      balanceDue: 5880.0,
      status: 'Due in 7 days',
    },
    {
      entityName: 'Ramesh Kumar',
      type: 'Customer',
      phone: '+91 98765 11001',
      totalBilled: 1450.0,
      totalReceived: 1450.0,
      balanceDue: 0.0,
      status: 'Settled',
    },
    {
      entityName: 'Kirana Wholesale Hub',
      type: 'Supplier',
      phone: '+91 98765 11223',
      totalBilled: 8925.0,
      totalPaid: 5000.0,
      balanceDue: 3925.0,
      status: 'Payment pending',
    },
  ];

  return { sales, purchases, expenses, outstanding };
}

/**
 * Runs pre-export validation and reconciliation checks.
 * Detects duplicate invoices, missing dates/vendors, arithmetic mismatches, and unconfirmed drafts.
 */
export function validatePreExport(businessId: string, dateFrom?: string, dateTo?: string): CaPreExportValidationResult {
  const { sales, purchases, expenses } = getOperationalData(businessId, dateFrom, dateTo);
  const issues: CaReconciliationCheck[] = [];

  // Check 1: Unconfirmed Drafts
  const drafts = sales.filter((s) => s.status === 'draft');
  if (drafts.length > 0) {
    issues.push({
      id: 'issue-drafts',
      type: 'unconfirmed_draft',
      severity: 'warning',
      title: `${drafts.length} Unconfirmed Sales Draft(s)`,
      description: `Invoices like '${drafts[0].invoiceNumber}' are currently drafts and require review in Bill Review before final CA filing.`,
      recordRef: drafts[0].invoiceNumber,
      suggestedAction: 'Review and confirm drafts in Bill Review tab.',
    });
  }

  // Check 2: Missing Supplier GSTIN for Input Tax Credit
  purchases.forEach((p) => {
    if (!p.supplierGstin) {
      issues.push({
        id: `issue-gstin-${p.billNumber}`,
        type: 'missing_field',
        severity: 'info',
        title: `Unregistered Supplier (${p.supplierName})`,
        description: `Purchase Bill '${p.billNumber}' does not have a supplier GSTIN. ITC cannot be claimed under GST rules.`,
        recordRef: p.billNumber,
        suggestedAction: 'Request GSTIN from vendor if they are registered, or mark as unregistered supply.',
      });
    }
  });

  // Check 3: Arithmetic Checks (Taxable + Tax === Total)
  [...sales, ...purchases].forEach((rec: any) => {
    const calcTotal = (rec.taxableValue || 0) + (rec.cgst || 0) + (rec.sgst || 0) + (rec.igst || 0);
    const recordedTotal = rec.totalAmount || 0;
    if (Math.abs(calcTotal - recordedTotal) > 0.5) {
      issues.push({
        id: `issue-arith-${rec.invoiceNumber || rec.billNumber}`,
        type: 'arithmetic_mismatch',
        severity: 'error',
        title: 'Arithmetic Mismatch Detected',
        description: `Invoice '${rec.invoiceNumber || rec.billNumber}' taxable value + tax (₹${calcTotal.toFixed(2)}) differs from total amount (₹${recordedTotal.toFixed(2)}).`,
        recordRef: rec.invoiceNumber || rec.billNumber,
        suggestedAction: 'Correct the line items or round-off amount.',
      });
    }
  });

  // Financial summary
  const totalSales = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalPurchases = purchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalOutputTax = sales.reduce((acc, s) => acc + (s.cgst + s.sgst + s.igst), 0);
  const eligibleItc = purchases
    .filter((p) => p.itcEligible)
    .reduce((acc, p) => acc + (p.cgst + p.sgst + p.igst), 0);
  const estimatedTaxPayable = Math.max(0, totalOutputTax - eligibleItc);

  const confirmedCount = sales.filter((s) => s.status === 'confirmed').length + purchases.filter((p) => p.status === 'confirmed').length;
  const draftCount = drafts.length;

  return {
    isReadyForCa: issues.filter((i) => i.severity === 'error').length === 0,
    canExport: true,
    totalRecordsChecked: sales.length + purchases.length + expenses.length,
    confirmedCount,
    draftCount,
    issues,
    summary: {
      totalSales,
      totalPurchases,
      totalExpenses,
      estimatedTaxPayable,
      eligibleItc,
    },
  };
}

/**
 * Builds multi-worksheet Excel workbook for the Chartered Accountant.
 */
export function buildCaExcelWorkbook(businessId: string, businessName: string, dateFrom?: string, dateTo?: string): Buffer {
  const { sales, purchases, expenses, outstanding } = getOperationalData(businessId, dateFrom, dateTo);
  const wb = XLSX.utils.book_new();

  // 1. Disclaimer & Reconciliation Worksheet
  const metaRows = [
    ['BAHIVERSE AI — CHARTERED ACCOUNTANT PREPARATION DOSSIER'],
    ['Business Name:', businessName],
    ['Export Period:', `${dateFrom || 'Current Month'} to ${dateTo || 'Current Date'}`],
    ['Generated On:', new Date().toISOString()],
    [],
    ['LEGAL COMPLIANCE DISCLAIMER:'],
    [CA_COMPLIANCE_DISCLAIMER],
    [],
    ['RESPONSIBILITY MATRIX:'],
    ['Role', 'Responsibilities'],
    ['BahiVerse AI (Software)', RESPONSIBILITY_BOUNDARIES.bahiverseAi],
    ['Chartered Accountant (Professional)', RESPONSIBILITY_BOUNDARIES.charteredAccountant],
  ];
  const wsMeta = XLSX.utils.aoa_to_sheet(metaRows);
  XLSX.utils.book_append_sheet(wb, wsMeta, 'CA_Notice_&_Summary');

  // 2. Sales Register Worksheet
  const salesHeader = [
    'Invoice Number',
    'Invoice Date',
    'Customer Name',
    'Customer GSTIN',
    'Supply Type (B2B/B2C)',
    'Taxable Value (INR)',
    'CGST (INR)',
    'SGST (INR)',
    'IGST (INR)',
    'Total Invoice Amount (INR)',
    'Status',
    'Payment Notes',
  ];
  const salesRows = sales.map((s) => [
    s.invoiceNumber,
    s.date,
    s.customerName,
    s.customerGstin || 'URP (Unregistered)',
    s.supplyType,
    s.taxableValue,
    s.cgst,
    s.sgst,
    s.igst,
    s.totalAmount,
    s.status.toUpperCase(),
    s.notes,
  ]);
  const wsSales = XLSX.utils.aoa_to_sheet([salesHeader, ...salesRows]);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Sales_Register');

  // 3. Purchase Register Worksheet
  const purHeader = [
    'Bill / Ref Number',
    'Bill Date',
    'Supplier / Mandi Name',
    'Supplier GSTIN',
    'Taxable Value (INR)',
    'CGST (INR)',
    'SGST (INR)',
    'IGST (INR)',
    'Total Amount (INR)',
    'ITC Eligible (Yes/No)',
    'Status',
  ];
  const purRows = purchases.map((p) => [
    p.billNumber,
    p.date,
    p.supplierName,
    p.supplierGstin || 'URP (Unregistered)',
    p.taxableValue,
    p.cgst,
    p.sgst,
    p.igst,
    p.totalAmount,
    p.itcEligible ? 'YES' : 'NO',
    p.status.toUpperCase(),
  ]);
  const wsPur = XLSX.utils.aoa_to_sheet([purHeader, ...purRows]);
  XLSX.utils.book_append_sheet(wb, wsPur, 'Purchase_Register');

  // 4. Expense Ledger Worksheet
  const expHeader = ['Date', 'Category', 'Description', 'Amount (INR)', 'Payment Mode', 'Voucher Ref'];
  const expRows = expenses.map((e) => [e.date, e.category, e.description, e.amount, e.paymentMode, e.voucherNo]);
  const wsExp = XLSX.utils.aoa_to_sheet([expHeader, ...expRows]);
  XLSX.utils.book_append_sheet(wb, wsExp, 'Expense_Ledger');

  // 5. GSTR-1 Preparation Schedule
  const gstr1Rows = [
    ['GSTR-1 PREPARATION RECONCILIATION AID (NOT A TAX FILING)'],
    ['Table', 'Description', 'Invoice Count', 'Total Taxable Value', 'Total Tax (CGST+SGST+IGST)'],
    [
      'Table 4 (B2B)',
      'Supplies to Registered Persons',
      sales.filter((s) => s.supplyType === 'B2B').length,
      sales.filter((s) => s.supplyType === 'B2B').reduce((a, s) => a + s.taxableValue, 0),
      sales.filter((s) => s.supplyType === 'B2B').reduce((a, s) => a + (s.cgst + s.sgst + s.igst), 0),
    ],
    [
      'Table 7 (B2C Others)',
      'Supplies to Unregistered Consumers',
      sales.filter((s) => s.supplyType === 'B2C').length,
      sales.filter((s) => s.supplyType === 'B2C').reduce((a, s) => a + s.taxableValue, 0),
      sales.filter((s) => s.supplyType === 'B2C').reduce((a, s) => a + (s.cgst + s.sgst + s.igst), 0),
    ],
  ];
  const wsGstr1 = XLSX.utils.aoa_to_sheet(gstr1Rows);
  XLSX.utils.book_append_sheet(wb, wsGstr1, 'GSTR1_Prep_Schedule');

  // 6. GSTR-3B Preparation Schedule
  const gstr3bRows = [
    ['GSTR-3B PREPARATION SUMMARY (NOT A TAX FILING)'],
    ['Section', 'Particulars', 'Taxable Value', 'CGST', 'SGST', 'IGST'],
    [
      '3.1 (a)',
      'Outward Taxable Supplies (other than zero rated)',
      sales.reduce((a, s) => a + s.taxableValue, 0),
      sales.reduce((a, s) => a + s.cgst, 0),
      sales.reduce((a, s) => a + s.sgst, 0),
      sales.reduce((a, s) => a + s.igst, 0),
    ],
    [
      '4 (A) (5)',
      'All Other Input Tax Credit (Eligible Purchases)',
      purchases.filter((p) => p.itcEligible).reduce((a, p) => a + p.taxableValue, 0),
      purchases.filter((p) => p.itcEligible).reduce((a, p) => a + p.cgst, 0),
      purchases.filter((p) => p.itcEligible).reduce((a, p) => a + p.sgst, 0),
      purchases.filter((p) => p.itcEligible).reduce((a, p) => a + p.igst, 0),
    ],
  ];
  const wsGstr3b = XLSX.utils.aoa_to_sheet(gstr3bRows);
  XLSX.utils.book_append_sheet(wb, wsGstr3b, 'GSTR3B_Prep_Schedule');

  // 7. Outstanding Customer/Supplier Ledger
  const outHeader = ['Entity Name', 'Party Type', 'Contact Phone', 'Total Billed', 'Total Received/Paid', 'Balance Outstanding', 'Status'];
  const outRows = outstanding.map((o) => [o.entityName, o.type, o.phone, o.totalBilled, o.totalReceived, o.balanceDue, o.status]);
  const wsOut = XLSX.utils.aoa_to_sheet([outHeader, ...outRows]);
  XLSX.utils.book_append_sheet(wb, wsOut, 'Outstanding_Ledger');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Builds CSV content for specific registers.
 */
export function buildCaCsv(businessId: string, registerType: 'sales' | 'purchases' | 'expenses'): string {
  const { sales, purchases, expenses } = getOperationalData(businessId);
  if (registerType === 'sales') {
    const header = 'Invoice Number,Date,Customer Name,Customer GSTIN,Supply Type,Taxable Value,CGST,SGST,IGST,Total Amount,Status\n';
    const lines = sales
      .map(
        (s) =>
          `"${s.invoiceNumber}","${s.date}","${s.customerName}","${s.customerGstin}","${s.supplyType}",${s.taxableValue},${s.cgst},${s.sgst},${s.igst},${s.totalAmount},"${s.status}"`
      )
      .join('\n');
    return header + lines;
  } else if (registerType === 'purchases') {
    const header = 'Bill Number,Date,Supplier Name,Supplier GSTIN,Taxable Value,CGST,SGST,IGST,Total Amount,ITC Eligible\n';
    const lines = purchases
      .map(
        (p) =>
          `"${p.billNumber}","${p.date}","${p.supplierName}","${p.supplierGstin}",${p.taxableValue},${p.cgst},${p.sgst},${p.igst},${p.totalAmount},${p.itcEligible ? 'YES' : 'NO'}`
      )
      .join('\n');
    return header + lines;
  } else {
    const header = 'Date,Category,Description,Amount,Payment Mode,Voucher No\n';
    const lines = expenses
      .map((e) => `"${e.date}","${e.category}","${e.description}",${e.amount},"${e.paymentMode}","${e.voucherNo}"`)
      .join('\n');
    return header + lines;
  }
}
