-- ============================================================
-- 09_addresses_and_shorts.sql
-- Endereços reais de Ribeirão Pires (bairros e faixas de CEP
-- confirmados publicamente) atribuídos às contas de teste, e um
-- punhado de Shorts de demonstração.
-- ============================================================

INSERT INTO enderecos (cep, rua, bairro, lat, lng) VALUES
  ('09400-100', 'Rua XV de Novembro',      'Centro',               -23.7145, -46.4130),
  ('09400-520', 'Rua Amazonas',            'Pastoril',             -23.7080, -46.4090),
  ('09403-120', 'Rua Rio Grande do Sul',   'Aliança',              -23.7175, -46.4200),
  ('09425-150', 'Rua das Palmeiras',       'Bocaina',              -23.7300, -46.4350),
  ('09401-300', 'Rua Minas Gerais',        'Colônia',              -23.7050, -46.4250),
  ('09407-160', 'Rua São Paulo',           'Barro Branco',         -23.7220, -46.4050),
  ('09402-585', 'Rua Bela Vista',          'Planalto Bela Vista',  -23.7160, -46.4110),
  ('09420-110', 'Rua Ipiranga',            'Centro Alto',          -23.7380, -46.4180),
  ('09400-200', 'Rua da Estação',          'Vila Ferroviária',     -23.7130, -46.4150),
  ('09404-520', 'Rua Pilar',               'Pilar Velho',          -23.7250, -46.4400)
ON CONFLICT (cep, rua) DO NOTHING;

-- Atribui um endereço real + número a cada conta de teste, e sincroniza os
-- campos denormalizados (lat/lng/bairro/cidade) usados pelas buscas.
DO $$
DECLARE
  mapping RECORD;
BEGIN
  FOR mapping IN
    SELECT * FROM (VALUES
      ('ana@teste.com',    'Rua XV de Novembro',    '120'),
      ('bruno@teste.com',  'Rua da Estação',        '45'),
      ('carlos@teste.com', 'Rua Amazonas',          '210'),
      ('maria@teste.com',  'Rua Rio Grande do Sul', '88'),
      ('joao@teste.com',   'Rua das Palmeiras',     '300'),
      ('anati@teste.com',  'Rua Minas Gerais',      '15'),
      ('pedro@teste.com',  'Rua São Paulo',         '502'),
      ('lucia@teste.com',  'Rua Bela Vista',        '77'),
      ('rafael@teste.com', 'Rua Ipiranga',          '640'),
      ('fernanda@teste.com','Rua Pilar',            '33')
    ) AS t(email, rua, number)
  LOOP
    UPDATE usuarios u SET
      endereco_id = a.id,
      numero_endereco = mapping.number,
      lat = a.lat,
      lng = a.lng,
      bairro = a.bairro,
      cidade = a.cidade
    FROM enderecos a
    WHERE a.rua = mapping.rua AND u.email = mapping.email;
  END LOOP;
END $$;

-- Shorts de demonstração (fotos/conjuntos de fotos — sem necessidade de
-- vídeo real; ver docs/SHORTS_GUIA_PARA_SITE.md).
INSERT INTO publicacoes (trabalhador_id, tipo_midia, media_urls, caption)
SELECT u.id, v.tipo_midia, v.media_urls, v.caption
FROM (VALUES
  ('bruno@teste.com',  'image',    ARRAY['https://picsum.photos/seed/shortbruno1/720/1280'], 'Troca de disjuntor concluída hoje ⚡'),
  ('bruno@teste.com',  'carousel', ARRAY['https://picsum.photos/seed/shortbruno2/720/1280','https://picsum.photos/seed/shortbruno3/720/1280'], 'Antes e depois de uma instalação'),
  ('carlos@teste.com', 'image',    ARRAY['https://picsum.photos/seed/shortcarlos1/720/1280'], 'Quadro de energia novinho'),
  ('maria@teste.com',  'carousel', ARRAY['https://picsum.photos/seed/shortmaria1/720/1280','https://picsum.photos/seed/shortmaria2/720/1280','https://picsum.photos/seed/shortmaria3/720/1280'], 'Faxina pós-obra de hoje ✨'),
  ('joao@teste.com',   'image',    ARRAY['https://picsum.photos/seed/shortjoao1/720/1280'], 'Pintura de sala terminada'),
  ('anati@teste.com',  'image',    ARRAY['https://picsum.photos/seed/shortanati1/720/1280'], 'Backup e limpeza de PC feitos rapidinho')
) AS v(email, tipo_midia, media_urls, caption)
JOIN usuarios u ON u.email = v.email;

INSERT INTO comentarios_publicacao (publicacao_id, usuario_id, conteudo)
SELECT s.id, u.id, c.conteudo
FROM (VALUES
  ('bruno@teste.com', 'ana@teste.com', 'Ficou ótimo, obrigada!'),
  ('maria@teste.com', 'pedro@teste.com', 'Recomendo demais o trabalho dela!')
) AS c(email_trabalhador, commenter_email, conteudo)
JOIN usuarios wu ON wu.email = c.email_trabalhador
JOIN usuarios u ON u.email = c.commenter_email
JOIN publicacoes s ON s.trabalhador_id = wu.id
WHERE s.id = (SELECT MIN(id) FROM publicacoes WHERE trabalhador_id = wu.id);
