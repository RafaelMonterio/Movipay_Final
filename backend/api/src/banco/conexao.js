const { Pool } = require('pg');
require('dotenv').config();

// Supabase Cloud fornece uma connection string pelo botão Connect do projeto.
// O backend continua usando pg e as mesmas APIs; apenas troca o destino do
// PostgreSQL quando DATABASE_URL ou SUPABASE_DB_URL estiver definida.
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const sslAtivo = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';
const configuracao = connectionString
  ? {
      connectionString,
      ssl: sslAtivo ? { rejectUnauthorized: false } : undefined,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'movipay',
      user: process.env.DB_USER || 'movipay',
      password: process.env.DB_PASSWORD || 'movipay_secret',
      ssl: sslAtivo ? { rejectUnauthorized: false } : undefined,
    };

const grupoConexoes = new Pool({
  ...configuracao,
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// O pacote pg chama o método de execução de SQL de `query`.
// O código do MoviPay usa `consultarBanco` em português, inclusive no
// migrador e nos blocos de transação. Estes aliases preservam a tradução
// interna sem quebrar o contrato oficial do pg.
const conectarOriginal = grupoConexoes.connect.bind(grupoConexoes);

grupoconfigurarCompatibilidade();

function adicionarAliasAoCliente(cliente) {
  if (cliente && typeof cliente.consultarBanco !== 'function') {
    cliente.consultarBanco = (texto, parametros) =>
      cliente.query(texto, parametros);
  }
  return cliente;
}

function grupoconfigurarCompatibilidade() {
  grupoConexoes.consultarBanco = (texto, parametros) =>
    grupoConexoes.query(texto, parametros);

  // Usa a forma com callback do pg para funcionar tanto nas versões que
  // retornam Promise quanto nas que exigem callback em Pool.connect().
  grupoConexoes.connect = (...argumentos) => {
    const ultimo = argumentos[argumentos.length - 1];
    if (typeof ultimo === 'function') {
      return conectarOriginal(...argumentos);
    }

    return new Promise((resolver, rejeitar) => {
      conectarOriginal((erro, cliente, liberar) => {
        if (erro) {
          rejeitar(erro);
          return;
        }
        const clienteCompatível = adicionarAliasAoCliente(cliente);
        if (liberar && typeof clienteCompatível.release !== 'function') {
          clienteCompatível.release = liberar;
        }
        resolver(clienteCompatível);
      });
    });
  };
}

grupoConexoes.on('error', (erro) => {
  console.error('❌ Erro no grupoConexoes do PostgreSQL:', erro.message);
});

async function consultarBanco(texto, parametros) {
  const inicio = Date.now();
  const resultado = await grupoConexoes.query(texto, parametros);
  const milissegundos = Date.now() - inicio;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SQL] ${milissegundos}ms · ${texto.slice(0, 80).replace(/\s+/g, ' ')}`);
  }
  return resultado;
}

async function obterClienteBanco() {
  return grupoConexoes.connect();
}

module.exports = { consultarBanco, obterClienteBanco, grupoConexoes };
