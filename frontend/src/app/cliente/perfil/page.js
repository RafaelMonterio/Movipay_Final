'use client';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import EnvioAvatar from '@/componentes/interface/EnvioAvatar';
import CampoEntrada from '@/componentes/interface/CampoEntrada';
import { ProfileEsqueleto } from '@/componentes/interface/Esqueleto';
import { useToast } from '@/componentes/interface/Notificacao';
import { usarAutenticacao } from '@/contexto/contextoAutenticacao';
import { usarFormulario, rules } from '@/ganchos/usarFormulario';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import api from '@/servicos/clienteApi';
import { formatarMoeda, formatarData } from '@/utilitarios/formatadores';
import SharedIcon from '@/componentes/interface/Icone';

/* ─── FOLHAS — moeda de desconto do MoviPay ────────────────────────
   1 folha = R$ 0,04 em desconto acumulado. Resgatável em cupons por
   faixa de saldo. Reaproveita o saldo de pontos existente do usuário,
   só que com identidade visual própria (combina com o mascote de
   formigas + folhas do restante do app). */
const FOLHA_VALUE = 0.04;


/* ─── DESIGN TOKENS ─────────────────────────────────────────────── */
// Display: Fraunces · Body: Inter · Mono: IBM Plex Mono
// Acentos: Laranja #FF7A00 · Verde #22D31B

/* ─── SVG ICONS ─────────────────────────────────────────────────── */
function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 1.8, style }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  switch (name) {
    case 'star': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" style={style}><polygon points="12 2 15.09 8.63 22 9.24 16.5 14.14 18.18 21 12 17.27 5.82 21 7.5 14.14 2 9.24 8.91 8.63 12 2" /></svg>;
    case 'starOutline': return <svg {...p}><polygon points="12 2 15.09 8.63 22 9.24 16.5 14.14 18.18 21 12 17.27 5.82 21 7.5 14.14 2 9.24 8.91 8.63 12 2" /></svg>;
    case 'check': return <svg {...p}><polyline points="20 6 9 17 4 12" /></svg>;
    case 'x': return <svg {...p}><line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" /></svg>;
    case 'clock': return <svg {...p}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" /></svg>;
    case 'users': return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'edit': return <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
    case 'phone': return <svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
    case 'mail': return <svg {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
    case 'mapPin': return <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    case 'calendar': return <svg {...p}><rect x="3" y="4" width="18" height="17" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case 'trophy': return <svg {...p}><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" /><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" /><path d="M6 3h12v6a6 6 0 0 1-12 0V3z" /><line x1="12" y1="15" x2="12" y2="21" /><polyline points="9 21 15 21" /></svg>;
    case 'flame': return <svg {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>;
    case 'target': return <svg {...p}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
    case 'sparkle': return <svg {...p}><path d="M12 2l1.5 5h5L14 10.5l1.5 5L12 13l-3.5 2.5L10 10.5 5.5 7h5z" /></svg>;
    case 'bolt': return <svg {...p}><polygon points="13 2 3 14 11 14 9 22 21 10 13 10 13 2" /></svg>;
    case 'shield': return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    case 'crown': return <svg {...p}><path d="M2 18h20l-2-10-5 4-3-7-3 7-5-4z" /></svg>;
    case 'heart': return <svg {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
    case 'award': return <svg {...p}><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>;
    case 'gift': return <svg {...p}><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>;
    case 'trendingUp': return <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
    case 'lock': return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
    case 'sair': return <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
    case 'swap': return <svg {...p}><polyline points="16 3 21 3 21 8" /><line x1="4" y1="14" x2="21" y2="14" /><polyline points="8 21 3 21 3 16" /><line x1="20" y1="10" x2="3" y2="10" /><polyline points="8 21 3 21 3 16" /></svg>;
    case 'camera': return <svg {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
    case 'userCheck': return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>;
    case 'clock2': return <svg {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
    case 'settings': return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
    case 'info': return <svg {...p}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;
    case 'briefcase': return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
    case 'rocket': return <svg {...p}><path d="M4 14.899A7 7 0 0 1 6 2h12a7 7 0 0 1 2 12.899V21l-4-2-3 2-3-2-4 2z" /><path d="M9 9h.01" /><path d="M15 9h.01" /></svg>;
    case 'medal': return <svg {...p}><circle cx="12" cy="9" r="6" /><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" /></svg>;
    case 'eye': return <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
    case 'message': return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    default: return null;
  }
}

/* ─── LEVEL CONFIG ─────────────────────────────────────────────── */
const LEVELS = [
  { name: 'Formiga VIP · Operária', icon: 'sprout', color: '#22C55E', min: 0, max: 300, desc: 'Comece sua jornada na colônia.' },
  { name: 'Formiga VIP · Voadora', icon: 'sparkle', color: '#22D3EE', min: 300, max: 1000, desc: 'Mais benefícios para quem está sempre em movimento.' },
  { name: 'Formiga VIP · Rainha', icon: 'crown', color: '#F59E0B', min: 1000, max: Infinity, desc: 'Nível máximo de benefícios MoviPay.' },
];

/* ─── ACHIEVEMENTS ─────────────────────────────────────────────── */
const ACHIEVEMENTS = [
  { id: 'first_order', name: 'Primeiro Pedido', desc: 'Fez seu primeiro pedido', icon: 'sparkle', color: '#FF7A00', unlocked: false },
  { id: 'five_orders', name: 'Cliente Frequente', desc: '5 pedidos concluídos', icon: 'users', color: '#3B82F6', unlocked: false },
  { id: 'ten_orders', name: 'Veterano', desc: '10 pedidos concluídos', icon: 'award', color: '#22D31B', unlocked: false },
  { id: 'reviewer', name: 'Avaliador', desc: 'Avaliou 3 serviços', icon: 'star', color: '#FFD700', unlocked: false },
  { id: 'loyal', name: 'Cliente Fiel', desc: 'Membro há mais de 1 ano', icon: 'heart', color: '#EC4899', unlocked: false },
  { id: 'big_spender', name: 'Investidor', desc: 'Gastou mais de R$ 5.000', icon: 'trendingUp', color: '#FF7A00', unlocked: false },
];

/* ─── ANIMATED COUNTER ──────────────────────────────────────────── */
function Counter({ target, suffix = '', prefix = '', duration = 1.2 }) {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView) return;
    const steps = 60, dur = duration * 1000;
    let cur = 0;
    const inc = target / steps;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setV(target); clearInterval(t); }
      else setV(cur);
    }, dur / steps);
    return () => clearInterval(t);
  }, [inView, target, duration]);

  return <span ref={ref}>{prefix}{Math.floor(v).toLocaleString('pt-BR')}{suffix}</span>;
}

/* ─── FLOATING LEAVES ───────────────────────────────────────────── */
function FloatingLeaf({ delay, x, size, color, duration }) {
  return (
    <motion.div style={{ position: 'absolute', top: 0, left: x + '%', pointerEvents: 'none', zIndex: 0 }} initial={{ y: -40, opacity: 0, rotate: 0 }} animate={{ y: '120vh', opacity: [0, 0.5, 0.5, 0], rotate: [0, 180, 360, 540] }} transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}>
      <span style={{ display: 'inline-flex', opacity: 0.5 }}><SharedIcon name="leaf" size={size} color={color} /></span>
    </motion.div>
  );
}

/* ─── LEVEL PROGRESS ────────────────────────────────────────────── */
function LevelProgress({ points, level, nextLevel, theme }) {
  const progress = nextLevel ? (points - level.min) / (nextLevel.min - level.min) * 100 : 100;
  const toNext = nextLevel ? nextLevel.min - points : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      style={{ padding: 20, borderRadius: 18, background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
          <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="26" cy="26" r="22" fill="none" stroke={theme.line} strokeWidth="5" />
            <motion.circle
              cx="26" cy="26" r="22" fill="none"
              stroke="url(#levelGrad)" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 22}
              initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - progress / 100) }}
              transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="levelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF7A00" />
                <stop offset="100%" stopColor="#22D31B" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            <SharedIcon name={level.icon} size={28} color={level.color} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1rem', color: theme.text }}>{level.name}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: level.color + '22', color: level.color }}>NÍVEL</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: theme.textMuted, margin: 0 }}>{level.desc}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: '0.85rem', color: theme.text }}>
          <Counter target={points} prefix="R$ " suffix=" pts" duration={0.8} />
        </span>
        {nextLevel ? (
          <span style={{ fontSize: '0.72rem', color: theme.textMuted }}>
            Faltam <strong style={{ color: level.color }}><Counter target={toNext} duration={1} /> pts</strong> para {nextLevel.name}
          </span>
        ) : (
          <span style={{ fontSize: '0.72rem', color: level.color, fontWeight: 700 }}>Nível máximo!</span>
        )}
      </div>

      <div style={{ width: '100%', height: 8, background: theme.line, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
        <motion.div
          style={{ height: '100%', background: 'linear-gradient(90deg, #FF7A00, #22D31B)', borderRadius: 4, position: 'relative' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
        >
          <motion.div
            style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.3)' }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── STAT CARD ─────────────────────────────────────────────────── */
function CartaoEstatistica({ icon, label, value, suffix = '', color, bgColor, delay, theme }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.03 }}
      style={{
        padding: 18, borderRadius: 16, background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`, display: 'flex', alignItems: 'center', gap: 14,
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,122,0,0.3)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = theme.cardBorder; }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={22} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: '1.5rem', color: theme.text, lineHeight: 1 }}>
            <Counter target={value} suffix={suffix} duration={1} />
          </span>
        </div>
        <p style={{ fontSize: '0.72rem', color: theme.textMuted, marginTop: 4, fontWeight: 600 }}>{label}</p>
      </div>
    </motion.div>
  );
}

/* ─── ACHIEVEMENT CARD ──────────────────────────────────────────── */
function AchievementCard({ achievement, index, theme }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ scale: 1.05 }}
      style={{
        padding: 16, borderRadius: 16, textAlign: 'center',
        background: achievement.unlocked ? achievement.color + '15' : theme.cardBg,
        border: `1px solid ${achievement.unlocked ? achievement.color + '40' : theme.cardBorder}`,
        opacity: achievement.unlocked ? 1 : 0.5,
        transition: 'all 0.2s',
      }}
      title={achievement.unlocked ? achievement.name : `${achievement.name} (bloqueado)`}
    >
      <div style={{
        width: 48, height: 48, margin: '0 auto 8px', borderRadius: '50%',
        background: achievement.unlocked ? achievement.color + '22' : theme.line,
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      }}>
        <Icon name={achievement.icon} size={22} color={achievement.unlocked ? achievement.color : theme.textMuted} />
        {achievement.unlocked && (
          <motion.div
            style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: `2px solid ${achievement.color}`, }}
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.6 }} transition={{ delay: index * 0.05 + 0.2, type: 'spring' }}
          />
        )}
      </div>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: theme.text, margin: '0 0 2px', lineHeight: 1.2 }}>{achievement.name}</p>
      <p style={{ fontSize: '0.62rem', color: theme.textMuted, margin: 0, lineHeight: 1.3 }}>{achievement.desc}</p>
    </motion.div>
  );
}

/* ─── PROFILE HEADER ────────────────────────────────────────────── */
function ProfileHeader({ profile, theme, points, level, onEdit }) {
  const initials = profile?.name ? profile.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : 'MP';
  const memberSince = profile?.created_at ? new Date(profile.created_at).getFullYear()() : new Date().getFullYear();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A33 40%, #22D31B 100%)', padding: '32px 24px', color: '#fff', marginBottom: 24 }}
    >
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -30, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'absolute', top: 20, left: 30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.6)' }} />
          ) : (
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', border: '4px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: 800, backdropFilter: 'blur(4px)' }}>
              {initials}
            </div>
          )}
          <motion.div
            style={{ position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: '50%', background: level.color, border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
          >
            <SharedIcon name={level.icon} size={28} color={level.color} />
          </motion.div>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: '1.8rem', margin: 0, lineHeight: 1.1 }}>
            {profile?.name || 'Cliente MoviPay'}
          </h1>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: '4px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="mail" size={14} />
            {profile?.email || 'conta@movipay.com'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
              <Icon name="users" size={13} />
              Cliente
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
              <Icon name="calendar" size={13} />
              Desde {memberSince}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
              <Icon name="star" size={13} />
              {level.name}
            </span>
          </div>
        </div>

        <button
          onClick={onEdit}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 20px', borderRadius: 12,
            background: 'rgba(255,255,255,0.25)', color: '#fff',
            fontWeight: 800, fontSize: '0.85rem', border: '2px solid rgba(255,255,255,0.4)',
            cursor: 'pointer', fontFamily: 'var(--body)', transition: 'all 0.2s',
            backdropFilter: 'blur(4px)', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'none'; }}
        >
          <Icon name="edit" size={15} />
          Editar perfil
        </button>
      </div>
    </motion.div>
  );
}

/* ─── CONTACT CARD ──────────────────────────────────────────────── */
function ContactCard({ profile, theme }) {
  const items = [
    { icon: 'mail', label: 'E-mail', value: profile?.email || '—' },
    { icon: 'phone', label: 'Telefone', value: profile?.phone || 'Não informado' },
    { icon: 'mapPin', label: 'Localização', value: profile?.city || 'São Paulo, SP' },
  ];

  return (
    <div style={{ padding: 20, borderRadius: 18, background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
      <h3 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1rem', color: theme.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="info" size={18} color="#FF7A00" />
        Contato
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,122,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={item.icon} size={16} color="#FF7A00" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.65rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, fontFamily: 'var(--mono)', margin: 0 }}>{item.label}</p>
              <p style={{ fontSize: '0.85rem', color: theme.text, margin: '2px 0 0', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── BIO SECTION ───────────────────────────────────────────────── */
function BioSection({ profile, theme, onEdit }) {
  return (
    <div style={{ padding: 20, borderRadius: 18, background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1rem', color: theme.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="heart" size={18} color="#22D31B" />
          Sobre mim
        </h3>
        {!profile?.bio && (
          <button onClick={onEdit} style={{ background: 'transparent', border: 'none', color: '#FF7A00', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="edit" size={12} />
            Adicionar
          </button>
        )}
      </div>
      {profile?.bio ? (
        <p style={{ fontSize: '0.9rem', color: theme.text, lineHeight: 1.6, margin: 0 }}>{profile.bio}</p>
      ) : (
        <p style={{ fontSize: '0.85rem', color: theme.textMuted, margin: 0, fontStyle: 'italic' }}>
          Conte um pouco sobre você para os profissionais te conhecerem melhor.
        </p>
      )}
    </div>
  );
}

/* ─── EDIT FORM ─────────────────────────────────────────────────── */
function EditForm({ profile, form, onSave, onCancel, saving, theme, userMode }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      style={{ padding: 24, borderRadius: 18, background: theme.cardBg, border: `1px solid rgba(255,122,0,0.3)` }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.1rem', color: theme.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="edit" size={20} color="#FF7A00" />
          Editar informações
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6, fontFamily: 'var(--body)' }}>
            Nome *
          </label>
          <input
            value={form.values.name}
            onChange={e => form.handleChange('name', e.target.value)}
            onBlur={() => form.handleBlur('name')}
            placeholder="Seu nome completo"
            style={{ width: '100%', background: theme.cardBg === undefined ? '#fff' : theme.bg, border: `1.5px solid ${form.errors.name && form.touched.name ? '#B83A08' : theme.line}`, borderRadius: 12, padding: '12px 14px', fontSize: '0.9rem', color: theme.text, fontFamily: 'var(--body)', outline: 'none', transition: 'border-color 0.2s' }}
          />
          {form.touched.name && form.errors.name && <p style={{ color: '#B83A08', fontSize: '0.72rem', marginTop: 4 }}>{form.errors.name}</p>}
        </div>

        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6, fontFamily: 'var(--body)' }}>
            Telefone
          </label>
          <input
            value={form.values.phone}
            onChange={e => form.handleChange('phone', e.target.value)}
            placeholder="(11) 99999-9999"
            style={{ width: '100%', background: theme.bg, border: `1.5px solid ${theme.line}`, borderRadius: 12, padding: '12px 14px', fontSize: '0.9rem', color: theme.text, fontFamily: 'var(--body)', outline: 'none', transition: 'border-color 0.2s' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6, fontFamily: 'var(--body)' }}>
            Bio
          </label>
          <textarea
            value={form.values.bio}
            onChange={e => form.handleChange('bio', e.target.value)}
            placeholder="Fale um pouco sobre você..."
            rows={3}
            style={{ width: '100%', background: theme.bg, border: `1.5px solid ${theme.line}`, borderRadius: 12, padding: '12px 14px', fontSize: '0.9rem', color: theme.text, fontFamily: 'var(--body)', outline: 'none', resize: 'vertical', minHeight: 80, transition: 'border-color 0.2s' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <button
            onClick={onSave}
            disabled={saving}
            style={{
              flex: 1, background: saving ? '#999' : 'linear-gradient(135deg, #FF7A00, #FF9A33)', color: '#fff',
              fontWeight: 800, fontSize: '0.9rem', padding: '13px', border: 'none', borderRadius: 12,
              cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: saving ? 'none' : '0 6px 20px rgba(255,122,0,0.3)', transition: 'all 0.2s', fontFamily: 'var(--body)',
            }}
            onMouseEnter={e => !saving && e.currentTarget.style.transform === 'none' && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            {saving ? (
              <>
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Icon name="clock" size={16} color="#fff" /></motion.span>
                Salvando...
              </>
            ) : (
              <>
                <Icon name="check" size={16} color="#fff" />
                Salvar alterações
              </>
            )}
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '13px 24px', background: 'transparent', color: theme.textMuted,
              fontWeight: 700, fontSize: '0.9rem', border: `1.5px solid ${theme.line}`, borderRadius: 12,
              cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--body)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,58,8,0.08)'; e.currentTarget.style.borderColor = '#B83A08'; e.currentTarget.style.color = '#B83A08'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = theme.line; e.currentTarget.style.color = theme.textMuted; }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── ACTIONS CARD ──────────────────────────────────────────────── */
function ActionsCard({ user, alternarModo, sair, theme, router }) {
  const actions = [
    { icon: 'swap', label: 'Trocar para trabalhador', desc: 'Ofereça seus serviços', onClick: () => alternarModo('worker'), color: '#FF7A00', bg: 'rgba(255,122,0,0.1)' },
    { icon: 'briefcase', label: 'Meus pedidos', desc: 'Acompanhe seus serviços', onClick: () => router.push('/cliente/pedidos'), color: '#22D31B', bg: 'rgba(34,211,27,0.1)' },
    { icon: 'settings', label: 'Configurações', desc: 'Privacidade e segurança', onClick: () => {}, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    { icon: 'shield', label: 'Central de ajuda', desc: 'Dúvidas e suporte', onClick: () => {}, color: '#22D31B', bg: 'rgba(34,211,27,0.1)' },
  ];

  return (
    <div style={{ padding: 20, borderRadius: 18, background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
      <h3 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1rem', color: theme.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="briefcase" size={18} color="#FF7A00" />
        Ações
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {actions.map((action, i) => (
          <motion.button key={action.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }} onClick={action.onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 12, background: 'transparent', border: `1px solid ${theme.line}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,122,0,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,122,0,0.2)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = theme.line; }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: action.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={action.icon} size={18} color={action.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: theme.text, margin: 0 }}>{action.label}</p>
              <p style={{ fontSize: '0.72rem', color: theme.textMuted, margin: '2px 0 0' }}>{action.desc}</p>
            </div>
            <Icon name="chevronRight" size={16} color={theme.textMuted} />
          </motion.button>
        ))}
        <button onClick={sair} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 12, background: 'rgba(184,58,8,0.08)', border: '1px solid rgba(184,58,8,0.2)', cursor: 'pointer', textAlign: 'left', width: '100%', marginTop: 4, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,58,8,0.15)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(184,58,8,0.08)'; }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(184,58,8,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="sair" size={18} color="#B83A08" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#B83A08', margin: 0 }}>Sair da conta</p>
            <p style={{ fontSize: '0.72rem', color: theme.textMuted, margin: '2px 0 0' }}>Encerrar sessão</p>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ────────────────────────────────────────────── */
export default function ClientProfilePage() {
  const { user, sair, alternarModo } = usarAutenticacao();
  const router = useRouter();
  const toast = useToast();
  const { darkMode } = usarTema();
  const theme = obterCoresTema(darkMode);

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [folhasHistory, setFolhasHistory] = useState([]);
  const [folhasBalance, setFolhasBalance] = useState(null);

  useEffect(() => {
    api.get('/pontos/saldo').then(r => setFolhasBalance(r.data?.balance ?? null)).catch(() => {});
    api.get('/pontos/historico').then(r => setFolhasHistory(r.data?.transactions || [])).catch(() => {});
  }, []);

  const form = usarFormulario(
    { name: '', bio: '', phone: '' },
    { name: [rules.required(), rules.minLength(2, 'Nome muito curto')], phone: [] }
  );

  useEffect(() => {
    Promise.all([
      api.get('/autenticacao/me').then(r => {
        setProfile(r.data);
        form.handleChange('name', r.data.name);
        form.handleChange('bio', r.data.bio || '');
        form.handleChange('phone', r.data.phone || '');
      }),
      api.get('/pedidos').then(r => setOrders(r.data.orders || [])),
    ])
      .catch(() => toast('Erro ao carregar perfil', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const completed = orders.filter(o => o.status === 'completed').length;
  const pending = orders.filter(o => ['pending', 'accepted', 'in_progress'].includes(o.status)).length;
  const totalSpent = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (parseFloat(o.price) || 0), 0);

  const points = profile?.points || completed * 100 + pending * 20;
  const folhas = folhasBalance ?? points;
  const folhasDesconto = folhas * FOLHA_VALUE;
  const levelIndex = LEVELS.reduce((acc, lvl, i) => points >= lvl.min ? i : acc, 0);
  const level = LEVELS[levelIndex];
  const nextLevel = LEVELS[levelIndex + 1] || null;

  // Update achievements
  const achievements = useMemo(() => ACHIEVEMENTS.map(a => {
    switch (a.id) {
      case 'first_order': return { ...a, unlocked: completed >= 1 };
      case 'five_orders': return { ...a, unlocked: completed >= 5 };
      case 'ten_orders': return { ...a, unlocked: completed >= 10 };
      case 'reviewer': return { ...a, unlocked: completed >= 3 };
      case 'big_spender': return { ...a, unlocked: totalSpent >= 5000 };
      case 'loyal': return { ...a, unlocked: false };
      default: return a;
    }
  }), [completed, totalSpent]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  async function handleSave() {
    await form.handleSubmit(async values => {
      try {
        const { data } = await api.patch(`/usuarios/${user.id}`, values);
        setProfile(prev => ({ ...prev, ...data }));
        setEditing(false);
        toast('Perfil atualizado!', 'success');
      } catch {
        toast('Erro ao salvar perfil', 'error');
      }
    });
  }

  const leaves = Array.from({ length: 10 }, (_, i) => ({
    delay: i * 1.3 + 0.4, x: (i * 9.8) % 100, size: 11 + (i % 3) * 4,
    color: i % 2 === 0 ? '#22D31B' : '#FF9A33', duration: 11 + (i % 5),
  }));

  if (loading) return (
    <LayoutPainel>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-flex' }}><SharedIcon name="leaf" size={48} color="#22D31B" /></motion.div>
      </div>
    </LayoutPainel>
  );

  return (
    <LayoutPainel>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,700;0,900;1,500;1,700&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        :root { --display: 'Fraunces', serif; --body: 'Inter', sans-serif; --mono: 'IBM Plex Mono', monospace; }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        .p-eyebrow { font-family: var(--mono); font-size: 0.7rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: ${theme.mono}; display: inline-flex; align-items: center; gap: 8px; }
        .p-eyebrow::before { content: ''; width: 20px; height: 1.5px; background: #FF7A00; display: inline-block; }

        .p-stat-card { padding: 18px; border-radius: 16px; background: ${theme.cardBg}; border: 1px solid ${theme.cardBorder}; display: flex; align-items: center; gap: 14px; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
        .p-stat-card:hover { transform: translateY(-4px); border-color: rgba(255,122,0,0.3); box-shadow: 0 12px 36px rgba(0,0,0,0.08); }

        .p-achievement-card { padding: 16px; border-radius: 16px; text-align: center; transition: all 0.2s; }

        .p-input { width: 100%; background: ${theme.bg}; border: 1.5px solid ${theme.line}; border-radius: 12px; padding: 12px 14px; font-size: 0.9rem; color: ${theme.text}; font-family: var(--body); outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .p-input:focus { border-color: #FF7A00; box-shadow: 0 0 0 4px rgba(255,122,0,0.08); }
        .p-input::placeholder { color: ${theme.textMuted}; }

        @media (max-width: 1024px) { .p-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px) { .p-header-flex { flex-direction: column; align-items: flex-start !important; gap: 20px; } .p-stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px) { .p-stats-grid { grid-template-columns: 1fr !important; } }
        @media (min-width: 769px) { .client-wide-page { max-width: none !important; margin: 0 !important; padding-left: 120px !important; padding-right: 120px !important; } }
        .profile-page-content { display: flex; flex-direction: column; }
        .profile-page-content > .p-grid { order: 1; }
      `}</style>



      {/* Carteira de Folhas: saldo aplicado diretamente como desconto no agendamento */}
      <div className="profile-page-content">
      <div id="folhas" className="client-wide-page" style={{ position: 'relative', zIndex: 1, padding: '24px 24px 0', maxWidth: 'none', margin: '0 auto', fontFamily: 'var(--body)', scrollMarginTop: 80 }}>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20 }} className="folhas-grid">

          {/* saldo + progresso até o próximo cupom */}
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, padding: 26, background: 'linear-gradient(135deg, #1B5E20, #256B29 45%, #22D31B)', color: '#fff' }}>
            <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="0.8" style={{ position: 'absolute', right: -30, bottom: -30, opacity: 0.12 }}>
              <path d="M5 21c0-9 6-15 15-15-1 9-7 15-15 15z" /><path d="M5 21c3-3 6-6 9-9" />
            </svg>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="award" size={20} color="#fff" />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: '1rem' }}>Carteira de Folhas</p>
                <p style={{ fontSize: '0.74rem', opacity: 0.85 }}>Suas moedas de desconto MoviPay</p>
              </div>
            </div>

            <p style={{ position: 'relative', fontFamily: 'var(--display)', fontWeight: 700, fontSize: '2.6rem', lineHeight: 1 }}>
              <Counter target={folhas} /> <span style={{ fontSize: '1.1rem', opacity: 0.85, fontFamily: 'var(--body)' }}>folhas</span>
            </p>
            <p style={{ position: 'relative', fontSize: '0.85rem', opacity: 0.92, marginTop: 8 }}>
              ≈ <strong>{formatarMoeda(folhasDesconto)}</strong> já garantidos em desconto acumulado
            </p>

            <div style={{ position: 'relative', marginTop: 20, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.14)' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 800 }}>Desconto aplicado automaticamente</p>
              <p style={{ fontSize: '0.72rem', opacity: 0.88, marginTop: 4 }}>Use suas Folhas no próximo agendamento ou aceite de serviço.</p>
            </div>
          </div>
        </motion.div>
      </div>

        {/* histórico de folhas */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 22, padding: 22, marginTop: 20 }}>
          <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '0.95rem', color: theme.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="clock2" size={17} color="#FF7A00" /> Histórico de Folhas
          </p>
          {folhasHistory.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: theme.textMuted }}>Nenhuma movimentação ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {folhasHistory.map((t, i) => {
                const amount = t.amount ?? t.points ?? 0;
                return (
                  <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 4px', borderBottom: i < folhasHistory.length - 1 ? `1px solid ${theme.line}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: amount >= 0 ? 'rgba(34,211,27,0.12)' : 'rgba(255,59,92,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name="leaf" size={14} color={amount >= 0 ? '#22D31B' : '#FF3B5C'} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</p>
                        <p style={{ fontSize: '0.68rem', color: theme.textMuted }}>{formatarData(t.created_at)}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: amount >= 0 ? '#22D31B' : '#FF3B5C', flexShrink: 0 }}>
                      {amount >= 0 ? '+' : ''}{amount} folhas
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      <style>{`@media (max-width: 860px) { .folhas-grid { grid-template-columns: 1fr !important; } }`}</style>

      <div className="p-grid client-wide-page" style={{ position: 'relative', zIndex: 1, padding: '24px 24px 80px', maxWidth: 'none', margin: '0 auto', fontFamily: 'var(--body)', background: 'transparent', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* Left column - Main profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ProfileHeader profile={profile} theme={theme} points={points} level={level} onEdit={() => setEditing(true)} />

          {editing ? (
            <EditForm profile={profile} form={form} onSave={handleSave} onCancel={() => setEditing(false)} saving={form.submitting} theme={theme} />
          ) : (
            <>
              <BioSection profile={profile} theme={theme} onEdit={() => setEditing(true)} />
              <ContactCard profile={profile} theme={theme} />
            </>
          )}

          {/* Actions */}
          <ActionsCard user={user} alternarModo={alternarModo} sair={sair} theme={theme} router={router} />
        </div>

        {/* Right column - Stats & Gamification */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Level Progress */}
          <LevelProgress points={points} level={level} nextLevel={nextLevel} theme={theme} />

          {/* Stats */}
          <div className="p-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <CartaoEstatistica icon="star" label="Pontos" value={points} color="#FF7A00" bgColor="rgba(255,122,0,0.12)" delay={0.1} theme={theme} />
            <CartaoEstatistica icon="check" label="Concluídos" value={completed} color="#22D31B" bgColor="rgba(34,211,27,0.12)" delay={0.15} theme={theme} />
            <CartaoEstatistica icon="clock" label="Em andamento" value={pending} color="#3B82F6" bgColor="rgba(59,130,246,0.12)" delay={0.2} theme={theme} />
            <CartaoEstatistica icon="trendingUp" label="Total investido" value={formatarMoeda(totalSpent)} color="#FF7A00" bgColor="rgba(255,122,0,0.12)" delay={0.25} theme={theme} />
          </div>

          {/* Achievements */}
          <div style={{ padding: 20, borderRadius: 18, background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1rem', color: theme.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="trophy" size={18} color="#FF7A00" />
                Conquistas
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF7A00', fontFamily: 'var(--mono)' }}>
                {unlockedCount}/{achievements.length}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {achievements.map((ach, i) => (
                <AchievementCard key={ach.id} achievement={ach} index={i} theme={theme} />
              ))}
            </div>
          </div>

          {/* Tips card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{ padding: 20, borderRadius: 18, background: 'linear-gradient(135deg, rgba(255,122,0,0.08), rgba(34,211,27,0.08))', border: `1px solid ${theme.line}` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #FF7A00, #22D31B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="sparkle" size={18} color="#fff" />
              </div>
              <h3 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '0.95rem', color: theme.text, margin: 0 }}>
                Dica para ganhar pontos
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: theme.text, lineHeight: 1.6, margin: 0 }}>
              Cada pedido concluído rende <strong style={{ color: '#FF7A00' }}>100 pontos</strong>. Avalie seus profissionais e ganhe bônus extras! Use seus pontos como desconto nos próximos serviços.
            </p>
          </motion.div>
        </div>
      </div>
    </LayoutPainel>
  );
}
