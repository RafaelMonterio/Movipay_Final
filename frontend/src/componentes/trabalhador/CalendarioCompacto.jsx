'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/componentes/interface/Icone';
import api from '@/servicos/clienteApi';
import { formatarMoeda } from '@/utilitarios/formatadores';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Calendário compacto do prestador (seção da página inicial). */
export default function CalendarioCompacto({ theme }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(today.getDate());
  const [events, setEvents] = useState([]);

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  useEffect(() => {
    api.get('/agenda/eventos', { params: { month: monthStr } }).then(r => setEvents(r.data.events || [])).catch(() => setEvents([]));
  }, [monthStr]);

  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const iso = d => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const dayEvents = events.filter(e => e.event_date === iso(selected));
  const prev = () => (month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1));
  const next = () => (month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1));
  const navBtn = { width: 26, height: 26, borderRadius: 8, background: theme.bgAlt, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.text, fontSize: 14, fontWeight: 700 };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 260px) 1fr', gap: 16, background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 18, padding: 16 }} className="wk-mini-cal">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <button onClick={prev} style={navBtn} aria-label="Mês anterior">‹</button>
          <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '0.85rem', color: theme.text }}>{MONTHS[month]} {year}</p>
          <button onClick={next} style={navBtn} aria-label="Próximo mês">›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 2 }}>
          {DAYS.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, color: theme.textMuted }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {[...Array(first)].map((_, i) => <div key={`e${i}`} />)}
          {[...Array(total)].map((_, i) => {
            const day = i + 1;
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSel = day === selected;
            const hasEv = events.some(e => e.event_date === iso(day));
            return (
              <button key={day} onClick={() => setSelected(day)}
                style={{ position: 'relative', height: 28, borderRadius: 8, fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: isSel ? '#FF7A00' : isToday ? 'rgba(255,122,0,0.14)' : 'transparent', color: isSel ? '#fff' : isToday ? '#FF7A00' : theme.text }}>
                {day}
                {hasEv && <span style={{ position: 'absolute', bottom: 2, left: '50%', marginLeft: -2, width: 4, height: 4, borderRadius: '50%', background: isSel ? '#fff' : '#FF7A00' }} />}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '0.85rem', color: theme.text, marginBottom: 10 }}>{String(selected).padStart(2, '0')}/{String(month + 1).padStart(2, '0')}/{year}</p>
        {dayEvents.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.textMuted, fontSize: '0.78rem', padding: '14px 0' }}>
            <Icon name="calendar" size={16} color={theme.textMuted} /> Sem compromissos neste dia
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 190, overflowY: 'auto' }}>
            {dayEvents.map(ev => (
              <motion.div key={ev.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'rgba(255,122,0,0.08)', border: '1px solid rgba(255,122,0,0.25)', borderRadius: 12, padding: '10px 12px' }}>
                <p style={{ fontWeight: 700, fontSize: '0.8rem', color: theme.text }}>{ev.title}</p>
                <p style={{ fontSize: '0.7rem', color: theme.textMuted, marginTop: 2 }}>{ev.time_start} – {ev.time_end}{ev.client_name ? ` · ${ev.client_name}` : ''}</p>
                {ev.address && <p style={{ fontSize: '0.68rem', color: theme.textMuted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="mapPin" size={10} color={theme.textMuted} /> {ev.address}</p>}
                {ev.notes && <p style={{ fontSize: '0.7rem', color: theme.textMuted, marginTop: 5, lineHeight: 1.35 }}>{ev.notes}</p>}
                {ev.price && <p style={{ fontWeight: 800, color: '#FF7A00', fontSize: '0.78rem', marginTop: 4 }}>{formatarMoeda(ev.price)}</p>}
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <style>{`@media (max-width: 640px) { .wk-mini-cal { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
