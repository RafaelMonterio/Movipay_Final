import api from './clienteHttp';

export const addressApi = {
  search: (q) => api.get('/endereco/buscar', { params: { q } }).then((r) => r.data.results),
  lookupCep: (cep) => api.get(`/endereco/cep/${cep.replace(/\D/g, '')}`).then((r) => r.data.resultado),
  resolve: (payload) => api.post('/endereco/resolver', payload).then((r) => r.data.endereco),
  fromLocation: (lat, lng) => api.post('/endereco/da-localizacao', { lat, lng }).then((r) => r.data.resultado),
};
