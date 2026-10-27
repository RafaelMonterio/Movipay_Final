import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiPlanos } from '../../apis/planos';
import ContenedorTela from '../../componentes/ContenedorTela';
import { Card, TelaCarregamento, Notice, DistintivoPlano } from '../../componentes/interface';
import Icon from '../../componentes/Gravacao';
import Botao from '../../componentes/Botao';
import { formatCurrency } from '../../utilitarios/formatadores';

/** * Planos premium. O botão só INICIA a assinatura: cria a cobrança e leva para o checkout. Quem ativa o plano é o backend, quando o pagamento é confirmado — por isso não existe n... */
export default function TelaPlanos({ navigation }) {
  const { theme, rs } = usarTema();
  const { user, atualizarUsuario } = usarAutenticacao();

  const [data, setData] = useState(null);
  const [mine, setMine] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [busySlug, setBusySlug] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [list, current] = await Promise.all([apiPlanos.list(), apiPlanos.mine().catch(() => null)]);
      setData(list);
      setMine(current);
      setError('');
    } catch (err) {
      setError(err.friendlyMessage || 'Não foi possível carregar os planos.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setCarregando(false));
    }, [load])
  );

  const currentSlug = mine?.planSlug || user?.slug_plano || 'formiga';

  const subscribe = async (plan) => {
    if (plan.slug === currentSlug) return;
    setError('');

    if (Number(plan.price) === 0) {
      Alert.alert(
        'Voltar ao plano Formiga?',
        'Sua assinatura paga será cancelada. Os benefícios valem até o fim do período já pago.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            style: 'destructive',
            onPress: async () => {
              setBusySlug(plan.slug);
              try {
                await apiPlanos.subscribe('formiga');
                await Promise.all([load(), atualizarUsuario()]);
              } catch (err) {
                setError(err.friendlyMessage || 'Não foi possível trocar de plano.');
              } finally {
                setBusySlug(null);
              }
            },
          },
        ]
      );
      return;
    }

    setBusySlug(plan.slug);
    try {
      const result = await apiPlanos.subscribe(plan.slug, 'pix');
      navigation.navigate('CheckoutPix', {
        paymentId: result.payment?.id,
        titulo: `Plano ${plan.nome}`,
        quantidade: plan.price,
        kind: 'subscription',
      });
    } catch (err) {
      setError(err.friendlyMessage || 'Não foi possível iniciar a assinatura.');
    } finally {
      setBusySlug(null);
    }
  };

  const cancel = () => {
    Alert.alert('Cancelar assinatura?', 'Você mantém os benefícios até o fim do período já pago.', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar assinatura',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await apiPlanos.cancel();
            await Promise.all([load(), atualizarUsuario()]);
            Alert.alert('Assinatura cancelada', res.mensagem || '');
          } catch (err) {
            setError(err.friendlyMessage || 'Não foi possível cancelar.');
          }
        },
      },
    ]);
  };

  if (carregando) return <TelaCarregamento label="Carregando planos…" />;

  const paymentUnavailable = data?.payment && !data.payment.configured;

  return (
    <ContenedorTela titulo="Planos" onBack={() => navigation.goBack()}>
      <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginBottom: 18 }}>
        O plano aumenta sua exposição nas buscas de forma controlada — ele ajuda você a aparecer entre profissionais
        parecidos, mas nunca à frente de quem é mais relevante para o cliente.
      </Text>

      <Notice kind="error" mensagem={error} />
      {paymentUnavailable && (
        <Notice
          kind="warning"
          mensagem="Os pagamentos ainda não estão configurados neste servidor. O plano Formiga continua disponível normalmente."
        />
      )}

      {!!mine?.subscription && (
        <Card style={{ marginBottom: 18, borderColor: theme.brand.orange }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <DistintivoPlano slug={mine.subscription.slug} label={mine.subscription.badge_label} />
            <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
              até {new Date(mine.subscription.fim_periodo_atual).toLocaleDateString('pt-BR')}
            </Text>
          </View>
          <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.base), color: theme.text, marginTop: 10 }}>
            Assinatura ativa: {mine.subscription.nome}
          </Text>
          <Pressable onPress={cancel} style={{ marginTop: 12 }}>
            <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.brand.danger }}>
              Cancelar assinatura
            </Text>
          </Pressable>
        </Card>
      )}

      {(data?.plans || []).map((plan) => {
        const isCurrent = plan.slug === currentSlug;
        const features = Array.isArray(plan.features) ? plan.features : [];
        const highlight = plan.slug === 'rainha';

        return (
          <Card
            key={plan.slug}
            style={{
              marginBottom: 14,
              borderColor: isCurrent ? theme.brand.green : highlight ? theme.brand.orange : theme.cardBorder,
              borderWidth: isCurrent || highlight ? 1.8 : 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontFamily: FONTES.display, fontSize: rs(TAMANHOS.lg), color: theme.text }}>
                    {plan.nome}
                  </Text>
                  {isCurrent && (
                    <View
                      style={{
                        backgroundColor: theme.brand.green,
                        borderRadius: 999,
                        paddingHorizontal: 9,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ color: '#fff', fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.xs) - 1 }}>
                        Plano atual
                      </Text>
                    </View>
                  )}
                </View>
                {!!plan.tagline && (
                  <Text
                    style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 3 }}
                  >
                    {plan.tagline}
                  </Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.lg), color: theme.brand.orange }}>
                  {Number(plan.price) === 0 ? 'Grátis' : formatCurrency(plan.price)}
                </Text>
                {Number(plan.price) > 0 && (
                  <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs) - 1, color: theme.textMuted }}>
                    por mês
                  </Text>
                )}
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: theme.line,
              }}
            >
              <Icon nome="chart" size={14} color={theme.textMuted} />
              <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
                Peso de exposição na busca: {Number(plan.peso_exposicao).toFixed(2)}×
              </Text>
            </View>

            <View style={{ marginTop: 12, gap: 7 }}>
              {features.map((f) => (
                <View key={f} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <Icon nome="check" size={14} color={theme.brand.green} />
                  <Text style={{ flex: 1, fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.text }}>
                    {f}
                  </Text>
                </View>
              ))}
            </View>

            {!isCurrent && (
              <View style={{ marginTop: 16 }}>
                <Botao
                  label={Number(plan.price) === 0 ? 'Voltar ao gratuito' : `Assinar ${plan.nome}`}
                  variant={Number(plan.price) === 0 ? 'ghost' : 'primary'}
                  onPress={() => subscribe(plan)}
                  carregando={busySlug === plan.slug}
                  disabled={!!busySlug || (Number(plan.price) > 0 && paymentUnavailable)}
                />
              </View>
            )}
          </Card>
        );
      })}

      <Card style={{ marginTop: 4, marginBottom: 20 }}>
        <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.sm), color: theme.text, marginBottom: 8 }}>
          Como a exposição funciona
        </Text>
        <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, lineHeight: 20 }}>
          A ordem dos resultados é calculada a partir de avaliação, distância, disponibilidade, perfil completo e
          atividade recente. O plano multiplica essa nota (até 1,70×), então ele desempata entre profissionais
          parecidos — mas categoria e área de atendimento continuam sendo filtro: ninguém aparece numa busca que não
          atende, com plano nenhum.
        </Text>
      </Card>

      {(mine?.pagamentos || []).length > 0 && (
        <View style={{ marginBottom: 30 }}>
          <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text, marginBottom: 10 }}>
            Histórico de pagamentos
          </Text>
          {mine.pagamentos.map((p) => (
            <View
              key={p.id}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: theme.line,
              }}
            >
              <View>
                <Text style={{ fontFamily: FONTES.bodyMedium, fontSize: rs(TAMANHOS.sm), color: theme.text }}>
                  {p.nome_plano}
                </Text>
                <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
                  {new Date(p.criado_em).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text }}>
                  {formatCurrency(p.valor_bruto)}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTES.bodySemiBold,
                    fontSize: rs(TAMANHOS.xs) - 1,
                    color: p.estado === 'approved' ? theme.brand.green : theme.textMuted,
                  }}
                >
                  {STATUS_LABEL[p.estado] || p.estado}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ContenedorTela>
  );
}

const STATUS_LABEL = {
  pending: 'Aguardando',
  approved: 'Pago',
  rejected: 'Recusado',
  expired: 'Expirado',
  cancelled: 'Cancelado',
  refunded: 'Estornado',
};
