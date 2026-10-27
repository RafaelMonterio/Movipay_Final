#!/bin/sh
# Testa rapidamente o fluxo mais crítico do MoviPay contra uma API já rodando
# (npm start em outro terminal). Precisa de `curl` e `jq` instalados.
#
# Uso: sh scripts/teste-fumaca.sh

API="${API_URL:-http://localhost:3000/api/v1}"
echo "🔎 Testando API em $API"

health=$(curl -s -o /dev/null -w "%{http_code}" "${API%/api/v1}/health")
if [ "$health" != "200" ]; then
  echo "✘ API não respondeu em ${API%/api/v1}/health (rode 'npm start' primeiro)"
  exit 1
fi
echo "✔ API no ar"

ana=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"email":"ana@teste.com","password":"123456"}')
ANA_TOKEN=$(printf '%s' "$ana" | jq -r .access_token)
if [ "$ANA_TOKEN" = "null" ] || [ -z "$ANA_TOKEN" ]; then
  echo "✘ Não foi possível logar como ana@teste.com — rode 'npm run db:seed' primeiro"
  exit 1
fi
echo "✔ Login como ana@teste.com (cliente) ok"

bruno=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"email":"bruno@teste.com","password":"123456"}')
BRUNO_TOKEN=$(printf '%s' "$bruno" | jq -r .access_token)
BRUNO_ID=$(printf '%s' "$bruno" | jq -r .user.id)
echo "✔ Login como bruno@teste.com (trabalhador) ok"

SERVICE_ID=$(curl -s "$API/workers/$BRUNO_ID" | jq -r '.services[0].id')
echo "✔ bruno tem serviços cadastrados (service_id=$SERVICE_ID)"

order=$(curl -s -X POST "$API/orders" -H "Content-Type: application/json" -H "Authorization: Bearer $ANA_TOKEN" \
  -d "{\"worker_id\":$BRUNO_ID,\"service_id\":$SERVICE_ID,\"notes\":\"smoke test\",\"address_id\":1,\"address_number\":\"120\"}")
ORDER_ID=$(printf '%s' "$order" | jq -r .order.id)
echo "✔ ana criou o pedido #$ORDER_ID"

recebidos=$(curl -s "$API/orders?role=worker" -H "Authorization: Bearer $BRUNO_TOKEN" | jq ".orders[] | select(.id==$ORDER_ID)")
if [ -z "$recebidos" ]; then
  echo "✘ O pedido não apareceu em 'pedidos recebidos' do bruno — algo está errado"
  exit 1
fi
echo "✔ bruno vê o pedido em 'pedidos recebidos'"

curl -s -o /dev/null -X PATCH "$API/orders/$ORDER_ID/status" -H "Content-Type: application/json" -H "Authorization: Bearer $BRUNO_TOKEN" -d '{"status":"accepted"}'
status=$(curl -s "$API/orders/$ORDER_ID" -H "Authorization: Bearer $ANA_TOKEN" | jq -r .order.status)
if [ "$status" != "accepted" ]; then
  echo "✘ ana não vê o pedido como 'accepted' depois do bruno aceitar"
  exit 1
fi
echo "✔ ana vê o pedido como 'accepted' depois do bruno aceitar"

echo ""
echo "🎉 Fluxo crítico ana <-> bruno funcionando de ponta a ponta!"
