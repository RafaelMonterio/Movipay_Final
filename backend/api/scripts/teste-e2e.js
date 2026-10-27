#!/usr/bin/env node
/* eslint-disable no-console */
require('dotenv').config();
/**
 * Bateria de testes end-to-end contra a API REAL.
 *
 * Não é mock: sobe requisições HTTP de verdade contra o backend rodando
 * e confere o resultado no banco. Roda com `npm run test:e2e` (a API
 * precisa estar no ar em http://localhost:3000).
 *
 * Cobre o que o projeto exige explicitamente: cadastro de cliente,
 * trabalhador e híbrido, a trava dos 14 anos (13 bloqueado; 14/15/16/17
 * exigindo responsável; 18+ sem responsável), validação de CPF, Shorts
 * com foto e vídeo, exclusão de publicação, chat a partir do Short,
 * troca de foto de perfil e a comissão de 15%.
 */

const BASE = process.env.TEST_API_URL || 'http://localhost:3000/api/v1';

let passed = 0;
let failed = 0;
const failures = [];

function ok(name) {
  passed += 1;
  console.log(`  ✓ ${name}`);
}
function bad(name, detail) {
  failed += 1;
  failures.push(`${name} — ${detail}`);
  console.log(`  ✗ ${name}\n      ${detail}`);
}

function check(name, condition, detail = '') {
  if (condition) ok(name);
  else bad(name, detail || 'condição falhou');
}

async function api(method, path, { body, token, raw } = {}) {
  const headers = { Accept: 'application/json' };
  if (!raw && body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: raw ? body : body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

/** CPFs válidos gerados pelo algoritmo oficial (dígitos verificadores corretos). */
function generateCpf(seed) {
  const base = String(seed).padStart(9, '0').slice(-9).split('').map(Number);
  const d1calc = base.reduce((acc, n, i) => acc + n * (10 - i), 0);
  let d1 = (d1calc * 10) % 11;
  if (d1 >= 10) d1 = 0;
  const withD1 = [...base, d1];
  const d2calc = withD1.reduce((acc, n, i) => acc + n * (11 - i), 0);
  let d2 = (d2calc * 10) % 11;
  if (d2 >= 10) d2 = 0;
  return [...withD1, d2].join('');
}

/** Data de nascimento para uma idade exata em anos completos (hoje). */
function birthDateForAge(years) {
  const now = new Date();
  const d = new Date(now.getFullYear() - years, now.getMonth(), now.getDate());
  // recua 1 dia para garantir que o aniversário já passou
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const stamp = Date.now().toString().slice(-7);
let cpfSeed = Number(stamp) * 7;
const nextCpf = () => generateCpf((cpfSeed += 137));
const mail = (tag) => `${tag}.${stamp}@teste-movipay.com`;

const WORKER_PROFILE = {
  category_slug: 'eletrica',
  specialty: 'Instalação de tomadas e chuveiros',
  description: 'Atendo residências com instalação elétrica geral.',
  experience: '3 anos atuando na região',
  price_min: 80,
  price_max: 250,
  price_type: 'service',
  modality: 'presential',
  service_area: 'Ribeirão Pires e região',
  availability_days: [1, 2, 3, 4, 5],
  hour_start: 8,
  hour_end: 18,
};

const GUARDIAN = () => ({
  name: 'Marcia Souza Responsavel',
  cpf: nextCpf(),
  birth_date: birthDateForAge(40),
  relationship: 'Mãe',
  phone: '11988887777',
  email: `resp.${stamp}@teste-movipay.com`,
  consent_accepted: true,
});

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/**
 * Um endereço real já gravado na tabela `addresses` (vem do seed).
 * Lido direto do banco de propósito: a busca de endereço depende da
 * ViaCEP, que é externa — o teste não deve falhar por causa da rede
 * de terceiros quando o que está sendo testado é outra coisa.
 */
async function firstAddressId() {
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'movipay',
    user: process.env.DB_USER || 'movipay',
    password: process.env.DB_PASSWORD || 'movipay_secret',
  });
  try {
    const { rows } = await pool.query('SELECT id FROM addresses ORDER BY id LIMIT 1');
    return rows[0]?.id || null;
  } finally {
    await pool.end();
  }
}

(async () => {
  console.log('\n═══ MoviPay · testes end-to-end ═══\n');

  // ---------------------------------------------------------------
  console.log('1) Regra de idade — consulta prévia (/auth/check-eligibility)');
  {
    const r13 = await api('POST', '/auth/check-eligibility', { body: { birth_date: birthDateForAge(13) } });
    check('13 anos → não permitido', r13.data?.worker?.allowed === false, JSON.stringify(r13.data));
    check(
      '13 anos → mensagem oficial',
      String(r13.data?.worker?.message || '').includes('no mínimo 14 anos'),
      r13.data?.worker?.message
    );

    for (const age of [14, 15, 16, 17]) {
      const r = await api('POST', '/auth/check-eligibility', { body: { birth_date: birthDateForAge(age) } });
      check(
        `${age} anos → permitido e exige responsável`,
        r.data?.worker?.allowed === true && r.data?.worker?.requiresGuardian === true,
        JSON.stringify(r.data?.worker)
      );
    }

    const r18 = await api('POST', '/auth/check-eligibility', { body: { birth_date: birthDateForAge(18) } });
    check(
      '18 anos → permitido sem responsável',
      r18.data?.worker?.allowed === true && r18.data?.worker?.requiresGuardian === false,
      JSON.stringify(r18.data?.worker)
    );

    // Caso de borda real: aniversário é amanhã → ainda tem 13.
    const t = new Date();
    const tomorrow = new Date(t.getFullYear() - 14, t.getMonth(), t.getDate() + 1);
    const iso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(
      tomorrow.getDate()
    ).padStart(2, '0')}`;
    const rEdge = await api('POST', '/auth/check-eligibility', { body: { birth_date: iso } });
    check(
      'faz 14 amanhã → ainda bloqueado (idade por dia/mês/ano)',
      rEdge.data?.worker?.allowed === false && rEdge.data?.worker?.age === 13,
      JSON.stringify(rEdge.data?.worker)
    );
  }

  // ---------------------------------------------------------------
  console.log('\n2) Validação de CPF');
  {
    const invalid = await api('POST', '/auth/check-eligibility', { body: { cpf: '11111111111' } });
    check('CPF de dígitos repetidos recusado', invalid.data?.cpf?.formatValid === false);

    const wrongDigit = await api('POST', '/auth/check-eligibility', { body: { cpf: '12345678900' } });
    check('CPF com dígito verificador errado recusado', wrongDigit.data?.cpf?.formatValid === false);

    const good = await api('POST', '/auth/check-eligibility', { body: { cpf: generateCpf(52998224) } });
    check('CPF válido aceito', good.data?.cpf?.formatValid === true, JSON.stringify(good.data?.cpf));
  }

  // ---------------------------------------------------------------
  console.log('\n3) Cadastro de CLIENTE');
  let clientToken = null;
  let clientId = null;
  {
    const noTerms = await api('POST', '/auth/register', {
      body: {
        account_type: 'client',
        name: 'Sem Aceite Teste',
        email: mail('semaceite'),
        password: 'senha123',
        cpf: nextCpf(),
        birth_date: birthDateForAge(30),
        phone: '11900001111',
        // terms_accepted ausente de propósito
      },
    });
    check(
      'cadastro sem aceitar os Termos de Uso é recusado',
      noTerms.status === 400,
      `status ${noTerms.status}`
    );

    const res = await api('POST', '/auth/register', {
      body: {
        account_type: 'client',
        terms_accepted: true,
        name: 'Cliente Teste Silva',
        email: mail('cliente'),
        password: 'senha123',
        cpf: nextCpf(),
        birth_date: birthDateForAge(30),
        phone: '11987654321',
      },
    });
    check('cliente criado sem foto (foto opcional)', res.status === 201, JSON.stringify(res.data));
    clientToken = res.data?.access_token;
    clientId = res.data?.user?.id;
    check('CPF volta mascarado, nunca em texto puro', /^\*\*\*\.\*\*\*\./.test(res.data?.user?.cpf_masked || ''), res.data?.user?.cpf_masked);
    check('resposta não contém o campo cpf cru', res.data?.user?.cpf === undefined);
    check('papéis corretos', res.data?.user?.is_client === true && res.data?.user?.is_worker === false);

    // Cliente de 12 anos: PERMITIDO (a regra dos 14 é do trabalhador)
    const minor = await api('POST', '/auth/register', {
      body: {
        account_type: 'client',
        terms_accepted: true,
        name: 'Crianca Cliente Teste',
        email: mail('crianca'),
        password: 'senha123',
        cpf: nextCpf(),
        birth_date: birthDateForAge(12),
        phone: '11911112222',
      },
    });
    check('cliente de 12 anos é permitido (regra dos 14 não se aplica)', minor.status === 201, JSON.stringify(minor.data));
  }

  // ---------------------------------------------------------------
  console.log('\n4) Cadastro de TRABALHADOR — trava dos 14 anos');
  const addressId = await firstAddressId();
  if (!addressId) {
    bad('endereço de teste', 'não foi possível obter um endereço via /address/search (rede externa?)');
  }

  let workerToken = null;
  let workerId = null;
  {
    // 13 anos → DEVE SER BLOQUEADO
    const blocked = await api('POST', '/auth/register', {
      body: {
        account_type: 'worker',
        terms_accepted: true,
        name: 'Menor Bloqueado Teste',
        email: mail('menor13'),
        password: 'senha123',
        cpf: nextCpf(),
        birth_date: birthDateForAge(13),
        phone: '11933334444',
        avatar_url: TINY_PNG,
        address_id: addressId,
        address_number: '100',
        worker_profile: WORKER_PROFILE,
        guardian: GUARDIAN(),
      },
    });
    check('13 anos bloqueado no backend (403)', blocked.status === 403, `status ${blocked.status}`);
    check(
      '13 anos → code MIN_WORKER_AGE',
      blocked.data?.error?.details?.code === 'MIN_WORKER_AGE',
      JSON.stringify(blocked.data?.error)
    );
    check(
      '13 anos → mensagem exata pedida no projeto',
      blocked.data?.error?.message ===
        'Para criar um perfil de trabalhador no MoviPay, é necessário ter no mínimo 14 anos.',
      blocked.data?.error?.message
    );

    // 14 anos SEM responsável → bloqueado
    const noGuardian = await api('POST', '/auth/register', {
      body: {
        account_type: 'worker',
        terms_accepted: true,
        name: 'Menor Sem Responsavel',
        email: mail('menor14sr'),
        password: 'senha123',
        cpf: nextCpf(),
        birth_date: birthDateForAge(14),
        phone: '11933335555',
        avatar_url: TINY_PNG,
        address_id: addressId,
        address_number: '100',
        worker_profile: WORKER_PROFILE,
      },
    });
    check('14 anos sem responsável é recusado', noGuardian.status === 400, `status ${noGuardian.status}`);
    check(
      '14 anos sem responsável → code GUARDIAN_REQUIRED',
      noGuardian.data?.error?.details?.code === 'GUARDIAN_REQUIRED',
      JSON.stringify(noGuardian.data?.error)
    );

    // 14 a 17 anos COM responsável → permitido
    for (const age of [14, 15, 16, 17]) {
      const res = await api('POST', '/auth/register', {
        body: {
          account_type: 'worker',
        terms_accepted: true,
          name: `Jovem Trabalhador ${age}`,
          email: mail(`jovem${age}`),
          password: 'senha123',
          cpf: nextCpf(),
          birth_date: birthDateForAge(age),
          phone: '11944445555',
          avatar_url: TINY_PNG,
          address_id: addressId,
          address_number: '150',
          worker_profile: WORKER_PROFILE,
          guardian: GUARDIAN(),
        },
      });
      check(`${age} anos com responsável → criado`, res.status === 201, JSON.stringify(res.data?.error));
      if (res.status === 201) {
        check(`${age} anos → responsável gravado`, res.data?.user?.has_guardian === true);
      }
    }

    // 18 anos sem responsável → permitido
    const adult = await api('POST', '/auth/register', {
      body: {
        account_type: 'worker',
        terms_accepted: true,
        name: 'Trabalhador Adulto Teste',
        email: mail('worker18'),
        password: 'senha123',
        cpf: nextCpf(),
        birth_date: birthDateForAge(25),
        phone: '11955556666',
        avatar_url: TINY_PNG,
        address_id: addressId,
        address_number: '200',
        worker_profile: WORKER_PROFILE,
      },
    });
    check('18+ sem responsável → criado', adult.status === 201, JSON.stringify(adult.data?.error));
    workerToken = adult.data?.access_token;
    workerId = adult.data?.user?.id;
    check('trabalhador nasce no plano Formiga', adult.data?.user?.plan_slug === 'formiga');
    check('dados profissionais gravados', adult.data?.user?.specialty === WORKER_PROFILE.specialty);
  }

  // ---------------------------------------------------------------
  console.log('\n5) Cadastro HÍBRIDO');
  let hybridToken = null;
  {
    const under = await api('POST', '/auth/register', {
      body: {
        account_type: 'hybrid',
        terms_accepted: true,
        name: 'Hibrido Menor Teste',
        email: mail('hibmenor'),
        password: 'senha123',
        cpf: nextCpf(),
        birth_date: birthDateForAge(13),
        phone: '11966667777',
        avatar_url: TINY_PNG,
        address_id: addressId,
        address_number: '10',
        worker_profile: WORKER_PROFILE,
        guardian: GUARDIAN(),
      },
    });
    check('híbrido com 13 anos é bloqueado (mesma regra)', under.status === 403, `status ${under.status}`);

    const res = await api('POST', '/auth/register', {
      body: {
        account_type: 'hybrid',
        terms_accepted: true,
        name: 'Hibrido Adulto Teste',
        email: mail('hibrido'),
        password: 'senha123',
        cpf: nextCpf(),
        birth_date: birthDateForAge(28),
        phone: '11977778888',
        avatar_url: TINY_PNG,
        address_id: addressId,
        address_number: '300',
        worker_profile: { ...WORKER_PROFILE, category_slug: 'informatica' },
      },
    });
    check('híbrido criado', res.status === 201, JSON.stringify(res.data?.error));
    hybridToken = res.data?.access_token;
    check(
      'híbrido tem os dois papéis',
      res.data?.user?.is_client === true && res.data?.user?.is_worker === true,
      JSON.stringify({ c: res.data?.user?.is_client, w: res.data?.user?.is_worker })
    );

    const toClient = await api('PATCH', '/auth/mode', { body: { mode: 'client' }, token: hybridToken });
    check('híbrido alterna para modo cliente', toClient.status === 200 && toClient.data?.user?.mode === 'client');
    const back = await api('PATCH', '/auth/mode', { body: { mode: 'worker' }, token: hybridToken });
    check('híbrido volta para modo trabalhador', back.status === 200 && back.data?.user?.mode === 'worker');
    hybridToken = back.data?.access_token || hybridToken;
  }

  // ---------------------------------------------------------------
  console.log('\n6) "Ser Trabalhador" — ativação a partir de conta cliente');
  {
    const req = await api('GET', '/worker-profile/requirements', { token: clientToken });
    check('requisitos consultados', req.status === 200, JSON.stringify(req.data));
    check('conta cliente ainda não é trabalhadora', req.data?.alreadyWorker === false);

    const mode = await api('PATCH', '/auth/mode', { body: { mode: 'worker' }, token: clientToken });
    check('trocar para worker sem perfil é recusado (409)', mode.status === 409, `status ${mode.status}`);
    check(
      'recusa traz code WORKER_PROFILE_REQUIRED',
      mode.data?.error?.details?.code === 'WORKER_PROFILE_REQUIRED',
      JSON.stringify(mode.data?.error)
    );

    const activate = await api('POST', '/worker-profile/activate', {
      token: clientToken,
      body: {
        avatar_url: TINY_PNG,
        address_id: addressId,
        address_number: '400',
        worker_profile: { ...WORKER_PROFILE, category_slug: 'pintura' },
        keep_client: true,
      },
    });
    check('ativação cria perfil profissional', activate.status === 201, JSON.stringify(activate.data?.error));
    check('conta virou híbrida', activate.data?.accountType === 'hybrid', activate.data?.accountType);
    if (activate.data?.access_token) clientToken = activate.data.access_token;
  }

  // ---------------------------------------------------------------
  console.log('\n7) Shorts — foto, vídeo, views e exclusão');
  let photoShortId = null;
  let videoShortId = null;
  {
    // upload real de imagem (multipart)
    const imgBytes = Buffer.from(TINY_PNG.split(',')[1], 'base64');
    const fdImg = new FormData();
    fdImg.append('purpose', 'short');
    fdImg.append('files', new Blob([imgBytes], { type: 'image/png' }), 'foto.png');
    const upImg = await api('POST', '/media', { token: workerToken, body: fdImg, raw: true });
    check('upload de foto aceito', upImg.status === 201, JSON.stringify(upImg.data));
    const photoUrl = upImg.data?.files?.[0]?.url;
    check('foto reconhecida como image', upImg.data?.files?.[0]?.kind === 'image');

    // upload real de vídeo (MP4 mínimo com header ftyp)
    const mp4 = Buffer.concat([
      Buffer.from([0, 0, 0, 0x18]),
      Buffer.from('ftypmp42'),
      Buffer.from([0, 0, 0, 0]),
      Buffer.from('mp42isom'),
      Buffer.alloc(256),
    ]);
    const fdVid = new FormData();
    fdVid.append('purpose', 'short');
    fdVid.append('files', new Blob([mp4], { type: 'video/mp4' }), 'video.mp4');
    const upVid = await api('POST', '/media', { token: workerToken, body: fdVid, raw: true });
    check('upload de VÍDEO aceito', upVid.status === 201, JSON.stringify(upVid.data));
    const videoUrl = upVid.data?.files?.[0]?.url;
    check('vídeo reconhecido como video', upVid.data?.files?.[0]?.kind === 'video', upVid.data?.files?.[0]?.kind);

    const pubPhoto = await api('POST', '/shorts', {
      token: workerToken,
      body: { media_urls: [photoUrl], caption: 'Foto do trabalho' },
    });
    check('publicação de foto criada', pubPhoto.status === 201, JSON.stringify(pubPhoto.data?.error));
    check('tipo gravado como image', pubPhoto.data?.short?.media_type === 'image', pubPhoto.data?.short?.media_type);
    photoShortId = pubPhoto.data?.short?.id;

    const pubVideo = await api('POST', '/shorts', {
      token: workerToken,
      body: { media_urls: [videoUrl], caption: 'Vídeo do trabalho', duration_seconds: 12.5 },
    });
    check('publicação de VÍDEO criada', pubVideo.status === 201, JSON.stringify(pubVideo.data?.error));
    check(
      'tipo gravado como video (derivado no backend, não do app)',
      pubVideo.data?.short?.media_type === 'video',
      pubVideo.data?.short?.media_type
    );
    videoShortId = pubVideo.data?.short?.id;

    // o app pode mentir sobre o tipo: o backend ignora e usa o real
    const liar = await api('POST', '/shorts', {
      token: workerToken,
      body: { media_urls: [videoUrl], media_type: 'image', caption: 'tentando enganar' },
    });
    check(
      'app não consegue forçar tipo errado',
      liar.data?.short?.media_type === 'video',
      liar.data?.short?.media_type
    );
    if (liar.data?.short?.id) await api('DELETE', `/shorts/${liar.data.short.id}`, { token: workerToken });

    // arquivo de outra pessoa não pode ser publicado
    const steal = await api('POST', '/shorts', {
      token: hybridToken,
      body: { media_urls: [videoUrl], caption: 'roubando arquivo' },
    });
    check('publicar arquivo de outro usuário é recusado', steal.status === 400, `status ${steal.status}`);

    // interações
    const like = await api('POST', `/shorts/${videoShortId}/like`, { token: clientToken });
    check('curtida registrada', like.status === 201 && like.data?.likesCount === 1);
    const comment = await api('POST', `/shorts/${videoShortId}/comments`, {
      token: clientToken,
      body: { content: 'Ficou ótimo!' },
    });
    check('comentário registrado', comment.status === 201, JSON.stringify(comment.data?.error));
    const view = await api('POST', `/shorts/${videoShortId}/view`, { token: clientToken });
    check('visualização contada', view.data?.viewsCount === 1, JSON.stringify(view.data));
    const view2 = await api('POST', `/shorts/${videoShortId}/view`, { token: clientToken });
    check('visualização não duplica pelo mesmo usuário', view2.data?.viewsCount === 1, JSON.stringify(view2.data));

    // "Meus trabalhos"
    const mine = await api('GET', '/shorts/mine', { token: workerToken });
    check('Meus trabalhos lista as publicações', (mine.data?.shorts || []).length >= 2, JSON.stringify(mine.data?.totals));
    check('totais agregados (curtidas/comentários/views)', mine.data?.totals?.likes >= 1 && mine.data?.totals?.views >= 1);

    // exclusão: outro usuário NÃO pode
    const alien = await api('DELETE', `/shorts/${photoShortId}`, { token: clientToken });
    check('outro usuário não exclui publicação alheia (403)', alien.status === 403, `status ${alien.status}`);

    const del = await api('DELETE', `/shorts/${photoShortId}`, { token: workerToken });
    check('dono exclui a própria publicação', del.status === 200 && del.data?.deleted === true);
    check('arquivo removido do disco junto', del.data?.removedFiles >= 1, JSON.stringify(del.data));

    const gone = await api('GET', `/shorts/${photoShortId}`);
    check('publicação excluída some do feed (404)', gone.status === 404, `status ${gone.status}`);
  }

  // ---------------------------------------------------------------
  console.log('\n8) Chat a partir do Short e do perfil');
  {
    const fromShort = await api('POST', '/chat/direct', {
      token: clientToken,
      body: { short_id: videoShortId },
    });
    check('botão Contato abre conversa real', fromShort.status === 201, JSON.stringify(fromShort.data?.error));
    check(
      'conversa aponta para o DONO da publicação',
      fromShort.data?.conversation?.other_user_id === workerId,
      `${fromShort.data?.conversation?.other_user_id} != ${workerId}`
    );
    const convId = fromShort.data?.conversation?.conversation_id;

    const send = await api('POST', `/chat/conversation/${convId}`, {
      token: clientToken,
      body: { content: 'Olá! Vi seu vídeo, você atende no sábado?' },
    });
    check('mensagem enviada sem precisar de pedido', send.status === 201, JSON.stringify(send.data?.error));

    const read = await api('GET', `/chat/conversation/${convId}`, { token: workerToken });
    check('trabalhador recebe a mensagem', (read.data?.messages || []).length === 1);

    const reply = await api('POST', `/chat/conversation/${convId}`, {
      token: workerToken,
      body: { content: 'Atendo sim! Qual o endereço?' },
    });
    check('trabalhador responde', reply.status === 201);

    const list = await api('GET', '/chat', { token: clientToken });
    check('conversa aparece na lista', (list.data?.conversations || []).some((c) => c.conversation_id === convId));

    // abrir de novo não duplica thread
    const again = await api('POST', '/chat/direct', { token: clientToken, body: { user_id: workerId } });
    check('reabrir não cria conversa duplicada', again.data?.conversation?.conversation_id === convId);

    // terceiro não acessa
    const intruder = await api('GET', `/chat/conversation/${convId}`, { token: hybridToken });
    check('terceiro não acessa a conversa (403)', intruder.status === 403, `status ${intruder.status}`);
  }

  // ---------------------------------------------------------------
  console.log('\n9) Foto de perfil');
  {
    const bytes = Buffer.from(TINY_PNG.split(',')[1], 'base64');
    const fd = new FormData();
    fd.append('purpose', 'avatar');
    fd.append('files', new Blob([bytes], { type: 'image/png' }), 'avatar.png');
    const up = await api('POST', '/media', { token: clientToken, body: fd, raw: true });
    const url = up.data?.files?.[0]?.url;

    const put = await api('PUT', `/users/${clientId}/avatar`, { token: clientToken, body: { avatar_url: url } });
    check('foto de perfil salva no backend', put.status === 200 && put.data?.user?.avatar_url === url);

    const me = await api('GET', '/auth/me', { token: clientToken });
    check('foto persiste após novo login/consulta', me.data?.user?.avatar_url === url);

    const alien = await api('PUT', `/users/${workerId}/avatar`, { token: clientToken, body: { avatar_url: url } });
    check('não é possível trocar a foto de outro usuário (403)', alien.status === 403, `status ${alien.status}`);
  }

  // ---------------------------------------------------------------
  console.log('\n10) Planos e divulgação');
  {
    const plans = await api('GET', '/plans');
    check('três planos disponíveis', (plans.data?.plans || []).length === 3);
    const weights = Object.fromEntries((plans.data?.plans || []).map((p) => [p.slug, Number(p.exposure_weight)]));
    check(
      'pesos de exposição crescentes e limitados',
      weights.formiga === 1 && weights.operaria > 1 && weights.rainha > weights.operaria && weights.rainha <= 2,
      JSON.stringify(weights)
    );

    const free = await api('POST', '/plans/formiga/subscribe', { token: workerToken });
    check('Formiga é gratuito e ativa direto', free.status === 200 && free.data?.free === true);

    const paid = await api('POST', '/plans/rainha/subscribe', { token: workerToken, body: { method: 'pix' } });
    check('assinatura paga gera cobrança Pix', paid.status === 201, JSON.stringify(paid.data?.error));
    check('Pix copia-e-cola gerado', typeof paid.data?.payment?.pix_payload === 'string' && paid.data.payment.pix_payload.length > 50);
    check('cobrança nasce PENDENTE', paid.data?.payment?.status === 'pending', paid.data?.payment?.status);

    const stillFree = await api('GET', '/plans/me', { token: workerToken });
    check(
      'plano NÃO ativa antes do pagamento confirmar',
      stillFree.data?.planSlug === 'formiga',
      stillFree.data?.planSlug
    );

    // Confirmação: só com token administrativo (o app não tem)
    const noToken = await api('POST', `/pagamentos/${paid.data?.payment?.id}/confirm-manual`, { token: workerToken });
    check('app não consegue confirmar pagamento (403)', noToken.status === 403, `status ${noToken.status}`);

    const res = await fetch(`${BASE}/pagamentos/${paid.data?.payment?.id}/confirm-manual`, {
      method: 'POST',
      headers: { 'x-admin-token': process.env.ADMIN_CONFIRM_TOKEN || 'teste-local-123' },
    });
    check('confirmação administrativa aceita', res.status === 200, `status ${res.status}`);

    const activated = await api('GET', '/plans/me', { token: workerToken });
    check('plano ativado APÓS confirmação', activated.data?.planSlug === 'rainha', activated.data?.planSlug);
    check('assinatura com validade definida', Boolean(activated.data?.subscription?.current_period_end));

    const stats = await api('GET', '/plans/stats', { token: workerToken });
    check('Rainha libera estatísticas avançadas dos Shorts', stats.data?.available === true && Boolean(stats.data?.shorts));

    const statsFree = await api('GET', '/plans/stats', { token: hybridToken });
    check('Formiga não tem estatísticas', statsFree.data?.available === false);

    // busca continua relevante (categoria é filtro, não sugestão)
    const search = await api('GET', '/workers?category=informatica');
    const slugs = (search.data?.workers || []).map((w) => w.category_slug);
    check(
      'plano não faz Rainha aparecer em categoria que não atende',
      slugs.every((s) => s === 'informatica'),
      JSON.stringify(slugs)
    );
    check('busca devolve _score auditável', search.data?.workers?.[0]?._score !== undefined);
  }

  // ---------------------------------------------------------------
  console.log('\n11) Comissão de 15%');
  {
    const cfg = await api('GET', '/pagamentos/config');
    check('percentual vem do banco', cfg.data?.commissionPercent === 15, String(cfg.data?.commissionPercent));

    // cria serviço e pedido reais para medir a divisão
    const svc = await api('POST', '/services', {
      token: workerToken,
      body: { title: 'Serviço de teste 100', description: 'teste', price: 100, price_type: 'fixed', category_id: 2 },
    });
    const serviceId = svc.data?.service?.id;
    check('serviço criado para o teste', Boolean(serviceId), JSON.stringify(svc.data?.error));

    await api('PATCH', '/auth/mode', { body: { mode: 'client' }, token: hybridToken });
    const asClient = await api('POST', '/auth/login', {
      body: { email: mail('hibrido'), password: 'senha123' },
    });
    const buyerToken = asClient.data?.access_token;

    const order = await api('POST', '/orders', {
      token: buyerToken,
      body: { worker_id: workerId, service_id: serviceId, address_id: addressId, address_number: '55' },
    });
    check('pedido criado', order.status === 201, JSON.stringify(order.data?.error));
    const orderId = order.data?.order?.id;

    const pay = await api('POST', '/pagamentos/service', { token: buyerToken, body: { order_id: orderId } });
    check('cobrança do serviço criada', pay.status === 201, JSON.stringify(pay.data?.error));
    check('bruto = 100,00', Number(pay.data?.commission?.gross) === 100, JSON.stringify(pay.data?.commission));
    check('plataforma = 15,00', Number(pay.data?.commission?.platformFee) === 15, JSON.stringify(pay.data?.commission));
    check('trabalhador = 85,00', Number(pay.data?.commission?.netAmount) === 85, JSON.stringify(pay.data?.commission));

    const before = await api('GET', '/pagamentos/wallet', { token: workerToken });
    const balanceBefore = Number(before.data?.balance || 0);

    const confirm = await fetch(`${BASE}/pagamentos/${pay.data?.payment?.id}/confirm-manual`, {
      method: 'POST',
      headers: { 'x-admin-token': process.env.ADMIN_CONFIRM_TOKEN || 'teste-local-123' },
    });
    check('pagamento do serviço confirmado', confirm.status === 200, `status ${confirm.status}`);

    const after = await api('GET', '/pagamentos/wallet', { token: workerToken });
    check(
      'carteira recebe o LÍQUIDO (85), não o bruto',
      Number(after.data?.balance) - balanceBefore === 85,
      `antes ${balanceBefore} depois ${after.data?.balance}`
    );
    check('total de comissões registrado', Number(after.data?.totals?.platformFees) >= 15, JSON.stringify(after.data?.totals));

    // dupla confirmação não credita de novo (idempotência)
    await fetch(`${BASE}/pagamentos/${pay.data?.payment?.id}/confirm-manual`, {
      method: 'POST',
      headers: { 'x-admin-token': process.env.ADMIN_CONFIRM_TOKEN || 'teste-local-123' },
    });
    const after2 = await api('GET', '/pagamentos/wallet', { token: workerToken });
    check(
      'reconfirmar não paga em dobro',
      Number(after2.data?.balance) === Number(after.data?.balance),
      `${after.data?.balance} vs ${after2.data?.balance}`
    );

    // cliente não vê o líquido do trabalhador
    const detailClient = await api('GET', `/orders/${orderId}`, { token: buyerToken });
    check(
      'cliente vê bruto e taxa, não o líquido do trabalhador',
      detailClient.data?.commission?.net_amount === undefined,
      JSON.stringify(detailClient.data?.commission)
    );
  }

  // ---------------------------------------------------------------
  console.log('\n12) Segurança e trava no banco');
  {
    const other = await api('PATCH', `/users/${workerId}`, { token: clientToken, body: { name: 'Hackeado' } });
    check('não é possível editar perfil de outro (403)', other.status === 403, `status ${other.status}`);

    const publicView = await api('GET', `/users/${workerId}`, { token: clientToken });
    check('perfil de terceiro não expõe CPF', !publicView.data?.user?.cpf_masked && !publicView.data?.user?.cpf);
    check('perfil de terceiro não expõe e-mail nem nascimento',
      publicView.data?.user?.email === undefined && publicView.data?.user?.birth_date === undefined);

    // Última linha de defesa: SQL direto tentando criar menor trabalhador
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || 'movipay',
      user: process.env.DB_USER || 'movipay',
      password: process.env.DB_PASSWORD || 'movipay_secret',
    });
    try {
      await pool.query(
        `INSERT INTO users (name,email,password_hash,mode,cpf,birth_date,account_type,is_client,is_worker)
         VALUES ('Burlar Trigger','burla.${stamp}@t.com','x','worker',NULL,$1,'worker',FALSE,TRUE)`,
        [birthDateForAge(13)]
      );
      bad('trigger do banco bloqueia menor de 14', 'o INSERT direto passou — a trava falhou');
    } catch (err) {
      check(
        'trigger do banco bloqueia menor de 14 mesmo via SQL direto',
        String(err.message).includes('no mínimo 14 anos'),
        err.message
      );
    }
    try {
      await pool.query(
        `INSERT INTO users (name,email,password_hash,mode,birth_date,account_type,is_client,is_worker)
         VALUES ('Menor Sem Resp','burla2.${stamp}@t.com','x','worker',$1,'worker',FALSE,TRUE)`,
        [birthDateForAge(15)]
      );
      bad('trigger exige responsável para menor', 'o INSERT direto passou sem responsável');
    } catch (err) {
      check(
        'trigger do banco exige responsável para 14–17 via SQL direto',
        String(err.message).includes('responsável legal'),
        err.message
      );
    }
    await pool.end();
  }

  // ---------------------------------------------------------------
  console.log('\n13) Pix — payload no padrão do Banco Central');
  {
    const { montarCargaPix, cargaPixValida } = require('../src/utilitarios/pix');
    const payload = montarCargaPix({
      key: process.env.PIX_KEY || '47079033802',
      merchantName: 'MOVIPAY',
      merchantCity: 'RIBEIRAO PIRES',
      amount: 39.9,
      txid: 'MOVIPAYTESTE1',
    });
    check('CRC16 do BR Code confere', cargaPixValida(payload), payload.slice(-20));
    check('payload começa com o cabeçalho EMV', payload.startsWith('000201'), payload.slice(0, 10));
    check('chave preservada sem alterar dígitos', payload.includes(process.env.PIX_KEY || '47079033802'));
    check('valor no campo 54', payload.includes('540539.90'), payload);
  }

  // ---------------------------------------------------------------
  console.log(`\n═══ RESULTADO: ${passed} passaram · ${failed} falharam ═══`);
  if (failures.length) {
    console.log('\nFalhas:');
    failures.forEach((f) => console.log(`  • ${f}`));
  }
  process.exit(failed > 0 ? 1 : 0);
})().catch((err) => {
  console.error('\n✘ Erro fatal na bateria de testes:', err);
  process.exit(1);
});
