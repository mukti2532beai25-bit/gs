import React, { useState } from 'react';
import { Menu, Globe, Sparkles, Plus, Bell, User, LogOut, ChevronDown, CheckCircle2, Store } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LANGUAGE_LABELS } from '../../utils/formatters';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState(user?.business?.language || 'hi');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-20 bg-slate-950/85 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & Logo & Business name */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/5 lg:hidden transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* BahiVerse AI Logo */}
        <div
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-emerald-500/20 to-gold-500/20 border border-cyan-400/30 flex items-center justify-center shadow-glow-cyan group-hover:scale-105 transition-transform">
            <Store className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="hidden sm:block">
            <span className="font-extrabold text-sm tracking-tight text-white">
              Bahi<span className="text-cyan-400">Verse</span> <span className="text-emerald-400">AI</span>
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[140px]">
                {user?.business?.name || 'My Store'}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                GST Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Language selector, Notifications, Profile menu, Quick Capture */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language selector */}
        <div className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
            className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer pr-1"
          >
            <option value="en" className="bg-slate-900 text-slate-200">
              {LANGUAGE_LABELS.en}
            </option>
            <option value="hi" className="bg-slate-900 text-slate-200">
              {LANGUAGE_LABELS.hi}
            </option>
            <option value="pa" className="bg-slate-900 text-slate-200">
              {LANGUAGE_LABELS.pa}
            </option>
          </select>
        </div>

        {/* Notifications Icon with popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/5 relative transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 p-4 rounded-2xl glass-panel border border-white/10 shadow-2xl z-50 animate-scale-in">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                <span className="text-xs font-bold text-slate-100">Live Activity Feed</span>
                <span className="text-[10px] font-mono text-emerald-400">System Ready</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-200">3D Normalization Online</div>
                    <div className="text-[10px] text-slate-400">PostgreSQL 3NF verified</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-200">WhisperFlow Acoustic Active</div>
                    <div className="text-[10px] text-slate-400">Hindi/Punjabi dialect ready</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 p-3 rounded-2xl glass-panel border border-white/10 shadow-2xl z-50 animate-scale-in">
              <div className="px-2 py-1.5 border-b border-white/5 mb-1.5">
                <div className="text-xs font-bold text-slate-100">{user?.name}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</div>
                <div className="mt-1 text-[9px] font-mono text-cyan-400 uppercase tracking-wider">
                  Role: {user?.role || 'Store Owner'}
                </div>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/database?tab=business');
                }}
                className="w-full text-left px-2 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
              >
                <Store className="w-3.5 h-3.5 text-cyan-400" />
                <span>Business Settings</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full text-left px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 mt-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Capture Button */}
        <button
          onClick={() => navigate('/capture')}
          className="btn-primary py-2 px-3 sm:px-4 text-xs font-semibold shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Scan Bill</span>
        </button>
      </div>
    </header>
  );
}
