import React from 'react';
import { View, Text, ActivityIndicator, Image } from 'react-native';
import { usarTema } from '../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../tema/tipografia';
import { getBadgeColors, STATUS_BADGE, STATUS_LABEL } from '../tema/cores';
import Icon from './Gravacao';
import MoedaFolhas from './MoedaFolhas';
import { urlMidiaAbsoluta } from '../apis/midia';

export function Card({ children, style, padded = true }) {
  const { theme } = usarTema();
  return (
    <View
      style={[
        {
          backgroundColor: theme.cardBg,
          borderWidth: 1,
          borderColor: theme.cardBorder,
          borderRadius: 18,
          padding: padded ? 16 : 0,
          shadowColor: '#000',
          shadowOpacity: theme.isDark ? 0.25 : 0.06,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Badge({ label, kind = 'slate', style }) {
  const { theme, rs } = usarTema();
  const colors = getBadgeColors(kind, theme);
  return (
    <View
      style={[
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 3,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text style={{ color: colors.fg, fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.xs) }}>{label}</Text>
    </View>
  );
}

export function DistintivoEstado({ estado, style }) {
  return <Badge label={STATUS_LABEL[estado] || estado} kind={STATUS_BADGE[estado] || 'slate'} style={style} />;
}

export function Avatar({ uri, nome = '', size = 44, ring }) {
  const { theme } = usarTema();
  const initials = nome
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  // O backend devolve caminho relativo ('/uploads/...'); o <Image> do RN precisa da URL absoluta, e o IP do servidor só é conhecido em tempo de execuçã...
  const resolved = urlMidiaAbsoluta(uri);

  if (resolved) {
    return (
      <Image
        source={{ uri: resolved }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ring ? 2 : 0,
          borderColor: ring || 'transparent',
        }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.brand.orange,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 2 : 0,
        borderColor: ring || 'transparent',
      }}
    >
      <Text style={{ color: '#fff', fontFamily: FONTES.bodyBold, fontSize: size * 0.38 }}>{initials || '?'}</Text>
    </View>
  );
}

export function EstadoVazio({ icone = 'info', titulo, subtitle }) {
  const { theme, rs } = usarTema();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: theme.bgAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Icon nome={icone} size={28} color={theme.textMuted} />
      </View>
      <Text
        style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.md), color: theme.text, textAlign: 'center' }}
      >
        {titulo}
      </Text>
      {!!subtitle && (
        <Text
          style={{
            fontFamily: FONTES.body,
            fontSize: rs(TAMANHOS.sm),
            color: theme.textMuted,
            textAlign: 'center',
            marginTop: 6,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

export function TelaCarregamento({ label = 'Carregando…' }) {
  const { theme, rs } = usarTema();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
      <ActivityIndicator color={theme.brand.orange} size="large" />
      <Text style={{ marginTop: 12, color: theme.textMuted, fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm) }}>
        {label}
      </Text>
    </View>
  );
}

export function AvaliacaoEstrelas({ value = 0, size = 14, count }) {
  const { theme, rs } = usarTema();
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {stars.map((s) => (
        <Icon
          key={s}
          nome="star"
          size={size}
          color={s <= Math.round(value) ? theme.brand.orange : theme.line}
          filled={s <= Math.round(value)}
        />
      ))}
      {typeof count === 'number' && (
        <Text style={{ marginLeft: 6, color: theme.textMuted, fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs) }}>
          ({count})
        </Text>
      )}
    </View>
  );
}

export function LevelBadge({ levelInfo, size = 'md' }) {
  const { theme, rs } = usarTema();
  const coinSize = size === 'sm' ? 22 : size === 'lg' ? 40 : 28;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <MoedaFolhas size={coinSize} level={levelInfo?.level} />
      <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.sm), color: theme.text }}>
        {levelInfo?.levelIcon} {levelInfo?.levelLabel}
      </Text>
    </View>
  );
}

export function PointsPill({ pontos, size = 20 }) {
  const { theme, rs } = usarTema();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.bgAlt,
        borderRadius: 999,
        paddingVertical: 4,
        paddingHorizontal: 10,
        gap: 6,
      }}
    >
      <MoedaFolhas size={size} />
      <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text }}>{pontos}</Text>
    </View>
  );
}


/** * Selo do plano premium. Só aparece para Operária e Rainha — Formiga é o padrão e não precisa (nem deve) ser anunciado como um "selo". */
export function DistintivoPlano({ slug, label, size = 'md', showFree = false }) {
  const { theme, rs } = usarTema();
  if (!slug || (slug === 'formiga' && !showFree)) return null;

  const colors =
    slug === 'rainha'
      ? { bg: '#2B1A05', fg: '#FFC65C', border: '#FFC65C' }
      : slug === 'formiga'
      ? { bg: theme.bgAlt, fg: theme.textMuted, border: theme.cardBorder }
      : { bg: '#0E2418', fg: '#6FD39B', border: '#6FD39B' };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 3,
        alignSelf: 'flex-start',
      }}
    >
      <Icon nome="crown" size={size === 'sm' ? 11 : 13} color={colors.fg} />
      <Text style={{ color: colors.fg, fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.xs) - (size === 'sm' ? 1 : 0) }}>
        {label || (slug === 'rainha' ? 'Rainha' : slug === 'formiga' ? 'Formiga' : 'Operária')}
      </Text>
    </View>
  );
}

/** Caixa de mensagem de erro/sucesso/aviso, padronizada. */
export function Notice({ kind = 'error', mensagem, style }) {
  const { theme, rs } = usarTema();
  if (!mensagem) return null;

  const palette = {
    error: { bg: 'rgba(214,69,69,0.10)', border: theme.brand.danger, fg: theme.brand.danger, icone: 'alert' },
    success: { bg: 'rgba(45,160,95,0.10)', border: theme.brand.green, fg: theme.brand.green, icone: 'check' },
    info: { bg: theme.bgAlt, border: theme.cardBorder, fg: theme.text, icone: 'info' },
    warning: { bg: 'rgba(255,122,0,0.10)', border: theme.brand.orange, fg: theme.brand.orange, icone: 'alert' },
  }[kind];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: 10,
          alignItems: 'flex-start',
          backgroundColor: palette.bg,
          borderWidth: 1,
          borderColor: palette.border,
          borderRadius: 12,
          padding: 12,
          marginBottom: 14,
        },
        style,
      ]}
    >
      <Icon nome={palette.icone} size={17} color={palette.fg} />
      <Text style={{ flex: 1, fontFamily: FONTES.bodyMedium, fontSize: rs(TAMANHOS.sm), color: palette.fg }}>
        {mensagem}
      </Text>
    </View>
  );
}
