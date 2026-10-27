import React, { useState } from 'react';
import { Modal, View, Text, ScrollView, Pressable } from 'react-native';
import { usarTema } from '../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../tema/tipografia';
import CampoEntrada from './CampoEntrada';
import Botao from './Botao';
import Icon from './Gravacao';
import SeletorEndereco from './SeletorEndereco';
import { formatCurrency } from '../utilitarios/formatadores';

const DAY_OPTIONS = [
  { label: 'Hoje', addDays: 0 },
  { label: 'Amanhã', addDays: 1 },
  { label: 'Em 2 dias', addDays: 2 },
  { label: 'Esta semana', addDays: 5 },
];
const PERIOD_OPTIONS = [
  { label: 'Manhã', hour: 9 },
  { label: 'Tarde', hour: 14 },
  { label: 'Noite', hour: 18 },
];

export default function JanelaSolicitarServico({ visible, onClose, service, onConfirm, carregando, defaultAddress }) {
  const { theme, rs } = usarTema();
  const [address, setAddress] = useState(defaultAddress || null);
  const [notes, setNotes] = useState('');
  const [dayIdx, setDayIdx] = useState(1);
  const [periodIdx, setPeriodIdx] = useState(0);

  const handleConfirm = () => {
    const date = new Date();
    date.setDate(date.getDate() + DAY_OPTIONS[dayIdx].addDays);
    date.setHours(PERIOD_OPTIONS[periodIdx].hour, 0, 0, 0);
    onConfirm({
      endereco_id: address.endereco_id,
      numero_endereco: address.numero_endereco,
      complemento_endereco: address.complemento_endereco,
      notes,
      agendado_para: date.toISOString(),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: theme.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontFamily: FONTES.display, fontSize: rs(TAMANHOS.lg), color: theme.text }}>Solicitar serviço</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Icon nome="x" size={22} color={theme.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
            {!!service && (
              <View style={{ backgroundColor: theme.bgAlt, borderRadius: 14, padding: 14, marginBottom: 18 }}>
                <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>{service.titulo}</Text>
                <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.base), color: theme.brand.orange, marginTop: 4 }}>
                  {formatCurrency(service.price)}
                  {service.tipo_preco === 'hourly' ? '/hora' : ''}
                </Text>
              </View>
            )}

            <SeletorEndereco label="Onde vai ser o serviço?" value={address} onChange={setAddress} />
            <CampoEntrada label="Observações (opcional)" placeholder="Detalhes do que você precisa" icone="edit" value={notes} onChangeText={setNotes} multiline />

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(47, 143, 87, 0.10)', borderRadius: 12, padding: 12, marginBottom: 18 }}>
              <Icon nome="gift" size={17} color={theme.brand.green} />
              <Text style={{ flex: 1, fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, lineHeight: 18 }}>
                Agendar o serviço usa o desconto de 5 Folhas da agenda. O débito é confirmado pela API somente quando o pedido é criado.
              </Text>
            </View>

            <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text, marginBottom: 8 }}>Quando?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {DAY_OPTIONS.map((opt, idx) => (
                <Chip key={opt.label} label={opt.label} active={dayIdx === idx} onPress={() => setDayIdx(idx)} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {PERIOD_OPTIONS.map((opt, idx) => (
                <Chip key={opt.label} label={opt.label} active={periodIdx === idx} onPress={() => setPeriodIdx(idx)} />
              ))}
            </View>

            <Botao label="Confirmar solicitação" onPress={handleConfirm} carregando={carregando} disabled={!address} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Chip({ label, active, onPress }) {
  const { theme, rs } = usarTema();
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: 999,
          backgroundColor: active ? theme.brand.orange : theme.bgAlt,
          borderWidth: 1,
          borderColor: active ? theme.brand.orange : theme.cardBorder,
        }}
      >
        <Text style={{ fontFamily: FONTES.bodyMedium, fontSize: rs(TAMANHOS.sm), color: active ? '#fff' : theme.text }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
