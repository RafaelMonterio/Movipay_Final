/** * Provedor de pagamentos: Pix manual (chave própria da empresa). O que ele FAZ de verdade: monta o "Pix copia e cola" (BR Code) no padrão do Banco Central usando a chave de `PIX... */

const { montarCargaPix } = require('../../utilitarios/pix');

function isConfigured() {
  return Boolean(process.env.PIX_KEY);
}

function makeTxid(externalReference) {
  return `MOVIPAY${String(externalReference).replace(/[^A-Za-z0-9]/g, '')}`.slice(0, 25);
}

async function createPixPayment({ quantidade, descricao, externalReference, expiresInMinutes = 60 }) {
  const key = process.env.PIX_KEY;
  if (!key) {
    const err = new Error('Pagamento indisponível: configure PIX_KEY no .env do backend.');
    err.missingCredentials = true;
    throw err;
  }

  const payload = montarCargaPix({
    key,
    merchantName: process.env.PIX_MERCHANT_NAME || 'MOVIPAY',
    merchantCity: process.env.PIX_MERCHANT_CITY || 'RIBEIRAO PIRES',
    quantidade,
    txid: makeTxid(externalReference),
    descricao,
  });

  return {
    providerPaymentId: makeTxid(externalReference),
    estado: 'pending',
    statusDetail: 'Aguardando confirmação manual do recebimento.',
    pixPayload: payload,
    pixQrBase64: null,
    ticketUrl: null,
    expiresAt: new Date(Date.now() + expiresInMinutes * 60_000),
    raw: { provider: 'manual_pix', key_configured: true },
  };
}

async function getPayment(providerPaymentId) {
  // Não há a quem perguntar: o estado verdadeiro é o que está no banco.
  return { providerPaymentId, estado: null, statusDetail: null, raw: null };
}

async function createSubscription() {
  const err = new Error(
    'Assinatura recorrente não é possível com Pix manual. Configure PAYMENT_PROVIDER=mercadopago para cobrança recorrente automática.'
  );
  err.unsupported = true;
  throw err;
}

async function getSubscription() {
  return null;
}

async function cancelSubscription() {
  return { estado: 'cancelled' };
}

function verifyWebhookSignature() {
  return { ok: false, reason: 'Pix manual não recebe webhook.' };
}

module.exports = {
  id: 'manual_pix',
  label: 'Pix (chave própria)',
  supportsRecurring: false,
  requiresManualConfirmation: true,
  isConfigured,
  createPixPayment,
  getPayment,
  createSubscription,
  getSubscription,
  cancelSubscription,
  verifyWebhookSignature,
};
