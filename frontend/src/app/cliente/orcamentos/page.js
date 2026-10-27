'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import Modal from '@/componentes/interface/JanelaModal';
import { ListEsqueleto } from '@/componentes/interface/Esqueleto';
import { useToast } from '@/componentes/interface/Notificacao';
import { usarAutenticacao } from '@/contexto/contextoAutenticacao';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import api from '@/servicos/clienteApi';
import SharedIcon from '@/componentes/interface/Icone';

/* ─── DESIGN TOKENS ─────────────────────────────────────────────── */
// Display: Fraunces · Body: Inter · Mono: IBM Plex Mono
// Acentos: Laranja #FF7A00 · Verde #22D31B

/* ─── SVG ICONS (sem emojis) ─────────────────────────────────────── */
function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 1.8, style }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth,
    strokeLinecap: 'round', strokeLinejoin: 'round', style,
  };
  switch (name) {
    case 'search':
      return <svg {...p}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
    case 'plus':
      return <svg {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
    case 'arrowRight':
      return <svg {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
    case 'arrowDown':
      return <svg {...p}><polyline points="6 9 12 15 18 9" /></svg>;
    case 'filter':
      return <svg {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;
    case 'sparkle':
      return <svg {...p}><path d="M12 2l1.5 5h5L14 10.5l1.5 5L12 13l-3.5 2.5L10 10.5 5.5 7h5z" /></svg>;
    case 'clock':
      return <svg {...p}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" /></svg>;
    case 'pin':
      return <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    case 'money':
      return <svg {...p}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
    case 'users':
      return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'check':
      return <svg {...p}><polyline points="20 6 9 17 4 12" /></svg>;
    case 'x':
      return <svg {...p}><line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" /></svg>;
    case 'edit':
      return <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
    case 'trash':
      return <svg {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
    case 'eye':
      return <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
    case 'calendar':
      return <svg {...p}><rect x="3" y="4" width="18" height="17" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case 'tag':
      return <svg {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>;
    case 'lightning':
      return <svg {...p}><polygon points="13 2 3 14 11 14 9 22 21 10 13 10 13 2" /></svg>;
    case 'flame':
      return <svg {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>;
    case 'chart':
      return <svg {...p}><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>;
    case 'bell':
      return <svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
    case 'sort':
      return <svg {...p}><path d="M3 6h18M6 12h12M10 18h4" /></svg>;
    case 'inbox':
      return <svg {...p}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>;
    case 'calculator':
      return <svg {...p}><rect x="4" y="2.5" width="16" height="19" rx="2" /><path d="M8 7h8M8 12h2M12 12h2M8 16h2M12 16h2" /><line x1="16" y1="10" x2="16" y2="18" /></svg>;
    case 'leaf':
      return <svg {...p}><path d="M19 3c-3.5 0-7 1.2-9.5 3.8C7.2 9.4 6 13 6 17c4 0 7.6-1.2 9.5-3.8C17.8 10.6 19 7 19 3z" /><path d="M6 17c1.5-1.5 3.3-2.4 5.4-2.8" /></svg>;
    case 'checkCircle':
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2 2 5-5" /></svg>;
    default: return null;
  }
}

/* ─── CATEGORIES ───────────────────────────────────────────────── */
const CATEGORIES = [
  ['limpeza', 'Limpeza', 'broom'],
  ['eletrica', 'Elétrica', 'bolt'],
  ['pintura', 'Pintura', 'palette'],
  ['encanamento', 'Encanamento', 'wrench'],
  ['jardinagem', 'Jardinagem', 'sprout'],
  ['informatica', 'Informática', 'laptop'],
  ['mudanca', 'Mudança', 'box'],
  ['reforma', 'Reforma', 'hardHat'],
  ['cuidado-pessoal', 'Cuidado Pessoal', 'spa'],
  ['aulas', 'Aulas', 'book'],
];

const STATUS = {
  open:      { label: 'Aberto',     icon: 'flame',     color: '#22D31B', bg: 'rgba(34,211,27,0.12)',  border: 'rgba(34,211,27,0.35)' },
  in_review: { label: 'Em análise', icon: 'eye',       color: '#FF7A00', bg: 'rgba(255,122,0,0.12)',  border: 'rgba(255,122,0,0.35)' },
  closed:    { label: 'Encerrado',  icon: 'check',     color: '#5B6B57', bg: 'rgba(91,107,87,0.10)',  border: 'rgba(91,107,87,0.30)' },
  cancelled: { label: 'Cancelado',  icon: 'x',         color: '#B83A08', bg: 'rgba(184,58,8,0.10)',   border: 'rgba(184,58,8,0.30)' },
};

const FILTERS = [
  { key: 'all',        label: 'Todos',      icon: 'inbox' },
  { key: 'open',       label: 'Abertos',    icon: 'flame' },
  { key: 'in_review',  label: 'Em análise', icon: 'eye' },
  { key: 'closed',     label: 'Encerrados', icon: 'check' },
  { key: 'cancelled',  label: 'Cancelados', icon: 'x' },
];

const SORTS = [
  { key: 'recent',  label: 'Mais recentes' },
  { key: 'budget',  label: 'Maior orçamento' },
  { key: 'proposals', label: 'Mais propostas' },
];

/* ─── ANIMATED COUNTER ─────────────────────────────────────────── */
function Counter({ target, suffix = '' }) {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const steps = 50, dur = 1200;
    let cur = 0;
    const inc = target / steps;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setV(target); clearInterval(t); }
      else setV(Math.floor(cur));
    }, dur / steps);
    return () => clearInterval(t);
  }, [inView, target]);
  return <span ref={ref}>{v.toLocaleString('pt-BR')}{suffix}</span>;
}

/* ─── SIMULADOR DE ORÇAMENTO INTELIGENTE ───────────────────────── */
function InstantQuoteSimulator({ themeColors }) {
  const [category, setCategory] = useState('limpeza');
  const [urgency, setUrgency] = useState('urgente');
  const [hours, setHours] = useState(3);

  const baseRates = {
    limpeza: 35,
    eletrica: 65,
    cabelo: 45,
    pedreiro: 55,
    jardim: 40,
    mudanca: 70,
  };

  const multiplier = urgency === 'urgente' ? 1.25 : urgency === 'hoje' ? 1.1 : 1.0;
  const rawPrice = (baseRates[category] || 40) * hours * multiplier;
  const minPrice = Math.round(rawPrice * 0.9);
  const maxPrice = Math.round(rawPrice * 1.15);
  const estimatedLeavesBonus = Math.floor(rawPrice * 0.4);

  return (
    <div
      style={{
        background: themeColors.cardBg,
        border: `1.5px solid ${themeColors.cardBorder}`,
        borderRadius: 24,
        padding: '32px 28px',
        boxShadow: '0 16px 45px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="calculator" size={16} color="#FF7A00" />
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', fontWeight: 800, color: '#FF7A00', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              SIMULADOR INTELIGENTE
            </span>
          </div>
          <h3 style={{ fontFamily: 'var(--display)', fontSize: '1.45rem', fontWeight: 800, color: themeColors.text, marginTop: 4 }}>
            Estime seu orçamento em segundos
          </h3>
        </div>
        <span style={{ fontSize: '0.76rem', color: themeColors.textMuted, background: themeColors.line, padding: '4px 12px', borderRadius: 999 }}>
          Valores médios calculados em Ribeirão Pires
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: themeColors.text, display: 'block', marginBottom: 8 }}>
            1. Tipo de Serviço
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: 10,
              border: `1.5px solid ${themeColors.line}`,
              background: themeColors.cardBg,
              color: themeColors.text,
              fontSize: '0.88rem',
              fontWeight: 600,
              outline: 'none',
            }}
          >
            <option value="limpeza">Limpeza / Diarista</option>
            <option value="eletrica">Eletricista</option>
            <option value="cabelo">Cabelo & Estética</option>
            <option value="pedreiro">Pedreiro & Reformas</option>
            <option value="jardim">Jardinagem</option>
            <option value="mudanca">Mudanças & Frete</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: themeColors.text, display: 'block', marginBottom: 8 }}>
            2. Quando você precisa?
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ id: 'urgente', label: 'Em 1 hora' }, { id: 'hoje', label: 'Hoje' }, { id: 'semana', label: 'Esta semana' }].map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => setUrgency(u.id)}
                style={{
                  flex: 1,
                  padding: '9px 6px',
                  borderRadius: 10,
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: `1.5px solid ${urgency === u.id ? '#FF7A00' : themeColors.line}`,
                  background: urgency === u.id ? 'rgba(255,122,0,0.12)' : 'transparent',
                  color: urgency === u.id ? '#FF7A00' : themeColors.textMuted,
                  transition: 'all 0.2s',
                }}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: themeColors.text }}>
              3. Estimativa de Tempo
            </label>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#FF7A00' }}>
              {hours} hora{hours > 1 ? 's' : ''}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={hours}
            onChange={e => setHours(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#FF7A00', cursor: 'pointer' }}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          padding: '20px 24px',
          borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(255,122,0,0.08), rgba(34,211,27,0.08))',
          border: '1.5px solid rgba(255,122,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <p style={{ fontSize: '0.76rem', color: themeColors.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Faixa Estimada de Investimento
          </p>
          <p style={{ fontFamily: 'var(--display)', fontSize: '2rem', fontWeight: 800, color: themeColors.text, lineHeight: 1.1, marginTop: 4 }}>
            R$ {minPrice} – R$ {maxPrice}
          </p>
          <p style={{ fontSize: '0.74rem', color: '#22D31B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Icon name="leaf" size={14} color="#22D31B" />
            Você acumulará aprox. +{estimatedLeavesBonus} Folhas neste pedido
          </p>
        </div>

        <Link
          href={`/cliente/servicos?category=${category}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, #FF7A00, #FF9A33)',
            color: '#fff',
            borderRadius: 10,
            padding: '12px 24px',
            fontWeight: 800,
            fontSize: '0.88rem',
            textDecoration: 'none',
          }}
        >
          Ver Profissionais Disponíveis <Icon name="arrowRight" size={15} />
        </Link>
      </div>
    </div>
  );
}

/* ─── FLOATING LEAF BACKGROUND ─────────────────────────────────── */
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

/* ─── STICK FIGURE ANT (Accessibility Botao) ──────────────────────── */
// Componente movido para /componentes/acessibilidade/ControlesAcessibilidade.jsx
// O botão e menu de acessibilidade agora são globais via ContextoTema

/* ─── ACCESSIBILITY MENU ─────────────────────────────────────────── */
// Menu de acessibilidade agora é gerenciado globalmente via ContextoTema

/* ─── MAIN COMPONENT ───────────────────────────────────────────── */
export default function ClientQuotesPage() {
  const { user } = usarAutenticacao();
  const toast = useToast();
  const { darkMode } = usarTema();
  const theme = obterCoresTema(darkMode);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [query, setQuery] = useState('');
  const [sortOpen, setSortOpen] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', category: 'limpeza', budget_max: '', city: '',
  });

  useEffect(() => {
    api.get('/orcamentos')
      .then(r => setQuotes(r.data.quotes || []))
      .catch(() => toast('Erro ao carregar orçamentos', 'error'))
      .finally(() => setLoading(false));
  }, []);

  /* ── KPIs ───────────────────────────────────────────── */
  const stats = useMemo(() => {
    const open = quotes.filter(q => q.status === 'open').length;
    const reviewing = quotes.filter(q => q.status === 'in_review').length;
    const totalProposals = quotes.reduce((s, q) => s + (q.proposal_count || 0), 0);
    const totalBudget = quotes.reduce((s, q) => s + (parseFloat(q.budget_max) || 0), 0);
    return { open, reviewing, totalProposals, totalBudget, total: quotes.length };
  }, [quotes]);

  /* ── filtered + sorted ──────────────────────────────── */
  const visible = useMemo(() => {
    let list = [...quotes];
    if (filter !== 'all') list = list.filter(q => q.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(x =>
        x.title?.toLowerCase().includes(q) ||
        x.description?.toLowerCase().includes(q) ||
        x.city?.toLowerCase().includes(q)
      );
    }
    if (sort === 'budget') list.sort((a, b) => (parseFloat(b.budget_max) || 0) - (parseFloat(a.budget_max) || 0));
    else if (sort === 'proposals') list.sort((a, b) => (b.proposal_count || 0) - (a.proposal_count || 0));
    else list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return list;
  }, [quotes, filter, sort, query]);

  /* ── handlers ───────────────────────────────────────── */
  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title || !form.description) { toast('Preencha título e descrição', 'warning'); return; }
    try {
      setSaving(true);
      const { data } = await api.post('/orcamentos', form);
      setQuotes(prev => [{ ...data, proposal_count: 0 }, ...prev]);
      setModal(false);
      setForm({ title: '', description: '', category: 'limpeza', budget_max: '', city: '' });
      toast('Orçamento publicado! Profissionais qualificados serão notificados.', 'success');
    } catch (err) {
      toast(err?.response?.data?.error || 'Erro ao criar orçamento', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;
    setQuotes(prev => prev.filter(q => q.id !== id));
    toast('Orçamento removido.', 'success');
  }

  const leaves = Array.from({ length: 14 }, (_, i) => ({
    delay: i * 1.1 + 0.4,
    x: (i * 7.3) % 100,
    size: 12 + (i % 3) * 4,
    color: i % 2 === 0 ? '#22D31B' : '#FF9A33',
    duration: 9 + (i % 4),
  }));

  return (
    <LayoutPainel>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,700;0,900;1,500;1,700&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        :root {
          --display: 'Fraunces', serif;
          --body: 'Inter', sans-serif;
          --mono: 'IBM Plex Mono', monospace;
        }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        .q-eyebrow {
          font-family: var(--mono);
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${theme.mono};
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .q-eyebrow::before {
          content: '';
          width: 22px;
          height: 1.5px;
          background: #FF7A00;
          display: inline-block;
        }

        .q-search {
          display: flex;
          align-items: center;
          gap: 10px;
          background: ${theme.cardBg};
          border: 1px solid ${theme.line};
          border-radius: 14px;
          padding: 12px 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .q-search:focus-within {
          border-color: #FF7A00;
          box-shadow: 0 0 0 4px rgba(255,122,0,0.08);
        }
        .q-search input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.92rem;
          color: ${theme.text};
          font-family: var(--body);
          font-weight: 500;
        }
        .q-search input::placeholder { color: ${theme.textMuted}; }

        .q-filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid ${theme.line};
          background: ${theme.cardBg};
          font-size: 0.8rem;
          font-weight: 600;
          color: ${theme.textMuted};
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--body);
          white-space: nowrap;
        }
        .q-filter-chip:hover {
          border-color: rgba(255,122,0,0.4);
          color: ${theme.text};
        }
        .q-filter-chip.active {
          background: linear-gradient(135deg, #FF7A00, #FF9A33);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 6px 20px rgba(255,122,0,0.25);
        }

        .q-stat-card {
          position: relative;
          background: ${theme.cardBg};
          border: 1px solid ${theme.cardBorder};
          border-radius: 18px;
          padding: 20px;
          overflow: hidden;
          transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
        }
        .q-stat-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255,122,0,0.3);
          box-shadow: 0 12px 36px rgba(0,0,0,0.06);
        }
        .q-stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
        }
        .q-stat-card.orange::before { background: linear-gradient(90deg, #FF7A00, #FFB347); }
        .q-stat-card.green::before  { background: linear-gradient(90deg, #22D31B, #6BE567); }
        .q-stat-card.gold::before   { background: linear-gradient(90deg, #FF7A00, #22D31B); }
        .q-stat-card.gray::before   { background: ${theme.line}; }

        .q-quote-card {
          position: relative;
          background: ${theme.cardBg};
          border: 1px solid ${theme.cardBorder};
          border-radius: 20px;
          padding: 22px;
          transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
          overflow: hidden;
        }
        .q-quote-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255,122,0,0.3);
          box-shadow: 0 18px 50px rgba(0,0,0,0.08);
        }
        .q-quote-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(180deg, #FF7A00, #22D31B);
          opacity: 0;
          transition: opacity 0.25s;
        }
        .q-quote-card:hover::before { opacity: 1; }

        .q-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid ${theme.line};
          background: transparent;
          color: ${theme.textMuted};
          cursor: pointer;
          transition: all 0.2s;
        }
        .q-action-btn:hover {
          background: rgba(255,122,0,0.08);
          border-color: rgba(255,122,0,0.3);
          color: #FF7A00;
        }
        .q-action-btn.danger:hover {
          background: rgba(184,58,8,0.08);
          border-color: rgba(184,58,8,0.3);
          color: #B83A08;
        }

        .q-pulse {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .q-pulse::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.4;
          animation: pulse 1.8s ease-out infinite;
        }
        @keyframes pulse {
          0%   { transform: scale(0.8); opacity: 0.5; }
          70%  { transform: scale(2.5); opacity: 0; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        .q-input {
          width: 100%;
          background: ${theme.cardBg};
          border: 1.5px solid ${theme.line};
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 0.92rem;
          color: ${theme.text};
          font-family: var(--body);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .q-input:focus {
          border-color: #FF7A00;
          box-shadow: 0 0 0 4px rgba(255,122,0,0.08);
        }
        .q-input::placeholder { color: ${theme.textMuted}; }

        @media (max-width: 768px) {
          .q-quote-actions { flex-wrap: wrap; }
          .stick-ant-container { bottom: 80px !important; right: 14px !important; width: 52px !important; height: 52px !important; }
        }
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
        >
          <div>
            <div className="q-eyebrow" style={{ marginBottom: 10 }}>Seus pedidos</div>
            <h1 style={{
              fontFamily: 'var(--display)',
              fontWeight: 900,
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
              color: theme.text,
              margin: 0,
            }}>
              Meus <span style={{ color: '#FF7A00', fontStyle: 'italic' }}>Orçamentos</span>
            </h1>
            <p style={{ color: theme.textMuted, fontSize: '0.95rem', marginTop: 8, maxWidth: 520 }}>
              Publique o que precisa e receba propostas de profissionais verificados. Compare, escolha e contrate.
            </p>
          </div>

          <motion.button
            onClick={() => setModal(true)}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #FF7A00, #FF9A33)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.9rem',
              padding: '13px 22px',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(255,122,0,0.30)',
              fontFamily: 'var(--body)',
              overflow: 'hidden',
            }}
          >
            <Icon name="plus" size={17} color="#fff" />
            Novo orçamento
          </motion.button>
        </motion.div>

        {/* ─── KPI STRIP ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}
        >
          <div className="q-stat-card orange">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: theme.textMuted, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Abertos</span>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,122,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="flame" size={15} color="#FF7A00" />
              </span>
            </div>
            <p style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: '1.9rem', color: '#FF7A00', lineHeight: 1, margin: 0 }}>
              <Counter target={stats.open} />
            </p>
            <p style={{ fontSize: '0.75rem', color: theme.textMuted, marginTop: 6 }}>Recebendo propostas</p>
          </div>

          <div className="q-stat-card green">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: theme.textMuted, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Propostas</span>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(34,211,27,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="users" size={15} color="#22D31B" />
              </span>
            </div>
            <p style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: '1.9rem', color: '#22D31B', lineHeight: 1, margin: 0 }}>
              <Counter target={stats.totalProposals} />
            </p>
            <p style={{ fontSize: '0.75rem', color: theme.textMuted, marginTop: 6 }}>Recebidas no total</p>
          </div>

          <div className="q-stat-card gold">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: theme.textMuted, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Investido</span>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, rgba(255,122,0,0.12), rgba(34,211,27,0.12))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="money" size={15} color="#FF7A00" />
              </span>
            </div>
            <p style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: '1.9rem', color: theme.text, lineHeight: 1, margin: 0 }}>
              R$&nbsp;<Counter target={Math.round(stats.totalBudget)} />
            </p>
            <p style={{ fontSize: '0.75rem', color: theme.textMuted, marginTop: 6 }}>Soma dos orçamentos</p>
          </div>

          <div className="q-stat-card gray">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: theme.textMuted, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Total</span>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: theme.line, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="inbox" size={15} color={theme.textMuted} />
              </span>
            </div>
            <p style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: '1.9rem', color: theme.text, lineHeight: 1, margin: 0 }}>
              <Counter target={stats.total} />
            </p>
            <p style={{ fontSize: '0.75rem', color: theme.textMuted, marginTop: 6 }}>Publicados</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ marginBottom: 22 }}
        >
          <div style={{ marginBottom: 18 }}>
            <InstantQuoteSimulator themeColors={theme} />
          </div>
        </motion.div>

        {/* ─── SEARCH + FILTER + SORT BAR ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ marginBottom: 22 }}
        >
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <div className="q-search" style={{ flex: '1 1 280px' }}>
              <Icon name="search" size={17} color={theme.textMuted} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por título, descrição ou cidade..."
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', padding: 4 }}
                >
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setSortOpen(o => !o)}
                className="q-filter-chip"
                style={{ height: '100%', padding: '12px 14px' }}
              >
                <Icon name="sort" size={14} />
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
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: 0,
                        minWidth: 180,
                        background: theme.cardBg,
                        border: `1px solid ${theme.line}`,
                        borderRadius: 12,
                        padding: 6,
                        zIndex: 40,
                        boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                      }}
                    >
                      {SORTS.map(s => (
                        <button
                          key={s.key}
                          onClick={() => { setSort(s.key); setSortOpen(false); }}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '9px 12px',
                            borderRadius: 8,
                            border: 'none',
                            background: sort === s.key ? 'rgba(255,122,0,0.10)' : 'transparent',
                            color: sort === s.key ? '#FF7A00' : theme.text,
                            fontWeight: sort === s.key ? 700 : 500,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            fontFamily: 'var(--body)',
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

          {/* filter chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {FILTERS.map(f => {
              const count = f.key === 'all' ? quotes.length : quotes.filter(q => q.status === f.key).length;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`q-filter-chip ${filter === f.key ? 'active' : ''}`}
                >
                  <Icon name={f.icon} size={13} />
                  {f.label}
                  <span style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 6,
                    background: filter === f.key ? 'rgba(255,255,255,0.25)' : theme.line,
                    color: filter === f.key ? '#fff' : theme.textMuted,
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ─── LIST ─────────────────────────────────────────────── */}
        {loading ? (
          <ListEsqueleto count={3} />
        ) : visible.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background: theme.cardBg,
              border: `1px dashed ${theme.line}`,
              borderRadius: 20,
              padding: '60px 24px',
              textAlign: 'center',
            }}
          >
            <div style={{
              width: 80, height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255,122,0,0.10), rgba(34,211,27,0.10))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
              border: `1px solid ${theme.line}`,
            }}>
              <Icon name="inbox" size={32} color={theme.textMuted} />
            </div>
            <h3 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '1.25rem', color: theme.text, marginBottom: 6 }}>
              {filter === 'all' ? 'Nenhum orçamento ainda' : 'Nada por aqui'}
            </h3>
            <p style={{ color: theme.textMuted, fontSize: '0.88rem', maxWidth: 360, margin: '0 auto 22px' }}>
              {filter === 'all'
                ? 'Publique o que você precisa e receba propostas de profissionais verificados.'
                : 'Não encontramos orçamentos com esse filtro. Tente outro status.'}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setModal(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #FF7A00, #FF9A33)',
                  color: '#fff', fontWeight: 800, fontSize: '0.88rem',
                  padding: '12px 22px', border: 'none', borderRadius: 12,
                  cursor: 'pointer', boxShadow: '0 8px 24px rgba(255,122,0,0.30)',
                  fontFamily: 'var(--body)',
                }}
              >
                <Icon name="plus" size={15} color="#fff" />
                Criar primeiro orçamento
              </button>
            )}
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {visible.map((q, i) => {
              const st = STATUS[q.status] || STATUS.open;
              const categoryObj = CATEGORIES.find(([v]) => v === q.category) || CATEGORIES[0];
              const hasProposals = (q.proposal_count || 0) > 0;
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                  layout
                >
                  <div className="q-quote-card">
                    {/* header row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                      <div style={{
                        width: 48, height: 48, flexShrink: 0,
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, rgba(255,122,0,0.10), rgba(34,211,27,0.10))',
                        border: `1px solid ${theme.line}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.4rem',
                      }}>
                        {categoryObj[2]}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <h3 style={{
                            fontFamily: 'var(--display)',
                            fontWeight: 700,
                            fontSize: '1.05rem',
                            color: theme.text,
                            margin: 0,
                            lineHeight: 1.25,
                          }}>
                            {q.title}
                          </h3>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 9px',
                            borderRadius: 999,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            fontFamily: 'var(--body)',
                            background: st.bg,
                            color: st.color,
                            border: `1px solid ${st.border}`,
                            whiteSpace: 'nowrap',
                          }}>
                            {q.status === 'open' && <span className="q-pulse" style={{ color: st.color }} />}
                            <Icon name={st.icon} size={10} color={st.color} />
                            {st.label}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: '0.78rem', color: theme.textMuted }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Icon name="tag" size={12} />
                            {categoryObj[1]}
                          </span>
                          {q.city && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Icon name="pin" size={12} />
                              {q.city}
                            </span>
                          )}
                          {q.created_at && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Icon name="clock" size={12} />
                              {new Date(q.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* action buttons */}
                      <div className="q-quote-actions" style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button className="q-action-btn" title="Ver propostas" aria-label="Ver propostas">
                          <Icon name="eye" size={15} />
                        </button>
                        <button className="q-action-btn" title="Editar" aria-label="Editar">
                          <Icon name="edit" size={15} />
                        </button>
                        <button className="q-action-btn danger" onClick={() => handleDelete(q.id)} title="Excluir" aria-label="Excluir">
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </div>

                    {/* description */}
                    <p style={{
                      fontSize: '0.86rem',
                      color: theme.textMuted,
                      lineHeight: 1.55,
                      margin: '0 0 16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {q.description}
                    </p>

                    {/* footer stats */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 14,
                      borderTop: `1px solid ${theme.line}`,
                      gap: 12,
                      flexWrap: 'wrap',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                        {/* proposals */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: hasProposals ? 'rgba(34,211,27,0.12)' : theme.line,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Icon name="users" size={13} color={hasProposals ? '#22D31B' : theme.textMuted} />
                          </div>
                          <div>
                            <p style={{
                              fontFamily: 'var(--display)',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              color: hasProposals ? '#22D31B' : theme.text,
                              lineHeight: 1,
                              margin: 0,
                            }}>
                              {q.proposal_count || 0}
                            </p>
                            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: theme.textMuted, marginTop: 2 }}>
                              {q.proposal_count === 1 ? 'proposta' : 'propostas'}
                            </p>
                          </div>
                        </div>

                        {/* budget */}
                        {q.budget_max && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: 8,
                              background: 'rgba(255,122,0,0.10)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Icon name="money" size={13} color="#FF7A00" />
                            </div>
                            <div>
                              <p style={{
                                fontFamily: 'var(--display)',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                color: theme.text,
                                lineHeight: 1,
                                margin: 0,
                              }}>
                                R$ {parseFloat(q.budget_max).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                              </p>
                              <p style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: theme.textMuted, marginTop: 2 }}>
                                orçamento máx.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <Link href={`/cliente/orcamentos/${q.id}`} style={{ textDecoration: 'none' }}>
                        <motion.span
                          whileHover={{ x: 4 }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            color: '#FF7A00', fontWeight: 700, fontSize: '0.82rem',
                            cursor: 'pointer',
                            fontFamily: 'var(--body)',
                          }}
                        >
                          {hasProposals ? 'Ver propostas' : 'Ver detalhes'}
                          <Icon name="arrowRight" size={13} />
                        </motion.span>
                      </Link>
                    </div>

                    {/* highlight bar for items with proposals */}
                    {hasProposals && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.6, delay: i * 0.05 + 0.2 }}
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          height: 3,
                          background: 'linear-gradient(90deg, #22D31B, #6BE567)',
                          transformOrigin: 'left',
                          width: '100%',
                        }}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ─── INSIGHT BAR ─────────────────────────────────────── */}
        {!loading && quotes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              marginTop: 28,
              padding: 18,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(255,122,0,0.08), rgba(34,211,27,0.08))',
              border: `1px solid ${theme.line}`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #FF7A00, #22D31B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon name="lightning" size={18} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{
                fontFamily: 'var(--display)', fontWeight: 700,
                fontSize: '0.95rem', color: theme.text, margin: 0,
              }}>
                Dica: responda rápido para fechar mais serviços
              </p>
              <p style={{ fontSize: '0.78rem', color: theme.textMuted, margin: '3px 0 0' }}>
                Orçamentos com resposta em até 15 minutos recebem 3x mais propostas.
              </p>
            </div>
            <button
              onClick={() => setModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'transparent',
                color: '#FF7A00',
                fontWeight: 700, fontSize: '0.82rem',
                padding: '9px 14px',
                border: '1.5px solid #FF7A00',
                borderRadius: 10,
                cursor: 'pointer',
                fontFamily: 'var(--body)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FF7A00'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FF7A00'; }}
            >
              Criar agora
              <Icon name="arrowRight" size={13} />
            </button>
          </motion.div>
        )}
      </div>

      {/* ─── MODAL ─────────────────────────────────────────────── */}
      <Modal open={modal} onClose={() => setModal(false)} title="Novo orçamento" size="md">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6, fontFamily: 'var(--body)' }}>
              Título do serviço *
            </label>
            <input
              className="q-input"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Ex: Instalar tomadas e interruptores"
              style={{ fontFamily: 'var(--body)' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6, fontFamily: 'var(--body)' }}>
              Descreva o que precisa *
            </label>
            <textarea
              className="q-input"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Detalhes, cômodos, prazo desejado..."
              rows={4}
              style={{ resize: 'vertical', minHeight: 100, fontFamily: 'var(--body)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6, fontFamily: 'var(--body)' }}>
                Categoria
              </label>
              <select
                className="q-input"
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={{ fontFamily: 'var(--body)' }}
              >
                {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6, fontFamily: 'var(--body)' }}>
                Orçamento máx. (R$)
              </label>
              <input
                className="q-input"
                type="number"
                value={form.budget_max}
                onChange={e => setForm(p => ({ ...p, budget_max: e.target.value }))}
                placeholder="Ex: 500"
                style={{ fontFamily: 'var(--body)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.text, display: 'block', marginBottom: 6, fontFamily: 'var(--body)' }}>
              Cidade
            </label>
            <input
              className="q-input"
              value={form.city}
              onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              placeholder="Ex: São Paulo, SP"
              style={{ fontFamily: 'var(--body)' }}
            />
          </div>

          <div style={{
            padding: 12,
            borderRadius: 10,
            background: 'rgba(34,211,27,0.08)',
            border: '1px solid rgba(34,211,27,0.25)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
            <Icon name="check" size={14} color="#22D31B" />
            <p style={{ fontSize: '0.75rem', color: theme.text, margin: 0, lineHeight: 1.5 }}>
              Profissionais qualificados serão notificados em tempo real. A primeira resposta chega em média em 15 minutos.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%',
              background: saving ? '#999' : 'linear-gradient(135deg, #FF7A00, #FF9A33)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.95rem',
              padding: '14px',
              border: 'none',
              borderRadius: 12,
              cursor: saving ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: saving ? 'none' : '0 8px 24px rgba(255,122,0,0.30)',
              fontFamily: 'var(--body)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => !saving && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            {saving ? (
              <>
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Icon name="clock" size={16} color="#fff" />
                </motion.span>
                Publicando...
              </>
            ) : (
              <>
                <Icon name="sparkle" size={16} color="#fff" />
                Publicar orçamento
              </>
            )}
          </button>
        </form>
      </Modal>
    </LayoutPainel>
  );
}
