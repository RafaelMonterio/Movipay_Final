import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Share, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { Card, Avatar, LevelBadge, DistintivoPlano, Notice } from '../../componentes/interface';
import SeletorFotoPerfil from '../../componentes/SeletorFotoPerfil';
import CampoEntrada from '../../componentes/CampoEntrada';
import Botao from '../../componentes/Botao';
import { formatCurrency } from '../../utilitarios/formatadores';
import Icon from '../../componentes/Gravacao';
import SeletorEndereco from '../../componentes/SeletorEndereco';

export default function TelaPerfil({ navigation }) {
  const { theme, rs, toggleScheme, toggleHighContrast, changeFontScale } = usarTema();
  const { user, atualizarPerfil, atualizarAvatar, logout, ehTrabalhador, ehCliente, ehHibrida } = usarAutenticacao();
  const [nome, setName] = useState(user?.nome || '');
  const [telefone, setPhone] = useState(user?.telefone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [address, setAddress] = useState(
    user?.address_street
      ? {
          endereco_id: user.endereco_id,
          numero_endereco: user.numero_endereco,
          complemento_endereco: user.complemento_endereco,
          display: `${user.address_street}, ${user.numero_endereco}${user.complemento_endereco ? ` - ${user.complemento_endereco}` : ''} — ${user.bairro}`,
        }
      : null
  );
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

  // A foto vai direto para o backend assim que é confirmada — não fica esperando o botão "Salvar alterações". Assim ela persiste mesmo que a pessoa fec...
  const handleAvatarChange = async (url) => {
    setPhotoError('');
    try {
      await atualizarAvatar(url);
      setEditingPhoto(false);
    } catch (err) {
      setPhotoError(err.friendlyMessage || 'Não foi possível salvar a foto.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await atualizarPerfil({
        nome,
        telefone,
        bio,
        endereco_id: address?.endereco_id,
        numero_endereco: address?.numero_endereco,
        complemento_endereco: address?.complemento_endereco,
      });
      setEditing(false);
    } catch (err) {
      Alert.alert('Não foi possível salvar', err.friendlyMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleShareReferral = async () => {
    const code = `MOVI${user.id}${(user.nome || '').slice(0, 2).toUpperCase()}`;
    try {
      await Share.share({
        mensagem: `Baixe o MoviPay e ganhe Folhas de bônus! Use meu código ${code} 🍃`,
      });
    } catch {
      // usuário cancelou o compartilhamento — sem necessidade de tratar
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Pressable onPress={() => setEditingPhoto((v) => !v)} hitSlop={8}>
            <Avatar uri={user?.url_avatar} nome={user?.nome} size={84} />
            <View
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: theme.brand.orange,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 3,
                borderColor: theme.bg,
              }}
            >
              <Icon nome="camera" size={14} color="#fff" />
            </View>
          </Pressable>
          <Text style={{ fontFamily: FONTES.display, fontSize: rs(TAMANHOS.lg), color: theme.text, marginTop: 12 }}>
            {user?.nome}
          </Text>
          <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted }}>{user?.email}</Text>
          {ehCliente && user?.modo === 'client' && (
            <View style={{ marginTop: 10 }}>
              <LevelBadge levelInfo={user?.levelInfo} />
            </View>
          )}
          {ehTrabalhador && !!user?.category && (
            <Text style={{ fontFamily: FONTES.bodyMedium, fontSize: rs(TAMANHOS.sm), color: theme.brand.orange, marginTop: 8 }}>
              {user.category}
            </Text>
          )}
          {ehTrabalhador && (
            <View style={{ marginTop: 8 }}>
              <DistintivoPlano slug={user?.slug_plano} />
            </View>
          )}
          {ehHibrida && (
            <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 8 }}>
              Conta híbrida — você contrata e é contratado
            </Text>
          )}
        </View>

        {/* Troca de foto: vale para cliente, trabalhador e híbrido. */}
        {editingPhoto && (
          <Card style={{ marginBottom: 16 }}>
            <SeletorFotoPerfil
              value={user?.url_avatar}
              onChange={handleAvatarChange}
              label="Alterar foto de perfil"
              required={ehTrabalhador}
              helperText={
                ehTrabalhador
                  ? 'Sua foto aparece nos Shorts, na busca e no seu perfil público. Contas de trabalhador precisam ter foto.'
                  : 'Sua foto aparece nas conversas e nos pedidos que você abre.'
              }
            />
            <Notice kind="error" mensagem={photoError} style={{ marginBottom: 0 }} />
          </Card>
        )}

        {ehTrabalhador && (
          <Pressable onPress={() => navigation.navigate('MeusTrabalhos')}>
            <Card style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon nome="play" size={22} color={theme.brand.orange} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>Meus trabalhos</Text>
                <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
                  Publique fotos e vídeos dos seus serviços para clientes da região
                </Text>
              </View>
              <Icon nome="chevronRight" size={18} color={theme.textMuted} />
            </Card>
          </Pressable>
        )}

        {ehCliente && (
          <Card style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: theme.brand.green,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon nome="wallet" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>Total investido</Text>
              <Text style={{ fontFamily: FONTES.monoSemiBold, fontSize: rs(TAMANHOS.lg), color: theme.brand.green, marginTop: 3 }}>
                {formatCurrency(user?.totalInvested ?? user?.total_invested ?? 0)}
              </Text>
              <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>Em pedidos concluídos</Text>
            </View>
          </Card>
        )}

        {ehTrabalhador && (
          <Pressable onPress={() => navigation.getParent()?.navigate('Planos')}>
            <Card
              style={{
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderWidth: 1.5,
                borderColor: theme.brand.orange,
                backgroundColor: 'rgba(255,122,0,0.07)',
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: theme.brand.orange,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon nome="crown" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>
                  {user?.slug_plano && user.slug_plano !== 'formiga' ? 'Gerenciar minha assinatura' : 'Destaque seu perfil'}
                </Text>
                <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
                  {user?.slug_plano && user.slug_plano !== 'formiga'
                    ? 'Veja seus benefícios e estatísticas do plano atual'
                    : 'Assine um plano e apareça mais nas buscas da sua região'}
                </Text>
              </View>
              <Icon nome="chevronRight" size={18} color={theme.brand.orange} />
            </Card>
          </Pressable>
        )}

        <Card style={{ marginBottom: 16 }}>
          {/* Vira acordeão: fechado, mostra só o título; abre ao tocar.
              O lápis de editar continua funcionando igual — só que agora
              também garante que a seção esteja aberta ao ser tocado. */}
          <Pressable
            onPress={() => setPersonalOpen((v) => !v)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: personalOpen ? 14 : 0 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon nome="chevronRight" size={16} color={theme.textMuted} style={{ transform: [{ rotate: personalOpen ? '90deg' : '0deg' }] }} />
              <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>Dados pessoais</Text>
            </View>
            <Pressable
              onPress={() => {
                setEditing((e) => !e);
                setPersonalOpen(true);
              }}
              hitSlop={10}
            >
              <Icon nome={editing ? 'x' : 'edit'} size={19} color={theme.brand.orange} />
            </Pressable>
          </Pressable>
          {personalOpen &&
            (editing ? (
              <>
                <CampoEntrada label="Nome" value={nome} onChangeText={setName} icone="user" />
                <CampoEntrada label="Telefone" value={telefone} onChangeText={setPhone} icone="telefone" keyboardType="telefone-pad" />
                <CampoEntrada label="Bio" value={bio} onChangeText={setBio} icone="edit" multiline />
                <SeletorEndereco label="Endereço" value={address} onChange={setAddress} />
                <Botao label="Salvar alterações" onPress={handleSave} carregando={saving} />
              </>
            ) : (
              <>
                <InfoRow icone="telefone" label="Telefone" value={user?.telefone || 'não informado'} />
                <InfoRow
                  icone="location"
                  label="Endereço"
                  value={user?.address_street ? `${user.address_street}, ${user.numero_endereco} — ${user.bairro}` : 'não informado'}
                />
                {!!user?.bio && <InfoRow icone="edit" label="Bio" value={user.bio} />}
              </>
            ))}
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <Pressable
            onPress={() => setAccessibilityOpen((v) => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: accessibilityOpen ? 14 : 0 }}
          >
            <Icon nome="chevronRight" size={16} color={theme.textMuted} style={{ transform: [{ rotate: accessibilityOpen ? '90deg' : '0deg' }] }} />
            <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>Acessibilidade</Text>
          </Pressable>
          {accessibilityOpen && (
            <>
              <ToggleRow icone="moon" label="Tema escuro" value={theme.isDark} onValueChange={toggleScheme} />
              <ToggleRow icone="eye" label="Alto contraste" value={theme.highContrast} onValueChange={toggleHighContrast} />
              <Text style={{ fontFamily: FONTES.bodyMedium, fontSize: rs(TAMANHOS.sm), color: theme.text, marginTop: 10, marginBottom: 8 }}>
                Tamanho do texto
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[0.85, 1, 1.15, 1.3].map((scale) => (
                  <Pressable key={scale} onPress={() => changeFontScale(scale)}>
                    <View
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 10,
                        backgroundColor: theme.fontScale === scale ? theme.brand.orange : theme.bgAlt,
                      }}
                    >
                      <Text style={{ color: theme.fontScale === scale ? '#fff' : theme.text, fontFamily: FONTES.bodyMedium }}>
                        A{scale > 1 ? '+' : scale < 1 ? '-' : ''}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </Card>

        <Pressable onPress={handleShareReferral}>
          <Card style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon nome="share" size={20} color={theme.brand.green} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>Indique um amigo</Text>
              <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>Compartilhe seu código e ganhem Folhas juntos</Text>
            </View>
            <Icon nome="chevronRight" size={18} color={theme.textMuted} />
          </Card>
        </Pressable>

        <Botao label="Termos de Uso" variant="ghost" onPress={() => navigation.navigate('TermosDeUso')} />
        <Botao label="Sair da conta" variant="ghost" onPress={logout} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icone, label, value }) {
  const { theme, rs } = usarTema();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
      <Icon nome={icone} size={16} color={theme.textMuted} />
      <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, width: 80 }}>{label}</Text>
      <Text style={{ fontFamily: FONTES.bodyMedium, fontSize: rs(TAMANHOS.sm), color: theme.text, flex: 1 }}>{value}</Text>
    </View>
  );
}

function ToggleRow({ icone, label, value, onValueChange }) {
  const { theme, rs } = usarTema();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon nome={icone} size={17} color={theme.text} />
        <Text style={{ fontFamily: FONTES.bodyMedium, fontSize: rs(TAMANHOS.base), color: theme.text }}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: theme.brand.orange }} />
    </View>
  );
}
