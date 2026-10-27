# MoviPay — plataforma de serviços locais

O MoviPay conecta clientes a profissionais autônomos de Ribeirão Pires e região. A aplicação oferece busca por categoria, perfis profissionais, pedidos, orçamentos, conversas, avaliações, agenda, carteira e o programa de recompensas Folhas.

Esta versão reorganiza o código em português sem remover o comportamento anterior. Pastas, módulos, funções auxiliares, migrations, funções PostgreSQL e rotas oficiais da API foram traduzidos. O app mobile completo anexado foi incorporado como mais um consumidor do mesmo backend. Para manter compatibilidade com instalações existentes, os aliases HTTP antigos continuam ativos.

Para começar do zero, configurar Supabase, API, Postman, site e Expo Go 58, consulte [GUIA_INICIO_DO_ZERO.md](GUIA_INICIO_DO_ZERO.md). O guia técnico ampliado continua em [GUIA_INTEGRACAO_MOBILE_SUPABASE.md](GUIA_INTEGRACAO_MOBILE_SUPABASE.md).

Para testar as rotas no Postman, importe [postman/MoviPay-API.postman_collection.json](postman/MoviPay-API.postman_collection.json) e [postman/MoviPay-API.postman_environment.json](postman/MoviPay-API.postman_environment.json).

## Stack

| Camada | Tecnologias |
|---|---|
| Web | Next.js 14, React 18, Tailwind CSS, Framer Motion, Leaflet |
| Mobile | React Native 0.88, Expo SDK 58, React Navigation |
| API | Node.js 18+, Express, JWT, bcrypt |
| Persistência | PostgreSQL 16 ou Supabase Cloud |
| Ambiente | Docker Compose opcional |

## Estrutura principal

```text
Movipay_TCC-main/
├── frontend/
│   ├── src/app/                         # páginas web do App Router
│   ├── src/componentes/                 # interface, mapa, layout e efeitos
│   ├── src/contexto/                    # autenticação e tema
│   ├── src/ganchos/                     # hooks reutilizáveis
│   ├── src/servicos/                    # cliente HTTP e banco simulado
│   ├── src/utilitarios/                 # formatação e geolocalização
│   ├── mobile/                          # app Expo anexado e integrado
│   │   ├── src/apis/                     # consumidor centralizado das APIs
│   │   ├── src/telas/                 # cliente, trabalhador e compartilhadas
│   │   └── App.js
├── backend/api/src/
│   ├── banco/                           # pool Supabase/PostgreSQL e migrations
│   ├── intermediarios/                  # autenticação e erros
│   ├── rotas/                           # endpoints em português
│   └── servicos/                        # pagamentos, arquivos e regras
├── database/
│   ├── migrations/                       # estrutura do PostgreSQL
│   ├── seeds/                            # dados de demonstração
│   ├── functions/                        # regras SQL reutilizáveis
│   └── triggers/                         # regras automáticas do banco
└── docker/                              # API e PostgreSQL local opcional
```

## Como executar

### Web com banco simulado

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:3000`. Em desenvolvimento, `src/servicos/clienteApi.js` usa `src/servicos/bancoSimulado.js` quando não existe uma API externa configurada. O fluxo web continua utilizável offline.

### API e PostgreSQL local

```bash
cd docker
docker compose up --build
```

A API fica disponível na porta definida pelo Compose (normalmente `3000`) e o PostgreSQL local na porta `5432`. Ao iniciar, o backend aguarda o banco e executa as migrations. Para Supabase Cloud, o Docker e o PostgreSQL local são opcionais: configure `DATABASE_URL` em `backend/api/.env`, rode `npm run db:migrate` e inicie apenas a API.

### Mobile

```bash
cd frontend/mobile
npm install
npx expo start
```

Para validar o bundle web do Expo sem abrir o servidor de desenvolvimento:

```bash
npx expo export --platform web --output-dir /tmp/movipay-mobile-export
```

## API oficial em português

A base continua sendo `/api/v1`. Os caminhos abaixo são os oficiais da versão refatorada:

| Recurso | Caminho oficial |
|---|---|
| Autenticação | `/autenticacao/entrar`, `/autenticacao/cadastrar`, `/autenticacao/me`, `/autenticacao/modo` |
| Serviços | `/servicos` |
| Pedidos | `/pedidos` |
| Conversas | `/conversas`, `/conversas/direta`, `/conversas/:id` |
| Avaliações | `/avaliacoes` |
| Orçamentos | `/orcamentos` |
| Profissionais | `/profissionais` |
| Pagamentos | `/pagamentos` |
| Pontos | `/pontos` |
| Agenda | `/agenda` |
| Usuários | `/usuarios` |

Os caminhos anteriores (`/auth`, `/services`, `/orders`, `/chat`, `/reviews`, `/quotes`, `/workers`, `/payments`, `/points`, `/calendar` e `/users`) permanecem montados como aliases. Assim, clientes antigos e links já publicados continuam funcionando durante a migração.

Os nomes de tabelas e campos persistidos que fazem parte do contrato histórico (`users`, `orders`, `services`, `client_id`, `worker_id` etc.) foram mantidos no SQL para não invalidar bancos existentes. Os arquivos, funções auxiliares, gatilhos, migrations e o código de acesso estão em português; os campos JSON de entrada e saída também permanecem estáveis para não quebrar os clientes.

## Banco de dados

As migrations são executadas em ordem numérica. A migration `010_criar_conversas_diretas.sql` adiciona conversas iniciadas antes de um pedido formal, permitindo que o chat web e mobile usem a mesma API. Mensagens antigas ligadas a pedidos continuam usando `order_id`; mensagens diretas usam `conversation_id`.

As funções de negócio foram renomeadas para `calcular_distancia` e `atualizar_estatisticas_usuario`. Os gatilhos de status e recompensa também têm nomes em português. A execução é idempotente sempre que o schema usa `IF NOT EXISTS`.

## Contas de demonstração

| E-mail | Senha | Perfil |
|---|---|---|
| `ana@teste.com` | `123456` | Cliente |
| `bruno@teste.com` | `123456` | Profissional — elétrica |

## Variáveis de ambiente

Na API, copie `backend/api/.env.example` para `backend/api/.env` e configure `DATABASE_URL` do Supabase (ou `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` para PostgreSQL local), além de `JWT_SECRET` e `PORT`.

No mobile, `EXPO_PUBLIC_API_URL` deve apontar para a base da API, incluindo `/api/v1`. Sem essa variável em desenvolvimento, o Expo tenta usar o host do próprio depurador na porta `3000`.

No web, `NEXT_PUBLIC_API_URL` pode apontar para uma API externa. Sem ela, o cliente usa o mock local para desenvolvimento.

## Verificações realizadas

```bash
cd frontend && npm run build
cd frontend/mobile && npx expo export --platform web --output-dir /tmp/movipay-mobile-export
cd backend/api && for arquivo in $(find src -type f -name '*.js'); do node --check "$arquivo"; done
```

## Identidade visual

A interface usa laranja `#FF7A00`, verde Folhas `#22D31B`, tons terrosos claros, Fraunces para títulos e Inter para textos. Os modos claro, escuro e os controles de acessibilidade permanecem disponíveis.

## Licença acadêmica

Projeto desenvolvido como Trabalho de Conclusão de Curso (TCC). O código e os dados de demonstração são destinados ao uso acadêmico.
