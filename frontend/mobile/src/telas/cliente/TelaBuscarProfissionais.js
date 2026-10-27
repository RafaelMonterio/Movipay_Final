import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { usarTema } from '../../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiCategorias, apiTrabalhadores, apiFavoritos } from '../../apis/mercado';
import CampoEntrada from '../../componentes/CampoEntrada';
import Icon from '../../componentes/Gravacao';
import { CartaoTrabalhador, CategoryChip } from '../../componentes/CartaoTrabalhador';
import { EstadoVazio, TelaCarregamento, Notice } from '../../componentes/interface';

export default function TelaBuscarProfissionais({ navigation, route }) {
  const { theme, rs } = usarTema();
  const [query, setQuery] = useState('');
  // Antes, cada tecla digitada mudava `query`, o que recriava `search` (useCallback) e disparava o useEffect — ou seja, UMA REQUISIÇÃO POR LETRA digita...
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [categorias, setCategories] = useState([]);
  const [categorySlug, setCategorySlug] = useState(route.params?.categorySlug || null);
  const [workers, setWorkers] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [searchError, setSearchError] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    apiCategorias.list().then(setCategories).catch(() => {});
    apiFavoritos
      .list()
      .then((favs) => setFavoriteIds(favs.map((f) => f.trabalhador_id)))
      .catch(() => {});
    (async () => {
      const { estado } = await Location.requestForegroundPermissionsAsync();
      if (estado === 'granted') {
        try {
          const pos = await Location.getCurrentPositionAsync({});
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        } catch {
          // segue sem geolocalização — a busca por texto/categoria continua funcionando
        }
      }
    })();
  }, []);

  const search = useCallback(async () => {
    setCarregando(true);
    setSearchError('');
    try {
      const params = {};
      if (categorySlug) params.category = categorySlug;
      if (debouncedQuery) params.q = debouncedQuery;
      if (coords) {
        params.lat = coords.lat;
        params.lng = coords.lng;
      }
      const results = await apiTrabalhadores.search(params);
      setWorkers(results);
    } catch (err) {
      setSearchError(err.friendlyMessage || 'Não foi possível buscar profissionais agora.');
    } finally {
      setCarregando(false);
    }
  }, [categorySlug, debouncedQuery, coords]);

  useEffect(() => {
    search();
  }, [search]);

  // Otimista, com desfazer em caso de falha: a UI responde na hora, e se a chamada falhar (sem rede, por exemplo) o coração volta ao estado anterior em...
  const toggleFavorite = async (workerId) => {
    const wasFavorite = favoriteIds.includes(workerId);
    setFavoriteIds((ids) => (wasFavorite ? ids.filter((id) => id !== workerId) : [...ids, workerId]));
    try {
      if (wasFavorite) await apiFavoritos.remove(workerId);
      else await apiFavoritos.add(workerId);
    } catch {
      setFavoriteIds((ids) => (wasFavorite ? [...ids, workerId] : ids.filter((id) => id !== workerId)));
    }
  };

  // Handlers estáveis (mesma referência entre renders) — sem isso, o React.memo do CartaoTrabalhador não adianta nada: `onPress={() => ...}` inline cria uma f...
  const handleOpenWorker = useCallback(
    (workerId) => navigation.navigate('WorkerProfile', { workerId }),
    [navigation]
  );
  const handleToggleFavorite = useCallback((workerId) => toggleFavorite(workerId), [favoriteIds]);

  const renderWorkerItem = useCallback(
    ({ item }) => (
      <CartaoTrabalhador
        worker={item}
        isFavorite={favoriteIds.includes(item.id)}
        onFavorite={() => handleToggleFavorite(item.id)}
        onPress={() => handleOpenWorker(item.id)}
      />
    ),
    [favoriteIds, handleToggleFavorite, handleOpenWorker]
  );
  const keyExtractorWorker = useCallback((item) => String(item.id), []);

  const withLocation = workers.filter((w) => w.lat && w.lng);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'left', 'right']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <CampoEntrada placeholder="Buscar profissional ou serviço" icone="search" value={query} onChangeText={setQuery} style={{ marginBottom: 12 }} />
            <Notice kind="error" mensagem={searchError} />
          </View>
          <Pressable
            onPress={() => setViewMode((m) => (m === 'list' ? 'map' : 'list'))}
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: theme.bgAlt,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Icon nome={viewMode === 'list' ? 'map' : 'clipboard'} size={20} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <CategoryChip category={{ slug: null, nome: 'Todas', }} selected={!categorySlug} onPress={() => setCategorySlug(null)} />
          {categorias.map((c) => (
            <CategoryChip key={c.id} category={c} selected={categorySlug === c.slug} onPress={() => setCategorySlug(c.slug)} />
          ))}
        </ScrollView>
      </View>

      {carregando ? (
        <TelaCarregamento label="Buscando profissionais…" />
      ) : viewMode === 'map' ? (
        withLocation.length === 0 ? (
          <EstadoVazio icone="map" titulo="Sem localização" subtitle="Nenhum profissional com localização cadastrada para esse filtro." />
        ) : (
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: coords?.lat || withLocation[0].lat,
              longitude: coords?.lng || withLocation[0].lng,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
            zoomEnabled
            zoomTapEnabled
            scrollEnabled
            pitchEnabled
            rotateEnabled
            showsUserLocation={!!coords}
            showsMyLocationBotao={!!coords}
          >
            {withLocation.map((w) => (
              <Marker
                key={w.id}
                coordinate={{ latitude: w.lat, longitude: w.lng }}
                titulo={w.nome}
                descricao={w.nome_categoria}
                pinColor={theme.brand.orange}
                onCalloutPress={() => navigation.navigate('WorkerProfile', { workerId: w.id })}
              />
            ))}
          </MapView>
        )
      ) : (
        <FlatList
          data={workers}
          keyExtractor={keyExtractorWorker}
          renderItem={renderWorkerItem}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          // Virtualização de verdade: a tela de busca pode ter dezenas ou centenas de resultados, e antes TODOS eram montados de uma vez (ScrollView + .map não...
          initialNumToRender={8}
          windowSize={7}
          maxToRenderPerBatch={8}
          removeClippedSubviews
          ListEmptyComponent={
            <EstadoVazio icone="search" titulo="Nada por aqui ainda" subtitle="Tente outra categoria ou termo de busca." />
          }
        />
      )}
    </SafeAreaView>
  );
}
