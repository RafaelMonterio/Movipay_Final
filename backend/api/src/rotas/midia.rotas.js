const { Router } = require('express');
const { intermediarioAutenticacao } = require('../intermediarios/autenticacao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const { ErroApi, assert } = require('../intermediarios/tratamentoErros');
const {
  upload,
  registerUpload,
  excluirPorUrl,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  IMAGE_MIMES,
  VIDEO_MIMES,
} = require('../servicos/armazenamento');

const router = Router();

// Limites e tipos aceitos — o app consulta isso antes de abrir a galeria, para avisar o usuário ANTES de ele escolher um vídeo grande demais.
router.get('/limites', (req, res) => {
  res.json({
    maxImageBytes: MAX_IMAGE_BYTES,
    maxVideoBytes: MAX_VIDEO_BYTES,
    maxImageMB: Math.round(MAX_IMAGE_BYTES / (1024 * 1024)),
    maxVideoMB: Math.round(MAX_VIDEO_BYTES / (1024 * 1024)),
    imageMimes: IMAGE_MIMES,
    videoMimes: VIDEO_MIMES,
  });
});

/** * POST /api/v1/midia multipart/form-data — campo `files` (1 a 6 arquivos) + `purpose`. Aceita foto E vídeo. Devolve as URLs públicas já gravadas em disco, prontas para serem usa... */
router.post(
  '/',
  intermediarioAutenticacao,
  (req, res, next) =>
    upload.array('files', 6)(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ErroApi(400, `Arquivo muito grande. Limite de ${Math.round(MAX_VIDEO_BYTES / (1024 * 1024))} MB.`));
      }
      return next(new ErroApi(400, (err.mensagem || err.message) || 'Não foi possível receber o arquivo.'));
    }),
  lidarAssincrono(async (req, res) => {
    assert(req.files && req.files.length > 0, 400, 'Nenhum arquivo enviado.');

    const purpose = ['short', 'avatar', 'portfolio', 'other'].includes(req.body.purpose)
      ? req.body.purpose
      : 'short';

    const saved = [];
    for (const file of req.files) {
      const row = await registerUpload(file, { ownerId: req.usuario.id, purpose });
      saved.push({
        id: row.id,
        url: row.url_publica,
        kind: row.kind,
        mimeType: row.tipo_mime,
        sizeBytes: Number(row.tamanho_bytes),
      });
    }

    res.status(201).json({ files: saved });
  })
);

/** Remove um arquivo que o próprio usuário enviou (ex.: desistiu antes de publicar). */
router.delete(
  '/',
  intermediarioAutenticacao,
  lidarAssincrono(async (req, res) => {
    const url = req.query.url || req.body?.url;
    assert(url, 400, 'Informe a URL do arquivo a remover.');
    const removed = await excluirPorUrl(String(url), req.usuario.id);
    res.json({ removed });
  })
);

module.exports = router;
