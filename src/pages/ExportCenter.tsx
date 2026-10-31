import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { exportApi, billsApi } from '../services/api';
import ExportCubes3D from '../components/3d/ExportCubes3D';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  FileCode,
  FileText,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { downloadBlob, formatDate } from '../utils/formatters';

export default function ExportCenter() {
  const { addToast } = useToast();

  const [format, setFormat] = useState<'csv' | 'json' | 'tally-xml'>('csv');
  const [allApproved, setAllApproved] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const data = await exportApi.history();
      setHistory(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleGenerateExport = async () => {
    setIsExporting(true);
    try {
      const { blob, fileName } = await exportApi.generate({
        format,
        allApproved,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      downloadBlob(blob, fileName);
      addToast({
        type: 'success',
        message: `Export package ${fileName} generated and downloaded!`,
      });
      fetchHistory();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Export generation failed' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-mono font-medium mb-2">
          <FileSpreadsheet className="w-3.5 h-3.5 text-gold-400" />
          Module 06 — Multi-Format Export Center
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Export Digital Records & Tally Integration
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Generate audit-ready spreadsheets, Tally XML import files, or raw JSON datasets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 3D Data Cubes & Format Selection */}
        <div className="lg:col-span-5 glass-panel p-6 relative overflow-hidden flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              3D Voxel Aggregate Scene
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 uppercase text-slate-200">
              Format: {format}
            </span>
          </div>

          <div className="w-full h-72">
            <ExportCubes3D activeFormat={format} />
          </div>

          <div className="w-full text-center mt-2 pt-4 border-t border-white/5">
            <p className="text-xs text-slate-400 font-mono">
              Ready to assemble normalized ledger records into structured XML/CSV packages.
            </p>
          </div>
        </div>

        {/* Right Column: Export Configuration Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Format Cards */}
          <div className="glass-panel p-6 space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
              Select Export Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'csv',
                  name: 'CSV Spreadsheet',
                  desc: 'Excel & Google Sheets compatible',
                  icon: FileSpreadsheet,
                  color: 'border-emerald-500 text-emerald-400',
                },
                {
                  id: 'json',
                  name: 'Standard JSON',
                  desc: 'Structured API & database backup',
                  icon: FileCode,
                  color: 'border-cyan-500 text-cyan-400',
                },
                {
                  id: 'tally-xml',
                  name: 'Tally XML Vouchers',
                  desc: 'Direct import to Tally ERP 9 / Prime',
                  icon: FileText,
                  color: 'border-gold-500 text-gold-400',
                },
              ].map((fmt) => {
                const Icon = fmt.icon;
                const isSelected = format === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setFormat(fmt.id as any)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? `bg-white/[0.04] ${fmt.color} shadow-lg shadow-black/40`
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-2" />
                    <div className="text-xs font-bold text-slate-100">{fmt.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{fmt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtering Criteria */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Date Range & Approval Scope
            </h3>

            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="allApproved"
                checked={allApproved}
                onChange={(e) => setAllApproved(e.target.checked)}
                className="rounded bg-white/5 border-white/20 text-cyan-400 focus:ring-0 w-4 h-4"
              />
              <label htmlFor="allApproved" className="text-xs text-slate-200 cursor-pointer">
                Include all approved bills in your store history
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">From Date (Optional)</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">To Date (Optional)</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input-field text-xs"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateExport}
              disabled={isExporting}
              className="w-full btn-primary justify-center py-3.5 text-xs font-bold"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Package...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download {format.toUpperCase()} Package</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Export History Log */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-base font-bold text-slate-100">Recent Export History</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{history.length} generated</span>
        </div>

        {historyLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500">
            No previous exports. Click "Download" to generate your first ledger file.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {history.map((record) => (
              <div key={record.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 border border-white/10 text-slate-300">
                    {record.format}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{record.fileName}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {record.billCount} bills • {formatDate(record.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Complete</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
