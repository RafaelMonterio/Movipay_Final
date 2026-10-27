const { ErroApi } = require('../intermediarios/tratamentoErros');

const FOLHAS_POR_EVENTO = 10;

/**
 * Debita Folhas dentro de uma transação já aberta.
 * O bloqueio da linha do usuário serializa concorrência e o índice/marca do
 * histórico impede que retries cobrem o mesmo pedido duas vezes.
 */
async function debitarFolhas(conn, { usuarioId, pedidoId, tipo, descricao, quantidade = FOLHAS_POR_EVENTO }) {
  if (!['order_schedule', 'order_proposal_accept'].includes(tipo)) {
    throw new Error(`Tipo de débito de Folhas inválido: ${tipo}`);
  }
  // Primeiro trava a carteira; assim dois retries simultâneos observam o
  // histórico já confirmado em vez de tentar debitar duas vezes.
  const wallet = await conn.consultarBanco('SELECT id FROM usuarios WHERE id = $1 FOR UPDATE', [usuarioId]);
  if (!wallet.rows[0]) throw new ErroApi(404, 'Usuário não encontrado.');
  const existing = await conn.consultarBanco(
    `SELECT id, quantidade FROM historico_pontos
     WHERE usuario_id = $1 AND pedido_id = $2 AND tipo = $3
     LIMIT 1`,
    [usuarioId, pedidoId, tipo]
  );
  if (existing.rows[0]) {
    return { debited: false, quantidade: Math.abs(Number(existing.rows[0].quantidade)) };
  }

  const updated = await conn.consultarBanco(
    `UPDATE usuarios
     SET pontos = pontos - $1, atualizado_em = NOW()
     WHERE id = $2 AND pontos >= $1
     RETURNING pontos`,
    [quantidade, usuarioId]
  );
  if (!updated.rows[0]) {
    throw new ErroApi(409, `Saldo insuficiente. Você precisa de ${quantidade} Folhas para continuar.`, {
      code: 'INSUFFICIENT_FOLHAS',
      required: quantidade,
    });
  }
  await conn.consultarBanco(
    `INSERT INTO historico_pontos (usuario_id, pedido_id, tipo, quantidade, descricao)
     VALUES ($1, $2, $3, $4, $5)`,
    [usuarioId, pedidoId, tipo, -quantidade, descricao]
  );
  return { debited: true, quantidade, saldo: Number(updated.rows[0].pontos) };
}

module.exports = { FOLHAS_POR_EVENTO, debitarFolhas };
