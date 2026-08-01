'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  UserPlus, 
  Users, 
  KeyRound, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Mail,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { useFinance } from '@/context/finance-context';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'usuario';
  created_at: string;
  status: 'ativo' | 'inativo';
}

export default function SecretGestaoPage() {
  const { user } = useFinance();

  // Security Lock PIN state
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Form states
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newRole, setNewRole] = useState<'usuario' | 'admin'>('usuario');

  // UI Feedback states
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Users List State
  const [usersList, setUsersList] = useState<ManagedUser[]>([]);

  // Load users on unlock
  useEffect(() => {
    if (typeof window !== 'undefined' && isUnlocked) {
      const stored = localStorage.getItem('fin_users_list');
      let list: ManagedUser[] = [];
      if (stored) {
        try {
          const parsed: ManagedUser[] = JSON.parse(stored);
          list = parsed.filter(u => u.email !== 'admin@financeiro.com');
        } catch (e) {}
      }

      // Add current active user if not already in list
      if (user && user.email) {
        const userEmail = user.email;
        if (!list.some(u => u.email.toLowerCase() === userEmail.toLowerCase())) {
          list.unshift({
            id: user.id || `u-${Date.now()}`,
            email: userEmail,
            name: user.name || userEmail.split('@')[0],
            role: 'admin',
            created_at: new Date().toISOString(),
            status: 'ativo'
          });
        }
      }

      setUsersList(list);
      localStorage.setItem('fin_users_list', JSON.stringify(list));
    }
  }, [isUnlocked, user]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Default secret master PIN: 1234 (or any 4 digit pin)
    if (pin === '1234' || pin === 'admin') {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setLoading(true);

    if (!newEmail || !newPassword) {
      setErrorMsg('Por favor preencha o e-mail e a senha.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase!.auth.signUp({
          email: newEmail,
          password: newPassword,
          options: {
            data: {
              full_name: newName || newEmail.split('@')[0],
              role: newRole
            }
          }
        });

        if (error) throw error;
      }

      // Add to local users list
      const newUserObj: ManagedUser = {
        id: `u-${Date.now()}`,
        email: newEmail,
        name: newName || newEmail.split('@')[0],
        role: newRole,
        created_at: new Date().toISOString(),
        status: 'ativo'
      };

      const updated = [newUserObj, ...usersList];
      setUsersList(updated);
      localStorage.setItem('fin_users_list', JSON.stringify(updated));

      setSuccessMsg(`Usuário ${newEmail} criado com sucesso!`);
      setNewEmail('');
      setNewName('');
      setNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar novo usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (id: string, email: string) => {
    if (confirm(`Tem certeza que deseja remover o usuário ${email}?`)) {
      const updated = usersList.filter((u) => u.id !== id);
      setUsersList(updated);
      localStorage.setItem('fin_users_list', JSON.stringify(updated));
      setSuccessMsg(`Usuário ${email} removido.`);
    }
  };

  const handleToggleStatus = (id: string) => {
    const updated = usersList.map((u) => {
      if (u.id === id) {
        const nextStatus = u.status === 'ativo' ? 'inativo' : 'ativo';
        return { ...u, status: nextStatus as any };
      }
      return u;
    });
    setUsersList(updated);
    localStorage.setItem('fin_users_list', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-zinc-100 p-4 sm:p-8 relative overflow-hidden font-sans">
      {/* Soft Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-600/10 via-emerald-500/5 to-transparent rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-800 px-4 py-2 rounded-2xl transition-all"
          >
            <ArrowLeft size={16} />
            <span>Voltar ao Sistema</span>
          </Link>

          <div className="flex items-center gap-2 text-emerald-400 text-xs font-extrabold bg-emerald-950/60 border border-emerald-800/40 px-3.5 py-1.5 rounded-full">
            <ShieldCheck size={16} />
            <span>Painel Secreto de Gestão</span>
          </div>
        </div>

        {/* SCREEN 1: SECRET PIN LOCK */}
        {!isUnlocked ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto my-12 bg-[#141417]/90 backdrop-blur-xl border border-zinc-800/80 rounded-[32px] p-8 shadow-2xl text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
              <Lock size={28} />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-white">Acesso Restrito</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Digite o PIN mestre de segurança para desbloquear a gestão de usuários.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  placeholder="PIN Secreto (Padrão: 1234)"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError(false);
                  }}
                  className={`w-full bg-[#1a1a1e] border ${
                    pinError ? 'border-rose-500' : 'border-zinc-800 focus:border-emerald-500/60'
                  } rounded-2xl px-4 py-3.5 text-center text-sm font-bold text-white placeholder-zinc-500 outline-none transition-all tracking-widest`}
                  autoFocus
                />
              </div>

              {pinError && (
                <p className="text-xs text-rose-400 font-bold flex items-center justify-center gap-1">
                  <AlertCircle size={14} /> PIN incorreto! Tente novamente.
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 transition-all"
              >
                Desbloquear Painel
              </button>
            </form>
          </motion.div>
        ) : (
          /* SCREEN 2: UNLOCKED MANAGEMENT DASHBOARD */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Success / Error Alerts */}
            {successMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} /> {successMsg}
                </span>
                <button onClick={() => setSuccessMsg(null)} className="text-zinc-400 hover:text-white">✕</button>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertCircle size={16} /> {errorMsg}
                </span>
                <button onClick={() => setErrorMsg(null)} className="text-zinc-400 hover:text-white">✕</button>
              </div>
            )}

            {/* Grid Layout: Create User (Form) and Users List */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Left Column: Create User Form (2 cols) */}
              <div className="lg:col-span-2 bg-[#141417]/90 border border-zinc-800/80 rounded-[32px] p-6 space-y-5">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <UserPlus size={20} />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-base text-white">Criar Novo Usuário</h3>
                    <p className="text-[11px] text-zinc-400">Cadastre um novo login para o sistema</p>
                  </div>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos Silva"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-[#1a1a1e] border border-zinc-800 focus:border-emerald-500/60 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      E-mail de Acesso *
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={16} className="absolute left-3.5 text-zinc-500" />
                      <input
                        type="email"
                        placeholder="usuario@exemplo.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full bg-[#1a1a1e] border border-zinc-800 focus:border-emerald-500/60 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Senha Inicial *
                    </label>
                    <div className="relative flex items-center">
                      <KeyRound size={16} className="absolute left-3.5 text-zinc-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-[#1a1a1e] border border-zinc-800 focus:border-emerald-500/60 rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-zinc-500 outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-zinc-500 hover:text-zinc-300"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Nível de Permissão
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full bg-[#1a1a1e] border border-zinc-800 focus:border-emerald-500/60 rounded-2xl px-4 py-3 text-xs text-white outline-none font-bold"
                    >
                      <option value="usuario">Usuário Comum</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50 mt-2"
                  >
                    {loading ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <>
                        <UserPlus size={16} />
                        <span>Cadastrar Usuário</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Column: Registered Users Table (3 cols) */}
              <div className="lg:col-span-3 bg-[#141417]/90 border border-zinc-800/80 rounded-[32px] p-6 space-y-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <Users size={20} />
                      </span>
                      <div>
                        <h3 className="font-extrabold text-base text-white">Usuários Registrados</h3>
                        <p className="text-[11px] text-zinc-400">{usersList.length} contas cadastradas</p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                          <th className="py-3 px-3">Usuário</th>
                          <th className="py-3 px-3">Nível</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50 text-zinc-300 font-medium">
                        {usersList.length > 0 ? (
                          usersList.map((u) => (
                            <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors">
                              <td className="py-3.5 px-3">
                                <div className="font-bold text-white">{u.name}</div>
                                <div className="text-[10.5px] text-zinc-400">{u.email}</div>
                              </td>
                              <td className="py-3.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  u.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-zinc-800 text-zinc-300'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <button
                                  onClick={() => handleToggleStatus(u.id)}
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                                    u.status === 'ativo'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}
                                >
                                  {u.status === 'ativo' ? 'Ativo' : 'Bloqueado'}
                                </button>
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.email)}
                                  className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                  title="Excluir Usuário"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-zinc-500">
                              Nenhum usuário cadastrado ainda.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Modo de segurança ativo</span>
                  <button
                    onClick={() => setIsUnlocked(false)}
                    className="text-emerald-400 hover:underline font-bold"
                  >
                    Bloquear Painel
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
