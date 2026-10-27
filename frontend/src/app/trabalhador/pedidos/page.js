'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import { useToast } from '@/componentes/interface/Notificacao';
import { formatarMoeda, formatarData, formatarStatus } from '@/utilitarios/formatadores';
import servicoPedidos from '@/servicos/servicoPedidos';

/* ─── SVG ICONS ─────────────────────────────────────────────────── */
function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8, style }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  switch (name) {
    case 'clock': return <svg {...p}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" /></svg>;
    case 'check': return <svg {...p}><polyline points="20 6 9 17 4 12" /></svg>;
    case 'x': return <svg {...p}><line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" /></svg>;
    case 'flag': return <svg {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>;
    case 'inbox': return <svg {...p}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>;
    case 'leaf': return <svg {...p}><path d="M5 21c0-9 6-15 15-15-1 9-7 15-15 15z" /><path d="M5 21c3-3 6-6 9-9" /></svg>;
    default: return null;
  }
}

const STATUS_CONFIG = {
  pending:     { label: 'Pendente',     color: '#FFB347', bg: 'rgba(255,179,71,0.12)' },
  accepted:    { label: 'Aceito',       color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  in_progress: { label: 'Em andamento', color: '#22D31B', bg: 'rgba(34,211,27,0.12)' },
  completed:   { label: 'Concluído',    color: '#22D31B', bg: 'rgba(34,211,27,0.12)' },
  cancelled:   { label: 'Cancelado',    color: '#FF3B5C', bg: 'rgba(255,59,92,0.12)' },
};

export default function WorkerOrdersPage() {
  const { darkMode } = usarTema();
  const theme = obterCoresTema(darkMode);
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  async function load() {
    try { setLoading(true); const d = await servicoPedidos.listarTodos(); setOrders(d.orders || []); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function act(id, status) {
    try {
      setUpdating(id);
      await servicoPedidos.atualizarStatus(id, status);
      toast(status === 'accepted' ? 'Pedido aceito!' : status === 'cancelled' ? 'Pedido recusado.' : status === 'completed' ? 'Pedido concluído! Você ganhou Folhas.' : 'Atualizado', status === 'cancelled' ? 'info' : 'success');
      load();
    } catch { toast('Erro ao atualizar pedido', 'error'); }
    finally { setUpdating(null); }
  }

  const pending = orders.filter(o => o.status === 'pending');
  const others = orders.filter(o => o.status !== 'pending');

  return (
    <LayoutPainel>
      <div style={{ padding: '28px 20px 60px', maxWidth: 820, margin: '0 auto', fontFamily: 'var(--body)' }}>

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.9rem', color: theme.text, letterSpacing: '-0.02em' }}>Pedidos recebidos</h1>
          <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginTop: 4 }}>{pending.length} aguardando sua resposta</p>
        </motion.div>

        {pending.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#E86D00', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="clock" size={14} color="#E86D00" /> AGUARDANDO RESPOSTA
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AnimatePresence>
                {pending.map((o, i) => (
                  <motion.div key={o.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ delay: i * 0.07 }}
                    style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderLeft: '4px solid #FF7A00', borderRadius: 16, padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: '0.9rem', color: theme.text }}>{o.service_title || `Pedido #${o.id}`}</p>
                        <p style={{ fontSize: '0.72rem', color: theme.textMuted, marginTop: 2 }}>{o.client_name} · {formatarData(o.created_at)}</p>
                      </div>
                      <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.4rem', color: '#FF7A00' }}>{formatarMoeda(o.price)}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => act(o.id, 'accepted')} disabled={updating === o.id}
                        style={{ flex: 1, background: '#22D31B', color: '#fff', fontWeight: 800, padding: '10px 0', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: updating === o.id ? 0.7 : 1 }}>
                        <Icon name="check" size={14} color="#fff" /> Aceitar
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => act(o.id, 'cancelled')} disabled={updating === o.id}
                        style={{ flex: 1, background: 'transparent', color: '#FF3B5C', fontWeight: 800, padding: '10px 0', borderRadius: 12, border: '1.5px solid rgba(255,59,92,0.35)', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: updating === o.id ? 0.7 : 1 }}>
                        <Icon name="x" size={14} color="#FF3B5C" /> Recusar
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 800, color: theme.textMuted, marginBottom: 10, letterSpacing: '0.02em' }}>TODOS OS PEDIDOS</h2>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[0, 1, 2, 3].map(i => <div key={i} style={{ height: 70, borderRadius: 14, background: theme.line, opacity: 0.5 }} />)}</div>
          ) : others.length === 0 && pending.length === 0 ? (
            <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 18, padding: 50, textAlign: 'center' }}>
              <Icon name="inbox" size={34} color={theme.textMuted} style={{ margin: '0 auto 10px' }} />
              <p style={{ color: theme.textMuted, fontSize: '0.88rem' }}>Nenhum pedido ainda.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {others.map((o, i) => {
                const cfg = STATUS_CONFIG[o.status] || { label: o.status, color: theme.textMuted, bg: theme.bgAlt };
                return (
                  <motion.div key={o.id} layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 14, padding: '14px 16px', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,122,0,0.12)', color: '#FF7A00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.72rem', flexShrink: 0 }}>#{o.id}</div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.85rem', color: theme.text }}>{o.service_title || formatarStatus(o.status)}</p>
                        <p style={{ fontSize: '0.72rem', color: theme.textMuted, marginTop: 1 }}>{o.client_name} · {formatarData(o.created_at)}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {o.status === 'accepted' && (
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => act(o.id, 'completed')} disabled={updating === o.id}
                          style={{ background: '#22D31B', color: '#fff', fontWeight: 800, fontSize: '0.76rem', padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Icon name="flag" size={12} color="#fff" /> Concluir
                        </motion.button>
                      )}
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '5px 10px', borderRadius: 999 }}>{cfg.label}</span>
                      <p style={{ fontWeight: 800, color: '#FF7A00', fontSize: '0.88rem' }}>{formatarMoeda(o.price)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </LayoutPainel>
  );
}
