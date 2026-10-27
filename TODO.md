# Entregas da integração completa

## Concluído nesta rodada

- [x] API única com contratos compatíveis em português para autenticação, saldo, histórico, pedidos, agenda, carteira e ganhos.
- [x] Site com favoritos reais consumindo `/favoritos`.
- [x] Site com feed de Shorts consumindo `/publicacoes`, incluindo filtro e salvar/remover.
- [x] Site com planos e carteira do trabalhador consumindo `/planos` e `/pagamentos`.
- [x] Site com agenda real baseada em pedidos agendados.
- [x] Site com total investido, ganhos e Folhas usando os mesmos campos principais do app.
- [x] Navegação web corrigida para as rotas reais do Next.js.
- [x] Rótulos visíveis remanescentes em inglês traduzidos no site.
- [x] Manifesto de rotas web atualizado em `frontend/public/manus-routes.json`.
- [x] Build Next.js aprovado com 28 rotas.
- [x] Exportação Expo aprovada.
- [x] Sintaxe da API e JSON do manifesto validados.

## Próximo passo operacional

- [ ] Executar a migration `022_folhas_debits_and_contracts.sql` no projeto Supabase real e validar os fluxos de saldo, pedido, proposta, agenda, carteira e planos contra dados reais.
- [ ] Configurar as credenciais do gateway de pagamento antes de testar Pix em produção.
