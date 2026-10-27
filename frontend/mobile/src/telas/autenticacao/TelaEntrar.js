import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import CampoEntrada from '../../componentes/CampoEntrada';
import Botao from '../../componentes/Botao';
import Icon from '../../componentes/Gravacao';

export default function TelaEntrar({ navigation }) {
  const { theme, rs } = usarTema();
  const { login } = usarAutenticacao();
  const [email, setEmail] = useState('');
  const [senha, setPassword] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !senha) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setError('');
    setCarregando(true);
    try {
      await login(email.trim(), senha);
    } catch (err) {
      setError(err.friendlyMessage || 'Não foi possível entrar.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }}>
          <Pressable onPress={() => navigation.goBack()} style={{ marginBottom: 24 }} hitSlop={10}>
            <Icon nome="arrowLeft" size={22} color={theme.text} />
          </Pressable>

          <Text style={{ fontFamily: FONTES.display, fontSize: rs(TAMANHOS.xxl), color: theme.text }}>Bem-vindo de volta</Text>
          <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.base), color: theme.textMuted, marginTop: 6, marginBottom: 28 }}>
            Entre para continuar pedindo ou oferecendo serviços.
          </Text>

          <CampoEntrada label="E-mail" value={email} onChangeText={setEmail} placeholder="voce@email.com" icone="mail" keyboardType="email-address" autoCapitalize="none" />
          <CampoEntrada label="Senha" value={senha} onChangeText={setPassword} placeholder="••••••" icone="lock" secureTextEntry />

          {!!error && (
            <Text style={{ color: theme.brand.danger, fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), marginBottom: 12 }}>
              {error}
            </Text>
          )}

          <Botao label="Entrar" onPress={handleLogin} carregando={carregando} />

          <Pressable onPress={() => navigation.navigate('Register')} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted }}>
              Não tem conta? <Text style={{ color: theme.brand.orange, fontFamily: FONTES.bodySemiBold }}>Criar agora</Text>
            </Text>
          </Pressable>

          <View style={{ marginTop: 36, padding: 14, backgroundColor: theme.bgAlt, borderRadius: 12 }}>
            <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginBottom: 4 }}>
              Contas de teste (senha 123456)
            </Text>
            <Text style={{ fontFamily: FONTES.mono, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
              Cliente: ana@teste.com{'\n'}Trabalhador: bruno@teste.com
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
