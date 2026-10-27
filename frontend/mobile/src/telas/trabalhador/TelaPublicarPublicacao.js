import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { usarTema } from '../../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiPublicacoes } from '../../apis/publicacoes';
import { apiMidia } from '../../apis/midia';
import ContenedorTela from '../../componentes/ContenedorTela';
import CampoEntrada from '../../componentes/CampoEntrada';
import Botao from '../../componentes/Botao';
import Icon from '../../componentes/Gravacao';
import { Notice } from '../../componentes/interface';
import {
  useSeletorMidia,
  MediaThumb,
  UploadProgress,
  MediaSourceBotaos,
} from '../../componentes/SeletorMidia';

const MAX_PHOTOS = 5;

/** * Publicar Short — foto OU vídeo. O que estava errado antes: a tela só abria a galeria de fotos e mandava tudo como base64 no corpo do JSON. Vídeo nunca chegava inteiro ao servi... */
export default function TelaPublicarPublicacao({ navigation }) {
  const { theme, rs } = usarTema();
  const { pick, upload, carregandoUpload, progress } = useSeletorMidia();

  const [modo, setMode] = useState('photo'); // 'photo' | 'video'
  const [assets, setAssets] = useState([]);
  const [caption, setCaption] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [limits, setLimits] = useState(null);

  useEffect(() => {
    apiMidia.limits().then(setLimits).catch(() => {});
  }, []);

  const maxVideoMB = limits?.maxVideoMB ?? 120;
  const maxImageMB = limits?.maxImageMB ?? 12;

  const handlePick = async (camera) => {
    setError('');
    try {
      const picked = await pick(modo === 'video' ? 'videos' : 'images', {
        camera,
        multiple: modo === 'photo' && !camera,
        limit: MAX_PHOTOS - assets.length,
        quality: modo === 'video' ? 1 : 0.7,
      });
      if (!picked.length) return;

      if (modo === 'video') {
        const video = picked[0];
        const limitBytes = maxVideoMB * 1024 * 1024;
        if (video.sizeBytes && video.sizeBytes > limitBytes) {
          setError(`Este vídeo tem mais de ${maxVideoMB} MB. Grave um trecho mais curto ou reduza a qualidade.`);
          return;
        }
        setAssets([video]); // um vídeo por publicação
      } else {
        const tooBig = picked.find((p) => p.sizeBytes && p.sizeBytes > maxImageMB * 1024 * 1024);
        if (tooBig) {
          setError(`Uma das fotos passa de ${maxImageMB} MB. Escolha outra.`);
          return;
        }
        setAssets((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
      }
    } catch (err) {
      setError(err.mensagem || 'Não foi possível abrir seus arquivos.');
    }
  };

  const alternarModo = (next) => {
    if (next === modo) return;
    setMode(next);
    setAssets([]); // foto e vídeo não se misturam na mesma publicação
    setError('');
  };

  const removeAsset = (index) => setAssets((prev) => prev.filter((_, i) => i !== index));

  const handlePublish = async () => {
    if (assets.length === 0) {
      setError(modo === 'video' ? 'Escolha um vídeo para publicar.' : 'Escolha ao menos uma foto.');
      return;
    }
    setError('');
    setPublishing(true);
    try {
      // 1. sobe o arquivo de verdade
      const uploaded = await upload(assets, 'short');
      if (!uploaded.length) throw new Error('O envio do arquivo não retornou nenhuma URL.');

      // 2. cria a publicação apontando para os arquivos já persistidos
      await apiPublicacoes.publish({
        mediaUrls: uploaded.map((f) => f.url),
        caption: caption.trim() || undefined,
        durationSeconds: assets[0]?.duration || undefined,
      });

      Alert.alert(
        'Publicado!',
        modo === 'video'
          ? 'Seu vídeo já está no feed de Shorts.'
          : 'Suas fotos já estão no feed de Shorts.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      setError(err.friendlyMessage || err.mensagem || 'Não foi possível publicar. Tente novamente.');
    } finally {
      setPublishing(false);
    }
  };

  const busy = carregandoUpload || publishing;

  return (
    <ContenedorTela titulo="Publicar Short" onBack={() => navigation.goBack()}>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <TypeOption
          icone="image"
          label="Fotos"
          hint={`até ${MAX_PHOTOS}`}
          active={modo === 'photo'}
          onPress={() => alternarModo('photo')}
          disabled={busy}
        />
        <TypeOption
          icone="video"
          label="Vídeo"
          hint={`até ${maxVideoMB} MB`}
          active={modo === 'video'}
          onPress={() => alternarModo('video')}
          disabled={busy}
        />
      </View>

      <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginBottom: 14 }}>
        {modo === 'video'
          ? 'Grave ou escolha um vídeo curto mostrando seu trabalho. Clientes da sua região vão ver no feed de Shorts.'
          : `Mostre um trabalho seu em até ${MAX_PHOTOS} fotos. Clientes da sua região vão ver no feed de Shorts.`}
      </Text>

      <Notice kind="error" mensagem={error} />

      {assets.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
          {assets.map((asset, index) => (
            <MediaThumb
              key={`${asset.uri}-${index}`}
              asset={asset}
              size={modo === 'video' ? 140 : 100}
              onRemove={busy ? undefined : () => removeAsset(index)}
            />
          ))}
        </ScrollView>
      )}

      <View style={{ marginTop: assets.length ? 16 : 0, marginBottom: 16 }}>
        {(modo === 'video' ? assets.length === 0 : assets.length < MAX_PHOTOS) && (
          <MediaSourceBotaos
            disabled={busy}
            onGallery={() => handlePick(false)}
            onCamera={() => handlePick(true)}
            galleryLabel={modo === 'video' ? 'Escolher vídeo' : 'Escolher fotos'}
            cameraLabel={modo === 'video' ? 'Gravar' : 'Tirar foto'}
          />
        )}
        {Platform.OS === 'web' && modo === 'video' && (
          <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 8 }}>
            Gravar pela câmera só funciona no aplicativo do celular. Aqui no navegador, escolha um arquivo.
          </Text>
        )}
      </View>

      <CampoEntrada
        label="Legenda (opcional)"
        placeholder="Conte o que você fez nesse trabalho"
        value={caption}
        onChangeText={setCaption}
        multiline
        editable={!busy}
      />

      {carregandoUpload && (
        <UploadProgress
          progress={progress}
          label={modo === 'video' ? 'Enviando vídeo…' : 'Enviando fotos…'}
        />
      )}

      <Botao
        label={modo === 'video' ? 'Publicar vídeo' : 'Publicar'}
        icone="upload"
        onPress={handlePublish}
        carregando={busy}
        disabled={assets.length === 0 || busy}
      />

      <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, textAlign: 'center', marginTop: 12 }}>
        O arquivo fica salvo no servidor do MoviPay e pode ser excluído por você a qualquer momento em "Meus trabalhos".
      </Text>
    </ContenedorTela>
  );
}

function TypeOption({ icone, label, hint, active, onPress, disabled }) {
  const { theme, rs } = usarTema();
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ flex: 1, opacity: disabled ? 0.6 : 1 }}>
      <View
        style={{
          borderWidth: 1.5,
          borderColor: active ? theme.brand.orange : theme.cardBorder,
          backgroundColor: active ? 'rgba(255,122,0,0.08)' : theme.bgAlt,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: 'center',
          gap: 5,
        }}
      >
        <Icon nome={icone} size={20} color={active ? theme.brand.orange : theme.textMuted} />
        <Text
          style={{
            fontFamily: FONTES.bodySemiBold,
            fontSize: rs(TAMANHOS.sm),
            color: active ? theme.brand.orange : theme.text,
          }}
        >
          {label}
        </Text>
        <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs) - 1, color: theme.textMuted }}>{hint}</Text>
      </View>
    </Pressable>
  );
}
