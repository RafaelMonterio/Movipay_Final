/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { grupoConexoes } = require('./conexao');

// backend/api/src/banco/migrar.js -> sobe até a raiz do projeto/database
// Existe uma única fonte de migrations para API, site e mobile.
const DB_DIR = path.join(__dirname, '..', '..', '..', '..', 'database');

async function runSQLDir(dirPath, label) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dirPath, file), 'utf8');
    try {
      await grupoConexoes.consultarBanco(sql);
      console.log(`  ✓ ${label}/${file}`);
    } catch (err) {
      const mensagem = (err.mensagem || err.message) || err.message || '';
      if (err.code === '42P07' || err.code === '42710' || mensagem.includes('already exists')) {
        console.log(`  ~ ${label}/${file} (já existia)`);
      } else {
        console.error(`  ✗ ${label}/${file}: ${mensagem}`);
        throw err;
      }
    }
  }
}

async function executarMigracoes() {
  console.log('\n🗄️  Executando migrations...');
  await runSQLDir(path.join(DB_DIR, 'migrations'), 'migrations');
  console.log('\n⚙️  Criando functions...');
  await runSQLDir(path.join(DB_DIR, 'functions'), 'functions');
  console.log('\n⚡ Criando triggers...');
  await runSQLDir(path.join(DB_DIR, 'triggers'), 'triggers');
  console.log('\n✅ Schema pronto!\n');
}

async function runSeeds() {
  console.log('\n🌱 Executando seeds...');
  await runSQLDir(path.join(DB_DIR, 'seeds'), 'seeds');
  console.log('\n✅ Seeds aplicados!\n');
}

// Apaga todas as tabelas/tipos — só para uso manual em desenvolvimento (npm run db:reset). Nunca é chamado automaticamente ao subir o servidor.
async function resetAll() {
  console.log('\n↺ Resetando banco (DROP de todas as tabelas)...');
  const tables = [
    'comissoes_plataforma',
    'notas_agenda',
    'transacoes_servico',
    'transacoes_pagamento',
    'eventos_webhook_pagamento',
    'assinaturas',
    'planos_assinatura',
    'configuracoes_plataforma',
    'responsaveis_legais',
    'areas_atendimento',
    'perfis_trabalhador',
    'midia_publicacao',
    'visualizacoes_publicacao',
    'arquivos_midia',
    'mensagens_chat',
    'conversas',
    'comentarios_publicacao',
    'curtidas_publicacao',
    'salvos_publicacao',
    'publicacoes',
    'favoritos',
    'propostas_orcamento',
    'orcamentos',
    'pagamentos',
    'historico_pontos',
    'avaliacoes',
    'horarios_disponibilidade',
    'fotos_portfolio',
    'pedidos',
    'servicos',
    'usuarios',
    'enderecos',
    'categorias',
  ];
  for (const t of tables) {
    await grupoConexoes.consultarBanco(`DROP TABLE IF EXISTS ${t} CASCADE;`);
  }
  console.log('✅ Tabelas removidas.\n');
}

async function main() {
  const args = process.argv.slice(2);
  try {
    if (args.includes('--reset')) await resetAll();
    await executarMigracoes();
    if (args.includes('--seed')) await runSeeds();
  } catch (err) {
    console.error('✘ Falha ao migrar:', (err.mensagem || err.message) || err.message);
    process.exitCode = 1;
  } finally {
    if (require.main === module) await grupoConexoes.end();
  }
}

if (require.main === module) main();

module.exports = { executarMigracoes, runSeeds, resetAll };
