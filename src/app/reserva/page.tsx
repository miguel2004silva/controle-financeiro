'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { EmergencyReserveCard } from '@/components/emergency-reserve-card';
import { ShieldCheck, Info, Sparkles, Lock, ArrowUpRight } from 'lucide-react';
import { useFinance } from '@/context/finance-context';

export default function ReservaPage() {
  const { emergencyReserve, emergencyGoal } = useFinance();

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const pct = Math.min(100, Math.round((emergencyReserve / (emergencyGoal || 1)) * 100));

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#EAF5ED] text-[#236B39]">
              <ShieldCheck size={24} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Reserva de Emergência</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Seu escudo de proteção financeira para imprevistos e segurança da sua família
          </p>
        </div>
      </div>

      {/* Main Interactive Shield Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <EmergencyReserveCard />
      </motion.div>

      {/* Educational & Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="bg-card border border-border/15 rounded-3xl p-5 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#2D7D46] flex items-center justify-center">
            <Lock size={20} />
          </div>
          <h4 className="font-extrabold text-sm text-foreground">Liquidez Imediata</h4>
          <p className="text-xs text-muted-foreground">
            Mantenha sua reserva em investimentos com resgate diário (CDB 100% CDI ou Tesouro Selic).
          </p>
        </div>

        <div className="bg-card border border-border/15 rounded-3xl p-5 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#2D7D46] flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <h4 className="font-extrabold text-sm text-foreground">6 Meses de Custo Fixo</h4>
          <p className="text-xs text-muted-foreground">
            O valor recomendado de {formatBRL(emergencyGoal)} cobre 6 meses de suas despesas essenciais.
          </p>
        </div>

        <div className="bg-card border border-border/15 rounded-3xl p-5 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#2D7D46] flex items-center justify-center">
            <Info size={20} />
          </div>
          <h4 className="font-extrabold text-sm text-foreground">Sem Riscos</h4>
          <p className="text-xs text-muted-foreground">
            Sua reserva não deve ser exposta à volatilidade da bolsa de valores ou renda variável.
          </p>
        </div>
      </div>
    </div>
  );
}
