'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/finance-context';
import { CategoryIcon } from '@/components/category-icon';
import { 
  Search, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Filter, 
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function TransacoesPage() {
  const { 
    transactions, 
    categories, 
    editTransaction, 
    deleteTransaction,
    setTransactionModalOpen 
  } = useFinance();

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editVal, setEditVal] = useState(0);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');

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
    // Format date string from full ISO back to YYYY-MM-DD for input field
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
        data: new Date(editDate + 'T12:00:00Z').toISOString() // Set UTC midday to avoid TZ offset issues
      });
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar lançamento.');
    }
  };

  // ----------------------------------------------------
  // FILTERING TRANSACTIONS
  // ----------------------------------------------------
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.descrição.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'todos' ? true : t.tipo === typeFilter;
    const matchesCategory = categoryFilter === 'todas' ? true : t.categoria_id === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Transações</h2>
          <p className="text-xs text-muted-foreground">Histórico e gerenciamento de todos os seus lançamentos</p>
        </div>
        <button
          onClick={() => setTransactionModalOpen(true)}
          className="w-full sm:w-auto py-2.5 px-4 rounded-xl font-bold text-xs text-white gradient-accent hover:opacity-90 flex items-center justify-center gap-2 transition-all glow-primary shadow-md shadow-primary/10"
        >
          <Plus size={16} />
          Nova Transação
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Pesquisar por descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-muted border border-border/50 rounded-xl pl-10 pr-4 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:ml-auto">
          {/* Type togglers */}
          <div className="flex bg-muted p-0.5 rounded-lg border border-border/30 w-full sm:w-auto">
            {(['todos', 'receita', 'despesa'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`flex-1 sm:flex-initial py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                  typeFilter === t
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'todos' ? 'Todos' : t === 'receita' ? 'Receitas' : 'Despesas'}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="relative w-full sm:w-44 flex items-center bg-muted border border-border/50 rounded-xl px-3 py-1.5 text-xs text-muted-foreground">
            <Filter size={12} className="mr-2" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-foreground/90 focus:outline-none w-full cursor-pointer pr-4"
            >
              <option value="todas">Todas as categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="bg-card border border-border/40 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground font-black">
                <th className="py-3.5 px-5">Categoria</th>
                <th className="py-3.5 px-5">Descrição</th>
                <th className="py-3.5 px-5 font-mono">Data</th>
                <th className="py-3.5 px-5 text-right font-mono">Valor</th>
                <th className="py-3.5 px-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20 text-xs">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => {
                  const cat = categories.find(c => c.id === tx.categoria_id);
                  const isEditing = editingId === tx.id;
                  const isRevenue = tx.tipo === 'receita';

                  return (
                    <tr 
                      key={tx.id}
                      className={`hover:bg-muted/10 transition-colors ${
                        isEditing ? 'bg-primary/5' : ''
                      }`}
                    >
                      {/* Category cell */}
                      <td className="py-3.5 px-5">
                        {isEditing && tx.tipo === 'despesa' ? (
                          <select
                            value={editCatId || ''}
                            onChange={(e) => setEditCatId(e.target.value || null)}
                            className="bg-muted border border-border/60 rounded-lg p-1.5 text-xs text-foreground/90 focus:outline-none w-32"
                          >
                            <option value="">Nenhuma</option>
                            {categories.filter(c => c.nome !== 'Investimentos').map(c => (
                              <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                              style={{ backgroundColor: cat?.cor || '#6B7280' }}
                            >
                              <CategoryIcon name={cat?.icone || 'circle'} size={14} />
                            </div>
                            <span className="font-bold text-foreground/90 truncate">{cat?.nome || 'Entrada/Outros'}</span>
                          </div>
                        )}
                      </td>

                      {/* Description cell */}
                      <td className="py-3.5 px-5 font-medium">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="bg-muted border border-border/60 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none w-full max-w-[200px]"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-bold">{tx.descrição}</span>
                            {tx.recorrente && (
                              <span className="text-[7px] font-black uppercase tracking-widest bg-muted px-1.5 py-0.25 rounded text-muted-foreground shrink-0">
                                Fixo
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Date cell */}
                      <td className="py-3.5 px-5 font-mono text-muted-foreground whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="bg-muted border border-border/60 rounded-lg p-1 text-xs text-foreground focus:outline-none font-mono"
                          />
                        ) : (
                          new Date(tx.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                        )}
                      </td>

                      {/* Value cell */}
                      <td className="py-3.5 px-5 text-right font-mono font-extrabold whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-end">
                            <span className="text-muted-foreground mr-1">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={editVal}
                              onChange={(e) => setEditVal(Number(e.target.value))}
                              className="bg-muted border border-border/60 rounded-lg px-1.5 py-1 text-xs text-foreground focus:outline-none w-20 text-right font-mono"
                            />
                          </div>
                        ) : (
                          <span className={isRevenue ? 'text-success' : 'text-foreground/80'}>
                            {isRevenue ? '+' : '-'} {formatBRL(Number(tx.valor))}
                          </span>
                        )}
                      </td>

                      {/* Actions cell */}
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(tx.id)}
                                className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                                title="Salvar"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                                title="Cancelar"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              {!tx.investment_movement_id ? (
                                <button
                                  onClick={() => startEdit(tx.id, tx.descrição, Number(tx.valor), tx.categoria_id, tx.data)}
                                  className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 size={13} />
                                </button>
                              ) : (
                                <span 
                                  className="p-1.5 rounded-lg bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
                                  title="Transação vinculada a investimento. Edite ou remova o ativo na aba de Investimentos."
                                >
                                  <Edit2 size={13} />
                                </span>
                              )}
                              <button
                                onClick={() => deleteTransaction(tx.id)}
                                className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
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
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    Nenhuma transação encontrada com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
