'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import { usarAutenticacao } from '@/contexto/contextoAutenticacao';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import { useToast } from '@/componentes/interface/Notificacao';

const CATEGORIES = [
  ['limpeza','Limpeza'], ['eletrica','Elétrica'], ['hidraulica','Encanamento'],
  ['pintura','Pintura'], ['jardinagem','Jardinagem'], ['informatica','Informática'],
  ['mudanca','Mudanças'], ['reforma','Reformas'], ['cabelo','Cabelo & estética'], ['aulas','Aulas'],
];

export default function AtivarTrabalhadorPage() {
  const { user, ativarModoTrabalhador } = usarAutenticacao();
  const { darkMode } = usarTema();
  const theme = obterCoresTema(darkMode);
  const toast = useToast();
  const router = useRouter();
  const [form, setForm] = useState({
    phone: user?.phone || '', cpf: user?.cpf || '', birthDate: user?.birthDate || user?.data_nascimento || '',
    category: user?.category || '', services: Array.isArray(user?.services) ? user.services : [], bio: user?.bio || '',
  });
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const toggleCategory = value => setForm(prev => ({ ...prev, category: prev.category === value ? '' : value, services: prev.category === value ? [] : prev.services }));
  const toggleService = value => setForm(prev => ({ ...prev, services: prev.services.includes(value) ? prev.services.filter(item => item !== value) : [...prev.services, value] }));

  async function submit(e) {
    e.preventDefault();
    if (!form.phone.trim() || !form.cpf.trim() || !form.birthDate || !form.category || form.services.length === 0 || !accepted) {
      toast('Preencha seus dados, escolha uma categoria, selecione um serviço e aceite os termos.', 'warning');
      return;
    }
    setSaving(true);
    try { await ativarModoTrabalhador({ ...form, category: form.category, services: form.services }); }
    catch { toast('Não foi possível ativar o perfil agora.', 'error'); setSaving(false); }
  }

  const suggestions = {
    limpeza:['Faxina residencial','Limpeza pós-obra','Lavagem de sofá'], eletrica:['Instalação elétrica','Troca de disjuntor','Instalação de tomadas'],
    hidraulica:['Conserto de vazamentos','Desentupimento','Instalação de torneiras'], pintura:['Pintura interna','Pintura externa','Retoca de paredes'],
    jardinagem:['Manutenção de jardim','Poda','Paisagismo'], informatica:['Formatação','Configuração de rede','Suporte remoto'],
    mudanca:['Mudança residencial','Frete pequeno','Montagem de móveis'], reforma:['Pequenos reparos','Reforma de banheiro','Reforma de cozinha'],
    cabelo:['Corte','Escova','Coloração'], aulas:['Aula particular','Preparação para prova','Aula online'],
  }[form.category] || [];

  const fields = [
    ['phone','Telefone','text','(11) 99999-9999'],
    ['cpf','CPF','text','000.000.000-00'],
    ['birthDate','Data de nascimento','date',''],
  ];

  return <LayoutPainel><main style={{ maxWidth: 820, margin: '0 auto', padding: '32px 20px 70px', color: theme.text }}>
    <button type="button" onClick={() => router.back()} style={{ border: 0, background: 'transparent', color: '#FF7A00', cursor: 'pointer', fontWeight: 800 }}>← Voltar</button>
    <div style={{ margin: '18px 0 24px' }}>
      <p style={{ color: '#FF7A00', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', fontSize: 12 }}>Perfil profissional</p>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(1.8rem,4vw,2.8rem)', margin: '6px 0' }}>Ativar conta de trabalhador</h1>
      <p style={{ color: theme.textMuted, lineHeight: 1.6, maxWidth: 680 }}>Informe seus dados profissionais e escolha exatamente os serviços que deseja oferecer.</p>
    </div>

    <form onSubmit={submit} style={{ display: 'grid', gap: 18 }}>
      <section style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 20, padding: 22 }}>
        <h2 style={{ margin: '0 0 14px', fontSize: '1.05rem' }}>1. Dados adicionais</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }} className="worker-activation-grid">
          {fields.map(([fieldName,label,type,placeholder]) => <label key={fieldName} style={{ display: 'grid', gap: 7, fontSize: '.78rem', fontWeight: 800 }}>
            {label}
            <input name={fieldName} type={type} value={form[fieldName]} onChange={update} placeholder={placeholder} required style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: 12, border: `1px solid ${theme.line}`, background: theme.bg, color: theme.text }} />
          </label>)}
        </div>
      </section>

      <section style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 20, padding: 22 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.05rem' }}>2. Categoria principal</h2>
        <p style={{ margin: '0 0 14px', color: theme.textMuted, fontSize: '.78rem' }}>Selecione uma área principal.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
          {CATEGORIES.map(([value,label]) => { const selected = form.category === value; return <button key={value} type="button" onClick={() => toggleCategory(value)} style={{ minHeight: 52, borderRadius: 14, border: `1.5px solid ${selected ? '#FF7A00' : theme.cardBorder}`, background: selected ? 'rgba(255,122,0,.10)' : theme.bg, color: selected ? '#C95A00' : theme.text, fontWeight: 800, cursor: 'pointer' }}>{selected ? '✓ ' : ''}{label}</button>; })}
        </div>
      </section>

      {form.category && <section style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 20, padding: 22 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.05rem' }}>3. Serviços oferecidos</h2>
        <p style={{ margin: '0 0 14px', color: theme.textMuted, fontSize: '.78rem' }}>Marque todos os serviços que você realiza.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
          {suggestions.map(service => { const selected = form.services.includes(service); return <button key={service} type="button" onClick={() => toggleService(service)} style={{ borderRadius: 14, border: `1.5px solid ${selected ? '#22D31B' : theme.cardBorder}`, background: selected ? 'rgba(34,211,27,.10)' : theme.bg, color: theme.text, padding: '13px 14px', textAlign: 'left', cursor: 'pointer', fontWeight: 750 }}>{selected ? '✓ ' : '+'}{service}</button>; })}
        </div>
      </section>}

      <section style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 20, padding: 22 }}>
        <label style={{ display: 'grid', gap: 8, fontSize: '.82rem', fontWeight: 800 }}>Apresentação profissional
          <textarea name="bio" value={form.bio} onChange={update} rows={4} placeholder="Conte sua experiência, diferenciais e como costuma atender." style={{ padding: '12px', borderRadius: 12, border: `1px solid ${theme.line}`, background: theme.bg, color: theme.text, resize: 'vertical' }} />
        </label>
      </section>

      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 14, background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, fontSize: '.78rem', color: theme.textMuted }}>
        <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /> Confirmo que os dados são meus e aceito atuar com responsabilidade como trabalhador.
      </label>
      <button disabled={saving} style={{ border: 0, borderRadius: 14, padding: 15, background: 'linear-gradient(135deg,#FF7A00,#FF9A33)', color: '#fff', fontWeight: 900, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Ativando perfil...' : 'Confirmar e ativar perfil'}</button>
    </form>
    <style>{`@media (max-width: 680px) { .worker-activation-grid { grid-template-columns: 1fr !important; } }`}</style>
  </main></LayoutPainel>;
}
