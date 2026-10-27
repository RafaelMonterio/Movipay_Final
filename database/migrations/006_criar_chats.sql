-- ============================================================
-- 006_create_chats.sql
-- Mensagens entre clientes e trabalhadores via pedido
-- Depende de: 001_create_users, 004_create_orders
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER       NOT NULL
                REFERENCES orders(id) ON DELETE CASCADE,
  sender_id   INTEGER       NOT NULL
                REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT          NOT NULL CHECK (length(content) > 0),
  is_read     BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Buscar mensagens de um pedido (ordenado por data)
CREATE INDEX IF NOT EXISTS idx_chat_order_id    ON chat_messages (order_id, created_at);
-- Buscar mensagens não lidas de um usuário
CREATE INDEX IF NOT EXISTS idx_chat_sender_read ON chat_messages (sender_id, is_read);

COMMENT ON TABLE chat_messages IS 'Mensagens do chat vinculadas a um pedido específico';
