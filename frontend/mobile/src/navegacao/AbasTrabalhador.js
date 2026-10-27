import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { usarTema } from '../tema/ContextoTema';
import { FONTES } from '../tema/tipografia';
import Icon from '../componentes/Gravacao';

import TelaInicioTrabalhador from '../telas/trabalhador/TelaInicioTrabalhador';
import TelaPedidos from '../telas/compartilhadas/TelaPedidos';
import TelaOrcamentos from '../telas/compartilhadas/TelaOrcamentos';
import TelaAgenda from '../telas/trabalhador/TelaAgenda';
import TelaPerfil from '../telas/compartilhadas/TelaPerfil';

const Tab = createBottomTabNavigator();

const TAB_ICON = {
  Inicio: 'home',
  Pedidos: 'clipboard',
  Oportunidades: 'briefcase',
  Agenda: 'calendar',
  Perfil: 'user',
};

export default function AbasTrabalhador() {
  const { theme } = usarTema();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.brand.green,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.cardBg, borderTopColor: theme.cardBorder, height: 60, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: FONTES.bodyMedium, fontSize: 11 },
        tabBarIcon: ({ color, size }) => <Icon nome={TAB_ICON[route.name]} color={color} size={20} />,
      })}
    >
      <Tab.Screen name="Inicio" component={TelaInicioTrabalhador} options={{ title: 'Início' }} />
      <Tab.Screen name="Pedidos" component={TelaPedidos} initialParams={{ role: 'worker' }} options={{ title: 'Pedidos' }} />
      <Tab.Screen name="Oportunidades" component={TelaOrcamentos} initialParams={{ role: 'worker' }} options={{ title: 'Oportunidades' }} />
      <Tab.Screen name="Agenda" component={TelaAgenda} options={{ title: 'Agenda' }} />
      <Tab.Screen name="Perfil" component={TelaPerfil} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
