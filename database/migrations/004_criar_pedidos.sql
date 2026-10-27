-- ============================================================
-- 004_create_orders.sql
-- Pedidos/contratações entre clientes e trabalhadores
-- Depende de: 001_create_users, 003_create_services
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
  id            SERIAL PRIMARY KEY,
  client_id     INTEGER       NOT NULL
                  REFERENCES users(id) ON DELETE RESTRICT,
  worker_id     INTEGER       NOT NULL
                  REFERENCES users(id) ON DELETE RESTRICT,
  service_id    INTEGER
                  REFERENCES services(id) ON DELETE SET NULL,
  status        VARCHAR(20)   NOT NULL DEFAULT 'pending'
                  CHECK (status IN (
                    'pending',      -- aguardando resposta do trabalhador
                    'accepted',     -- trabalhador aceitou
                    'in_progress',  -- serviço em andamento
                    'completed',    -- concluído com sucesso
                    'cancelled'     -- cancelado por qualquer parte
                  )),
  price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  notes         TEXT,                              -- observações do cliente
  scheduled_at  TIMESTAMPTZ,                       -- data/hora agendada
  completed_at  TIMESTAMPTZ,                       -- quando foi concluído
  cancelled_at  TIMESTAMPTZ,                       -- quando foi cancelado
  cancel_reason TEXT,                              -- motivo do cancelamento
  paid_at       TIMESTAMPTZ,                       -- quando foi pago (futuro: gateway)
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Buscar pedidos de um cliente
CREATE INDEX IF NOT EXISTS idx_orders_client_id  ON orders (client_id);
-- Buscar pedidos de um trabalhador
CREATE INDEX IF NOT EXISTS idx_orders_worker_id  ON orders (worker_id);
-- Filtrar por status
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders (status);
-- Ordenar por data
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

COMMENT ON TABLE  orders             IS 'Contratações entre clientes e trabalhadores';
COMMENT ON COLUMN orders.status      IS 'Estado atual do pedido no fluxo de trabalho';
COMMENT ON COLUMN orders.scheduled_at IS 'Data/hora agendada para execução do serviço';
