'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ArrowUpDown, 
  TrendingUp, 
  Target, 
  BarChart3, 
  LogOut, 
  Plus, 
  Wallet,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import { useFinance } from '@/context/finance-context';
import { QuickTransactionModal } from './quick-transaction-modal';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Patrimônio', href: '/', icon: LayoutDashboard },
  { name: 'Lançamentos', href: '/transacoes', icon: ArrowUpDown },
  { name: 'Investimentos', href: '/investimentos', icon: TrendingUp },
  { name: 'Metas & Orçamentos', href: '/metas', icon: Target },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
];

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, signOut, setTransactionModalOpen, selectedMonth, setSelectedMonth } = useFinance();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Sync theme with document attributes and local storage
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'Patrimônio';
      case '/transacoes': return 'Lançamentos';
      case '/investimentos': return 'Investimentos';
      case '/metas': return 'Orçamentos & Metas';
      case '/relatorios': return 'Relatórios';
      default: return 'Dashboard';
    }
  };

  const formatMonthYear = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-').map(Number);
    return `${MONTH_NAMES[month - 1]} de ${year}`;
  };

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  // If loading, show a dark sleek loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary glow-primary animate-pulse mb-4">
          <Wallet size={24} />
        </div>
        <div className="w-40 h-1 bg-muted rounded-full overflow-hidden">
          <div className="w-1/2 h-full bg-gradient-to-r from-accent to-primary animate-pulse rounded-full" />
        </div>
      </div>
    );
  }

  // Redirect to login if user is not authenticated and path is not /login
  if (!user && pathname !== '/login') {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  // If we are on the login page, render children raw
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      
      {/* 1. FIXED DESKTOP SIDEBAR - THEME AWARE (WHITE & GREEN) */}
      <aside className="hidden md:flex fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex-col z-40 border-r border-slate-200 dark:border-zinc-800">
        {/* Sidebar Logo */}
        <div className="h-16 px-6 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-[0_4px_12px_rgba(22,163,74,0.3)]">
            <Wallet size={18} />
          </div>
          <span className="font-semibold text-sm tracking-tight text-slate-800 dark:text-white">
            Controle<span className="text-primary italic font-normal">Financeiro</span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-[0_4px_12px_rgba(22,163,74,0.25)]'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500 dark:text-zinc-400'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 space-y-3">
          {/* User profile */}
          <div className="flex items-center gap-3 px-3 py-2 bg-muted dark:bg-zinc-900/50 rounded-xl border border-border/60 dark:border-zinc-800/60">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300">
              <User size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-bold">Usuário</p>
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                {user?.name || user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Theme Toggle Button */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
                title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
              >
                {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={signOut}
              className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-rose-500 flex items-center justify-center transition-colors"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE HEADER & BOTTOM NAV */}
      {/* Mobile Top Header */}
      <header className="h-16 px-4 border-b border-border flex items-center justify-between bg-card sticky top-0 z-40 md:hidden transition-colors duration-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <Wallet size={16} />
          </div>
          <span className="font-semibold text-xs tracking-tight">
            Controle<span className="text-primary italic font-normal">Financeiro</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Theme Toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 border border-border rounded-lg bg-muted text-muted-foreground hover:text-foreground"
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          )}

          <button 
            onClick={signOut}
            className="p-2 border border-border rounded-lg bg-muted text-muted-foreground hover:text-danger"
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* 3. MAIN CONTAINER & ROUTE PAGES */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen bg-background dark:bg-zinc-950 transition-colors duration-200">
        
        {/* Page Top Header - Desktop & Mobile */}
        <header className="w-full bg-white dark:bg-zinc-900 border-b border-border/80 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Olá, {user?.name || user?.email?.split('@')[0]}
            </p>
            <h1 className="text-xl font-bold text-foreground">
              {getPageTitle(pathname)}
            </h1>
          </div>

          {/* Month Period Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1.5 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 w-full sm:w-auto justify-between shadow-sm">
            <button 
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-muted-foreground hover:text-foreground transition-all"
              aria-label="Mês Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold text-foreground px-4 min-w-[140px] text-center select-none font-mono-retro">
              {formatMonthYear(selectedMonth)}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-muted-foreground hover:text-foreground transition-all"
              aria-label="Próximo Mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-8 pb-24 md:pb-8 animate-fade-in transition-all duration-200">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Bar Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40 flex items-center justify-around px-2 transition-colors duration-200">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-grow py-2 gap-1 text-[9px] font-bold transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={isActive ? 'text-primary scale-110' : ''} size={18} />
              <span>{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>

      {/* Floating Action Button (FAB) for Mobile Quick Add */}
      <button
        onClick={() => setTransactionModalOpen(true)}
        className="md:hidden fixed right-4 bottom-20 z-30 w-12 h-12 rounded-full border border-border text-white bg-primary shadow-[0_4px_12px_rgba(22,163,74,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        aria-label="Adicionar transação"
      >
        <Plus size={24} />
      </button>

      {/* The Quick Add Modal */}
      <QuickTransactionModal />
    </div>
  );
};
