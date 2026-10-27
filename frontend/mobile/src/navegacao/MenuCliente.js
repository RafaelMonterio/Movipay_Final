import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AbasCliente from './AbasCliente';
import ConteudoMenuLateral from '../componentes/ConteudoMenuLateral';
import TelaPedidos from '../telas/compartilhadas/TelaPedidos';
import TelaPontos from '../telas/cliente/TelaPontos';
import TelaAvaliacoes from '../telas/compartilhadas/TelaAvaliacoes';
import TelaFavoritos from '../telas/cliente/TelaFavoritos';
import TelaListaConversas from '../telas/compartilhadas/TelaListaConversas';

const Drawer = createDrawerNavigator();

export default function MenuCliente() {
  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: false, drawerType: 'front' }}
      drawerContent={(props) => <ConteudoMenuLateral {...props} />}
    >
      <Drawer.Screen name="AbasCliente" component={AbasCliente} />
      <Drawer.Screen name="Pedidos" component={TelaPedidos} initialParams={{ role: 'client' }} />
      <Drawer.Screen name="Pontos" component={TelaPontos} />
      <Drawer.Screen name="Avaliacoes" component={TelaAvaliacoes} initialParams={{ role: 'client' }} />
      <Drawer.Screen name="Favoritos" component={TelaFavoritos} />
      <Drawer.Screen name="ChatList" component={TelaListaConversas} />
    </Drawer.Navigator>
  );
}
