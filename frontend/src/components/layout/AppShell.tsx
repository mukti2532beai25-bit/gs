import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { demoApi } from '../../services/api';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetDemo = async () => {
    if (!window.confirm('Reset BahiVerse Demo Store to pristine seeded sample records? (Real business data will never be touched).')) {
      return;
    }
    setIsResetting(true);
    try {
      await demoApi.reset();
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        window.location.reload();
      }, 1000);
    } catch {
      alert('Could not reset demo data. Please check network connectivity.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bv-bg text-slate-100 flex flex-col antialiased">
      {/* Sidebar (Desktop sticky, mobile sliding drawer) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex flex-col flex-1 min-w-0">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Global Demo Mode Notification Banner */}
        <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/15 border-b border-amber-500/30 px-4 py-2 sm:px-6 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="font-extrabold text-[10px] tracking-wide uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-mono">
              DEMO DATA
            </span>
            <span className="text-slate-300 font-medium hidden sm:inline">
              Sample business information • BahiVerse Demo Store (Ludhiana, Punjab)
            </span>
            <span className="text-slate-400 text-[11px] hidden lg:inline">
              (25 Products • 15 Customers • 8 Suppliers • 40 Sales Bills)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {resetSuccess ? (
              <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Demo Reset Complete!
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResetDemo}
                disabled={isResetting}
                className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                title="Safely reset demo store records to default pristine condition"
              >
                <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? 'Resetting Store...' : 'Reset Demo Store'}</span>
              </button>
            )}
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
