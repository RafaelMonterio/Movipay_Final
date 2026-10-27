# Análise do diagnóstico do site e do mobile

Data da análise: 26/10/2026

Commit analisado: `035852f` (`Consolidar API banco e guia de hospedagem`)

## Conclusão executiva

O diagnóstico fornecido pela outra IA não está totalmente refletido no estado atual do projeto. Algumas correções estão presentes, mas várias funcionalidades descritas como concluídas ainda aparecem no código como mock, foram implementadas apenas visualmente ou continuam pendentes.

Também houve uma mudança grande no mobile: o aplicativo anexado substituiu a estrutura mobile anterior e trouxe novos fluxos, APIs, telas e recursos. Isso não significa que o site tenha sido transformado em um aplicativo simplificado; as interfaces continuam separadas. Porém, os contratos de dados ainda não estão completamente uniformes entre site, mobile e backend.

## Verificação item a item

| Item do diagnóstico | Estado atual | Evidência |
|---|---|---|
| Corrigir `setSelectionRange` no cadastro | **Implementado** | `frontend/src/app/(auth)/register/page.js:517` usa `input.setSelectionRange?.(...)`, evitando erro em inputs que não suportam o método. |
| Remover formiga duplicada do cadastro | **Provavelmente implementado** | A tela de cadastro renderiza `FolhasCaindo`, mas não o `FormigaCanvas` da home. A formiga continua propositalmente na página inicial. |
| Aplicar logo real da moeda Folha | **Parcialmente confirmado** | O componente `FolhaCoin` existe em `frontend/src/componentes/interface/Icone.jsx` e é usado nas telas de pontos/perfil. Ainda é necessária conferência visual em cada cartão. |
| Remover “Cupons por Folhas” | **Não implementado** | `frontend/src/app/client/profile/page.js:723` ainda renderiza “Cupons por Folhas”. |
| Usar Folhas como desconto real ao agendar/aceitar proposta | **Não comprovado e incompleto** | O backend possui pontos, histórico e pagamentos, mas não há uma operação clara de débito de Folhas vinculada à criação de pedido ou aceite de proposta. A busca por descontos/cupons não encontrou uma transação de desconto implementada. |
| Pedidos, orçamentos, saldo e histórico isolados por usuário | **Não resolvido no mock web** | `frontend/src/servicos/bancoSimulado.js:358` devolve todos os pedidos de `localStorage`; `:402` devolve todos os orçamentos; `criarPedido` fixa `client_id: 1` e `worker_id: 2` em `:371-375`. O cliente API mock também retorna essas coleções diretamente. |
| Bônus de boas-vindas de 150 Folhas | **Inconsistente** | A interface informa 150 Folhas em `register/page.js:265`, mas a API grava apenas 50 em `backend/api/src/rotas/autenticacao.rotas.js:157-162`. O mock de cadastro inicia a conta com `points: 0` em `servicoAutenticacao.js`. |
| Manter somente Ana e Bruno como contas mock | **Não implementado** | `frontend/src/servicos/bancoSimulado.js:13-183` contém Ana, Bruno, Carlos, Maria, Marina, Thiago, Camila e Roberto. Os pedidos e dados também citam Carlos em vários pontos. |
| Limpar dados antigos do navegador | **Não confirmado** | O banco simulado usa chaves persistentes como `movipay_orders`, `movipay_quotes` e `movipay_users`, mas não foi encontrado um reset/migração explícito que remova automaticamente todos os dados antigos na primeira execução da versão atual. |
| Mapa com escala aproximada de bairro | **Implementado parcialmente** | `MapaProfissionais.jsx:123` usa `zoom: 14`, mas é necessário conferir se todas as telas deixaram de ajustar o mapa aos bounds de todos os pontos. |
| Ícone de conta circular e foto real | **Implementado parcialmente** | Existe `EnvioAvatar.jsx` e uso de `avatar_url`; ainda precisa de conferência visual nas páginas de cliente, trabalhador e menu lateral. |
| Upload de foto do cliente preenchendo o círculo | **Implementado parcialmente** | `EnvioAvatar.jsx` possui o componente de foto/câmera, mas a confirmação final é visual. |
| Preço do prestador formatado em reais enquanto digita | **Não confirmado como completo** | A tela web `worker/profile/page.js:423` ainda usa diretamente um `<input type="number">`. O mobile possui formatadores próprios, mas isso não prova a implementação no site. |
| Botão de acessibilidade duplicado | **Ainda pode ocorrer** | `LayoutPainel.jsx` renderiza `ControlesAcessibilidade`; além disso, algumas páginas possuem estado e botão próprio, como `client/services/page.js:759` e `client/page.js:100`. |
| Trocar Prata/pontos pelo plano Formiga VIP com Operária, Voadora e Rainha | **Não implementado no site** | O site ainda usa `Prata`, `Ouro`, `Platina` e `Diamante` em `client/points/page.js:10` e `client/profile/page.js:78-83`. O backend/mobile já usam planos `formiga`, `operaria` e `rainha`, mas o nome Voadora não aparece como plano do backend. |
| Gráfico de ganhos do prestador igual ao da home | **Não concluído** | Existe `frontend/src/app/worker/earnings/page.js`, mas não há evidência de que o gráfico tenha sido alinhado ao da home; a própria página ainda precisa ser comparada visualmente. |
| Caminhão na frente do texto e atrás das folhas em todas as telas | **Parcial** | `FolhasCaindo.jsx` possui caminhão e folhas, e `LayoutPainel.jsx` injeta `FolhasCaindo`, mas a home e algumas páginas também renderizam efeitos próprios. A garantia de ordem visual em todas as telas ainda não está demonstrada. |
| Bloquear troca para trabalhador até completar cadastro | **Implementado no backend/mobile; incompleto no site** | O backend tem `/perfil-trabalhador/ativar` e validações de idade/perfil. O mobile tem `BecomeWorkerScreen`. O site ainda possui `alternarModo` direto em `servicoAutenticacao.js`, o que pode tentar trocar o modo sem passar pelo fluxo completo de ativação. |
| Calendário puxar serviços reais | **Backend/mobile implementados; site não** | O mobile usa `calendarApi.events` em `AgendaScreen.js`. No site, `frontend/src/app/worker/calendar/page.js` apenas redireciona para `/worker#calendario`; não há uma tela web equivalente consumindo a agenda real. |
| Total investido no perfil do cliente | **Não encontrado** | O perfil web tem saldo e histórico de Folhas, mas não foi encontrada uma métrica de “Total investido” calculada a partir dos pedidos pagos/concluídos. |
| Erro de cadastro de trabalhador | **Fluxo backend/mobile existe; site ainda é incompatível em partes** | O backend exige dados profissionais, CPF, data de nascimento, endereço e campos de trabalhador. O site recebeu CPF/data de nascimento, mas ainda não possui o mesmo fluxo completo de ativação profissional do mobile. |
| Perfil do trabalhador semelhante ao restante do site | **Não concluído** | `frontend/src/app/worker/profile/page.js` ainda usa blocos e níveis próprios; não há evidência de revisão visual geral concluída. |

## Mudança real do aplicativo mobile

O mobile mudou bastante em funcionalidades e arquitetura desde a versão original. O projeto atual possui APIs e telas para:

- favoritos;
- Shorts/publicações com mídia, curtidas, comentários e salvamentos;
- upload de avatar, portfólio e vídeos;
- ativação de perfil de trabalhador;
- planos Formiga, Operária e Rainha;
- checkout Pix;
- carteira e pagamentos;
- agenda com compromissos e anotações;
- orçamento, propostas e aceite de proposta;
- chat direto e chat associado a pedido/publicação;
- avaliações;
- perfil público do trabalhador.

Isso representa uma ampliação funcional relevante do mobile, mas não necessariamente uma alteração indevida do front. O mobile continua com componentes React Native e navegação própria, enquanto o site mantém Next.js, layout mais amplo e mais efeitos visuais.

## Funcionalidades do mobile que fazem sentido no site

As seguintes funcionalidades podem ser levadas para o site reaproveitando a mesma API, mas com uma interface própria mais sofisticada:

1. **Favoritos**: adicionar uma página ou painel de profissionais favoritos.
2. **Ativação de trabalhador**: usar no site o mesmo fluxo seguro do mobile em vez de apenas alternar o modo.
3. **Agenda real**: transformar `/worker/calendar` em uma agenda web que consuma `/api/v1/agenda/eventos` e `/api/v1/agenda/notas`.
4. **Planos e pagamentos**: criar uma página web de planos utilizando `/api/v1/planos` e checkout Pix.
5. **Shorts e portfólio**: apresentar publicações no perfil do trabalhador sem copiar a interface vertical do celular.
6. **Carteira e comissão**: usar os dados reais de carteira do mobile em uma tabela/gráfico mais completo no site.
7. **Avaliações**: mostrar avaliações reais no perfil do trabalhador e na área de gestão do cliente.
8. **Total investido**: calcular no backend a partir de pedidos concluídos/pagos e exibir no perfil do cliente.

## Problemas de integração que merecem prioridade

1. **Formato do saldo**: o site consulta `/pontos/saldo` esperando `data.balance`, enquanto o backend atual retorna `pontos` e `levelInfo`. O adaptador web precisa normalizar o formato ou as telas precisam usar o contrato atual.
2. **Histórico de Folhas**: o site espera `transactions`, mas o backend atual trabalha com o formato português do histórico. É necessário um adaptador único.
3. **Pedidos web**: o backend exige `trabalhador_id`, `servico_id`, `endereco_id` e `numero_endereco`; o serviço web antigo cria pedido somente com `service_id`/`servico_id`. O fluxo web precisa enviar os dados completos.
4. **Cadastro web de trabalhador**: o mobile usa o fluxo `perfil-trabalhador/ativar`, enquanto o site ainda tenta cadastrar/trocar modo de forma mais simples.
5. **Pontos versus planos**: o site trata pontos como níveis Prata/Ouro/Platina; o backend trata pontos como saldo de Folhas e planos de trabalhador como Formiga/Operária/Rainha. Esses conceitos precisam ser separados visualmente e no contrato.
6. **Dados simulados**: enquanto `NEXT_PUBLIC_API_URL` não estiver configurada, o site ainda pode mostrar dados do `bancoSimulado.js`. Isso é útil para demonstração offline, mas não pode ser confundido com os dados reais do Supabase.

## Recomendação

Não recomendo reescrever o front inteiro. A estratégia mais segura é:

1. manter a interface mobile simples e própria;
2. manter o site sofisticado e próprio;
3. compartilhar apenas APIs, regras de negócio, nomes de estados e contratos de resposta;
4. retirar os dados mock do fluxo de produção;
5. corrigir primeiro saldo/histórico, pedidos, cadastro de trabalhador e isolamento por usuário;
6. depois levar favoritos, agenda, planos, carteira e Shorts para o site em páginas próprias.

O maior risco atual não é o visual. É o site, quando conectado ao backend real, ainda esperar respostas do mock antigo em algumas telas.
