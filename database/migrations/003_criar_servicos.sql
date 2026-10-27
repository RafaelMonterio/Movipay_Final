-- ============================================================
-- 003_create_services.sql
-- Serviços oferecidos pelos trabalhadores
-- Depende de: 001_create_users, 002_create_categories
-- ============================================================

CREATE TABLE IF NOT EXISTS services (
  id            SERIAL PRIMARY KEY,
  worker_id     INTEGER       NOT NULL
                  REFERENCES users(id) ON DELETE CASCADE,
  category_id   INTEGER
                  REFERENCES categories(id) ON DELETE SET NULL,
  title         VARCHAR(150)  NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  price_type    VARCHAR(20)   NOT NULL DEFAULT 'fixed'
                  CHECK (price_type IN ('fixed', 'hourly', 'negotiable')),
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Buscas frequentes: todos os serviços de um trabalhador
CREATE INDEX IF NOT EXISTS idx_services_worker_id   ON services (worker_id);
-- Buscas por categoria
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services (category_id);
-- Buscas de serviços ativos
CREATE INDEX IF NOT EXISTS idx_services_is_active   ON services (is_active);

COMMENT ON TABLE  services            IS 'Serviços oferecidos pelos trabalhadores';
COMMENT ON COLUMN services.price_type IS 'fixed=preço fixo, hourly=por hora, negotiable=a combinar';
