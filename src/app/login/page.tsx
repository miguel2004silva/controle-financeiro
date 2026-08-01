'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFinance } from '@/context/finance-context';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Hexagon
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, refreshData } = useFinance();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthLoading(true);

    if (!email || !password) {
      setError('Por favor preencha todos os campos obrigatórios.');
      setAuthLoading(false);
      return;
    }

    try {
      if (isSupabaseConfigured) {
        const { error: err } = await supabase!.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
      } else {
        setError('O Supabase não está configurado. Utilize o botão "Entrar no Modo Sandbox" abaixo!');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao realizar o login.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple' | 'github') => {
    setError(null);
    if (!isSupabaseConfigured) {
      handleSandboxBypass();
      return;
    }

    try {
      const { error: err } = await supabase!.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (err) throw err;
    } catch (err: any) {
      setError(err.message || `Erro no login com ${provider}.`);
    }
  };

  const handleSandboxBypass = () => {
    setAuthLoading(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fin_sandbox_active', 'true');
      refreshData().then(() => {
        router.push('/');
        setAuthLoading(false);
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0c0c0e] text-zinc-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-amber-600/10 via-amber-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glassmorphic Dark Card */}
      <div className="w-full max-w-[420px] bg-[#141417]/90 backdrop-blur-xl border border-zinc-800/80 rounded-[32px] p-8 sm:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative z-10 space-y-6">
        
        {/* Top Floating Badge Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-[#E5A96E] shadow-inner mb-4 relative group">
            <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-md group-hover:bg-amber-500/20 transition-all" />
            <Hexagon size={28} className="relative z-10 stroke-[1.75]" />
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Login
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            Entre na sua conta para continuar
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 block">
              Endereço de E-mail
            </label>
            <div className="relative flex items-center">
              <Mail size={18} className="absolute left-3.5 text-zinc-500 pointer-events-none" />
              <input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1a1a1e] border border-zinc-800 focus:border-[#E5A96E]/60 focus:bg-[#1e1e24] rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 block">
              Senha
            </label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-3.5 text-zinc-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1a1a1e] border border-zinc-800 focus:border-[#E5A96E]/60 focus:bg-[#1e1e24] rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-zinc-500 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Main Action Button */}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#F0C090] to-[#E5A96E] hover:from-[#eab480] hover:to-[#db995c] text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(229,169,110,0.25)] active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {authLoading ? (
              <div className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800/80" />
          </div>
          <span className="relative z-10 px-3 bg-[#141417] text-[11px] text-zinc-500 font-medium">
            ou continue com
          </span>
        </div>

        {/* Social Logins Row */}
        <div className="flex items-center justify-center gap-4">
          {/* Google Button */}
          <button
            onClick={() => handleOAuthLogin('google')}
            title="Entrar com Google"
            className="w-12 h-12 rounded-full bg-[#1a1a1e] border border-zinc-800 flex items-center justify-center hover:bg-zinc-800/80 hover:border-zinc-700 transition-all active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.39 7.5l3.85 2.99c.9-2.7 3.4-4.45 6.76-4.45z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.48c-.29 1.48-1.14 2.73-2.4 3.58l3.74 2.9c2.18-2.01 3.67-4.96 3.67-8.64z"/>
              <path fill="#FBBC05" d="M5.24 14.79c-.23-.69-.37-1.43-.37-2.2s.14-1.51.37-2.2L1.39 7.4C.5 9.18 0 11.18 0 13.3c0 2.12.5 4.12 1.39 5.9l3.85-3.01c-.23-.69-.37-1.43-.37-2.2z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.74-2.9c-1.12.75-2.55 1.19-4.22 1.19-3.36 0-5.86-1.75-6.76-4.45L1.39 16.9C3.37 20.35 7.35 23 12 23z"/>
            </svg>
          </button>

          {/* Apple Button */}
          <button
            onClick={() => handleOAuthLogin('apple')}
            title="Entrar com Apple"
            className="w-12 h-12 rounded-full bg-[#1a1a1e] border border-zinc-800 flex items-center justify-center hover:bg-zinc-800/80 hover:border-zinc-700 transition-all active:scale-95 text-white"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.09c.68-.83 1.15-1.99.98-3.15-1 .04-2.25.67-2.96 1.49-.64.74-1.2 1.93-1.04 3.07 1.12.09 2.3-.57 3.02-1.41z"/>
            </svg>
          </button>

          {/* GitHub Button */}
          <button
            onClick={() => handleOAuthLogin('github')}
            title="Entrar com GitHub"
            className="w-12 h-12 rounded-full bg-[#1a1a1e] border border-zinc-800 flex items-center justify-center hover:bg-zinc-800/80 hover:border-zinc-700 transition-all active:scale-95 text-white"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </button>
        </div>

        {/* Demo/Sandbox Quick Access */}
        <button
          type="button"
          onClick={handleSandboxBypass}
          className="w-full py-2.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/60 text-zinc-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all group"
        >
          <span>Entrar no Modo Sandbox (Demonstrativo)</span>
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>

      </div>

      {/* Bottom Trust Badge */}
      <div className="flex items-center gap-2 text-zinc-500 text-xs mt-6 font-medium z-10 select-none">
        <ShieldCheck size={16} className="text-emerald-500/80" />
        <span>Seus dados estão protegidos conosco</span>
      </div>

    </div>
  );
}
