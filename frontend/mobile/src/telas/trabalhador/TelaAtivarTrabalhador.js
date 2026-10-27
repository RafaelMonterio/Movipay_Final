import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usarTema } from '../../tema/ContextoTema';
import { usarAutenticacao } from '../../contexto/ContextoAutenticacao';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import { apiCategorias } from '../../apis/mercado';
import { apiPerfilTrabalhador } from '../../apis/perfilTrabalhador';
import { apiAutenticacao } from '../../apis/autenticacao';
import CampoEntrada from '../../componentes/CampoEntrada';
import Botao from '../../componentes/Botao';
import Icon from '../../componentes/Gravacao';
import SeletorEndereco from '../../componentes/SeletorEndereco';
import { CategoryChip } from '../../componentes/CartaoTrabalhador';
import { Notice, TelaCarregamento } from '../../componentes/interface';
import SeletorFotoPerfil from '../../componentes/SeletorFotoPerfil';
import {
  cpfIsValid,
  formatCpfCampoEntrada,
  formatDateCampoEntrada,
  brDateToIso,
  calcularIdade,
  MIN_WORKER_AGE,
  MIN_AGE_MESSAGE,
} from '../../utilitarios/validacao';

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

/** * "Ser Trabalhador" — o processo real de ativação do perfil profissional. Antes, a opção do menu lateral só trocava uma variável. Agora ela abre este fluxo em etapas, que termin... */
export default function TelaAtivarTrabalhador({ navigation }) {
  const { theme, rs } = usarTema();
  const { user, atualizarUsuario } = usarAutenticacao();

  const [step, setStep] = useState(0);
  const [requirements, setRequirements] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [categorias, setCategories] = useState([]);

  // Etapa 1 — dados pessoais
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [telefone, setPhone] = useState(user?.telefone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.url_avatar || null);
  const [address, setAddress] = useState(
    user?.address_street
      ? {
          endereco_id: user.endereco_id,
          numero_endereco: user.numero_endereco,
          complemento_endereco: user.complemento_endereco,
          display: `${user.address_street}, ${user.numero_endereco} — ${user.bairro}`,
        }
      : null
  );

  // Etapa 2 — responsável legal
  const [guardian, setGuardian] = useState({
    nome: '',
    cpf: '',
    data_nascimento: '',
    relationship: '',
    telefone: '',
    email: '',
    consent_accepted: false,
  });

  // Etapa 3 — dados profissionais
  const [categorySlug, setCategorySlug] = useState(user?.category || null);
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
  const [keepClient, setKeepClient] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [req, cats] = await Promise.all([
          apiPerfilTrabalhador.requirements(),
          apiCategorias.list().catch(() => []),
        ]);
        setRequirements(req);
        setCategories(cats);
        if (req.alreadyWorker) {
          Alert.alert('Você já é trabalhador', 'Sua conta já tem perfil profissional ativo.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        }
      } catch (err) {
        setError(err.friendlyMessage || 'Não foi possível carregar os requisitos.');
      } finally {
        setCarregando(false);
      }
    })();
  }, [navigation]);

  // A idade vem do que já está no cadastro ou do que a pessoa digita agora.
  const effectiveBirth = useMemo(() => {
    if (requirements && !requirements.missing?.data_nascimento) return null; // já está no backend
    return brDateToIso(birthDate);
  }, [birthDate, requirements]);

  const age = useMemo(() => {
    if (requirements?.age != null && !requirements.missing?.data_nascimento) return requirements.age;
    return effectiveBirth ? calcularIdade(effectiveBirth) : null;
  }, [effectiveBirth, requirements]);

  const tooYoung = age !== null && age < MIN_WORKER_AGE;
  const needsGuardian = age !== null && age >= MIN_WORKER_AGE && age < 18 && !requirements?.hasGuardian;

  const steps = useMemo(() => {
    const list = ['Dados pessoais'];
    if (needsGuardian) list.push('Responsável legal');
    list.push('Dados profissionais');
    return list;
  }, [needsGuardian]);

  const isGuardianStep = needsGuardian && step === 1;
  const isProfessionalStep = step === steps.length - 1;

  const validatePersonal = async () => {
    if (requirements?.missing?.cpf) {
      if (!cpfIsValid(cpf)) return 'Informe um CPF válido.';
    }
    if (requirements?.missing?.data_nascimento) {
      if (!effectiveBirth) return 'Informe sua data de nascimento no formato DD/MM/AAAA.';
    }
    if (age === null) return 'Informe uma data de nascimento válida.';
    if (age < MIN_WORKER_AGE) return MIN_AGE_MESSAGE;
    if (!avatarUrl) return 'Envie uma foto de perfil.';
    if (!address?.endereco_id) return 'Informe a cidade/endereço onde você atende.';
    if (!telefone || telefone.replace(/\D/g, '').length < 10) return 'Informe um celular válido com DDD.';

    // Confirma com o backend antes de avançar, para o CPF duplicado aparecer aqui e não só no envio final.
    if (requirements?.missing?.cpf || requirements?.missing?.data_nascimento) {
      try {
        const res = await apiAutenticacao.checkEligibility({
          cpf: requirements?.missing?.cpf ? cpf.replace(/\D/g, '') : undefined,
          data_nascimento: effectiveBirth || undefined,
        });
        if (res.cpf && !res.cpf.valid) return res.cpf.mensagem || 'CPF inválido.';
        if (res.worker && res.worker.allowed === false) return res.worker.mensagem || MIN_AGE_MESSAGE;
      } catch {
        /* sem rede: a validação final do backend ainda pega */
      }
    }
    return null;
  };

  const validateGuardian = () => {
    if (!guardian.nome.trim() || guardian.nome.trim().split(/\s+/).length < 2) {
      return 'Informe o nome completo do responsável.';
    }
    if (!cpfIsValid(guardian.cpf)) return 'CPF do responsável inválido.';
    const iso = brDateToIso(guardian.data_nascimento);
    if (!iso) return 'Data de nascimento do responsável inválida.';
    if ((calcularIdade(iso) ?? 0) < 18) return 'O responsável legal precisa ser maior de 18 anos.';
    if (!guardian.relationship.trim()) return 'Informe o grau de parentesco/responsabilidade.';
    if (guardian.telefone.replace(/\D/g, '').length < 10) return 'Telefone do responsável inválido.';
    if (!guardian.consent_accepted) return 'O responsável precisa aceitar a declaração de responsabilidade.';
    return null;
  };

  const validateProfessional = () => {
    if (!categorySlug) return 'Escolha a categoria do seu serviço.';
    if (!specialty.trim()) return 'Informe sua especialidade.';
    if (descricao.trim().length < 20) return 'Escreva uma descrição profissional com pelo menos 20 caracteres.';
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
    let problem = null;
    if (step === 0) problem = await validatePersonal();
    else if (isGuardianStep) problem = validateGuardian();

    if (problem) {
      setError(problem);
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handleSubmit = async () => {
    const problem = validateProfessional();
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await apiPerfilTrabalhador.activate({
        cpf: requirements?.missing?.cpf ? cpf.replace(/\D/g, '') : undefined,
        data_nascimento: requirements?.missing?.data_nascimento ? effectiveBirth : undefined,
        telefone,
        url_avatar: avatarUrl,
        endereco_id: address?.endereco_id,
        numero_endereco: address?.numero_endereco,
        complemento_endereco: address?.complemento_endereco,
        keep_client: keepClient,
        guardian: needsGuardian
          ? {
              ...guardian,
              cpf: guardian.cpf.replace(/\D/g, ''),
              data_nascimento: brDateToIso(guardian.data_nascimento),
              telefone: guardian.telefone.replace(/\D/g, ''),
              email: guardian.email || undefined,
            }
          : undefined,
        worker_profile: {
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
          areas_servico: [{ cidade: address?.cidade || 'Ribeirão Pires' }],
        },
      });

      await atualizarUsuario();
      Alert.alert(
        'Perfil profissional criado!',
        keepClient
          ? 'Sua conta agora é híbrida: você pode contratar e ser contratado. Alterne pelo menu lateral.'
          : 'Seu perfil de trabalhador está ativo. Você já aparece nas buscas.',
        [{ text: 'Começar', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      setError(err.friendlyMessage || 'Não foi possível criar seu perfil profissional.');
    } finally {
      setSubmitting(false);
    }
  };

  if (carregando) return <TelaCarregamento label="Preparando seu cadastro…" />;

  // Bloqueio duro de idade: nem mostra o formulário.
  if (tooYoung && !requirements?.missing?.data_nascimento) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <Header titulo="Ser Trabalhador" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Icon nome="shield2" size={54} color={theme.brand.danger} />
          <Text
            style={{
              fontFamily: FONTES.display,
              fontSize: rs(TAMANHOS.lg),
              color: theme.text,
              textAlign: 'center',
              marginTop: 18,
            }}
          >
            Ainda não é possível
          </Text>
          <Text
            style={{
              fontFamily: FONTES.body,
              fontSize: rs(TAMANHOS.base),
              color: theme.textMuted,
              textAlign: 'center',
              marginTop: 10,
            }}
          >
            {MIN_AGE_MESSAGE}
          </Text>
          <Text
            style={{
              fontFamily: FONTES.body,
              fontSize: rs(TAMANHOS.sm),
              color: theme.textMuted,
              textAlign: 'center',
              marginTop: 14,
            }}
          >
            Você pode continuar usando o MoviPay normalmente como cliente.
          </Text>
          <View style={{ alignSelf: 'stretch', marginTop: 28 }}>
            <Botao label="Voltar" onPress={() => navigation.goBack()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header
        titulo="Ser Trabalhador"
        onBack={() => (step === 0 ? navigation.goBack() : setStep((s) => s - 1))}
      />

      <Stepper steps={steps} current={step} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          <Notice kind="error" mensagem={error} />

          {step === 0 && (
            <>
              <SectionHint text="Confirme seus dados. Eles são usados para identificar você como profissional." />

              <SeletorFotoPerfil value={avatarUrl} onChange={setAvatarUrl} required label="Foto de perfil" />

              {requirements?.missing?.cpf ? (
                <CampoEntrada
                  label="CPF"
                  value={cpf}
                  onChangeText={(t) => setCpf(formatCpfCampoEntrada(t))}
                  placeholder="000.000.000-00"
                  icone="idCard"
                  keyboardType="number-pad"
                  maxLength={14}
                />
              ) : (
                <ReadOnlyRow icone="idCard" label="CPF" value={requirements?.cpf_masked || 'já cadastrado'} />
              )}

              {requirements?.missing?.data_nascimento ? (
                <CampoEntrada
                  label="Data de nascimento"
                  value={birthDate}
                  onChangeText={(t) => setBirthDate(formatDateCampoEntrada(t))}
                  placeholder="DD/MM/AAAA"
                  icone="cake"
                  keyboardType="number-pad"
                  maxLength={10}
                />
              ) : (
                <ReadOnlyRow icone="cake" label="Idade" value={`${requirements?.age} anos`} />
              )}

              {age !== null && age >= MIN_WORKER_AGE && age < 18 && (
                <Notice
                  kind="warning"
                  mensagem={`Você tem ${age} anos. Por lei, o cadastro precisa dos dados do seu responsável legal — vamos pedir na próxima etapa.`}
                />
              )}
              {tooYoung && <Notice kind="error" mensagem={MIN_AGE_MESSAGE} />}

              <CampoEntrada
                label="Celular"
                value={telefone}
                onChangeText={setPhone}
                placeholder="(11) 90000-0000"
                icone="telefone"
                keyboardType="telefone-pad"
              />

              <SeletorEndereco label="Cidade e região onde você atende" value={address} onChange={setAddress} />
            </>
          )}

          {isGuardianStep && (
            <>
              <SectionHint text="Como você tem menos de 18 anos, precisamos dos dados do seu responsável legal. Essas informações ficam protegidas e só você tem acesso a elas." />

              <CampoEntrada
                label="Nome completo do responsável"
                value={guardian.nome}
                onChangeText={(t) => setGuardian((g) => ({ ...g, nome: t }))}
                icone="user"
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
                onChangeText={(t) => setGuardian((g) => ({ ...g, telefone: t }))}
                placeholder="(11) 90000-0000"
                icone="telefone"
                keyboardType="telefone-pad"
              />
              <CampoEntrada
                label="E-mail do responsável (opcional)"
                value={guardian.email}
                onChangeText={(t) => setGuardian((g) => ({ ...g, email: t }))}
                placeholder="responsavel@email.com"
                icone="mail"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Pressable
                onPress={() => setGuardian((g) => ({ ...g, consent_accepted: !g.consent_accepted }))}
                style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 8, marginBottom: 8 }}
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

          {isProfessionalStep && (
            <>
              <SectionHint text="Agora os dados do seu serviço. É o que os clientes veem quando encontram você." />

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
                      onPress={() =>
                        setDays((prev) => (on ? prev.filter((x) => x !== d.value) : [...prev, d.value]))
                      }
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

              <Pressable
                onPress={() => setKeepClient((v) => !v)}
                style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 4, marginBottom: 18 }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: keepClient ? theme.brand.green : theme.cardBorder,
                    backgroundColor: keepClient ? theme.brand.green : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                  }}
                >
                  {keepClient && <Icon nome="check" size={13} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text }}>
                    Manter também minha conta de cliente (perfil híbrido)
                  </Text>
                  <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginTop: 2 }}>
                    Você poderá contratar serviços e ser contratado, alternando pelo menu lateral.
                  </Text>
                </View>
              </Pressable>
            </>
          )}

          <Botao
            label={isProfessionalStep ? 'Criar perfil profissional' : 'Continuar'}
            onPress={isProfessionalStep ? handleSubmit : handleNext}
            carregando={submitting}
            disabled={submitting || (step === 0 && tooYoung)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({ titulo, onBack }) {
  const { theme, rs } = usarTema();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.line,
      }}
    >
      <Pressable onPress={onBack} hitSlop={10}>
        <Icon nome="arrowLeft" size={22} color={theme.text} />
      </Pressable>
      <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.md), color: theme.text }}>{titulo}</Text>
    </View>
  );
}

function Stepper({ steps, current }) {
  const { theme, rs } = usarTema();
  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, gap: 8 }}>
      {steps.map((label, index) => (
        <View key={label} style={{ flex: 1 }}>
          <View
            style={{
              height: 4,
              borderRadius: 2,
              backgroundColor: index <= current ? theme.brand.orange : theme.line,
            }}
          />
          <Text
            style={{
              fontFamily: index === current ? FONTES.bodySemiBold : FONTES.body,
              fontSize: rs(TAMANHOS.xs) - 1,
              color: index === current ? theme.text : theme.textMuted,
              marginTop: 6,
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SectionHint({ text }) {
  const { theme, rs } = usarTema();
  return (
    <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, marginBottom: 18 }}>
      {text}
    </Text>
  );
}

function ReadOnlyRow({ icone, label, value }) {
  const { theme, rs } = usarTema();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: theme.bgAlt,
        borderRadius: 12,
        padding: 13,
        marginBottom: 14,
      }}
    >
      <Icon nome={icone} size={17} color={theme.textMuted} />
      <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, flex: 1 }}>{label}</Text>
      <Text style={{ fontFamily: FONTES.bodySemiBold, fontSize: rs(TAMANHOS.sm), color: theme.text }}>{value}</Text>
    </View>
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
