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
    return liquidezTotal + investimentosTotal;
  }, [liquidezTotal, investimentosTotal]);

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
      
      {/* 1. BENTO GRID OF HERO METRIC CARDS */}
      <div className="bento-grid">
        
        {/* Hero Card: Patrimônio Total */}
        <div className="bento-card border border-border bg-card/90 flex flex-col justify-between select-none">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Patrimônio Total</span>
              <h3 className={`text-3xl font-extrabold tracking-tight mt-1 ${patrimonioTotal < 0 ? 'text-rose-500' : 'text-foreground'}`}>
                {formatBRL(patrimonioTotal)}
              </h3>
            </div>
            <span className="badge-emerald px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <TrendingUp size={14} /> Ativo
            </span>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/15">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              Saldo em Conta: <strong className="text-foreground">{formatBRL(liquidezTotal)}</strong>
            </span>
            <button 
              onClick={() => {
                const mainSaldo = investments.find(i => i.tipo === 'liquidez');
                if (mainSaldo) {
                  handleOpenEdit(mainSaldo);
                } else {
                  handleOpenAdd('liquidez');
                }
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              title="Ajustar Saldo"
            >
              <Edit2 size={13} />
            </button>
          </div>
        </div>

        {/* Bento Card: Investimentos */}
        <div className="bento-card border border-border bg-card/90 flex flex-col justify-between select-none">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Investimentos & Ativos</span>
              <h3 className="text-3xl font-extrabold text-foreground tracking-tight mt-1">
                {formatBRL(investimentosTotal)}
              </h3>
            </div>
            <span className="badge-indigo px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <PiggyBank size={14} /> Portfólio
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-border/15 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Ações, FIIs e Renda Fixa</span>
            <span className="text-xs font-bold text-foreground">{pieData.length} Ativos</span>
          </div>
        </div>

      </div>

      {/* 2. CHARTS SECTION (REAL DATA) */}
      <div className="bento-card border border-border bg-card/90 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h3 className="font-extrabold text-lg text-foreground tracking-tight">Evolução do Patrimônio</h3>
            <p className="text-xs text-muted-foreground/70 mt-0.5">Evolução acumulada com base nas movimentações reais</p>
          </div>
          
          <div className="flex p-1 rounded-xl bg-muted/60 border border-border/15 w-full sm:w-auto select-none">
            {(['7D', '1M', '6M', '1A'] as const).map(range => (
              <button
                key={range}
                onClick={() => setChartRange(range)}
                className={`uiverse-pill ${
                  chartRange === range
                    ? 'uiverse-pill-active'
                    : 'uiverse-pill-inactive'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[300px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--foreground)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="var(--foreground)" stopOpacity={0.00}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  stroke="var(--muted-foreground)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                />
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
                  labelStyle={{ color: 'var(--muted-foreground)', fontWeight: 'bold', fontSize: '11px' }}
                  itemStyle={{ color: 'var(--foreground)', fontWeight: 'bold', fontSize: '13px' }}
                  formatter={(val: any) => [formatBRL(Number(val)), 'Patrimônio']}
                />
                <Area 
                  type="monotone" 
                  dataKey="Patrimônio" 
                  stroke="var(--foreground)" 
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

      {/* 4. MODAL PARA ADICIONAR E EDITAR ITENS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

          <div className="bg-card border border-border/20 w-full max-w-md rounded-2xl p-6 shadow-2xl relative z-10 animate-scale-in">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-muted transition-colors">
              <X size={18} />
            </button>

            <h3 className="font-extrabold text-lg text-foreground mb-1">
              {modalMode === 'add' ? `Adicionar ${modalTipo === 'liquidez' ? 'Liquidez' : modalTipo === 'bens' ? 'Bem' : 'Dívida'}` : `Editar ${modalTipo === 'liquidez' ? 'Liquidez' : modalTipo === 'bens' ? 'Bem' : 'Dívida'}`}
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Os dados de valor são cadastrados para o mês selecionado.
            </p>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Nome do Item</label>
                <input 
                  type="text" 
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full shadcn-input"
                  placeholder={modalTipo === 'liquidez' ? 'Ex: Caixinha Nubank' : modalTipo === 'bens' ? 'Ex: Veículo' : 'Ex: Financiamento'}
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={modalValue}
                  onChange={(e) => setModalValue(e.target.value)}
                  className="w-full shadcn-input font-bold text-sm"
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="shiny-btn px-5 py-2 text-xs font-bold"
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
