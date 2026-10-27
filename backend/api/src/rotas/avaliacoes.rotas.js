const { Router } = require('express');
const { consultarBanco } = require('../banco/conexao');
const { intermediarioAutenticacao } = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const { ErroApi, assert, exigirCampos } = require('../intermediarios/tratamentoErros');

const router = Router();

router.post(
  '/',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    exigirCampos(req.body, ['pedido_id', 'rating']);
    const rating = Number(req.body.rating);
    assert(rating >= 1 && rating <= 5, 400, 'A nota precisa ser entre 1 e 5.');

    const orderRes = await consultarBanco('SELECT cliente_id, trabalhador_id, estado FROM pedidos WHERE id = $1', [
      req.body.pedido_id,
    ]);
    const order = orderRes.rows[0];
    if (!order) throw new ErroApi(404, 'Pedido não encontrado.');
    assert(order.cliente_id === req.usuario.id, 403, 'Somente o cliente do pedido pode avaliá-lo.');
    assert(order.estado === 'completed', 400, 'Só é possível avaliar pedidos concluídos.');

    const existing = await consultarBanco('SELECT id FROM avaliacoes WHERE pedido_id = $1', [req.body.pedido_id]);
    if (existing.rows[0]) throw new ErroApi(409, 'Este pedido já foi avaliado.');

    const { rows } = await consultarBanco(
      `INSERT INTO avaliacoes (pedido_id, avaliador_id, avaliado_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.body.pedido_id, req.usuario.id, order.trabalhador_id, rating, req.body.comentario || null]
    );

    // O tipo 'review_given' já existia no schema original, mas nunca era usado por nenhuma rota — completando essa recompensa aqui.
    const BONUS = 5;
    await consultarBanco(`UPDATE usuarios SET pontos = pontos + $1 WHERE id = $2`, [BONUS, req.usuario.id]);
    await consultarBanco(
      `INSERT INTO historico_pontos (usuario_id, pedido_id, tipo, quantidade, descricao) VALUES ($1,$2,'review_given',$3,'Avaliação enviada')`,
      [req.usuario.id, req.body.pedido_id, BONUS]
    );

    // A trigger de pontos já recalcula media_avaliacao/total_avaliacoes do trabalhador ao concluir o pedido; como a avaliação normalmente chega depois, força a a...
    await consultarBanco('SELECT atualizar_estatisticas_usuario($1)', [order.trabalhador_id]);

    res.status(201).json({ avaliacao: rows[0], pointsEarned: BONUS });
  })
);

router.get(
  '/meus',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT r.id, r.rating, r.comentario, r.criado_em, r.pedido_id, u.nome AS nome_avaliado, u.url_avatar AS url_avatar_avaliado
       FROM avaliacoes r JOIN usuarios u ON u.id = r.avaliado_id
       WHERE r.avaliador_id = $1 ORDER BY r.criado_em DESC`,
      [req.usuario.id]
    );
    res.json({ avaliacoes: rows });
  })
);

module.exports = router;
