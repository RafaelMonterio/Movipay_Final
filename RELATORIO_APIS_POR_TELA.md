# Relatório de APIs requisitadas por tela

Este relatório mostra onde cada API é chamada no projeto MoviPay. As linhas indicadas correspondem ao estado atual do código refatorado.

## Como interpretar

- **API web:** usa `frontend/src/servicos/clienteApi.js`.
- **API mobile:** usa `frontend/mobile/src/servicos/clienteApi.js`.
- A URL base padrão é `http://localhost:3000/api/v1` no web e `http://<host-do-Expo>:3000/api/v1` no mobile.
- Quando a tela chama um serviço, a coluna **Linha da requisição HTTP** aponta para a linha que realmente executa `api.get`, `api.post`, `api.patch` ou `api.delete`. A coluna **Tela/fluxo** mostra onde esse serviço é utilizado.
- O web possui um banco simulado local. Quando ele está ativo, a requisição passa pelo adaptador de `frontend/src/servicos/clienteApi.js`, que simula a resposta sem chamar o backend.

## 1. APIs de autenticação

| Plataforma | Tela ou fluxo | Método | Endpoint | Linha da requisição HTTP | Arquivo da requisição | Linha da tela/consumidor |
|---|---|---:|---|---:|---|---:|
| Web | Tela de login | POST | `/autenticacao/entrar` | 66 | `frontend/src/servicos/servicoAutenticacao.js` | `frontend/src/app/(auth)/login/page.js:71` e `:80` |
| Web | Tela de cadastro | POST | `/autenticacao/cadastrar` | 88 | `frontend/src/servicos/servicoAutenticacao.js` | `frontend/src/app/(auth)/register/page.js:562` |
| Web | Inicialização da sessão | GET | `/autenticacao/eu` | 137 | `frontend/src/servicos/servicoAutenticacao.js` | `frontend/src/contexto/contextoAutenticacao.jsx:28` |
| Web | Perfil do profissional | GET | `/autenticacao/eu` | 137 | `frontend/src/servicos/servicoAutenticacao.js` | `frontend/src/app/worker/profile/page.js:76` |
| Web | Perfil do cliente | GET | `/autenticacao/eu` | 137 | `frontend/src/servicos/servicoAutenticacao.js` | `frontend/src/app/client/profile/page.js:576` |
| Web | Troca cliente/profissional | PATCH | `/autenticacao/modo` | 153 | `frontend/src/servicos/servicoAutenticacao.js` | `frontend/src/contexto/contextoAutenticacao.jsx:59`; acionado em `frontend/src/app/client/profile/page.js:510` e `frontend/src/app/worker/profile/page.js:201` |
| Mobile | Login e cadastro | POST | `/autenticacao/entrar` | 6 | `frontend/mobile/src/servicos/servicoAutenticacao.js` | `frontend/mobile/src/telas/TelaLogin.js:27` |
| Mobile | Login e cadastro | POST | `/autenticacao/cadastrar` | 11 | `frontend/mobile/src/servicos/servicoAutenticacao.js` | `frontend/mobile/src/telas/TelaLogin.js:28` |
| Mobile | Inicialização da sessão | GET | `/autenticacao/eu` | 19 | `frontend/mobile/src/servicos/servicoAutenticacao.js` | `frontend/mobile/src/contexto/contextoAutenticacao.js:15` |
| Mobile | Troca cliente/profissional | PATCH | `/autenticacao/modo` | 23 | `frontend/mobile/src/servicos/servicoAutenticacao.js` | `frontend/mobile/src/contexto/contextoAutenticacao.js:39`; acionado em `TelaInicioCliente.js:129`, `TelaPerfilCliente.js:25`, `TelaInicioProfissional.js:73` e `TelaPerfilProfissional.js:23` |
| Web/Mobile | Sair da conta | — | Não faz chamada HTTP | — | O logout apenas remove o token local | Web: `frontend/src/servicos/servicoAutenticacao.js:158`; mobile: `frontend/mobile/src/servicos/servicoAutenticacao.js:15` |

## 2. APIs de pedidos e serviços

| Plataforma | Tela ou fluxo | Método | Endpoint | Linha da requisição HTTP | Arquivo da requisição | Linha da tela/consumidor |
|---|---|---:|---|---:|---|---:|
| Web | Listagem de pedidos do cliente | GET | `/pedidos` | 4 | `frontend/src/servicos/servicoPedidos.js` | `frontend/src/app/client/orders/page.js:751` |
| Web | Página inicial do cliente | GET | `/pedidos` | 4 | `frontend/src/servicos/servicoPedidos.js` | `frontend/src/app/client/page.js:672` |
| Web | Pedidos do profissional | GET | `/pedidos` | 4 | `frontend/src/servicos/servicoPedidos.js` | `frontend/src/app/worker/orders/page.js:42` |
| Web | Painel do profissional | GET | `/pedidos` | 4 | `frontend/src/servicos/servicoPedidos.js` | `frontend/src/app/worker/page.js:60` |
| Web | Ganhos do profissional | GET | `/pedidos` | 4 | `frontend/src/servicos/servicoPedidos.js` | `frontend/src/app/worker/earnings/page.js:39` |
| Web | Perfil do cliente | GET | `/pedidos` | 4 | `frontend/src/servicos/servicoPedidos.js` | `frontend/src/app/client/profile/page.js:582` |
| Web | Sino de notificações | GET | `/pedidos` | 29 | `frontend/src/componentes/feedback/SinoNotificacoes.jsx` | O componente é usado nos painéis autenticados |
| Web | Detalhes de um pedido | GET | `/pedidos/:id` | 34 | `frontend/src/app/client/orders/[id]/page.js` | A própria página de detalhe |
| Web | Atualização do status de pedido | PATCH | `/pedidos/:id/status` | 6 | `frontend/src/servicos/servicoPedidos.js` | `frontend/src/app/worker/orders/page.js:50` |
| Mobile | Lista de pedidos do cliente | GET | `/pedidos` | 4 | `frontend/mobile/src/servicos/servicoPedidos.js` | `frontend/mobile/src/telas/cliente/TelaPedidosCliente.js:15` |
| Mobile | Lista de pedidos do profissional | GET | `/pedidos` | 4 | `frontend/mobile/src/servicos/servicoPedidos.js` | `TelaPedidosProfissional.js:13`, `TelaInicioProfissional.js:20` e `TelaGanhosProfissional.js:18` |
| Mobile | Criar pedido a partir de serviço | POST | `/pedidos` | 6 | `frontend/mobile/src/servicos/servicoPedidos.js` | `frontend/mobile/src/telas/cliente/TelaBuscaCliente.js:32` |
| Mobile | Alterar status de pedido | PATCH | `/pedidos/:id/status` | 8 | `frontend/mobile/src/servicos/servicoPedidos.js` | `frontend/mobile/src/telas/trabalhador/TelaPedidosProfissional.js:21` |
| Mobile | Detalhes de pedido | GET | `/pedidos/:id` | 5 | `frontend/mobile/src/servicos/servicoPedidos.js` | Nenhum consumidor encontrado atualmente; o método está preparado no serviço |
| Web | Página de serviços do cliente | GET | `/servicos` | 1340 | `frontend/src/app/client/services/page.js` | A própria página |
| Web | Busca de profissionais/serviços | GET | `/profissionais` | 25 | `frontend/src/app/client/workers/page.js` | A própria página |
| Web | Página inicial do cliente | GET | `/profissionais` | 633 | `frontend/src/app/client/page.js` | A própria página |
| Web | Busca de profissionais no catálogo | GET | `/profissionais` | 1340 | `frontend/src/app/client/services/page.js` | A própria página |
| Web | Lista completa de profissionais | GET | `/profissionais` | 1718 | `frontend/src/app/client/services/page.js` | A própria página |
| Web | Perfil público do profissional | GET | `/profissionais/:id` | 112 | `frontend/src/app/client/workers/[id]/page.js` | A própria página |
| Web | Perfil profissional logado | GET | `/profissionais/:id` | 83 | `frontend/src/app/worker/profile/page.js` | A própria página |
| Web | Criar serviço do profissional | POST | `/servicos` | 142 | `frontend/src/app/worker/profile/page.js` | Perfil do profissional |
| Web | Gerenciar serviços do profissional | GET | `/servicos` | 45 | `frontend/src/app/worker/services/page.js` | A própria página |
| Web | Criar serviço do profissional | POST | `/servicos` | 56 | `frontend/src/app/worker/services/page.js` | A própria página |
| Mobile | Lista de serviços para o cliente | GET | `/servicos` | 16 | `frontend/mobile/src/telas/cliente/TelaBuscaCliente.js` | A própria tela |
| Mobile | Lista de serviços/oportunidades do profissional | GET | `/servicos` | 14 | `frontend/mobile/src/telas/trabalhador/TelaOportunidadesProfissional.js` | A própria tela |
| Mobile | Lista de profissionais | GET | `/profissionais` | 5 | `frontend/mobile/src/servicos/servicoProfissionais.js` | `TelaProfissionaisCliente.js:15` e `TelaInicioCliente.js:34` |
| Web | Alterar disponibilidade | PATCH | `/profissionais/:id/disponibilidade` | 106 | `frontend/src/app/worker/profile/page.js` | A própria página de perfil |
| Web | Adicionar foto ao portfólio | POST | `/profissionais/:id/portfolio` | 121 | `frontend/src/app/worker/profile/page.js` | A própria página de perfil |
| Web | Excluir foto do portfólio | DELETE | `/profissionais/:id/portfolio/:photoId` | 132 | `frontend/src/app/worker/profile/page.js` | A própria página de perfil |

## 3. APIs de conversas

| Plataforma | Tela ou fluxo | Método | Endpoint | Linha da requisição HTTP | Arquivo da requisição | Linha da tela/consumidor |
|---|---|---:|---|---:|---|---:|
| Web | Lista de conversas do cliente | GET | `/conversas` | 486 | `frontend/src/app/client/chat/page.js` | A própria página |
| Web | Abrir conversa direta com profissional | POST | `/conversas/direta` | 503 | `frontend/src/app/client/chat/page.js` | A própria página |
| Web | Carregar mensagens selecionadas | GET | `/conversas/:threadId` | 515 | `frontend/src/app/client/chat/page.js` | A própria página |
| Web | Marcar conversa como lida | POST | `/conversas/:threadId/lida` | 525 | `frontend/src/app/client/chat/page.js` | A própria página |
| Web | Enviar mensagem | POST | `/conversas/:threadId` | 543 | `frontend/src/app/client/chat/page.js` | A própria página |
| Web | Lista de conversas do profissional | GET | `/conversas` | 484 | `frontend/src/app/worker/chat/page.js` | A própria página |
| Web | Carregar mensagens selecionadas | GET | `/conversas/:threadId` | 504 | `frontend/src/app/worker/chat/page.js` | A própria página |
| Web | Marcar conversa como lida | POST | `/conversas/:threadId/lida` | 514 | `frontend/src/app/worker/chat/page.js` | A própria página |
| Web | Enviar mensagem | POST | `/conversas/:threadId` | 532 | `frontend/src/app/worker/chat/page.js` | A própria página |
| Mobile | Lista de conversas | GET | `/conversas` | 4 | `frontend/mobile/src/servicos/servicoConversas.js` | `frontend/mobile/src/telas/compartilhadas/TelaConversas.js:14` |
| Mobile | Carregar mensagens | GET | `/conversas/:idConversa` | 5 | `frontend/mobile/src/servicos/servicoConversas.js` | `TelaConversas.js:76` |
| Mobile | Enviar mensagem | POST | `/conversas/:idConversa` | 7 | `frontend/mobile/src/servicos/servicoConversas.js` | `TelaConversas.js:94` |

## 4. APIs de pontos, carteira e agenda

| Plataforma | Tela ou fluxo | Método | Endpoint | Linha da requisição HTTP | Arquivo da requisição | Linha da tela/consumidor |
|---|---|---:|---|---:|---|---:|
| Web | Página de pontos do cliente | GET | `/pontos/saldo` | 29 | `frontend/src/app/client/points/page.js` | A própria página |
| Web | Página de pontos do cliente | GET | `/pontos/historico` | 30 | `frontend/src/app/client/points/page.js` | A própria página |
| Web | Página de perfil do cliente | GET | `/pontos/saldo` | 565 | `frontend/src/app/client/profile/page.js` | A própria página |
| Web | Página de perfil do cliente | GET | `/pontos/historico` | 566 | `frontend/src/app/client/profile/page.js` | A própria página |
| Web | Página inicial do cliente | GET | `/pontos/saldo` | 669 | `frontend/src/app/client/page.js` | A própria página |
| Mobile | Tela de pontos | GET | `/pontos/saldo` | 4 | `frontend/mobile/src/servicos/servicoPontos.js` | `TelaPontosCliente.js:18` |
| Mobile | Tela de pontos | GET | `/pontos/historico` | 5 | `frontend/mobile/src/servicos/servicoPontos.js` | `TelaPontosCliente.js:19` |
| Mobile | Página inicial do cliente | GET | `/pontos/saldo` | 4 | `frontend/mobile/src/servicos/servicoPontos.js` | `TelaInicioCliente.js:33` |
| Web | Painel do profissional | GET | `/pagamentos/carteira` | 61 | `frontend/src/app/worker/page.js` | A própria página |
| Web | Tela de ganhos | GET | `/pagamentos/carteira` | 40 | `frontend/src/app/worker/earnings/page.js` | A própria página |
| Mobile | Tela de ganhos | GET | `/pagamentos/carteira` | 19 | `frontend/mobile/src/telas/trabalhador/TelaGanhosProfissional.js` | A própria tela |
| Web | Calendário compacto | GET | `/agenda/eventos` | 21 | `frontend/src/componentes/trabalhador/CalendarioCompacto.jsx` | O componente é usado no painel do profissional |
| Mobile | Agenda do profissional | GET | `/agenda/eventos` | 21 | `frontend/mobile/src/telas/trabalhador/TelaAgendaProfissional.js` | A própria tela |

## 5. APIs de orçamentos

| Plataforma | Tela ou fluxo | Método | Endpoint | Linha da requisição HTTP | Arquivo da requisição | Linha da tela/consumidor |
|---|---|---:|---|---:|---|---:|
| Web | Lista de orçamentos do cliente | GET | `/orcamentos` | 356 | `frontend/src/app/client/quotes/page.js` | A própria página |
| Web | Criar orçamento | POST | `/orcamentos` | 395 | `frontend/src/app/client/quotes/page.js` | A própria página |
| Web | Detalhes do orçamento | GET | `/orcamentos/:id` | 20 | `frontend/src/app/client/quotes/[id]/page.js` | A própria página |
| Web | Aceitar ou rejeitar proposta | PATCH | `/orcamentos/:id/propostas/:proposalId` | 29 | `frontend/src/app/client/quotes/[id]/page.js` | A própria página |
| Web | Lista de orçamentos do profissional | GET | `/orcamentos` | 40 | `frontend/src/app/worker/quotes/page.js` | A própria página |
| Web | Enviar proposta | POST | `/orcamentos/:id/propostas` | 51 | `frontend/src/app/worker/quotes/page.js` | A própria página |
| Mobile | Lista de orçamentos | GET | `/orcamentos` | 4 | `frontend/mobile/src/servicos/servicoOrcamentos.js` | `TelaOrcamentosCliente.js:15` |
| Mobile | Detalhes de orçamento | GET | `/orcamentos/:id` | 5 | `frontend/mobile/src/servicos/servicoOrcamentos.js` | Nenhum consumidor encontrado atualmente |
| Mobile | Criar orçamento | POST | `/orcamentos` | 6 | `frontend/mobile/src/servicos/servicoOrcamentos.js` | Nenhum consumidor encontrado atualmente |
| Mobile | Aceitar proposta | PATCH | `/orcamentos/:id/propostas/:idProposta` | 8 | `frontend/mobile/src/servicos/servicoOrcamentos.js` | Nenhum consumidor encontrado atualmente |
| Mobile | Recusar proposta | PATCH | `/orcamentos/:id/propostas/:idProposta` | 12 | `frontend/mobile/src/servicos/servicoOrcamentos.js` | Nenhum consumidor encontrado atualmente |

## 6. APIs de usuários e avaliações

| Plataforma | Tela ou fluxo | Método | Endpoint | Linha da requisição HTTP | Arquivo da requisição | Linha da tela/consumidor |
|---|---|---:|---|---:|---|---:|
| Web | Atualizar avatar/dados do usuário | PATCH | `/usuarios/:id` | 36 | `frontend/src/componentes/interface/EnvioAvatar.jsx` | Componente de envio de avatar |
| Web | Atualizar perfil do profissional | PATCH | `/usuarios/:id` | 95 | `frontend/src/app/worker/profile/page.js` | A própria página |
| Web | Atualizar perfil do cliente | PATCH | `/usuarios/:id` | 619 | `frontend/src/app/client/profile/page.js` | A própria página |
| Web | Criar avaliação de pedido | POST | `/avaliacoes` | 58 | `frontend/src/app/client/reviews/page.js` | A própria página |

## 7. Rotas do backend sem chamada de tela encontrada

As rotas abaixo existem no backend, mas a busca no web e no mobile não encontrou uma tela chamando-as atualmente. Elas podem estar preparadas para uma próxima etapa ou para integrações externas.

| Método | Endpoint do backend | Declaração | Observação |
|---:|---|---|---|
| POST | `/pagamentos/checkout` | `backend/api/src/rotas/v1/pagamentos.rotas.js:7` | Checkout de pagamento ainda não é chamado por nenhuma tela encontrada |
| POST | `/pagamentos/:id/release` | `backend/api/src/rotas/v1/pagamentos.rotas.js:47` | Liberação de pagamento ainda não é chamada por nenhuma tela encontrada |
| GET | `/profissionais/:id/slots` | `backend/api/src/rotas/v1/profissionais.rotas.js:160` | Consulta de horários disponíveis sem consumidor encontrado |
| GET | `/avaliacoes/profissional/:id` | `backend/api/src/rotas/v1/avaliacoes.rotas.js:39` | Listagem de avaliações públicas sem chamada encontrada |
| POST | `/agenda/eventos` | `backend/api/src/rotas/v1/diversas.rotas.js:43` | A agenda consulta eventos, mas não cria eventos via frontend atualmente |
| GET | `/usuarios/:id` | `backend/api/src/rotas/v1/diversas.rotas.js:57` | As telas usam `/autenticacao/eu` ou `/profissionais/:id` no lugar desta rota |
| PATCH | `/agenda/eventos` | Não existe como PATCH; é POST | O backend atualiza o agendamento usando `POST /agenda/eventos` |

## 8. Arquivos responsáveis pela configuração da API

| Plataforma | Arquivo | Linhas | Responsabilidade |
|---|---|---:|---|
| Web | `frontend/src/servicos/clienteApi.js` | 195–267 | Cria o cliente Axios, define a URL base, injeta token e ativa o banco simulado local |
| Web | `frontend/src/servicos/clienteApi.js` | 8–193 | Intercepta e simula as respostas das rotas quando o projeto roda sem backend |
| Mobile | `frontend/mobile/src/servicos/clienteApi.js` | 5–20 | Descobre a URL base pelo Expo ou por `EXPO_PUBLIC_API_URL` |
| Mobile | `frontend/mobile/src/servicos/clienteApi.js` | 22–34 | Injeta o token JWT e remove o token quando a API retorna HTTP 401 |
| Backend | `backend/api/src/aplicativo.js` | Rotas de montagem | Registra as rotas sob `/api/v1` e mantém aliases antigos em inglês para compatibilidade |
