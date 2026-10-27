import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usarTema } from '../../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiConversas } from '../../apis/redeSocial';
import ContenedorTela from '../../componentes/ContenedorTela';
import { Avatar, EstadoVazio, TelaCarregamento, Badge } from '../../componentes/interface';
import { timeAgo } from '../../utilitarios/formatadores';

export default function TelaListaConversas({ navigation }) {
  const { theme, rs } = usarTema();
  const [conversas, setConversations] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const rows = await apiConversas.conversas();
    setConversations(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setCarregando(false));
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ContenedorTela titulo="Conversas" scroll={false} padded={false} onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}>
      {carregando ? (
        <TelaCarregamento />
      ) : (
        <FlatList
          data={conversas}
          keyExtractor={(item) => String(item.conversa_id)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand.orange} />}
          ListEmptyComponent={
            <EstadoVazio
              icone="chat"
              titulo="Nenhuma conversa ainda"
              subtitle="Fale com um profissional pelo perfil dele ou pelo botão Contato nos Shorts."
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate('ChatThread', {
                  conversationId: item.conversa_id,
                  orderId: item.pedido_id,
                  otherName: item.outro_nome,
                })
              }
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 }}
            >
              <Avatar uri={item.url_avatar_outro} nome={item.outro_nome} size={50} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.base), color: theme.text }} numberOfLines={1}>
                    {item.outro_nome}
                  </Text>
                  <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
                    {timeAgo(item.ultima_mensagem_em)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
                  <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, flex: 1 }} numberOfLines={1}>
                    {item.last_message || 'Conversa iniciada — envie a primeira mensagem.'}
                  </Text>
                  {item.quantidade_nao_lidas > 0 && <Badge label={String(item.quantidade_nao_lidas)} kind="orange" />}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </ContenedorTela>
  );
}
