/** * Gerador de BR Code do Pix ("Pix copia e cola"). Implementa o padrão EMV®QRCPS adotado pelo Banco Central para o Pix: campos no formato ID + tamanho + valor, terminando com o C... */

/** Remove acentos e caracteres fora do ASCII imprimível (o padrão só aceita esses). */
function sanitize(text, maxLength) {
  const clean = String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
  return maxLength ? clean.slice(0, maxLength) : clean;
}

/** Monta um campo no formato ID(2) + tamanho(2) + valor. */
function field(id, value) {
  const str = String(value);
  const len = String(str.length).padStart(2, '0');
  return `${id}${len}${str}`;
}

/** CRC16-CCITT-FALSE (poly 0x1021, init 0xFFFF) — exigido pelo padrão. */
function crc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** * @param {object} params @param {string} params.key chave Pix (vem de process.env.PIX_KEY) @param {string} params.merchantName nome do recebedor (máx. 25) @param {string} params... */
function montarCargaPix({ key, merchantName, merchantCity, quantidade, txid, descricao }) {
  if (!key) throw new Error('PIX_KEY não configurada — defina a chave Pix no .env do backend.');

  const safeTxid = sanitize(txid || '***', 25).replace(/[^A-Za-z0-9]/g, '') || '***';

  // 26 — Merchant Account Information (bloco específico do Pix)
  let merchantAccount = field('00', 'br.gov.bcb.pix') + field('01', sanitize(key, 77));
  if (descricao) {
    const desc = sanitize(descricao, 72);
    if (desc) merchantAccount += field('02', desc);
  }

  let payload =
    field('00', '01') + // Payload Format Indicator
    field('01', '12') + // 12 = uso único (a cobrança tem valor e txid próprios)
    field('26', merchantAccount) +
    field('52', '0000') + // Merchant Category Code (não informado)
    field('53', '986'); // Moeda: BRL

  if (quantidade !== undefined && quantidade !== null && Number(quantidade) > 0) {
    payload += field('54', Number(quantidade).toFixed(2));
  }

  payload +=
    field('58', 'BR') +
    field('59', sanitize(merchantName || 'MOVIPAY', 25) || 'MOVIPAY') +
    field('60', sanitize(merchantCity || 'SAO PAULO', 15) || 'SAO PAULO') +
    field('62', field('05', safeTxid));

  // O CRC é calculado sobre o payload já com "6304" no fim.
  const withCrcTag = `${payload}6304`;
  return `${withCrcTag}${crc16(withCrcTag)}`;
}

/** Confere um payload recebido (útil em teste). */
function cargaPixValida(payload) {
  if (typeof payload !== 'string' || payload.length < 8) return false;
  const body = payload.slice(0, -4);
  const crc = payload.slice(-4).toUpperCase();
  return body.endsWith('6304') && crc16(body) === crc;
}

module.exports = { montarCargaPix, cargaPixValida, crc16, sanitize };
