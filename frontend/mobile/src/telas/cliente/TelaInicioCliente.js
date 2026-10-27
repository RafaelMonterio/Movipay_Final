import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiCategorias, apiTrabalhadores, apiFavoritos } from '../../apis/mercado';
import { apiAtividades } from '../../apis/redeSocial';
import { apiAutenticacao } from '../../apis/autenticacao';
import { Card, PointsPill, EstadoVazio, Notice } from '../../componentes/interface';
import { CartaoTrabalhador, CategoryChip } from '../../componentes/CartaoTrabalhador';
import Icon from '../../componentes/Gravacao';
import DistintivoNotificacao from '../../componentes/DistintivoNotificacao';
import { timeAgo } from '../../utilitarios/formatadores';

export default function TelaInicioCliente({ navigation }) {
  const { theme, rs } = usarTema();
  const { user, atualizarUsuario, contagemNaoLidas } = usarAutenticacao();
  const [categorias, setCategories] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [activity, setActivity] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Cada chamada tem seu próprio `.catch` de propósito: se só a busca de "atividade recente" falhar, o resto da tela inicial (categorias, profissionais...
  const load = useCallback(async () => {
    let anyFailed = false;
    const catchAndFlag = (p) => p.catch(() => {
      anyFailed = true;
      return [];
    });
    const [cats, workers, act, favs] = await Promise.all([
      catchAndFlag(apiCategorias.list()),
      catchAndFlag(apiTrabalhadores.search({ cidade: user?.cidade })),
      catchAndFlag(apiAtividades.recent()),
      catchAndFlag(apiFavoritos.list()),
    ]);
    setCategories(cats);
    setNearby(workers.slice(0, 5));
    setActivity(act);
    setFavoriteIds(favs.map((f) => f.trabalhador_id));
    setLoadError(anyFailed ? 'Alguns dados não puderam ser carregados. Puxe para baixo para tentar de novo.' : '');
  }, [user?.cidade]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDailyBonus = async () => {
    setClaimingBonus(true);
    try {
      const { quantidade } = await apiAutenticacao.claimDailyBonus();
      await atualizarUsuario();
      Alert.alert('Bônus resgatado! 🍃', `Você ganhou +${quantidade} Folhas hoje.`);
    } catch (err) {
      Alert.alert('Bônus indisponível', err.friendlyMessage);
    } finally {
      setClaimingBonus(false);
    }
  };

  const toggleFavorite = async (workerId) => {
    if (favoriteIds.includes(workerId)) {
      await apiFavoritos.remove(workerId);
      setFavoriteIds((ids) => ids.filter((id) => id !== workerId));
    } else {
      await apiFavoritos.add(workerId);
      setFavoriteIds((ids) => [...ids, workerId]);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand.orange} />}
      >
        <Notice kind="warning" mensagem={loadError} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Pressable onPress={() => navigation.navigate('Pontos')}>
            <PointsPill pontos={user?.pontos ?? 0} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('ChatList')}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.bgAlt, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon nome="chat" size={19} color={theme.text} />
            <DistintivoNotificacao count={contagemNaoLidas} />
          </Pressable>
        </View>

        <View style={{ marginBottom: 18 }}>
          <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted }}>Olá,</Text>
          <Text style={{ fontFamily: FONTES.display, fontSize: rs(TAMANHOS.xl), color: theme.text }}>
            {user?.nome?.split(' ')[0]}
          </Text>
        </View>

        <Pressable onPress={handleDailyBonus} disabled={claimingBonus}>
          <LinearGradient
            colors={[theme.brand.orange, theme.brand.green]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}
          >
            <Icon nome="gift" size={26} color="#fff" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontFamily: FONTES.bodyBold, color: '#fff', fontSize: rs(TAMANHOS.base) }}>
                Bônus diário de Folhas
              </Text>
              <Text style={{ fontFamily: FONTES.body, color: 'rgba(255,255,255,0.9)', fontSize: rs(TAMANHOS.xs) }}>
                Toque para resgatar +5 🍃 de hoje
              </Text>
            </View>
            <Icon nome="chevronRight" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>

        <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text, marginBottom: 10 }}>
          O que você precisa?
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 22 }}>
          {categorias.map((c) => (
            <CategoryChip
              key={c.id}
              category={c}
              selected={false}
              onPress={() => navigation.navigate('Buscar', { categorySlug: c.slug })}
            />
          ))}
        </ScrollView>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>
            Profissionais na sua região
          </Text>
          <Pressable onPress={() => navigation.navigate('Buscar')}>
            <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.brand.orange }}>
              Ver mapa
            </Text>
          </Pressable>
        </View>
        {nearby.length === 0 ? (
          <EstadoVazio icone="search" titulo="Nenhum profissional encontrado" subtitle="Tente buscar por categoria" />
        ) : (
          nearby.map((w) => (
            <CartaoTrabalhador
              key={w.id}
              worker={w}
              isFavorite={favoriteIds.includes(w.id)}
              onFavorite={() => toggleFavorite(w.id)}
              onPress={() => navigation.navigate('WorkerProfile', { workerId: w.id })}
            />
          ))
        )}

        {activity.length > 0 && (
          <>
            <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text, marginTop: 8, marginBottom: 10 }}>
              Acontecendo agora
            </Text>
            <Card>
              {activity.slice(0, 4).map((a, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingVertical: 8,
                    borderBottomWidth: idx < 3 ? 1 : 0,
                    borderBottomColor: theme.line,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{a.icone_categoria || '✅'}</Text>
                  <Text style={{ flex: 1, fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
                    Um cliente em {a.bairro_cliente || 'sua região'} contratou {a.nome_categoria || 'um serviço'}
                  </Text>
                  <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
                    {timeAgo(a.concluido_em)}
                  </Text>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
