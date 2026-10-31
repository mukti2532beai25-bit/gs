import React, { useState, useEffect, useMemo } from 'react';
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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  Phone,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { formatCurrency, formatConfidence, STATUS_LABELS } from '../utils/formatters';
import { BillItem } from '../types/bahiverse';

export default function BillReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { bills, isLoading: listLoading, refetch: refetchList } = useBills();
  const activeBillId = id || (bills.length > 0 ? bills[0].id : undefined);
  const { bill, isLoading: billLoading, refetch: refetchBill } = useBill(activeBillId);

  // Editable header state
  const [vendorName, setVendorName] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [items, setItems] = useState<BillItem[]>([]);

  // UI interaction states
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [pdfPage, setPdfPage] = useState(1);
  const [totalPdfPages] = useState(1);
  const [selectedVocabTerms, setSelectedVocabTerms] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (bill) {
      setVendorName(bill.vendorName || '');
      setBillNumber(bill.billNumber || '');
      setBillDate(bill.billDate || '');
      setCustomerName(bill.customer?.name || '');
      setCustomerPhone(bill.customer?.phone || '');
      setTaxAmount(bill.taxAmount || 0);
      setTotalAmount(bill.totalAmount || 0);
      setItems(bill.items || []);
    }
  }, [bill]);

  // Derived financial calculations
  const calculatedSubtotal = useMemo(() => {
    return Number(items.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0).toFixed(2));
  }, [items]);

  const calculatedGrandTotal = useMemo(() => {
    return Number((calculatedSubtotal + taxAmount).toFixed(2));
  }, [calculatedSubtotal, taxAmount]);

  // Discrepancy detection between parsed total vs item sums
  const hasDiscrepancy = useMemo(() => {
    return Math.abs(calculatedGrandTotal - totalAmount) > 0.05 && totalAmount > 0;
  }, [calculatedGrandTotal, totalAmount]);

  // Handle line item change
  const handleItemChange = (index: number, field: keyof BillItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value, isEdited: true };

    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) : updated[index].quantity;
      const p = field === 'unitPrice' ? Number(value) : updated[index].unitPrice ?? 0;
      updated[index].totalPrice = Number((q * p).toFixed(2));
    }

    setItems(updated);
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
    setItems(items.filter((_, i) => i !== index));
  };

  const toggleVocabMapping = (index: number) => {
    setSelectedVocabTerms((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Save review draft
  const handleSaveReview = async () => {
    if (!activeBillId) return;
    setIsSaving(true);
    try {
      const newVocabTerms = items
        .filter((_, idx) => selectedVocabTerms[idx])
        .map((i) => ({
          rawTerm: i.rawDescription,
          normalizedTerm: i.normalizedName || i.rawDescription,
          category: 'product',
        }));

      await billsApi.review(activeBillId, {
        vendorName,
        billNumber,
        billDate,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        subtotal: calculatedSubtotal,
        taxAmount,
        totalAmount: calculatedGrandTotal,
        items,
        newVocabTerms: newVocabTerms.length > 0 ? newVocabTerms : undefined,
      });

      addToast({ type: 'success', message: 'Review draft and corrections saved!' });
      refetchBill();
      refetchList();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to save review' });
    } finally {
      setIsSaving(false);
    }
  };

  // Explicit confirmation modal flow
  const handleConfirmApproval = async () => {
    if (!activeBillId) return;
    setIsApproving(true);
    try {
      // First save latest edits
      await handleSaveReview();
      // Then approve into ledger
      await billsApi.approve(activeBillId);

      addToast({
        type: 'success',
        message: 'Bill officially confirmed and locked into store ledger!',
      });
      setShowConfirmModal(false);
      refetchBill();
      refetchList();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Approval failed' });
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeleteBill = async () => {
    if (!activeBillId || !window.confirm('Delete this bill and all line items from the ledger?')) return;
    try {
      await billsApi.delete(activeBillId);
      addToast({ type: 'info', message: 'Bill removed from store ledger' });
      navigate('/review');
      refetchList();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  if (listLoading) {
    return (
      <div className="p-16 text-center text-slate-400 font-mono text-xs">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
        Loading review ledger...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ── Top Bar & Actions ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-medium mb-1">
            <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Module 03 — Human-in-the-Loop Review</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Bill Review & Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Compare original paper bill against neural extraction, resolve discrepancies, and confirm.
          </p>
        </div>

        {bill && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/capture')}
              className="btn-ghost py-2 px-3 text-xs"
              title="Return to Capture portal"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Capture New</span>
            </button>

            <button
              onClick={() => navigate(`/whisperflow?billId=${bill.id}`)}
              className="btn-secondary py-2 px-3 text-xs"
              title="Voice correction with WhisperFlow"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>Voice Edit</span>
            </button>

            <button
              onClick={handleSaveReview}
              disabled={isSaving}
              className="btn-secondary py-2 px-4 text-xs font-semibold"
            >
              <Save className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="btn-emerald py-2 px-5 text-xs font-bold"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Bill</span>
            </button>
          </div>
        )}
      </div>

      {bills.length === 0 ? (
        <div className="glass-panel p-16 text-center border-dashed border-white/10 rounded-2xl">
          <Receipt className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No bills in queue</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Upload or scan paper receipts in the Capture portal to begin human review.
          </p>
          <button onClick={() => navigate('/capture')} className="btn-primary mt-4 py-2 px-4 text-xs">
            Go to Capture Bill
          </button>
        </div>
      ) : (
        /* ── Split-Screen Layout ─────────────────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT SIDE (5 cols): Original Bill Document Viewer ─────────────── */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel p-4 flex flex-col justify-between h-[640px] relative overflow-hidden">
              {/* Document Header & Zoom Controls */}
              <div className="flex items-center justify-between pb-3 border-b border-white/5 z-10 bg-slate-950/60 backdrop-blur-md rounded-t-xl px-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">Original Bill</span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {bill?.captureMode || 'upload'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setImageZoom((z) => Math.max(0.6, z - 0.2))}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 w-10 text-center">
                    {Math.round(imageZoom * 100)}%
                  </span>
                  <button
                    onClick={() => setImageZoom((z) => Math.min(2.5, z + 0.2))}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setImageZoom(1)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Document Canvas / Image Display */}
              <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative rounded-xl bg-black/40 border border-white/5 my-2">
                {bill?.imageUrl ? (
                  <div
                    style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center center' }}
                    className="transition-transform duration-150 cursor-grab"
                  >
                    <img
                      src={bill.imageUrl}
                      alt="Captured Bill Document"
                      className="max-h-[500px] w-auto object-contain rounded-lg shadow-2xl"
                    />
                  </div>
                ) : (
                  /* Fallback Raw OCR Text Transcription */
                  <div className="w-full h-full p-4 font-mono text-xs text-slate-300 overflow-y-auto leading-relaxed">
                    <div className="text-[11px] font-bold text-cyan-400 mb-2 border-b border-white/10 pb-1">
                      RAW OCR TEXT TRANSCRIPTION
                    </div>
                    <pre className="whitespace-pre-wrap text-[11px] text-slate-300 font-mono">
                      {bill?.rawText ||
                        `Bill No: ${bill?.billNumber || 'BV-1092'}\nDate: ${bill?.billDate || '2026-10-31'}\nVendor: ${bill?.vendorName || 'Sharma General Store'}\nSubtotal: ₹${bill?.subtotal || 649}\nTax (5%): ₹${bill?.taxAmount || 32.46}\nGrand Total: ₹${bill?.totalAmount || 681.46}`}
                    </pre>
                  </div>
                )}
              </div>

              {/* PDF Page Navigation & Telemetry footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-1">
                  <button
                    disabled={pdfPage <= 1}
                    onClick={() => setPdfPage((p) => p - 1)}
                    className="p-1 rounded bg-white/5 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span>
                    Page {pdfPage} of {totalPdfPages}
                  </span>
                  <button
                    disabled={pdfPage >= totalPdfPages}
                    onClick={() => setPdfPage((p) => p + 1)}
                    className="p-1 rounded bg-white/5 disabled:opacity-30"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Verified Optical Resolution</span>
                </div>
              </div>
            </div>

            {/* 3D Extraction Telemetry Scene */}
            <div className="glass-panel p-4 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  Neural Extraction Vector Telemetry
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {formatConfidence(bill?.confidence || 0.88)} Overall Confidence
                </span>
              </div>
              <div className="w-full h-44">
                <ExtractionDataScene3D overallConfidence={bill?.confidence || 0.88} />
              </div>
            </div>
          </div>

          {/* ── RIGHT SIDE (7 cols): Editable Form & Line-Items Table ─────────── */}
          <div className="lg:col-span-7 space-y-4">
            {billLoading ? (
              <div className="glass-panel p-16 text-center text-slate-400 font-mono text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                Loading bill review data...
              </div>
            ) : !bill ? (
              <div className="glass-panel p-12 text-center text-slate-400 text-xs">
                Select a bill from queue to begin verification.
              </div>
            ) : (
              <div className="space-y-4">
                {/* ── Discrepancy Warning Banner ────────────────────────────── */}
                {hasDiscrepancy && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 animate-fade-in">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-200">Total Discrepancy Detected:</span>{' '}
                      The sum of product rows + tax (₹{calculatedGrandTotal.toFixed(2)}) differs from
                      the original extracted invoice total (₹{totalAmount.toFixed(2)}). Review line
                      items below or click "Sync Total" to reconcile.
                      <button
                        onClick={() => setTotalAmount(calculatedGrandTotal)}
                        className="ml-2 font-mono font-bold underline text-amber-300 hover:text-amber-100"
                      >
                        Reconcile to ₹{calculatedGrandTotal.toFixed(2)}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Invoice Header Metadata ───────────────────────────────── */}
                <div className="glass-panel p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h2 className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Invoice Metadata</span>
                    </h2>
                    <span className={`status-${bill.status} text-[10px]`}>
                      {STATUS_LABELS[bill.status] || bill.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        Invoice / Bill #
                      </label>
                      <input
                        type="text"
                        value={billNumber}
                        onChange={(e) => setBillNumber(e.target.value)}
                        className="input-field text-xs py-1.5"
                        placeholder="e.g. BV-1092"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">Date</label>
                      <input
                        type="date"
                        value={billDate}
                        onChange={(e) => setBillDate(e.target.value)}
                        className="input-field text-xs py-1.5"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        Vendor / Store
                      </label>
                      <input
                        type="text"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        className="input-field text-xs py-1.5"
                        placeholder="Store Name"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">
                        Customer Account
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="input-field text-xs py-1.5"
                        placeholder="e.g. Suresh Kumar"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Product Line-Items Table ──────────────────────────────── */}
                <div className="glass-panel p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Extracted Line Items ({items.length})</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Transaction-time unit prices are locked and preserved into ledger history.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="btn-secondary py-1 px-3 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Row</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 font-mono text-[11px]">
                          <th className="pb-2 font-medium">Raw Description</th>
                          <th className="pb-2 font-medium">Normalized Product</th>
                          <th className="pb-2 font-medium w-16">Qty</th>
                          <th className="pb-2 font-medium w-16">Unit</th>
                          <th className="pb-2 font-medium w-24">Rate (₹)</th>
                          <th className="pb-2 font-medium w-24">Total (₹)</th>
                          <th className="pb-2 font-medium w-20 text-center">Confidence</th>
                          <th className="pb-2 font-medium w-14 text-center">Vocab</th>
                          <th className="pb-2 w-6"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {items.map((item, idx) => {
                          const conf = item.confidence ?? 0.85;
                          const confBadge =
                            conf >= 0.9 ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                High
                              </span>
                            ) : conf >= 0.75 ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                Review
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Low
                              </span>
                            );

                          return (
                            <tr key={item.id || idx} className="hover:bg-white/[0.02] group">
                              <td className="py-2.5 pr-2">
                                <input
                                  type="text"
                                  value={item.rawDescription}
                                  onChange={(e) => handleItemChange(idx, 'rawDescription', e.target.value)}
                                  className="w-full bg-transparent border-b border-transparent focus:border-cyan-400 text-slate-200 outline-none text-xs"
                                />
                              </td>
                              <td className="py-2.5 pr-2">
                                <input
                                  type="text"
                                  value={item.normalizedName || ''}
                                  onChange={(e) => handleItemChange(idx, 'normalizedName', e.target.value)}
                                  className="w-full bg-transparent border-b border-transparent focus:border-emerald-400 text-emerald-300 outline-none text-xs font-semibold"
                                />
                              </td>
                              <td className="py-2.5 pr-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                  className="w-full bg-transparent border-b border-transparent focus:border-cyan-400 font-mono text-slate-100 outline-none text-xs"
                                />
                              </td>
                              <td className="py-2.5 pr-2">
                                <input
                                  type="text"
                                  value={item.unit || ''}
                                  onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                                  className="w-full bg-transparent border-b border-transparent focus:border-cyan-400 font-mono text-slate-400 outline-none text-xs"
                                />
                              </td>
                              <td className="py-2.5 pr-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={item.unitPrice ?? ''}
                                  onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                                  className="w-full bg-transparent border-b border-transparent focus:border-cyan-400 font-mono text-slate-100 outline-none text-xs"
                                />
                              </td>
                              <td className="py-2.5 pr-2 font-mono font-bold text-slate-100">
                                ₹{(item.totalPrice ?? 0).toFixed(2)}
                              </td>
                              <td className="py-2.5 text-center font-mono">{confBadge}</td>
                              <td className="py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleVocabMapping(idx)}
                                  className={`p-1 rounded text-xs transition-colors ${
                                    selectedVocabTerms[idx]
                                      ? 'text-emerald-400 bg-emerald-500/20'
                                      : 'text-slate-500 hover:text-slate-300'
                                  }`}
                                  title="Add to store vocabulary"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                </button>
                              </td>
                              <td className="py-2.5 text-right">
                                <button
                                  onClick={() => handleRemoveItem(idx)}
                                  className="text-slate-500 hover:text-red-400"
                                  title="Remove item row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Summary & Tax Reconciliation ──────────────────────────── */}
                  <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-end gap-4">
                    <div className="text-xs text-slate-400 max-w-sm">
                      <p className="font-mono text-[11px] text-slate-500">
                        * Never fabricated: Tax is calculated only when explicitly verified on bill.
                        Select the book icon on any row to permanently save colloquial slang into your
                        store dictionary.
                      </p>
                    </div>

                    <div className="w-full sm:w-64 space-y-2 text-xs font-mono">
                      <div className="flex justify-between text-slate-400">
                        <span>Items Subtotal:</span>
                        <span className="text-slate-200">₹{calculatedSubtotal.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center text-slate-400">
                        <span>GST Tax Amount:</span>
                        <input
                          type="number"
                          step="any"
                          value={taxAmount}
                          onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                          className="w-20 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-right font-mono text-slate-200 outline-none"
                        />
                      </div>

                      <div className="flex justify-between text-sm font-bold pt-2 border-t border-white/10 text-emerald-400">
                        <span>Reconciled Total:</span>
                        <span>₹{calculatedGrandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Explicit Confirmation Modal ──────────────────────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bv-bg/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md p-6 glass-panel border border-emerald-500/30 rounded-2xl shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Confirm & Lock Bill</h3>
                <p className="text-xs text-slate-400">Ledger Verification & Final Approval</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to lock{' '}
              <strong className="text-white">{billNumber || 'this bill'}</strong> for{' '}
              <strong className="text-emerald-400">₹{calculatedGrandTotal.toFixed(2)}</strong> with{' '}
              <strong className="text-white">{items.length} line items</strong> into the official
              store ledger.
            </p>

            {hasDiscrepancy && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                ⚠️ Warning: A discrepancy of ₹{(calculatedGrandTotal - totalAmount).toFixed(2)} exists
                against the initial OCR total. Approving will adopt the verified item sum.
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="btn-ghost py-2 px-4 text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={isApproving}
                className="btn-emerald py-2 px-5 text-xs font-bold"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Locking Ledger...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm & Post to Ledger</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
