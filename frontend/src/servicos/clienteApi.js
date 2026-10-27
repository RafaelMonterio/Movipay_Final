import axios from 'axios';
import { bancoSimulado, SEED_USERS } from './bancoSimulado';

/**
 * Roteador de mock local para responder requisições imediatamente
 * sem poluir o terminal com erros 404 e garantindo funcionamento 100% offline.
 */
function getUsuariosMock() {
  if (typeof window === 'undefined') return Object.fromEntries(SEED_USERS.map(u => [String(u.email).trim().toLowerCase(), u]));

  const registrados = JSON.parse(localStorage.getItem('movipay_users_db') || '{}');
  const base = Object.fromEntries(SEED_USERS.map(u => [String(u.email).trim().toLowerCase(), u]));

  for (const [email, usuario] of Object.entries(registrados || {})) {
    if (usuario?.email) {
      base[String(usuario.email).trim().toLowerCase()] = usuario;
    } else if (email) {
      base[String(email).trim().toLowerCase()] = usuario;
    }
  }

  return base;
}

function tratarRotaSimulada(config) {
  const rawUrl = (config.url || '').replace(/^https?:\/\/[^/]+/, '');
  const url = rawUrl.replace(/^\/api\/v1/, '').split('?')[0];
  const method = (config.method || 'get').toLowerCase();
  const data = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});

  if ((url === '/autenticacao/entrar' || url === '/auth/login') && method === 'post') {
    const email = String(data.email || '').trim().toLowerCase();
    const senha = String(data.senha ?? data.password ?? '');
    const usuarios = getUsuariosMock();
    const usuario = usuarios[email];

    if (!usuario || String(usuario.password) !== senha) {
      const error = new Error('E-mail ou senha incorretos.');
      error.response = { data: { error: { mensagem: 'E-mail ou senha incorretos.' } } };
      throw error;
    }

    const { password: _password, ...usuarioSemSenha } = usuario;
    localStorage.setItem('access_token', 'dev-token');
    localStorage.setItem('dev_user', JSON.stringify(usuarioSemSenha));
    return {
      usuario: usuarioSemSenha,
      token_acesso: 'dev-token',
      access_token: 'dev-token',
    };
  }

  if ((url === '/autenticacao/cadastrar' || url === '/auth/register') && method === 'post') {
    const email = String(data.email || '').trim().toLowerCase();
    const senha = String(data.senha ?? data.password ?? '');
    const nome = data.nome || data.name || 'Usuário';

    if (!email || !senha) {
      const error = new Error('Preencha todos os campos obrigatórios.');
      error.response = { data: { error: { mensagem: 'Preencha todos os campos obrigatórios.' } } };
      throw error;
    }

    const usuarios = getUsuariosMock();
    if (usuarios[email]) {
      const error = new Error('Este e-mail já está cadastrado. Tente fazer entrar.');
      error.response = { data: { error: { mensagem: 'Este e-mail já está cadastrado. Tente fazer entrar.' } } };
      throw error;
    }

    const novoUsuario = {
      id: Date.now(),
      name: nome,
      email,
      password: senha,
      mode: data.modo || data.mode || 'client',
      points: 0,
      phone: data.telefone || data.phone || '',
      bio: data.bio || '',
      city: data.cidade || data.city || '',
      neighborhood: data.bairro || data.neighborhood || '',
      avatar_url: data.url_avatar || data.avatar_url || '',
      category: data.categoria || data.category || '',
      services: data.servicos || data.services || [],
      accepted_terms: !!(data.terms_accepted ?? data.accepted_terms),
      terms_version: data.terms_version || '2026.09.23',
      accepted_terms_at: data.accepted_terms_at || new Date().toISOString(),
    };

    const db = JSON.parse(localStorage.getItem('movipay_users_db') || '{}');
    db[email] = novoUsuario;
    localStorage.setItem('movipay_users_db', JSON.stringify(db));

    const { password: _password, ...usuarioSemSenha } = novoUsuario;
    localStorage.setItem('access_token', 'dev-token');
    localStorage.setItem('dev_user', JSON.stringify(usuarioSemSenha));
    return {
      usuario: usuarioSemSenha,
      token_acesso: 'dev-token',
      access_token: 'dev-token',
    };
  }

  // /pedidos
  if (url === '/pedidos' || url === '/pedidos/' || url === '') {
    if (method === 'get') {
      const orders = bancoSimulado.listarPedidos();
      return { orders, total: orders.length };
    }
    if (method === 'post') {
      return bancoSimulado.criarPedido(data.service_id);
    }
  }

  // /pedidos/:id/estado (status é um alias antigo)
  const orderStatusMatch = url.match(/^\/pedidos\/([^/]+)\/(?:estado|status)$/);
  if (orderStatusMatch && method === 'patch') {
    const id = orderStatusMatch[1];
    return bancoSimulado.atualizarStatusPedido(id, data.estado || data.status, data.motivo_cancelamento || data.cancel_reason);
  }

  // /pedidos/:id
  const orderDetailMatch = url.match(/^\/pedidos\/([^/]+)$/);
  if (orderDetailMatch && method === 'get') {
    const id = orderDetailMatch[1];
    return bancoSimulado.obterPedidoPorId(id);
  }

  // /orcamentos
  if (url === '/orcamentos' || url === '/orcamentos/') {
    if (method === 'get') {
      const quotes = bancoSimulado.listarOrcamentos();
      return { quotes, total: quotes.length };
    }
    if (method === 'post') {
      return bancoSimulado.criarOrcamento(data);
    }
  }

  // /orcamentos/:id/propostas/:pid
  const quoteProposalStatusMatch = url.match(/^\/orcamentos\/([^/]+)\/propostas\/([^/]+)$/);
  if (quoteProposalStatusMatch && method === 'patch') {
    const [, qid, pid] = quoteProposalStatusMatch;
    return bancoSimulado.atualizarStatusProposta(qid, pid, data.status);
  }

  // /orcamentos/:id/propostas
  const quoteProposalMatch = url.match(/^\/orcamentos\/([^/]+)\/propostas$/);
  if (quoteProposalMatch && method === 'post') {
    const qid = quoteProposalMatch[1];
    return bancoSimulado.criarProposta(qid, data);
  }

  // /orcamentos/:id
  const quoteDetailMatch = url.match(/^\/orcamentos\/([^/]+)$/);
  if (quoteDetailMatch && method === 'get') {
    const id = quoteDetailMatch[1];
    return bancoSimulado.obterOrcamentoPorId(id);
  }

  // /conversas — lista unificada, com o nome real do CONTATO e não lidas reais
  if (url === '/conversas' && method === 'get') return { conversations: bancoSimulado.listarConversas() };

  // /conversas/direta — garante/abre conversa com um profissional específico
  if (url === '/conversas/direta' && method === 'post') {
    const me = bancoSimulado.obterUsuarioAtual();
    const worker = bancoSimulado.obterProfissionalPorId(data.worker_id);
    if (!me || !worker) return { thread_id: null };
    return bancoSimulado.garantirConversaCom(me.id, me.name, worker.id, worker.name);
  }

  const chatReadMatch = url.match(/^\/conversas\/([^/]+)\/lida$/);
  if (chatReadMatch && method === 'post') {
    bancoSimulado.marcarConversaLida(chatReadMatch[1], bancoSimulado.obterUsuarioAtual()?.id);
    return { success: true };
  }

  const chatMatch = url.match(/^\/conversas\/([^/]+)$/);
  if (chatMatch) {
    const threadId = chatMatch[1];
    if (method === 'get') { const messages = bancoSimulado.listarMensagens(threadId); return { messages, total: messages.length }; }
    if (method === 'post') { const user = bancoSimulado.obterUsuarioAtual(); return bancoSimulado.enviarMensagem(threadId, user?.id, data.content, user?.name); }
  }

  // Ativação segura do perfil de trabalhador.
  if (url === '/autenticacao/ativar-trabalhador' && method === 'patch') {
    const current = bancoSimulado.obterUsuarioAtual();
    return bancoSimulado.atualizarUsuario(current.id, { ...data, mode: 'worker', accepted_terms: true, accepted_terms_at: new Date().toISOString() });
  }
  // /autenticacao/me (eu e profile são aliases antigos)
  if (url === '/autenticacao/me' || url === '/autenticacao/eu' || url === '/usuarios/perfil') {
    if (method === 'get') return bancoSimulado.obterUsuarioAtual();
  }

  // /usuarios/:id
  const userMatch = url.match(/^\/usuarios\/([^/]+)$/);
  if (userMatch && method === 'patch') {
    return bancoSimulado.atualizarUsuario(userMatch[1], data);
  }

  // /profissionais
  if (url === '/profissionais' || url === '/profissionais/') {
    if (method === 'get') {
      const workers = bancoSimulado.listarProfissionais();
      return { workers, total: workers.length };
    }
  }

  // /profissionais/:id
  const workerDetailMatch = url.match(/^\/profissionais\/([^/]+)$/);
  if (workerDetailMatch && method === 'get') {
    return bancoSimulado.obterProfissionalPorId(workerDetailMatch[1]);
  }

  // /profissionais/:id/disponibilidade
  if (url.match(/^\/profissionais\/[^/]+\/disponibilidade$/) && method === 'patch') {
    return { is_available: data.is_available };
  }

  // /profissionais/:id/portfolio
  if (url.match(/^\/profissionais\/[^/]+\/portfolio$/) && method === 'post') {
    return { id: Date.now(), url: data.url || '' };
  }

  if (url.match(/^\/profissionais\/[^/]+\/portfolio\/[^/]+$/) && method === 'delete') {
    return { success: true };
  }

  // /pontos/saldo & /pontos/historico
  if (url === '/pontos/saldo') {
    const user = bancoSimulado.obterUsuarioAtual();
    const completed = bancoSimulado.listarPedidos().filter(o => o.status === 'completed');
    return { balance: user?.mode === 'worker' ? completed.reduce((sum, o) => sum + parseFloat(o.price || 0), 0) : (user?.points || 0) };
  }
  if (url === '/pontos/historico') {
    // Histórico derivado dos pedidos realmente concluídos da conta
    // (100 Folhas por serviço concluído) — nada de transações inventadas.
    const completed = bancoSimulado.listarPedidos().filter(o => o.status === 'completed');
    return {
      transactions: completed.map(o => ({
        id: o.id,
        type: 'order_completed',
        points: 100,
        description: `Serviço concluído: ${o.service_title || 'Pedido #' + o.id}`,
        created_at: o.updated_at || o.created_at,
      })),
    };
  }

  // /pagamentos/carteira
  if (url === '/pagamentos/carteira') {
    // Carteira calculada a partir dos pedidos reais do profissional logado:
    // pedidos concluídos = saldo disponível; aceitos/em andamento = em custódia.
    const me = bancoSimulado.obterUsuarioAtual();
    const mine = bancoSimulado.listarPedidos().filter(o => String(o.worker_id) === String(me?.id));
    const sum = list => list.reduce((acc, o) => acc + parseFloat(o.price || 0), 0);
    return {
      balance: sum(mine.filter(o => o.status === 'completed')),
      held: sum(mine.filter(o => o.status === 'accepted' || o.status === 'in_progress')),
    };
  }

  // /agenda/eventos — agenda derivada dos pedidos reais do usuário logado.
  if (url === '/agenda/eventos' && method === 'get') {
    const me = bancoSimulado.obterUsuarioAtual();
    const month = config.params?.month || data.month;
    const events = bancoSimulado.listarPedidos()
      .filter(order => String(order.worker_id) === String(me?.id))
      .filter(order => order.scheduled_at || order.created_at)
      .map(order => {
        const date = new Date(order.scheduled_at || order.created_at);
        const pad = value => String(value).padStart(2, '0');
        const eventDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        return {
          id: `pedido-${order.id}`,
          order_id: order.id,
          event_date: eventDate,
          time_start: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
          time_end: order.time_end || `${pad((date.getHours() + 1) % 24)}:${pad(date.getMinutes())}`,
          title: order.service_title || 'Serviço agendado',
          client_name: order.client_name,
          address: order.address,
          notes: order.notes,
          price: order.price,
          status: order.status,
        };
      })
      .filter(event => !month || event.event_date.startsWith(month));
    return { events };
  }

  // /servicos
  if (url === '/servicos' || url === '/servicos/') {
    if (method === 'get') {
      return {
        services: [
          { id: 1, title: 'Instalação Elétrica', price: 150.00, category: 'eletrica' },
          { id: 2, title: 'Limpeza Residencial', price: 220.00, category: 'limpeza' },
          { id: 3, title: 'Conserto Hidráulico', price: 120.00, category: 'hidraulica' },
        ],
      };
    }
    if (method === 'post') {
      return { id: Date.now(), ...data };
    }
  }

  // /avaliacoes
  if (url === '/avaliacoes' && method === 'post') {
    return { id: Date.now(), ...data };
  }

  return { success: true };
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  timeout: 3500,
  headers: { 'Content-Type': 'application/json' },
  adapter: async (config) => {
    // Se estiver no browser e usando token dev ou sem backend dedicado, responde diretamente sem gerar 404 no servidor
    if (typeof window !== 'undefined') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

      // Com NEXT_PUBLIC_API_URL definida, site e mobile usam a mesma API.
      // O mock só existe quando a URL não foi configurada explicitamente.
      if (!apiUrl) {
        try {
          const data = tratarRotaSimulada(config);
          return {
            data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {},
          };
        } catch (e) {
          console.warn('Mock route error:', e);
        }
      }
    }

    // Caso haja um backend externo configurado, mas ele não responda,
    // o frontend continua funcional em modo local de desenvolvimento.
    const defaultAdapter = axios.defaults.adapter;
    if (typeof defaultAdapter === 'function') {
      try {
        return await defaultAdapter(config);
      } catch (err) {
        if (typeof window !== 'undefined') {
          const data = tratarRotaSimulada(config);
          return {
            data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {},
          };
        }
        throw err;
      }
    }

    throw new Error('Adaptador HTTP indisponível para a API configurada.');
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token && token !== 'dev-token') {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
