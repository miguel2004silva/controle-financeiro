'use client';

import React, { useState, useEffect } from 'react';
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

export default function InvestimentosPage() {
  const { 
    investments, 
    transactions,
    addInvestment, 
    editInvestment,
    deleteInvestment
  } = useFinance();

  const [mounted, setMounted] = useState(false);

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

  // Real checking account balance (revenues - expenses)
  const totalRevenuesAllTime = transactions
    .filter(t => t.tipo === 'receita')
    .reduce((sum, t) => sum + Number(t.valor), 0);
  const totalExpensesAllTime = transactions
    .filter(t => t.tipo === 'despesa')
    .reduce((sum, t) => sum + Number(t.valor), 0);
  const accountBalance = totalRevenuesAllTime - totalExpensesAllTime;

  // Total saved in all investments (qty * price)
  const totalSaved = investments.reduce(
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
        // Edit flow
        await editInvestment(selectedInvId, {
          ticker: name.trim(),
          tipo: type,
          quantidade: val,
          preço_atual: 1.00,
          preço_medio: 1.00,
          data_atualização: new Date().toISOString()
        });
        alert('Investimento atualizado com sucesso!');
      } else {
        // Add flow
        await addInvestment({
          ticker: name.trim(),
          tipo: type,
          quantidade: val,
          preço_atual: 1.00,
          preço_medio: 1.00,
          data_atualização: new Date().toISOString()
        });
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
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <TrendingUp size={24} className="text-primary" />
          Investimentos e Reservas
        </h2>
        <p className="text-xs text-muted-foreground">Adicione e acompanhe onde seu dinheiro está guardado de forma simples, como em uma planilha</p>
      </div>

      {/* Cards: Metrics summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Saldo Disponivel */}
        <div className="bg-card border border-border/40 rounded-2xl p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-primary/20 transition-all">
          <div className="absolute right-5 top-5 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center glow-primary">
            <Wallet size={20} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Conta Corrente</span>
            <p className="text-3xl font-black text-white mt-1.5 font-mono">
              {formatBRL(accountBalance)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground">Dinheiro livre na conta corrente</span>
        </div>

        {/* Total Guardado */}
        <div className="bg-card border border-border/40 rounded-2xl p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
          <div className="absolute right-5 top-5 w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <PiggyBank size={20} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Guardado</span>
            <p className="text-3xl font-black text-white mt-1.5 font-mono">
              {formatBRL(totalSaved)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground">Soma total de suas aplicações e reservas</span>
        </div>

        {/* Consolidated Patrimônio */}
        <div className="bg-card border border-border/40 rounded-2xl p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-indigo-500/20 transition-all">
          <div className="absolute right-5 top-5 w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Patrimônio Consolidado</span>
            <p className="text-3xl font-black text-white mt-1.5 font-mono">
              {formatBRL(consolidatedBalance)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground">Saldo da conta + Dinheiro guardado</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Simple List of stashed money (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card border border-border/40 rounded-2xl shadow-sm overflow-hidden">
            
            <div className="p-5 border-b border-border/30 bg-muted/10">
              <h3 className="font-bold text-sm text-slate-100">Planilha de Investimentos</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Locais onde você possui dinheiro reservado</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20 text-[9px] uppercase tracking-wider text-muted-foreground font-black">
                    <th className="py-3.5 px-5">Onde está guardado</th>
                    <th className="py-3.5 px-4 text-center">Tipo</th>
                    <th className="py-3.5 px-4 text-right font-mono">Valor Guardado</th>
                    <th className="py-3.5 px-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {investments.length > 0 ? (
                    investments.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/10 transition-colors">
                        {/* Name */}
                        <td className="py-4 px-5 font-bold text-slate-100 max-w-[150px] truncate">
                          {inv.ticker}
                        </td>

                        {/* Type Badge */}
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase rounded-full border ${getTypeBadgeStyles(inv.tipo)}`}>
                            {translateType(inv.tipo)}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 text-right font-mono font-bold text-slate-200 text-sm">
                          {formatBRL(Number(inv.quantidade) * Number(inv.preço_atual))}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-center">
                          <div className="flex justify-center items-center gap-1">
                            <button
                              onClick={() => handleEditClick(inv)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
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
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
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
                          <span>Nenhum valor guardado ainda.</span>
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
          <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-5 relative overflow-hidden">
            
            <div className="flex justify-between items-center border-b border-border/30 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <PlusCircle size={16} className="text-primary" />
                {selectedInvId ? 'Editar Investimento' : 'Novo Lançamento'}
              </h3>
              {selectedInvId && (
                <button
                  onClick={handleCancelEdit}
                  className="p-1 rounded text-muted-foreground hover:text-white"
                  title="Cancelar Edição"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name / Where */}
              <div>
                <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">
                  Onde está investido? (Nome)
                </label>
                <input
                  type="text"
                  placeholder="Ex: CDB Nubank, CDB Inter..."
                  maxLength={20}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-muted border border-border/60 rounded-xl p-3 text-xs text-slate-100 placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                  required
                />
                <span className="text-[9px] text-muted-foreground/60 block mt-1">Máximo de 20 caracteres</span>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">
                  Valor Guardado (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-xs font-bold text-muted-foreground">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-muted border border-border/60 rounded-xl py-3 pl-9 pr-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-primary/50"
                    required
                  />
                </div>
              </div>

              {/* Type Category */}
              <div>
                <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">
                  Tipo de Ativo
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-muted border border-border/60 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-primary/50"
                  required
                >
                  <option value="renda_fixa">Renda Fixa (CDB, Selic, Poupança)</option>
                  <option value="ação">Ações</option>
                  <option value="fii">FIIs (Fundos Imobiliários)</option>
                  <option value="cripto">Cripto (Bitcoin, Ethereum)</option>
                </select>
              </div>

              {/* Informative description */}
              <div className="p-3 bg-muted/40 border border-border/30 rounded-xl flex gap-2 text-[10px] text-muted-foreground leading-relaxed">
                <Info size={14} className="text-primary shrink-0 mt-0.5" />
                <p>
                  Aqui você pode registrar o saldo atualizado de cada um dos seus investimentos. Os valores adicionados compõem o seu Patrimônio Consolidado.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                {selectedInvId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-1/3 py-3 px-4 text-xs border border-border/60 hover:bg-muted text-slate-200 rounded-xl font-bold transition-all"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`py-3 px-6 text-xs bg-primary hover:opacity-90 text-white rounded-xl font-bold transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 ${selectedInvId ? 'w-2/3' : 'w-full'}`}
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
