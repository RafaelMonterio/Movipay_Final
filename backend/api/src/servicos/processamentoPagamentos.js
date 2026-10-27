/** * Processamento de pagamento — o único lugar que aprova uma cobrança. Fica num serviço (e não dentro de uma rota) porque três entradas diferentes precisam dele: o webhook do gat... */

const { obterClienteBanco } = require('../banco/conexao');

/** Ativa/renova a assinatura por 30 dias e grava o plano no usuário. */
async function ativarAssinatura(conn, subscriptionId) {
  const { rows } = await conn.consultarBanco(
    `SELECT s.id, s.usuario_id, p.slug FROM assinaturas s
     JOIN planos_assinatura p ON p.id = s.plano_id WHERE s.id = $1`,
    [subscriptionId]
  );
  const sub = rows[0];
  if (!sub) return null;

  // Encerra qualquer outra assinatura ativa (troca de plano fica no histórico).
  await conn.consultarBanco(
    `UPDATE assinaturas SET estado = 'cancelled', cancelado_em = NOW(), atualizado_em = NOW()
     WHERE usuario_id = $1 AND estado = 'active' AND id <> $2`,
    [sub.usuario_id, sub.id]
  );

  const periodEnd = await conn.consultarBanco(
    `UPDATE assinaturas SET
       estado = 'active',
       iniciado_em = COALESCE(iniciado_em, NOW()),
       fim_periodo_atual = GREATEST(COALESCE(fim_periodo_atual, NOW()), NOW()) + INTERVAL '30 days',
       atualizado_em = NOW()
     WHERE id = $1 RETURNING fim_periodo_atual`,
    [sub.id]
  );

  await conn.consultarBanco('UPDATE usuarios SET slug_plano = $1, plano_expira_em = $2 WHERE id = $3', [
    sub.slug,
    periodEnd.rows[0].fim_periodo_atual,
    sub.usuario_id,
  ]);

  return { planSlug: sub.slug, currentPeriodEnd: periodEnd.rows[0].fim_periodo_atual };
}

/** * Aplica um estado novo a uma cobrança e dispara os efeitos colaterais. @param {number} txId id em transacoes_pagamento @param {'pending'|'approved'|'rejected'|'expired'|'refund... */
async function aplicarEstadoPagamento(txId, estado, detail, paidAt) {
  const conn = await obterClienteBanco();
  try {
    await conn.consultarBanco('BEGIN');

    const cur = await conn.consultarBanco('SELECT * FROM transacoes_pagamento WHERE id = $1 FOR UPDATE', [txId]);
    const tx = cur.rows[0];
    if (!tx) {
      await conn.consultarBanco('ROLLBACK');
      return null;
    }

    // Idempotência: webhook reenviado não processa de novo, e uma cobrança já aprovada só muda para estorno.
    if (tx.estado === estado || (tx.estado === 'approved' && estado !== 'refunded')) {
      await conn.consultarBanco('COMMIT');
      return tx;
    }

    await conn.consultarBanco(
      // $1 é comparado com uma constante de texto e também atribuído a uma coluna varchar — sem o cast explícito o Postgres não consegue deduzir um tipo ún...
      `UPDATE transacoes_pagamento SET estado = $1::varchar, detalhe_estado = $2,
         pago_em = CASE WHEN $1::text = 'approved' THEN COALESCE($3::timestamptz, NOW()) ELSE pago_em END,
         atualizado_em = NOW()
       WHERE id = $4`,
      [estado, detail || null, paidAt || null, txId]
    );

    if (estado === 'approved') {
      if (tx.kind === 'service') {
        await conn.consultarBanco(
          `UPDATE transacoes_servico SET estado = 'paid', atualizado_em = NOW()
           WHERE transacao_pagamento_id = $1`,
          [txId]
        );
        await conn.consultarBanco(
          `INSERT INTO comissoes_plataforma
             (source, transacao_servico_id, transacao_pagamento_id, trabalhador_id, cliente_id,
              valor_bruto, percentual_taxa, quantidade)
           SELECT 'service', st.id, $1, st.trabalhador_id, st.cliente_id,
                  st.valor_bruto, st.percentual_taxa, st.taxa_plataforma
           FROM transacoes_servico st WHERE st.transacao_pagamento_id = $1`,
          [txId]
        );
        // O trabalhador recebe o LÍQUIDO (bruto menos a comissão).
        await conn.consultarBanco('UPDATE usuarios SET saldo_carteira = saldo_carteira + $1 WHERE id = $2', [
          tx.valor_liquido,
          tx.recebedor_id,
        ]);
        if (tx.pedido_id) {
          await conn.consultarBanco('UPDATE pedidos SET pago_em = NOW() WHERE id = $1 AND pago_em IS NULL', [tx.pedido_id]);
        }
      }

      if (tx.kind === 'subscription' && tx.assinatura_id) {
        await ativarAssinatura(conn, tx.assinatura_id);
        await conn.consultarBanco(
          `INSERT INTO comissoes_plataforma
             (source, transacao_pagamento_id, trabalhador_id, valor_bruto, percentual_taxa, quantidade)
           VALUES ('subscription', $1, $2, $3, 100, $3)`,
          [txId, tx.pagador_id, tx.valor_bruto]
        );
      }

      if (tx.kind === 'quote_boost' && tx.orcamento_id) {
        // 100% do valor da divulgação é receita da plataforma — não há "trabalhador" para repassar nada aqui, é o cliente pagando direto por destaque, igual...
        const { obterConfiguracaoImpulsoOrcamento } = require('../utilitarios/dinheiro');
        const { days } = await obterConfiguracaoImpulsoOrcamento();
        await conn.consultarBanco(
          `UPDATE orcamentos SET foi_impulsionado = TRUE, impulsionado_em = NOW(), impulso_expira_em = NOW() + ($1 || ' days')::interval
           WHERE id = $2`,
          [days, tx.orcamento_id]
        );
        await conn.consultarBanco(
          `INSERT INTO comissoes_plataforma
             (source, transacao_pagamento_id, cliente_id, valor_bruto, percentual_taxa, quantidade)
           VALUES ('quote_boost', $1, $2, $3, 100, $3)`,
          [txId, tx.pagador_id, tx.valor_bruto]
        );
      }
    }

    if (estado === 'refunded' && tx.kind === 'service') {
      await conn.consultarBanco(
        `UPDATE transacoes_servico SET estado = 'refunded', atualizado_em = NOW()
         WHERE transacao_pagamento_id = $1`,
        [txId]
      );
      await conn.consultarBanco('UPDATE usuarios SET saldo_carteira = GREATEST(0, saldo_carteira - $1) WHERE id = $2', [
        tx.valor_liquido,
        tx.recebedor_id,
      ]);
    }

    if ((estado === 'cancelled' || estado === 'expired') && tx.kind === 'subscription' && tx.assinatura_id) {
      await conn.consultarBanco(
        `UPDATE assinaturas SET estado = 'expired', atualizado_em = NOW()
         WHERE id = $1 AND estado = 'pending'`,
        [tx.assinatura_id]
      );
    }

    await conn.consultarBanco('COMMIT');
    return { ...tx, estado };
  } catch (err) {
    await conn.consultarBanco('ROLLBACK');
    throw err;
  } finally {
    conn.release();
  }
}

/** * Expira assinaturas vencidas e devolve o trabalhador ao plano Formiga. Chamado no boot do servidor e a cada 6 h (ver app.js). */
async function expirarAssinaturasVencidas() {
  const conn = await obterClienteBanco();
  try {
    await conn.consultarBanco('BEGIN');
    const { rows } = await conn.consultarBanco(
      `UPDATE assinaturas SET estado = 'expired', atualizado_em = NOW()
       WHERE estado = 'active' AND fim_periodo_atual < NOW()
       RETURNING usuario_id`
    );
    for (const row of rows) {
      await conn.consultarBanco(
        `UPDATE usuarios SET slug_plano = 'formiga', plano_expira_em = NULL WHERE id = $1`,
        [row.usuario_id]
      );
    }
    await conn.consultarBanco('COMMIT');
    return rows.length;
  } catch (err) {
    await conn.consultarBanco('ROLLBACK');
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { aplicarEstadoPagamento, ativarAssinatura, expirarAssinaturasVencidas };
