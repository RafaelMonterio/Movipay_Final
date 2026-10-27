-- ============================================================
-- atualizar_pontos.sql
-- Trigger: quando pedido vira 'completed', adiciona pontos
-- automaticamente ao trabalhador e ao cliente
-- ============================================================

CREATE OR REPLACE FUNCTION fn_award_points_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  worker_points  INTEGER := 50;   -- pontos fixos para o trabalhador
  client_points  INTEGER := 10;   -- pontos fixos para o cliente
BEGIN
  -- Só age quando estado muda PARA 'completed'
  IF NEW.estado = 'completed' AND OLD.estado != 'completed' THEN

    -- 1. Adiciona pontos ao trabalhador
    UPDATE usuarios
      SET pontos = pontos + worker_points, atualizado_em = NOW()
      WHERE id = NEW.trabalhador_id;

    INSERT INTO historico_pontos (usuario_id, pedido_id, tipo, quantidade, descricao)
    VALUES (
      NEW.trabalhador_id, NEW.id, 'order_complete', worker_points,
      'Pedido #' || NEW.id || ' concluído'
    );

    -- 2. Adiciona pontos ao cliente
    UPDATE usuarios
      SET pontos = pontos + client_points, atualizado_em = NOW()
      WHERE id = NEW.cliente_id;

    INSERT INTO historico_pontos (usuario_id, pedido_id, tipo, quantidade, descricao)
    VALUES (
      NEW.cliente_id, NEW.id, 'order_complete', client_points,
      'Contratação #' || NEW.id || ' concluída'
    );

    -- 3. Atualiza stats do trabalhador
    PERFORM atualizar_estatisticas_usuario(NEW.trabalhador_id);

    -- 4. Registra data de conclusão
    NEW.concluido_em := NOW();
  END IF;

  -- Sempre atualiza atualizado_em ao mudar estado
  NEW.atualizado_em := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria o trigger na tabela pedidos
DROP TRIGGER IF EXISTS trg_award_points ON pedidos;
CREATE TRIGGER trg_award_points
  BEFORE UPDATE OF estado ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION fn_award_points_on_completion();

COMMENT ON FUNCTION fn_award_points_on_completion IS
  'Trigger: ao concluir pedido, pontua trabalhador (+50) e cliente (+10) automaticamente.';
