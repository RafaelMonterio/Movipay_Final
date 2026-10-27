const { Router } = require('express');
const { consultarBanco, obterClienteBanco } = require('../banco/conexao');
const { intermediarioAutenticacao } = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const { ErroApi, assert, exigirCampos } = require('../intermediarios/tratamentoErros');
const { debitarFolhas } = require('../servicos/folhas');

const router = Router();

// GET /api/v1/agenda/eventos?month=2026-09 — compromissos agendados (pedidos.agendado_para) do mês, tanto como cliente quanto como trabalhador.
router.get(
  '/eventos',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const [year, mon] = month.split('-').map(Number);
    assert(year && mon, 400, "Parâmetro 'month' deve estar no formato YYYY-MM.");
    const role = req.query.role === 'client' || req.query.role === 'worker' ? req.query.role : req.usuario.modo;
    const column = role === 'worker' ? 'o.trabalhador_id' : 'o.cliente_id';

    const { rows } = await consultarBanco(
      `SELECT o.id AS pedido_id, o.estado, o.agendado_para, o.price, o.anotacoes,
              cu.nome AS nome_cliente, wu.nome AS nome_trabalhador, s.titulo AS titulo_servico
       FROM pedidos o
       JOIN usuarios cu ON cu.id = o.cliente_id
       JOIN usuarios wu ON wu.id = o.trabalhador_id
       LEFT JOIN servicos s ON s.id = o.servico_id
       WHERE ${column} = $1
         AND o.agendado_para IS NOT NULL
         AND date_trunc('month', o.agendado_para) = make_date($2, $3, 1)
       ORDER BY o.agendado_para ASC`,
      [req.usuario.id, year, mon]
    );
    res.json({ eventos: rows, month });
  })
);

router.post(
  '/eventos',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    exigirCampos(req.body, ['pedido_id', 'agendado_para']);
    const found = await consultarBanco('SELECT id, cliente_id, trabalhador_id, estado, agendado_para FROM pedidos WHERE id = $1', [req.body.pedido_id]);
    const order = found.rows[0];
    if (!order) throw new ErroApi(404, 'Pedido não encontrado.');
    assert(order.cliente_id === req.usuario.id || order.trabalhador_id === req.usuario.id, 403, 'Você não tem acesso a este pedido.');
    assert(!['completed', 'cancelled'].includes(order.estado), 400, 'Não é possível reagendar um pedido finalizado.');

    const client = await obterClienteBanco();
    try {
      await client.consultarBanco('BEGIN');
      const { rows } = await client.consultarBanco(`UPDATE pedidos SET agendado_para = $1 WHERE id = $2 RETURNING id, agendado_para`, [
        req.body.agendado_para,
        req.body.pedido_id,
      ]);
      if (!order.agendado_para) {
        await debitarFolhas(client, {
          usuarioId: order.cliente_id,
          pedidoId: order.id,
          tipo: 'order_schedule',
          descricao: 'Débito de Folhas pelo agendamento do pedido',
        });
      }
      await client.consultarBanco('COMMIT');
      res.json({ pedido: rows[0] });
    } catch (err) {
      await client.consultarBanco('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

/** * Anotações manuais da agenda — só o próprio trabalhador vê/mexe nas suas. Não têm nada a ver com pedidos: é o trabalhador organizando o dia dele (uma tarefa, um lembrete), por... */
router.get(
  '/anotacoes',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const [year, mon] = month.split('-').map(Number);
    assert(year && mon, 400, "Parâmetro 'month' deve estar no formato YYYY-MM.");

    const { rows } = await consultarBanco(
      `SELECT id, data_anotacao, titulo, note, criado_em, atualizado_em
       FROM notas_agenda
       WHERE trabalhador_id = $1 AND date_trunc('month', data_anotacao) = make_date($2, $3, 1)
       ORDER BY data_anotacao ASC`,
      [req.usuario.id, year, mon]
    );
    res.json({ anotacoes: rows, month });
  })
);

router.post(
  '/anotacoes',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    exigirCampos(req.body, ['data_anotacao', 'titulo']);
    const titulo = String(req.body.titulo).trim();
    assert(titulo.length > 0 && titulo.length <= 150, 400, 'Título inválido.');

    const { rows } = await consultarBanco(
      `INSERT INTO notas_agenda (trabalhador_id, data_anotacao, titulo, note) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.usuario.id, req.body.data_anotacao, titulo, req.body.note || null]
    );
    res.status(201).json({ note: rows[0] });
  })
);

router.patch(
  '/anotacoes/:id',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const found = await consultarBanco('SELECT * FROM notas_agenda WHERE id = $1', [req.params.id]);
    if (!found.rows[0]) throw new ErroApi(404, 'Anotação não encontrada.');
    assert(found.rows[0].trabalhador_id === req.usuario.id, 403, 'Você só pode editar suas próprias anotações.');

    const titulo = req.body.titulo !== undefined ? String(req.body.titulo).trim() : undefined;
    if (titulo !== undefined) assert(titulo.length > 0 && titulo.length <= 150, 400, 'Título inválido.');

    const { rows } = await consultarBanco(
      `UPDATE notas_agenda SET
         titulo = COALESCE($1, titulo),
         note = COALESCE($2, note),
         data_anotacao = COALESCE($3, data_anotacao),
         atualizado_em = NOW()
       WHERE id = $4 RETURNING *`,
      [titulo, req.body.note, req.body.data_anotacao, req.params.id]
    );
    res.json({ note: rows[0] });
  })
);

router.delete(
  '/anotacoes/:id',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const found = await consultarBanco('SELECT trabalhador_id FROM notas_agenda WHERE id = $1', [req.params.id]);
    if (!found.rows[0]) throw new ErroApi(404, 'Anotação não encontrada.');
    assert(found.rows[0].trabalhador_id === req.usuario.id, 403, 'Você só pode excluir suas próprias anotações.');

    await consultarBanco('DELETE FROM notas_agenda WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  })
);

module.exports = router;
