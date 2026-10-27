'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usarAutenticacao } from '@/contexto/contextoAutenticacao';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import api from '@/servicos/clienteApi';
import { formatarData } from '@/utilitarios/formatadores';
import Icon from '@/componentes/interface/Icone';

export default function SinoNotificacoes() {
  const { user } = usarAutenticacao();
  const { darkMode } = usarTema();
  const colors = obterCoresTema(darkMode);
  const [open, setOpen]           = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]       = useState(0);

  useEffect(() => {
    if (!user) return;
    loadNotifications();
    // Polling simples a cada 30s (substitui WebSocket na v0.4)
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  async function loadNotifications() {
    try {
      // Busca pedidos pendentes/recentes como notificações simuladas
      const { data } = await api.get('/pedidos');
      const orders = data.orders || [];

      const notifs = orders
        .filter(o => {
          if (user.mode === 'worker') return o.status === 'pending';
          return o.status === 'completed' || o.status === 'accepted';
        })
        .slice(0, 10)
        .map(o => ({
          id: o.id,
          read: localStorage.getItem(`notif_read_${o.id}`) === '1',
          title: user.mode === 'worker'
            ? `Novo pedido #${o.id} aguardando`
            : o.status === 'accepted'
              ? `Pedido #${o.id} foi aceito!`
              : `Pedido #${o.id} concluído`,
          time: o.updated_at || o.created_at,
          icon: user.mode === 'worker' ? 'clipboard' : o.status === 'accepted' ? 'checkCircle' : 'flag',
        }));

      setNotifications(notifs);
      setUnread(notifs.filter(n => !n.read).length);
    } catch {
      // Silencioso — notificações são não-críticas
    }
  }

  function markRead(id) {
    localStorage.setItem(`notif_read_${id}`, '1');
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  }

  function markAllRead() {
    notifications.forEach(n => localStorage.setItem(`notif_read_${n.id}`, '1'));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  }

  // Theme colors
  const bellBtnBg = darkMode ? 'rgba(243,239,226,0.08)' : 'rgba(23,36,26,0.06)';
  const bellBtnBgHover = darkMode ? 'rgba(243,239,226,0.15)' : 'rgba(23,36,26,0.12)';
  const panelBg = colors.cardBg;
  const panelBorder = colors.cardBorder;
  const dividerColor = darkMode ? 'rgba(243,239,226,0.08)' : 'rgba(23,36,26,0.06)';
  const hoverBg = darkMode ? 'rgba(243,239,226,0.05)' : 'rgba(23,36,26,0.04)';

  return (
    <div className="relative">
      <button onClick={() => { setOpen(!open); if (!open) loadNotifications(); }}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all relative"
        style={{
          background: bellBtnBg,
          color: colors.text,
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = bellBtnBgHover}
        onMouseLeave={(e) => e.currentTarget.style.background = bellBtnBg}
        aria-label="Notificações"
      >
        <Icon name="bell" size={18} />
        {unread > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute right-0 top-11 w-80 rounded-2xl shadow-xl overflow-hidden z-40"
              style={{
                background: panelBg,
                border: `1px solid ${panelBorder}`,
              }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${dividerColor}` }}>
                <p className="font-bold text-sm" style={{ color: colors.text }}>Notificações</p>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-client hover:underline">Marcar todas como lidas</button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="flex justify-center mb-2"><Icon name="bellOff" size={26} color="#94A3B8" /></div>
                    <p className="text-sm" style={{ color: colors.textMuted }}>Nenhuma notificação</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <button key={n.id} onClick={() => markRead(n.id)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-all ${!n.read ? '' : ''}`}
                      style={{
                        borderBottom: `1px solid ${dividerColor}`,
                        background: !n.read ? 'rgba(255,122,0,0.08)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (n.read) e.currentTarget.style.background = hoverBg;
                      }}
                      onMouseLeave={(e) => {
                        if (n.read) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span className="flex-shrink-0"><Icon name={n.icon} size={18} color="#FF7A00" /></span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${n.read ? '' : 'font-semibold'}`} style={{ color: n.read ? colors.textMuted : colors.text }}>
                          {n.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{formatarData(n.time)}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: '#FF7A00' }} />}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
