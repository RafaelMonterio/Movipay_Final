import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextCampoEntrada, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiConversas } from '../../apis/redeSocial';
import Icon from '../../componentes/Gravacao';
import { EstadoVazio, Notice } from '../../componentes/interface';
import { formatTime } from '../../utilitarios/formatadores';

const POLL_MS = 4000;

/** * Thread de conversa. Aceita dois modos de abertura, porque agora existem dois caminhos até o chat: por CONVERSA (perfil do trabalhador e botão "Contato" dos Shorts) e por PEDID... */
export default function TelaConversa({ route, navigation }) {
  const { orderId, conversationId, otherName } = route.params || {};
  const { theme, rs } = usarTema();
  const { user } = usarAutenticacao();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const intervalRef = useRef(null);

  const [titulo, setTitle] = useState(otherName || 'Conversa');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      if (conversationId) {
        const data = await apiConversas.thread(conversationId);
        setMessages(data.messages || []);
        if (data.other?.nome) setTitle(data.other.nome);
      } else {
        const rows = await apiConversas.messages(orderId);
        setMessages(rows);
      }
      setError('');
    } catch (err) {
      setError(err.friendlyMessage || 'Não foi possível carregar as mensagens.');
    }
  }, [orderId, conversationId]);

  useFocusEffect(
    useCallback(() => {
      load();
      intervalRef.current = setInterval(load, POLL_MS);
      return () => clearInterval(intervalRef.current);
    }, [load])
  );

  const handleSend = async () => {
    if (!text.trim()) return;
    const conteudo = text.trim();
    setText('');
    setSending(true);
    try {
      if (conversationId) await apiConversas.sendToConversation(conversationId, conteudo, orderId);
      else await apiConversas.send(orderId, conteudo);
      await load();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      // Devolve o texto ao campo para a pessoa não perder o que escreveu.
      setText(conteudo);
      setError(err.friendlyMessage || 'Não foi possível enviar a mensagem.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'left', 'right']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.line }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ marginRight: 12 }}>
          <Icon nome="arrowLeft" size={22} color={theme.text} />
        </Pressable>
        <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>{titulo}</Text>
      </View>

      {!!error && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Notice kind="error" mensagem={error} />
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <EstadoVazio
                icone="chat"
                titulo="Comece a conversa"
                subtitle="Envie a primeira mensagem para combinar o serviço."
              />
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.remetente_id === user?.id;
            return (
              <View
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  marginBottom: 10,
                  backgroundColor: mine ? theme.brand.orange : theme.bgAlt,
                  borderRadius: 16,
                  borderBottomRightRadius: mine ? 4 : 16,
                  borderBottomLeftRadius: mine ? 16 : 4,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.base), color: mine ? '#fff' : theme.text }}>
                  {item.conteudo}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTES.body,
                    fontSize: rs(TAMANHOS.xs) - 1,
                    color: mine ? 'rgba(255,255,255,0.75)' : theme.textMuted,
                    marginTop: 4,
                    textAlign: 'right',
                  }}
                >
                  {formatTime(item.criado_em)}
                </Text>
              </View>
            );
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: theme.line }}>
          <TextCampoEntrada
            value={text}
            onChangeText={setText}
            placeholder="Escreva uma mensagem…"
            placeholderTextColor={theme.textMuted}
            style={{
              flex: 1,
              backgroundColor: theme.bgAlt,
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 11,
              color: theme.text,
              fontFamily: FONTES.body,
              fontSize: rs(TAMANHOS.base),
            }}
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={sending || !text.trim()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.brand.orange,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: sending || !text.trim() ? 0.5 : 1,
            }}
          >
            <Icon nome="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
