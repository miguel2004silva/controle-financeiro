'use client';

import React, { useState } from 'react';
import { ShieldCheck, Plus, Minus, Target, Sparkles, Lock, ShieldAlert, Shield } from 'lucide-react';
import { useFinance } from '@/context/finance-context';
import { motion } from 'framer-motion';

export const EmergencyReserveCard: React.FC = () => {
  const { emergencyReserve, emergencyGoal, updateEmergencyReserve, addTransaction } = useFinance();
  const [inputValue, setInputValue] = useState('');
  const [modalMode, setModalMode] = useState<'deposit' | 'withdraw' | 'goal' | null>(null);

  const percentage = Math.min(100, Math.round((emergencyReserve / (emergencyGoal || 1)) * 100));

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputValue.replace(/\./g, '').replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    try {
      if (modalMode === 'deposit') {
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
      alert('Erro ao salvar transação da reserva.');
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
            <div className="absolute inset-0 rounded-full bg-emerald-500/5 animate-pulse blur-xl pointer-events-none" />

            {/* Custom SVG Animated Shield */}
            <div className="relative z-10 w-28 h-32 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                <defs>
                  <linearGradient id="shield-grad" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#1B522C" />
                    <stop offset="50%" stopColor="#236B39" />
                    <stop offset="100%" stopColor="#2D7D46" />
                  </linearGradient>
                  <clipPath id="shield-clip">
                    <path d="M 50 5 C 75 5, 90 15, 90 45 C 90 75, 50 95, 50 95 C 50 95, 10 75, 10 45 C 10 15, 25 5, 50 5 Z" />
                  </clipPath>
                </defs>

                {/* Base Outer Border */}
                <path
                  d="M 50 5 C 75 5, 90 15, 90 45 C 90 75, 50 95, 50 95 C 50 95, 10 75, 10 45 C 10 15, 25 5, 50 5 Z"
                  fill="none"
                  stroke="#e4e4e7"
                  strokeWidth="3.5"
                  className="dark:stroke-zinc-800"
                />

                {/* Clipped Fill Content */}
                <g clipPath="url(#shield-clip)">
                  {/* Empty Background */}
                  <rect x="0" y="0" width="100" height="100" className="fill-zinc-100 dark:fill-zinc-900" />
                  
                  {/* Grid overlay for tech look */}
                  <path d="M 50 5 L 50 95" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                  <path d="M 10 45 L 90 45" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />

                  {/* Liquid / Color Fill */}
                  <motion.rect
                    x="0"
                    width="100"
                    fill="url(#shield-grad)"
                    initial={{ y: 95, height: 0 }}
                    animate={{
                      y: 95 - (percentage / 100) * 90,
                      height: (percentage / 100) * 90
                    }}
                    transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                  />

                  {/* Rising Bubbles inside the fluid */}
                  {percentage > 0 && Array.from({ length: 6 }).map((_, i) => {
                    const randomX = 20 + (i * 12) + (Math.sin(i) * 5);
                    const speed = 2.2 + (i % 3) * 0.4;
                    const delay = i * 0.4;
                    const radius = 1 + (i % 2) * 0.8;
                    const maxRise = 95 - (percentage / 100) * 90;

                    return (
                      <motion.circle
                        key={i}
                        r={radius}
                        fill="#ffffff"
                        opacity={0.35}
                        initial={{ cx: randomX, cy: 95, opacity: 0 }}
                        animate={{
                          cy: [95, maxRise],
                          opacity: [0, 0.6, 0]
                        }}
                        transition={{
                          duration: speed,
                          repeat: Infinity,
                          delay: delay,
                          ease: "linear"
                        }}
                      />
                    );
                  })}

                  {/* Inner Glow Border */}
                  <path
                    d="M 50 8 C 72 8, 86 17, 86 45 C 86 71, 50 90, 50 90 C 50 90, 14 71, 14 45 C 14 17, 28 8, 50 8 Z"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    className="pointer-events-none"
                  />

                  {/* Shiny overlay highlight */}
                  <path
                    d="M 15 15 Q 50 35 85 15"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </g>

                {/* Outline Border on Top */}
                <path
                  d="M 50 5 C 75 5, 90 15, 90 45 C 90 75, 50 95, 50 95 C 50 95, 10 75, 10 45 C 10 15, 25 5, 50 5 Z"
                  fill="none"
                  stroke={percentage >= 100 ? '#2D7D46' : '#c8e2d1'}
                  strokeWidth="3.5"
                  className="transition-colors duration-500 pointer-events-none"
                />

                {/* Checkmark overlay */}
                {percentage > 0 && (
                  <motion.path
                    d="M 36 48 L 46 58 L 66 36"
                    fill="none"
                    stroke={percentage >= 50 ? '#FFFFFF' : '#2D7D46'}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  />
                )}
              </svg>
            </div>

            {/* Percentage Badge */}
            <div className="absolute -bottom-1 px-3 py-1 rounded-full bg-[#236B39] text-white font-extrabold text-xs shadow-md z-20 flex items-center gap-1 select-none">
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
