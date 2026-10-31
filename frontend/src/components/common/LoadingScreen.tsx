import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading BahiVerse AI...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen w-full bg-bv-bg flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none translate-x-24 translate-y-24" />

      <div className="relative z-10 flex flex-col items-center gap-6 p-8 glass-panel border border-white/10 max-w-sm text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-emerald-500/20 to-gold-500/20 flex items-center justify-center border border-cyan-400/30 shadow-glow-cyan animate-pulse">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-wide">
            Bahi<span className="text-cyan-400">Verse</span> <span className="text-emerald-400">AI</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">{message}</p>
        </div>

        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 animate-pulse rounded-full w-2/3" />
        </div>
      </div>
    </div>
  );
}
