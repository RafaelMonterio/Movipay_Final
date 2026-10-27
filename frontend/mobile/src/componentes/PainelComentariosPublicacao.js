import React, { useEffect, useState } from 'react';
import { Modal, View, Text, FlatList, TextCampoEntrada, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { usarTema } from '../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../tema/tipografia';
import { apiPublicacoes } from '../apis/publicacoes';
import { Avatar, EstadoVazio, TelaCarregamento } from './interface';
import Icon from './Gravacao';
import { timeAgo } from '../utilitarios/formatadores';

export default function PainelComentariosPublicacao({ visible, shortId, onClose, onCommentAdded }) {
  const { theme, rs } = usarTema();
  const [comments, setComments] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible || !shortId) return;
    setCarregando(true);
    apiPublicacoes
      .comments(shortId)
      .then(setComments)
      .finally(() => setCarregando(false));
  }, [visible, shortId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const comment = await apiPublicacoes.addComment(shortId, text.trim());
      setComments((c) => [...c, comment]);
      setText('');
      onCommentAdded?.();
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: theme.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '65%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 }}>
              <Text style={{ fontFamily: FONTES.display, fontSize: rs(TAMANHOS.lg), color: theme.text }}>Comentários</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Icon nome="x" size={22} color={theme.text} />
              </Pressable>
            </View>

            {carregando ? (
              <TelaCarregamento />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingHorizontal: 18, flexGrow: 1 }}
                ListEmptyComponent={<EstadoVazio icone="comment" titulo="Seja o primeiro a comentar" />}
                renderItem={({ item }) => (
                  <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 10 }}>
                    <Avatar uri={item.url_avatar} nome={item.nome} size={34} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text }}>
                        {item.nome} <Text style={{ fontFamily: FONTES.body, color: theme.textMuted, fontSize: rs(TAMANHOS.xs) }}>· {timeAgo(item.criado_em)}</Text>
                      </Text>
                      <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.text, marginTop: 2 }}>
                        {item.conteudo}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10, borderTopWidth: 1, borderTopColor: theme.line }}>
              <TextCampoEntrada
                value={text}
                onChangeText={setText}
                placeholder="Escreva um comentário…"
                placeholderTextColor={theme.textMuted}
                style={{
                  flex: 1,
                  backgroundColor: theme.bgAlt,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  color: theme.text,
                  fontFamily: FONTES.body,
                  fontSize: rs(TAMANHOS.base),
                }}
              />
              <Pressable onPress={handleSend} disabled={sending || !text.trim()} hitSlop={8}>
                <Icon nome="send" size={22} color={theme.brand.orange} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
