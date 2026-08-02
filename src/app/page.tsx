'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useFinance } from '@/context/finance-context';
import { InvestmentSliderModal } from '@/components/investment-slider-modal';
import { parseCurrencyInput } from '@/lib/currency-utils';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank, 
  Plus, 
  X, 
  SlidersHorizontal,
  ArrowUpDown,
  Target,
  BarChart3,
  Sparkles,
  ShieldCheck,
  Building2,
  ShoppingBag,
  Eye,
  EyeOff,
  Pencil,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function DashboardPage() {
  const { 
    user,
    transactions, 
    categories, 
    investments, 
    investmentMovements,
    selectedMonth,
    emergencyReserve,
    emergencyGoal,
    monthlyIncome,
    addInvestment,
    editInvestment,
    deleteInvestment,
    addInvestmentMovement,
    addTransaction
  } = useFinance();

  const [mounted, setMounted] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const [isSliderOpen, setIsSliderOpen] = useState(false);

  // Selected Balance Filter for Hero Card
  type BalanceType = 'patrimonio' | 'liquidez' | 'investimentos' | 'reserva' | 'saldo_mes';
  const [selectedBalanceType, setSelectedBalanceType] = useState<BalanceType>('patrimonio');

  // Modal States for Liquidez/Bens
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalTipo, setModalTipo] = useState<'liquidez' | 'bens' | 'divida'>('liquidez');
  const [modalId, setModalId] = useState<string>('');
  const [modalName, setModalName] = useState<string>('');
  const [modalValue, setModalValue] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatBRL = (val: number) => {
    if (!showValues) return 'R$ •••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // ----------------------------------------------------
  // METRICS CALCULATIONS
  // ----------------------------------------------------
  const isCreatedInOrBefore = (inv: any, monthStr: string) => {
    const dateStr = inv.created_at || inv.data_atualização;
    if (!dateStr) return true;
    return dateStr.substring(0, 7) <= monthStr;
  };

  const getValueAtMonth = (invId: string) => {
    const movementsOfInv = investmentMovements.filter(m => m.investment_id === invId);
    if (movementsOfInv.length === 0) {
      const inv = investments.find(i => i.id === invId);
      if (inv && isCreatedInOrBefore(inv, selectedMonth)) {
        return Number(inv.preço_atual) * Number(inv.quantidade);
      }
      return 0;
    }
    const movementsUpToMonth = movementsOfInv.filter(m => m.data.substring(0, 7) <= selectedMonth);
    const totalAportes = movementsUpToMonth.filter(m => m.tipo === 'aporte').reduce((sum, m) => sum + Number(m.valor), 0);
    const totalResgates = movementsUpToMonth.filter(m => m.tipo === 'resgate').reduce((sum, m) => sum + Number(m.valor), 0);
    return totalAportes - totalResgates;
  };

  const getQtyAtMonth = (invId: string) => {
    const movementsOfInv = investmentMovements.filter(m => m.investment_id === invId);
    if (movementsOfInv.length === 0) {
      const inv = investments.find(i => i.id === invId);
      if (inv && isCreatedInOrBefore(inv, selectedMonth)) {
        return Number(inv.quantidade);
      }
      return 0;
    }
    const movementsUpToMonth = movementsOfInv.filter(m => m.data.substring(0, 7) <= selectedMonth);
    const qtyAportes = movementsUpToMonth.filter(m => m.tipo === 'aporte').reduce((sum, m) => sum + Number(m.quantidade), 0);
    const qtyResgates = movementsUpToMonth.filter(m => m.tipo === 'resgate').reduce((sum, m) => sum + Number(m.quantidade), 0);
    return Math.max(0, qtyAportes - qtyResgates);
  };

  const activeItemsAtMonth = useMemo(() => {
    return investments.map(inv => {
      let value = 0;
      if (['bens', 'divida'].includes(inv.tipo)) {
        value = getValueAtMonth(inv.id);
      } else if (['ação', 'fii', 'renda_fixa', 'cripto'].includes(inv.tipo)) {
        const qty = getQtyAtMonth(inv.id);
        value = qty * Number(inv.preço_atual);
      }
      return { ...inv, valor_no_mes: value };
    }).filter(item => {
      const createdBefore = isCreatedInOrBefore(item, selectedMonth);
      if (!createdBefore) return false;
      if (['bens', 'divida'].includes(item.tipo)) return item.valor_no_mes !== 0;
      return ['ação', 'fii', 'renda_fixa', 'cripto'].includes(item.tipo) && getQtyAtMonth(item.id) > 0;
    });
  }, [investments, investmentMovements, selectedMonth]);

  const liquidezTotal = useMemo(() => {
    const transactionsUpToMonth = transactions.filter(t => t.data && t.data.substring(0, 7) <= selectedMonth);
    const totalRevenues = transactionsUpToMonth
      .filter(t => t.tipo === 'receita')
      .reduce((sum, t) => sum + Number(t.valor), 0);
    const totalExpenses = transactionsUpToMonth
      .filter(t => t.tipo === 'despesa')
      .reduce((sum, t) => sum + Number(t.valor), 0);
    return totalRevenues - totalExpenses;
  }, [transactions, selectedMonth]);

  const investimentosTotal = useMemo(() => {
    return activeItemsAtMonth.filter(item => ['ação', 'fii', 'renda_fixa', 'cripto'].includes(item.tipo)).reduce((sum, item) => sum + item.valor_no_mes, 0);
  }, [activeItemsAtMonth]);

  const patrimonioTotal = useMemo(() => liquidezTotal + investimentosTotal, [liquidezTotal, investimentosTotal]);

  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => t.data && t.data.substring(0, 7) === selectedMonth);
  }, [transactions, selectedMonth]);

  const receitasMesTotal = useMemo(() => {
    return monthlyTransactions.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + Number(t.valor), 0);
  }, [monthlyTransactions]);

  const despesasMesTotal = useMemo(() => {
    return monthlyTransactions.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + Number(t.valor), 0);
  }, [monthlyTransactions]);

  const saldoLiquidoMes = useMemo(() => receitasMesTotal - despesasMesTotal, [receitasMesTotal, despesasMesTotal]);

  // ----------------------------------------------------
  // EXPENSES PIE CHART DATA (Despesas por Categoria)
  // ----------------------------------------------------
  const expensesPieData = useMemo(() => {
    const despesas = monthlyTransactions.filter(t => t.tipo === 'despesa');
    const grouped = new Map<string, { id: string; name: string; value: number; color: string }>();

    const defaultColors = [
      '#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'
    ];

    despesas.forEach((t, idx) => {
      const cat = categories.find(c => c.id === t.categoria_id);
      const catName = cat?.nome || 'Outros';
      const catColor = cat?.cor || defaultColors[idx % defaultColors.length];

      const existing = grouped.get(catName);
      if (existing) {
        existing.value += Number(t.valor);
      } else {
        grouped.set(catName, {
          id: cat?.id || `cat-${idx}`,
          name: catName,
          value: Number(t.valor),
          color: catColor
        });
      }
    });

    const list = Array.from(grouped.values());
    const total = list.reduce((sum, item) => sum + item.value, 0);

    return list.map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
    })).sort((a, b) => b.value - a.value);
  }, [monthlyTransactions, categories]);

  // Active Balance Display Map
  const activeBalanceDisplay = useMemo(() => {
    switch (selectedBalanceType) {
      case 'patrimonio':
        return { label: 'PATRIMÔNIO TOTAL', value: patrimonioTotal, subtitle: 'Soma de Liquidez + Investimentos' };
      case 'liquidez':
        return { label: 'SALDO EM CONTA (LIQUIDEZ)', value: liquidezTotal, subtitle: 'Dinheiro disponível para uso imediato' };
      case 'investimentos':
        return { label: 'TOTAL INVESTIDO', value: investimentosTotal, subtitle: 'Ações, FIIs e Renda Fixa' };
      case 'reserva':
        return { label: 'RESERVA DE EMERGÊNCIA', value: emergencyReserve, subtitle: `Meta: ${formatBRL(emergencyGoal)}` };
      case 'saldo_mes':
        return { label: 'SALDO LÍQUIDO DO MÊS', value: saldoLiquidoMes, subtitle: 'Entradas menos Saídas do mês' };
    }
  }, [selectedBalanceType, patrimonioTotal, liquidezTotal, investimentosTotal, emergencyReserve, emergencyGoal, saldoLiquidoMes, showValues]);

  const handleOpenAdd = (tipo: 'liquidez' | 'bens' | 'divida') => {
    setModalMode('add');
    setModalTipo(tipo);
    setModalName('');
    setModalValue('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setModalMode('edit');
    setModalTipo(item.tipo);
    setModalId(item.id);
    setModalName(item.ticker);
    setModalValue(String(item.valor_no_mes));
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseCurrencyInput(modalValue);
    if (isNaN(val)) return;

    try {
      if (modalTipo === 'liquidez') {
        const diff = val - liquidezTotal;
        if (diff !== 0) {
          await addTransaction({
            tipo: diff > 0 ? 'receita' : 'despesa',
            valor: Math.abs(diff),
            descrição: 'Ajuste de Saldo',
            categoria_id: null,
            data: new Date().toISOString().split('T')[0],
            recorrente: false
          });
        }
      } else {
        if (modalMode === 'add') {
          await addInvestment({
            ticker: modalName.trim() || (modalTipo === 'bens' ? 'Bem' : 'Dívida'),
            tipo: modalTipo,
            quantidade: 1,
            preço_medio: val,
            preço_atual: val,
            data_atualização: new Date().toISOString()
          });
        } else {
          await editInvestment(modalId, {
            ticker: modalName.trim(),
            preço_atual: val,
            data_atualização: new Date().toISOString()
          });
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar ajuste de saldo.');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* 1. HEADER WITH EYE TOGGLE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-zinc-500 font-medium">Olá, {user?.name || user?.email?.split('@')[0] || 'Contato'}</span>
          <div className="flex items-center gap-3 mt-0.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Visão geral</h1>
            <button
              onClick={() => setShowValues(!showValues)}
              className="p-1.5 rounded-full text-zinc-400 hover:text-foreground hover:bg-muted/50 transition-colors"
              title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
            >
              {showValues ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsSliderOpen(true)}
          className="shiny-btn py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm"
        >
          <Sparkles size={15} />
          <span>Simular Aporte</span>
        </button>
      </div>

      {/* 2. HERO CARD WITH BALANCE SELECTOR */}
      <motion.div 
        whileHover={{ scale: 1.002 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2D7D46] via-[#236B39] to-[#1B522C] text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/10 space-y-6"
      >
        {/* Ambient Glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        {/* Balance Type Selector Pills */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          {[
            { id: 'patrimonio', name: 'Patrimônio Total' },
            { id: 'liquidez', name: 'Saldo em Conta' },
            { id: 'investimentos', name: 'Investimentos' },
            { id: 'reserva', name: 'Reserva' },
            { id: 'saldo_mes', name: 'Saldo do Mês' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedBalanceType(item.id as BalanceType)}
              className={`py-1.5 px-3.5 rounded-full text-xs font-bold transition-all ${
                selectedBalanceType === item.id
                  ? 'bg-white text-[#236B39] shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white/90'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Active Balance Display */}
        <div className="flex justify-between items-start relative z-10">
          <div>
            <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-widest block">
              {activeBalanceDisplay.label}
            </span>
            <motion.h2 
              key={selectedBalanceType + showValues}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 text-white"
            >
              {formatBRL(activeBalanceDisplay.value)}
            </motion.h2>
            <p className="text-xs text-emerald-100/90 mt-1 font-medium">
              {activeBalanceDisplay.subtitle}
            </p>
          </div>

          <button
            onClick={() => {
              setModalMode('edit');
              setModalTipo('liquidez');
              setModalId('');
              setModalName('Saldo em Conta');
              setModalValue(String(liquidezTotal));
              setIsModalOpen(true);
            }}
            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25 transition-all shadow-sm"
            title="Ajustar Saldo"
          >
            <Pencil size={18} />
          </button>
        </div>
      </motion.div>

      {/* 3. ACESSO RÁPIDO GRID (CARDS MENORES) */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-base text-foreground tracking-tight">Acesso rápido</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          {/* Orçamento */}
          <Link href="/transacoes">
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-card border border-border/15 rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-emerald-500/30 flex flex-col items-center justify-center text-center gap-3 transition-all group h-full"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#EAF5ED] text-[#2D7D46] flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowUpDown size={24} />
              </div>
              <span className="font-extrabold text-xs text-foreground group-hover:text-[#2D7D46] transition-colors">
                Orçamento
              </span>
            </motion.div>
          </Link>

          {/* Investimentos */}
          <Link href="/investimentos">
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-card border border-border/15 rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-emerald-500/30 flex flex-col items-center justify-center text-center gap-3 transition-all group h-full"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#EAF5ED] text-[#2D7D46] flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
              </div>
              <span className="font-extrabold text-xs text-foreground group-hover:text-[#2D7D46] transition-colors">
                Investimentos
              </span>
            </motion.div>
          </Link>

          {/* Reserva de emergência */}
          <Link href="/reserva">
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-card border border-border/15 rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-emerald-500/30 flex flex-col items-center justify-center text-center gap-3 transition-all group h-full"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#EAF5ED] text-[#2D7D46] flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <span className="font-extrabold text-xs text-foreground group-hover:text-[#2D7D46] transition-colors">
                Reserva de emergência
              </span>
            </motion.div>
          </Link>

          {/* Metas */}
          <Link href="/metas">
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-card border border-border/15 rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-emerald-500/30 flex flex-col items-center justify-center text-center gap-3 transition-all group h-full"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#EAF5ED] text-[#2D7D46] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target size={24} />
              </div>
              <span className="font-extrabold text-xs text-foreground group-hover:text-[#2D7D46] transition-colors">
                Metas
              </span>
            </motion.div>
          </Link>

        </div>
      </div>

      {/* 4. SUMMARY ROW: MONTHLY METRICS HIGHLIGHTS */}
      <div className="space-y-4 pt-2">
        <h3 className="font-extrabold text-base text-foreground tracking-tight">Resumo do Mês Selecionado</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Receitas Card */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-card border border-border/15 rounded-3xl p-5 shadow-xs flex items-center justify-between"
          >
            <div>
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Entradas / Receitas</span>
              <h4 className="text-xl font-extrabold text-emerald-600 tracking-tight mt-1">
                {formatBRL(receitasMesTotal)}
              </h4>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight size={22} />
            </div>
          </motion.div>

          {/* Despesas Card */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-card border border-border/15 rounded-3xl p-5 shadow-xs flex items-center justify-between"
          >
            <div>
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Saídas / Despesas</span>
              <h4 className="text-xl font-extrabold text-rose-600 tracking-tight mt-1">
                {formatBRL(despesasMesTotal)}
              </h4>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight size={22} />
            </div>
          </motion.div>

          {/* Saldo Líquido Card */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-card border border-border/15 rounded-3xl p-5 shadow-xs flex items-center justify-between"
          >
            <div>
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Resultado Líquido</span>
              <h4 className={`text-xl font-extrabold tracking-tight mt-1 ${saldoLiquidoMes >= 0 ? 'text-[#2D7D46]' : 'text-rose-600'}`}>
                {formatBRL(saldoLiquidoMes)}
              </h4>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#EAF5ED] text-[#2D7D46] flex items-center justify-center">
              <Wallet size={22} />
            </div>
          </motion.div>

        </div>
      </div>

      {/* 5. EXPENSES PIE CHART SECTION (GRÁFICO DE PIZZA DE GASTOS) */}
      <div className="bg-card border border-border/15 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-base text-foreground tracking-tight flex items-center gap-2">
              <PieChartIcon size={20} className="text-rose-500" />
              <span>Distribuição de Gastos do Mês</span>
            </h3>
            <p className="text-xs text-muted-foreground">Detalhamento visual de despesas por categoria</p>
          </div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
            Total: {formatBRL(despesasMesTotal)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Pie Chart Container */}
          <div className="md:col-span-6 h-[260px] w-full relative flex items-center justify-center">
            {mounted ? (
              expensesPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {expensesPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        color: 'var(--foreground)'
                      }}
                      formatter={(val: any) => [formatBRL(Number(val)), 'Gasto']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-muted-foreground font-semibold">
                  Nenhuma despesa registrada para este mês
                </div>
              )
            ) : (
              <div className="w-36 h-36 rounded-full border-8 border-muted border-t-rose-500 animate-spin" />
            )}
          </div>

          {/* Category Breakdown List */}
          <div className="md:col-span-6 space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {expensesPieData.length > 0 ? (
              expensesPieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/10 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-extrabold text-foreground">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-foreground">{formatBRL(item.value)}</span>
                    <span className="text-xs font-extrabold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg min-w-[42px] text-center">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground font-medium text-center py-8">
                As despesas do mês aparecerão aqui assim que você lançar gastos.
              </p>
            )}
          </div>

        </div>
      </div>

      {/* 6. INVESTMENT SLIDER MODAL */}
      <InvestmentSliderModal isOpen={isSliderOpen} onClose={() => setIsSliderOpen(false)} />

      {/* 7. BALANCE ADJUSTMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-border/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base text-foreground">
                {modalMode === 'add' ? 'Adicionar' : 'Ajustar'} {modalTipo === 'liquidez' ? 'Saldo em Conta' : modalTipo === 'bens' ? 'Bem / Ativo' : 'Dívida'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {modalTipo !== 'liquidez' && (
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Nome / Descrição
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={modalTipo === 'bens' ? 'Ex: Carro, Imóvel' : 'Ex: Empréstimo, Financiamento'}
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-muted/40 border border-border/30 text-foreground text-sm font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Valor (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={modalValue}
                    onChange={(e) => setModalValue(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/40 border border-border/30 text-foreground text-sm font-bold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-foreground text-xs font-bold transition-all hover:bg-muted/80"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2D7D46] hover:bg-[#236B39] text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
