'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFinance } from '@/context/finance-context';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Wallet, LogIn, UserPlus, ShieldAlert, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, refreshData } = useFinance();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // If user is already authenticated, send them to dashboard
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
        if (isLogin) {
          // Login via Supabase
          const { error: err } = await supabase!.auth.signInWithPassword({
            email,
            password,
          });
          if (err) throw err;
        } else {
          // Register via Supabase
          const { error: err } = await supabase!.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name || email.split('@')[0],
              }
            }
          });
          if (err) throw err;
          
          alert('Conta criada! Verifique seu email para confirmação se necessário.');
          setIsLogin(true);
        }
      } else {
        // Fallback Mock authentication
        setError('O Supabase não está configurado. Use o modo Sandbox abaixo para testar!');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao processar a autenticação.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    if (!isSupabaseConfigured) {
      // Simulate Google auth in mock mode
      setAuthLoading(true);
      setTimeout(() => {
        refreshData();
        router.push('/');
        setAuthLoading(false);
      }, 1000);
      return;
    }

    try {
      const { error: err } = await supabase!.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (err) throw err;
    } catch (err: any) {
      setError(err.message || 'Erro no login com Google.');
    }
  };

  // Instant Mock login
  const handleSandboxBypass = () => {
    setAuthLoading(true);
    // Setting items triggers context state load
    if (typeof window !== 'undefined') {
      localStorage.setItem('fin_sandbox_active', 'true');
      // trigger page refresh via context
      refreshData().then(() => {
        router.push('/');
        setAuthLoading(false);
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-foreground flex items-center justify-center p-4">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-2xl glassmorphism relative z-10">
        
        {/* Brand / Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent to-primary flex items-center justify-center text-white glow-primary mb-3">
            <Wallet size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Controle<span className="text-primary font-medium">Financeiro</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5">
            {isSupabaseConfigured 
              ? 'Conecte-se com sua conta para gerenciar seu patrimônio' 
              : 'Otimizado para controle diário de finanças e ativos'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 mb-5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold flex items-start gap-2.5 animate-fade-in">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Nome
              </label>
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-muted border border-border/50 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              E-mail
            </label>
            <input
              type="email"
              placeholder="exemplo@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-muted border border-border/50 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Senha
              </label>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-muted border border-border/50 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              required
            />
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3 mt-2 rounded-xl font-bold text-sm tracking-wide text-white gradient-accent gradient-accent-hover transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed glow-primary"
          >
            {authLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn size={16} />
                Entrar
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Criar Conta
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/40" />
          </div>
          <span className="relative z-10 px-3 bg-[#0B0E14] text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            Ou continuar com
          </span>
        </div>

        {/* Google OAuth Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={authLoading}
          className="w-full py-2.5 rounded-xl border border-border/60 hover:bg-muted text-foreground text-sm font-semibold flex items-center justify-center gap-2.5 transition-colors"
        >
          {/* Simple Google SVG Icon */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.39 7.5l3.85 2.99c.9-2.7 3.4-4.45 6.76-4.45z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.48c-.29 1.48-1.14 2.73-2.4 3.58l3.74 2.9c2.18-2.01 3.67-4.96 3.67-8.64z"
            />
            <path
              fill="#FBBC05"
              d="M5.24 14.79c-.23-.69-.37-1.43-.37-2.2s.14-1.51.37-2.2L1.39 7.4C.5 9.18 0 11.18 0 13.3c0 2.12.5 4.12 1.39 5.9l3.85-3.01c-.23-.69-.37-1.43-.37-2.2z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.74-2.9c-1.12.75-2.55 1.19-4.22 1.19-3.36 0-5.86-1.75-6.76-4.45L1.39 16.9C3.37 20.35 7.35 23 12 23z"
            />
          </svg>
          Google
        </button>

        {/* Sandbox Access Bypass button */}
        <button
          onClick={handleSandboxBypass}
          className="w-full mt-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-colors group"
        >
          Acessar Modo Demonstrativo (Sandbox)
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Toggle Login/Signup links */}
        {isSupabaseConfigured && (
          <div className="text-center mt-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-muted-foreground hover:text-white transition-colors"
            >
              {isLogin 
                ? 'Ainda não tem conta? Crie uma conta' 
                : 'Já tem conta? Faça seu login'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
