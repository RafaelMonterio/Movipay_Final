/** * Provedor de pagamentos: Mercado Pago. Escolhido por ser o gateway mais acessível no Brasil que atende os três requisitos do projeto ao mesmo tempo: Pix com QR Code, confirmaçã... */

const crypto = require('crypto');

const API = 'https://api.mercadopago.com';

function accessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    const err = new Error(
      'Pagamento indisponível: configure MERCADOPAGO_ACCESS_TOKEN no .env do backend.'
    );
    err.missingCredentials = true;
    throw err;
  }
  return token;
}

function isConfigured() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

async function request(path, { method = 'GET', body, idempotencyKey } = {}) {
  const headers = {
    Authorization: `Bearer ${accessToken()}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const mensagem = data?.message || data?.error || `Mercado Pago respondeu ${res.status}`;
    const err = new Error(mensagem);
    err.providerStatus = res.status;
    err.providerPayload = data;
    throw err;
  }
  return data;
}

/** Converte o estado do Mercado Pago para o estado interno do MoviPay. */
function mapStatus(mpStatus) {
  switch (mpStatus) {
    case 'approved':
      return 'approved';
    case 'authorized':
    case 'pending':
    case 'in_process':
    case 'in_mediation':
      return 'pending';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
      return 'cancelled';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    default:
      return 'pending';
  }
}

function notificationUrl() {
  const base = process.env.PUBLIC_API_URL;
  if (!base) return undefined; // sem URL pública o webhook não é registrado (dev local)
  return `${base.replace(/\/$/, '')}/api/v1/pagamentos/webhook/mercadopago`;
}

/** * Cria uma cobrança Pix real. @returns dados normalizados para gravar em transacoes_pagamento */
async function createPixPayment({ quantidade, descricao, payer, externalReference, expiresInMinutes = 30 }) {
  const expiration = new Date(Date.now() + expiresInMinutes * 60_000);

  const body = {
    valor_transacao: Number(Number(quantidade).toFixed(2)),
    descricao: String(descricao || 'MoviPay').slice(0, 255),
    metodo_pagamento_id: 'pix',
    referencia_externa: String(externalReference),
    date_of_expiration: expiration.toISOString(),
    payer: {
      email: payer.email,
      first_name: (payer.nome || '').split(' ')[0] || 'Cliente',
      last_name: (payer.nome || '').split(' ').slice(1).join(' ') || 'MoviPay',
      ...(payer.cpf
        ? { identification: { tipo: 'CPF', number: payer.cpf } }
        : {}),
    },
  };
  const url = notificationUrl();
  if (url) body.notification_url = url;

  const data = await request('/v1/pagamentos', {
    method: 'POST',
    body,
    idempotencyKey: `movipay-${externalReference}`,
  });

  const tx = data?.point_of_interaction?.transaction_data || {};
  return {
    providerPaymentId: String(data.id),
    estado: mapStatus(data.estado),
    statusDetail: data.detalhe_estado || null,
    pixPayload: tx.qr_code || null,
    pixQrBase64: tx.qr_code_base64 || null,
    ticketUrl: tx.ticket_url || null,
    expiresAt: data.date_of_expiration ? new Date(data.date_of_expiration) : expiration,
    raw: data,
  };
}

/** Consulta o estado atual de um pagamento (usado no polling e no webhook). */
async function getPayment(providerPaymentId) {
  const data = await request(`/v1/pagamentos/${providerPaymentId}`);
  return {
    providerPaymentId: String(data.id),
    estado: mapStatus(data.estado),
    statusDetail: data.detalhe_estado || null,
    quantidade: data.valor_transacao,
    externalReference: data.referencia_externa || null,
    paidAt: data.date_approved ? new Date(data.date_approved) : null,
    raw: data,
  };
}

/** * Assinatura recorrente de verdade (preapproval do Mercado Pago). Devolve um `init_point`: o link onde o trabalhador autoriza a cobrança mensal. A ativação só acontece quando o... */
async function createSubscription({ planName, quantidade, payerEmail, externalReference, backUrl }) {
  const body = {
    reason: String(planName).slice(0, 255),
    referencia_externa: String(externalReference),
    payer_email: payerEmail,
    back_url: backUrl || process.env.PUBLIC_APP_URL || 'https://movipay.app/assinatura',
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      valor_transacao: Number(Number(quantidade).toFixed(2)),
      currency_id: 'BRL',
    },
    estado: 'pending',
  };

  const data = await request('/preapproval', { method: 'POST', body });
  return {
    providerReference: String(data.id),
    initPoint: data.init_point || data.sandbox_init_point || null,
    estado: data.estado === 'authorized' ? 'active' : 'pending',
    raw: data,
  };
}

async function getSubscription(providerReference) {
  const data = await request(`/preapproval/${providerReference}`);
  return {
    providerReference: String(data.id),
    estado:
      data.estado === 'authorized' ? 'active' : data.estado === 'cancelled' ? 'cancelled' : 'pending',
    nextPaymentDate: data.next_payment_date ? new Date(data.next_payment_date) : null,
    raw: data,
  };
}

async function cancelSubscription(providerReference) {
  const data = await request(`/preapproval/${providerReference}`, {
    method: 'PUT',
    body: { estado: 'cancelled' },
  });
  return { providerReference: String(data.id), estado: 'cancelled', raw: data };
}

/** * Valida a assinatura do webhook (cabeçalho `x-signature`). O Mercado Pago envia `x-signature: ts=...,v1=<hmac>` e o hmac é o SHA-256 de `id:<data.id>;request-id:<x-request-id>;... */
function verifyWebhookSignature({ signatureHeader, requestId, dataId }) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    return { ok: process.env.NODE_ENV !== 'production', reason: 'MERCADOPAGO_WEBHOOK_SECRET não configurado' };
  }
  if (!signatureHeader) return { ok: false, reason: 'Cabeçalho x-signature ausente' };

  const parts = Object.fromEntries(
    String(signatureHeader)
      .split(',')
      .map((p) => p.trim().split('='))
      .filter((p) => p.length === 2)
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return { ok: false, reason: 'Assinatura mal formatada' };

  const manifest = `id:${dataId};request-id:${requestId || ''};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(v1), 'utf8');
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  return { ok, reason: ok ? null : 'Assinatura inválida' };
}

module.exports = {
  id: 'mercadopago',
  label: 'Mercado Pago',
  supportsRecurring: true,
  isConfigured,
  createPixPayment,
  getPayment,
  createSubscription,
  getSubscription,
  cancelSubscription,
  verifyWebhookSignature,
  mapStatus,
};
