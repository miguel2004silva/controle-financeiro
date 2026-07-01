-- 1. EXTENSIONS
-- Enable uuid-ossp for random UUID generation (in case gen_random_uuid is not default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    cor VARCHAR(7) NOT NULL, -- Hex color (e.g., #3B82F6)
    icone VARCHAR(50) NOT NULL, -- Icon identifier (e.g., "shopping-bag", "utensils")
    orçamento_mensal NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
    categoria_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    descrição TEXT NOT NULL,
    data TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    recorrente BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. INVESTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ação', 'fii', 'renda_fixa', 'cripto')),
    ticker VARCHAR(20) NOT NULL,
    quantidade NUMERIC(16, 6) DEFAULT 0.000000 NOT NULL CHECK (quantidade >= 0),
    preço_medio NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (preço_medio >= 0),
    preço_atual NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (preço_atual >= 0),
    data_atualização TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, ticker)
);

-- Enable RLS
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- 5. INVESTMENT MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.investment_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('aporte', 'resgate')),
    valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0), -- Total value of the transaction (price * qty)
    quantidade NUMERIC(16, 6) NOT NULL CHECK (quantidade > 0),
    data TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.investment_movements ENABLE ROW LEVEL SECURITY;

-- 6. GOALS TABLE
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    valor_alvo NUMERIC(12, 2) NOT NULL CHECK (valor_alvo > 0),
    valor_atual NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (valor_atual >= 0),
    prazo DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES FOR ALL TABLES

-- Categories Policies
CREATE POLICY "Users can manage their own categories" 
    ON public.categories FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can manage their own transactions" 
    ON public.transactions FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Investments Policies
CREATE POLICY "Users can manage their own investments" 
    ON public.investments FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Investment Movements Policies
CREATE POLICY "Users can manage their own investment movements" 
    ON public.investment_movements FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Goals Policies
CREATE POLICY "Users can manage their own goals" 
    ON public.goals FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);
