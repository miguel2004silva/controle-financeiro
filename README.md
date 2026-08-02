# 💚 Controle Financeiro Premium

Plataforma web de gerenciamento financeiro pessoal e patrimonial de alta performance, desenvolvida com **Next.js 14**, **TypeScript**, **TailwindCSS**, **Framer Motion**, **Recharts** e **Supabase (PostgreSQL + Auth)**.

O sistema possui uma interface limpa, elegante e moderna no tema **Menta & Esmeralda**, focada em usabilidade, privacidade de valores, animações fluidas e gráficos intuitivos.

---

## 🌟 Principais Funcionalidades

### 📊 1. Visão Geral (Dashboard)
- **Hero Card de Saldo Interativo**: Alternador em pílulas para visualizar **Patrimônio Total**, **Saldo em Conta (Liquidez)**, **Investimentos**, **Reserva de Emergência** e **Saldo Líquido do Mês**.
- **Privacidade com 1 Clique (Modo Olho 👁️)**: Oculte ou exiba instantaneamente todos os valores sigilosos em tela (`R$ •••••••`).
- **Gráfico de Pizza de Gastos por Categoria**: Visualização automática de todas as despesas do mês agrupadas por categoria, acompanhada de lista com porcentagens e valores em R$.
- **Resumo do Mês Selecionado**: Indicadores rápidos de Entradas (Receitas), Saídas (Despesas) e Resultado Líquido.
- **Acesso Rápido Bento Grid**: Cartões com atalhos diretos para as áreas mais importantes.

### 🛡️ 2. Reserva de Emergência Dedicada (`/reserva`)
- **Rota e Página Própria**: Tela exclusiva focada na blindagem financeira da sua família.
- **Escudo de Proteção Interativo (`ShieldCheck`)**: Nivelador visual de progresso da reserva baseada no custo fixo de 6 meses.
- **Controles Rápidos**: Botões de aporte e resgate imediato com atualização de saldo em tempo real.

### 🎯 3. Orçamentos & Metas (`/metas`)
- **Gestão de Metas de Longo Prazo**: Acompanhe o progresso de conquistas e sonhos.
- **Estado Inicial Inspirador**: Quando sem metas, exibe uma interface guiada convidando a cadastrar os primeiros objetivos.
- **Orçamentos Mensais por Categoria**: Limite de gastos por categoria com indicador visual de consumo e alerta de limite excedido.

### 🧮 4. Simulador de Aportes Interativo
- **Calculadora com Slider (0% a 100%)**: Arraste o slider para calcular quanto aportar com base no seu salário mensal.
- **Alocação Recomendada**: Divisão automática entre Renda Fixa, Ações, FIIs e Reserva.

### 🎨 5. Componente de Seleção Customizado (`CustomSelect`)
- **Design Exclusivo em Pílula**: Substituição dos seletores padrão do navegador por um dropdown arredondado em tom off-white (`#FAF6ED`).
- **Barra de Pesquisa Interna**: Campo de busca em caixa alta (*`PESQUISAR CATEGORIA`* / *`PESQUISAR OPÇÃO`*) para localização rápida de itens.

### 🔐 6. Tela de Login no Estilo Komadi (`/login`)
- **Split-Screen 50/50**: Lado esquerdo com painel visual vetorizado em degradê esmeralda; lado direito com formulário responsivo e tipografia **Sora**.
- **Alternador de Perfis (Pill Switcher)**: Alterne facilmente entre *Titular da Conta* e *Modo Demonstrativo (Sandbox)*.
- **Autenticação Flexível**: Suporte a e-mail/senha e logins sociais com Google, Apple e GitHub.

### 🔑 7. Painel Secreto de Gestão de Usuários (`/gestao-privada-m7k9`)
- **URL Restrita e Protegida por PIN**: Acesso protegido por PIN mestre para gerenciamento de contas.
- **Controle de Acessos**: Formulário de criação de usuários e tabela de gerenciamento com bloqueio/exclusão.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [TailwindCSS](https://tailwindcss.com/) + CSS Variables
- **Tipografia**: [Sora](https://fonts.google.com/specimen/Sora) (Google Fonts)
- **Animações**: [Framer Motion](https://www.framer.com/motion/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **Backend & Autenticação**: [Supabase](https://supabase.com/) (PostgreSQL + RLS + Auth)
- **Ícones**: [Lucide React](https://lucide.dev/)

---

## 📁 Estrutura de Pastas do Projeto

```bash
controle-financeiro/
├── public/
│   └── logo.png                   # Logo oficial da aplicação
├── src/
│   ├── app/
│   │   ├── gestao-privada-m7k9/    # Painel secreto de gestão de usuários
│   │   ├── investimentos/         # Gestão e planilha de ativos
│   │   ├── login/                 # Tela de login split-screen (Estilo Komadi)
│   │   ├── metas/                 # Gestão de metas e orçamentos por categoria
│   │   ├── relatorios/            # Relatórios consolidados e relatórios anuais
│   │   ├── reserva/               # Rota própria para Reserva de Emergência
│   │   ├── transacoes/            # Registro e extrato de lançamentos
│   │   ├── globals.css            # Variáveis globais e paleta Menta/Esmeralda
│   │   ├── layout.tsx             # Root Layout com carregamento da fonte Sora
│   │   ├── page.tsx               # Dashboard (Visão Geral)
│   │   └── template.tsx           # Animações globais de transição de rotas
│   ├── components/
│   │   ├── category-icon.tsx       # Renderizador dinâmico de ícones de categoria
│   │   ├── custom-select.tsx       # Componente de seleção em pílula com busca
│   │   ├── emergency-reserve-card.tsx # Card do Escudo de Emergência
│   │   ├── filter-panel.tsx       # Painel de filtros avançados por período e faixa
│   │   ├── investment-slider-modal.tsx # Modal interativo de simulação de aportes
│   │   ├── layout-wrapper.tsx     # Sidebar e navegação responsiva
│   │   └── quick-transaction-modal.tsx # Modal de novo lançamento rápido
│   ├── context/
│   │   └── finance-context.tsx    # Contexto global de estado, dados e Supabase
│   └── lib/
│       ├── supabase.ts            # Cliente e configuração do Supabase
│       └── types.ts               # Interfaces e definições de tipos TypeScript
├── supabase_schema.sql            # Script SQL completo de tabelas e políticas RLS
├── tailwind.config.ts             # Configurações do TailwindCSS
└── README.md                      # Documentação oficial do projeto
```

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- **Node.js** (v18.x ou superior)
- **npm** ou **yarn**

### 1. Clonar o repositório
```bash
git clone https://github.com/miguel2004silva/controle-financeiro.git
cd controle-financeiro
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente (Opcional para Supabase)
Crie um arquivo `.env.local` na raiz do projeto com as credenciais do seu Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

> *Nota: Se você não configurar as variáveis do Supabase, o sistema funciona perfeitamente no **Modo Sandbox / Demonstrativo** salvando os dados no navegador (localStorage).*

### 4. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```

Abra o seu navegador em **`http://localhost:3000`**.

---

## 🗄️ Configuração do Banco de Dados (Supabase SQL)

Para rodar em modo produção integrado ao Supabase, execute o script SQL contido no arquivo `supabase_schema.sql` no **SQL Editor** do seu painel Supabase.

O script criará automaticamente:
- Tabela de **Categorias** (`categories`)
- Tabela de **Transações** (`transactions`)
- Tabela de **Investimentos** (`investments`)
- Tabela de **Movimentações de Ativos** (`investment_movements`)
- Tabela de **Metas** (`goals`)
- Políticas de Segurança a Nível de Linha (**Row Level Security - RLS**) isolando os dados de cada usuário.

---

## 📄 Licença

Este projeto foi desenvolvido com foco em alta performance e design premium. Livre para uso e personalização.
