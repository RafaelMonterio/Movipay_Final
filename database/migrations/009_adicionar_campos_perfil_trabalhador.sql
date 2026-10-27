-- ============================================================
-- 009_add_worker_profile_fields.sql
-- Adiciona colunas para foto, localização e categoria ao usuário
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS category VARCHAR(60),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(120);

COMMENT ON COLUMN users.category IS 'Categoria/serviço principal do trabalhador';
COMMENT ON COLUMN users.avatar_url IS 'URL ou base64 da foto de perfil do usuário';
COMMENT ON COLUMN users.neighborhood IS 'Bairro/localidade usada para aproximar o trabalhador no mapa';
