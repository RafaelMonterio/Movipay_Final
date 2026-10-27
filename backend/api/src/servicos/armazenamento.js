/** * Armazenamento de arquivos (fotos e vídeos). Por que em disco e não base64 no banco: o app antigo mandava a foto como `data:image/jpeg;base64,...` dentro do próprio JSON. Isso... */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { consultarBanco } = require('../banco/conexao');

const RAIZ_UPLOADS = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', '..', 'uploads');

const PREFIXO_PUBLICO = '/uploads';

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm', 'video/3gpp'];

const MAX_IMAGE_BYTES = Number(process.env.MAX_IMAGE_MB || 12) * 1024 * 1024;
const MAX_VIDEO_BYTES = Number(process.env.MAX_VIDEO_MB || 120) * 1024 * 1024;

function ensureDirs() {
  for (const dir of ['images', 'videos', 'avatars']) {
    fs.mkdirSync(path.join(RAIZ_UPLOADS, dir), { recursive: true });
  }
}
ensureDirs();

function kindForMime(mime) {
  if (IMAGE_MIMES.includes(mime)) return 'image';
  if (VIDEO_MIMES.includes(mime)) return 'video';
  return null;
}

function extensionFor(file) {
  const fromName = path.extname(file.originalname || '').toLowerCase();
  if (fromName && fromName.length <= 6) return fromName;
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/heic': '.heic',
    'image/heif': '.heif',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'video/x-m4v': '.m4v',
    'video/webm': '.webm',
    'video/3gpp': '.3gp',
  };
  return map[file.mimetype] || '.bin';
}

function subdirFor(kind, purpose) {
  if (purpose === 'avatar') return 'avatars';
  return kind === 'video' ? 'videos' : 'images';
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const kind = kindForMime(file.mimetype);
    if (!kind) return cb(new Error('Tipo de arquivo não suportado.'));
    const dir = path.join(RAIZ_UPLOADS, subdirFor(kind, req.body?.purpose));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `${unique}${extensionFor(file)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_BYTES, files: 6 },
  fileFilter(req, file, cb) {
    const kind = kindForMime(file.mimetype);
    if (!kind) {
      return cb(new Error('Envie uma foto (JPG, PNG, WEBP) ou um vídeo (MP4, MOV, WEBM).'));
    }
    cb(null, true);
  },
});

function publicUrlFor(absolutePath) {
  const relative = path.relative(RAIZ_UPLOADS, absolutePath).split(path.sep).join('/');
  return `${PREFIXO_PUBLICO}/${relative}`;
}

/** * Registra no banco um arquivo já gravado em disco pelo multer. @returns {Promise<object>} linha de arquivos_midia */
async function registerUpload(file, { ownerId, purpose = 'short' }) {
  const kind = kindForMime(file.mimetype);
  const limit = kind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

  if (file.size > limit) {
    await safeUnlink(file.path);
    const mb = Math.round(limit / (1024 * 1024));
    throw Object.assign(new Error(`Arquivo muito grande. O limite é ${mb} MB.`), { estado: 400 });
  }

  const { rows } = await consultarBanco(
    `INSERT INTO arquivos_midia (dono_id, kind, purpose, caminho_armazenamento, url_publica, tipo_mime, tamanho_bytes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [ownerId, kind, purpose, file.path, publicUrlFor(file.path), file.mimetype, file.size]
  );
  return rows[0];
}

async function safeUnlink(filePath) {
  try {
    await fs.promises.unlink(filePath);
    return true;
  } catch {
    return false; // arquivo já removido ou inexistente — não é erro
  }
}

/** * Remove do disco e do banco um arquivo pelo URL público. URLs base64 (`data:...`) e URLs externas são ignoradas com segurança. */
async function excluirPorUrl(publicUrl, ownerId) {
  if (!publicUrl || !String(publicUrl).startsWith(PREFIXO_PUBLICO)) return false;

  const { rows } = await consultarBanco(
    `DELETE FROM arquivos_midia WHERE url_publica = $1 ${ownerId ? 'AND dono_id = $2' : ''} RETURNING caminho_armazenamento`,
    ownerId ? [publicUrl, ownerId] : [publicUrl]
  );
  if (!rows[0]) return false;

  // Trava de caminho: nunca apaga nada fora da pasta de uploads.
  const target = path.resolve(rows[0].caminho_armazenamento);
  if (!target.startsWith(path.resolve(RAIZ_UPLOADS))) return false;
  return safeUnlink(target);
}

module.exports = {
  upload,
  registerUpload,
  excluirPorUrl,
  publicUrlFor,
  RAIZ_UPLOADS,
  PREFIXO_PUBLICO,
  IMAGE_MIMES,
  VIDEO_MIMES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  kindForMime,
};
