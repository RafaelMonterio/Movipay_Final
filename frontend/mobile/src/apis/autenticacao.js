import api from './clienteHttp';

export const apiAutenticacao = {
  login: (email, senha) => api.post('/autenticacao/entrar', { email, senha }).then((r) => r.data),
  register: (payload) => api.post('/autenticacao/cadastrar', payload).then((r) => r.data),
  me: () => api.get('/autenticacao/me').then((r) => r.data),
  alternarModo: (modo) => api.patch('/autenticacao/modo', { modo }).then((r) => r.data),
  atualizarPerfil: (userId, payload) => api.patch(`/usuarios/${userId}`, payload).then((r) => r.data),
  claimDailyBonus: () => api.post('/autenticacao/bonus-diario').then((r) => r.data),
  // Consulta prévia de idade/CPF, para o formulário avisar antes de enviar. O bloqueio de verdade é do backend, não desta chamada.
  checkEligibility: (payload) => api.post('/autenticacao/verificar-elegibilidade', payload).then((r) => r.data),
  atualizarAvatar: (userId, avatarUrl) =>
    api.put(`/usuarios/${userId}/avatar`, { url_avatar: avatarUrl }).then((r) => r.data),
  removeAvatar: (userId) => api.delete(`/usuarios/${userId}/avatar`).then((r) => r.data),
};
