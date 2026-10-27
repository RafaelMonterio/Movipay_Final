import api from './clienteHttp';

export const apiPlanos = {
  list: () => api.get('/planos').then((r) => r.data),
  mine: () => api.get('/planos/me').then((r) => r.data),
  subscribe: (slug, method = 'pix') => api.post(`/planos/${slug}/assinar`, { method }).then((r) => r.data),
  cancel: () => api.post('/planos/cancelar').then((r) => r.data),
  stats: () => api.get('/planos/estatisticas').then((r) => r.data),
};

export const apiPagamentos = {
  config: () => api.get('/pagamentos/configuracao').then((r) => r.data),
  wallet: () => api.get('/pagamentos/carteira').then((r) => r.data),
  historico: () => api.get('/pagamentos/historico').then((r) => r.data.pagamentos),
  // O app NUNCA envia valor: manda só o pedido, e o backend calcula bruto, comissão de 15% e líquido a partir do preço gravado.
  payService: (orderId, method = 'pix') =>
    api.post('/pagamentos/servico', { pedido_id: orderId, method }).then((r) => r.data),
  estado: (paymentId) => api.get(`/pagamentos/${paymentId}`).then((r) => r.data.pagamento),
  cancel: (paymentId) => api.post(`/pagamentos/${paymentId}/cancelar`).then((r) => r.data.pagamento),
};
