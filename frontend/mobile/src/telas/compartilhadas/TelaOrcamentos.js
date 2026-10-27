import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiOrcamentos } from '../../apis/pedidos';
import ContenedorTela from '../../componentes/ContenedorTela';
import { Card, DistintivoEstado, Badge, EstadoVazio, TelaCarregamento, Notice } from '../../componentes/interface';
import Icon from '../../componentes/Gravacao';
import Botao from '../../componentes/Botao';
import { formatDate } from '../../utilitarios/formatadores';
import { iconForCategory } from '../../utilitarios/iconesCategorias';

export default function TelaOrcamentos({ route, navigation }) {
  const role = route.params?.role || 'client';
  const { theme, rs } = usarTema();
  const { user } = usarAutenticacao();
  const [orcamentos, setQuotes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [needsCategory, setNeedsCategory] = useState(false);
  const [loadError, setLoadError] = useState('');

  const effectiveRole = role || user?.modo;

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const { orcamentos: rows } = await apiOrcamentos.list({ role: effectiveRole });
      setQuotes(rows);
      setNeedsCategory(false);
    } catch (err) {
      if (err.status === 400) setNeedsCategory(true);
      // Antes, qualquer outro erro (sem rede, servidor fora do ar) era silenciosamente ignorado — a tela ficava com a lista vazia sem nenhuma explicação, p...
      else setLoadError(err.friendlyMessage || 'Não foi possível carregar seus orçamentos.');
    }
  }, [effectiveRole]);

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
      titulo={effectiveRole === 'worker' ? 'Oportunidades' : 'Meus orçamentos'}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      scroll={false}
      padded={false}
      rightAction={
        effectiveRole === 'client' ? (
          <Pressable onPress={() => navigation.navigate('NovoOrcamento')} hitSlop={10}>
            <Icon nome="plus" size={24} color={theme.brand.orange} />
          </Pressable>
        ) : null
      }
    >
      {!!loadError && <Notice kind="error" mensagem={loadError} style={{ margin: 16, marginBottom: 0 }} />}
      {needsCategory ? (
        <EstadoVazio icone="briefcase" titulo="Defina sua categoria" subtitle="Complete seu perfil com uma categoria de atuação para ver oportunidades." />
      ) : carregando ? (
        <TelaCarregamento />
      ) : (
        <FlatList
          data={orcamentos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand.orange} />}
          ListHeaderComponent={
            effectiveRole === 'worker' && user?.slug_plano !== 'rainha' && user?.slug_plano !== 'operaria' ? (
              <Pressable onPress={() => navigation.getParent()?.navigate('Planos')}>
                <Card
                  style={{
                    marginBottom: 14,
                    borderWidth: 1.5,
                    borderColor: theme.brand.orange,
                    backgroundColor: 'rgba(255,122,0,0.07)',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Icon nome="crown" size={18} color={theme.brand.orange} />
                    <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.sm), color: theme.text, flex: 1 }}>
                      Quer aparecer primeiro nessas oportunidades?
                    </Text>
                  </View>
                  <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 6 }}>
                    Assine um plano e divulgue mais o seu perfil para os clientes da sua região.
                  </Text>
                  <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.xs), color: theme.brand.orange, marginTop: 8 }}>
                    Ver planos →
                  </Text>
                </Card>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <EstadoVazio
              icone="briefcase"
              titulo={effectiveRole === 'worker' ? 'Nenhuma oportunidade agora' : 'Você ainda não pediu orçamentos'}
              subtitle={effectiveRole === 'worker' ? 'Novas solicitações da sua categoria aparecem aqui.' : 'Toque em + para pedir um orçamento.'}
            />
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate('QuoteDetail', { quoteId: item.id })}>
              <Card style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon nome={iconForCategory(item.categoria_slug)} size={16} color={theme.brand.orange} />
                    <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text, flex: 1 }} numberOfLines={1}>
                      {item.titulo}
                    </Text>
                  </View>
                  <DistintivoEstado estado={item.estado} />
                </View>
                {item.categoria_slug === 'outros' && !!item.texto_categoria_personalizada && (
                  <Text style={{ fontFamily: FONTES.bodyMedium, fontSize: rs(TAMANHOS.xs), color: theme.brand.orange, marginTop: 4 }}>
                    Outros: {item.texto_categoria_personalizada}
                  </Text>
                )}
                {item.foi_impulsionado && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Icon nome="crown" size={12} color="#FFC65C" />
                    <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.xs) - 1, color: '#FFC65C' }}>
                      Em destaque
                    </Text>
                  </View>
                )}
                <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginTop: 8 }} numberOfLines={2}>
                  {item.descricao}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                  {effectiveRole === 'client' ? (
                    <Badge label={`${item.proposals_count || 0} proposta(s)`} kind="blue" />
                  ) : item.already_proposed ? (
                    <Badge label="Você já propôs" kind="green" />
                  ) : (
                    <Badge label="Enviar proposta" kind="orange" />
                  )}
                  <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
                    {formatDate(item.criado_em)}
                  </Text>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
      {effectiveRole === 'client' && (
        <View style={{ position: 'absolute', bottom: 20, right: 20 }}>
          <Botao label="Novo orçamento" icone="plus" fullWidth={false} onPress={() => navigation.navigate('NovoOrcamento')} />
        </View>
      )}
    </ContenedorTela>
  );
}
