import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { FONT_MAP } from './src/tema/tipografia';
import { ThemeProvider, usarTema } from './src/tema/ContextoTema';
import { ProvedorAutenticacao } from './src/contexto/ContextoAutenticacao';
import NavegadorRaiz from './src/navegacao/NavegadorRaiz';
import LimiteErros from './src/componentes/LimiteErros';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  const { theme } = usarTema();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <NavegadorRaiz />
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts(FONT_MAP);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) setReady(true);
  }, [fontsLoaded, fontError]);

  const onLayoutRootView = useCallback(async () => {
    if (ready) await SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    // O LimiteErros fica FORA de tudo, de propósito: se o problema
    // estiver no próprio ThemeProvider/ProvedorAutenticacao (ou em qualquer coisa
    // dentro deles), ele ainda assim é capturado e vira uma tela de erro
    // em vez de fechar o app inteiro.
    <LimiteErros>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <ThemeProvider>
          <ProvedorAutenticacao>
            <Root />
          </ProvedorAutenticacao>
        </ThemeProvider>
      </GestureHandlerRootView>
    </LimiteErros>
  );
}
