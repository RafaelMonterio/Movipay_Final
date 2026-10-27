const { Router } = require('express');
const { consultarBanco } = require('../banco/conexao');
const { intermediarioAutenticacao } = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');

const router = Router();

router.get('/', intermediarioAutenticacao, lidarAssincrono(async (req, res) => {
  const meses = Math.min(24, Math.max(1, Number(req.query.months) || 6));
  const { rows } = await consultarBanco(
    `SELECT to_char(date_trunc('month', COALESCE(st.liberado_em, st.criado_em)), 'YYYY-MM') AS mes,
            COALESCE(SUM(st.valor_bruto), 0) AS bruto,
            COALESCE(SUM(st.taxa_plataforma), 0) AS taxas,
            COALESCE(SUM(st.valor_liquido), 0) AS liquido,
            COUNT(*)::int AS quantidade
       FROM transacoes_servico st
      WHERE st.trabalhador_id = $1
        AND st.estado IN ('paid', 'released')
        AND COALESCE(st.liberado_em, st.criado_em) >= date_trunc('month', NOW()) - (($2 - 1) * INTERVAL '1 month')
      GROUP BY date_trunc('month', COALESCE(st.liberado_em, st.criado_em))
      ORDER BY date_trunc('month', COALESCE(st.liberado_em, st.criado_em)) ASC`,
    [req.usuario.id, meses]
  );
  const normalizados = rows.map(item => ({
    mes: item.mes,
    bruto: Number(item.bruto || 0),
    taxas: Number(item.taxas || 0),
    liquido: Number(item.liquido || 0),
    quantidade: Number(item.quantidade || 0),
    month: item.mes,
    gross: Number(item.bruto || 0),
    fees: Number(item.taxas || 0),
    net: Number(item.liquido || 0),
  }));
  res.json({ meses: normalizados, months: normalizados, ganhos: normalizados, earnings: normalizados });
}));

module.exports = router;
