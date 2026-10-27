import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { usarTema } from '../tema/ContextoTema';
import { FONTES } from '../tema/tipografia';
import Icon from '../componentes/Gravacao';

import TelaInicioCliente from '../telas/cliente/TelaInicioCliente';
import TelaBuscarProfissionais from '../telas/cliente/TelaBuscarProfissionais';
import TelaOrcamentos from '../telas/compartilhadas/TelaOrcamentos';
import TelaPublicacoes from '../telas/compartilhadas/TelaPublicacoes';
import TelaPerfil from '../telas/compartilhadas/TelaPerfil';

const Tab = createBottomTabNavigator();

const TAB_ICON = {
  Inicio: 'home',
  Buscar: 'search',
  Orcamentos: 'clipboard',
  Shorts: 'play',
  Perfil: 'user',
};

export default function AbasCliente() {
  const { theme } = usarTema();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.brand.orange,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.cardBg, borderTopColor: theme.cardBorder, height: 60, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: FONTES.bodyMedium, fontSize: 11 },
        tabBarIcon: ({ color }) => <Icon nome={TAB_ICON[route.name]} color={color} size={20} />,
      })}
    >
      <Tab.Screen name="Inicio" component={TelaInicioCliente} options={{ title: 'Início' }} />
      <Tab.Screen name="Buscar" component={TelaBuscarProfissionais} options={{ title: 'Buscar' }} />
      <Tab.Screen name="Orcamentos" component={TelaOrcamentos} options={{ title: 'Orçamentos' }} />
      {/* Substitui o Chat na barra de baixo, como pedido — o chat continua
          existindo (dentro de cada pedido e acessível pelo menu lateral),
          só não fica mais em destaque aqui. Escondemos a barra de abas
          nessa tela pra dar a imersão de tela cheia igual TikTok/Reels. */}
      <Tab.Screen
        nome="Shorts"
        component={TelaPublicacoes}
        options={{ title: 'Shorts', tabBarStyle: { display: 'none' } }}
      />
      <Tab.Screen name="Perfil" component={TelaPerfil} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
