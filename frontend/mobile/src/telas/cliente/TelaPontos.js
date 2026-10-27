import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { usarTema } from '../../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiPontos } from '../../apis/redeSocial';
import ContenedorTela from '../../componentes/ContenedorTela';
import { Card, EstadoVazio, TelaCarregamento } from '../../componentes/interface';
import MoedaFolhas from '../../componentes/MoedaFolhas';
import { LEVELS } from '../../utilitarios/niveis';
import { formatDateTime } from '../../utilitarios/formatadores';

const TYPE_LABEL = {
  order_complete: 'Pedido concluído',
  bonus: 'Bônus',
  daily_bonus: 'Bônus diário',
  referral: 'Indicação',
  review_given: 'Avaliação enviada',
  penalty: 'Ajuste',
};

export default function TelaPontos({ navigation }) {
  const { theme, rs } = usarTema();
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [bal, hist] = await Promise.all([apiPontos.balance(), apiPontos.history()]);
    setBalance(bal);
    setHistory(hist);
  }, []);

  useEffect(() => {
    setCarregando(true);
    load().finally(() => setCarregando(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (carregando || !balance) return <TelaCarregamento label="Carregando suas Folhas…" />;
  const info = balance.levelInfo;

  return (
    <ContenedorTela titulo="Minhas Folhas" scroll={false} padded={false} onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}>
      <FlatList
        data={history}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand.orange} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 20 }}>
            <Card style={{ alignItems: 'center', paddingVertical: 26 }}>
              <MoedaFolhas size={72} level={info.level} />
              <Text style={{ fontFamily: FONTES.displayBlack, fontSize: rs(TAMANHOS.display), color: theme.text, marginTop: 12 }}>
                {info.pontos}
              </Text>
              <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.base), color: theme.textMuted }}>Folhas 🍃</Text>
              <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.brand.orange, marginTop: 10 }}>
                {info.levelIcon} Nível {info.levelLabel}
              </Text>
              {info.nextLevel && (
                <>
                  <View style={{ width: '100%', height: 8, backgroundColor: theme.bgAlt, borderRadius: 4, marginTop: 14, overflow: 'hidden' }}>
                    <View style={{ width: `${info.progress * 100}%`, height: '100%', backgroundColor: theme.brand.green }} />
                  </View>
                  <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 8 }}>
                    Faltam {info.pointsToNext} Folhas para {info.nextLevelLabel}
                  </Text>
                </>
              )}
            </Card>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 10 }}>
              {LEVELS.map((lvl) => (
                <View key={lvl.key} style={{ alignItems: 'center', opacity: info.levelIndex >= LEVELS.indexOf(lvl) ? 1 : 0.35 }}>
                  <MoedaFolhas size={30} level={lvl.key} />
                  <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs) - 2, color: theme.textMuted, marginTop: 4 }}>
                    {lvl.label}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text, marginTop: 10 }}>
              Histórico
            </Text>
          </View>
        }
        ListEmptyComponent={<EstadoVazio icone="gift" titulo="Sem movimentações ainda" />}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.line }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTES.bodyMedium, fontSize: rs(TAMANHOS.sm), color: theme.text }}>
                {TYPE_LABEL[item.tipo] || item.tipo}
              </Text>
              <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
                {formatDateTime(item.criado_em)}
              </Text>
            </View>
            <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.base), color: item.quantidade >= 0 ? theme.brand.green : theme.brand.danger }}>
              {item.quantidade >= 0 ? '+' : ''}
              {item.quantidade}
            </Text>
          </View>
        )}
      />
    </ContenedorTela>
  );
}
