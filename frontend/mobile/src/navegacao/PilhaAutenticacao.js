import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TelaBoasVindas from '../telas/autenticacao/TelaBoasVindas';
import TelaEntrar from '../telas/autenticacao/TelaEntrar';
import TelaCadastro from '../telas/autenticacao/TelaCadastro';
import TelaTermosUso from '../telas/compartilhadas/TelaTermosUso';

const Stack = createNativeStackNavigator();

export default function PilhaAutenticacao() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={TelaBoasVindas} />
      <Stack.Screen name="Login" component={TelaEntrar} />
      <Stack.Screen name="Register" component={TelaCadastro} />
      {/* Precisa existir aqui TAMBÉM (não só no stack pós-login) — é
          lida durante o cadastro, antes de existir sessão. */}
      <Stack.Screen name="TermosDeUso" component={TelaTermosUso} />
    </Stack.Navigator>
  );
}
