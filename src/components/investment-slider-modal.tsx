'use client';

import React, { useState } from 'react';
import { TrendingUp, DollarSign, Sliders, ShieldCheck, PieChart, Sparkles, Check, X } from 'lucide-react';
import { useFinance } from '@/context/finance-context';

import { maskCurrency, parseCurrencyInput } from '@/lib/currency-utils';

interface InvestmentSliderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InvestmentSliderModal: React.FC<InvestmentSliderModalProps> = ({ isOpen, onClose }) => {
  const { monthlyIncome, setMonthlyIncome, setTransactionModalOpen } = useFinance();
  const [percentage, setPercentage] = useState<number>(30);
  const [editingIncome, setEditingIncome] = useState<boolean>(false);
  const [tempIncome, setTempIncome] = useState<string>(String(monthlyIncome));

  if (!isOpen) return null;

  const currentIncome = monthlyIncome || 12000;
  const calculatedAmount = (currentIncome * percentage) / 100;

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleSaveIncome = () => {
    const val = parseCurrencyInput(tempIncome);
    if (!isNaN(val) && val > 0) {
      setMonthlyIncome(val);
    }
    setEditingIncome(false);
  };

  const handleConfirmInvestment = () => {
    onClose();
    setTransactionModalOpen(true);
  };

  // Allocation breakdown (e.g. 50% Reserva, 30% Renda Fixa, 20% Variável)
  const breakdown = [
    { label: 'Reserva & Liquidez (50%)', amount: calculatedAmount * 0.5, color: 'bg-emerald-500' },
    { label: 'Renda Fixa & CDBs (30%)', amount: calculatedAmount * 0.3, color: 'bg-blue-500' },
    { label: 'Ações & FIIs (20%)', amount: calculatedAmount * 0.2, color: 'bg-purple-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
        
        {/* Decorative Top Gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <TrendingUp size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-foreground tracking-tight">Simulador de Aporte</h3>
              <p className="text-xs text-muted-foreground">Calcule e planeje quanto investir da sua renda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Income Base Section */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Sua Renda / Salário Base</span>
            {editingIncome ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-muted-foreground">R$</span>
                <input
                  type="text"
                  placeholder="0,00"
                  value={tempIncome}
                  onChange={(e) => setTempIncome(maskCurrency(e.target.value))}
                  className="w-32 py-1 px-2 text-sm font-bold bg-background border border-border/30 rounded-lg text-foreground focus:outline-none"
                />
                <button
                  onClick={handleSaveIncome}
                  className="p-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-extrabold text-foreground">{formatBRL(currentIncome)}</span>
                <button
                  onClick={() => { setTempIncome(String(currentIncome)); setEditingIncome(true); }}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Alterar
                </button>
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Percentage Slider Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-bold text-muted-foreground">Porcentagem para Investir</span>
              <div className="text-3xl font-black text-primary tracking-tight mt-0.5 flex items-baseline gap-1">
                <span>{percentage}%</span>
                <span className="text-xs font-semibold text-muted-foreground">da renda</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-muted-foreground">Valor a Investir</span>
              <div className="text-2xl font-black text-emerald-500 tracking-tight mt-0.5">
                {formatBRL(calculatedAmount)}
              </div>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-primary border border-border/20 focus:outline-none"
            />
            
            {/* Quick Preset Chips */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {[10, 20, 30, 50, 70].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setPercentage(preset)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    percentage === preset
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted border-border/20'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Suggested Allocation Breakdown */}
        <div className="p-4 rounded-2xl bg-muted/20 border border-border/15 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <span className="flex items-center gap-1.5">
              <PieChart size={15} className="text-primary" />
              <span>Divisão Sugerida de Aporte</span>
            </span>
            <span className="text-muted-foreground">Total: {formatBRL(calculatedAmount)}</span>
          </div>

          <div className="space-y-2">
            {breakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-background/60 border border-border/10">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="font-semibold text-foreground/90">{item.label}</span>
                </div>
                <span className="font-bold text-foreground">{formatBRL(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm Action Button */}
        <button
          onClick={handleConfirmInvestment}
          className="w-full shiny-btn py-3.5 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2"
        >
          <Sparkles size={18} />
          <span>Confirmar e Realizar Aporte de {formatBRL(calculatedAmount)}</span>
        </button>

      </div>
    </div>
  );
};
