import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usarTema } from '../../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import Botao from '../../componentes/Botao';
import Icon from '../../componentes/Gravacao';

const HIGHLIGHTS = [
  { icone: 'shield', text: 'Profissionais avaliados de verdade' },
  { icone: 'chat', text: 'Chat direto com quem vai te atender' },
  { icone: 'gift', text: 'Ganhe Folhas 🍃 a cada serviço' },
];

export default function TelaBoasVindas({ navigation }) {
  const { theme, rs } = usarTema();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text
            style={{
              fontFamily: FONTES.displayBlack,
              fontSize: rs(TAMANHOS.display),
              color: theme.text,
              textAlign: 'center',
              marginTop: 12,
            }}
          >
            Movi<Text style={{ color: theme.brand.orange }}>Pay</Text>
          </Text>
          <Text
            style={{
              fontFamily: FONTES.body,
              fontSize: rs(TAMANHOS.base),
              color: theme.textMuted,
              textAlign: 'center',
              marginTop: 8,
              paddingHorizontal: 16,
            }}
          >
            Encontre profissionais de confiança perto de você — do orçamento ao pedido concluído, tudo num só lugar.
          </Text>
        </View>

        <View style={{ gap: 14 }}>
          {HIGHLIGHTS.map((h) => (
            <View key={h.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <LinearGradient
                colors={[theme.brand.orange, theme.brand.green]}
                style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon nome={h.icone} size={19} color="#fff" />
              </LinearGradient>
              <Text style={{ fontFamily: FONTES.bodyMedium, fontSize: rs(TAMANHOS.base), color: theme.text, flex: 1 }}>
                {h.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ gap: 12 }}>
          <Botao label="Entrar" onPress={() => navigation.navigate('Login')} />
          <Botao label="Criar conta" variant="secondary" onPress={() => navigation.navigate('Register')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logo: { width: 120, height: 120 },
});
