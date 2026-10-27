const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { consultarBanco, obterClienteBanco } = require('../banco/conexao');
const { signToken, intermediarioAutenticacao } = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const { ErroApi, assert, exigirCampos } = require('../intermediarios/tratamentoErros');
const { serializarUsuario, buscarUsuario, salvarPerfilTrabalhador, salvarResponsavel } = require('../servicos/visaoUsuario');
const {
  isValidEmail,
  normalizarTelefone,
  resolveAccountType,
  validateAndReserveCpf,
  assertWorkerAge,
  validateGuardian,
  validateWorkerProfile,
} = require('../servicos/cadastro');
const { avaliarElegibilidadeTrabalhador, validarDataNascimento } = require('../utilitarios/idade');
const { validarCpf } = require('../utilitarios/cpf');

const router = Router();

// Sobe quando o TEXTO dos Termos de Uso mudar de um jeito relevante — serve só de registro em `usuarios.versao_termos`; hoje nada força reaceite automát...
const CURRENT_TERMS_VERSION = '1.0';

/** * POST /api/v1/autenticacao/cadastrar Um único endpoint para os três tipos de conta. O que muda por tipo: client → nome, CPF, nascimento, e-mail, celular, senha. Foto OPCIONAL. SEM idade... */
router.post(
  '/cadastrar',
  lidarAssincrono(async (req, res) => {
    const accountType = resolveAccountType(req.body);
    const wantsWorker = accountType === 'worker' || accountType === 'hybrid';

    const {
      nome,
      email,
      senha,
      cpf,
      data_nascimento: birthDate,
      telefone,
      bio,
      url_avatar: avatarUrl,
      category,
      endereco_id: addressId,
      numero_endereco: addressNumber,
      complemento_endereco: addressComplement,
      worker_profile: workerProfileInput,
      responsavel: guardianInput,
      terms_accepted: termsAccepted,
    } = req.body;

    // Aceite dos Termos de Uso é obrigatório em qualquer tipo de conta — sem isso o cadastro nem chega a validar o resto. A tela de cadastro sempre manda...
    assert(termsAccepted === true, 400, 'É necessário aceitar os Termos de Uso para criar sua conta.');

    // ---------- 1. Dados pessoais (obrigatórios em TODOS os tipos) ----------
    exigirCampos(req.body, ['nome', 'email', 'senha', 'cpf', 'data_nascimento', 'telefone']);
    assert(isValidEmail(email), 400, 'E-mail inválido.');
    assert(String(senha).length >= 6, 400, 'A senha precisa ter pelo menos 6 caracteres.');
    assert(String(nome).trim().split(/\s+/).length >= 2, 400, 'Informe seu nome completo.');

    const normalizedPhone = normalizarTelefone(telefone);
    assert(normalizedPhone, 400, 'Número de celular inválido. Informe DDD + número.');

    const existing = await consultarBanco('SELECT id FROM usuarios WHERE email = $1', [String(email).toLowerCase().trim()]);
    if (existing.rows[0]) throw new ErroApi(409, 'Já existe uma conta com este e-mail.');

    const cpfCheck = await validateAndReserveCpf(cpf);

    // ---------- 2. Regra de idade — só para quem terá função de trabalhador ----------
    let ageInfo = null;
    let guardian = null;
    let workerProfile = null;

    if (wantsWorker) {
      // Lança 403 com code MIN_WORKER_AGE se tiver menos de 14 anos completos.
      ageInfo = assertWorkerAge(birthDate);

      if (ageInfo.requiresGuardian) {
        guardian = validateGuardian(guardianInput);
      }

      assert(avatarUrl, 400, 'A foto de perfil é obrigatória para o cadastro de trabalhador.');
      // Reforço de validação: o app só deveria mandar uma URL de arquivo já enviado (relativa, começando com '/uploads/') ou uma imagem embutida em base64...
      if (String(avatarUrl).startsWith('data:')) {
        assert(String(avatarUrl).startsWith('data:image/'), 400, 'Formato de foto inválido.');
      }
      assert(addressId, 400, 'Informe a cidade/endereço onde você atende.');
      assert(addressNumber, 400, 'Informe o número do seu endereço.');

      workerProfile = await validateWorkerProfile(workerProfileInput, { categoryFallback: category });
    } else {
      // Cliente: a data ainda precisa ser válida, mas não há idade mínima.
      const check = validarDataNascimento(birthDate);
      assert(check.valid, 400, check.reason);
      ageInfo = { age: check.age, requiresGuardian: false, birthDateIso: check.iso };
    }

    // ---------- 3. Endereço ----------
    let addressRow = null;
    if (addressId) {
      const found = await consultarBanco('SELECT * FROM enderecos WHERE id = $1', [addressId]);
      addressRow = found.rows[0];
      assert(addressRow, 400, 'Endereço inválido — refaça a busca do endereço.');
    }

    // ---------- 4. Gravação (transação única) ----------
    const passwordHash = bcrypt.hashSync(String(senha), 10);
    const conn = await obterClienteBanco();
    let userId;

    try {
      await conn.consultarBanco('BEGIN');
      // A trigger que exige responsável para menor é DEFERRABLE: só valida no COMMIT. Assim dá para inserir usuário e responsável na mesma transação sem fa...
      await conn.consultarBanco('SET CONSTRAINTS ALL DEFERRED');

      const insert = await conn.consultarBanco(
        `INSERT INTO usuarios
           (nome, email, hash_senha, modo, telefone, bio, category, url_avatar,
            endereco_id, numero_endereco, complemento_endereco, cidade, bairro, lat, lng,
            cpf, data_nascimento, tipo_conta, eh_cliente, eh_trabalhador, estado_cpf, cpf_verificado_em,
            worker_activated_at, slug_plano, termos_aceitos_em, versao_termos)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,NOW(),$22,'formiga',NOW(),$23)
         RETURNING id`,
        [
          String(nome).trim(),
          String(email).toLowerCase().trim(),
          passwordHash,
          wantsWorker ? 'worker' : 'client', // modo ATIVO inicial
          normalizedPhone,
          bio || null,
          wantsWorker ? workerProfile.categoria_slug : null,
          avatarUrl || null,
          addressRow?.id || null,
          addressNumber || null,
          addressComplement || null,
          addressRow?.cidade || null,
          addressRow?.bairro || null,
          addressRow?.lat || null,
          addressRow?.lng || null,
          cpfCheck.cpf,
          ageInfo.birthDateIso,
          accountType,
          accountType !== 'worker', // client e hybrid têm papel de cliente
          wantsWorker,
          cpfCheck.estado,
          wantsWorker ? new Date() : null,
          CURRENT_TERMS_VERSION,
        ]
      );
      userId = insert.rows[0].id;

      if (guardian) {
        await salvarResponsavel(conn, userId, guardian, req.ip);
      }
      if (workerProfile) {
        await salvarPerfilTrabalhador(conn, userId, workerProfile);
      }

      // Bônus único de boas-vindas para cada novo cliente (inclusive híbrido).
      const WELCOME_BONUS = 150;
      await conn.consultarBanco('UPDATE usuarios SET pontos = pontos + $1 WHERE id = $2', [WELCOME_BONUS, userId]);
      await conn.consultarBanco(
        `INSERT INTO historico_pontos (usuario_id, tipo, quantidade, descricao)
         VALUES ($1,'bonus',$2,'Bônus de boas-vindas')`,
        [userId, WELCOME_BONUS]
      );

      await conn.consultarBanco('COMMIT');
    } catch (err) {
      await conn.consultarBanco('ROLLBACK');
      throw err;
    } finally {
      conn.release();
    }

    const user = await buscarUsuario('u.id = $1', [userId]);
    res.status(201).json({ token_acesso: signToken(user), usuario: serializarUsuario(user) });
  })
);

router.post(
  '/entrar',
  lidarAssincrono(async (req, res) => {
    const { email, senha } = req.body;
    exigirCampos(req.body, ['email', 'senha']);

    const { rows } = await consultarBanco('SELECT id, hash_senha FROM usuarios WHERE email = $1', [
      String(email).toLowerCase().trim(),
    ]);
    const found = rows[0];
    assert(found, 401, 'E-mail ou senha incorretos.');
    assert(bcrypt.compareSync(String(senha), found.hash_senha), 401, 'E-mail ou senha incorretos.');

    const user = await buscarUsuario('u.id = $1', [found.id]);
    res.json({ token_acesso: signToken(user), usuario: serializarUsuario(user) });
  })
);

router.get(
  '/me',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const user = await buscarUsuario('u.id = $1', [req.usuario.id]);
    if (!user) throw new ErroApi(404, 'Usuário não encontrado.');
    res.json({ usuario: serializarUsuario(user) });
  })
);

/** * PATCH /api/v1/autenticacao/modo — troca o modo ATIVO da interface. Diferença importante em relação à versão anterior: isto NÃO cria nem ativa nada. Só alterna entre papéis que a conta... */
router.patch(
  '/modo',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const { modo } = req.body;
    assert(['client', 'worker'].includes(modo), 400, "O campo 'modo' deve ser 'client' ou 'worker'.");

    const current = await consultarBanco('SELECT eh_cliente, eh_trabalhador FROM usuarios WHERE id = $1', [req.usuario.id]);
    const row = current.rows[0];
    if (!row) throw new ErroApi(404, 'Usuário não encontrado.');

    if (modo === 'worker' && !row.eh_trabalhador) {
      throw new ErroApi(409, 'Você ainda não tem um perfil de trabalhador ativo.', {
        code: 'WORKER_PROFILE_REQUIRED',
      });
    }
    if (modo === 'client' && !row.eh_cliente) {
      throw new ErroApi(409, 'Esta conta não possui perfil de cliente.', { code: 'CLIENT_PROFILE_REQUIRED' });
    }

    await consultarBanco('UPDATE usuarios SET modo = $1 WHERE id = $2', [modo, req.usuario.id]);
    const user = await buscarUsuario('u.id = $1', [req.usuario.id]);
    res.json({ token_acesso: signToken(user), usuario: serializarUsuario(user) });
  })
);

/** * POST /api/v1/autenticacao/verificar-elegibilidade Consulta sem efeito colateral, usada pelo app na primeira etapa do cadastro para já avisar sobre idade/CPF. Quem decide de verdade continua... */
router.post(
  '/verificar-elegibilidade',
  lidarAssincrono(async (req, res) => {
    const { data_nascimento: birthDate, cpf, email } = req.body;
    const result = { trabalhador: null, cpf: null, email: null };

    if (birthDate) {
      const eligibility = avaliarElegibilidadeTrabalhador(birthDate);
      result.trabalhador = {
        age: eligibility.age,
        allowed: eligibility.allowed,
        requiresGuardian: eligibility.requiresGuardian,
        mensagem: eligibility.reason,
        minAge: 14,
      };
    }

    if (cpf) {
      const check = validarCpf(cpf);
      let taken = false;
      if (check.valid) {
        const { rows } = await consultarBanco('SELECT 1 FROM usuarios WHERE cpf = $1 LIMIT 1', [check.cpf]);
        taken = Boolean(rows[0]);
      }
      result.cpf = {
        valid: check.valid && !taken,
        formatValid: check.valid,
        available: check.valid ? !taken : null,
        alreadyRegistered: taken,
        mensagem: taken ? 'Já existe uma conta cadastrada com este CPF.' : check.reason,
      };
    }

    // Disponibilidade do e-mail. Responde só "livre ou não" — nunca devolve dados da conta existente, para a rota não virar um jeito de descobrir quem es...
    if (email) {
      const normalized = String(email).trim().toLowerCase();
      const looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
      let taken = false;
      if (looksValid) {
        const { rows } = await consultarBanco('SELECT 1 FROM usuarios WHERE email = $1 LIMIT 1', [normalized]);
        taken = Boolean(rows[0]);
      }
      result.email = {
        formatValid: looksValid,
        available: looksValid ? !taken : null,
        mensagem: !looksValid
          ? 'E-mail inválido.'
          : taken
          ? 'Já existe uma conta com este e-mail. Faça login.'
          : null,
      };
    }

    res.json(result);
  })
);

router.post(
  '/bonus-diario',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const already = await consultarBanco(
      `SELECT id FROM historico_pontos
       WHERE usuario_id = $1 AND tipo = 'bonus' AND descricao = 'Bônus diário de Folhas'
         AND criado_em::date = CURRENT_DATE`,
      [req.usuario.id]
    );
    if (already.rows[0]) throw new ErroApi(409, 'Você já resgatou o bônus de hoje. Volte amanhã!');

    const AMOUNT = 5;
    await consultarBanco('UPDATE usuarios SET pontos = pontos + $1 WHERE id = $2', [AMOUNT, req.usuario.id]);
    await consultarBanco(
      `INSERT INTO historico_pontos (usuario_id, tipo, quantidade, descricao)
       VALUES ($1,'bonus',$2,'Bônus diário de Folhas')`,
      [req.usuario.id, AMOUNT]
    );
    const user = await buscarUsuario('u.id = $1', [req.usuario.id]);
    res.json({ quantidade: AMOUNT, usuario: serializarUsuario(user) });
  })
);

module.exports = router;
