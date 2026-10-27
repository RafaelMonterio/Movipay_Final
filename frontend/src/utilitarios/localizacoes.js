/**
 * O MoviPay, nesta versão, atende apenas Ribeirão Pires/SP. Aqui ficam o centro
 * da cidade, coordenadas por bairro, a consulta de CEP (ViaCEP — API pública e
 * gratuita, sem chave) e a resolução de coordenadas do pino de cada pessoa.
 */
export const CITY_NAME = 'Ribeirão Pires';
export const CITY_CENTER = [-23.7153, -46.4194];

export const NEIGHBORHOOD_COORDS = {
  'centro': [-23.7153, -46.4194], 'suissa': [-23.7051, -46.4172], 'pastoril': [-23.7103, -46.4258],
  'bocaina': [-23.7280, -46.4147], 'santana': [-23.7021, -46.4280], 'ponte seca': [-23.7340, -46.4080],
  'barro branco': [-23.6980, -46.4050], 'colonia': [-23.7190, -46.4100], 'alianca': [-23.7230, -46.4230],
  'roncon': [-23.7090, -46.4310], 'ouro fino paulista': [-23.7310, -46.4210],
};

const plain = t => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
function withJitter([lat, lng]) { const j = () => (Math.random() - 0.5) * 0.006; return [Number((lat + j()).toFixed(5)), Number((lng + j()).toFixed(5))]; }

/** Coordenadas por bairro (sem acento/caixa); cai para o centro da cidade se desconhecido. */
export function coordsForNeighborhood(neighborhood) {
  const q = plain(neighborhood);
  if (q) for (const [name, c] of Object.entries(NEIGHBORHOOD_COORDS)) if (q.includes(name) || name.includes(q)) return withJitter(c);
  return withJitter(CITY_CENTER);
}

export function isSameCity(a, b = CITY_NAME) { return plain(a) === plain(b); }

/** Consulta um CEP na ViaCEP. Retorna { cep, street, neighborhood, city, state } ou null. */
export async function lookupCep(cep) {
  const clean = (cep || '').replace(/\D/g, '');
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const data = await res.json();
    if (!res.ok || data.erro) return null;
    return { cep: clean, street: data.logradouro || '', neighborhood: data.bairro || '', city: data.localidade || '', state: data.uf || '' };
  } catch { return null; }
}

export function formatCep(value) {
  const c = (value || '').replace(/\D/g, '').slice(0, 8);
  return c.length > 5 ? `${c.slice(0, 5)}-${c.slice(5)}` : c;
}
