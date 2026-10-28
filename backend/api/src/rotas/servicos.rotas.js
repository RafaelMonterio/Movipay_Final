const { Router } = require('express');
const { consultarBanco } = require('../banco/conexao');
const {
  intermediarioAutenticacao,
} = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const {
  ErroApi,
  assert,
  exigirCampos,
} = require('../intermediarios/tratamentoErros');

const router = Router();

/**
 * Lista os serviços ativos.
 *
 * GET /api/v1/servicos
 */
router.get(
  '/',
  lidarAssincrono(async (req, res) => {
    const {
      trabalhador_id: trabalhadorId,
      category,
    } = req.query;

    const condicoes = ['s.esta_ativo = TRUE'];
    const parametros = [];

    if (trabalhadorId) {
      parametros.push(trabalhadorId);
      condicoes.push(
        `s.trabalhador_id = $${parametros.length}`
      );
    }

    if (category) {
      parametros.push(category);
      condicoes.push(
        `c.slug = $${parametros.length}`
      );
    }

    const { rows } = await consultarBanco(
      `SELECT
         s.id,
         s.trabalhador_id,
         s.categoria_id,
         s.titulo,
         s.descricao,
         s.price,
         s.tipo_preco,
         s.esta_ativo,
         s.criado_em,
         s.atualizado_em,
         c.nome AS nome_categoria,
         c.icone AS icone_categoria,
         c.slug AS categoria_slug,
         u.nome AS nome_trabalhador,
         u.url_avatar AS url_avatar_trabalhador,
         u.media_avaliacao AS media_avaliacao_trabalhador,
         u.esta_disponivel AS trabalhador_disponivel
       FROM servicos s
       JOIN usuarios u
         ON u.id = s.trabalhador_id
       LEFT JOIN categorias c
         ON c.id = s.categoria_id
       WHERE ${condicoes.join(' AND ')}
       ORDER BY s.criado_em DESC`,
      parametros
    );

    return res.json({
      servicos: rows,
    });
  })
);

/**
 * Busca um serviço pelo ID.
 *
 * GET /api/v1/servicos/:id
 */
router.get(
  '/:id',
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT
         s.*,
         c.nome AS nome_categoria,
         c.icone AS icone_categoria,
         c.slug AS categoria_slug
       FROM servicos s
       LEFT JOIN categorias c
         ON c.id = s.categoria_id
       WHERE s.id = $1`,
      [req.params.id]
    );

    if (!rows[0]) {
      throw new ErroApi(
        404,
        'Serviço não encontrado.'
      );
    }

    return res.json({
      servico: rows[0],
    });
  })
);

/**
 * Cria um serviço.
 *
 * POST /api/v1/servicos
 */
router.post(
  '/',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    if (!req.usuario) {
      throw new ErroApi(
        401,
        'Usuário não autenticado.'
      );
    }

    assert(
      req.usuario.modo === 'worker',
      403,
      'Somente trabalhadores podem cadastrar serviços.'
    );

    exigirCampos(req.body, [
      'titulo',
      'price',
    ]);

const categoriaId = req.body.categoria_id || null;


    const { rows } = await consultarBanco(
      `INSERT INTO servicos (
         trabalhador_id,
         categoria_id,
         titulo,
         descricao,
         price,
         tipo_preco
       )
       VALUES (
         $1,
         $2,
         $3,
         $4,
         $5,
         COALESCE($6, 'fixed')
       )
       RETURNING *`,
      [
        req.usuario.id,
        categoriaId,
        req.body.titulo,
        req.body.descricao || null,
        req.body.price,
        req.body.tipo_preco,
      ]
    );

    return res.status(201).json({
      servico: rows[0],
    });
  })
);

/**
 * Atualiza um serviço pertencente ao trabalhador autenticado.
 *
 * PATCH /api/v1/servicos/:id
 */
router.patch(
  '/:id',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    if (!req.usuario) {
      throw new ErroApi(
        401,
        'Usuário não autenticado.'
      );
    }

    const existente = await consultarBanco(
      `SELECT trabalhador_id
       FROM servicos
       WHERE id = $1`,
      [req.params.id]
    );

    if (!existente.rows[0]) {
      throw new ErroApi(
        404,
        'Serviço não encontrado.'
      );
    }

    assert(
      Number(existente.rows[0].trabalhador_id) ===
        Number(req.usuario.id),
      403,
      'Você só pode editar os próprios serviços.'
    );

    const { rows } = await consultarBanco(
      `UPDATE servicos
       SET
         titulo = COALESCE($1, titulo),
         descricao = COALESCE($2, descricao),
         price = COALESCE($3, price),
         tipo_preco = COALESCE($4, tipo_preco),
         esta_ativo = COALESCE($5, esta_ativo),
         atualizado_em = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        req.body.titulo,
        req.body.descricao,
        req.body.price,
        req.body.tipo_preco,
        req.body.esta_ativo,
        req.params.id,
      ]
    );

    return res.json({
      servico: rows[0],
    });
  })
);

/**
 * Exclui logicamente um serviço.
 *
 * DELETE /api/v1/servicos/:id
 */
router.delete(
  '/:id',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    if (!req.usuario) {
      throw new ErroApi(
        401,
        'Usuário não autenticado.'
      );
    }

    const existente = await consultarBanco(
      `SELECT trabalhador_id
       FROM servicos
       WHERE id = $1`,
      [req.params.id]
    );

    if (!existente.rows[0]) {
      throw new ErroApi(
        404,
        'Serviço não encontrado.'
      );
    }

    assert(
      Number(existente.rows[0].trabalhador_id) ===
        Number(req.usuario.id),
      403,
      'Você só pode remover os próprios serviços.'
    );

    await consultarBanco(
      `UPDATE servicos
       SET esta_ativo = FALSE
       WHERE id = $1`,
      [req.params.id]
    );

    return res.status(204).end();
  })
);

module.exports = router;
