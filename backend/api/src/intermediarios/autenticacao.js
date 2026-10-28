const jwt = require('jsonwebtoken');
const { consultarBanco } = require('../banco/conexao');
const { ErroApi } = require('./tratamentoErros');

function signToken(dados) {
  if (!process.env.JWT_SECRET) {
    console.error(
      'JWT_SECRET não foi configurado no arquivo .env.'
    );

    throw new ErroApi(
      500,
      'A chave de autenticação da API não foi configurada.'
    );
  }

  const carga =
    typeof dados === 'object' && dados !== null
      ? dados
      : { id: dados };

  return jwt.sign(
    carga,
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || '30d',
    }
  );
}

async function intermediarioAutenticacao(req, res, next) {
  try {
    const cabecalhoAutorizacao =
      req.headers.authorization || '';

    if (!cabecalhoAutorizacao.startsWith('Bearer ')) {
      throw new ErroApi(
        401,
        'Token de autenticação não informado.'
      );
    }

    const token = cabecalhoAutorizacao
      .slice('Bearer '.length)
      .trim();

    if (!token) {
      throw new ErroApi(
        401,
        'Token de autenticação não informado.'
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error(
        'JWT_SECRET não foi configurado no arquivo .env.'
      );

      throw new ErroApi(
        500,
        'A chave de autenticação da API não foi configurada.'
      );
    }

    let dadosToken;

    try {
      dadosToken = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
    } catch (erroToken) {
      console.error(
        'Token JWT inválido:',
        erroToken.message
      );

      throw new ErroApi(
        401,
        'Token inválido ou expirado. Faça login novamente.'
      );
    }

    const idUsuario =
      dadosToken.id ||
      dadosToken.usuario_id ||
      dadosToken.usuarioId ||
      dadosToken.userId ||
      dadosToken.sub;

    if (!idUsuario) {
      throw new ErroApi(
        401,
        'O token não possui a identificação do usuário.'
      );
    }

    const resultado = await consultarBanco(
      `SELECT *
       FROM usuarios
       WHERE id = $1`,
      [idUsuario]
    );

    const usuario = resultado.rows[0];

    if (!usuario) {
      throw new ErroApi(
        401,
        'O usuário do token não foi encontrado.'
      );
    }

    req.usuario = usuario;
    req.user = usuario;

    return next();
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  signToken,
  intermediarioAutenticacao,
};
