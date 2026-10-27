/** * Dinheiro e comissão da plataforma. O percentual NÃO é uma constante do código nem vem da requisição: está em `configuracoes_plataforma.percentual_comissao` (migration 017) e é lido do... */

const { consultarBanco } = require('../banco/conexao');

const DEFAULT_COMMISSION_PERCENT = 15;
let cached = { value: null, at: 0 };
const CACHE_MS = 60_000;

async function obterPercentualComissao() {
  const now = Date.now();
  if (cached.value !== null && now - cached.at < CACHE_MS) return cached.value;

  try {
    const { rows } = await consultarBanco(`SELECT value FROM configuracoes_plataforma WHERE key = 'percentual_comissao'`);
    const parsed = Number(rows[0]?.value);
    const percent = Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : DEFAULT_COMMISSION_PERCENT;
    cached = { value: percent, at: now };
    return percent;
  } catch {
    return DEFAULT_COMMISSION_PERCENT;
  }
}

function toCents(quantidade) {
  return Math.round(Number(quantidade) * 100);
}

function fromCents(cents) {
  return Number((cents / 100).toFixed(2));
}

/** * Divide um valor bruto entre plataforma e trabalhador. splitCommission(100, 15) -> { gross: 100, platformFee: 15, netAmount: 85, feePercent: 15 } @param {number|string} grossAm... */
function splitCommission(grossAmount, feePercent) {
  const grossCents = toCents(grossAmount);
  if (!Number.isFinite(grossCents) || grossCents <= 0) {
    throw new Error('Valor bruto inválido para cálculo de comissão.');
  }
  const feeCents = Math.round((grossCents * Number(feePercent)) / 100);
  const netCents = grossCents - feeCents;

  return {
    gross: fromCents(grossCents),
    platformFee: fromCents(feeCents),
    netAmount: fromCents(netCents),
    feePercent: Number(feePercent),
  };
}

/** Atalho: lê o percentual atual do banco e já faz a divisão. */
async function dividirComTaxaPlataforma(grossAmount) {
  const percent = await obterPercentualComissao();
  return splitCommission(grossAmount, percent);
}

let boostCached = { value: null, at: 0 };

/** Preço e duração da "melhor divulgação" de um orçamento — mesmo padrão de cache da comissão. */
async function obterConfiguracaoImpulsoOrcamento() {
  const now = Date.now();
  if (boostCached.value !== null && now - boostCached.at < CACHE_MS) return boostCached.value;

  try {
    const { rows } = await consultarBanco(
      `SELECT key, value FROM configuracoes_plataforma WHERE key IN ('preco_impulso_orcamento', 'dias_impulso_orcamento')`
    );
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const price = Number(byKey.preco_impulso_orcamento);
    const days = Number(byKey.dias_impulso_orcamento);
    const settings = {
      price: Number.isFinite(price) && price > 0 ? price : 10,
      days: Number.isFinite(days) && days > 0 ? days : 7,
    };
    boostCached = { value: settings, at: now };
    return settings;
  } catch {
    return { price: 10, days: 7 };
  }
}

function formatBRL(quantidade) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(quantidade));
}

module.exports = {
  DEFAULT_COMMISSION_PERCENT,
  obterPercentualComissao,
  obterConfiguracaoImpulsoOrcamento,
  splitCommission,
  dividirComTaxaPlataforma,
  toCents,
  fromCents,
  formatBRL,
};
