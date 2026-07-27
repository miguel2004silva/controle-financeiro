'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Calendar, AlignLeft, Check, ChevronDown, FolderPlus } from 'lucide-react';
import { useFinance } from '@/context/finance-context';
import { CategoryIcon } from './category-icon';
import { Category } from '@/lib/types';

const transactionSchema = z.object({
  valor: z.preprocess(
    (val) => Number(val),
    z.number().positive('O valor deve ser maior que zero')
  ),
  descrição: z.string().min(1, 'A descrição é obrigatória'),
  tipo: z.enum(['receita', 'despesa']),
  categoria_nome: z.string().min(1, 'A categoria é obrigatória'),
  data: z.string().min(1, 'A data é obrigatória'),
  recorrente: z.boolean().default(false),
});

const ICON_OPTIONS = [
  { name: 'utensils', label: 'Alimentação' },
  { name: 'car', label: 'Transporte' },
  { name: 'home', label: 'Moradia' },
  { name: 'tv', label: 'Lazer' },
  { name: 'trending-up', label: 'Investimentos' },
  { name: 'shopping-bag', label: 'Compras' },
  { name: 'dollar-sign', label: 'Receita' },
  { name: 'coffee', label: 'Café' },
  { name: 'activity', label: 'Saúde' },
  { name: 'gift', label: 'Presente' },
  { name: 'circle', label: 'Outros' }
];

const PREDEFINED_COLORS = [
  '#4F46E5', // Indigo
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

export const QuickTransactionModal: React.FC = () => {
  const { 
    isTransactionModalOpen, 
    setTransactionModalOpen, 
    categories, 
    addTransaction,
    addCategory
  } = useFinance();

  // Local Category States
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  
  // New Category inline form states
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#4F46E5');
  const [newCatIcon, setNewCatIcon] = useState('circle');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<any>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      valor: undefined,
      descrição: '',
      tipo: 'despesa',
      categoria_nome: '',
      data: new Date().toISOString().split('T')[0],
      recorrente: false,
    }
  });

  const selectedTipo = watch('tipo');

  // Reset form when modal closes or opens
  useEffect(() => {
    if (isTransactionModalOpen) {
      reset({
        valor: undefined,
        descrição: '',
        tipo: 'despesa',
        categoria_nome: '',
        data: new Date().toISOString().split('T')[0],
        recorrente: false,
      });
      setSelectedCatId('');
      setIsDropdownOpen(false);
      setIsCreatingCat(false);
      setNewCatName('');
      setNewCatColor('#4F46E5');
      setNewCatIcon('circle');
    }
  }, [isTransactionModalOpen, reset]);

  // Click outside for custom category dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCategory = (cat: Category) => {
    setSelectedCatId(cat.id);
    setValue('categoria_nome', cat.nome, { shouldValidate: true });
    setIsDropdownOpen(false);
  };

  const handleCreateCategoryInline = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      alert('Informe o nome da categoria.');
      return;
    }

    try {
      const createdId = await addCategory({
        nome: newCatName.trim(),
        cor: newCatColor,
        icone: newCatIcon,
        orçamento_mensal: 0
      });
      
      setSelectedCatId(createdId);
      setValue('categoria_nome', newCatName.trim(), { shouldValidate: true });
      setIsCreatingCat(false);
      setNewCatName('');
      setNewCatColor('#4F46E5');
      setNewCatIcon('circle');
    } catch (err) {
      console.error(err);
      alert('Erro ao criar categoria inline.');
    }
  };

  const onSubmit = async (data: any) => {
    try {
      let catId: string | null = null;
      if (selectedCatId) {
        catId = selectedCatId;
      }

      await addTransaction({
        tipo: data.tipo,
        valor: Number(data.valor),
        categoria_id: catId,
        descrição: data.descrição,
        data: new Date(data.data + 'T12:00:00Z').toISOString(), // Set UTC midday to avoid TZ offset issues
        recorrente: data.recorrente,
      });
      setTransactionModalOpen(false);
      reset();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar transação.');
    }
  };

  const selectedCategory = categories.find(c => c.id === selectedCatId);

  return (
    <AnimatePresence>
      {isTransactionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
          {/* Overlay background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTransactionModalOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative z-10 w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden glassmorphism flex flex-col max-h-[90vh] sm:max-h-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                <span className="p-1 rounded-md bg-primary/10 text-primary">
                  <Plus size={18} />
                </span>
                Novo Lançamento
              </h2>
              <button
                type="button"
                onClick={() => setTransactionModalOpen(false)}
                className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5 overflow-y-auto">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 p-1 bg-muted rounded-xl border border-border/30">
                <button
                  type="button"
                  onClick={() => setValue('tipo', 'despesa')}
                  className={`py-2 px-3 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    selectedTipo === 'despesa'
                      ? 'bg-danger text-white glow-danger font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setValue('tipo', 'receita')}
                  className={`py-2 px-3 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    selectedTipo === 'receita'
                      ? 'bg-success text-white glow-success font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Receita
                </button>
              </div>

              {/* Value Input (Large and centered) */}
              <div className="space-y-1 text-center py-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground">Valor (R$)</label>
                <div className="relative flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground mr-1">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    autoFocus
                    {...register('valor')}
                    className="bg-transparent text-4xl sm:text-5xl font-black text-center text-foreground placeholder:text-muted-foreground/30 focus:outline-none max-w-[250px] font-mono select-all"
                  />
                </div>
                {errors.valor && (
                  <p className="text-xs text-danger font-medium mt-1">{(errors.valor as any).message}</p>
                )}
              </div>

              {/* Category Dropdown and Action */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Categoria
                </label>
                <div className="flex gap-2">
                  {/* Dropdown Container */}
                  <div className="relative flex-1" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full bg-muted border border-border/50 rounded-xl px-3.5 py-2.5 text-sm text-foreground flex items-center justify-between focus:outline-none hover:border-border transition-colors text-left"
                    >
                      {selectedCategory ? (
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0" 
                            style={{ backgroundColor: selectedCategory.cor }}
                          >
                            <CategoryIcon name={selectedCategory.icone || 'circle'} size={12} />
                          </span>
                          <span className="font-bold">{selectedCategory.nome}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60">Selecione uma categoria...</span>
                      )}
                      <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-20 left-0 right-0 mt-1 bg-card border border-border/80 rounded-xl shadow-2xl max-h-52 overflow-y-auto p-1.5 space-y-1 glassmorphism"
                        >
                          {categories.length === 0 ? (
                            <p className="text-xs text-muted-foreground p-3 text-center">Nenhuma categoria encontrada</p>
                          ) : (
                            categories.map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleSelectCategory(cat)}
                                className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs transition-colors hover:bg-muted ${
                                  selectedCatId === cat.id ? 'bg-primary/10 text-primary font-bold' : 'text-foreground/90'
                                }`}
                              >
                                <span 
                                  className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0" 
                                  style={{ backgroundColor: cat.cor }}
                                >
                                  <CategoryIcon name={cat.icone || 'circle'} size={12} />
                                </span>
                                <span className="truncate">{cat.nome}</span>
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Add inline category button */}
                  <button
                    type="button"
                    onClick={() => setIsCreatingCat(!isCreatingCat)}
                    className={`p-2.5 rounded-xl border flex items-center justify-center hover:bg-muted transition-colors ${
                      isCreatingCat ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-border/50 text-muted-foreground hover:text-foreground'
                    }`}
                    title="Nova Categoria"
                  >
                    <FolderPlus size={18} />
                  </button>
                </div>
                {errors.categoria_nome && (
                  <p className="text-xs text-danger font-medium">{(errors.categoria_nome as any).message}</p>
                )}
              </div>

              {/* Inline mini form for adding Category */}
              <AnimatePresence>
                {isCreatingCat && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="p-4 bg-muted/40 border border-border/60 rounded-2xl space-y-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-border/30 pb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-1">
                        Criar Categoria Rápido
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setIsCreatingCat(false)} 
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Nome */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase">Nome</label>
                      <input 
                        type="text"
                        placeholder="Ex: Assinaturas, Mercado..."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="w-full bg-muted border border-border/50 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      />
                    </div>

                    {/* Cores */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase block">Cor</label>
                      <div className="flex flex-wrap gap-1.5">
                        {PREDEFINED_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewCatColor(color)}
                            className="w-6 h-6 rounded-full border border-border/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                            style={{ backgroundColor: color }}
                          >
                            {newCatColor === color && (
                              <span className="w-1.5 h-1.5 bg-white rounded-full" />
                            )}
                          </button>
                        ))}
                        {/* Native Custom Color */}
                        <div className="flex items-center gap-1 ml-1.5">
                          <input 
                            type="color" 
                            value={newCatColor}
                            onChange={(e) => setNewCatColor(e.target.value)}
                            className="w-6 h-5 cursor-pointer border border-border/60 bg-transparent rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Ícones */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase block">Ícone</label>
                      <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 p-1 bg-muted rounded-xl max-h-24 overflow-y-auto">
                        {ICON_OPTIONS.map(opt => (
                          <button
                            key={opt.name}
                            type="button"
                            onClick={() => setNewCatIcon(opt.name)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all hover:scale-105 ${
                              newCatIcon === opt.name 
                                ? 'bg-primary border-primary text-white font-bold' 
                                : 'border-border/30 text-muted-foreground hover:text-foreground bg-card/45'
                            }`}
                            title={opt.label}
                          >
                            <CategoryIcon name={opt.name} size={14} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit inline category */}
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCreatingCat(false)}
                        className="py-1.5 px-3 border border-border text-[10px] font-bold rounded-lg text-muted-foreground hover:bg-muted"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateCategoryInline}
                        className="py-1.5 px-3 bg-primary text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-1"
                      >
                        <Check size={10} />
                        Confirmar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <AlignLeft size={14} />
                  Descrição
                </label>
                <input
                  type="text"
                  placeholder="Ex: Supermercado, Almoço, Uber..."
                  {...register('descrição')}
                  className="w-full bg-muted border border-border/50 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
                {errors.descrição && (
                  <p className="text-xs text-danger font-medium">{(errors.descrição as any).message}</p>
                )}
              </div>

              {/* Date Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} />
                    Data
                  </label>
                  <input
                    type="date"
                    {...register('data')}
                    className="w-full bg-muted border border-border/50 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono"
                  />
                </div>

                {/* Recurrent Checkbox */}
                <div className="flex items-center justify-between sm:justify-end sm:gap-3 py-2 sm:py-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Despesa Recorrente?
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('recorrente')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-muted-foreground peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary font-bold"></div>
                  </label>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-3 rounded-xl font-bold text-sm tracking-wide text-white gradient-accent gradient-accent-hover transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed glow-primary"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={16} />
                    Salvar Transação
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
