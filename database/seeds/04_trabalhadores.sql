-- ============================================================
-- 04_workers.sql
-- 4 trabalhadores com perfil completo, localização e disponibilidade
-- Todos com senha "123456" (hash bcrypt)
-- ============================================================

-- Atualiza usuários existentes para Ribeirão Pires
UPDATE usuarios
SET cidade = 'Ribeirão Pires',
    lat = CASE
      WHEN email = 'carlos@teste.com' THEN -23.7061
      WHEN email = 'maria@teste.com' THEN -23.7042
      WHEN email = 'joao@teste.com' THEN -23.7075
      WHEN email = 'anati@teste.com' THEN -23.7052
      ELSE lat
    END,
    lng = CASE
      WHEN email = 'carlos@teste.com' THEN -46.3685
      WHEN email = 'maria@teste.com' THEN -46.3698
      WHEN email = 'joao@teste.com' THEN -46.3653
      WHEN email = 'anati@teste.com' THEN -46.3690
      ELSE lng
    END,
    bairro = CASE
      WHEN email = 'carlos@teste.com' THEN 'Centro'
      WHEN email = 'maria@teste.com' THEN 'Parque São Vicente'
      WHEN email = 'joao@teste.com' THEN 'Jardim Ruyce'
      WHEN email = 'anati@teste.com' THEN 'Vila Bela'
      ELSE bairro
    END
WHERE modo = 'worker' AND email IN ('carlos@teste.com', 'maria@teste.com', 'joao@teste.com', 'anati@teste.com');

-- Insere os trabalhadores
INSERT INTO usuarios (nome, email, hash_senha, modo, pontos, telefone, bio, lat, lng, cidade, bairro, eh_verificado, esta_disponivel, media_avaliacao, total_pedidos)
VALUES
  (
    'Carlos Eletricista',
    'carlos@teste.com',
    '$2a$10$UEu5kI0dzfEJl1Toj7kjaOu0CMr953pfm9N77mya7ILnAsGBp4tb2',
    'worker', 480, '(11) 98765-4321',
    'Eletricista com 12 anos de experiência. Especialista em instalações residenciais e comerciais, quadros elétricos, tomadas e iluminação. Atendo com agilidade e preço justo.',
    -23.7061, -46.3685, 'Ribeirão Pires', 'Centro',
    TRUE, TRUE, 4.8, 47
  ),
  (
    'Maria Limpeza',
    'maria@teste.com',
    '$2a$10$UEu5kI0dzfEJl1Toj7kjaOu0CMr953pfm9N77mya7ILnAsGBp4tb2',
    'worker', 320, '(11) 97654-3210',
    'Profissional de limpeza há 8 anos. Atendo residências, apartamentos e escritórios. Trabalho com produtos de qualidade, pontualidade e atenção a cada detalhe. Limpeza pós-obra também.',
    -23.7042, -46.3698, 'Ribeirão Pires', 'Parque São Vicente',
    TRUE, TRUE, 4.9, 63
  ),
  (
    'João Pintor',
    'joao@teste.com',
    '$2a$10$UEu5kI0dzfEJl1Toj7kjaOu0CMr953pfm9N77mya7ILnAsGBp4tb2',
    'worker', 210, '(11) 96543-2109',
    'Pintor profissional com 15 anos de mercado. Faço pintura interna e externa, textura, grafiato e pintura epóxi para garagens. Orçamento sem compromisso e prazo garantido.',
    -23.7075, -46.3653, 'Ribeirão Pires', 'Jardim Ruyce',
    TRUE, FALSE, 4.6, 31
  ),
  (
    'Ana TI',
    'anati@teste.com',
    '$2a$10$UEu5kI0dzfEJl1Toj7kjaOu0CMr953pfm9N77mya7ILnAsGBp4tb2',
    'worker', 150, '(11) 95432-1098',
    'Técnica em informática com especialização em redes e suporte. Formatação, vírus, configuração de roteadores, câmeras de segurança e suporte remoto. Atendo também empresas.',
    -23.7052, -46.3690, 'Ribeirão Pires', 'Vila Bela',
    FALSE, TRUE, 4.5, 22
  )
ON CONFLICT (email) DO NOTHING;

-- Slots de disponibilidade — Carlos (seg-sex 8h-18h, sáb 8h-12h)
INSERT INTO horarios_disponibilidade (trabalhador_id, weekday, hora_inicio, hora_fim)
SELECT u.id, s.weekday, s.h_start, s.h_end
FROM usuarios u,
  (VALUES (1,8,18),(1,9,18),(1,10,18),(1,11,18),(1,12,18),(6,8,12)) AS s(weekday, h_start, h_end)
WHERE u.email = 'carlos@teste.com'
ON CONFLICT DO NOTHING;

-- Maria (seg-sab 7h-17h)
INSERT INTO horarios_disponibilidade (trabalhador_id, weekday, hora_inicio, hora_fim)
SELECT u.id, s.weekday, 7, 17
FROM usuarios u,
  (VALUES (1),(2),(3),(4),(5),(6)) AS s(weekday)
WHERE u.email = 'maria@teste.com'
ON CONFLICT DO NOTHING;

-- João (ter-sab 8h-17h)
INSERT INTO horarios_disponibilidade (trabalhador_id, weekday, hora_inicio, hora_fim)
SELECT u.id, s.weekday, 8, 17
FROM usuarios u,
  (VALUES (2),(3),(4),(5),(6)) AS s(weekday)
WHERE u.email = 'joao@teste.com'
ON CONFLICT DO NOTHING;

-- Ana TI (seg-sex 9h-18h)
INSERT INTO horarios_disponibilidade (trabalhador_id, weekday, hora_inicio, hora_fim)
SELECT u.id, s.weekday, 9, 18
FROM usuarios u,
  (VALUES (1),(2),(3),(4),(5)) AS s(weekday)
WHERE u.email = 'anati@teste.com'
ON CONFLICT DO NOTHING;
