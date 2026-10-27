-- ============================================================
-- 008_add_v05_columns.sql
-- Colunas novas para funcionalidades da v0.5
-- ============================================================

-- Localização geográfica dos usuários
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS lat          FLOAT,
  ADD COLUMN IF NOT EXISTS lng          FLOAT,
  ADD COLUMN IF NOT EXISTS city         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_time_avg INTEGER DEFAULT NULL; -- minutos

-- Portfólio de fotos do trabalhador
CREATE TABLE IF NOT EXISTS portfolio_photos (
  id          SERIAL PRIMARY KEY,
  worker_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,           -- base64 ou URL futura
  caption     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_portfolio_worker ON portfolio_photos(worker_id);

-- Slots de disponibilidade do trabalhador
CREATE TABLE IF NOT EXISTS availability_slots (
  id          SERIAL PRIMARY KEY,
  worker_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekday     SMALLINT NOT NULL CHECK(weekday BETWEEN 0 AND 6), -- 0=dom, 6=sáb
  hour_start  SMALLINT NOT NULL CHECK(hour_start BETWEEN 0 AND 23),
  hour_end    SMALLINT NOT NULL CHECK(hour_end BETWEEN 1 AND 24),
  UNIQUE(worker_id, weekday, hour_start)
);
CREATE INDEX IF NOT EXISTS idx_slots_worker ON availability_slots(worker_id);

-- Orçamentos (cliente pede, trabalhadores propõem)
CREATE TABLE IF NOT EXISTS quotes (
  id          SERIAL PRIMARY KEY,
  client_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  title       VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  budget_max  NUMERIC(10,2),           -- orçamento máximo do cliente
  city        VARCHAR(100),
  status      VARCHAR(20) NOT NULL DEFAULT 'open'
                CHECK(status IN ('open','in_review','closed','cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

-- Propostas dos trabalhadores para os orçamentos
CREATE TABLE IF NOT EXISTS quote_proposals (
  id          SERIAL PRIMARY KEY,
  quote_id    INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  worker_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price       NUMERIC(10,2) NOT NULL,
  message     TEXT NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK(status IN ('pending','accepted','rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(quote_id, worker_id)
);

-- Carteira/escrow de pagamento
CREATE TABLE IF NOT EXISTS payments (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payer_id    INTEGER NOT NULL REFERENCES users(id),
  payee_id    INTEGER NOT NULL REFERENCES users(id),
  amount      NUMERIC(10,2) NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'held'
                CHECK(status IN ('held','released','refunded','cancelled')),
  held_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para orçamentos
CREATE INDEX IF NOT EXISTS idx_quotes_client   ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status   ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_proposals_quote ON quote_proposals(quote_id);
CREATE INDEX IF NOT EXISTS idx_proposals_worker ON quote_proposals(worker_id);
CREATE INDEX IF NOT EXISTS idx_payments_order  ON payments(order_id);

COMMENT ON TABLE quotes           IS 'Pedidos de orçamento abertos pelos clientes';
COMMENT ON TABLE quote_proposals  IS 'Propostas dos trabalhadores para cada orçamento';
COMMENT ON TABLE availability_slots IS 'Grade de disponibilidade semanal do trabalhador';
COMMENT ON TABLE payments         IS 'Escrow de pagamentos — dinheiro retido até conclusão';
