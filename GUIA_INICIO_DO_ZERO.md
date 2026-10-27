# MoviPay — início do zero

Este guia começa com um computador sem Supabase, banco local, Postman ou dependências instaladas. A arquitetura recomendada é:

```text
Site Next.js ──────┐
                   ├──> API Express única ───> PostgreSQL do Supabase
App Expo Go 58 ────┘
```

O app não acessa o Supabase diretamente. Nenhuma senha do banco, `service_role` ou `JWT_SECRET` deve ficar no celular.

## 1. Pré-requisitos

Instale Node.js 20 LTS ou superior, Git, o Postman e o aplicativo Expo Go compatível com o SDK 58 no celular. O projeto mobile já está atualizado para `expo 58.0.19`, React Native `0.88.0` e React `19.3.0`.

Na pasta raiz do projeto, instale as dependências:

```bash
cd Movipay_TCC-main
cd backend/api && npm install
cd ../../frontend && npm install
cd mobile && npm install
```

## 2. Criar o projeto no Supabase

1. Acesse o painel do Supabase e crie um projeto.
2. Abra **Connect** e copie a conexão PostgreSQL.
3. Para um backend hospedado em Render, Railway ou ambiente semelhante, use o **Session pooler** quando a rede não oferecer IPv6.
4. Não copie essa URL para o app mobile, para o `.env.local` do site ou para o Git.

Depois configure a API:

```bash
cd backend/api
cp .env.example .env
```

Preencha o `.env`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres.PROJETO:SENHA@HOST_DO_POOLER:5432/postgres
DB_SSL=true
DB_POOL_MAX=10
JWT_SECRET=troque-por-uma-chave-grande-e-aleatoria
CORS_ORIGIN=http://localhost:3001
PUBLIC_API_URL=
PUBLIC_APP_URL=
PAYMENT_PROVIDER=manual_pix
PIX_KEY=
```

Se a senha contiver caracteres como `@`, `#`, `/` ou `:`, codifique-os na URL de conexão.

## 3. Criar as tabelas

Ainda dentro de `backend/api`, execute:

```bash
npm run db:migrate
```

As migrations utilizadas são as da única pasta `database/`. Não crie uma segunda pasta de banco e não rode `db:reset` em um projeto Supabase que já tenha dados importantes.

Para dados de demonstração locais, use apenas quando necessário:

```bash
npm run db:seed
```

## 4. Iniciar a API Express

Em um terminal separado:

```bash
cd Movipay_TCC-main/backend/api
npm run dev
```

Confirme:

```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/overpass
```

A resposta do healthcheck deve ser HTTP 200. O backend é a única API do site e do app.

## 5. Configurar o Postman

Importe os dois arquivos abaixo no Postman:

- `postman/MoviPay-API.postman_collection.json`
- `postman/MoviPay-API.postman_environment.json`

Selecione o ambiente **MoviPay — local**. A variável `baseUrl` já aponta para `http://localhost:3000`. Execute nesta ordem:

1. Health;
2. Overpass fallback;
3. Login;
4. Usuário autenticado;
5. Categorias;
6. Trabalhadores;
7. Serviços;
8. Pedidos;
9. Conversas.

O teste do login grava automaticamente `token` e `usuarioId` no ambiente. As próximas requisições autenticadas usarão `Authorization: Bearer {{token}}`.

Para testar o Supabase publicado, altere apenas `baseUrl` para a URL da API hospedada, por exemplo `https://api.seudominio.com`.

## 6. Configurar o site

Copie o ambiente de exemplo:

```bash
cd Movipay_TCC-main/frontend
cp .env.local.example .env.local
```

Use:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Inicie o site:

```bash
npm run dev
```

Abra `http://localhost:3001` caso a porta 3000 esteja ocupada pela API. Se o projeto iniciar em outra porta, use a URL exibida pelo Next.js.

## 7. Configurar o app no Expo Go 58

O arquivo `frontend/mobile/package.json` já está alinhado ao SDK 58. Copie o ambiente:

```bash
cd Movipay_TCC-main/frontend/mobile
cp .env.example .env
```

Para testar com o computador e o celular na mesma rede Wi-Fi, substitua a URL por seu IP local:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.10:3000/api/v1
```

Troque `192.168.0.10` pelo IP do computador. `localhost` dentro do celular aponta para o próprio celular, não para o computador.

Inicie o Metro:

```bash
npx expo start --clear
```

Escaneie o QR Code pelo Expo Go 58. Se o celular não alcançar o computador, permita a porta 3000 no firewall e confirme que os dois estão na mesma rede.

Para uma API publicada, use:

```env
EXPO_PUBLIC_API_URL=https://api.seudominio.com/api/v1
```

O túnel do Expo expõe o Metro, não o backend. Portanto, o backend ainda precisa estar publicado ou receber um túnel próprio.

## 8. Hospedar a API

Em um serviço Node como Render ou Railway, use:

- Diretório de instalação: `backend/api`;
- Build command: `npm install`;
- Start command: `npm start`;
- Health check: `/health`.

Configure no serviço as mesmas variáveis do `backend/api/.env`, principalmente `DATABASE_URL`, `DB_SSL=true`, `JWT_SECRET`, `CORS_ORIGIN` e `PUBLIC_API_URL`. Depois altere o `.env` mobile para a URL pública terminada em `/api/v1`.

Docker é opcional quando o banco está no Supabase Cloud. O Docker só é necessário se você quiser PostgreSQL local ou a stack local do Supabase.

## 9. Validação final

```bash
cd frontend && npm run build
cd mobile && npx expo-doctor@latest
cd mobile && npx expo export --platform web --output-dir /tmp/movipay-mobile-sdk58
cd ../../backend/api && npm run db:migrate
```

## Arquivos importantes

- API: `backend/api/src/aplicativo.js`;
- Variáveis da API: `backend/api/.env.example`;
- Banco único: `database/`;
- Site: `frontend/`;
- App: `frontend/mobile/`;
- Ambiente mobile: `frontend/mobile/.env.example`;
- Coleção Postman: `postman/MoviPay-API.postman_collection.json`;
- Ambiente Postman: `postman/MoviPay-API.postman_environment.json`.

## Fontes oficiais

[1]: https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/ "Expo — Upgrade Expo SDK"
[2]: https://expo.dev/changelog/sdk-58 "Expo — SDK 58"
[3]: https://supabase.com/docs/guides/database/connecting-to-postgres "Supabase — Connect to PostgreSQL"
