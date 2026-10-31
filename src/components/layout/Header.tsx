import React, { useState } from 'react';
import { Menu, Globe, Sparkles, Plus, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LANGUAGE_LABELS } from '../../utils/formatters';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState(user?.business?.language || 'hi');

  return (
    <header className="sticky top-0 z-30 h-20 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & breadcrumb/business title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/5 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>{user?.business?.name || 'My Store'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                GST: {user?.business?.gstin || 'Unregistered'}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Fintech 3D Accounting Engine • Multi-Lingual OCR Active
            </p>
          </div>
        </div>
      </div>

      {/* Right: Quick Capture, Language selector, notifications */}
      <div className="flex items-center gap-3">
        {/* Language selector */}
        <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
            className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
          >
            <option value="en" className="bg-slate-900 text-slate-200">
              {LANGUAGE_LABELS.en}
            </option>
            <option value="hi" className="bg-slate-900 text-slate-200">
              {LANGUAGE_LABELS.hi} (Hindi)
            </option>
            <option value="pa" className="bg-slate-900 text-slate-200">
              {LANGUAGE_LABELS.pa} (Punjabi)
            </option>
          </select>
        </div>

        {/* Demo Mode Pill */}
        <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono bg-gold-500/10 text-gold-400 border border-gold-500/20">
          <Sparkles className="w-3 h-3 text-gold-400 animate-spin-slow" />
          <span>Demo OCR Fallback</span>
        </div>

        {/* Quick Capture Button */}
        <button
          onClick={() => navigate('/capture')}
          className="btn-primary py-2 px-4 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Scan New Bill</span>
        </button>
      </div>
    </header>
  );
}
