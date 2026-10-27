import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AbasTrabalhador from './AbasTrabalhador';
import ConteudoMenuLateral from '../componentes/ConteudoMenuLateral';
import TelaCarteira from '../telas/trabalhador/TelaCarteira';
import TelaListaConversas from '../telas/compartilhadas/TelaListaConversas';
import TelaServicos from '../telas/trabalhador/TelaServicos';
import TelaAvaliacoes from '../telas/compartilhadas/TelaAvaliacoes';

const Drawer = createDrawerNavigator();

export default function MenuTrabalhador() {
  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: false, drawerType: 'front' }}
      drawerContent={(props) => <ConteudoMenuLateral {...props} />}
    >
      <Drawer.Screen name="AbasTrabalhador" component={AbasTrabalhador} />
      <Drawer.Screen name="Carteira" component={TelaCarteira} />
      <Drawer.Screen name="ChatList" component={TelaListaConversas} />
      <Drawer.Screen name="Servicos" component={TelaServicos} />
      <Drawer.Screen name="Avaliacoes" component={TelaAvaliacoes} initialParams={{ role: 'worker' }} />
    </Drawer.Navigator>
  );
}
