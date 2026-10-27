-- ============================================================
-- atualizar_estado_pedido.sql
-- Trigger: valida que mudanças de estado seguem o fluxo correto
-- e atualiza timestamps automaticamente
-- ============================================================

CREATE OR REPLACE FUNCTION fn_validate_order_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Impede transições inválidas de estado
  -- pending → accepted | cancelled
  -- accepted → in_progress | cancelled
  -- in_progress → completed | cancelled
  -- completed → (imutável)
  -- cancelled → (imutável)

  IF OLD.estado = 'completed' OR OLD.estado = 'cancelled' THEN
    RAISE EXCEPTION
      'Pedido #% já está % e não pode ser alterado.',
      OLD.id, OLD.estado;
  END IF;

  -- Valida a transição específica
  IF NOT (
    (OLD.estado = 'pending'     AND NEW.estado IN ('accepted', 'cancelled'))    OR
    (OLD.estado = 'accepted'    AND NEW.estado IN ('in_progress', 'cancelled')) OR
    (OLD.estado = 'in_progress' AND NEW.estado IN ('completed', 'cancelled'))   OR
    (OLD.estado = NEW.estado)   -- permite "atualizar" sem mudar estado
  ) THEN
    RAISE EXCEPTION
      'Transição de estado inválida: % → % para pedido #%.',
      OLD.estado, NEW.estado, OLD.id;
  END IF;

  -- Timestamps automáticos
  IF NEW.estado = 'cancelled' AND OLD.estado != 'cancelled' THEN
    NEW.cancelado_em := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_order_status ON pedidos;
CREATE TRIGGER trg_validate_order_status
  BEFORE UPDATE OF estado ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION fn_validate_order_status();

COMMENT ON FUNCTION fn_validate_order_status IS
  'Garante que pedidos só mudem de estado em sequência válida. '
  'Pedidos completed ou cancelled são imutáveis.';
