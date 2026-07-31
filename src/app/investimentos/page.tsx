'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '@/context/finance-context';
import { 
  PlusCircle,
  Wallet,
  Trash2,
  Info,
  DollarSign,
  PiggyBank,
  Edit2,
  X,
  TrendingUp
} from 'lucide-react';
import { FilterPanel, FilterState, initialFilterState } from '@/components/filter-panel';

export default function InvestimentosPage() {
  const { 
    investments, 
    transactions,
    addInvestment, 
    editInvestment,
    deleteInvestment,
    addInvestmentMovement
  } = useFinance();

  const [mounted, setMounted] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>(initialFilterState);

  // Form States
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<'renda_fixa' | 'ação' | 'fii' | 'cripto'>('renda_fixa');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  // ----------------------------------------------------
  // FILTERING INVESTMENTS
  // ----------------------------------------------------
  const filteredInvestments = useMemo(() => {
    return investments.filter(inv => {
      // 1. Text search ticker
      if (activeFilters.search) {
        const matchesSearch = inv.ticker.toLowerCase().includes(activeFilters.search.toLowerCase());
        if (!matchesSearch) return false;
      }

      // 2. Type (renda_fixa, ação, fii, cripto)
      if (activeFilters.type !== 'todos') {
        if (inv.tipo !== activeFilters.type) return false;
      }

      // 3. Value Range (qty * current price)
      const totalVal = Number(inv.quantidade) * Number(inv.preço_atual);
      if (activeFilters.minVal !== '') {
        if (totalVal < activeFilters.minVal) return false;
      }
      if (activeFilters.maxVal !== '') {
        if (totalVal > activeFilters.maxVal) return false;
      }

      // 4. Date range (on data_atualização or created_at)
      if (activeFilters.periodType !== 'todos') {
        const dateStr = inv.data_atualização || inv.created_at;
        if (!dateStr) return false;
        
        const invDate = new Date(dateStr);
        const invYear = invDate.getUTCFullYear();
        const invMonth = invDate.getUTCMonth();
        const invDay = invDate.getUTCDate();

        if (activeFilters.periodType === 'dia') {
          const filterDate = new Date(activeFilters.selectedDate + 'T00:00:00Z');
          const isSameDay = invYear === filterDate.getUTCFullYear() &&
                            invMonth === filterDate.getUTCMonth() &&
                            invDay === filterDate.getUTCDate();
          if (!isSameDay) return false;
        } else if (activeFilters.periodType === 'mes') {
          const [fYear, fMonth] = activeFilters.selectedMonth.split('-').map(Number);
          const isSameMonth = invYear === fYear && (invMonth + 1) === fMonth;
          if (!isSameMonth) return false;
        } else if (activeFilters.periodType === 'ano') {
          const fYear = Number(activeFilters.selectedYear);
          const isSameYear = invYear === fYear;
          if (!isSameYear) return false;
        } else if (activeFilters.periodType === 'personalizado') {
          if (activeFilters.startDate) {
            const start = new Date(activeFilters.startDate + 'T00:00:00Z');
            if (invDate < start) return false;
          }
          if (activeFilters.endDate) {
            const end = new Date(activeFilters.endDate + 'T23:59:59Z');
            if (invDate > end) return false;
          }
        }
      }

      return true;
    });
  }, [investments, activeFilters]);

  // Real checking account balance (revenues - expenses)
  const totalRevenuesAllTime = transactions
    .filter(t => t.tipo === 'receita')
    .reduce((sum, t) => sum + Number(t.valor), 0);
  const totalExpensesAllTime = transactions
    .filter(t => t.tipo === 'despesa')
    .reduce((sum, t) => sum + Number(t.valor), 0);
  const accountBalance = totalRevenuesAllTime - totalExpensesAllTime;

  // Total saved in all investments (qty * price)
  const totalSaved = filteredInvestments.reduce(
    (sum, inv) => sum + (Number(inv.quantidade) * Number(inv.preço_atual)),
    0
  );

  const consolidatedBalance = accountBalance + totalSaved;


  // Handle Edit Action Setup
  const handleEditClick = (inv: any) => {
    setSelectedInvId(inv.id);
    setName(inv.ticker);
    setAmount(Number(inv.quantidade).toString());
    setType(inv.tipo);
  };

  // Handle Cancel Edit
  const handleCancelEdit = () => {
    setSelectedInvId(null);
    setName('');
    setAmount('');
    setType('renda_fixa');
  };

  // Submit handler (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    
    if (!name.trim()) {
      alert('Informe o local/nome do investimento.');
      return;
    }

    if (name.trim().length > 20) {
      alert('O nome do local/ativo deve ter no máximo 20 caracteres.');
      return;
    }

    if (isNaN(val) || val < 0) {
      alert('Por favor, informe um valor válido (maior ou igual a zero).');
      return;
    }

    try {
      setIsSubmitting(true);

      if (selectedInvId) {
        // Edit flow: calculate difference and trigger movement
        const targetInv = investments.find(i => i.id === selectedInvId);
        if (!targetInv) throw new Error('Investimento não encontrado.');
        
        const currentQty = Number(targetInv.quantidade);
        const diff = val - currentQty;

        // 1. Update basic information
        await editInvestment(selectedInvId, {
          ticker: name.trim(),
          tipo: type,
          data_atualização: new Date().toISOString()
        });

        // 2. Add movement if quantity changed
        if (diff !== 0) {
          await addInvestmentMovement({
            investment_id: selectedInvId,
            tipo: diff > 0 ? 'aporte' : 'resgate',
            valor: Math.abs(diff),
            quantidade: Math.abs(diff),
            data: new Date().toISOString().split('T')[0]
          });
        }
        alert('Investimento atualizado com sucesso!');
      } else {
        // Add flow: create investment with 0 quantity first, then add movement
        const newId = await addInvestment({
          ticker: name.trim(),
          tipo: type,
          quantidade: 0,
          preço_atual: 1.00,
          preço_medio: 1.00,
          data_atualização: new Date().toISOString()
        });

        if (val > 0) {
          await addInvestmentMovement({
            investment_id: newId,
            tipo: 'aporte',
            valor: val,
            quantidade: val,
            data: new Date().toISOString().split('T')[0]
          });
        }
        alert('Investimento adicionado com sucesso!');
      }

      // Reset Form
      handleCancelEdit();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao salvar operação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to translate asset types into human readable formats
  const translateType = (t: string) => {
    switch (t) {
      case 'renda_fixa': return 'Renda Fixa';
      case 'ação': return 'Ações';
      case 'fii': return 'FIIs';
      case 'cripto': return 'Cripto';
      default: return t;
    }
  };

  // Helper to get CSS classes for badges
  const getTypeBadgeStyles = (t: string) => {
    switch (t) {
      case 'renda_fixa': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'ação': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'fii': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'cripto': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default: return 'bg-muted text-muted-foreground border-border/50';
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          <TrendingUp size={22} className="text-foreground" />
          Investimentos e Reservas
        </h2>
        <p className="text-xs text-muted-foreground/70 mt-0.5">Acompanhe e aloque seu patrimônio por classe de ativo</p>
      </div>

      {/* Bento Grid: Metrics summary */}
      <div className="bento-grid">
        {/* Saldo Disponivel */}
        <div className="bento-card border border-border bg-card/90 flex flex-col justify-between select-none">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Conta Corrente</span>
              <h3 className="text-3xl font-extrabold text-foreground tracking-tight mt-1">
                {formatBRL(accountBalance)}
              </h3>
            </div>
            <span className="badge-emerald p-2 rounded-xl">
              <Wallet size={18} />
            </span>
          </div>
          <span className="text-xs text-muted-foreground/70 mt-4 pt-3 border-t border-border/15">Saldo livre na conta</span>
        </div>

        {/* Total Guardado */}
        <div className="bento-card border border-border bg-card/90 flex flex-col justify-between select-none">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Total Guardado</span>
              <h3 className="text-3xl font-extrabold text-foreground tracking-tight mt-1">
                {formatBRL(totalSaved)}
              </h3>
            </div>
            <span className="badge-indigo p-2 rounded-xl">
              <PiggyBank size={18} />
            </span>
          </div>
          <span className="text-xs text-muted-foreground/70 mt-4 pt-3 border-t border-border/15">Aplicações e reservas ativas</span>
        </div>

        {/* Consolidated Patrimônio */}
        <div className="bento-card border border-border bg-card/90 flex flex-col justify-between select-none">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Patrimônio Consolidado</span>
              <h3 className="text-3xl font-extrabold text-foreground tracking-tight mt-1">
                {formatBRL(consolidatedBalance)}
              </h3>
            </div>
            <span className="badge-amber p-2 rounded-xl">
              <DollarSign size={18} />
            </span>
          </div>
          <span className="text-xs text-muted-foreground/70 mt-4 pt-3 border-t border-border/15">Conta corrente + Investimentos</span>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel 
        isInvestmentsPage={true}
        onFilterChange={setActiveFilters}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Table of investments (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bento-card border border-border bg-card/90 p-0 overflow-hidden">
            
            <div className="p-5 border-b border-border/15">
              <h3 className="font-extrabold text-sm text-foreground tracking-tight">Planilha de Investimentos</h3>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Locais onde você possui dinheiro reservado</p>
            </div>

            <div className="overflow-x-auto">
              <table className="shadcn-table w-full text-left">
                <thead>
                  <tr>
                    <th className="py-3.5 px-4">Onde está guardado</th>
                    <th className="py-3.5 px-4 text-center">Tipo</th>
                    <th className="py-3.5 px-4 text-right">Valor Guardado</th>
                    <th className="py-3.5 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/15 text-xs">
                  {filteredInvestments.length > 0 ? (
                    filteredInvestments.map((inv) => (
                      <tr key={inv.id} className="transition-colors hover:bg-muted/40">
                        {/* Name */}
                        <td className="py-3.5 px-4 font-bold text-foreground max-w-[150px] truncate">
                          {inv.ticker}
                        </td>

                        {/* Type Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="badge-indigo inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full">
                            {translateType(inv.tipo)}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right font-extrabold text-foreground text-xs">
                          {formatBRL(Number(inv.quantidade) * Number(inv.preço_atual))}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            <button
                              onClick={() => handleEditClick(inv)}
                              className="p-1.5 border border-border/20 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                              title="Editar Investimento"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja mesmo excluir o investimento no "${inv.ticker}"?`)) {
                                  deleteInvestment(inv.id);
                                }
                              }}
                              className="p-1.5 border border-border/20 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                              title="Remover Investimento"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <PiggyBank size={32} className="text-muted-foreground/30" />
                          <span className="font-medium">Nenhum investimento encontrado com os filtros selecionados.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* Right Side: Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bento-card border border-border bg-card/90 p-5 space-y-5">
            
            <div className="flex justify-between items-center border-b border-border/15 pb-3">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 tracking-tight">
                <PlusCircle size={16} className="text-foreground" />
                {selectedInvId ? 'Editar Investimento' : 'Novo Lançamento'}
              </h3>
              {selectedInvId && (
                <button
                  onClick={handleCancelEdit}
                  className="p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                  title="Cancelar Edição"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name / Where */}
              <div>
                <label className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block mb-1.5">
                  Onde está investido? (Nome)
                </label>
                <input
                  type="text"
                  placeholder="Ex: CDB Nubank, CDB Inter..."
                  maxLength={20}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full shadcn-input text-xs"
                  required
                />
                <span className="text-[10px] text-muted-foreground/60 block mt-1">Máximo de 20 caracteres</span>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block mb-1.5">
                  Valor Guardado (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full shadcn-input pl-9 font-bold text-xs"
                    required
                  />
                </div>
              </div>

              {/* Type Category */}
              <div>
                <label className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block mb-1.5">
                  Tipo de Ativo
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full shadcn-input text-xs"
                  required
                >
                  <option value="renda_fixa">Renda Fixa (CDB, Selic, Poupança)</option>
                  <option value="ação">Ações</option>
                  <option value="fii">FIIs (Fundos Imobiliários)</option>
                  <option value="cripto">Cripto (Bitcoin, Ethereum)</option>
                </select>
              </div>

              {/* Informative description */}
              <div className="p-3 bg-muted/40 border border-border/15 rounded-xl flex gap-2 text-xs text-muted-foreground leading-relaxed">
                <Info size={15} className="text-foreground shrink-0 mt-0.5" />
                <p className="text-[11px]">
                  Cadastre o valor total alocado neste ativo. Ele integrará automaticamente a visão geral de patrimônio.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                {selectedInvId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-1/3 py-2.5 border border-border/20 text-xs font-bold text-muted-foreground hover:bg-muted rounded-xl"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`shiny-btn py-2.5 text-xs font-bold ${selectedInvId ? 'w-2/3' : 'w-full'}`}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  ) : (
                    selectedInvId ? 'Atualizar Dados' : 'Adicionar Dinheiro'
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>

      </div>

    </div>
  );
}
