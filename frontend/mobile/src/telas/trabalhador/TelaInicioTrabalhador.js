import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiPedidos, apiOrcamentos } from '../../apis/pedidos';
import { apiCarteira } from '../../apis/redeSocial';
import { apiTrabalhadores } from '../../apis/mercado';
import { Card, AvaliacaoEstrelas, Notice, DistintivoPlano } from '../../componentes/interface';
import Icon from '../../componentes/Gravacao';
import DistintivoNotificacao from '../../componentes/DistintivoNotificacao';
import GraficoGanhos from '../../componentes/GraficoGanhos';
import { formatCurrency } from '../../utilitarios/formatadores';

export default function TelaInicioTrabalhador({ navigation }) {
  const { theme, rs } = usarTema();
  const { user, atualizarUsuario, contagemNaoLidas } = usarAutenticacao();
  const [pendingCount, setPendingCount] = useState(0);
  const [opportunityCount, setOpportunityCount] = useState(0);
  const [wallet, setWallet] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [loadError, setLoadError] = useState('');

  // `apiPedidos.list`/`apiCarteira.get` não tinham proteção nenhuma: se o backend estivesse inacessível (o mesmo problema de conectividade do item 9), ess...
  const load = useCallback(async () => {
    setLoadError('');
    try {
      const [{ pedidos: pending }, walletData] = await Promise.all([
        apiPedidos.list({ role: 'worker', estado: 'pending' }),
        apiCarteira.get(),
      ]);
      setPendingCount(pending.length);
      setWallet(walletData);
    } catch (err) {
      setLoadError(err.friendlyMessage || 'Não foi possível atualizar seus dados agora.');
    }
    try {
      const { orcamentos } = await apiOrcamentos.list({ role: 'worker' });
      setOpportunityCount(orcamentos.filter((q) => !q.already_proposed).length);
    } catch {
      setOpportunityCount(0);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), atualizarUsuario()]);
    setRefreshing(false);
  };

  const handleToggleAvailability = async (value) => {
    setTogglingAvailability(true);
    try {
      await apiTrabalhadores.setAvailability(user.id, value);
      await atualizarUsuario();
    } catch (err) {
      Alert.alert('Não foi possível atualizar', err.friendlyMessage);
    } finally {
      setTogglingAvailability(false);
    }
  };

  // Últimas 6 semanas, somando o líquido (o que realmente cai na carteira) por semana — dá pra ver a tendência de rendimento num relance, sem precisar...
  const weeklyEarnings = (() => {
    const weeks = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay() - i * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      weeks.push({ start, end, label: `${start.getDate()}/${start.getMonth() + 1}`, value: 0 });
    }
    (wallet?.earnings || []).forEach((tx) => {
      if (!['paid', 'released'].includes(tx.estado)) return;
      const date = new Date(tx.criado_em);
      const bucket = weeks.find((w) => date >= w.start && date < w.end);
      if (bucket) bucket.value += Number(tx.valor_liquido) || 0;
    });
    return weeks.map((w) => ({ label: w.label, value: w.value }));
  })();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand.green} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <View>
            <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted }}>Olá,</Text>
            <Text style={{ fontFamily: FONTES.display, fontSize: rs(TAMANHOS.xl), color: theme.text }}>
              {user?.nome?.split(' ')[0]}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <AvaliacaoEstrelas value={Number(user?.media_avaliacao)} count={user?.total_avaliacoes} />
            <Pressable
              onPress={() => navigation.navigate('ChatList')}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.bgAlt, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon nome="chat" size={19} color={theme.text} />
              <DistintivoNotificacao count={contagemNaoLidas} />
            </Pressable>
            {/* Selo do plano — pedido do usuário: "perto do chat tenha o
                símbolo de qual plano ele está". Tocar leva direto para a
                tela de assinatura, funcionando como um lembrete de
                upsell discreto sempre visível. */}
            <Pressable onPress={() => navigation.getParent()?.navigate('Planos')}>
              <DistintivoPlano slug={user?.slug_plano} size="sm" showFree />
            </Pressable>
          </View>
        </View>

        <Notice kind="error" mensagem={loadError} />

        <Card style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: user?.esta_disponivel ? theme.brand.green : theme.textMuted,
              }}
            />
            <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>
              {user?.esta_disponivel ? 'Disponível para novos pedidos' : 'Indisponível'}
            </Text>
          </View>
          <Switch value={!!user?.esta_disponivel} onValueChange={handleToggleAvailability} disabled={togglingAvailability} trackColor={{ true: theme.brand.green }} />
        </Card>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <StatCard icone="clipboard" label="Pedidos pendentes" value={pendingCount} color={theme.brand.orange} onPress={() => navigation.navigate('Pedidos')} />
          <StatCard icone="briefcase" label="Oportunidades" value={opportunityCount} color={theme.brand.green} onPress={() => navigation.navigate('Oportunidades')} />
        </View>

        <Pressable onPress={() => navigation.getParent()?.navigate('Carteira')}>
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted }}>Saldo disponível</Text>
            <Text style={{ fontFamily: FONTES.displayBlack, fontSize: rs(TAMANHOS.xxl), color: theme.text, marginTop: 4 }}>
              {formatCurrency(wallet?.balance || 0)}
            </Text>
            {wallet?.pendingHeld > 0 && (
              <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 4 }}>
                + {formatCurrency(wallet.pendingHeld)} a receber quando concluir pedidos em andamento
              </Text>
            )}
          </Card>
        </Pressable>

        <Card style={{ marginBottom: 16 }}>
          <GraficoGanhos data={weeklyEarnings} />
        </Card>

        <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text, marginBottom: 10 }}>
          Atalhos
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <ShortcutBotao icone="calendar" label="Agenda" onPress={() => navigation.navigate('Agenda')} />
          <ShortcutBotao icone="briefcase" label="Meus serviços" onPress={() => navigation.getParent()?.navigate('Servicos')} />
          <ShortcutBotao icone="star" label="Avaliações" onPress={() => navigation.getParent()?.navigate('Avaliacoes')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icone, label, value, color, onPress }) {
  const { theme, rs } = usarTema();
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <Card style={{ alignItems: 'flex-start' }}>
        <Icon nome={icone} size={20} color={color} />
        <Text style={{ fontFamily: FONTES.displayBlack, fontSize: rs(TAMANHOS.xl), color: theme.text, marginTop: 8 }}>{value}</Text>
        <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>{label}</Text>
      </Card>
    </Pressable>
  );
}

function ShortcutBotao({ icone, label, onPress }) {
  const { theme, rs } = usarTema();
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', width: 84 }}>
      <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: theme.bgAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Icon nome={icone} size={22} color={theme.text} />
      </View>
      <Text style={{ fontFamily: FONTES.bodyMedium, fontSize: rs(TAMANHOS.xs), color: theme.text, marginTop: 6, textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  );
}
