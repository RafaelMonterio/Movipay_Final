import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, Modal, Pressable } from 'react-native';
import { usarTema } from '../../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiCategorias } from '../../apis/mercado';
import { apiOrcamentos } from '../../apis/pedidos';
import ContenedorTela from '../../componentes/ContenedorTela';
import { CategoryChip } from '../../componentes/CartaoTrabalhador';
import { Card } from '../../componentes/interface';
import CampoEntrada from '../../componentes/CampoEntrada';
import Botao from '../../componentes/Botao';
import Icon from '../../componentes/Gravacao';
import SeletorEndereco from '../../componentes/SeletorEndereco';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { formatCurrency } from '../../utilitarios/formatadores';

const SIZE_OPTIONS = [
  { key: 'pequeno', label: 'Pequeno' },
  { key: 'medio', label: 'Médio' },
  { key: 'grande', label: 'Grande' },
];
const URGENCY_OPTIONS = [
  { key: 'normal', label: 'Sem pressa' },
  { key: 'urgente', label: 'Urgente' },
];

export default function TelaNovoOrcamento({ navigation }) {
  const { theme, rs } = usarTema();
  const { user } = usarAutenticacao();
  const [categorias, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [size, setSize] = useState('medio');
  const [urgency, setUrgency] = useState('normal');
  const [estimate, setEstimate] = useState(null);
  const [titulo, setTitle] = useState('');
  const [descricao, setDescription] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [address, setAddress] = useState(
    user?.address_street
      ? {
          endereco_id: user.endereco_id,
          numero_endereco: user.numero_endereco,
          display: `${user.address_street}, ${user.numero_endereco} — ${user.bairro}`,
        }
      : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [boostInfo, setBoostInfo] = useState(null);
  const [boostPrompt, setBoostPrompt] = useState(false); // pop-up antes de publicar

  const selectedCategory = categorias.find((c) => c.id === categoryId);
  const isOutros = selectedCategory?.slug === 'outros';

  useEffect(() => {
    apiCategorias.list().then(setCategories);
    // Preço vem do backend — se ele mudar, o app não precisa de nova versão.
    apiOrcamentos.boostInfo().then(setBoostInfo).catch(() => setBoostInfo(null));
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setEstimate(null);
      return;
    }
    apiOrcamentos.estimate(categoryId, size, urgency).then(setEstimate).catch(() => setEstimate(null));
  }, [categoryId, size, urgency]);

  const validate = () => {
    if (!categoryId || !titulo || !descricao) {
      Alert.alert('Preencha tudo', 'Escolha a categoria e descreva o que você precisa.');
      return false;
    }
    if (isOutros && customCategoryText.trim().length < 3) {
      Alert.alert('Descreva o serviço', 'Como a categoria é "Outros", conte em poucas palavras o que você precisa.');
      return false;
    }
    if (!address) {
      Alert.alert('Falta o endereço', 'Escolha onde o serviço vai ser realizado.');
      return false;
    }
    return true;
  };

  // Só valida e abre o pop-up de divulgação — ainda não publica nada. Isso é o que o "clicar em publicar" deveria fazer: perguntar antes, não depois.
  const handlePublishPress = () => {
    if (validate()) setBoostPrompt(true);
  };

  const createQuote = async (withBoost) => {
    setBoostPrompt(false);
    setSubmitting(true);
    try {
      const quote = await apiOrcamentos.create({
        categoria_id: categoryId,
        titulo,
        descricao,
        orcamento_maximo: budgetMax ? Number(budgetMax) : undefined,
        endereco_id: address.endereco_id,
        numero_endereco: address.numero_endereco,
        texto_categoria_personalizada: isOutros ? customCategoryText.trim() : undefined,
      });

      if (withBoost) {
        try {
          const result = await apiOrcamentos.boost(quote.id);
          navigation.replace('CheckoutPix', {
            paymentId: result.payment.id,
            titulo: 'Melhor divulgação do orçamento',
            quantidade: result.payment.valor_bruto,
            kind: 'quote_boost',
          });
          return;
        } catch (err) {
          // O orçamento já foi criado — não faz sentido perder isso só porque a cobrança da divulgação falhou. Segue pro orçamento normal e avisa que só a divu...
          Alert.alert('Orçamento publicado', err.friendlyMessage || 'Só não foi possível iniciar o pagamento da divulgação.');
        }
      }
      navigation.replace('QuoteDetail', { quoteId: quote.id });
    } catch (err) {
      Alert.alert('Não foi possível criar', err.friendlyMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ContenedorTela titulo="Pedir orçamento" onBack={() => navigation.goBack()}>
      <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text, marginBottom: 8 }}>
        Categoria
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
        {categorias.map((c) => (
          <CategoryChip key={c.id} category={c} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
        ))}
      </ScrollView>

      {isOutros && (
        <CampoEntrada
          label="Que serviço você precisa?"
          placeholder="Ex.: montar um berço, tirar dúvida sobre contrato…"
          value={customCategoryText}
          onChangeText={setCustomCategoryText}
          icone="sparkle"
        />
      )}

      {categoryId && (
        <>
          <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text, marginBottom: 8 }}>Porte do serviço</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {SIZE_OPTIONS.map((o) => (
              <SelectChip key={o.key} label={o.label} active={size === o.key} onPress={() => setSize(o.key)} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
            {URGENCY_OPTIONS.map((o) => (
              <SelectChip key={o.key} label={o.label} active={urgency === o.key} onPress={() => setUrgency(o.key)} />
            ))}
          </View>

          {estimate && (
            <Card style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon nome="wallet" size={22} color={theme.brand.orange} />
              <View>
                <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>Estimativa instantânea</Text>
                <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>
                  {formatCurrency(estimate.estimateMin)} – {formatCurrency(estimate.estimateMax)}
                </Text>
                <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 2 }}>
                  {estimate.note}
                </Text>
              </View>
            </Card>
          )}
        </>
      )}

      <CampoEntrada label="Título" placeholder="Ex.: Limpeza pós-obra" value={titulo} onChangeText={setTitle} icone="edit" />
      <CampoEntrada label="Descreva o que você precisa" placeholder="Detalhes, tamanho do espaço, urgência…" value={descricao} onChangeText={setDescription} multiline />
      <CampoEntrada label="Orçamento máximo (opcional)" placeholder="300" keyboardType="numeric" value={budgetMax} onChangeText={setBudgetMax} icone="wallet" />
      <SeletorEndereco label="Onde vai ser o serviço?" value={address} onChange={setAddress} />

      <Botao label="Publicar orçamento" onPress={handlePublishPress} carregando={submitting} />

      {/* Pop-up de "melhor divulgação" — aparece ANTES de publicar de
          verdade, como pedido: dar a chance de pagar por destaque antes
          de finalizar, não depois. */}
      <Modal visible={boostPrompt} transparent animationType="fade" onRequestClose={() => setBoostPrompt(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: theme.bg, borderRadius: 20, padding: 22 }}>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: theme.brand.orange,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Icon nome="crown" size={26} color="#fff" />
              </View>
              <Text style={{ fontFamily: FONTES.display, fontSize: rs(TAMANHOS.lg), color: theme.text, textAlign: 'center' }}>
                Quer mais respostas?
              </Text>
            </View>
            <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, textAlign: 'center', marginBottom: 20 }}>
              {boostInfo
                ? `Por apenas ${formatCurrency(boostInfo.price)}, seu orçamento aparece primeiro para os trabalhadores da categoria — mais chance de receber propostas rápido.`
                : 'Destaque seu orçamento para os trabalhadores verem primeiro.'}
            </Text>
            <View style={{ gap: 10 }}>
              <Botao
                label={boostInfo ? `Publicar com destaque (${formatCurrency(boostInfo.price)})` : 'Publicar com destaque'}
                onPress={() => createQuote(true)}
                carregando={submitting}
              />
              <Botao label="Publicar sem destaque" variant="ghost" onPress={() => createQuote(false)} disabled={submitting} />
            </View>
          </View>
        </View>
      </Modal>
    </ContenedorTela>
  );
}

function SelectChip({ label, active, onPress }) {
  const { theme, rs } = usarTema();
  return (
    <Botao label={label} variant={active ? 'primary' : 'secondary'} fullWidth={false} onPress={onPress} />
  );
}
