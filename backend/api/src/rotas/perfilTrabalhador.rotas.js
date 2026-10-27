const { Router } = require('express');
const { consultarBanco, obterClienteBanco } = require('../banco/conexao');
const { signToken, intermediarioAutenticacao } = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const { ErroApi, assert } = require('../intermediarios/tratamentoErros');
const { serializarUsuario, buscarUsuario, salvarPerfilTrabalhador, salvarResponsavel } = require('../servicos/visaoUsuario');
const {
  normalizarTelefone,
  validateAndReserveCpf,
  assertWorkerAge,
  validateGuardian,
  validateWorkerProfile,
} = require('../servicos/cadastro');
const { avaliarElegibilidadeTrabalhador } = require('../utilitarios/idade');
const { maskCpf } = require('../utilitarios/cpf');

const router = Router();

/** * GET /api/v1/perfil-trabalhador/requisitos O que falta para ESTA conta virar trabalhadora. É o que a tela "Ser Trabalhador" consulta para saber quais etapas mostrar — por exemplo... */
router.get(
  '/requisitos',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT u.id, u.cpf, u.data_nascimento, u.telefone, u.url_avatar, u.endereco_id, u.numero_endereco,
              u.eh_trabalhador, u.eh_cliente, u.tipo_conta,
              EXISTS(SELECT 1 FROM responsaveis_legais g WHERE g.usuario_id = u.id) AS tem_responsavel,
              EXISTS(SELECT 1 FROM perfis_trabalhador wp WHERE wp.usuario_id = u.id) AS tem_perfil_trabalhador
       FROM usuarios u WHERE u.id = $1`,
      [req.usuario.id]
    );
    const u = rows[0];
    if (!u) throw new ErroApi(404, 'Usuário não encontrado.');

    const eligibility = u.data_nascimento
      ? avaliarElegibilidadeTrabalhador(u.data_nascimento)
      : { allowed: null, age: null, requiresGuardian: false, reason: null };

    res.json({
      alreadyWorker: u.eh_trabalhador,
      accountType: u.tipo_conta,
      age: eligibility.age,
      minAge: 14,
      ageAllowed: eligibility.allowed,
      ageMessage: eligibility.reason,
      requiresGuardian: eligibility.requiresGuardian,
      hasGuardian: u.tem_responsavel,
      hasWorkerProfile: u.tem_perfil_trabalhador,
      missing: {
        cpf: !u.cpf,
        data_nascimento: !u.data_nascimento,
        telefone: !u.telefone,
        avatar: !u.url_avatar,
        endereco: !u.endereco_id || !u.numero_endereco,
        responsavel: eligibility.requiresGuardian && !u.tem_responsavel,
        worker_profile: !u.tem_perfil_trabalhador,
      },
      cpf_masked: maskCpf(u.cpf),
    });
  })
);

/** * POST /api/v1/perfil-trabalhador/ativar A opção "Ser Trabalhador" do menu lateral cai AQUI — não mais numa simples troca de variável. Este endpoint: 1. valida CPF (dígitos + unic... */
router.post(
  '/ativar',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const {
      cpf,
      data_nascimento: birthDateInput,
      telefone,
      url_avatar: avatarUrl,
      endereco_id: addressId,
      numero_endereco: addressNumber,
      complemento_endereco: addressComplement,
      worker_profile: workerProfileInput,
      responsavel: guardianInput,
      keep_client: keepClientRaw,
    } = req.body;

    const keepClient = keepClientRaw === undefined ? true : Boolean(keepClientRaw);

    const current = await consultarBanco(
      `SELECT id, cpf, data_nascimento, telefone, url_avatar, endereco_id, numero_endereco, eh_trabalhador, eh_cliente
       FROM usuarios WHERE id = $1`,
      [req.usuario.id]
    );
    const me = current.rows[0];
    if (!me) throw new ErroApi(404, 'Usuário não encontrado.');
    if (me.eh_trabalhador) {
      throw new ErroApi(409, 'Esta conta já possui um perfil de trabalhador ativo.', {
        code: 'ALREADY_WORKER',
      });
    }

    // ---------- CPF ----------
    let cpfValue = me.cpf;
    let cpfStatus = null;
    if (!cpfValue) {
      assert(cpf, 400, 'Informe seu CPF para criar o perfil de trabalhador.');
      const checked = await validateAndReserveCpf(cpf, req.usuario.id);
      cpfValue = checked.cpf;
      cpfStatus = checked.estado;
    }

    // ---------- Idade (regra dos 14 anos) ----------
    const birthDate = me.data_nascimento || birthDateInput;
    assert(birthDate, 400, 'Informe sua data de nascimento.');
    const ageInfo = assertWorkerAge(birthDate); // 403 + code MIN_WORKER_AGE se < 14

    // ---------- Responsável legal (14 a 17 anos) ----------
    let guardian = null;
    if (ageInfo.requiresGuardian) {
      const existingGuardian = await consultarBanco('SELECT id FROM responsaveis_legais WHERE usuario_id = $1', [req.usuario.id]);
      if (!existingGuardian.rows[0] || guardianInput) {
        guardian = validateGuardian(guardianInput);
      }
    }

    // ---------- Demais obrigatórios ----------
    const finalAvatar = avatarUrl || me.url_avatar;
    assert(finalAvatar, 400, 'Envie uma foto de perfil para criar o perfil de trabalhador.');

    const finalAddressId = addressId || me.endereco_id;
    const finalAddressNumber = addressNumber || me.numero_endereco;
    assert(finalAddressId, 400, 'Informe a cidade/endereço onde você atende.');
    assert(finalAddressNumber, 400, 'Informe o número do seu endereço.');

    const finalPhone = telefone ? normalizarTelefone(telefone) : me.telefone;
    assert(finalPhone, 400, 'Informe um número de celular válido.');

    const workerProfile = await validateWorkerProfile(workerProfileInput);

    const addressRow = await consultarBanco('SELECT * FROM enderecos WHERE id = $1', [finalAddressId]);
    assert(addressRow.rows[0], 400, 'Endereço inválido — refaça a busca do endereço.');
    const addr = addressRow.rows[0];

    // ---------- Gravação ----------
    const accountType = keepClient ? 'hybrid' : 'worker';
    const conn = await obterClienteBanco();
    try {
      await conn.consultarBanco('BEGIN');
      await conn.consultarBanco('SET CONSTRAINTS ALL DEFERRED');

      if (guardian) {
        await salvarResponsavel(conn, req.usuario.id, guardian, req.ip);
      }

      await conn.consultarBanco(
        `UPDATE usuarios SET
           cpf                = COALESCE(cpf, $1),
           estado_cpf         = COALESCE($2, estado_cpf),
           cpf_verificado_em     = CASE WHEN $2 IS NULL THEN cpf_verificado_em ELSE NOW() END,
           data_nascimento         = COALESCE(data_nascimento, $3),
           telefone              = $4,
           url_avatar         = $5,
           endereco_id         = $6,
           numero_endereco     = $7,
           complemento_endereco = COALESCE($8, complemento_endereco),
           cidade               = $9,
           bairro       = $10,
           lat                = $11,
           lng                = $12,
           category           = $13,
           tipo_conta       = $14,
           eh_cliente          = $15,
           eh_trabalhador          = TRUE,
           modo               = 'worker',
           worker_activated_at = COALESCE(worker_activated_at, NOW()),
           slug_plano          = COALESCE(slug_plano, 'formiga')
         WHERE id = $16`,
        [
          cpfValue,
          cpfStatus,
          ageInfo.birthDateIso,
          finalPhone,
          finalAvatar,
          addr.id,
          finalAddressNumber,
          addressComplement || null,
          addr.cidade,
          addr.bairro,
          addr.lat,
          addr.lng,
          workerProfile.categoria_slug,
          accountType,
          keepClient,
          req.usuario.id,
        ]
      );

      await salvarPerfilTrabalhador(conn, req.usuario.id, workerProfile);
      await conn.consultarBanco('COMMIT');
    } catch (err) {
      await conn.consultarBanco('ROLLBACK');
      throw err;
    } finally {
      conn.release();
    }

    const user = await buscarUsuario('u.id = $1', [req.usuario.id]);
    res.status(201).json({
      token_acesso: signToken(user), // token novo já com modo = worker
      usuario: serializarUsuario(user),
      accountType,
      requiresGuardian: ageInfo.requiresGuardian,
    });
  })
);

/** GET /api/v1/perfil-trabalhador/me — dados profissionais do próprio usuário. */
router.get(
  '/me',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const profile = await consultarBanco('SELECT * FROM perfis_trabalhador WHERE usuario_id = $1', [req.usuario.id]);
    const areas = await consultarBanco(
      'SELECT id, cidade, regiao, raio_km FROM areas_atendimento WHERE usuario_id = $1 ORDER BY cidade',
      [req.usuario.id]
    );
    res.json({ perfil: profile.rows[0] || null, serviceAreas: areas.rows });
  })
);

/** PATCH /api/v1/perfil-trabalhador — edita os dados profissionais. */
router.patch(
  '/',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const me = await consultarBanco('SELECT eh_trabalhador FROM usuarios WHERE id = $1', [req.usuario.id]);
    assert(me.rows[0]?.eh_trabalhador, 403, 'Ative seu perfil de trabalhador antes de editar os dados profissionais.');

    const existing = await consultarBanco('SELECT * FROM perfis_trabalhador WHERE usuario_id = $1', [req.usuario.id]);
    const merged = { ...(existing.rows[0] || {}), ...req.body };
    const profile = await validateWorkerProfile(merged);

    const conn = await obterClienteBanco();
    try {
      await conn.consultarBanco('BEGIN');
      await salvarPerfilTrabalhador(conn, req.usuario.id, profile);
      await conn.consultarBanco('UPDATE usuarios SET category = $1 WHERE id = $2', [profile.categoria_slug, req.usuario.id]);
      await conn.consultarBanco('COMMIT');
    } catch (err) {
      await conn.consultarBanco('ROLLBACK');
      throw err;
    } finally {
      conn.release();
    }

    const fresh = await consultarBanco('SELECT * FROM perfis_trabalhador WHERE usuario_id = $1', [req.usuario.id]);
    res.json({ perfil: fresh.rows[0] });
  })
);

/** * GET /api/v1/perfil-trabalhador/responsavel Dado sensível de menor de idade: SÓ o próprio usuário consegue ler, e o CPF do responsável sai mascarado. Não existe rota para terceiros co... */
router.get(
  '/responsavel',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const { rows } = await consultarBanco(
      `SELECT nome, cpf, data_nascimento, relationship, telefone, email, consent_accepted, consent_at
       FROM responsaveis_legais WHERE usuario_id = $1`,
      [req.usuario.id]
    );
    if (!rows[0]) return res.json({ responsavel: null });
    res.json({ responsavel: { ...rows[0], cpf: maskCpf(rows[0].cpf) } });
  })
);

/** Desativa o perfil profissional mantendo o histórico (não apaga nada). */
router.post(
  '/desativar',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const me = await consultarBanco('SELECT eh_cliente, eh_trabalhador FROM usuarios WHERE id = $1', [req.usuario.id]);
    assert(me.rows[0]?.eh_trabalhador, 400, 'Esta conta não possui perfil de trabalhador.');
    assert(
      me.rows[0]?.eh_cliente,
      400,
      'Sua conta é apenas de trabalhador. Para continuar usando o MoviPay, ative também o perfil de cliente antes.'
    );

    await consultarBanco(
      `UPDATE usuarios SET eh_trabalhador = FALSE, tipo_conta = 'client', modo = 'client', esta_disponivel = FALSE
       WHERE id = $1`,
      [req.usuario.id]
    );
    const user = await buscarUsuario('u.id = $1', [req.usuario.id]);
    res.json({ token_acesso: signToken(user), usuario: serializarUsuario(user) });
  })
);

module.exports = router;
