import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBillStats, useBills } from '../hooks/useBills';
import { useAuth } from '../hooks/useAuth';
import LedgerEnvironment3D from '../three/LedgerEnvironment3D';
import {
  FileText,
  Clock,
  CheckCircle2,
  Users,
  Store,
  Camera,
  Mic,
  Database,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Receipt,
  FileCheck2,
  Sparkles,
  AlertCircle,
  Eye,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  formatCurrency,
  formatConfidence,
  confidenceColor,
  formatRelativeTime,
  STATUS_LABELS,
} from '../utils/formatters';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useBillStats();
  const { bills, isLoading: billsLoading, error: billsError, refetch: refetchBills } = useBills({ limit: 6 });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── 1. Hero 3D Fintech Visual Banner ──────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-10 shadow-2xl">
        {/* 3D WebGL Canvas Layer */}
        <div className="absolute inset-0 z-0">
          <LedgerEnvironment3D />
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 max-w-2xl pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium mb-4 pointer-events-auto shadow-glow-emerald">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            3D Fintech Ledger Engine • Neural Sync Active
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Digital Ledger for{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-cyan-glow bg-clip-text text-transparent">
              {user?.business?.name || 'Your Store'}
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Real-time normalized digital accounting for general stores and merchants. Transform
            handwritten receipts in English, Hindi, and Punjabi into audit-ready financial records.
          </p>

          {/* Quick Action Navigation Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3 pointer-events-auto">
            <button onClick={() => navigate('/capture')} className="btn-primary">
              <Camera className="w-4 h-4" />
              <span>Capture New Bill</span>
            </button>

            <button onClick={() => navigate('/review')} className="btn-secondary">
              <FileCheck2 className="w-4 h-4 text-cyan-400" />
              <span>Review Queue</span>
            </button>

            <button onClick={() => navigate('/whisperflow')} className="btn-secondary">
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>WhisperFlow Voice</span>
            </button>

            <button onClick={() => navigate('/database')} className="btn-ghost">
              <Database className="w-4 h-4 text-gold-400" />
              <span>3D Schema</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Main Overview Metrics (6 Key Pillars) ─────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Store Accounting Overview</span>
          </h2>
          {statsError && (
            <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Offline Fallback Active</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Total Bills */}
          <div className="glass-panel p-4 sm:p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono font-medium uppercase text-slate-400">Total Bills</span>
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">
              {statsLoading ? '—' : stats?.total ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Recorded in store ledger</div>
          </div>

          {/* 2. Bills Processed */}
          <div className="glass-panel p-4 sm:p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono font-medium uppercase text-slate-400">Processed</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
              {statsLoading ? '—' : stats?.processed ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Reviewed or approved</div>
          </div>

          {/* 3. Pending Reviews */}
          <div className="glass-panel p-4 sm:p-5 relative overflow-hidden group hover:border-yellow-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono font-medium uppercase text-slate-400">Needs Review</span>
              <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-yellow-400">
              {statsLoading ? '—' : stats?.pending ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Pending human check</div>
          </div>

          {/* 4. Total Customers */}
          <div className="glass-panel p-4 sm:p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono font-medium uppercase text-slate-400">Customers</span>
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">
              {statsLoading ? '—' : stats?.totalCustomers ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Linked debtor accounts</div>
          </div>

          {/* 5. Total Products */}
          <div className="glass-panel p-4 sm:p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono font-medium uppercase text-slate-400">Products</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">
              {statsLoading ? '—' : stats?.totalProducts ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Normalized SKU catalog</div>
          </div>

          {/* 6. Total Revenue */}
          <div className="glass-panel p-4 sm:p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono font-medium uppercase text-slate-400">Total Volume</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 truncate">
              {statsLoading ? '—' : formatCurrency(stats?.totalRevenue)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Reconciled sales</div>
          </div>
        </div>
      </div>

      {/* ── 3. Recent Bills Ledger & Activity Grid ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Recent Bills Table */}
        <div className="lg:col-span-8 glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-cyan-400" />
                <span>Recent Bills & Invoices</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time stream of incoming handwritten and scanned paper bills
              </p>
            </div>

            <button
              onClick={() => navigate('/review')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {billsLoading ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs">
              Loading recent bills from store ledger...
            </div>
          ) : bills.length === 0 ? (
            /* Proper Empty State */
            <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl p-8">
              <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-200">No bills in store ledger yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Scan your first handwritten receipt to initiate neural OCR extraction and 3D ledger
                normalization.
              </p>
              <button
                onClick={() => navigate('/capture')}
                className="btn-primary mt-4 py-2 px-4 text-xs font-semibold"
              >
                <Camera className="w-4 h-4" />
                <span>Capture First Bill</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-mono">
                    <th className="pb-3 font-medium">Bill Number</th>
                    <th className="pb-3 font-medium">Customer / Vendor</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3 font-mono font-semibold text-slate-100">
                        {bill.billNumber || 'BV-' + bill.id.slice(0, 6)}
                      </td>
                      <td className="py-3 text-slate-300">
                        <div className="font-medium text-slate-200">
                          {bill.customer?.name || bill.vendorName || 'Counter Sale'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono capitalize">
                          {bill.captureMode} mode
                        </div>
                      </td>
                      <td className="py-3 text-slate-400 font-mono">
                        {bill.billDate || formatRelativeTime(bill.createdAt)}
                      </td>
                      <td className="py-3 font-mono font-bold text-emerald-400">
                        {formatCurrency(bill.totalAmount)}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`status-${bill.status} text-[10px]`}>
                          {STATUS_LABELS[bill.status] || bill.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => navigate(`/review/${bill.id}`)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
                          title="View Bill Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-mono">View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Recent Activity & Quick Shortcuts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Panel */}
          <div className="glass-panel p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Quick Actions</span>
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/capture')}
                className="w-full text-left p-3 rounded-xl bg-white/[0.02] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-400/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                      Capture a New Bill
                    </div>
                    <div className="text-[10px] text-slate-500">Scan phone photo or PDF</div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/review')}
                className="w-full text-left p-3 rounded-xl bg-white/[0.02] hover:bg-yellow-500/10 border border-white/5 hover:border-yellow-400/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-yellow-300">
                      Review Pending Bills
                    </div>
                    <div className="text-[10px] text-slate-500">Inspect line-items and taxes</div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-yellow-400 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/whisperflow')}
                className="w-full text-left p-3 rounded-xl bg-white/[0.02] hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-400/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                      Open WhisperFlow
                    </div>
                    <div className="text-[10px] text-slate-500">Acoustic voice assistant</div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/database')}
                className="w-full text-left p-3 rounded-xl bg-white/[0.02] hover:bg-purple-500/10 border border-white/5 hover:border-purple-400/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-purple-300">
                      Explore 3D Architect
                    </div>
                    <div className="text-[10px] text-slate-500">Relational schema & slang vocab</div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors" />
              </button>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="glass-panel p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Recent Activity</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">Audit trail</span>
            </div>

            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="divide-y divide-white/5 space-y-1">
                {stats.recentActivity.map((act) => (
                  <div key={act.id} className="py-2.5 flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-slate-200">{act.action}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {act.billRef} • {formatRelativeTime(act.time)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs font-mono text-slate-500">
                No recent edits recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
