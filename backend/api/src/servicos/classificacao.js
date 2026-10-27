/** * Algoritmo de divulgação / ordenação de profissionais. Regra de ouro: o plano AJUDA, mas não substitui relevância. Categoria e área de atendimento continuam sendo FILTRO (quem... */

// Componente de avaliação: 0 quando não há nota; nota/5 quando há.
const RATING_SQL = `COALESCE(u.media_avaliacao, 0) / 5.0`;

// Proximidade: decai suave com a distância (1 / (1 + km/5)). 0 km → 1.00 | 5 km → 0.50 | 15 km → 0.25
function proximitySql(hasLocation) {
  return hasLocation
    ? `CASE
         WHEN u.lat IS NULL OR u.lng IS NULL THEN 0.35
         ELSE 1.0 / (1.0 + (calcular_distancia($LAT, $LNG, u.lat, u.lng) / 5.0))
       END`
    : `0.5`;
}

const AVAILABILITY_SQL = `CASE WHEN u.esta_disponivel THEN 1.0 ELSE 0.25 END`;

// Perfil completo: cada item presente vale um pedaço da nota.
const COMPLETENESS_SQL = `(
  (CASE WHEN u.url_avatar    IS NOT NULL THEN 0.25 ELSE 0 END) +
  (CASE WHEN u.bio           IS NOT NULL THEN 0.15 ELSE 0 END) +
  (CASE WHEN u.category      IS NOT NULL THEN 0.20 ELSE 0 END) +
  (CASE WHEN u.endereco_id    IS NOT NULL THEN 0.15 ELSE 0 END) +
  (CASE WHEN wp.id           IS NOT NULL THEN 0.25 ELSE 0 END)
)`;

// Atividade recente: publicou Short nos últimos 30 dias / tem pedidos.
const ACTIVITY_SQL = `LEAST(1.0, (
  (SELECT COUNT(*) FROM publicacoes s WHERE s.trabalhador_id = u.id AND s.criado_em > NOW() - INTERVAL '30 days')::numeric * 0.25
  + LEAST(0.5, COALESCE(u.total_pedidos, 0)::numeric * 0.05)
))`;

/** * Monta a expressão SQL da nota final. @param {boolean} hasLocation se a busca informou lat/lng @param {number} latIndex índice do parâmetro $ da latitude @param {number} lngInd... */
function montarSqlPontuacao(hasLocation, latIndex, lngIndex) {
  const proximity = proximitySql(hasLocation)
    .replace('$LAT', `$${latIndex}`)
    .replace('$LNG', `$${lngIndex}`);

  return `(
    0.34 * (${RATING_SQL}) +
    0.28 * (${proximity}) +
    0.14 * (${AVAILABILITY_SQL}) +
    0.14 * (${COMPLETENESS_SQL}) +
    0.10 * (${ACTIVITY_SQL})
  ) * COALESCE(plan.peso_exposicao, 1.00)`;
}

/** JOINs que a expressão acima precisa. */
const JUNTAS_CLASSIFICACAO = `
  LEFT JOIN perfis_trabalhador wp ON wp.usuario_id = u.id
  LEFT JOIN planos_assinatura plan ON plan.slug = u.slug_plano`;

/** Campos extras que o app usa para mostrar o selo do plano. */
const CAMPOS_CLASSIFICACAO = `u.slug_plano, plan.badge_label AS selo_plano,
  COALESCE(plan.peso_exposicao, 1.00) AS plan_weight`;

module.exports = { montarSqlPontuacao, JUNTAS_CLASSIFICACAO, CAMPOS_CLASSIFICACAO };
