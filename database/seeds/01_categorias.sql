-- ============================================================
-- 01_categories.sql
-- Categorias iniciais do MoviPay
-- ============================================================

INSERT INTO categorias (nome, slug, icone, descricao) VALUES
  ('Limpeza',          'limpeza',          '🧹', 'Limpeza residencial, comercial e pós-obra'),
  ('Elétrica',         'eletrica',         '⚡', 'Instalações e reparos elétricos'),
  ('Pintura',          'pintura',          '🎨', 'Pintura interna e externa'),
  ('Encanamento',      'encanamento',      '🔧', 'Reparos hidráulicos e encanamento'),
  ('Jardinagem',       'jardinagem',       '🌿', 'Jardins, corte de grama e paisagismo'),
  ('Mudança',          'mudanca',          '📦', 'Transporte e mudança de móveis'),
  ('Informática',      'informatica',      '💻', 'Suporte técnico e montagem de computadores'),
  ('Reforma',          'reforma',          '🏗️',  'Reformas gerais e construção civil'),
  ('Cuidado Pessoal',  'cuidado-pessoal',  '💆', 'Cabeleireiro, manicure e estética em domicílio'),
  ('Aulas',            'aulas',            '📚', 'Aulas particulares e reforço escolar')
ON CONFLICT (slug) DO NOTHING;
