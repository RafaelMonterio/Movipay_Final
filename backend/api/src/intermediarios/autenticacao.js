const jwt = require('jsonwebtoken');

// Sem isto, o app SILENCIOSAMENTE assinava e validava tokens com uma string fixa (a mesma que aparece no .env.example, publicada junto do código) sem...
if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET não está definida no ambiente. Configure-a no .env (veja .env.example) antes de iniciar o servidor — ' +
      'o backend recusa subir sem isso de propósito, para nunca rodar em produção com uma chave previsível.'
  );
}
const SECRET = process.env.JWT_SECRET;
// 30 dias: sessão longa, adequada a um app mobile (o site original usa 7d).
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, modo: user.modo }, SECRET, { expiresIn: EXPIRES_IN });
}

// Protege uma rota exigindo "Authorization: Bearer <token>". req.user fica com { id, email, modo, iat, exp } — qualquer outro campo do perfil (catego...
function intermediarioAutenticacao(req, res, next) {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');
  if (!token) {
    return res.status(401).json({ error: { mensagem: 'Token de autenticação ausente.' } });
  }
  try {
    req.user = jwt.verify(token, SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: { mensagem: 'Token inválido ou expirado.' } });
  }
}

module.exports = { signToken, intermediarioAutenticacao, SECRET };
