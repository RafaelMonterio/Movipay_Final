import React, { useCallback, useState } from 'react';
import { View, Text, Image, FlatList, Pressable, Dimensions, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usarTema } from '../../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiPublicacoes } from '../../apis/publicacoes';
import { urlMidiaAbsoluta } from '../../apis/midia';
import ContenedorTela from '../../componentes/ContenedorTela';
import { EstadoVazio, TelaCarregamento, Notice } from '../../componentes/interface';
import Icon from '../../componentes/Gravacao';
import Botao from '../../componentes/Botao';
import ReprodutorVideo from '../../componentes/ReprodutorVideo';

const GAP = 4;
const COLS = 3;
const { width: SCREEN_W } = Dimensions.get('window');
const CELL = (SCREEN_W - 32 - GAP * (COLS - 1)) / COLS;

/** * "Meus trabalhos" — as publicações do próprio trabalhador. Além de listar, agora dá para abrir cada publicação (curtidas, comentários, visualizações) e EXCLUIR. Duas coisas imp... */
export default function TelaMeusTrabalhos({ navigation }) {
  const { theme, rs } = usarTema();
  const [publicacoes, setShorts] = useState([]);
  const [totals, setTotals] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await apiPublicacoes.mine();
      setShorts(data.publicacoes || []);
      setTotals(data.totals || null);
      setError('');
    } catch (err) {
      setError(err.friendlyMessage || 'Não foi possível carregar suas publicações.');
    }
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

  const toggleSelect = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const exitSelection = () => {
    setSelecting(false);
    setSelected([]);
  };

  const confirmDelete = (ids) => {
    const count = ids.length;
    Alert.alert(
      count > 1 ? `Excluir ${count} publicações?` : 'Excluir publicação?',
      count > 1
        ? 'As publicações e os arquivos serão removidos definitivamente, junto com curtidas e comentários.'
        : 'A publicação e o arquivo serão removidos definitivamente, junto com as curtidas e os comentários. Não é possível desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => runDelete(ids) },
      ]
    );
  };

  const runDelete = async (ids) => {
    setDeleting(true);
    setError('');
    const failed = [];
    for (const id of ids) {
      try {
        await apiPublicacoes.remove(id);
      } catch (err) {
        failed.push(err.friendlyMessage || `Publicação #${id}`);
      }
    }
    // Recarrega do servidor em vez de só tirar da lista local: assim a tela mostra o que REALMENTE está no banco, não uma suposição.
    await load();
    exitSelection();
    setDeleting(false);
    if (failed.length) setError(`Não foi possível excluir: ${failed.join(', ')}`);
  };

  const headerAction = publicacoes.length > 0 && (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      {selecting ? (
        <>
          <Pressable onPress={() => selected.length && confirmDelete(selected)} hitSlop={10} disabled={!selected.length}>
            <Icon nome="trash" size={22} color={selected.length ? theme.brand.danger : theme.textMuted} />
          </Pressable>
          <Pressable onPress={exitSelection} hitSlop={10}>
            <Icon nome="x" size={22} color={theme.text} />
          </Pressable>
        </>
      ) : (
        <>
          {/* Botão de excluir ao lado do "+", como pedido. */}
          <Pressable onPress={() => setSelecting(true)} hitSlop={10}>
            <Icon nome="trash" size={22} color={theme.brand.danger} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('PublishShort')} hitSlop={10}>
            <Icon nome="plus" size={24} color={theme.brand.orange} />
          </Pressable>
        </>
      )}
    </View>
  );

  return (
    <ContenedorTela
      titulo={selecting ? `${selected.length} selecionada(s)` : 'Meus trabalhos'}
      onBack={() => (selecting ? exitSelection() : navigation.goBack())}
      scroll={false}
      padded={false}
      rightAction={headerAction}
    >
      {carregando ? (
        <TelaCarregamento label="Carregando suas publicações…" />
      ) : (
        <FlatList
          data={publicacoes}
          keyExtractor={(item) => String(item.id)}
          numColumns={COLS}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
          columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand.orange} />}
          ListHeaderComponent={
            <View>
              {!!error && <Notice kind="error" mensagem={error} style={{ marginTop: 12 }} />}
              {!!totals && publicacoes.length > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    backgroundColor: theme.bgAlt,
                    borderRadius: 16,
                    paddingVertical: 14,
                    marginVertical: 12,
                  }}
                >
                  <Stat label="Publicações" value={totals.publicacoes} />
                  <Stat label="Visualizações" value={totals.views} />
                  <Stat label="Curtidas" value={totals.likes} />
                  <Stat label="Comentários" value={totals.comments} />
                </View>
              )}
              {selecting && (
                <Text
                  style={{
                    fontFamily: FONTES.body,
                    fontSize: rs(TAMANHOS.sm),
                    color: theme.textMuted,
                    marginBottom: 10,
                  }}
                >
                  Toque nas publicações que quer excluir e confirme no ícone da lixeira.
                </Text>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={{ flex: 1 }}>
              <EstadoVazio
                icone="play"
                titulo="Você ainda não publicou nada"
                subtitle="Mostre um trabalho seu em foto ou vídeo para clientes da sua região."
              />
              <View style={{ paddingHorizontal: 40 }}>
                <Botao
                  label="Publicar meu primeiro Short"
                  icone="plus"
                  onPress={() => navigation.navigate('PublishShort')}
                />
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selected.includes(item.id);
            const isVideo = item.tipo_midia === 'video';
            const cover = urlMidiaAbsoluta(item.url_miniatura || item.media_urls?.[0]);

            return (
              <Pressable
                onPress={() =>
                  selecting ? toggleSelect(item.id) : navigation.navigate('ShortDetail', { shortId: item.id })
                }
                onLongPress={() => {
                  setSelecting(true);
                  toggleSelect(item.id);
                }}
                disabled={deleting}
                style={{
                  width: CELL,
                  height: CELL * 1.4,
                  borderRadius: 10,
                  overflow: 'hidden',
                  backgroundColor: theme.bgAlt,
                  borderWidth: isSelected ? 2.5 : 0,
                  borderColor: theme.brand.orange,
                }}
              >
                {isVideo && !item.url_miniatura ? (
                  <ReprodutorVideo uri={cover} paused muted style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                )}

                <View style={{ position: 'absolute', top: 6, right: 6 }}>
                  {selecting ? (
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: '#fff',
                        backgroundColor: isSelected ? theme.brand.orange : 'rgba(0,0,0,0.35)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && <Icon nome="check" size={11} color="#fff" />}
                    </View>
                  ) : (
                    <Icon nome={isVideo ? 'video' : item.media_urls?.length > 1 ? 'image' : 'camera'} size={14} color="#fff" />
                  )}
                </View>

                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingHorizontal: 6,
                    paddingVertical: 5,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                >
                  <StatChip icone="heart" value={item.quantidade_curtidas} />
                  <StatChip icone="comment" value={item.quantidade_comentarios} />
                  <StatChip icone="eye" value={item.quantidade_visualizacoes} />
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </ContenedorTela>
  );
}

function Stat({ label, value }) {
  const { theme, rs } = usarTema();
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.md), color: theme.text }}>{value ?? 0}</Text>
      <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs) - 1, color: theme.textMuted, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function StatChip({ icone, value }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Icon nome={icone} size={11} color="#fff" filled={icone === 'heart'} />
      <Text style={{ color: '#fff', fontFamily: FONTES.bodySemiBold, fontSize: 10 }}>{value ?? 0}</Text>
    </View>
  );
}
