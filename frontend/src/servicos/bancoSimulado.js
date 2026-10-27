/**
 * bancoSimulado.js
 * ─────────
 * Banco de dados local persistente (localStorage) para garantir que
 * o MoviPay funcione de forma 100% fluida, sem erros de "Erro ao carregar..."
 * em Orçamentos, Pedidos, Chat, Perfil e Trabalhadores.
 */

// Contas essenciais de demonstração — a ÚNICA lista de usuários "seed" do
// projeto (o servicoAutenticacao reaproveita exatamente esta lista). O MoviPay, nesta
// versão, atende só Ribeirão Pires/SP: todas as contas são da cidade, cada
// uma em um bairro real diferente, com coordenadas aproximadas desse bairro.
export const SEED_USERS = [
  {
    id: 1,
    name: 'Ana Cliente',
    email: 'ana@teste.com',
    password: '123456',
    mode: 'client',
    points: 280,
    phone: '(11) 99999-1111',
    bio: 'Cliente ativa do MoviPay. Busco serviços rápidos e de qualidade.',
    city: 'Ribeirão Pires',
    neighborhood: 'Centro',
    avatar_url: '',
    avg_rating: '5.0',
    total_orders: 12,
    lat: -23.7153,
    lng: -46.4194,
  },
  {
    id: 2,
    name: 'Bruno Silva',
    email: 'bruno@teste.com',
    password: '123456',
    mode: 'worker',
    points: 540,
    phone: '(11) 98888-2222',
    bio: 'Eletricista residencial e predial com 8 anos de experiência. Instalações e manutenções com garantia.',
    category: 'eletrica',
    icon: 'bolt',
    city: 'Ribeirão Pires',
    neighborhood: 'Centro',
    avatar_url: '',
    avg_rating: '4.9',
    total_orders: 28,
    is_verified: true,
    is_available: true,
    lat: -23.7142,
    lng: -46.4137,
  },

];

const CLIENT_NAME = (function(){ const u = SEED_USERS.find(x=>x.mode==='client'); return u ? u.name : 'Cliente'; })();

// Data ISO de "N meses atrás" (no dia `day` daquele mês) — relativa a quando o
// app roda, para o histórico de demonstração sempre cair em meses diferentes.
function dataMesesAtras(n, day = 10) {
  const d = new Date();
  d.setDate(1); d.setMonth(d.getMonth() - n); d.setDate(day); d.setHours(14, 0, 0, 0);
  return d.toISOString();
}

const SEED_ORDERS = [
  {
    id: 101,
    client_id: 1,
    worker_id: 2,
    client_name: CLIENT_NAME,
    worker_name: 'Bruno Silva',
    service_id: 1,
    service_title: 'Instalação de Tomadas e Disjuntor',
    price: '180.00',
    status: 'in_progress',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    scheduled_at: new Date(Date.now() + 3600000 * 2).toISOString(),
    address: 'Rua das Flores, 120 - Centro, Ribeirão Pires',
    notes: 'Troca de fiação no quarto e disjuntor geral do quadro de luz.',
  },
  {
    id: 110, client_id: 1, worker_id: 2, client_name: CLIENT_NAME, worker_name: 'Bruno Silva',
    service_id: 1, service_title: 'Instalação de chuveiro elétrico', price: '220.00', status: 'completed',
    created_at: dataMesesAtras(1, 3), scheduled_at: dataMesesAtras(1, 3),
    address: 'Rua das Flores, 120 - Centro, Ribeirão Pires', notes: 'Serviço concluído sem intercorrências.',
  },
  {
    id: 111, client_id: 1, worker_id: 2, client_name: CLIENT_NAME, worker_name: 'Bruno Silva',
    service_id: 1, service_title: 'Revisão do quadro de disjuntores', price: '340.00', status: 'completed',
    created_at: dataMesesAtras(1, 18), scheduled_at: dataMesesAtras(1, 18),
    address: 'Rua das Flores, 120 - Centro, Ribeirão Pires', notes: 'Serviço concluído sem intercorrências.',
  },
  {
    id: 120, client_id: 1, worker_id: 2, client_name: CLIENT_NAME, worker_name: 'Bruno Silva',
    service_id: 1, service_title: 'Troca de fiação e tomadas', price: '410.00', status: 'completed',
    created_at: dataMesesAtras(2, 5), scheduled_at: dataMesesAtras(2, 5),
    address: 'Rua das Flores, 120 - Centro, Ribeirão Pires', notes: 'Serviço concluído sem intercorrências.',
  },
  {
    id: 130, client_id: 1, worker_id: 2, client_name: CLIENT_NAME, worker_name: 'Bruno Silva',
    service_id: 1, service_title: 'Instalação de ventilador de teto', price: '160.00', status: 'completed',
    created_at: dataMesesAtras(4, 10), scheduled_at: dataMesesAtras(4, 10),
    address: 'Rua das Flores, 120 - Centro, Ribeirão Pires', notes: 'Serviço concluído sem intercorrências.',
  },
];

const SEED_QUOTES = [
  {
    id: 201,
    client_id: 1,
    client_name: CLIENT_NAME,
    title: 'Reforma Elétrica da Sala e Cozinha',
    description: 'Preciso trocar o quadro de luz e passar nova fiação para o ar condicionado.',
    category: 'eletrica',
    category_name: 'Elétrica',
    category_icon: 'bolt',
    budget_max: '650.00',
    city: 'Ribeirão Pires',
    status: 'open',
    proposal_count: 1,
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 5).toISOString(),
    proposals: [
      {
        id: 301,
        quote_id: 201,
        worker_id: 2,
        worker_name: 'Bruno Silva',
        price: '580.00',
        message: 'Olá Ana, realizo esse serviço com material de primeira e garantia de 1 ano. Posso iniciar na quarta-feira.',
        status: 'pending',
        avg_rating: '4.9',
        is_verified: true,
        total_orders: 28,
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
  },
];

const SEED_CHATS = {
  101: [
    {
      id: 401,
      order_id: 101,
      sender_id: 1,
      sender_name: CLIENT_NAME,
      content: 'Olá Bruno, você consegue vir por volta das 14h hoje?',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      is_read: true,
    },
    {
      id: 402,
      order_id: 101,
      sender_id: 2,
      sender_name: 'Bruno Silva',
      content: 'Olá Ana! Sim, já separei as ferramentas e os disjuntores. Às 14h pontual estarei aí.',
      created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      is_read: true,
    },
    {
      id: 403,
      order_id: 101,
      sender_id: 1,
      sender_name: CLIENT_NAME,
      content: 'Ótimo, o interfone é o 32. Muito obrigada!',
      created_at: new Date(Date.now() - 3600000 * 1.2).toISOString(),
      is_read: true,
    },
    {
      id: 404,
      order_id: 101,
      sender_id: 2,
      sender_name: 'Bruno Silva',
      content: 'Perfeito, até logo!',
      created_at: new Date(Date.now() - 3600000 * 0.9).toISOString(),
      is_read: true,
    },
  ],
};

const STORAGE_MIGRATION_KEY = 'movipay_storage_migration_v1';
const RETIRED_DEMO_USER_IDS = new Set([3, 4, 5, 6, 7, 8]);

function readRawStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function migrateStorageOnce() {
  if (typeof window === 'undefined' || localStorage.getItem(STORAGE_MIGRATION_KEY)) return;
  try {
    const orders = readRawStorage('movipay_orders', SEED_ORDERS);
    const validOrders = Array.isArray(orders)
      ? orders.filter(o => !RETIRED_DEMO_USER_IDS.has(Number(o.client_id)) && !RETIRED_DEMO_USER_IDS.has(Number(o.worker_id)))
      : SEED_ORDERS;
    setStorage('movipay_orders', validOrders);

    const quotes = readRawStorage('movipay_quotes', SEED_QUOTES);
    const validQuotes = Array.isArray(quotes) ? quotes
      .filter(q => !RETIRED_DEMO_USER_IDS.has(Number(q.client_id)))
      .map(q => ({
        ...q,
        proposals: Array.isArray(q.proposals)
          ? q.proposals.filter(proposal => !RETIRED_DEMO_USER_IDS.has(Number(proposal.worker_id)))
          : [],
      })) : SEED_QUOTES;
    setStorage('movipay_quotes', validQuotes);

    const chats = readRawStorage('movipay_chats', SEED_CHATS);
    if (chats && typeof chats === 'object') {
      const validOrderIds = new Set(validOrders.map(o => String(o.id)));
      const validChats = Object.fromEntries(Object.entries(chats).filter(([threadId]) => validOrderIds.has(String(threadId))));
      setStorage('movipay_chats', validChats);
    }

    const directThreads = readRawStorage('movipay_direct_threads', []);
    if (Array.isArray(directThreads)) {
      setStorage('movipay_direct_threads', directThreads.filter(t =>
        !RETIRED_DEMO_USER_IDS.has(Number(t.client_id)) && !RETIRED_DEMO_USER_IDS.has(Number(t.worker_id))));
    }

    // A conta de demonstração é uma fonte fixa; contas criadas pelo usuário continuam válidas.
    const users = readRawStorage('movipay_users_db', {});
    if (users && typeof users === 'object') {
      const cleanedUsers = Object.fromEntries(Object.entries(users).filter(([, user]) =>
        !RETIRED_DEMO_USER_IDS.has(Number(user?.id))));
      setStorage('movipay_users_db', cleanedUsers);
    }
  } finally {
    localStorage.setItem(STORAGE_MIGRATION_KEY, '1');
  }
}

function getCurrentUser() {
  return readRawStorage('dev_user', null) || SEED_USERS[0];
}

function belongsToUser(record, user = getCurrentUser()) {
  if (!record || !user) return false;
  return String(record.client_id) === String(user.id) || String(record.worker_id) === String(user.id);
}

function getStorage(key, fallback) {
  migrateStorageOnce();
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage(key, value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

export const bancoSimulado = {
  listarPedidos() {
    const user = getCurrentUser();
    return getStorage('movipay_orders', SEED_ORDERS).filter(order => belongsToUser(order, user));
  },

  obterPedidoPorId(id) {
    const orders = this.listarPedidos();
    return orders.find(o => String(o.id) === String(id)) || orders[0] || null;
  },

  criarPedido(serviceId) {
    const orders = getStorage('movipay_orders', SEED_ORDERS);
    const me = getCurrentUser();
    const client = me?.mode === 'client' ? me : SEED_USERS.find(u => u.mode === 'client');
    const worker = me?.mode === 'worker' ? me : SEED_USERS.find(u => u.mode === 'worker');
    const newOrder = {
      id: Date.now(),
      client_id: client?.id,
      worker_id: worker?.id,
      client_name: client?.name || 'Cliente',
      worker_name: worker?.name || 'Profissional',
      service_id: serviceId || 1,
      service_title: 'Serviço Solicitado',
      price: '150.00',
      status: 'pending',
      created_at: new Date().toISOString(),
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      address: 'Rua das Flores, 120 - Centro',
      notes: 'Solicitação criada pelo cliente.',
    };
    orders.unshift(newOrder);
    setStorage('movipay_orders', orders);
    return newOrder;
  },

  atualizarStatusPedido(id, status, cancelReason = null) {
    const orders = this.listarPedidos();
    const idx = orders.findIndex(o => String(o.id) === String(id));
    if (idx !== -1) {
      orders[idx].status = status;
      if (cancelReason) orders[idx].cancel_reason = cancelReason;
      orders[idx].updated_at = new Date().toISOString();
      setStorage('movipay_orders', orders);
      return orders[idx];
    }
    return null;
  },

  listarOrcamentos() {
    const user = getCurrentUser();
    return getStorage('movipay_quotes', SEED_QUOTES)
      .filter(quote => String(quote.client_id) === String(user?.id) || (user?.mode === 'worker' && (quote.status === 'open' || (quote.proposals || []).some(p => String(p.worker_id) === String(user.id)))))
      .map(quote => user?.mode === 'worker'
        ? { ...quote, proposals: (quote.proposals || []).filter(p => String(p.worker_id) === String(user.id)) }
        : quote);
  },

  obterOrcamentoPorId(id) {
    const quotes = this.listarOrcamentos();
    return quotes.find(q => String(q.id) === String(id)) || quotes[0] || null;
  },

  criarOrcamento(payload) {
    const quotes = getStorage('movipay_quotes', SEED_QUOTES);
    const client = getCurrentUser();
    const newQuote = {
      id: Date.now(),
      client_id: client?.id,
      client_name: client?.name || 'Cliente',
      title: payload.title,
      description: payload.description,
      category: payload.category || 'eletrica',
      category_name: (payload.category || 'Geral').toUpperCase(),
      category_icon: 'bolt',
      budget_max: payload.budget_max ? String(payload.budget_max) : '0.00',
      city: payload.city || 'Ribeirão Pires',
      status: 'open',
      proposal_count: 0,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
      proposals: [],
    };
    quotes.unshift(newQuote);
    setStorage('movipay_quotes', quotes);
    return newQuote;
  },

  criarProposta(quoteId, payload) {
    const quotes = getStorage('movipay_quotes', SEED_QUOTES);
    const quote = quotes.find(q => String(q.id) === String(quoteId));
    if (quote) {
      const newProposal = {
        id: Date.now(),
        quote_id: quoteId,
        worker_id: getCurrentUser()?.id,
        worker_name: getCurrentUser()?.name || 'Profissional',
        price: String(payload.price || '200.00'),
        message: payload.message || '',
        status: 'pending',
        avg_rating: '4.9',
        is_verified: true,
        total_orders: 28,
        created_at: new Date().toISOString(),
      };
      quote.proposals = quote.proposals || [];
      quote.proposals.push(newProposal);
      quote.proposal_count = quote.proposals.length;
      setStorage('movipay_quotes', quotes);
      return newProposal;
    }
    return null;
  },

  atualizarStatusProposta(quoteId, proposalId, status) {
    const quotes = this.listarOrcamentos();
    const quote = quotes.find(q => String(q.id) === String(quoteId));
    if (quote && quote.proposals) {
      const prop = quote.proposals.find(p => String(p.id) === String(proposalId));
      if (prop) {
        prop.status = status;
        if (status === 'accepted') quote.status = 'in_review';
        setStorage('movipay_quotes', quotes);
        return prop;
      }
    }
    return null;
  },

  listarMensagens(threadId) {
    const user = getCurrentUser();
    const order = getStorage('movipay_orders', SEED_ORDERS).find(o => String(o.id) === String(threadId));
    const direct = this.listarConversasDiretas().find(t => String(t.id) === String(threadId));
    if (!belongsToUser(order || direct, user)) return [];
    const allChats = getStorage('movipay_chats', SEED_CHATS);
    return allChats[threadId] || [];
  },

  enviarMensagem(threadId, senderId, content, senderName = 'Você') {
    const allChats = getStorage('movipay_chats', SEED_CHATS);
    if (!allChats[threadId]) allChats[threadId] = [];
    const newMsg = {
      id: Date.now(), thread_id: threadId, sender_id: senderId || 1, sender_name: senderName,
      content: content.trim(), created_at: new Date().toISOString(), is_read: false,
    };
    allChats[threadId].push(newMsg);
    setStorage('movipay_chats', allChats);
    return newMsg;
  },

  // Marca como lidas as mensagens da conversa que NÃO são do usuário atual
  // (antes a contagem de "não lidas" era um número aleatório).
  marcarConversaLida(threadId, userId) {
    const allChats = getStorage('movipay_chats', SEED_CHATS);
    const msgs = allChats[threadId];
    if (!msgs || !msgs.length) return;
    let changed = false;
    msgs.forEach(m => { if (String(m.sender_id) !== String(userId) && !m.is_read) { m.is_read = true; changed = true; } });
    if (changed) setStorage('movipay_chats', allChats);
  },

  // Conversas sem pedido associado (cliente fala com o profissional antes de fechar negócio).
  listarConversasDiretas() { return getStorage('movipay_direct_threads', []); },

  // Reaproveita um pedido existente entre os dois (se houver) ou uma conversa
  // direta já criada; só cria nova se nenhuma existir.
  garantirConversaCom(clientId, clientName, workerId, workerName) {
    const existingOrder = this.listarPedidos().find(o => String(o.client_id) === String(clientId) && String(o.worker_id) === String(workerId));
    if (existingOrder) return { thread_id: String(existingOrder.id), is_new: false };
    const threads = this.listarConversasDiretas();
    let thread = threads.find(t => String(t.client_id) === String(clientId) && String(t.worker_id) === String(workerId));
    if (!thread) {
      thread = { id: `direct-${clientId}-${workerId}`, client_id: clientId, client_name: clientName, worker_id: workerId, worker_name: workerName,
        service_title: 'Conversa direta', status: 'direct', created_at: new Date().toISOString() };
      threads.push(thread);
      setStorage('movipay_direct_threads', threads);
    }
    return { thread_id: thread.id, is_new: true };
  },

  // Lista unificada (pedidos + diretas) já com o CONTATO correto (nunca o
  // próprio usuário) e a contagem real de não lidas.
  listarConversas() {
    const me = this.obterUsuarioAtual();
    if (!me) return [];
    const isWorker = me.mode === 'worker';
    const allChats = getStorage('movipay_chats', SEED_CHATS);
    const fromOrders = this.listarPedidos()
      .filter(o => isWorker ? String(o.worker_id) === String(me.id) : String(o.client_id) === String(me.id))
      .filter(o => ['pending', 'accepted', 'in_progress', 'completed'].includes(o.status))
      .map(o => ({ ...o, thread_id: String(o.id) }));
    const fromDirect = this.listarConversasDiretas()
      .filter(t => isWorker ? String(t.worker_id) === String(me.id) : String(t.client_id) === String(me.id))
      .map(t => ({ ...t, thread_id: t.id }));
    return [...fromOrders, ...fromDirect].map(c => {
      const msgs = allChats[c.thread_id] || [];
      return {
        ...c,
        contact_id: isWorker ? c.client_id : c.worker_id,
        contact_name: (isWorker ? c.client_name : c.worker_name) || 'Contato',
        unread_count: msgs.filter(m => String(m.sender_id) !== String(me.id) && !m.is_read).length,
        last_message: msgs[msgs.length - 1] || null,
      };
    }).sort((a, b) => new Date(b.last_message?.created_at || b.created_at) - new Date(a.last_message?.created_at || a.created_at));
  },

  listarProfissionais() {
    // Combina os prestadores de demonstração com QUALQUER conta real
    // cadastrada pelo formulário de registro (servicos/servicoAutenticacao.js),
    // que fica salva em 'movipay_users_db'. Assim, um profissional que se
    // cadastra de verdade — com o bairro/localização que ele escolheu —
    // aparece no mapa e nas buscas com a localização real dele, e não fica
    // "invisível" atrás de uma lista fixa de contas fictícias.
    const registered = Object.values(getStorage('movipay_users_db', {}));
    const registeredWorkers = registered.filter(u => u.mode === 'worker');

    const byEmail = new Map();
    SEED_USERS.filter(u => u.mode === 'worker').forEach(w => byEmail.set(w.email, w));
    registeredWorkers.forEach(w => {
      byEmail.set(w.email, { is_available: true, ...byEmail.get(w.email), ...w });
    });

    return Array.from(byEmail.values()).map(({ password, ...rest }) => rest);
  },

  obterProfissionalPorId(id) {
    const workers = this.listarProfissionais();
    return workers.find(w => String(w.id) === String(id)) || workers[0] || null;
  },

  obterUsuarioAtual() {
    return getCurrentUser();
  },

  atualizarUsuario(id, payload) {
    const devUser = this.obterUsuarioAtual();
    const updated = { ...devUser, ...payload };
    setStorage('dev_user', updated);

    // Se esta conta veio de um cadastro real (está em 'movipay_users_db'),
    // sincroniza a alteração também lá — assim ela passa a valer para todo
    // mundo (mapa, listagem de profissionais etc.), e não só na sessão atual.
    if (updated.email) {
      const db = getStorage('movipay_users_db', {});
      if (db[updated.email]) {
        db[updated.email] = { ...db[updated.email], ...payload };
        setStorage('movipay_users_db', db);
      }
    }

    return updated;
  },
};
