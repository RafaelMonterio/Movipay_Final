-- ============================================================
-- 015_media_and_shorts_video.sql
--
-- Armazenamento real de arquivos (foto E vídeo) e extensão do feed
-- de Shorts para suportar vídeo de verdade, com contador de
-- visualizações.
--
-- Por que uma tabela `media_files`: até aqui a mídia era gravada como
-- base64 dentro de `shorts.media_urls`. Isso funciona para foto pequena
-- mas é inviável para vídeo (um vídeo de 15s em base64 estoura o limite
-- do corpo da requisição e incha o banco). Agora o arquivo é gravado em
-- disco pelo backend (`backend/uploads/`) e o banco guarda só o caminho
-- — o que também torna possível APAGAR o arquivo quando a publicação
-- é excluída. As URLs base64 antigas continuam funcionando normalmente
-- (o feed aceita os dois formatos).
-- ============================================================

CREATE TABLE IF NOT EXISTS media_files (
  id           SERIAL PRIMARY KEY,
  owner_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind         VARCHAR(10)  NOT NULL CHECK (kind IN ('image', 'video')),
  purpose      VARCHAR(20)  NOT NULL DEFAULT 'short'
                 CHECK (purpose IN ('short', 'avatar', 'portfolio', 'other')),
  storage_path TEXT         NOT NULL,
  public_url   TEXT         NOT NULL,
  mime_type    VARCHAR(100) NOT NULL,
  size_bytes   BIGINT       NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_media_owner ON media_files (owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_public_url ON media_files (public_url);

COMMENT ON TABLE media_files IS 'Arquivos enviados pelos usuários (fotos e vídeos), gravados em disco pelo backend.';

-- ------------------------------------------------------------
-- Shorts: vídeo, capa e visualizações
-- ------------------------------------------------------------
ALTER TABLE shorts
  ADD COLUMN IF NOT EXISTS thumbnail_url    TEXT,
  ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS views_count      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW();

COMMENT ON COLUMN shorts.media_type  IS 'video | image | carousel — tipo real da publicação, definido no upload.';
COMMENT ON COLUMN shorts.views_count IS 'Denormalizado a partir de short_views, mantido por trigger.';

-- Uma visualização por usuário logado por short (visitante conta pelo
-- contador agregado, sem linha — sem isso o número inflaria a cada scroll).
CREATE TABLE IF NOT EXISTS short_views (
  id         SERIAL PRIMARY KEY,
  short_id   INTEGER     NOT NULL REFERENCES shorts(id) ON DELETE CASCADE,
  user_id    INTEGER     REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (short_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_short_views_short ON short_views (short_id);

CREATE OR REPLACE FUNCTION trg_bump_short_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE shorts SET views_count = views_count + 1 WHERE id = NEW.short_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bump_short_views ON short_views;
CREATE TRIGGER bump_short_views
  AFTER INSERT ON short_views
  FOR EACH ROW EXECUTE FUNCTION trg_bump_short_views();

-- Liga cada arquivo de mídia à publicação que o usa, para que a
-- exclusão da publicação também apague o arquivo do disco.
CREATE TABLE IF NOT EXISTS short_media (
  id         SERIAL PRIMARY KEY,
  short_id   INTEGER NOT NULL REFERENCES shorts(id) ON DELETE CASCADE,
  media_id   INTEGER NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  position   SMALLINT NOT NULL DEFAULT 0,
  UNIQUE (short_id, media_id)
);
CREATE INDEX IF NOT EXISTS idx_short_media_short ON short_media (short_id);

COMMENT ON TABLE short_media IS 'Vínculo publicação -> arquivo, usado para remover o arquivo do disco ao excluir o short.';
