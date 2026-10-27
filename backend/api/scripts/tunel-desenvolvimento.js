#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Backend + túnel público próprio, para uso com `expo start --tunnel`.
 *
 * Por que isto existe: o túnel do Expo (`--tunnel`) expõe SÓ o Metro
 * bundler. Ele não sabe nada sobre o backend na porta 3000 — então,
 * rodando `expo start --tunnel`, o app carrega normalmente (o JS vem do
 * túnel do Metro), mas qualquer chamada de API tenta um endereço que não
 * leva a lugar nenhum, e trava até o timeout. É exatamente o "carrega e
 * depois diz que o servidor demorou demais" relatado.
 *
 * A única correção de verdade é o BACKEND também ter uma URL pública —
 * este script cuida disso: sobe a API normal (com as mesmas checagens de
 * banco/migrations do `npm start`) e, junto, abre um túnel próprio para a
 * porta 3000 usando `localtunnel`. Depois grava a URL resultante em
 * `mobile/.env` como EXPO_PUBLIC_API_URL — para não precisar copiar isso
 * manualmente toda vez.
 *
 * Único passo manual que sobra: reiniciar o Expo depois (`expo start
 * --tunnel --clear`), porque EXPO_PUBLIC_* é lido pelo Metro quando ele
 * sobe, não em tempo real enquanto já está rodando. Isso não é uma
 * limitação deste script — é como o Expo trata essas variáveis.
 *
 * IMPORTANTE sobre túneis grátis: a URL muda a cada execução (a menos que
 * você configure uma subdomain fixa — veja `LOCALTUNNEL_SUBDOMAIN` abaixo).
 * Isso vale tanto para este túnel do backend quanto para o túnel do
 * próprio Expo — não é algo que dê para "resolver" de vez, é assim que
 * túneis efêmeros gratuitos funcionam.
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const localtunnel = require('localtunnel');

const PORT = Number(process.env.PORT || 3000);
const MOBILE_ENV_PATH = path.join(__dirname, '..', '..', 'mobile', '.env');

function waitForHealth(retries = 30) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      const http = require('http');
      const req = http.get(`http://127.0.0.1:${PORT}/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) resolve();
        else retry(n);
      });
      req.on('error', () => retry(n));
      req.setTimeout(1500, () => {
        req.destroy();
        retry(n);
      });
    };
    const retry = (n) => {
      if (n <= 0) return reject(new Error('A API não respondeu em /health a tempo.'));
      setTimeout(() => attempt(n - 1), 1000);
    };
    attempt(retries);
  });
}

/**
 * Atualiza (ou cria) mobile/.env preservando qualquer outra linha que já
 * exista — só a linha EXPO_PUBLIC_API_URL é substituída/adicionada.
 */
function writeMobileEnv(apiUrl) {
  let lines = [];
  if (fs.existsSync(MOBILE_ENV_PATH)) {
    lines = fs.readFileSync(MOBILE_ENV_PATH, 'utf8').split('\n');
  }
  const varLine = `EXPO_PUBLIC_API_URL=${apiUrl}`;
  const idx = lines.findIndex((l) => l.startsWith('EXPO_PUBLIC_API_URL='));
  if (idx >= 0) lines[idx] = varLine;
  else lines.push(varLine);
  fs.writeFileSync(MOBILE_ENV_PATH, lines.filter((l, i) => l.trim() !== '' || i === lines.length - 1).join('\n'));
}

(async () => {
  console.log('▶ Subindo a API (node src/aplicativo.js)...\n');
  const server = spawn(process.execPath, [path.join(__dirname, '..', 'src', 'aplicativo.js')], {
    stdio: 'inherit',
    env: process.env,
  });

  server.on('exit', (code) => {
    if (code !== 0 && code !== null) process.exit(code);
  });

  try {
    await waitForHealth();
  } catch (err) {
    console.error(`\n✘ ${err.message} Verifique se o PostgreSQL está rodando e tente de novo.`);
    server.kill();
    process.exit(1);
  }

  console.log('\n▶ Abrindo túnel público para a porta 3000...');
  const subdomain = process.env.LOCALTUNNEL_SUBDOMAIN || undefined;
  let tunnel;
  try {
    // localtunnel() não tem timeout próprio — se o serviço estiver fora do
    // ar ou a rede bloquear a conexão, ele fica pendurado pra sempre sem
    // avisar nada. Damos um prazo nosso (20s) para falhar com uma
    // mensagem clara em vez de travar o terminal silenciosamente.
    tunnel = await Promise.race([
      localtunnel({ port: PORT, subdomain }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('tempo esgotado conectando ao serviço de túnel (20s)')), 20000)
      ),
    ]);
  } catch (err) {
    console.error(`\n✘ Não foi possível abrir o túnel: ${err.message}`);
    console.error('   O backend continua rodando normalmente em http://localhost:3000 — só o túnel falhou.');
    return; // deixa o server (stdio: inherit) continuar rodando
  }

  const apiUrl = `${tunnel.url}/api/v1`;
  writeMobileEnv(apiUrl);

  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Backend público: ${tunnel.url}`);
  console.log(`✅ mobile/.env atualizado: EXPO_PUBLIC_API_URL=${apiUrl}`);
  console.log('\nAgora, em outro terminal, dentro de mobile/:');
  console.log('   npx expo start --tunnel --clear');
  console.log('(o --clear garante que o Metro releia o .env novo, não só o cache)');
  console.log('─'.repeat(60) + '\n');

  tunnel.on('close', () => {
    console.log('\n⚠️  O túnel do backend caiu. Rode este script de novo para gerar uma URL nova');
    console.log('   (e lembre de reiniciar o `expo start --tunnel` depois, com --clear).');
  });

  tunnel.on('error', (err) => {
    console.error('\n✘ Erro no túnel:', err.message);
  });

  const shutdown = () => {
    tunnel.close();
    server.kill();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();
