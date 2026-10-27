import api from './clienteHttp';

/** * Upload de arquivos (fotos e vídeos). Usa multipart/form-data de verdade, não base64. Isso importa porque vídeo em base64 cresce ~33% e estoura o limite do corpo da requisição... */
export const apiMidia = {
  limits: () => api.get('/midia/limites').then((r) => r.data),

  /** * @param {Array<{uri:string,nome?:string,tipo?:string}>} files @param {'short'|'avatar'|'portfolio'|'other'} purpose @param {(progress:number)=>void} onProgress 0..1 */
  upload: (files, purpose = 'short', onProgress) => {
    const form = new FormData();
    form.append('purpose', purpose);

    files.forEach((file, index) => {
      const nome = file.name || guessName(file, index);
      form.append('files', {
        uri: file.uri,
        nome,
        tipo: file.type || guessMime(nome),
      });
    });

    return api
      .post('/midia', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
        onUploadProgress: (event) => {
          if (onProgress && event.total) onProgress(event.loaded / event.total);
        },
      })
      .then((r) => r.data.files);
  },

  remove: (url) => api.delete('/midia', { params: { url } }).then((r) => r.data),
};

function guessName(file, index) {
  const fromUri = String(file.uri || '').split('/').pop();
  if (fromUri && fromUri.includes('.')) return fromUri;
  const ext = file.kind === 'video' ? 'mp4' : 'jpg';
  return `movipay-${Date.now()}-${index}.${ext}`;
}

function guessMime(nome) {
  const ext = String(nome).split('.').pop().toLowerCase();
  const map = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    m4v: 'video/x-m4v',
    webm: 'video/webm',
  };
  return map[ext] || 'application/octet-stream';
}

/** * Converte a URL relativa que o backend devolve (`/uploads/...`) na URL absoluta que o `<Image>`/`<VideoView>` consegue carregar. Como o app descobre o IP do servidor sozinho, i... */
export function urlMidiaAbsoluta(url) {
  if (!url) return null;
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('file:')) return url;
  const base = String(api.defaults.baseURL || '').replace(/\/api\/v1\/?$/, '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}
