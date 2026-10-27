-- ============================================================
-- atualizar_estatisticas_usuario.sql
-- Recalcula estatísticas de um usuário (nota média, total pedidos)
-- Uso: SELECT atualizar_estatisticas_usuario(trabalhador_id);
-- ============================================================

-- Adiciona colunas de stats na tabela usuarios (se não existirem)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS media_avaliacao    NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_pedidos  INTEGER      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_avaliacoes INTEGER      DEFAULT 0;

-- Função que recalcula e atualiza as stats
CREATE OR REPLACE FUNCTION atualizar_estatisticas_usuario(p_user_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE usuarios
  SET
    media_avaliacao = (
      SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0)
      FROM avaliacoes
      WHERE avaliado_id = p_user_id
    ),
    total_avaliacoes = (
      SELECT COUNT(*)
      FROM avaliacoes
      WHERE avaliado_id = p_user_id
    ),
    total_pedidos = (
      SELECT COUNT(*)
      FROM pedidos
      WHERE (cliente_id = p_user_id OR trabalhador_id = p_user_id)
        AND estado = 'completed'
    ),
    atualizado_em = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION atualizar_estatisticas_usuario IS
  'Recalcula nota média, total de pedidos e avaliacoes do usuário. '
  'Chamada automaticamente pelo trigger após cada review ou pedido concluído.';

-- Alias histórico mantido para bancos e integrações antigas.
CREATE OR REPLACE FUNCTION update_user_stats(p_user_id INTEGER)
RETURNS VOID AS $$
BEGIN
  PERFORM atualizar_estatisticas_usuario(p_user_id);
END;
$$ LANGUAGE plpgsql;
