const { Router } = require('express');
const { consultarBanco } = require('../banco/conexao');
const { intermediarioAutenticacao } = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const { ErroApi, assert } = require('../intermediarios/tratamentoErros');
const { serializarUsuario, buscarUsuario } = require('../servicos/visaoUsuario');
const { normalizarTelefone } = require('../servicos/cadastro');
const { excluirPorUrl } = require('../servicos/armazenamento');

const router = Router();

/** * GET /api/v1/usuarios/:id Quando é o PRÓPRIO usuário, devolve o perfil completo (com CPF mascarado). Quando é outra pessoa, `serializarUsuario(..., { self:false })` remove e-mail, tel... */
router.get(
  '/:id',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const targetId = parseInt(req.params.id, 10);
    const row = await buscarUsuario('u.id = $1', [targetId]);
    if (!row) throw new ErroApi(404, 'Usuário não encontrado.');
    res.json({ usuario: serializarUsuario(row, { self: req.usuario.id === targetId }) });
  })
);

/** * PATCH /api/v1/usuarios/:id — edita o próprio perfil. Campos que o app NÃO consegue alterar por aqui, de propósito: `cpf`, `data_nascimento`, `tipo_conta`, `eh_trabalhador`, `modo`, `poin... */
router.patch(
  '/:id',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    assert(req.usuario.id === parseInt(req.params.id, 10), 403, 'Você só pode editar o seu próprio perfil.');

    let addressFields = { id: null, cidade: null, bairro: null, lat: null, lng: null };
    if (req.body.endereco_id) {
      const found = await consultarBanco('SELECT * FROM enderecos WHERE id = $1', [req.body.endereco_id]);
      assert(found.rows[0], 400, 'Endereço inválido — refaça a busca do endereço.');
      const a = found.rows[0];
      addressFields = { id: a.id, cidade: a.cidade, bairro: a.bairro, lat: a.lat, lng: a.lng };
    }

    let telefone;
    if (req.body.telefone !== undefined) {
      telefone = normalizarTelefone(req.body.telefone);
      assert(telefone, 400, 'Número de celular inválido. Informe DDD + número.');
    }

    if (req.body.nome !== undefined) {
      assert(String(req.body.nome).trim().length >= 3, 400, 'Nome muito curto.');
    }

    const { rows } = await consultarBanco(
      `UPDATE usuarios SET
         nome                = COALESCE($1, nome),
         bio                 = COALESCE($2, bio),
         telefone               = COALESCE($3, telefone),
         url_avatar          = COALESCE($4, url_avatar),
         category            = COALESCE($5, category),
         endereco_id          = COALESCE($6, endereco_id),
         numero_endereco      = COALESCE($7, numero_endereco),
         complemento_endereco  = COALESCE($8, complemento_endereco),
         cidade                = COALESCE($9, cidade),
         bairro        = COALESCE($10, bairro),
         lat                 = COALESCE($11, lat),
         lng                 = COALESCE($12, lng),
         atualizado_em          = NOW()
       WHERE id = $13
       RETURNING id`,
      [
        req.body.nome,
        req.body.bio,
        telefone,
        req.body.url_avatar,
        req.body.categoria,
        addressFields.id,
        req.body.numero_endereco,
        req.body.complemento_endereco,
        addressFields.cidade,
        addressFields.bairro,
        addressFields.lat,
        addressFields.lng,
        req.params.id,
      ]
    );

    const fresh = await buscarUsuario('u.id = $1', [rows[0].id]);
    res.json({ usuario: serializarUsuario(fresh) });
  })
);

/** * PUT /api/v1/usuarios/:id/avatar body: { url_avatar } Troca a foto de perfil — vale para cliente, trabalhador e híbrido. A URL precisa ser um arquivo que o PRÓPRIO usuário enviou... */
router.put(
  '/:id/avatar',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    assert(req.usuario.id === parseInt(req.params.id, 10), 403, 'Você só pode alterar a sua própria foto.');

    const avatarUrl = req.body?.url_avatar;
    assert(avatarUrl, 400, 'Envie a foto antes de salvar.');

    const isInline = String(avatarUrl).startsWith('data:image/');
    if (!isInline) {
      const owned = await consultarBanco('SELECT id, kind FROM arquivos_midia WHERE url_publica = $1 AND dono_id = $2', [
        avatarUrl,
        req.usuario.id,
      ]);
      assert(owned.rows[0], 400, 'Arquivo inválido — reenvie a foto.');
      assert(owned.rows[0].kind === 'image', 400, 'A foto de perfil precisa ser uma imagem.');
    }

    const before = await consultarBanco('SELECT url_avatar FROM usuarios WHERE id = $1', [req.usuario.id]);
    const previous = before.rows[0]?.url_avatar;

    await consultarBanco('UPDATE usuarios SET url_avatar = $1, atualizado_em = NOW() WHERE id = $2', [avatarUrl, req.usuario.id]);

    if (previous && previous !== avatarUrl) {
      await excluirPorUrl(previous, req.usuario.id); // ignora data: e URLs externas
    }

    const fresh = await buscarUsuario('u.id = $1', [req.usuario.id]);
    res.json({ usuario: serializarUsuario(fresh) });
  })
);

/** DELETE /api/v1/usuarios/:id/avatar — volta para as iniciais. */
router.delete(
  '/:id/avatar',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    assert(req.usuario.id === parseInt(req.params.id, 10), 403, 'Você só pode alterar a sua própria foto.');

    const me = await consultarBanco('SELECT url_avatar, eh_trabalhador FROM usuarios WHERE id = $1', [req.usuario.id]);
    assert(
      !me.rows[0]?.eh_trabalhador,
      400,
      'A foto de perfil é obrigatória para contas de trabalhador — envie outra no lugar.'
    );

    await consultarBanco('UPDATE usuarios SET url_avatar = NULL, atualizado_em = NOW() WHERE id = $1', [req.usuario.id]);
    if (me.rows[0]?.url_avatar) await excluirPorUrl(me.rows[0].url_avatar, req.usuario.id);

    const fresh = await buscarUsuario('u.id = $1', [req.usuario.id]);
    res.json({ usuario: serializarUsuario(fresh) });
  })
);

module.exports = router;
