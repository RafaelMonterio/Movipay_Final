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

grupoConexoes.on('error', (err) => {
  console.error('❌ Erro no grupoConexoes do PostgreSQL:', err.message);
});

async function consultarBanco(text, params) {
  const start = Date.now();
  const res = await grupoConexoes.consultarBanco(text, params);
  const ms = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SQL] ${ms}ms · ${text.slice(0, 80).replace(/\s+/g, ' ')}`);
  }
  return res;
}

async function obterClienteBanco() {
  return grupoConexoes.connect();
}

module.exports = { consultarBanco, obterClienteBanco, grupoConexoes };
