require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { grupoConexoes } = require('./banco/conexao');
const { executarMigracoes } = require('./banco/migrar');
const { tratamentoErros, rotaNaoEncontrada } = require('./intermediarios/tratamentoErros');

const rotasAutenticacao = require('./rotas/autenticacao.rotas');
const rotasUsuarios = require('./rotas/usuarios.rotas');
const rotasCategorias = require('./rotas/categorias.rotas');
const rotasServicos = require('./rotas/servicos.rotas');
const rotasTrabalhadores = require('./rotas/trabalhadores.rotas');
const rotasPedidos = require('./rotas/pedidos.rotas');
const rotasOrcamentos = require('./rotas/orcamentos.rotas');
const rotasConversas = require('./rotas/conversas.rotas');
const rotasAvaliacoes = require('./rotas/avaliacoes.rotas');
const rotasPontos = require('./rotas/pontos.rotas');
const rotasPagamentos = require('./rotas/pagamentos.rotas');
const rotasAgenda = require('./rotas/agenda.rotas');
const rotasFavoritos = require('./rotas/favoritos.rotas');
const rotasDiversas = require('./rotas/diversas.rotas');
const rotasEndereco = require('./rotas/endereco.rotas');
const rotasPublicacoes = require('./rotas/publicacoes.rotas');
const rotasMidia = require('./rotas/midia.rotas');
const rotasPerfilTrabalhador = require('./rotas/perfilTrabalhador.rotas');
const rotasPlanos = require('./rotas/planos.rotas');
const rotasGanhos = require('./rotas/ganhos.rotas');
const { RAIZ_UPLOADS, PREFIXO_PUBLICO } = require('./servicos/armazenamento');
const { descreverConfiguracao } = require('./servicos/pagamentos');
const { expirarAssinaturasVencidas } = require('./servicos/processamentoPagamentos');

const app = express();

// Cabeçalhos de segurança padrão. CSP desligado de propósito: esta API só devolve JSON e arquivos de mídia — CSP é para páginas HTML, e uma política...
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS só importa para o build Web (navegador impõe a política de mesma-origem; apps nativos Android/iOS não passam por isso). Estava declarado no .e...
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({ origin: !corsOrigin || corsOrigin === '*' ? true : corsOrigin.split(',') }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Limite de tentativas — não existia NENHUM antes desta revisão de segurança. Sem isto, /autenticacao/entrar e /autenticacao/cadastrar aceitavam qualquer quantidade de...
const skipLocalhost = (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipLocalhost,
  message: { error: { mensagem: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.' } },
});
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipLocalhost,
  message: { error: { mensagem: 'Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.' } },
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipLocalhost,
  message: { error: { mensagem: 'Muitas requisições. Aguarde um instante e tente novamente.' } },
});
app.use('/api/v1/autenticacao/entrar', loginLimiter);
app.use('/api/v1/autenticacao/cadastrar', registerLimiter);
app.use('/api/v1', apiLimiter);

app.use('/api/v1/autenticacao', rotasAutenticacao);
app.use('/api/v1/usuarios', rotasUsuarios);
app.use('/api/v1/categorias', rotasCategorias);
app.use('/api/v1/servicos', rotasServicos);
app.use('/api/v1/trabalhadores', rotasTrabalhadores);
app.use('/api/v1/pedidos', rotasPedidos);
app.use('/api/v1/orcamentos', rotasOrcamentos);
app.use('/api/v1/conversas', rotasConversas);
app.use('/api/v1/avaliacoes', rotasAvaliacoes);
app.use('/api/v1/pontos', rotasPontos);
app.use('/api/v1/pagamentos', rotasPagamentos);
app.use('/api/v1/agenda', rotasAgenda);
app.use('/api/v1/favoritos', rotasFavoritos);
app.use('/api/v1/atividade', rotasDiversas);
app.use('/api/v1/endereco', rotasEndereco);
app.use('/api/v1/publicacoes', rotasPublicacoes);
app.use('/api/v1/midia', rotasMidia);
app.use('/api/v1/perfil-trabalhador', rotasPerfilTrabalhador);
app.use('/api/v1/planos', rotasPlanos);
app.use('/api/v1/ganhos', rotasGanhos);
// O backend anterior chamava este recurso de profissionais; o mobile novo
// usa trabalhadores. Os dois caminhos continuam válidos.
app.use('/api/v1/profissionais', rotasTrabalhadores);

// Compatibilidade: o site e integrações anteriores continuam podendo usar os
// nomes legados em inglês. As rotas oficiais em português acima permanecem a
// fonte principal para o novo mobile.
const aliasesLegados = [
  ['auth', rotasAutenticacao],
  ['users', rotasUsuarios],
  ['categories', rotasCategorias],
  ['services', rotasServicos],
  ['workers', rotasTrabalhadores],
  ['orders', rotasPedidos],
  ['quotes', rotasOrcamentos],
  ['chat', rotasConversas],
  ['reviews', rotasAvaliacoes],
  ['points', rotasPontos],
  ['payments', rotasPagamentos],
  ['calendar', rotasAgenda],
  ['favorites', rotasFavoritos],
  ['activity', rotasDiversas],
  ['address', rotasEndereco],
  ['shorts', rotasPublicacoes],
  ['media', rotasMidia],
  ['worker-profile', rotasPerfilTrabalhador],
  ['plans', rotasPlanos],
];
for (const [nome, roteador] of aliasesLegados) {
  app.use(`/api/v1/${nome}`, roteador);
}

// Fallback estável para integrações que esperam o formato Overpass. Não
// transforma indisponibilidade de um serviço externo em erro da API.
function responderOverpass(_req, res) {
  res.status(200).json({
    version: 0.6,
    generator: 'AdaptiveMoves Overpass production fallback',
    elements: [],
    degraded: true,
  });
}
app.post(['/api/overpass', '/api/v1/overpass'], responderOverpass);
app.get(['/api/overpass', '/api/v1/overpass'], responderOverpass);

// Arquivos enviados pelos usuários (fotos e vídeos dos Shorts, avatares). `express.static` com cache longo: o nome do arquivo já é único, então nunca...
app.use(
  PREFIXO_PUBLICO,
  express.static(RAIZ_UPLOADS, {
    maxAge: '30d',
    setHeaders: (res) => res.setHeader('Access-Control-Allow-Origin', '*'),
  })
);

app.get('/health', (req, res) =>
  res.json({
    estado: 'ok',
    version: '0.8.0-mobile',
    uptime: process.uptime(),
    pagamentos: descreverConfiguracao(),
  })
);

app.use(rotaNaoEncontrada);
app.use(tratamentoErros);

const PORT = process.env.PORT || 3000;

async function start() {
  const MAX = 15;
  for (let i = 1; i <= MAX; i++) {
    try {
      await grupoConexoes.consultarBanco('SELECT 1');
      break;
    } catch {
      console.log(`⏳ Aguardando PostgreSQL... (${i}/${MAX})`);
      await new Promise((r) => setTimeout(r, 2000));
      if (i === MAX) process.exit(1);
    }
  }
  await executarMigracoes();

  // Avisa no boot o que ainda falta configurar, em vez de a pessoa descobrir só quando um pagamento falhar no celular.
  const paymentConfig = descreverConfiguracao();
  if (paymentConfig.configured) {
    console.log(`💳 Pagamentos: ${paymentConfig.label} configurado.`);
  } else {
    console.log(
      `⚠️  Pagamentos DESATIVADOS (${paymentConfig.label}). Falta no .env: ${
        paymentConfig.missingEnv.join(', ') || 'credenciais do gateway'
      }`
    );
  }

  // Assinaturas vencidas voltam ao plano Formiga — no boot e a cada 6 h.
  const runExpiry = async () => {
    try {
      const n = await expirarAssinaturasVencidas();
      if (n > 0) console.log(`↺ ${n} assinatura(s) expirada(s) — voltaram ao plano Formiga.`);
    } catch (err) {
      console.error('[assinaturas] falha ao expirar:', (err.mensagem || err.message));
    }
  };
  await runExpiry();
  setInterval(runExpiry, 6 * 60 * 60 * 1000).unref();
  // Ao contrário do backend original (que rodava os seeds a cada boot e por isso duplicava dados não-idempotentes como servicos/pedidos a cada reinício)...
  app.listen(PORT, '0.0.0.0', () =>
    console.log(`🚀 MoviPay API rodando em http://0.0.0.0:${PORT} (aceita conexões de qualquer endereço)`)
  );
  // Nota sobre o item "Express escutando só em localhost": `app.listen(PORT)` sem host, no Node, já escuta em todas as interfaces por padrão — nunca fo...
}

if (require.main === module) start();

// `aplicativo` é mantido como alias para scripts e testes da API anterior.
module.exports = { app, aplicativo: app, start };
