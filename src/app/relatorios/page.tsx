'use client';

import React, { useState, useEffect } from 'react';
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

export default function RelatoriosPage() {
  const { transactions, categories } = useFinance();
  const [mounted, setMounted] = useState(false);
  const [reportTimeframe, setReportTimeframe] = useState<'6M' | '1A'>('6M');

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
  // REPORT AGGREGATES
  // ----------------------------------------------------
  const totalRevenues = transactions
    .filter(t => t.tipo === 'receita')
    .reduce((sum, t) => sum + Number(t.valor), 0);

  const totalExpenses = transactions
    .filter(t => t.tipo === 'despesa')
    .reduce((sum, t) => sum + Number(t.valor), 0);

  const netSavings = totalRevenues - totalExpenses;
  const savingsRate = totalRevenues > 0 ? (netSavings / totalRevenues) * 100 : 0;

  // ----------------------------------------------------
  // REVENUES VS EXPENSES MONTHLY GROUPING
  // ----------------------------------------------------
  const getMonthlyComparisonData = () => {
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

    // Accumulate transactions into monthly slots
    transactions.forEach(t => {
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
  };

  const barChartData = getMonthlyComparisonData();

  // ----------------------------------------------------
  // TOTAL EXPENSES BY CATEGORY (All-time or filter)
  // ----------------------------------------------------
  const expensesBreakdown = categories.map(cat => {
    const spent = transactions
      .filter(t => t.tipo === 'despesa' && t.categoria_id === cat.id)
      .reduce((sum, t) => sum + Number(t.valor), 0);
    
    const txCount = transactions.filter(t => t.tipo === 'despesa' && t.categoria_id === cat.id).length;

    return {
      ...cat,
      spent,
      txCount
    };
  })
  .filter(c => c.spent > 0)
  .sort((a, b) => b.spent - a.spent);

  const totalSpentInBreakdown = expensesBreakdown.reduce((sum, c) => sum + c.spent, 0);

  const breakdownDataWithPercentage = expensesBreakdown.map(c => ({
    ...c,
    percentage: totalSpentInBreakdown > 0 ? (c.spent / totalSpentInBreakdown) * 100 : 0
  }));

  // Pie chart data
  const pieChartData = breakdownDataWithPercentage.map(c => ({
    name: c.nome,
    value: Math.round(c.spent),
    color: c.cor
  }));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Relatórios Analíticos</h2>
          <p className="text-xs text-muted-foreground">Estatísticas, taxas de poupança e demonstrativo de fluxos</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Revenues */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 flex flex-col justify-between h-28 relative overflow-hidden group">
          <div className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center">
            <ArrowUpRight size={18} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold">Total Recebido</span>
            <p className="text-2xl font-black text-white mt-1 font-mono">
              {formatBRL(totalRevenues)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">Toda a receita lançada</span>
        </div>

        {/* Total Expenses */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 flex flex-col justify-between h-28 relative overflow-hidden group">
          <div className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-danger/10 text-danger flex items-center justify-center">
            <ArrowDownRight size={18} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold">Total Gasto</span>
            <p className="text-2xl font-black text-white mt-1 font-mono">
              {formatBRL(totalExpenses)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">Toda a despesa lançada</span>
        </div>

        {/* Cash Flow */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 flex flex-col justify-between h-28 relative overflow-hidden group">
          <div className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <DollarSign size={18} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold">Sobras Acumuladas</span>
            <p className={`text-2xl font-black mt-1 font-mono ${netSavings >= 0 ? 'text-white' : 'text-danger'}`}>
              {formatBRL(netSavings)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">Saldo líquido disponível</span>
        </div>

        {/* Savings Rate */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 flex flex-col justify-between h-28 relative overflow-hidden group">
          <div className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <Percent size={18} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold">Taxa de Poupança</span>
            <p className="text-2xl font-black text-white mt-1 font-mono">
              {savingsRate.toFixed(1)}%
            </p>
          </div>
          <span className={`text-[10px] font-bold ${savingsRate >= 20 ? 'text-success' : 'text-amber-500'}`}>
            {savingsRate >= 20 ? 'Excelente taxa poupada' : 'Tente guardar mais de 20%'}
          </span>
        </div>
      </div>

      {/* Monthly Bar Comparison Graph */}
      <div className="bg-card border border-border/40 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h3 className="font-bold text-base text-slate-100">Entradas vs Saídas Mensais</h3>
            <p className="text-xs text-muted-foreground">Comparativo de fluxo de caixa por competência de mês</p>
          </div>
          
          {/* Timeframe selector */}
          <div className="flex bg-muted p-1 rounded-lg border border-border/30 w-full sm:w-auto">
            <button
              onClick={() => setReportTimeframe('6M')}
              className={`flex-1 sm:flex-initial py-1 px-3 text-xs font-semibold rounded transition-all ${
                reportTimeframe === '6M' ? 'bg-[#12151D] text-white shadow' : 'text-muted-foreground'
              }`}
            >
              6 Meses
            </button>
            <button
              onClick={() => setReportTimeframe('1A')}
              className={`flex-1 sm:flex-initial py-1 px-3 text-xs font-semibold rounded transition-all ${
                reportTimeframe === '1A' ? 'bg-[#12151D] text-white shadow' : 'text-muted-foreground'
              }`}
            >
              1 Ano
            </button>
          </div>
        </div>

        <div className="h-[280px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
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
                  itemStyle={{ fontSize: '12px', color: '#FFF' }}
                  formatter={(val: any) => [formatBRL(Number(val))]}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Receitas" fill="#10B981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Despesas" fill="#EF4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full bg-muted/10 animate-pulse rounded-xl" />
          )}
        </div>
      </div>

      {/* Breakdown grids */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left: Category share donut chart (2 cols) */}
        <div className="lg:col-span-2 bg-card border border-border/40 rounded-2xl p-5 space-y-6">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <PieIcon size={16} className="text-primary" />
              Distribuição Histórica
            </h3>
            <p className="text-xs text-muted-foreground">Divisão total das suas despesas por categoria</p>
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
                      backgroundColor: '#12151D',
                      border: '1px solid #1F2937',
                      borderRadius: '12px'
                    }}
                    itemStyle={{ color: '#F8FAFC', fontSize: '11px' }}
                    formatter={(val: any) => [formatBRL(Number(val)), 'Gasto total']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-muted/20 animate-pulse" />
            )}
            {pieChartData.length === 0 && (
              <p className="text-xs text-muted-foreground font-semibold">Sem despesas registradas</p>
            )}
          </div>
        </div>

        {/* Right: Category list breakdown analytics (3 cols) */}
        <div className="lg:col-span-3 bg-card border border-border/40 rounded-2xl p-5 space-y-4 shadow-sm overflow-hidden">
          <h3 className="font-bold text-sm text-slate-100">Detalhamento dos Gastos</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20 text-[9px] uppercase tracking-wider text-muted-foreground font-black">
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-center">Transações</th>
                  <th className="py-2.5 px-3 text-right font-mono">Volume</th>
                  <th className="py-2.5 px-3 text-right font-mono">Participação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 text-slate-200">
                {breakdownDataWithPercentage.length > 0 ? (
                  breakdownDataWithPercentage.map(cat => (
                    <tr key={cat.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.cor }} />
                          <span className="font-bold">{cat.nome}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-muted-foreground font-bold">
                        {cat.txCount}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold">
                        {formatBRL(cat.spent)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-primary">
                        {cat.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
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
