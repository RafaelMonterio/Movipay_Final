-- ============================================================
-- 06_worker_services.sql
-- Serviços detalhados para os 4 novos trabalhadores
-- ============================================================

INSERT INTO servicos (trabalhador_id, categoria_id, titulo, descricao, price, tipo_preco)
SELECT u.id, c.id, s.titulo, s.descricao, s.price, s.tipo_preco
FROM (VALUES
  -- Carlos Eletricista
  ('carlos@teste.com', 'Instalação de Tomadas e Interruptores',
   'Troca ou instalação de tomadas, interruptores e espelhos. Inclui material e mão de obra.',
   90.00, 'fixed', 'eletrica'),
  ('carlos@teste.com', 'Instalação de Ar Condicionado',
   'Instalação completa de ar condicionado split. Furo na parede, suporte, carga de gás e teste.',
   250.00, 'fixed', 'eletrica'),
  ('carlos@teste.com', 'Quadro Elétrico — Revisão e Manutenção',
   'Revisão completa do quadro, substituição de disjuntores, organização dos circuitos e laudo.',
   350.00, 'fixed', 'eletrica'),
  ('carlos@teste.com', 'Iluminação LED — Projeto e Instalação',
   'Projeto de iluminação com spots, fitas LED e luminárias embutidas. Por ponto instalado.',
   120.00, 'fixed', 'eletrica'),

  -- Maria Limpeza
  ('maria@teste.com', 'Limpeza Residencial Completa',
   'Limpeza geral de casa ou apartamento até 80m². Cozinha, banheiros, quartos e sala. Produtos inclusos.',
   150.00, 'fixed', 'limpeza'),
  ('maria@teste.com', 'Limpeza Pós-Obra',
   'Remoção de pó de obra, tinta e resíduos. Limpeza de vidros, pisos e rejuntes. Orçamento por m².',
   8.00, 'fixed', 'limpeza'),
  ('maria@teste.com', 'Limpeza de Escritório',
   'Limpeza e organização de ambientes comerciais. Disponível diária, semanal ou quinzenal.',
   200.00, 'fixed', 'limpeza'),
  ('maria@teste.com', 'Limpeza de Vidros e Fachada',
   'Limpeza de janelas, vidros e fachadas até 3 andares. Equipamentos próprios.',
   180.00, 'fixed', 'limpeza'),

  -- João Pintor
  ('joao@teste.com', 'Pintura de Quarto Completo',
   'Pintura de quarto com até 16m² incluindo teto, forro e janelas. 2 demãos. Tinta inclusa.',
   350.00, 'fixed', 'pintura'),
  ('joao@teste.com', 'Textura e Grafiato',
   'Aplicação de textura ou grafiato em paredes internas ou externas. Preço por m².',
   45.00, 'fixed', 'pintura'),
  ('joao@teste.com', 'Pintura Epóxi para Garagem',
   'Impermeabilização e pintura epóxi em piso de garagem. Resistente a óleo e água.',
   25.00, 'fixed', 'pintura'),

  -- Ana TI
  ('anati@teste.com', 'Formatação e Instalação de Programas',
   'Formatação completa do PC ou notebook com instalação de Windows, Office e antivírus. Com backup.',
   150.00, 'fixed', 'informatica'),
  ('anati@teste.com', 'Configuração de Rede Wi-Fi',
   'Instalação e configuração de roteadores, repetidores e redes mesh. Inclui cabeamento.',
   120.00, 'fixed', 'informatica'),
  ('anati@teste.com', 'Instalação de Câmeras de Segurança',
   'Instalação de sistema CFTV com câmeras internas e externas. Configuração de acesso remoto.',
   350.00, 'fixed', 'informatica'),
  ('anati@teste.com', 'Suporte Técnico por Hora',
   'Atendimento presencial para qualquer problema técnico. Computadores, impressoras, celulares e redes.',
   80.00, 'hourly', 'informatica')
) AS s(email, titulo, descricao, price, tipo_preco, cat_slug)
JOIN usuarios u ON u.email = s.email
JOIN categorias c ON c.slug = s.cat_slug
ON CONFLICT DO NOTHING;
