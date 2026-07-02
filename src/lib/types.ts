export interface Category {
  id: string;
  user_id?: string;
  nome: string;
  cor: string;
  icone: string;
  orçamento_mensal: number;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  tipo: 'receita' | 'despesa';
  valor: number;
  categoria_id: string | null;
  descrição: string;
  data: string; // ISO Date String (YYYY-MM-DD or full timestamp)
  recorrente: boolean;
  investment_movement_id?: string | null;
  created_at?: string;
}

export interface Investment {
  id: string;
  user_id?: string;
  tipo: 'ação' | 'fii' | 'renda_fixa' | 'cripto';
  ticker: string;
  quantidade: number;
  preço_medio: number;
  preço_atual: number;
  data_atualização?: string;
  created_at?: string;
}

export interface InvestmentMovement {
  id: string;
  user_id?: string;
  investment_id: string;
  tipo: 'aporte' | 'resgate';
  valor: number;
  quantidade: number;
  data: string;
  created_at?: string;
}

export interface Goal {
  id: string;
  user_id?: string;
  nome: string;
  valor_alvo: number;
  valor_atual: number;
  prazo?: string; // ISO Date String (YYYY-MM-DD) or empty
  created_at?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
}
