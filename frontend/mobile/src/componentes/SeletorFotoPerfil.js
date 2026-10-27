import React, { useState } from 'react';
import { View, Text, Pressable, Modal, Image, Alert, Platform } from 'react-native';
import { usarTema } from '../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../tema/tipografia';
import { urlMidiaAbsoluta } from '../apis/midia';
import { useSeletorMidia, UploadProgress } from './SeletorMidia';
import Icon from './Gravacao';
import Botao from './Botao';
import { Notice } from './interface';

/** * Foto de perfil — cliente, trabalhador e híbrido. Fluxo completo: escolher (galeria ou câmera) → VER A PRÉVIA → confirmar → enviar → só então a URL é devolvida ao formulário. A... */
export default function SeletorFotoPerfil({
  value,
  onChange,
  label = 'Foto de perfil',
  required = false,
  size = 110,
  purpose = 'avatar',
  helperText,
  // Antes do cadastro existir, não há sessão (nenhum token) — e o envio pra `POST /midia` exige autenticação. Era exatamente aí que "usar essa foto" da...
  localOnly = false,
}) {
  const { theme, rs } = usarTema();
  const { pick, upload, carregandoUpload, progress } = useSeletorMidia();

  const [preview, setPreview] = useState(null); // asset local aguardando confirmação
  const [error, setError] = useState('');
  const [encoding, setEncoding] = useState(false);

  const handlePick = async (camera) => {
    setError('');
    try {
      const picked = await pick('images', { camera, aspect: [1, 1], quality: 0.8, base64: localOnly });
      if (picked.length) setPreview(picked[0]);
    } catch (err) {
      setError(err.mensagem || 'Não foi possível abrir suas fotos.');
    }
  };

  const confirm = async () => {
    if (!preview) return;
    setError('');

    if (localOnly) {
      if (!preview.base64) {
        setError('Não foi possível processar esta foto. Tente escolher outra.');
        return;
      }
      // ~1.4MB binário vira ~1.9MB em base64 — folga confortável dentro do limite de 15MB do corpo da requisição, sem deixar o cadastro pesado demais numa...
      if (preview.base64.length > 2_000_000) {
        setError('Essa foto ficou grande demais. Tente outra ou tire uma nova foto.');
        return;
      }
      setEncoding(true);
      try {
        const mime = preview.tipo || 'image/jpeg';
        onChange?.(`data:${mime};base64,${preview.base64}`);
        setPreview(null);
      } finally {
        setEncoding(false);
      }
      return;
    }

    try {
      const [file] = await upload([preview], purpose);
      if (!file?.url) throw new Error('O envio não retornou a foto.');
      onChange?.(file.url);
      setPreview(null);
    } catch (err) {
      setError(err.friendlyMessage || err.mensagem || 'Não foi possível enviar a foto.');
    }
  };

  const remove = () => {
    Alert.alert('Remover foto?', 'Seu perfil volta a mostrar as iniciais do seu nome.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => onChange?.(null) },
    ]);
  };

  const current = urlMidiaAbsoluta(value);

  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text, marginBottom: 10 }}>
        {label}
        {required ? ' *' : ' (opcional)'}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Pressable onPress={() => handlePick(false)} disabled={carregandoUpload}>
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: theme.bgAlt,
              borderWidth: 2,
              borderColor: current ? theme.brand.orange : theme.cardBorder,
              borderStyle: current ? 'solid' : 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {current ? (
              <Image source={{ uri: current }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <>
                <Icon nome="camera" size={26} color={theme.textMuted} />
                <Text
                  style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 6 }}
                >
                  Adicionar
                </Text>
              </>
            )}
          </View>
        </Pressable>

        <View style={{ flex: 1, gap: 8 }}>
          <Pressable onPress={() => handlePick(false)} disabled={carregandoUpload}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
              <Icon nome="image" size={17} color={theme.brand.orange} />
              <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text }}>
                Escolher da galeria
              </Text>
            </View>
          </Pressable>

          {Platform.OS !== 'web' && (
            <Pressable onPress={() => handlePick(true)} disabled={carregandoUpload}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
                <Icon nome="camera" size={17} color={theme.brand.orange} />
                <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text }}>
                  Tirar foto agora
                </Text>
              </View>
            </Pressable>
          )}

          {!!current && !required && (
            <Pressable onPress={remove} disabled={carregandoUpload}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
                <Icon nome="trash" size={17} color={theme.brand.danger} />
                <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.brand.danger }}>
                  Remover foto
                </Text>
              </View>
            </Pressable>
          )}
        </View>
      </View>

      {!!helperText && (
        <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 10 }}>
          {helperText}
        </Text>
      )}

      {!!error && <Notice kind="error" mensagem={error} style={{ marginTop: 12, marginBottom: 0 }} />}

      {/* Prévia antes de confirmar */}
      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 }}>
          <Text
            style={{
              fontFamily: FONTES.display,
              fontSize: rs(TAMANHOS.lg),
              color: '#fff',
              textAlign: 'center',
              marginBottom: 20,
            }}
          >
            Ficou bom assim?
          </Text>

          {!!preview && (
            <Image
              source={{ uri: preview.uri }}
              style={{ width: 220, height: 220, borderRadius: 110, alignSelf: 'center' }}
            />
          )}

          {carregandoUpload && (
            <View style={{ marginTop: 20 }}>
              <UploadProgress progress={progress} label="Enviando foto…" />
            </View>
          )}

          <View style={{ marginTop: 28, gap: 10 }}>
            <Botao
              label="Usar esta foto"
              onPress={confirm}
              carregando={carregandoUpload || encoding}
              disabled={carregandoUpload || encoding}
            />
            <Botao
              label="Escolher outra"
              variant="ghost"
              onPress={() => setPreview(null)}
              disabled={carregandoUpload || encoding}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
