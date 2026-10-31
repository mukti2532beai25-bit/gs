/**
 * BahiVerse AI — Export Service
 * Generates bill data exports in CSV, JSON, and Tally XML formats.
 */
import { prisma } from '../db.js';

export interface ExportOptions {
  billIds: string[];
  format: 'csv' | 'json' | 'tally-xml';
  businessName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ExportResult {
  content: string;
  mimeType: string;
  fileName: string;
}

// ── CSV Export ────────────────────────────────────────────────────────────────
function toCSV(bills: any[]): string {
  const headers = [
    'Bill ID', 'Bill Number', 'Bill Date', 'Vendor Name',
    'Customer', 'Status', 'Subtotal (₹)', 'Tax (₹)', 'Total (₹)',
    'Capture Mode', 'Confidence %', 'Created At'
  ];

  const rows = bills.map(b => [
    b.id,
    b.billNumber ?? '',
    b.billDate ?? '',
    b.vendorName ?? '',
    b.customer?.name ?? '',
    b.status,
    b.subtotal?.toFixed(2) ?? '',
    b.taxAmount?.toFixed(2) ?? '',
    b.totalAmount?.toFixed(2) ?? '',
    b.captureMode,
    b.confidence ? (b.confidence * 100).toFixed(0) + '%' : '',
    new Date(b.createdAt).toISOString(),
  ]);

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(','), ...rows.map(r => r.map(String).map(escape).join(','))];
  return lines.join('\n');
}

// ── JSON Export ───────────────────────────────────────────────────────────────
function toJSON(bills: any[], meta: { exportedAt: string; billCount: number; businessName?: string }): string {
  const data = {
    meta: {
      exportedAt: meta.exportedAt,
      billCount: meta.billCount,
      businessName: meta.businessName ?? 'BahiVerse AI Export',
      format: 'bahiverse-json-v1',
    },
    bills: bills.map(b => ({
      id: b.id,
      billNumber: b.billNumber,
      billDate: b.billDate,
      vendorName: b.vendorName,
      customer: b.customer ? { name: b.customer.name, phone: b.customer.phone } : null,
      status: b.status,
      financials: {
        subtotal: b.subtotal,
        taxAmount: b.taxAmount,
        totalAmount: b.totalAmount,
      },
      items: b.items?.map((item: any) => ({
        description: item.rawDescription,
        normalizedName: item.normalizedName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })) ?? [],
      captureMode: b.captureMode,
      confidence: b.confidence,
      createdAt: b.createdAt,
    })),
  };
  return JSON.stringify(data, null, 2);
}

// ── Tally XML Export ──────────────────────────────────────────────────────────
function toTallyXML(bills: any[], businessName: string): string {
  const escape = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const vouchers = bills.map(b => `
    <VOUCHER VCHTYPE="Sales" ACTION="Create">
      <DATE>${(b.billDate ?? new Date().toISOString().split('T')[0]).replace(/-/g, '')}</DATE>
      <VOUCHERNUMBER>${escape(b.billNumber ?? b.id)}</VOUCHERNUMBER>
      <PARTYLEDGERNAME>${escape(b.customer?.name ?? b.vendorName ?? 'Cash')}</PARTYLEDGERNAME>
      <AMOUNT>${b.totalAmount?.toFixed(2) ?? '0.00'}</AMOUNT>
      <NARRATION>${escape(b.notes ?? '')}</NARRATION>
      ${(b.items ?? []).map((item: any) => `
      <ALLINVENTORYENTRIES.LIST>
        <STOCKITEMNAME>${escape(item.normalizedName ?? item.rawDescription)}</STOCKITEMNAME>
        <ACTUALQTY>${item.quantity} ${escape(item.unit ?? 'Nos')}</ACTUALQTY>
        <RATE>${item.unitPrice?.toFixed(2) ?? '0.00'}/Nos</RATE>
        <AMOUNT>${item.totalPrice?.toFixed(2) ?? '0.00'}</AMOUNT>
      </ALLINVENTORYENTRIES.LIST>`).join('')}
    </VOUCHER>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${escape(businessName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          ${vouchers}
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

// ── Main export function ──────────────────────────────────────────────────────
export async function generateExport(options: ExportOptions): Promise<ExportResult> {
  const bills = await prisma.bill.findMany({
    where: { id: { in: options.billIds } },
    include: {
      items: true,
      customer: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const businessName = options.businessName ?? 'BahiVerse';

  if (options.format === 'csv') {
    return {
      content: toCSV(bills),
      mimeType: 'text/csv',
      fileName: `bahiverse-export-${timestamp}.csv`,
    };
  }

  if (options.format === 'json') {
    return {
      content: toJSON(bills, { exportedAt: new Date().toISOString(), billCount: bills.length, businessName }),
      mimeType: 'application/json',
      fileName: `bahiverse-export-${timestamp}.json`,
    };
  }

  if (options.format === 'tally-xml') {
    return {
      content: toTallyXML(bills, businessName),
      mimeType: 'application/xml',
      fileName: `bahiverse-tally-${timestamp}.xml`,
    };
  }

  throw new Error(`Unsupported format: ${options.format}`);
}
