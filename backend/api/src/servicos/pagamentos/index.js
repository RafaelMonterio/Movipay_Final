/** * Seleção do provedor de pagamentos. `PAYMENT_PROVIDER` no .env decide qual implementação é usada: mercadopago → gateway real, Pix + cartão + assinatura recorrente, confirmação... */

const mercadopago = require('./mercadoPago');
const manualPix = require('./pixManual');

const PROVIDERS = {
  mercadopago,
  manual_pix: manualPix,
};

function obterProvedor(nome) {
  const key = String(nome || process.env.PAYMENT_PROVIDER || 'mercadopago').toLowerCase();
  const provider = PROVIDERS[key];
  if (!provider) {
    throw new Error(
      `PAYMENT_PROVIDER inválido: "${key}". Valores aceitos: ${Object.keys(PROVIDERS).join(', ')}.`
    );
  }
  return provider;
}

/** Diagnóstico exibido em /api/v1/pagamentos/configuracao e no boot do servidor. */
function descreverConfiguracao() {
  const active = String(process.env.PAYMENT_PROVIDER || 'mercadopago').toLowerCase();
  const provider = PROVIDERS[active];
  const configured = provider ? provider.isConfigured() : false;

  const missing = [];
  if (active === 'mercadopago') {
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) missing.push('MERCADOPAGO_ACCESS_TOKEN');
    if (!process.env.MERCADOPAGO_WEBHOOK_SECRET) missing.push('MERCADOPAGO_WEBHOOK_SECRET');
    if (!process.env.PUBLIC_API_URL) missing.push('PUBLIC_API_URL (necessária para o webhook)');
  }
  if (active === 'manual_pix' && !process.env.PIX_KEY) missing.push('PIX_KEY');

  return {
    provider: active,
    label: provider?.label || active,
    configured,
    supportsRecurring: Boolean(provider?.supportsRecurring),
    requiresManualConfirmation: Boolean(provider?.requiresManualConfirmation),
    missingEnv: missing,
    pixKeyConfigured: Boolean(process.env.PIX_KEY),
  };
}

module.exports = { obterProvedor, descreverConfiguracao, PROVIDERS };
