import api from './clienteHttp';

export const apiPedidos = {
  list: (params = {}) => api.get('/pedidos', { params }).then((r) => r.data),
  detail: (id) => api.get(`/pedidos/${id}`).then((r) => r.data),
  create: (payload) => api.post('/pedidos', payload).then((r) => r.data.pedido),
  updateStatus: (id, estado, cancelReason) =>
    api.patch(`/pedidos/${id}/estado`, { estado, motivo_cancelamento: cancelReason }).then((r) => r.data.pedido),
};

export const apiOrcamentos = {
  list: (params = {}) => api.get('/orcamentos', { params }).then((r) => r.data),
  detail: (id) => api.get(`/orcamentos/${id}`).then((r) => r.data),
  create: (payload) => api.post('/orcamentos', payload).then((r) => r.data.orcamento),
  propose: (quoteId, price, mensagem) =>
    api.post(`/orcamentos/${quoteId}/propostas`, { price, mensagem }).then((r) => r.data.proposta),
  respondProposal: (quoteId, proposalId, estado) =>
    api.patch(`/orcamentos/${quoteId}/propostas/${proposalId}`, { estado }).then((r) => r.data),
  estimate: (categoryId, size, urgency) =>
    api.post('/orcamentos/estimativa', { categoria_id: categoryId, size, urgency }).then((r) => r.data),
  // "Melhor divulgação" — cria a cobrança de destaque de UM orçamento. O preço não é fixo no app: vem do backend (boostInfo), que por sua vez lê de pla...
  boostInfo: () => api.get('/orcamentos/informacoes-impulso').then((r) => r.data),
  boost: (quoteId) => api.post(`/orcamentos/${quoteId}/impulsionar`).then((r) => r.data),
};

export const apiAgenda = {
  eventos: (month, role) => api.get('/agenda/eventos', { params: { month, role } }).then((r) => r.data.eventos),
  events: (month, role) => api.get('/agenda/eventos', { params: { month, role } }).then((r) => r.data.eventos),
  schedule: (orderId, scheduledAt) =>
    api.post('/agenda/eventos', { pedido_id: orderId, agendado_para: scheduledAt }).then((r) => r.data.pedido),
  // Anotações manuais da agenda do trabalhador — tarefas/lembretes que não vêm de nenhum pedido.
  anotacoes: (month) => api.get('/agenda/anotacoes', { params: { month } }).then((r) => r.data.anotacoes),
  notes: (month) => api.get('/agenda/anotacoes', { params: { month } }).then((r) => r.data.anotacoes),
  createNote: (payload) => api.post('/agenda/anotacoes', payload).then((r) => r.data.note),
  updateNote: (id, payload) => api.patch(`/agenda/anotacoes/${id}`, payload).then((r) => r.data.note),
  deleteNote: (id) => api.delete(`/agenda/anotacoes/${id}`).then((r) => r.data),
};
