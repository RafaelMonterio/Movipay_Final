const { Router } = require('express');
const { consultarBanco } = require('../banco/conexao');
const { intermediarioAutenticacao } = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const { exigirCampos } = require('../intermediarios/tratamentoErros');

const router = Router();

router.get(
  '/',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT f.trabalhador_id, u.nome, u.url_avatar, u.categoria, u.media_avaliacao, u.esta_disponivel,
              cat.nome AS nome_categoria, cat.icone AS icone_categoria
       FROM favoritos f
       JOIN usuarios u ON u.id = f.trabalhador_id
       LEFT JOIN categorias cat ON cat.slug = u.categoria
       WHERE f.cliente_id = $1
       ORDER BY f.criado_em DESC`,
      [req.usuario.id]
    );
    res.json({ favoritos: rows });
  })
);

router.post(
  '/',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    exigirCampos(req.body, ['trabalhador_id']);
    await consultarBanco(
      `INSERT INTO favoritos (cliente_id, trabalhador_id) VALUES ($1,$2) ON CONFLICT (cliente_id, trabalhador_id) DO NOTHING`,
      [req.usuario.id, req.body.trabalhador_id]
    );
    res.status(201).json({ ok: true });
  })
);

router.delete(
  '/:workerId',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    await consultarBanco('DELETE FROM favoritos WHERE cliente_id = $1 AND trabalhador_id = $2', [req.usuario.id, req.params.workerId]);
    res.status(204).end();
  })
);

module.exports = router;
