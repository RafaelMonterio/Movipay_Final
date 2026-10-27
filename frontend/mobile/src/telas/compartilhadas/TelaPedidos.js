import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiPedidos } from '../../apis/pedidos';
import ContenedorTela from '../../componentes/ContenedorTela';
import { Card, DistintivoEstado, EstadoVazio, TelaCarregamento } from '../../componentes/interface';
import { formatCurrency, formatDateTime } from '../../utilitarios/formatadores';

const FILTERS = [
  { key: null, label: 'Todos' },
  { key: 'pending,accepted,in_progress', label: 'Ativos' },
  { key: 'completed', label: 'Concluídos' },
  { key: 'cancelled', label: 'Cancelados' },
];

export default function TelaPedidos({ route, navigation }) {
  const role = route.params?.role || 'client';
  const { theme, rs } = usarTema();
  const { user } = usarAutenticacao();
  const [pedidos, setOrders] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState(null);

  const load = useCallback(async () => {
    const params = { role };
    if (filter) params.estado = filter;
    const { pedidos: rows } = await apiPedidos.list(params);
    setOrders(rows);
  }, [role, filter]);

  useEffect(() => {
    setCarregando(true);
    load().finally(() => setCarregando(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const titulo = role === 'worker' ? 'Pedidos recebidos' : 'Meus pedidos';

  return (
    <ContenedorTela titulo={titulo} onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} scroll={false} padded={false}>
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
        {FILTERS.map((f) => (
          <Pressable key={f.label} onPress={() => setFilter(f.key)}>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: filter === f.key ? theme.brand.orange : theme.bgAlt,
              }}
            >
              <Text style={{ fontFamily: FONTES.bodyMedium, fontSize: rs(TAMANHOS.xs), color: filter === f.key ? '#fff' : theme.text }}>
                {f.label}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {carregando ? (
        <TelaCarregamento />
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand.orange} />}
          ListEmptyComponent={<EstadoVazio icone="clipboard" titulo="Nenhum pedido por aqui" subtitle="Quando houver pedidos, eles aparecem nesta lista." />}
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
              <Card style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text }} numberOfLines={1}>
                      {item.titulo_servico || item.nome_categoria || 'Pedido'}
                    </Text>
                    <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 3 }}>
                      {role === 'worker' ? item.nome_cliente : item.nome_trabalhador}
                    </Text>
                  </View>
                  <DistintivoEstado estado={item.estado} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                  <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.base), color: theme.brand.orange }}>
                    {formatCurrency(item.price)}
                  </Text>
                  <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
                    {formatDateTime(item.criado_em)}
                  </Text>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </ContenedorTela>
  );
}
