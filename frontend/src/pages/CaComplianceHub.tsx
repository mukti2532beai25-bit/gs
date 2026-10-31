import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Download,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  ShoppingBag,
  CreditCard,
  Users,
  Layers,
  Sparkles,
} from 'lucide-react';
import { fetchCaPreparationData, CaOperationalData } from '../services/caExportApi';
import ExportForCaModal from '../components/export/ExportForCaModal';

export default function CaComplianceHub() {
  const [activeTab, setActiveTab] = useState<
    'sales' | 'purchases' | 'expenses' | 'outstanding' | 'gstr1' | 'gstr3b'
  >('sales');
  const [data, setData] = useState<CaOperationalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchCaPreparationData();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load CA preparation data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalSales = data?.sales.reduce((acc, s) => acc + s.totalAmount, 0) || 0;
  const totalPurchases = data?.purchases.reduce((acc, p) => acc + p.totalAmount, 0) || 0;
  const totalExpenses = data?.expenses.reduce((acc, e) => acc + e.amount, 0) || 0;
  const totalEligibleItc =
    data?.purchases
      .filter((p) => p.itcEligible)
      .reduce((acc, p) => acc + (p.cgst + p.sgst + p.igst), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-white/10 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-emerald">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              CA Reports & Compliance Preparation Hub
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                Preparation Dossier
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Statutory preparation schedules, sales/purchase ledgers, and reconciliation registers for your Chartered Accountant
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowExportModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-xs flex items-center gap-2 shadow-glow-emerald hover:brightness-110 active:scale-95 transition-all shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          One-Click Export for CA
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Prominent Statutory Responsibility Boundary Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-amber-500/30 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4" />
          Legal Responsibility Boundary & Preparation Protocol
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <p className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> BahiVerse AI Role (Platform)
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              {data?.responsibilityBoundaries?.bahiverseAi ||
                'Daily bookkeeping, receipt scanning, business records, OCR extraction, cash-flow, and accounting preparation schedules.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Chartered Accountant (Professional)
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              {data?.responsibilityBoundaries?.charteredAccountant ||
                'Professional review, statutory tax rate confirmation, auditing, depreciation schedules, and official regulatory/GST filings.'}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 italic">
          * Notice: BahiVerse AI does not file official GST returns. All figures in this hub are operational preparation schedules ready for your CA's verification.
        </p>
      </div>

      {/* High Level Operational Financial Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Recorded Sales</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-white">₹{totalSales.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-emerald-400 mt-0.5">
            {data?.sales.length || 0} Invoices recorded
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Procurement / Purchases</span>
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-bold text-white">₹{totalPurchases.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-cyan-400 mt-0.5">
            {data?.purchases.length || 0} Bills registered
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Operating Expenses</span>
            <CreditCard className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-white">₹{totalExpenses.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-amber-400 mt-0.5">
            {data?.expenses.length || 0} Expense vouchers
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Eligible Input Tax (ITC)</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl font-bold text-purple-400">₹{totalEligibleItc.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">From registered suppliers</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        {[
          { id: 'sales', label: 'Sales Register', icon: Receipt },
          { id: 'purchases', label: 'Purchase Register', icon: ShoppingBag },
          { id: 'expenses', label: 'Expense Ledger', icon: CreditCard },
          { id: 'outstanding', label: 'Outstanding (Customer/Supplier)', icon: Users },
          { id: 'gstr1', label: 'GSTR-1 Preparation', icon: Layers },
          { id: 'gstr3b', label: 'GSTR-3B Preparation', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald'
                  : 'bg-white/5 text-slate-400 border border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 shadow-xl overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            Loading statutory compliance schedule...
          </div>
        ) : activeTab === 'sales' ? (
          /* 1. Sales Register Table */
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Sales Register (Inward & Outward Taxable Invoices)</h3>
              <span className="text-xs text-slate-400">{data?.sales.length || 0} Records</span>
            </div>
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">GSTIN</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Taxable Val</th>
                  <th className="py-2.5 px-3 text-right">CGST</th>
                  <th className="py-2.5 px-3 text-right">SGST</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.sales.map((s, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-white">{s.invoiceNumber}</td>
                    <td className="py-2.5 px-3">{s.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{s.customerName}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                      {s.customerGstin || <span className="text-slate-500 italic">Unregistered</span>}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono">
                        {s.supplyType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">₹{s.taxableValue.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">₹{s.cgst.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">₹{s.sgst.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                      ₹{s.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {s.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'purchases' ? (
          /* 2. Purchase Register Table */
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Purchase Register (Procurement & Inward Supplies)</h3>
              <span className="text-xs text-slate-400">{data?.purchases.length || 0} Bills</span>
            </div>
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Bill / Ref #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Supplier / Mandi</th>
                  <th className="py-2.5 px-3">Supplier GSTIN</th>
                  <th className="py-2.5 px-3 text-right">Taxable Val</th>
                  <th className="py-2.5 px-3 text-right">CGST</th>
                  <th className="py-2.5 px-3 text-right">SGST</th>
                  <th className="py-2.5 px-3 text-right">IGST</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center">ITC Eligible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.purchases.map((p, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-white">{p.billNumber}</td>
                    <td className="py-2.5 px-3">{p.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{p.supplierName}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                      {p.supplierGstin || <span className="text-rose-400 italic">Missing GSTIN</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right">₹{p.taxableValue.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">₹{p.cgst.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">₹{p.sgst.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">₹{p.igst.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-cyan-400">
                      ₹{p.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.itcEligible
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {p.itcEligible ? 'YES (ITC)' : 'NO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'expenses' ? (
          /* 3. Expense Ledger Table */
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Expense Ledger (Operations, Rent, Logistics)</h3>
              <span className="text-xs text-slate-400">{data?.expenses.length || 0} Entries</span>
            </div>
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Payment Mode</th>
                  <th className="py-2.5 px-3">Voucher Ref</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.expenses.map((e, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3">{e.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{e.category}</td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs">{e.description}</td>
                    <td className="py-2.5 px-3">{e.paymentMode}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{e.voucherNo}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                      ₹{e.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'outstanding' ? (
          /* 4. Outstanding Ledger */
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Party Outstanding & Balance Ledger</h3>
              <span className="text-xs text-slate-400">{data?.outstanding.length || 0} Parties</span>
            </div>
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Entity Name</th>
                  <th className="py-2.5 px-3">Party Type</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3 text-right">Total Billed</th>
                  <th className="py-2.5 px-3 text-right">Paid / Settled</th>
                  <th className="py-2.5 px-3 text-right">Balance Due</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.outstanding.map((o, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">{o.entityName}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-white/10 text-[10px]">
                        {o.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{o.phone}</td>
                    <td className="py-2.5 px-3 text-right">₹{o.totalBilled.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">₹{o.totalReceived.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-400">
                      ₹{o.balanceDue.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-300">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'gstr1' ? (
          /* 5. GSTR-1 Preparation Schedule */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
              <p className="font-semibold text-purple-300 mb-1">
                GSTR-1 Preparation Reconciliation Summary
              </p>
              <p>
                This worksheet structures your outward taxable sales into official GSTR-1 Table formats (Table 4 B2B and Table 7 B2C) for your CA to easily review and verify prior to filing on the GST Portal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-xs font-bold text-white uppercase tracking-wider">
                  Table 4 — B2B Supplies (Registered Persons)
                </p>
                <div className="text-xs space-y-1 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Invoice Count</span>
                    <span className="font-mono font-bold text-white">
                      {data?.sales.filter((s) => s.supplyType === 'B2B').length}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Total Taxable Value</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ₹{data?.sales.filter((s) => s.supplyType === 'B2B').reduce((a, s) => a + s.taxableValue, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Total Tax (CGST + SGST + IGST)</span>
                    <span className="font-mono font-bold text-white">
                      ₹{data?.sales.filter((s) => s.supplyType === 'B2B').reduce((a, s) => a + (s.cgst + s.sgst + s.igst), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-xs font-bold text-white uppercase tracking-wider">
                  Table 7 — B2C Others (Consumers / Unregistered)
                </p>
                <div className="text-xs space-y-1 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Invoice Count</span>
                    <span className="font-mono font-bold text-white">
                      {data?.sales.filter((s) => s.supplyType === 'B2C').length}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Total Taxable Value</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ₹{data?.sales.filter((s) => s.supplyType === 'B2C').reduce((a, s) => a + s.taxableValue, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Total Tax (CGST + SGST + IGST)</span>
                    <span className="font-mono font-bold text-white">
                      ₹{data?.sales.filter((s) => s.supplyType === 'B2C').reduce((a, s) => a + (s.cgst + s.sgst + s.igst), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 6. GSTR-3B Preparation Schedule */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-200">
              <p className="font-semibold text-teal-300 mb-1">
                GSTR-3B Preparation Summary & Tax Reconciliation
              </p>
              <p>
                Preparation view aggregating total output tax liability against verified Input Tax Credit (ITC) from registered supplier purchases.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/5 text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="py-2.5 px-3">GSTR-3B Table</th>
                    <th className="py-2.5 px-3">Particulars</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                    <th className="py-2.5 px-3 text-right">CGST</th>
                    <th className="py-2.5 px-3 text-right">SGST</th>
                    <th className="py-2.5 px-3 text-right">IGST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-3 px-3 font-mono font-bold text-white">3.1 (a)</td>
                    <td className="py-3 px-3 font-semibold text-white">
                      Outward Taxable Supplies (Standard Kirana Sales)
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      ₹{data?.sales.reduce((a, s) => a + s.taxableValue, 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      ₹{data?.sales.reduce((a, s) => a + s.cgst, 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      ₹{data?.sales.reduce((a, s) => a + s.sgst, 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      ₹{data?.sales.reduce((a, s) => a + s.igst, 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono font-bold text-white">4 (A) (5)</td>
                    <td className="py-3 px-3 font-semibold text-white">
                      Eligible Input Tax Credit (ITC on Purchases)
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-purple-400">
                      ₹{data?.purchases.filter((p) => p.itcEligible).reduce((a, p) => a + p.taxableValue, 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-purple-400">
                      ₹{data?.purchases.filter((p) => p.itcEligible).reduce((a, p) => a + p.cgst, 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-purple-400">
                      ₹{data?.purchases.filter((p) => p.itcEligible).reduce((a, p) => a + p.sgst, 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-purple-400">
                      ₹{data?.purchases.filter((p) => p.itcEligible).reduce((a, p) => a + p.igst, 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <ExportForCaModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
    </div>
  );
}
