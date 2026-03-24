import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, RefreshCw, AlertCircle, Loader2, ShieldCheck, User } from 'lucide-react';
import { signupApi } from '../api';
import { Page } from '../types';

interface SignupProps {
  onNavigate: (page: Page) => void;
}

export const Signup: React.FC<SignupProps> = ({ onNavigate }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsAuthenticating(true);
      await signupApi({ email, password });
      alert('Sign up successful! You can now log in.');
      onNavigate('login');
    } catch (err: any) {
      setError(err.message || 'Unable to create account. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6CEFC] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[48px] p-10 shadow-2xl border border-white">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-[#1a0e1b] mb-2">Create Account</h1>
          <p className="text-zinc-500 font-medium">Join the RecipeHub community.</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold">
            <AlertCircle size={18} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
              <input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-4 outline-none font-bold shadow-sm focus:ring-2 focus:ring-[#a832d3]/20" required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
              <input type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-12 outline-none font-bold shadow-sm focus:ring-2 focus:ring-[#a832d3]/20" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Confirm Password</label>
            <div className="relative">
              <RefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
              <input type={showPassword ? "text" : "password"} placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-4 outline-none font-bold shadow-sm focus:ring-2 focus:ring-[#a832d3]/20" required />
            </div>
          </div>

          <button type="submit" disabled={isAuthenticating} className="w-full bg-[#1a0e1b] text-white py-5 rounded-2xl font-black text-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl mt-4">
            {isAuthenticating ? <Loader2 className="animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-bold text-zinc-400">
          Already have an account? <button onClick={() => onNavigate('login')} className="text-[#a832d3] hover:underline">Log In</button>
        </div>
      </div>
    </div>
  );
};
