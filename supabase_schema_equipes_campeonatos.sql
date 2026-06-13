-- Script para habilitar que 1 equipe participe de Vários Campeonatos simultaneamente.
-- Rode este script no seu SQL Editor do Supabase.

CREATE TABLE IF NOT EXISTS public.equipe_campeonatos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  equipe_id uuid NOT NULL,
  campeonato_id uuid NOT NULL,
  campeonato_nome text,
  criado_em timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitando permissões globais (caso sua base use RLS)
ALTER TABLE public.equipe_campeonatos DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
