import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, TextCampoEntrada } from 'react-native';
import { usarTema } from '../../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiOrcamentos } from '../../apis/pedidos';
import ContenedorTela from '../../componentes/ContenedorTela';
import { Card, DistintivoEstado, Avatar, AvaliacaoEstrelas, TelaCarregamento, EstadoVazio } from '../../componentes/interface';
import CampoEntrada from '../../componentes/CampoEntrada';
import Botao from '../../componentes/Botao';
import Icon from '../../componentes/Gravacao';
import { formatCurrency, formatDate } from '../../utilitarios/formatadores';

export default function TelaDetalheOrcamento({ route, navigation }) {
  const { quoteId } = route.params;
  const { theme, rs } = usarTema();
  const [data, setData] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [price, setPrice] = useState('');
  const [mensagem, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [respondingId, setRespondingId] = useState(null);

  const load = useCallback(async () => {
    const result = await apiOrcamentos.detail(quoteId);
    setData(result);
  }, [quoteId]);

  useEffect(() => {
    setCarregando(true);
    load().finally(() => setCarregando(false));
  }, [load]);

  const handlePropose = async () => {
    if (!price || !mensagem) {
      Alert.alert('Preencha tudo', 'Informe o valor e uma mensagem para o cliente.');
      return;
    }
    setSubmitting(true);
    try {
      await apiOrcamentos.propose(quoteId, Number(price), mensagem);
      await load();
    } catch (err) {
      Alert.alert('Não foi possível enviar', err.friendlyMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (proposalId, estado) => {
    setRespondingId(proposalId);
    try {
      const result = await apiOrcamentos.respondProposal(quoteId, proposalId, estado);
      if (estado === 'accepted' && result.createdOrderId) {
        Alert.alert('Proposta aceita!', 'Um pedido foi criado a partir dessa proposta.', [
          { text: 'Ver pedido', onPress: () => navigation.replace('OrderDetail', { orderId: result.createdOrderId }) },
        ]);
      } else {
        await load();
      }
    } catch (err) {
      Alert.alert('Não foi possível', err.friendlyMessage);
    } finally {
      setRespondingId(null);
    }
  };

  if (carregando || !data) return <TelaCarregamento label="Carregando orçamento…" />;
  const { quote, proposals, isOwner } = data;

  return (
    <ContenedorTela titulo="Orçamento" onBack={() => navigation.goBack()}>
      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: FONTES.display, fontSize: rs(TAMANHOS.lg), color: theme.text, flex: 1 }}>{quote.titulo}</Text>
          <DistintivoEstado estado={quote.estado} />
        </View>
        <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginTop: 8 }}>
          {quote.descricao}
        </Text>
        {!!quote.orcamento_maximo && (
          <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.base), color: theme.brand.orange, marginTop: 10 }}>
            Até {formatCurrency(quote.orcamento_maximo)}
          </Text>
        )}
        <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 6 }}>
          {quote.categoria_slug === 'outros' && quote.texto_categoria_personalizada ? quote.texto_categoria_personalizada : quote.nome_categoria} · {quote.cidade} · pedido em {formatDate(quote.criado_em)}
        </Text>
        {quote.foi_impulsionado && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
            <Icon nome="crown" size={13} color="#FFC65C" />
            <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.xs), color: '#FFC65C' }}>
              Divulgação em destaque ativa
            </Text>
          </View>
        )}
      </Card>

      {isOwner ? (
        <>
          <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text, marginBottom: 12 }}>
            Propostas recebidas
          </Text>
          {proposals.length === 0 ? (
            <EstadoVazio icone="briefcase" titulo="Ainda sem propostas" subtitle="Assim que um profissional responder, aparece aqui." />
          ) : (
            proposals.map((p) => (
              <Card key={p.id} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Avatar uri={p.url_avatar_trabalhador} nome={p.nome_trabalhador} size={44} />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>{p.nome_trabalhador}</Text>
                    <AvaliacaoEstrelas value={Number(p.media_avaliacao)} count={p.total_avaliacoes} size={12} />
                  </View>
                  <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.lg), color: theme.brand.orange }}>
                    {formatCurrency(p.price)}
                  </Text>
                </View>
                {!!p.mensagem && (
                  <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginTop: 10 }}>
                    "{p.mensagem}"
                  </Text>
                )}
                {p.estado === 'pending' ? (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Botao label="Aceitar" onPress={() => handleRespond(p.id, 'accepted')} carregando={respondingId === p.id} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Botao label="Recusar" variant="secondary" onPress={() => handleRespond(p.id, 'rejected')} carregando={respondingId === p.id} />
                    </View>
                  </View>
                ) : (
                  <DistintivoEstado estado={p.estado} style={{ marginTop: 10 }} />
                )}
              </Card>
            ))
          )}
        </>
      ) : proposals.length > 0 ? (
        <Card>
          <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.base), color: theme.text, marginBottom: 8 }}>
            Sua proposta
          </Text>
          <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.lg), color: theme.brand.orange }}>
            {formatCurrency(proposals[0].price)}
          </Text>
          <DistintivoEstado estado={proposals[0].estado} style={{ marginTop: 8 }} />
        </Card>
      ) : (
        <Card>
          <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text, marginBottom: 12 }}>
            Enviar proposta
          </Text>
          <CampoEntrada label="Seu valor (R$)" placeholder="150" keyboardType="numeric" value={price} onChangeText={setPrice} icone="wallet" />
          <CampoEntrada label="Mensagem para o cliente" placeholder="Explique como você faria o serviço" value={mensagem} onChangeText={setMessage} multiline />
          <Botao label="Enviar proposta" onPress={handlePropose} carregando={submitting} />
        </Card>
      )}
    </ContenedorTela>
  );
}
