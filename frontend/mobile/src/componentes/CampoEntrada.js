import React, { useState } from 'react';
import { View, Text, TextCampoEntrada, Pressable } from 'react-native';
import { usarTema } from '../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../tema/tipografia';
import Icon from './Gravacao';

export default function CampoEntrada({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  icone,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'sentences',
  multiline = false,
  style,
}) {
  const { theme, rs } = usarTema();
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {!!label && (
        <Text
          style={{
            fontFamily: FONTES.bodySemiBold,
            fontSize: rs(TAMANHOS.sm),
            color: theme.text,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: theme.bgAlt,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: error ? theme.brand.danger : focused ? theme.brand.orange : theme.cardBorder,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 10 : 2,
        }}
      >
        {!!icone && <Icon nome={icone} size={18} color={theme.textMuted} style={{ marginRight: 8, marginTop: multiline ? 4 : 0 }} />}
        <TextCampoEntrada
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            paddingVertical: 12,
            color: theme.text,
            fontFamily: FONTES.body,
            fontSize: rs(TAMANHOS.base),
            minHeight: multiline ? 90 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <Icon nome={hidden ? 'eye' : 'eyeOff'} size={18} color={theme.textMuted} />
          </Pressable>
        )}
      </View>
      {!!error && (
        <Text style={{ color: theme.brand.danger, fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
