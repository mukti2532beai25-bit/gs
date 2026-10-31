import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { vocabApi, businessApi } from '../services/api';
import DatabaseGraph3D from '../components/3d/DatabaseGraph3D';
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
} from 'lucide-react';
import { VocabularyEntry } from '../types/bahiverse';

export default function DatabaseArchitect() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'graph' | 'vocab' | 'business' | 'catalog'>('graph');

  // Business profile form
  const [businessName, setBusinessName] = useState(user?.business?.name || '');
  const [gstin, setGstin] = useState(user?.business?.gstin || '');
  const [address, setAddress] = useState(user?.business?.address || '');
  const [phone, setPhone] = useState(user?.business?.phone || '');
  const [isSavingBiz, setIsSavingBiz] = useState(false);

  // Vocabulary list & form
  const [vocabList, setVocabList] = useState<VocabularyEntry[]>([]);
  const [rawTerm, setRawTerm] = useState('');
  const [normalizedTerm, setNormalizedTerm] = useState('');
  const [category, setCategory] = useState<'product' | 'unit' | 'customer' | 'misc'>('product');
  const [vocabLang, setVocabLang] = useState<'hi' | 'pa' | 'en'>('hi');

  // Products and Customers lists
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

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
        businessApi.getProducts(),
        businessApi.getCustomers(),
      ]);
      setProducts(prods);
      setCustomers(custs);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVocab();
    fetchCatalog();
  }, []);

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
      addToast({ type: 'success', message: `Mapped "${rawTerm}" → "${normalizedTerm}"` });
      setRawTerm('');
      setNormalizedTerm('');
      fetchVocab();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to add vocabulary mapping' });
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
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-medium mb-2">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          Module 05 — 3D Database Normalizer
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Relational Database Architect & Store Lexicon
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Inspect 3D relational schema normalization, manage shop-specific slang mappings, and
          configure business parameters.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto">
        {[
          { key: 'graph', label: '3D Schema Graph', icon: Layers },
          { key: 'vocab', label: 'Shop Lexicon & Slang', icon: BookOpen },
          { key: 'business', label: 'Business Profile & Tax', icon: Store },
          { key: 'catalog', label: 'Customer & Product Ledger', icon: Users },
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

      {/* Tab 1: 3D Schema ER Graph */}
      {activeTab === 'graph' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Real-Time 3D Schema Normalization Graph
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Displays foreign key constraints, 3NF normalization, and ledger relations in WebGL space.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>PostgreSQL 3NF Schema</span>
              </div>
            </div>

            <div className="w-full h-[400px]">
              <DatabaseGraph3D />
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02]">
                <div className="text-slate-400 text-[10px]">TOTAL TABLES</div>
                <div className="text-slate-100 font-bold mt-1">6 Relational Entities</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02]">
                <div className="text-slate-400 text-[10px]">HISTORICAL PRICES</div>
                <div className="text-emerald-400 font-bold mt-1">Preserved on BillItem</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02]">
                <div className="text-slate-400 text-[10px]">ISOLATION</div>
                <div className="text-cyan-400 font-bold mt-1">Strict Business-Tenant</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02]">
                <div className="text-slate-400 text-[10px]">SCHEMA INTEGRITY</div>
                <div className="text-gold-400 font-bold mt-1">Zero Schema Drift</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Shop Lexicon & Slang */}
      {activeTab === 'vocab' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Lexicon Entry */}
          <div className="lg:col-span-5 glass-panel p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Add Local Slang / Term Mapping
            </h3>
            <p className="text-xs text-slate-400">
              Teach the OCR engine local product names or handwritten shortforms (e.g. "doodh" → "Amul Milk").
            </p>

            <form onSubmit={handleAddVocab} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Local Slang / Raw Term
                </label>
                <input
                  type="text"
                  required
                  value={rawTerm}
                  onChange={(e) => setRawTerm(e.target.value)}
                  placeholder="e.g. aata, doodh, ltr, chawal"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Normalized Standard Name
                </label>
                <input
                  type="text"
                  required
                  value={normalizedTerm}
                  onChange={(e) => setNormalizedTerm(e.target.value)}
                  placeholder="e.g. Wheat Flour 10kg, Milk 1L"
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

          {/* Lexicon List */}
          <div className="lg:col-span-7 glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">
                Registered Shop Vocabulary ({vocabList.length})
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Auto-injected into OCR pipeline
              </span>
            </div>

            {vocabList.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono py-8 text-center">
                No custom terms defined. Seed demo loaded default terms.
              </p>
            ) : (
              <div className="divide-y divide-white/5 max-h-96 overflow-y-auto pr-2">
                {vocabList.map((entry) => (
                  <div
                    key={entry.id}
                    className="py-3 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {entry.language.toUpperCase()}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          {entry.rawTerm} <span className="text-slate-500">→</span>{' '}
                          <span className="text-emerald-400">{entry.normalizedTerm}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          Category: {entry.category} • {entry.usageCount} matches
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteVocab(entry.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Business Profile & Tax Settings */}
      {activeTab === 'business' && (
        <div className="glass-panel p-8 max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Store Profile & Tax Settings</h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure your business identification, GST number, and address printed on invoices and exports.
            </p>
          </div>

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
                GSTIN Number (Goods and Services Tax ID)
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
              className="btn-primary py-3 px-6 text-xs font-bold"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingBiz ? 'Saving Changes...' : 'Save Business Settings'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Customer & Product Catalog */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customers */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Customer Accounts ({customers.length})
            </h3>
            <div className="divide-y divide-white/5 max-h-80 overflow-y-auto pr-1">
              {customers.map((c) => (
                <div key={c.id} className="py-2.5">
                  <div className="text-xs font-bold text-slate-200">{c.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {c.phone || 'No phone'} • {c._count?.bills || 0} bills recorded
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Store className="w-4 h-4 text-cyan-400" />
              Product Catalog ({products.length})
            </h3>
            <div className="divide-y divide-white/5 max-h-80 overflow-y-auto pr-1">
              {products.map((p) => (
                <div key={p.id} className="py-2.5 flex justify-between items-center">
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
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
