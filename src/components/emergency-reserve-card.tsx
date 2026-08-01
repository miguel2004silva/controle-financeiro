'use client';

import React, { useState } from 'react';
import { ShieldCheck, Plus, Minus, Target, Sparkles, Lock, ShieldAlert, Shield } from 'lucide-react';
import { useFinance } from '@/context/finance-context';

export const EmergencyReserveCard: React.FC = () => {
  const { emergencyReserve, emergencyGoal, updateEmergencyReserve } = useFinance();
  const [inputValue, setInputValue] = useState('');
  const [modalMode, setModalMode] = useState<'deposit' | 'withdraw' | 'goal' | null>(null);

  const percentage = Math.min(100, Math.round((emergencyReserve / (emergencyGoal || 1)) * 100));

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputValue.replace(/\./g, '').replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    if (modalMode === 'deposit') {
      updateEmergencyReserve(emergencyReserve + val);
    } else if (modalMode === 'withdraw') {
      updateEmergencyReserve(Math.max(0, emergencyReserve - val));
    } else if (modalMode === 'goal') {
      updateEmergencyReserve(emergencyReserve, val);
    }

    setInputValue('');
    setModalMode(null);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-card border border-border/20 p-6 sm:p-8 shadow-sm transition-all duration-300">
      {/* Background Decorative Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#2D7D46] shadow-xs">
            <ShieldCheck size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base tracking-tight text-foreground">Escudo de Emergência</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF5ED] text-[#236B39] border border-emerald-500/20">
                {percentage}% Blindado
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Proteção financeira garantida para imprevistos</p>
          </div>
        </div>

        <button
          onClick={() => setModalMode('goal')}
          className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted/60 hover:bg-muted border border-border/20 transition-all"
        >
          <Target size={14} />
          <span>Ajustar Meta</span>
        </button>
      </div>

      {/* Main Shield Visual */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
        
        {/* Animated Shield Protection Level */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-5 bg-[#F7F9F7] rounded-3xl border border-border/15">
          <div className="relative w-36 h-40 flex flex-col items-center justify-center">
            {/* Outer Pulsing Shield Halo */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse blur-xl" />

            {/* Shield Icon Container */}
            <div className="relative z-10 w-28 h-28 rounded-full bg-white border-2 border-emerald-500/30 shadow-md flex items-center justify-center text-[#2D7D46]">
              <ShieldCheck size={56} className="text-[#2D7D46]" />
            </div>

            {/* Percentage Badge */}
            <div className="absolute -bottom-1 px-3 py-1 rounded-full bg-[#236B39] text-white font-extrabold text-xs shadow-md z-20 flex items-center gap-1">
              <Sparkles size={12} />
              <span>{percentage}% Protegido</span>
            </div>
          </div>

          <div className="mt-5 w-full text-center space-y-1">
            <div className="w-full bg-zinc-200 rounded-full h-2.5 overflow-hidden border border-border/20">
              <div 
                className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full transition-all duration-700 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Values & Action Controls */}
        <div className="md:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-muted/40 border border-border/20 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-muted-foreground">Valor Guardado na Reserva</span>
              <span className="text-2xl font-extrabold text-foreground">{formatBRL(emergencyReserve)}</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-2.5 border-t border-border/15">
              <span className="text-muted-foreground">Meta da Reserva (6 Meses):</span>
              <span className="font-extrabold text-[#2D7D46]">{formatBRL(emergencyGoal)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setModalMode('deposit')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#2D7D46] hover:bg-[#236B39] text-white font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>Adicionar Valor</span>
            </button>
            <button
              onClick={() => setModalMode('withdraw')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs border border-border/30 active:scale-95 transition-all"
            >
              <Minus size={16} />
              <span>Resgatar Valor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Deposit/Withdraw Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-border/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base text-foreground">
                {modalMode === 'deposit' && 'Adicionar ao Escudo'}
                {modalMode === 'withdraw' && 'Resgatar da Reserva'}
                {modalMode === 'goal' && 'Ajustar Meta do Escudo'}
              </h4>
              <button
                onClick={() => setModalMode(null)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                  {modalMode === 'goal' ? 'Valor da Meta (R$)' : 'Valor (R$)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/40 border border-border/30 text-foreground text-sm font-bold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-foreground text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2D7D46] hover:bg-[#236B39] text-white text-xs font-bold shadow-md"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
