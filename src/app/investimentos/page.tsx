'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/finance-context';
import { 
  PlusCircle,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  Info,
  DollarSign,
  PiggyBank
} from 'lucide-react';

export default function InvestimentosPage() {
  const { 
    investments, 
    investmentMovements, 
    transactions,
    addInvestment, 
    deleteInvestment, 
    addInvestmentMovement 
  } = useFinance();

  const [mounted, setMounted] = useState(false);

  // Form States
  const [cdbOperation, setCdbOperation] = useState<'aporte' | 'resgate'>('aporte');
  const [selectedCdbId, setSelectedCdbId] = useState<string>('');
  const [newCdbName, setNewCdbName] = useState<string>('');
  const [isNewCdb, setIsNewCdb] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('');
  const [opDate, setOpDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  // Real balance (revenues - expenses)
  const totalRevenuesAllTime = transactions
    .filter(t => t.tipo === 'receita')
    .reduce((sum, t) => sum + Number(t.valor), 0);
  const totalExpensesAllTime = transactions
    .filter(t => t.tipo === 'despesa')
    .reduce((sum, t) => sum + Number(t.valor), 0);
  const accountBalance = totalRevenuesAllTime - totalExpensesAllTime;

  // CDBs only (renda_fixa)
  const onlyCdbs = investments.filter(inv => inv.tipo === 'renda_fixa');
  const totalSaved = onlyCdbs.reduce((sum, inv) => sum + Number(inv.quantidade), 0);

  const handleCdbSelect = (val: string) => {
    setSelectedCdbId(val);
    if (val === 'NEW') {
      setIsNewCdb(true);
    } else {
      setIsNewCdb(false);
    }
  };

  const handleCdbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    
    if (isNaN(val) || val <= 0) {
      alert('Por favor, informe um valor válido.');
      return;
    }

    if (!selectedCdbId) {
      alert('Selecione um CDB para guardar ou resgatar.');
      return;
    }

    if (isNewCdb && !newCdbName.trim()) {
      alert('Informe o nome do novo CDB.');
      return;
    }

    if (cdbOperation === 'aporte' && val > accountBalance) {
      const confirmProceed = confirm(
        `O valor a guardar (${formatBRL(val)}) é maior do que o seu Saldo em Conta (${formatBRL(accountBalance)}).\nDeseja continuar mesmo assim?`
      );
      if (!confirmProceed) return;
    }

    try {
      let invId = selectedCdbId;
      if (cdbOperation === 'aporte' && isNewCdb) {
        invId = await addInvestment({
          ticker: newCdbName.trim(),
          tipo: 'renda_fixa',
          preço_atual: 1.00
        });
      }

      const targetCdb = investments.find(i => i.id === invId);
      if (cdbOperation === 'resgate' && targetCdb) {
        if (Number(targetCdb.quantidade) < val) {
          alert(`Você não tem esse valor guardado neste CDB. Valor disponível: ${formatBRL(Number(targetCdb.quantidade))}`);
          return;
        }
      }

      await addInvestmentMovement({
        investment_id: invId,
        tipo: cdbOperation,
        quantidade: val,
        valor: val,
        data: new Date(opDate + 'T12:00:00Z').toISOString()
      });

      setAmount('');
      setNewCdbName('');
      setSelectedCdbId('');
      setIsNewCdb(false);
      alert(cdbOperation === 'aporte' ? 'Dinheiro guardado com sucesso!' : 'Dinheiro resgatado com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao processar operação.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Guardar Dinheiro (CDB)</h2>
        <p className="text-xs text-muted-foreground">Guarde o saldo de sua conta ou resgate de volta quando precisar</p>
      </div>

      {/* Cards: Metrics summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saldo Disponivel */}
        <div className="bg-card border border-border/40 rounded-2xl p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-primary/20 transition-all">
          <div className="absolute right-5 top-5 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center glow-primary">
            <Wallet size={20} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Saldo em Conta Corrente</span>
            <p className="text-3xl font-black text-white mt-1.5 font-mono">
              {formatBRL(accountBalance)}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">Dinheiro disponível para transações ou para guardar</span>
        </div>

        {/* Total Guardado */}
        <div className="bg-card border border-border/40 rounded-2xl p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
          <div className="absolute right-5 top-5 w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <PiggyBank size={20} />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Guardado em CDBs</span>
            <p className="text-3xl font-black text-white mt-1.5 font-mono">
              {formatBRL(totalSaved)}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">Valor total acumulado em investimentos CDB</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Stash / Withdraw Form (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-5">
            
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <PlusCircle size={16} className="text-primary" />
                Lançar Movimentação
              </h3>
              
              {/* Tab Selector */}
              <div className="flex bg-muted p-0.5 rounded-lg border border-border/30">
                <button
                  type="button"
                  onClick={() => {
                    setCdbOperation('aporte');
                    setSelectedCdbId('');
                    setIsNewCdb(false);
                  }}
                  className={`py-1.5 px-4 text-xs font-bold rounded ${
                    cdbOperation === 'aporte' ? 'bg-[#12151D] text-white shadow' : 'text-muted-foreground'
                  }`}
                >
                  Guardar (Aporte)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCdbOperation('resgate');
                    setSelectedCdbId('');
                    setIsNewCdb(false);
                  }}
                  className={`py-1.5 px-4 text-xs font-bold rounded ${
                    cdbOperation === 'resgate' ? 'bg-[#12151D] text-white shadow' : 'text-muted-foreground'
                  }`}
                >
                  Resgatar (Resgate)
                </button>
              </div>
            </div>

            <form onSubmit={handleCdbSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Select CDB */}
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">CDB Alvo</label>
                  <select
                    value={selectedCdbId}
                    onChange={(e) => handleCdbSelect(e.target.value)}
                    className="w-full bg-muted border border-border/60 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-primary/50"
                    required
                  >
                    <option value="">Selecione...</option>
                    {onlyCdbs.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.ticker} (Disponível: {formatBRL(Number(c.quantidade))})
                      </option>
                    ))}
                    {cdbOperation === 'aporte' && (
                      <option value="NEW">+ Guardar em Novo CDB...</option>
                    )}
                  </select>
                </div>

                {/* New CDB input (conditional) */}
                {isNewCdb && cdbOperation === 'aporte' && (
                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Nome do Novo CDB</label>
                    <input
                      type="text"
                      placeholder="Ex: CDB Nubank 100% CDI"
                      value={newCdbName}
                      onChange={(e) => setNewCdbName(e.target.value)}
                      className="w-full bg-muted border border-border/60 rounded-xl p-3 text-xs text-slate-100 placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                      required
                    />
                  </div>
                )}

                {/* Value */}
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Valor (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-xs font-bold text-muted-foreground">R$</span>
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

                {/* Date */}
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Data</label>
                  <input
                    type="date"
                    value={opDate}
                    onChange={(e) => setOpDate(e.target.value)}
                    className="w-full bg-muted border border-border/60 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none"
                    required
                  />
                </div>

              </div>

              {/* Informative description */}
              <div className="p-3 bg-muted/40 border border-border/30 rounded-xl flex gap-2 text-[10px] text-muted-foreground leading-relaxed">
                <Info size={14} className="text-primary shrink-0 mt-0.5" />
                <p>
                  {cdbOperation === 'aporte' 
                    ? 'Ao guardar dinheiro, o valor sai do saldo da sua conta corrente (receita/salário) e vai para o cofre do CDB.'
                    : 'Ao resgatar dinheiro, o valor sai do cofre do CDB e retorna para o saldo de sua conta corrente.'
                  }
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="py-3 px-6 text-xs bg-primary hover:opacity-90 text-white rounded-xl font-bold transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
                >
                  Confirmar Operação
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* Right Side: Simple List of stashed money (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border/40 rounded-2xl shadow-sm overflow-hidden">
            
            <div className="p-4 border-b border-border/30 bg-muted/10">
              <h3 className="font-bold text-sm text-slate-100">Dinheiro Guardado</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Locais onde você possui dinheiro reservado</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20 text-[9px] uppercase tracking-wider text-muted-foreground font-black">
                    <th className="py-3.5 px-4">Local / CDB</th>
                    <th className="py-3.5 px-4 text-right font-mono">Valor Guardado</th>
                    <th className="py-3.5 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {onlyCdbs.length > 0 ? (
                    onlyCdbs.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/10 transition-colors">
                        {/* Name */}
                        <td className="py-3.5 px-4 font-bold text-slate-100">
                          {inv.ticker}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">
                          {formatBRL(Number(inv.quantidade))}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm(`Deseja mesmo excluir o CDB ${inv.ticker}? O histórico de movimentações também será deletado.`)) {
                                deleteInvestment(inv.id);
                              }
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                            title="Remover CDB"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-muted-foreground">
                        Nenhum valor guardado ainda.
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
