'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import Modal from '@/componentes/interface/JanelaModal';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import { useToast } from '@/componentes/interface/Notificacao';
import api from '@/servicos/clienteApi';
import { formatarMoeda } from '@/utilitarios/formatadores';
import SharedIcon from '@/componentes/interface/Icone';

/* ─── SVG ICONS ─────────────────────────────────────────────────── */
function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8, style }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  switch (name) {
    case 'target': return <svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></svg>;
    case 'sparkle': return <svg {...p}><path d="M12 2l1.5 5h5L14 10.5l1.5 5L12 13l-3.5 2.5L10 10.5 5.5 7h5z" /></svg>;
    case 'user': return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case 'mapPin': return <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    case 'check': return <svg {...p}><polyline points="20 6 9 17 4 12" /></svg>;
    case 'arrowRight': return <svg {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
    case 'send': return <svg {...p}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
    default: return null;
  }
}

export default function WorkerQuotesPage() {
  const { darkMode } = usarTema();
  const theme = obterCoresTema(darkMode);
  const toast = useToast();

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ price: '', message: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/orcamentos')
      .then(r => setQuotes(r.data.quotes || []))
      .catch(() => toast('Erro ao carregar orçamentos', 'error'))
      .finally(() => setLoading(false));
  }, []);

  async function handlePropose(e) {
    e.preventDefault();
    if (!form.price || !form.message) { toast('Preencha preço e mensagem', 'warning'); return; }
    try {
      setSaving(true);
      await api.post(`/orcamentos/${selected.id}/propostas`, form);
      toast('Proposta enviada com sucesso!', 'success');
      setModal(false);
      setForm({ price: '', message: '' });
      setQuotes(prev => prev.map(q => q.id === selected.id ? { ...q, _proposed: true } : q));
    } catch (err) {
      toast(err?.response?.data?.error || 'Erro ao enviar proposta', 'error');
    } finally { setSaving(false); }
  }

  return (
    <LayoutPainel>
      <div style={{ padding: '28px 20px 60px', maxWidth: 760, margin: '0 auto', fontFamily: 'var(--body)' }}>

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 18 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.9rem', color: theme.text, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            Oportunidades <Icon name="target" size={22} color="#FF7A00" />
          </h1>
          <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginTop: 4 }}>Clientes buscando profissionais — envie sua proposta</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ background: 'rgba(34,211,27,0.08)', border: '1px solid rgba(34,211,27,0.25)', borderRadius: 16, padding: 16, display: 'flex', gap: 12, marginBottom: 20 }}>
          <Icon name="sparkle" size={20} color="#1E9E1A" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1E9E1A' }}>Como aumentar suas chances</p>
            <p style={{ fontSize: '0.76rem', color: theme.textMuted, marginTop: 3, lineHeight: 1.6 }}>
              Seja específico na mensagem, mencione experiência com o tipo de serviço e ofereça um prazo claro. Propostas detalhadas têm 3x mais aceitação.
            </p>
          </div>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[0, 1, 2, 3].map(i => <div key={i} style={{ height: 100, borderRadius: 16, background: theme.line, opacity: 0.5 }} />)}</div>
        ) : quotes.length === 0 ? (
          <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 18, padding: 50, textAlign: 'center' }}>
            <Icon name="target" size={32} color={theme.textMuted} style={{ margin: '0 auto 10px' }} />
            <p style={{ fontWeight: 700, color: theme.text, fontSize: '0.9rem' }}>Nenhuma oportunidade no momento</p>
            <p style={{ color: theme.textMuted, fontSize: '0.78rem', marginTop: 4 }}>Novas solicitações aparecerão aqui</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quotes.map((q, i) => (
              <motion.div key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2, boxShadow: '0 10px 28px rgba(0,0,0,0.06)' }}
                style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 18, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <SharedIcon name={q.category_icon || 'clipboard'} size={17} color="#FF7A00" />
                      <p style={{ fontWeight: 800, fontSize: '0.92rem', color: theme.text }}>{q.title}</p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, fontSize: '0.72rem', color: theme.textMuted }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="user" size={11} color={theme.textMuted} /> {q.client_name}</span>
                      {q.city && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="mapPin" size={11} color={theme.textMuted} /> {q.city}</span>}
                      {q.budget_max && <span style={{ fontWeight: 700, color: '#22D31B' }}>Até {formatarMoeda(q.budget_max)}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1E9E1A', background: 'rgba(34,211,27,0.12)', padding: '5px 11px', borderRadius: 999, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {q.proposal_count || 0} proposta{q.proposal_count !== 1 ? 's' : ''}
                  </span>
                </div>

                <p style={{ fontSize: '0.82rem', color: theme.textMuted, lineHeight: 1.6, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q.description}</p>

                {q._proposed ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: '#22D31B' }}>
                    <Icon name="check" size={14} color="#22D31B" /> Proposta enviada
                  </div>
                ) : (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { setSelected(q); setModal(true); }}
                    style={{ background: '#FF7A00', color: '#fff', fontWeight: 800, fontSize: '0.8rem', padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    Enviar proposta <Icon name="arrowRight" size={14} color="#fff" />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Enviar proposta" size="md">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: theme.bgAlt, borderRadius: 14, padding: 14, border: `1px solid ${theme.cardBorder}` }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Solicitação</p>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', color: theme.text }}>{selected.title}</p>
              {selected.budget_max && <p style={{ fontSize: '0.74rem', color: theme.textMuted, marginTop: 4 }}>Orçamento do cliente: até {formatarMoeda(selected.budget_max)}</p>}
            </div>

            <form onSubmit={handlePropose} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6 }}>Seu preço (R$) *</label>
                <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="Ex: 350"
                  style={{ width: '100%', borderRadius: 12, padding: '11px 14px', fontSize: '0.86rem', outline: 'none', background: theme.bg, color: theme.text, border: `1.5px solid ${theme.line}` }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6 }}>Sua mensagem *</label>
                <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={5} maxLength={500}
                  placeholder="Apresente-se, mencione experiência com este tipo de serviço, prazo estimado e diferenciais..."
                  style={{ width: '100%', borderRadius: 12, padding: 14, fontSize: '0.84rem', outline: 'none', resize: 'none', background: theme.bg, color: theme.text, border: `1.5px solid ${theme.line}` }} />
                <p style={{ fontSize: '0.68rem', color: theme.textMuted, marginTop: 4 }}>{form.message.length}/500 caracteres</p>
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={saving}
                style={{ background: '#FF7A00', color: '#fff', fontWeight: 800, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}>
                <Icon name="send" size={15} color="#fff" /> {saving ? 'Enviando...' : 'Enviar proposta'}
              </motion.button>
            </form>
          </div>
        )}
      </Modal>
    </LayoutPainel>
  );
}
