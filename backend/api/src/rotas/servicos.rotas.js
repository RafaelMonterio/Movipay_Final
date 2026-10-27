const { Router } = require('express');
const { consultarBanco } = require('../banco/conexao');
const { intermediarioAutenticacao } = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const { ErroApi, assert, exigirCampos } = require('../intermediarios/tratamentoErros');

const router = Router();

router.get(
  '/',
  lidarAssincrono(async (req, res) => {
    const { trabalhador_id: workerId, category } = req.query;
    const conditions = ['s.esta_ativo = TRUE'];
    const params = [];
    if (workerId) {
      params.push(workerId);
      conditions.push(`s.trabalhador_id = $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`c.slug = $${params.length}`);
    }
    const { rows } = await consultarBanco(
      `SELECT s.id, s.trabalhador_id, s.categoria_id, s.titulo, s.descricao, s.price, s.tipo_preco, s.criado_em,
              c.nome AS nome_categoria, c.icone AS icone_categoria, c.slug AS categoria_slug,
              u.nome AS nome_trabalhador, u.url_avatar AS url_avatar_trabalhador, u.media_avaliacao AS worker_avg_rating,
              u.esta_disponivel AS worker_is_available
       FROM servicos s
       JOIN usuarios u ON u.id = s.trabalhador_id
       LEFT JOIN categorias c ON c.id = s.categoria_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY s.criado_em DESC`,
      params
    );
    res.json({ servicos: rows });
  })
);

router.get(
  '/:id',
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT s.*, c.nome AS nome_categoria, c.icone AS icone_categoria, c.slug AS categoria_slug
       FROM servicos s LEFT JOIN categorias c ON c.id = s.categoria_id WHERE s.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) throw new ErroApi(404, 'Serviço não encontrado.');
    res.json({ servico: rows[0] });
  })
);

router.post(
  '/',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    assert(req.usuario.modo === 'worker', 403, 'Somente trabalhadores podem cadastrar serviços.');
    exigirCampos(req.body, ['titulo', 'price']);

    let categoryId = req.body.categoria_id || null;
    if (!categoryId) {
      const me = await consultarBanco('SELECT category FROM usuarios WHERE id = $1', [req.usuario.id]);
      if (me.rows[0]?.categoria) {
        const cat = await consultarBanco('SELECT id FROM categorias WHERE slug = $1', [me.rows[0].categoria]);
        categoryId = cat.rows[0]?.id || null;
      }
    }

    const { rows } = await consultarBanco(
      `INSERT INTO servicos (trabalhador_id, categoria_id, titulo, descricao, price, tipo_preco)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6,'fixed')) RETURNING *`,
      [req.usuario.id, categoryId, req.body.titulo, req.body.descricao || null, req.body.price, req.body.tipo_preco]
    );
    res.status(201).json({ servico: rows[0] });
  })
);

router.patch(
  '/:id',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const existing = await consultarBanco('SELECT trabalhador_id FROM servicos WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) throw new ErroApi(404, 'Serviço não encontrado.');
    assert(existing.rows[0].trabalhador_id === req.usuario.id, 403, 'Você só pode editar os próprios serviços.');

    const { rows } = await consultarBanco(
      `UPDATE servicos SET
         titulo       = COALESCE($1, titulo),
         descricao = COALESCE($2, descricao),
         price       = COALESCE($3, price),
         tipo_preco  = COALESCE($4, tipo_preco),
         esta_ativo   = COALESCE($5, esta_ativo),
         atualizado_em  = NOW()
       WHERE id = $6 RETURNING *`,
      [req.body.titulo, req.body.descricao, req.body.price, req.body.tipo_preco, req.body.esta_ativo, req.params.id]
    );
    res.json({ servico: rows[0] });
  })
);

router.delete(
  '/:id',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const existing = await consultarBanco('SELECT trabalhador_id FROM servicos WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) throw new ErroApi(404, 'Serviço não encontrado.');
    assert(existing.rows[0].trabalhador_id === req.usuario.id, 403, 'Você só pode remover os próprios serviços.');
    await consultarBanco('UPDATE servicos SET esta_ativo = FALSE WHERE id = $1', [req.params.id]);
    res.status(204).end();
  })
);

module.exports = router;
