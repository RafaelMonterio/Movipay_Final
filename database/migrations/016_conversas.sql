-- ============================================================
-- 016_conversations.sql
--
-- Chat direto entre cliente e trabalhador, SEM depender de um pedido.
--
-- Por que isso é necessário: `chat_messages` só existia amarrada a
-- `order_id NOT NULL`. Ou seja, era impossível um cliente falar com um
-- trabalhador antes de contratar — que é exatamente o que os botões
-- "Chat" (perfil) e "Contato" (Shorts) precisam fazer.
--
-- Estratégia compatível: cria-se uma `conversations` (uma thread por
-- par cliente↔trabalhador), `chat_messages.order_id` passa a aceitar
-- NULL e ganha `conversation_id`. Todas as mensagens que já existiam
-- são migradas para a conversa correspondente ao par do pedido, então
-- o chat dentro do pedido continua funcionando exatamente como antes
-- (a rota antiga /chat/:orderId resolve o pedido -> conversa).
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
  id              SERIAL PRIMARY KEY,
  client_id       INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  worker_id       INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin          VARCHAR(20) NOT NULL DEFAULT 'direct'
                    CHECK (origin IN ('direct', 'order', 'short', 'profile')),
  origin_short_id INTEGER     REFERENCES shorts(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, worker_id),
  CHECK (client_id <> worker_id)
);
CREATE INDEX IF NOT EXISTS idx_conversations_client ON conversations (client_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_worker ON conversations (worker_id, last_message_at DESC);

COMMENT ON TABLE conversations IS 'Uma thread de chat por par cliente↔trabalhador, independente de pedido.';
COMMENT ON COLUMN conversations.origin IS 'De onde a conversa nasceu: perfil, Shorts, pedido ou direta.';

-- chat_messages: order_id vira opcional e ganha a conversa
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'order_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE chat_messages ALTER COLUMN order_id DROP NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_conversation ON chat_messages (conversation_id, created_at);

-- Backfill: cria uma conversa para cada par de pedido que já tem mensagem
INSERT INTO conversations (client_id, worker_id, origin, created_at)
SELECT DISTINCT o.client_id, o.worker_id, 'order', MIN(m.created_at)
FROM chat_messages m
JOIN orders o ON o.id = m.order_id
WHERE m.conversation_id IS NULL
GROUP BY o.client_id, o.worker_id
ON CONFLICT (client_id, worker_id) DO NOTHING;

UPDATE chat_messages m
SET conversation_id = c.id
FROM orders o
JOIN conversations c ON c.client_id = o.client_id AND c.worker_id = o.worker_id
WHERE m.order_id = o.id AND m.conversation_id IS NULL;

UPDATE conversations c
SET last_message_at = sub.last_at
FROM (SELECT conversation_id, MAX(created_at) AS last_at FROM chat_messages GROUP BY conversation_id) sub
WHERE sub.conversation_id = c.id AND c.last_message_at IS DISTINCT FROM sub.last_at;

-- Mantém last_message_at sempre em dia (usado para ordenar a lista de conversas)
CREATE OR REPLACE FUNCTION trg_touch_conversation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS touch_conversation ON chat_messages;
CREATE TRIGGER touch_conversation
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION trg_touch_conversation();
