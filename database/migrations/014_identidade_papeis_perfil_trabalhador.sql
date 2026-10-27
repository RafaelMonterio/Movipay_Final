-- ============================================================
-- 014_identity_roles_worker_profile.sql
--
-- Identidade real do usuário (CPF + data de nascimento), papéis
-- cliente/trabalhador/híbrido, perfil profissional completo e
-- responsável legal para trabalhadores de 14 a 17 anos.
--
-- ADITIVA: nenhuma coluna/tabela existente é removida ou alterada
-- de forma incompatível. A coluna `users.mode` continua existindo e
-- continua significando "modo ATIVO na interface" (client|worker) —
-- o que muda é que agora ela é derivada dos papéis que a conta
-- realmente possui (is_client / is_worker), e não mais a única
-- fonte de verdade.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Identidade e papéis
-- ------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS cpf                  CHAR(11),
  ADD COLUMN IF NOT EXISTS birth_date           DATE,
  ADD COLUMN IF NOT EXISTS account_type         VARCHAR(10) NOT NULL DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS is_client            BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_worker            BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS worker_activated_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cpf_status           VARCHAR(20) NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS cpf_checked_at       TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_account_type_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_account_type_check
      CHECK (account_type IN ('client', 'worker', 'hybrid'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_cpf_status_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_cpf_status_check
      CHECK (cpf_status IN ('unverified', 'valid', 'invalid', 'pending'));
  END IF;
  -- Coerência entre account_type e os papéis booleanos: impede que uma
  -- requisição manipulada grave "hybrid" sem realmente ter os dois papéis.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_roles_coherent_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_roles_coherent_check CHECK (
      (account_type = 'client' AND is_client AND NOT is_worker) OR
      (account_type = 'worker' AND is_worker) OR
      (account_type = 'hybrid' AND is_client AND is_worker)
    );
  END IF;
END $$;

-- CPF é único quando informado (contas antigas/seed ficam com NULL).
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_cpf ON users (cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_worker ON users (is_worker) WHERE is_worker;
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users (account_type);

-- Backfill das contas que já existiam.
--
-- Quem estava como `mode = 'worker'` vira HÍBRIDO, não "só trabalhador":
-- no app antigo qualquer conta podia alternar entre cliente e
-- trabalhador livremente, então marcar essas contas como exclusivamente
-- profissionais tiraria delas uma capacidade que já tinham. Híbrido é o
-- equivalente honesto do comportamento anterior.
UPDATE users SET is_worker = TRUE, is_client = TRUE, account_type = 'hybrid'
  WHERE mode = 'worker' AND is_worker = FALSE;
UPDATE users SET is_client = TRUE, account_type = 'client'
  WHERE mode = 'client' AND is_worker = FALSE AND account_type <> 'client';

COMMENT ON COLUMN users.cpf          IS 'CPF apenas com dígitos (11 caracteres). Nunca exposto a outros usuários.';
COMMENT ON COLUMN users.birth_date   IS 'Data de nascimento — base do cálculo de idade mínima de 14 anos para trabalhador.';
COMMENT ON COLUMN users.account_type IS 'client | worker | hybrid — papéis que a conta realmente possui.';
COMMENT ON COLUMN users.mode         IS 'Modo ATIVO na interface (client|worker). Só pode assumir um papel que a conta possua.';
COMMENT ON COLUMN users.cpf_status   IS 'Resultado da checagem do CPF: unverified (só dígito verificador) | valid | invalid | pending.';

-- ------------------------------------------------------------
-- 2. Idade exata — função reutilizável em todo o banco
-- ------------------------------------------------------------
-- Idade em anos COMPLETOS considerando dia, mês e ano (não é uma
-- subtração de anos: quem nasceu em 31/12/2010 só completa 14 em
-- 31/12/2024, e a função respeita isso).
CREATE OR REPLACE FUNCTION movipay_age_years(birth DATE, reference DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
BEGIN
  IF birth IS NULL THEN RETURN NULL; END IF;
  RETURN EXTRACT(YEAR FROM age(reference, birth))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION movipay_age_years(DATE, DATE)
  IS 'Idade em anos completos (dia/mês/ano). Usada pela trava de idade mínima do trabalhador.';

-- ------------------------------------------------------------
-- 3. Trava de idade no PRÓPRIO BANCO (última linha de defesa)
-- ------------------------------------------------------------
-- Um CHECK não serve aqui porque depende de CURRENT_DATE (não é
-- IMMUTABLE). A trigger abaixo garante, independentemente de qual
-- código escreveu na tabela, que:
--   * ninguém vira trabalhador sem data de nascimento;
--   * ninguém com menos de 14 anos completos vira trabalhador;
--   * trabalhador de 14 a 17 anos precisa de responsável legal
--     cadastrado (validado na trigger complementar, abaixo).
CREATE OR REPLACE FUNCTION trg_users_worker_age_guard()
RETURNS TRIGGER AS $$
DECLARE
  v_age INTEGER;
BEGIN
  IF NEW.is_worker THEN
    IF NEW.birth_date IS NULL THEN
      RAISE EXCEPTION 'Informe a data de nascimento para ativar o perfil de trabalhador.';
    END IF;

    v_age := movipay_age_years(NEW.birth_date);

    IF v_age < 14 THEN
      RAISE EXCEPTION 'Para criar um perfil de trabalhador no MoviPay, é necessário ter no mínimo 14 anos.';
    END IF;
  END IF;

  -- O modo ativo nunca pode ser um papel que a conta não possui.
  IF NEW.mode = 'worker' AND NOT NEW.is_worker THEN
    RAISE EXCEPTION 'Esta conta ainda não possui perfil de trabalhador ativo.';
  END IF;
  IF NEW.mode = 'client' AND NOT NEW.is_client THEN
    RAISE EXCEPTION 'Esta conta não possui perfil de cliente.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_worker_age_guard ON users;
CREATE TRIGGER users_worker_age_guard
  BEFORE INSERT OR UPDATE OF is_worker, birth_date, mode, is_client ON users
  FOR EACH ROW EXECUTE FUNCTION trg_users_worker_age_guard();

-- ------------------------------------------------------------
-- 4. Perfil profissional (dados do trabalhador)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worker_profiles (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  category_slug       VARCHAR(60)  NOT NULL,
  specialty           VARCHAR(160) NOT NULL,
  description         TEXT         NOT NULL,
  experience          TEXT         NOT NULL,
  price_min           NUMERIC(10,2),
  price_max           NUMERIC(10,2),
  price_type          VARCHAR(20)  NOT NULL DEFAULT 'service'
                        CHECK (price_type IN ('hourly', 'daily', 'service')),
  modality            VARCHAR(20)  NOT NULL DEFAULT 'presential'
                        CHECK (modality IN ('presential', 'online', 'both')),
  service_area        TEXT         NOT NULL,
  availability_days   SMALLINT[]   NOT NULL DEFAULT '{}',
  availability_note   TEXT,
  hour_start          SMALLINT     CHECK (hour_start BETWEEN 0 AND 23),
  hour_end            SMALLINT     CHECK (hour_end BETWEEN 1 AND 24),
  is_complete         BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CHECK (price_min IS NULL OR price_max IS NULL OR price_max >= price_min)
);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_category ON worker_profiles (category_slug);

COMMENT ON TABLE worker_profiles IS 'Dados profissionais do trabalhador (etapa 2 do cadastro profissional).';

-- Cidades/regiões onde o trabalhador atende (1 linha por região).
CREATE TABLE IF NOT EXISTS worker_service_areas (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city       VARCHAR(120) NOT NULL,
  region     VARCHAR(120),
  radius_km  NUMERIC(6,2),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, city, region)
);
CREATE INDEX IF NOT EXISTS idx_worker_areas_user ON worker_service_areas (user_id);
CREATE INDEX IF NOT EXISTS idx_worker_areas_city ON worker_service_areas (LOWER(city));

-- ------------------------------------------------------------
-- 5. Responsável legal (trabalhadores de 14 a 17 anos)
-- ------------------------------------------------------------
-- Dado sensível de menor de idade: fica em tabela separada, nunca é
-- devolvido em nenhuma listagem pública e só o próprio usuário
-- consegue ler (checagem na rota).
CREATE TABLE IF NOT EXISTS legal_guardians (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name              VARCHAR(160) NOT NULL,
  cpf               CHAR(11)     NOT NULL,
  birth_date        DATE         NOT NULL,
  relationship      VARCHAR(60)  NOT NULL,
  phone             VARCHAR(20)  NOT NULL,
  email             VARCHAR(255),
  consent_accepted  BOOLEAN      NOT NULL DEFAULT FALSE,
  consent_text      TEXT,
  consent_at        TIMESTAMPTZ,
  consent_ip        VARCHAR(64),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CHECK (consent_accepted = TRUE)
);
CREATE INDEX IF NOT EXISTS idx_guardians_user ON legal_guardians (user_id);

COMMENT ON TABLE legal_guardians
  IS 'Responsável legal obrigatório para trabalhadores de 14 a 17 anos. Acesso restrito ao próprio usuário.';

-- O responsável precisa ser maior de idade.
CREATE OR REPLACE FUNCTION trg_guardian_must_be_adult()
RETURNS TRIGGER AS $$
BEGIN
  IF movipay_age_years(NEW.birth_date) < 18 THEN
    RAISE EXCEPTION 'O responsável legal precisa ser maior de 18 anos.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guardian_must_be_adult ON legal_guardians;
CREATE TRIGGER guardian_must_be_adult
  BEFORE INSERT OR UPDATE ON legal_guardians
  FOR EACH ROW EXECUTE FUNCTION trg_guardian_must_be_adult();

-- ------------------------------------------------------------
-- 6. Trava do menor sem responsável
-- ------------------------------------------------------------
-- Complementa a trigger de idade: um trabalhador de 14 a 17 anos não
-- pode ficar sem responsável legal. Como o responsável é inserido logo
-- depois do usuário (mesma transação), a checagem roda como CONSTRAINT
-- TRIGGER DEFERRABLE — ou seja, é verificada só no COMMIT, quando as
-- duas linhas já existem.
CREATE OR REPLACE FUNCTION trg_minor_worker_needs_guardian()
RETURNS TRIGGER AS $$
DECLARE
  v_age INTEGER;
  v_has_guardian BOOLEAN;
BEGIN
  IF NOT NEW.is_worker OR NEW.birth_date IS NULL THEN
    RETURN NEW;
  END IF;

  v_age := movipay_age_years(NEW.birth_date);
  IF v_age >= 18 THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS(SELECT 1 FROM legal_guardians g WHERE g.user_id = NEW.id AND g.consent_accepted)
    INTO v_has_guardian;

  IF NOT v_has_guardian THEN
    RAISE EXCEPTION 'Trabalhadores de 14 a 17 anos precisam dos dados do responsável legal.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS minor_worker_needs_guardian ON users;
CREATE CONSTRAINT TRIGGER minor_worker_needs_guardian
  AFTER INSERT OR UPDATE OF is_worker, birth_date ON users
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION trg_minor_worker_needs_guardian();
