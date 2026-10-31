import React from 'react';
import { useToast } from '../../hooks/useToast';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md pointer-events-none">
      {toasts.map((toast) => {
        let icon = <Info className="w-5 h-5 text-cyan-400 shrink-0" />;
        let borderClass = 'border-cyan-500/30 bg-slate-900/90';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          borderClass = 'border-emerald-500/30 bg-slate-900/90 shadow-glow-emerald';
        } else if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />;
          borderClass = 'border-red-500/30 bg-slate-900/90';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-gold-400 shrink-0" />;
          borderClass = 'border-gold-500/30 bg-slate-900/90 shadow-glow-gold';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slide-up ${borderClass}`}
          >
            <div className="flex items-center gap-3">
              {icon}
              <p className="text-sm font-medium text-slate-100">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
