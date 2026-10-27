import api from './clienteHttp';

export const apiConversas = {
  conversas: () => api.get('/conversas').then((r) => r.data.conversas),

  // Conversa direta — é o que os botões "Chat" (perfil) e "Contato" (Shorts) chamam. Passando `publicacao_id`, quem resolve o dono da publicação é o backend...
  openDirect: ({ userId, shortId, origin }) =>
    api.post('/conversas/direta', { usuario_id: userId, publicacao_id: shortId, origin }).then((r) => r.data.conversation),

  thread: (conversationId) => api.get(`/conversas/conversa/${conversationId}`).then((r) => r.data),
  sendToConversation: (conversationId, conteudo, orderId) =>
    api.post(`/conversas/conversa/${conversationId}`, { conteudo, pedido_id: orderId }).then((r) => r.data.mensagem),

  // Compatibilidade com as telas que abrem o chat pelo pedido.
  messages: (orderId) => api.get(`/conversas/${orderId}`).then((r) => r.data.messages),
  send: (orderId, conteudo) => api.post(`/conversas/${orderId}`, { conteudo }).then((r) => r.data.mensagem),
};

export const apiAvaliacoes = {
  create: (orderId, rating, comment) =>
    api.post('/avaliacoes', { pedido_id: orderId, rating, comentario: comment }).then((r) => r.data),
  mine: () => api.get('/avaliacoes/meus').then((r) => r.data.avaliacoes),
};

export const apiPontos = {
  balance: () => api.get('/pontos/saldo').then((r) => r.data),
  history: (page = 1) => api.get('/pontos/historico', { params: { page } }).then((r) => r.data.historico),
};

export const apiCarteira = {
  get: () => api.get('/pagamentos/carteira').then((r) => r.data),
};

export const apiAtividades = {
  recent: () => api.get('/atividade/recent').then((r) => r.data.atividade),
};
