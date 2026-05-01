-- Smart Garagem schema
-- Idempotente: pode ser executado múltiplas vezes.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================================
-- USERS
-- =========================================================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  nome        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================================
-- VEÍCULOS
-- =========================================================================
DO $$ BEGIN
  CREATE TYPE status_geral AS ENUM ('ok', 'atencao', 'urgente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS veiculos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  placa           TEXT NOT NULL,
  marca           TEXT NOT NULL,
  modelo          TEXT NOT NULL,
  ano             INT  NOT NULL,
  cor             TEXT NOT NULL,
  combustivel     TEXT NOT NULL,
  chassi          TEXT NOT NULL,
  renavam         TEXT NOT NULL,
  proprietario    TEXT NOT NULL,
  foto_url        TEXT,
  status          status_geral NOT NULL DEFAULT 'ok',
  proxima_acao    TEXT NOT NULL DEFAULT '',
  ind_ipva        status_geral NOT NULL DEFAULT 'ok',
  ind_licenc      status_geral NOT NULL DEFAULT 'ok',
  ind_seguro      status_geral NOT NULL DEFAULT 'ok',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, placa)
);

CREATE INDEX IF NOT EXISTS idx_veiculos_user ON veiculos(user_id);

ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS tipo            TEXT NOT NULL DEFAULT 'Carro';
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS ano_fabricacao  INT;
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS ano_modelo      INT;
UPDATE veiculos SET ano_fabricacao = ano WHERE ano_fabricacao IS NULL;
UPDATE veiculos SET ano_modelo     = ano WHERE ano_modelo     IS NULL;

-- =========================================================================
-- PENDÊNCIAS (multas, débitos, restrições)
-- =========================================================================
DO $$ BEGIN
  CREATE TYPE tipo_pendencia AS ENUM ('multa', 'debito', 'restricao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS pendencias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id  UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  tipo        tipo_pendencia NOT NULL,
  descricao   TEXT NOT NULL,
  valor       NUMERIC(12,2) NOT NULL DEFAULT 0,
  prazo       TIMESTAMPTZ NOT NULL,
  status      status_geral NOT NULL DEFAULT 'atencao',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pendencias_veiculo ON pendencias(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_pendencias_prazo   ON pendencias(prazo);

-- =========================================================================
-- IPVA
-- =========================================================================
CREATE TABLE IF NOT EXISTS ipvas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id  UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  ano         INT  NOT NULL,
  valor       NUMERIC(12,2) NOT NULL,
  vencimento  TIMESTAMPTZ NOT NULL,
  pago        BOOLEAN NOT NULL DEFAULT FALSE,
  parcelas    INT NOT NULL DEFAULT 1,
  UNIQUE (veiculo_id, ano)
);

-- =========================================================================
-- LICENCIAMENTOS
-- =========================================================================
CREATE TABLE IF NOT EXISTS licenciamentos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id  UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  ano         INT  NOT NULL,
  valor       NUMERIC(12,2) NOT NULL,
  pago        BOOLEAN NOT NULL DEFAULT FALSE,
  vencimento  TIMESTAMPTZ NOT NULL,
  UNIQUE (veiculo_id, ano)
);

-- =========================================================================
-- SEGUROS
-- =========================================================================
CREATE TABLE IF NOT EXISTS seguros (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id  UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  seguradora  TEXT NOT NULL,
  apolice     TEXT NOT NULL,
  cobertura   TEXT NOT NULL,
  inicio      TIMESTAMPTZ NOT NULL,
  fim         TIMESTAMPTZ NOT NULL,
  vigente     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_seguros_veiculo ON seguros(veiculo_id);

-- =========================================================================
-- TRANSFERÊNCIAS
-- =========================================================================
DO $$ BEGIN
  CREATE TYPE status_transferencia AS ENUM ('rascunho', 'andamento', 'concluida', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS transferencias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id  UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  de_nome     TEXT NOT NULL,
  de_cpf      TEXT NOT NULL,
  para_nome   TEXT NOT NULL,
  para_cpf    TEXT NOT NULL,
  inicio      TIMESTAMPTZ NOT NULL DEFAULT now(),
  status      status_transferencia NOT NULL DEFAULT 'andamento'
);

CREATE INDEX IF NOT EXISTS idx_transferencias_veiculo ON transferencias(veiculo_id);

ALTER TABLE transferencias ADD COLUMN IF NOT EXISTS fluxo       TEXT;
ALTER TABLE transferencias ADD COLUMN IF NOT EXISTS uf          TEXT NOT NULL DEFAULT 'SP';
ALTER TABLE transferencias ADD COLUMN IF NOT EXISTS de_cnpj     TEXT;
ALTER TABLE transferencias ADD COLUMN IF NOT EXISTS para_cnpj   TEXT;
ALTER TABLE transferencias ADD COLUMN IF NOT EXISTS observacoes TEXT;

CREATE TABLE IF NOT EXISTS transferencia_etapas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transferencia_id  UUID NOT NULL REFERENCES transferencias(id) ON DELETE CASCADE,
  codigo            TEXT NOT NULL,
  ordem             INT  NOT NULL,
  titulo            TEXT NOT NULL,
  descricao         TEXT,
  status            TEXT NOT NULL DEFAULT 'pendente',
  concluida_em      TIMESTAMPTZ,
  anexo_url         TEXT,
  observacao        TEXT,
  prazo_em          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (transferencia_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_transf_etapas_transf ON transferencia_etapas(transferencia_id);

-- =========================================================================
-- COFRE: master password e credenciais (CPFs etc.)
-- =========================================================================
CREATE TABLE IF NOT EXISTS vault_master (
  user_id        UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credenciais (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  cpf         TEXT NOT NULL,
  ultimo_uso  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credenciais_user ON credenciais(user_id);

-- =========================================================================
-- PROPRIETÁRIOS (cadastros PF / PJ)
-- =========================================================================
DO $$ BEGIN
  CREATE TYPE tipo_pessoa AS ENUM ('PF', 'PJ');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS proprietarios (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo_pessoa       tipo_pessoa NOT NULL,
  nome_completo     TEXT,
  cpf               TEXT,
  data_nascimento   DATE,
  razao_social      TEXT,
  nome_fantasia     TEXT,
  cnpj              TEXT,
  email             TEXT,
  telefone          TEXT,
  cep               TEXT NOT NULL,
  logradouro        TEXT NOT NULL,
  numero            TEXT NOT NULL,
  complemento       TEXT,
  bairro            TEXT NOT NULL,
  cidade            TEXT NOT NULL,
  uf                TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proprietarios_user ON proprietarios(user_id);
