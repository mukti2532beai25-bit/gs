import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { vocabApi, businessApi, normalizationApi } from '../services/api';
import DatabaseArchitect3D, { TableMeta, RelationshipMeta, ColumnMeta } from '../three/DatabaseArchitect3D';
import SchemaDiagram2D from '../components/database/SchemaDiagram2D';
import {
  Database,
  BookOpen,
  Store,
  Users,
  Plus,
  Trash2,
  Save,
  Globe,
  Layers,
  Sparkles,
  Key,
  Link2,
  RotateCcw,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Check,
  X,
  Edit2,
  Box,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { VocabularyEntry } from '../types/bahiverse';

export default function DatabaseArchitect() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'architect' | 'dependencies' | 'vocab' | 'settings'>('architect');
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  // Schema state from normalization API
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [relationships, setRelationships] = useState<RelationshipMeta[]>([]);
  const [normalizationStages, setNormalizationStages] = useState<any[]>([]);
  const [candidateDependencies, setCandidateDependencies] = useState<any[]>([]);
  const [epistemicNotice, setEpistemicNotice] = useState<string>('');
  const [isLoadingSchema, setIsLoadingSchema] = useState(true);

  // Normalization stage & table selection
  const [currentStage, setCurrentStage] = useState<'raw' | '1nf' | '2nf' | '3nf'>('3nf');
  const [selectedTableId, setSelectedTableId] = useState<string>('bill');
  const [resetCameraTrigger, setResetCameraTrigger] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const replayTimerRef = useRef<any>(null);

  // Business profile form
  const [businessName, setBusinessName] = useState(user?.business?.name || '');
  const [gstin, setGstin] = useState(user?.business?.gstin || '');
  const [address, setAddress] = useState(user?.business?.address || '');
  const [phone, setPhone] = useState(user?.business?.phone || '');
  const [isSavingBiz, setIsSavingBiz] = useState(false);

  // Vocabulary list & form
  const [vocabList, setVocabList] = useState<any[]>([]);
  const [rawTerm, setRawTerm] = useState('');
  const [normalizedTerm, setNormalizedTerm] = useState('');
  const [category, setCategory] = useState<'product' | 'unit' | 'customer' | 'misc'>('product');
  const [vocabLang, setVocabLang] = useState<'hi' | 'pa' | 'en'>('hi');
  const [editingVocabId, setEditingVocabId] = useState<string | null>(null);
  const [editNormalizedTerm, setEditNormalizedTerm] = useState('');

  // Products and Customers lists
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Fetch full schema and normalization metadata
  const fetchSchemaData = useCallback(async () => {
    setIsLoadingSchema(true);
    try {
      const res = await normalizationApi.schema();
      const data = res.data;
      setTables(data.tables || []);
      setRelationships(data.relationships || []);
      setNormalizationStages(data.normalizationStages || []);
      setCandidateDependencies(data.candidateDependencies || []);
      setEpistemicNotice(data.epistemicHumilityNotice || '');
    } catch (err: any) {
      console.warn('Using fallback schema metadata:', err);
    } finally {
      setIsLoadingSchema(false);
    }
  }, []);

  const fetchVocab = async () => {
    try {
      const data = await vocabApi.list();
      setVocabList(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchCatalog = async () => {
    try {
      const [prods, custs] = await Promise.all([
        businessApi.getProducts().catch(() => []),
        businessApi.getCustomers().catch(() => []),
      ]);
      setProducts(prods || []);
      setCustomers(custs || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchemaData();
    fetchVocab();
    fetchCatalog();
  }, [fetchSchemaData]);

  // Determine active tables based on current normalization stage
  const activeTableIds = useMemo(() => {
    const stageObj = normalizationStages.find((s) => s.stage === currentStage);
    return stageObj ? stageObj.activeTables : ['business', 'customer', 'product', 'bill', 'billItem', 'vocab'];
  }, [normalizationStages, currentStage]);

  // Selected table object
  const selectedTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId) || tables[0] || null;
  }, [tables, selectedTableId]);

  // Replay normalization progression
  const handleReplay = () => {
    if (isReplaying) {
      clearInterval(replayTimerRef.current);
      setIsReplaying(false);
      return;
    }

    setIsReplaying(true);
    const stages: ('raw' | '1nf' | '2nf' | '3nf')[] = ['raw', '1nf', '2nf', '3nf'];
    let index = 0;
    setCurrentStage(stages[0]);

    replayTimerRef.current = setInterval(() => {
      index++;
      if (index >= stages.length) {
        clearInterval(replayTimerRef.current);
        setIsReplaying(false);
      } else {
        setCurrentStage(stages[index]);
      }
    }, 2800);
  };

  // Functional dependency review
  const handleReviewDependency = async (id: string, status: 'confirmed' | 'rejected' | 'hypothesis') => {
    try {
      await normalizationApi.reviewDependency(id, status);
      setCandidateDependencies((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status } : d))
      );
      addToast({
        type: 'success',
        message: `Dependency marked as ${status}.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Review failed' });
    }
  };

  // Vocabulary handlers
  const handleAddVocab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawTerm || !normalizedTerm) return;

    try {
      await vocabApi.create({
        rawTerm,
        normalizedTerm,
        category,
        language: vocabLang,
      });
      addToast({ type: 'success', message: `Vocabulary mapped: "${rawTerm}" → "${normalizedTerm}"` });
      setRawTerm('');
      setNormalizedTerm('');
      fetchVocab();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to add vocabulary mapping' });
    }
  };

  const handleStatusVocab = async (id: string, status: string) => {
    try {
      await vocabApi.setStatus(id, status);
      setVocabList((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status } : v))
      );
      addToast({ type: 'info', message: `Vocabulary entry marked as ${status}.` });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to update status' });
    }
  };

  const handleSaveEditVocab = async (id: string) => {
    if (!editNormalizedTerm.trim()) return;
    try {
      await vocabApi.update(id, { normalizedTerm: editNormalizedTerm });
      setVocabList((prev) =>
        prev.map((v) => (v.id === id ? { ...v, normalizedTerm: editNormalizedTerm } : v))
      );
      setEditingVocabId(null);
      addToast({ type: 'success', message: 'Vocabulary mapping updated!' });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Update failed' });
    }
  };

  const handleDeleteVocab = async (id: string) => {
    try {
      await vocabApi.delete(id);
      addToast({ type: 'info', message: 'Vocabulary entry removed' });
      fetchVocab();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    }
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBiz(true);
    try {
      await businessApi.update({
        name: businessName,
        gstin,
        address,
        phone,
      });
      await refreshUser();
      addToast({ type: 'success', message: 'Business profile & tax parameters saved!' });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to update business' });
    } finally {
      setIsSavingBiz(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-medium mb-2">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            Module 06 — 3D Database Architect & Normalizer
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Relational Database Architect
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Observe how unorganized handwritten receipts transform into a mathematically rigorous 3NF relational schema.
          </p>
        </div>

        {/* View Switcher and Reset Controls */}
        {activeTab === 'architect' && (
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 border border-white/10 rounded-xl p-1 flex items-center">
              <button
                type="button"
                onClick={() => setViewMode('3d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  viewMode === '3d'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3D Spatial Graph
              </button>
              <button
                type="button"
                onClick={() => setViewMode('2d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  viewMode === '2d'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2D Entity Diagram
              </button>
            </div>

            <button
              type="button"
              onClick={() => setResetCameraTrigger((c) => c + 1)}
              className="btn-ghost py-2 px-3 text-xs font-mono inline-flex items-center gap-1.5"
              title="Reset camera position and zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Camera</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto">
        {[
          { key: 'architect', label: '3D Schema Architect & 3NF', icon: Layers },
          { key: 'dependencies', label: 'Functional Dependencies', icon: ShieldCheck },
          { key: 'vocab', label: 'Shop Lexicon & Dialect Mapping', icon: BookOpen },
          { key: 'settings', label: 'Database Settings & Catalog', icon: Store },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-cyan-400 text-cyan-300 bg-white/[0.02]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: 3D SCHEMA ARCHITECT & NORMALIZATION PIPELINE */}
      {activeTab === 'architect' && (
        <div className="space-y-6">
          {/* Normalization Stage Stepper & Controls */}
          <div className="glass-panel p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 uppercase">Normalization Stage:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { stage: 'raw', label: '0. Raw Ingest (UNF)', badge: 'UNF' },
                  { stage: '1nf', label: '1. First Normal Form', badge: '1NF' },
                  { stage: '2nf', label: '2. Second Normal Form', badge: '2NF' },
                  { stage: '3nf', label: '3. Third Normal Form', badge: '3NF Strict' },
                ].map((s) => (
                  <button
                    key={s.stage}
                    type="button"
                    onClick={() => setCurrentStage(s.stage as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                      currentStage === s.stage
                        ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-white border border-cyan-400 shadow-glow-cyan'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleReplay}
              className="btn-secondary py-1.5 px-4 text-xs font-mono inline-flex items-center gap-2 shrink-0"
            >
              {isReplaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>Replaying Animation...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Replay Normalization Workflow</span>
                </>
              )}
            </button>
          </div>

          {/* Main Visualizer + Table Inspector Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Visualizer Canvas Area */}
            <div className="lg:col-span-8 glass-panel p-4 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {currentStage === 'raw'
                      ? 'UNF: Raw Ingestion Blob'
                      : currentStage === '1nf'
                      ? '1NF: Atomic Tuples & Key Decomposition'
                      : currentStage === '2nf'
                      ? '2NF: Master Entity Segregation'
                      : '3NF: Full Strict Non-Transitive Schema'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Orbit • Zoom • Click Table to Inspect
                </span>
              </div>

              {/* Render 3D or 2D Fallback */}
              <div className="w-full h-[480px] sm:h-[540px]">
                {viewMode === '3d' ? (
                  <DatabaseArchitect3D
                    tables={tables}
                    relationships={relationships}
                    selectedTableId={selectedTableId}
                    onSelectTable={(id) => setSelectedTableId(id)}
                    currentStage={currentStage}
                    activeTableIds={activeTableIds}
                    resetCameraTrigger={resetCameraTrigger}
                  />
                ) : (
                  <SchemaDiagram2D
                    tables={tables}
                    relationships={relationships}
                    selectedTableId={selectedTableId}
                    onSelectTable={(id) => setSelectedTableId(id)}
                    activeTableIds={activeTableIds}
                  />
                )}
              </div>

              {/* Current Stage Explanation Ribbon */}
              {normalizationStages.length > 0 && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-mono space-y-1.5">
                  {(() => {
                    const st = normalizationStages.find((s) => s.stage === currentStage) || normalizationStages[0];
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-cyan-300">{st.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {st.badge}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{st.description}</p>
                        <div className="text-[10px] text-slate-400">
                          <span className="text-slate-500">Relational Rule: </span>
                          {st.rules}
                        </div>
                        {st.anomaliesEliminated?.length > 0 && (
                          <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Anomalies Eliminated: {st.anomaliesEliminated.join(', ')}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Table Inspector Sidebar */}
            <div className="lg:col-span-4 glass-panel p-6 space-y-4">
              {selectedTable ? (
                <>
                  <div className="border-b border-white/10 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: selectedTable.color }}
                        />
                        <h3 className="text-base font-extrabold text-slate-100">
                          {selectedTable.name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                        {selectedTable.records} records
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{selectedTable.role}</p>
                  </div>

                  {/* Schema Attributes / Columns */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                      <span>SCHEMA COLUMNS ({selectedTable.columns.length})</span>
                      <span>DATA TYPE</span>
                    </div>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {selectedTable.columns.map((col: ColumnMeta, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5 text-xs font-mono"
                        >
                          <div className="flex items-center gap-1.5">
                            {col.isPK && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                PK
                              </span>
                            )}
                            {col.isFK && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                FK
                              </span>
                            )}
                            <span className={col.isPK ? 'text-amber-200 font-semibold' : 'text-slate-200'}>
                              {col.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400">{col.type}</span>
                            {col.ref && (
                              <span className="block text-[9px] text-cyan-400">→ {col.ref}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Relational Constraints / Foreign Keys */}
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">
                      Foreign Relationships
                    </span>
                    <div className="space-y-1">
                      {relationships
                        .filter((r) => r.from === selectedTable.id || r.to === selectedTable.id)
                        .map((r) => (
                          <div
                            key={r.id}
                            className="p-2 rounded bg-white/[0.02] border border-white/5 text-[11px] font-mono flex items-center justify-between"
                          >
                            <span className="text-cyan-400">{r.from}</span>
                            <span className="text-slate-500">({r.label}) →</span>
                            <span className="text-emerald-400">{r.to}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs font-mono">
                  Click on any 3D node to inspect its relational schema.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FUNCTIONAL DEPENDENCIES & HYPOTHESIS ANALYSIS */}
      {activeTab === 'dependencies' && (
        <div className="space-y-6">
          {/* Epistemic Humility Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-amber-300">Epistemic Constraint & Empirical Notice</div>
              <p className="text-amber-200/90 leading-relaxed font-mono text-[11px]">
                {epistemicNotice ||
                  'Candidate functional dependencies are statistical hypotheses inferred from observed sample records. Conclusive mathematical determination requires complete universal relation proofs or explicit shop business domain constraints. Do not assume universal truth from finite sample sets.'}
              </p>
            </div>
          </div>

          {/* Candidate Dependencies Review Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {candidateDependencies.map((dep) => (
              <div
                key={dep.id}
                className="glass-panel p-6 space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-mono text-sm font-bold text-slate-100">
                      <span className="text-cyan-400">{dep.determinant}</span>
                      <span className="mx-2 text-emerald-400">→</span>
                      <span className="text-emerald-300">{dep.dependent}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                        dep.status === 'confirmed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : dep.status === 'rejected'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {dep.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{dep.description}</p>
                </div>

                {/* Supporting Empirical Evidence */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-2 text-xs font-mono">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">
                    Empirical Sample Evidence
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-black/40">
                      <div className="text-[9px] text-slate-500">SAMPLED ROWS</div>
                      <div className="text-slate-200 font-bold mt-0.5">{dep.sampleSize}</div>
                    </div>
                    <div className="p-2 rounded bg-black/40">
                      <div className="text-[9px] text-slate-500">VIOLATIONS</div>
                      <div
                        className={`font-bold mt-0.5 ${
                          dep.violations === 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {dep.violations}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-black/40">
                      <div className="text-[9px] text-slate-500">CONFIDENCE</div>
                      <div className="text-cyan-400 font-bold mt-0.5">
                        {Math.round(dep.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 italic pt-1">
                    {dep.epistemicNotice}
                  </div>
                </div>

                {/* Human Review Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => handleReviewDependency(dep.id, 'confirmed')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono inline-flex items-center justify-center gap-1.5 transition-all ${
                      dep.status === 'confirmed'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-white/5 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Rule</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewDependency(dep.id, 'rejected')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono inline-flex items-center justify-center gap-1.5 transition-all ${
                      dep.status === 'rejected'
                        ? 'bg-red-500 text-white font-bold'
                        : 'bg-white/5 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SHOP LEXICON & BUSINESS VOCABULARY */}
      {activeTab === 'vocab' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Lexicon Entry */}
          <div className="lg:col-span-5 glass-panel p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Add Local Slang / Term Mapping
            </h3>
            <p className="text-xs text-slate-400">
              Map handwritten regional shop abbreviations and colloquial terms into standardized catalog names.
            </p>

            <form onSubmit={handleAddVocab} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Local Slang / Handwritten Term
                </label>
                <input
                  type="text"
                  required
                  value={rawTerm}
                  onChange={(e) => setRawTerm(e.target.value)}
                  placeholder="e.g. doodh, chawal, atta, ltr"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Standardized Catalog Name
                </label>
                <input
                  type="text"
                  required
                  value={normalizedTerm}
                  onChange={(e) => setNormalizedTerm(e.target.value)}
                  placeholder="e.g. Amul Milk 1L, Basmati Rice 5kg"
                  className="input-field text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="input-field text-sm bg-slate-900"
                  >
                    <option value="product">Product Item</option>
                    <option value="unit">Unit of Measure</option>
                    <option value="customer">Customer Slang</option>
                    <option value="misc">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Language</label>
                  <select
                    value={vocabLang}
                    onChange={(e) => setVocabLang(e.target.value as any)}
                    className="input-field text-sm bg-slate-900"
                  >
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full btn-primary justify-center text-xs">
                <Plus className="w-4 h-4" />
                <span>Save Vocabulary Mapping</span>
              </button>
            </form>
          </div>

          {/* Lexicon List with Approval Status & In-place Editing */}
          <div className="lg:col-span-7 glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">
                Registered Shop Vocabulary ({vocabList.length})
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Injected into OCR & WhisperFlow
              </span>
            </div>

            {vocabList.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono py-8 text-center">
                No custom terms defined.
              </p>
            ) : (
              <div className="divide-y divide-white/5 max-h-96 overflow-y-auto pr-2 space-y-1">
                {vocabList.map((entry) => (
                  <div
                    key={entry.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shrink-0 mt-0.5">
                        {entry.language?.toUpperCase() || 'HI'}
                      </span>
                      <div>
                        {editingVocabId === entry.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-200">{entry.rawTerm} →</span>
                            <input
                              type="text"
                              value={editNormalizedTerm}
                              onChange={(e) => setEditNormalizedTerm(e.target.value)}
                              className="input-field py-0.5 px-2 text-xs w-48"
                            />
                            <button
                              onClick={() => handleSaveEditVocab(entry.id)}
                              className="text-emerald-400 hover:text-emerald-300 p-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingVocabId(null)}
                              className="text-slate-500 hover:text-slate-300 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-slate-200">
                            {entry.rawTerm} <span className="text-slate-500">→</span>{' '}
                            <span className="text-emerald-400">{entry.normalizedTerm}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 capitalize mt-0.5 flex items-center gap-2">
                          <span>Category: {entry.category}</span>
                          <span>• {entry.usageCount || 0} hits</span>
                          {entry.confidence && (
                            <span>• {Math.round(entry.confidence * 100)}% conf</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Approve / Reject / Edit / Delete */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                          entry.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : entry.status === 'rejected'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {entry.status || 'approved'}
                      </span>

                      {entry.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleStatusVocab(entry.id, 'approved')}
                          className="p-1 rounded text-slate-400 hover:text-emerald-400"
                          title="Approve mapping"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {entry.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => handleStatusVocab(entry.id, 'rejected')}
                          className="p-1 rounded text-slate-400 hover:text-red-400"
                          title="Reject mapping"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setEditingVocabId(entry.id);
                          setEditNormalizedTerm(entry.normalizedTerm);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-cyan-400"
                        title="Edit mapping"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteVocab(entry.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-400"
                        title="Delete mapping"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DATABASE SETTINGS, CATALOG & SCHEMA SAFEGUARDS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Strict Prisma Schema Safeguard Notice */}
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-cyan-300">Schema Immutability & Production Safeguards</div>
              <p className="text-cyan-200/90 leading-relaxed font-mono text-[11px] mt-0.5">
                The PostgreSQL relational schema is strictly enforced by compiled Prisma migrations. Ingestion of handwritten bills, customer accounts, and line items populates normalized tables without dynamic DDL mutations, eliminating relational schema drift.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Store Profile Form */}
            <div className="lg:col-span-5 glass-panel p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Store className="w-4 h-4 text-cyan-400" />
                Store Profile & Tax Settings
              </h3>
              <p className="text-xs text-slate-400">
                Configure your business identification and GSTIN number printed on exported ledgers and invoices.
              </p>

              <form onSubmit={handleSaveBusiness} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Store / Business Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    GSTIN Number (Goods & Services Tax ID)
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="e.g. 09AAACH7409R1ZZ"
                    className="input-field text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Store Physical Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    placeholder="Shop number, Street, City, State, PIN"
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="input-field text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingBiz}
                  className="w-full btn-primary py-2.5 px-4 text-xs font-bold justify-center"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingBiz ? 'Saving Changes...' : 'Save Business Settings'}</span>
                </button>
              </form>
            </div>

            {/* Customers & Products Records Catalog */}
            <div className="lg:col-span-7 space-y-6">
              {/* Customers Ledger */}
              <div className="glass-panel p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Customer Party Ledger ({customers.length})
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Relational Table: Customer
                  </span>
                </div>
                <div className="divide-y divide-white/5 max-h-48 overflow-y-auto pr-1">
                  {customers.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono py-3">No customer accounts registered yet.</p>
                  ) : (
                    customers.map((c) => (
                      <div key={c.id} className="py-2 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-200">{c.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {c.phone || 'No phone'}
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-400">
                          {c._count?.bills || 0} bills
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Products Catalog */}
              <div className="glass-panel p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Store className="w-4 h-4 text-cyan-400" />
                    Standard Product Catalog ({products.length})
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Relational Table: Product
                  </span>
                </div>
                <div className="divide-y divide-white/5 max-h-48 overflow-y-auto pr-1">
                  {products.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono py-3">No products in catalog yet.</p>
                  ) : (
                    products.map((p) => (
                      <div key={p.id} className="py-2 flex justify-between items-center">
                        <div>
                          <div className="text-xs font-bold text-slate-200">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {p.category || 'General'} • per {p.unit}
                          </div>
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          ₹{(p.defaultPrice || 0).toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
