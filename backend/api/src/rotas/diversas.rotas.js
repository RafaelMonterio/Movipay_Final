const { Router } = require('express');
const { consultarBanco } = require('../banco/conexao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');

const router = Router();

// GET /api/v1/atividade/recent — feed leve de atividade real da plataforma (pedidos concluídos recentes, sem expor nomes completos), usado na Home do...
router.get(
  '/recent',
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT o.concluido_em, cu.bairro AS bairro_cliente, cat.nome AS nome_categoria, cat.icone AS icone_categoria
       FROM pedidos o
       JOIN usuarios cu ON cu.id = o.cliente_id
       LEFT JOIN servicos s ON s.id = o.servico_id
       LEFT JOIN categorias cat ON cat.id = s.categoria_id
       WHERE o.estado = 'completed'
       ORDER BY o.concluido_em DESC LIMIT 10`
    );
    res.json({ atividade: rows });
  })
);

module.exports = router;
