-- ============================================================
-- 007_create_points.sql
-- Histórico de movimentação de pontos de gamificação
-- Depende de: 001_create_users, 004_create_orders
-- ============================================================

CREATE TABLE IF NOT EXISTS points_history (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER       NOT NULL
                REFERENCES users(id) ON DELETE CASCADE,
  order_id    INTEGER
                REFERENCES orders(id) ON DELETE SET NULL, -- opcional
  type        VARCHAR(40)   NOT NULL
                CHECK (type IN (
                  'order_complete',  -- pedido concluído
                  'bonus',           -- bônus manual/promoção
                  'referral',        -- indicou um amigo
                  'review_given',    -- deixou uma avaliação
                  'penalty'          -- penalidade (cancelamento abusivo)
                )),
  amount      INTEGER       NOT NULL,  -- positivo = ganho, negativo = perda
  description TEXT          NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Buscar histórico de um usuário
CREATE INDEX IF NOT EXISTS idx_points_user_id    ON points_history (user_id, created_at DESC);
-- Buscar por tipo de transação
CREATE INDEX IF NOT EXISTS idx_points_type       ON points_history (type);

COMMENT ON TABLE  points_history        IS 'Extrato de pontos — cada linha é uma transação';
COMMENT ON COLUMN points_history.amount IS 'Positivo = ganho de pontos, negativo = perda';
