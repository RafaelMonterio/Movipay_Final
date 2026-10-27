# Integração do mobile com o site e Supabase

## Arquitetura adotada

O mobile anexado foi incorporado em `frontend/mobile`. O mobile **não acessa o PostgreSQL/Supabase diretamente**. Ele continua consumindo o backend Express, assim como o site:

```text
Site web ───────┐
                ├──> backend/api ───> PostgreSQL do Supabase
App Expo ───────┘
```

Essa escolha mantém as regras de negócio, autenticação JWT, validações, pagamentos, uploads e autorizações em um único lugar. A chave de banco e a `service_role` nunca ficam dentro do APK/IPA.

O backend incorporado usa as migrations do projeto anexado e mantém as rotas oficiais em português. Também foram preservados aliases legados em inglês e adicionados os endpoints estáveis de Overpass:

```text
POST /api/overpass
GET  /api/overpass
POST /api/v1/overpass
GET  /api/v1/overpass
```

O fallback responde HTTP 200 com `version`, `generator`, `elements: []` e `degraded: true`, sem transformar uma indisponibilidade externa em erro da API.

## O que foi incorporado

- O app Expo/React Native 0.9.1 está em `frontend/mobile` e usa Expo SDK 58, React Native 0.88 e React 19.3.
- Existe uma única API em `backend/api`.
- Existe uma única fonte de migrations, functions, triggers e seeds em `database/`.
- Site e mobile consomem os mesmos recursos `/api/v1`.
- O backend continua expondo `/api/v1/autenticacao`, `/api/v1/usuarios`, `/api/v1/pedidos`, `/api/v1/orcamentos`, `/api/v1/conversas`, `/api/v1/publicacoes`, `/api/v1/midia`, `/api/v1/planos` e os demais recursos do mobile.
- O pool PostgreSQL agora aceita `DATABASE_URL` ou `SUPABASE_DB_URL`, com fallback para `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD`.

## Passo 1 — Criar ou abrir o projeto Supabase

1. Crie um projeto no Supabase ou abra o projeto existente.
2. No painel, abra **Connect**.
3. Copie a connection string do PostgreSQL.
4. Para um backend Node persistente, use a conexão direta quando o servidor tiver IPv6 ou o **Session pooler** quando ele estiver em uma rede IPv4.
5. Não coloque essa string no mobile, no navegador, no Git ou em arquivos `.env` versionados.

A documentação do Supabase recomenda conexão direta para backends persistentes quando disponível e Session pooler como alternativa em redes IPv4. A string deve ser copiada do botão **Connect**, e a senha deve ser codificada se contiver caracteres reservados. [1]

## Passo 2 — Configurar o backend

Entre na pasta da API:

```bash
cd backend/api
cp .env.example .env
```

No `.env`, preencha pelo menos:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres.PROJETO:SENHA@HOST_DO_POOLER:5432/postgres
DB_SSL=true
DB_POOL_MAX=10
JWT_SECRET=gere-uma-chave-longa-e-aleatoria
CORS_ORIGIN=https://seu-site.com
```

O código dá prioridade a `DATABASE_URL`. Se ela estiver vazia, usa a configuração local por partes:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=movipay
DB_USER=movipay
DB_PASSWORD=movipay_secret
DB_SSL=false
```

Instale e aplique as migrations:

```bash
npm install
npm run db:migrate
```

Em um banco vazio de demonstração, os seeds podem ser aplicados com:

```bash
npm run db:seed
```

Não execute `npm run db:reset` em um Supabase que contenha dados importantes. Esse comando é destrutivo e serve apenas para desenvolvimento.

## Passo 3 — Subir a API

Em desenvolvimento:

```bash
cd backend/api
npm run dev
```

Em produção:

```bash
cd backend/api
npm start
```

Teste:

```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/overpass
```

A API precisa estar publicada em HTTPS para o celular acessar fora da rede local. Exemplos de hospedagem: Render, Railway, Fly.io, uma VM ou outro serviço Node persistente. Depois de publicar, a URL deve terminar em `/api/v1`, por exemplo:

```text
https://api.seudominio.com/api/v1
```

## Passo 4 — Configurar o app Expo

Entre no mobile incorporado:

```bash
cd frontend/mobile
cp .env.example .env
npm install
```

Para executar em um celular na mesma rede Wi-Fi do computador, defina no `.env` o IP da máquina que executa a API. `localhost` no celular aponta para o próprio celular. Para uma API publicada, defina no `.env`:

```env
EXPO_PUBLIC_API_URL=https://api.seudominio.com/api/v1
```

Depois reinicie o Metro limpando o cache:

```bash
npx expo start --clear
```

Para Expo Tunnel, o túnel do Expo expõe o Metro, não o backend. Portanto, o backend também precisa estar publicado ou receber um túnel próprio. O app já mostra uma mensagem clara quando o Tunnel está sem `EXPO_PUBLIC_API_URL`.

## Passo 5 — Testar no celular

1. Suba o backend.
2. Confirme que `GET /health` responde pela URL pública.
3. Defina `EXPO_PUBLIC_API_URL` no mobile.
4. Rode `npx expo start --clear` dentro de `frontend/mobile`.
5. Abra com Expo Go ou emulador.
6. Teste login, cadastro, troca de modo, busca de trabalhadores, pedidos, orçamentos, chat, Shorts, pontos, carteira e agenda.

O mobile grava somente o JWT e o usuário em `AsyncStorage`. O token é enviado como `Authorization: Bearer ...` para o backend. O banco nunca é acessado diretamente pelo aparelho.

## Docker e PostgreSQL: ainda são necessários?

### Usando Supabase Cloud

Não. Se o banco estiver no Supabase Cloud, você não precisa manter um PostgreSQL local nem iniciar o serviço `db` do Docker. Você ainda precisa executar o backend Node em algum lugar, porque ele contém as APIs e regras de negócio.

Nesse cenário:

```text
Supabase Cloud = PostgreSQL hospedado
backend/api    = Express + pg + APIs
frontend       = site
frontend/mobile = app Expo
```

O pacote continua contendo Docker para quem quiser desenvolvimento local. Ele é opcional nesse modelo.

### Usando PostgreSQL local

Você pode usar Docker ou uma instalação local do PostgreSQL. O `docker/docker-compose.yml` continua disponível para esse cenário:

```bash
cd docker
docker compose up --build
```

O backend usa as migrations em `database/` e se conecta ao serviço local `db`.

### Usando Supabase local

Se você quiser rodar a própria stack do Supabase na sua máquina, aí sim precisará do Supabase CLI e de um runtime de containers compatível com Docker. A documentação oficial informa que o desenvolvimento local do Supabase exige um container runtime. [2]

## APIs preservadas

As APIs continuam no backend, no padrão visual que você mostrou:

```text
backend/api/src/aplicativo.js
backend/api/src/rotas/autenticacao.rotas.js
backend/api/src/rotas/pedidos.rotas.js
backend/api/src/rotas/orcamentos.rotas.js
backend/api/src/rotas/conversas.rotas.js
backend/api/src/rotas/publicacoes.rotas.js
backend/api/src/rotas/pagamentos.rotas.js
```

O mobile apenas virou mais um consumidor delas. Os módulos de consumo do app ficam em:

```text
frontend/mobile/src/apis/clienteHttp.js
frontend/mobile/src/apis/autenticacao.js
frontend/mobile/src/apis/pedidos.js
frontend/mobile/src/apis/redeSocial.js
frontend/mobile/src/apis/mercado.js
frontend/mobile/src/apis/publicacoes.js
frontend/mobile/src/apis/midia.js
frontend/mobile/src/apis/planos.js
frontend/mobile/src/apis/endereco.js
frontend/mobile/src/apis/perfilTrabalhador.js
```

A API não deve ser chamada diretamente do componente se já existir um módulo em `src/api`. Isso mantém os endpoints centralizados e facilita alterar o endereço do backend sem editar dezenas de telas.

## Cuidados de segurança

- Nunca coloque `DATABASE_URL`, senha do banco, `service_role` ou segredo JWT no mobile.
- No Supabase, o banco deve aceitar conexões apenas pelo backend.
- Use `CORS_ORIGIN` com os domínios reais do site; `*` serve apenas para desenvolvimento.
- Use HTTPS na API pública.
- Use a conexão Session pooler em rede IPv4 quando a conexão direta não estiver acessível.
- Não rode reset ou seeds em produção sem confirmar o efeito sobre os dados.
- Monitore as conexões do Supabase e mantenha o pool do backend pequeno. O pool da aplicação e o pooler do Supabase contam para os limites de conexão. [3]

## Sources

[1]: https://supabase.com/docs/guides/database/connecting-to-postgres "Supabase — Connect to your database"
[2]: https://supabase.com/docs/guides/local-development "Supabase — Local Development & CLI"
[3]: https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits "Supabase — Connection pooling and limits"


## Hospedar o Express no Render — passo a passo

O Render é uma opção simples para publicar este backend como Web Service.

1. Suba este projeto para um repositório privado no GitHub.
2. No Render, escolha **New → Web Service** e conecte o repositório.
3. Deixe o **Root Directory** na raiz do repositório, pois a API usa a pasta única `database/` que fica na raiz.
4. Use **Build Command** `npm ci --prefix backend/api`.
5. Use **Start Command** `npm start --prefix backend/api`.
6. Escolha um plano compatível com seu uso. O plano gratuito pode dormir após inatividade e deixar a primeira requisição mais lenta.
7. Cadastre estas variáveis de ambiente:

   ```env
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=URL_DO_CONNECT_DO_SUPABASE
   DB_SSL=true
   DB_POOL_MAX=5
   JWT_SECRET=UMA_CHAVE_LONGA_E_ALEATORIA
   CORS_ORIGIN=https://seu-site.com
   ```

8. Faça o primeiro deploy.
9. No endereço gerado pelo Render, teste `/health`, por exemplo:

   ```text
   https://movipay-api.onrender.com/health
   ```

10. No site, defina `NEXT_PUBLIC_API_URL` como `https://movipay-api.onrender.com/api/v1` e faça um novo deploy.
11. No mobile, defina `EXPO_PUBLIC_API_URL` com a mesma URL `/api/v1` antes de gerar o aplicativo.

O Render injeta a variável `PORT`; o Express já aceita esse valor. Não coloque `DATABASE_URL` em `frontend/mobile`, em `frontend/.env.local` público ou no repositório.

## Hospedar em Railway

O fluxo é equivalente:

1. Crie um novo projeto no Railway e conecte o repositório.
2. Mantenha a raiz do repositório como diretório do serviço, para incluir `database/` no deploy.
3. Use `npm ci --prefix backend/api` no build e `npm start --prefix backend/api` no start.
4. Cadastre `DATABASE_URL`, `DB_SSL=true`, `JWT_SECRET`, `CORS_ORIGIN` e `NODE_ENV=production`.
5. Gere um domínio público HTTPS.
6. Use `https://seu-dominio.up.railway.app/api/v1` como URL do site e do mobile.

## Testar pelo Postman

Crie um ambiente no Postman com estas variáveis:

```text
baseUrl = http://localhost:3000
token =
usuarioId =
```

Depois de publicar, troque `baseUrl` para o domínio HTTPS da API, sem `/api/v1`:

```text
baseUrl = https://movipay-api.onrender.com
```

### 1. Verificar a API

```text
GET {{baseUrl}}/health
```

Resposta esperada: HTTP 200 com `estado: "ok"`.

### 2. Verificar o fallback Overpass

```text
POST {{baseUrl}}/api/overpass
```

Não precisa de body. A resposta esperada contém:

```json
{
  "version": 0.6,
  "elements": [],
  "degraded": true
}
```

### 3. Fazer login

```text
POST {{baseUrl}}/api/v1/autenticacao/entrar
Content-Type: application/json
```

Body:

```json
{
  "email": "ana@teste.com",
  "senha": "123456"
}
```

Na aba **Tests** do Postman, salve o token retornado:

```javascript
const resposta = pm.response.json();
pm.environment.set('token', resposta.token_acesso);
pm.environment.set('usuarioId', resposta.usuario.id);
```

### 4. Consultar o usuário autenticado

```text
GET {{baseUrl}}/api/v1/autenticacao/me
Authorization: Bearer {{token}}
```

No Postman, você também pode configurar a aba **Authorization** como **Bearer Token** e informar `{{token}}`.

### 5. Consultar categorias e trabalhadores

```text
GET {{baseUrl}}/api/v1/categorias
GET {{baseUrl}}/api/v1/trabalhadores
```

Essas rotas públicas não precisam de token.

### 6. Listar serviços e pedidos

```text
GET {{baseUrl}}/api/v1/servicos
GET {{baseUrl}}/api/v1/pedidos
Authorization: Bearer {{token}}
```

### 7. Criar pedido

```text
POST {{baseUrl}}/api/v1/pedidos
Authorization: Bearer {{token}}
Content-Type: application/json
```

Exemplo de body:

```json
{
  "servico_id": 1,
  "trabalhador_id": 2,
  "descricao": "Preciso de um orçamento para o serviço."
}
```

Os IDs precisam existir no banco. Se você aplicou os seeds, use os IDs retornados pelas consultas de serviços e trabalhadores.

### 8. Consultar conversas

```text
GET {{baseUrl}}/api/v1/conversas
Authorization: Bearer {{token}}
```

### 9. Testar o alias preservado

O endpoint anterior de profissionais continua apontando para o mesmo roteador dos trabalhadores:

```text
GET {{baseUrl}}/api/v1/profissionais
```

Isso não cria uma segunda API: são dois caminhos HTTP para o mesmo módulo, a mesma regra de negócio e o mesmo banco. O app novo usa `/trabalhadores`; integrações antigas podem usar `/profissionais`.

### Ordem recomendada dos testes

Execute nesta ordem: `health`, `overpass`, `autenticacao/entrar`, `autenticacao/me`, `categorias`, `trabalhadores`, `servicos`, `pedidos`, `conversas`, `pontos` e `pagamentos`. Se o login funcionar mas uma rota protegida retornar 401, confira se o header está exatamente como `Bearer {{token}}`.
