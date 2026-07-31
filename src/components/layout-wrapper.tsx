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
    const initialTheme = savedTheme || 'dark';
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
      
      {/* 1. FIXED DESKTOP SIDEBAR - KOMADI ADMIN STYLE */}
      <aside className="hidden md:flex fixed top-0 bottom-0 left-0 w-62 bg-card/70 backdrop-blur-xl text-foreground flex-col z-40 border-r border-border/15 px-4 pt-6 pb-6 transition-all duration-300">
        {/* Sidebar Logo */}
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-extrabold shadow-md">
            <Wallet size={20} />
          </div>
          <div>
            <h2 className="font-extrabold text-sm tracking-tight text-foreground leading-tight">
              Controle<span className="opacity-70">Fin</span>
            </h2>
            <p className="text-[10.5px] font-medium text-muted-foreground/60">Painel Financeiro</p>
          </div>
        </div>

        {/* Quick Add Shiny Button */}
        <div className="px-1 mb-6">
          <button
            onClick={() => setTransactionModalOpen(true)}
            className="w-full shiny-btn gap-2 py-2.5 shadow-md font-semibold text-xs rounded-xl"
          >
            <Plus size={16} />
            <span>Novo Lançamento</span>
          </button>
        </div>

        {/* Navigation Links (Komadi style) */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center gap-3 h-11 px-3.5 rounded-xl shrink-0 transition-colors duration-200 outline-none ${
                  isActive
                    ? 'bg-foreground text-background font-bold shadow-sm'
                    : 'text-foreground/75 hover:bg-muted/50 hover:text-foreground font-medium'
                }`}
              >
                <Icon size={18} className={`relative z-10 ${isActive ? 'text-background' : 'text-muted-foreground/70'}`} />
                <span className="relative z-10 text-[13.5px] tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="pt-4 border-t border-border/15 space-y-3">
          {/* User profile */}
          <div className="flex items-center gap-3 px-3 py-2 bg-muted/40 rounded-xl border border-border/15">
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-foreground font-bold text-xs">
              {user?.name?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-foreground truncate">
                {user?.name || user?.email?.split('@')[0]}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground/60 truncate">Conta Ativa</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Theme Toggle Button */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 h-10 px-3 rounded-xl border border-border/15 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors text-xs font-semibold"
                title={theme === 'light' ? 'Tema Escuro' : 'Tema Claro'}
              >
                {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                <span>{theme === 'light' ? 'Escuro' : 'Claro'}</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={signOut}
              className="h-10 px-3 rounded-xl border border-border/15 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE HEADER & BOTTOM NAV */}
      <header className="h-16 px-4 border-b border-border/15 flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-40 md:hidden transition-colors duration-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-foreground text-background flex items-center justify-center font-bold">
            <Wallet size={16} />
          </div>
          <span className="font-extrabold text-xs tracking-tight text-foreground">
            Controle<span className="opacity-75">Fin</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 border border-border/15 rounded-xl bg-muted/50 text-foreground"
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          )}

          <button 
            onClick={signOut}
            className="p-2 border border-border/15 rounded-xl bg-muted/50 text-muted-foreground hover:text-rose-500"
            title="Sair"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* 3. MAIN CONTAINER & ROUTE PAGES */}
      <div className="flex-1 flex flex-col md:pl-62 min-h-screen bg-background transition-colors duration-200">
        
        {/* Page Top Header - Desktop & Mobile */}
        <header className="w-full border-b border-border/15 px-6 pt-6 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-foreground leading-tight">
              {getPageTitle(pathname)}
            </h1>
            <p className="text-[12.5px] font-medium text-muted-foreground/60 mt-0.5">
              Olá, {user?.name || user?.email?.split('@')[0]} • Visão geral do seu patrimônio
            </p>
          </div>

          {/* Month Period Selector (Komadi Admin Pill Switcher style) */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border/15 shadow-sm">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              aria-label="Mês Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-foreground px-3 min-w-[130px] text-center select-none">
              {formatMonthYear(selectedMonth)}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              aria-label="Próximo Mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-6 pb-24 md:pb-8 transition-all duration-200">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Bar Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-md border-t border-border/15 z-40 flex items-center justify-around px-2 transition-colors duration-200">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-grow py-2 gap-1 text-[10px] font-bold transition-colors ${
                isActive ? 'text-foreground font-extrabold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={isActive ? 'text-foreground scale-110' : ''} size={18} />
              <span>{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>

      {/* Floating Action Button (FAB) for Mobile Quick Add */}
      <button
        onClick={() => setTransactionModalOpen(true)}
        className="md:hidden fixed right-4 bottom-20 z-30 w-12 h-12 rounded-full border border-border/20 text-background bg-foreground shadow-lg flex items-center justify-center active:scale-95 transition-all"
        aria-label="Adicionar transação"
      >
        <Plus size={22} />
      </button>

      {/* The Quick Add Modal */}
      <QuickTransactionModal />
    </div>
  );
};
