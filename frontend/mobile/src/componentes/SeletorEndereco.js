import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TextCampoEntrada, Pressable, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { usarTema } from '../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../tema/tipografia';
import { addressApi } from '../apis/endereco';
import Icon from './Gravacao';
import Botao from './Botao';

// Seletor de endereço "de verdade": a pessoa só consegue avançar depois de escolher uma rua que realmente existe em Ribeirão Pires (via busca ou CEP,...
export default function SeletorEndereco({ label = 'Endereço', value, onChange }) {
  const { theme, rs } = usarTema();
  const [modalVisible, setModalVisible] = useState(false);
  const [tab, setTab] = useState('search'); // 'search' | 'cep' | 'gps'
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [cep, setCep] = useState('');
  const [cepCarregando, setCepCarregando] = useState(false);
  const [pending, setPending] = useState(null); // {cep, rua, bairro} já validado, aguardando resolve
  const [resolved, setResolved] = useState(null); // endereço completo (com lat/lng) vindo de /resolver
  const [resolving, setResolving] = useState(false);
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    setSearchError('');
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await addressApi.search(query.trim());
        setResults(data);
      } catch (err) {
        setSearchError(err.friendlyMessage || 'Não foi possível buscar endereços agora.');
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelectResult = (r) => setPending(r);

  const handleLookupCep = async () => {
    setCepCarregando(true);
    try {
      const result = await addressApi.lookupCep(cep);
      setPending(result);
    } catch (err) {
      Alert.alert('CEP não encontrado', err.friendlyMessage || 'Verifique o CEP e tente de novo.');
    } finally {
      setCepCarregando(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const { estado } = await Location.requestForegroundPermissionsAsync();
      if (estado !== 'granted') {
        Alert.alert(
          'Permissão negada',
          Platform.OS === 'web'
            ? 'Permita o acesso à localização no navegador para usar esse recurso.'
            : 'Permita o acesso à localização nas configurações do celular para usar esse recurso.'
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const result = await addressApi.fromLocation(pos.coords.latitude, pos.coords.longitude);
      setPending(result);
    } catch (err) {
      Alert.alert('Não foi possível usar sua localização', err.friendlyMessage || 'Tente buscar o endereço manualmente.');
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    if (!pending) return;
    setResolving(true);
    addressApi
      .resolve(pending)
      .then(setResolved)
      .catch((err) => Alert.alert('Não foi possível confirmar o endereço', err.friendlyMessage))
      .finally(() => setResolving(false));
  }, [pending]);

  const resetModal = () => {
    setQuery('');
    setResults([]);
    setCep('');
    setPending(null);
    setResolved(null);
    setNumber('');
    setComplement('');
    setTab('search');
  };

  const handleConfirm = () => {
    onChange({
      endereco_id: resolved.id,
      numero_endereco: number,
      complemento_endereco: complement,
      display: `${resolved.rua}, ${number}${complement ? ` - ${complement}` : ''} — ${resolved.bairro}`,
    });
    setModalVisible(false);
    resetModal();
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text, marginBottom: 6 }}>
        {label}
      </Text>
      <Pressable onPress={() => setModalVisible(true)}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.bgAlt,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: theme.cardBorder,
            paddingHorizontal: 14,
            paddingVertical: 14,
          }}
        >
          <Icon nome="location" size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
          <Text
            style={{ flex: 1, fontFamily: FONTES.body, fontSize: rs(TAMANHOS.base), color: value ? theme.text : theme.textMuted }}
            numberOfLines={1}
          >
            {value?.display || 'Escolher endereço em Ribeirão Pires'}
          </Text>
          <Icon nome="chevronRight" size={18} color={theme.textMuted} />
        </View>
      </Pressable>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 }}>
              <Text style={{ fontFamily: FONTES.display, fontSize: rs(TAMANHOS.lg), color: theme.text }}>
                Endereço em Ribeirão Pires
              </Text>
              <Pressable
                onPress={() => {
                  setModalVisible(false);
                  resetModal();
                }}
                hitSlop={10}
              >
                <Icon nome="x" size={22} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
              {!pending ? (
                <>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    <TabBotao label="Buscar rua" active={tab === 'search'} onPress={() => setTab('search')} />
                    <TabBotao label="Tenho o CEP" active={tab === 'cep'} onPress={() => setTab('cep')} />
                    <TabBotao label="Minha localização" active={tab === 'gps'} onPress={() => setTab('gps')} />
                  </View>

                  {tab === 'gps' ? (
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                      <View
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                          backgroundColor: theme.bgAlt,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 14,
                        }}
                      >
                        <Icon nome="location" size={28} color={theme.brand.orange} />
                      </View>
                      <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.base), color: theme.text, textAlign: 'center' }}>
                        Usar minha localização atual
                      </Text>
                      <Text
                        style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, textAlign: 'center', marginTop: 6, marginBottom: 18 }}
                      >
                        Vamos pedir permissão de localização e preencher o endereço automaticamente, se você estiver em Ribeirão Pires.
                      </Text>
                      <Botao label="Permitir e detectar" onPress={handleUseCurrentLocation} carregando={locating} fullWidth={false} icone="location" />
                    </View>
                  ) : tab === 'search' ? (
                    <>
                      <TextCampoEntrada
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Digite o nome da rua (mín. 3 letras)"
                        placeholderTextColor={theme.textMuted}
                        style={inputStyle(theme, rs)}
                      />
                      {searching && <ActivityIndicator style={{ marginTop: 12 }} color={theme.brand.orange} />}
                      {!!searchError && (
                        <Text style={{ color: theme.brand.danger, fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), marginTop: 10 }}>
                          {searchError}
                        </Text>
                      )}
                      {!searching && query.trim().length >= 3 && results.length === 0 && !searchError && (
                        <Text style={{ color: theme.textMuted, fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), marginTop: 10 }}>
                          Nenhuma rua encontrada em Ribeirão Pires com esse nome.
                        </Text>
                      )}
                      {results.map((r) => (
                        <Pressable key={`${r.cep}-${r.rua}`} onPress={() => handleSelectResult(r)}>
                          <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.line }}>
                            <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>
                              {r.rua}
                            </Text>
                            <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
                              {r.bairro} · {r.cep}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </>
                  ) : (
                    <>
                      <TextCampoEntrada
                        value={cep}
                        onChangeText={setCep}
                        placeholder="00000-000"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="numeric"
                        maxLength={9}
                        style={inputStyle(theme, rs)}
                      />
                      <Botao label="Buscar CEP" onPress={handleLookupCep} carregando={cepCarregando} disabled={cep.replace(/\D/g, '').length !== 8} style={{ marginTop: 14 }} />
                    </>
                  )}

                  <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 18, textAlign: 'center' }}>
                    Por enquanto o MoviPay atende só Ribeirão Pires — por isso só ruas da cidade aparecem aqui.
                  </Text>
                </>
              ) : (
                <>
                  <View style={{ backgroundColor: theme.bgAlt, borderRadius: 14, padding: 16, marginBottom: 18 }}>
                    {resolving ? (
                      <ActivityIndicator color={theme.brand.orange} />
                    ) : (
                      <>
                        <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>
                          {pending.rua}
                        </Text>
                        <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginTop: 2 }}>
                          {pending.bairro} · Ribeirão Pires/SP · {pending.cep}
                        </Text>
                      </>
                    )}
                  </View>
                  <TextCampoEntrada
                    value={number}
                    onChangeText={setNumber}
                    placeholder="Número"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    style={inputStyle(theme, rs)}
                  />
                  <TextCampoEntrada
                    value={complement}
                    onChangeText={setComplement}
                    placeholder="Complemento (opcional)"
                    placeholderTextColor={theme.textMuted}
                    style={[inputStyle(theme, rs), { marginTop: 12 }]}
                  />
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                    <View style={{ flex: 1 }}>
                      <Botao label="Trocar endereço" variant="secondary" onPress={() => setPending(null)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Botao label="Confirmar" onPress={handleConfirm} carregando={resolving} disabled={!number || !resolved} />
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function inputStyle(theme, rs) {
  return {
    backgroundColor: theme.bgAlt,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.text,
    fontFamily: FONTES.body,
    fontSize: rs(TAMANHOS.base),
  };
}

function TabBotao({ label, active, onPress }) {
  const { theme, rs } = usarTema();
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <View
        style={{
          paddingVertical: 10,
          borderRadius: 10,
          alignItems: 'center',
          backgroundColor: active ? theme.brand.orange : theme.bgAlt,
        }}
      >
        <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: active ? '#fff' : theme.text }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
