'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Calendar, DollarSign, AlignLeft, Check } from 'lucide-react';
import { useFinance } from '@/context/finance-context';
import { CategoryIcon } from './category-icon';

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

type TransactionFormValues = z.infer<typeof transactionSchema>;

export const QuickTransactionModal: React.FC = () => {
  const { 
    isTransactionModalOpen, 
    setTransactionModalOpen, 
    categories, 
    addTransaction,
    addCategory
  } = useFinance();

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
    }
  }, [isTransactionModalOpen, reset]);

  const onSubmit = async (data: any) => {
    try {
      const trimmedCatName = data.categoria_nome.trim();
      let catId: string | null = null;

      if (trimmedCatName) {
        const existingCat = categories.find(
          c => c.nome.toLowerCase() === trimmedCatName.toLowerCase()
        );
        if (existingCat) {
          catId = existingCat.id;
        } else {
          catId = await addCategory({
            nome: trimmedCatName,
            cor: '#6366F1', // default indigo
            icone: 'circle',
            orçamento_mensal: 0
          });
        }
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
                      ? 'bg-danger text-white glow-danger'
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
                      ? 'bg-success text-white glow-success'
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

              {/* Category Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Categoria
                </label>
                <input
                  type="text"
                  placeholder="Ex: Alimentação, Transporte, Lazer..."
                  {...register('categoria_nome')}
                  className="w-full bg-muted border border-border/50 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
                {errors.categoria_nome && (
                  <p className="text-xs text-danger font-medium">{(errors.categoria_nome as any).message}</p>
                )}
              </div>

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
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-muted-foreground peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
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
