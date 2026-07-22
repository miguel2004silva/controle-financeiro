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
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transações', href: '/transacoes', icon: ArrowUpDown },
  { name: 'Investimentos', href: '/investimentos', icon: TrendingUp },
  { name: 'Metas & Orçamentos', href: '/metas', icon: Target },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
];

export const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, signOut, setTransactionModalOpen } = useFinance();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navbar - Desktop */}
      <header className="hidden md:block fixed top-0 left-0 right-0 h-16 border-b border-border/40 glassmorphism z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent to-primary flex items-center justify-center text-white glow-primary group-hover:scale-105 transition-transform duration-200">
              <Wallet size={18} />
            </div>
            <span className="font-extrabold tracking-tight text-foreground text-sm">
              Controle<span className="text-primary font-medium">Financeiro</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/30">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                    isActive
                      ? 'bg-card text-primary shadow-sm border border-border/50'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Controls & Theme Switcher */}
          <div className="flex items-center gap-3">
            
            {/* Theme Toggle Button */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-muted/50 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            )}

            {/* Quick transaction add button */}
            <button
              onClick={() => setTransactionModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white rounded-lg bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-all shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={14} />
              Lançar
            </button>

            {/* User Dropdown/Card */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 border border-border/30 rounded-xl">
              <User size={14} className="text-muted-foreground" />
              <span className="text-xs font-bold text-foreground max-w-[100px] truncate">
                {user?.name || user?.email}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={signOut}
              className="p-2 rounded-lg border border-border/40 text-muted-foreground hover:text-danger hover:bg-danger/5 hover:border-danger/20 transition-all"
              title="Sair"
            >
              <LogOut size={15} />
            </button>

          </div>

        </div>
      </header>

      {/* Top Header - Mobile */}
      <header className="h-16 px-4 border-b border-border/30 flex items-center justify-between bg-card/60 backdrop-blur-md sticky top-0 z-40 md:hidden transition-colors duration-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent to-primary flex items-center justify-center text-white">
            <Wallet size={15} />
          </div>
          <span className="font-extrabold text-xs tracking-tight text-foreground">
            Controle<span className="text-primary font-medium">Financeiro</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Theme Toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground"
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          )}

          <span className="text-[10px] bg-muted border border-border/50 text-muted-foreground px-2 py-0.5 rounded font-black">
            Premium
          </span>
          
          <button 
            onClick={signOut}
            className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-white"
            title="Sair"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-24 pb-24 md:pb-12 animate-fade-in transition-all duration-200">
        {children}
      </main>

      {/* Mobile Bottom Bar Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-lg border-t border-border/50 z-40 flex items-center justify-around px-2 shadow-2xl transition-colors duration-200">
        {NAV_ITEMS.slice(0, 4).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-grow py-2 gap-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
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
        className="md:hidden fixed right-4 bottom-20 z-30 w-12 h-12 rounded-full text-white bg-gradient-to-r from-accent to-primary shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all glow-primary"
        aria-label="Adicionar transação"
      >
        <Plus size={24} />
      </button>

      {/* The Quick Add Modal */}
      <QuickTransactionModal />
    </div>
  );
};
