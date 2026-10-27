import React from 'react';
import { View, Text, ScrollView, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usarTema } from '../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../tema/tipografia';
import Icon from './Gravacao';

export default function ContenedorTela({
  children,
  titulo,
  onBack,
  rightAction,
  scroll = true,
  padded = true,
  refreshControl,
}) {
  const { theme, rs } = usarTema();
  const Wrapper = scroll ? ScrollView : View;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.isDark ? 'light-conteudo' : 'dark-conteudo'} />
      {(titulo || onBack) && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {onBack && (
              <Pressable onPress={onBack} hitSlop={10} style={{ marginRight: 10 }}>
                <Icon nome="arrowLeft" size={22} color={theme.text} />
              </Pressable>
            )}
            {!!titulo && (
              <Text
                style={{ fontFamily: FONTES.display, fontSize: rs(TAMANHOS.lg), color: theme.text, flexShrink: 1 }}
                numberOfLines={1}
              >
                {titulo}
              </Text>
            )}
          </View>
          {rightAction}
        </View>
      )}
      <Wrapper
        style={{ flex: 1 }}
        contentContainerStyle={
          scroll ? { padding: padded ? 16 : 0, paddingBottom: 40, flexGrow: 1 } : padded ? { padding: 16, flex: 1 } : { flex: 1 }
        }
        refreshControl={refreshControl}
      >
        {children}
      </Wrapper>
    </SafeAreaView>
  );
}
