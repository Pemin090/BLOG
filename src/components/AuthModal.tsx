import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, openAuthModal, login, register, demoLogin } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (authModalMode === 'login') {
        await login({ email, password });
        success('Welcome back to InkFlow!');
      } else {
        await register({ name, email, password, bio });
        success('Account created successfully! Welcome to the writer community.');
      }
      closeAuthModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setFormError(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSelect = async (account: 'sarah' | 'alex' | 'david') => {
    try {
      setIsSubmitting(true);
      await demoLogin(account);
      const names: Record<string, string> = {
        sarah: 'Sarah Chen (Staff Architect)',
        alex: 'Alex Morgan (Design Lead)',
        david: 'David Kim (DevOps Engineer)'
      };
      success(`Signed in as ${names[account]}`);
      closeAuthModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo sign-in failed';
      setFormError(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-zinc-800/80">
          <div>
            <h3 className="font-serif text-2xl text-zinc-100">
              {authModalMode === 'login' ? 'Sign in to InkFlow' : 'Create an Account'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              {authModalMode === 'login'
                ? 'Publish articles, join discussions, and interact with authors.'
                : 'Join our community of developers, designers, and storytellers.'}
            </p>
          </div>
          <button
            onClick={closeAuthModal}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Fast Demo Logins */}
        <div className="p-6 bg-zinc-950/60 border-b border-zinc-800/60">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            1-Click Demo Profiles (For Instant Testing)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoSelect('sarah')}
              disabled={isSubmitting}
              className="flex flex-col items-center p-2 rounded-xl border border-zinc-800 bg-zinc-900/90 hover:border-amber-500/50 hover:bg-zinc-800/80 transition-all text-center group disabled:opacity-50"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                alt="Sarah"
                className="w-8 h-8 rounded-full object-cover mb-1 group-hover:scale-105 transition-transform"
              />
              <span className="text-xs font-medium text-zinc-200 group-hover:text-amber-300">Sarah</span>
              <span className="text-[10px] text-zinc-500">Staff Dev</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSelect('alex')}
              disabled={isSubmitting}
              className="flex flex-col items-center p-2 rounded-xl border border-zinc-800 bg-zinc-900/90 hover:border-indigo-500/50 hover:bg-zinc-800/80 transition-all text-center group disabled:opacity-50"
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
                alt="Alex"
                className="w-8 h-8 rounded-full object-cover mb-1 group-hover:scale-105 transition-transform"
              />
              <span className="text-xs font-medium text-zinc-200 group-hover:text-indigo-300">Alex</span>
              <span className="text-[10px] text-zinc-500">Design Lead</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSelect('david')}
              disabled={isSubmitting}
              className="flex flex-col items-center p-2 rounded-xl border border-zinc-800 bg-zinc-900/90 hover:border-emerald-500/50 hover:bg-zinc-800/80 transition-all text-center group disabled:opacity-50"
            >
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80"
                alt="David"
                className="w-8 h-8 rounded-full object-cover mb-1 group-hover:scale-105 transition-transform"
              />
              <span className="text-xs font-medium text-zinc-200 group-hover:text-emerald-300">David</span>
              <span className="text-[10px] text-zinc-500">DevOps</span>
            </button>
          </div>
        </div>

        {/* Modal Body Form */}
        <div className="p-6">
          {formError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {authModalMode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Hayes"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {authModalMode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Short Bio (Optional)</label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Frontend developer, mechanical keyboard enthusiast..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{authModalMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-5 text-center text-xs text-zinc-400">
            {authModalMode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setFormError(null);
                    openAuthModal('register');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2 ml-1"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setFormError(null);
                    openAuthModal('login');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2 ml-1"
                >
                  Sign in instead
                </button>
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
