class ErroApi extends Error {
  constructor(estado, mensagem, details) {
    super(mensagem);
    this.estado = estado;
    this.details = details;
  }
}

function assert(condition, estado, mensagem) {
  if (!condition) throw new ErroApi(estado, mensagem);
}

function exigirCampos(body, fields) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length) throw new ErroApi(400, `Campos obrigatórios ausentes: ${missing.join(', ')}`);
}

// O backend original detectava erro de trigger do Postgres procurando a palavra "imutável" na mensagem — só que a trigger nunca usa essa palavra (usa...
function tratamentoErros(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ErroApi) {
    return res.status(err.estado).json({ error: { mensagem: (err.mensagem || err.message), details: err.details } });
  }

  if (err.code === 'P0001') {
    return res.status(400).json({ error: { mensagem: (err.mensagem || err.message) } });
  }
  if (err.code === '23505') {
    return res.status(409).json({ error: { mensagem: 'Este registro já existe.' } });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: { mensagem: 'Referência inválida (registro relacionado não existe).' } });
  }
  if (err.code === '23514') {
    return res.status(400).json({ error: { mensagem: 'Valor inválido para um dos campos enviados.' } });
  }

  console.error('[erro não tratado]', req.method, req.originalUrl, err);
  return res.status(500).json({ error: { mensagem: 'Erro interno do servidor. Tente novamente em instantes.' } });
}

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ error: { mensagem: `Rota não encontrada: ${req.method} ${req.originalUrl}` } });
}

module.exports = { ErroApi, assert, exigirCampos, tratamentoErros, rotaNaoEncontrada };
