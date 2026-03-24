import React, { useState } from 'react';
import { Mail, Lock, Loader2, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Page } from '../types';
import { AuthResponse, loginApi } from '../api';

interface LoginProps {
  onNavigate: (page: Page) => void;
  onLoginSuccess?: (auth: AuthResponse) => void;
  isAdminMode?: boolean;
}

export const Login: React.FC<LoginProps> = ({ onNavigate, onLoginSuccess, isAdminMode = false }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setIsAuthenticating(true);
    setError(null);

    try {
      const data = await loginApi({ identifier, password });
      onLoginSuccess?.(data);
    } catch (err: any) {
      setError(err.message || 'Unable to login. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6CEFC] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[48px] p-10 shadow-2xl border border-white animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-3xl bg-[#a832d3]/10 text-[#a832d3] mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-4xl font-black text-[#1a0e1b] mb-2">
            {isAdminMode ? 'Admin Control' : 'RecipeHub'}
          </h1>
          <p className="text-zinc-500 font-medium text-sm">
            {isAdminMode ? 'Secure Administrative Authorization' : 'Login with your username or email'}
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold animate-in shake duration-300">
            <AlertCircle size={18} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Username or Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter username or email"
                required
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#a832d3]/20 font-bold transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-12 outline-none focus:ring-2 focus:ring-[#a832d3]/20 font-bold transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isAuthenticating}
            className={`w-full text-white py-5 rounded-2xl font-black text-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg ${isAdminMode ? 'bg-zinc-900 shadow-zinc-200' : 'bg-[#1a0e1b] shadow-purple-100'} hover:brightness-110`}
          >
            {isAuthenticating ? <Loader2 className="animate-spin" /> : isAdminMode ? 'Verify Identity' : 'Enter Hub'}
          </button>
        </form>

        {!isAdminMode && (
          <div className="mt-8 text-center text-xs font-bold text-zinc-400">
            Don't have an account? <button onClick={() => onNavigate('signup')} className="text-[#a832d3] hover:underline">Register</button>
          </div>
        )}
      </div>
    </div>
  );
};
