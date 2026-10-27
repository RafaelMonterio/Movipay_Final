import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { usarTema } from '../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../tema/tipografia';
import { formatCurrency } from '../utilitarios/formatadores';

const HEIGHT = 140;
const BAR_GAP = 10;

/** * Gráfico de barras do rendimento — feito com `react-native-svg` puro, de propósito: o projeto já usa essa lib (é o que desenha os ícones), então isto não adiciona NENHUMA depen... */
export default function GraficoGanhos({ data, titulo = 'Rendimento recente' }) {
  const { theme, rs } = usarTema();

  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = data.length > 0 ? `${100 / data.length}%` : '100%';

  return (
    <View>
      {!!titulo && (
        <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text, marginBottom: 12 }}>
          {titulo}
        </Text>
      )}
      {data.every((d) => d.value === 0) ? (
        <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted }}>
          Assim que você concluir serviços pagos, o gráfico aparece aqui.
        </Text>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: HEIGHT, gap: BAR_GAP }}>
            {data.map((d, i) => {
              const barHeight = Math.max(3, (d.value / max) * (HEIGHT - 20));
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  <Svg width="100%" height={HEIGHT - 18} viewBox={`0 0 40 ${HEIGHT - 18}`} preserveAspectRatio="none">
                    <Rect
                      x={4}
                      y={HEIGHT - 18 - barHeight}
                      width={32}
                      height={barHeight}
                      rx={6}
                      fill={i === data.length - 1 ? theme.brand.orange : theme.brand.orange + '88'}
                    />
                  </Svg>
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: BAR_GAP, marginTop: 6 }}>
            {data.map((d, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs) - 2, color: theme.textMuted }} numberOfLines={1}>
                  {d.label}
                </Text>
              </View>
            ))}
          </View>
          <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text, marginTop: 10 }}>
            Total no período: {formatCurrency(data.reduce((sum, d) => sum + d.value, 0))}
          </Text>
        </>
      )}
    </View>
  );
}
