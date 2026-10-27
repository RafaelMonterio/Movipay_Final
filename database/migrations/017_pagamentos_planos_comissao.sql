-- ============================================================
-- 017_payments_plans_commission.sql
--
-- Pagamentos reais (gateway), planos premium dos trabalhadores,
-- assinaturas e a comissão de 15% da plataforma.
--
-- Observação sobre a tabela `payments` que já existia: ela NÃO é
-- tocada. Ela é o "escrow" interno (dinheiro do pedido retido até a
-- conclusão) e continua funcionando igual. O que entra aqui é a
-- camada de COBRANÇA de verdade — o dinheiro que sai do cartão/Pix do
-- cliente e é confirmado pelo gateway — que antes não existia.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Configurações da plataforma (fonte da verdade do percentual)
-- ------------------------------------------------------------
-- A comissão fica no banco, não numa constante do app: assim o valor
-- é o mesmo para todo mundo e não há como o aplicativo "mandar" um
-- percentual diferente numa requisição manipulada.
CREATE TABLE IF NOT EXISTS platform_settings (
  key         VARCHAR(60) PRIMARY KEY,
  value       TEXT        NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_settings (key, value, description) VALUES
  ('commission_percent', '15', 'Percentual da plataforma sobre cada serviço realizado (%).')
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Planos premium
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(30)   NOT NULL UNIQUE,
  name            VARCHAR(60)   NOT NULL,
  tagline         VARCHAR(160),
  price           NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  currency        CHAR(3)       NOT NULL DEFAULT 'BRL',
  billing_period  VARCHAR(10)   NOT NULL DEFAULT 'monthly'
                    CHECK (billing_period IN ('monthly', 'yearly')),
  -- Peso de exposição usado pelo algoritmo de ordenação de busca.
  -- 1.00 = neutro (plano gratuito). Ver docs/ALGORITMO_DIVULGACAO.md.
  exposure_weight NUMERIC(4,2)  NOT NULL DEFAULT 1.00
                    CHECK (exposure_weight BETWEEN 1.00 AND 2.00),
  features        JSONB         NOT NULL DEFAULT '[]'::jsonb,
  badge_label     VARCHAR(30),
  has_stats       BOOLEAN       NOT NULL DEFAULT FALSE,
  has_advanced_stats BOOLEAN    NOT NULL DEFAULT FALSE,
  sort_order      SMALLINT      NOT NULL DEFAULT 0,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN subscription_plans.exposure_weight
  IS 'Multiplicador de relevância na busca. Limitado a 2.00 de propósito: o plano ajuda, mas nunca ignora distância/categoria/avaliação.';

-- ------------------------------------------------------------
-- 3. Assinaturas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id               INTEGER     NOT NULL REFERENCES subscription_plans(id),
  status                VARCHAR(20) NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'past_due')),
  provider              VARCHAR(30),
  provider_reference    TEXT,
  auto_renew            BOOLEAN     NOT NULL DEFAULT FALSE,
  started_at            TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions (user_id, status);
-- Uma assinatura ATIVA por usuário (as canceladas/expiradas ficam no histórico).
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_one_active
  ON subscriptions (user_id) WHERE status = 'active';

-- Atalho no usuário para o algoritmo de busca não precisar de subquery.
-- É preenchido SEMPRE pelo backend ao ativar/expirar assinatura — o app
-- nunca escreve nessas colunas.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan_slug        VARCHAR(30)  NOT NULL DEFAULT 'formiga',
  ADD COLUMN IF NOT EXISTS plan_expires_at  TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_users_plan ON users (plan_slug) WHERE is_worker;

COMMENT ON COLUMN users.plan_slug IS 'Plano ativo do trabalhador (formiga|operaria|rainha). Só o backend escreve aqui.';

-- ------------------------------------------------------------
-- 4. Transações de pagamento (gateway)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_transactions (
  id                   SERIAL PRIMARY KEY,
  kind                 VARCHAR(20)   NOT NULL CHECK (kind IN ('service', 'subscription')),
  payer_id             INTEGER       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  payee_id             INTEGER       REFERENCES users(id) ON DELETE RESTRICT,
  order_id             INTEGER       REFERENCES orders(id) ON DELETE SET NULL,
  subscription_id      INTEGER       REFERENCES subscriptions(id) ON DELETE SET NULL,

  provider             VARCHAR(30)   NOT NULL,
  provider_payment_id  TEXT,
  method               VARCHAR(20)   NOT NULL DEFAULT 'pix'
                         CHECK (method IN ('pix', 'credit_card', 'debit_card', 'boleto')),

  -- Valores: sempre calculados no BACKEND a partir do preço do serviço
  -- ou do plano. O aplicativo nunca envia amount.
  gross_amount         NUMERIC(12,2) NOT NULL CHECK (gross_amount > 0),
  platform_fee         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
  net_amount           NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (net_amount >= 0),
  fee_percent          NUMERIC(5,2)  NOT NULL DEFAULT 0,
  currency             CHAR(3)       NOT NULL DEFAULT 'BRL',

  status               VARCHAR(20)   NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'refunded', 'cancelled')),
  status_detail        TEXT,

  pix_payload          TEXT,        -- "copia e cola" (BR Code)
  pix_qr_base64        TEXT,        -- imagem do QR, quando o provedor devolve
  ticket_url           TEXT,        -- link de checkout, quando houver

  expires_at           TIMESTAMPTZ,
  paid_at              TIMESTAMPTZ,
  provider_payload     JSONB,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CHECK (gross_amount = platform_fee + net_amount)
);
CREATE INDEX IF NOT EXISTS idx_paytx_payer  ON payment_transactions (payer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paytx_payee  ON payment_transactions (payee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paytx_status ON payment_transactions (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_paytx_provider_id
  ON payment_transactions (provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

COMMENT ON TABLE payment_transactions
  IS 'Cobranças reais feitas via gateway. A confirmação vem do webhook/consulta ao provedor, nunca do aplicativo.';

-- ------------------------------------------------------------
-- 5. Serviço realizado + comissão
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_transactions (
  id                     SERIAL PRIMARY KEY,
  order_id               INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  client_id              INTEGER       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  worker_id              INTEGER       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  payment_transaction_id INTEGER       REFERENCES payment_transactions(id) ON DELETE SET NULL,
  gross_amount           NUMERIC(12,2) NOT NULL CHECK (gross_amount > 0),
  fee_percent            NUMERIC(5,2)  NOT NULL,
  platform_fee           NUMERIC(12,2) NOT NULL CHECK (platform_fee >= 0),
  net_amount             NUMERIC(12,2) NOT NULL CHECK (net_amount >= 0),
  status                 VARCHAR(20)   NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'paid', 'released', 'refunded', 'cancelled')),
  released_at            TIMESTAMPTZ,
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (order_id),
  CHECK (gross_amount = platform_fee + net_amount)
);
CREATE INDEX IF NOT EXISTS idx_svctx_worker ON service_transactions (worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_svctx_client ON service_transactions (client_id, created_at DESC);

COMMENT ON TABLE service_transactions
  IS 'Um registro por serviço: valor bruto, comissão da plataforma e líquido do trabalhador.';

-- Razão (ledger) da plataforma: uma linha por comissão realmente cobrada.
CREATE TABLE IF NOT EXISTS platform_commissions (
  id                     SERIAL PRIMARY KEY,
  source                 VARCHAR(20)   NOT NULL CHECK (source IN ('service', 'subscription')),
  service_transaction_id INTEGER       REFERENCES service_transactions(id) ON DELETE CASCADE,
  payment_transaction_id INTEGER       REFERENCES payment_transactions(id) ON DELETE CASCADE,
  worker_id              INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  client_id              INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  gross_amount           NUMERIC(12,2) NOT NULL,
  fee_percent            NUMERIC(5,2)  NOT NULL,
  amount                 NUMERIC(12,2) NOT NULL,
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_commissions_created ON platform_commissions (created_at DESC);

-- ------------------------------------------------------------
-- 6. Webhooks — idempotência
-- ------------------------------------------------------------
-- Gateways reenviam o mesmo evento várias vezes. Sem esta tabela, um
-- reenvio poderia ativar um plano duas vezes ou creditar em dobro.
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id           SERIAL PRIMARY KEY,
  provider     VARCHAR(30) NOT NULL,
  event_id     TEXT        NOT NULL,
  event_type   VARCHAR(60),
  payload      JSONB,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, event_id)
);

-- ------------------------------------------------------------
-- 7. Estatísticas de Shorts por plano (Rainha/Operária)
-- ------------------------------------------------------------
-- View leve: o backend só entrega esses números para quem tem plano com
-- estatísticas, mas a agregação em si fica no banco.
CREATE OR REPLACE VIEW worker_shorts_stats AS
SELECT
  s.worker_id,
  COUNT(DISTINCT s.id)::int                                        AS total_shorts,
  COALESCE(SUM(s.views_count), 0)::int                             AS total_views,
  (SELECT COUNT(*) FROM short_likes l    WHERE l.short_id    IN (SELECT id FROM shorts WHERE worker_id = s.worker_id))::int AS total_likes,
  (SELECT COUNT(*) FROM short_comments c WHERE c.short_id    IN (SELECT id FROM shorts WHERE worker_id = s.worker_id))::int AS total_comments,
  (SELECT COUNT(*) FROM short_saves sv   WHERE sv.short_id   IN (SELECT id FROM shorts WHERE worker_id = s.worker_id))::int AS total_saves
FROM shorts s
GROUP BY s.worker_id;

-- ------------------------------------------------------------
-- 8. Carga inicial dos planos
-- ------------------------------------------------------------
-- Planos são CONFIGURAÇÃO, não dado de teste — por isso entram aqui
-- (toda subida do servidor roda migrations) e não só no seed. Usa
-- DO NOTHING para nunca sobrescrever um ajuste feito depois; para
-- forçar a recarga com os valores oficiais, rode o seed
-- `database/seeds/10_subscription_plans.sql`, que usa DO UPDATE.
INSERT INTO subscription_plans
  (slug, name, tagline, price, exposure_weight, badge_label, has_stats, has_advanced_stats, sort_order, features)
VALUES
  ('formiga',  'Formiga',  'Tudo o que você precisa para começar a receber clientes.', 0.00,  1.00, NULL,       FALSE, FALSE, 1,
   '["Perfil profissional completo","Publicação de Shorts (fotos e vídeos)","Aparecer nas buscas normais","Receber contatos de clientes","Chat com clientes","Recursos básicos da plataforma"]'::jsonb),
  ('operaria', 'Operária', 'Mais visibilidade e números para crescer.',                19.90, 1.35, 'Operária', TRUE,  FALSE, 2,
   '["Tudo do plano Formiga","Maior exposição nas buscas","Perfil com destaque visual","Prioridade na exibição de profissionais","Estatísticas básicas de perfil e publicações","Destaque dentro da sua categoria","Mais ferramentas de divulgação"]'::jsonb),
  ('rainha',   'Rainha',   'Exposição máxima e estatísticas avançadas.',               39.90, 1.70, 'Rainha',   TRUE,  TRUE,  3,
   '["Tudo do plano Operária","Exposição máxima permitida pela plataforma","Maior destaque nas buscas","Perfil destacado e selo de plano premium","Destaque nas categorias","Estatísticas avançadas de perfil","Estatísticas completas dos Shorts (views, curtidas, salvos)","Recursos avançados de divulgação","Prioridade de exibição nas áreas adequadas da plataforma"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Trava de coerência: plan_slug do usuário sempre precisa existir.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_plan_slug_fkey') THEN
    ALTER TABLE users ADD CONSTRAINT users_plan_slug_fkey
      FOREIGN KEY (plan_slug) REFERENCES subscription_plans(slug) ON UPDATE CASCADE;
  END IF;
END $$;
