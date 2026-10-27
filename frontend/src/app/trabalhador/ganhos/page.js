'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import { useToast } from '@/componentes/interface/Notificacao';
import { usarAutenticacao } from '@/contexto/contextoAutenticacao';
import { formatarMoeda, formatarData } from '@/utilitarios/formatadores';
import api from '@/servicos/clienteApi';

/* ─── SVG ICONS ─────────────────────────────────────────────────── */
function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8, style }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  switch (name) {
    case 'lock': return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
    case 'money': return <svg {...p}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
    case 'trendingUp': return <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
    case 'checkCircle': return <svg {...p}><circle cx="12" cy="12" r="9" /><polyline points="9 12 11 14 15 10" /></svg>;
    case 'star': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" style={style}><polygon points="12 2 15.09 8.63 22 9.24 16.5 14.14 18.18 21 12 17.27 5.82 21 7.5 14.14 2 9.24 8.91 8.63 12 2" /></svg>;
    case 'inbox': return <svg {...p}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>;
    default: return null;
  }
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function WorkerEarningsPage() {
  const { user } = usarAutenticacao();
  const { darkMode } = usarTema();
  const theme = obterCoresTema(darkMode);
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, held: 0 });
  const [loading, setLoading] = useState(true);
  const [apiMonthlyData, setApiMonthlyData] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/pedidos').then(r => setOrders(r.data.orders || [])),
      api.get('/pagamentos/carteira').then(r => setWallet(r.data)),
      api.get('/ganhos', { params: { months: 6 } }).then(r => {
        const rows = r.data?.months || r.data?.earnings || r.data?.data;
        if (Array.isArray(rows)) setApiMonthlyData(rows);
      }).catch(() => {}),
    ]).catch(() => toast('Erro ao carregar dados', 'error')).finally(() => setLoading(false));
  }, []);

  const completed = orders.filter(o => o.status === 'completed');
  const totalRevenue = completed.reduce((s, o) => s + parseFloat(o.price), 0);
  const thisMonth = completed.filter(o => {
    const d = new Date(o.completed_at || o.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthRevenue = thisMonth.reduce((s, o) => s + parseFloat(o.price), 0);

  const monthlyData = apiMonthlyData?.length ? apiMonthlyData.slice(-6).map((row, i) => ({
    label: row.label || row.month || MONTHS[i],
    value: Number(row.value ?? row.amount ?? row.total ?? 0),
  })) : Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const m = d.getMonth(); const y = d.getFullYear();
    const total = completed.filter(o => {
      const od = new Date(o.completed_at || o.created_at);
      return od.getMonth() === m && od.getFullYear() === y;
    }).reduce((s, o) => s + parseFloat(o.price), 0);
    return { label: MONTHS[m], value: total };
  });
  const maxVal = Math.max(...monthlyData.map(d => d.value), 1);

  const stats = [
    { icon: 'money', label: 'Este mês', value: formatarMoeda(monthRevenue), color: '#22D31B' },
    { icon: 'trendingUp', label: 'Total histórico', value: formatarMoeda(totalRevenue), color: '#FF7A00' },
    { icon: 'checkCircle', label: 'Pedidos feitos', value: completed.length, color: theme.text },
    { icon: 'star', label: 'Nota média', value: user?.avg_rating ? parseFloat(user.avg_rating).toFixed(1) : '—', color: '#FFB347' },
  ];

  return (
    <LayoutPainel>
      <div style={{ padding: '28px 20px 60px', maxWidth: 780, margin: '0 auto', fontFamily: 'var(--body)' }}>

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 22 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.9rem', color: theme.text, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            Meus Ganhos <Icon name="money" size={20} color="#FF7A00" />
          </h1>
          <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginTop: 4 }}>Acompanhe sua receita e carteira</p>
        </motion.div>

        {/* Carteira */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 }}
          style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: 26, background: 'linear-gradient(135deg, #1B5E20, #256B29 55%, #22D31B)', color: '#fff', marginBottom: 20 }}>
          <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="0.8" style={{ position: 'absolute', right: -26, bottom: -26, opacity: 0.12 }}><path d="M5 21c0-9 6-15 15-15-1 9-7 15-15 15z" /><path d="M5 21c3-3 6-6 9-9" /></svg>
          <p style={{ position: 'relative', fontSize: '0.8rem', opacity: 0.9 }}>Saldo disponível na carteira</p>
          <p style={{ position: 'relative', fontFamily: 'var(--display)', fontWeight: 700, fontSize: '2.6rem', marginTop: 6 }}>{formatarMoeda(wallet.balance)}</p>
          {wallet.held > 0 && (
            <div style={{ position: 'relative', marginTop: 16, background: 'rgba(255,255,255,0.16)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 340 }}>
              <Icon name="lock" size={17} color="#fff" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 700 }}>{formatarMoeda(wallet.held)} em custódia</p>
                <p style={{ fontSize: '0.7rem', opacity: 0.85 }}>Será liberado após conclusão dos pedidos</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }} className="wk-earn-stats">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 15, padding: '14px 12px' }}>
              <Icon name={s.icon} size={16} color={s.color} style={{ marginBottom: 8 }} />
              <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.05rem', color: s.color === theme.text ? theme.text : s.color }}>{s.value}</p>
              <p style={{ fontSize: '0.66rem', color: theme.textMuted, marginTop: 2 }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Gráfico */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 18, padding: 22, marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '0.95rem', color: theme.text, marginBottom: 18 }}>Receita dos últimos 6 meses</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 150 }}>
            {monthlyData.map((d, i) => (
              <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <p style={{ fontSize: '0.66rem', fontWeight: 700, color: theme.text }}>{d.value > 0 ? `R$${Math.round(d.value)}` : ''}</p>
                <motion.div initial={{ height: 0 }} animate={{ height: `${(d.value / maxVal) * 100}%` }} transition={{ delay: 0.3 + i * 0.08, duration: 0.6 }}
                  style={{ width: '100%', borderRadius: '8px 8px 3px 3px', minHeight: 4, background: i === monthlyData.length - 1 ? '#FF7A00' : theme.line }} />
                <p style={{ fontSize: '0.66rem', color: theme.textMuted }}>{d.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pedidos concluídos */}
        <div>
          <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '0.95rem', color: theme.text, marginBottom: 12 }}>Pedidos concluídos</p>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[0, 1, 2].map(i => <div key={i} style={{ height: 62, borderRadius: 14, background: theme.line, opacity: 0.5 }} />)}</div>
          ) : completed.length === 0 ? (
            <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 18, padding: 40, textAlign: 'center' }}>
              <Icon name="inbox" size={28} color={theme.textMuted} style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.82rem', color: theme.textMuted }}>Nenhum pedido concluído ainda.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {completed.slice(0, 8).map((o, i) => (
                <motion.div key={o.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 14, padding: 14 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.83rem', color: theme.text }}>{o.service_title || `Pedido #${o.id}`}</p>
                    <p style={{ fontSize: '0.72rem', color: theme.textMuted, marginTop: 2 }}>{o.client_name} · {formatarData(o.completed_at || o.created_at)}</p>
                  </div>
                  <p style={{ fontWeight: 800, color: '#22D31B', fontSize: '0.88rem' }}>{formatarMoeda(o.price)}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@media (max-width: 700px) { .wk-earn-stats { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
    </LayoutPainel>
  );
}
