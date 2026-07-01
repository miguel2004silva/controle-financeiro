'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Category, Transaction, Investment, InvestmentMovement, Goal, UserProfile } from '@/lib/types';

interface FinanceContextType {
  user: UserProfile | null;
  transactions: Transaction[];
  categories: Category[];
  investments: Investment[];
  investmentMovements: InvestmentMovement[];
  goals: Goal[];
  isLoading: boolean;
  isSupabase: boolean;
  
  // Auth actions
  signOut: () => Promise<void>;
  
  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  editTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Category actions
  addCategory: (category: Omit<Category, 'id' | 'created_at'>) => Promise<void>;
  editCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Investment actions
  addInvestment: (investment: Omit<Investment, 'id' | 'created_at' | 'quantidade' | 'preço_medio'>) => Promise<void>;
  updateInvestmentPrice: (id: string, newPrice: number) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  
  // Investment Movement actions
  addInvestmentMovement: (movement: Omit<InvestmentMovement, 'id' | 'created_at'>) => Promise<void>;
  
  // Goal actions
  addGoal: (goal: Omit<Goal, 'id' | 'created_at'>) => Promise<void>;
  editGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  // Refresh data explicitly
  refreshData: () => Promise<void>;
  
  // Modal states
  isTransactionModalOpen: boolean;
  setTransactionModalOpen: (open: boolean) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Helper to generate IDs for mock mode
const generateId = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Seed data definitions
const SEED_CATEGORIES: Category[] = [
  { id: 'cat-1', nome: 'Alimentação', cor: '#F43F5E', icone: 'utensils', orçamento_mensal: 1200 },
  { id: 'cat-2', nome: 'Transporte', cor: '#3B82F6', icone: 'car', orçamento_mensal: 400 },
  { id: 'cat-3', nome: 'Moradia', cor: '#6366F1', icone: 'home', orçamento_mensal: 2500 },
  { id: 'cat-4', nome: 'Lazer', cor: '#EC4899', icone: 'tv', orçamento_mensal: 600 },
  { id: 'cat-5', nome: 'Investimentos', cor: '#10B981', icone: 'trending-up', orçamento_mensal: 2000 },
  { id: 'cat-6', nome: 'Outros', cor: '#6B7280', icone: 'circle', orçamento_mensal: 300 }
];

const SEED_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', tipo: 'receita', valor: 6500.00, categoria_id: null, descrição: 'Salário Mensal', data: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString().split('T')[0], recorrente: true },
  { id: 'tx-2', tipo: 'despesa', valor: 1200.00, categoria_id: 'cat-3', descrição: 'Aluguel do Apê', data: new Date(new Date().getFullYear(), new Date().getMonth(), 10).toISOString().split('T')[0], recorrente: true },
  { id: 'tx-3', tipo: 'despesa', valor: 350.20, categoria_id: 'cat-1', descrição: 'Supermercado Mensal', data: new Date(new Date().getFullYear(), new Date().getMonth(), 12).toISOString().split('T')[0], recorrente: false },
  { id: 'tx-4', tipo: 'despesa', valor: 55.90, categoria_id: 'cat-4', descrição: 'Assinatura Netflix', data: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString().split('T')[0], recorrente: true },
  { id: 'tx-5', tipo: 'despesa', valor: 85.00, categoria_id: 'cat-2', descrição: 'Combustível Carro', data: new Date(new Date().getFullYear(), new Date().getMonth(), 18).toISOString().split('T')[0], recorrente: false },
  { id: 'tx-6', tipo: 'despesa', valor: 1000.00, categoria_id: 'cat-5', descrição: 'Aporte Carteira de Ações', data: new Date(new Date().getFullYear(), new Date().getMonth(), 20).toISOString().split('T')[0], recorrente: false },
  { id: 'tx-7', tipo: 'receita', valor: 150.00, categoria_id: 'cat-5', descrição: 'Dividendos Mensais', data: new Date(new Date().getFullYear(), new Date().getMonth(), 22).toISOString().split('T')[0], recorrente: false },
  { id: 'tx-8', tipo: 'despesa', valor: 154.50, categoria_id: 'cat-1', descrição: 'Jantar Restaurante', data: new Date(new Date().getFullYear(), new Date().getMonth(), 25).toISOString().split('T')[0], recorrente: false }
];

const SEED_INVESTMENTS: Investment[] = [
  { id: 'inv-1', tipo: 'ação', ticker: 'WEGE3', quantidade: 50, preço_medio: 38.50, preço_atual: 42.10, data_atualização: new Date().toISOString() },
  { id: 'inv-2', tipo: 'fii', ticker: 'MXRF11', quantidade: 200, preço_medio: 10.12, preço_atual: 10.45, data_atualização: new Date().toISOString() },
  { id: 'inv-3', tipo: 'cripto', ticker: 'BTC', quantidade: 0.012, preço_medio: 310000.00, preço_atual: 352000.00, data_atualização: new Date().toISOString() },
  { id: 'inv-4', tipo: 'renda_fixa', ticker: 'LCI CAIXA 98% CDI', quantidade: 8000, preço_medio: 1.00, preço_atual: 1.00, data_atualização: new Date().toISOString() }
];

const SEED_MOVEMENTS: InvestmentMovement[] = [
  { id: 'mov-1', investment_id: 'inv-1', tipo: 'aporte', valor: 1925.00, quantidade: 50, data: '2026-05-10' },
  { id: 'mov-2', investment_id: 'inv-2', tipo: 'aporte', valor: 2024.00, quantidade: 200, data: '2026-05-12' },
  { id: 'mov-3', investment_id: 'inv-3', tipo: 'aporte', valor: 3720.00, quantidade: 0.012, data: '2026-05-20' },
  { id: 'mov-4', investment_id: 'inv-4', tipo: 'aporte', valor: 8000.00, quantidade: 8000, data: '2026-05-01' }
];

const SEED_GOALS: Goal[] = [
  { id: 'goal-1', nome: 'Reserva de Emergência', valor_alvo: 20000, valor_atual: 8000, prazo: '2026-12-31' },
  { id: 'goal-2', nome: 'Viagem dos Sonhos', valor_alvo: 10000, valor_atual: 4500, prazo: '2026-11-30' }
];

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentMovements, setInvestmentMovements] = useState<InvestmentMovement[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);

  // Load from local storage for fallback
  const loadMockData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Check if data is already in local storage, otherwise seed it
    const storedCategories = localStorage.getItem('fin_categories');
    const storedTransactions = localStorage.getItem('fin_transactions');
    const storedInvestments = localStorage.getItem('fin_investments');
    const storedMovements = localStorage.getItem('fin_movements');
    const storedGoals = localStorage.getItem('fin_goals');

    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    } else {
      localStorage.setItem('fin_categories', JSON.stringify(SEED_CATEGORIES));
      setCategories(SEED_CATEGORIES);
    }

    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    } else {
      localStorage.setItem('fin_transactions', JSON.stringify(SEED_TRANSACTIONS));
      setTransactions(SEED_TRANSACTIONS);
    }

    if (storedInvestments) {
      setInvestments(JSON.parse(storedInvestments));
    } else {
      localStorage.setItem('fin_investments', JSON.stringify(SEED_INVESTMENTS));
      setInvestments(SEED_INVESTMENTS);
    }

    if (storedMovements) {
      setInvestmentMovements(JSON.parse(storedMovements));
    } else {
      localStorage.setItem('fin_movements', JSON.stringify(SEED_MOVEMENTS));
      setInvestmentMovements(SEED_MOVEMENTS);
    }

    if (storedGoals) {
      setGoals(JSON.parse(storedGoals));
    } else {
      localStorage.setItem('fin_goals', JSON.stringify(SEED_GOALS));
      setGoals(SEED_GOALS);
    }

    // Set a mock user
    const mockUser = { id: 'mock-user-123', email: 'sandbox@premium.com', name: 'Sandbox User' };
    setUser(mockUser);
    setIsLoading(false);
  }, []);

  // Load live Supabase data
  const loadSupabaseData = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      
      // 1. Fetch categories
      const { data: catData, error: catErr } = await supabase!
        .from('categories')
        .select('*')
        .order('nome', { ascending: true });
        
      if (catErr) throw catErr;

      // Seed default categories if user has none in Supabase
      let userCategories = catData || [];
      if (userCategories.length === 0) {
        const seedToInsert = SEED_CATEGORIES.map(c => ({
          nome: c.nome,
          cor: c.cor,
          icone: c.icone,
          orçamento_mensal: c.orçamento_mensal,
          user_id: userId
        }));
        
        const { data: insertedCats, error: seedErr } = await supabase!
          .from('categories')
          .insert(seedToInsert)
          .select();
          
        if (!seedErr && insertedCats) {
          userCategories = insertedCats;
        }
      }
      setCategories(userCategories);

      // 2. Fetch transactions
      const { data: txData, error: txErr } = await supabase!
        .from('transactions')
        .select('*')
        .order('data', { ascending: false });
        
      if (txErr) throw txErr;
      setTransactions(txData || []);

      // 3. Fetch investments
      const { data: invData, error: invErr } = await supabase!
        .from('investments')
        .select('*')
        .order('ticker', { ascending: true });
        
      if (invErr) throw invErr;
      setInvestments(invData || []);

      // 4. Fetch movements
      const { data: movData, error: movErr } = await supabase!
        .from('investment_movements')
        .select('*')
        .order('data', { ascending: false });
        
      if (movErr) throw movErr;
      setInvestmentMovements(movData || []);

      // 5. Fetch goals
      const { data: goalData, error: goalErr } = await supabase!
        .from('goals')
        .select('*')
        .order('nome', { ascending: true });
        
      if (goalErr) throw goalErr;
      setGoals(goalData || []);

    } catch (error) {
      console.error('Error loading Supabase data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Monitor auth status
  useEffect(() => {
    if (!isSupabaseConfigured) {
      loadMockData();
      return;
    }

    // Get initial session
    supabase!.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
        });
        loadSupabaseData(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
        });
        loadSupabaseData(session.user.id);
      } else {
        setUser(null);
        setTransactions([]);
        setCategories([]);
        setInvestments([]);
        setInvestmentMovements([]);
        setGoals([]);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadMockData, loadSupabaseData]);

  // Set up realtime sync for live Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;

    // Realtime channel subscriptions
    const channel = supabase!.channel('db_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        loadSupabaseData(user.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        loadSupabaseData(user.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investments' }, () => {
        loadSupabaseData(user.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investment_movements' }, () => {
        loadSupabaseData(user.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, () => {
        loadSupabaseData(user.id);
      })
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [user, loadSupabaseData]);

  // Sign out helper
  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase!.auth.signOut();
    } else {
      setUser(null);
    }
  };

  // Refresh helper
  const refreshData = async () => {
    if (isSupabaseConfigured && user) {
      await loadSupabaseData(user.id);
    } else {
      loadMockData();
    }
  };

  // ----------------------------------------------------
  // MUTATION ACTIONS
  // ----------------------------------------------------

  // Transactions
  const addTransaction = async (tx: Omit<Transaction, 'id' | 'created_at'>) => {
    if (isSupabaseConfigured && user) {
      const { error } = await supabase!
        .from('transactions')
        .insert([{ ...tx, user_id: user.id }]);
      if (error) throw error;
      // Realtime listener triggers refresh, but we query immediately for speed
      loadSupabaseData(user.id);
    } else {
      const newTx: Transaction = {
        ...tx,
        id: generateId(),
        created_at: new Date().toISOString()
      };
      const updated = [newTx, ...transactions];
      setTransactions(updated);
      localStorage.setItem('fin_transactions', JSON.stringify(updated));
    }
  };

  const editTransaction = async (id: string, updatedFields: Partial<Transaction>) => {
    if (isSupabaseConfigured && user) {
      const { error } = await supabase!
        .from('transactions')
        .update(updatedFields)
        .eq('id', id);
      if (error) throw error;
      loadSupabaseData(user.id);
    } else {
      const updated = transactions.map(t => t.id === id ? { ...t, ...updatedFields } : t);
      setTransactions(updated);
      localStorage.setItem('fin_transactions', JSON.stringify(updated));
    }
  };

  const deleteTransaction = async (id: string) => {
    if (isSupabaseConfigured && user) {
      const { error } = await supabase!
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      loadSupabaseData(user.id);
    } else {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      localStorage.setItem('fin_transactions', JSON.stringify(updated));
    }
  };

  // Categories
  const addCategory = async (cat: Omit<Category, 'id' | 'created_at'>) => {
    if (isSupabaseConfigured && user) {
      const { error } = await supabase!
        .from('categories')
        .insert([{ ...cat, user_id: user.id }]);
      if (error) throw error;
      loadSupabaseData(user.id);
    } else {
      const newCat: Category = {
        ...cat,
        id: generateId(),
        created_at: new Date().toISOString()
      };
      const updated = [...categories, newCat];
      setCategories(updated);
      localStorage.setItem('fin_categories', JSON.stringify(updated));
    }
  };

  const editCategory = async (id: string, updatedFields: Partial<Category>) => {
    if (isSupabaseConfigured && user) {
      const { error } = await supabase!
        .from('categories')
        .update(updatedFields)
        .eq('id', id);
      if (error) throw error;
      loadSupabaseData(user.id);
    } else {
      const updated = categories.map(c => c.id === id ? { ...c, ...updatedFields } : c);
      setCategories(updated);
      localStorage.setItem('fin_categories', JSON.stringify(updated));
    }
  };

  const deleteCategory = async (id: string) => {
    if (isSupabaseConfigured && user) {
      const { error } = await supabase!
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      loadSupabaseData(user.id);
    } else {
      const updated = categories.filter(c => c.id !== id);
      setCategories(updated);
      localStorage.setItem('fin_categories', JSON.stringify(updated));
      // Reset category_id in transactions that used this category
      const updatedTxs = transactions.map(t => t.categoria_id === id ? { ...t, categoria_id: null } : t);
      setTransactions(updatedTxs);
      localStorage.setItem('fin_transactions', JSON.stringify(updatedTxs));
    }
  };

  // Investments
  const addInvestment = async (inv: Omit<Investment, 'id' | 'created_at' | 'quantidade' | 'preço_medio'>) => {
    if (isSupabaseConfigured && user) {
      const { error } = await supabase!
        .from('investments')
        .insert([{ 
          ...inv, 
          quantidade: 0, 
          preço_medio: 0, 
          user_id: user.id 
        }]);
      if (error) throw error;
      loadSupabaseData(user.id);
    } else {
      const newInv: Investment = {
        ...inv,
        quantidade: 0,
        preço_medio: 0,
        id: generateId(),
        created_at: new Date().toISOString()
      };
      const updated = [...investments, newInv];
      setInvestments(updated);
      localStorage.setItem('fin_investments', JSON.stringify(updated));
    }
  };

  const updateInvestmentPrice = async (id: string, newPrice: number) => {
    if (isSupabaseConfigured && user) {
      const { error } = await supabase!
        .from('investments')
        .update({ preço_atual: newPrice, data_atualização: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      loadSupabaseData(user.id);
    } else {
      const updated = investments.map(i => i.id === id 
        ? { ...i, preço_atual: newPrice, data_atualização: new Date().toISOString() } 
        : i
      );
      setInvestments(updated);
      localStorage.setItem('fin_investments', JSON.stringify(updated));
    }
  };

  const deleteInvestment = async (id: string) => {
    if (isSupabaseConfigured && user) {
      const { error } = await supabase!
        .from('investments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      loadSupabaseData(user.id);
    } else {
      const updated = investments.filter(i => i.id !== id);
      setInvestments(updated);
      localStorage.setItem('fin_investments', JSON.stringify(updated));
      const updatedMovs = investmentMovements.filter(m => m.investment_id !== id);
      setInvestmentMovements(updatedMovs);
      localStorage.setItem('fin_movements', JSON.stringify(updatedMovs));
    }
  };

  // Investment Movements
  const addInvestmentMovement = async (mov: Omit<InvestmentMovement, 'id' | 'created_at'>) => {
    if (isSupabaseConfigured && user) {
      // Begin transaction manually by inserting the movement and updating the investment
      const { error: movErr } = await supabase!
        .from('investment_movements')
        .insert([{ ...mov, user_id: user.id }]);
      if (movErr) throw movErr;

      // Recalculate quantity and avg price
      const targetInv = investments.find(i => i.id === mov.investment_id);
      if (targetInv) {
        let newQty = Number(targetInv.quantidade);
        let newAvgPrice = Number(targetInv.preço_medio);
        const movQty = Number(mov.quantidade);
        const movVal = Number(mov.valor);

        if (mov.tipo === 'aporte') {
          const totalCost = (newQty * newAvgPrice) + movVal;
          newQty += movQty;
          newAvgPrice = newQty > 0 ? totalCost / newQty : 0;
        } else {
          newQty = Math.max(0, newQty - movQty);
        }

        const { error: invErr } = await supabase!
          .from('investments')
          .update({ quantidade: newQty, preço_medio: newAvgPrice })
          .eq('id', mov.investment_id);
        
        if (invErr) throw invErr;
      }
      loadSupabaseData(user.id);
    } else {
      const newMov: InvestmentMovement = {
        ...mov,
        id: generateId(),
        created_at: new Date().toISOString()
      };
      
      const updatedMovs = [newMov, ...investmentMovements];
      setInvestmentMovements(updatedMovs);
      localStorage.setItem('fin_movements', JSON.stringify(updatedMovs));

      // Update investment average price and quantity
      const updatedInvs = investments.map(i => {
        if (i.id === mov.investment_id) {
          let newQty = Number(i.quantidade);
          let newAvgPrice = Number(i.preço_medio);
          const movQty = Number(mov.quantidade);
          const movVal = Number(mov.valor);

          if (mov.tipo === 'aporte') {
            const totalCost = (newQty * newAvgPrice) + movVal;
            newQty += movQty;
            newAvgPrice = newQty > 0 ? totalCost / newQty : 0;
          } else {
            newQty = Math.max(0, newQty - movQty);
          }

          return {
            ...i,
            quantidade: newQty,
            preço_medio: newAvgPrice
          };
        }
        return i;
      });

      setInvestments(updatedInvs);
      localStorage.setItem('fin_investments', JSON.stringify(updatedInvs));
    }
  };

  // Goals
  const addGoal = async (goal: Omit<Goal, 'id' | 'created_at'>) => {
    if (isSupabaseConfigured && user) {
      const { error } = await supabase!
        .from('goals')
        .insert([{ ...goal, user_id: user.id }]);
      if (error) throw error;
      loadSupabaseData(user.id);
    } else {
      const newGoal: Goal = {
        ...goal,
        id: generateId(),
        created_at: new Date().toISOString()
      };
      const updated = [...goals, newGoal];
      setGoals(updated);
      localStorage.setItem('fin_goals', JSON.stringify(updated));
    }
  };

  const editGoal = async (id: string, updatedFields: Partial<Goal>) => {
    if (isSupabaseConfigured && user) {
      const { error } = await supabase!
        .from('goals')
        .update(updatedFields)
        .eq('id', id);
      if (error) throw error;
      loadSupabaseData(user.id);
    } else {
      const updated = goals.map(g => g.id === id ? { ...g, ...updatedFields } : g);
      setGoals(updated);
      localStorage.setItem('fin_goals', JSON.stringify(updated));
    }
  };

  const deleteGoal = async (id: string) => {
    if (isSupabaseConfigured && user) {
      const { error } = await supabase!
        .from('goals')
        .delete()
        .eq('id', id);
      if (error) throw error;
      loadSupabaseData(user.id);
    } else {
      const updated = goals.filter(g => g.id !== id);
      setGoals(updated);
      localStorage.setItem('fin_goals', JSON.stringify(updated));
    }
  };

  return (
    <FinanceContext.Provider value={{
      user,
      transactions,
      categories,
      investments,
      investmentMovements,
      goals,
      isLoading,
      isSupabase: isSupabaseConfigured,
      isTransactionModalOpen,
      setTransactionModalOpen,
      signOut,
      addTransaction,
      editTransaction,
      deleteTransaction,
      addCategory,
      editCategory,
      deleteCategory,
      addInvestment,
      updateInvestmentPrice,
      deleteInvestment,
      addInvestmentMovement,
      addGoal,
      editGoal,
      deleteGoal,
      refreshData
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
