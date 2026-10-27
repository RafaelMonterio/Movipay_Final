-- ============================================================
-- 010_movipay_mobile_extras.sql
-- Extensões aditivas criadas para o app mobile. Nenhuma tabela
-- ou coluna já existente do projeto original é alterada aqui.
-- ============================================================

-- Favoritos do cliente (trabalhadores que ele marcou com estrela)
CREATE TABLE IF NOT EXISTS favorites (
  id         SERIAL PRIMARY KEY,
  client_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  worker_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, worker_id)
);
CREATE INDEX IF NOT EXISTS idx_favorites_client ON favorites (client_id);
COMMENT ON TABLE favorites IS 'Trabalhadores favoritados por um cliente (usado na Home do cliente)';

-- Histórico de status do pedido (timeline visual) — o schema original só
-- guarda created_at/completed_at/cancelled_at, sem registrar quando o pedido
-- foi aceito ou colocado em andamento. Esta tabela é alimentada por uma
-- trigger (ver database/triggers/registrar_historico_estado_pedido.sql) e também
-- pela própria rota ao criar o pedido.
CREATE TABLE IF NOT EXISTS order_status_history (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     VARCHAR(20) NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_osh_order ON order_status_history (order_id, created_at);
COMMENT ON TABLE order_status_history IS 'Linha do tempo de status de um pedido, para exibir no app';
