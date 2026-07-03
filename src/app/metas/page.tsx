'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/finance-context';
import { CategoryIcon } from '@/components/category-icon';
import { 
  Target, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Calendar,
  AlertTriangle,
  PiggyBank
} from 'lucide-react';

export default function MetaseOrcamentosPage() {
  const { 
    categories, 
    transactions, 
    goals, 
    editCategory, 
    addGoal, 
    editGoal, 
    deleteGoal,
    investmentMovements
  } = useFinance();

  // Budgets state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editBudgetVal, setEditBudgetVal] = useState('');

  // Goals state
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');

  // Increment goal current value
  const [addingFundsGoalId, setAddingFundsGoalId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('');

  // Format currency helper
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  // ----------------------------------------------------
  // CALCULATE BUDGET SPENT FOR THE CURRENT MONTH
  // ----------------------------------------------------
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthTxs = transactions.filter(t => {
    const d = new Date(t.data);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const budgetsWithSpent = categories.map(cat => {
    const spent = currentMonthTxs
      .filter(t => t.tipo === 'despesa' && t.categoria_id === cat.id)
      .reduce((sum, t) => sum + Number(t.valor), 0);

    const pct = cat.orçamento_mensal > 0 ? (spent / cat.orçamento_mensal) * 100 : 0;
    
    // Warning status color
    let statusColor = 'bg-success'; // green
    if (pct > 90) {
      statusColor = 'bg-danger'; // red
    } else if (pct > 70) {
      statusColor = 'bg-amber-500'; // yellow/amber
    }

    return {
      ...cat,
      spent,
      pct,
      statusColor
    };
  });

  // Calculate Average Monthly Investment (for goal completion forecast)
  const calculateAvgMonthlyInvestment = () => {
    if (investmentMovements.length === 0) return 500; // default fallback: 500 BRL / month

    const uniqueMonths = new Set(investmentMovements.map(m => {
      const d = new Date(m.data);
      return `${d.getFullYear()}-${d.getMonth()}`;
    }));

    const totalAportes = investmentMovements
      .filter(m => m.tipo === 'aporte')
      .reduce((sum, m) => sum + Number(m.valor), 0);

    const monthsCount = Math.max(1, uniqueMonths.size);
    return totalAportes / monthsCount;
  };

  const avgMonthlySavings = calculateAvgMonthlyInvestment();

  // ----------------------------------------------------
  // ACTIONS SUBMITTERS
  // ----------------------------------------------------

  // Save budget changes
  const saveCategoryBudget = async (id: string) => {
    const val = Number(editBudgetVal);
    if (isNaN(val) || val < 0) {
      alert('Insira um orçamento válido.');
      return;
    }
    try {
      await editCategory(id, { orçamento_mensal: val });
      setEditingCatId(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar orçamento.');
    }
  };

  // Add new Goal
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim() || !goalTarget) {
      alert('Preencha o nome e o valor alvo.');
      return;
    }

    try {
      await addGoal({
        nome: goalName.trim(),
        valor_alvo: Number(goalTarget),
        valor_atual: Number(goalCurrent) || 0,
        prazo: goalDeadline || undefined
      });
      setGoalName('');
      setGoalTarget('');
      setGoalCurrent('');
      setGoalDeadline('');
      setShowAddGoal(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar meta.');
    }
  };

  // Save funds increment
  const saveFundIncrement = async (goalId: string, currentVal: number) => {
    const amount = Number(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Insira um valor válido para poupar.');
      return;
    }

    try {
      await editGoal(goalId, { valor_atual: currentVal + amount });
      setAddingFundsGoalId(null);
      setFundAmount('');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar progresso da meta.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Metas e Orçamentos</h2>
        <p className="text-xs text-muted-foreground">Planeje suas despesas mensais e visualize seus sonhos de longo prazo</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Monthly Budgets (3 cols) */}
        <div className="lg:col-span-3 bg-card border border-border/40 rounded-2xl p-5 space-y-5">
          <div>
            <h3 className="font-bold text-base text-foreground">Orçamento por Categorias</h3>
            <p className="text-xs text-muted-foreground">Monitore o teto de gastos planejados para este mês</p>
          </div>

          <div className="space-y-4">
            {budgetsWithSpent.map(cat => {
              const isEditing = editingCatId === cat.id;
              
              return (
                <div key={cat.id} className="p-4 bg-muted border border-border/20 rounded-xl space-y-3 hover:border-border/40 transition-colors">
                  <div className="flex justify-between items-center">
                    
                    {/* Category Label */}
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: cat.cor }}
                      >
                        <CategoryIcon name={cat.icone} size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{cat.nome}</h4>
                        <span className="text-[9px] text-muted-foreground font-semibold">
                          Usado: {formatBRL(cat.spent)}
                        </span>
                      </div>
                    </div>

                    {/* Budget value (with inline editor) */}
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">R$</span>
                          <input
                            type="number"
                            value={editBudgetVal}
                            onChange={(e) => setEditBudgetVal(e.target.value)}
                            className="bg-muted border border-border/60 rounded px-2 py-1 text-xs text-slate-100 font-mono w-24 text-right focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => saveCategoryBudget(cat.id)}
                            className="p-1 text-success hover:bg-success/10 rounded"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingCatId(null)}
                            className="p-1 text-danger hover:bg-danger/10 rounded"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-[10px] text-muted-foreground block">Orçamento</span>
                            <span className="text-xs font-mono font-extrabold text-slate-200">
                              {formatBRL(cat.orçamento_mensal)}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setEditBudgetVal(String(cat.orçamento_mensal));
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-slate-200"
                            title="Editar Orçamento"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Progress Gauge */}
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${cat.statusColor} transition-all duration-500`}
                        style={{ width: `${Math.min(100, cat.pct)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                      <span>{cat.pct.toFixed(0)}% consumido</span>
                      {cat.pct >= 100 && (
                        <span className="text-danger flex items-center gap-0.5">
                          <AlertTriangle size={10} /> Limite Excedido
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Long Term Goals (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-card border border-border/40 rounded-2xl p-5 space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-slate-100">Metas de Longo Prazo</h3>
                <p className="text-xs text-muted-foreground">Acompanhe seus planos e reservas</p>
              </div>
              <button
                onClick={() => setShowAddGoal(!showAddGoal)}
                className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                title="Criar nova meta"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* FORM: Create new Goal */}
            {showAddGoal && (
              <form onSubmit={handleAddGoal} className="p-4 bg-muted/40 border border-border/30 rounded-xl space-y-3 animate-fade-in">
                <h4 className="text-xs font-bold text-slate-200">Nova Meta Financeira</h4>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Nome do Sonho</label>
                    <input
                      type="text"
                      placeholder="Ex: Reserva Emergência, Viagem Disney..."
                      value={goalName}
                      onChange={(e) => setGoalName(e.target.value)}
                      className="w-full bg-muted border border-border/60 rounded-lg p-2 text-xs text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Valor Alvo</label>
                      <input
                        type="number"
                        placeholder="R$ 15.000"
                        value={goalTarget}
                        onChange={(e) => setGoalTarget(e.target.value)}
                        className="w-full bg-muted border border-border/60 rounded-lg p-2 text-xs text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Já tenho poupado</label>
                      <input
                        type="number"
                        placeholder="R$ 2.000"
                        value={goalCurrent}
                        onChange={(e) => setGoalCurrent(e.target.value)}
                        className="w-full bg-muted border border-border/60 rounded-lg p-2 text-xs text-foreground"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Prazo Conclusão (Opcional)</label>
                    <input
                      type="date"
                      value={goalDeadline}
                      onChange={(e) => setGoalDeadline(e.target.value)}
                      className="w-full bg-muted border border-border/60 rounded-lg p-2 text-xs text-foreground font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAddGoal(false)}
                    className="py-1.5 px-3 text-xs bg-muted rounded-lg text-muted-foreground hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-1.5 px-3 text-xs bg-primary text-white rounded-lg font-bold"
                  >
                    Criar Meta
                  </button>
                </div>
              </form>
            )}

            {/* List of Goals */}
            <div className="space-y-4">
              {goals.length > 0 ? (
                goals.map(goal => {
                  const target = Number(goal.valor_alvo);
                  const current = Number(goal.valor_atual);
                  const remaining = target - current;
                  const pct = Math.min(100, target > 0 ? (current / target) * 100 : 0);

                  // Calculate remaining months based on average monthly investments
                  const monthsRemaining = avgMonthlySavings > 0 ? Math.ceil(remaining / avgMonthlySavings) : null;
                  const isAddingFunds = addingFundsGoalId === goal.id;

                  return (
                    <div 
                      key={goal.id} 
                      className="p-4 bg-muted border border-border/20 rounded-xl space-y-3 hover:border-border/40 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        
                        {/* Name */}
                        <div>
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <span className="p-1 rounded bg-primary/10 text-primary">
                              <Target size={12} />
                            </span>
                            {goal.nome}
                          </h4>
                          {monthsRemaining !== null && remaining > 0 && (
                            <span className="text-[9px] text-muted-foreground font-semibold block mt-1">
                              ~{monthsRemaining} {monthsRemaining === 1 ? 'mês' : 'meses'} restantes (poupando {formatBRL(avgMonthlySavings)}/mês)
                            </span>
                          )}
                        </div>

                        {/* Values */}
                        <div className="text-right font-mono text-xs">
                          <span className="font-extrabold text-slate-200">{formatBRL(current)}</span>
                          <span className="text-[10px] text-muted-foreground block">Alvo: {formatBRL(target)}</span>
                        </div>

                      </div>

                      {/* Goal progress gauge */}
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-accent to-primary rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Bottom action toolbar (Add funds / Delete) */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[9px] text-muted-foreground font-bold">{pct.toFixed(0)}% concluído</span>
                        
                        <div className="flex items-center gap-2">
                          {isAddingFunds ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                placeholder="+ R$"
                                value={fundAmount}
                                onChange={(e) => setFundAmount(e.target.value)}
                                className="w-16 bg-muted border border-border/60 rounded px-1.5 py-0.5 text-[10px] font-mono focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => saveFundIncrement(goal.id, current)}
                                className="p-0.5 text-success hover:bg-success/10 rounded"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setAddingFundsGoalId(null)}
                                className="p-0.5 text-danger hover:bg-danger/10 rounded"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingFundsGoalId(goal.id)}
                              className="text-[9px] font-extrabold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.75 rounded flex items-center gap-0.5 transition-colors"
                            >
                              <PiggyBank size={10} /> Poupar
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(`Deseja mesmo remover a meta ${goal.nome}?`)) {
                                deleteGoal(goal.id);
                              }
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                            title="Remover Meta"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Cadastre sua primeira meta financeira clicando no "+" acima.
                </p>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
