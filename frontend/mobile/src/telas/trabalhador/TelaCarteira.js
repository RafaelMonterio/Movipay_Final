import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { usarTema } from '../../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiPagamentos } from '../../apis/planos';
import ContenedorTela from '../../componentes/ContenedorTela';
import { Card, EstadoVazio, TelaCarregamento, Badge } from '../../componentes/interface';
import Icon from '../../componentes/Gravacao';
import { formatCurrency, formatDate } from '../../utilitarios/formatadores';

// Cobre os dois tipos de linha que o extrato pode trazer: o escrow antigo (held/released) e a transação de serviço (pending/paid/...).
const STATUS_LABEL = {
  pending: 'Aguardando pagamento',
  held: 'Reservado',
  paid: 'Pago',
  released: 'Recebido',
  cancelled: 'Cancelado',
  refunded: 'Estornado',
};
const STATUS_KIND = {
  pending: 'orange',
  held: 'orange',
  paid: 'green',
  released: 'green',
  cancelled: 'red',
  refunded: 'slate',
};

export default function TelaCarteira({ navigation }) {
  const { theme, rs } = usarTema();
  const [wallet, setWallet] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await apiPagamentos.wallet();
    setWallet(data);
  }, []);

  useEffect(() => {
    setCarregando(true);
    load().finally(() => setCarregando(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (carregando || !wallet) return <TelaCarregamento label="Carregando carteira…" />;

  return (
    <ContenedorTela titulo="Carteira" scroll={false} padded={false} onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}>
      <FlatList
        data={wallet.earnings?.length ? wallet.earnings : wallet.history}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand.green} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 20 }}>
            <Card style={{ alignItems: 'center', paddingVertical: 26 }}>
              <Icon nome="wallet" size={28} color={theme.brand.green} />
              <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginTop: 8 }}>
                Saldo disponível
              </Text>
              <Text style={{ fontFamily: FONTES.displayBlack, fontSize: rs(TAMANHOS.display), color: theme.text, marginTop: 4 }}>
                {formatCurrency(wallet.balance)}
              </Text>
              {/* A carteira precisa mostrar os três números, não só o
                  saldo: é o único lugar onde o trabalhador vê quanto a
                  plataforma reteve e por quê. */}
              {wallet.totals && wallet.totals.gross > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 16,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: theme.line,
                  }}
                >
                  <Breakdown label="Recebido bruto" value={wallet.totals.gross} color={theme.text} />
                  <Breakdown
                    label={`Taxa MoviPay (${wallet.commissionPercent ?? 15}%)`}
                    value={-wallet.totals.platformFees}
                    color={theme.textMuted}
                  />
                  <Breakdown label="Seu líquido" value={wallet.totals.net} color={theme.brand.green} />
                </View>
              )}

              {wallet.pendingHeld > 0 && (
                <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 6 }}>
                  + {formatCurrency(wallet.pendingHeld)} reservados em pedidos ativos
                </Text>
              )}
            </Card>
            <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text, marginTop: 20 }}>
              Extrato
            </Text>
          </View>
        }
        ListEmptyComponent={<EstadoVazio icone="wallet" titulo="Nenhuma movimentação ainda" />}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text }}>{item.nome_cliente}</Text>
                <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 2 }} numberOfLines={1}>
                  {item.titulo_servico || item.notes || 'Pedido'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>
                  {formatCurrency(item.valor_liquido ?? item.quantidade)}
                </Text>
                {item.valor_bruto != null && item.taxa_plataforma != null && (
                  <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs) - 1, color: theme.textMuted, marginTop: 2 }}>
                    {formatCurrency(item.valor_bruto)} − {formatCurrency(item.taxa_plataforma)} de taxa
                  </Text>
                )}
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Badge label={STATUS_LABEL[item.estado] || item.estado} kind={STATUS_KIND[item.estado] || 'slate'} />
              <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
                {formatDate(item.liberado_em || item.criado_em || item.held_at)}
              </Text>
            </View>
          </Card>
        )}
      />
    </ContenedorTela>
  );
}


/** Um número da divisão bruto → taxa → líquido. */
function Breakdown({ label, value, color }) {
  const { theme, rs } = usarTema();
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.sm), color }}>
        {formatCurrency(Math.abs(value))}
      </Text>
      <Text
        style={{
          fontFamily: FONTES.body,
          fontSize: rs(TAMANHOS.xs) - 2,
          color: theme.textMuted,
          marginTop: 3,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
