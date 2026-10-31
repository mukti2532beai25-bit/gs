import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBillStats, useBills } from '../hooks/useBills';
import { useAuth } from '../hooks/useAuth';
import LedgerEnvironment3D from '../components/3d/LedgerEnvironment3D';
import {
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Camera,
  Mic,
  FileSpreadsheet,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { formatCurrency, formatConfidence, confidenceColor, formatRelativeTime, STATUS_LABELS } from '../utils/formatters';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, isLoading: statsLoading } = useBillStats();
  const { bills, isLoading: billsLoading } = useBills({ limit: 6 });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 3D Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-10 shadow-2xl">
        {/* Background 3D Canvas */}
        <div className="absolute inset-0 z-0">
          <LedgerEnvironment3D />
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Fintech 3D Accounting Engine Active
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Next-Gen Digital Ledger for{' '}
            <span className="gradient-text-cyan">{user?.business?.name || 'Your Store'}</span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Convert handwritten bills in English, Hindi & Punjabi into organized tax-ready digital
            records with real-time 3D normalization and voice correction.
          </p>

          {/* Quick action buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/capture')}
              className="btn-primary"
            >
              <Camera className="w-4 h-4" />
              <span>Capture & Scan Bill</span>
            </button>

            <button
              onClick={() => navigate('/whisperflow')}
              className="btn-secondary"
            >
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>WhisperFlow Voice</span>
            </button>

            <button
              onClick={() => navigate('/export')}
              className="btn-ghost"
            >
              <FileSpreadsheet className="w-4 h-4 text-gold-400" />
              <span>Export Tally / CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Captured */}
        <div className="glass-panel p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono font-medium uppercase tracking-wider">Total Bills</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {statsLoading ? '—' : stats?.total ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 flex items-center font-semibold">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +100%
            </span>
            Digitized records
          </p>
        </div>

        {/* Pending Review */}
        <div className="glass-panel p-5 relative overflow-hidden group hover:border-yellow-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono font-medium uppercase tracking-wider">Needs Review</span>
            <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {statsLoading ? '—' : stats?.pending ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Awaiting shopkeeper verification
          </p>
        </div>

        {/* Total Revenue */}
        <div className="glass-panel p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono font-medium uppercase tracking-wider">Recorded Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {statsLoading ? '—' : formatCurrency(stats?.totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Reconciled transaction volume
          </p>
        </div>

        {/* AI Confidence */}
        <div className="glass-panel p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono font-medium uppercase tracking-wider">OCR Accuracy</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {statsLoading ? '—' : formatConfidence(stats?.avgConfidence || 0.89)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Average neural confidence
          </p>
        </div>
      </div>

      {/* Recent Bills Ledger Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Recent Bills & Invoices</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({bills.length} records)
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live feed of captured handwritten & printed shop receipts
            </p>
          </div>

          <button
            onClick={() => navigate('/review')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group"
          >
            <span>View All in Review Center</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {billsLoading ? (
          <div className="glass-panel p-12 text-center text-slate-400 font-mono text-xs">
            Loading recent transactions...
          </div>
        ) : bills.length === 0 ? (
          <div className="glass-panel p-12 text-center border-dashed border-white/10">
            <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-200">No bills captured yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Scan or upload your first handwritten bill to see AI extraction and 3D normalization in action.
            </p>
            <button
              onClick={() => navigate('/capture')}
              className="btn-primary mt-4 py-2 px-4 text-xs"
            >
              <Camera className="w-4 h-4" />
              <span>Capture First Bill</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bills.map((bill) => (
              <div
                key={bill.id}
                onClick={() => navigate(`/review/${bill.id}`)}
                className="glass-panel-hover p-5 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`status-${bill.status}`}>
                      {STATUS_LABELS[bill.status] || bill.status}
                    </span>
                    <span className={`text-xs font-mono font-semibold ${confidenceColor(bill.confidence)}`}>
                      {formatConfidence(bill.confidence)} AI Conf.
                    </span>
                  </div>

                  <div className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {bill.vendorName || bill.billNumber || 'Bill #' + bill.id.slice(0, 8)}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{bill.billDate || formatRelativeTime(bill.createdAt)}</span>
                    <span>•</span>
                    <span className="capitalize">{bill.captureMode} capture</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Total Amount</span>
                    <div className="text-base font-bold font-mono text-emerald-400">
                      {formatCurrency(bill.totalAmount)}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white/5 group-hover:bg-cyan-500/20 text-slate-400 group-hover:text-cyan-300 transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
