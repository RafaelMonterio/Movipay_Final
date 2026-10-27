'use client';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import { useRouter } from 'next/navigation';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import { usarAutenticacao } from '@/contexto/contextoAutenticacao';
import { useToast } from '@/componentes/interface/Notificacao';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import api from '@/servicos/clienteApi';
import SharedIcon from '@/componentes/interface/Icone';

/* ─── DESIGN TOKENS ─────────────────────────────────────────────── */
// Display: Fraunces · Body: Inter · Mono: IBM Plex Mono
// Acentos: Laranja #FF7A00 · Verde #22D31B

/* ─── SVG ICONS ─────────────────────────────────────────────────── */
function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 1.8, style }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  switch (name) {
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
    case 'send': return <svg {...p}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
    case 'paperclip': return <svg {...p}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49" /></svg>;
    case 'mic': return <svg {...p}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>;
    case 'x': return <svg {...p}><line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" /></svg>;
    case 'menu': return <svg {...p}><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
    case 'chevronLeft': return <svg {...p}><polyline points="15 18 9 12 15 6" /></svg>;
    case 'chevronRight': return <svg {...p}><polyline points="9 18 15 12 9 6" /></svg>;
    case 'bell': return <svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
    case 'bellOff': return <svg {...p}><path d="M13.73 21a2 2 0 0 1-3.46 0" /><path d="M18.63 13A15.79 15.79 0 0 1 18 8a6 6 0 0 0-12 0" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
    case 'pin': return <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    case 'archive': return <svg {...p}><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" rx="1" ry="1" /></svg>;
    case 'star': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" style={style}><polygon points="12 2 15.09 8.63 22 9.24 16.5 14.14 18.18 21 12 17.27 5.82 21 7.5 14.14 2 9.24 8.91 8.63 12 2" /></svg>;
    case 'shield': return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    case 'check': return <svg {...p}><polyline points="20 6 9 17 4 12" /></svg>;
    case 'clock': return <svg {...p}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" /></svg>;
    case 'users': return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'message': return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case 'more': return <svg {...p}><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>;
    case 'eye': return <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
    case 'phone': return <svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
    case 'video': return <svg {...p}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>;
    case 'image': return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
    case 'download': return <svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
    case 'reply': return <svg {...p}><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /></svg>;
    case 'trash': return <svg {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" /></svg>;
    case 'info': return <svg {...p}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;
    case 'sparkle': return <svg {...p}><path d="M12 2l1.5 5h5L14 10.5l1.5 5L12 13l-3.5 2.5L10 10.5 5.5 7h5z" /></svg>;
    default: return null;
  }
}

/* ─── STATUS CONFIG ─────────────────────────────────────────────── */
const ORDER_STATUS = {
  pending: { label: 'Pendente', color: '#FFB347', bg: 'rgba(255,179,71,0.12)', border: 'rgba(255,179,71,0.35)', icon: 'clock' },
  accepted: { label: 'Aceito', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', icon: 'check' },
  in_progress: { label: 'Em andamento', color: '#22D31B', bg: 'rgba(34,211,27,0.12)', border: 'rgba(34,211,27,0.35)', icon: 'clock' },
  completed: { label: 'Concluído', color: '#22D31B', bg: 'rgba(34,211,27,0.12)', border: 'rgba(34,211,27,0.35)', icon: 'check' },
  cancelled: { label: 'Cancelado', color: '#B83A08', bg: 'rgba(184,58,8,0.10)', border: 'rgba(184,58,8,0.30)', icon: 'x' },
};

/* ─── MESSAGE BUBBLE ────────────────────────────────────────────── */
function MessageBubble({ message, isMine, contactName, contactInitial, theme, index }) {
  const time = new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const isLocal = message._local === true;

  return (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.02, duration: 0.25 }}
      layout
      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
    >
      {!isMine && (
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #FF7A00, #22D31B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0, marginRight: 8, marginBottom: 2 }}>
          {contactInitial}
        </div>
      )}
      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 4, ...(isMine ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }) }}>
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          style={{
            padding: '10px 14px',
            borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isMine ? 'linear-gradient(135deg, #FF7A00, #FF9A33)' : theme.cardBg,
            border: isMine ? 'none' : `1px solid ${theme.cardBorder}`,
            color: isMine ? '#fff' : theme.text,
            fontSize: '0.9rem',
            lineHeight: 1.5,
            position: 'relative',
            boxShadow: isMine ? '0 4px 16px rgba(255,122,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
            opacity: isLocal ? 0.7 : 1,
          }}
        >
          {message.content}
          {isLocal && (
            <motion.span
              style={{ position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', fontSize: '0.6rem', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Icon name="clock" size={10} /> Enviando...
            </motion.span>
          )}
        </motion.div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }}>
          <span style={{ fontSize: '0.65rem', color: theme.textMuted, fontFamily: 'var(--mono)' }}>{time}</span>
          {isMine && (
            <Icon name={message.read ? 'check' : 'clock'} size={12} color={message.read ? '#22D31B' : theme.textMuted} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── DATE SEPARATOR ────────────────────────────────────────────── */
function DateSeparator({ date, theme }) {
  const today = new Date();
  const msgDate = new Date(date);
  const isToday = msgDate.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = msgDate.toDateString() === yesterday.toDateString();

  let label;
  if (isToday) label = 'Hoje';
  else if (isYesterday) label = 'Ontem';
  else label = msgDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0', color: theme.textMuted, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}
    >
      <div style={{ flex: 1, height: 1, background: theme.line }} />
      <span style={{ background: theme.bg, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="calendar" size={10} />
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: theme.line }} />
    </motion.div>
  );
}

/* ─── TYPING INDICATOR ──────────────────────────────────────────── */
// Typing indicator removed per user request

/* ─── CONVERSATION ITEM (BarraLateral) ───────────────────────────────── */
function ConversationItem({ conversation, isActive, onClick, theme, userMode }) {
  const contactName = conversation.contact_name || 'Contato';
  const contactInitial = contactName?.charAt(0) || '?';
  const unreadCount = conversation.unread_count || 0;
  const lastMessage = conversation.last_message;
  const lastTime = lastMessage ? new Date(lastMessage.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
  const status = ORDER_STATUS[conversation.status] || ORDER_STATUS.pending;

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 12px', borderRadius: 16,
        background: isActive ? 'rgba(255,122,0,0.06)' : 'transparent',
        border: isActive ? '1px solid rgba(255,122,0,0.2)' : '1px solid transparent',
        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
        marginBottom: 8,
      }}
      onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,122,0,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,122,0,0.1)'; } }}
      onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
    >
      {/* Avatar with status ring */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF7A00, #22D31B)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: '1.1rem',
          boxShadow: '0 4px 16px rgba(255,122,0,0.3)',
        }}>
          {contactInitial}
        </div>
        <div style={{
          position: 'absolute', bottom: 0, right: 0, width: 14, height: 14,
          borderRadius: '50%', background: status.color, border: '3px solid', borderColor: theme.bg,
        }} />
        {unreadCount > 0 && (
          <motion.div
            style={{ position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10, background: '#FF7A00', color: '#fff', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', boxShadow: '0 4px 12px rgba(255,122,0,0.4)' }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <h4 style={{ fontWeight: 700, fontSize: '0.88rem', color: theme.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {contactName}
          </h4>
          <span style={{ fontSize: '0.65rem', color: theme.textMuted, fontFamily: 'var(--mono)', whiteSpace: 'nowrap', flexShrink: 0 }}>{lastTime}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {lastMessage && (
            <p style={{ fontSize: '0.78rem', color: theme.textMuted, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
              {lastMessage.sender_id === conversation.other_id ? '' : 'Você: '}{lastMessage.content}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─── CHAT HEADER ───────────────────────────────────────────────── */
function ChatHeader({ conversation, theme, onBack, onInfo, onPin, onArchive, isPinned, isArchived, user }) {
  const router = useRouter();
  const contactName = conversation.contact_name || 'Contato';
  const contactInitial = contactName.charAt(0);
  const isDirect = conversation.status === 'direct';
  const status = ORDER_STATUS[conversation.status] || ORDER_STATUS.pending;

  const openProfile = () => {
    if (user?.mode === 'worker') router.push(`/cliente/perfil?user=${conversation.contact_id}`);
    else router.push(`/cliente/profissionais/${conversation.contact_id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 20px', borderBottom: `1px solid ${theme.line}`,
        background: theme.cardBg + 'EE', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}
    >
      <button onClick={onBack} style={{ display: 'none' }} aria-label="Voltar" />
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: 'linear-gradient(135deg, #FF7A00, #22D31B)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0,
        boxShadow: '0 4px 16px rgba(255,122,0,0.3)',
        cursor: 'pointer',
      }} onClick={openProfile} role="button" aria-label="Abrir perfil">
        {contactInitial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
          <h3 onClick={openProfile} style={{ fontWeight: 700, fontSize: '0.95rem', color: theme.text, margin: 0, cursor: 'pointer' }}>{contactName}</h3>
          {!isDirect && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 999,
              fontSize: '0.6rem', fontWeight: 700, fontFamily: 'var(--body)',
              background: status.bg, color: status.color, border: `1px solid ${status.border}`,
              whiteSpace: 'nowrap',
            }}>
              <Icon name={status.icon} size={8} />
              {status.label}
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.75rem', color: theme.textMuted, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {isDirect ? 'Conversa direta' : (conversation.service_title || `Pedido #${conversation.id}`)}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onArchive} style={{ padding: 8, borderRadius: 10, background: 'transparent', border: `1px solid ${theme.line}`, color: theme.textMuted, cursor: 'pointer', display: 'flex', transition: 'all 0.2s' }} aria-label="Arquivar" onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,58,8,0.08)'; e.currentTarget.style.borderColor = '#B83A08'; e.currentTarget.style.color = '#B83A08'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = theme.line; e.currentTarget.style.color = theme.textMuted; }}>
          <Icon name="archive" size={16} />
        </button>
        <button onClick={onInfo} style={{ padding: 8, borderRadius: 10, background: 'transparent', border: `1px solid ${theme.line}`, color: theme.textMuted, cursor: 'pointer', display: 'flex', transition: 'all 0.2s' }} aria-label="Info" onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,122,0,0.1)'; e.currentTarget.style.borderColor = '#FF7A00'; e.currentTarget.style.color = '#FF7A00'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = theme.line; e.currentTarget.style.color = theme.textMuted; }}>
          <Icon name="info" size={16} />
        </button>
      </div>
    </motion.div>
  );
}

/* ─── MESSAGE INPUT ─────────────────────────────────────────────── */
function MessageCampoEntrada({ text, setText, onSend, sending, theme, inputRef }) {
  const hasText = text.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      style={{
        padding: '16px 20px', borderTop: `1px solid ${theme.line}`,
        background: theme.cardBg + 'EE', backdropFilter: 'blur(20px)',
        position: 'sticky', bottom: 0, zIndex: 10,
      }}
    >
      <form onSubmit={onSend} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 8, background: theme.bg, border: `1.5px solid ${theme.line}`, borderRadius: 24, padding: '4px 8px 4px 16px', transition: 'border-color 0.2s, box-shadow 0.2s' }}>
          <button type="button" style={{ padding: 8, color: theme.textMuted, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '50%', display: 'flex', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,122,0,0.1)'; e.currentTarget.style.color = '#FF7A00'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.textMuted; }} aria-label="Anexar arquivo">
            <Icon name="paperclip" size={20} />
          </button>
          <button type="button" style={{ padding: 8, color: theme.textMuted, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '50%', display: 'flex', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,27,0.1)'; e.currentTarget.style.color = '#22D31B'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.textMuted; }} aria-label="Enviar foto">
            <Icon name="image" size={20} />
          </button>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Mensagem..."
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: '0.9rem', color: theme.text, fontFamily: 'var(--body)',
              resize: 'none', minHeight: 24, maxHeight: 120, lineHeight: 1.5,
              padding: '8px 0', width: '100%',
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(e); } }}
          />
          {hasText && (
            <button type="button" onClick={() => setText('')} style={{ padding: 8, color: theme.textMuted, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '50%', display: 'flex', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,58,8,0.1)'; e.currentTarget.style.color = '#B83A08'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.textMuted; }} aria-label="Limpar">
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
        <motion.button
          type="submit"
          disabled={!hasText || sending}
          whileTap={{ scale: 0.9 }}
          style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: hasText ? 'linear-gradient(135deg, #FF7A00, #FF9A33)' : theme.line,
            color: hasText ? '#fff' : theme.textMuted,
            border: 'none', cursor: hasText ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: hasText ? '0 6px 20px rgba(255,122,0,0.35)' : 'none',
            transition: 'all 0.2s',
          }}
          aria-label="Enviar mensagem"
        >
          {sending ? (
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Icon name="clock" size={18} color="#fff" />
            </motion.span>
          ) : (
            <Icon name="send" size={20} color={hasText ? '#fff' : theme.textMuted} />
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}

/* ─── EMPTY CHAT STATE ──────────────────────────────────────────── */
function EmptyChatState({ theme, conversation }) {
  const contactName = conversation.contact_name || 'profissional';
  const contactInitial = contactName.charAt(0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(255,122,0,0.15), rgba(34,211,27,0.15))',
        border: `1px solid ${theme.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
      }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #FF7A00, #22D31B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.5rem' }}>
          {contactInitial}
        </div>
      </div>
      <h3 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.25rem', color: theme.text, marginBottom: 8 }}>
        {contactName}
      </h3>
      <p style={{ color: theme.textMuted, fontSize: '0.88rem', marginBottom: 8, maxWidth: 280 }}>
        {conversation.service_title}
      </p>
      <p style={{ color: theme.textMuted, fontSize: '0.78rem', marginBottom: 24, opacity: 0.7 }}>
        Inicie a conversa enviando a primeira mensagem
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, background: 'rgba(255,122,0,0.1)', border: '1px solid rgba(255,122,0,0.2)', color: '#FF7A00', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--body)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,122,0,0.2)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,122,0,0.1)'; }}>
          <Icon name="sparkle" size={14} />
          Dica: Se apresente
        </button>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, background: 'rgba(34,211,27,0.1)', border: '1px solid rgba(34,211,27,0.2)', color: '#22D31B', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--body)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,27,0.2)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,211,27,0.1)'; }}>
          <Icon name="shield" size={14} />
          Seguro e privado
        </button>
      </div>
    </div>
  );
}

/* ─── WELCOME STATE ─────────────────────────────────────────────── */
function WelcomeState({ theme }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(255,122,0,0.15), rgba(34,211,27,0.15))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24, fontSize: '2.5rem',
      }}>
        <SharedIcon name="chat" size={38} color="#FF7A00" />
      </div>
      <h3 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.4rem', color: theme.text, marginBottom: 8 }}>
        Suas mensagens
      </h3>
      <p style={{ color: theme.textMuted, fontSize: '0.95rem', maxWidth: 320, marginBottom: 24, lineHeight: 1.6 }}>
        Selecione uma conversa ao lado ou aguarde um profissional aceitar seu pedido para começar a conversar.
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ padding: '16px 20px', borderRadius: 16, background: theme.cardBg, border: `1px solid ${theme.line}`, minWidth: 180, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: '#FF7A00', fontWeight: 700, fontSize: '0.85rem' }}>
            <Icon name="shield" size={16} />
            Privado & Seguro
          </div>
          <p style={{ fontSize: '0.78rem', color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>Mensagens criptografadas. Seu telefone e dados ficam protegidos.</p>
        </div>
        <div style={{ padding: '16px 20px', borderRadius: 16, background: theme.cardBg, border: `1px solid ${theme.line}`, minWidth: 180, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: '#22D31B', fontWeight: 700, fontSize: '0.85rem' }}>
            <Icon name="clock" size={16} />
            Tempo real
          </div>
          <p style={{ fontSize: '0.78rem', color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>Receba notificações instantâneas. Respostas em segundos.</p>
        </div>
        <div style={{ padding: '16px 20px', borderRadius: 16, background: theme.cardBg, border: `1px solid ${theme.line}`, minWidth: 180, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: '#3B82F6', fontWeight: 700, fontSize: '0.85rem' }}>
            <Icon name="phone" size={16} />
            Chamadas integradas
          </div>
          <p style={{ fontSize: '0.78rem', color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>Ligue ou faça videochamada direto do chat quando precisar.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── FLOATING LEAVES ───────────────────────────────────────────── */
function FloatingLeaf({ delay, x, size, color, duration }) {
  return (
    <motion.div style={{ position: 'absolute', top: 0, left: x + '%', pointerEvents: 'none', zIndex: 0 }} initial={{ y: -40, opacity: 0, rotate: 0 }} animate={{ y: '120vh', opacity: [0, 0.5, 0.5, 0], rotate: [0, 180, 360, 540] }} transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}>
      <span style={{ display: 'inline-flex', opacity: 0.5 }}><SharedIcon name="leaf" size={size} color={color} /></span>
    </motion.div>
  );
}

/* ─── MAIN COMPONENT ────────────────────────────────────────────── */
export default function ChatPage() {
  const { user } = usarAutenticacao();
  const toast = useToast();
  const { darkMode } = usarTema();
  const theme = obterCoresTema(darkMode);

  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const sidebarRef = useRef(null);
  const [sidebarOpen, setBarraLateralOpen] = useState(false);

  // Scroll to bottom
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);


  // Lista real de conversas (pedidos + diretas): nome do CONTATO (nunca o da
  // própria conta) e não lidas reais. Com ?worker=ID, abre a conversa com ele.
  const loadConversations = useCallback(async (preferThreadId) => {
    try {
      const { data } = await api.get('/conversas');
      const list = data.conversations || [];
      setConversations(list);
      if (preferThreadId) {
        const match = list.find(c => c.thread_id === preferThreadId);
        if (match) { setSelected(match); return; }
      }
      setSelected(prev => (prev && list.find(c => c.thread_id === prev.thread_id)) || list[0] || null);
    } catch {
      toast('Erro ao carregar conversas', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadMessages = useCallback(async () => {
    if (!selected) return;
    try {
      const { data } = await api.get(`/conversas/${selected.thread_id}`);
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    }
  }, [selected]);

  useEffect(() => {
    loadMessages();
    if (selected?.thread_id) {
      api.post(`/conversas/${selected.thread_id}/lida`).then(() => {
        setConversations(prev => prev.map(c => c.thread_id === selected.thread_id ? { ...c, unread_count: 0 } : c));
      }).catch(() => {});
    }
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages, selected?.thread_id]);

  // typing indicator removed per user request

  // Send message
  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!text.trim() || !selected || sending) return;
    const content = text.trim();
    setText('');
    try {
      setSending(true);
      await api.post(`/conversas/${selected.thread_id}`, { content });
      loadMessages();
    } catch {
      // Fallback local
      setMessages(prev => [...prev, { id: Date.now(), sender_id: user?.id, content, created_at: new Date().toISOString(), _local: true, read: false }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(c =>
      (c.contact_name || '').toLowerCase().includes(q) ||
      (c.service_title || '').toLowerCase().includes(q) ||
      String(c.id).includes(q)
    );
  }, [conversations, search]);

  const leaves = Array.from({ length: 8 }, (_, i) => ({
    delay: i * 1.5 + 0.5, x: (i * 12.3) % 100, size: 10 + (i % 3) * 3,
    color: i % 2 === 0 ? '#22D31B' : '#FF9A33', duration: 12 + (i % 6),
  }));

  return (
    <LayoutPainel>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,700;0,900;1,500;1,700&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        :root { --display: 'Fraunces', serif; --body: 'Inter', sans-serif; --mono: 'IBM Plex Mono', monospace; }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        .c-eyebrow { font-family: var(--mono); font-size: 0.7rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: ${theme.mono}; display: inline-flex; align-items: center; gap: 8px; }
        .c-eyebrow::before { content: ''; width: 20px; height: 1.5px; background: #FF7A00; display: inline-block; }

        .c-search { display: flex; align-items: center; gap: 10px; background: ${theme.cardBg}; border: 1px solid ${theme.line}; border-radius: 14px; padding: 12px 16px; transition: border-color 0.2s, box-shadow 0.2s; }
        .c-search:focus-within { border-color: #FF7A00; box-shadow: 0 0 0 4px rgba(255,122,0,0.08); }
        .c-search input { flex: 1; background: transparent; border: none; outline: none; font-size: 0.88rem; color: ${theme.text}; font-family: var(--body); font-weight: 500; }
        .c-search input::placeholder { color: ${theme.textMuted}; }

        .c-btn-icon { width: 36px; height: 36px; border-radius: 10px; border: 1px solid ${theme.line}; background: ${theme.cardBg}; color: ${theme.textMuted}; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .c-btn-icon:hover { background: rgba(255,122,0,0.08); border-color: rgba(255,122,0,0.3); color: #FF7A00; }

        .c-message-bubble { max-width: 75%; padding: 10px 14px; border-radius: 18px; font-size: 0.9rem; line-height: 1.5; position: relative; }
        .c-message-mine { background: linear-gradient(135deg, #FF7A00, #FF9A33); color: #fff; border-radius: 18px 18px 4px 18px; box-shadow: 0 4px 16px rgba(255,122,0,0.2); }
        .c-message-theirs { background: ${theme.cardBg}; color: ${theme.text}; border: 1px solid ${theme.cardBorder}; border-radius: 18px 18px 18px 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }

        .c-input-wrap { flex: 1; position: relative; display: flex; align-items: flex-end; gap: 8px; background: ${theme.bg}; border: 1.5px solid ${theme.line}; border-radius: 24px; padding: 4px 8px 4px 16px; transition: border-color 0.2s, box-shadow 0.2s; }
        .c-input-wrap:focus-within { border-color: #FF7A00; box-shadow: 0 0 0 4px rgba(255,122,0,0.08); }
        .c-input { flex: 1; background: transparent; border: none; outline: none; font-size: 0.9rem; color: ${theme.text}; font-family: var(--body); resize: none; min-height: 24px; max-height: 120px; line-height: 1.5; padding: 8px 0; width: 100%; }
        .c-input::placeholder { color: ${theme.textMuted}; }

        .c-send-btn { width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #FF7A00, #FF9A33); color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 20px rgba(255,122,0,0.35); transition: all 0.2s; }
        .c-send-btn:disabled { background: ${theme.line}; color: ${theme.textMuted}; cursor: not-allowed; box-shadow: none; }
        .c-send-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 8px 28px rgba(255,122,0,0.45); }

        .c-conv-item { width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 12px; border-radius: 16px; background: transparent; border: 1px solid transparent; cursor: pointer; text-align: left; transition: all 0.2s; margin-bottom: 8px; }
        .c-conv-item:hover { background: rgba(255,122,0,0.04); border-color: rgba(255,122,0,0.1); }
        .c-conv-item.active { background: rgba(255,122,0,0.06); border-color: rgba(255,122,0,0.2); }

        .c-sidebar-overlay { display: none; }

        @media (max-width: 1024px) {
          .c-sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 320px; z-index: 50; background: ${theme.bg}; border-right: 1px solid ${theme.line}; transform: translateX(${sidebarOpen ? '0' : '-100%'}); transition: transform 0.3s ease; box-shadow: 0 0 40px rgba(0,0,0,0.2); }
          .c-sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 40; }
          .c-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
          .c-chat-header { display: flex !important; }
        }
        @media (max-width: 768px) {
          .c-chat-header-actions { gap: 4px; }
          .c-chat-header-actions button { padding: 6px; }
          .c-welcome-cards { flex-direction: column; align-items: stretch; }
        }
      `}</style>



      {/* Mobile sidebar overlay (exibido apenas em telas menores quando o menu lateral é aberto) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="c-sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBarraLateralOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main chat layout */}
      <div className="c-main" style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden', background: theme.bg }}>

        {/* ── SIDEBAR ── */}
        <aside
          ref={sidebarRef}
          className="c-sidebar"
          style={{
            width: 360, flexShrink: 0, borderRight: `1px solid ${theme.line}`,
            background: theme.cardBg + 'F2', backdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* BarraLateral Header */}
          <div style={{ padding: '16px', borderBottom: `1px solid ${theme.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #FF7A00, #22D31B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: theme.text, margin: 0 }}>{user?.name?.split(' ')[0] || 'Usuário'}</p>
                <p style={{ fontSize: '0.7rem', color: theme.textMuted, margin: 0, fontFamily: 'var(--mono)' }}>{conversations.length} conversa{conversations.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button onClick={() => setBarraLateralOpen(false)} className="c-btn-icon" aria-label="Fechar conversas">
              <Icon name="x" size={18} />
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.line}` }}>
            <div className="c-search">
              <Icon name="search" size={16} color={theme.textMuted} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conversas..." />
            </div>
          </div>

          {/* Conversations List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px', opacity: 0.5 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: theme.line, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 16, background: theme.line, borderRadius: 8, marginBottom: 8, width: '60%' }} />
                      <div style={{ height: 14, background: theme.line, borderRadius: 8, width: '80%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '40px 20px', color: theme.textMuted }}>
                <Icon name="message" size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4, color: theme.text }}>Nenhuma conversa</p>
                <p style={{ fontSize: '0.78rem' }}>Conversas aparecem quando um pedido é aceito</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={selected?.id === conv.id}
                  onClick={() => { setSelected(conv); setBarraLateralOpen(false); }}
                  theme={theme}
                  userMode={user.mode}
                />
              ))
            )}
          </div>
        </aside>

        {/* ── CHAT AREA ── */}
        <div className="c-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: theme.bg }}>
          {selected ? (
            <>
              {/* Chat Header */}
              <ChatHeader
                conversation={selected}
                theme={theme}
                user={user}
                onBack={() => setBarraLateralOpen(true)}
                onInfo={() => setShowInfo(true)}
                onPin={() => toast(isPinned ? 'Desfixado' : 'Fixado', 'success')}
                onArchive={() => toast('Arquivado', 'success')}
                isPinned={false}
                isArchived={false}
              />

              {/* Messages Area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <AnimatePresence initial={false}>
                  {messages.length === 0 ? (
                    <EmptyChatState key="empty" theme={theme} conversation={selected} />
                  ) : (
                    <>
                      {messages.map((msg, idx) => {
                        const showDate = idx === 0 || new Date(messages[idx - 1]?.created_at).toDateString() !== new Date(msg.created_at).toDateString();
                        return (
                          <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                            {showDate && <DateSeparator date={msg.created_at} theme={theme} />}
                            <MessageBubble
                              message={msg}
                              isMine={msg.sender_id === user?.id}
                              contactName={selected.contact_name || 'Contato'}
                              contactInitial={(selected.contact_name || '?').charAt(0)}
                              theme={theme}
                              index={idx}
                            />
                          </motion.div>
                        );
                      })}
                      {/* typing indicator removed */}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Message CampoEntrada */}
              <MessageCampoEntrada text={text} setText={setText} onSend={sendMessage} sending={sending} theme={theme} inputRef={inputRef} />

            </>
          ) : (
            <WelcomeState theme={theme} />
          )}
        </div>
      </div>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                width: '100%', maxWidth: 400, background: theme.cardBg, borderRadius: '24px 24px 0 0',
                padding: '24px', boxShadow: '0 -20px 60px rgba(0,0,0,0.2)', maxHeight: '85vh', overflowY: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.1rem', color: theme.text, margin: 0 }}>Detalhes do pedido</h3>
                <button onClick={() => setShowInfo(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: theme.textMuted }}>
                  <Icon name="x" size={24} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: 16, borderRadius: 16, background: theme.bg, border: `1px solid ${theme.line}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #FF7A00, #22D31B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem' }}>
                      <SharedIcon name="box" size={24} color="#fff" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.95rem', color: theme.text, margin: 0 }}>{selected.status === 'direct' ? 'Conversa direta' : selected.service_title}</p>
                      <p style={{ fontSize: '0.75rem', color: theme.textMuted, margin: '2px 0 0' }}>{selected.status === 'direct' ? 'Sem pedido associado' : `Pedido #${selected.id}`}</p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <p style={{ fontSize: '0.65rem', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontFamily: 'var(--mono)' }}>Estado</p>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', color: theme.text }}>{selected.status === 'direct' ? 'Conversa direta' : (ORDER_STATUS[selected.status]?.label || 'Desconhecido')}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.65rem', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontFamily: 'var(--mono)' }}>Valor</p>
                      <p style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: '1.1rem', color: '#FF7A00' }}>{selected.price ? `R$ ${parseFloat(selected.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</p>
                    </div>
                  </div>
                </div>
                <div style={{ padding: 16, borderRadius: 16, background: theme.bg, border: `1px solid ${theme.line}` }}>
                  <p style={{ fontSize: '0.65rem', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, fontFamily: 'var(--mono)' }}>Profissional</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #FF7A00, #22D31B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.2rem' }}>
                      {(selected.contact_name || '?').charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.95rem', color: theme.text, margin: 0 }}>{selected.contact_name || 'Contato'}</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button style={{ flex: 1, padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #FF7A00, #FF9A33)', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--body)' }}>Ligar</button>
                  <button style={{ flex: 1, padding: '14px', borderRadius: 12, background: 'transparent', color: '#3B82F6', border: '1.5px solid #3B82F6', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--body)' }}>Vídeo</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutPainel>
  );
}
