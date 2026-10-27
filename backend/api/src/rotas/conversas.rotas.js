const { Router } = require('express');
const { consultarBanco } = require('../banco/conexao');
const { intermediarioAutenticacao } = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const { ErroApi, assert, exigirCampos } = require('../intermediarios/tratamentoErros');

const router = Router();

/** * Chat do MoviPay. O que mudou e por quê: antes, `mensagens_chat` exigia `pedido_id`, ou seja, só existia conversa DEPOIS de um pedido criado. Isso tornava impossível o que o prod... */

/** Descobre qual dos dois lados é cliente e qual é trabalhador. */
async function resolveParticipants(userId, otherUserId) {
  const { rows } = await consultarBanco(
    `SELECT id, eh_cliente, eh_trabalhador, nome FROM usuarios WHERE id = ANY($1)`,
    [[userId, otherUserId]]
  );
  const me = rows.find((r) => r.id === userId);
  const other = rows.find((r) => r.id === otherUserId);

  if (!other) throw new ErroApi(404, 'Usuário não encontrado.');
  assert(userId !== otherUserId, 400, 'Você não pode iniciar uma conversa consigo mesmo.');

  // O trabalhador da conversa é quem tem perfil profissional. Se os dois tiverem (conta híbrida dos dois lados), quem INICIOU entra como cliente.
  if (other.eh_trabalhador) return { clientId: userId, workerId: otherUserId, otherName: other.nome };
  if (me.eh_trabalhador) return { clientId: otherUserId, workerId: userId, otherName: other.nome };

  throw new ErroApi(
    400,
    'A conversa precisa ter um profissional. Este usuário ainda não tem perfil de trabalhador.'
  );
}

/** Busca a conversa do par; cria se ainda não existir. */
async function findOrCreateConversation(clientId, workerId, { origin = 'direct', shortId = null } = {}) {
  const existing = await consultarBanco('SELECT * FROM conversas WHERE cliente_id = $1 AND trabalhador_id = $2', [
    clientId,
    workerId,
  ]);
  if (existing.rows[0]) return existing.rows[0];

  const { rows } = await consultarBanco(
    `INSERT INTO conversas (cliente_id, trabalhador_id, origin, origin_short_id)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (cliente_id, trabalhador_id) DO UPDATE SET cliente_id = EXCLUDED.cliente_id
     RETURNING *`,
    [clientId, workerId, origin, shortId]
  );
  return rows[0];
}

async function assertConversationMember(conversationId, userId) {
  const { rows } = await consultarBanco('SELECT * FROM conversas WHERE id = $1', [conversationId]);
  const conv = rows[0];
  if (!conv) throw new ErroApi(404, 'Conversa não encontrada.');
  assert(conv.cliente_id === userId || conv.trabalhador_id === userId, 403, 'Você não tem acesso a esta conversa.');
  return conv;
}

const CONVERSATION_FIELDS = `c.id AS conversa_id, c.origin, c.origin_short_id, c.ultima_mensagem_em,
  CASE WHEN c.cliente_id = $1 THEN c.trabalhador_id ELSE c.cliente_id END AS outro_usuario_id,
  CASE WHEN c.cliente_id = $1 THEN wu.nome ELSE cu.nome END AS outro_nome,
  CASE WHEN c.cliente_id = $1 THEN wu.url_avatar ELSE cu.url_avatar END AS url_avatar_outro,
  CASE WHEN c.cliente_id = $1 THEN TRUE ELSE FALSE END AS outro_eh_trabalhador,
  lm.conteudo AS last_message,
  COALESCE(unread.count, 0) AS quantidade_nao_lidas,
  last_order.id AS pedido_id, last_order.estado AS estado_pedido`;

const CONVERSATION_JOINS = `FROM conversas c
  JOIN usuarios cu ON cu.id = c.cliente_id
  JOIN usuarios wu ON wu.id = c.trabalhador_id
  LEFT JOIN LATERAL (
    SELECT conteudo FROM mensagens_chat WHERE conversa_id = c.id ORDER BY criado_em DESC LIMIT 1
  ) lm ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS count FROM mensagens_chat
    WHERE conversa_id = c.id AND remetente_id <> $1 AND foi_lido = FALSE
  ) unread ON TRUE
  LEFT JOIN LATERAL (
    SELECT id, estado FROM pedidos o
    WHERE o.cliente_id = c.cliente_id AND o.trabalhador_id = c.trabalhador_id
    ORDER BY o.criado_em DESC LIMIT 1
  ) last_order ON TRUE`;

/** GET /api/v1/conversas — lista de conversas do usuário logado. */
router.get(
  '/',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT ${CONVERSATION_FIELDS} ${CONVERSATION_JOINS}
       WHERE c.cliente_id = $1 OR c.trabalhador_id = $1
       ORDER BY c.ultima_mensagem_em DESC NULLS LAST, c.criado_em DESC`,
      [req.usuario.id]
    );
    res.json({ conversas: rows });
  })
);

/** Alias explícito — o app antigo chamava /conversas/conversas. */
router.get(
  '/conversas',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT ${CONVERSATION_FIELDS} ${CONVERSATION_JOINS}
       WHERE c.cliente_id = $1 OR c.trabalhador_id = $1
       ORDER BY c.ultima_mensagem_em DESC NULLS LAST, c.criado_em DESC`,
      [req.usuario.id]
    );
    res.json({ conversas: rows });
  })
);

/** * POST /api/v1/conversas/direta body: { usuario_id, publicacao_id?, origin? } É o endpoint que os botões "Chat" (perfil do trabalhador) e "Contato" (Shorts) chamam. Devolve a conversa real —... */
router.post(
  '/direta',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    let targetUserId = req.body.usuario_id ? Number(req.body.usuario_id) : null;
    let origin = ['direct', 'short', 'profile'].includes(req.body.origin) ? req.body.origin : 'direct';
    let shortId = null;

    if (req.body.publicacao_id) {
      const found = await consultarBanco('SELECT id, trabalhador_id FROM publicacoes WHERE id = $1', [req.body.publicacao_id]);
      if (!found.rows[0]) throw new ErroApi(404, 'Publicação não encontrada.');
      shortId = found.rows[0].id;
      targetUserId = found.rows[0].trabalhador_id; // dono real da publicação
      origin = 'short';
    }

    assert(targetUserId, 400, 'Informe com quem você quer conversar.');

    const { clientId, workerId, otherName } = await resolveParticipants(req.usuario.id, targetUserId);
    const conversation = await findOrCreateConversation(clientId, workerId, { origin, shortId });

    res.status(201).json({
      conversation: {
        conversa_id: conversation.id,
        outro_usuario_id: targetUserId,
        outro_nome: otherName,
        origin: conversation.origin,
      },
    });
  })
);

/** GET /api/v1/conversas/conversa/:id — mensagens da thread. */
router.get(
  '/conversa/:id',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const conv = await assertConversationMember(req.params.id, req.usuario.id);

    const { rows } = await consultarBanco(
      `SELECT id, conversa_id, pedido_id, remetente_id, conteudo, foi_lido, criado_em
       FROM mensagens_chat WHERE conversa_id = $1 ORDER BY criado_em ASC`,
      [conv.id]
    );

    await consultarBanco(
      `UPDATE mensagens_chat SET foi_lido = TRUE
       WHERE conversa_id = $1 AND remetente_id <> $2 AND foi_lido = FALSE`,
      [conv.id, req.usuario.id]
    );

    const otherId = conv.cliente_id === req.usuario.id ? conv.trabalhador_id : conv.cliente_id;
    const other = await consultarBanco('SELECT id, nome, url_avatar, eh_trabalhador FROM usuarios WHERE id = $1', [otherId]);

    res.json({ messages: rows, conversation: conv, other: other.rows[0] || null });
  })
);

/** POST /api/v1/conversas/conversa/:id — envia mensagem na thread. */
router.post(
  '/conversa/:id',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const conv = await assertConversationMember(req.params.id, req.usuario.id);
    exigirCampos(req.body, ['conteudo']);
    const conteudo = String(req.body.conteudo).trim();
    assert(conteudo.length > 0, 400, 'A mensagem não pode ficar vazia.');
    assert(conteudo.length <= 4000, 400, 'Mensagem muito longa.');

    const { rows } = await consultarBanco(
      `INSERT INTO mensagens_chat (conversa_id, pedido_id, remetente_id, conteudo)
       VALUES ($1,$2,$3,$4)
       RETURNING id, conversa_id, pedido_id, remetente_id, conteudo, foi_lido, criado_em`,
      [conv.id, req.body.pedido_id || null, req.usuario.id, conteudo]
    );
    res.status(201).json({ mensagem: rows[0] });
  })
);

// ------------------------------------------------------------------ Compatibilidade: rotas por PEDIDO (as que o app já usava) ----------------------...

async function conversationForOrder(orderId, userId) {
  const { rows } = await consultarBanco('SELECT id, cliente_id, trabalhador_id FROM pedidos WHERE id = $1', [orderId]);
  const order = rows[0];
  if (!order) throw new ErroApi(404, 'Pedido não encontrado.');
  assert(order.cliente_id === userId || order.trabalhador_id === userId, 403, 'Você não tem acesso a este chat.');
  return findOrCreateConversation(order.cliente_id, order.trabalhador_id, { origin: 'order' });
}

router.get(
  '/:orderId',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const conv = await conversationForOrder(req.params.orderId, req.usuario.id);

    const { rows } = await consultarBanco(
      `SELECT id, conversa_id, pedido_id, remetente_id, conteudo, foi_lido, criado_em
       FROM mensagens_chat WHERE conversa_id = $1 ORDER BY criado_em ASC`,
      [conv.id]
    );
    await consultarBanco(
      `UPDATE mensagens_chat SET foi_lido = TRUE
       WHERE conversa_id = $1 AND remetente_id <> $2 AND foi_lido = FALSE`,
      [conv.id, req.usuario.id]
    );
    res.json({ messages: rows, conversa_id: conv.id });
  })
);

router.post(
  '/:orderId',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const conv = await conversationForOrder(req.params.orderId, req.usuario.id);
    exigirCampos(req.body, ['conteudo']);
    const conteudo = String(req.body.conteudo).trim();
    assert(conteudo.length > 0, 400, 'A mensagem não pode ficar vazia.');

    const { rows } = await consultarBanco(
      `INSERT INTO mensagens_chat (conversa_id, pedido_id, remetente_id, conteudo)
       VALUES ($1,$2,$3,$4)
       RETURNING id, conversa_id, pedido_id, remetente_id, conteudo, foi_lido, criado_em`,
      [conv.id, req.params.orderId, req.usuario.id, conteudo]
    );
    res.status(201).json({ mensagem: rows[0] });
  })
);

module.exports = router;
