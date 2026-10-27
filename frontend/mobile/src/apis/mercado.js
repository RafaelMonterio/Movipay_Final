import api from './clienteHttp';

export const apiCategorias = {
  list: () => api.get('/categorias').then((r) => r.data.categorias),
};

export const apiTrabalhadores = {
  search: (params = {}) => api.get('/trabalhadores', { params }).then((r) => r.data.trabalhadores),
  detail: (id) => api.get(`/trabalhadores/${id}`).then((r) => r.data),
  setAvailability: (id, isAvailable) =>
    api.patch(`/trabalhadores/${id}/disponibilidade`, { esta_disponivel: isAvailable }).then((r) => r.data),
  addPortfolioPhoto: (id, url, caption) => api.post(`/trabalhadores/${id}/portfolio`, { url, caption }).then((r) => r.data),
  removePortfolioPhoto: (id, photoId) => api.delete(`/trabalhadores/${id}/portfolio/${photoId}`),
  setSlots: (id, slots) => api.put(`/trabalhadores/${id}/horarios`, { slots }).then((r) => r.data),
};

export const apiServicos = {
  list: (params = {}) => api.get('/servicos', { params }).then((r) => r.data.servicos),
  create: (payload) => api.post('/servicos', payload).then((r) => r.data.servico),
  update: (id, payload) => api.patch(`/servicos/${id}`, payload).then((r) => r.data.servico),
  remove: (id) => api.delete(`/servicos/${id}`),
};

export const apiFavoritos = {
  list: () => api.get('/favoritos').then((r) => r.data.favoritos),
  add: (workerId) => api.post('/favoritos', { trabalhador_id: workerId }),
  remove: (workerId) => api.delete(`/favoritos/${workerId}`),
};
