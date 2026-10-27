import api from './clienteHttp';

export const apiPublicacoes = {
  feed: (lat, lng, tipo) => api.get('/publicacoes', { params: { lat, lng, tipo } }).then((r) => r.data.publicacoes),
  mine: () => api.get('/publicacoes/meus').then((r) => r.data),
  byWorker: (workerId) => api.get(`/publicacoes/trabalhador/${workerId}`).then((r) => r.data.publicacoes),
  saved: () => api.get('/publicacoes/salvos').then((r) => r.data.publicacoes),
  detail: (shortId) => api.get(`/publicacoes/${shortId}`).then((r) => r.data),

  comentarios: (shortId) => api.get(`/publicacoes/${shortId}/comentarios`).then((r) => r.data.comentarios),
  addComment: (shortId, conteudo) => api.post(`/publicacoes/${shortId}/comentarios`, { conteudo }).then((r) => r.data.comentario),
  removeComment: (shortId, commentId) => api.delete(`/publicacoes/${shortId}/comentarios/${commentId}`).then((r) => r.data),

  // `tipo_midia` não é enviado de propósito: quem decide se é foto ou vídeo é o backend, a partir do arquivo que foi realmente enviado.
  publish: ({ mediaUrls, caption, thumbnailUrl, durationSeconds }) =>
    api
      .post('/publicacoes', {
        media_urls: mediaUrls,
        caption,
        url_miniatura: thumbnailUrl,
        duracao_segundos: durationSeconds,
      })
      .then((r) => r.data.publicacao),

  remove: (shortId) => api.delete(`/publicacoes/${shortId}`).then((r) => r.data),
  registerView: (shortId) => api.post(`/publicacoes/${shortId}/visualizacao`).then((r) => r.data),

  like: (shortId) => api.post(`/publicacoes/${shortId}/curtir`).then((r) => r.data),
  unlike: (shortId) => api.delete(`/publicacoes/${shortId}/curtir`).then((r) => r.data),
  save: (shortId) => api.post(`/publicacoes/${shortId}/salvar`).then((r) => r.data),
  unsave: (shortId) => api.delete(`/publicacoes/${shortId}/salvar`).then((r) => r.data),
};
