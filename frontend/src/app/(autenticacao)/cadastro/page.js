'use client';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { usarAutenticacao } from '@/contexto/contextoAutenticacao';
import { useToast } from '@/componentes/interface/Notificacao';
import { usarFormulario, rules } from '@/ganchos/usarFormulario';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import FolhasCaindo from '@/componentes/efeitos/FolhasCaindo';
import SharedIcon from '@/componentes/interface/Icone';
import { CITY_NAME, coordsForNeighborhood, lookupCep, formatCep, isSameCity } from '@/utilitarios/localizacoes';

const STEP_LABELS = { dados: 'Dados', perfil: 'Perfil', detalhes: 'Detalhes', servicos: 'Serviços', termos: 'Termos' };

/* ─── SVG ICONS ─────────────────────────────────────────────────── */
function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8, style }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  switch (name) {
    case 'check': return <svg {...p}><polyline points="20 6 9 17 4 12" /></svg>;
    case 'arrowRight': return <svg {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
    case 'arrowLeft': return <svg {...p}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
    case 'user': return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case 'mail': return <svg {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
    case 'phone': return <svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
    case 'lock': return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
    case 'eye': return <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
    case 'eyeOff': return <svg {...p}><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.7 19.7 0 0 1 4.22-5.94M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a19.7 19.7 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
    case 'client': return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>;
    case 'worker': return <svg {...p}><rect x="2.5" y="8.5" width="19" height="11" rx="1.5" /><path d="M8 8.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2.5" /><line x1="2.5" y1="13.5" x2="21.5" y2="13.5" /><line x1="10.5" y1="13.5" x2="13.5" y2="13.5" /></svg>;
    case 'camera': return <svg {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
    case 'mapPin': return <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    case 'sparkle': return <svg {...p}><path d="M12 2l1.5 5h5L14 10.5l1.5 5L12 13l-3.5 2.5L10 10.5 5.5 7h5z" /></svg>;
    case 'sun': return <svg {...p}><circle cx="12" cy="12" r="4.5" /><line x1="12" y1="1.5" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22.5" /><line x1="4.2" y1="4.2" x2="6" y2="6" /><line x1="18" y1="18" x2="19.8" y2="19.8" /><line x1="1.5" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22.5" y2="12" /></svg>;
    case 'moon': return <svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
    case 'leaf': return <svg {...p}><path d="M5 21c0-9 6-15 15-15-1 9-7 15-15 15z" /><path d="M5 21c3-3 6-6 9-9" /></svg>;
    default: return null;
  }
}

/* ─── FIELD ─────────────────────────────────────────────────────── */
function Field({ name, label, type = 'text', placeholder, required, form, inputRefs, restoreFocus, icon, theme, togglePassword, showPassword }) {
  const hasError = form.errors[name] && form.touched[name];
  return (
    <div>
      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#FF3B5C' }}>*</span>}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 14, display: 'flex', color: hasError ? '#FF3B5C' : theme.textMuted, pointerEvents: 'none' }}>
            <Icon name={icon} size={16} />
          </span>
        )}
        <input
          ref={el => { inputRefs.current[name] = el; }}
          name={name}
          type={togglePassword ? (showPassword ? 'text' : 'password') : type}
          autoComplete={name === 'email' ? 'email' : name === 'password' || name === 'confirmPassword' ? 'new-password' : name === 'phone' ? 'tel' : 'name'}
          value={form.values[name]}
          onChange={e => { form.handleChange(name, e.target.value); restoreFocus(name); }}
          onBlur={() => form.handleBlur(name)}
          placeholder={placeholder}
          spellCheck={false}
          className="reg-input"
          style={{
            width: '100%', borderRadius: 12, padding: `12px 14px 12px ${icon ? 38 : 14}px`,
            paddingRight: togglePassword ? 42 : 14,
            fontSize: '0.88rem', fontFamily: 'var(--body)', outline: 'none',
            background: theme.inputBg, color: theme.text,
            border: `1.5px solid ${hasError ? '#FF3B5C' : theme.line}`,
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        />
        {togglePassword && (
          <button type="button" onClick={() => togglePassword(v => !v)} style={{ position: 'absolute', right: 12, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: theme.textMuted }} tabIndex={-1} aria-label="Mostrar senha">
            <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
          </button>
        )}
      </div>
      <AnimatePresence>
        {hasError && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ fontSize: '0.72rem', color: '#FF3B5C', marginTop: 5, fontWeight: 600 }}>
            {form.errors[name]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── STEP 1 · DADOS ────────────────────────────────────────────── */
function StepData({ form, inputRefs, restoreFocus, theme, showPw, setShowPw, showPw2, setShowPw2 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field name="name" label="Nome completo" placeholder="Seu nome completo" required icon="user" form={form} inputRefs={inputRefs} restoreFocus={restoreFocus} theme={theme} />
      <Field name="email" label="E-mail" type="email" placeholder="seu@email.com" required icon="mail" form={form} inputRefs={inputRefs} restoreFocus={restoreFocus} theme={theme} />
      <Field name="phone" label="Telefone" type="tel" placeholder="(11) 99999-9999" required icon="phone" form={form} inputRefs={inputRefs} restoreFocus={restoreFocus} theme={theme} />
      <Field name="cpf" label="CPF" placeholder="000.000.000-00" required form={form} inputRefs={inputRefs} restoreFocus={restoreFocus} theme={theme} />
      <Field name="birthDate" label="Data de nascimento" type="date" required form={form} inputRefs={inputRefs} restoreFocus={restoreFocus} theme={theme} />
      <Field name="password" label="Senha" placeholder="Mínimo 6 caracteres" required icon="lock" form={form} inputRefs={inputRefs} restoreFocus={restoreFocus} theme={theme} togglePassword={setShowPw} showPassword={showPw} />
      <Field name="confirmPassword" label="Confirmar senha" placeholder="Repita a senha" required icon="lock" form={form} inputRefs={inputRefs} restoreFocus={restoreFocus} theme={theme} togglePassword={setShowPw2} showPassword={showPw2} />
    </div>
  );
}

/* ─── STEP 2 · MODO ─────────────────────────────────────────────── */
function StepMode({ mode, setMode, theme }) {
  const options = [
    { value: 'client', icon: 'client', title: 'Sou cliente', body: 'Quero contratar profissionais para meus serviços', accent: '#FF7A00' },
    { value: 'worker', icon: 'worker', title: 'Sou prestador', body: 'Quero oferecer meus serviços e ganhar dinheiro', accent: '#FF7A00' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: '0.85rem', color: theme.textMuted, textAlign: 'center', marginBottom: 4 }}>
        Como você quer começar? Você pode mudar depois nas configurações.
      </p>
      {options.map((opt, i) => {
        const active = mode === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            onClick={() => setMode(opt.value)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -3, boxShadow: `0 14px 34px ${opt.accent}22` }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', padding: 18, borderRadius: 18, textAlign: 'left', cursor: 'pointer',
              border: `2px solid ${active ? opt.accent : theme.line}`,
              background: active ? `${opt.accent}12` : theme.cardBg,
              transition: 'border-color 0.25s, background 0.25s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <motion.div
                animate={active ? { scale: [1, 1.12, 1], rotate: [0, -6, 0] } : {}}
                transition={{ duration: 0.5 }}
                style={{ width: 52, height: 52, borderRadius: 16, background: active ? `${opt.accent}22` : theme.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <Icon name={opt.icon} size={24} color={active ? opt.accent : theme.textMuted} />
              </motion.div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1rem', color: theme.text }}>{opt.title}</p>
                <p style={{ fontSize: '0.8rem', color: theme.textMuted, marginTop: 2 }}>{opt.body}</p>
              </div>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${active ? opt.accent : theme.line}`,
                background: active ? opt.accent : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              }}>
                <AnimatePresence>
                  {active && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ color: '#fff', display: 'flex' }}>
                      <Icon name="check" size={13} color="#fff" strokeWidth={3} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

const CATEGORY_OPTIONS = [
  ['limpeza', 'Limpeza'], ['eletrica', 'Elétrica'], ['pintura', 'Pintura'],
  ['encanamento', 'Encanamento'], ['jardinagem', 'Jardinagem'],
  ['informatica', 'Informática'], ['mudanca', 'Mudança'],
  ['reforma', 'Reforma'], ['cuidado-pessoal', 'Cuidado Pessoal'], ['aulas', 'Aulas'],
];


/* ─── SELECT (styled) ───────────────────────────────────────────── */
function Select({ label, value, onChange, children, theme, optional }) {
  return (
    <div>
      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6 }}>
        {label} {optional && <span style={{ color: theme.textMuted, fontWeight: 500 }}>(opcional)</span>}
      </label>
      <select value={value} onChange={onChange} style={{
        width: '100%', borderRadius: 12, padding: '12px 14px', fontSize: '0.88rem', fontFamily: 'var(--body)',
        outline: 'none', background: theme.inputBg, color: theme.text, border: `1.5px solid ${theme.line}`, cursor: 'pointer',
      }}>
        {children}
      </select>
    </div>
  );
}

/* ─── STEP 3 · DETALHES ─────────────────────────────────────────── */
function StepDetails({ mode, form, theme }) {
  const isWorker = mode === 'worker';
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: '0.85rem', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name={isWorker ? 'worker' : 'mapPin'} size={15} color="#FF7A00" />
        {isWorker ? 'Conte sobre suas habilidades' : 'Onde você está?'}
      </p>

      {isWorker ? (
        <>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 8 }}>
              Foto de perfil <span style={{ color: theme.textMuted, fontWeight: 500 }}>(opcional)</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <motion.div whileHover={{ scale: 1.05 }} style={{
                width: 76, height: 76, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                background: theme.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '1.4rem', color: theme.textMuted, border: `2px solid ${theme.line}`,
              }}>
                {form.values.avatar_url ? <img src={form.values.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (form.values.name?.charAt(0) || '?')}
              </motion.div>
              <div>
                <input type="file" accept="image/*" id="reg-avatar" style={{ display: 'none' }} onChange={e => {
                  const f = e.target.files?.[0]; if (!f) return;
                  const r = new FileReader(); r.onload = ev => form.handleChange('avatar_url', ev.target.result); r.readAsDataURL(f);
                }} />
                <label htmlFor="reg-avatar" style={{ display: 'inline-block', background: theme.cardBg, border: `1.5px solid ${theme.line}`, borderRadius: 10, padding: '8px 14px', fontSize: '0.8rem', fontWeight: 700, color: theme.text, cursor: 'pointer' }}>
                  <Icon name="camera" size={13} style={{ marginRight: 6, verticalAlign: -2 }} /> Selecionar foto
                </label>
                <p style={{ fontSize: '0.68rem', color: theme.textMuted, marginTop: 8 }}>JPG/PNG/WebP — máximo 2MB.</p>
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6 }}>
              Bio profissional <span style={{ color: theme.textMuted, fontWeight: 500 }}>(opcional)</span>
            </label>
            <textarea value={form.values.bio} onChange={e => form.handleChange('bio', e.target.value)}
              placeholder="Ex: Eletricista com 10 anos de experiência. Atendo residências e comércios com qualidade e pontualidade..."
              rows={4}
              style={{ width: '100%', borderRadius: 12, padding: 14, fontSize: '0.85rem', fontFamily: 'var(--body)', outline: 'none', resize: 'none', background: theme.inputBg, color: theme.text, border: `1.5px solid ${theme.line}` }}
            />
          </div>

          <AddressFields form={form} theme={theme} />
          <p style={{ fontSize: '0.68rem', color: theme.textMuted, marginTop: -8 }}>Seu endereço posiciona seu marcador no mapa (com pequena variação, sem expor o número exato).</p>
        </>
      ) : (
        <>
          <AddressFields form={form} theme={theme} />

          <Select label="Como nos encontrou?" optional value={form.values.referral} onChange={e => form.handleChange('referral', e.target.value)} theme={theme}>
            <option value="">Selecione...</option>
            <option value="indicacao">Indicação de amigo</option>
            <option value="instagram">Instagram</option>
            <option value="google">Google</option>
            <option value="escola">Escola / Faculdade</option>
            <option value="outro">Outro</option>
          </Select>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'rgba(34,211,27,0.08)', border: '1px solid rgba(34,211,27,0.25)', borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E9E1A', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="leaf" size={13} color="#1E9E1A" /> Bônus de boas-vindas
            </p>
            <p style={{ fontSize: '0.74rem', color: theme.textMuted, lineHeight: 1.6 }}>
              Ao criar sua conta você já ganha <strong>150 Folhas</strong> — a moeda de desconto do MoviPay — para usar no seu primeiro pedido.
            </p>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

/**
 * Endereço real e OBRIGATÓRIO (clientes e prestadores): é o que posiciona o
 * marcador de cada um no mapa. O CEP é consultado na ViaCEP (API pública e
 * gratuita) e preenche rua/bairro/cidade. O MoviPay atende só Ribeirão Pires.
 */
function AddressFields({ form, theme }) {
  const [status, setStatus] = useState(form.values.lat != null ? 'found' : 'idle'); // idle|loading|found|not-found|wrong-city
  const box = { width: '100%', borderRadius: 12, padding: '12px 14px', fontSize: '0.88rem', fontFamily: 'var(--body)', outline: 'none', background: theme.inputBg, color: theme.text };

  async function handleCepChange(raw) {
    const formatted = formatCep(raw);
    form.handleChange('cep', formatted);
    form.handleChange('lat', null); form.handleChange('lng', null);
    if (formatted.replace(/\D/g, '').length < 8) { setStatus('idle'); return; }
    setStatus('loading');
    const r = await lookupCep(formatted);
    if (!r) { setStatus('not-found'); return; }
    if (!isSameCity(r.city)) { setStatus('wrong-city'); return; }
    form.handleChange('street', r.street);
    form.handleChange('neighborhood', r.neighborhood);
    form.handleChange('city', r.city);
    const [lat, lng] = coordsForNeighborhood(r.neighborhood);
    form.handleChange('lat', lat); form.handleChange('lng', lng);
    setStatus('found');
  }
  const bad = status === 'not-found' || status === 'wrong-city';

  return (
    <>
      <div>
        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6 }}>CEP</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: 13, color: theme.textMuted, display: 'flex' }}><SharedIcon name="mapPin" size={16} /></span>
          <input value={form.values.cep} onChange={e => handleCepChange(e.target.value)} placeholder="00000-000" inputMode="numeric"
            style={{ ...box, paddingLeft: 38, border: `1.5px solid ${bad ? '#EF4444' : theme.line}` }} />
          {status === 'loading' && <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', right: 14, top: 13, color: theme.textMuted, display: 'flex' }}><SharedIcon name="refresh" size={16} /></motion.span>}
          {status === 'found' && <span style={{ position: 'absolute', right: 14, top: 13, color: '#22C55E', display: 'flex' }}><SharedIcon name="checkCircle" size={16} /></span>}
        </div>
        {status === 'not-found' && <p style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: 6 }}>CEP não encontrado. Confira os números.</p>}
        {status === 'wrong-city' && <p style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: 6 }}>Esse CEP não é de {CITY_NAME}. O MoviPay atende só {CITY_NAME} por enquanto.</p>}
        {status === 'found' && <p style={{ fontSize: '0.72rem', color: '#22C55E', marginTop: 6 }}>{form.values.street}{form.values.street ? ', ' : ''}{form.values.neighborhood} — {form.values.city}</p>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6 }}>Número</label>
          <input value={form.values.addressNumber} onChange={e => form.handleChange('addressNumber', e.target.value)} placeholder="Ex: 123" style={{ ...box, border: `1.5px solid ${theme.line}` }} />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6 }}>Complemento <span style={{ color: theme.textMuted, fontWeight: 500 }}>(opcional)</span></label>
          <input value={form.values.complement} onChange={e => form.handleChange('complement', e.target.value)} placeholder="Ap, bloco..." style={{ ...box, border: `1.5px solid ${theme.line}` }} />
        </div>
      </div>
    </>
  );
}

const SERVICE_ICON = { limpeza: 'broom', eletrica: 'bolt', pintura: 'palette', encanamento: 'wrench', jardinagem: 'sprout', informatica: 'laptop', mudanca: 'box', reforma: 'hardHat', 'cuidado-pessoal': 'spa', aulas: 'book' };

/** Passo só do prestador: serviços (marca vários), experiência e portfólio. */
function StepServices({ form, theme }) {
  function toggleService(id) {
    const cur = form.values.services || [];
    const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
    form.handleChange('services', next);
    form.handleChange('category', next[0] || '');
  }
  function addPortfolioFiles(list) {
    Array.from(list || []).slice(0, 4 - (form.values.portfolio?.length || 0)).forEach(f => {
      const r = new FileReader();
      r.onload = ev => form.handleChange('portfolio', [...(form.values.portfolio || []), ev.target.result]);
      r.readAsDataURL(f);
    });
  }
  const lbl = { fontSize: '0.8rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 8 };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={lbl}>Serviços que você oferece <span style={{ color: theme.textMuted, fontWeight: 500 }}>(marque um ou mais)</span></label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {CATEGORY_OPTIONS.map(([id, label]) => {
            const active = (form.values.services || []).includes(id);
            return (
              <button key={id} type="button" onClick={() => toggleService(id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', padding: '10px 12px', borderRadius: 12, cursor: 'pointer', border: `1.5px solid ${active ? '#FF7A00' : theme.line}`, background: active ? 'rgba(255,122,0,0.1)' : theme.inputBg, color: theme.text, fontSize: '0.8rem', fontWeight: 700 }}>
                <SharedIcon name={SERVICE_ICON[id] || 'toolbox'} size={15} color={active ? '#FF7A00' : theme.textMuted} />
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label style={lbl}>Tempo de experiência em anos <span style={{ color: theme.textMuted, fontWeight: 500 }}>(opcional)</span></label>
        <input value={form.values.experienceYears} onChange={e => form.handleChange('experienceYears', e.target.value.replace(/\D/g, ''))} placeholder="Ex: 5" inputMode="numeric"
          style={{ width: '100%', borderRadius: 12, padding: '12px 14px', fontSize: '0.88rem', fontFamily: 'var(--body)', outline: 'none', background: theme.inputBg, color: theme.text, border: `1.5px solid ${theme.line}` }} />
      </div>
      <div>
        <label style={lbl}>Portfólio <span style={{ color: theme.textMuted, fontWeight: 500 }}>(opcional — até 4 fotos de trabalhos feitos)</span></label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {(form.values.portfolio || []).map((src, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: `1px solid ${theme.line}` }}>
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button type="button" onClick={() => form.handleChange('portfolio', form.values.portfolio.filter((_, k) => k !== i))}
                style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <SharedIcon name="x" size={9} color="#fff" />
              </button>
            </div>
          ))}
          {(form.values.portfolio?.length || 0) < 4 && (
            <>
              <input type="file" accept="image/*" multiple id="reg-portfolio" style={{ display: 'none' }} onChange={e => addPortfolioFiles(e.target.files)} />
              <label htmlFor="reg-portfolio" style={{ aspectRatio: '1', borderRadius: 10, border: `1.5px dashed ${theme.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.textMuted }}>
                <SharedIcon name="camera" size={18} />
              </label>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const TERMS_BY_MODE = {
  client: {
    title: 'Termos de uso do cliente',
    intro: 'Ao criar sua conta como cliente no MoviPay, você declara que leu e aceita as regras abaixo.',
    items: [
      'Você usará a plataforma para contratar serviços de forma responsável, clara e com informações verdadeiras sobre sua localização e necessidades.',
      'É responsabilidade do cliente confirmar prazo, valor, endereço e condições do serviço antes de autorizar qualquer contratação.',
      'O MoviPay atua como intermediador de contato e organização do processo; não é responsável por serviços realizados entre clientes e prestadores fora do uso da plataforma.',
      'Você concorda em respeitar as regras de conduta, comunicação ética e pagamento acordado dentro do aplicativo.',
      'A plataforma pode exigir verificação de dados e pode cancelar contas que realizarem fraude, abuso, assédio ou atividades incompatíveis com a comunidade.',
    ],
    footer: 'Ao continuar, você confirma que compreende os termos de uso e a responsabilidade de utilizar o MoviPay com ética e respeito.',
  },
  worker: {
    title: 'Termos de uso do prestador',
    intro: 'Ao criar sua conta como prestador no MoviPay, você declara que aceita as regras de prestação e uso da plataforma.',
    items: [
      'Você se compromete a informar dados reais sobre sua profissão, experiência, disponibilidade e localização, além de manter o perfil atualizado.',
      'É responsabilidade do prestador prestar serviços com profissionalismo, honestidade, pontualidade e respeito ao cliente e ao ambiente de trabalho.',
      'O MoviPay é uma plataforma de conexão e gestão de oportunidades; as negociações, valores, prazos e execução do serviço são de responsabilidade do prestador e do cliente.',
      'Você concorda em seguir as regras de comunicação, qualidade, segurança e ética da comunidade MoviPay, sem práticas abusivas, assédio ou fraude.',
      'A plataforma pode remover, sinalizar ou suspender perfis que apresentarem comportamento incompatível com os termos, avaliações fraudulentas ou dados falsos.',
    ],
    footer: 'Ao concluir o cadastro, você confirma que aceita estas condições para atuar como prestador no MoviPay.',
  },
};

function StepTerms({ mode, theme, termsAccepted, setTermsAccepted }) {
  const terms = TERMS_BY_MODE[mode === 'worker' ? 'worker' : 'client'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'rgba(255,122,0,0.08)', border: '1px solid rgba(255,122,0,0.24)', borderRadius: 16, padding: 16 }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#E86D00', marginBottom: 8 }}>
          {terms.title}
        </p>
        <p style={{ fontSize: '0.84rem', color: theme.textMuted, lineHeight: 1.7, margin: 0 }}>{terms.intro}</p>
      </div>

      <div style={{ border: `1px solid ${theme.line}`, borderRadius: 14, background: theme.inputBg, padding: 16, maxHeight: 250, overflowY: 'auto' }}>
        <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {terms.items.map((item) => (
            <li key={item} style={{ fontSize: '0.76rem', lineHeight: 1.7, color: theme.textMuted }}>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ fontSize: '0.78rem', color: theme.textMuted, lineHeight: 1.7, borderTop: `1px solid ${theme.line}`, paddingTop: 14 }}>
        {terms.footer}
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: theme.bgAlt, border: `1px solid ${theme.line}`, borderRadius: 12, padding: 12, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          style={{ width: 18, height: 18, accentColor: '#FF7A00', marginTop: 2 }}
        />
        <span style={{ fontSize: '0.8rem', color: theme.text, lineHeight: 1.5 }}>
          Li e aceito os termos de uso do MoviPay para conta de {mode === 'worker' ? 'prestador' : 'cliente'}.
        </span>
      </label>
    </motion.div>
  );
}

const stepVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

/* ─── PAGE ──────────────────────────────────────────────────────── */
export default function RegisterPage() {
  const { cadastrar } = usarAutenticacao();
  const toast = useToast();
  const { darkMode, toggleDarkMode } = usarTema();
  const colors = obterCoresTema(darkMode);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [mode, setMode] = useState('client');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef({});

  const theme = {
    bg: colors.bg,
    bgAlt: darkMode ? '#0D130B' : '#F1EAD9',
    text: colors.text,
    textMuted: colors.textMuted,
    cardBg: colors.cardBg,
    cardBorder: colors.cardBorder,
    line: colors.line,
    inputBg: darkMode ? '#1A2417' : '#FFFFFF',
  };

  const form = usarFormulario(
    { name: '', email: '', phone: '', cpf: '', birthDate: '', password: '', confirmPassword: '', bio: '', city: '', category: 'limpeza', referral: '', avatar_url: '', lat: null, lng: null, neighborhood: '', cep: '', street: '', addressNumber: '', complement: '', services: [], portfolio: [], experienceYears: '' },
    {
      name: [rules.required(), rules.minLength(2, 'Nome muito curto')],
      email: [rules.required(), rules.email()],
      phone: [rules.required('Telefone obrigatório')],
      cpf: [rules.required('CPF obrigatório')],
      birthDate: [rules.required('Data de nascimento obrigatória')],
      password: [rules.required(), rules.minLength(6)],
      confirmPassword: [rules.required('Confirme a senha'), (v, all) => v !== all.password ? 'As senhas não coincidem' : ''],
    }
  );

  function restoreFocus(name) {
    requestAnimationFrame(() => {
      const input = inputRefs.current[name];
      if (!input) return;
      if (document.activeElement !== input) {
        input.focus();
        const len = input.value?.length || 0;
        input.setSelectionRange?.(len, len);
      }
    });
  }

  const isWorker = mode === 'worker';
  const accent = '#FF7A00'; // sempre a cor da marca (antes alternava verde/laranja por modo)
  // Prestador tem um passo a mais (serviços) entre Detalhes e Termos.
  const STEP_IDS = isWorker ? ['dados', 'perfil', 'detalhes', 'servicos', 'termos'] : ['dados', 'perfil', 'detalhes', 'termos'];
  const stepId = STEP_IDS[step];
  const lastStep = STEP_IDS.length - 1;
  const STEPS = STEP_IDS.map(id => STEP_LABELS[id]);

  function validateStep0() {
    const fields = ['name', 'email', 'phone', 'cpf', 'birthDate', 'password', 'confirmPassword'];
    fields.forEach(f => form.handleBlur(f));
    const v = form.values;
    if (!v.name?.trim() || v.name.length < 2) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return false;
    if (!v.phone?.trim()) return false;
    if (!v.cpf?.trim() || !v.birthDate) return false;
    if (!v.password || v.password.length < 6) return false;
    if (v.confirmPassword !== v.password) return false;
    return true;
  }

  function validateAddress() {
    const v = form.values;
    if (!v.cep || !v.city || !Number.isFinite(v.lat)) { toast('Informe um CEP válido de Ribeirão Pires antes de continuar.', 'warning'); return false; }
    if (!v.addressNumber?.trim()) { toast('Informe o número do seu endereço.', 'warning'); return false; }
    return true;
  }

  function goNext() {
    if (stepId === 'dados' && !validateStep0()) { toast('Preencha todos os campos corretamente', 'warning'); return; }
    if (stepId === 'detalhes' && !validateAddress()) return;
    if (stepId === 'servicos' && !form.values.services?.length) { toast('Selecione pelo menos um serviço que você oferece.', 'warning'); return; }
    if (stepId === 'termos' && !termsAccepted) { toast('Você precisa aceitar os termos para finalizar o cadastro.', 'warning'); return; }
    setDir(1);
    setStep(s => s + 1);
  }
  function goBack() { setDir(-1); setStep(s => s - 1); }

  async function handleSubmit() {
    if (!termsAccepted) {
      toast('Você precisa aceitar os termos para criar sua conta.', 'warning');
      return;
    }

    try {
      setLoading(true);
      await cadastrar({
        name: form.values.name, email: form.values.email, password: form.values.password, mode,
        cpf: form.values.cpf, birthDate: form.values.birthDate,
        phone: form.values.phone, bio: form.values.bio, city: form.values.city,
        avatar_url: form.values.avatar_url, lat: form.values.lat, lng: form.values.lng,
        neighborhood: form.values.neighborhood, category: form.values.category,
        cep: form.values.cep, street: form.values.street, addressNumber: form.values.addressNumber,
        complement: form.values.complement, services: form.values.services,
        portfolio: form.values.portfolio, experienceYears: form.values.experienceYears,
        accepted_terms: true,
        terms_version: '2026.09.23',
      });
      setSuccess(true);
      toast('Conta criada! Bem-vindo ao MoviPay', 'success');
    } catch (err) {
      toast(err?.response?.data?.error || 'Erro ao criar conta', 'error');
    } finally {
      setLoading(false);
    }
  }

  const P_BASE = [
    { title: 'Bem-vindo', body: 'Preencha seus dados e comece a pedir ou oferecer serviços em minutos.', emoji: 'ant' },
    { title: 'Cliente ou prestador?', body: 'Escolha como quer começar — dá para trocar de modo depois, sem perder nada.', emoji: 'shuffle' },
  ];
  const P_TERMS = { title: 'Termos e regras', body: 'A última etapa confirma as regras do MoviPay para sua conta e para a comunidade.', emoji: 'scroll' };
  const sidePanels = isWorker
    ? [...P_BASE, { title: 'Quase lá!', body: 'Seu endereço real ajuda clientes próximos a te encontrar no mapa.', emoji: 'mapPin' }, { title: 'Seus serviços', body: 'Conte o que você faz — isso também monta seu perfil público.', emoji: 'toolbox' }, P_TERMS]
    : [...P_BASE, { title: 'Quase lá!', body: 'Só mais um passo e seu perfil está pronto.', emoji: 'sparkle' }, P_TERMS];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 0, overflow: 'hidden', background: theme.bg, color: theme.text, transition: 'background 0.4s, color 0.4s' }}>
      <FolhasCaindo />
      <style>{`
        :root { --display: 'Fraunces', serif; --body: 'Inter', sans-serif; --mono: 'IBM Plex Mono', monospace; }
        * { box-sizing: border-box; }
        .reg-input:focus { border-color: ${accent} !important; box-shadow: 0 0 0 4px ${accent}18; }
        .reg-side { display: flex; }
        .auth-switch { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: ${darkMode ? '#0D1F0D' : '#F5F8F5'}; border: 1px solid ${theme.line}; margin-bottom: 18px; }
        .auth-switch a { flex: 1; padding: 10px 12px; border-radius: 9px; color: ${theme.textMuted}; font-size: 0.82rem; font-weight: 800; text-align: center; text-decoration: none; transition: background 0.2s, color 0.2s; }
        .auth-switch a.active { background: ${darkMode ? '#1A4D1A' : '#FFFFFF'}; color: #FF7A00; box-shadow: 0 3px 10px rgba(18,38,27,0.08); }
        @media (max-width: 940px) { .reg-side { display: none !important; } }
      `}</style>

      {/* navbar */}
      <nav style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, position: 'relative', zIndex: 2 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/img/logo.png" alt="" style={{ width: 30, height: 30, borderRadius: '50%' }} />
          <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: '1.05rem' }}>
            <span style={{ color: '#FF7A00' }}>Movi</span><span style={{ color: '#22D31B' }}>Pay</span>
          </span>
        </Link>
        <button onClick={toggleDarkMode} style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: `1px solid ${theme.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} aria-label="Alternar tema">
          <Icon name={darkMode ? 'sun' : 'moon'} size={15} color={theme.textMuted} />
        </button>
      </nav>

      <div style={{ flex: 1, display: 'flex', position: 'relative', zIndex: 2 }}>

        {/* painel lateral ilustrativo — muda de acordo com o passo */}
        <div className="reg-side" style={{ flex: '0 0 42%', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(circle at 30% 20%, ${accent}22, transparent 55%), radial-gradient(circle at 80% 80%, #FF7A0018, transparent 50%)`,
            transition: 'background 0.5s',
          }} />
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.45 }}
              style={{ position: 'relative', maxWidth: 340, textAlign: 'center' }}
            >
              <motion.div
                animate={{ y: [0, -12, 0], rotate: [0, 4, -4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '4.5rem', marginBottom: 20 }}
              >
                <SharedIcon name={sidePanels[step].emoji} size={72} color="#FF7A00" strokeWidth={1.5} />
              </motion.div>
              <h2 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.8rem', letterSpacing: '-0.02em', marginBottom: 12 }}>
                {sidePanels[step].title}
              </h2>
              <p style={{ color: theme.textMuted, fontSize: '0.92rem', lineHeight: 1.7 }}>{sidePanels[step].body}</p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 30 }}>
                {STEPS.map((_, i) => (
                  <motion.span key={i} animate={{ width: i === step ? 26 : 8, background: i === step ? accent : theme.line }} transition={{ duration: 0.3 }} style={{ height: 8, borderRadius: 99, display: 'block' }} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {Array.from({ length: 6 }).map((_, i) => (
            <motion.span
              key={i}
              style={{ position: 'absolute', fontSize: 18 + (i % 3) * 6, left: `${10 + i * 15}%`, top: `${15 + (i * 13) % 70}%`, opacity: 0.35, pointerEvents: 'none' }}
              animate={{ y: [0, -18, 0], rotate: [0, 15, 0] }}
              transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
            >
              <SharedIcon name="leaf" size={1} color="#22D31B" style={{ width: '1em', height: '1em' }} />
            </motion.span>
          ))}
        </div>

        {/* formulário */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '36px 20px 60px' }}>
          <div style={{ width: '100%', maxWidth: 440 }}>

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '60px 20px' }}
              >
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10, delay: 0.1 }}
                  style={{ width: 84, height: 84, borderRadius: '50%', background: `${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}
                >
                  <Icon name="check" size={38} color={accent} strokeWidth={3} />
                </motion.div>
                <h2 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.6rem', marginBottom: 8 }}>Conta criada!</h2>
                <p style={{ color: theme.textMuted, fontSize: '0.9rem' }}>Redirecionando para o seu painel…</p>
              </motion.div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 26 }}>
                  {STEPS.map((s, i) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <motion.div animate={{ background: i <= step ? accent : theme.line, color: i <= step ? '#fff' : theme.textMuted }}
                        style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0 }}>
                        {i < step ? <Icon name="check" size={12} color="#fff" strokeWidth={3} /> : i + 1}
                      </motion.div>
                      <span style={{ marginLeft: 8, fontSize: '0.72rem', fontWeight: 700, color: i === step ? theme.text : theme.textMuted, whiteSpace: 'nowrap' }}>{s}</span>
                      {i < STEPS.length - 1 && (
                        <div style={{ flex: 1, height: 2, margin: '0 10px', borderRadius: 2, background: theme.line, overflow: 'hidden' }}>
                          <motion.div animate={{ width: i < step ? '100%' : '0%' }} transition={{ duration: 0.4 }} style={{ height: '100%', background: accent }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 22, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.07)' }}>
                  <motion.div animate={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: accent }} transition={{ duration: 0.4 }} style={{ height: 3 }} />

                  <div style={{ padding: '28px 26px' }}>
                    <div className="auth-switch" aria-label="Alternar autenticação">
                      <Link href="/entrar">Entrar</Link>
                      <Link href="/cadastro" className="active">Criar conta</Link>
                    </div>

                    <AnimatePresence mode="wait" custom={dir}>
                      <motion.div key={step} custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28 }}>
                        <h2 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.5rem', marginBottom: 4 }}>
                          {{ dados: 'Criar sua conta', perfil: 'Qual é o seu perfil?', detalhes: 'Últimos detalhes', servicos: 'Seus serviços', termos: 'Termos de uso' }[stepId]}
                        </h2>
                        <p style={{ color: theme.textMuted, fontSize: '0.8rem', marginBottom: 22 }}>
                          Passo {step + 1} de {STEPS.length} — {{ dados: 'dados básicos', perfil: 'você pode mudar depois', detalhes: 'quase lá!', servicos: 'o que você faz', termos: 'aceite as regras' }[stepId]}
                        </p>

                        {stepId === 'dados' && <StepData form={form} inputRefs={inputRefs} restoreFocus={restoreFocus} theme={theme} showPw={showPw} setShowPw={setShowPw} showPw2={showPw2} setShowPw2={setShowPw2} />}
                        {stepId === 'perfil' && <StepMode mode={mode} setMode={setMode} theme={theme} />}
                        {stepId === 'detalhes' && <StepDetails mode={mode} form={form} theme={theme} />}
                        {stepId === 'servicos' && <StepServices form={form} theme={theme} />}
                        {stepId === 'termos' && <StepTerms mode={mode} theme={theme} termsAccepted={termsAccepted} setTermsAccepted={setTermsAccepted} />}
                      </motion.div>
                    </AnimatePresence>

                    <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                      {step > 0 && (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={goBack}
                          style={{ flex: 1, border: `1.5px solid ${theme.line}`, background: 'transparent', color: theme.text, fontWeight: 700, padding: '12px 0', borderRadius: 12, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <Icon name="arrowLeft" size={14} /> Voltar
                        </motion.button>
                      )}
                      {step < lastStep ? (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={goNext}
                          style={{ flex: 1, border: 'none', background: accent, color: '#fff', fontWeight: 800, padding: '12px 0', borderRadius: 12, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: `0 8px 24px ${accent}44` }}>
                          Próximo <Icon name="arrowRight" size={14} />
                        </motion.button>
                      ) : (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={loading}
                          style={{ flex: 1, border: 'none', background: accent, color: '#fff', fontWeight: 800, padding: '12px 0', borderRadius: 12, fontSize: '0.85rem', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 8px 24px ${accent}44` }}>
                          {loading ? (
                            <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}>
                              <Icon name="leaf" size={15} color="#fff" />
                            </motion.span>
                          ) : <Icon name="sparkle" size={14} color="#fff" />}
                          {loading ? 'Criando conta…' : 'Criar minha conta'}
                        </motion.button>
                      )}
                    </div>

                    <p style={{ textAlign: 'center', fontSize: '0.78rem', color: theme.textMuted, marginTop: 16 }}>
                      Já tem conta? <Link href="/entrar" style={{ color: '#FF7A00', fontWeight: 700, textDecoration: 'none' }}>Entrar</Link>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
