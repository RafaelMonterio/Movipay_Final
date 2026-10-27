'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import { formatarMoeda, formatarData, formatarStatus } from '@/utilitarios/formatadores';
import servicoPedidos from '@/servicos/servicoPedidos';
import { usarAutenticacao } from '@/contexto/contextoAutenticacao';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import { useToast } from '@/componentes/interface/Notificacao';
import SharedIcon from '@/componentes/interface/Icone';

/* ─── DESIGN TOKENS ─────────────────────────────────────────────── */
// Display: Fraunces · Body: Inter · Mono: IBM Plex Mono
// Acentos: Laranja #FF7A00 · Verde #22D31B

/* ─── SVG ICONS ─────────────────────────────────────────────────── */
function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 1.8, style }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth,
    strokeLinecap: 'round', strokeLinejoin: 'round', style,
  };
  switch (name) {
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
    case 'filter': return <svg {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;
    case 'sort': return <svg {...p}><path d="M3 6h18M6 12h12M10 18h4" /></svg>;
    case 'calendar': return <svg {...p}><rect x="3" y="4" width="18" height="17" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case 'mapPin': return <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    case 'money': return <svg {...p}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
    case 'users': return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'check': return <svg {...p}><polyline points="20 6 9 17 4 12" /></svg>;
    case 'x': return <svg {...p}><line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" /></svg>;
    case 'clock': return <svg {...p}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" /></svg>;
    case 'message': return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case 'star': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" style={style}><polygon points="12 2 15.09 8.63 22 9.24 16.5 14.14 18.18 21 12 17.27 5.82 21 7.5 14.14 2 9.24 8.91 8.63 12 2" /></svg>;
    case 'shield': return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    case 'truck': return <svg {...p}><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M5 3v13" /><circle cx="6" cy="19" r="2" /><circle cx="14" cy="19" r="2" /></svg>;
    case 'sparkle': return <svg {...p}><path d="M12 2l1.5 5h5L14 10.5l1.5 5L12 13l-3.5 2.5L10 10.5 5.5 7h5z" /></svg>;
    case 'package': return <svg {...p}><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><line x1="12" y1="13" x2="12" y2="21" /></svg>;
    case 'refresh': return <svg {...p}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>;
    case 'arrowDown': return <svg {...p}><polyline points="6 9 12 15 18 9" /></svg>;
    case 'chevronRight': return <svg {...p}><polyline points="9 18 15 12 9 6" /></svg>;
    case 'chevronLeft': return <svg {...p}><polyline points="15 18 9 12 15 6" /></svg>;
    case 'eye': return <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
    case 'edit': return <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
    case 'more': return <svg {...p}><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>;
    default: return null;
  }
}

/* ─── STATUS CONFIG ─────────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending: {
    label: 'Pendente',
    shortLabel: 'Pendente',
    icon: 'clock',
    color: '#FFB347',
    bg: 'rgba(255,179,71,0.12)',
    border: 'rgba(255,179,71,0.35)',
    progress: 10,
    description: 'Aguardando profissional aceitar',
    step: 0,
  },
  accepted: {
    label: 'Aceito',
    shortLabel: 'Aceito',
    icon: 'check',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.35)',
    progress: 30,
    description: 'Profissional confirmado, aguardando início',
    step: 1,
  },
  in_progress: {
    label: 'Em andamento',
    shortLabel: 'Andamento',
    icon: 'truck',
    color: '#22D31B',
    bg: 'rgba(34,211,27,0.12)',
    border: 'rgba(34,211,27,0.35)',
    progress: 60,
    description: 'Serviço sendo executado',
    step: 2,
  },
  completed: {
    label: 'Concluído',
    shortLabel: 'Concluído',
    icon: 'check',
    color: '#22D31B',
    bg: 'rgba(34,211,27,0.12)',
    border: 'rgba(34,211,27,0.35)',
    progress: 100,
    description: 'Serviço finalizado com sucesso',
    step: 3,
  },
  cancelled: {
    label: 'Cancelado',
    shortLabel: 'Cancelado',
    icon: 'x',
    color: '#B83A08',
    bg: 'rgba(184,58,8,0.10)',
    border: 'rgba(184,58,8,0.30)',
    progress: 0,
    description: 'Pedido cancelado',
    step: -1,
  },
};

const FILTERS = [
  { key: 'all', label: 'Todos', icon: 'package' },
  { key: 'active', label: 'Ativos', icon: 'truck' },
  { key: 'pending', label: 'Pendentes', icon: 'clock' },
  { key: 'completed', label: 'Concluídos', icon: 'check' },
  { key: 'cancelled', label: 'Cancelados', icon: 'x' },
];

const SORTS = [
  { key: 'recent', label: 'Mais recentes' },
  { key: 'oldest', label: 'Mais antigos' },
  { key: 'price_high', label: 'Maior valor' },
  { key: 'price_low', label: 'Menor valor' },
  { key: 'status', label: 'Por status' },
];

/* ─── ANIMATED COUNTER ──────────────────────────────────────────── */
function Counter({ target, suffix = '', prefix = '', decimal = false, delay = 0 }) {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  useEffect(() => {
    if (!inView) return;
    const timer = setTimeout(() => {
      const steps = 50, dur = 1200;
      let cur = 0;
      const inc = target / steps;
      const t = setInterval(() => {
        cur += inc;
        if (cur >= target) { setV(target); clearInterval(t); }
        else setV(decimal ? cur : Math.floor(cur));
      }, dur / steps);
      return () => clearInterval(t);
    }, delay);
    return () => clearTimeout(timer);
  }, [inView, target, delay]);
  return <span ref={ref}>{prefix}{decimal ? v.toFixed(1) : v.toLocaleString('pt-BR')}{suffix}</span>;
}

/* ─── FLOATING LEAF BACKGROUND ──────────────────────────────────── */
function FloatingLeaf({ delay, x, size, color, duration }) {
  return (
    <motion.div
      style={{ position: 'absolute', top: 0, left: x + '%', pointerEvents: 'none', zIndex: 0 }}
      initial={{ y: -40, opacity: 0, rotate: 0 }}
      animate={{ y: '120vh', opacity: [0, 0.6, 0.6, 0], rotate: [0, 180, 360, 540] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    >
      <span style={{ display: 'inline-flex', opacity: 0.55 }}><SharedIcon name="leaf" size={size} color={color} /></span>
    </motion.div>
  );
}

/* ─── PROGRESS TIMELINE ─────────────────────────────────────────── */
function OrderTimeline({ order, theme }) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const steps = [
    { key: 'pending', label: 'Pendente', icon: 'clock' },
    { key: 'accepted', label: 'Aceito', icon: 'check' },
    { key: 'in_progress', label: 'Em andamento', icon: 'truck' },
    { key: 'completed', label: 'Concluído', icon: 'check' },
  ];

  return (
    <div style={{ position: 'relative', paddingLeft: 28 }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute', left: 11, top: 0, bottom: 0, width: 2,
        background: `linear-gradient(180deg, ${config.color} ${config.progress}%, ${theme.line} ${config.progress}%)`,
        borderRadius: 1,
      }} />

      {steps.map((step, i) => {
        const stepConfig = STATUS_CONFIG[step.key];
        const isActive = stepConfig.step <= config.step && config.step !== -1;
        const isCurrent = step.key === order.status && config.step !== -1;
        const isCompleted = stepConfig.step < config.step;

        return (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: i === steps.length - 1 ? 0 : 24, position: 'relative' }}
          >
            {/* Step indicator */}
            <div style={{
              position: 'relative', zIndex: 2, flexShrink: 0,
              width: 24, height: 24, borderRadius: '50%',
              background: isCompleted ? stepConfig.color : (isCurrent ? stepConfig.color : theme.cardBg),
              border: isCompleted ? 'none' : (isCurrent ? `3px solid ${stepConfig.color}` : `2px solid ${theme.line}`),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isCurrent ? `0 0 0 4px ${stepConfig.color}33` : 'none',
              transition: 'all 0.3s',
            }}>
              {isCompleted ? (
                <Icon name="check" size={12} color="#fff" />
              ) : (
                <Icon name={step.icon} size={isCurrent ? 13 : 11} color={isCurrent ? '#fff' : theme.textMuted} />
              )}

              {/* Pulse for current step */}
              {isCurrent && config.step !== -1 && order.status !== 'completed' && (
                <motion.div
                  style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `2px solid ${stepConfig.color}`, pointerEvents: 'none' }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>

            {/* Step content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontFamily: 'var(--display)', fontWeight: 700, fontSize: '0.85rem',
                  color: isActive ? theme.text : theme.textMuted,
                }}>
                  {step.label}
                </span>
                {isCurrent && config.step !== -1 && (
                  <motion.span
                    style={{
                      fontFamily: 'var(--mono)', fontSize: '0.62rem', fontWeight: 700,
                      padding: '2px 8px', borderRadius: 999,
                      background: stepConfig.bg, color: stepConfig.color,
                      border: `1px solid ${stepConfig.border}`,
                    }}
                    initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    ATUAL
                  </motion.span>
                )}
                {isCompleted && (
                  <Icon name="check" size={10} color={stepConfig.color} />
                )}
              </div>
              {i === config.step && config.step !== -1 && (
                <p style={{ fontSize: '0.75rem', color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>
                  {stepConfig.description}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── ORDER CARD ────────────────────────────────────────────────── */
function OrderCard({ order, index, theme, onClick }) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const isActive = ['pending', 'accepted', 'in_progress'].includes(order.status);
  const progress = config.progress;

  return (
    <motion.div
      key={order.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      layout
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div style={{
        position: 'relative',
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 20,
        padding: 24,
        overflow: 'hidden',
        transition: 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(255,122,0,0.3)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = theme.cardBorder; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {/* Progress bar at top */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          transition={{ duration: 0.8, delay: index * 0.06 + 0.2, type: 'spring', stiffness: 100 }}
          style={{
            position: 'absolute', top: 0, left: 0, height: 3, width: '100%',
            background: `linear-gradient(90deg, #FF7A00, #22D31B)`,
            transformOrigin: 'left',
            borderRadius: '20px 20px 0 0',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          {/* Category/Service icon */}
          <div style={{
            width: 56, height: 56, flexShrink: 0,
            borderRadius: 16,
            background: config.bg,
            border: `1px solid ${config.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem',
          }}>
            <Icon name={config.icon} size={24} color={config.color} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <h3 style={{
                fontFamily: 'var(--display)',
                fontWeight: 700,
                fontSize: '1.1rem',
                color: theme.text,
                margin: 0,
                lineHeight: 1.3,
                flex: 1,
              }}>
                {order.service_title || 'Serviço'}
              </h3>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 999,
                fontSize: '0.7rem', fontWeight: 800,
                fontFamily: 'var(--body)',
                background: config.bg, color: config.color,
                border: `1px solid ${config.border}`,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                <Icon name={config.icon} size={11} />
                {config.shortLabel}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: '0.78rem', color: theme.textMuted }}>
              {order.worker_name && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="users" size={12} />
                  {order.worker_name}
                </span>
              )}
              {order.city && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="mapPin" size={12} />
                  {order.city}
                </span>
              )}
              {order.created_at && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="calendar" size={12} />
                  {formatarData(order.created_at)}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 100 }}>
            <p style={{
              fontFamily: 'var(--display)', fontWeight: 900, fontSize: '1.3rem',
              color: theme.text, margin: 0, lineHeight: 1,
            }}>
              {formatarMoeda(order.price)}
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: theme.textMuted, marginTop: 4 }}>
              Valor total
            </p>
          </div>
        </div>

        {/* Timeline progress for active orders */}
        {isActive && order.status !== 'pending' && (
          <div style={{ marginBottom: 20, paddingLeft: 4 }}>
            <OrderTimeline order={order} theme={theme} />
          </div>
        )}

        {/* Footer actions */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 16, borderTop: `1px solid ${theme.line}`, gap: 12,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--display)', fontWeight: 700, fontSize: '0.85rem',
              color: '#FF7A00',
            }}>
              Ver detalhes
            </span>
            <Icon name="chevronRight" size={16} color="#FF7A00" />
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {isActive && (
              <button
                onClick={(e) => { e.stopPropagation(); window.open(`/cliente/conversas?order=${order.id}`, '_blank'); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #FF7A00, #FF9A33)',
                  color: '#fff', fontWeight: 700, fontSize: '0.78rem',
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--body)',
                  boxShadow: '0 4px 16px rgba(255,122,0,0.25)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,122,0,0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,122,0,0.25)'; }}
              >
                <Icon name="message" size={13} />
                Chat
              </button>
            )}
            {order.status === 'completed' && (
              <button
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 10,
                  background: 'transparent', color: '#22D31B', fontWeight: 700, fontSize: '0.78rem',
                  border: '1.5px solid #22D31B', cursor: 'pointer',
                  fontFamily: 'var(--body)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,211,27,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon name="star" size={13} />
                Avaliar
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── EMPTY STATE ───────────────────────────────────────────────── */
function EmptyState({ filter, theme, onCreateQuote }) {
  const messages = {
    all: { title: 'Nenhum pedido ainda', desc: 'Seu primeiro serviço está a um clique de distância. Publique o que precisa e receba propostas.', action: 'Criar primeiro pedido' },
    active: { title: 'Nenhum pedido ativo', desc: 'Pedidos em andamento aparecerão aqui automaticamente.', action: 'Buscar serviços' },
    pending: { title: 'Nenhum pedido pendente', desc: 'Todos os seus pedidos foram respondidos ou não há pendências no momento.', action: 'Ver todos' },
    completed: { title: 'Nenhum pedido concluído', desc: 'Seus serviços finalizados aparecerão aqui. Cada conclusão rende pontos!', action: 'Buscar serviços' },
    cancelled: { title: 'Nenhum pedido cancelado', desc: 'Ótimo! Você não tem pedidos cancelados.', action: 'Ver todos' },
  };

  const msg = messages[filter] || messages.all;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: theme.cardBg,
        border: `1px dashed ${theme.line}`,
        borderRadius: 24,
        padding: '60px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{
        width: 100, height: 100, margin: '0 auto 24px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(255,122,0,0.10), rgba(34,211,27,0.10))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${theme.line}`,
      }}>
        <Icon name="package" size={40} color={theme.textMuted} />
      </div>
      <h3 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.4rem', color: theme.text, marginBottom: 8 }}>
        {msg.title}
      </h3>
      <p style={{ color: theme.textMuted, fontSize: '0.9rem', maxWidth: 380, margin: '0 auto 28px', lineHeight: 1.6 }}>
        {msg.desc}
      </p>
      <button
        onClick={onCreateQuote}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #FF7A00, #FF9A33)',
          color: '#fff', fontWeight: 800, fontSize: '0.9rem',
          padding: '14px 28px', border: 'none', borderRadius: 14,
          cursor: 'pointer', boxShadow: '0 8px 24px rgba(255,122,0,0.30)',
          fontFamily: 'var(--body)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(255,122,0,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,122,0,0.30)'; }}
      >
        <Icon name="sparkle" size={16} />
        {msg.action}
      </button>
    </motion.div>
  );
}

/* ─── STATS CARDS ───────────────────────────────────────────────── */
function StatsCard({ label, value, icon, color, bgColor, borderColor, delay, theme, prefix = '', suffix = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      style={{
        position: 'relative',
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 20,
        padding: 24,
        overflow: 'hidden',
        transition: 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = theme.cardBorder; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: `linear-gradient(90deg, ${color}, ${bgColor})`,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: '0.62rem', fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.textMuted,
        }}>
          {label}
        </span>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={18} color={color} />
        </div>
      </div>

      <p style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: '2.2rem', color: color, lineHeight: 1, margin: 0 }}>
        {prefix}<Counter target={value} suffix={suffix} />{suffix}
      </p>
    </motion.div>
  );
}

/* ─── SEARCH & FILTER BAR ───────────────────────────────────────── */
function SearchFilterBar({ query, setQuery, filter, setFilter, sort, setSort, sortOpen, setSortOpen, orders, theme }) {
  const activeCount = orders.filter(o => ['pending', 'accepted', 'in_progress'].includes(o.status)).length;
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
  const counts = { all: orders.length, active: activeCount, pending: pendingCount, completed: completedCount, cancelled: cancelledCount };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      style={{ marginBottom: 24 }}
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: theme.cardBg, border: `1px solid ${theme.line}`,
            borderRadius: 14, padding: '0 16px', transition: 'border-color 0.2s, box-shadow 0.2s',
          }}>
            <Icon name="search" size={18} color={theme.textMuted} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por serviço, profissional, cidade..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.92rem', color: theme.text, fontFamily: 'var(--body)', fontWeight: 500, padding: '14px 0' }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.textMuted, padding: 4 }}>
                <Icon name="x" size={16} />
              </button>
            )}
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setSortOpen(o => !o)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 16px', borderRadius: 12,
              border: `1px solid ${theme.line}`, background: theme.cardBg,
              fontSize: '0.82rem', fontWeight: 600, color: theme.textMuted,
              cursor: 'pointer', fontFamily: 'var(--body)', whiteSpace: 'nowrap',
              transition: 'all 0.2s', height: '100%', minHeight: 50,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,122,0,0.4)'; e.currentTarget.style.color = theme.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = theme.line; e.currentTarget.style.color = theme.textMuted; }}
          >
            <Icon name="sort" size={15} />
            {SORTS.find(s => s.key === sort)?.label}
            <Icon name="arrowDown" size={12} />
          </button>
          <AnimatePresence>
            {sortOpen && (
              <>
                <div onClick={() => setSortOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    minWidth: 200, background: theme.cardBg,
                    border: `1px solid ${theme.line}`, borderRadius: 12,
                    padding: 6, zIndex: 40, boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                  }}
                >
                  {SORTS.map(s => (
                    <button
                      key={s.key}
                      onClick={() => { setSort(s.key); setSortOpen(false); }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '10px 12px', borderRadius: 8,
                        border: 'none', background: sort === s.key ? 'rgba(255,122,0,0.10)' : 'transparent',
                        color: sort === s.key ? '#FF7A00' : theme.text,
                        fontWeight: sort === s.key ? 700 : 500, fontSize: '0.82rem',
                        cursor: 'pointer', fontFamily: 'var(--body)',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 10,
              border: `1px solid ${filter === f.key ? 'transparent' : theme.line}`,
              background: filter === f.key ? 'linear-gradient(135deg, #FF7A00, #FF9A33)' : theme.cardBg,
              fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap',
              color: filter === f.key ? '#fff' : theme.textMuted,
              cursor: 'pointer', fontFamily: 'var(--body)',
              transition: 'all 0.2s', boxShadow: filter === f.key ? '0 6px 20px rgba(255,122,0,0.25)' : 'none',
            }}
            onMouseEnter={(e) => { if (filter !== f.key) { e.currentTarget.style.borderColor = 'rgba(255,122,0,0.4)'; e.currentTarget.style.color = theme.text; } }}
            onMouseLeave={(e) => { if (filter !== f.key) { e.currentTarget.style.borderColor = theme.line; e.currentTarget.style.color = theme.textMuted; } }}
          >
            <Icon name={f.icon} size={13} />
            {f.label}
            <span style={{
              fontFamily: 'var(--mono)', fontSize: '0.62rem', fontWeight: 700,
              padding: '2px 8px', borderRadius: 999,
              background: filter === f.key ? 'rgba(255,255,255,0.25)' : theme.line,
              color: filter === f.key ? '#fff' : theme.textMuted,
            }}>
              {counts[f.key] || 0}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── INSIGHT CARD ──────────────────────────────────────────────── */
function InsightCard({ theme }) {
  const insights = [
    { icon: 'sparkle', title: 'Responda rápido', desc: 'Pedidos com resposta em 15 min recebem 3x mais propostas de qualidade.', color: '#FF7A00', bg: 'rgba(255,122,0,0.08)' },
    { icon: 'shield', title: 'Segurança total', desc: 'Pagamento só é liberado após você confirmar a conclusão do serviço.', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
    { icon: 'star', title: 'Avalie e ganhe', desc: 'Cada avaliação rende pontos que viram desconto no próximo pedido.', color: '#22D31B', bg: 'rgba(34,211,27,0.08)' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12,
      }}
    >
      {insights.map((insight, i) => (
        <motion.div
          key={insight.title}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
          style={{
            padding: 20, borderRadius: 16,
            background: insight.bg, border: `1px solid ${insight.color}33`,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${insight.color}22`; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: insight.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <Icon name={insight.icon} size={18} color={insight.color} />
          </div>
          <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '0.9rem', color: theme.text, margin: '0 0 6px' }}>
            {insight.title}
          </p>
          <p style={{ fontSize: '0.78rem', color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>
            {insight.desc}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ─── MAIN COMPONENT ────────────────────────────────────────────── */
export default function ClientOrdersPage() {
  const { user } = usarAutenticacao();
  const toast = useToast();
  const { darkMode } = usarTema();
  const theme = obterCoresTema(darkMode);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [query, setQuery] = useState('');
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    servicoPedidos.listarTodos()
      .then(d => setOrders(d.orders || []))
      .catch(() => toast('Erro ao carregar pedidos', 'error'))
      .finally(() => setLoading(false));
  }, []);

  /* ── Stats ────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const total = orders.length;
    const active = orders.filter(o => ['pending', 'accepted', 'in_progress'].includes(o.status)).length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const totalSpent = orders
      .filter(o => o.status === 'completed')
      .reduce((s, o) => s + (parseFloat(o.price) || 0), 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    return { total, active, completed, totalSpent, pending };
  }, [orders]);

  /* ── Filter & Sort Logic ──────────────────────────────────────── */
  const visible = useMemo(() => {
    let list = [...orders];

    if (filter === 'active') list = list.filter(o => ['pending', 'accepted', 'in_progress'].includes(o.status));
    else if (filter !== 'all') list = list.filter(o => o.status === filter);

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(x =>
        x.service_title?.toLowerCase().includes(q) ||
        x.worker_name?.toLowerCase().includes(q) ||
        x.city?.toLowerCase().includes(q) ||
        x.id?.toString().includes(q)
      );
    }

    switch (sort) {
      case 'budget': case 'price_high': list.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)); break;
      case 'price_low': list.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)); break;
      case 'oldest': list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)); break;
      case 'status': list.sort((a, b) => (STATUS_CONFIG[b.status]?.step || 0) - (STATUS_CONFIG[a.status]?.step || 0)); break;
      default: list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
    return list;
  }, [orders, filter, sort, query]);

  const leaves = Array.from({ length: 12 }, (_, i) => ({
    delay: i * 1.2 + 0.3,
    x: (i * 8.7) % 100,
    size: 12 + (i % 3) * 4,
    color: i % 2 === 0 ? '#22D31B' : '#FF9A33',
    duration: 10 + (i % 5),
  }));

  return (
    <LayoutPainel>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,700;0,900;1,500;1,700&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        :root { --display: 'Fraunces', serif; --body: 'Inter', sans-serif; --mono: 'IBM Plex Mono', monospace; }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        .o-eyebrow {
          font-family: var(--mono); font-size: 0.7rem; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase; color: ${theme.mono};
          display: inline-flex; align-items: center; gap: 8px;
        }
        .o-eyebrow::before { content: ''; width: 22px; height: 1.5px; background: #FF7A00; display: inline-block; }

        .o-search-input { flex: 1; background: transparent; border: none; outline: none; font-size: 0.92rem; color: ${theme.text}; font-family: var(--body); font-weight: 500; padding: 14px 0; }
        .o-search-input::placeholder { color: ${theme.textMuted}; }

        .o-filter-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 16px; border-radius: 10px; white-space: nowrap;
          border: 1px solid ${theme.line}; background: ${theme.cardBg};
          font-size: 0.78rem; font-weight: 700; color: ${theme.textMuted};
          cursor: pointer; transition: all 0.2s; font-family: var(--body);
        }
        .o-filter-chip:hover { border-color: rgba(255,122,0,0.4); color: ${theme.text}; }
        .o-filter-chip.active { background: linear-gradient(135deg, #FF7A00, #FF9A33); color: #fff; border-color: transparent; box-shadow: 0 6px 20px rgba(255,122,0,0.25); }

        .o-stat-card { position: relative; background: ${theme.cardBg}; border: 1px solid ${theme.cardBorder}; border-radius: 20px; padding: 24px; overflow: hidden; transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s; }
        .o-stat-card:hover { transform: translateY(-4px); border-color: rgba(255,122,0,0.3); box-shadow: 0 16px 40px rgba(0,0,0,0.08); }

        .o-order-card { position: relative; background: ${theme.cardBg}; border: 1px solid ${theme.cardBorder}; border-radius: 20px; padding: 24px; transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s; overflow: hidden; }
        .o-order-card:hover { transform: translateY(-4px); border-color: rgba(255,122,0,0.3); box-shadow: 0 20px 50px rgba(0,0,0,0.08); }
        .o-order-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 3; background: linear-gradient(90deg, #FF7A00, #22D31B); transform: scaleX(var(--progress, 0)); transform-origin: left; transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 20px 20px 0 0; }

        .o-action-btn { display: inline-flex; align-items: center; justify-content: center; padding: 8px 14px; border-radius: 10px; fontWeight: 700; fontSize: 0.78rem; font-family: var(--body); cursor: pointer; transition: all 0.2s; border: none; }
        .o-action-btn.primary { background: linear-gradient(135deg, #FF7A00, #FF9A33); color: #fff; box-shadow: 0 4px 16px rgba(255,122,0,0.25); }
        .o-action-btn.primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,122,0,0.35); }
        .o-action-btn.secondary { background: transparent; color: #22D31B; border: 1.5px solid #22D31B; }
        .o-action-btn.secondary:hover { background: rgba(34,211,27,0.1); }
        .o-action-btn.ghost { background: transparent; color: ${theme.textMuted}; border: 1px solid ${theme.line}; }
        .o-action-btn.ghost:hover { background: rgba(255,122,0,0.08); border-color: rgba(255,122,0,0.3); color: #FF7A00; }

        .o-pulse { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 8px; height: 8px; border-radius: 50%; }
        .o-pulse::before { content: ''; position: absolute; inset: -3px; border-radius: 50%; background: currentColor; opacity: 0.4; animation: pulse 1.8s ease-out infinite; }
        @keyframes pulse { 0% { transform: scale(0.8); opacity: 0.5; } 70% { transform: scale(2.5); opacity: 0; } 100% { transform: scale(2.5); opacity: 0; } }

        @media (max-width: 768px) {
          .o-header-flex { flex-direction: column; align-items: flex-start !important; gap: 16px; }
          .o-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) { .o-stats-grid { grid-template-columns: 1fr !important; } }
        @media (min-width: 769px) {
          .client-wide-page { max-width: none !important; margin: 0 !important; padding-left: 120px !important; padding-right: 120px !important; }
        }
      `}</style>



      <div className="client-wide-page" style={{ position: 'relative', zIndex: 1, padding: '24px 24px 80px', maxWidth: 'none', margin: '0 auto', fontFamily: 'var(--body)', background: 'transparent' }}>

        {/* ─── HEADER ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}
          className="o-header-flex"
        >
          <div>
            <div className="o-eyebrow" style={{ marginBottom: 10 }}>Meus pedidos</div>
            <h1 style={{
              fontFamily: 'var(--display)', fontWeight: 900,
              fontSize: 'clamp(2rem, 4vw, 2.8rem)', letterSpacing: '-0.025em',
              lineHeight: 1.05, color: theme.text, margin: 0,
            }}>
              Meus <span style={{ color: '#FF7A00', fontStyle: 'italic' }}>Pedidos</span>
            </h1>
            <p style={{ color: theme.textMuted, fontSize: '0.95rem', marginTop: 8, maxWidth: 520 }}>
              Acompanhe o status de cada serviço em tempo real. Do pedido à conclusão, tudo no seu radar.
            </p>
          </div>

          <Link href="/cliente/orcamentos" style={{ alignSelf: 'flex-end' }}>
            <button style={{
              position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #FF7A00, #FF9A33)', color: '#fff',
              fontWeight: 800, fontSize: '0.9rem', padding: '13px 22px',
              border: 'none', borderRadius: 12, cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(255,122,0,0.30)', fontFamily: 'var(--body)',
              overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(255,122,0,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,122,0,0.30)'; }}
            >
              <Icon name="package" size={17} color="#fff" />
              Novo pedido
            </button>
          </Link>
        </motion.div>

        {/* ─── KPI STRIP ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}
          className="o-stats-grid"
        >
          <StatsCard
            label="Total" value={stats.total} icon="package"
            color={theme.text} bgColor={theme.line} borderColor={theme.line} delay={0} theme={theme}
          />
          <StatsCard
            label="Ativos" value={stats.active} icon="truck"
            color="#3B82F6" bgColor="rgba(59,130,246,0.15)" borderColor="#3B82F6" delay={0.05} theme={theme}
          />
          <StatsCard
            label="Concluídos" value={stats.completed} icon="check"
            color="#22D31B" bgColor="rgba(34,211,27,0.15)" borderColor="#22D31B" delay={0.1} theme={theme}
          />
          <StatsCard
            label="Investido" value={Math.round(stats.totalSpent)} icon="money"
            color="#FF7A00" bgColor="rgba(255,122,0,0.15)" borderColor="#FF7A00" delay={0.15} theme={theme} prefix="R$ "
          />
        </motion.div>

        {/* ─── SEARCH + FILTER + SORT ────────────────────────────── */}
        <SearchFilterBar
          query={query} setQuery={setQuery}
          filter={filter} setFilter={setFilter}
          sort={sort} setSort={setSort}
          sortOpen={sortOpen} setSortOpen={setSortOpen}
          orders={orders} theme={theme}
        />

        {/* ─── ORDERS LIST ───────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[0,1,2].map(i => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.4 }}>
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.line}`, borderRadius: 20, padding: 24, height: 180 }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: theme.line, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 24, background: theme.line, borderRadius: 8, marginBottom: 12, width: '60%' }} />
                      <div style={{ height: 16, background: theme.line, borderRadius: 8, marginBottom: 8, width: '40%' }} />
                      <div style={{ height: 16, background: theme.line, borderRadius: 8, width: '80%' }} />
                    </div>
                    <div style={{ width: 100, textAlign: 'right' }}>
                      <div style={{ height: 32, background: theme.line, borderRadius: 8, marginBottom: 8, marginLeft: 'auto', width: '80%' }} />
                      <div style={{ height: 16, background: theme.line, borderRadius: 8, marginLeft: 'auto', width: '60%' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState filter={filter} theme={theme} onCreateQuote={() => window.location.href = '/cliente/orcamentos'} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {visible.map((o, i) => (
              <OrderCard key={o.id} order={o} index={i} theme={theme} />
            ))}
          </div>
        )}

        {/* ─── INSIGHTS ──────────────────────────────────────────── */}
        {!loading && orders.length > 0 && <InsightCard theme={theme} />}

        <div style={{ height: 40 }} />
      </div>
    </LayoutPainel>
  );
}
