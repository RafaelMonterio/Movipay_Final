import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, Alert, Dimensions } from 'react-native';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiPublicacoes } from '../../apis/publicacoes';
import { apiConversas } from '../../apis/redeSocial';
import { urlMidiaAbsoluta } from '../../apis/midia';
import ContenedorTela from '../../componentes/ContenedorTela';
import { Avatar, Card, TelaCarregamento, Notice, EstadoVazio } from '../../componentes/interface';
import Icon from '../../componentes/Gravacao';
import Botao from '../../componentes/Botao';
import ReprodutorVideo from '../../componentes/ReprodutorVideo';
import { timeAgo } from '../../utilitarios/formatadores';

const { width: SCREEN_W } = Dimensions.get('window');
const MEDIA_W = SCREEN_W - 32;

/** * Detalhe de uma publicação. Serve para os dois lados: o dono abre a partir de "Meus trabalhos" (e tem o botão de excluir) e o cliente abre a partir do perfil do trabalhador (e... */
export default function TelaDetalhePublicacao({ route, navigation }) {
  const { shortId } = route.params || {};
  const { theme, rs } = usarTema();
  const { user } = usarAutenticacao();

  const [short, setShort] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [comments, setComments] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [detail, list] = await Promise.all([
        apiPublicacoes.detail(shortId),
        apiPublicacoes.comments(shortId).catch(() => []),
      ]);
      setShort(detail.short);
      setIsOwner(detail.isOwner);
      setComments(list);
      setError('');
    } catch (err) {
      setError(err.friendlyMessage || 'Não foi possível carregar a publicação.');
    }
  }, [shortId]);

  useEffect(() => {
    load().finally(() => setCarregando(false));
  }, [load]);

  const toggleLike = async () => {
    if (!short) return;
    const was = short.foi_curtido;
    setShort((s) => ({ ...s, foi_curtido: !was, quantidade_curtidas: Number(s.quantidade_curtidas) + (was ? -1 : 1) }));
    try {
      if (was) await apiPublicacoes.unlike(short.id);
      else await apiPublicacoes.like(short.id);
    } catch {
      setShort((s) => ({ ...s, foi_curtido: was, quantidade_curtidas: Number(s.quantidade_curtidas) + (was ? 1 : -1) }));
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Excluir publicação?',
      'A publicação e o arquivo serão removidos definitivamente, junto com as curtidas e os comentários. Não é possível desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await apiPublicacoes.remove(shortId);
              navigation.goBack();
            } catch (err) {
              setError(err.friendlyMessage || 'Não foi possível excluir.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const openChat = async () => {
    try {
      const conversation = await apiConversas.openDirect({ shortId, origin: 'short' });
      navigation.navigate('ChatThread', {
        conversationId: conversation.conversa_id,
        otherName: conversation.outro_nome || short?.nome_trabalhador,
      });
    } catch (err) {
      Alert.alert('Não foi possível abrir a conversa', err.friendlyMessage || 'Tente novamente.');
    }
  };

  if (carregando) return <TelaCarregamento label="Carregando publicação…" />;

  if (!short) {
    return (
      <ContenedorTela titulo="Publicação" onBack={() => navigation.goBack()}>
        <Notice kind="error" mensagem={error || 'Publicação não encontrada.'} />
      </ContenedorTela>
    );
  }

  const media = (short.media_urls || []).map(urlMidiaAbsoluta);
  const isVideo = short.tipo_midia === 'video';

  return (
    <ContenedorTela
      titulo="Publicação"
      onBack={() => navigation.goBack()}
      rightAction={
        isOwner ? (
          <Pressable onPress={confirmDelete} hitSlop={10} disabled={deleting}>
            <Icon nome="trash" size={22} color={theme.brand.danger} />
          </Pressable>
        ) : null
      }
    >
      <Notice kind="error" mensagem={error} />

      <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: theme.bgAlt, marginBottom: 16 }}>
        {isVideo ? (
          <ReprodutorVideo uri={media[0]} muted={false} loop interactive style={{ width: MEDIA_W, height: MEDIA_W * 1.3 }} />
        ) : media.length > 1 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {media.map((url, i) => (
              <Image key={i} source={{ uri: url }} style={{ width: MEDIA_W, height: MEDIA_W * 1.3 }} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <Image source={{ uri: media[0] }} style={{ width: MEDIA_W, height: MEDIA_W * 1.3 }} resizeMode="cover" />
        )}
      </View>

      <Pressable
        onPress={() => !isOwner && navigation.navigate('WorkerProfile', { workerId: short.trabalhador_id })}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}
      >
        <Avatar uri={short.url_avatar_trabalhador} nome={short.nome_trabalhador} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>
            {short.nome_trabalhador}
          </Text>
          <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
            {short.nome_categoria || 'Profissional'} · {timeAgo(short.criado_em)}
          </Text>
        </View>
        {!isOwner && <Icon nome="chevronRight" size={18} color={theme.textMuted} />}
      </Pressable>

      {!!short.caption && (
        <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.base), color: theme.text, marginBottom: 16 }}>
          {short.caption}
        </Text>
      )}

      <Card style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18 }}>
        <Metric icone="eye" label="Visualizações" value={short.quantidade_visualizacoes} />
        <Metric icone="heart" label="Curtidas" value={short.quantidade_curtidas} filled />
        <Metric icone="comment" label="Comentários" value={short.quantidade_comentarios} />
        <Metric icone="bookmark" label="Salvos" value={short.quantidade_salvos} />
      </Card>

      {!isOwner && (
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Botao
              label={short.foi_curtido ? 'Curtido' : 'Curtir'}
              icone="heart"
              variant={short.foi_curtido ? 'ghost' : 'primary'}
              onPress={toggleLike}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Botao label="Conversar" icone="chat" variant="ghost" onPress={openChat} />
          </View>
        </View>
      )}

      <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text, marginBottom: 10 }}>
        Comentários ({comments.length})
      </Text>

      {comments.length === 0 ? (
        <EstadoVazio icone="comment" titulo="Ainda sem comentários" subtitle="Seja a primeira pessoa a comentar." />
      ) : (
        comments.map((c) => (
          <View key={c.id} style={{ flexDirection: 'row', gap: 10, paddingVertical: 10 }}>
            <Avatar uri={c.url_avatar} nome={c.nome} size={34} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text }}>
                  {c.nome}
                </Text>
                <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs) - 1, color: theme.textMuted }}>
                  {timeAgo(c.criado_em)}
                </Text>
              </View>
              <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginTop: 3 }}>
                {c.conteudo}
              </Text>
            </View>
            {(isOwner || c.usuario_id === user?.id) && (
              <Pressable
                hitSlop={8}
                onPress={() =>
                  Alert.alert('Remover comentário?', '', [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Remover',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await apiPublicacoes.removeComment(shortId, c.id);
                          setComments((list) => list.filter((x) => x.id !== c.id));
                          setShort((s) => ({ ...s, quantidade_comentarios: Math.max(0, Number(s.quantidade_comentarios) - 1) }));
                        } catch (err) {
                          setError(err.friendlyMessage || 'Não foi possível remover.');
                        }
                      },
                    },
                  ])
                }
              >
                <Icon nome="trash" size={15} color={theme.textMuted} />
              </Pressable>
            )}
          </View>
        ))
      )}

      {isOwner && (
        <View style={{ marginTop: 24, marginBottom: 12 }}>
          <Botao
            label="Excluir publicação"
            icone="trash"
            variant="danger"
            onPress={confirmDelete}
            carregando={deleting}
          />
        </View>
      )}
    </ContenedorTela>
  );
}

function Metric({ icone, label, value, filled }) {
  const { theme, rs } = usarTema();
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Icon nome={icone} size={17} color={theme.brand.orange} filled={filled} />
      <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>
        {value ?? 0}
      </Text>
      <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs) - 2, color: theme.textMuted }}>{label}</Text>
    </View>
  );
}
