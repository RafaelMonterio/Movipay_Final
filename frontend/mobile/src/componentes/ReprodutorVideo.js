import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Platform, ActivityIndicator, Pressable } from 'react-native';
import Icon from './Gravacao';

/** * Player de vídeo dos Shorts. Por que não um componente só: `expo-video` é uma lib NATIVA e não tem build para Web — importá-la sem cuidado quebraria o bundle inteiro do navegad... */
export default function ReprodutorVideo({
  uri,
  paused = false,
  muted = true,
  style,
  resizeMode = 'cover',
  loop = true,
  onLoad,
  interactive = false,
}) {
  if (Platform.OS === 'web') {
    return (
      <WebVideo
        uri={uri}
        paused={paused}
        muted={muted}
        style={style}
        resizeMode={resizeMode}
        loop={loop}
        onLoad={onLoad}
        interactive={interactive}
      />
    );
  }
  return (
    <NativeVideo
      uri={uri}
      paused={paused}
      muted={muted}
      style={style}
      resizeMode={resizeMode}
      loop={loop}
      onLoad={onLoad}
      interactive={interactive}
    />
  );
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** * Camada de controles compartilhada entre Web e Nativo — recebe só dados e callbacks, sem saber nada sobre expo-video ou <video> HTML. isPaused estado EFETIVO de reprodução (for... */
function VideoControls({ isPaused, onTogglePause, currentTime, duration, onSeek }) {
  const [barWidth, setBarWidth] = useState(0);

  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  const handleBarPress = (evt) => {
    if (!barWidth || !duration) return;
    const x = evt.nativeEvent.locationX;
    const fraction = Math.min(1, Math.max(0, x / barWidth));
    onSeek(fraction * duration);
  };

  return (
    <>
      {/* Tocar em qualquer ponto do vídeo pausa/retoma. Pedido explícito:
          a barra de avançar/retroceder só aparece quando o vídeo está
          PAUSADO (antes ficava sempre visível). Isso também resolve, de
          quebra, o motivo real de "não consigo acelerar o vídeo": tocar
          nos controles enquanto o vídeo ainda tocava fazia o próprio
          player corrigir a posição de novo a cada frame seguinte, então
          o toque em avançar/voltar parecia não fazer nada — agora só dá
          pra usar a barra com o vídeo já parado. */}
      <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onTogglePause}>
        {isPaused && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(0,0,0,0.45)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* 'play' (o ícone especial com bolinha própria) NÃO serve
                  aqui — ele desenha um círculo preenchido da cor
                  passada; com color="#fff" isso virava um triângulo
                  branco DENTRO de um círculo branco, ou seja, invisível.
                  'playTriangle' é só o triângulo, sem bolinha embutida —
                  a bolinha de fundo já existe na View acima. */}
              <Icon nome="playTriangle" size={26} color="#fff" filled />
            </View>
          </View>
        )}
      </Pressable>

      {/* Barra de progresso + avançar/retroceder — só quando pausado. */}
      {isPaused && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 10,
            paddingBottom: 12,
            paddingTop: 16,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.55)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {/* Alvos de toque bem maiores que o ícone em si (44x44) —
                num FlatList com paginação vertical, um alvo pequeno tem
                mais chance de o gesto ser interpretado como rolagem em
                vez de toque. */}
            <Pressable
              hitSlop={8}
              onPress={() => onSeek(Math.max(0, currentTime - 10))}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon nome="rewind" size={20} color="#fff" filled />
            </Pressable>

            <Text style={{ color: '#fff', fontSize: 11, fontVariant: ['tabular-nums'], minWidth: 32 }}>
              {formatTime(currentTime)}
            </Text>

            <Pressable
              style={{ flex: 1, height: 44, justifyContent: 'center' }}
              onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
              onPress={handleBarPress}
            >
              <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' }}>
                <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: '#FF7A00' }} />
              </View>
            </Pressable>

            <Text style={{ color: '#fff', fontSize: 11, fontVariant: ['tabular-nums'], minWidth: 32, textAlign: 'right' }}>
              {formatTime(duration)}
            </Text>

            <Pressable
              hitSlop={8}
              onPress={() => onSeek(Math.min(duration || 0, currentTime + 10))}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon nome="forward" size={20} color="#fff" filled />
            </Pressable>
          </View>
        </View>
      )}
    </>
  );
}

// ---------------------------------------------------------------- Web
function WebVideo({ uri, paused, muted, style, resizeMode, loop, onLoad, interactive }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  // Pausa por estar fora da tela (prop `paused`) e pausa por toque do usuário são coisas DIFERENTES: se a pessoa pausou de propósito, o vídeo deve cont...
  const [userPaused, setUserPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const effectivePaused = paused || userPaused;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (effectivePaused) el.pause();
    else el.play().catch(() => { /* autoplay bloqueado pelo navegador — o toque do usuário resolve */ });
  }, [effectivePaused, uri]);

  const handleSeek = useCallback((seconds) => {
    if (ref.current) {
      ref.current.pause();
      ref.current.currentTime = seconds;
    }
    setCurrentTime(seconds);
  }, []);

  return (
    <View style={[{ backgroundColor: '#111', overflow: 'hidden' }, style]}>
      {!ready && <Carregando />}
      {/* eslint-disable-next-line react/no-unknown-property */}
      <video
        ref={ref}
        src={uri}
        muted={muted}
        loop={loop}
        playsInline
        preload="metadata"
        onLoadedData={(e) => {
          setReady(true);
          setDuration(e.target.duration || 0);
          onLoad?.();
        }}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime || 0)}
        onDurationChange={(e) => setDuration(e.target.duration || 0)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: resizeMode === 'contain' ? 'contain' : 'cover',
          backgroundColor: '#111',
        }}
      />
      {interactive && ready && (
        <VideoControls
          isPaused={effectivePaused}
          onTogglePause={() => setUserPaused((v) => !v)}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
        />
      )}
    </View>
  );
}

// ------------------------------------------------------------- Nativo
function NativeVideo({ uri, paused, muted, style, resizeMode, loop, onLoad, interactive }) {
  // require condicional: o Metro só resolve isto fora da Web.
  const expoVideo = require('expo-video');
  const { VideoView, useReprodutorVideo } = expoVideo;

  const [ready, setReady] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const effectivePaused = paused || userPaused;

  const player = useReprodutorVideo(uri, (p) => {
    p.loop = loop;
    p.muted = muted;
    // Com controles interativos precisamos de progresso de verdade; sem eles, um intervalo maior economiza trabalho por quadro.
    p.timeUpdateEventInterval = interactive ? 0.25 : 1;
  });

  useEffect(() => {
    if (!player) return undefined;
    try {
      if (effectivePaused) player.pause();
      else player.play();
    } catch {
      /* player já liberado durante a navegação */
    }
    return undefined;
  }, [effectivePaused, player]);

  useEffect(() => {
    if (!player) return undefined;
    const sub = player.addListener?.('statusChange', ({ estado }) => {
      if (estado === 'readyToPlay' && !ready) {
        setReady(true);
        setDuration(player.duration || 0);
        onLoad?.();
      }
    });
    return () => sub?.remove?.();
  }, [player, ready, onLoad]);

  useEffect(() => {
    if (!player || !interactive) return undefined;
    const sub = player.addListener?.('timeUpdate', (payload) => {
      const t = typeof payload === 'number' ? payload : payload?.currentTime;
      if (typeof t === 'number') setCurrentTime(t);
      if (player.duration) setDuration(player.duration);
    });
    return () => sub?.remove?.();
  }, [player, interactive]);

  useEffect(() => {
    if (!player) return undefined;
    player.muted = muted;
    return undefined;
  }, [muted, player]);

  const handleSeek = useCallback(
    (seconds) => {
      if (!player) return;
      try {
        // Os controles só aparecem com o vídeo pausado, mas o pause() é reforçado aqui mesmo assim: setar currentTime enquanto o player ainda está tocando po...
        player.pause();
        player.currentTime = seconds;
      } catch {
        /* seek pode falhar num player já liberado durante a navegação */
      }
      setCurrentTime(seconds);
    },
    [player]
  );

  return (
    <View style={[{ backgroundColor: '#111', overflow: 'hidden' }, style]}>
      {!ready && <Carregando />}
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit={resizeMode === 'contain' ? 'contain' : 'cover'}
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
      {interactive && ready && (
        <VideoControls
          isPaused={effectivePaused}
          onTogglePause={() => setUserPaused((v) => !v)}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
        />
      )}
    </View>
  );
}

function Carregando() {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
      }}
      pointerEvents="none"
    >
      <ActivityIndicator color="#fff" size="large" />
    </View>
  );
}

/** Botão de mudo que o feed sobrepõe ao vídeo. */
export function MuteToggle({ muted, onToggle, style }) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={12}
      style={[
        {
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: 'rgba(0,0,0,0.45)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Icon nome={muted ? 'volumeOff' : 'volumeOn'} size={17} color="#fff" />
    </Pressable>
  );
}
