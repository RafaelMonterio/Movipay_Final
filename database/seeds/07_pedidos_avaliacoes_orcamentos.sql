-- ============================================================
-- 07_orders_reviews_quotes.sql
-- Pedidos de exemplo, avaliações e orçamentos abertos
-- ============================================================

-- ─── Pedidos entre os usuários de teste ───────────────────────────────────

INSERT INTO pedidos (cliente_id, trabalhador_id, servico_id, estado, price, concluido_em, criado_em)
SELECT
  cl.id, wk.id, sv.id, od.estado, sv.price,
  CASE WHEN od.estado = 'completed' THEN NOW() - (od.days_ago || ' days')::INTERVAL ELSE NULL END,
  NOW() - (od.days_ago || ' days')::INTERVAL
FROM (VALUES
  ('pedro@teste.com',   'carlos@teste.com', 'Instalação de Tomadas e Interruptores', 'completed', 3),
  ('lucia@teste.com',   'maria@teste.com',  'Limpeza Residencial Completa',           'completed', 7),
  ('rafael@teste.com',  'joao@teste.com',   'Pintura de Quarto Completo',             'completed', 14),
  ('fernanda@teste.com','carlos@teste.com', 'Instalação de Ar Condicionado',          'completed', 5),
  ('pedro@teste.com',   'anati@teste.com',  'Formatação e Instalação de Programas',   'completed', 10),
  ('lucia@teste.com',   'carlos@teste.com', 'Quadro Elétrico — Revisão e Manutenção', 'completed', 20),
  ('fernanda@teste.com','maria@teste.com',  'Limpeza de Escritório',                  'accepted',  1),
  ('rafael@teste.com',  'carlos@teste.com', 'Iluminação LED — Projeto e Instalação',  'pending',   0)
) AS od(email_cliente, email_trabalhador, titulo_servico, estado, days_ago)
JOIN usuarios cl ON cl.email = od.email_cliente
JOIN usuarios wk ON wk.email = od.email_trabalhador
JOIN servicos sv ON sv.titulo = od.titulo_servico AND sv.trabalhador_id = wk.id
ON CONFLICT DO NOTHING;

-- ─── Pontos pelo histórico ────────────────────────────────────────────────

INSERT INTO historico_pontos (usuario_id, pedido_id, tipo, quantidade, descricao, criado_em)
SELECT wk.id, o.id, 'order_complete', 50, 'Pedido #' || o.id || ' concluído', o.concluido_em
FROM pedidos o
JOIN usuarios wk ON wk.id = o.trabalhador_id
WHERE o.estado = 'completed'
ON CONFLICT DO NOTHING;

INSERT INTO historico_pontos (usuario_id, pedido_id, tipo, quantidade, descricao, criado_em)
SELECT cl.id, o.id, 'order_complete', 10, 'Contratação #' || o.id || ' concluída', o.concluido_em
FROM pedidos o
JOIN usuarios cl ON cl.id = o.cliente_id
WHERE o.estado = 'completed'
ON CONFLICT DO NOTHING;

-- ─── Avaliações ──────────────────────────────────────────────────────────

INSERT INTO avaliacoes (pedido_id, avaliador_id, avaliado_id, rating, comment, criado_em)
SELECT o.id, o.cliente_id, o.trabalhador_id, rv.rating, rv.comment,
       o.concluido_em + INTERVAL '2 hours'
FROM pedidos o
JOIN usuarios cl ON cl.id = o.cliente_id
JOIN usuarios wk ON wk.id = o.trabalhador_id
JOIN (VALUES
  ('pedro@teste.com',   'carlos@teste.com', 5, 'Serviço impecável! Carlos é pontual, rápido e muito profissional. Recomendo demais.'),
  ('lucia@teste.com',   'maria@teste.com',  5, 'Maria é incrível! A casa ficou brilhando. Já agendei para o próximo mês.'),
  ('rafael@teste.com',  'joao@teste.com',   4, 'Ótimo trabalho! O quarto ficou lindo. Demorou um pouco mais que o esperado.'),
  ('fernanda@teste.com','carlos@teste.com', 5, 'Perfeito! O ar condicionado instalado com total segurança. Super recomendo.'),
  ('pedro@teste.com',   'anati@teste.com',  4, 'Computador formatado e rodando perfeitamente. Atendimento rápido e eficiente.'),
  ('lucia@teste.com',   'carlos@teste.com', 5, 'Carlos é excelente! Resolveu todos os problemas do quadro elétrico com competência.')
) AS rv(email_cliente, email_trabalhador, rating, comment)
ON cl.email = rv.email_cliente AND wk.email = rv.email_trabalhador
WHERE o.estado = 'completed'
ON CONFLICT DO NOTHING;

-- Atualiza stats dos trabalhadores
SELECT atualizar_estatisticas_usuario(id) FROM usuarios WHERE modo = 'worker';

-- ─── Pagamentos (escrow simulado) ────────────────────────────────────────

INSERT INTO pagamentos (pedido_id, pagador_id, recebedor_id, quantidade, estado, held_at, liberado_em)
SELECT o.id, o.cliente_id, o.trabalhador_id, o.price,
  CASE WHEN o.estado = 'completed' THEN 'released' ELSE 'held' END,
  o.criado_em,
  CASE WHEN o.estado = 'completed' THEN o.concluido_em ELSE NULL END
FROM pedidos o
WHERE o.estado IN ('completed', 'accepted')
ON CONFLICT DO NOTHING;

-- ─── Orçamentos abertos pelos clientes ───────────────────────────────────

INSERT INTO orcamentos (cliente_id, categoria_id, titulo, descricao, orcamento_maximo, cidade, estado)
SELECT cl.id, c.id, q.titulo, q.descricao, q.budget, 'São Paulo', 'open'
FROM (VALUES
  ('pedro@teste.com',   'eletrica',
   'Preciso instalar 5 pontos de tomada e 2 interruptores',
   'Apartamento de 70m² no 4º andar. Preciso instalar 5 tomadas novas na sala e quartos, e 2 interruptores. Já tenho os eletrodutos passados. Quero que alguém avalie e me dê um orçamento completo.',
   400.00),
  ('lucia@teste.com',   'limpeza',
   'Limpeza pós-obra em escritório de 120m²',
   'Acabamos de reformar nosso escritório. Preciso de limpeza completa pós-obra: remoção de pó de reboco, limpeza de vidros, pisos e banheiros. Ambiente comercial, 3 salas.',
   600.00),
  ('fernanda@teste.com','informatica',
   'Instalação de rede Wi-Fi corporativa e câmeras de segurança',
   'Tenho um escritório com 15 funcionários. Preciso melhorar a rede Wi-Fi (cobertura total) e instalar 4 câmeras externas e 2 internas com acesso remoto pelo celular.',
   800.00),
  ('rafael@teste.com',  'pintura',
   'Pintura completa de apartamento 2 quartos',
   'Apartamento de 60m² recém comprado, precisa de pintura completa. 2 quartos, sala, cozinha e banheiro. Quero cor clara nas paredes e branco no teto. Quero orçamento com e sem material.',
   1200.00)
) AS q(email, cat, titulo, descricao, budget)
JOIN usuarios cl ON cl.email = q.email
JOIN categorias c ON c.slug = q.cat
ON CONFLICT DO NOTHING;

-- ─── Propostas dos trabalhadores ─────────────────────────────────────────

INSERT INTO propostas_orcamento (orcamento_id, trabalhador_id, price, mensagem, estado)
SELECT qt.id, wk.id, p.price, p.mensagem, p.estado
FROM (VALUES
  ('pedro@teste.com',    'carlos@teste.com', 320.00,
   'Olá! Tenho disponibilidade para esta semana. Pelo que descreveu, consigo instalar as 5 tomadas e 2 interruptores em um dia. O valor inclui material (tomadas e interruptores de qualidade) e mão de obra. Tenho 12 anos de experiência e sou certificado.',
   'pending'),
  ('lucia@teste.com',    'maria@teste.com',  480.00,
   'Especialista em limpeza pós-obra! Para 120m² comercial, nossa equipe de 2 pessoas conclui em 1 dia. Inclui produtos de limpeza profissional, remoção completa de pó, vidros e pisos. Posso iniciar ainda esta semana.',
   'pending'),
  ('fernanda@teste.com', 'anati@teste.com',  720.00,
   'Trabalho com redes corporativas há 5 anos. Posso instalar roteadores mesh para cobertura total do escritório e configurar as 6 câmeras com app no celular. Inclui cabeamento cat6 e configuração de VLAN. Prazo: 2 dias.',
   'accepted')
) AS p(email_cliente, email_trabalhador, price, mensagem, estado)
JOIN usuarios cl ON cl.email = p.email_cliente
JOIN usuarios wk ON wk.email = p.email_trabalhador
JOIN orcamentos qt ON qt.cliente_id = cl.id
WHERE qt.estado = 'open' OR qt.estado = 'in_review'
ON CONFLICT DO NOTHING;
