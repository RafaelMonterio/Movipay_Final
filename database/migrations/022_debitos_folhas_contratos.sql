-- 022_folhas_debits_and_contracts.sql
-- Débitos de Folhas vinculados a pedidos: cada evento só pode debitar uma vez.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'historico_pontos'::regclass AND conname = 'historico_pontos_tipo_check') THEN
    ALTER TABLE historico_pontos DROP CONSTRAINT historico_pontos_tipo_check;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'historico_pontos'::regclass AND conname = 'points_history_type_check') THEN
    ALTER TABLE historico_pontos DROP CONSTRAINT points_history_type_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'historico_pontos'::regclass AND conname = 'historico_pontos_tipo_check') THEN
    ALTER TABLE historico_pontos ADD CONSTRAINT historico_pontos_tipo_check CHECK (tipo IN (
      'order_complete', 'bonus', 'referral', 'review_given', 'penalty',
      'order_schedule', 'order_proposal_accept'
    ));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_historico_folhas_debito_pedido
  ON historico_pontos (usuario_id, pedido_id, tipo)
  WHERE pedido_id IS NOT NULL
    AND tipo IN ('order_schedule', 'order_proposal_accept');

COMMENT ON INDEX uq_historico_folhas_debito_pedido IS
  'Garante idempotência dos débitos de Folhas por evento de pedido';
