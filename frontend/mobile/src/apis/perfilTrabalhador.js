import api from './clienteHttp';

export const apiPerfilTrabalhador = {
  requirements: () => api.get('/perfil-trabalhador/requisitos').then((r) => r.data),
  activate: (payload) => api.post('/perfil-trabalhador/ativar', payload).then((r) => r.data),
  mine: () => api.get('/perfil-trabalhador/me').then((r) => r.data),
  update: (payload) => api.patch('/perfil-trabalhador', payload).then((r) => r.data.perfil),
  responsavel: () => api.get('/perfil-trabalhador/responsavel').then((r) => r.data.responsavel),
  deactivate: () => api.post('/perfil-trabalhador/desativar').then((r) => r.data),
};
