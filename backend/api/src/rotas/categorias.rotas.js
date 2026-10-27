const { Router } = require('express');
const { consultarBanco } = require('../banco/conexao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');

const router = Router();

// GET /api/v1/categorias — não existia no backend original; o app mobile precisa dela para preencher seletor de categoria no cadastro, filtros de bus...
router.get(
  '/',
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT id, nome, slug, icone, descricao
       FROM categorias WHERE esta_ativo = TRUE ORDER BY nome`
    );
    res.json({ categorias: rows });
  })
);

module.exports = router;
