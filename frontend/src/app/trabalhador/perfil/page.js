'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import EnvioAvatar from '@/componentes/interface/EnvioAvatar';
import Modal from '@/componentes/interface/JanelaModal';
import { ProfileEsqueleto } from '@/componentes/interface/Esqueleto';
import { useToast } from '@/componentes/interface/Notificacao';
import { usarAutenticacao } from '@/contexto/contextoAutenticacao';
import { usarFormulario, rules } from '@/ganchos/usarFormulario';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import { formatarMoeda } from '@/utilitarios/formatadores';
import api from '@/servicos/clienteApi';
import SharedIcon from '@/componentes/interface/Icone';

/* ─── SVG ICONS ─────────────────────────────────────────────────── */
function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8, style }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  switch (name) {
    case 'edit': return <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
    case 'phone': return <svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
    case 'mapPin': return <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    case 'plus': return <svg {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
    case 'camera': return <svg {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
    case 'trash': return <svg {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>;
    case 'star': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" style={style}><polygon points="12 2 15.09 8.63 22 9.24 16.5 14.14 18.18 21 12 17.27 5.82 21 7.5 14.14 2 9.24 8.91 8.63 12 2" /></svg>;
    case 'check': return <svg {...p}><polyline points="20 6 9 17 4 12" /></svg>;
    case 'swap': return <svg {...p}><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>;
    case 'sair': return <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
    case 'tool': return <svg {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
    case 'checkCircle': return <svg {...p}><circle cx="12" cy="12" r="9" /><polyline points="9 12 11 14 15 10" /></svg>;
    case 'message': return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case 'image': return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
    default: return null;
  }
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const CATEGORY_OPTIONS = [
  ['limpeza', 'Limpeza'], ['eletrica', 'Elétrica'], ['pintura', 'Pintura'],
  ['encanamento', 'Encanamento'], ['jardinagem', 'Jardinagem'],
  ['informatica', 'Informática'], ['mudanca', 'Mudança'],
  ['reforma', 'Reforma'], ['aulas', 'Aulas'],
];
const LEVELS = [
  { icon: 'sprout', color: '#22C55E', label: 'Iniciante', min: 0 }, { icon: 'medal', color: '#CD7F32', label: 'Bronze', min: 100 },
  { icon: 'sparkle', color: '#22D3EE', label: 'Formiga VIP · Voadora', min: 300 },
  { icon: 'crown', color: '#F59E0B', label: 'Formiga VIP · Rainha', min: 1000 },
];

export default function WorkerProfilePage() {
  const { user, sair, alternarModo } = usarAutenticacao();
  const { darkMode } = usarTema();
  const theme = obterCoresTema(darkMode);
  const toast = useToast();
  const photoRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [slots, setSlots] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [available, setAvailable] = useState(true);
  const [svcModal, setSvcModal] = useState(false);
  const [savingSvc, setSavingSvc] = useState(false);
  const [svcForm, setSvcForm] = useState({ title: '', category: 'limpeza', price: '', description: '' });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const form = usarFormulario({ name: '', bio: '', phone: '' }, { name: [rules.required(), rules.minLength(2, 'Nome muito curto')] });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get('/autenticacao/me').then(r => {
        setProfile(r.data);
        setAvailable(r.data.is_available ?? true);
        form.handleChange('name', r.data.name || '');
        form.handleChange('bio', r.data.bio || '');
        form.handleChange('phone', r.data.phone || '');
      }),
      api.get(`/profissionais/${user.id}`).then(r => {
        setServices(r.data.services || []);
        setPhotos(r.data.photos || []);
        setSlots(r.data.availability || []);
        setReviews(r.data.reviews || []);
      }),
    ]).catch(() => toast('Erro ao carregar perfil', 'error')).finally(() => setLoading(false));
  }, [user]);

  async function handleSave() {
    await form.handleSubmit(async values => {
      try {
        const { data } = await api.patch(`/usuarios/${user.id}`, values);
        setProfile(prev => ({ ...prev, ...data }));
        setEditing(false);
        toast('Perfil atualizado!', 'success');
      } catch { toast('Erro ao salvar', 'error'); }
    });
  }

  async function toggleAvailability() {
    try {
      const next = !available;
      await api.patch(`/profissionais/${user.id}/disponibilidade`, { esta_disponivel: next });
      setAvailable(next);
      toast(next ? 'Você está disponível!' : 'Modo indisponível ativado', 'info');
    } catch { toast('Erro ao atualizar disponibilidade', 'error'); }
  }

  async function handlePortfolioPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Selecione uma imagem', 'error'); return; }
    if (file.size > 3 * 1024 * 1024) { toast('Máximo 3MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        setUploadingPhoto(true);
        const { data } = await api.post(`/profissionais/${user.id}/portfolio`, { url: ev.target.result, caption: file.name.replace(/\.[^/.]+$/, '') });
        setPhotos(prev => [data, ...prev]);
        toast('Foto adicionada ao portfólio!', 'success');
      } catch { toast('Erro ao adicionar foto', 'error'); }
      finally { setUploadingPhoto(false); }
    };
    reader.readAsDataURL(file);
  }

  async function deletePhoto(photoId) {
    try {
      await api.delete(`/profissionais/${user.id}/portfolio/${photoId}`);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast('Foto removida', 'info');
    } catch { toast('Erro ao remover foto', 'error'); }
  }

  async function handleAddService() {
    if (!svcForm.title || !svcForm.price) { toast('Preencha título e preço', 'warning'); return; }
    try {
      setSavingSvc(true);
      const { data } = await api.post('/servicos', svcForm);
      setServices(prev => [data, ...prev]);
      setSvcModal(false);
      setSvcForm({ title: '', category: 'limpeza', price: '', description: '' });
      toast('Serviço adicionado!', 'success');
    } catch { toast('Erro ao adicionar serviço', 'error'); }
    finally { setSavingSvc(false); }
  }

  const points = profile?.points || 0;
  const levelIndex = LEVELS.reduce((acc, lvl, i) => points >= lvl.min ? i : acc, 0);
  const level = LEVELS[levelIndex];

  return (
    <LayoutPainel>
      <div style={{ padding: '28px 20px 60px', maxWidth: 640, margin: '0 auto', fontFamily: 'var(--body)' }}>

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 22 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.9rem', color: theme.text, letterSpacing: '-0.02em' }}>Meu Perfil</h1>
          <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginTop: 4 }}>Gerencie suas informações e portfólio</p>
        </motion.div>

        {loading ? <ProfileEsqueleto /> : (
          <>
            {/* Card principal */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 }}
              style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 20, padding: 22, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <EnvioAvatar user={profile} onUpdate={d => setProfile(p => ({ ...p, ...d }))} />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.2rem', color: theme.text }}>{profile?.name}</p>
                    {profile?.is_verified && (
                      <span style={{ fontSize: '0.66rem', fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'rgba(255,122,0,0.12)', color: '#FF7A00', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="check" size={10} color="#FF7A00" /> Verificado
                      </span>
                    )}
                    <span title={level.label} style={{ display: 'inline-flex' }}><SharedIcon name={level.icon} size={20} color={level.color} /></span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: theme.textMuted, marginTop: 3 }}>{profile?.email}</p>
                  {profile?.neighborhood && (
                    <p style={{ fontSize: '0.74rem', color: theme.textMuted, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="mapPin" size={11} color={theme.textMuted} /> {profile.neighborhood}, {profile.city}
                    </p>
                  )}
                  {profile?.avg_rating > 0 && (
                    <p style={{ fontSize: '0.8rem', color: '#FFB347', marginTop: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                      {Array.from({ length: 5 }).map((_, i) => <Icon key={i} name="star" size={13} color={i < Math.round(profile.avg_rating) ? '#FFB347' : theme.line} />)}
                      <span style={{ color: theme.textMuted, fontSize: '0.72rem', marginLeft: 4 }}>{parseFloat(profile.avg_rating).toFixed(1)} ({profile.total_reviews} avaliações)</span>
                    </p>
                  )}

                  <motion.button whileTap={{ scale: 0.96 }} onClick={toggleAvailability}
                    style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 999, cursor: 'pointer', border: 'none', fontSize: '0.72rem', fontWeight: 700, background: available ? 'rgba(34,211,27,0.12)' : theme.bgAlt, color: available ? '#1E9E1A' : theme.textMuted }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: available ? '#22D31B' : theme.textMuted }} />
                    {available ? 'Disponível para novos pedidos' : 'Indisponível no momento'}
                  </motion.button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} onClick={() => alternarModo('client')}
                    style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, #FF7A00, #FF9A33)', padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', boxShadow: '0 8px 20px rgba(255,122,0,0.3)' }}>
                    <Icon name="swap" size={15} color="#fff" /> Trocar para cliente
                  </motion.button>
                  <button onClick={() => setEditing(v => !v)} style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FF7A00', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="edit" size={13} color="#FF7A00" /> {editing ? 'Cancelar' : 'Editar'}
                  </button>
                </div>
              </div>

              {profile?.bio && !editing && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${theme.line}` }}>
                  <p style={{ fontSize: '0.66rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 5 }}>Bio</p>
                  <p style={{ fontSize: '0.85rem', color: theme.text, lineHeight: 1.6 }}>{profile.bio}</p>
                </div>
              )}
            </motion.div>

            {/* Form de edição */}
            <AnimatePresence>
              {editing && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ background: theme.cardBg, border: '1.5px solid rgba(255,122,0,0.3)', borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { name: 'name', label: 'Nome', placeholder: '' },
                      { name: 'phone', label: 'Telefone', placeholder: '(11) 99999-9999' },
                    ].map(f => (
                      <div key={f.name}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6 }}>{f.label}</label>
                        <input value={form.values[f.name]} onChange={e => form.handleChange(f.name, e.target.value)} placeholder={f.placeholder}
                          style={{ width: '100%', borderRadius: 12, padding: '10px 14px', fontSize: '0.85rem', outline: 'none', background: theme.bg, color: theme.text, border: `1.5px solid ${theme.line}` }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6 }}>Bio profissional</label>
                      <textarea value={form.values.bio} onChange={e => form.handleChange('bio', e.target.value)} rows={4}
                        placeholder="Descreva sua experiência, especialidades e diferenciais..."
                        style={{ width: '100%', borderRadius: 12, padding: 14, fontSize: '0.85rem', outline: 'none', resize: 'none', background: theme.bg, color: theme.text, border: `1.5px solid ${theme.line}` }} />
                    </div>
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={form.submitting}
                      style={{ background: '#FF7A00', color: '#fff', fontWeight: 800, padding: '11px 0', borderRadius: 12, border: 'none', cursor: 'pointer', opacity: form.submitting ? 0.7 : 1 }}>
                      {form.submitting ? 'Salvando...' : 'Salvar alterações'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { icon: 'star', label: 'Pontos', value: profile?.points || 0, color: '#FFB347' },
                { icon: 'checkCircle', label: 'Concluídos', value: profile?.total_orders || 0, color: '#22D31B' },
                { icon: 'message', label: 'Avaliações', value: profile?.total_reviews || 0, color: '#FF7A00' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                  style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 15, padding: 14, textAlign: 'center' }}>
                  <Icon name={s.icon} size={17} color={s.color} style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.15rem', color: theme.text }}>{s.value}</p>
                  <p style={{ fontSize: '0.66rem', color: theme.textMuted, marginTop: 2 }}>{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Portfólio */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '0.95rem', color: theme.text }}>Portfólio de fotos</h2>
                <button onClick={() => photoRef.current?.click()} disabled={uploadingPhoto}
                  style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff', background: '#FF7A00', padding: '7px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', opacity: uploadingPhoto ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="plus" size={11} color="#fff" /> Adicionar
                </button>
                <input ref={photoRef} type="file" accept="image/*" onChange={handlePortfolioPhoto} style={{ display: 'none' }} />
              </div>

              {photos.length === 0 ? (
                <button onClick={() => photoRef.current?.click()}
                  style={{ width: '100%', background: theme.cardBg, border: `2px dashed ${theme.line}`, borderRadius: 18, padding: 32, textAlign: 'center', cursor: 'pointer' }}>
                  <Icon name="camera" size={26} color={theme.textMuted} style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '0.84rem', fontWeight: 700, color: theme.text }}>Adicione fotos dos seus trabalhos</p>
                  <p style={{ fontSize: '0.72rem', color: theme.textMuted, marginTop: 4 }}>Fotos aumentam suas chances de contratação em 3x</p>
                </button>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {photos.map((ph, i) => (
                    <motion.div key={ph.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      className="wk-photo" style={{ position: 'relative', aspectRatio: '1', borderRadius: 16, overflow: 'hidden', background: theme.bgAlt }}>
                      <img src={ph.url} alt={ph.caption || 'Portfólio'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="wk-photo-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s' }}>
                        <button onClick={() => deletePhoto(ph.id)} style={{ background: '#FF3B5C', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Icon name="trash" size={11} color="#fff" /> Remover
                        </button>
                      </div>
                      {ph.caption && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.4)', padding: '4px 8px' }}><p style={{ color: '#fff', fontSize: '0.68rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ph.caption}</p></div>}
                    </motion.div>
                  ))}
                  <button onClick={() => photoRef.current?.click()}
                    style={{ aspectRatio: '1', borderRadius: 16, border: `2px dashed ${theme.line}`, background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}>
                    <Icon name="plus" size={18} color={theme.textMuted} />
                    <span style={{ fontSize: '0.66rem', color: theme.textMuted }}>Adicionar</span>
                  </button>
                </div>
              )}
            </div>

            {/* Disponibilidade */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '0.95rem', color: theme.text, marginBottom: 12 }}>Grade de disponibilidade</h2>
              {slots.length === 0 ? (
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 16, padding: 24, textAlign: 'center' }}>
                  <p style={{ fontSize: '0.8rem', color: theme.textMuted }}>Nenhum horário configurado</p>
                </div>
              ) : (
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 16, padding: 14, overflowX: 'auto' }}>
                  <div style={{ display: 'flex', gap: 10, minWidth: 'max-content' }}>
                    {WEEKDAYS.map((day, wi) => {
                      const daySlots = slots.filter(s => s.weekday === wi);
                      return (
                        <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 58 }}>
                          <p style={{ fontSize: '0.64rem', fontWeight: 700, color: theme.textMuted, textAlign: 'center', marginBottom: 4 }}>{day}</p>
                          {daySlots.length === 0 ? (
                            <div style={{ height: 30, borderRadius: 8, background: theme.bgAlt, border: `1px dashed ${theme.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '0.66rem', color: theme.textMuted }}>—</span>
                            </div>
                          ) : daySlots.map(s => (
                            <div key={s.id} style={{ background: 'rgba(255,122,0,0.1)', color: '#FF7A00', fontSize: '0.64rem', fontWeight: 700, padding: '4px 6px', borderRadius: 8, textAlign: 'center' }}>
                              {s.hour_start}h–{s.hour_end}h
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Serviços */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '0.95rem', color: theme.text }}>Meus Serviços</h2>
                <button onClick={() => setSvcModal(true)} style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff', background: '#FF7A00', padding: '7px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="plus" size={11} color="#fff" /> Adicionar
                </button>
              </div>
              {services.length === 0 ? (
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 16, padding: 30, textAlign: 'center' }}>
                  <Icon name="tool" size={24} color={theme.textMuted} style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '0.8rem', color: theme.textMuted }}>Adicione seus serviços para aparecer nas buscas</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {services.map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 14, padding: 14 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <SharedIcon name={s.category_icon || 'tools'} size={15} color="#FF7A00" />
                          <p style={{ fontWeight: 700, fontSize: '0.83rem', color: theme.text }}>{s.title}</p>
                        </div>
                        <p style={{ fontSize: '0.7rem', color: theme.textMuted, marginTop: 2 }}>{s.category}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 800, color: '#FF7A00', fontSize: '0.88rem' }}>{formatarMoeda(s.price)}</p>
                        <p style={{ fontSize: '0.66rem', color: theme.textMuted }}>{s.price_type === 'hourly' ? '/ hora' : s.price_type === 'negotiable' ? 'a combinar' : 'fixo'}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Avaliações */}
            {reviews.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '0.95rem', color: theme.text, marginBottom: 12 }}>Avaliações recebidas</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {reviews.slice(0, 4).map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 16, padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #FF7A00, #FFB347)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.72rem', flexShrink: 0 }}>
                          {r.reviewer_name?.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.82rem', color: theme.text }}>{r.reviewer_name}</p>
                          <div style={{ display: 'flex', gap: 1 }}>{Array.from({ length: 5 }).map((_, si) => <Icon key={si} name="star" size={11} color={si < r.rating ? '#FFB347' : theme.line} />)}</div>
                        </div>
                      </div>
                      {r.comment && <p style={{ fontSize: '0.82rem', color: theme.textMuted, lineHeight: 1.6, fontStyle: 'italic' }}>"{r.comment}"</p>}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={sair}
              style={{ width: '100%', border: '1.5px solid rgba(255,59,92,0.3)', color: '#FF3B5C', fontWeight: 700, padding: '12px 0', borderRadius: 14, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Icon name="sair" size={15} color="#FF3B5C" /> Sair da conta
            </motion.button>
          </>
        )}
      </div>

      {/* Modal novo serviço */}
      <Modal open={svcModal} onClose={() => setSvcModal(false)} title="Adicionar serviço" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6 }}>Título *</label>
            <input value={svcForm.title} onChange={e => setSvcForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Instalação de tomadas"
              style={{ width: '100%', borderRadius: 12, padding: '10px 14px', fontSize: '0.85rem', outline: 'none', background: theme.bg, color: theme.text, border: `1.5px solid ${theme.line}` }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6 }}>Categoria</label>
              <select value={svcForm.category} onChange={e => setSvcForm(p => ({ ...p, category: e.target.value }))}
                style={{ width: '100%', borderRadius: 12, padding: '10px 12px', fontSize: '0.82rem', outline: 'none', background: theme.bg, color: theme.text, border: `1.5px solid ${theme.line}`, cursor: 'pointer' }}>
                {CATEGORY_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6 }}>Preço (R$) *</label>
              <input type="number" value={svcForm.price} onChange={e => setSvcForm(p => ({ ...p, price: e.target.value }))} placeholder="150"
                style={{ width: '100%', borderRadius: 12, padding: '10px 14px', fontSize: '0.85rem', outline: 'none', background: theme.bg, color: theme.text, border: `1.5px solid ${theme.line}` }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6 }}>Descrição</label>
            <textarea value={svcForm.description} onChange={e => setSvcForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Descreva o que está incluso no serviço..."
              style={{ width: '100%', borderRadius: 12, padding: 14, fontSize: '0.84rem', outline: 'none', resize: 'none', background: theme.bg, color: theme.text, border: `1.5px solid ${theme.line}` }} />
          </div>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleAddService} disabled={savingSvc}
            style={{ background: '#FF7A00', color: '#fff', fontWeight: 800, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer', opacity: savingSvc ? 0.7 : 1 }}>
            {savingSvc ? 'Salvando...' : 'Adicionar serviço'}
          </motion.button>
        </div>
      </Modal>

      <style>{`.wk-photo:hover .wk-photo-overlay { opacity: 1 !important; }`}</style>
    </LayoutPainel>
  );
}
