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
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2 font-serif">
          <TrendingUp size={24} className="text-primary" />
          Investimentos e Reservas
        </h2>
        <p className="text-xs text-muted-foreground font-serif">Adicione e acompanhe onde seu dinheiro está guardado de forma simples, como em uma planilha</p>
      </div>

      {/* Cards: Metrics summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Saldo Disponivel */}
        <div className="bg-card p-6 flex flex-col justify-between h-32 relative overflow-hidden premium-card">
          <div className="absolute right-5 top-5 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-border/20">
            <Wallet size={20} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider font-serif">Conta Corrente</span>
            <p className="text-3xl font-bold text-foreground mt-1.5 font-mono-retro">
              {formatBRL(accountBalance)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground">Dinheiro livre na conta corrente</span>
        </div>

        {/* Total Guardado */}
        <div className="bg-card p-6 flex flex-col justify-between h-32 relative overflow-hidden premium-card">
          <div className="absolute right-5 top-5 w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-border/20">
            <PiggyBank size={20} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider font-serif">Total Guardado</span>
            <p className="text-3xl font-bold text-foreground mt-1.5 font-mono-retro">
              {formatBRL(totalSaved)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground">Soma total de suas aplicações e reservas</span>
        </div>

        {/* Consolidated Patrimônio */}
        <div className="bg-card p-6 flex flex-col justify-between h-32 relative overflow-hidden premium-card">
          <div className="absolute right-5 top-5 w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-border/20">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider font-serif">Patrimônio Consolidado</span>
            <p className="text-3xl font-bold text-foreground mt-1.5 font-mono-retro">
              {formatBRL(consolidatedBalance)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground">Saldo da conta + Dinheiro guardado</span>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel 
        isInvestmentsPage={true}
        onFilterChange={setActiveFilters}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Simple List of stashed money (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card premium-card overflow-hidden">
            
            <div className="p-5 border-b border-border bg-muted/30">
              <h3 className="font-bold text-sm text-foreground font-serif">Planilha de Investimentos</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-serif">Locais onde você possui dinheiro reservado</p>
            </div>

            <div className="overflow-x-auto">
              <table className="retro-table w-full text-left">
                <thead>
                  <tr>
                    <th className="py-3 px-4 font-serif">Onde está guardado</th>
                    <th className="py-3 px-4 text-center font-serif">Tipo</th>
                    <th className="py-3 px-4 text-right font-serif font-mono-retro">Valor Guardado</th>
                    <th className="py-3 px-4 text-center font-serif">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredInvestments.length > 0 ? (
                    filteredInvestments.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/10 transition-colors">
                        {/* Name */}
                        <td className="py-3 px-4 font-bold text-foreground max-w-[150px] truncate">
                          {inv.ticker}
                        </td>

                        {/* Type Badge */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase rounded border-2 border-border bg-muted text-foreground`}>
                            {translateType(inv.tipo)}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 text-right font-mono-retro text-foreground text-sm">
                          {formatBRL(Number(inv.quantidade) * Number(inv.preço_atual))}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            <button
                              onClick={() => handleEditClick(inv)}
                              className="p-1 border border-border/40 rounded text-muted-foreground hover:text-primary hover:bg-muted"
                              title="Editar Investimento"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja mesmo excluir o investimento no "${inv.ticker}"?`)) {
                                  deleteInvestment(inv.id);
                                }
                              }}
                              className="p-1 border border-border/40 rounded text-muted-foreground hover:text-danger hover:bg-muted"
                              title="Remover Investimento"
                            >
                              <Trash2 size={12} />
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
                          <span className="font-serif">Nenhum investimento encontrado com os filtros selecionados.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* Right Side: Stash / Edit Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card p-5 premium-card space-y-5 relative overflow-hidden">
            
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2 font-serif">
                <PlusCircle size={16} className="text-primary" />
                {selectedInvId ? 'Editar Investimento' : 'Novo Lançamento'}
              </h3>
              {selectedInvId && (
                <button
                  onClick={handleCancelEdit}
                  className="p-1 border border-border/30 rounded text-muted-foreground hover:text-foreground"
                  title="Cancelar Edição"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name / Where */}
              <div>
                <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1 font-serif">
                  Onde está investido? (Nome)
                </label>
                <input
                  type="text"
                  placeholder="Ex: CDB Nubank, CDB Inter..."
                  maxLength={20}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full retro-input"
                  required
                />
                <span className="text-[9px] text-muted-foreground/60 block mt-1">Máximo de 20 caracteres</span>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1 font-serif">
                  Valor Guardado (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xs font-bold text-muted-foreground font-mono-retro">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full retro-input pl-9 font-mono-retro"
                    required
                  />
                </div>
              </div>

              {/* Type Category */}
              <div>
                <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1 font-serif">
                  Tipo de Ativo
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full retro-input"
                  required
                >
                  <option value="renda_fixa">Renda Fixa (CDB, Selic, Poupança)</option>
                  <option value="ação">Ações</option>
                  <option value="fii">FIIs (Fundos Imobiliários)</option>
                  <option value="cripto">Cripto (Bitcoin, Ethereum)</option>
                </select>
              </div>

              {/* Informative description */}
              <div className="p-3 bg-muted border border-border/20 rounded flex gap-2 text-[10px] text-muted-foreground leading-relaxed">
                <Info size={14} className="text-primary shrink-0 mt-0.5" />
                <p className="font-serif">
                  Aqui você pode registrar o saldo atualizado de cada um dos seus investimentos. Os valores adicionados compõem o seu Patrimônio Consolidado.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                {selectedInvId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="retro-btn w-1/3"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`retro-btn retro-btn-primary ${selectedInvId ? 'w-2/3' : 'w-full'}`}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
