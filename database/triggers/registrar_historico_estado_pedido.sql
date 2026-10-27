-- ============================================================
-- registrar_historico_estado_pedido.sql
-- Sempre que pedidos.estado muda, registra uma linha em
-- historico_status_pedido — alimenta a timeline visual do pedido
-- no app, sem precisar duplicar essa lógica em cada rota.
-- Roda DEPOIS das triggers de validação/pontos (AFTER UPDATE),
-- então só é chamada quando a mudança já foi aceita como válida.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_registrar_historico_estado_pedido()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    INSERT INTO historico_status_pedido (pedido_id, estado, note)
    VALUES (
      NEW.id,
      NEW.estado,
      CASE NEW.estado
        WHEN 'accepted'    THEN 'Trabalhador aceitou o pedido'
        WHEN 'in_progress' THEN 'Serviço iniciado'
        WHEN 'completed'   THEN 'Serviço concluído'
        WHEN 'cancelled'   THEN COALESCE('Pedido cancelado: ' || NEW.motivo_cancelamento, 'Pedido cancelado')
        ELSE 'Status atualizado para ' || NEW.estado
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_registrar_historico_estado_pedido ON pedidos;
CREATE TRIGGER trg_registrar_historico_estado_pedido
  AFTER UPDATE OF estado ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION fn_registrar_historico_estado_pedido();
