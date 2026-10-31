import { api } from './api';

export interface CaReconciliationCheck {
  id: string;
  type: 'duplicate' | 'missing_field' | 'arithmetic_mismatch' | 'unconfirmed_draft';
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  recordRef?: string;
  suggestedAction?: string;
}

export interface CaValidationResult {
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

export interface CaOperationalData {
  sales: Array<{
    invoiceNumber: string;
    date: string;
    customerName: string;
    customerGstin: string;
    supplyType: string;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalAmount: number;
    status: string;
    notes?: string;
  }>;
  purchases: Array<{
    billNumber: string;
    date: string;
    supplierName: string;
    supplierGstin: string;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalAmount: number;
    status: string;
    itcEligible: boolean;
  }>;
  expenses: Array<{
    date: string;
    category: string;
    description: string;
    amount: number;
    paymentMode: string;
    voucherNo: string;
  }>;
  outstanding: Array<{
    entityName: string;
    type: string;
    phone: string;
    totalBilled: number;
    totalReceived: number;
    balanceDue: number;
    status: string;
  }>;
  disclaimer: string;
  responsibilityBoundaries: {
    bahiverseAi: string;
    charteredAccountant: string;
  };
}

export async function fetchCaPreparationData(from?: string, to?: string): Promise<{ success: boolean; data: CaOperationalData }> {
  const query = new URLSearchParams();
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  const res = await api.get(`/api/exports/ca/data?${query.toString()}`);
  return res.data;
}

export async function validateCaExport(from?: string, to?: string): Promise<{ success: boolean; data: CaValidationResult }> {
  const query = new URLSearchParams();
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  const res = await api.get(`/api/exports/ca/validate?${query.toString()}`);
  return res.data;
}

export async function downloadCaPackage(payload: {
  format: 'xlsx' | 'csv' | 'json';
  registerType?: 'all' | 'sales' | 'purchases' | 'expenses';
  from?: string;
  to?: string;
}): Promise<Blob | any> {
  if (payload.format === 'json') {
    const res = await api.post('/api/exports/ca/download', payload);
    return res.data;
  }

  const res = await api.post('/api/exports/ca/download', payload, {
    responseType: 'blob',
  });
  return res.data;
}
