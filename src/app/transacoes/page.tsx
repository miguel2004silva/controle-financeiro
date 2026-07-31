'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '@/context/finance-context';
import { CategoryIcon } from '@/components/category-icon';
import { 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  FolderPlus,
  Palette
} from 'lucide-react';
import { FilterPanel, FilterState, initialFilterState } from '@/components/filter-panel';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function TransacoesPage() {
  const { 
    transactions, 
    categories, 
    editTransaction, 
    deleteTransaction,
    setTransactionModalOpen,
    selectedMonth,
    addCategory,
    editCategory,
    deleteCategory
  } = useFinance();

  const [mounted, setMounted] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>(initialFilterState);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editVal, setEditVal] = useState(0);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');

  // Category Manager Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#16A34A');
  const [newCatBudget, setNewCatBudget] = useState('');
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState('');
  const [editCatBudget, setEditCatBudget] = useState('');

  const PREDEFINED_COLORS = [
    '#16A34A', // Green
    '#10B981', // Emerald
    '#F43F5E', // Rose/Coral
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
    '#0EA5E9', // Sky
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#EF4444', // Red
  ];

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

  // Start inline editing
  const startEdit = (id: string, desc: string, val: number, catId: string | null, date: string) => {
    setEditingId(id);
    setEditDesc(desc);
    setEditVal(val);
    setEditCatId(catId);
    setEditDate(date.split('T')[0]);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    if (!editDesc.trim()) {
      alert('A descrição não pode ser vazia.');
      return;
    }
    if (editVal <= 0) {
      alert('O valor deve ser maior que zero.');
      return;
    }

    try {
      await editTransaction(id, {
        descrição: editDesc,
        valor: Number(editVal),
        categoria_id: editCatId || null,
        data: new Date(editDate + 'T12:00:00Z').toISOString()
      });
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar lançamento.');
    }
  };

  // ----------------------------------------------------
  // FILTERING TRANSACTIONS BY SELECTED MONTH
  // ----------------------------------------------------
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Respect the globally selected month from the context
      const tDate = new Date(t.data);
      const tYear = tDate.getUTCFullYear();
      const tMonth = tDate.getUTCMonth(); // 0-11
      
      const [fYear, fMonth] = selectedMonth.split('-').map(Number);
      const matchesMonth = tYear === fYear && (tMonth + 1) === fMonth;
      if (!matchesMonth) return false;

      // 2. Text search
      if (activeFilters.search) {
        const matchesSearch = t.descrição.toLowerCase().includes(activeFilters.search.toLowerCase());
        if (!matchesSearch) return false;
      }

      // 3. Type (receita / despesa / investimento)
      if (activeFilters.type !== 'todos') {
        if (activeFilters.type === 'investimento') {
          const cat = categories.find(c => c.id === t.categoria_id);
          const isInvCat = cat?.nome.toLowerCase() === 'investimentos';
          const hasInvMov = !!t.investment_movement_id;
          if (!isInvCat && !hasInvMov) return false;
        } else {
          if (t.tipo !== activeFilters.type) return false;
        }
      }

      // 4. Category (multi-select)
      if (activeFilters.selectedCategories.length > 0) {
        if (!t.categoria_id || !activeFilters.selectedCategories.includes(t.categoria_id)) {
          return false;
        }
      }

      // 5. Value Range
      if (activeFilters.minVal !== '') {
        if (t.valor < activeFilters.minVal) return false;
      }
      if (activeFilters.maxVal !== '') {
        if (t.valor > activeFilters.maxVal) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()); // ordered by date (most recent top)
  }, [transactions, activeFilters, categories, selectedMonth]);

  // ----------------------------------------------------
  // EXPENSE BY CATEGORY DONUT CHART DATA
  // ----------------------------------------------------
  const categoryExpenses = useMemo(() => {
    const map = new Map<string | null, number>();
    
    filteredTransactions
      .filter(t => t.tipo === 'despesa')
      .forEach(t => {
        const catId = t.categoria_id || null;
        map.set(catId, (map.get(catId) || 0) + Number(t.valor));
      });
      
    const result: Array<{ id: string; nome: string; cor: string; spent: number; percentage: number }> = [];
    const total = Array.from(map.values()).reduce((sum, v) => sum + v, 0);

    map.forEach((spent, catId) => {
      if (catId) {
        const cat = categories.find(c => c.id === catId);
        if (cat) {
          result.push({
            id: cat.id,
            nome: cat.nome,
            cor: cat.cor,
            spent,
            percentage: total > 0 ? (spent / total) * 100 : 0
          });
          return;
        }
      }
      result.push({
        id: 'sem-categoria',
        nome: 'Sem Categoria',
        cor: '#64748b',
        spent,
        percentage: total > 0 ? (spent / total) * 100 : 0
      });
    });
    
    return result.sort((a, b) => b.spent - a.spent);
  }, [filteredTransactions, categories]);

  const totalSpent = useMemo(() => {
    return categoryExpenses.reduce((sum, item) => sum + item.spent, 0);
  }, [categoryExpenses]);

  // ----------------------------------------------------
  // CATEGORIES MANAGER ACTION SUBMITTERS
  // ----------------------------------------------------
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
      setNewCatColor('#16A34A');
    } catch (err) {
      console.error(err);
      alert('Erro ao criar categoria.');
    }
  };

  const startEditCategory = (cat: any) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.nome);
    setEditCatColor(cat.cor);
    setEditCatBudget(String(cat.orçamento_mensal || 0));
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editCatName.trim()) return;
    try {
      await editCategory(id, {
        nome: editCatName.trim(),
        cor: editCatColor,
        orçamento_mensal: editCatBudget ? Number(editCatBudget) : 0
      });
      setEditingCatId(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar categoria.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria? Os lançamentos associados a ela ficarão "Sem Categoria".')) {
      try {
        await deleteCategory(id);
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir categoria.');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header and Manager Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">Registro de Transações</h2>
          <p className="text-xs text-muted-foreground/70 mt-0.5">Monitore e filtre todos os lançamentos do mês selecionado</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="flex-1 sm:flex-initial text-xs font-bold px-4 py-2 border border-border/20 rounded-xl bg-card text-foreground hover:bg-muted flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Settings size={14} />
            Categorias
          </button>
          <button
            onClick={() => setTransactionModalOpen(true)}
            className="flex-1 sm:flex-initial shiny-btn gap-1.5 py-2 px-4 text-xs font-bold"
          >
            <Plus size={14} />
            Lançar
          </button>
        </div>
      </div>

      {/* Two Column Layout: Charts/Stats (1 col) and List/Table (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Donut Chart of Expenses */}
        <div className="bento-card border border-border bg-card/90 flex flex-col justify-between h-fit lg:sticky lg:top-20">
          <div>
            <h3 className="font-extrabold text-base text-foreground tracking-tight">Despesas do Mês</h3>
            <p className="text-xs text-muted-foreground/70 mt-0.5">Soma de gastos agrupados por categorias neste período</p>
          </div>

          <div className="h-[180px] my-6 flex items-center justify-center relative">
            {mounted && categoryExpenses.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryExpenses}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="spent"
                      nameKey="nome"
                    >
                      {categoryExpenses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} style={{ outline: 'none' }} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--foreground)',
                        fontFamily: 'Sora, sans-serif'
                      }}
                      itemStyle={{ color: 'var(--foreground)', fontSize: '12px' }}
                      formatter={(val: any, name: any) => [formatBRL(Number(val)), name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center">
                  <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Total Gasto</p>
                  <p className="text-lg font-extrabold text-foreground leading-tight my-0.5">{formatBRL(totalSpent)}</p>
                  <p className="text-[9px] text-muted-foreground font-medium">no período</p>
                </div>
              </>
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-border/20 flex items-center justify-center">
                <span className="text-xs text-muted-foreground font-medium">Nenhum gasto</span>
              </div>
            )}
          </div>

          {/* Legends list */}
          <div className="space-y-2">
            {categoryExpenses.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground flex items-center gap-2 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.cor }} />
                  {item.nome}
                </span>
                <span className="font-bold text-foreground">
                  {formatBRL(item.spent)} <span className="text-[10px] text-muted-foreground/60 font-normal">({item.percentage.toFixed(0)}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Columns: Table and Filters */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filters */}
          <FilterPanel 
            categories={categories}
            onFilterChange={setActiveFilters}
          />

          {/* Table container */}
          <div className="bento-card border border-border bg-card/90 overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="shadcn-table w-full text-left">
                <thead>
                  <tr>
                    <th className="py-3.5 px-4">Categoria</th>
                    <th className="py-3.5 px-4">Descrição</th>
                    <th className="py-3.5 px-4">Data</th>
                    <th className="py-3.5 px-4 text-right">Valor</th>
                    <th className="py-3.5 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/15 text-xs">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => {
                      const cat = categories.find(c => c.id === tx.categoria_id);
                      const isEditing = editingId === tx.id;
                      const isRevenue = tx.tipo === 'receita';

                      return (
                        <tr 
                          key={tx.id}
                          className={`transition-colors ${
                            isEditing ? 'bg-muted/40' : ''
                          }`}
                        >
                          {/* Category cell */}
                          <td className="py-3.5 px-4">
                            {isEditing && tx.tipo === 'despesa' ? (
                              <select
                                value={editCatId || ''}
                                onChange={(e) => setEditCatId(e.target.value || null)}
                                className="shadcn-input p-1.5 text-xs focus:outline-none w-32"
                              >
                                <option value="">Nenhuma</option>
                                {categories.filter(c => c.nome !== 'Investimentos').map(c => (
                                  <option key={c.id} value={c.id}>{c.nome}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="flex items-center gap-2.5">
                                 <div 
                                   className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                                   style={{ backgroundColor: cat?.cor || (isRevenue ? '#16A34A' : '#E11D48') }}
                                 >
                                   {cat ? (
                                     <CategoryIcon name={cat.icone || 'circle'} size={14} />
                                   ) : isRevenue ? (
                                     <ArrowUpRight size={14} />
                                   ) : (
                                     <ArrowDownRight size={14} />
                                   )}
                                 </div>
                                 <span className="font-bold text-foreground truncate">
                                   {cat?.nome || (isRevenue ? 'Receita' : 'Despesa')}
                                 </span>
                              </div>
                            )}
                          </td>

                          {/* Description cell */}
                          <td className="py-3.5 px-4 font-medium">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="shadcn-input px-2 py-1 text-xs w-full max-w-[200px]"
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-foreground font-semibold">{tx.descrição}</span>
                                {tx.recorrente && (
                                  <span className="badge-indigo text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">
                                    Fixo
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Date cell */}
                          <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap font-medium">
                            {isEditing ? (
                              <input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="shadcn-input p-1 text-xs"
                              />
                            ) : (
                              new Date(tx.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                            )}
                          </td>

                          {/* Value cell */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center justify-end">
                                <span className="text-muted-foreground mr-1 text-xs">R$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editVal}
                                  onChange={(e) => setEditVal(Number(e.target.value))}
                                  className="shadcn-input px-1.5 py-1 text-xs w-24 text-right font-bold"
                                />
                              </div>
                            ) : (
                              <span className={`font-extrabold inline-block px-2.5 py-0.5 rounded-full text-xs ${isRevenue ? 'badge-emerald' : 'badge-rose'}`}>
                                {isRevenue ? '+' : '-'} {formatBRL(Number(tx.valor))}
                              </span>
                            )}
                          </td>

                          {/* Actions cell */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => saveEdit(tx.id)}
                                    className="p-1.5 rounded-lg border border-border/20 bg-emerald-500 text-white hover:opacity-90 transition-all shadow-sm"
                                    title="Salvar"
                                  >
                                    <Check size={13} />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="p-1.5 rounded-lg border border-border/20 bg-rose-500 text-white hover:opacity-90 transition-all shadow-sm"
                                    title="Cancelar"
                                  >
                                    <X size={13} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  {!tx.investment_movement_id ? (
                                    <button
                                      onClick={() => startEdit(tx.id, tx.descrição, Number(tx.valor), tx.categoria_id, tx.data)}
                                      className="p-1.5 border border-border/20 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                      title="Editar"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                  ) : (
                                    <span 
                                      className="p-1.5 border border-border/10 rounded-xl text-muted-foreground/30 cursor-not-allowed bg-muted/20"
                                      title="Transação vinculada a investimento. Edite ou remova o ativo na aba de Investimentos."
                                    >
                                      <Edit2 size={13} />
                                    </span>
                                  )}
                                  <button
                                    onClick={() => deleteTransaction(tx.id)}
                                    className="p-1.5 border border-border/20 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                    title="Excluir"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground font-medium">
                        Nenhuma transação lançada neste mês.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* CATEGORIES MANAGEMENT MODAL */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsCatModalOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

          <div className="bg-card border border-border/20 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative z-10 animate-scale-in max-h-[85vh] overflow-y-auto">
            <button onClick={() => setIsCatModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-muted transition-colors">
              <X size={18} />
            </button>

            <h3 className="font-extrabold text-lg text-foreground mb-1 flex items-center gap-2">
              <Settings size={18} className="text-foreground" />
              Gerenciar Categorias
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Defina cores fixas e limites de orçamento mensais para cada categoria de despesa.
            </p>

            {/* Nova Categoria Form */}
            <form onSubmit={handleCreateCategory} className="bg-muted/40 border border-border/20 rounded-xl p-4 mb-6 space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1"><FolderPlus size={13} /> Nova Categoria</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input 
                  type="text" 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nome"
                  className="shadcn-input text-xs w-full"
                  required
                />
                <input 
                  type="number" 
                  value={newCatBudget}
                  onChange={(e) => setNewCatBudget(e.target.value)}
                  placeholder="Orçamento (Opcional)"
                  className="shadcn-input text-xs w-full"
                />
                
                {/* Color Selector */}
                <div className="flex items-center gap-2">
                  <Palette size={14} className="text-muted-foreground shrink-0" />
                  <select 
                    value={newCatColor} 
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="shadcn-input text-xs w-full p-1.5"
                    style={{ borderLeft: `4px solid ${newCatColor}` }}
                  >
                    {PREDEFINED_COLORS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button 
                type="submit"
                className="shiny-btn w-full py-2 text-xs font-bold flex items-center justify-center gap-1"
              >
                <Plus size={12} /> Criar Categoria
              </button>
            </form>

            {/* List and Edit Existing Categories */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Categorias Cadastradas</h4>
              <div className="space-y-2">
                {categories.filter(c => c.nome !== 'Investimentos' && c.nome !== 'Receitas').map(cat => {
                  const isCatEditing = editingCatId === cat.id;

                  return (
                    <div 
                      key={cat.id} 
                      className="p-3 border border-border/20 rounded-xl flex items-center justify-between gap-3 bg-card"
                    >
                      {isCatEditing ? (
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input 
                            type="text" 
                            value={editCatName} 
                            onChange={(e) => setEditCatName(e.target.value)}
                            className="shadcn-input text-xs py-1"
                            required
                          />
                          <input 
                            type="number" 
                            value={editCatBudget} 
                            onChange={(e) => setEditCatBudget(e.target.value)}
                            className="shadcn-input text-xs py-1"
                            placeholder="Orçamento"
                          />
                          <select 
                            value={editCatColor} 
                            onChange={(e) => setEditCatColor(e.target.value)}
                            className="shadcn-input text-xs py-1"
                          >
                            {PREDEFINED_COLORS.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cat.cor }} />
                          <span className="text-xs font-bold text-foreground">{cat.nome}</span>
                          {cat.orçamento_mensal > 0 && (
                            <span className="text-[10px] text-muted-foreground font-medium">({formatBRL(cat.orçamento_mensal)} /mês)</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        {isCatEditing ? (
                          <>
                            <button 
                              onClick={() => handleUpdateCategory(cat.id)}
                              className="p-1 rounded bg-emerald-500 text-white hover:opacity-90"
                            >
                              <Check size={12} />
                            </button>
                            <button 
                              onClick={() => setEditingCatId(null)}
                              className="p-1 rounded bg-rose-500 text-white hover:opacity-90"
                            >
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => startEditCategory(cat)}
                              className="p-1.5 border border-border/20 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1.5 border border-border/20 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
