import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  Filter,
  Search,
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Layers,
  Camera,
  Mail,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  fetchInboxDocuments,
  updateDocumentStatus,
  triggerBatchProcessing,
  InboxDocument,
} from '../services/documentApi';
import { fetchConnectedSources, triggerSourceSync, IntegrationSource } from '../services/integrationApi';

export default function DocumentInbox() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<InboxDocument[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [sources, setSources] = useState<IntegrationSource[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter, sourceFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [docsRes, sourcesRes] = await Promise.all([
        fetchInboxDocuments({
          status: statusFilter,
          source: sourceFilter,
          search: searchQuery,
        }),
        fetchConnectedSources(),
      ]);

      if (docsRes.success) {
        setDocuments(docsRes.data);
        setCounts(docsRes.counts);
      }
      if (sourcesRes.success) {
        setSources(sourcesRes.data);
      }
    } catch (err) {
      console.error('Failed to load inbox data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async (sourceType: string) => {
    setIsSyncing((prev) => ({ ...prev, [sourceType]: true }));
    try {
      await triggerSourceSync(sourceType);
      await loadData();
    } catch (err) {
      console.error(`Sync error for ${sourceType}:`, err);
    } finally {
      setIsSyncing((prev) => ({ ...prev, [sourceType]: false }));
    }
  };

  const handleConfirmDoc = async (docId: string) => {
    try {
      await updateDocumentStatus(docId, { status: 'confirmed' });
      await loadData();
    } catch (err) {
      console.error('Failed to confirm document:', err);
    }
  };

  const handleDismissDuplicate = async (docId: string) => {
    try {
      await updateDocumentStatus(docId, { status: 'review_required', notes: 'Manually dismissed duplicate flag' });
      await loadData();
    } catch (err) {
      console.error('Failed to dismiss duplicate:', err);
    }
  };

  const getSourceBadge = (type: string) => {
    switch (type) {
      case 'gmail':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20">
            <Mail className="w-3 h-3" /> Gmail
          </span>
        );
      case 'whatsapp':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MessageSquare className="w-3 h-3" /> WhatsApp
          </span>
        );
      case 'email_inbox':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Mail className="w-3 h-3" /> Inward Mailbox
          </span>
        );
      case 'camera_batch':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Camera className="w-3 h-3" /> Batch Camera
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <FileText className="w-3 h-3" /> Direct Upload
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case 'review_required':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Review Required
          </span>
        );
      case 'duplicate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Duplicate Detected
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing OCR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <Inbox className="w-3.5 h-3.5" /> Queued
          </span>
        );
    }
  };

  const copyInwardAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-white/10 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-emerald-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              Document Inbox
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                Smart Ingestion
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Centralized repository for digital invoices from Gmail, WhatsApp, Dedicated Mailbox, and Batch Scanners
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/capture/batch')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold text-xs flex items-center gap-2 shadow-glow-purple hover:brightness-110 active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4" />
            Batch Scanner Mode
          </button>
          <button
            onClick={() => navigate('/capture')}
            className="px-4 py-2.5 rounded-xl bg-white/10 text-slate-300 font-semibold text-xs flex items-center gap-2 hover:bg-white/15 hover:text-white transition-all"
          >
            <Layers className="w-4 h-4" />
            Single 3D Laser Capture
          </button>
        </div>
      </div>

      {/* Connected Acquisition Channels Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sources.map((src) => {
          const isSrcSyncing = isSyncing[src.type];
          return (
            <div
              key={src.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    src.type === 'gmail'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : src.type === 'whatsapp'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  {src.type === 'gmail' ? (
                    <Mail className="w-4 h-4" />
                  ) : src.type === 'whatsapp' ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : (
                    <Inbox className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-xs text-white">{src.name}</p>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        src.status === 'connected' ? 'bg-emerald-400 shadow-glow-emerald' : 'bg-slate-500'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
                    {src.type === 'email_inbox'
                      ? src.details?.forwardingAddress
                      : src.type === 'whatsapp'
                      ? src.details?.phoneNumber
                      : src.details?.monitoredLabel || 'OAuth Connected'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {src.type === 'email_inbox' && src.details?.forwardingAddress && (
                  <button
                    onClick={() => copyInwardAddress(src.details!.forwardingAddress!)}
                    title="Copy Mailbox Address"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {copiedAddress ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
                <button
                  onClick={() => handleManualSync(src.type)}
                  disabled={isSrcSyncing || src.status === 'disconnected'}
                  title="Sync Now"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/10 disabled:opacity-40 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isSrcSyncing ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Metrics Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Documents', count: counts.all || 0 },
              { id: 'review_required', label: 'Review Required', count: counts.review_required || 0 },
              { id: 'confirmed', label: 'Confirmed', count: counts.confirmed || 0 },
              { id: 'duplicate', label: 'Duplicates Flagged', count: counts.duplicate || 0 },
              { id: 'processing', label: 'Processing', count: counts.processing || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  statusFilter === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                    : 'bg-white/5 text-slate-400 border border-white/5 hover:border-white/15 hover:text-white'
                }`}
              >
                {tab.label}
                <span className="px-1.5 py-0.2 rounded-md bg-black/40 text-[10px] text-slate-300">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search vendor, invoice #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-black/30 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-3" />
            Loading centralized document inbox...
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10 text-slate-400">
            <Inbox className="w-10 h-10 mx-auto text-slate-500 mb-3 opacity-50" />
            <p className="text-base font-semibold text-white">No documents match the active filter</p>
            <p className="text-xs text-slate-400 mt-1">
              Upload documents, capture a batch with camera, or trigger Gmail / WhatsApp sync.
            </p>
          </div>
        ) : (
          documents.map((doc) => {
            const isDup = doc.status === 'duplicate';
            return (
              <div
                key={doc.id}
                className={`p-4 rounded-xl border transition-all ${
                  isDup
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Left: Document Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-sm text-white">{doc.fileName}</p>
                        {getSourceBadge(doc.sourceType)}
                        {getStatusBadge(doc.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>{new Date(doc.createdAt).toLocaleString('en-IN')}</span>
                        {doc.sourceDetails && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-300">{doc.sourceDetails}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Extracted Summary & Actions */}
                  <div className="flex flex-wrap items-center gap-3 self-end md:self-center">
                    {doc.extractedMetadata && (
                      <div className="text-right pr-2 hidden sm:block">
                        <p className="text-xs font-semibold text-white">
                          {doc.extractedMetadata.vendorName || 'Vendor Pending'}
                        </p>
                        <p className="text-xs text-emerald-400 font-bold">
                          {doc.extractedMetadata.totalAmount ? `₹${doc.extractedMetadata.totalAmount.toLocaleString('en-IN')}` : 'Amount Pending'}
                        </p>
                      </div>
                    )}

                    {isDup ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDismissDuplicate(doc.id)}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-medium transition-colors"
                        >
                          Dismiss Flag
                        </button>
                        <button
                          onClick={() => navigate('/review')}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 text-xs font-medium transition-colors"
                        >
                          View Existing Match
                        </button>
                      </div>
                    ) : doc.status === 'confirmed' ? (
                      <button
                        onClick={() => navigate('/review')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1.5 hover:bg-emerald-500/20 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Confirmed in Ledger
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConfirmDoc(doc.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => navigate(doc.linkedBillId ? `/review/${doc.linkedBillId}` : '/review')}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          Review & Correct <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Duplicate Notification Bar if flagged */}
                {isDup && doc.duplicateInfo && (
                  <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-200">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-rose-300">
                        Multi-Factor Duplicate Warning ({Math.round(doc.duplicateInfo.confidence * 100)}% Confidence):
                      </p>
                      <p className="text-slate-300 mt-0.5">{doc.duplicateInfo.reason}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
