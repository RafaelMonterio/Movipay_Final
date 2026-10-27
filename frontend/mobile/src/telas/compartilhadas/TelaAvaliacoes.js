import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiAvaliacoes } from '../../apis/redeSocial';
import { apiTrabalhadores } from '../../apis/mercado';
import ContenedorTela from '../../componentes/ContenedorTela';
import { Card, AvaliacaoEstrelas, EstadoVazio, TelaCarregamento, Avatar } from '../../componentes/interface';
import { formatDate } from '../../utilitarios/formatadores';

export default function TelaAvaliacoes({ route, navigation }) {
  const role = route.params?.role;
  const { theme, rs } = usarTema();
  const { user } = usarAutenticacao();
  const effectiveRole = role || user?.modo;
  const [items, setItems] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (effectiveRole === 'worker') {
      const detail = await apiTrabalhadores.detail(user.id);
      setItems(detail.avaliacoes);
    } else {
      const rows = await apiAvaliacoes.mine();
      setItems(rows);
    }
  }, [effectiveRole, user?.id]);

  useEffect(() => {
    setCarregando(true);
    load().finally(() => setCarregando(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ContenedorTela
      titulo={effectiveRole === 'worker' ? 'Avaliações recebidas' : 'Minhas avaliações'}
      scroll={false}
      padded={false}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
    >
      {carregando ? (
        <TelaCarregamento />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand.orange} />}
          ListEmptyComponent={<EstadoVazio icone="star" titulo="Nenhuma avaliação ainda" />}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {effectiveRole === 'worker' && <Avatar uri={item.url_avatar_avaliador} nome={item.nome_avaliador} size={38} />}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text }}>
                    {effectiveRole === 'worker' ? item.nome_avaliador : `Para ${item.nome_avaliado}`}
                  </Text>
                  <AvaliacaoEstrelas value={item.rating} size={13} />
                </View>
                <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
                  {formatDate(item.criado_em)}
                </Text>
              </View>
              {!!item.comment && (
                <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginTop: 8 }}>
                  {item.comment}
                </Text>
              )}
            </Card>
          )}
        />
      )}
    </ContenedorTela>
  );
}
