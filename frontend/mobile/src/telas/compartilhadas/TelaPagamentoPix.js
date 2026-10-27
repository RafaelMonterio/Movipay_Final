import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, Pressable, Alert, Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiPagamentos } from '../../apis/planos';
import ContenedorTela from '../../componentes/ContenedorTela';
import { Card, TelaCarregamento, Notice } from '../../componentes/interface';
import Icon from '../../componentes/Gravacao';
import Botao from '../../componentes/Botao';
import { formatCurrency } from '../../utilitarios/formatadores';

const POLL_MS = 5000;

/** * Checkout Pix. O ponto que importa: esta tela NÃO decide se o pagamento foi feito. Ela mostra o código, e a cada 5 s pergunta ao backend qual é o estado real (que por sua vez c... */
export default function TelaPagamentoPix({ route, navigation }) {
  const { paymentId, titulo, quantidade, kind } = route.params || {};
  const { theme, rs } = usarTema();
  const { atualizarUsuario } = usarAutenticacao();

  const [payment, setPayment] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(null);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const fresh = await apiPagamentos.estado(paymentId);
      setPayment(fresh);
      setError('');
      return fresh;
    } catch (err) {
      setError(err.friendlyMessage || 'Não foi possível consultar o pagamento.');
      return null;
    }
  }, [paymentId]);

  useEffect(() => {
    load().finally(() => setCarregando(false));
  }, [load]);

  // Polling enquanto está pendente. Para assim que sai de 'pending' — não faz sentido continuar perguntando depois de resolvido.
  useEffect(() => {
    if (!payment || payment.estado !== 'pending') {
      if (pollRef.current) clearInterval(pollRef.current);
      return undefined;
    }
    pollRef.current = setInterval(async () => {
      const fresh = await load();
      if (fresh && fresh.estado === 'approved') {
        clearInterval(pollRef.current);
        await atualizarUsuario().catch(() => {});
      }
    }, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [payment, load, atualizarUsuario]);

  // Contagem regressiva até a cobrança expirar.
  useEffect(() => {
    if (!payment?.expira_em || payment.estado !== 'pending') return undefined;
    const tick = () => {
      const ms = new Date(payment.expira_em).getTime() - Date.now();
      setRemaining(ms > 0 ? ms : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [payment]);

  const copyCode = async () => {
    if (!payment?.dados_pix) return;
    await Clipboard.setStringAsync(payment.dados_pix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareCode = async () => {
    if (!payment?.dados_pix) return;
    try {
      await Share.share({ mensagem: payment.dados_pix });
    } catch {
      /* cancelado */
    }
  };

  const cancelCharge = () => {
    Alert.alert('Cancelar cobrança?', 'O código Pix deixa de valer e você pode gerar outro depois.', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar cobrança',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiPagamentos.cancel(paymentId);
            navigation.goBack();
          } catch (err) {
            setError(err.friendlyMessage || 'Não foi possível cancelar.');
          }
        },
      },
    ]);
  };

  if (carregando) return <TelaCarregamento label="Gerando cobrança…" />;

  const estado = payment?.estado || 'pending';
  const isApproved = estado === 'approved';
  const isDead = ['expired', 'cancelled', 'rejected'].includes(estado);

  return (
    <ContenedorTela titulo="Pagamento Pix" onBack={() => navigation.goBack()}>
      <Notice kind="error" mensagem={error} />

      <Card style={{ alignItems: 'center', paddingVertical: 22, marginBottom: 18 }}>
        <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted }}>{titulo}</Text>
        <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.xxl), color: theme.text, marginTop: 6 }}>
          {formatCurrency(payment?.valor_bruto ?? quantidade)}
        </Text>

        <StatusPill estado={estado} />

        {estado === 'pending' && remaining !== null && (
          <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 10 }}>
            {remaining > 0
              ? `Expira em ${Math.floor(remaining / 60000)}min ${Math.floor((remaining % 60000) / 1000)}s`
              : 'Cobrança expirada'}
          </Text>
        )}
      </Card>

      {isApproved && (
        <>
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                backgroundColor: theme.brand.green,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon nome="check" size={42} color="#fff" />
            </View>
            <Text
              style={{ fontFamily: FONTES.display, fontSize: rs(TAMANHOS.lg), color: theme.text, marginTop: 18 }}
            >
              Pagamento confirmado
            </Text>
            <Text
              style={{
                fontFamily: FONTES.body,
                fontSize: rs(TAMANHOS.sm),
                color: theme.textMuted,
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              {kind === 'subscription'
                ? 'Seu plano já está ativo e valendo nas buscas.'
                : 'O profissional foi notificado e o valor já está registrado.'}
            </Text>
          </View>
          <Botao label="Concluir" onPress={() => navigation.goBack()} />
        </>
      )}

      {isDead && (
        <>
          <Notice
            kind="warning"
            mensagem={
              estado === 'expired'
                ? 'Esta cobrança expirou. Gere uma nova para continuar.'
                : estado === 'rejected'
                ? `Pagamento recusado. ${payment?.detalhe_estado || ''}`
                : 'Cobrança cancelada.'
            }
          />
          <Botao label="Voltar" onPress={() => navigation.goBack()} />
        </>
      )}

      {estado === 'pending' && (
        <>
          {!!payment?.pix_qr_base64 && (
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              <Image
                source={{ uri: `data:image/png;base64,${payment.pix_qr_base64}` }}
                style={{ width: 210, height: 210, borderRadius: 12, backgroundColor: '#fff' }}
              />
            </View>
          )}

          <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text, marginBottom: 8 }}>
            Pix copia e cola
          </Text>
          <Pressable onPress={copyCode}>
            <View
              style={{
                backgroundColor: theme.bgAlt,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                padding: 14,
              }}
            >
              <Text
                style={{ fontFamily: FONTES.mono, fontSize: rs(TAMANHOS.xs), color: theme.text }}
                numberOfLines={4}
              >
                {payment?.dados_pix || '—'}
              </Text>
            </View>
          </Pressable>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Botao
                label={copied ? 'Copiado!' : 'Copiar código'}
                icone={copied ? 'check' : 'copy'}
                onPress={copyCode}
              />
            </View>
            {Platform.OS !== 'web' && (
              <View style={{ flex: 1 }}>
                <Botao label="Compartilhar" icone="share" variant="ghost" onPress={shareCode} />
              </View>
            )}
          </View>

          <Card style={{ marginTop: 20 }}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <Icon nome="info" size={17} color={theme.textMuted} />
              <Text style={{ flex: 1, fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, lineHeight: 20 }}>
                Abra o aplicativo do seu banco, escolha Pix, cole o código e confirme. Esta tela atualiza sozinha
                assim que o pagamento for confirmado — não é preciso fazer mais nada aqui.
              </Text>
            </View>
          </Card>

          <Pressable onPress={cancelCharge} style={{ alignSelf: 'center', marginTop: 22, padding: 10 }}>
            <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.brand.danger }}>
              Cancelar cobrança
            </Text>
          </Pressable>
        </>
      )}
    </ContenedorTela>
  );
}

function StatusPill({ estado }) {
  const { theme, rs } = usarTema();
  const map = {
    pending: { label: 'Aguardando pagamento', color: theme.brand.orange },
    approved: { label: 'Pago', color: theme.brand.green },
    rejected: { label: 'Recusado', color: theme.brand.danger },
    expired: { label: 'Expirado', color: theme.textMuted },
    cancelled: { label: 'Cancelado', color: theme.textMuted },
    refunded: { label: 'Estornado', color: theme.textMuted },
  };
  const info = map[estado] || map.pending;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        borderWidth: 1,
        borderColor: info.color,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 4,
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: info.color }} />
      <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.xs), color: info.color }}>{info.label}</Text>
    </View>
  );
}
