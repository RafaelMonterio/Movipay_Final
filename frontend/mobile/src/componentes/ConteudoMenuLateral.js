import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { ConteudoMenuLateralScrollView } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usarTema } from '../tema/ContextoTema';
import { usarAutenticacao } from '../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../tema/tipografia';
import { Avatar, LevelBadge, DistintivoPlano } from './interface';
import Icon from './Gravacao';
import DistintivoNotificacao from './DistintivoNotificacao';

const CLIENT_ITEMS = [
  { key: 'Pedidos', label: 'Meus pedidos', icone: 'clipboard' },
  { key: 'ChatList', label: 'Conversas', icone: 'chat' },
  { key: 'Pontos', label: 'Minhas Folhas', icone: 'gift' },
  { key: 'Avaliacoes', label: 'Avaliações', icone: 'star' },
  { key: 'Favoritos', label: 'Favoritos', icone: 'heart' },
];

const WORKER_ITEMS = [
  { key: 'Shorts', label: 'Shorts', icone: 'play', root: true },
  { key: 'MeusTrabalhos', label: 'Meus trabalhos', icone: 'video', root: true },
  { key: 'Carteira', label: 'Carteira', icone: 'wallet' },
  { key: 'ChatList', label: 'Conversas', icone: 'chat' },
  { key: 'Servicos', label: 'Meus serviços', icone: 'briefcase' },
  { key: 'Planos', label: 'Planos e destaque', icone: 'crown', root: true },
  { key: 'Avaliacoes', label: 'Avaliações recebidas', icone: 'star' },
];

/** * Menu lateral. Duas mudanças importantes de comportamento: 1. "Ser Trabalhador" não troca mais uma variável — abre o cadastro profissional (BecomeWorker). Quem já tem os dois p... */
export default function ConteudoMenuLateral(props) {
  const { theme, rs } = usarTema();
  const { user, logout, alternarModo, ehTrabalhador, ehHibrida, contagemNaoLidas } = usarAutenticacao();

  const workerView = user?.modo === 'worker' && ehTrabalhador;
  const items = workerView ? WORKER_ITEMS : CLIENT_ITEMS;

  const go = (item) => {
    props.navigation.closeDrawer();
    const target = item.root ? props.navigation.getParent() || props.navigation : props.navigation;
    target.navigate(item.key);
  };

  const openBecomeWorker = () => {
    props.navigation.closeDrawer();
    (props.navigation.getParent() || props.navigation).navigate('BecomeWorker');
  };

  const handleSwitchMode = async () => {
    const target = user.modo === 'worker' ? 'client' : 'worker';
    try {
      await alternarModo(target);
      props.navigation.closeDrawer();
    } catch (err) {
      // O backend devolve 409 + WORKER_PROFILE_REQUIRED quando a conta ainda não tem perfil profissional. Em vez de mostrar um erro seco, levamos a pessoa...
      if (err.code === 'WORKER_PROFILE_REQUIRED' || err.status === 409) {
        openBecomeWorker();
        return;
      }
      Alert.alert('Não foi possível trocar de modo', err.friendlyMessage || 'Tente novamente.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ConteudoMenuLateralScrollView {...props} contentContainerStyle={{ paddingTop: 8 }}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: theme.line }}>
          <Avatar uri={user?.url_avatar} nome={user?.nome} size={56} />
          <Text style={{ fontFamily: FONTES.display, fontSize: rs(TAMANHOS.md), color: theme.text, marginTop: 10 }}>
            {user?.nome}
          </Text>
          <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginBottom: 8 }}>
            {user?.email}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {!workerView && <LevelBadge levelInfo={user?.levelInfo} size="sm" />}
            {workerView && <DistintivoPlano slug={user?.slug_plano} size="sm" />}
            {ehHibrida && (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                  borderRadius: 999,
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.xs) - 1, color: theme.textMuted }}>
                  {workerView ? 'Modo trabalhador' : 'Modo cliente'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ paddingVertical: 8 }}>
          {items.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => go(item)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingHorizontal: 20,
                paddingVertical: 13,
                backgroundColor: pressed ? theme.bgAlt : 'transparent',
              })}
            >
              <View>
                <Icon nome={item.icone} size={19} color={theme.text} />
                {item.key === 'ChatList' && <DistintivoNotificacao count={contagemNaoLidas} style={{ top: -6, right: -8 }} />}
              </View>
              <Text style={{ fontFamily: FONTES.bodyMedium, fontSize: rs(TAMANHOS.base), color: theme.text }}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Convite para quem ainda não é profissional. Fica na área
            rolável, separado das ações de conta lá embaixo. */}
        {!ehTrabalhador && (
          <View style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 20 }}>
            <Pressable
              onPress={openBecomeWorker}
              style={({ pressed }) => ({
                borderWidth: 1.5,
                borderColor: theme.brand.orange,
                backgroundColor: pressed ? 'rgba(255,122,0,0.12)' : 'rgba(255,122,0,0.06)',
                borderRadius: 16,
                padding: 16,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon nome="briefcase" size={20} color={theme.brand.orange} />
                <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.brand.orange }}>
                  Ser Trabalhador
                </Text>
              </View>
              <Text
                style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 6 }}
              >
                Ofereça seus serviços, publique seu trabalho nos Shorts e receba pedidos da sua região.
              </Text>
            </Pressable>
          </View>
        )}
      </ConteudoMenuLateralScrollView>

      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: theme.line, gap: 4 }}>
        {/* Alternar modo só faz sentido para quem tem os dois papéis. */}
        {ehHibrida && (
          <Pressable
            onPress={handleSwitchMode}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 4 }}
          >
            <Icon nome="settings" size={19} color={theme.brand.green} />
            <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.base), color: theme.brand.green }}>
              {workerView ? 'Alternar para cliente' : 'Alternar para trabalhador'}
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleLogout}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 4 }}
        >
          <Icon nome="logout" size={19} color={theme.brand.danger} />
          <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.base), color: theme.brand.danger }}>
            Sair
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
