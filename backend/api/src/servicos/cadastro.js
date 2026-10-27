/** * Validação de cadastro — cliente, trabalhador e híbrido. Tudo que decide "esta pessoa pode ser trabalhador?" passa por aqui. As rotas (`/autenticacao/cadastrar` e `/perfil-trabalhador/activ... */

const { consultarBanco } = require('../banco/conexao');
const { ErroApi } = require('../intermediarios/tratamentoErros');
const { validarCpf, verificarCpfExternamente, somenteDigitos } = require('../utilitarios/cpf');
const {
  avaliarElegibilidadeTrabalhador,
  validarDataNascimento,
  GUARDIAN_REQUIRED_MESSAGE,
} = require('../utilitarios/idade');

const ACCOUNT_TYPES = ['client', 'worker', 'hybrid'];
const PRICE_TYPES = ['hourly', 'daily', 'service'];
const MODALITIES = ['presential', 'online', 'both'];

function fail(mensagem, details) {
  throw new ErroApi(400, mensagem, details);
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizarTelefone(telefone) {
  const digits = somenteDigitos(telefone);
  if (digits.length < 10 || digits.length > 13) return null;
  return digits;
}

/** tipo_conta derivado; aceita também o `modo` antigo para compatibilidade. */
function resolveAccountType(body) {
  const raw = body.tipo_conta || body.accountType;
  if (raw) {
    if (!ACCOUNT_TYPES.includes(raw)) fail("tipo_conta deve ser 'client', 'worker' ou 'hybrid'.");
    return raw;
  }
  // Compatibilidade com o app antigo, que só mandava modo.
  if (body.modo === 'worker') return 'worker';
  return 'client';
}

/** * Valida CPF (dígitos + unicidade) e, se configurado, consulta o provedor externo. Lança ErroApi em caso de problema. @param {string} rawCpf @param {number|null} ignoreUserId u... */
async function validateAndReserveCpf(rawCpf, ignoreUserId = null) {
  const result = validarCpf(rawCpf);
  if (!result.valid) fail(result.reason);

  const params = ignoreUserId ? [result.cpf, ignoreUserId] : [result.cpf];
  const { rows } = await consultarBanco(
    `SELECT id FROM usuarios WHERE cpf = $1 ${ignoreUserId ? 'AND id <> $2' : ''} LIMIT 1`,
    params
  );
  if (rows[0]) {
    throw new ErroApi(409, 'Já existe uma conta cadastrada com este CPF.');
  }

  const external = await verificarCpfExternamente(result.cpf);
  if (external.estado === 'invalid') {
    fail('Este CPF consta como irregular na consulta externa. Verifique a situação do documento.');
  }

  return { cpf: result.cpf, estado: external.estado };
}

/** * Regra de idade da função de trabalhador. @returns {{ age:number, requiresGuardian:boolean, birthDateIso:string }} */
function assertWorkerAge(birthDate) {
  const check = validarDataNascimento(birthDate);
  if (!check.valid) fail(check.reason);

  const eligibility = avaliarElegibilidadeTrabalhador(birthDate);
  if (!eligibility.allowed) {
    // 403 e não 400: não é "campo mal preenchido", é uma regra da plataforma que proíbe a ação. O app usa esse código para mostrar a tela de bloqueio em...
    throw new ErroApi(403, eligibility.reason, { code: 'MIN_WORKER_AGE', minAge: 14, age: eligibility.age });
  }

  return {
    age: eligibility.age,
    requiresGuardian: eligibility.requiresGuardian,
    birthDateIso: check.iso,
  };
}

/** Valida os dados do responsável legal (obrigatórios de 14 a 17 anos). */
function validateGuardian(guardian) {
  if (!guardian || typeof guardian !== 'object') {
    throw new ErroApi(400, GUARDIAN_REQUIRED_MESSAGE, { code: 'GUARDIAN_REQUIRED' });
  }

  const missing = ['nome', 'cpf', 'data_nascimento', 'relationship', 'telefone'].filter(
    (f) => !guardian[f] || String(guardian[f]).trim() === ''
  );
  if (missing.length) {
    throw new ErroApi(
      400,
      `Dados do responsável legal incompletos: ${missing.join(', ')}.`,
      { code: 'GUARDIAN_REQUIRED', missing }
    );
  }

  if (guardian.consent_accepted !== true) {
    throw new ErroApi(400, 'O responsável legal precisa aceitar a declaração de responsabilidade.', {
      code: 'GUARDIAN_CONSENT_REQUIRED',
    });
  }

  const cpfCheck = validarCpf(guardian.cpf);
  if (!cpfCheck.valid) fail(`CPF do responsável: ${cpfCheck.reason}`);

  const birth = validarDataNascimento(guardian.data_nascimento);
  if (!birth.valid) fail(`Data de nascimento do responsável: ${birth.reason}`);
  if (birth.age < 18) fail('O responsável legal precisa ser maior de 18 anos.');

  const telefone = normalizarTelefone(guardian.telefone);
  if (!telefone) fail('Telefone do responsável inválido. Informe DDD + número.');

  if (guardian.email && !isValidEmail(guardian.email)) {
    fail('E-mail do responsável inválido.');
  }

  return {
    nome: String(guardian.nome).trim(),
    cpf: cpfCheck.cpf,
    data_nascimento: birth.iso,
    relationship: String(guardian.relationship).trim(),
    telefone,
    email: guardian.email || null,
    consent_text: guardian.consent_text || null,
  };
}

/** Valida o bloco de dados profissionais. */
async function validateWorkerProfile(profile, { categoryFallback } = {}) {
  if (!profile || typeof profile !== 'object') {
    fail('Preencha os dados profissionais para criar seu perfil de trabalhador.');
  }

  const categorySlug = profile.categoria_slug || profile.category || categoryFallback;
  if (!categorySlug) fail('Escolha a categoria do seu serviço.');

  const cat = await consultarBanco('SELECT slug FROM categorias WHERE slug = $1', [categorySlug]);
  if (!cat.rows[0]) fail('Categoria de serviço inválida.');

  const required = ['specialty', 'descricao', 'experience', 'area_servico'];
  const missing = required.filter((f) => !profile[f] || String(profile[f]).trim().length === 0);
  if (missing.length) {
    const labels = {
      specialty: 'especialidade',
      descricao: 'descrição profissional',
      experience: 'experiência',
      area_servico: 'área de atendimento',
    };
    fail(`Campos profissionais obrigatórios: ${missing.map((m) => labels[m]).join(', ')}.`);
  }

  const priceType = profile.tipo_preco || 'service';
  if (!PRICE_TYPES.includes(priceType)) fail("Forma de cobrança deve ser 'hourly', 'daily' ou 'service'.");

  const modality = profile.modality || 'presential';
  if (!MODALITIES.includes(modality)) fail("Modalidade deve ser 'presential', 'online' ou 'both'.");

  const priceMin = profile.preco_minimo === '' || profile.preco_minimo == null ? null : Number(profile.preco_minimo);
  const priceMax = profile.preco_max === '' || profile.preco_max == null ? null : Number(profile.preco_max);
  if (priceMin === null && priceMax === null) fail('Informe seu preço ou faixa de preço.');
  if (priceMin !== null && (!Number.isFinite(priceMin) || priceMin < 0)) fail('Preço mínimo inválido.');
  if (priceMax !== null && (!Number.isFinite(priceMax) || priceMax < 0)) fail('Preço máximo inválido.');
  if (priceMin !== null && priceMax !== null && priceMax < priceMin) {
    fail('O preço máximo não pode ser menor que o mínimo.');
  }

  const days = Array.isArray(profile.dias_disponibilidade)
    ? [...new Set(profile.dias_disponibilidade.map(Number))].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    : [];
  if (days.length === 0) fail('Selecione ao menos um dia de disponibilidade.');

  const hourStart = profile.hora_inicio == null ? null : Number(profile.hora_inicio);
  const hourEnd = profile.hora_fim == null ? null : Number(profile.hora_fim);
  if (hourStart !== null && (hourStart < 0 || hourStart > 23)) fail('Horário inicial inválido.');
  if (hourEnd !== null && (hourEnd < 1 || hourEnd > 24)) fail('Horário final inválido.');
  if (hourStart !== null && hourEnd !== null && hourEnd <= hourStart) {
    fail('O horário final precisa ser depois do inicial.');
  }

  return {
    categoria_slug: categorySlug,
    specialty: String(profile.specialty).trim(),
    descricao: String(profile.descricao).trim(),
    experience: String(profile.experience).trim(),
    preco_minimo: priceMin,
    preco_max: priceMax,
    tipo_preco: priceType,
    modality,
    area_servico: String(profile.area_servico).trim(),
    dias_disponibilidade: days,
    observacao_disponibilidade: profile.observacao_disponibilidade ? String(profile.observacao_disponibilidade).trim() : null,
    hora_inicio: hourStart,
    hora_fim: hourEnd,
    areas_servico: Array.isArray(profile.areas_servico) ? profile.areas_servico : undefined,
  };
}

module.exports = {
  ACCOUNT_TYPES,
  PRICE_TYPES,
  MODALITIES,
  isValidEmail,
  normalizarTelefone,
  resolveAccountType,
  validateAndReserveCpf,
  assertWorkerAge,
  validateGuardian,
  validateWorkerProfile,
};
