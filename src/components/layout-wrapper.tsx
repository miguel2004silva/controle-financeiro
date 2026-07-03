'use client';

import React from 'react';
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
  Menu,
  Wallet,
  Settings
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
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-card border-r border-border/50 flex-col fixed inset-y-0 left-0 z-20">
        {/* Brand */}
        <div className="h-16 px-6 border-b border-border/40 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent to-primary flex items-center justify-center text-white glow-primary">
            <Wallet size={18} />
          </div>
          <span className="font-extrabold tracking-tight text-foreground text-base">
            Controle<span className="text-primary font-medium">Financeiro</span>
          </span>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-border/30 mx-3 my-4 bg-muted/40 rounded-xl flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs text-muted-foreground">Logado como</p>
            <p className="text-sm font-bold text-foreground truncate">{user?.name || user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-lg bg-card hover:bg-muted border border-border/40 text-muted-foreground hover:text-danger hover:border-danger/30 transition-colors"
            title="Sair"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-primary text-white font-semibold shadow-lg shadow-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className={`transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-muted-foreground group-hover:text-primary'
                }`} size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Settings / Info Footer */}
        <div className="p-4 border-t border-border/40 text-xs text-muted-foreground text-center">
          <p>© 2026 Antigravity Premium</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Header - Mobile & Desktop info */}
        <header className="h-16 px-4 md:px-8 border-b border-border/30 flex items-center justify-between bg-card/60 backdrop-blur-md sticky top-0 z-10 md:bg-transparent md:backdrop-blur-none md:border-b-0 md:h-12 md:mt-4 md:mb-2">
          {/* Mobile menu trigger / Brand */}
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent to-primary flex items-center justify-center text-white">
              <Wallet size={16} />
            </div>
            <span className="font-black text-sm tracking-tight text-foreground">
              Controle<span className="text-primary font-normal">Financeiro</span>
            </span>
          </div>

          <div className="hidden md:block">
            <p className="text-xs text-muted-foreground">Seja bem vindo,</p>
            <h1 className="text-sm font-bold text-foreground">{user?.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick action button top right desktop */}
            <button
              onClick={() => setTransactionModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-all shadow-md shadow-primary/20"
            >
              <Plus size={14} />
              Lançar
            </button>
            <div className="md:hidden flex items-center gap-2">
              <span className="text-xs bg-muted border border-border/50 text-muted-foreground px-2 py-1 rounded-md">
                Sandbox
              </span>
              <button 
                onClick={signOut}
                className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-white"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-grow p-4 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Bar Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-lg border-t border-border/50 z-30 flex items-center justify-around px-2 shadow-2xl">
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
        className="md:hidden fixed right-4 bottom-20 z-40 w-12 h-12 rounded-full text-white bg-gradient-to-r from-accent to-primary shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all glow-primary"
        aria-label="Adicionar transação"
      >
        <Plus size={24} />
      </button>

      {/* The Quick Add Modal */}
      <QuickTransactionModal />
    </div>
  );
};
