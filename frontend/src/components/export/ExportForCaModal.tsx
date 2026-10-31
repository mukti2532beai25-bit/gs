import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Download,
  ShieldAlert,
  Loader2,
  ArrowRight,
  Building2,
  Calendar,
} from 'lucide-react';
import { validateCaExport, downloadCaPackage, CaValidationResult } from '../../services/caExportApi';

interface ExportForCaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportForCaModal({ isOpen, onClose }: ExportForCaModalProps) {
  const [period, setPeriod] = useState<'current_month' | 'last_month' | 'quarter' | 'custom'>('current_month');
  const [format, setFormat] = useState<'xlsx' | 'csv' | 'json'>('xlsx');
  const [validation, setValidation] = useState<CaValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [acknowledgedDisclaimer, setAcknowledgedDisclaimer] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadValidation();
    }
  }, [isOpen, period]);

  const loadValidation = async () => {
    setIsLoading(true);
    try {
      const res = await validateCaExport();
      if (res.success) {
        setValidation(res.data);
      }
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const data = await downloadCaPackage({ format });
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BahiVerse_CA_Dossier_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BahiVerse_CA_Dossier_${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
      onClose();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-cyan-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Export for Chartered Accountant (CA)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                  CA Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Multi-worksheet reconciliation dossier, sales/purchase registers, & GSTR preparation schedules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300">
          {/* Statutory Responsibility Banner */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 text-amber-200">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <p className="font-semibold text-amber-300">
                Statutory Boundary & Disclaimer:
              </p>
              <p>
                <strong>BahiVerse AI</strong> prepares operational bookkeeping, invoice data, and reconciliation summaries.
                Statutory tax calculations, audits, and official GST filings (GSTR-1, GSTR-3B) are the exclusive responsibility of your licensed <strong>Chartered Accountant (CA)</strong>.
              </p>
            </div>
          </div>

          {/* Period Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              1. Select Accounting Period
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'current_month', label: 'Current Month (October 2026)', desc: 'Ongoing period' },
                { id: 'last_month', label: 'Last Month (September 2026)', desc: 'Closed period' },
                { id: 'quarter', label: 'Current Quarter (Q3 2026)', desc: 'Quarterly review' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    period === p.id
                      ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-glow-cyan'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <p className="font-semibold text-xs text-white">{p.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Pre-Export Reconciliation Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                2. Pre-Export Reconciliation & Audit Validation
              </label>
              {validation && (
                <span className="text-xs text-slate-400">
                  {validation.totalRecordsChecked} records analyzed
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                Running arithmetic and duplicate checks...
              </div>
            ) : validation ? (
              <div className="space-y-2.5">
                {/* Financial Summary Strip */}
                <div className="grid grid-cols-4 gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div>
                    <p className="text-[11px] text-slate-400">Total Sales</p>
                    <p className="text-base font-bold text-emerald-400">₹{validation.summary.totalSales.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Total Purchases</p>
                    <p className="text-base font-bold text-cyan-400">₹{validation.summary.totalPurchases.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Eligible ITC</p>
                    <p className="text-base font-bold text-purple-400">₹{validation.summary.eligibleItc.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Est. Tax Payable</p>
                    <p className="text-base font-bold text-amber-400">₹{validation.summary.estimatedTaxPayable.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Issue / Warnings List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {validation.issues.map((iss) => (
                    <div
                      key={iss.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 ${
                        iss.severity === 'error'
                          ? 'border-red-500/30 bg-red-500/10'
                          : iss.severity === 'warning'
                          ? 'border-amber-500/30 bg-amber-500/10'
                          : 'border-cyan-500/30 bg-cyan-500/10'
                      }`}
                    >
                      {iss.severity === 'error' ? (
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      ) : iss.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-white">{iss.title}</p>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/30 text-slate-300">
                            {iss.type}
                          </span>
                        </div>
                        <p className="text-slate-300 mt-0.5">{iss.description}</p>
                        {iss.suggestedAction && (
                          <p className="text-slate-400 mt-1 italic">
                            Action: {iss.suggestedAction}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              3. Dossier File Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: 'xlsx',
                  label: 'Excel (.xlsx)',
                  desc: 'All 6 registers in tabbed worksheets (CA Preferred)',
                  icon: FileSpreadsheet,
                  recommended: true,
                },
                {
                  id: 'csv',
                  label: 'Standard CSV',
                  desc: 'Individual tabular files for Tally / Busy import',
                  icon: FileText,
                },
                {
                  id: 'json',
                  label: 'Structured JSON',
                  desc: 'Machine-readable accounting payload with metadata',
                  icon: Code2,
                },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id as any)}
                    className={`relative p-3.5 rounded-xl border text-left transition-all ${
                      format === f.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-glow-emerald'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {f.recommended && (
                      <span className="absolute -top-2 right-2 px-2 py-0.5 text-[9px] uppercase font-bold rounded-full bg-emerald-500 text-black">
                        Recommended
                      </span>
                    )}
                    <Icon className="w-5 h-5 text-emerald-400 mb-2" />
                    <p className="font-semibold text-xs text-white">{f.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{f.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Acknowledgement Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={acknowledgedDisclaimer}
              onChange={(e) => setAcknowledgedDisclaimer(e.target.checked)}
              className="mt-0.5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-xs text-slate-400">
              I understand that this file contains operational bookkeeping data prepared for my Chartered Accountant's review, and does not constitute a filed GST return.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={!acknowledgedDisclaimer || isExporting}
            className={`px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all ${
              acknowledgedDisclaimer && !isExporting
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-glow-emerald hover:brightness-110 active:scale-95'
                : 'bg-white/10 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating CA Dossier...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Complete CA Dossier ({format.toUpperCase()})
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
