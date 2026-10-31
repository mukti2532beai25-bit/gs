import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBill, useBills } from '../hooks/useBills';
import { useToast } from '../hooks/useToast';
import { billsApi } from '../services/api';
import ExtractionDataScene3D from '../three/ExtractionDataScene3D';
import {
  FileCheck2,
  Check,
  Save,
  Trash2,
  Mic,
  ArrowLeft,
  Plus,
  Loader2,
  AlertTriangle,
  Receipt,
  FileText,
} from 'lucide-react';
import { formatCurrency, formatConfidence, confidenceColor, STATUS_LABELS } from '../utils/formatters';
import { BillItem } from '../types/bahiverse';

export default function BillReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // If no ID in URL, display list of bills to review
  const { bills, isLoading: listLoading, refetch: refetchList } = useBills();
  const activeBillId = id || (bills.length > 0 ? bills[0].id : undefined);

  const { bill, isLoading: billLoading, refetch: refetchBill } = useBill(activeBillId);

  // Editable form state
  const [vendorName, setVendorName] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState('');
  const [subtotal, setSubtotal] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [items, setItems] = useState<BillItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (bill) {
      setVendorName(bill.vendorName || '');
      setBillNumber(bill.billNumber || '');
      setBillDate(bill.billDate || '');
      setSubtotal(bill.subtotal || 0);
      setTaxAmount(bill.taxAmount || 0);
      setTotalAmount(bill.totalAmount || 0);
      setItems(bill.items || []);
    }
  }, [bill]);

  // Handle item change
  const handleItemChange = (index: number, field: keyof BillItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate total price
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) : updated[index].quantity;
      const p = field === 'unitPrice' ? Number(value) : updated[index].unitPrice ?? 0;
      updated[index].totalPrice = Number((q * p).toFixed(2));
    }

    setItems(updated);

    // Recalculate subtotal
    const newSubtotal = updated.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0);
    setSubtotal(newSubtotal);
    setTotalAmount(Number((newSubtotal + taxAmount).toFixed(2)));
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: 'new-' + Date.now(),
        billId: activeBillId || '',
        rawDescription: 'New Product Item',
        normalizedName: 'New Product',
        quantity: 1,
        unit: 'piece',
        unitPrice: 0,
        totalPrice: 0,
        confidence: 1.0,
        isEdited: true,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    const newSubtotal = updated.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0);
    setSubtotal(newSubtotal);
    setTotalAmount(Number((newSubtotal + taxAmount).toFixed(2)));
  };

  const handleSaveReview = async () => {
    if (!activeBillId) return;
    setIsSaving(true);
    try {
      await billsApi.review(activeBillId, {
        vendorName,
        billNumber,
        billDate,
        subtotal,
        taxAmount,
        totalAmount,
        items,
      });
      addToast({ type: 'success', message: 'Corrections and line items saved!' });
      refetchBill();
      refetchList();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to save review' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveBill = async () => {
    if (!activeBillId) return;
    try {
      await billsApi.approve(activeBillId);
      addToast({ type: 'success', message: 'Bill approved and finalized to store ledger!' });
      refetchBill();
      refetchList();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Approval failed' });
    }
  };

  const handleDeleteBill = async () => {
    if (!activeBillId || !window.confirm('Delete this bill and all line items?')) return;
    try {
      await billsApi.delete(activeBillId);
      addToast({ type: 'info', message: 'Bill removed from ledger' });
      navigate('/review');
      refetchList();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  if (listLoading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs">
        Loading review ledger...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-medium mb-2">
            <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
            Module 03 — Human-in-the-Loop Review
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Bill Review & Extraction Verification
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Validate neural extraction confidence, edit line items, and adjust taxes.
          </p>
        </div>

        {bill && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/whisperflow?billId=${bill.id}`)}
              className="btn-secondary py-2.5 px-4 text-xs"
              title="Voice correction with WhisperFlow"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>Voice Edit</span>
            </button>

            <button
              onClick={handleSaveReview}
              disabled={isSaving}
              className="btn-secondary py-2.5 px-4 text-xs font-semibold"
            >
              <Save className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              onClick={handleApproveBill}
              className="btn-emerald py-2.5 px-5 text-xs font-bold"
            >
              <Check className="w-4 h-4" />
              <span>Approve Record</span>
            </button>
          </div>
        )}
      </div>

      {bills.length === 0 ? (
        <div className="glass-panel p-16 text-center border-dashed border-white/10">
          <Receipt className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No bills available for review</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Scan or upload receipts in the Capture Bill portal first.
          </p>
          <button
            onClick={() => navigate('/capture')}
            className="btn-primary mt-4 py-2 px-4 text-xs"
          >
            Go to Capture Bill
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Bills Selector + 3D Telemetry */}
          <div className="lg:col-span-4 space-y-6">
            {/* 3D Extraction Telemetry Scene */}
            <div className="glass-panel p-5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  Neural Confidence Telemetry
                </span>
                <span className={`text-xs font-mono font-bold ${confidenceColor(bill?.confidence || 0.88)}`}>
                  {formatConfidence(bill?.confidence || 0.88)} Overall
                </span>
              </div>
              <div className="w-full h-52">
                <ExtractionDataScene3D overallConfidence={bill?.confidence || 0.88} />
              </div>
            </div>

            {/* Bill Queue List */}
            <div className="glass-panel p-4 space-y-2">
              <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider px-2 mb-2">
                All Captured Bills ({bills.length})
              </div>
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {bills.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => navigate(`/review/${b.id}`)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      b.id === activeBillId
                        ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-glow-cyan'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="text-xs font-bold truncate text-slate-200">
                        {b.vendorName || b.billNumber || 'Bill #' + b.id.slice(0, 6)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {b.billDate || 'No date'} • {formatCurrency(b.totalAmount)}
                      </div>
                    </div>
                    <span className={`status-${b.status} text-[10px]`}>
                      {STATUS_LABELS[b.status] || b.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Editable Bill Form & Line Items Table */}
          <div className="lg:col-span-8 space-y-6">
            {billLoading ? (
              <div className="glass-panel p-16 text-center text-slate-400 font-mono text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                Loading bill details...
              </div>
            ) : !bill ? (
              <div className="glass-panel p-12 text-center text-slate-400 text-xs">
                Select a bill from the queue to start review.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Bill Header Info Card */}
                <div className="glass-panel p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-cyan-400" />
                      Invoice Metadata
                    </h2>
                    <button
                      onClick={handleDeleteBill}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Bill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">
                        Vendor / Store Name
                      </label>
                      <input
                        type="text"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        className="input-field text-sm"
                        placeholder="e.g. Sharma Store"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">
                        Invoice / Bill Number
                      </label>
                      <input
                        type="text"
                        value={billNumber}
                        onChange={(e) => setBillNumber(e.target.value)}
                        className="input-field text-sm"
                        placeholder="e.g. INV-1092"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">
                        Bill Date
                      </label>
                      <input
                        type="date"
                        value={billDate}
                        onChange={(e) => setBillDate(e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="glass-panel p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-100">Extracted Line Items</h3>
                      <p className="text-xs text-slate-400">
                        Normalized against shop catalog and historical transaction rates.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="btn-secondary py-1.5 px-3 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Row</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 font-mono">
                          <th className="pb-3 font-medium">Raw Description</th>
                          <th className="pb-3 font-medium">Standard Name</th>
                          <th className="pb-3 font-medium w-20">Qty</th>
                          <th className="pb-3 font-medium w-20">Unit</th>
                          <th className="pb-3 font-medium w-28">Rate (₹)</th>
                          <th className="pb-3 font-medium w-28">Total (₹)</th>
                          <th className="pb-3 font-medium w-16 text-center">Conf.</th>
                          <th className="pb-3 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {items.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 pr-2">
                              <input
                                type="text"
                                value={item.rawDescription}
                                onChange={(e) => handleItemChange(idx, 'rawDescription', e.target.value)}
                                className="w-full bg-transparent border-b border-transparent focus:border-cyan-400 text-slate-200 outline-none"
                              />
                            </td>
                            <td className="py-2.5 pr-2">
                              <input
                                type="text"
                                value={item.normalizedName || ''}
                                onChange={(e) => handleItemChange(idx, 'normalizedName', e.target.value)}
                                className="w-full bg-transparent border-b border-transparent focus:border-emerald-400 text-emerald-300 outline-none"
                              />
                            </td>
                            <td className="py-2.5 pr-2">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                className="w-full bg-transparent border-b border-transparent focus:border-cyan-400 font-mono text-slate-100 outline-none"
                              />
                            </td>
                            <td className="py-2.5 pr-2">
                              <input
                                type="text"
                                value={item.unit || ''}
                                onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                                className="w-full bg-transparent border-b border-transparent focus:border-cyan-400 font-mono text-slate-400 outline-none"
                              />
                            </td>
                            <td className="py-2.5 pr-2">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.unitPrice ?? ''}
                                onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                                className="w-full bg-transparent border-b border-transparent focus:border-cyan-400 font-mono text-slate-100 outline-none"
                              />
                            </td>
                            <td className="py-2.5 pr-2 font-mono font-bold text-slate-100">
                              ₹{(item.totalPrice ?? 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 text-center font-mono">
                              <span className={`text-[10px] ${confidenceColor(item.confidence)}`}>
                                {formatConfidence(item.confidence)}
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => handleRemoveItem(idx)}
                                className="text-slate-500 hover:text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary & Tax Breakdown */}
                  <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-end gap-4">
                    <div className="text-xs text-slate-400 max-w-sm">
                      <p className="font-mono text-slate-500">
                        Original raw OCR text preserved. Editing a field recalculates taxes automatically.
                      </p>
                    </div>

                    <div className="w-full sm:w-64 space-y-2 text-xs font-mono">
                      <div className="flex justify-between text-slate-400">
                        <span>Subtotal:</span>
                        <span className="text-slate-200">₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>GST / Tax:</span>
                        <input
                          type="number"
                          step="any"
                          value={taxAmount}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setTaxAmount(val);
                            setTotalAmount(Number((subtotal + val).toFixed(2)));
                          }}
                          className="w-20 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-right font-mono text-slate-200 outline-none"
                        />
                      </div>
                      <div className="flex justify-between text-sm font-bold pt-2 border-t border-white/10 text-emerald-400">
                        <span>Grand Total:</span>
                        <span>₹{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
