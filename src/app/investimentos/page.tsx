'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/finance-context';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  DollarSign, 
  Briefcase, 
  Activity, 
  Percent, 
  Trash2,
  RefreshCw,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend
} from 'recharts';

export default function InvestimentosPage() {
  const { 
    investments, 
    investmentMovements, 
    addInvestment, 
    updateInvestmentPrice, 
    deleteInvestment, 
    addInvestmentMovement 
  } = useFinance();

  const [mounted, setMounted] = useState(false);

  // Forms states
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddMovement, setShowAddMovement] = useState(false);

  // Add Asset form variables
  const [ticker, setTicker] = useState('');
  const [tipo, setTipo] = useState<'ação' | 'fii' | 'renda_fixa' | 'cripto'>('ação');
  const [initialPrice, setInitialPrice] = useState('');

  // Add Movement form variables
  const [selectedInvId, setSelectedInvId] = useState('');
  const [moveTipo, setMoveTipo] = useState<'aporte' | 'resgate'>('aporte');
  const [moveQty, setMoveQty] = useState('');
  const [moveVal, setMoveVal] = useState('');
  const [moveDate, setMoveDate] = useState(new Date().toISOString().split('T')[0]);

  // Inline price update variables
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceVal, setEditingPriceVal] = useState('');

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
  // PORTFOLIO METRICS
  // ----------------------------------------------------
  const totalInvested = investments.reduce(
    (sum, inv) => sum + (Number(inv.quantidade) * Number(inv.preço_medio)),
    0
  );

  const currentValuation = investments.reduce(
    (sum, inv) => sum + (Number(inv.quantidade) * Number(inv.preço_atual)),
    0
  );

  const profitLossAmount = currentValuation - totalInvested;
  const profitLossPct = totalInvested > 0 ? (profitLossAmount / totalInvested) * 100 : 0;

  // ----------------------------------------------------
  // ALLOCATION BY TYPE
  // ----------------------------------------------------
  const allocationMap = investments.reduce((acc, inv) => {
    const val = Number(inv.quantidade) * Number(inv.preço_atual);
    acc[inv.tipo] = (acc[inv.tipo] || 0) + val;
    return acc;
  }, {} as Record<string, number>);

  const assetTypeColors: Record<string, string> = {
    ação: '#818CF8',      // Indigo
    fii: '#38BDF8',       // Sky
    cripto: '#F59E0B',    // Amber
    renda_fixa: '#34D399' // Emerald
  };

  const assetTypeNames: Record<string, string> = {
    ação: 'Ações',
    fii: 'FIIs',
    cripto: 'Cripto',
    renda_fixa: 'Renda Fixa'
  };

  const allocationData = Object.entries(allocationMap).map(([key, val]) => ({
    name: assetTypeNames[key] || key,
    value: val,
    color: assetTypeColors[key] || '#94A3B8'
  })).filter(d => d.value > 0);

  // ----------------------------------------------------
  // CONTRIBUTIONS HISTORY BY MONTH (Bar Chart)
  // ----------------------------------------------------
  const getContributionHistory = () => {
    interface MonthData {
      label: string;
      monthNum: number;
      yearNum: number;
      Aportes: number;
      Resgates: number;
    }
    const months: MonthData[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString('pt-BR', { month: 'short' }),
        monthNum: d.getMonth(),
        yearNum: d.getFullYear(),
        Aportes: 0,
        Resgates: 0
      });
    }

    // Accumulate movements
    investmentMovements.forEach(m => {
      const mDate = new Date(m.data);
      const mMonth = mDate.getUTCMonth();
      const mYear = mDate.getUTCFullYear();

      const slot = months.find(x => x.monthNum === mMonth && x.yearNum === mYear);
      if (slot) {
        if (m.tipo === 'aporte') {
          slot.Aportes += Number(m.valor);
        } else {
          slot.Resgates += Number(m.valor);
        }
      }
    });

    return months;
  };

  const barChartData = getContributionHistory();

  // ----------------------------------------------------
  // ACTIONS SUBMITTERS
  // ----------------------------------------------------

  // 1. Add asset
  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim() || !initialPrice) {
      alert('Preencha o ticker e o preço atual.');
      return;
    }

    try {
      await addInvestment({
        ticker: ticker.toUpperCase().trim(),
        tipo,
        preço_atual: Number(initialPrice)
      });
      setTicker('');
      setInitialPrice('');
      setShowAddAsset(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao adicionar ativo.');
    }
  };

  // 2. Add movement
  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvId || !moveQty || !moveVal) {
      alert('Selecione o ativo e preencha quantidade e valor.');
      return;
    }

    try {
      await addInvestmentMovement({
        investment_id: selectedInvId,
        tipo: moveTipo,
        quantidade: Number(moveQty),
        valor: Number(moveVal),
        data: new Date(moveDate + 'T12:00:00Z').toISOString()
      });
      setMoveQty('');
      setMoveVal('');
      setShowAddMovement(false);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao registrar movimentação.');
    }
  };

  // 3. Save inline price edit
  const savePriceEdit = async (id: string) => {
    const val = Number(editingPriceVal);
    if (isNaN(val) || val <= 0) {
      alert('Insira um preço válido.');
      return;
    }
    try {
      await updateInvestmentPrice(id, val);
      setEditingPriceId(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar preço.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Investimentos</h2>
        <p className="text-xs text-muted-foreground">Acompanhamento e evolução da sua carteira de ativos</p>
      </div>

      {/* Cards: Resumo metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Investido */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 flex flex-col justify-between h-28 relative overflow-hidden group">
          <div className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-muted/80 text-muted-foreground flex items-center justify-center">
            <DollarSign size={18} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold">Total Aportado</span>
            <p className="text-2xl font-black text-white mt-1 font-mono">
              {formatBRL(totalInvested)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">Valor somado dos aportes</span>
        </div>

        {/* Valor Atual */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 flex flex-col justify-between h-28 relative overflow-hidden group">
          <div className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center glow-primary">
            <Briefcase size={18} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold">Valor Atual da Carteira</span>
            <p className="text-2xl font-black text-white mt-1 font-mono">
              {formatBRL(currentValuation)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">Valuation em tempo de mercado</span>
        </div>

        {/* Rentabilidade */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 flex flex-col justify-between h-28 relative overflow-hidden group">
          <div className={`absolute right-4 top-4 w-9 h-9 rounded-xl flex items-center justify-center ${
            profitLossAmount >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          }`}>
            <Activity size={18} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold">Lucro / Prejuízo Total</span>
            <p className={`text-2xl font-black mt-1 font-mono ${
              profitLossAmount >= 0 ? 'text-success' : 'text-danger'
            }`}>
              {profitLossAmount >= 0 ? '+' : ''}{formatBRL(profitLossAmount)}
            </p>
          </div>
          <span className={`text-[10px] font-bold ${
            profitLossAmount >= 0 ? 'text-success' : 'text-danger'
          }`}>
            {profitLossAmount >= 0 ? '+' : ''}{profitLossPct.toFixed(2)}% de rentabilidade
          </span>
        </div>
      </div>

      {/* Benchmarks comparison banner */}
      <div className="bg-[#12151D] border border-border/30 rounded-2xl p-3.5 flex flex-wrap justify-between items-center gap-3 text-xs">
        <span className="text-muted-foreground font-semibold">Rentabilidade Comparativa:</span>
        <div className="flex gap-4 font-mono font-bold">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Sua Carteira:</span>
            <span className={profitLossAmount >= 0 ? 'text-success' : 'text-danger'}>
              {profitLossAmount >= 0 ? '+' : ''}{profitLossPct.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">CDI Acumulado:</span>
            <span className="text-slate-300">+10.8%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Ibovespa:</span>
            <span className="text-slate-300">+7.5%</span>
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left column: charts & management forms (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Allocation & Contribution charts */}
          <div className="bg-card border border-border/40 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Allocation Donut */}
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Alocação por Classe</h4>
                <p className="text-[10px] text-muted-foreground">Divisão percentual dos ativos da sua carteira</p>
              </div>
              <div className="h-[150px] relative flex items-center justify-center">
                {mounted && allocationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {allocationData.map((entry, index) => (
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
                        formatter={(val: any) => [formatBRL(Number(val)), 'Valor']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-muted/20 animate-pulse flex items-center justify-center text-[10px] text-muted-foreground">
                    Sem ativos
                  </div>
                )}
              </div>
            </div>

            {/* Contribution history Bar Chart */}
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Histórico de Aportes</h4>
                <p className="text-[10px] text-muted-foreground">Depósitos mensais efetuados na carteira</p>
              </div>
              <div className="h-[150px] w-full">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <XAxis dataKey="label" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#12151D',
                          border: '1px solid #1F2937',
                          borderRadius: '12px'
                        }}
                        itemStyle={{ fontSize: '11px', color: '#FFF' }}
                        formatter={(val: any) => [formatBRL(Number(val))]}
                      />
                      <Bar dataKey="Aportes" fill="#6366F1" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full bg-muted/10 animate-pulse" />
                )}
              </div>
            </div>

          </div>

          {/* Quick Management Panel */}
          <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              Ações de Carteira
            </h3>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddAsset(!showAddAsset);
                  setShowAddMovement(false);
                }}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  showAddAsset 
                    ? 'bg-primary text-white border-transparent' 
                    : 'border-border/50 bg-card hover:bg-muted text-muted-foreground hover:text-slate-200'
                }`}
              >
                <PlusCircle size={15} />
                Novo Ativo (Ticker)
              </button>

              <button
                onClick={() => {
                  setShowAddMovement(!showAddMovement);
                  setShowAddAsset(false);
                }}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  showAddMovement 
                    ? 'bg-primary text-white border-transparent' 
                    : 'border-border/50 bg-card hover:bg-muted text-muted-foreground hover:text-slate-200'
                }`}
              >
                <RefreshCw size={15} />
                Lançar Movimento
              </button>
            </div>

            {/* FORM: Add new Asset Ticker */}
            {showAddAsset && (
              <form onSubmit={handleAddAsset} className="p-4 bg-muted/40 rounded-xl border border-border/30 space-y-3 animate-fade-in">
                <h4 className="text-xs font-bold text-slate-200">Cadastrar Novo Ativo</h4>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Ticker</label>
                    <input
                      type="text"
                      placeholder="Ex: PETR4, WEGE3"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value)}
                      className="w-full bg-muted border border-border/60 rounded-lg p-2 text-xs text-slate-100 uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Classe</label>
                    <select
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value as any)}
                      className="w-full bg-muted border border-border/60 rounded-lg p-2 text-xs text-slate-200"
                    >
                      <option value="ação">Ação</option>
                      <option value="fii">FII</option>
                      <option value="cripto">Cripto</option>
                      <option value="renda_fixa">Renda Fixa</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Preço Atual</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Preço R$"
                      value={initialPrice}
                      onChange={(e) => setInitialPrice(e.target.value)}
                      className="w-full bg-muted border border-border/60 rounded-lg p-2 text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAddAsset(false)}
                    className="py-1.5 px-3 text-xs bg-muted rounded-lg text-muted-foreground hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-1.5 px-3 text-xs bg-primary text-white rounded-lg font-bold"
                  >
                    Salvar Ativo
                  </button>
                </div>
              </form>
            )}

            {/* FORM: Add new contribution/withdrawal Movement */}
            {showAddMovement && (
              <form onSubmit={handleAddMovement} className="p-4 bg-muted/40 rounded-xl border border-border/30 space-y-3 animate-fade-in">
                <h4 className="text-xs font-bold text-slate-200">Lançar Aporte ou Resgate</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Ativo</label>
                    <select
                      value={selectedInvId}
                      onChange={(e) => setSelectedInvId(e.target.value)}
                      className="w-full bg-muted border border-border/60 rounded-lg p-2 text-xs text-slate-200"
                      required
                    >
                      <option value="">Selecione o ativo</option>
                      {investments.map(i => (
                        <option key={i.id} value={i.id}>{i.ticker} ({assetTypeNames[i.tipo]})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Operação</label>
                    <div className="grid grid-cols-2 p-0.5 bg-muted border border-border/60 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setMoveTipo('aporte')}
                        className={`py-1 text-[10px] font-bold rounded ${
                          moveTipo === 'aporte' ? 'bg-[#12151D] text-white shadow' : 'text-muted-foreground'
                        }`}
                      >
                        Aporte
                      </button>
                      <button
                        type="button"
                        onClick={() => setMoveTipo('resgate')}
                        className={`py-1 text-[10px] font-bold rounded ${
                          moveTipo === 'resgate' ? 'bg-[#12151D] text-white shadow' : 'text-muted-foreground'
                        }`}
                      >
                        Resgate
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Quantidade</label>
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Qtd"
                      value={moveQty}
                      onChange={(e) => setMoveQty(e.target.value)}
                      className="w-full bg-muted border border-border/60 rounded-lg p-2 text-xs text-slate-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Valor Total</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Preço * Qtd (R$)"
                      value={moveVal}
                      onChange={(e) => setMoveVal(e.target.value)}
                      className="w-full bg-muted border border-border/60 rounded-lg p-2 text-xs text-slate-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Data</label>
                    <input
                      type="date"
                      value={moveDate}
                      onChange={(e) => setMoveDate(e.target.value)}
                      className="w-full bg-muted border border-border/60 rounded-lg p-2 text-xs text-slate-100 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAddMovement(false)}
                    className="py-1.5 px-3 text-xs bg-muted rounded-lg text-muted-foreground hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-1.5 px-3 text-xs bg-primary text-white rounded-lg font-bold"
                  >
                    Registrar Movimentação
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>

        {/* Right column: Interactive Assets Table (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-card border border-border/40 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border/30 bg-muted/10">
              <h3 className="font-bold text-sm text-slate-100">Ativos em Carteira</h3>
              <p className="text-[10px] text-muted-foreground">Clique no preço atual para editá-lo inline</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20 text-[9px] uppercase tracking-wider text-muted-foreground font-black">
                    <th className="py-3 px-4">Ativo</th>
                    <th className="py-3 px-4 text-right font-mono">Qtd</th>
                    <th className="py-3 px-4 text-right font-mono">Preço Médio</th>
                    <th className="py-3 px-4 text-right font-mono">Preço Atual</th>
                    <th className="py-3 px-4 text-right font-mono">Total (Lucro)</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {investments.length > 0 ? (
                    investments.map((inv) => {
                      const valuation = Number(inv.quantidade) * Number(inv.preço_atual);
                      const profitAmount = (Number(inv.preço_atual) - Number(inv.preço_medio)) * Number(inv.quantidade);
                      const profitPct = Number(inv.preço_medio) > 0 
                        ? ((Number(inv.preço_atual) / Number(inv.preço_medio)) - 1) * 100 
                        : 0;

                      const isEditingPrice = editingPriceId === inv.id;

                      return (
                        <tr key={inv.id} className="hover:bg-muted/10 transition-colors">
                          {/* Active / type info */}
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-black text-slate-100 uppercase tracking-tight">{inv.ticker}</p>
                              <span className="text-[8px] font-bold uppercase px-1 py-0.25 rounded text-white" style={{
                                backgroundColor: assetTypeColors[inv.tipo]
                              }}>
                                {inv.tipo === 'renda_fixa' ? 'R. Fixa' : inv.tipo}
                              </span>
                            </div>
                          </td>

                          {/* Quantity */}
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                            {Number(inv.quantidade).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}
                          </td>

                          {/* Avg Price */}
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                            {formatBRL(Number(inv.preço_medio))}
                          </td>

                          {/* Current Price (Editable inline) */}
                          <td className="py-3 px-4 text-right font-mono">
                            {isEditingPrice ? (
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingPriceVal}
                                  onChange={(e) => setEditingPriceVal(e.target.value)}
                                  className="w-16 bg-muted border border-border/60 rounded px-1.5 py-0.5 text-xs text-right text-slate-100 focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  onClick={() => savePriceEdit(inv.id)}
                                  className="p-0.5 text-success hover:bg-success/10 rounded"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingPriceId(null)}
                                  className="p-0.5 text-danger hover:bg-danger/10 rounded"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <span 
                                onClick={() => {
                                  setEditingPriceId(inv.id);
                                  setEditingPriceVal(String(inv.preço_atual));
                                }}
                                className="cursor-pointer border-b border-dashed border-muted-foreground/40 hover:text-slate-100 hover:border-slate-100 pb-0.5"
                                title="Clique para editar"
                              >
                                {formatBRL(Number(inv.preço_atual))}
                              </span>
                            )}
                          </td>

                          {/* Valuation + Profit */}
                          <td className="py-3 px-4 text-right font-mono">
                            <p className="font-bold text-slate-200">{formatBRL(valuation)}</p>
                            {inv.quantidade > 0 && (
                              <span className={`text-[9px] font-semibold ${profitAmount >= 0 ? 'text-success' : 'text-danger'}`}>
                                {profitAmount >= 0 ? '▲' : '▼'} {profitPct.toFixed(1)}%
                              </span>
                            )}
                          </td>

                          {/* Delete Action */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                if (confirm(`Deseja mesmo remover o ativo ${inv.ticker}? Isso também removerá seu histórico de aportes.`)) {
                                  deleteInvestment(inv.id);
                                }
                              }}
                              className="p-1 rounded text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                              title="Remover Ativo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Nenhum ativo cadastrado. Cadastre o primeiro no painel ao lado!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
