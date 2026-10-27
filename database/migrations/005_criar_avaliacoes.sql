-- ============================================================
-- 005_create_reviews.sql
-- Avaliações após conclusão dos pedidos
-- Depende de: 001_create_users, 004_create_orders
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER       NOT NULL UNIQUE    -- 1 avaliação por pedido
                  REFERENCES orders(id) ON DELETE CASCADE,
  reviewer_id   INTEGER       NOT NULL
                  REFERENCES users(id) ON DELETE CASCADE,
  reviewed_id   INTEGER       NOT NULL           -- quem foi avaliado
                  REFERENCES users(id) ON DELETE CASCADE,
  rating        SMALLINT      NOT NULL
                  CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  is_public     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Buscar avaliações recebidas por um trabalhador
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON reviews (reviewed_id);
-- Buscar avaliações feitas por um usuário
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews (reviewer_id);

COMMENT ON TABLE  reviews          IS 'Avaliações de 1 a 5 estrelas após conclusão do pedido';
COMMENT ON COLUMN reviews.order_id IS 'Constraint UNIQUE garante 1 avaliação por pedido';
