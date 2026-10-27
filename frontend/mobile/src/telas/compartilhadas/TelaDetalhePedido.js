import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, TextCampoEntrada } from 'react-native';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiPedidos } from '../../apis/pedidos';
import { apiAvaliacoes } from '../../apis/redeSocial';
import { apiPagamentos } from '../../apis/planos';
import ContenedorTela from '../../componentes/ContenedorTela';
import { Card, DistintivoEstado, Avatar, AvaliacaoEstrelas, TelaCarregamento } from '../../componentes/interface';
import LinhaDoTempoEstado from '../../componentes/LinhaDoTempoEstado';
import Botao from '../../componentes/Botao';
import Icon from '../../componentes/Gravacao';
import { formatCurrency, formatDateTime } from '../../utilitarios/formatadores';

export default function TelaDetalhePedido({ route, navigation }) {
  const { orderId } = route.params;
  const { theme, rs } = usarTema();
  const { user } = usarAutenticacao();
  const [data, setData] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [acting, setActing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    const result = await apiPedidos.detail(orderId);
    setData(result);
  }, [orderId]);

  useEffect(() => {
    setCarregando(true);
    load().finally(() => setCarregando(false));
  }, [load]);

  const ehTrabalhador = data?.order.trabalhador_id === user?.id;
  const ehCliente = data?.order.cliente_id === user?.id;

  const runAction = async (estado, cancelReason) => {
    setActing(true);
    try {
      await apiPedidos.updateStatus(orderId, estado, cancelReason);
      await load();
    } catch (err) {
      Alert.alert('Não foi possível', err.friendlyMessage);
    } finally {
      setActing(false);
    }
  };

  const confirmCancel = () => {
    Alert.prompt
      ? Alert.prompt('Cancelar pedido', 'Explique brevemente o motivo:', (text) => runAction('cancelled', text || 'Sem motivo informado'))
      : Alert.alert('Cancelar pedido', 'Tem certeza?', [
          { text: 'Voltar', style: 'cancel' },
          { text: 'Cancelar pedido', style: 'destructive', onPress: () => runAction('cancelled', 'Cancelado pelo app') },
        ]);
  };

  const submitReview = async () => {
    setSubmittingReview(true);
    try {
      await apiAvaliacoes.create(orderId, rating, comment);
      await load();
    } catch (err) {
      Alert.alert('Não foi possível enviar avaliação', err.friendlyMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (carregando || !data) return <TelaCarregamento label="Carregando pedido…" />;
  const { order, history, review, payment, commission, commissionPercent, gatewayPayment } = data;

  /** * Abre o checkout. O app não envia valor nenhum — manda só o id do pedido, e o backend calcula bruto, taxa e líquido a partir do preço que já está gravado. Se já existe uma cobr... */
  const handlePay = async () => {
    setPaying(true);
    try {
      const result = await apiPagamentos.payService(order.id);
      if (result.alreadyPaid) {
        Alert.alert('Pedido já pago', 'Este pedido já foi quitado.');
        await load();
        return;
      }
      navigation.navigate('CheckoutPix', {
        paymentId: result.payment.id,
        titulo: order.titulo_servico || `Pedido #${order.id}`,
        quantidade: result.payment.valor_bruto,
        kind: 'service',
      });
    } catch (err) {
      Alert.alert('Não foi possível iniciar o pagamento', err.friendlyMessage || 'Tente novamente.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <ContenedorTela titulo="Pedido" onBack={() => navigation.goBack()}>
      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={{ fontFamily: FONTES.display, fontSize: rs(TAMANHOS.lg), color: theme.text, flex: 1 }}>
            {order.titulo_servico || order.nome_categoria || 'Pedido'}
          </Text>
          <DistintivoEstado estado={order.estado} />
        </View>
        <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.xl), color: theme.brand.orange, marginTop: 8 }}>
          {formatCurrency(order.price)}
        </Text>
        {!!order.notes && (
          <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginTop: 10 }}>
            {order.notes}
          </Text>
        )}
        {!!order.agendado_para && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <Icon nome="calendar" size={15} color={theme.textMuted} />
            <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted }}>
              Agendado para {formatDateTime(order.agendado_para)}
            </Text>
          </View>
        )}
      </Card>

      <Card style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Avatar uri={ehTrabalhador ? order.url_avatar_cliente : order.url_avatar_trabalhador} nome={ehTrabalhador ? order.nome_cliente : order.nome_trabalhador} size={48} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>
            {ehTrabalhador ? order.nome_cliente : order.nome_trabalhador}
          </Text>
          <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
            {ehTrabalhador ? 'Cliente' : 'Trabalhador'}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('ChatThread', { orderId, otherName: ehTrabalhador ? order.nome_cliente : order.nome_trabalhador })}
          style={{ backgroundColor: theme.bgAlt, borderRadius: 12, padding: 10 }}
        >
          <Icon nome="chat" size={20} color={theme.brand.orange} />
        </Pressable>
      </Card>

      <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text, marginBottom: 12 }}>
        Linha do tempo
      </Text>
      <Card style={{ marginBottom: 16 }}>
        <LinhaDoTempoEstado history={history} />
      </Card>

      {/* Divisão do valor. O cliente vê bruto e a taxa; o trabalhador vê
          também o líquido que cai na carteira dele. */}
      {!!commission && (
        <Card style={{ marginBottom: 14 }}>
          <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.sm), color: theme.text, marginBottom: 10 }}>
            Valores
          </Text>
          <Row label="Valor do serviço" value={formatCurrency(commission.valor_bruto)} strong />
          <Row
            label={`Taxa MoviPay (${commission.percentual_taxa ?? commissionPercent ?? 15}%)`}
            value={`− ${formatCurrency(commission.taxa_plataforma ?? (Number(commission.valor_bruto) * (Number(commission.percentual_taxa ?? 15) / 100)))}`}
          />
          {ehTrabalhador && commission.valor_liquido != null && (
            <Row label="Você recebe" value={formatCurrency(commission.valor_liquido)} strong highlight />
          )}
        </Card>
      )}

      {/* Pagar o serviço — só o cliente, e só enquanto não está pago. */}
      {ehCliente && !!order.price && commission?.estado !== 'paid' && commission?.estado !== 'released' && (
        <View style={{ marginBottom: 14 }}>
          <Botao
            label={
              gatewayPayment?.estado === 'pending'
                ? 'Continuar pagamento Pix'
                : `Pagar ${formatCurrency(order.price)} com Pix`
            }
            icone="wallet"
            carregando={paying}
            onPress={handlePay}
          />
        </View>
      )}

      {payment && (
        <Card style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon nome="wallet" size={18} color={theme.textMuted} />
          <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted }}>
            Pagamento: {payment.estado === 'held' ? 'reservado, liberado ao concluir' : payment.estado === 'released' ? 'liberado ao trabalhador' : 'cancelado'}
          </Text>
        </Card>
      )}

      {/* Ações do trabalhador */}
      {ehTrabalhador && order.estado === 'pending' && (
        <View style={{ gap: 10, marginBottom: 16 }}>
          <Botao label="Aceitar pedido" onPress={() => runAction('accepted')} carregando={acting} />
          <Botao label="Recusar" variant="secondary" onPress={confirmCancel} carregando={acting} />
        </View>
      )}
      {ehTrabalhador && order.estado === 'accepted' && (
        <Botao label="Iniciar serviço" onPress={() => runAction('in_progress')} carregando={acting} style={{ marginBottom: 16 }} />
      )}
      {ehTrabalhador && order.estado === 'in_progress' && (
        <Botao label="Marcar como concluído" onPress={() => runAction('completed')} carregando={acting} style={{ marginBottom: 16 }} />
      )}

      {/* Cancelamento (ambos) enquanto ainda não finalizou */}
      {['pending', 'accepted', 'in_progress'].includes(order.estado) && !(ehTrabalhador && order.estado === 'pending') && (
        <Botao label="Cancelar pedido" variant="ghost" onPress={confirmCancel} carregando={acting} style={{ marginBottom: 16 }} />
      )}

      {/* Avaliação (cliente, pedido concluído, sem avaliação ainda) */}
      {ehCliente && order.estado === 'completed' && !review && (
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text, marginBottom: 10 }}>
            Como foi o serviço?
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)} hitSlop={6}>
                <Icon nome="star" size={30} filled={n <= rating} color={n <= rating ? theme.brand.orange : theme.line} />
              </Pressable>
            ))}
          </View>
          <TextCampoEntrada
            value={comment}
            onChangeText={setComment}
            placeholder="Conte como foi (opcional)"
            placeholderTextColor={theme.textMuted}
            multiline
            style={{
              backgroundColor: theme.bgAlt,
              borderRadius: 12,
              padding: 12,
              minHeight: 70,
              color: theme.text,
              fontFamily: FONTES.body,
              fontSize: rs(TAMANHOS.sm),
              marginBottom: 12,
              textAlignVertical: 'top',
            }}
          />
          <Botao label="Enviar avaliação" onPress={submitReview} carregando={submittingReview} />
        </Card>
      )}
      {ehCliente && review && (
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text, marginBottom: 6 }}>
            Sua avaliação
          </Text>
          <AvaliacaoEstrelas value={review.rating} size={16} />
          {!!review.comment && (
            <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginTop: 8 }}>
              {review.comment}
            </Text>
          )}
        </Card>
      )}
    </ContenedorTela>
  );
}


/** Linha simples rótulo → valor, usada no bloco de valores. */
function Row({ label, value, strong, highlight }) {
  const { theme, rs } = usarTema();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
      <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted }}>{label}</Text>
      <Text
        style={{
          fontFamily: strong ? FONTES.monoSemiBold : FONTES.mono,
          fontSize: rs(TAMANHOS.sm),
          color: highlight ? theme.brand.green : theme.text,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
