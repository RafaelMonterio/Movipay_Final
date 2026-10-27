'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import { usarAutenticacao } from '@/contexto/contextoAutenticacao';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import { useToast } from '@/componentes/interface/Notificacao';

export default function AtivarTrabalhadorPage() {
  const { user, ativarModoTrabalhador } = usarAutenticacao();
  const { darkMode } = usarTema();
  const theme = obterCoresTema(darkMode);
  const toast = useToast();
  const router = useRouter();
  const [form, setForm] = useState({ phone: user?.phone || '', cpf: user?.cpf || '', birthDate: user?.birthDate || user?.data_nascimento || '', services: (user?.services || []).join(', '), bio: user?.bio || '' });
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const update = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    if (!form.phone.trim() || !form.cpf.trim() || !form.birthDate || !form.services.trim() || !accepted) { toast('Preencha os dados obrigatórios e aceite os termos.', 'warning'); return; }
    setSaving(true);
    try { await ativarModoTrabalhador({ ...form, services: form.services.split(',').map(s => s.trim()).filter(Boolean), category: form.services.split(',')[0].trim() }); }
    catch { toast('Não foi possível ativar o perfil agora.', 'error'); setSaving(false); }
  }
  const fields = [['phone','Telefone','(11) 99999-9999'],['cpf','CPF','000.000.000-00'],['birthDate','Data de nascimento','']];
  return <LayoutPainel><main style={{ maxWidth: 620, margin: '0 auto', padding: '32px 20px 70px', color: theme.text }}>
    <button onClick={() => router.back()} style={{ border: 0, background: 'transparent', color: '#FF7A00', cursor: 'pointer', fontWeight: 700 }}>← Voltar</button>
    <h1 style={{ fontFamily: 'var(--display)', margin: '18px 0 8px' }}>Ative seu perfil de trabalhador</h1>
    <p style={{ color: theme.textMuted, lineHeight: 1.5, marginBottom: 22 }}>Antes de oferecer serviços, confirme seus dados para manter sua conta segura. Seu modo atual não será alterado até concluir esta etapa.</p>
    <form onSubmit={submit} style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 18, padding: 22, display: 'grid', gap: 14 }}>
      {fields.map(([name,label,placeholder]) => <label key={name} style={{ display: 'grid', gap: 6, fontSize: '.8rem', fontWeight: 700 }}>{label}<input name={name} type={name === 'birthDate' ? 'date' : 'text'} value={form[name]} onChange={update} placeholder={placeholder} required style={{ padding: '11px 12px', borderRadius: 10, border: `1px solid ${theme.line}`, background: theme.bg, color: theme.text }} /></label>)}
      <label style={{ display: 'grid', gap: 6, fontSize: '.8rem', fontWeight: 700 }}>Serviços oferecidos<input name="services" value={form.services} onChange={update} placeholder="Ex.: elétrica, montagem" required style={{ padding: '11px 12px', borderRadius: 10, border: `1px solid ${theme.line}`, background: theme.bg, color: theme.text }} /></label>
      <label style={{ display: 'grid', gap: 6, fontSize: '.8rem', fontWeight: 700 }}>Apresentação<textarea name="bio" value={form.bio} onChange={update} rows={3} style={{ padding: '11px 12px', borderRadius: 10, border: `1px solid ${theme.line}`, background: theme.bg, color: theme.text, resize: 'vertical' }} /></label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '.78rem', color: theme.textMuted }}><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /> Confirmo que os dados são meus e aceito os termos para atuar como trabalhador.</label>
      <button disabled={saving} style={{ border: 0, borderRadius: 12, padding: 13, background: '#FF7A00', color: '#fff', fontWeight: 800, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Ativando...' : 'Confirmar e ativar perfil'}</button>
    </form>
  </main></LayoutPainel>;
}
