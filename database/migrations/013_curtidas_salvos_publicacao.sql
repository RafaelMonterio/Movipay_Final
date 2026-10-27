-- ============================================================
-- 013_short_likes_saves.sql
-- Curtidas e "salvos" de Shorts — pedidos explicitamente pelo
-- usuário além do favoritar-o-trabalhador que já existia.
-- ============================================================

CREATE TABLE IF NOT EXISTS short_likes (
  id         SERIAL PRIMARY KEY,
  short_id   INTEGER NOT NULL REFERENCES shorts(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (short_id, user_id)
);

CREATE TABLE IF NOT EXISTS short_saves (
  id         SERIAL PRIMARY KEY,
  short_id   INTEGER NOT NULL REFERENCES shorts(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (short_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_short_likes_short ON short_likes (short_id);
CREATE INDEX IF NOT EXISTS idx_short_saves_user ON short_saves (user_id);
