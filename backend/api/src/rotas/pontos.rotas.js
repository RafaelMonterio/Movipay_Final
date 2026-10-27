const { Router } = require('express');
const { consultarBanco } = require('../banco/conexao');
const { intermediarioAutenticacao } = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const { obterInformacoesNivel } = require('../utilitarios/niveis');

const router = Router();
const balanceHandler = lidarAssincrono(async (req, res) => {
  const { rows } = await consultarBanco('SELECT pontos FROM usuarios WHERE id = $1', [req.usuario.id]);
  if (!rows[0]) return res.status(404).json({ error: { mensagem: 'Usuário não encontrado.' } });
  const pontos = Number(rows[0].pontos || 0);
  res.json({ pontos, points: pontos, folhas: pontos, balance: pontos, saldo: pontos, levelInfo: obterInformacoesNivel(pontos) });
});

router.get(
  '/balance',
  intermediarioAutenticacao,
  balanceHandler
);
router.get('/saldo', intermediarioAutenticacao, balanceHandler);

router.get(
  '/historico',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = 20;
    const { rows } = await consultarBanco(
      `SELECT id, pedido_id, pedido_id AS order_id, tipo, tipo AS type,
              quantidade, quantidade AS amount, quantidade AS points,
              descricao, criado_em, criado_em AS created_at
       FROM historico_pontos WHERE usuario_id = $1
       ORDER BY criado_em DESC LIMIT $2 OFFSET $3`,
      [req.usuario.id, pageSize, (page - 1) * pageSize]
    );
    res.json({ historico: rows, transactions: rows, transacoes: rows, page });
  })
);

module.exports = router;
