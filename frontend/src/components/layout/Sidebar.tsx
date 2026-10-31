import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Camera,
  FileCheck2,
  Mic,
  Database,
  FileSpreadsheet,
  Store,
  Sparkles,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      subtitle: '3D Ledger & Metrics',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      to: '/capture',
      label: 'Capture Bill',
      subtitle: '3D Laser Scanner',
      icon: Camera,
      badge: 'AI',
    },
    {
      to: '/review',
      label: 'Bill Review',
      subtitle: 'Confidence & Line Items',
      icon: FileCheck2,
    },
    {
      to: '/whisperflow',
      label: 'WhisperFlow',
      subtitle: '3D Waveform Voice AI',
      icon: Mic,
      badge: 'Voice',
    },
    {
      to: '/database',
      label: '3D Architect',
      subtitle: 'Relational Graph & Vocab',
      icon: Database,
    },
    {
      to: '/export',
      label: 'Export Center',
      subtitle: '3D Data Cubes & Tally',
      icon: FileSpreadsheet,
    },
    {
      to: '/database?tab=business',
      label: 'Business Settings',
      subtitle: 'Store Profile & GSTIN',
      icon: Store,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-bv-bg/80 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-slate-950/90 border-r border-white/10 backdrop-blur-2xl flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div>
          <div className="h-20 px-6 flex items-center gap-3 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-emerald-500/20 to-gold-500/20 border border-cyan-400/30 flex items-center justify-center shadow-glow-cyan">
              <Store className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-100">
                  Bahi<span className="text-cyan-400">Verse</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  3D AI
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 truncate max-w-[150px]">
                {user?.business?.name || 'Smart Ledger'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Core Modules
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/15 via-emerald-500/10 to-transparent border border-cyan-500/30 text-white shadow-glow-cyan'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <div className="text-xs font-semibold leading-none">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{item.subtitle}</div>
                    </div>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-white/5 text-cyan-300 border border-cyan-500/20">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer / User Profile & Logout */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-200 truncate">{user?.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="px-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>WebGL 3D Active</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
