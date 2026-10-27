-- ============================================================
-- 002_create_categories.sql
-- Categorias de serviços (ex: limpeza, elétrica, pintura)
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(80)   NOT NULL UNIQUE,
  slug        VARCHAR(80)   NOT NULL UNIQUE,  -- ex: "limpeza-residencial"
  icon        VARCHAR(10),                     -- emoji da categoria
  description TEXT,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);

COMMENT ON TABLE categories IS 'Categorias de serviços disponíveis na plataforma';
