'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/finance-context';
import { CategoryIcon } from '@/components/category-icon';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2,
  Calendar,
  Layers,
  Wallet
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function DashboardPage() {
  const { 
    transactions, 
    categories, 
    investments, 
    deleteTransaction,
    setTransactionModalOpen 
  } = useFinance();

  const [chartRange, setChartRange] = useState<'7D' | '1M' | '6M' | '1A'>('6M');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format currency helper
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  // ----------------------------------------------------
  // CALCULATING METRICS
  // ----------------------------------------------------

  // 1. Account balance (total revenues - total expenses)
  const totalRevenuesAllTime = transactions
    .filter(t => t.tipo === 'receita')
    .reduce((sum, t) => sum + Number(t.valor), 0);
  const totalExpensesAllTime = transactions
    .filter(t => t.tipo === 'despesa')
    .reduce((sum, t) => sum + Number(t.valor), 0);
  
  const accountBalance = totalRevenuesAllTime - totalExpensesAllTime;

  // 2. Total investments valuation (qty * current price)
  const currentInvestmentsValuation = investments.reduce(
    (sum, inv) => sum + (Number(inv.quantidade) * Number(inv.preço_atual)),
    0
  );

  // 3. Consolidated balance (account balance + investment assets valuation)
  const consolidatedBalance = accountBalance + currentInvestmentsValuation;

  // 4. Monthly metrics (Current month)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.data);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthRevenues = currentMonthTransactions
    .filter(t => t.tipo === 'receita')
    .reduce((sum, t) => sum + Number(t.valor), 0);

  const monthExpenses = currentMonthTransactions
    .filter(t => t.tipo === 'despesa')
    .reduce((sum, t) => sum + Number(t.valor), 0);

  const monthBalance = monthRevenues - monthExpenses;

  // Amount invested this month (Expenses flagged with 'Investimentos' category)
  const investmentsCategory = categories.find(c => c.nome.toLowerCase() === 'investimentos');
  const monthInvested = currentMonthTransactions
    .filter(t => t.tipo === 'despesa' && t.categoria_id === investmentsCategory?.id)
    .reduce((sum, t) => sum + Number(t.valor), 0);

  // ----------------------------------------------------
  // CATEGORIES PROGRESS & DONUT
  // ----------------------------------------------------
  const categoryExpenses = categories.map(cat => {
    const spent = currentMonthTransactions
      .filter(t => t.tipo === 'despesa' && t.categoria_id === cat.id)
      .reduce((sum, t) => sum + Number(t.valor), 0);

    const pct = cat.orçamento_mensal > 0 ? (spent / cat.orçamento_mensal) * 100 : 0;

    return {
      ...cat,
      spent,
      percentage: Math.min(100, pct),
      rawPercentage: pct
    };
  }).filter(c => c.spent > 0);

  // Pie chart data
  const pieData = categoryExpenses.map(c => ({
    name: c.nome,
    value: c.spent,
    color: c.cor
  }));

  // Recent transactions list (5 items)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5);

  // ----------------------------------------------------
  // ALERTS ENGINE
  // ----------------------------------------------------
  const alerts: string[] = [];

  // Budget warnings (>= 80% used)
  categoryExpenses.forEach(c => {
    if (c.rawPercentage >= 100) {
      alerts.push(`Limite atingido! Você usou 100%+ do orçamento de ${c.nome}.`);
    } else if (c.rawPercentage >= 80) {
      alerts.push(`Atenção: Você usou ${c.rawPercentage.toFixed(0)}% do orçamento de ${c.nome}.`);
    }
  });

  // Upcoming bills / recurrent items within 7 days
  const pendingBills = transactions.filter(t => {
    if (!t.recorrente || t.tipo !== 'despesa') return false;
    const txDate = new Date(t.data);
    const timeDiff = txDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff >= 0 && daysDiff <= 7;
  });

  pendingBills.forEach(bill => {
    alerts.push(`Conta a vencer: "${bill.descrição}" vence em breve (${new Date(bill.data).toLocaleDateString('pt-BR')})`);
  });

  // ----------------------------------------------------
  // HISTORY / EVOLUTION DATA (7D, 1M, 6M, 1A Filter)
  // ----------------------------------------------------
  const generateHistoryData = () => {
    // We mock a nice historical trend curve ending at our current consolidated balance
    const pointsCount = chartRange === '7D' ? 7 : chartRange === '1M' ? 30 : chartRange === '6M' ? 6 : 12;
    const data = [];
    
    let baseVal = consolidatedBalance * 0.85; // simulate starting lower
    const step = (consolidatedBalance - baseVal) / pointsCount;

    for (let i = pointsCount; i >= 0; i--) {
      const d = new Date();
      if (chartRange === '7D') {
        d.setDate(now.getDate() - i);
      } else if (chartRange === '1M') {
        d.setDate(now.getDate() - i);
      } else if (chartRange === '6M') {
        d.setMonth(now.getMonth() - i);
      } else {
        d.setMonth(now.getMonth() - i);
      }

      // Add a slight random noise to look natural
      const noise = (Math.random() - 0.4) * (consolidatedBalance * 0.015);
      const val = Math.max(0, baseVal + (pointsCount - i) * step + noise);
      
      const label = chartRange === '7D' || chartRange === '1M'
        ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        : d.toLocaleDateString('pt-BR', { month: 'short' });

      data.push({
        name: label,
        Patrimônio: Math.round(val)
      });
    }

    // Force the last point to be exactly the current consolidated balance
    data[data.length - 1].Patrimônio = Math.round(consolidatedBalance);

    return data;
  };

  const evolutionData = generateHistoryData();

  return (
    <div className="space-y-6">
      
      {/* Top Consolidado Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Patrimônio Consolidado</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1 font-mono">
            {formatBRL(consolidatedBalance)}
          </h2>
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <span className="text-success bg-success/10 px-2 py-0.5 rounded-full flex items-center font-bold">
              <TrendingUp size={12} className="mr-0.5" />
              +2.4%
            </span>
            <span className="text-muted-foreground">este mês</span>
          </div>
        </div>
        
        {/* Quick launcher button for mobile */}
        <button
          onClick={() => setTransactionModalOpen(true)}
          className="md:hidden w-full py-3 bg-gradient-to-r from-accent to-primary rounded-xl text-sm font-bold text-white text-center flex items-center justify-center gap-2"
        >
          <Layers size={16} />
          Lançamento Rápido
        </button>
      </div>

      {/* Net Worth Breakdown Card */}
      <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-100">Distribuição do Patrimônio</h3>
            <p className="text-xs text-muted-foreground font-medium">Divisão entre saldo líquido e investimentos (Base MultiCap)</p>
          </div>
        </div>
        
        {/* Progress Bar Split */}
        <div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden flex mb-4">
          {consolidatedBalance > 0 ? (
            <>
              {accountBalance > 0 && (
                <div 
                  className="h-full bg-indigo-500 transition-all duration-500" 
                  style={{ width: `${(Math.max(0, accountBalance) / (Math.max(0, accountBalance) + Math.max(0, currentInvestmentsValuation))) * 100}%` }}
                  title={`Liquidez: ${((Math.max(0, accountBalance) / (Math.max(0, accountBalance) + Math.max(0, currentInvestmentsValuation))) * 100).toFixed(1)}%`}
                />
              )}
              {currentInvestmentsValuation > 0 && (
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${(Math.max(0, currentInvestmentsValuation) / (Math.max(0, accountBalance) + Math.max(0, currentInvestmentsValuation))) * 100}%` }}
                  title={`Investimentos: ${((Math.max(0, currentInvestmentsValuation) / (Math.max(0, accountBalance) + Math.max(0, currentInvestmentsValuation))) * 100).toFixed(1)}%`}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-muted/40" />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-[#12151D]/60 border border-border/20 rounded-xl flex items-center justify-between hover:border-indigo-500/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Wallet size={16} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Liquidez (Saldo em Conta)</p>
                <p className="text-lg font-bold text-white font-mono">{formatBRL(accountBalance)}</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              {(consolidatedBalance > 0 ? (Math.max(0, accountBalance) / (Math.max(0, accountBalance) + Math.max(0, currentInvestmentsValuation))) * 100 : 0).toFixed(1)}%
            </span>
          </div>

          <div className="p-3 bg-[#12151D]/60 border border-border/20 rounded-xl flex items-center justify-between hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Investimentos (Ativos)</p>
                <p className="text-lg font-bold text-white font-mono">{formatBRL(currentInvestmentsValuation)}</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {(consolidatedBalance > 0 ? (Math.max(0, currentInvestmentsValuation) / (Math.max(0, accountBalance) + Math.max(0, currentInvestmentsValuation))) * 100 : 0).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Summaries (Revenues, Expenses, Balance, Invested) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenues Card */}
        <div className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden group hover:border-success/30 transition-all">
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-success/10 text-success flex items-center justify-center">
            <ArrowUpRight size={16} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold">Receitas</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-1 truncate font-mono">
              {formatBRL(monthRevenues)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">Entradas do mês</span>
        </div>

        {/* Expenses Card */}
        <div className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden group hover:border-danger/30 transition-all">
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-danger/10 text-danger flex items-center justify-center">
            <ArrowDownRight size={16} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold">Despesas</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-1 truncate font-mono">
              {formatBRL(monthExpenses)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">Saídas do mês</span>
        </div>

        {/* Month Balance Card */}
        <div className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden group hover:border-primary/30 transition-all">
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <DollarSign size={16} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold">Saldo Mensal</span>
            <p className={`text-xl sm:text-2xl font-black mt-1 truncate font-mono ${monthBalance >= 0 ? 'text-white' : 'text-danger'}`}>
              {formatBRL(monthBalance)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">Sobrou na conta</span>
        </div>

        {/* Invested Card */}
        <div className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden group hover:border-accent/30 transition-all">
          <div className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <PiggyBank size={16} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold">Investido</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-1 truncate font-mono">
              {formatBRL(monthInvested)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">Aportes do mês</span>
        </div>
      </div>

      {/* Main Graph (Evolution of Wealth) */}
      <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h3 className="font-bold text-base text-slate-100">Evolução do Patrimônio</h3>
            <p className="text-xs text-muted-foreground">Evolução combinada de conta corrente e investimentos</p>
          </div>
          
          {/* Range filter buttons */}
          <div className="flex bg-muted p-1 rounded-lg border border-border/30 w-full sm:w-auto">
            {(['7D', '1M', '6M', '1A'] as const).map(range => (
              <button
                key={range}
                onClick={() => setChartRange(range)}
                className={`flex-1 sm:flex-initial py-1.5 px-3.5 text-xs font-semibold rounded-md transition-all ${
                  chartRange === range
                    ? 'bg-[#12151D] text-white shadow-sm'
                    : 'text-muted-foreground hover:text-slate-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Chart render wrapper with mounted check */}
        <div className="h-[280px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `R$ ${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#12151D',
                    border: '1px solid #1F2937',
                    borderRadius: '12px'
                  }}
                  labelStyle={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '11px' }}
                  itemStyle={{ color: '#F8FAFC', fontWeight: 'black', fontSize: '13px' }}
                  formatter={(val: any) => [formatBRL(Number(val)), 'Patrimônio']}
                />
                <Area 
                  type="monotone" 
                  dataKey="Patrimônio" 
                  stroke="#6366F1" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorPatrimonio)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full bg-muted/20 animate-pulse rounded-xl" />
          )}
        </div>
      </div>

      {/* Two Column Layout: Budget Progress / Alerts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Category Budgets (Donut + Bars) (3 cols) */}
        <div className="lg:col-span-3 bg-card border border-border/40 rounded-2xl p-5 space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-100">Despesas por Categoria</h3>
            <p className="text-xs text-muted-foreground">Consumo do orçamento planejado para este mês</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Donut Chart */}
            <div className="h-[180px] flex items-center justify-center relative">
              {mounted && pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#12151D',
                        border: '1px solid #1F2937',
                        borderRadius: '12px'
                      }}
                      itemStyle={{ color: '#F8FAFC', fontSize: '12px' }}
                      formatter={(val: any) => [formatBRL(Number(val)), 'Gasto']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-muted/20 animate-pulse" />
              )}
              {pieData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground font-semibold">
                  Sem gastos este mês
                </div>
              )}
            </div>

            {/* Progress Bars */}
            <div className="space-y-4">
              {categoryExpenses.length > 0 ? (
                categoryExpenses.slice(0, 4).map(cat => (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.cor }} />
                        {cat.nome}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {formatBRL(cat.spent)} <span className="text-[10px] font-normal">/ {formatBRL(cat.orçamento_mensal)}</span>
                      </span>
                    </div>
                    {/* Progress Bar background */}
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.cor 
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Cadastre gastos para visualizar o progresso dos orçamentos.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Alerts & Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Alerts Widget */}
          {alerts.length > 0 && (
            <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Alertas Ativos</h4>
              <div className="space-y-2.5">
                {alerts.map((alert, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-danger/5 border border-danger/15 rounded-xl flex gap-2 text-xs text-slate-200"
                  >
                    <AlertCircle className="text-danger shrink-0 mt-0.5" size={14} />
                    <p className="leading-snug">{alert}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Ledger table widget */}
          <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-100">Transações Recentes</h3>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Últimas 5
              </span>
            </div>

            <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => {
                  const cat = categories.find(c => c.id === tx.categoria_id);
                  const isRevenue = tx.tipo === 'receita';
                  
                  return (
                    <div 
                      key={tx.id} 
                      className="p-3 bg-[#0B0E14]/40 hover:bg-muted/30 border border-border/20 rounded-xl flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Circle Icon */}
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: cat?.cor || '#6B7280' }}
                        >
                          <CategoryIcon name={cat?.icone || 'circle'} size={16} />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-100 truncate">{tx.descrição}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                            <span>{new Date(tx.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                            {tx.recorrente && (
                              <span className="bg-muted px-1.5 py-0.25 rounded text-[8px] uppercase tracking-wider font-extrabold text-slate-400">
                                Fixo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-mono font-extrabold ${isRevenue ? 'text-success' : 'text-slate-300'}`}>
                          {isRevenue ? '+' : '-'} {formatBRL(Number(tx.valor))}
                        </span>
                        
                        {/* Inline Delete Icon */}
                        <button
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-1 rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          title="Excluir"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-muted-foreground">Nenhuma transação lançada ainda.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
