const { Router } = require('express');
const jwt = require('jsonwebtoken');
const { consultarBanco, obterClienteBanco } = require('../banco/conexao');
const { intermediarioAutenticacao, SECRET } = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const { ErroApi, assert, exigirCampos } = require('../intermediarios/tratamentoErros');
const { excluirPorUrl } = require('../servicos/armazenamento');

const router = Router();

// Autenticação "opcional": com token válido o feed já vem personalizado (curtido/salvo); sem token, segue funcionando como visitante.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');
  if (!token) return next();
  try {
    req.usuario = jwt.verify(token, SECRET);
  } catch {
    /* token inválido — segue como visitante */
  }
  next();
}

const SHORT_FIELDS = `s.id, s.tipo_midia, s.media_urls, s.url_miniatura, s.duracao_segundos,
  s.caption, s.quantidade_visualizacoes, s.criado_em,
  u.id AS trabalhador_id, u.nome AS nome_trabalhador, u.url_avatar AS url_avatar_trabalhador,
  u.media_avaliacao AS worker_avg_rating, u.esta_disponivel AS worker_is_available,
  u.slug_plano AS worker_plan, plan.badge_label AS worker_plan_badge,
  cat.nome AS nome_categoria, cat.slug AS categoria_slug,
  (SELECT COUNT(*) FROM comentarios_publicacao c WHERE c.publicacao_id = s.id)::int AS quantidade_comentarios,
  (SELECT COUNT(*) FROM curtidas_publicacao l WHERE l.publicacao_id = s.id)::int AS quantidade_curtidas,
  (SELECT COUNT(*) FROM salvos_publicacao sv WHERE sv.publicacao_id = s.id)::int AS quantidade_salvos`;

const SHORT_JOINS = `FROM publicacoes s
  JOIN usuarios u ON u.id = s.trabalhador_id
  LEFT JOIN categorias cat ON cat.slug = u.categoria
  LEFT JOIN planos_assinatura plan ON plan.slug = u.slug_plano`;

/** * GET /api/v1/publicacoes?lat=&lng=&tipo=video|image Feed ordenado por proximidade do trabalhador, com o peso do plano entrando como desempate — do mesmo jeito controlado da busca: o... */
router.get(
  '/',
  optionalAuth,
  lidarAssincrono(async (req, res) => {
    const { lat, lng, tipo } = req.query;
    const params = [req.usuario?.id || null];

    let distanceSelect = 'NULL::float AS distance_km';
    let orderBy = 's.criado_em DESC';

    if (lat && lng) {
      params.push(Number(lat), Number(lng));
      distanceSelect = `calcular_distancia($2, $3, u.lat, u.lng) AS distance_km`;
      // Nota do feed: proximidade pesa mais que o plano, e a recência desempata. Sem localização, volta a ser cronológico puro.
      orderBy = `(
        (1.0 / (1.0 + COALESCE(calcular_distancia($2, $3, u.lat, u.lng), 50) / 5.0))
        * COALESCE(plan.peso_exposicao, 1.00)
      ) DESC, s.criado_em DESC`;
    }

    const conditions = [];
    if (tipo === 'video' || tipo === 'image') {
      params.push(tipo === 'video' ? ['video'] : ['image', 'carousel']);
      conditions.push(`s.tipo_midia = ANY($${params.length})`);
    }

    const { rows } = await consultarBanco(
      `SELECT ${SHORT_FIELDS}, ${distanceSelect},
         EXISTS(SELECT 1 FROM curtidas_publicacao l WHERE l.publicacao_id = s.id AND l.usuario_id = $1) AS foi_curtido,
         EXISTS(SELECT 1 FROM salvos_publicacao sv WHERE sv.publicacao_id = s.id AND sv.usuario_id = $1) AS foi_salvo
       ${SHORT_JOINS}
       ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
       ORDER BY ${orderBy}`,
      params
    );

    res.json({ publicacoes: rows });
  })
);

/** GET /api/v1/publicacoes/meus — publicações do próprio trabalhador ("Meus trabalhos"). */
router.get(
  '/meus',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT ${SHORT_FIELDS},
         EXISTS(SELECT 1 FROM curtidas_publicacao l WHERE l.publicacao_id = s.id AND l.usuario_id = $1) AS foi_curtido,
         EXISTS(SELECT 1 FROM salvos_publicacao sv WHERE sv.publicacao_id = s.id AND sv.usuario_id = $1) AS foi_salvo
       ${SHORT_JOINS}
       WHERE s.trabalhador_id = $1
       ORDER BY s.criado_em DESC`,
      [req.usuario.id]
    );

    const totals = rows.reduce(
      (acc, r) => ({
        publicacoes: acc.publicacoes + 1,
        views: acc.views + Number(r.quantidade_visualizacoes || 0),
        likes: acc.likes + Number(r.quantidade_curtidas || 0),
        comentarios: acc.comentarios + Number(r.quantidade_comentarios || 0),
        saves: acc.saves + Number(r.quantidade_salvos || 0),
      }),
      { publicacoes: 0, views: 0, likes: 0, comentarios: 0, saves: 0 }
    );

    res.json({ publicacoes: rows, totals });
  })
);

/** GET /api/v1/publicacoes/worker/:workerId — publicações de um trabalhador (perfil público). */
router.get(
  '/worker/:workerId',
  optionalAuth,
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT ${SHORT_FIELDS},
         EXISTS(SELECT 1 FROM curtidas_publicacao l WHERE l.publicacao_id = s.id AND l.usuario_id = $1) AS foi_curtido,
         EXISTS(SELECT 1 FROM salvos_publicacao sv WHERE sv.publicacao_id = s.id AND sv.usuario_id = $1) AS foi_salvo
       ${SHORT_JOINS}
       WHERE s.trabalhador_id = $2
       ORDER BY s.criado_em DESC`,
      [req.usuario?.id || null, req.params.workerId]
    );
    res.json({ publicacoes: rows });
  })
);

router.get(
  '/salvos',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT ${SHORT_FIELDS}, TRUE AS foi_salvo,
         EXISTS(SELECT 1 FROM curtidas_publicacao l WHERE l.publicacao_id = s.id AND l.usuario_id = $1) AS foi_curtido
       FROM salvos_publicacao sv
       JOIN publicacoes s ON s.id = sv.publicacao_id
       JOIN usuarios u ON u.id = s.trabalhador_id
       LEFT JOIN categorias cat ON cat.slug = u.categoria
       LEFT JOIN planos_assinatura plan ON plan.slug = u.slug_plano
       WHERE sv.usuario_id = $1
       ORDER BY sv.criado_em DESC`,
      [req.usuario.id]
    );
    res.json({ publicacoes: rows });
  })
);

/** * POST /api/v1/publicacoes Publicação real de FOTO ou VÍDEO. O fluxo correto é: o app manda o arquivo em `POST /api/v1/midia` (multipart) e recebe URLs; depois chama esta rota com es... */
router.post(
  '/',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const me = await consultarBanco('SELECT eh_trabalhador FROM usuarios WHERE id = $1', [req.usuario.id]);
    assert(me.rows[0]?.eh_trabalhador, 403, 'Somente trabalhadores podem publicar Shorts.');

    exigirCampos(req.body, ['media_urls']);
    const mediaUrls = (Array.isArray(req.body.media_urls) ? req.body.media_urls : [req.body.media_urls])
      .map((u) => String(u).trim())
      .filter(Boolean);
    assert(mediaUrls.length > 0, 400, 'Envie ao menos uma foto ou vídeo.');
    assert(mediaUrls.length <= 5, 400, 'Máximo de 5 arquivos por publicação.');

    // O tipo real vem do banco (arquivos_midia), não do corpo da requisição.
    const registered = await consultarBanco(
      `SELECT url_publica, kind FROM arquivos_midia WHERE url_publica = ANY($1) AND dono_id = $2`,
      [mediaUrls, req.usuario.id]
    );
    const kindByUrl = new Map(registered.rows.map((r) => [r.url_publica, r.kind]));

    // Qualquer URL enviada precisa ser: um arquivo que o próprio usuário subiu OU um data: base64 (legado). Isso impede alguém publicar usando o arquivo...
    for (const url of mediaUrls) {
      const isOwnUpload = kindByUrl.has(url);
      const isInline = url.startsWith('data:');
      assert(isOwnUpload || isInline, 400, 'Arquivo inválido — reenvie a mídia antes de publicar.');
    }

    const hasVideo = mediaUrls.some(
      (url) => kindByUrl.get(url) === 'video' || /^data:video\//i.test(url)
    );

    let mediaType;
    if (hasVideo) {
      assert(mediaUrls.length === 1, 400, 'Publique um vídeo por vez.');
      mediaType = 'video';
    } else {
      mediaType = mediaUrls.length > 1 ? 'carousel' : 'image';
    }

    const conn = await obterClienteBanco();
    let shortId;
    try {
      await conn.consultarBanco('BEGIN');
      const ins = await conn.consultarBanco(
        `INSERT INTO publicacoes (trabalhador_id, tipo_midia, media_urls, caption, url_miniatura, duracao_segundos)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [
          req.usuario.id,
          mediaType,
          mediaUrls,
          req.body.caption ? String(req.body.caption).trim().slice(0, 1000) : null,
          req.body.url_miniatura || null,
          req.body.duracao_segundos ? Number(req.body.duracao_segundos) : null,
        ]
      );
      shortId = ins.rows[0].id;

      // Vincula os arquivos à publicação para poder apagá-los depois.
      const ids = await conn.consultarBanco(
        `SELECT id, url_publica FROM arquivos_midia WHERE url_publica = ANY($1) AND dono_id = $2`,
        [mediaUrls, req.usuario.id]
      );
      for (const row of ids.rows) {
        await conn.consultarBanco(
          `INSERT INTO midia_publicacao (publicacao_id, media_id, position) VALUES ($1,$2,$3)
           ON CONFLICT DO NOTHING`,
          [shortId, row.id, mediaUrls.indexOf(row.url_publica)]
        );
      }
      await conn.consultarBanco('COMMIT');
    } catch (err) {
      await conn.consultarBanco('ROLLBACK');
      throw err;
    } finally {
      conn.release();
    }

    const { rows } = await consultarBanco(`SELECT ${SHORT_FIELDS} ${SHORT_JOINS} WHERE s.id = $1`, [shortId]);
    res.status(201).json({ publicacao: rows[0] });
  })
);

/** * DELETE /api/v1/publicacoes/:id Só o DONO apaga. A checagem é no backend (`WHERE trabalhador_id = $2`), não no app — então uma requisição manipulada tentando apagar a publicação de outra... */
router.delete(
  '/:id',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const found = await consultarBanco('SELECT id, trabalhador_id, media_urls, url_miniatura FROM publicacoes WHERE id = $1', [
      req.params.id,
    ]);
    const short = found.rows[0];
    if (!short) throw new ErroApi(404, 'Publicação não encontrada.');
    assert(short.trabalhador_id === req.usuario.id, 403, 'Você só pode excluir as suas próprias publicações.');

    const urls = [...(short.media_urls || []), short.url_miniatura].filter(Boolean);

    await consultarBanco('DELETE FROM publicacoes WHERE id = $1 AND trabalhador_id = $2', [req.params.id, req.usuario.id]);

    // Depois de remover a linha, tira os arquivos do disco (se algum falhar, a exclusão lógica já aconteceu — nada de publicação órfã).
    const removedFiles = [];
    for (const url of urls) {
      const ok = await excluirPorUrl(url, req.usuario.id);
      if (ok) removedFiles.push(url);
    }

    res.json({ deleted: true, id: Number(req.params.id), removedFiles: removedFiles.length });
  })
);

/** GET /api/v1/publicacoes/:id — detalhe de uma publicação. */
router.get(
  '/:id',
  optionalAuth,
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT ${SHORT_FIELDS},
         EXISTS(SELECT 1 FROM curtidas_publicacao l WHERE l.publicacao_id = s.id AND l.usuario_id = $1) AS foi_curtido,
         EXISTS(SELECT 1 FROM salvos_publicacao sv WHERE sv.publicacao_id = s.id AND sv.usuario_id = $1) AS foi_salvo
       ${SHORT_JOINS} WHERE s.id = $2`,
      [req.usuario?.id || null, req.params.id]
    );
    if (!rows[0]) throw new ErroApi(404, 'Publicação não encontrada.');
    res.json({ publicacao: rows[0], isOwner: req.usuario?.id === rows[0].trabalhador_id });
  })
);

/** * POST /api/v1/publicacoes/:id/visualizacao — registra uma visualização. Uma por usuário logado (UNIQUE), então rolar o feed de novo não infla o número. O dono não conta view no próprio Short. */
router.post(
  '/:id/visualizacao',
  optionalAuth,
  lidarAssincrono(async (req, res) => {
    const found = await consultarBanco('SELECT trabalhador_id, quantidade_visualizacoes FROM publicacoes WHERE id = $1', [req.params.id]);
    if (!found.rows[0]) throw new ErroApi(404, 'Publicação não encontrada.');

    if (req.usuario?.id && req.usuario.id !== found.rows[0].trabalhador_id) {
      await consultarBanco('INSERT INTO visualizacoes_publicacao (publicacao_id, usuario_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [
        req.params.id,
        req.usuario.id,
      ]);
    }
    const fresh = await consultarBanco('SELECT quantidade_visualizacoes FROM publicacoes WHERE id = $1', [req.params.id]);
    res.json({ viewsCount: fresh.rows[0]?.quantidade_visualizacoes ?? 0 });
  })
);

router.get(
  '/:id/comentarios',
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT c.id, c.conteudo, c.criado_em, u.id AS usuario_id, u.nome, u.url_avatar
       FROM comentarios_publicacao c JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.publicacao_id = $1 ORDER BY c.criado_em ASC`,
      [req.params.id]
    );
    res.json({ comentarios: rows });
  })
);

router.post(
  '/:id/comentarios',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    exigirCampos(req.body, ['conteudo']);
    const conteudo = String(req.body.conteudo).trim();
    assert(conteudo.length > 0, 400, 'O comentário não pode ficar vazio.');
    assert(conteudo.length <= 1000, 400, 'Comentário muito longo.');

    const short = await consultarBanco('SELECT id FROM publicacoes WHERE id = $1', [req.params.id]);
    if (!short.rows[0]) throw new ErroApi(404, 'Publicação não encontrada.');

    const { rows } = await consultarBanco(
      `INSERT INTO comentarios_publicacao (publicacao_id, usuario_id, conteudo) VALUES ($1,$2,$3)
       RETURNING id, conteudo, criado_em`,
      [req.params.id, req.usuario.id, conteudo]
    );
    const me = await consultarBanco('SELECT nome, url_avatar FROM usuarios WHERE id = $1', [req.usuario.id]);
    res.status(201).json({ comentario: { ...rows[0], usuario_id: req.usuario.id, ...me.rows[0] } });
  })
);

/** O autor do comentário OU o dono da publicação podem remover. */
router.delete(
  '/:id/comentarios/:commentId',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT c.id, c.usuario_id, s.trabalhador_id
       FROM comentarios_publicacao c JOIN publicacoes s ON s.id = c.publicacao_id
       WHERE c.id = $1 AND c.publicacao_id = $2`,
      [req.params.commentId, req.params.id]
    );
    const comment = rows[0];
    if (!comment) throw new ErroApi(404, 'Comentário não encontrado.');
    assert(
      comment.usuario_id === req.usuario.id || comment.trabalhador_id === req.usuario.id,
      403,
      'Você não pode remover este comentário.'
    );
    await consultarBanco('DELETE FROM comentarios_publicacao WHERE id = $1', [req.params.commentId]);
    res.json({ deleted: true });
  })
);

router.post(
  '/:id/curtir',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const short = await consultarBanco('SELECT id FROM publicacoes WHERE id = $1', [req.params.id]);
    if (!short.rows[0]) throw new ErroApi(404, 'Publicação não encontrada.');
    await consultarBanco('INSERT INTO curtidas_publicacao (publicacao_id, usuario_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [
      req.params.id,
      req.usuario.id,
    ]);
    const count = await consultarBanco('SELECT COUNT(*)::int AS n FROM curtidas_publicacao WHERE publicacao_id = $1', [req.params.id]);
    res.status(201).json({ liked: true, likesCount: count.rows[0].n });
  })
);

router.delete(
  '/:id/curtir',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    await consultarBanco('DELETE FROM curtidas_publicacao WHERE publicacao_id = $1 AND usuario_id = $2', [req.params.id, req.usuario.id]);
    const count = await consultarBanco('SELECT COUNT(*)::int AS n FROM curtidas_publicacao WHERE publicacao_id = $1', [req.params.id]);
    res.json({ liked: false, likesCount: count.rows[0].n });
  })
);

router.post(
  '/:id/salvar',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const short = await consultarBanco('SELECT id FROM publicacoes WHERE id = $1', [req.params.id]);
    if (!short.rows[0]) throw new ErroApi(404, 'Publicação não encontrada.');
    await consultarBanco('INSERT INTO salvos_publicacao (publicacao_id, usuario_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [
      req.params.id,
      req.usuario.id,
    ]);
    res.status(201).json({ saved: true });
  })
);

router.delete(
  '/:id/salvar',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    await consultarBanco('DELETE FROM salvos_publicacao WHERE publicacao_id = $1 AND usuario_id = $2', [req.params.id, req.usuario.id]);
    res.json({ saved: false });
  })
);

module.exports = router;
