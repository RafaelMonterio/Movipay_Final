import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Modal, ScrollView, Pressable, Alert } from 'react-native';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiServicos } from '../../apis/mercado';
import ContenedorTela from '../../componentes/ContenedorTela';
import { Card, EstadoVazio, TelaCarregamento, Badge } from '../../componentes/interface';
import CampoEntrada from '../../componentes/CampoEntrada';
import Botao from '../../componentes/Botao';
import Icon from '../../componentes/Gravacao';
import { formatCurrency } from '../../utilitarios/formatadores';

const PRICE_TYPES = [
  { key: 'fixed', label: 'Preço fixo' },
  { key: 'hourly', label: 'Por hora' },
  { key: 'negotiable', label: 'A combinar' },
];

export default function TelaServicos({ navigation }) {
  const { theme, rs } = usarTema();
  const { user } = usarAutenticacao();
  const [servicos, setServices] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [titulo, setTitle] = useState('');
  const [descricao, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState('fixed');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const rows = await apiServicos.list({ trabalhador_id: user.id });
    setServices(rows);
  }, [user.id]);

  useEffect(() => {
    setCarregando(true);
    load().finally(() => setCarregando(false));
  }, [load]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setPriceType('fixed');
  };

  const handleCreate = async () => {
    if (!titulo || !price) {
      Alert.alert('Preencha tudo', 'Informe pelo menos o título e o preço.');
      return;
    }
    setSaving(true);
    try {
      await apiServicos.create({ titulo, descricao, price: Number(price), tipo_preco: priceType });
      setModalVisible(false);
      resetForm();
      await load();
    } catch (err) {
      Alert.alert('Não foi possível criar', err.friendlyMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (service) => {
    Alert.alert('Remover serviço', `Remover "${service.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await apiServicos.remove(service.id);
          await load();
        },
      },
    ]);
  };

  return (
    <ContenedorTela
      titulo="Meus serviços"
      scroll={false}
      padded={false}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      rightAction={
        <Pressable onPress={() => setModalVisible(true)} hitSlop={10}>
          <Icon nome="plus" size={24} color={theme.brand.orange} />
        </Pressable>
      }
    >
      {carregando ? (
        <TelaCarregamento />
      ) : (
        <FlatList
          data={servicos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={<EstadoVazio icone="briefcase" titulo="Nenhum serviço cadastrado" subtitle="Toque em + para adicionar o primeiro." />}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>{item.titulo}</Text>
                  <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.sm), color: theme.brand.orange, marginTop: 4 }}>
                    {formatCurrency(item.price)}
                  </Text>
                </View>
                <Pressable onPress={() => handleRemove(item)} hitSlop={8}>
                  <Icon nome="trash" size={18} color={theme.brand.danger} />
                </Pressable>
              </View>
            </Card>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20 }}>
              <Text style={{ fontFamily: FONTES.display, fontSize: rs(TAMANHOS.lg), color: theme.text }}>Novo serviço</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                <Icon nome="x" size={22} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
              <CampoEntrada label="Título" placeholder="Ex.: Instalação de chuveiro" value={titulo} onChangeText={setTitle} icone="edit" />
              <CampoEntrada label="Descrição (opcional)" value={descricao} onChangeText={setDescription} multiline />
              <CampoEntrada label="Preço (R$)" placeholder="120" keyboardType="numeric" value={price} onChangeText={setPrice} icone="wallet" />
              <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text, marginBottom: 8 }}>Tipo de preço</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {PRICE_TYPES.map((pt) => (
                  <Pressable key={pt.key} onPress={() => setPriceType(pt.key)}>
                    <Badge label={pt.label} kind={priceType === pt.key ? 'orange' : 'slate'} />
                  </Pressable>
                ))}
              </View>
              <Botao label="Salvar serviço" onPress={handleCreate} carregando={saving} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ContenedorTela>
  );
}
