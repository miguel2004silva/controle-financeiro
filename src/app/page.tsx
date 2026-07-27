'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '@/context/finance-context';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank, 
  AlertCircle, 
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Wallet,
  Home,
  Plus,
  X
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

const DONUT_COLORS = [
  '#16A34A', // Green
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#84CC16', // Lime
  '#3B82F6', // Blue
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#EF4444', // Red
  '#06B6D4'  // Cyan
];

export default function DashboardPage() {
  const { 
    transactions, 
    categories, 
    investments, 
    investmentMovements,
    selectedMonth,
    addInvestment,
    editInvestment,
    deleteInvestment,
    addInvestmentMovement
  } = useFinance();

  const [chartRange, setChartRange] = useState<'7D' | '1M' | '6M' | '1A'>('6M');
  const [mounted, setMounted] = useState(false);
  const [activeSlice, setActiveSlice] = useState<{ name: string; percentage: number; value: number; color: string } | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalTipo, setModalTipo] = useState<'liquidez' | 'bens' | 'divida'>('liquidez');
  const [modalId, setModalId] = useState<string>('');
  const [modalName, setModalName] = useState<string>('');
  const [modalValue, setModalValue] = useState<string>('');

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

  // Safe End of Month helper
  const getEndOfMonthDate = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return new Date(`${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59Z`);
  };

  const endOfSelectedMonth = useMemo(() => {
    return getEndOfMonthDate(selectedMonth);
  }, [selectedMonth]);

  // ----------------------------------------------------
  // CALCULATING MONTHLY METRICS REACTIVELY
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
    const movementsUpToMonth = movementsOfInv.filter(m => 
      m.data.substring(0, 7) <= selectedMonth
    );
    const totalAportes = movementsUpToMonth
      .filter(m => m.tipo === 'aporte')
      .reduce((sum, m) => sum + Number(m.valor), 0);
    const totalResgates = movementsUpToMonth
      .filter(m => m.tipo === 'resgate')
      .reduce((sum, m) => sum + Number(m.valor), 0);
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
    const movementsUpToMonth = movementsOfInv.filter(m => 
      m.data.substring(0, 7) <= selectedMonth
    );
    const qtyAportes = movementsUpToMonth
      .filter(m => m.tipo === 'aporte')
      .reduce((sum, m) => sum + Number(m.quantidade), 0);
    const qtyResgates = movementsUpToMonth
      .filter(m => m.tipo === 'resgate')
      .reduce((sum, m) => sum + Number(m.quantidade), 0);
    return Math.max(0, qtyAportes - qtyResgates);
  };

  // Compile active items at selected month
  const activeItemsAtMonth = useMemo(() => {
    return investments.map(inv => {
      let value = 0;
      if (['liquidez', 'bens', 'divida'].includes(inv.tipo)) {
        value = getValueAtMonth(inv.id);
      } else {
        const qty = getQtyAtMonth(inv.id);
        value = qty * Number(inv.preço_atual);
      }
      return {
        ...inv,
        valor_no_mes: value
      };
    }).filter(item => {
      const createdBefore = isCreatedInOrBefore(item, selectedMonth);
      if (!createdBefore) return false;

      if (['liquidez', 'bens', 'divida'].includes(item.tipo)) {
        return item.valor_no_mes !== 0;
      }
      const qty = getQtyAtMonth(item.id);
      return qty > 0;
    });
  }, [investments, investmentMovements, selectedMonth]);

  // Aggregate Category Sums
  const liquidezTotal = useMemo(() => {
    return activeItemsAtMonth
      .filter(item => item.tipo === 'liquidez')
      .reduce((sum, item) => sum + item.valor_no_mes, 0);
  }, [activeItemsAtMonth]);

  const bensTotal = useMemo(() => {
    return activeItemsAtMonth
      .filter(item => item.tipo === 'bens')
      .reduce((sum, item) => sum + item.valor_no_mes, 0);
  }, [activeItemsAtMonth]);

  const investimentosTotal = useMemo(() => {
    return activeItemsAtMonth
      .filter(item => ['ação', 'fii', 'renda_fixa', 'cripto'].includes(item.tipo))
      .reduce((sum, item) => sum + item.valor_no_mes, 0);
  }, [activeItemsAtMonth]);

  const dividasTotal = useMemo(() => {
    return activeItemsAtMonth
      .filter(item => item.tipo === 'divida')
      .reduce((sum, item) => sum + item.valor_no_mes, 0);
  }, [activeItemsAtMonth]);

  const patrimonioTotal = useMemo(() => {
    return (liquidezTotal + bensTotal + investimentosTotal) - dividasTotal;
  }, [liquidezTotal, bensTotal, investimentosTotal, dividasTotal]);

  // ----------------------------------------------------
  // DONUT CHART: Composition of Wealth (Ativos)
  // ----------------------------------------------------
  const pieData = useMemo(() => {
    const positiveItems = activeItemsAtMonth.filter(item => item.tipo !== 'divida' && item.valor_no_mes > 0);
    
    // Group items by normalized ticker
    const grouped = new Map<string, { id: string; name: string; value: number; colorIdx: number }>();
    let colorCount = 0;

    positiveItems.forEach(item => {
      const normKey = item.ticker.trim().toUpperCase();
      let displayName = item.ticker.trim();
      
      // Group variants of Mercado Libre/Livre/Live
      if (normKey === 'MERCADO LIVE' || normKey === 'MERCADO LIVRE' || normKey.includes('MERCADO LI')) {
        displayName = 'CDB Mercado Libre';
      }

      const key = displayName.toUpperCase();
      const existing = grouped.get(key);
      if (existing) {
        existing.value += item.valor_no_mes;
      } else {
        grouped.set(key, {
          id: item.id,
          name: displayName,
          value: item.valor_no_mes,
          colorIdx: colorCount++
        });
      }
    });

    const list = Array.from(grouped.values());
    const total = list.reduce((sum, i) => sum + i.value, 0);
    
    // Calculate raw percentage and initial rounded values
    let roundedList = list.map(item => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0;
      return {
        id: item.id,
        name: item.name,
        value: item.value,
        percentage: percentage,
        roundedPercentage: Math.round(percentage),
        color: DONUT_COLORS[item.colorIdx % DONUT_COLORS.length]
      };
    });

    // Sum rounded percentages
    const roundedSum = roundedList.reduce((sum, item) => sum + item.roundedPercentage, 0);
    const diff = 100 - roundedSum;

    // Adjust rounding discrepancy at largest item
    if (diff !== 0 && roundedList.length > 0) {
      let maxIdx = 0;
      let maxVal = -1;
      for (let i = 0; i < roundedList.length; i++) {
        if (roundedList[i].value > maxVal) {
          maxVal = roundedList[i].value;
          maxIdx = i;
        }
      }
      roundedList[maxIdx].roundedPercentage += diff;
    }

    return roundedList;
  }, [activeItemsAtMonth]);

  const totalAtivos = useMemo(() => {
    return pieData.reduce((sum, item) => sum + item.value, 0);
  }, [pieData]);

  // ----------------------------------------------------
  // REAL HISTORICAL EVOLUTION DATA
  // ----------------------------------------------------
  const getPatrimonioAtDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const monthStr = dateStr.substring(0, 7);
    let total = 0;

    investments.forEach(inv => {
      const totalMovsOfInv = investmentMovements.filter(m => m.investment_id === inv.id);
      let val = 0;
      
      if (totalMovsOfInv.length === 0) {
        if (isCreatedInOrBefore(inv, monthStr)) {
          val = Number(inv.preço_atual) * Number(inv.quantidade);
        }
      } else {
        const invMovs = investmentMovements.filter(m => m.investment_id === inv.id && m.data <= dateStr);
        const totalAportes = invMovs.filter(m => m.tipo === 'aporte').reduce((sum, m) => sum + Number(m.valor), 0);
        const totalResgates = invMovs.filter(m => m.tipo === 'resgate').reduce((sum, m) => sum + Number(m.valor), 0);
        val = totalAportes - totalResgates;
      }
      
      if (inv.tipo === 'divida') {
        total -= val;
      } else {
        total += val;
      }
    });
    return total;
  };

  const evolutionData = useMemo(() => {
    const pointsCount = chartRange === '7D' ? 7 : chartRange === '1M' ? 30 : chartRange === '6M' ? 6 : 12;
    const data = [];
    
    // Dynamic timeline anchor (anchored to today if viewing the current month)
    const today = new Date();
    const [selYear, selMonth] = selectedMonth.split('-').map(Number);
    const isCurrentMonth = today.getFullYear() === selYear && (today.getMonth() + 1) === selMonth;
    const anchor = isCurrentMonth ? today : new Date(endOfSelectedMonth);

    for (let i = pointsCount - 1; i >= 0; i--) {
      const d = new Date(anchor);
      if (chartRange === '7D' || chartRange === '1M') {
        d.setDate(anchor.getDate() - i);
      } else {
        d.setMonth(anchor.getMonth() - i);
      }

      // get end of that day/month
      const dEnd = new Date(d);
      if (chartRange === '7D' || chartRange === '1M') {
        dEnd.setHours(23, 59, 59, 999);
      } else {
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        dEnd.setDate(lastDay);
        dEnd.setHours(23, 59, 59, 999);
      }

      const val = getPatrimonioAtDate(dEnd);
      const label = chartRange === '7D' || chartRange === '1M'
        ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        : d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

      data.push({
        name: label,
        Patrimônio: Math.round(val)
      });
    }

    return data;
  }, [chartRange, selectedMonth, investments, investmentMovements, endOfSelectedMonth]);

  // ----------------------------------------------------
  // ADD & EDIT FORM ACTIONS
  // ----------------------------------------------------
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

  const handleDeleteItem = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item? Todos os movimentos históricos associados serão excluídos.')) {
      try {
        await deleteInvestment(id);
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir item.');
      }
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim()) {
      alert('Informe o nome do item.');
      return;
    }
    const valNum = Number(modalValue);
    if (isNaN(valNum) || valNum <= 0) {
      alert('Informe um valor válido maior que zero.');
      return;
    }

    try {
      const getNormalizedCompareKey = (name: string): string => {
        const key = name.trim().toUpperCase();
        if (key === 'MERCADO LIVE' || key === 'MERCADO LIVRE' || key.includes('MERCADO LI')) {
          return 'CDB MERCADO LIBRE';
        }
        return key;
      };

      if (modalMode === 'add') {
        const inputCompareKey = getNormalizedCompareKey(modalName);
        const existing = investments.find(inv => 
          getNormalizedCompareKey(inv.ticker) === inputCompareKey && 
          inv.tipo === modalTipo
        );

        let targetId = '';
        if (existing) {
          targetId = existing.id;
          // Update the current value of the existing asset
          const newPrice = Number(existing.preço_atual) + valNum;
          await editInvestment(targetId, {
            preço_atual: newPrice
          });
        } else {
          // Normalize the name before creating
          let finalTicker = modalName.trim();
          const normName = finalTicker.toUpperCase();
          if (normName === 'MERCADO LIVE' || normName === 'MERCADO LIVRE' || normName.includes('MERCADO LI')) {
            finalTicker = 'CDB Mercado Libre';
          }

          targetId = await addInvestment({
            ticker: finalTicker,
            tipo: modalTipo,
            quantidade: 1,
            preço_medio: valNum,
            preço_atual: valNum,
            data_atualização: new Date().toISOString()
          });
        }

        // Add movement
        await addInvestmentMovement({
          investment_id: targetId,
          tipo: 'aporte',
          valor: valNum,
          quantidade: 1,
          data: selectedMonth + '-01'
        });
      } else {
        // 1. Edit details
        await editInvestment(modalId, {
          ticker: modalName.trim(),
          preço_atual: valNum
        });

        // 2. Add correction movement
        const currentVal = getValueAtMonth(modalId);
        const diff = valNum - currentVal;
        if (diff !== 0) {
          await addInvestmentMovement({
            investment_id: modalId,
            tipo: diff > 0 ? 'aporte' : 'resgate',
            valor: Math.abs(diff),
            quantidade: 1,
            data: selectedMonth + '-15'
          });
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar item.');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* 1. GRID OF CARDS (Reativo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        
        {/* Card Destaque: Patrimônio Total */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between h-36 lg:col-span-1 shadow-sm dark:shadow-[0_8px_20px_rgba(0,0,0,0.3)] premium-card bg-gradient-to-br from-green-500/5 via-transparent to-transparent select-none">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest">Patrimônio Total</span>
            <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
              <DollarSign size={18} />
            </div>
          </div>
          <div>
            <p className={`text-2xl font-bold font-mono-retro leading-tight ${patrimonioTotal < 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
              {formatBRL(patrimonioTotal)}
            </p>
            <span className="text-[10px] text-muted-foreground font-semibold mt-1 block">Liquidez + Bens + Inv - Dívidas</span>
          </div>
        </div>

        {/* Card Liquidez */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between h-36 shadow-sm dark:shadow-[0_8px_20px_rgba(0,0,0,0.3)] premium-card select-none">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest">Liquidez</span>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Wallet size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono-retro leading-tight">
              {formatBRL(liquidezTotal)}
            </p>
            <span className="text-[10px] text-muted-foreground font-semibold mt-1 block">Saldo e Caixinhas</span>
          </div>
        </div>

        {/* Card Bens */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between h-36 shadow-sm dark:shadow-[0_8px_20px_rgba(0,0,0,0.3)] premium-card select-none">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest">Bens</span>
            <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <Home size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono-retro leading-tight">
              {formatBRL(bensTotal)}
            </p>
            <span className="text-[10px] text-muted-foreground font-semibold mt-1 block">Imóveis, Carros e Objetos</span>
          </div>
        </div>

        {/* Card Investimentos */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between h-36 shadow-sm dark:shadow-[0_8px_20px_rgba(0,0,0,0.3)] premium-card select-none">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest">Investimentos</span>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <PiggyBank size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono-retro leading-tight">
              {formatBRL(investimentosTotal)}
            </p>
            <span className="text-[10px] text-muted-foreground font-semibold mt-1 block">Ações, FIIs e Renda Fixa</span>
          </div>
        </div>

        {/* Card Dívidas */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between h-36 shadow-sm dark:shadow-[0_8px_20px_rgba(0,0,0,0.3)] premium-card select-none">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest">Dívidas</span>
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <TrendingDown size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-rose-500 font-mono-retro leading-tight">
              {formatBRL(dividasTotal)}
            </p>
            <span className="text-[10px] text-muted-foreground font-semibold mt-1 block">Financiamentos e Débitos</span>
          </div>
        </div>
      </div>

      {/* 2. CHARTS SECTION (REAL DATA) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Wealth Evolution Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-card p-6 border border-border rounded-2xl shadow-sm premium-card">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h3 className="font-bold text-base text-foreground">Evolução do Patrimônio</h3>
              <p className="text-xs text-muted-foreground">Evolução acumulada com base nas movimentações reais</p>
            </div>
            
            <div className="flex bg-muted p-1 rounded-xl w-full sm:w-auto">
              {(['7D', '1M', '6M', '1A'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setChartRange(range)}
                  className={`flex-1 sm:flex-initial py-1 px-3.5 text-xs font-semibold rounded-lg transition-all ${
                    chartRange === range
                      ? 'bg-white dark:bg-zinc-700 text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[260px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.06}/>
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0.00}/>
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
                      border: '1px solid var(--border)',
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
                    stroke="#22C55E" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorPatrimonio)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-muted/20 animate-pulse rounded-2xl" />
            )}
          </div>
        </div>

        {/* patrimonio composition donut (1 col) */}
        <div className="bg-card p-6 border border-border rounded-2xl shadow-sm premium-card flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-foreground">Composição de Ativos</h3>
            <p className="text-xs text-muted-foreground">Distribuição percentual dos seus bens e liquidez</p>
          </div>

          {/* Donut Chart with center label */}
          <div className="h-[180px] my-4 flex items-center justify-center relative">
            {mounted && pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, idx) => setActiveSlice(pieData[idx])}
                      onMouseLeave={() => setActiveSlice(null)}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer', outline: 'none' }} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center px-6">
                  {activeSlice ? (
                    <>
                      <span className="text-[9px] text-muted-foreground font-extrabold uppercase tracking-wider truncate w-24">
                        {activeSlice.name}
                      </span>
                      <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-none my-1">
                        {formatBRL(activeSlice.value)}
                      </span>
                      <span className="text-[10px] text-primary font-bold">
                        {activeSlice.roundedPercentage}%
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[9px] text-muted-foreground font-extrabold uppercase tracking-wider">
                        ATIVOS TOTAIS
                      </span>
                      <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-none my-1">
                        {formatBRL(totalAtivos)}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {pieData.length} {pieData.length === 1 ? 'item' : 'itens'}
                      </span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-muted/20 animate-pulse flex items-center justify-center">
                <span className="text-xs text-muted-foreground font-medium">Sem dados</span>
              </div>
            )}
          </div>

          {/* Dynamic legends below chart */}
          <div className="max-h-[100px] overflow-y-auto px-1 space-y-1.5 scrollbar-thin">
            {pieData.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground flex items-center gap-2 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold text-foreground/90 font-mono-retro">
                  {item.roundedPercentage}% <span className="text-[10px] text-muted-foreground/60 font-normal">({formatBRL(item.value)})</span>
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* 3. LISTS OF ITEMS BY SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LIQUIDEZ CONTAINER */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm premium-card flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Wallet size={16} className="text-blue-500" />
                Liquidez
              </h3>
              <button 
                onClick={() => handleOpenAdd('liquidez')}
                className="text-[10px] font-bold uppercase bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
              >
                <Plus size={10} /> Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {activeItemsAtMonth.filter(i => i.tipo === 'liquidez').length > 0 ? (
                activeItemsAtMonth.filter(i => i.tipo === 'liquidez').map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-muted dark:bg-zinc-800/40 rounded-xl border border-border dark:border-zinc-800 group hover:border-blue-500/30 transition-all">
                    <div>
                      <p className="text-xs font-bold text-foreground dark:text-zinc-200">{item.ticker}</p>
                      <p className="text-[9px] text-muted-foreground">Disponível no mês</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800 dark:text-zinc-100 font-mono-retro">{formatBRL(item.valor_no_mes)}</span>
                      <button onClick={() => handleOpenEdit(item)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 size={11} />
                      </button>
                      <button onClick={() => handleDeleteItem(item.id)} className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhum item ainda</p>
              )}
            </div>
          </div>
        </div>

        {/* BENS CONTAINER */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm premium-card flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Home size={16} className="text-purple-500" />
                Bens
              </h3>
              <button 
                onClick={() => handleOpenAdd('bens')}
                className="text-[10px] font-bold uppercase bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
              >
                <Plus size={10} /> Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {activeItemsAtMonth.filter(i => i.tipo === 'bens').length > 0 ? (
                activeItemsAtMonth.filter(i => i.tipo === 'bens').map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-muted dark:bg-zinc-800/40 rounded-xl border border-border dark:border-zinc-800 group hover:border-purple-500/30 transition-all">
                    <div>
                      <p className="text-xs font-bold text-foreground dark:text-zinc-200">{item.ticker}</p>
                      <p className="text-[9px] text-muted-foreground">Patrimônio material</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800 dark:text-zinc-100 font-mono-retro">{formatBRL(item.valor_no_mes)}</span>
                      <button onClick={() => handleOpenEdit(item)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 size={11} />
                      </button>
                      <button onClick={() => handleDeleteItem(item.id)} className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhum item ainda</p>
              )}
            </div>
          </div>
        </div>

        {/* DIVIDAS CONTAINER */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm premium-card flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <TrendingDown size={16} className="text-rose-500" />
                Dívidas
              </h3>
              <button 
                onClick={() => handleOpenAdd('divida')}
                className="text-[10px] font-bold uppercase bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
              >
                <Plus size={10} /> Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {activeItemsAtMonth.filter(i => i.tipo === 'divida').length > 0 ? (
                activeItemsAtMonth.filter(i => i.tipo === 'divida').map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-muted dark:bg-zinc-800/40 rounded-xl border border-border dark:border-zinc-800 group hover:border-rose-500/30 transition-all">
                    <div>
                      <p className="text-xs font-bold text-foreground dark:text-zinc-200">{item.ticker}</p>
                      <p className="text-[9px] text-muted-foreground">Valor pendente</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-rose-500 font-mono-retro">{formatBRL(item.valor_no_mes)}</span>
                      <button onClick={() => handleOpenEdit(item)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 size={11} />
                      </button>
                      <button onClick={() => handleDeleteItem(item.id)} className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhum item ainda</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 4. MODAL PARA ADICIONAR E EDITAR ITENS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm dark:bg-black/60" />

          {/* Modal Card */}
          <div className="bg-white dark:bg-zinc-900 border border-border w-full max-w-md rounded-2xl p-6 shadow-xl relative z-10 animate-scale-in transition-colors">
            
            {/* Close button */}
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg">
              <X size={16} />
            </button>

            <h3 className="font-bold text-lg text-foreground mb-1">
              {modalMode === 'add' ? `Adicionar ${modalTipo === 'liquidez' ? 'Liquidez' : modalTipo === 'bens' ? 'Bem' : 'Dívida'}` : `Editar ${modalTipo === 'liquidez' ? 'Liquidez' : modalTipo === 'bens' ? 'Bem' : 'Dívida'}`}
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Os dados de valor são cadastrados reativamente para o mês selecionado.
            </p>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Nome do Item</label>
                <input 
                  type="text" 
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full retro-input focus:outline-none"
                  placeholder={modalTipo === 'liquidez' ? 'Ex: Caixinha Nubank' : modalTipo === 'bens' ? 'Ex: BYD Mini' : 'Ex: Financiamento FIES'}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={modalValue}
                  onChange={(e) => setModalValue(e.target.value)}
                  className="w-full retro-input focus:outline-none font-mono-retro text-sm"
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 text-xs font-semibold text-white bg-primary rounded-xl hover:opacity-90 shadow-sm transition-all"
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
