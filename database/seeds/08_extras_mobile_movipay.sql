-- ============================================================
-- 08_movipay_mobile_extras.sql
-- Extensão aditiva para o app mobile: completa a categoria de
-- TODOS os trabalhadores de teste (nenhum seed original definia
-- essa coluna, apesar dela existir desde a migration 009 — por
-- isso a busca/orçamentos por categoria nunca tinha como funcionar
-- de verdade). Também completa a localização do bruno@teste.com,
-- que fica sem elas no seed original.
-- ============================================================

UPDATE usuarios SET category = 'eletrica'    WHERE email = 'carlos@teste.com';
UPDATE usuarios SET category = 'limpeza'     WHERE email = 'maria@teste.com';
UPDATE usuarios SET category = 'pintura'     WHERE email = 'joao@teste.com';
UPDATE usuarios SET category = 'informatica' WHERE email = 'anati@teste.com';

UPDATE usuarios SET
  category     = 'eletrica',
  bio          = 'Faz-tudo de confiança: elétrica, limpeza, pintura, jardinagem e suporte em informática.',
  cidade         = 'Ribeirão Pires',
  bairro = 'Centro',
  lat          = -23.7147,
  lng          = -46.4134,
  esta_disponivel = TRUE
WHERE email = 'bruno@teste.com';

INSERT INTO horarios_disponibilidade (trabalhador_id, weekday, hora_inicio, hora_fim)
SELECT u.id, d.weekday, 8, 18
FROM usuarios u
CROSS JOIN (SELECT unnest(ARRAY[1,2,3,4,5]) AS weekday) d
WHERE u.email = 'bruno@teste.com'
ON CONFLICT (trabalhador_id, weekday, hora_inicio) DO NOTHING;
