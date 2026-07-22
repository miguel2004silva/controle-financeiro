'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/finance-context';
import { CategoryIcon } from '@/components/category-icon';
import { 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { FilterPanel, FilterState, initialFilterState } from '@/components/filter-panel';

export default function TransacoesPage() {
  const { 
    transactions, 
    categories, 
    editTransaction, 
    deleteTransaction,
    setTransactionModalOpen 
  } = useFinance();

  // Search and Filter States
  const [activeFilters, setActiveFilters] = useState<FilterState>(initialFilterState);

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
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Text search
      if (activeFilters.search) {
        const matchesSearch = t.descrição.toLowerCase().includes(activeFilters.search.toLowerCase());
        if (!matchesSearch) return false;
      }

      // 2. Type (receita / despesa / investimento)
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

      // 3. Category (multi-select)
      if (activeFilters.selectedCategories.length > 0) {
        if (!t.categoria_id || !activeFilters.selectedCategories.includes(t.categoria_id)) {
          return false;
        }
      }

      // 4. Value Range
      if (activeFilters.minVal !== '') {
        if (t.valor < activeFilters.minVal) return false;
      }
      if (activeFilters.maxVal !== '') {
        if (t.valor > activeFilters.maxVal) return false;
      }

      // 5. Date Period
      if (activeFilters.periodType !== 'todos') {
        const tDate = new Date(t.data);
        const tYear = tDate.getUTCFullYear();
        const tMonth = tDate.getUTCMonth();
        const tDay = tDate.getUTCDate();

        if (activeFilters.periodType === 'dia') {
          const filterDate = new Date(activeFilters.selectedDate + 'T00:00:00Z');
          const isSameDay = tYear === filterDate.getUTCFullYear() &&
                            tMonth === filterDate.getUTCMonth() &&
                            tDay === filterDate.getUTCDate();
          if (!isSameDay) return false;
        } else if (activeFilters.periodType === 'mes') {
          const [fYear, fMonth] = activeFilters.selectedMonth.split('-').map(Number);
          const isSameMonth = tYear === fYear && (tMonth + 1) === fMonth;
          if (!isSameMonth) return false;
        } else if (activeFilters.periodType === 'ano') {
          const fYear = Number(activeFilters.selectedYear);
          const isSameYear = tYear === fYear;
          if (!isSameYear) return false;
        } else if (activeFilters.periodType === 'personalizado') {
          if (activeFilters.startDate) {
            const start = new Date(activeFilters.startDate + 'T00:00:00Z');
            if (tDate < start) return false;
          }
          if (activeFilters.endDate) {
            const end = new Date(activeFilters.endDate + 'T23:59:59Z');
            if (tDate > end) return false;
          }
        }
      }

      return true;
    });
  }, [transactions, activeFilters, categories]);

  return (
    <div className="space-y-6">
      
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-serif">Transações</h2>
          <p className="text-xs text-muted-foreground font-serif">Histórico e gerenciamento de todos os seus lançamentos de caixa</p>
        </div>
        <button
          onClick={() => setTransactionModalOpen(true)}
          className="w-full sm:w-auto retro-btn retro-btn-primary"
        >
          <Plus size={14} />
          Nova Transação
        </button>
      </div>

      {/* Filter and Search Panel */}
      <FilterPanel 
        categories={categories}
        onFilterChange={setActiveFilters}
      />


      {/* Transactions Table Card */}
      <div className="bg-card premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="retro-table w-full text-left">
            <thead>
              <tr>
                <th className="py-3 px-4 font-serif">Categoria</th>
                <th className="py-3 px-4 font-serif">Descrição</th>
                <th className="py-3 px-4 font-serif font-mono-retro">Data</th>
                <th className="py-3 px-4 font-serif font-mono-retro text-right">Valor</th>
                <th className="py-3 px-4 font-serif text-center">Ações</th>
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
                      <td className="py-3 px-4">
                        {isEditing && tx.tipo === 'despesa' ? (
                          <select
                            value={editCatId || ''}
                            onChange={(e) => setEditCatId(e.target.value || null)}
                            className="retro-input p-1.5 text-xs focus:outline-none w-32"
                          >
                            <option value="">Nenhuma</option>
                            {categories.filter(c => c.nome !== 'Investimentos').map(c => (
                              <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                             <div 
                               className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 border border-border/20 shadow-[1px_1px_0px_0px_var(--border)]"
                               style={{ backgroundColor: cat?.cor || (isRevenue ? '#10B981' : '#F43F5E') }}
                             >
                               {cat ? (
                                 <CategoryIcon name={cat.icone || 'circle'} size={14} />
                               ) : isRevenue ? (
                                 <ArrowUpRight size={14} />
                               ) : (
                                 <ArrowDownRight size={14} />
                               )}
                             </div>
                             <span className="font-bold text-foreground/90 truncate">
                               {cat?.nome || (isRevenue ? 'Receita/Outros' : 'Despesa/Outros')}
                             </span>
                          </div>
                        )}
                      </td>

                      {/* Description cell */}
                      <td className="py-3 px-4 font-medium">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="retro-input px-2 py-1 text-xs w-full max-w-[200px]"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-bold">{tx.descrição}</span>
                            {tx.recorrente && (
                              <span className="text-[8px] font-bold uppercase tracking-wider bg-muted border border-border/40 px-1.5 py-0.25 rounded text-muted-foreground shrink-0">
                                Fixo
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Date cell */}
                      <td className="py-3 px-4 font-mono-retro text-muted-foreground whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="retro-input p-1 text-xs font-mono-retro"
                          />
                        ) : (
                          new Date(tx.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                        )}
                      </td>

                      {/* Value cell */}
                      <td className="py-3 px-4 text-right font-mono-retro whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-end">
                            <span className="text-muted-foreground mr-1">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={editVal}
                              onChange={(e) => setEditVal(Number(e.target.value))}
                              className="retro-input px-1.5 py-1 text-xs w-20 text-right font-mono-retro"
                            />
                          </div>
                        ) : (
                          <span className={`font-bold ${isRevenue ? 'text-success' : 'text-foreground/80'}`}>
                            {isRevenue ? '+' : '-'} {formatBRL(Number(tx.valor))}
                          </span>
                        )}
                      </td>

                      {/* Actions cell */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(tx.id)}
                                className="p-1 rounded border-2 border-border bg-success text-white hover:opacity-90"
                                title="Salvar"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1 rounded border-2 border-border bg-danger text-white hover:opacity-90"
                                title="Cancelar"
                              >
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <>
                              {!tx.investment_movement_id ? (
                                <button
                                  onClick={() => startEdit(tx.id, tx.descrição, Number(tx.valor), tx.categoria_id, tx.data)}
                                  className="p-1 border border-border/40 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                  title="Editar"
                                >
                                  <Edit2 size={12} />
                                </button>
                              ) : (
                                <span 
                                  className="p-1 border border-border/10 rounded text-muted-foreground/30 cursor-not-allowed bg-muted/20"
                                  title="Transação vinculada a investimento. Edite ou remova o ativo na aba de Investimentos."
                                >
                                  <Edit2 size={12} />
                                </span>
                              )}
                              <button
                                onClick={() => deleteTransaction(tx.id)}
                                className="p-1 border border-border/40 rounded text-muted-foreground hover:text-danger hover:bg-muted"
                                title="Excluir"
                              >
                                <Trash2 size={12} />
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
                  <td colSpan={5} className="py-12 text-center text-muted-foreground font-serif">
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
