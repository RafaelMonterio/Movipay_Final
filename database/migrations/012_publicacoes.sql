-- ============================================================
-- 012_shorts.sql
-- Feed de "Shorts" — vídeos/fotos curtos que trabalhadores
-- publicam mostrando seus serviços. Feature nova (não existe no
-- site ainda); ver docs/SHORTS_GUIA_PARA_SITE.md para o guia de
-- como replicar isso no site.
-- ============================================================

CREATE TABLE IF NOT EXISTS shorts (
  id         SERIAL PRIMARY KEY,
  worker_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_type VARCHAR(10) NOT NULL DEFAULT 'video' CHECK (media_type IN ('video','image','carousel')),
  media_urls TEXT[] NOT NULL,
  caption    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS short_comments (
  id         SERIAL PRIMARY KEY,
  short_id   INTEGER NOT NULL REFERENCES shorts(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shorts_worker ON shorts (worker_id);
CREATE INDEX IF NOT EXISTS idx_shorts_created ON shorts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_short_comments_short ON short_comments (short_id, created_at);

COMMENT ON TABLE shorts IS 'Vídeos/fotos curtos publicados por trabalhadores (feed estilo Reels/TikTok)';
