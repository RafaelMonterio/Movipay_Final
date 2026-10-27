'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import { useToast } from '@/componentes/interface/Notificacao';
import { formatarMoeda } from '@/utilitarios/formatadores';
import api from '@/servicos/clienteApi';
import { usarAutenticacao } from '@/contexto/contextoAutenticacao';

/* ─── SVG ICONS ─────────────────────────────────────────────────── */
function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8, style }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  switch (name) {
    case 'plus': return <svg {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
    case 'x': return <svg {...p}><line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" /></svg>;
    case 'tool': return <svg {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
    case 'save': return <svg {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>;
    default: return null;
  }
}

const CATEGORY_OPTIONS = [
  ['limpeza', 'Limpeza'], ['eletrica', 'Elétrica'], ['pintura', 'Pintura'],
  ['encanamento', 'Encanamento'], ['jardinagem', 'Jardinagem'],
  ['informatica', 'Informática'], ['mudanca', 'Mudança'],
  ['reforma', 'Reforma'], ['cuidado-pessoal', 'Cuidado Pessoal'], ['aulas', 'Aulas'],
];

export default function WorkerServicesPage() {
  const { user } = usarAutenticacao();
  const { darkMode } = usarTema();
  const theme = obterCoresTema(darkMode);
  const toast = useToast();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'limpeza', price: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const all = await api.get('/servicos').then(r => r.data.services);
      setServices(all.filter(s => s.worker_id === user?.id));
    } finally { setLoading(false); }
  }
  useEffect(() => { if (user) load(); }, [user]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title || !form.price) return;
    try {
      setSaving(true);
      await api.post('/servicos', { ...form, price: Number(form.price) });
      setForm({ title: '', category: 'limpeza', price: '' });
      setShowForm(false);
      toast('Serviço criado com sucesso!', 'success');
      load();
    } catch { toast('Erro ao criar serviço', 'error'); }
    finally { setSaving(false); }
  }

  return (
    <LayoutPainel>
      <div style={{ padding: '28px 20px 60px', maxWidth: 860, margin: '0 auto', fontFamily: 'var(--body)' }}>

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.9rem', color: theme.text, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
              Meus Serviços <Icon name="tool" size={20} color="#FF7A00" />
            </h1>
            <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginTop: 4 }}>{services.length} serviço{services.length !== 1 ? 's' : ''} cadastrado{services.length !== 1 ? 's' : ''}</p>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowForm(v => !v)}
            style={{ background: showForm ? 'transparent' : '#FF7A00', border: showForm ? `1.5px solid ${theme.line}` : 'none', color: showForm ? theme.text : '#fff', fontWeight: 800, fontSize: '0.82rem', padding: '10px 18px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name={showForm ? 'x' : 'plus'} size={14} color={showForm ? theme.text : '#fff'} /> {showForm ? 'Cancelar' : 'Novo serviço'}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderLeft: '4px solid #FF7A00', borderRadius: 16, padding: 20 }}>
                <p style={{ fontWeight: 800, fontSize: '0.9rem', color: theme.text, marginBottom: 14 }}>Novo serviço</p>
                <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr', gap: 12 }} className="wk-svc-form">
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: theme.textMuted, display: 'block', marginBottom: 5 }}>Título *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Limpeza Residencial"
                      style={{ width: '100%', borderRadius: 10, padding: '9px 12px', fontSize: '0.82rem', outline: 'none', background: theme.bg, color: theme.text, border: `1.5px solid ${theme.line}` }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: theme.textMuted, display: 'block', marginBottom: 5 }}>Categoria</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      style={{ width: '100%', borderRadius: 10, padding: '9px 12px', fontSize: '0.82rem', outline: 'none', background: theme.bg, color: theme.text, border: `1.5px solid ${theme.line}`, cursor: 'pointer' }}>
                      {CATEGORY_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: theme.textMuted, display: 'block', marginBottom: 5 }}>Preço (R$) *</label>
                    <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="80"
                      style={{ width: '100%', borderRadius: 10, padding: '9px 12px', fontSize: '0.82rem', outline: 'none', background: theme.bg, color: theme.text, border: `1.5px solid ${theme.line}` }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={saving}
                      style={{ background: '#FF7A00', color: '#fff', fontWeight: 800, fontSize: '0.8rem', padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
                      <Icon name="save" size={13} color="#fff" /> {saving ? 'Salvando...' : 'Salvar'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="wk-svc-grid">{[0, 1, 2, 3].map(i => <div key={i} style={{ height: 110, borderRadius: 18, background: theme.line, opacity: 0.5 }} />)}</div>
        ) : services.length === 0 ? (
          <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 18, padding: 54, textAlign: 'center' }}>
            <Icon name="tool" size={34} color={theme.textMuted} style={{ margin: '0 auto 10px' }} />
            <p style={{ fontWeight: 700, color: theme.text, fontSize: '0.92rem' }}>Nenhum serviço ainda.</p>
            <p style={{ color: theme.textMuted, fontSize: '0.78rem', marginTop: 4 }}>Clique em "Novo serviço" para começar.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="wk-svc-grid">
            {services.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileHover={{ y: -3, boxShadow: '0 10px 26px rgba(0,0,0,0.06)' }}
                style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 18, padding: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: '0.66rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.category || 'geral'}</span>
                  <h3 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.05rem', color: theme.text, marginTop: 4 }}>{s.title}</h3>
                </div>
                <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.3rem', color: '#FF7A00', flexShrink: 0 }}>{formatarMoeda(s.price)}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <style>{`@media (max-width: 700px) { .wk-svc-form { grid-template-columns: 1fr !important; } .wk-svc-grid { grid-template-columns: 1fr !important; } }`}</style>
    </LayoutPainel>
  );
}
