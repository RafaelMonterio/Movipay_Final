import React, { useState, useCallback } from 'react';
import { View, Text, Image, Pressable, Alert, Platform, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { usarTema } from '../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../tema/tipografia';
import { apiMidia, urlMidiaAbsoluta } from '../apis/midia';
import Icon from './Gravacao';
import ReprodutorVideo from './ReprodutorVideo';

/** * Escolha de mídia — usado tanto pela foto de perfil quanto pelos Shorts. Um só lugar concentra as três coisas chatas: pedir permissão (galeria E câmera, separadamente, porque o... */

export function useSeletorMidia() {
  const [carregandoUpload, setCarregandoUpload] = useState(false);
  const [progress, setProgress] = useState(0);

  const ensurePermission = useCallback(async (kind) => {
    if (Platform.OS === 'web') return true;
    const fn =
      kind === 'camera'
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { estado } = await fn();
    if (estado !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        kind === 'camera'
          ? 'Autorize o acesso à câmera nos ajustes do celular para tirar a foto.'
          : 'Autorize o acesso às suas fotos nos ajustes do celular para escolher um arquivo.'
      );
      return false;
    }
    return true;
  }, []);

  /** * @param {'images'|'videos'|'all'} media @param {{ camera?:boolean, multiple?:boolean, limit?:number, aspect?:number[], quality?:number, base64?:boolean }} options */
  const pick = useCallback(
    async (media = 'images', options = {}) => {
      const { camera = false, multiple = false, limit = 5, aspect, quality = 0.7, base64 = false } = options;

      const allowed = await ensurePermission(camera ? 'camera' : 'library');
      if (!allowed) return [];

      // A API de tipos mudou no SDK 52+ (array de strings em vez do enum MediaTypeOptions). Damos suporte aos dois para o app não quebrar se alguém atualiz...
      const legacy = ImagePicker.MediaTypeOptions;
      const mediaTypes = legacy
        ? media === 'videos'
          ? legacy.Videos
          : media === 'all'
          ? legacy.All
          : legacy.Images
        : media === 'videos'
        ? ['videos']
        : media === 'all'
        ? ['images', 'videos']
        : ['images'];

      const params = {
        mediaTypes,
        quality,
        allowsMultipleSelection: multiple && !camera,
        selectionLimit: multiple ? limit : 1,
        videoMaxDuration: 90,
        // Só pedimos o base64 quando alguém realmente precisa dele (ex.: foto de perfil no cadastro, antes de existir sessão pra fazer upload de verdade) — p...
        base64,
      };
      if (aspect) {
        params.allowsEditing = true;
        params.aspect = aspect;
      }

      const result = camera
        ? await ImagePicker.launchCameraAsync(params)
        : await ImagePicker.launchImageLibraryAsync(params);

      if (result.canceled) return [];

      return (result.assets || []).map((a) => ({
        uri: a.uri,
        nome: a.fileName || undefined,
        tipo: a.mimeType || undefined,
        kind: a.tipo === 'video' ? 'video' : 'image',
        width: a.width,
        height: a.height,
        duration: a.duration ? a.duration / 1000 : null,
        sizeBytes: a.fileSize,
        base64: a.base64 || undefined,
      }));
    },
    [ensurePermission]
  );

  /** Envia para o backend e devolve as URLs já persistidas. */
  const upload = useCallback(async (assets, purpose = 'short') => {
    if (!assets?.length) return [];
    setCarregandoUpload(true);
    setProgress(0);
    try {
      return await apiMidia.upload(assets, purpose, setProgress);
    } finally {
      setCarregandoUpload(false);
      setProgress(0);
    }
  }, []);

  return { pick, upload, carregandoUpload, progress };
}

/** Miniatura que entende foto e vídeo (o vídeo entra pausado, como capa). */
export function MediaThumb({ asset, size = 100, ratio = 1.4, onRemove, style }) {
  const { theme } = usarTema();
  const uri = urlMidiaAbsoluta(asset?.uri || asset?.url);
  const isVideo = asset?.kind === 'video' || asset?.tipo_midia === 'video';

  return (
    <View
      style={[
        { width: size, height: size * ratio, borderRadius: 12, overflow: 'hidden', backgroundColor: theme.bgAlt },
        style,
      ]}
    >
      {isVideo ? (
        <>
          <ReprodutorVideo uri={uri} paused muted style={{ width: '100%', height: '100%' }} />
          <View style={{ position: 'absolute', bottom: 6, left: 6 }}>
            <Icon nome="video" size={15} color="#fff" />
          </View>
        </>
      ) : (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      )}

      {!!onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: 'rgba(0,0,0,0.65)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon nome="x" size={13} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

/** Barra de progresso de upload — feedback real, não um spinner genérico. */
export function UploadProgress({ progress, label = 'Enviando…' }) {
  const { theme, rs } = usarTema();
  const pct = Math.round((progress || 0) * 100);
  return (
    <View style={{ marginVertical: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <ActivityIndicator size="small" color={theme.brand.orange} />
        <Text style={{ fontFamily: FONTES.bodyMedium, fontSize: rs(TAMANHOS.sm), color: theme.text }}>
          {label} {pct > 0 ? `${pct}%` : ''}
        </Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.bgAlt, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: theme.brand.orange }} />
      </View>
    </View>
  );
}

/** Botões "Galeria" / "Câmera" (a câmera some na Web, onde não funciona). */
export function MediaSourceBotaos({ onGallery, onCamera, disabled, galleryLabel = 'Galeria', cameraLabel = 'Câmera' }) {
  const { theme, rs } = usarTema();
  const showCamera = Platform.OS !== 'web' && !!onCamera;

  const btn = (icone, label, onPress) => (
    <Pressable
      key={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 13,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: theme.cardBorder,
        backgroundColor: pressed ? theme.bgAlt : 'transparent',
        opacity: disabled ? 0.5 : 1,
      })}
    >
      <Icon nome={icone} size={18} color={theme.brand.orange} />
      <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {btn('image', galleryLabel, onGallery)}
      {showCamera && btn('camera', cameraLabel, onCamera)}
    </View>
  );
}
