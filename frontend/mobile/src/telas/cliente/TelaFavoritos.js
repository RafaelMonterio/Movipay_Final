import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usarTema } from '../../tema/ContextoTema';
import { apiFavoritos } from '../../apis/mercado';
import ContenedorTela from '../../componentes/ContenedorTela';
import { EstadoVazio, TelaCarregamento } from '../../componentes/interface';
import { CartaoTrabalhador } from '../../componentes/CartaoTrabalhador';

export default function TelaFavoritos({ navigation }) {
  const { theme } = usarTema();
  const [favoritos, setFavorites] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const rows = await apiFavoritos.list();
    setFavorites(rows);
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

  const removeFavorite = async (workerId) => {
    await apiFavoritos.remove(workerId);
    setFavorites((list) => list.filter((f) => f.trabalhador_id !== workerId));
  };

  if (carregando) return <TelaCarregamento />;

  return (
    <ContenedorTela titulo="Favoritos" scroll={false} padded={false} onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}>
      <FlatList
        data={favoritos}
        keyExtractor={(item) => String(item.trabalhador_id)}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand.orange} />}
        ListEmptyComponent={<EstadoVazio icone="heart" titulo="Nenhum favorito ainda" subtitle="Toque no coração de um profissional para salvá-lo aqui." />}
        renderItem={({ item }) => (
          <CartaoTrabalhador
            worker={{ ...item, nome: item.nome, id: item.trabalhador_id }}
            isFavorite
            onFavorite={() => removeFavorite(item.trabalhador_id)}
            onPress={() => navigation.navigate('WorkerProfile', { workerId: item.trabalhador_id })}
          />
        )}
      />
    </ContenedorTela>
  );
}
