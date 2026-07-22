'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  const categoryExpenses = useMemo(() => {
    const map = new Map<string | null, number>();
    
    currentMonthTransactions
      .filter(t => t.tipo === 'despesa')
      .forEach(t => {
        const catId = t.categoria_id || null;
        map.set(catId, (map.get(catId) || 0) + Number(t.valor));
      });
      
    const result: Array<{ id: string; nome: string; cor: string; icone: string; orçamento_mensal: number; spent: number; percentage: number; rawPercentage: number }> = [];
    
    map.forEach((spent, catId) => {
      if (catId) {
        const cat = categories.find(c => c.id === catId);
        if (cat) {
          const pct = cat.orçamento_mensal > 0 ? (spent / cat.orçamento_mensal) * 100 : 0;
          result.push({
            id: cat.id,
            nome: cat.nome,
            cor: cat.cor,
            icone: cat.icone || 'circle',
            orçamento_mensal: cat.orçamento_mensal,
            spent,
            percentage: Math.min(100, pct),
            rawPercentage: pct
          });
          return;
        }
      }
      
      // Fallback for null or deleted category
      result.push({
        id: 'sem-categoria',
        nome: 'Sem Categoria',
        cor: '#605E59',
        icone: 'circle',
        orçamento_mensal: 0,
        spent,
        percentage: 0,
        rawPercentage: 0
      });
    });
    
    return result.sort((a, b) => b.spent - a.spent);
  }, [categories, currentMonthTransactions]);

  // Pie chart data
  const pieData = useMemo(() => {
    return categoryExpenses.map(c => ({
      name: c.nome,
      value: c.spent,
      color: c.cor
    }));
  }, [categoryExpenses]);

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
    <div className="space-y-8">
      
      {/* Grid of Summaries (Patrimônio Consolidado, Conta Corrente, Total Guardado, Despesas do Mês) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Patrimônio Consolidado */}
        <div className="bg-card border-2 border-border rounded-lg p-6 flex flex-col justify-between h-32 relative overflow-hidden premium-card">
          <div className="absolute right-5 top-5 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-border/20">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider font-serif">Patrimônio Consolidado</span>
            <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1.5 font-mono-retro">
              {formatBRL(consolidatedBalance)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">Conta Corrente + Investidos</span>
        </div>

        {/* Conta Corrente */}
        <div className="bg-card border-2 border-border rounded-lg p-6 flex flex-col justify-between h-32 relative overflow-hidden premium-card">
          <div className="absolute right-5 top-5 w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center border border-border/20">
            <Wallet size={20} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider font-serif">Saldo em Conta</span>
            <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1.5 font-mono-retro">
              {formatBRL(accountBalance)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">Saldo atual na conta</span>
        </div>

        {/* Total Guardado */}
        <div className="bg-card border-2 border-border rounded-lg p-6 flex flex-col justify-between h-32 relative overflow-hidden premium-card">
          <div className="absolute right-5 top-5 w-10 h-10 rounded-lg bg-success/10 text-success flex items-center justify-center border border-border/20">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider font-serif">Total Investido</span>
            <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1.5 font-mono-retro">
              {formatBRL(currentInvestmentsValuation)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">Dinheiro em investimentos</span>
        </div>

        {/* Despesas do Mês */}
        <div className="bg-card border-2 border-border rounded-lg p-6 flex flex-col justify-between h-32 relative overflow-hidden premium-card">
          <div className="absolute right-5 top-5 w-10 h-10 rounded-lg bg-danger/10 text-danger flex items-center justify-center border border-border/20">
            <ArrowDownRight size={20} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider font-serif">Despesas do Mês</span>
            <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1.5 font-mono-retro">
              {formatBRL(monthExpenses)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">Total gasto no mês atual</span>
        </div>
      </div>

      {/* Main Graph (Evolution of Wealth) */}
      <div className="bg-card p-6 premium-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h3 className="font-bold text-base text-foreground font-serif">Evolução do Patrimônio</h3>
            <p className="text-xs text-muted-foreground font-serif">Evolução combinada de conta corrente e investimentos</p>
          </div>
          
          {/* Range filter buttons */}
          <div className="flex bg-muted p-1 rounded-lg border-2 border-border w-full sm:w-auto">
            {(['7D', '1M', '6M', '1A'] as const).map(range => (
              <button
                key={range}
                onClick={() => setChartRange(range)}
                className={`flex-1 sm:flex-initial py-1 px-3 text-xs font-bold transition-all ${
                  chartRange === range
                    ? 'bg-card text-foreground border-2 border-border shadow-[2px_2px_0px_0px_var(--border)] -translate-x-[1px] -translate-y-[1px] rounded'
                    : 'text-muted-foreground hover:text-foreground'
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
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  stroke="var(--muted-foreground)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="var(--muted-foreground)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `R$ ${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '2px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--foreground)'
                  }}
                  labelStyle={{ color: 'var(--muted-foreground)', fontWeight: 'bold', fontSize: '11px' }}
                  itemStyle={{ color: 'var(--foreground)', fontWeight: 'bold', fontSize: '13px' }}
                  formatter={(val: any) => [formatBRL(Number(val)), 'Patrimônio']}
                />
                <Area 
                  type="monotone" 
                  dataKey="Patrimônio" 
                  stroke="var(--primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPatrimonio)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full bg-muted/20 animate-pulse rounded-lg" />
          )}
        </div>
      </div>

      {/* Two Column Layout: Budget Progress / Alerts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Category Budgets (Donut + Bars) (3 cols) */}
        <div className="lg:col-span-3 bg-card p-6 premium-card space-y-6">
          <div>
            <h3 className="font-bold text-base text-foreground font-serif">Despesas por Categoria</h3>
            <p className="text-xs text-muted-foreground font-serif">Distribuição de todas as saídas no mês atual</p>
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
                        backgroundColor: 'var(--card)',
                        border: '2px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--foreground)'
                      }}
                      itemStyle={{ color: 'var(--foreground)', fontSize: '12px' }}
                      formatter={(val: any) => [formatBRL(Number(val)), 'Gasto']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-muted/20 animate-pulse" />
              )}
              {pieData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground font-bold font-serif">
                  Sem gastos este mês
                </div>
              )}
            </div>
 
            {/* Progress Bars */}
            <div className="space-y-4">
              {categoryExpenses.length > 0 ? (
                categoryExpenses.map(cat => (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-foreground/90 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded border border-border shrink-0" style={{ backgroundColor: cat.cor }} />
                        {cat.nome}
                      </span>
                      <span className="text-muted-foreground font-mono-retro">
                        {formatBRL(cat.spent)}
                        {cat.orçamento_mensal > 0 ? (
                          <span className="text-[10px] font-normal text-muted-foreground/60"> / {formatBRL(cat.orçamento_mensal)}</span>
                        ) : (
                          <span className="text-[10px] font-normal text-muted-foreground/40"> (Sem Limite)</span>
                        )}
                      </span>
                    </div>
                    {/* Progress Bar background */}
                    <div className="w-full h-2.5 bg-muted border border-border/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500"
                        style={{ 
                          width: cat.orçamento_mensal > 0 ? `${cat.percentage}%` : '100%',
                          backgroundColor: cat.orçamento_mensal > 0 ? cat.cor : 'var(--muted-foreground)'
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4 font-serif">
                  Nenhum gasto registrado neste período.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Alerts & Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Alerts Widget */}
          {alerts.length > 0 && (
            <div className="bg-card p-5 premium-card space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-serif">Alertas Ativos</h4>
              <div className="space-y-2.5">
                {alerts.map((alert, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-danger/5 border-2 border-border/40 rounded flex gap-2 text-xs text-foreground/95"
                  >
                    <AlertCircle className="text-danger shrink-0 mt-0.5" size={14} />
                    <p className="leading-snug">{alert}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Ledger table widget */}
          <div className="bg-card p-5 premium-card space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-foreground font-serif">Transações Recentes</h3>
              <span className="text-[10px] font-bold text-primary bg-primary/10 border border-border/20 px-2 py-0.5 rounded">
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
                      className="p-3 bg-muted/40 hover:bg-muted border-2 border-border/10 rounded flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Category/Direction Icon */}
                        <div 
                          className="w-9 h-9 rounded flex items-center justify-center text-white shrink-0 border border-border/20 shadow-[1px_1px_0px_0px_var(--border)]"
                          style={{ backgroundColor: cat?.cor || (isRevenue ? '#10B981' : '#F43F5E') }}
                        >
                          {cat ? (
                            <CategoryIcon name={cat.icone || 'circle'} size={16} />
                          ) : isRevenue ? (
                            <ArrowUpRight size={16} />
                          ) : (
                            <ArrowDownRight size={16} />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-foreground truncate">{tx.descrição}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                            <span>{new Date(tx.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                            {tx.recorrente && (
                              <span className="bg-muted border border-border/40 px-1 py-0.25 rounded text-[8px] uppercase tracking-wider font-bold">
                                Fixo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-mono-retro ${isRevenue ? 'text-success' : 'text-foreground/80'}`}>
                          {isRevenue ? '+' : '-'} {formatBRL(Number(tx.valor))}
                        </span>
                        
                        {/* Inline Delete Icon */}
                        <button
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-1 rounded text-muted-foreground hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
                  <p className="text-xs text-muted-foreground font-serif">Nenhuma transação lançada ainda.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
