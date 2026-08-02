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
  Hexagon,
  Sparkles,
  UserCheck,
  CheckCircle2,
  TrendingUp,
  Wallet,
  PieChart as PieChartIcon
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, refreshData } = useFinance();
  
  // Komadi role switcher mode: 'titular' | 'sandbox'
  const [accessMode, setAccessMode] = useState<'titular' | 'sandbox'>('titular');

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

    if (accessMode === 'sandbox') {
      handleSandboxBypass();
      return;
    }

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
        setError('O Supabase não está configurado. Utilize o modo Demonstrativo (Sandbox) acima!');
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
    <main className="flex min-h-dvh w-full bg-[#F7F9F7] text-foreground overflow-x-hidden font-sora select-none">
      
      {/* ---------------------------------------------------- */}
      {/* LEFT SIDE: ELEGANT HERO VISUAL (50% WIDTH ON DESKTOP) */}
      {/* ---------------------------------------------------- */}
      <div className="relative hidden lg:flex lg:w-1/2 z-10 bg-gradient-to-br from-[#2D7D46] via-[#236B39] to-[#1B522C] text-white p-12 flex-col justify-between overflow-hidden">
        
        {/* Decorative Background Vector Curves & Glows */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <svg viewBox="0 0 1000 1200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <circle cx="700" cy="400" r="600" fill="#EAF5ED" opacity="0.15" />
            <path d="M0,0 L800,0 C650,450 300,800 0,700 Z" fill="#EAF5ED" opacity="0.1" />
            <path d="M0,1200 L0,600 C350,550 650,1050 1000,650 L1000,1200 Z" fill="#1B522C" opacity="0.5" />
          </svg>
        </div>

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-sm">
            <Wallet size={20} className="stroke-[2.2]" />
          </div>
          <span className="text-sm font-extrabold tracking-[0.14em] uppercase text-emerald-100">
            Controle Financeiro
          </span>
        </div>

        {/* Center Hero Card Container */}
        <div className="relative z-10 max-w-md mx-auto my-auto space-y-8 text-center sm:text-left">
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white mb-2 shadow-inner">
              <TrendingUp size={28} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-white">
                Alta Performance Financeira
              </h2>
              <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                Acompanhe o crescimento do seu patrimônio, simule investimentos em tempo real e mantenha sua reserva de emergência 100% blindada.
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-3 pt-2 text-xs font-semibold text-white/90">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={14} />
                </span>
                <span>Visão geral de liquidez & orçamento inteligente</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={14} />
                </span>
                <span>Gráficos interativos de pizza por categoria</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={14} />
                </span>
                <span>Simulador de aportes integrado por % de renda</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Footer Credits */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-emerald-100/70 font-medium">
          <span>© 2026 Controle Financeiro Premium</span>
          <span>Plataforma Segura</span>
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* RIGHT SIDE: KOMADI STYLE FORM (50% WIDTH ON DESKTOP) */}
      {/* ---------------------------------------------------- */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-5 sm:px-8 lg:px-12 py-8 z-20">
        
        <div className="flex flex-col min-h-[88dvh] w-full max-w-md justify-between mx-auto">
          
          {/* Header */}
          <header className="flex items-center justify-between w-full py-2">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-[#EAF5ED] text-[#236B39] shadow-xs">
                <Wallet size={18} className="stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold tracking-[0.14em] text-foreground uppercase">
                Controle Financeiro
              </span>
            </div>
          </header>

          {/* Main Form Content */}
          <main className="my-auto py-6 space-y-8">
            
            {/* Komadi Role Switcher (Pill Switcher) */}
            <div className="flex p-1 bg-muted/60 rounded-2xl border border-border/20 relative shadow-inner">
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-xs border border-border/15 transition-transform duration-300 ease-out ${
                  accessMode === 'sandbox' ? 'translate-x-[100%]' : 'translate-x-0'
                }`}
              />
              <button
                type="button"
                onClick={() => setAccessMode('titular')}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-colors duration-200 z-10 cursor-pointer ${
                  accessMode === 'titular' ? 'text-[#236B39]' : 'text-muted-foreground/70 hover:text-foreground'
                }`}
              >
                <UserCheck size={15} />
                <span>Titular da Conta</span>
              </button>

              <button
                type="button"
                onClick={() => setAccessMode('sandbox')}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-colors duration-200 z-10 cursor-pointer ${
                  accessMode === 'sandbox' ? 'text-[#236B39]' : 'text-muted-foreground/70 hover:text-foreground'
                }`}
              >
                <Sparkles size={15} />
                <span>Demonstrativo</span>
              </button>
            </div>

            {/* Typography Heading */}
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] leading-[1.1] text-foreground">
                {accessMode === 'titular' ? 'Acesse seu painel.' : 'Modo Demonstrativo.'}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground/70 tracking-[-0.01em]">
                {accessMode === 'titular'
                  ? 'Gerencie suas finanças com precisão.'
                  : 'Navegue livremente e teste todos os recursos.'}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-5">
              
              {accessMode === 'titular' && (
                <>
                  {/* Email Field */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground/60 block">
                      E-mail de acesso
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
                      <input
                        id="email"
                        type="email"
                        placeholder="seuemail@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 w-full bg-[#FAF6ED] border border-border/30 rounded-2xl pl-11 pr-5 text-sm font-bold text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-[#2D7D46] focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground/60 block">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-14 w-full bg-[#FAF6ED] border border-border/30 rounded-2xl pl-11 pr-12 text-sm font-bold text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-[#2D7D46] focus:bg-white transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Action Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="h-14 w-full rounded-2xl text-sm font-extrabold text-white bg-[#2D7D46] hover:bg-[#236B39] shadow-[0_4px_24px_rgba(45,125,70,0.28)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {authLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{accessMode === 'titular' ? 'Acessar painel' : 'Iniciar modo demonstrativo'}</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>

              {/* Social Login Separator */}
              {accessMode === 'titular' && (
                <div className="space-y-4 pt-2">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/20" />
                    </div>
                    <span className="relative z-10 px-3 bg-[#F7F9F7] text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">
                      ou continue com
                    </span>
                  </div>

                  {/* Social Buttons Row */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOAuthLogin('google')}
                      title="Entrar com Google"
                      className="h-12 flex-1 rounded-2xl bg-white border border-border/30 flex items-center justify-center hover:bg-[#EAF5ED] transition-all shadow-xs"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.39 7.5l3.85 2.99c.9-2.7 3.4-4.45 6.76-4.45z"/>
                        <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.48c-.29 1.48-1.14 2.73-2.4 3.58l3.74 2.9c2.18-2.01 3.67-4.96 3.67-8.64z"/>
                        <path fill="#FBBC05" d="M5.24 14.79c-.23-.69-.37-1.43-.37-2.2s.14-1.51.37-2.2L1.39 7.4C.5 9.18 0 11.18 0 13.3c0 2.12.5 4.12 1.39 5.9l3.85-3.01c-.23-.69-.37-1.43-.37-2.2z"/>
                        <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.74-2.9c-1.12.75-2.55 1.19-4.22 1.19-3.36 0-5.86-1.75-6.76-4.45L1.39 16.9C3.37 20.35 7.35 23 12 23z"/>
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOAuthLogin('apple')}
                      title="Entrar com Apple"
                      className="h-12 flex-1 rounded-2xl bg-white border border-border/30 flex items-center justify-center hover:bg-[#EAF5ED] transition-all text-foreground shadow-xs"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.09c.68-.83 1.15-1.99.98-3.15-1 .04-2.25.67-2.96 1.49-.64.74-1.2 1.93-1.04 3.07 1.12.09 2.3-.57 3.02-1.41z"/>
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOAuthLogin('github')}
                      title="Entrar com GitHub"
                      className="h-12 flex-1 rounded-2xl bg-white border border-border/30 flex items-center justify-center hover:bg-[#EAF5ED] transition-all text-foreground shadow-xs"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

            </form>

          </main>

          {/* Footer */}
          <footer className="w-full py-4 text-center">
            <p className="text-[11px] font-semibold text-muted-foreground/50 tracking-wide">
              © 2026 Controle Financeiro Premium • Dados Seguros & Criptografados
            </p>
          </footer>

        </div>

      </div>

    </main>
  );
}
