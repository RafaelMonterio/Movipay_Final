import React from 'react';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Circle, Ellipse, Path } from 'react-native-svg';
import { BRAND, LEVEL_COLORS } from '../tema/cores';

// Moeda das "Folhas" 🍃 — pedida explicitamente no estilo da moedinha da Shopee: moeda circular com brilho e um símbolo estilizado no centro. Sem `lev...
export default function MoedaFolhas({ size = 28, level = null, style }) {
  const colors = level && LEVEL_COLORS[level] ? LEVEL_COLORS[level] : null;
  const gradId = `coinGrad-${level || 'brand'}-${size}`;
  const shineId = `coinShine-${level || 'brand'}-${size}`;

  const stopStart = colors ? colors.shine : BRAND.orangeLight;
  const stopEnd = colors ? colors.base : BRAND.green;
  const ringColor = colors ? colors.ring : '#C75F00';

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" style={style}>
      <Defs>
        <LinearGradient id={gradId} x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={stopStart} />
          <Stop offset="1" stopColor={stopEnd} />
        </LinearGradient>
        <RadialGradient id={shineId} cx="0.35" cy="0.3" r="0.5">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* borda externa (profundidade) */}
      <Circle cx="24" cy="24" r="22" fill={ringColor} opacity={0.9} />
      {/* corpo da moeda */}
      <Circle cx="24" cy="23" r="19.5" fill={`url(#${gradId})`} stroke={ringColor} strokeWidth="1.5" />
      {/* brilho */}
      <Circle cx="24" cy="23" r="19.5" fill={`url(#${shineId})`} />
      {/* anel interno tracejado (textura de moeda) */}
      <Circle cx="24" cy="23" r="15.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1" />

      {/* folha estilizada no centro */}
      <Path
        d="M24 12.5c6.5 1 9.5 5.8 8.3 13-6.8 1.4-12.7-1-13.6-7C18 15 20.5 12.8 24 12.5Z"
        fill="#FFF8EC"
        opacity={0.97}
      />
      <Path d="M32 13.5c-4.5 4-7 9.5-9.3 15.5" stroke={ringColor} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity={0.55} />

      {/* brilho pontual (estilo moeda de jogo) */}
      <Ellipse cx="17" cy="14" rx="4.5" ry="2.4" fill="#FFFFFF" opacity={0.4} rotation={-28} origin="17,14" />
    </Svg>
  );
}
