import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiCategorias } from '../../apis/mercado';
import { apiAutenticacao } from '../../apis/autenticacao';
import CampoEntrada from '../../componentes/CampoEntrada';
import Botao from '../../componentes/Botao';
import Icon from '../../componentes/Gravacao';
import SeletorEndereco from '../../componentes/SeletorEndereco';
import { CategoryChip } from '../../componentes/CartaoTrabalhador';
import { Notice } from '../../componentes/interface';
import SeletorFotoPerfil from '../../componentes/SeletorFotoPerfil';
import {
  cpfIsValid,
  formatCpfCampoEntrada,
  formatDateCampoEntrada,
  formatPhoneCampoEntrada,
  brDateToIso,
  calcularIdade,
  MIN_WORKER_AGE,
  MIN_AGE_MESSAGE,
} from '../../utilitarios/validacao';

const ACCOUNT_TYPES = [
  {
    value: 'client',
    icone: 'user',
    titulo: 'Quero contratar',
    subtitle: 'Encontro profissionais e peço orçamentos.',
  },
  {
    value: 'worker',
    icone: 'briefcase',
    titulo: 'Quero trabalhar',
    subtitle: 'Ofereço meus serviços e recebo pedidos.',
  },
  {
    value: 'hybrid',
    icone: 'usuarios',
    titulo: 'Os dois',
    subtitle: 'Contrato e sou contratado, alternando quando quiser.',
  },
];

const WEEKDAYS = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

const PRICE_TYPES = [
  { value: 'hourly', label: 'Por hora' },
  { value: 'daily', label: 'Diária' },
  { value: 'service', label: 'Por serviço' },
];

const MODALITIES = [
  { value: 'presential', label: 'Presencial' },
  { value: 'online', label: 'Online' },
  { value: 'both', label: 'Ambos' },
];

/** * Cadastro em etapas. As etapas mudam conforme o tipo de conta escolhido: cliente tem duas, trabalhador tem três (ou quatro, se for menor de idade e precisar do responsável lega... */
export default function TelaCadastro({ navigation }) {
  const { theme, rs } = usarTema();
  const { register } = usarAutenticacao();

  const [step, setStep] = useState(0);
  const [tipoConta, setTipoConta] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [categorias, setCategories] = useState([]);

  // Conta
  const [nome, setName] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [telefone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [address, setAddress] = useState(null);

  // Responsável legal
  const [guardian, setGuardian] = useState({
    nome: '',
    cpf: '',
    data_nascimento: '',
    relationship: '',
    telefone: '',
    email: '',
    consent_accepted: false,
  });

  // Profissional
  const [categorySlug, setCategorySlug] = useState(null);
  const [specialty, setSpecialty] = useState('');
  const [descricao, setDescription] = useState('');
  const [experience, setExperience] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [priceType, setPriceType] = useState('service');
  const [modality, setModality] = useState('presential');
  const [serviceArea, setServiceArea] = useState('');
  const [days, setDays] = useState([1, 2, 3, 4, 5]);
  const [hourStart, setHourStart] = useState('8');
  const [hourEnd, setHourEnd] = useState('18');

  useEffect(() => {
    apiCategorias.list().then(setCategories).catch(() => {});
  }, []);

  const wantsWorker = tipoConta === 'worker' || tipoConta === 'hybrid';
  const isoBirth = useMemo(() => brDateToIso(birthDate), [birthDate]);
  const age = useMemo(() => (isoBirth ? calcularIdade(isoBirth) : null), [isoBirth]);

  const tooYoungForWork = wantsWorker && age !== null && age < MIN_WORKER_AGE;
  const needsGuardian = wantsWorker && age !== null && age >= MIN_WORKER_AGE && age < 18;

  const steps = useMemo(() => {
    const list = ['Tipo de conta', 'Seus dados'];
    if (needsGuardian) list.push('Responsável');
    if (wantsWorker) list.push('Seu serviço');
    return list;
  }, [wantsWorker, needsGuardian]);

  const currentLabel = steps[step];
  const isGuardianStep = currentLabel === 'Responsável';
  const isProfessionalStep = currentLabel === 'Seu serviço';
  const isLastStep = step === steps.length - 1;

  const validateAccount = async () => {
    if (nome.trim().split(/\s+/).length < 2) return 'Informe seu nome completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Informe um e-mail válido.';
    if (senha.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (senha !== confirmPassword) return 'As senhas não conferem.';
    if (!cpfIsValid(cpf)) return 'Informe um CPF válido.';
    if (!isoBirth) return 'Informe sua data de nascimento no formato DD/MM/AAAA.';
    if (age === null || age > 120) return 'Data de nascimento inválida.';
    if (telefone.replace(/\D/g, '').length < 10) return 'Informe um celular válido com DDD.';

    if (wantsWorker) {
      if (age < MIN_WORKER_AGE) return MIN_AGE_MESSAGE;
      if (!avatarUrl) return 'Contas de trabalhador precisam de uma foto de perfil.';
      if (!address?.endereco_id) return 'Informe onde você atende.';
    }

    // Pergunta ao backend antes de avançar: assim e-mail/CPF já usados aparecem agora, não depois de preencher tudo.
    try {
      const res = await apiAutenticacao.checkEligibility({
        cpf: cpf.replace(/\D/g, ''),
        data_nascimento: isoBirth,
        email: email.trim().toLowerCase(),
      });
      if (res.cpf && res.cpf.available === false) return 'Este CPF já está cadastrado no MoviPay.';
      if (res.email && res.email.available === false) return 'Este e-mail já está cadastrado. Faça login.';
      if (wantsWorker && res.worker?.allowed === false) return res.worker.mensagem || MIN_AGE_MESSAGE;
    } catch {
      /* sem rede: o cadastro final ainda valida */
    }
    return null;
  };

  const validateGuardian = () => {
    if (guardian.nome.trim().split(/\s+/).length < 2) return 'Informe o nome completo do responsável.';
    if (!cpfIsValid(guardian.cpf)) return 'CPF do responsável inválido.';
    const iso = brDateToIso(guardian.data_nascimento);
    if (!iso) return 'Data de nascimento do responsável inválida.';
    if ((calcularIdade(iso) ?? 0) < 18) return 'O responsável legal precisa ser maior de 18 anos.';
    if (!guardian.relationship.trim()) return 'Informe o grau de parentesco/responsabilidade.';
    if (guardian.telefone.replace(/\D/g, '').length < 10) return 'Telefone do responsável inválido.';
    if (!guardian.consent_accepted) return 'O responsável precisa aceitar a declaração.';
    return null;
  };

  const validateProfessional = () => {
    if (!categorySlug) return 'Escolha a categoria do seu serviço.';
    if (!specialty.trim()) return 'Informe sua especialidade.';
    if (descricao.trim().length < 20) return 'Escreva uma descrição com pelo menos 20 caracteres.';
    if (!experience.trim()) return 'Descreva sua experiência.';
    if (!serviceArea.trim()) return 'Informe sua área de atendimento.';
    if (!priceMin && !priceMax) return 'Informe seu preço ou faixa de preço.';
    if (priceMin && priceMax && Number(priceMax) < Number(priceMin)) {
      return 'O preço máximo não pode ser menor que o mínimo.';
    }
    if (days.length === 0) return 'Selecione ao menos um dia de disponibilidade.';
    if (Number(hourEnd) <= Number(hourStart)) return 'O horário final precisa ser depois do inicial.';
    return null;
  };

  const handleNext = async () => {
    setError('');
    if (step === 0) {
      if (!tipoConta) {
        setError('Escolha como você quer usar o MoviPay.');
        return;
      }
      setStep(1);
      return;
    }

    let problem = null;
    if (currentLabel === 'Seus dados') problem = await validateAccount();
    else if (isGuardianStep) problem = validateGuardian();

    if (problem) {
      setError(problem);
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handleSubmit = async () => {
    const problem = isProfessionalStep ? validateProfessional() : await validateAccount();
    if (problem) {
      setError(problem);
      return;
    }
    if (!termsAccepted) {
      setError('É necessário aceitar os Termos de Uso para criar sua conta.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await register({
        tipo_conta: tipoConta,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
        cpf: cpf.replace(/\D/g, ''),
        data_nascimento: isoBirth,
        telefone: telefone.replace(/\D/g, ''),
        url_avatar: avatarUrl || undefined,
        endereco_id: address?.endereco_id,
        numero_endereco: address?.numero_endereco,
        complemento_endereco: address?.complemento_endereco,
        terms_accepted: true,
        guardian: needsGuardian
          ? {
              ...guardian,
              cpf: guardian.cpf.replace(/\D/g, ''),
              data_nascimento: brDateToIso(guardian.data_nascimento),
              telefone: guardian.telefone.replace(/\D/g, ''),
              email: guardian.email || undefined,
            }
          : undefined,
        worker_profile: wantsWorker
          ? {
              categoria_slug: categorySlug,
              specialty: specialty.trim(),
              descricao: descricao.trim(),
              experience: experience.trim(),
              preco_minimo: priceMin ? Number(priceMin) : null,
              preco_max: priceMax ? Number(priceMax) : null,
              tipo_preco: priceType,
              modality,
              area_servico: serviceArea.trim(),
              dias_disponibilidade: days,
              hora_inicio: Number(hourStart),
              hora_fim: Number(hourEnd),
            }
          : undefined,
      });
      // O ProvedorAutenticacao troca a navegação sozinho ao gravar a sessão.
    } catch (err) {
      setError(err.friendlyMessage || 'Não foi possível criar sua conta.');
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <Pressable onPress={() => (step === 0 ? navigation.goBack() : setStep((s) => s - 1))} hitSlop={10}>
          <Icon nome="arrowLeft" size={22} color={theme.text} />
        </Pressable>
        <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.md), color: theme.text }}>Criar conta</Text>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 6, marginBottom: 6 }}>
        {steps.map((label, index) => (
          <View key={label} style={{ flex: 1 }}>
            <View
              style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: index <= step ? theme.brand.orange : theme.line,
              }}
            />
            <Text
              style={{
                fontFamily: index === step ? FONTES.bodySemiBold : FONTES.body,
                fontSize: rs(TAMANHOS.xs) - 2,
                color: index === step ? theme.text : theme.textMuted,
                marginTop: 5,
              }}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          <Notice kind="error" mensagem={error} />

          {/* ---------- Etapa 1: tipo de conta ---------- */}
          {step === 0 && (
            <>
              <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginBottom: 18 }}>
                Como você quer usar o MoviPay? Dá para mudar depois — quem começa como cliente pode ativar o perfil
                profissional a qualquer momento.
              </Text>

              {ACCOUNT_TYPES.map((opt) => {
                const on = tipoConta === opt.value;
                return (
                  <Pressable key={opt.value} onPress={() => setTipoConta(opt.value)} style={{ marginBottom: 12 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 14,
                        alignItems: 'flex-start',
                        borderWidth: 1.8,
                        borderColor: on ? theme.brand.orange : theme.cardBorder,
                        backgroundColor: on ? 'rgba(255,122,0,0.07)' : theme.bgAlt,
                        borderRadius: 16,
                        padding: 16,
                      }}
                    >
                      <Icon nome={opt.icone} size={24} color={on ? theme.brand.orange : theme.textMuted} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text }}>
                          {opt.titulo}
                        </Text>
                        <Text
                          style={{
                            fontFamily: FONTES.body,
                            fontSize: rs(TAMANHOS.sm),
                            color: theme.textMuted,
                            marginTop: 3,
                          }}
                        >
                          {opt.subtitle}
                        </Text>
                      </View>
                      {on && <Icon nome="check" size={18} color={theme.brand.orange} />}
                    </View>
                  </Pressable>
                );
              })}

              {wantsWorker && (
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 10,
                    alignItems: 'flex-start',
                    backgroundColor: theme.bgAlt,
                    borderRadius: 12,
                    padding: 13,
                    marginTop: 6,
                  }}
                >
                  <Icon nome="info" size={17} color={theme.textMuted} />
                  <Text style={{ flex: 1, fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
                    Para o perfil de trabalhador é preciso ter no mínimo {MIN_WORKER_AGE} anos. Entre {MIN_WORKER_AGE} e
                    17 anos, o cadastro exige os dados de um responsável legal.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* ---------- Etapa 2: dados pessoais ---------- */}
          {currentLabel === 'Seus dados' && (
            <>
              <CampoEntrada label="Nome completo" value={nome} onChangeText={setName} icone="user" autoCapitalize="words" />
              <CampoEntrada
                label="E-mail"
                value={email}
                onChangeText={setEmail}
                icone="mail"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <CampoEntrada
                label="CPF"
                value={cpf}
                onChangeText={(t) => setCpf(formatCpfCampoEntrada(t))}
                placeholder="000.000.000-00"
                icone="idCard"
                keyboardType="number-pad"
                maxLength={14}
              />
              <CampoEntrada
                label="Data de nascimento"
                value={birthDate}
                onChangeText={(t) => setBirthDate(formatDateCampoEntrada(t))}
                placeholder="DD/MM/AAAA"
                icone="cake"
                keyboardType="number-pad"
                maxLength={10}
              />

              {tooYoungForWork && <Notice kind="error" mensagem={MIN_AGE_MESSAGE} />}
              {needsGuardian && (
                <Notice
                  kind="warning"
                  mensagem={`Você tem ${age} anos. Na próxima etapa vamos pedir os dados do seu responsável legal, como exige a lei.`}
                />
              )}

              <CampoEntrada
                label="Celular"
                value={telefone}
                onChangeText={(t) => setPhone(formatPhoneCampoEntrada(t))}
                placeholder="(11) 90000-0000"
                icone="telefone"
                keyboardType="telefone-pad"
                maxLength={16}
              />
              <CampoEntrada label="Senha" value={senha} onChangeText={setPassword} icone="lock" secureTextEntry />
              <CampoEntrada
                label="Confirmar senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                icone="lock"
                secureTextEntry
              />

              <SeletorFotoPerfil
                value={avatarUrl}
                onChange={setAvatarUrl}
                required={wantsWorker}
                label="Foto de perfil"
                localOnly
                helperText={
                  wantsWorker
                    ? 'Obrigatória para trabalhadores: é a foto que os clientes veem na busca e nos Shorts.'
                    : 'Opcional. Se preferir, o MoviPay mostra as iniciais do seu nome.'
                }
              />

              <SeletorEndereco
                label={wantsWorker ? 'Onde você atende' : 'Seu endereço (opcional)'}
                value={address}
                onChange={setAddress}
              />

              {tooYoungForWork && (
                <View style={{ marginBottom: 16 }}>
                  <Botao
                    label="Criar conta de cliente"
                    variant="ghost"
                    onPress={() => {
                      setTipoConta('client');
                      setError('');
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: FONTES.body,
                      fontSize: rs(TAMANHOS.xs),
                      color: theme.textMuted,
                      textAlign: 'center',
                      marginTop: 8,
                    }}
                  >
                    Você pode usar o MoviPay como cliente agora e ativar o perfil profissional quando completar{' '}
                    {MIN_WORKER_AGE} anos.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* ---------- Etapa: responsável legal ---------- */}
          {isGuardianStep && (
            <>
              <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginBottom: 18 }}>
                Como você tem menos de 18 anos, precisamos dos dados do seu responsável legal. Essas informações ficam
                protegidas e não aparecem no seu perfil público.
              </Text>

              <CampoEntrada
                label="Nome completo do responsável"
                value={guardian.nome}
                onChangeText={(t) => setGuardian((g) => ({ ...g, nome: t }))}
                icone="user"
                autoCapitalize="words"
              />
              <CampoEntrada
                label="CPF do responsável"
                value={guardian.cpf}
                onChangeText={(t) => setGuardian((g) => ({ ...g, cpf: formatCpfCampoEntrada(t) }))}
                placeholder="000.000.000-00"
                icone="idCard"
                keyboardType="number-pad"
                maxLength={14}
              />
              <CampoEntrada
                label="Data de nascimento do responsável"
                value={guardian.data_nascimento}
                onChangeText={(t) => setGuardian((g) => ({ ...g, data_nascimento: formatDateCampoEntrada(t) }))}
                placeholder="DD/MM/AAAA"
                icone="cake"
                keyboardType="number-pad"
                maxLength={10}
              />
              <CampoEntrada
                label="Grau de parentesco / responsabilidade"
                value={guardian.relationship}
                onChangeText={(t) => setGuardian((g) => ({ ...g, relationship: t }))}
                placeholder="Mãe, pai, tutor legal…"
                icone="usuarios"
              />
              <CampoEntrada
                label="Telefone do responsável"
                value={guardian.telefone}
                onChangeText={(t) => setGuardian((g) => ({ ...g, telefone: formatPhoneCampoEntrada(t) }))}
                placeholder="(11) 90000-0000"
                icone="telefone"
                keyboardType="telefone-pad"
                maxLength={16}
              />
              <CampoEntrada
                label="E-mail do responsável (opcional)"
                value={guardian.email}
                onChangeText={(t) => setGuardian((g) => ({ ...g, email: t }))}
                icone="mail"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Pressable
                onPress={() => setGuardian((g) => ({ ...g, consent_accepted: !g.consent_accepted }))}
                style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 8, marginBottom: 14 }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: guardian.consent_accepted ? theme.brand.green : theme.cardBorder,
                    backgroundColor: guardian.consent_accepted ? theme.brand.green : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                  }}
                >
                  {guardian.consent_accepted && <Icon nome="check" size={13} color="#fff" />}
                </View>
                <Text style={{ flex: 1, fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.text }}>
                  Declaro ser o responsável legal e autorizo o cadastro e a atuação profissional do menor no MoviPay.
                </Text>
              </Pressable>
            </>
          )}

          {/* ---------- Etapa: dados profissionais ---------- */}
          {isProfessionalStep && (
            <>
              <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginBottom: 18 }}>
                É o que os clientes veem quando encontram você na busca.
              </Text>

              <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text, marginBottom: 8 }}>
                Categoria do serviço
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {categorias.map((c) => (
                  <CategoryChip
                    key={c.id}
                    category={c}
                    selected={categorySlug === c.slug}
                    onPress={() => setCategorySlug(c.slug)}
                  />
                ))}
              </ScrollView>

              <CampoEntrada
                label="Especialidade"
                value={specialty}
                onChangeText={setSpecialty}
                placeholder="Ex.: instalação de chuveiros e tomadas"
                icone="sparkle"
              />
              <CampoEntrada
                label="Descrição profissional"
                value={descricao}
                onChangeText={setDescription}
                placeholder="Conte o que você faz e como atende"
                icone="edit"
                multiline
              />
              <CampoEntrada
                label="Experiência"
                value={experience}
                onChangeText={setExperience}
                placeholder="Ex.: 5 anos atuando na região"
                icone="briefcase"
              />

              <ChoiceRow label="Forma de cobrança" options={PRICE_TYPES} value={priceType} onChange={setPriceType} />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <CampoEntrada
                    label="Preço mínimo (R$)"
                    value={priceMin}
                    onChangeText={setPriceMin}
                    placeholder="80"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <CampoEntrada
                    label="Preço máximo (R$)"
                    value={priceMax}
                    onChangeText={setPriceMax}
                    placeholder="250"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <ChoiceRow label="Modalidade" options={MODALITIES} value={modality} onChange={setModality} />

              <CampoEntrada
                label="Área de atendimento"
                value={serviceArea}
                onChangeText={setServiceArea}
                placeholder="Ex.: Ribeirão Pires e cidades vizinhas"
                icone="location"
              />

              <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text, marginBottom: 8 }}>
                Dias disponíveis
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {WEEKDAYS.map((d) => {
                  const on = days.includes(d.value);
                  return (
                    <Pressable
                      key={d.value}
                      onPress={() => setDays((prev) => (on ? prev.filter((x) => x !== d.value) : [...prev, d.value]))}
                    >
                      <View
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 9,
                          borderRadius: 10,
                          borderWidth: 1.5,
                          borderColor: on ? theme.brand.orange : theme.cardBorder,
                          backgroundColor: on ? 'rgba(255,122,0,0.10)' : theme.bgAlt,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: FONTES.bodySemiBold,
                            fontSize: rs(TAMANHOS.sm),
                            color: on ? theme.brand.orange : theme.textMuted,
                          }}
                        >
                          {d.label}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <CampoEntrada label="Das (h)" value={hourStart} onChangeText={setHourStart} keyboardType="number-pad" maxLength={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <CampoEntrada label="Até (h)" value={hourEnd} onChangeText={setHourEnd} keyboardType="number-pad" maxLength={2} />
                </View>
              </View>
            </>
          )}

          {isLastStep && (
            <Pressable
              onPress={() => setTermsAccepted((v) => !v)}
              style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 4, marginBottom: 18 }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: termsAccepted ? theme.brand.green : theme.cardBorder,
                  backgroundColor: termsAccepted ? theme.brand.green : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2,
                }}
              >
                {termsAccepted && <Icon nome="check" size={13} color="#fff" />}
              </View>
              <Text style={{ flex: 1, fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.text }}>
                Li e aceito os{' '}
                <Text
                  style={{ color: theme.brand.orange, fontFamily: FONTES.bodySemiBold }}
                  onPress={() => navigation.navigate('TermosDeUso')}
                >
                  Termos de Uso
                </Text>{' '}
                do MoviPay.
              </Text>
            </Pressable>
          )}

          <Botao
            label={isLastStep ? 'Criar minha conta' : 'Continuar'}
            onPress={isLastStep ? handleSubmit : handleNext}
            carregando={submitting}
            disabled={submitting || (currentLabel === 'Seus dados' && tooYoungForWork) || (isLastStep && !termsAccepted)}
          />

          {step === 0 && (
            <Pressable onPress={() => navigation.navigate('Login')} style={{ marginTop: 20, alignSelf: 'center' }}>
              <Text style={{ fontFamily: FONTES.bodyMedium, fontSize: rs(TAMANHOS.sm), color: theme.textMuted }}>
                Já tem conta? <Text style={{ color: theme.brand.orange }}>Entrar</Text>
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChoiceRow({ label, options, value, onChange }) {
  const { theme, rs } = usarTema();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text, marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {options.map((opt) => {
          const on = value === opt.value;
          return (
            <Pressable key={opt.value} onPress={() => onChange(opt.value)} style={{ flex: 1 }}>
              <View
                style={{
                  paddingVertical: 11,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: on ? theme.brand.orange : theme.cardBorder,
                  backgroundColor: on ? 'rgba(255,122,0,0.10)' : theme.bgAlt,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTES.bodySemiBold,
                    fontSize: rs(TAMANHOS.xs),
                    color: on ? theme.brand.orange : theme.textMuted,
                  }}
                >
                  {opt.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
