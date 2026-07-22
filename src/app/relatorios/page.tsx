'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '@/context/finance-context';
import { CategoryIcon } from '@/components/category-icon';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Percent, 
  DollarSign, 
  Calendar,
  PieChart as PieIcon,
  TrendingUp
} from 'lucide-react';
import { FilterPanel, FilterState, initialFilterState } from '@/components/filter-panel';

export default function RelatoriosPage() {
  const { transactions, categories } = useFinance();
  const [mounted, setMounted] = useState(false);
  const [reportTimeframe, setReportTimeframe] = useState<'6M' | '1A'>('6M');
  const [activeFilters, setActiveFilters] = useState<FilterState>(initialFilterState);

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
  // FILTERING TRANSACTIONS FOR STATS & CHARTS
  // ----------------------------------------------------
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Text search
      if (activeFilters.search) {
        const matchesSearch = t.descrição.toLowerCase().includes(activeFilters.search.toLowerCase());
        if (!matchesSearch) return false;
      }

      // 2. Type (receita / despesa / investimento)
      if (activeFilters.type !== 'todos') {
        if (activeFilters.type === 'investimento') {
          const cat = categories.find(c => c.id === t.categoria_id);
          const isInvCat = cat?.nome.toLowerCase() === 'investimentos';
          const hasInvMov = !!t.investment_movement_id;
          if (!isInvCat && !hasInvMov) return false;
        } else {
          if (t.tipo !== activeFilters.type) return false;
        }
      }

      // 3. Category (multi-select)
      if (activeFilters.selectedCategories.length > 0) {
        if (!t.categoria_id || !activeFilters.selectedCategories.includes(t.categoria_id)) {
          return false;
        }
      }

      // 4. Value Range
      if (activeFilters.minVal !== '') {
        if (t.valor < activeFilters.minVal) return false;
      }
      if (activeFilters.maxVal !== '') {
        if (t.valor > activeFilters.maxVal) return false;
      }

      // 5. Date Period
      if (activeFilters.periodType !== 'todos') {
        const tDate = new Date(t.data);
        const tYear = tDate.getUTCFullYear();
        const tMonth = tDate.getUTCMonth();
        const tDay = tDate.getUTCDate();

        if (activeFilters.periodType === 'dia') {
          const filterDate = new Date(activeFilters.selectedDate + 'T00:00:00Z');
          const isSameDay = tYear === filterDate.getUTCFullYear() &&
                            tMonth === filterDate.getUTCMonth() &&
                            tDay === filterDate.getUTCDate();
          if (!isSameDay) return false;
        } else if (activeFilters.periodType === 'mes') {
          const [fYear, fMonth] = activeFilters.selectedMonth.split('-').map(Number);
          const isSameMonth = tYear === fYear && (tMonth + 1) === fMonth;
          if (!isSameMonth) return false;
        } else if (activeFilters.periodType === 'ano') {
          const fYear = Number(activeFilters.selectedYear);
          const isSameYear = tYear === fYear;
          if (!isSameYear) return false;
        } else if (activeFilters.periodType === 'personalizado') {
          if (activeFilters.startDate) {
            const start = new Date(activeFilters.startDate + 'T00:00:00Z');
            if (tDate < start) return false;
          }
          if (activeFilters.endDate) {
            const end = new Date(activeFilters.endDate + 'T23:59:59Z');
            if (tDate > end) return false;
          }
        }
      }

      return true;
    });
  }, [transactions, activeFilters, categories]);

  // ----------------------------------------------------
  // REPORT AGGREGATES
  // ----------------------------------------------------
  const totalRevenues = useMemo(() => {
    return filteredTransactions
      .filter(t => t.tipo === 'receita')
      .reduce((sum, t) => sum + Number(t.valor), 0);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.tipo === 'despesa')
      .reduce((sum, t) => sum + Number(t.valor), 0);
  }, [filteredTransactions]);

  const netSavings = totalRevenues - totalExpenses;
  const savingsRate = totalRevenues > 0 ? (netSavings / totalRevenues) * 100 : 0;

  // ----------------------------------------------------
  // REVENUES VS EXPENSES MONTHLY GROUPING
  // ----------------------------------------------------
  const barChartData = useMemo(() => {
    const pointsCount = reportTimeframe === '6M' ? 6 : 12;
    interface MonthlyComparison {
      label: string;
      monthNum: number;
      yearNum: number;
      Receitas: number;
      Despesas: number;
    }
    const months: MonthlyComparison[] = [];
    const now = new Date();

    for (let i = pointsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        monthNum: d.getMonth(),
        yearNum: d.getFullYear(),
        Receitas: 0,
        Despesas: 0
      });
    }

    // Accumulate filtered transactions into monthly slots
    filteredTransactions.forEach(t => {
      const tDate = new Date(t.data);
      const tMonth = tDate.getUTCMonth();
      const tYear = tDate.getUTCFullYear();

      const slot = months.find(x => x.monthNum === tMonth && x.yearNum === tYear);
      if (slot) {
        if (t.tipo === 'receita') {
          slot.Receitas += Number(t.valor);
        } else {
          slot.Despesas += Number(t.valor);
        }
      }
    });

    return months;
  }, [filteredTransactions, reportTimeframe]);

  // ----------------------------------------------------
  // TOTAL EXPENSES BY CATEGORY
  // ----------------------------------------------------
  const expensesBreakdown = useMemo(() => {
    const map = new Map<string | null, { spent: number; txCount: number }>();
    
    filteredTransactions
      .filter(t => t.tipo === 'despesa')
      .forEach(t => {
        const catId = t.categoria_id || null;
        const current = map.get(catId) || { spent: 0, txCount: 0 };
        map.set(catId, {
          spent: current.spent + Number(t.valor),
          txCount: current.txCount + 1
        });
      });
      
    const result: Array<{ id: string; nome: string; cor: string; icone: string; orçamento_mensal: number; spent: number; txCount: number }> = [];
    
    map.forEach((data, catId) => {
      if (catId) {
        const cat = categories.find(c => c.id === catId);
        if (cat) {
          result.push({
            id: cat.id,
            nome: cat.nome,
            cor: cat.cor,
            icone: cat.icone || 'circle',
            orçamento_mensal: cat.orçamento_mensal,
            spent: data.spent,
            txCount: data.txCount
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
        spent: data.spent,
        txCount: data.txCount
      });
    });
    
    return result.sort((a, b) => b.spent - a.spent);
  }, [filteredTransactions, categories]);

  const breakdownDataWithPercentage = useMemo(() => {
    const totalSpentInBreakdown = expensesBreakdown.reduce((sum, c) => sum + c.spent, 0);
    return expensesBreakdown.map(c => ({
      ...c,
      percentage: totalSpentInBreakdown > 0 ? (c.spent / totalSpentInBreakdown) * 100 : 0
    }));
  }, [expensesBreakdown]);

  // Pie chart data
  const pieChartData = useMemo(() => {
    return breakdownDataWithPercentage.map(c => ({
      name: c.nome,
      value: Math.round(c.spent),
      color: c.cor
    }));
  }, [breakdownDataWithPercentage]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight font-serif">Relatórios Analíticos</h2>
          <p className="text-xs text-muted-foreground font-serif">Estatísticas, taxas de poupança e demonstrativo de fluxos</p>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel 
        categories={categories}
        onFilterChange={setActiveFilters}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Revenues */}
        <div className="bg-card p-5 flex flex-col justify-between h-28 relative overflow-hidden premium-card">
          <div className="absolute right-4 top-4 w-9 h-9 rounded bg-success/10 text-success flex items-center justify-center border border-border/20">
            <ArrowUpRight size={18} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold font-serif">Total Recebido</span>
            <p className="text-2xl font-bold text-foreground mt-1 font-mono-retro">
              {formatBRL(totalRevenues)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold font-serif">Volume filtrado de receitas</span>
        </div>

        {/* Total Expenses */}
        <div className="bg-card p-5 flex flex-col justify-between h-28 relative overflow-hidden premium-card">
          <div className="absolute right-4 top-4 w-9 h-9 rounded bg-danger/10 text-danger flex items-center justify-center border border-border/20">
            <ArrowDownRight size={18} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold font-serif">Total Gasto</span>
            <p className="text-2xl font-bold text-foreground mt-1 font-mono-retro">
              {formatBRL(totalExpenses)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold font-serif">Volume filtrado de despesas</span>
        </div>

        {/* Cash Flow */}
        <div className="bg-card p-5 flex flex-col justify-between h-28 relative overflow-hidden premium-card">
          <div className="absolute right-4 top-4 w-9 h-9 rounded bg-primary/10 text-primary flex items-center justify-center border border-border/20">
            <DollarSign size={18} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold font-serif">Sobras Acumuladas</span>
            <p className={`text-2xl font-bold mt-1 font-mono-retro ${netSavings >= 0 ? 'text-foreground' : 'text-danger'}`}>
              {formatBRL(netSavings)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold font-serif">Saldo líquido do filtro</span>
        </div>

        {/* Savings Rate */}
        <div className="bg-card p-5 flex flex-col justify-between h-28 relative overflow-hidden premium-card">
          <div className="absolute right-4 top-4 w-9 h-9 rounded bg-accent/10 text-accent flex items-center justify-center border border-border/20">
            <Percent size={18} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold font-serif">Taxa de Poupança</span>
            <p className="text-2xl font-bold text-foreground mt-1 font-mono-retro">
              {savingsRate.toFixed(1)}%
            </p>
          </div>
          <span className={`text-[10px] font-bold font-serif ${savingsRate >= 20 ? 'text-success' : 'text-amber-500'}`}>
            {savingsRate >= 20 ? 'Excelente taxa poupada' : 'Tente guardar mais de 20%'}
          </span>
        </div>
      </div>

      {/* Monthly Bar Comparison Graph */}
      <div className="bg-card p-6 premium-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h3 className="font-bold text-base text-foreground font-serif">Entradas vs Saídas Mensais</h3>
            <p className="text-xs text-muted-foreground font-serif">Comparativo de fluxo de caixa por competência de mês</p>
          </div>
          
          {/* Timeframe selector */}
          <div className="flex bg-muted p-1 rounded-lg border-2 border-border w-full sm:w-auto">
            {(['6M', '1A'] as const).map(timeframe => (
              <button
                key={timeframe}
                onClick={() => setReportTimeframe(timeframe)}
                className={`flex-1 sm:flex-initial py-1 px-3 text-xs font-bold transition-all ${
                  reportTimeframe === timeframe
                    ? 'bg-card text-foreground border-2 border-border shadow-[2px_2px_0px_0px_var(--border)] -translate-x-[1px] -translate-y-[1px] rounded'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {timeframe === '6M' ? '6 Meses' : '1 Ano'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[280px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
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
                  itemStyle={{ fontSize: '12px', color: 'var(--foreground)', fontWeight: 'bold' }}
                  labelStyle={{ color: 'var(--muted-foreground)', fontWeight: 'bold' }}
                  formatter={(val: any) => [formatBRL(Number(val))]}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Receitas" fill="#10B981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Despesas" fill="#F43F5E" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full bg-muted/10 animate-pulse rounded-lg" />
          )}
        </div>
      </div>

      {/* Breakdown grids */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left: Category share donut chart (2 cols) */}
        <div className="lg:col-span-2 bg-card p-6 premium-card space-y-6">
          <div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 font-serif">
              <PieIcon size={16} className="text-primary" />
              Distribuição Histórica
            </h3>
            <p className="text-xs text-muted-foreground font-serif">Divisão total das suas despesas por categoria</p>
          </div>

          <div className="h-[200px] flex items-center justify-center relative">
            {mounted && pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
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
                    itemStyle={{ color: 'var(--foreground)', fontSize: '11px', fontWeight: 'bold' }}
                    labelStyle={{ color: 'var(--muted-foreground)', fontWeight: 'bold' }}
                    formatter={(val: any) => [formatBRL(Number(val)), 'Gasto total']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-muted/20 animate-pulse" />
            )}
            {pieChartData.length === 0 && (
              <p className="text-xs text-muted-foreground font-bold font-serif">Sem despesas registradas</p>
            )}
          </div>
        </div>

        {/* Right: Category list breakdown analytics (3 cols) */}
        <div className="lg:col-span-3 bg-card p-5 premium-card space-y-4 overflow-hidden">
          <h3 className="font-bold text-sm text-foreground font-serif">Detalhamento dos Gastos</h3>
          
          <div className="overflow-x-auto">
            <table className="retro-table w-full text-left">
              <thead>
                <tr>
                  <th className="py-2.5 px-3 font-serif">Categoria</th>
                  <th className="py-2.5 px-3 text-center font-serif">Transações</th>
                  <th className="py-2.5 px-3 text-right font-serif font-mono-retro">Volume</th>
                  <th className="py-2.5 px-3 text-right font-serif font-mono-retro">Participação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 text-foreground/90">
                {breakdownDataWithPercentage.length > 0 ? (
                  breakdownDataWithPercentage.map(cat => (
                    <tr key={cat.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded shrink-0 border border-border" style={{ backgroundColor: cat.cor }} />
                          <span className="font-bold">{cat.nome}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-muted-foreground font-mono-retro">
                        {cat.txCount}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-retro">
                        {formatBRL(cat.spent)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-retro text-primary font-bold">
                        {cat.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground font-serif">
                      Nenhuma despesa para exibir detalhes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
