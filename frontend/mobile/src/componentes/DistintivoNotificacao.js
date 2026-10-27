import React from 'react';
import { View, Text } from 'react-native';
import { FONTES } from '../tema/tipografia';

/** * Bolinha vermelha com número, para "chamar atenção" em cima de um ícone (o pedido foi literalmente esse: "como um sininho mostrando o número de mensagens"). Não aparece quando... */
export default function DistintivoNotificacao({ count, style }) {
  if (!count || count <= 0) return null;
  const label = count > 99 ? '99+' : String(count);

  return (
    <View
      style={[
        {
          position: 'absolute',
          top: -4,
          right: -4,
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          paddingHorizontal: 4,
          backgroundColor: '#FF3B30',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1.5,
          borderColor: '#fff',
        },
        style,
      ]}
    >
      <Text style={{ color: '#fff', fontSize: 10, fontFamily: FONTES.bodyBold, lineHeight: 13 }}>{label}</Text>
    </View>
  );
}
