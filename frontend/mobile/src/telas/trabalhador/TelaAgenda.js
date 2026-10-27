import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiAgenda } from '../../apis/pedidos';
import { apiTrabalhadores } from '../../apis/mercado';
import ContenedorTela from '../../componentes/ContenedorTela';
import { Card, EstadoVazio, Badge, Notice } from '../../componentes/interface';
import Botao from '../../componentes/Botao';
import CampoEntrada from '../../componentes/CampoEntrada';
import Icon from '../../componentes/Gravacao';
import { formatCurrency, formatTime, weekdayLabel, hourLabel } from '../../utilitarios/formatadores';

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const HOURS = [8, 9, 12, 14, 18];

export default function TelaAgenda({ navigation }) {
  const { theme, rs } = usarTema();
  const { user } = usarAutenticacao();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [slots, setSlots] = useState({});
  const [savingSlots, setSavingSlots] = useState(false);
  const [tab, setTab] = useState('agenda'); // 'agenda' | 'disponibilidade'
  const [noteModal, setNoteModal] = useState(null); // null | { id?, titulo, note, date }
  const [savingNote, setSavingNote] = useState(false);
  const [notesError, setNotesError] = useState('');

  const loadEvents = useCallback(async () => {
    const rows = await apiAgenda.events(month, 'worker');
    setEvents(rows);
  }, [month]);

  const loadNotes = useCallback(async () => {
    try {
      const rows = await apiAgenda.notes(month);
      setNotes(rows);
      setNotesError('');
    } catch (err) {
      setNotesError(err.friendlyMessage || 'Não foi possível carregar suas anotações.');
    }
  }, [month]);

  const loadSlots = useCallback(async () => {
    const detail = await apiTrabalhadores.detail(user.id);
    const map = {};
    detail.slots.forEach((s) => {
      map[`${s.weekday}-${s.hora_inicio}`] = true;
    });
    setSlots(map);
  }, [user.id]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  // Um dia pode ter pedido E anotação ao mesmo tempo — usamos dois pontinhos (laranja = pedido, verde = anotação própria) em vez de um só, pra não esco...
  const markedDates = {};
  events.forEach((e) => {
    const day = e.agendado_para?.slice(0, 10);
    if (!day) return;
    const dots = markedDates[day]?.dots || [];
    markedDates[day] = { ...markedDates[day], dots: [...dots, { key: 'order', color: theme.brand.orange }] };
  });
  notes.forEach((n) => {
    const day = n.data_anotacao?.slice(0, 10);
    if (!day) return;
    const dots = markedDates[day]?.dots || [];
    markedDates[day] = { ...markedDates[day], dots: [...dots, { key: 'note', color: theme.brand.green }] };
  });
  if (selectedDay) markedDates[selectedDay] = { ...markedDates[selectedDay], selected: true, selectedColor: theme.brand.orange };

  const dayEvents = selectedDay ? events.filter((e) => e.agendado_para?.slice(0, 10) === selectedDay) : events;
  const dayNotes = selectedDay ? notes.filter((n) => n.data_anotacao?.slice(0, 10) === selectedDay) : notes;

  const openNewNote = () => {
    if (!selectedDay) {
      Alert.alert('Escolha um dia', 'Toque em um dia no calendário para adicionar uma anotação nele.');
      return;
    }
    setNoteModal({ date: selectedDay, titulo: '', note: '' });
  };

  const openEditNote = (n) => setNoteModal({ id: n.id, date: n.data_anotacao.slice(0, 10), titulo: n.titulo, note: n.note || '' });

  const saveNote = async () => {
    if (!noteModal.titulo.trim()) {
      Alert.alert('Falta o título', 'Dê um nome curto para a anotação.');
      return;
    }
    setSavingNote(true);
    try {
      if (noteModal.id) {
        await apiAgenda.updateNote(noteModal.id, { titulo: noteModal.titulo.trim(), note: noteModal.note.trim() || null });
      } else {
        await apiAgenda.createNote({ data_anotacao: noteModal.date, titulo: noteModal.titulo.trim(), note: noteModal.note.trim() || null });
      }
      setNoteModal(null);
      await loadNotes();
    } catch (err) {
      Alert.alert('Não foi possível salvar', err.friendlyMessage || 'Tente novamente.');
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = (id) => {
    Alert.alert('Excluir anotação?', '', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiAgenda.deleteNote(id);
            setNoteModal(null);
            await loadNotes();
          } catch (err) {
            Alert.alert('Não foi possível excluir', err.friendlyMessage || 'Tente novamente.');
          }
        },
      },
    ]);
  };

  const toggleSlot = (weekday, hour) => {
    const key = `${weekday}-${hour}`;
    setSlots((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSlots = async () => {
    setSavingSlots(true);
    try {
      const list = [];
      Object.keys(slots).forEach((key) => {
        if (slots[key]) {
          const [weekday, hour] = key.split('-').map(Number);
          list.push({ weekday, hora_inicio: hour, hora_fim: Math.min(hour + 4, 23) });
        }
      });
      await apiTrabalhadores.setSlots(user.id, list);
      Alert.alert('Disponibilidade atualizada!');
    } catch (err) {
      Alert.alert('Não foi possível salvar', err.friendlyMessage);
    } finally {
      setSavingSlots(false);
    }
  };

  return (
    <ContenedorTela titulo="Agenda" scroll={false} padded={false}>
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 6 }}>
        <TabBotao label="Compromissos" active={tab === 'agenda'} onPress={() => setTab('agenda')} />
        <TabBotao label="Disponibilidade" active={tab === 'disponibilidade'} onPress={() => setTab('disponibilidade')} />
      </View>

      {tab === 'agenda' ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Calendar
            onMonthChange={(m) => setMonth(`${m.year}-${String(m.month).padStart(2, '0')}`)}
            onDayPress={(d) => setSelectedDay(d.dateString === selectedDay ? null : d.dateString)}
            markedDates={markedDates}
            markingType="multi-dot"
            theme={{
              backgroundColor: theme.bg,
              calendarBackground: theme.bg,
              textSectionTitleColor: theme.textMuted,
              dayTextColor: theme.text,
              monthTextColor: theme.text,
              todayTextColor: theme.brand.orange,
              arrowColor: theme.brand.orange,
              selectedDayBackgroundColor: theme.brand.orange,
            }}
            style={{ borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: theme.cardBorder }}
          />
          <Notice kind="error" mensagem={notesError} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>
              {selectedDay ? `Compromissos do dia` : 'Todos os compromissos do mês'}
            </Text>
            {/* Os dias com pedido aceito já ficam marcados sozinhos (bolinha
                laranja); este "+" é só para o trabalhador anotar algo
                próprio — um lembrete, uma tarefa — no dia selecionado. */}
            <Pressable
              onPress={openNewNote}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: selectedDay ? 1 : 0.4 }}
            >
              <Icon nome="plus" size={16} color={theme.brand.green} />
              <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.xs), color: theme.brand.green }}>
                Anotação
              </Text>
            </Pressable>
          </View>
          {dayEvents.length === 0 && dayNotes.length === 0 ? (
            <EstadoVazio icone="calendar" titulo="Nada agendado" subtitle='Toque em um dia e depois em "Anotação" para adicionar algo.' />
          ) : (
            <>
              {dayEvents.map((e) => (
                <Pressable key={`order-${e.pedido_id}`} onPress={() => navigation.navigate('OrderDetail', { orderId: e.pedido_id })}>
                  <Card style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>
                        {e.titulo_servico || 'Pedido'}
                      </Text>
                      <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.sm), color: theme.brand.orange }}>
                        {formatCurrency(e.price)}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 4 }}>
                      {e.nome_cliente} · {formatTime(e.agendado_para)}
                    </Text>
                  </Card>
                </Pressable>
              ))}
              {dayNotes.map((n) => (
                <Pressable key={`note-${n.id}`} onPress={() => openEditNote(n)}>
                  <Card style={{ marginBottom: 10, borderLeftWidth: 3, borderLeftColor: theme.brand.green }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Icon nome="edit" size={14} color={theme.brand.green} />
                      <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.base), color: theme.text, flex: 1 }}>
                        {n.titulo}
                      </Text>
                    </View>
                    {!!n.note && (
                      <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginTop: 6 }}>
                        {n.note}
                      </Text>
                    )}
                  </Card>
                </Pressable>
              ))}
            </>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginBottom: 16 }}>
            Toque nos horários em que você costuma estar disponível.
          </Text>
          {WEEKDAYS.map((wd) => (
            <View key={wd} style={{ marginBottom: 14 }}>
              <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text, marginBottom: 8 }}>
                {weekdayLabel(wd)}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {HOURS.map((h) => {
                  const active = !!slots[`${wd}-${h}`];
                  return (
                    <Pressable key={h} onPress={() => toggleSlot(wd, h)}>
                      <Badge label={hourLabel(h)} kind={active ? 'green' : 'slate'} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          <Botao label="Salvar disponibilidade" onPress={saveSlots} carregando={savingSlots} style={{ marginTop: 10 }} />
        </ScrollView>
      )}

      <Modal visible={!!noteModal} transparent animationType="fade" onRequestClose={() => setNoteModal(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: theme.bg, borderRadius: 20, padding: 20 }}>
            <Text style={{ fontFamily: FONTES.display, fontSize: rs(TAMANHOS.lg), color: theme.text, marginBottom: 4 }}>
              {noteModal?.id ? 'Editar anotação' : 'Nova anotação'}
            </Text>
            <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginBottom: 16 }}>
              {noteModal?.date}
            </Text>
            <CampoEntrada
              label="Título"
              placeholder="Ex.: Comprar material"
              value={noteModal?.titulo || ''}
              onChangeText={(t) => setNoteModal((m) => ({ ...m, titulo: t }))}
            />
            <CampoEntrada
              label="Observação (opcional)"
              placeholder="Detalhes do que você precisa fazer"
              value={noteModal?.note || ''}
              onChangeText={(t) => setNoteModal((m) => ({ ...m, note: t }))}
              multiline
            />
            <View style={{ gap: 10, marginTop: 6 }}>
              <Botao label="Salvar" onPress={saveNote} carregando={savingNote} />
              {noteModal?.id && (
                <Botao label="Excluir anotação" variant="ghost" onPress={() => deleteNote(noteModal.id)} disabled={savingNote} />
              )}
              <Botao label="Cancelar" variant="ghost" onPress={() => setNoteModal(null)} disabled={savingNote} />
            </View>
          </View>
        </View>
      </Modal>
    </ContenedorTela>
  );
}

function TabBotao({ label, active, onPress }) {
  const { theme, rs } = usarTema();
  return (
    <Pressable onPress={onPress} style={{ paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: active ? theme.brand.orange : 'transparent' }}>
      <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: active ? theme.brand.orange : theme.textMuted }}>
        {label}
      </Text>
    </Pressable>
  );
}
