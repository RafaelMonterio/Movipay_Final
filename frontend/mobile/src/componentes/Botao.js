import React, { useRef } from 'react';
import { Pressable, Text, ActivityIndicator, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usarTema } from '../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../tema/tipografia';
import Icon from './Gravacao';

// variant: 'primary' (gradiente laranja→verde, igual .btn-primary do site) | 'secondary' (contorno) | 'ghost' (texto) | 'danger'
export default function Botao({
  label,
  onPress,
  variant = 'primary',
  carregando = false,
  disabled = false,
  icone,
  iconPosition = 'left',
  style,
  fullWidth = true,
}) {
  const { theme, rs } = usarTema();
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || carregando;

  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  const conteudo = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {carregando ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : theme.brand.orange} />
      ) : (
        <>
          {icone && iconPosition === 'left' && (
            <Icon nome={icone} size={18} color={variant === 'primary' ? '#fff' : textColor(variant, theme)} />
          )}
          <Text
            style={{
              color: variant === 'primary' ? '#fff' : textColor(variant, theme),
              fontFamily: FONTES.bodyBold,
              fontSize: rs(TAMANHOS.base),
            }}
          >
            {label}
          </Text>
          {icone && iconPosition === 'right' && (
            <Icon nome={icone} size={18} color={variant === 'primary' ? '#fff' : textColor(variant, theme)} />
          )}
        </>
      )}
    </View>
  );

  const baseStyle = {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    opacity: isDisabled ? 0.55 : 1,
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { alignSelf: 'stretch' }]}>
      <Pressable
        onPress={isDisabled ? undefined : onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={style}
      >
        {variant === 'primary' ? (
          <LinearGradient
            colors={[theme.brand.orange, theme.brand.green]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={baseStyle}
          >
            {conteudo}
          </LinearGradient>
        ) : (
          <View
            style={[
              baseStyle,
              variant === 'secondary' && { borderWidth: 1.5, borderColor: theme.brand.orange, backgroundColor: 'transparent' },
              variant === 'danger' && { backgroundColor: theme.brand.danger },
              variant === 'ghost' && { backgroundColor: 'transparent', paddingVertical: 10 },
            ]}
          >
            {conteudo}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function textColor(variant, theme) {
  if (variant === 'secondary' || variant === 'ghost') return theme.brand.orange;
  return '#fff';
}
