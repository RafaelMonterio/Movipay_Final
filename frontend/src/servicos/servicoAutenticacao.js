import api from './clienteApi';
import { SEED_USERS as SEED_USERS_LIST } from './bancoSimulado';

// ── Contas de teste pré-existentes ────────────────────────────────────────────
// Reaproveita a MESMA lista de contas usada pelo bancoSimulado (servicos/bancoSimulado.js)
// em vez de manter uma segunda cópia divergente — assim "Ana" e "Bruno" têm
// sempre os mesmos dados (localização, categoria, avaliação etc.) tanto no
// entrar quanto no restante do site.
const SEED_USERS = Object.fromEntries(SEED_USERS_LIST.map(u => [u.email, u]));

// ── Banco local persistente (localStorage) ────────────────────────────────────
const DB_KEY = 'movipay_users_db';

function getDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    // Seeds sempre presentes; contas demo aposentadas não podem voltar pelo banco antigo.
    const cleaned = Object.fromEntries(Object.entries(saved).filter(([, user]) => ![3, 4, 5, 6, 7, 8].includes(Number(user?.id))));
    return { ...SEED_USERS, ...cleaned };
  } catch {
    return { ...SEED_USERS };
  }
}

function saveDB(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch { /* quota excedida: ignora */ }
}

function getDevUser() {
  try {
    const raw = localStorage.getItem('dev_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Só fala com um backend de verdade se houver um configurado. A camada de mock
// (servicos/clienteApi.js) não tem /autenticacao/entrar nem /autenticacao/cadastrar e cai no retorno
// genérico { success: true } (sem usuário) — o que fazia o cadastro "dar certo"
// com user undefined ("Cannot read properties of undefined (reading 'mode')").
function hasRealBackend() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return !!apiUrl;
}

function normalizarUsuario(usuario = {}) {
  return {
    ...usuario,
    id: usuario.id,
    name: usuario.name || usuario.nome,
    email: usuario.email,
    mode: usuario.mode || usuario.modo,
    points: usuario.points ?? usuario.pontos ?? 0,
    avatar_url: usuario.avatar_url || usuario.url_avatar || '',
  };
}

// ── Serviço ───────────────────────────────────────────────────────────────────
const servicoAutenticacao = {
  async entrar(email, password) {
    const normalized = (email || '').trim().toLowerCase();

    // Quando a URL da API está configurada, o site usa o mesmo backend do
    // mobile, inclusive em localhost. O mock fica restrito ao modo offline.
    if (hasRealBackend()) {
      try {
        const { data } = await api.post('/autenticacao/entrar', { email: normalized, senha: password });
        const usuario = data?.usuario || data?.user;
        const token = data?.token_acesso || data?.access_token;
        if (!usuario || !token) throw new Error('Resposta de login inválida.');
        localStorage.setItem('access_token', token);
        const usuarioNormalizado = normalizarUsuario(usuario);
        localStorage.setItem('dev_user', JSON.stringify(usuarioNormalizado));
        return usuarioNormalizado;
      } catch (erro) {
        throw new Error(erro?.response?.data?.error?.mensagem || erro?.response?.data?.error || 'E-mail ou senha incorretos.');
      }
    }

    // Modo offline: banco local de demonstração.
    const db = getDB();
    const found = db[normalized];
    if (found && found.password === password) {
      const { password: _pw, ...user } = found;
      localStorage.setItem('access_token', 'dev-token');
      localStorage.setItem('dev_user', JSON.stringify(user));
      return user;
    }

    throw new Error('E-mail ou senha incorretos.');
  },

  async cadastrar(payload) {
    const email = (payload?.email || '').trim().toLowerCase();
    if (!email || !payload?.password) throw new Error('Preencha todos os campos obrigatórios.');

    const db = getDB();

    if (hasRealBackend()) {
      const corpo = {
        nome: payload.name,
        email,
        senha: payload.password,
        modo: payload.mode || 'client',
        telefone: payload.phone,
        bio: payload.bio,
        url_avatar: payload.avatar_url || null,
        categoria: payload.category || (payload.services && payload.services[0]) || null,
        cidade: payload.city || null,
        bairro: payload.neighborhood || null,
        lat: payload.lat || null,
        lng: payload.lng || null,
        cpf: payload.cpf,
        data_nascimento: payload.data_nascimento || payload.birthDate,
        terms_accepted: payload.accepted_terms === true,
      };
      try {
        const { data } = await api.post('/autenticacao/cadastrar', corpo);
        const usuario = data?.usuario || data?.user;
        const token = data?.token_acesso || data?.access_token;
        if (!usuario || !token) throw new Error('Resposta de cadastro inválida.');
        localStorage.setItem('access_token', token);
        return normalizarUsuario(usuario);
      } catch (erro) {
        throw new Error(erro?.response?.data?.error?.mensagem || erro?.response?.data?.error || 'Não foi possível criar a conta.');
      }
    }

    // Verifica duplicidade localmente
    if (db[email]) {
      throw new Error('Este e-mail já está cadastrado. Tente fazer entrar.');
    }

    // Fallback: persiste no banco local
    const newUser = {
      id: Date.now(),
      name: payload.name || 'Usuário',
      email,
      password: payload.password,
      mode: payload.mode || 'client',
      points: 0,
      phone: payload.phone || '',
      bio: payload.bio || '',
      avatar_url: payload.avatar_url || '',
      city: payload.city || '',
      lat: payload.lat || null,
      lng: payload.lng || null,
      neighborhood: payload.neighborhood || '',
      category: payload.category || (payload.services && payload.services[0]) || '',
      cep: payload.cep || '',
      street: payload.street || '',
      address_number: payload.addressNumber || '',
      complement: payload.complement || '',
      services: payload.services || [],
      portfolio: payload.portfolio || [],
      experience_years: payload.experienceYears || '',
      is_available: payload.mode === 'worker' ? true : undefined,
      accepted_terms: !!payload.accepted_terms,
      terms_version: payload.terms_version || '2026.09.23',
      accepted_terms_at: payload.accepted_terms_at || new Date().toISOString(),
    };

    db[email] = newUser;
    saveDB(db);

    const { password: _pw, ...user } = newUser;
    localStorage.setItem('access_token', 'dev-token');
    localStorage.setItem('dev_user', JSON.stringify(user));
    return user;
  },

  async obterUsuarioAtual() {
    if (localStorage.getItem('access_token') === 'dev-token') {
      const user = getDevUser();
      if (!user) throw new Error('Sessão expirada.');
      return user;
    }
    const { data } = await api.get('/autenticacao/me');
    return normalizarUsuario(data?.usuario || data?.user || data);
  },

  async ativarModoTrabalhador(payload) {
    if (localStorage.getItem('access_token') === 'dev-token') {
      const current = getDevUser();
      const updated = { ...current, ...payload, mode: 'worker', accepted_terms: true, accepted_terms_at: new Date().toISOString() };
      const db = getDB();
      if (updated?.email && db[updated.email]) { db[updated.email] = { ...db[updated.email], ...updated }; saveDB(db); }
      localStorage.setItem('dev_user', JSON.stringify(updated));
      return updated;
    }
    const corpo = {
      cpf: payload.cpf || payload.document,
      data_nascimento: payload.data_nascimento || payload.birthDate,
      telefone: payload.telefone || payload.phone,
      url_avatar: payload.url_avatar || payload.avatar_url,
      endereco_id: payload.endereco_id || payload.addressId,
      numero_endereco: payload.numero_endereco || payload.addressNumber,
      complemento_endereco: payload.complemento_endereco || payload.complement,
      worker_profile: payload.worker_profile || {
        categoria: payload.category || (payload.services && payload.services[0]),
        servicos: payload.services || [],
        descricao: payload.bio || '',
      },
      keep_client: payload.keep_client !== false,
    };
    const { data } = await api.post('/perfil-trabalhador/ativar', corpo);
    const usuario = normalizarUsuario(data?.usuario || data?.user || data);
    localStorage.setItem('access_token', data.token_acesso || data.access_token || localStorage.getItem('access_token'));
    return usuario;
  },
  async alternarModo(mode) {
    if (localStorage.getItem('access_token') === 'dev-token') {
      const current = getDevUser();
      const updated = { ...current, mode };
      const db = getDB();
      if (current?.email && db[current.email]) {
        db[current.email].mode = mode;
        saveDB(db);
      }
      localStorage.setItem('dev_user', JSON.stringify(updated));
      return { access_token: 'dev-token' };
    }
    const { data } = await api.patch('/autenticacao/modo', { modo: mode });
    localStorage.setItem('access_token', data.token_acesso || data.access_token);
    return data;
  },

  sair() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('dev_user');
  },
};

export default servicoAutenticacao;
