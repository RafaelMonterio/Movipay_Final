import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** * Rede de segurança contra "o app abre e fecha sozinho". Sem isto, QUALQUER erro lançado durante o render (um módulo nativo incompatível, uma versão desalinhada de alguma depend... */
export default class LimiteErros extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[MoviPay] Erro capturado pelo LimiteErros:', error, info?.componentStack);
  }

  handleReset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F7F5' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#17241A', marginBottom: 10 }}>
            Algo deu errado
          </Text>
          <Text style={{ fontSize: 14, color: '#5B6660', marginBottom: 18, lineHeight: 20 }}>
            O MoviPay encontrou um problema inesperado e não conseguiu continuar essa tela. Isso não deveria
            acontecer — toque em "Tentar novamente" ou feche e abra o aplicativo de novo.
          </Text>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E5E5E0',
              padding: 12,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontFamily: 'monospace', fontSize: 11, color: '#8A948E' }} selectable>
              {String(this.state.error?.mensagem || this.state.error)}
            </Text>
          </View>
          <Pressable
            onPress={this.handleReset}
            style={{ backgroundColor: '#FF7A00', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Tentar novamente</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }
}
