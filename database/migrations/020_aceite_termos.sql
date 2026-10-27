-- 020_terms_acceptance.sql
--
-- Registro de aceite dos Termos de Uso. Guardamos QUANDO a pessoa
-- aceitou e QUAL VERSÃO do texto ela aceitou — se os termos mudarem no
-- futuro, dá pra saber exatamente quem ainda está na versão antiga e
-- precisa reaceitar, em vez de só um booleano "aceitou/não aceitou"
-- que perde essa informação.

ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version VARCHAR(20);
