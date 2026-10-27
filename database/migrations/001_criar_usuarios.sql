-- ============================================================
-- 001_create_users.sql
-- Tabela principal de usuários (clientes e trabalhadores)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120)        NOT NULL,
  email         VARCHAR(255)        NOT NULL UNIQUE,
  password_hash TEXT                NOT NULL,
  mode          VARCHAR(10)         NOT NULL DEFAULT 'client'
                  CHECK (mode IN ('client', 'worker')),
  points        INTEGER             NOT NULL DEFAULT 0
                  CHECK (points >= 0),
  avatar_url    TEXT,
  phone         VARCHAR(20),
  bio           TEXT,
  is_active     BOOLEAN             NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- Índice para login (buscado toda vez que alguém entra)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Índice para filtrar trabalhadores
CREATE INDEX IF NOT EXISTS idx_users_mode ON users (mode);

-- Comentários nas colunas (boa prática de documentação)
COMMENT ON TABLE  users              IS 'Usuários do sistema — clientes e trabalhadores';
COMMENT ON COLUMN users.mode         IS 'client ou worker — modo atual do usuário';
COMMENT ON COLUMN users.points       IS 'Saldo atual de pontos de gamificação';
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt da senha — nunca a senha em texto puro';
