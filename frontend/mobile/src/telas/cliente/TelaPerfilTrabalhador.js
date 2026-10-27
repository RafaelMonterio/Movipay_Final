import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, Pressable, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiTrabalhadores, apiFavoritos } from '../../apis/mercado';
import { apiPedidos } from '../../apis/pedidos';
import { apiConversas } from '../../apis/redeSocial';
import { urlMidiaAbsoluta } from '../../apis/midia';
import { Card, Avatar, AvaliacaoEstrelas, Badge, TelaCarregamento, EstadoVazio, DistintivoPlano, Notice } from '../../componentes/interface';
import ReprodutorVideo from '../../componentes/ReprodutorVideo';
import Icon from '../../componentes/Gravacao';
import Botao from '../../componentes/Botao';
import JanelaSolicitarServico from '../../componentes/JanelaSolicitarServico';
import { formatCurrency, weekdayLabel, hourLabel } from '../../utilitarios/formatadores';
import { iconForCategory } from '../../utilitarios/iconesCategorias';

function openInMaps(lat, lng, label) {
  const query = encodeURIComponent(label || 'Local');
  const url =
    Platform.OS === 'ios'
      ? `maps:0,0?q=${query}@${lat},${lng}`
      : Platform.OS === 'web'
      ? `https://www.google.com/maps/buscar/?api=1&query=${lat},${lng}`
      : `geo:0,0?q=${lat},${lng}(${query})`;
  Linking.openURL(url).catch(() => {
    Linking.openURL(`https://www.google.com/maps/buscar/?api=1&query=${lat},${lng}`);
  });
}

export default function TelaPerfilTrabalhador({ route, navigation }) {
  const { workerId } = route.params;
  const { theme, rs } = usarTema();
  const { user } = usarAutenticacao();
  const [data, setData] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Antes, se `apiTrabalhadores.detail` falhasse (sem rede, perfil não encontrado, backend fora do ar), a função lançava e `setCarregando(false)` — logo abai...
  const load = useCallback(async () => {
    setCarregando(true);
    setLoadError('');
    try {
      const detail = await apiTrabalhadores.detail(workerId);
      setData(detail);
      const favs = await apiFavoritos.list().catch(() => []);
      setIsFavorite(favs.some((f) => f.trabalhador_id === workerId));
    } catch (err) {
      setLoadError(err.friendlyMessage || 'Não foi possível carregar este perfil.');
    } finally {
      setCarregando(false);
    }
  }, [workerId]);

  useEffect(() => {
    load();
  }, [load]);

  /** * Botão CHAT do perfil — abre a conversa real com este trabalhador, usando o mesmo sistema de mensagens do resto do app (não é um botão decorativo: cria/recupera a thread no bac... */
  const [openingChat, setOpeningChat] = useState(false);
  const handleOpenChat = async () => {
    setOpeningChat(true);
    try {
      const conversation = await apiConversas.openDirect({ userId: workerId, origin: 'profile' });
      navigation.navigate('ChatThread', {
        conversationId: conversation.conversa_id,
        otherName: conversation.outro_nome,
      });
    } catch (err) {
      Alert.alert('Não foi possível abrir a conversa', err.friendlyMessage || 'Tente novamente em instantes.');
    } finally {
      setOpeningChat(false);
    }
  };

  const toggleFavorite = async () => {
    if (isFavorite) {
      await apiFavoritos.remove(workerId);
    } else {
      await apiFavoritos.add(workerId);
    }
    setIsFavorite((v) => !v);
  };

  const handleConfirmRequest = async ({ endereco_id, numero_endereco, complemento_endereco, notes, agendado_para }) => {
    setSubmitting(true);
    try {
      const order = await apiPedidos.create({
        trabalhador_id: workerId,
        servico_id: selectedService.id,
        endereco_id,
        numero_endereco,
        complemento_endereco,
        notes,
        agendado_para,
      });
      setSelectedService(null);
      Alert.alert('Pedido enviado!', 'Você será avisado assim que o profissional responder.', [
        { text: 'Ver pedido', onPress: () => navigation.replace('OrderDetail', { orderId: order.id }) },
      ]);
    } catch (err) {
      Alert.alert('Não foi possível enviar', err.friendlyMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (carregando) return <TelaCarregamento label="Carregando perfil…" />;

  // Antes disto não existia: uma falha de rede deixava a tela presa no carregando para sempre. Agora ela mostra o erro, mantém o botão de voltar (a pes...
  if (loadError || !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'left', 'right']}>
        <View style={{ padding: 16 }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ marginBottom: 16 }}>
            <Icon nome="arrowLeft" size={22} color={theme.text} />
          </Pressable>
          <Notice kind="error" mensagem={loadError || 'Não foi possível carregar este perfil.'} />
          <Botao label="Tentar novamente" onPress={load} />
        </View>
      </SafeAreaView>
    );
  }
  const { worker, servicos, portfolio, slots, avaliacoes, publicacoes } = data;
  const isSelf = user?.id === workerId;
  const myDefaultAddress = user?.address_street
    ? {
        endereco_id: user.endereco_id,
        numero_endereco: user.numero_endereco,
        complemento_endereco: user.complemento_endereco,
        display: `${user.address_street}, ${user.numero_endereco} — ${user.bairro}`,
      }
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Icon nome="arrowLeft" size={22} color={theme.text} />
          </Pressable>
          {!isSelf && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
              <Pressable onPress={toggleFavorite} hitSlop={10}>
                <Icon nome="heart" filled={isFavorite} size={22} color={isFavorite ? theme.brand.danger : theme.text} />
              </Pressable>
              {/* CHAT fica logo ao lado do coração, como pedido. */}
              <Pressable onPress={handleOpenChat} hitSlop={10} disabled={openingChat}>
                <Icon nome="chat" size={22} color={theme.brand.orange} />
              </Pressable>
            </View>
          )}
        </View>

        <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
          <Avatar uri={worker.url_avatar} nome={worker.nome} size={88} />
          <Text style={{ fontFamily: FONTES.display, fontSize: rs(TAMANHOS.xl), color: theme.text, marginTop: 12 }}>
            {worker.nome}
          </Text>
          {!!worker.nome_categoria && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Icon nome={iconForCategory(worker.categoria_slug)} size={14} color={theme.brand.orange} />
              <Text style={{ fontFamily: FONTES.bodyMedium, fontSize: rs(TAMANHOS.sm), color: theme.textMuted }}>
                {worker.nome_categoria}
              </Text>
            </View>
          )}
          <View style={{ marginTop: 8 }}>
            <AvaliacaoEstrelas value={Number(worker.media_avaliacao)} count={worker.total_avaliacoes} size={16} />
          </View>
          {!!worker.specialty && (
            <Text
              style={{
                fontFamily: FONTES.bodyMedium,
                fontSize: rs(TAMANHOS.sm),
                color: theme.text,
                textAlign: 'center',
                marginTop: 6,
              }}
            >
              {worker.specialty}
            </Text>
          )}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Badge label={worker.esta_disponivel ? 'Disponível agora' : 'Indisponível'} kind={worker.esta_disponivel ? 'green' : 'slate'} />
            {worker.eh_verificado && <Badge label="Verificado" kind="blue" />}
            {!!worker.modality && (
              <Badge
                label={worker.modality === 'online' ? 'Atende online' : worker.modality === 'both' ? 'Presencial e online' : 'Presencial'}
                kind="slate"
              />
            )}
            <DistintivoPlano slug={worker.slug_plano} label={worker.selo_plano} />
          </View>

          {(worker.preco_minimo != null || worker.preco_max != null) && (
            <Text
              style={{
                fontFamily: FONTES.monoSemiBold,
                fontSize: rs(TAMANHOS.base),
                color: theme.brand.orange,
                marginTop: 10,
              }}
            >
              {worker.preco_minimo != null && worker.preco_max != null && worker.preco_minimo !== worker.preco_max
                ? `${formatCurrency(worker.preco_minimo)} – ${formatCurrency(worker.preco_max)}`
                : formatCurrency(worker.preco_minimo ?? worker.preco_max)}
              {worker.tipo_preco === 'hourly' ? ' / hora' : worker.tipo_preco === 'daily' ? ' / diária' : ' por serviço'}
            </Text>
          )}

          {!isSelf && (
            <Pressable
              onPress={handleOpenChat}
              disabled={openingChat}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                alignSelf: 'stretch',
                marginTop: 16,
                backgroundColor: theme.brand.orange,
                borderRadius: 14,
                paddingVertical: 13,
                opacity: openingChat ? 0.7 : 1,
              }}
            >
              <Icon nome="chat" size={18} color="#fff" />
              <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: '#fff' }}>
                {openingChat ? 'Abrindo conversa…' : 'Conversar no chat'}
              </Text>
            </Pressable>
          )}
          {!!worker.bio && (
            <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, textAlign: 'center', marginTop: 14 }}>
              {worker.bio}
            </Text>
          )}
          {!!worker.address_street && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <Icon nome="location" size={14} color={theme.textMuted} />
              <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
                {worker.address_street}, {worker.numero_endereco} — {worker.bairro}
              </Text>
            </View>
          )}
        </View>

        {!!worker.lat && !!worker.lng && (
          <View style={{ marginTop: 18, paddingHorizontal: 16 }}>
            <View style={{ height: 150, borderRadius: 16, overflow: 'hidden' }}>
              <MapView
                style={{ flex: 1 }}
                pointerEvents="none"
                initialRegion={{ latitude: worker.lat, longitude: worker.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
              >
                <Marker coordinate={{ latitude: worker.lat, longitude: worker.lng }} pinColor={theme.brand.orange} />
              </MapView>
            </View>
            {/* O mapa acima é só uma prévia (por isso não reage a toque/zoom
                de propósito, para não brigar com o scroll da tela) — para
                abrir de verdade, com zoom e navegação completos, usa o app
                de mapas do próprio celular. */}
            <Pressable
              onPress={() => openInMaps(worker.lat, worker.lng, worker.nome)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, paddingVertical: 8 }}
            >
              <Icon nome="map" size={15} color={theme.brand.orange} />
              <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.brand.orange }}>
                Abrir no mapa (com zoom e navegação)
              </Text>
            </Pressable>
          </View>
        )}

        {portfolio.length > 0 && (
          <View style={{ marginTop: 22 }}>
            <SectionTitle titulo="Portfólio" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
              {portfolio.map((p) => (
                <Image key={p.id} source={{ uri: urlMidiaAbsoluta(p.url) }} style={{ width: 150, height: 110, borderRadius: 14 }} />
              ))}
            </ScrollView>
          </View>
        )}

        {(publicacoes || []).length > 0 && (
          <View style={{ marginTop: 22 }}>
            <SectionTitle titulo="Trabalhos publicados" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
              {publicacoes.map((sh) => {
                const cover = urlMidiaAbsoluta(sh.url_miniatura || sh.media_urls?.[0]);
                return (
                  <Pressable key={sh.id} onPress={() => navigation.navigate('ShortDetail', { shortId: sh.id })}>
                    <View style={{ width: 118, height: 170, borderRadius: 14, overflow: 'hidden', backgroundColor: theme.bgAlt }}>
                      {sh.tipo_midia === 'video' && !sh.url_miniatura ? (
                        <ReprodutorVideo uri={cover} paused muted style={{ width: '100%', height: '100%' }} />
                      ) : (
                        <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      )}
                      <View style={{ position: 'absolute', top: 6, right: 6 }}>
                        <Icon nome={sh.tipo_midia === 'video' ? 'video' : 'image'} size={13} color="#fff" />
                      </View>
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          flexDirection: 'row',
                          gap: 8,
                          paddingHorizontal: 6,
                          paddingVertical: 4,
                          backgroundColor: 'rgba(0,0,0,0.45)',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Icon nome="heart" size={10} color="#fff" filled />
                          <Text style={{ color: '#fff', fontFamily: FONTES.bodySemiBold, fontSize: 10 }}>{sh.quantidade_curtidas ?? 0}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Icon nome="eye" size={10} color="#fff" />
                          <Text style={{ color: '#fff', fontFamily: FONTES.bodySemiBold, fontSize: 10 }}>{sh.quantidade_visualizacoes ?? 0}</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {(!!worker.descricao_trabalhador || !!worker.experience || !!worker.area_servico) && (
          <View style={{ marginTop: 22, paddingHorizontal: 16 }}>
            <SectionTitle titulo="Sobre o profissional" noPadding />
            <Card>
              {!!worker.descricao_trabalhador && (
                <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.text }}>
                  {worker.descricao_trabalhador}
                </Text>
              )}
              {!!worker.experience && (
                <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginTop: 8 }}>
                  Experiência: {worker.experience}
                </Text>
              )}
              {!!worker.area_servico && (
                <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginTop: 4 }}>
                  Atende em: {worker.area_servico}
                </Text>
              )}
            </Card>
          </View>
        )}

        <View style={{ marginTop: 22, paddingHorizontal: 16 }}>
          <SectionTitle titulo="Serviços oferecidos" noPadding />
          {servicos.length === 0 ? (
            <EstadoVazio icone="briefcase" titulo="Sem serviços cadastrados" />
          ) : (
            servicos.map((s) => (
              <Card key={s.id} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>{s.titulo}</Text>
                  {!!s.descricao && s.descricao !== s.titulo && (
                    <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 2 }}>
                      {s.descricao}
                    </Text>
                  )}
                  <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.base), color: theme.brand.orange, marginTop: 6 }}>
                    {formatCurrency(s.price)}
                    {s.tipo_preco === 'hourly' ? '/hora' : s.tipo_preco === 'negotiable' ? ' (a combinar)' : ''}
                  </Text>
                </View>
                {!isSelf && user?.eh_cliente && (
                  <Pressable
                    onPress={() => setSelectedService(s)}
                    style={{ backgroundColor: theme.brand.orange, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}
                  >
                    <Text style={{ fontFamily: FONTES.bodyBold, color: '#fff', fontSize: rs(TAMANHOS.sm) }}>Solicitar</Text>
                  </Pressable>
                )}
              </Card>
            ))
          )}
        </View>

        {slots.length > 0 && (
          <View style={{ marginTop: 10, paddingHorizontal: 16 }}>
            <SectionTitle titulo="Disponibilidade semanal" noPadding />
            <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {slots.map((s) => (
                <Badge key={s.id} label={`${weekdayLabel(s.weekday, true)} ${hourLabel(s.hora_inicio)}–${hourLabel(s.hora_fim)}`} kind="blue" />
              ))}
            </Card>
          </View>
        )}

        {avaliacoes.length > 0 && (
          <View style={{ marginTop: 22, paddingHorizontal: 16 }}>
            <SectionTitle titulo={`Avaliações (${avaliacoes.length})`} noPadding />
            {avaliacoes.slice(0, 6).map((r) => (
              <Card key={r.id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text }}>{r.nome_avaliador}</Text>
                  <AvaliacaoEstrelas value={r.rating} size={13} />
                </View>
                {!!r.comment && (
                  <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginTop: 6 }}>
                    {r.comment}
                  </Text>
                )}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <JanelaSolicitarServico
        visible={!!selectedService}
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onConfirm={handleConfirmRequest}
        carregando={submitting}
        defaultAddress={myDefaultAddress}
      />
    </SafeAreaView>
  );
}

function SectionTitle({ titulo, noPadding }) {
  const { theme, rs } = usarTema();
  return (
    <Text
      style={{
        fontFamily: FONTES.bodyBold,
        fontSize: rs(TAMANHOS.base),
        color: theme.text,
        marginBottom: 10,
        paddingHorizontal: noPadding ? 0 : 16,
      }}
    >
      {titulo}
    </Text>
  );
}
