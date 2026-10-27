import React from 'react';
import { View, Text } from 'react-native';
import { usarTema } from '../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../tema/tipografia';
import { formatDateTime } from '../utilitarios/formatadores';
import Icon from './Gravacao';

const ICON_BY_STATUS = {
  pending: 'clock',
  accepted: 'check',
  in_progress: 'wrench',
  completed: 'shield',
  cancelled: 'x',
};

export default function LinhaDoTempoEstado({ history = [] }) {
  const { theme, rs } = usarTema();
  const isCancelled = history.some((h) => h.estado === 'cancelled');

  return (
    <View>
      {history.map((item, idx) => {
        const isLast = idx === history.length - 1;
        const color = item.estado === 'cancelled' ? theme.brand.danger : theme.brand.green;
        return (
          <View key={idx} style={{ flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', width: 32 }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: color,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon nome={ICON_BY_STATUS[item.estado] || 'clock'} size={13} color="#fff" />
              </View>
              {!isLast && <View style={{ width: 2, flex: 1, minHeight: 24, backgroundColor: theme.line }} />}
            </View>
            <View style={{ flex: 1, paddingBottom: 18, paddingLeft: 10 }}>
              <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text }}>
                {item.note}
              </Text>
              <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 2 }}>
                {formatDateTime(item.criado_em)}
              </Text>
            </View>
          </View>
        );
      })}
      {!isCancelled && history.length > 0 && history[history.length - 1].estado !== 'completed' && (
        <View style={{ flexDirection: 'row' }}>
          <View style={{ alignItems: 'center', width: 32 }}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                borderWidth: 2,
                borderColor: theme.line,
                borderStyle: 'dashed',
              }}
            />
          </View>
          <View style={{ flex: 1, paddingLeft: 10 }}>
            <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted }}>
              Próxima etapa
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
