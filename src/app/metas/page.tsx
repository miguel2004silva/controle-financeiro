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
    addCategory,
    editCategory, 
    deleteCategory,
    addGoal, 
    editGoal, 
    deleteGoal,
    investmentMovements
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'orcamentos_metas' | 'categorias'>('orcamentos_metas');
  
  // Category management state
  const [newCatName, setNewCatName] = useState('');
  const [newCatBudget, setNewCatBudget] = useState('');
  const [newCatColor, setNewCatColor] = useState('#4F46E5');
  const [editingCatIdForManage, setEditingCatIdForManage] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatBudget, setEditCatBudget] = useState('');
  const [editCatColor, setEditCatColor] = useState('');

  const PREDEFINED_COLORS = [
    '#4F46E5', // Indigo
    '#10B981', // Emerald
    '#F43F5E', // Rose
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
    '#0EA5E9', // Sky
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ];

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

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await addCategory({
        nome: newCatName.trim(),
        cor: newCatColor,
        icone: 'circle',
        orçamento_mensal: newCatBudget ? Number(newCatBudget) : 0
      });
      setNewCatName('');
      setNewCatBudget('');
      setNewCatColor('#4F46E5');
    } catch (err) {
      console.error(err);
      alert('Erro ao criar categoria.');
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editCatName.trim()) return;
    try {
      await editCategory(id, {
        nome: editCatName.trim(),
        cor: editCatColor,
        orçamento_mensal: editCatBudget ? Number(editCatBudget) : 0
      });
      setEditingCatIdForManage(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar categoria.');
    }
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
        <h2 className="text-2xl font-black text-foreground tracking-tight">Metas e Orçamentos</h2>
        <p className="text-xs text-muted-foreground">Planeje suas despesas mensais e visualize seus sonhos de longo prazo</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/30 gap-6">
        <button
          onClick={() => setActiveTab('orcamentos_metas')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all relative ${
            activeTab === 'orcamentos_metas'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Orçamentos e Metas
        </button>
        <button
          onClick={() => setActiveTab('categorias')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all relative ${
            activeTab === 'categorias'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Gerenciar Categorias
        </button>
      </div>

      {activeTab === 'orcamentos_metas' ? (
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
                            className="bg-muted border border-border/60 rounded px-2 py-1 text-xs text-foreground font-mono w-24 text-right focus:outline-none"
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
                            <span className="text-xs font-mono font-extrabold text-foreground/90">
                              {formatBRL(cat.orçamento_mensal)}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setEditBudgetVal(String(cat.orçamento_mensal));
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-foreground"
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
                <h3 className="font-bold text-base text-foreground">Metas de Longo Prazo</h3>
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
                <h4 className="text-xs font-bold text-foreground/90">Nova Meta Financeira</h4>
                
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
                          <span className="font-extrabold text-foreground/90">{formatBRL(current)}</span>
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Create/Edit Category Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-5 relative overflow-hidden">
              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  {editingCatIdForManage ? <Edit2 size={16} className="text-primary" /> : <Plus size={16} className="text-primary" />}
                  {editingCatIdForManage ? 'Editar Categoria' : 'Nova Categoria'}
                </h3>
                {editingCatIdForManage && (
                  <button
                    onClick={() => {
                      setEditingCatIdForManage(null);
                      setNewCatName('');
                      setNewCatBudget('');
                      setNewCatColor('#4F46E5');
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-foreground"
                    title="Cancelar Edição"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <form onSubmit={editingCatIdForManage ? (e) => { e.preventDefault(); handleUpdateCategory(editingCatIdForManage); } : handleCreateCategory} className="space-y-4">
                {/* Category Name */}
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">
                    Nome da Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Alimentação, Transporte, Lazer..."
                    value={editingCatIdForManage ? editCatName : newCatName}
                    onChange={(e) => editingCatIdForManage ? setEditCatName(e.target.value) : setNewCatName(e.target.value)}
                    className="w-full bg-muted border border-border/60 rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                    required
                  />
                </div>

                {/* Monthly Budget */}
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">
                    Orçamento Mensal (R$ - Opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-xs font-bold text-muted-foreground">R$</span>
                    <input
                      type="number"
                      placeholder="0,00"
                      value={editingCatIdForManage ? editCatBudget : newCatBudget}
                      onChange={(e) => editingCatIdForManage ? setEditCatBudget(e.target.value) : setNewCatBudget(e.target.value)}
                      className="w-full bg-muted border border-border/60 rounded-xl py-3 pl-9 pr-3 text-xs text-foreground font-mono focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                {/* Color Selector */}
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">
                    Selecione uma Cor
                  </label>
                  
                  {/* Grid of premium circles */}
                  <div className="grid grid-cols-6 gap-2 mb-3">
                    {PREDEFINED_COLORS.map(color => {
                      const isSelected = editingCatIdForManage ? editCatColor === color : newCatColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => editingCatIdForManage ? setEditCatColor(color) : setNewCatColor(color)}
                          className="w-8 h-8 rounded-full border border-border/40 flex items-center justify-center transition-all relative hover:scale-105 active:scale-95"
                          style={{ backgroundColor: color }}
                        >
                          {isSelected && (
                            <span className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom color input wrapper */}
                  <div className="flex items-center gap-2">
                    <label className="text-[9px] text-muted-foreground font-bold uppercase">Ou cor personalizada:</label>
                    <input
                      type="color"
                      value={editingCatIdForManage ? editCatColor : newCatColor}
                      onChange={(e) => editingCatIdForManage ? setEditCatColor(e.target.value) : setNewCatColor(e.target.value)}
                      className="w-8 h-6 rounded cursor-pointer border border-border/60 bg-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold text-xs text-white bg-primary hover:opacity-90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
                >
                  {editingCatIdForManage ? 'Atualizar Categoria' : 'Criar Categoria'}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Category List (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-card border border-border/40 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border/30 bg-muted/10">
                <h3 className="font-bold text-sm text-foreground">Suas Categorias</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Todas as categorias criadas por você</p>
              </div>

              <div className="p-5 space-y-3">
                {categories.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6 font-semibold">Nenhuma categoria criada ainda.</p>
                ) : (
                  categories.map(cat => {
                    const isSystem = cat.nome === 'Investimentos' || cat.nome === 'Transferências';
                    return (
                      <div 
                        key={cat.id}
                        className="p-3 bg-muted border border-border/20 rounded-xl flex items-center justify-between transition-colors hover:border-border/40"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: cat.cor }}
                          >
                            <CategoryIcon name={cat.icone || 'circle'} size={15} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">{cat.nome}</p>
                            <p className="text-[9px] text-muted-foreground font-semibold">
                              Orçamento: {cat.orçamento_mensal > 0 ? formatBRL(cat.orçamento_mensal) : 'Não definido'}
                            </p>
                          </div>
                        </div>

                        {!isSystem && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCatIdForManage(cat.id);
                                setEditCatName(cat.nome);
                                setEditCatBudget(cat.orçamento_mensal ? String(cat.orçamento_mensal) : '');
                                setEditCatColor(cat.cor);
                              }}
                              className="p-1.5 rounded-lg bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja apagar a categoria "${cat.nome}"? As transações vinculadas a ela ficarão sem categoria.`)) {
                                  deleteCategory(cat.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-danger/5 hover:bg-danger/10 text-danger/80 hover:text-danger transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
