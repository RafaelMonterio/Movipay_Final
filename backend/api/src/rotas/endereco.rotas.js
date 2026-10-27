const { Router } = require('express');
const { consultarBanco } = require('../banco/conexao');
const { lidarAssincrono } = require('../intermediarios/lidarAssincrono');
const { ErroApi, assert, exigirCampos } = require('../intermediarios/tratamentoErros');

const router = Router();

const CITY = 'Ribeirão Pires';
const UF = 'SP';
// User-Agent exigido pela política de uso do Nominatim (OpenStreetMap) — identifica a aplicação, como pedido pelos termos de uso do serviço.
const NOMINATIM_HEADERS = { 'User-Agent': 'MoviPay-App/1.0 (uso educacional - TCC ETEC)' };

function normalize(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// GET /api/v1/endereco/buscar?q=amazonas Busca ruas reais de Ribeirão Pires pelo nome (API do ViaCEP, sem chave). Nunca retorna nada fora da cidade —...
router.get(
  '/buscar',
  lidarAssincrono(async (req, res) => {
    const q = (req.query.q || '').trim();
    assert(q.length >= 3, 400, 'Digite pelo menos 3 letras para buscar a rua.');

    const url = `https://viacep.com.br/ws/${UF}/${encodeURIComponent(CITY)}/${encodeURIComponent(q)}/json/`;
    let results = [];
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`ViaCEP respondeu ${resp.status}`);
      const data = await resp.json();
      if (Array.isArray(data)) results = data;
    } catch (err) {
      throw new ErroApi(503, 'Não foi possível consultar o serviço de endereços agora. Tente novamente.');
    }

    // Defesa extra: garante que nada fora de Ribeirão Pires passe, mesmo se a API de terceiros mudar de comportamento.
    const filtered = results.filter((r) => normalize(r.localidade) === normalize(CITY));

    res.json({
      results: filtered.map((r) => ({
        cep: r.cep,
        rua: r.logradouro,
        bairro: r.bairro,
      })),
    });
  })
);

// GET /api/v1/endereco/cep/:cep — busca direta por CEP.
router.get(
  '/cep/:cep',
  lidarAssincrono(async (req, res) => {
    const cep = req.params.cep.replace(/\D/g, '');
    assert(cep.length === 8, 400, 'CEP inválido. Use o formato 00000-000.');

    let data;
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!resp.ok) throw new Error(`ViaCEP respondeu ${resp.status}`);
      data = await resp.json();
    } catch {
      throw new ErroApi(503, 'Não foi possível consultar o CEP agora. Tente novamente.');
    }
    if (!data || data.erro) throw new ErroApi(404, 'CEP não encontrado.');

    if (normalize(data.localidade) !== normalize(CITY)) {
      throw new ErroApi(422, `Este CEP é de ${data.localidade}/${data.uf}. O MoviPay atende só Ribeirão Pires por enquanto.`);
    }

    res.json({ resultado: { cep: data.cep, rua: data.logradouro, bairro: data.bairro } });
  })
);

// POST /api/v1/endereco/resolver { cep, rua, bairro } Confirma um endereço (vindo de /buscar ou /cep) e garante que ele exista na nossa tabela...
router.post(
  '/resolver',
  lidarAssincrono(async (req, res) => {
    const { cep, rua, bairro } = req.body;
    exigirCampos(req.body, ['cep', 'rua', 'bairro']);

    const existing = await consultarBanco('SELECT * FROM enderecos WHERE cep = $1 AND rua = $2', [cep, rua]);
    let address = existing.rows[0];

    if (!address) {
      const inserted = await consultarBanco(
        `INSERT INTO enderecos (cep, rua, bairro, cidade, state) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (cep, rua) DO UPDATE SET bairro = EXCLUDED.bairro
         RETURNING *`,
        [cep, rua, bairro, CITY, UF]
      );
      address = inserted.rows[0];
    }

    if (!address.lat || !address.lng) {
      try {
        const geocodeUrl = `https://nominatim.openstreetmap.org/buscar?format=json&limit=1&q=${encodeURIComponent(
          `${rua}, ${CITY}, ${UF}, Brasil`
        )}`;
        const resp = await fetch(geocodeUrl, { headers: NOMINATIM_HEADERS });
        const results = await resp.json();
        if (results?.[0]) {
          const { rows } = await consultarBanco(
            `UPDATE enderecos SET lat = $1, lng = $2 WHERE id = $3 RETURNING *`,
            [Number(results[0].lat), Number(results[0].lon), address.id]
          );
          address = rows[0];
        }
      } catch {
        // Geocodificação é "nice to have": se falhar, o endereço ainda é válido (foi confirmado pelo ViaCEP) — só fica sem pino exato no mapa.
      }
    }

    res.json({ address });
  })
);

// POST /api/v1/endereco/da-localizacao { lat, lng } Geocodificação REVERSA (coordenada -> endereço), via Nominatim. Usada quando a pessoa permite compa...
router.post(
  '/da-localizacao',
  lidarAssincrono(async (req, res) => {
    const { lat, lng } = req.body;
    exigirCampos(req.body, ['lat', 'lng']);

    let reverse;
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1`;
      const resp = await fetch(url, { headers: NOMINATIM_HEADERS });
      if (!resp.ok) throw new Error(`Nominatim respondeu ${resp.status}`);
      reverse = await resp.json();
    } catch {
      throw new ErroApi(503, 'Não foi possível identificar sua localização agora. Tente novamente ou digite o endereço manualmente.');
    }

    const addr = reverse?.endereco;
    const cityGuess = addr?.cidade || addr?.town || addr?.municipality || addr?.suburb || '';
    if (normalize(cityGuess) !== normalize(CITY)) {
      throw new ErroApi(
        422,
        `Sua localização atual parece ser em ${cityGuess || 'outra cidade'}. O MoviPay atende só Ribeirão Pires por enquanto — digite o endereço manualmente.`
      );
    }

    const streetGuess = addr?.road;
    if (!streetGuess) {
      throw new ErroApi(404, 'Não conseguimos identificar a rua exata da sua localização. Tente buscar manualmente.');
    }

    // Confirma a rua detectada contra a base real da ViaCEP (pode vir com grafia um pouco diferente do Nominatim, então usamos busca parcial).
    const searchUrl = `https://viacep.com.br/ws/${UF}/${encodeURIComponent(CITY)}/${encodeURIComponent(streetGuess)}/json/`;
    let matches = [];
    try {
      const resp = await fetch(searchUrl);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) matches = data.filter((r) => normalize(r.localidade) === normalize(CITY));
      }
    } catch {
      // segue com 0 matches — cai no fallback abaixo
    }

    if (!matches[0]) {
      throw new ErroApi(
        404,
        `Identificamos "${streetGuess}", mas não achamos essa rua na base de Ribeirão Pires. Tente buscar manualmente.`
      );
    }

    res.json({
      resultado: { cep: matches[0].cep, rua: matches[0].logradouro, bairro: matches[0].bairro },
      detectedLat: Number(lat),
      detectedLng: Number(lng),
    });
  })
);

module.exports = router;
