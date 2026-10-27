const { Router } = require('express');
const { consultarBanco, grupoConexoes } = require('../banco/conexao');
const { intermediarioAutenticacao } = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const { ErroApi, assert, exigirCampos } = require('../intermediarios/tratamentoErros');
const { montarSqlPontuacao, JUNTAS_CLASSIFICACAO, CAMPOS_CLASSIFICACAO } = require('../servicos/classificacao');

const router = Router();

const WORKER_FIELDS = `u.id, u.nome, u.url_avatar, u.bio, u.cidade, u.bairro, u.lat, u.lng,
  u.categoria, u.esta_disponivel, u.eh_verificado, u.media_avaliacao, u.total_pedidos, u.total_avaliacoes,
  u.media_tempo_resposta, u.pontos, u.numero_endereco, wa.rua AS address_street,
  cat.nome AS nome_categoria, cat.slug AS categoria_slug, cat.icone AS icone_categoria`;
const WORKER_ADDRESS_JOIN = `LEFT JOIN enderecos wa ON wa.id = u.endereco_id`;

// GET /api/v1/trabalhadores?category=slug&q=texto&lat=&lng=&radiusKm=&cidade= O backend original travava a cidade em "Ribeirão Pires" — aqui isso vira filtro...
router.get(
  '/',
  lidarAssincrono(async (req, res) => {
    const { categoria: category, q, lat, lng, radiusKm, cidade, specialty, modality } = req.query;
    // `eh_trabalhador` substitui o antigo `modo = 'worker'`: com contas híbridas, o modo é só a tela ativa — quem tem perfil profissional precisa aparecer na...
    const conditions = [`u.eh_trabalhador = TRUE`, `u.esta_ativo = TRUE`];
    const params = [];

    if (cidade) {
      params.push(cidade);
      conditions.push(`(LOWER(u.cidade) = LOWER($${params.length}) OR EXISTS (
        SELECT 1 FROM areas_atendimento wsa
        WHERE wsa.usuario_id = u.id AND LOWER(wsa.cidade) = LOWER($${params.length})))`);
    }
    if (category) {
      params.push(category);
      conditions.push(`cat.slug = $${params.length}`);
    }
    if (modality) {
      params.push(modality);
      conditions.push(`(wp.modality = $${params.length} OR wp.modality = 'both')`);
    }
    if (specialty) {
      params.push(`%${specialty}%`);
      conditions.push(`wp.specialty ILIKE $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(u.nome ILIKE $${params.length} OR cat.nome ILIKE $${params.length}
        OR wp.specialty ILIKE $${params.length} OR wp.descricao ILIKE $${params.length})`);
    }

    const hasLocation = Boolean(lat && lng);
    let distanceSelect = 'NULL::float AS distance_km';
    let latIdx = 0;
    let lngIdx = 0;
    if (hasLocation) {
      params.push(Number(lat), Number(lng));
      latIdx = params.length - 1;
      lngIdx = params.length;
      distanceSelect = `calcular_distancia($${latIdx}, $${lngIdx}, u.lat, u.lng) AS distance_km`;
    }

    const scoreSql = montarSqlPontuacao(hasLocation, latIdx, lngIdx);

    const { rows } = await consultarBanco(
      `SELECT ${WORKER_FIELDS}, ${CAMPOS_CLASSIFICACAO}, ${distanceSelect},
              wp.specialty, wp.preco_minimo, wp.preco_max, wp.tipo_preco, wp.modality,
              ROUND((${scoreSql})::numeric, 4) AS _score
       FROM usuarios u
       LEFT JOIN categorias cat ON cat.slug = u.categoria
       ${WORKER_ADDRESS_JOIN}
       ${JUNTAS_CLASSIFICACAO}
       WHERE ${conditions.join(' AND ')}
       ORDER BY (${scoreSql}) DESC, u.media_avaliacao DESC NULLS LAST, u.id`,
      params
    );

    let workers = rows;
    if (hasLocation && radiusKm) {
      workers = workers.filter((w) => w.distance_km === null || w.distance_km <= Number(radiusKm));
    }

    res.json({ trabalhadores: workers, ranking: { usesPlanWeight: true, maxPlanWeight: 2.0 } });
  })
);

router.get(
  '/:id',
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT ${WORKER_FIELDS}, ${CAMPOS_CLASSIFICACAO},
              wp.specialty, wp.descricao AS descricao_trabalhador, wp.experience,
              wp.preco_minimo, wp.preco_max, wp.tipo_preco, wp.modality, wp.area_servico,
              wp.dias_disponibilidade, wp.hora_inicio, wp.hora_fim
       FROM usuarios u
       LEFT JOIN categorias cat ON cat.slug = u.categoria
       ${WORKER_ADDRESS_JOIN}
       ${JUNTAS_CLASSIFICACAO}
       WHERE u.id = $1 AND u.eh_trabalhador = TRUE`,
      [req.params.id]
    );
    if (!rows[0]) throw new ErroApi(404, 'Trabalhador não encontrado.');

    const [servicos, portfolio, slots, avaliacoes, publicacoes, areas] = await Promise.all([
      consultarBanco(
        `SELECT s.id, s.titulo, s.descricao, s.price, s.tipo_preco, c.nome AS nome_categoria, c.icone AS icone_categoria
         FROM servicos s LEFT JOIN categorias c ON c.id = s.categoria_id
         WHERE s.trabalhador_id = $1 AND s.esta_ativo = TRUE ORDER BY s.criado_em DESC`,
        [req.params.id]
      ),
      consultarBanco(`SELECT id, url, caption FROM fotos_portfolio WHERE trabalhador_id = $1 ORDER BY criado_em DESC`, [
        req.params.id,
      ]),
      consultarBanco(`SELECT id, weekday, hora_inicio, hora_fim FROM horarios_disponibilidade WHERE trabalhador_id = $1 ORDER BY weekday, hora_inicio`, [
        req.params.id,
      ]),
      consultarBanco(
        `SELECT r.id, r.rating, r.comentario, r.criado_em, u.nome AS nome_avaliador, u.url_avatar AS url_avatar_avaliador
         FROM avaliacoes r JOIN usuarios u ON u.id = r.avaliador_id
         WHERE r.avaliado_id = $1 AND r.eh_publico = TRUE ORDER BY r.criado_em DESC LIMIT 30`,
        [req.params.id]
      ),
      // Publicações do trabalhador, para o perfil aberto pelos Shorts mostrar o restante do trabalho dele.
      consultarBanco(
        `SELECT id, tipo_midia, media_urls, url_miniatura, caption, quantidade_visualizacoes, criado_em,
                (SELECT COUNT(*) FROM curtidas_publicacao l WHERE l.publicacao_id = publicacoes.id)::int AS quantidade_curtidas,
                (SELECT COUNT(*) FROM comentarios_publicacao c WHERE c.publicacao_id = publicacoes.id)::int AS quantidade_comentarios
         FROM publicacoes WHERE trabalhador_id = $1 ORDER BY criado_em DESC LIMIT 24`,
        [req.params.id]
      ),
      consultarBanco(`SELECT cidade, regiao FROM areas_atendimento WHERE usuario_id = $1 ORDER BY cidade`, [req.params.id]),
    ]);

    res.json({
      trabalhador: rows[0],
      servicos: servicos.rows,
      portfolio: portfolio.rows,
      slots: slots.rows,
      avaliacoes: avaliacoes.rows,
      publicacoes: publicacoes.rows,
      serviceAreas: areas.rows,
    });
  })
);

router.get(
  '/:id/horarios',
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT id, weekday, hora_inicio, hora_fim FROM horarios_disponibilidade WHERE trabalhador_id = $1 ORDER BY weekday, hora_inicio`,
      [req.params.id]
    );
    res.json({ slots: rows });
  })
);

function assertSelf(req) {
  assert(req.usuario.id === parseInt(req.params.id, 10), 403, 'Você só pode gerenciar o seu próprio perfil.');
}

router.patch(
  '/:id/disponibilidade',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    assertSelf(req);
    const { rows } = await consultarBanco(`UPDATE usuarios SET esta_disponivel = $1 WHERE id = $2 RETURNING id, esta_disponivel`, [
      !!req.body.esta_disponivel,
      req.usuario.id,
    ]);
    res.json({ trabalhador: rows[0] });
  })
);

router.post(
  '/:id/portfolio',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    assertSelf(req);
    exigirCampos(req.body, ['url']);
    const { rows } = await consultarBanco(
      `INSERT INTO fotos_portfolio (trabalhador_id, url, caption) VALUES ($1,$2,$3) RETURNING id, url, caption, criado_em`,
      [req.usuario.id, req.body.url, req.body.caption || null]
    );
    res.status(201).json({ photo: rows[0] });
  })
);

router.delete(
  '/:id/portfolio/:photoId',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    assertSelf(req);
    await consultarBanco('DELETE FROM fotos_portfolio WHERE id = $1 AND trabalhador_id = $2', [req.params.photoId, req.usuario.id]);
    res.status(204).end();
  })
);

// Não existia no backend original (só havia leitura) — necessária para a tela de Calendário/Agenda, onde o trabalhador configura a própria grade.
router.put(
  '/:id/horarios',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    assertSelf(req);
    const { slots } = req.body;
    assert(Array.isArray(slots), 400, "'slots' deve ser uma lista de { weekday, hora_inicio, hora_fim }.");

    const conn = await grupoConexoes.connect();
    try {
      await conn.consultarBanco('BEGIN');
      await conn.consultarBanco('DELETE FROM horarios_disponibilidade WHERE trabalhador_id = $1', [req.usuario.id]);
      for (const slot of slots) {
        await conn.consultarBanco(
          `INSERT INTO horarios_disponibilidade (trabalhador_id, weekday, hora_inicio, hora_fim) VALUES ($1,$2,$3,$4)`,
          [req.usuario.id, slot.weekday, slot.hora_inicio, slot.hora_fim]
        );
      }
      await conn.consultarBanco('COMMIT');
    } catch (err) {
      await conn.consultarBanco('ROLLBACK');
      throw err;
    } finally {
      conn.release();
    }

    const { rows } = await consultarBanco(
      `SELECT id, weekday, hora_inicio, hora_fim FROM horarios_disponibilidade WHERE trabalhador_id = $1 ORDER BY weekday, hora_inicio`,
      [req.usuario.id]
    );
    res.json({ slots: rows });
  })
);

module.exports = router;
