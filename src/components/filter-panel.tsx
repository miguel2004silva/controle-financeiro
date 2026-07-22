'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, Search, Calendar, DollarSign, RefreshCw, Check } from 'lucide-react';
import { Category } from '@/lib/types';

export interface FilterState {
  search: string;
  type: string; // 'todos', 'receita', 'despesa', 'investimento' OR 'todos', 'renda_fixa', 'ação', 'fii', 'cripto'
  periodType: 'todos' | 'dia' | 'mes' | 'ano' | 'personalizado';
  selectedDate: string;
  selectedMonth: string;
  selectedYear: string;
  startDate: string;
  endDate: string;
  selectedCategories: string[]; // IDs
  minVal: number | '';
  maxVal: number | '';
}

export const initialFilterState: FilterState = {
  search: '',
  type: 'todos',
  periodType: 'todos',
  selectedDate: new Date().toISOString().split('T')[0],
  selectedMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
  selectedYear: new Date().getFullYear().toString(),
  startDate: '',
  endDate: '',
  selectedCategories: [],
  minVal: '',
  maxVal: '',
};

interface FilterPanelProps {
  categories?: Category[];
  isInvestmentsPage?: boolean;
  onFilterChange: (filters: FilterState) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  categories = [],
  isInvestmentsPage = false,
  onFilterChange,
}) => {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [isOpen, setIsOpen] = useState(false); // Collapsible on desktop / Drawer on mobile
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Trigger callback when filters state changes
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Click outside handler for category dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = () => {
    setFilters(initialFilterState);
  };

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setFilters((prev) => {
      const selected = prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter((id) => id !== categoryId)
        : [...prev.selectedCategories, categoryId];
      return {
        ...prev,
        selectedCategories: selected,
      };
    });
  };

  // Count active filters to display in the badge
  const activeFiltersCount = (() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.type !== 'todos') count++;
    if (filters.periodType !== 'todos') count++;
    if (filters.selectedCategories.length > 0) count++;
    if (filters.minVal !== '' || filters.maxVal !== '') count++;
    return count;
  })();

  const renderFilterContent = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 p-5">
        {/* Column 1: Search & Type */}
        <div className="space-y-3.5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
              Busca por texto
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder={isInvestmentsPage ? "Pesquisar ticker..." : "Pesquisar descrição..."}
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full bg-muted/60 border border-border/60 rounded-xl pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
              Tipo
            </label>
            <select
              value={filters.type}
              onChange={(e) => updateFilter('type', e.target.value)}
              className="w-full bg-muted/60 border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50"
            >
              {isInvestmentsPage ? (
                <>
                  <option value="todos">Todos os tipos</option>
                  <option value="renda_fixa">Renda Fixa</option>
                  <option value="ação">Ações</option>
                  <option value="fii">FIIs</option>
                  <option value="cripto">Cripto</option>
                </>
              ) : (
                <>
                  <option value="todos">Todos os lançamentos</option>
                  <option value="receita">Receitas</option>
                  <option value="despesa">Despesas</option>
                  <option value="investimento">Investimentos</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Column 2: Period */}
        <div className="space-y-3.5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
              Período
            </label>
            <select
              value={filters.periodType}
              onChange={(e) => updateFilter('periodType', e.target.value as any)}
              className="w-full bg-muted/60 border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50"
            >
              <option value="todos">Todo o histórico</option>
              <option value="dia">Dia específico</option>
              <option value="mes">Mês específico</option>
              <option value="ano">Ano específico</option>
              <option value="personalizado">Intervalo personalizado</option>
            </select>
          </div>

          {/* Conditional Date Fields */}
          {filters.periodType === 'dia' && (
            <div className="animate-fade-in">
              <label className="text-[10px] font-semibold text-muted-foreground block mb-1 flex items-center gap-1">
                <Calendar size={10} /> Data
              </label>
              <input
                type="date"
                value={filters.selectedDate}
                onChange={(e) => updateFilter('selectedDate', e.target.value)}
                className="w-full bg-muted/60 border border-border/60 rounded-xl px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none"
              />
            </div>
          )}

          {filters.periodType === 'mes' && (
            <div className="animate-fade-in">
              <label className="text-[10px] font-semibold text-muted-foreground block mb-1 flex items-center gap-1">
                <Calendar size={10} /> Mês
              </label>
              <input
                type="month"
                value={filters.selectedMonth}
                onChange={(e) => updateFilter('selectedMonth', e.target.value)}
                className="w-full bg-muted/60 border border-border/60 rounded-xl px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none"
              />
            </div>
          )}

          {filters.periodType === 'ano' && (
            <div className="animate-fade-in">
              <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Ano</label>
              <select
                value={filters.selectedYear}
                onChange={(e) => updateFilter('selectedYear', e.target.value)}
                className="w-full bg-muted/60 border border-border/60 rounded-xl px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((yr) => (
                  <option key={yr} value={yr.toString()}>{yr}</option>
                ))}
              </select>
            </div>
          )}

          {filters.periodType === 'personalizado' && (
            <div className="grid grid-cols-2 gap-2 animate-fade-in">
              <div>
                <label className="text-[9px] font-semibold text-muted-foreground block mb-1">Início</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => updateFilter('startDate', e.target.value)}
                  className="w-full bg-muted/60 border border-border/60 rounded-xl px-2 py-1 text-xs text-foreground font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-semibold text-muted-foreground block mb-1">Fim</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => updateFilter('endDate', e.target.value)}
                  className="w-full bg-muted/60 border border-border/60 rounded-xl px-2 py-1 text-xs text-foreground font-mono focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Category (Multiple) */}
        {!isInvestmentsPage ? (
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
              Categorias ({filters.selectedCategories.length} selecionadas)
            </label>
            <div className="relative" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="w-full bg-muted/60 border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground flex items-center justify-between focus:outline-none hover:border-border transition-colors text-left"
              >
                <span className="truncate">
                  {filters.selectedCategories.length === 0
                    ? 'Todas as categorias'
                    : `${filters.selectedCategories.length} selecionadas`}
                </span>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isCategoryDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-30 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl overflow-y-auto max-h-56 p-2 space-y-1 glassmorphism"
                  >
                    {categories.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground p-2 text-center">Nenhuma categoria cadastrada</p>
                    ) : (
                      categories.map((cat) => {
                        const isSelected = filters.selectedCategories.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors hover:bg-muted ${
                              isSelected ? 'bg-primary/10 text-primary font-bold' : 'text-foreground/80'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.cor }} />
                              <span className="truncate">{cat.nome}</span>
                            </div>
                            {isSelected && <Check size={12} className="text-primary" />}
                          </button>
                        );
                      })
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Quick badges of active categories */}
            {filters.selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 max-h-16 overflow-y-auto pr-1">
                {filters.selectedCategories.map((id) => {
                  const cat = categories.find((c) => c.id === id);
                  if (!cat) return null;
                  return (
                    <span
                      key={id}
                      onClick={() => toggleCategory(id)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-white cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: cat.cor }}
                    >
                      {cat.nome}
                      <X size={8} />
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col justify-center h-full">
            <span className="text-[10px] italic text-muted-foreground text-center py-4 bg-muted/20 border border-dashed border-border/40 rounded-xl">
              Filtro de categoria indisponível para ativos
            </span>
          </div>
        )}

        {/* Column 4: Value Min & Max */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
            Faixa de Valor (R$)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">Min</span>
              <input
                type="number"
                placeholder="0,00"
                value={filters.minVal}
                onChange={(e) => updateFilter('minVal', e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-muted/60 border border-border/60 rounded-xl pl-9 pr-2 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">Max</span>
              <input
                type="number"
                placeholder="∞"
                value={filters.maxVal}
                onChange={(e) => updateFilter('maxVal', e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-muted/60 border border-border/60 rounded-xl pl-9 pr-2 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Reset button at the bottom of the grid */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground hover:text-danger hover:bg-danger/5 px-3 py-1.5 rounded-lg border border-border/60 hover:border-danger/20 transition-all"
            >
              <RefreshCw size={10} />
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-3">
      {/* Desktop & Mobile Top Bar Trigger */}
      <div className="flex items-center justify-between bg-card border border-border/40 rounded-2xl p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Filter size={14} />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground">Filtros Avançados</span>
            {activeFiltersCount > 0 && (
              <span className="ml-2 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1.5 bg-danger/5 border border-danger/10 hover:border-danger/30 text-danger text-[10px] font-black rounded-lg transition-colors flex items-center gap-1"
            >
              Limpar
            </button>
          )}

          {/* Desktop Toggle Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold rounded-lg border border-border/40"
          >
            {isOpen ? 'Recolher Filtros' : 'Expandir Filtros'}
            <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Mobile Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold rounded-lg border border-border/40"
          >
            Filtros
          </button>
        </div>
      </div>

      {/* Desktop Expandable Panel */}
      <div className="hidden md:block">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="bg-card border border-border/40 rounded-2xl shadow-sm overflow-hidden"
            >
              {renderFilterContent()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Drawer (Bottom Sheet) */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex items-end justify-center">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative z-10 w-full max-h-[85vh] bg-card border-t border-border rounded-t-2xl shadow-2xl flex flex-col glassmorphism"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Filter size={14} className="text-primary" />
                  Filtrar Lançamentos
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="overflow-y-auto flex-1 pb-6">
                {renderFilterContent()}
              </div>

              {/* Drawer Footer Action */}
              <div className="p-4 border-t border-border/50 bg-muted/20 flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-1/3 py-3 border border-border/60 text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-2/3 py-3 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/10 flex items-center justify-center gap-1"
                >
                  Aplicar Filtros
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
