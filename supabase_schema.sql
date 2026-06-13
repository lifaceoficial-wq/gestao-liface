-- Supabase SQL Schema for Nicolau Project
-- Execute this in your Supabase SQL Editor to create the missing tables

-- 1. Arbitros
CREATE TABLE IF NOT EXISTS public.arbitros (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  funcao text NOT NULL,
  telefone text,
  jogos_atuados integer DEFAULT 0,
  status text DEFAULT 'Ativo',
  valor_taxa numeric(10,2) DEFAULT 0,
  criado_em timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Eventos
CREATE TABLE IF NOT EXISTS public.eventos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  data text NOT NULL,
  local text,
  tipo text NOT NULL,
  status text DEFAULT 'Pendente',
  participantes_esperados integer DEFAULT 0,
  criado_em timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Historico
CREATE TABLE IF NOT EXISTS public.historico (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  descricao text,
  data text NOT NULL,
  tipo text NOT NULL,
  ano integer,
  criado_em timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Midias (Albums)
CREATE TABLE IF NOT EXISTS public.midias (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  tipo text DEFAULT 'foto',
  itens integer DEFAULT 0,
  data text,
  badge text,
  cover_url text,
  criado_em timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Projetos Sociais
CREATE TABLE IF NOT EXISTS public.projetos_sociais (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  tipo text NOT NULL,
  publico text,
  beneficiados integer DEFAULT 0,
  local text,
  status text DEFAULT 'Planejado',
  criado_em timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- If not already created, ensure financeiro exists too since Arbitros will use it
CREATE TABLE IF NOT EXISTS public.financeiro (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao text NOT NULL,
  equipe text,
  vencimento text NOT NULL,
  valor numeric(10,2) NOT NULL,
  status text DEFAULT 'Pendente',
  criado_em timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Diretoria
CREATE TABLE IF NOT EXISTS public.diretoria (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  cargo text NOT NULL,
  periodo text NOT NULL,
  contato text,
  permissoes text DEFAULT 'Total',
  criado_em timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
