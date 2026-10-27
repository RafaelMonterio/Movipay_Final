import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ScrollView,
  Pressable,
  Dimensions,
  Share,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiPublicacoes } from '../../apis/publicacoes';
import { apiFavoritos } from '../../apis/mercado';
import { apiConversas } from '../../apis/redeSocial';
import { urlMidiaAbsoluta } from '../../apis/midia';
import { Avatar, EstadoVazio, TelaCarregamento, DistintivoPlano } from '../../componentes/interface';
import Icon from '../../componentes/Gravacao';
import PainelComentariosPublicacao from '../../componentes/PainelComentariosPublicacao';
import ReprodutorVideo, { MuteToggle } from '../../componentes/ReprodutorVideo';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function TelaPublicacoes({ navigation }) {
  const { user } = usarAutenticacao();
  const [publicacoes, setShorts] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [commentsFor, setCommentsFor] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [screenFocused, setScreenFocused] = useState(true);
  const viewedRef = useRef(new Set());

  const load = useCallback(async () => {
    const [feed, favs] = await Promise.all([
      apiPublicacoes.feed(user?.lat, user?.lng).catch(() => []),
      apiFavoritos.list().catch(() => []),
    ]);
    setShorts(feed);
    setFavoriteIds(favs.map((f) => f.trabalhador_id));
  }, [user?.lat, user?.lng]);

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      load().finally(() => setCarregando(false));
      // Ao sair da tela o vídeo precisa parar de verdade — senão continua tocando (e consumindo dados) atrás da tela seguinte.
      return () => setScreenFocused(false);
    }, [load])
  );

  // Só conta visualização do item que está realmente na tela, e uma vez por sessão. O backend ainda garante uma por usuário no banco.
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const first = viewableItems?.[0];
    if (!first) return;
    setActiveIndex(first.index ?? 0);

    const id = first.item?.id;
    if (id && !viewedRef.current.has(id)) {
      viewedRef.current.add(id);
      apiPublicacoes
        .registerView(id)
        .then(({ viewsCount }) =>
          setShorts((list) => list.map((s) => (s.id === id ? { ...s, quantidade_visualizacoes: viewsCount } : s)))
        )
        .catch(() => {});
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const toggleFavorite = async (workerId) => {
    const was = favoriteIds.includes(workerId);
    setFavoriteIds((ids) => (was ? ids.filter((id) => id !== workerId) : [...ids, workerId]));
    try {
      if (was) await apiFavoritos.remove(workerId);
      else await apiFavoritos.add(workerId);
    } catch {
      setFavoriteIds((ids) => (was ? [...ids, workerId] : ids.filter((id) => id !== workerId)));
    }
  };

  const toggleLike = async (short) => {
    setShorts((list) =>
      list.map((s) =>
        s.id === short.id
          ? { ...s, foi_curtido: !s.foi_curtido, quantidade_curtidas: Number(s.quantidade_curtidas) + (s.foi_curtido ? -1 : 1) }
          : s
      )
    );
    try {
      if (short.foi_curtido) await apiPublicacoes.unlike(short.id);
      else await apiPublicacoes.like(short.id);
    } catch {
      setShorts((list) =>
        list.map((s) => (s.id === short.id ? { ...s, foi_curtido: short.foi_curtido, quantidade_curtidas: short.quantidade_curtidas } : s))
      );
    }
  };

  const toggleSave = async (short) => {
    setShorts((list) => list.map((s) => (s.id === short.id ? { ...s, foi_salvo: !s.foi_salvo } : s)));
    try {
      if (short.foi_salvo) await apiPublicacoes.unsave(short.id);
      else await apiPublicacoes.save(short.id);
    } catch {
      setShorts((list) => list.map((s) => (s.id === short.id ? { ...s, foi_salvo: short.foi_salvo } : s)));
    }
  };

  /** * "Contato" — abre a conversa REAL com quem publicou. Passa `shortId` em vez do id do trabalhador de propósito: quem resolve o dono da publicação é o backend, então não há chanc... */
  const openChat = async (short) => {
    if (short.trabalhador_id === user?.id) {
      Alert.alert('Essa publicação é sua', 'Não é possível abrir uma conversa com você mesmo.');
      return;
    }
    try {
      const conversation = await apiConversas.openDirect({ shortId: short.id, origin: 'short' });
      navigation.navigate('ChatThread', {
        conversationId: conversation.conversa_id,
        otherName: conversation.outro_nome || short.nome_trabalhador,
      });
    } catch (err) {
      Alert.alert('Não foi possível abrir a conversa', err.friendlyMessage || 'Tente novamente em instantes.');
    }
  };

  const handleShare = async (short) => {
    try {
      await Share.share({
        mensagem: `Olha o trabalho de ${short.nome_trabalhador} no MoviPay! ${short.caption || ''}`.trim(),
      });
    } catch {
      /* compartilhamento cancelado */
    }
  };

  if (carregando) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <TelaCarregamento label="Carregando publicacoes…" />
      </View>
    );
  }

  if (publicacoes.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
        <EstadoVazio
          icone="play"
          titulo="Nenhum short por perto ainda"
          subtitle="Volte mais tarde para ver os trabalhadores da sua região."
        />
        {user?.eh_trabalhador && (
          <Pressable
            onPress={() => navigation.navigate('PublishShort')}
            style={{
              alignSelf: 'center',
              marginTop: 16,
              backgroundColor: '#FF7A00',
              borderRadius: 20,
              paddingHorizontal: 18,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: '#fff', fontFamily: FONTES.bodyBold }}>Publicar meu primeiro Short</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-conteudo" />
      <FlatList
        data={publicacoes}
        keyExtractor={(item) => String(item.id)}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_H}
        decelerationRate="fast"
        windowSize={3}
        maxToRenderPerBatch={2}
        initialNumToRender={1}
        removeClippedSubviews
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => (
          <ShortItem
            short={item}
            active={index === activeIndex && screenFocused}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
            isFavorite={favoriteIds.includes(item.trabalhador_id)}
            isOwn={item.trabalhador_id === user?.id}
            onFavorite={() => toggleFavorite(item.trabalhador_id)}
            onLike={() => toggleLike(item)}
            onSave={() => toggleSave(item)}
            onOpenProfile={() => navigation.navigate('WorkerProfile', { workerId: item.trabalhador_id })}
            onOpenComments={() => setCommentsFor(item.id)}
            onContact={() => openChat(item)}
            onShare={() => handleShare(item)}
          />
        )}
      />

      {navigation.canGoBack() && (
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ position: 'absolute', top: 50, left: 16, padding: 8 }}
          hitSlop={10}
        >
          <Icon nome="arrowLeft" size={24} color="#fff" />
        </Pressable>
      )}

      {user?.eh_trabalhador && (
        <Pressable
          onPress={() => navigation.navigate('PublishShort')}
          style={{
            position: 'absolute',
            top: 46,
            right: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'rgba(255,255,255,0.18)',
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 9,
          }}
        >
          <Icon nome="plus" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontFamily: FONTES.bodySemiBold, fontSize: 13 }}>Publicar</Text>
        </Pressable>
      )}

      <PainelComentariosPublicacao
        visible={!!commentsFor}
        shortId={commentsFor}
        onClose={() => setCommentsFor(null)}
        onCommentAdded={() =>
          setShorts((list) =>
            list.map((s) => (s.id === commentsFor ? { ...s, quantidade_comentarios: Number(s.quantidade_comentarios) + 1 } : s))
          )
        }
      />
    </View>
  );
}

function ShortItem({
  short,
  active,
  muted,
  onToggleMute,
  isFavorite,
  isOwn,
  onFavorite,
  onLike,
  onSave,
  onOpenProfile,
  onOpenComments,
  onContact,
  onShare,
}) {
  const { rs } = usarTema();
  const media = (short.media_urls || []).map(urlMidiaAbsoluta);
  const isVideo = short.tipo_midia === 'video';

  return (
    <View style={{ width: SCREEN_W, height: SCREEN_H, backgroundColor: '#111' }}>
      {isVideo ? (
        <ReprodutorVideo
          uri={media[0]}
          paused={!active}
          muted={muted}
          loop
          interactive
          style={{ width: SCREEN_W, height: SCREEN_H }}
        />
      ) : media.length > 1 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {media.map((url, idx) => (
            <Image key={idx} source={{ uri: url }} style={{ width: SCREEN_W, height: SCREEN_H }} resizeMode="cover" />
          ))}
        </ScrollView>
      ) : (
        <Image source={{ uri: media[0] }} style={{ width: SCREEN_W, height: SCREEN_H }} resizeMode="cover" />
      )}

      {isVideo && <MuteToggle muted={muted} onToggle={onToggleMute} style={{ position: 'absolute', top: 100, right: 18 }} />}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.78)']}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 240,
          paddingHorizontal: 16,
          // 40 -> 64: os vídeos ganharam uma barra de progresso própria ocupando os últimos 56px da tela (ver ReprodutorVideo), então a legenda precisa de um respi...
          paddingBottom: isVideo ? 84 : 40,
          paddingRight: 80,
          justifyContent: 'flex-end',
        }}
      >
        <Pressable onPress={onOpenProfile} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: '#fff' }}>
            {short.nome_trabalhador}
          </Text>
          <DistintivoPlano slug={short.worker_plan} label={short.worker_plan_badge} size="sm" />
        </Pressable>

        {!!short.nome_categoria && (
          <Text
            style={{
              fontFamily: FONTES.bodyMedium,
              fontSize: rs(TAMANHOS.xs),
              color: 'rgba(255,255,255,0.85)',
              marginTop: 3,
            }}
          >
            {short.nome_categoria}
            {typeof short.distance_km === 'number' ? ` · ${short.distance_km} km` : ''}
            {short.quantidade_visualizacoes > 0 ? ` · ${short.quantidade_visualizacoes} visualizações` : ''}
          </Text>
        )}

        {!!short.caption && (
          <Text
            style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: '#fff', marginTop: 8 }}
            numberOfLines={3}
          >
            {short.caption}
          </Text>
        )}
      </LinearGradient>

      <View style={{ position: 'absolute', right: 12, bottom: 86, alignItems: 'center', gap: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <Pressable onPress={onOpenProfile}>
            <Avatar uri={short.url_avatar_trabalhador} nome={short.nome_trabalhador} size={48} ring="#fff" />
          </Pressable>
          {!isOwn && (
            <Pressable
              onPress={onFavorite}
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: isFavorite ? '#FF7A00' : '#fff',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -10,
                borderWidth: 2,
                borderColor: '#000',
              }}
            >
              <Icon nome={isFavorite ? 'check' : 'plus'} size={12} color={isFavorite ? '#fff' : '#17241A'} />
            </Pressable>
          )}
        </View>

        <ActionBotao
          icone="heart"
          filled={short.foi_curtido}
          color={short.foi_curtido ? '#FF3B5C' : '#fff'}
          label={String(short.quantidade_curtidas ?? 0)}
          onPress={onLike}
        />
        <ActionBotao icone="comment" label={String(short.quantidade_comentarios ?? 0)} onPress={onOpenComments} />
        <ActionBotao
          icone="bookmark"
          filled={short.foi_salvo}
          color={short.foi_salvo ? '#FFB627' : '#fff'}
          label="Salvar"
          onPress={onSave}
        />
        {!isOwn && <ActionBotao icone="chat" label="Contato" highlight onPress={onContact} />}
        <ActionBotao icone="share" label="Enviar" onPress={onShare} />
      </View>
    </View>
  );
}

function ActionBotao({ icone, label, onPress, filled, highlight, color = '#fff' }) {
  const { rs } = usarTema();
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center' }} hitSlop={6}>
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: highlight ? '#FF7A00' : 'rgba(255,255,255,0.18)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon nome={icone} size={20} color={color} filled={filled} />
      </View>
      <Text
        style={{ color: '#fff', fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.xs) - 1, marginTop: 3 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
