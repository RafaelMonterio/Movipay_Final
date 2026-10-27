-- ============================================================
-- 011_addresses.sql
-- Endereços reais de Ribeirão Pires (validados via ViaCEP e
-- geocodificados via Nominatim/OpenStreetMap em tempo real pela
-- API — ver src/routes/address.routes.js). Substitui os campos
-- de texto livre "cidade"/"endereço" por uma referência a um
-- endereço que realmente existe.
-- ============================================================

CREATE TABLE IF NOT EXISTS addresses (
  id           SERIAL PRIMARY KEY,
  cep          VARCHAR(9)  NOT NULL,
  street       VARCHAR(200) NOT NULL,
  neighborhood VARCHAR(120) NOT NULL,
  city         VARCHAR(100) NOT NULL DEFAULT 'Ribeirão Pires',
  state        VARCHAR(2)  NOT NULL DEFAULT 'SP',
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cep, street)
);

COMMENT ON TABLE addresses IS 'Endereços reais de Ribeirão Pires, validados via ViaCEP e cacheados aqui';

-- Endereço "de perfil" do usuário (onde ele mora / atua). Número e
-- complemento ficam à parte porque são específicos da pessoa, não do
-- logradouro em si (duas pessoas na mesma rua têm números diferentes).
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_id INTEGER REFERENCES addresses(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_complement VARCHAR(120);

-- Endereço específico de cada pedido (pode ser diferente do endereço do
-- perfil do cliente — ex.: pedir um serviço para a casa de um parente).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_id INTEGER REFERENCES addresses(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_complement VARCHAR(120);

-- Mesma ideia para orçamentos (antes usavam só um campo de texto livre "city").
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS address_id INTEGER REFERENCES addresses(id);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_addresses_neighborhood ON addresses (neighborhood);
CREATE INDEX IF NOT EXISTS idx_users_address ON users (address_id);
CREATE INDEX IF NOT EXISTS idx_orders_address ON orders (address_id);
