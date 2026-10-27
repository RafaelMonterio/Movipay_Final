-- ============================================================
-- 02_users.sql
-- Usuários de teste — senha "123456" já em hash bcrypt
-- Hash gerado com: bcrypt.hashSync('123456', 10)
-- ============================================================

INSERT INTO usuarios (nome, email, hash_senha, modo, pontos) VALUES
  (
    'Ana Cliente',
    'ana@teste.com',
    '$2a$10$UEu5kI0dzfEJl1Toj7kjaOu0CMr953pfm9N77mya7ILnAsGBp4tb2',
    'client',
    320
  ),
  (
    'Bruno Trabalhador',
    'bruno@teste.com',
    '$2a$10$UEu5kI0dzfEJl1Toj7kjaOu0CMr953pfm9N77mya7ILnAsGBp4tb2',
    'worker',
    150
  ),
  (
    'Admin MoviPay',
    'admin@movipay.com',
    '$2a$10$UEu5kI0dzfEJl1Toj7kjaOu0CMr953pfm9N77mya7ILnAsGBp4tb2',
    'worker',
    0
  )
ON CONFLICT (email) DO NOTHING;

-- Bônus de boas-vindas para Ana
INSERT INTO historico_pontos (usuario_id, tipo, quantidade, descricao)
SELECT id, 'bonus', 320, 'Bônus de boas-vindas'
FROM usuarios WHERE email = 'ana@teste.com'
ON CONFLICT DO NOTHING;
