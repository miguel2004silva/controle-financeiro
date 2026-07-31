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
  const { transactions, categories, selectedMonth } = useFinance();
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
    const [yearStr, monthStr] = selectedMonth.split('-');
    const anchorYear = Number(yearStr);
    const anchorMonth = Number(monthStr) - 1; // 0-indexed

    for (let i = pointsCount - 1; i >= 0; i--) {
      const d = new Date(anchorYear, anchorMonth - i, 1);
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
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">Relatórios Analíticos</h2>
          <p className="text-xs text-muted-foreground/70 mt-0.5">Estatísticas, taxas de poupança e demonstrativo de fluxos</p>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel 
        categories={categories}
        onFilterChange={setActiveFilters}
      />

      {/* Bento Grid Summary Cards */}
      <div className="bento-grid">
        {/* Total Revenues */}
        <div className="bento-card border border-border bg-card/90 flex flex-col justify-between select-none">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Total Recebido</span>
              <h3 className="text-2xl font-extrabold text-foreground tracking-tight mt-1">
                {formatBRL(totalRevenues)}
              </h3>
            </div>
            <span className="badge-emerald p-2 rounded-xl">
              <ArrowUpRight size={18} />
            </span>
          </div>
          <span className="text-xs text-muted-foreground/70 mt-3 pt-2 border-t border-border/15">Receitas filtradas</span>
        </div>

        {/* Total Expenses */}
        <div className="bento-card border border-border bg-card/90 flex flex-col justify-between select-none">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Total Gasto</span>
              <h3 className="text-2xl font-extrabold text-foreground tracking-tight mt-1">
                {formatBRL(totalExpenses)}
              </h3>
            </div>
            <span className="badge-rose p-2 rounded-xl">
              <ArrowDownRight size={18} />
            </span>
          </div>
          <span className="text-xs text-muted-foreground/70 mt-3 pt-2 border-t border-border/15">Despesas filtradas</span>
        </div>

        {/* Cash Flow */}
        <div className="bento-card border border-border bg-card/90 flex flex-col justify-between select-none">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Sobras Acumuladas</span>
              <h3 className={`text-2xl font-extrabold tracking-tight mt-1 ${netSavings >= 0 ? 'text-foreground' : 'text-rose-500'}`}>
                {formatBRL(netSavings)}
              </h3>
            </div>
            <span className="badge-indigo p-2 rounded-xl">
              <DollarSign size={18} />
            </span>
          </div>
          <span className="text-xs text-muted-foreground/70 mt-3 pt-2 border-t border-border/15">Saldo líquido no período</span>
        </div>

        {/* Savings Rate */}
        <div className="bento-card border border-border bg-card/90 flex flex-col justify-between select-none">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Taxa de Poupança</span>
              <h3 className="text-2xl font-extrabold text-foreground tracking-tight mt-1">
                {savingsRate.toFixed(1)}%
              </h3>
            </div>
            <span className="badge-amber p-2 rounded-xl">
              <Percent size={18} />
            </span>
          </div>
          <span className={`text-[11px] font-bold mt-3 pt-2 border-t border-border/15 ${savingsRate >= 20 ? 'text-emerald-500' : 'text-amber-500'}`}>
            {savingsRate >= 20 ? 'Excelente taxa poupada' : 'Meta: poupar +20%'}
          </span>
        </div>
      </div>

      {/* Monthly Bar Comparison Graph */}
      <div className="bento-card border border-border bg-card/90 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h3 className="font-extrabold text-base text-foreground tracking-tight">Entradas vs Saídas Mensais</h3>
            <p className="text-xs text-muted-foreground/70 mt-0.5">Comparativo de fluxo de caixa por mês</p>
          </div>
          
          {/* Timeframe selector (UIverse pill) */}
          <div className="flex p-1 rounded-xl bg-muted/60 border border-border/15 w-full sm:w-auto select-none">
            {(['6M', '1A'] as const).map(timeframe => (
              <button
                key={timeframe}
                onClick={() => setReportTimeframe(timeframe)}
                className={`uiverse-pill ${
                  reportTimeframe === timeframe
                    ? 'uiverse-pill-active'
                    : 'uiverse-pill-inactive'
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
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="var(--muted-foreground)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `R$ ${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--foreground)',
                    fontFamily: 'Sora, sans-serif'
                  }}
                  itemStyle={{ fontSize: '12px', color: 'var(--foreground)', fontWeight: 'bold' }}
                  labelStyle={{ color: 'var(--muted-foreground)', fontWeight: 'bold' }}
                  formatter={(val: any) => [formatBRL(Number(val))]}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontFamily: 'Sora, sans-serif' }} />
                <Bar dataKey="Receitas" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="#E11D48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full bg-muted/20 animate-pulse rounded-2xl" />
          )}
        </div>
      </div>

      {/* Breakdown grids */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left: Category share donut chart (2 cols) */}
        <div className="lg:col-span-2 bento-card border border-border bg-card/90 p-6 space-y-6">
          <div>
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 tracking-tight">
              <PieIcon size={16} className="text-foreground" />
              Distribuição Histórica
            </h3>
            <p className="text-xs text-muted-foreground/70 mt-0.5">Divisão das despesas por categoria</p>
          </div>

          <div className="h-[200px] flex items-center justify-center relative">
            {mounted && pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
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
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--foreground)',
                      fontFamily: 'Sora, sans-serif'
                    }}
                    itemStyle={{ color: 'var(--foreground)', fontSize: '11px', fontWeight: 'bold' }}
                    labelStyle={{ color: 'var(--muted-foreground)', fontWeight: 'bold' }}
                    formatter={(val: any, name: any) => [formatBRL(Number(val)), name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-border/20 animate-pulse" />
            )}
            {pieChartData.length === 0 && (
              <p className="text-xs text-muted-foreground font-bold">Sem despesas registradas</p>
            )}
          </div>
        </div>

        {/* Right: Category list breakdown analytics (3 cols) */}
        <div className="lg:col-span-3 bento-card border border-border bg-card/90 p-0 overflow-hidden">
          <div className="p-5 border-b border-border/15">
            <h3 className="font-extrabold text-sm text-foreground tracking-tight">Detalhamento dos Gastos</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="shadcn-table w-full text-left">
              <thead>
                <tr>
                  <th className="py-3.5 px-4">Categoria</th>
                  <th className="py-3.5 px-4 text-center">Transações</th>
                  <th className="py-3.5 px-4 text-right">Volume</th>
                  <th className="py-3.5 px-4 text-right">Participação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/15 text-xs">
                {breakdownDataWithPercentage.length > 0 ? (
                  breakdownDataWithPercentage.map(cat => (
                    <tr key={cat.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.cor }} />
                          <span className="font-bold text-foreground">{cat.nome}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center text-muted-foreground font-medium">
                        {cat.txCount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-foreground">
                        {formatBRL(cat.spent)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-foreground">
                        {cat.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground font-medium">
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
