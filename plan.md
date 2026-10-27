# Plano de integração completa MoviPay

## Objetivo

Usar o aplicativo como referência funcional, manter o site com apresentação mais sofisticada e fazer ambos consumirem uma única API e um único banco, com nomenclatura e mensagens em português.

## Decisões

- A API Express e a pasta `database` continuam únicas.
- O backend terá contratos canônicos em português e aliases temporários apenas onde necessários para compatibilidade.
- O site terá páginas próprias para favoritos, Shorts, planos, carteira e agenda; não copiará a navegação visual mobile.
- O app continuará simples e otimizado para React Native.
- Dados mock serão restritos ao modo offline e filtrados pela conta atual.
- A conversão de Folhas será tratada como regra de negócio central, sem débitos duplicados.

## Estrutura

- `backend/api/src`: API Express, regras e respostas compartilhadas.
- `database/migrations`: schema único e migrações incrementais.
- `frontend/src`: site Next.js sofisticado, com páginas em português.
- `frontend/mobile/src`: aplicativo React Native simples, consumindo as mesmas rotas.

## Implementação

1. Normalizar contratos de autenticação, saldo, histórico, pedidos, agenda, carteira e ganhos.
2. Completar páginas web equivalentes a favoritos, Shorts, planos, carteira e agenda.
3. Padronizar textos e rótulos visíveis em português nos dois clientes.
4. Padronizar navegação e estados entre site e app, preservando interfaces diferentes.
5. Validar build web, exportação Expo, sintaxe da API e rotas públicas/protegidas.
