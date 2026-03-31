-- ============================================================
-- LIFACE - Schema Inicial do Banco de Dados
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- Habilita UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: campeonatos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campeonatos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  categoria   TEXT NOT NULL DEFAULT 'Adulto',  -- Adulto, Aspirante, Sub-20, Veterano, Feminino
  edicao      TEXT NOT NULL,                    -- Ex: "2025"
  periodo     TEXT NOT NULL,                    -- Ex: "Jan - Jun"
  taxa_inscricao NUMERIC(10, 2) DEFAULT 500.00,
  status      TEXT NOT NULL DEFAULT 'Ativo',   -- Ativo, Em Breve, Encerrado
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: equipes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.equipes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome           TEXT NOT NULL,
  fantasia       TEXT,                          -- Nome fantasia / apelido
  responsavel    TEXT NOT NULL,
  contato        TEXT NOT NULL,
  campeonato_id  UUID REFERENCES public.campeonatos(id) ON DELETE SET NULL,
  campeonato_nome TEXT,                         -- Cache do nome para exibição rápida
  taxa_inscricao NUMERIC(10, 2) DEFAULT 500.00,
  status         TEXT NOT NULL DEFAULT 'Regular', -- Regular, Irregular, SuspensaRegras
  criado_em      TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: atletas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.atletas (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome                TEXT NOT NULL,
  apelido             TEXT,
  documento           TEXT,                     -- RG ou CPF
  posicao             TEXT,                     -- Goleiro, Fixo, Ala...
  equipe_id           UUID REFERENCES public.equipes(id) ON DELETE SET NULL,
  equipe_nome         TEXT,                     -- Cache do nome da equipe
  campeonato_heranca  TEXT,                     -- Campeonato herdado da equipe
  historico           TEXT NOT NULL DEFAULT 'Limpo',
  status              TEXT NOT NULL DEFAULT 'Regular', -- Regular, Irregular, Suspenso
  taxa_carteira       NUMERIC(10, 2) DEFAULT 15.00,
  criado_em           TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: jogos (partidas / súmulas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jogos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campeonato_id  UUID REFERENCES public.campeonatos(id) ON DELETE SET NULL,
  campeonato_nome TEXT NOT NULL,
  rodada         TEXT NOT NULL DEFAULT '1ª Rodada',
  data           DATE NOT NULL,
  hora           TIME NOT NULL,
  quadra         TEXT NOT NULL,
  equipe_a_id    UUID REFERENCES public.equipes(id) ON DELETE SET NULL,
  equipe_a_nome  TEXT NOT NULL,
  equipe_b_id    UUID REFERENCES public.equipes(id) ON DELETE SET NULL,
  equipe_b_nome  TEXT NOT NULL,
  gols_a         INT NOT NULL DEFAULT 0,
  gols_b         INT NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'Agendado', -- Agendado, Encerrado, W.O
  criado_em      TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: eventos_jogo (lances da súmula: gols, cartões)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.eventos_jogo (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jogo_id    UUID NOT NULL REFERENCES public.jogos(id) ON DELETE CASCADE,
  equipe     TEXT NOT NULL,
  jogador    TEXT NOT NULL,
  tipo       TEXT NOT NULL,  -- Gol, Amarelo, Vermelho
  tempo      TEXT NOT NULL,  -- Ex: "12:30"
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: suspensoes (tribunal disciplinar)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.suspensoes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  infrator      TEXT NOT NULL,
  equipe        TEXT NOT NULL,
  campeonato    TEXT NOT NULL,
  motivo        TEXT NOT NULL,
  data_fato     DATE,
  penas         TEXT NOT NULL DEFAULT 'Suspensão Automática - 1 Jogo',
  status        TEXT NOT NULL DEFAULT 'Suspenso', -- Suspenso, Cumprida
  multa_valor   NUMERIC(10, 2) DEFAULT 0.00,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: financeiro (cobranças, receitas, multas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financeiro (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  descricao   TEXT NOT NULL,
  equipe      TEXT NOT NULL,
  vencimento  DATE NOT NULL,             -- Data de vencimento
  valor       NUMERIC(10, 2) NOT NULL,
  status      TEXT NOT NULL DEFAULT 'Pendente', -- Pendente, Pago, Atrasado
  tipo        TEXT DEFAULT 'receita', -- receita, despesa
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: arbitros
-- ============================================================
CREATE TABLE IF NOT EXISTS public.arbitros (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  documento   TEXT,
  contato     TEXT,
  categoria   TEXT DEFAULT 'Regional',
  status      TEXT NOT NULL DEFAULT 'Ativo', -- Ativo, Inativo
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: diretoria (membros da diretoria da liga)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.diretoria (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  cargo       TEXT NOT NULL,
  contato     TEXT,
  documento   TEXT,
  status      TEXT NOT NULL DEFAULT 'Ativo',
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: campeoes (histórico de campeões por edição)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campeoes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  equipe      TEXT NOT NULL,
  categoria   TEXT NOT NULL DEFAULT 'Adulto',
  ano         INTEGER NOT NULL,
  posicao     TEXT NOT NULL DEFAULT 'Campeão',
  foto_url    TEXT,
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS: atualizar campo atualizado_em automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_campeonatos_updated_at ON public.campeonatos;
CREATE TRIGGER trg_campeonatos_updated_at
  BEFORE UPDATE ON public.campeonatos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_equipes_updated_at ON public.equipes;
CREATE TRIGGER trg_equipes_updated_at
  BEFORE UPDATE ON public.equipes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_atletas_updated_at ON public.atletas;
CREATE TRIGGER trg_atletas_updated_at
  BEFORE UPDATE ON public.atletas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_jogos_updated_at ON public.jogos;
CREATE TRIGGER trg_jogos_updated_at
  BEFORE UPDATE ON public.jogos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_suspensoes_updated_at ON public.suspensoes;
CREATE TRIGGER trg_suspensoes_updated_at
  BEFORE UPDATE ON public.suspensoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_financeiro_updated_at ON public.financeiro;
CREATE TRIGGER trg_financeiro_updated_at
  BEFORE UPDATE ON public.financeiro
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_arbitros_updated_at ON public.arbitros;
CREATE TRIGGER trg_arbitros_updated_at
  BEFORE UPDATE ON public.arbitros
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_diretoria_updated_at ON public.diretoria;
CREATE TRIGGER trg_diretoria_updated_at
  BEFORE UPDATE ON public.diretoria
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_campeoes_updated_at ON public.campeoes;
CREATE TRIGGER trg_campeoes_updated_at
  BEFORE UPDATE ON public.campeoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();



-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Permite acesso autenticado a todas as tabelas
-- ============================================================
ALTER TABLE public.campeonatos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atletas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jogos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_jogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspensoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbitros     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diretoria    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeoes     ENABLE ROW LEVEL SECURITY;

-- Política: usuários autenticados têm acesso total
CREATE POLICY "Acesso total para autenticados" ON public.campeonatos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acesso total para autenticados" ON public.equipes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acesso total para autenticados" ON public.atletas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acesso total para autenticados" ON public.jogos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acesso total para autenticados" ON public.eventos_jogo
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acesso total para autenticados" ON public.suspensoes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acesso total para autenticados" ON public.financeiro
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acesso total para autenticados" ON public.arbitros
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acesso total para autenticados" ON public.diretoria
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Acesso total para autenticados" ON public.campeoes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_equipes_campeonato_id ON public.equipes(campeonato_id);
CREATE INDEX IF NOT EXISTS idx_atletas_equipe_id     ON public.atletas(equipe_id);
CREATE INDEX IF NOT EXISTS idx_jogos_campeonato_id   ON public.jogos(campeonato_id);
CREATE INDEX IF NOT EXISTS idx_jogos_status          ON public.jogos(status);
CREATE INDEX IF NOT EXISTS idx_eventos_jogo_id       ON public.eventos_jogo(jogo_id);
CREATE INDEX IF NOT EXISTS idx_suspensoes_status     ON public.suspensoes(status);
CREATE INDEX IF NOT EXISTS idx_financeiro_status     ON public.financeiro(status);
CREATE INDEX IF NOT EXISTS idx_campeoes_ano          ON public.campeoes(ano);
