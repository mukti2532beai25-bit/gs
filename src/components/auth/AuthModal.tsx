import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Sparkles, Store, Lock, Mail, User, ArrowRight, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, signup } = useAuth();
  const { addToast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        addToast({ type: 'success', message: 'Welcome back to BahiVerse AI!' });
      } else {
        await signup(name, email, password, businessName || undefined);
        addToast({ type: 'success', message: 'Account and Business profile initialized!' });
      }
      onClose?.();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Authentication error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@bahiverse.ai');
    setPassword('Demo@1234');
    setMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bv-bg/80 backdrop-blur-md">
      <div className="relative w-full max-w-md p-8 glass-panel border border-white/10 shadow-2xl overflow-hidden animate-scale-in">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-400/30 flex items-center justify-center mb-3 shadow-glow-cyan">
            <Store className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">
            Bahi<span className="text-cyan-400">Verse</span> <span className="text-emerald-400">AI</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? 'Access your 3D digital ledger & intelligent records'
              : 'Empower your shop with next-gen automated bookkeeping'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Owner Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="input-field pl-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Shop / Business Name</label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Sharma General Store"
                    className="input-field pl-10 text-sm"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@store.com"
                className="input-field pl-10 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-10 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary justify-center mt-2 group"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Portal' : 'Create Free Store Account'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Button */}
        {mode === 'login' && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-2 px-3 rounded-lg text-xs font-mono font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fill Seeded Demo Account (Sharma Store)</span>
            </button>
          </div>
        )}

        {/* Toggle Mode */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <p>
              New shopkeeper?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4"
              >
                Register your business
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
