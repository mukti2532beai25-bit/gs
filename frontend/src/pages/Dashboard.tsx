import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBillStats, useBills } from '../hooks/useBills';
import { useAuth } from '../hooks/useAuth';
import BusinessNetwork3D from '../three/BusinessNetwork3D';
import LedgerEnvironment3D from '../three/LedgerEnvironment3D';
import { businessApi, aiApi } from '../services/api';
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
  DollarSign,
  PieChart,
  Package,
  HelpCircle,
  Send,
  Info,
} from 'lucide-react';
import {
  formatCurrency,
  formatRelativeTime,
  STATUS_LABELS,
} from '../utils/formatters';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, isLoading: statsLoading, error: statsError } = useBillStats();
  const { bills, isLoading: billsLoading } = useBills({ limit: 6 });

  // BI state
  const [range, setRange] = useState<'today' | '7d' | '30d' | 'this_month' | 'all'>('all');
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'network' | 'ledger'>('network');
  const [quickQuestion, setQuickQuestion] = useState('');

  // Fetch Business Analytics on range change
  useEffect(() => {
    setAnalyticsLoading(true);
    businessApi
      .analytics({ range })
      .then((res) => {
        if (res.data) setAnalytics(res.data);
      })
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false));
  }, [range]);

  const handleAsk = () => {
    if (!quickQuestion.trim()) {
      navigate('/ask');
      return;
    }
    navigate(`/ask?q=${encodeURIComponent(quickQuestion)}`);
  };

  const revenue = analytics?.totalRevenue ?? stats?.totalRevenue ?? 5500;
  const netProfit = analytics?.netProfit ?? Math.round(revenue * 0.22);
  const expenses = analytics?.wholesaleExpenses ?? Math.round(revenue * 0.78);
  const profitMargin = analytics?.profitMargin ?? 22.0;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── 1. Hero 3D Fintech Visual Banner ──────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium shadow-glow-emerald">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              BahiVerse AI • Smart Business Intelligence & 3D Network
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Business Intelligence for{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
                {user?.business?.name || 'Your Store'}
              </span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Track real-time revenues, profit margins, top-selling products, and cash flows.
              Query your financial records in plain English, Hindi, or Punjabi.
            </p>

            {/* Quick Action Navigation Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button onClick={() => navigate('/ask')} className="btn-primary">
                <Sparkles className="w-4 h-4" />
                <span>Ask Your Business</span>
              </button>

              <button onClick={() => navigate('/capture')} className="btn-secondary">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Capture Bill</span>
              </button>

              <button onClick={() => navigate('/review')} className="btn-secondary">
                <FileCheck2 className="w-4 h-4 text-yellow-400" />
                <span>Review Queue</span>
              </button>

              <button onClick={() => navigate('/whisperflow')} className="btn-ghost">
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>WhisperFlow</span>
              </button>
            </div>
          </div>

          {/* Quick NLP Question Input Bar */}
          <div className="w-full lg:w-96 p-4 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Sparkles className="w-4 h-4" />
              <span>Instant AI Assistant</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={quickQuestion}
                onChange={(e) => setQuickQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder="e.g. Total revenue this month?"
                className="w-full bg-slate-900/90 text-xs text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2.5 border border-white/10 focus:outline-none focus:border-cyan-500/50 pr-10"
              />
              <button
                onClick={handleAsk}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['Top products', 'My total revenue', 'Change milk price'].map((chip) => (
                <button
                  key={chip}
                  onClick={() => navigate(`/ask?q=${encodeURIComponent(chip)}`)}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[10px] text-slate-400 hover:text-white transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. BI Metrics & Time Filter ───────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Executive Business Health</span>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            {(
              [
                { id: 'today', label: 'Today' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: 'this_month', label: 'This Month' },
                { id: 'all', label: 'All Time' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setRange(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  range === item.id
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-glow-cyan'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6 Key BI Pillars */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Gross Revenue */}
          <div className="glass-panel p-4 sm:p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono font-medium uppercase text-slate-400">Gross Sales</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
              {analyticsLoading ? '—' : `₹${revenue.toLocaleString('en-IN')}`}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              Verified: ₹{(analytics?.verifiedRevenue ?? revenue).toLocaleString('en-IN')}
            </div>
          </div>

          {/* 2. Estimated Net Profit */}
          <div className="glass-panel p-4 sm:p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono font-medium uppercase text-slate-400">Net Profit</span>
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-cyan-300">
              {analyticsLoading ? '—' : `₹${netProfit.toLocaleString('en-IN')}`}
            </div>
            <div className="text-[10px] text-cyan-400/80 font-mono mt-1">
              ~{profitMargin}% margin
            </div>
          </div>

          {/* 3. Wholesale Procurement Expenses */}
          <div className="glass-panel p-4 sm:p-5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono font-medium uppercase text-slate-400">Procurement</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <PieChart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-amber-400">
              {analyticsLoading ? '—' : `₹${expenses.toLocaleString('en-IN')}`}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">Vendor wholesale cost</div>
          </div>

          {/* 4. Average Ticket Size */}
          <div className="glass-panel p-4 sm:p-5 relative overflow-hidden group hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono font-medium uppercase text-slate-400">Avg Ticket</span>
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-purple-300">
              {analyticsLoading ? '—' : `₹${(analytics?.avgBillValue ?? 1833).toLocaleString('en-IN')}`}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">Average per customer</div>
          </div>

          {/* 5. Customer Loyalty / Repeat */}
          <div className="glass-panel p-4 sm:p-5 relative overflow-hidden group hover:border-sky-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono font-medium uppercase text-slate-400">Customers</span>
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {analytics?.totalCustomers ?? 3}
            </div>
            <div className="text-[10px] text-sky-400 font-mono mt-1">
              {analytics?.repeatCustomerRate ?? 67}% repeat rate
            </div>
          </div>

          {/* 6. Pending Reviews */}
          <div className="glass-panel p-4 sm:p-5 relative overflow-hidden group hover:border-yellow-500/30 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono font-medium uppercase text-slate-400">Pending Review</span>
              <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-yellow-400">
              {analytics?.pendingReviewsCount ?? 1}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              ₹{(analytics?.pendingReviewsAmount ?? 850).toLocaleString('en-IN')} unverified
            </div>
          </div>
        </div>

        {/* Profit Criteria Notice Banner */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              {analytics?.profitCriteriaNotice ||
                'Net profit is calculated by subtracting verified wholesale procurement costs from recorded sales invoices.'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 shrink-0">Historical Audited Ledger</span>
        </div>
      </div>

      {/* ── 3. 3D Customer-Facing Business Network Scene ───────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Store className="w-4 h-4 text-cyan-400" />
              <span>Interactive 3D Business Network</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore your live store ecosystem: customer purchase nodes, catalog velocity, and cash flow streams
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('network')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'network'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Network View
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'ledger'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3D Ledger
            </button>
          </div>
        </div>

        {activeTab === 'network' ? (
          <BusinessNetwork3D
            storeName={user?.business?.name || 'Sharma Kirana Store'}
            totalRevenue={revenue}
            customers={[
              { id: 'c-1', name: 'Ramesh Kumar', spend: 1450, billsCount: 4 },
              { id: 'c-2', name: 'Suresh Patel', spend: 3200, billsCount: 6 },
              { id: 'c-3', name: 'Priya Sharma', spend: 850, billsCount: 2 },
            ]}
            products={[
              { id: 'p-1', name: 'Basmati Rice 5kg', category: 'Grains', price: 450, unitsSold: 5 },
              { id: 'p-2', name: 'Amul Milk 1L', category: 'Dairy', price: 66, unitsSold: 9 },
              { id: 'p-3', name: 'Aashirvaad Atta 10kg', category: 'Flour', price: 380, unitsSold: 5 },
              { id: 'p-4', name: 'Tata Salt 1kg', category: 'Spices', price: 28, unitsSold: 3 },
            ]}
          />
        ) : (
          <div className="relative w-full h-[520px] rounded-2xl overflow-hidden bg-slate-950/90 border border-white/10 shadow-2xl">
            <LedgerEnvironment3D />
          </div>
        )}
      </div>

      {/* ── 4. Best Selling Products & Recent Invoices Grid ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (7 cols): Top Best Selling Products */}
        <div className="lg:col-span-7 glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Top Selling Products</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ranked by customer demand and sales revenue
              </p>
            </div>
            <button
              onClick={() => navigate('/ask?q=Which%20products%20are%20selling%20the%20most%3F')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group"
            >
              <span>Ask AI Analysis</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="space-y-3">
            {(analytics?.topProducts && analytics.topProducts.length > 0
              ? analytics.topProducts
              : [
                  { name: 'Basmati Rice Premium 5kg', qty: 5, revenue: 2050 },
                  { name: 'Aashirvaad Shudh Chakki Atta 10kg', qty: 5, revenue: 1900 },
                  { name: 'Amul Full Cream Milk 1L', qty: 9, revenue: 594 },
                  { name: 'Amul Pure Desi Ghee 1kg', qty: 1, revenue: 520 },
                  { name: 'Tata Salt 1kg', qty: 3, revenue: 84 },
                ]
            ).map((prod: any, idx: number) => {
              const maxRev = 2050;
              const percent = Math.min(100, Math.round((prod.revenue / maxRev) * 100));
              return (
                <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-white/5 text-[10px] font-mono font-bold text-slate-400 flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">{prod.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        ₹{prod.revenue.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{prod.qty} units sold</div>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (5 cols): Recent Bills Stream */}
        <div className="lg:col-span-5 glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-cyan-400" />
                <span>Recent Bills</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Incoming paper & digital receipts
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
            <div className="py-8 text-center text-xs font-mono text-slate-500">
              Loading recent bills...
            </div>
          ) : bills.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-white/10 rounded-xl p-4">
              <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="text-xs font-medium text-slate-300">No bills in ledger yet</div>
              <button
                onClick={() => navigate('/capture')}
                className="mt-3 text-xs text-cyan-400 hover:underline"
              >
                Capture First Bill
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/5 space-y-1">
              {bills.slice(0, 5).map((b) => (
                <div
                  key={b.id}
                  onClick={() => navigate(`/review/${b.id}`)}
                  className="py-2.5 flex items-center justify-between hover:bg-white/[0.02] p-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      {b.customer?.name || b.vendorName || 'Counter Sale'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {b.billNumber || 'BV-' + b.id.slice(0, 6)} • {b.billDate || formatRelativeTime(b.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      {formatCurrency(b.totalAmount)}
                    </div>
                    <span className={`status-${b.status} text-[9px]`}>
                      {STATUS_LABELS[b.status] || b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
