'use client';

import React, { useState } from 'react';
import { ShieldCheck, Plus, Minus, Target, Sparkles, AlertCircle } from 'lucide-react';
import { useFinance } from '@/context/finance-context';
import { motion } from 'framer-motion';

export const EmergencyReserveCard: React.FC = () => {
  const { emergencyReserve, emergencyGoal, updateEmergencyReserve, addTransaction, transactions } = useFinance();
  const [inputValue, setInputValue] = useState('');
  const [modalMode, setModalMode] = useState<'deposit' | 'withdraw' | 'goal' | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Compute available general balance (liquidez) from transactions
  const totalRevenues = transactions
    .filter(t => t.tipo === 'receita')
    .reduce((sum, t) => sum + Number(t.valor), 0);

  const totalExpenses = transactions
    .filter(t => t.tipo === 'despesa')
    .reduce((sum, t) => sum + Number(t.valor), 0);

  const generalBalance = totalRevenues - totalExpenses;

  const percentage = Math.min(100, Math.round((emergencyReserve / (emergencyGoal || 1)) * 100));

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleOpenModal = (mode: 'deposit' | 'withdraw' | 'goal') => {
    setValidationError(null);
    setInputValue('');
    setModalMode(mode);
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Parse numeric value safely
    const cleanDigits = inputValue.replace(/[^0-9,.]/g, '');
    let val = 0;
    if (cleanDigits.includes(',')) {
      val = parseFloat(cleanDigits.replace(/\./g, '').replace(',', '.'));
    } else {
      val = parseFloat(cleanDigits);
    }

    if (isNaN(val) || val <= 0) {
      setValidationError('Por favor insira um valor válido maior que zero.');
      return;
    }

    try {
      if (modalMode === 'deposit') {
        if (val > generalBalance) {
          setValidationError(`Saldo disponível insuficiente na conta geral (${formatBRL(Math.max(0, generalBalance))}).`);
          return;
        }

        await addTransaction({
          tipo: 'despesa',
          valor: val,
          descrição: 'Aporte - Reserva de Emergência',
          categoria_id: null,
          data: new Date().toISOString().split('T')[0],
          recorrente: false
        });
        updateEmergencyReserve(emergencyReserve + val);

      } else if (modalMode === 'withdraw') {
        if (val > emergencyReserve) {
          setValidationError(`Valor máximo permitido para resgate é ${formatBRL(emergencyReserve)} (saldo atual da reserva).`);
          return;
        }

        await addTransaction({
          tipo: 'receita',
          valor: val,
          descrição: 'Resgate - Reserva de Emergência',
          categoria_id: null,
          data: new Date().toISOString().split('T')[0],
          recorrente: false
        });
        updateEmergencyReserve(Math.max(0, emergencyReserve - val));

      } else if (modalMode === 'goal') {
        updateEmergencyReserve(emergencyReserve, val);
      }
    } catch (err) {
      console.error(err);
      setValidationError('Erro ao registrar transação.');
      return;
    }

    setInputValue('');
    setValidationError(null);
    setModalMode(null);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-card border border-border/20 p-6 sm:p-8 shadow-sm transition-all duration-300">
      {/* Background Decorative Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF5ED] border border-emerald-500/30 flex items-center justify-center text-[#2D7D46] shadow-xs">
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
          onClick={() => handleOpenModal('goal')}
          className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted/60 hover:bg-muted border border-border/20 transition-all"
        >
          <Target size={14} />
          <span>Ajustar Meta</span>
        </button>
      </div>

      {/* Main Shield Visual & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
        
        {/* Modern Vector Liquid-Fill SVG Shield */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-[#F7F9F7] rounded-3xl border border-border/15">
          <div className="relative w-36 h-40 flex flex-col items-center justify-center">
            {/* Outer Soft Shield Halo */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse blur-xl pointer-events-none" />

            <div className="relative z-10 w-28 h-32 flex items-center justify-center">
              <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md">
                <defs>
                  <linearGradient id="liquid-shield-grad" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#1B522C" />
                    <stop offset="50%" stopColor="#236B39" />
                    <stop offset="100%" stopColor="#2D7D46" />
                  </linearGradient>

                  <clipPath id="shield-path-clip">
                    <path d="M 50 4 C 76 4, 94 14, 94 48 C 94 82, 50 114, 50 114 C 50 114, 6 82, 6 48 C 6 14, 24 4, 50 4 Z" />
                  </clipPath>
                </defs>

                {/* Base Outer Metallic Shield Border */}
                <path
                  d="M 50 4 C 76 4, 94 14, 94 48 C 94 82, 50 114, 50 114 C 50 114, 6 82, 6 48 C 6 14, 24 4, 50 4 Z"
                  fill="none"
                  stroke="#E4E4E7"
                  strokeWidth="4"
                />

                {/* Shield Fill Area */}
                <g clipPath="url(#shield-path-clip)">
                  {/* Empty Interior Background */}
                  <rect x="0" y="0" width="100" height="120" fill="#F4F4F5" />
                  
                  {/* Tech Grid Guide Lines */}
                  <path d="M 50 0 L 50 120" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
                  <path d="M 0 48 L 100 48" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />

                  {/* Liquid Elevation Rect */}
                  <motion.rect
                    x="0"
                    width="100"
                    fill="url(#liquid-shield-grad)"
                    initial={{ y: 114, height: 0 }}
                    animate={{
                      y: 114 - (percentage / 100) * 105,
                      height: (percentage / 100) * 105
                    }}
                    transition={{ type: 'spring', stiffness: 45, damping: 14 }}
                  />

                  {/* Fluid Rising Particles */}
                  {percentage > 0 && Array.from({ length: 5 }).map((_, i) => {
                    const posX = 20 + i * 15;
                    const speed = 2.4 + (i % 3) * 0.5;
                    const maxLevel = 114 - (percentage / 100) * 105;

                    return (
                      <motion.circle
                        key={i}
                        r={1.8}
                        fill="#FFFFFF"
                        opacity={0.4}
                        initial={{ cx: posX, cy: 110, opacity: 0 }}
                        animate={{
                          cy: [110, maxLevel],
                          opacity: [0, 0.7, 0]
                        }}
                        transition={{
                          duration: speed,
                          repeat: Infinity,
                          delay: i * 0.45,
                          ease: "linear"
                        }}
                      />
                    );
                  })}

                  {/* Inner Glass Highlight Line */}
                  <path
                    d="M 12 12 Q 50 36 88 12"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </g>

                {/* Outer Active Border */}
                <path
                  d="M 50 4 C 76 4, 94 14, 94 48 C 94 82, 50 114, 50 114 C 50 114, 6 82, 6 48 C 6 14, 24 4, 50 4 Z"
                  fill="none"
                  stroke={percentage >= 100 ? '#2D7D46' : '#A7F3D0'}
                  strokeWidth="3.5"
                  className="transition-colors duration-500 pointer-events-none"
                />

                {/* Center Checkmark when protected */}
                {percentage > 0 && (
                  <motion.path
                    d="M 38 52 L 47 62 L 64 40"
                    fill="none"
                    stroke={percentage >= 50 ? '#FFFFFF' : '#2D7D46'}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                )}
              </svg>
            </div>

            {/* Percentage Badge */}
            <div className="absolute -bottom-1 px-3 py-1 rounded-full bg-[#236B39] text-white font-extrabold text-xs shadow-md z-20 flex items-center gap-1 select-none">
              <Sparkles size={12} />
              <span>{percentage}%</span>
            </div>
          </div>
        </div>

        {/* Financial Metrics & Actions */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/15">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Saldo Atual Guardado
              </p>
              <p className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {formatBRL(emergencyReserve)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/30 border border-border/15">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Meta Desejada
              </p>
              <p className="text-xl sm:text-2xl font-black text-muted-foreground tracking-tight">
                {formatBRL(emergencyGoal)}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleOpenModal('deposit')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#2D7D46] hover:bg-[#236B39] text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Adicionar Valor</span>
            </button>

            <button
              onClick={() => handleOpenModal('withdraw')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs border border-border/30 active:scale-95 transition-all cursor-pointer"
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
          <div className="w-full max-w-sm bg-white border border-border/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base text-foreground">
                {modalMode === 'deposit' && 'Adicionar ao Escudo'}
                {modalMode === 'withdraw' && 'Resgatar da Reserva'}
                {modalMode === 'goal' && 'Ajustar Meta do Escudo'}
              </h4>
              <button
                onClick={() => setModalMode(null)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Validation Error Banner */}
            {validationError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p>{validationError}</p>
              </div>
            )}

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                  {modalMode === 'goal' ? 'Valor da Meta (R$)' : 'Valor (R$)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">R$</span>
                  <input
                    type="text"
                    required
                    placeholder="0,00"
                    value={inputValue}
                    onChange={(e) => {
                      setValidationError(null);
                      setInputValue(e.target.value);
                    }}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/40 border border-border/30 text-foreground text-sm font-bold focus:outline-none focus:border-[#2D7D46]"
                  />
                </div>

                {/* Helper text showing max available limit */}
                {modalMode === 'deposit' && (
                  <p className="text-[11px] font-semibold text-emerald-700 mt-1.5">
                    Saldo disponível na conta geral: {formatBRL(Math.max(0, generalBalance))}
                  </p>
                )}
                {modalMode === 'withdraw' && (
                  <p className="text-[11px] font-semibold text-emerald-700 mt-1.5">
                    Saldo disponível na reserva: {formatBRL(emergencyReserve)}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-foreground text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2D7D46] hover:bg-[#236B39] text-white text-xs font-bold shadow-md cursor-pointer"
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
