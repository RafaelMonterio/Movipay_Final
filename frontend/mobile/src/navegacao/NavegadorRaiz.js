import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { usarAutenticacao } from '../contexto/ContextoAutenticacao';
import { usarTema } from '../tema/ContextoTema';
import { TelaCarregamento } from '../componentes/interface';

import PilhaAutenticacao from './PilhaAutenticacao';
import MenuCliente from './MenuCliente';
import MenuTrabalhador from './MenuTrabalhador';

import TelaPerfilTrabalhador from '../telas/cliente/TelaPerfilTrabalhador';
import TelaDetalhePedido from '../telas/compartilhadas/TelaDetalhePedido';
import TelaDetalheOrcamento from '../telas/compartilhadas/TelaDetalheOrcamento';
import TelaNovoOrcamento from '../telas/cliente/TelaNovoOrcamento';
import TelaConversa from '../telas/compartilhadas/TelaConversa';
import TelaPublicacoes from '../telas/compartilhadas/TelaPublicacoes';
import TelaPublicarPublicacao from '../telas/trabalhador/TelaPublicarPublicacao';
import TelaMeusTrabalhos from '../telas/trabalhador/TelaMeusTrabalhos';
import TelaDetalhePublicacao from '../telas/compartilhadas/TelaDetalhePublicacao';
import TelaAtivarTrabalhador from '../telas/trabalhador/TelaAtivarTrabalhador';
import TelaPlanos from '../telas/trabalhador/TelaPlanos';
import TelaPagamentoPix from '../telas/compartilhadas/TelaPagamentoPix';
import TelaTermosUso from '../telas/compartilhadas/TelaTermosUso';

const Stack = createNativeStackNavigator();

/** * BUG REAL encontrado aqui: antes, o Drawer era escolhido assim: <Stack.Screen name="Drawer" component={ehTrabalhador ? MenuTrabalhador : MenuCliente} /> O React Navigation trata... */
function DrawerRouter() {
  const { user, ehTrabalhador } = usarAutenticacao();
  const workerModeActive = user?.modo === 'worker' && ehTrabalhador;
  return workerModeActive ? <MenuTrabalhador /> : <MenuCliente />;
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Drawer" component={DrawerRouter} />
      <Stack.Screen name="WorkerProfile" component={TelaPerfilTrabalhador} />
      <Stack.Screen name="OrderDetail" component={TelaDetalhePedido} />
      <Stack.Screen name="QuoteDetail" component={TelaDetalheOrcamento} />
      <Stack.Screen name="NovoOrcamento" component={TelaNovoOrcamento} />
      <Stack.Screen name="ChatThread" component={TelaConversa} />
      <Stack.Screen name="Shorts" component={TelaPublicacoes} />
      <Stack.Screen name="PublishShort" component={TelaPublicarPublicacao} />
      <Stack.Screen name="MeusTrabalhos" component={TelaMeusTrabalhos} />
      <Stack.Screen name="ShortDetail" component={TelaDetalhePublicacao} />
      {/* "Ser Trabalhador", planos e checkout ficam no stack raiz porque
          precisam ser alcançáveis tanto do menu de cliente quanto do de
          trabalhador — uma conta híbrida navega entre os dois. */}
      <Stack.Screen name="BecomeWorker" component={TelaAtivarTrabalhador} />
      <Stack.Screen name="Planos" component={TelaPlanos} />
      <Stack.Screen name="TermosDeUso" component={TelaTermosUso} />
      <Stack.Screen name="CheckoutPix" component={TelaPagamentoPix} />
    </Stack.Navigator>
  );
}

export default function NavegadorRaiz() {
  const { user, carregando } = usarAutenticacao();
  const { theme } = usarTema();

  if (carregando) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <TelaCarregamento label="Preparando o MoviPay…" />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: theme.isDark,
        colors: {
          primary: theme.brand.orange,
          background: theme.bg,
          card: theme.cardBg,
          text: theme.text,
          border: theme.cardBorder,
          notification: theme.brand.orange,
        },
        fonts: {
          regular: { fontFamily: 'Inter_400Regular', fontWeight: '400' },
          medium: { fontFamily: 'Inter_500Medium', fontWeight: '500' },
          bold: { fontFamily: 'Inter_700Bold', fontWeight: '700' },
          heavy: { fontFamily: 'Inter_800ExtraBold', fontWeight: '800' },
        },
      }}
    >
      {/* Qual painel abrir agora é decidido dentro do DrawerRouter (via
          usarAutenticacao), não aqui — é exatamente essa mudança que faz trocar de
          modo re-renderizar de verdade em vez de ficar preso no drawer
          antigo. Aqui só decide autenticado vs não-autenticado. */}
      {user ? <AppStack /> : <PilhaAutenticacao />}
    </NavigationContainer>
  );
}
