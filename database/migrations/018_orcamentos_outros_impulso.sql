-- 018_quotes_outros_and_boost.sql
--
-- Duas coisas relacionadas a orçamentos, pedidas depois do lançamento:
--
-- 1. Categoria "Outros": quando o serviço que o cliente precisa não se
--    encaixa em nenhuma categoria fixa, ele digita livremente. Isso
--    PRECISA alcançar todos os trabalhadores (não só de uma categoria
--    específica, já que não existe nenhuma que combine) — por isso
--    "Outros" é tratada como coringa na visibilidade das oportunidades,
--    não como uma categoria igual às demais. Ver services/quoteVisibility.js.
--
-- 2. "Melhor divulgação": o cliente paga um valor fixo (guardado em
--    platform_settings, como a comissão) para destacar UM orçamento por
--    um tempo — o mesmo raciocínio dos planos do trabalhador, só que
--    por publicação em vez de por assinatura mensal.

INSERT INTO categories (name, slug, icon, description)
VALUES ('Outros', 'outros', '✨', 'Serviços que não se encaixam nas categorias fixas — o cliente descreve livremente')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS custom_category_text VARCHAR(200);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS boosted_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_quotes_boosted ON quotes (is_boosted) WHERE is_boosted = TRUE;

INSERT INTO platform_settings (key, value)
VALUES ('quote_boost_price', '10')
ON CONFLICT (key) DO NOTHING;
INSERT INTO platform_settings (key, value)
VALUES ('quote_boost_days', '7')
ON CONFLICT (key) DO NOTHING;

-- payment_transactions precisa aceitar este novo tipo de cobrança, e
-- saber a qual orçamento ela pertence.
ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_kind_check;
ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_kind_check
  CHECK (kind IN ('service', 'subscription', 'quote_boost'));
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS quote_id INTEGER REFERENCES quotes(id) ON DELETE SET NULL;

ALTER TABLE platform_commissions DROP CONSTRAINT IF EXISTS platform_commissions_source_check;
ALTER TABLE platform_commissions ADD CONSTRAINT platform_commissions_source_check
  CHECK (source IN ('service', 'subscription', 'quote_boost'));

COMMENT ON COLUMN quotes.custom_category_text IS 'Preenchido quando category_id aponta para a categoria coringa "outros".';
COMMENT ON COLUMN quotes.is_boosted IS 'TRUE só depois do pagamento de divulgação confirmado — nunca setado pelo app diretamente.';
