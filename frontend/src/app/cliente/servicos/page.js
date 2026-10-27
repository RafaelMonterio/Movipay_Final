'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import Modal from '@/componentes/interface/JanelaModal';
import SharedIcon from '@/componentes/interface/Icone';
import api from '@/servicos/clienteApi';
import { haversineKm } from '@/utilitarios/geolocalizacao';
import { CENTRO_CIDADE_PADRAO } from '@/componentes/mapa/MapaProfissionais';

/* ─── DESIGN TOKENS ─────────────────────────────────────────────────── */
// Fraunces (display), Inter (body), IBM Plex Mono (mono)
// Laranja #FF7A00 | Verde #22D31B | Fundo #FAF6EC / #121A0F

/* ─── SVG ICONS ─────────────────────────────────────────────────────── */
function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 1.8, style }) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style,
  };
  switch (name) {
    case 'search':
      return (
        <svg {...p}>
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case 'star':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" style={style}>
          <polygon points="12 2 15.09 8.63 22 9.24 16.5 14.14 18.18 21 12 17.27 5.82 21 7.5 14.14 2 9.24 8.91 8.63 12 2" />
        </svg>
      );
    case 'arrowRight':
      return (
        <svg {...p}>
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      );
    case 'x':
      return (
        <svg {...p}>
          <line x1="4" y1="4" x2="20" y2="20" />
          <line x1="20" y1="4" x2="4" y2="20" />
        </svg>
      );
    case 'checkCircle':
      return (
        <svg {...p}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'mapPin':
      return (
        <svg {...p}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 16 14" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...p}>
          <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
        </svg>
      );
    case 'leaf':
      return (
        <svg {...p}>
          <path d="M5 21c0-9 6-15 15-15-1 9-7 15-15 15z" />
          <path d="M5 21c3-3 6-6 9-9" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="4.5" />
          <line x1="12" y1="1.5" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22.5" />
          <line x1="4.2" y1="4.2" x2="6" y2="6" />
          <line x1="18" y1="18" x2="19.8" y2="19.8" />
          <line x1="1.5" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22.5" y2="12" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...p}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg {...p}>
          <path d="M12 2l1.5 5h5L14 10.5l1.5 5L12 13l-3.5 2.5L10 10.5 5.5 7h5z" />
        </svg>
      );
    case 'bolt':
      return (
        <svg {...p}>
          <polygon points="13 2 3 14 11 14 9 22 21 10 13 10 13 2" />
        </svg>
      );
    case 'broom':
      return (
        <svg {...p}>
          <line x1="13" y1="2" x2="7" y2="15" />
          <path d="M7 15l-3.5 6.5 9-2.5 3.5-6.5z" />
        </svg>
      );
    case 'paint':
      return (
        <svg {...p}>
          <rect x="3" y="4" width="12" height="6" rx="1" />
          <line x1="9" y1="10" x2="9" y2="16" />
          <rect x="6" y="16" width="6" height="5" rx="1" />
        </svg>
      );
    case 'scissors':
      return (
        <svg {...p}>
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
      );
    case 'box':
      return (
        <svg {...p}>
          <path d="M21 8l-9-5-9 5 9 5 9-5z" />
          <path d="M3 8v8l9 5 9-5V8" />
          <line x1="12" y1="13" x2="12" y2="21" />
        </svg>
      );
    case 'chevronDown':
      return (
        <svg {...p}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      );
    default:
      return null;
  }
}

/* ─── DADOS DE CATEGORIAS ────────────────────────────────────────────── */
const categoryGroups = [
  {
    id: 'conveniencia',
    title: 'Conveniência',
    icon: 'bolt',
    color: '#FF7A00',
    colorLight: 'rgba(255,122,0,0.10)',
    colorBorder: 'rgba(255,122,0,0.25)',
    cards: [
      {
        id: 'barbeiro',
        name: 'Barbeiro',
        subtitle: 'Cabelo, barba e estética',
        icon: 'scissors',
        accent: 'from-rose-500 via-red-500 to-red-600',
        badge: 'Hoje',
        badgeColor: '#FF7A00',
      },
      {
        id: 'faxina',
        name: 'Faxina',
        subtitle: 'Casa e escritório',
        icon: 'broom',
        accent: 'from-sky-500 via-cyan-500 to-teal-500',
        badge: 'Próximo',
        badgeColor: '#22D31B',
      },
      {
        id: 'pintura',
        name: 'Pintura',
        subtitle: 'Reformas e acabamento',
        icon: 'paint',
        accent: 'from-violet-500 via-purple-500 to-fuchsia-500',
        badge: 'Top',
        badgeColor: '#FF7A00',
      },
      {
        id: 'manicure', name: 'Manicure', subtitle: 'Unhas e cuidados pessoais', icon: 'sparkle',
        accent: 'from-pink-600 via-red-500 to-orange-500', badge: 'Popular', badgeColor: '#22D31B',
      },
      {
        id: 'eletricista', name: 'Eletricista', subtitle: 'Instalações e reparos', icon: 'bolt',
        accent: 'from-yellow-700 via-amber-600 to-orange-500', badge: 'Urgente', badgeColor: '#FF7A00',
      },
    ],
  },
  {
    id: 'fornecedores',
    title: 'Fornecedores',
    icon: 'store',
    color: '#22D31B',
    colorLight: 'rgba(34,211,27,0.08)',
    colorBorder: 'rgba(34,211,27,0.22)',
    cards: [
      {
        id: 'marcenaria',
        name: 'Marcenarias',
        subtitle: 'Móveis e reformas',
        icon: 'box',
        accent: 'from-yellow-700 via-amber-600 to-orange-500',
        badge: 'Sob medida',
        badgeColor: '#FF7A00',
      },
      {
        id: 'serralheria', name: 'Serralheria', subtitle: 'Portões, grades e estruturas', icon: 'shield',
        accent: 'from-slate-700 via-slate-800 to-slate-900', badge: 'Resistente', badgeColor: '#22D31B',
      },
      {
        id: 'vidracaria', name: 'Vidracaria', subtitle: 'Vidros, espelhos e box', icon: 'sparkle',
        accent: 'from-sky-500 via-cyan-500 to-teal-500', badge: 'Novo', badgeColor: '#22D31B',
      },
      {
        id: 'montagem', name: 'Montagem de Móveis', subtitle: 'Montagem rápida e segura', icon: 'box',
        accent: 'from-violet-500 via-purple-500 to-indigo-600', badge: 'Prático', badgeColor: '#FF7A00',
      },
    ],
  },
  {
    id: 'digitais',
    title: 'Serviços Digitais',
    icon: 'laptop',
    color: '#FF7A00',
    colorLight: 'rgba(255,122,0,0.08)',
    colorBorder: 'rgba(255,122,0,0.20)',
    cards: [
      {
        id: 'design',
        name: 'Design Gráfico',
        subtitle: 'Identidade visual e artes',
        icon: 'sparkle',
        accent: 'from-violet-500 via-purple-500 to-indigo-600',
        badge: 'Popular',
        badgeColor: '#22D31B',
      },
      {
        id: 'sites',
        name: 'Criação de Sites',
        subtitle: 'Landing pages e lojas',
        icon: 'search',
        accent: 'from-slate-700 via-slate-800 to-slate-900',
        badge: 'Web',
        badgeColor: '#FF7A00',
      },
      {
        id: 'video',
        name: 'Edição de Vídeo',
        subtitle: 'Reels e anúncios',
        icon: 'shield',
        accent: 'from-pink-600 via-red-500 to-orange-500',
        badge: 'Shorts',
        badgeColor: '#22D31B',
      },
      {
        id: 'social-media', name: 'Social Media', subtitle: 'Conteúdo e redes sociais', icon: 'sparkle',
        accent: 'from-pink-600 via-red-500 to-orange-500', badge: 'Em alta', badgeColor: '#22D31B',
      },
      {
        id: 'fotografia', name: 'Fotografia', subtitle: 'Eventos, produtos e retratos', icon: 'star',
        accent: 'from-violet-500 via-purple-500 to-fuchsia-500', badge: 'Criativo', badgeColor: '#FF7A00',
      },
      {
        id: 'suporte',
        name: 'Suporte Técnico',
        subtitle: 'Configuração e ajuda',
        icon: 'clock',
        accent: 'from-indigo-500 via-blue-500 to-cyan-500',
        badge: '24/7',
        badgeColor: '#FF7A00',
      },
    ],
  },
];

/* ─── PRESTADORES REAIS ──────────────────────────────────────────────── */
// Cada card de serviço corresponde a uma categoria de profissional
// cadastrada na plataforma. Os prestadores exibidos vêm SEMPRE da API
// (/profissionais) — profissionais reais, com a localização que cadastraram —
// e não de uma lista fixa de pessoas fictícias. Serviços sem nenhum
// profissional cadastrado mostram o estado vazio.
const SERVICE_CATEGORY = {
  barbeiro: ['cabelo', 'cuidado-pessoal'], manicure: ['cabelo', 'cuidado-pessoal'],
  faxina: ['limpeza'], eletricista: ['eletrica'], pintura: ['pintura'],
  montagem: ['mudanca'], design: ['informatica'], sites: ['informatica'], suporte: ['informatica'],
};
const CATEGORY_LABEL = {
  eletrica: 'Elétrica', hidraulica: 'Hidráulica', limpeza: 'Limpeza',
  cabelo: 'Cabelo & Estética', pedreiro: 'Pedreiro & Reformas',
  jardinagem: 'Jardinagem', mudanca: 'Mudanças & Frete', pintura: 'Pintura',
  encanamento: 'Encanamento', informatica: 'Informática', reforma: 'Reformas',
  'cuidado-pessoal': 'Cuidado Pessoal', aulas: 'Aulas',
};
const AVATAR_GRADS = [
  'linear-gradient(135deg, #FF7A00, #FF4500)',
  'linear-gradient(135deg, #7C3AED, #4F46E5)',
  'linear-gradient(135deg, #16A34A, #22D31B)',
  'linear-gradient(135deg, #0EA5E9, #2563EB)',
];

function toPrestador(w, index) {
  const km = Number.isFinite(w.lat) ? haversineKm(CENTRO_CIDADE_PADRAO[0], CENTRO_CIDADE_PADRAO[1], w.lat, w.lng) : null;
  return {
    id: w.id,
    nome: w.name,
    iniciais: (w.name || '?').split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase(),
    avatarGrad: AVATAR_GRADS[index % AVATAR_GRADS.length],
    nota: Number(w.avg_rating) || 0,
    avaliacoes: w.total_orders || 0,
    distancia: km != null ? `${km} km` : (w.city || '—'),
    preco: 'A combinar',
    badge: w.is_available ? 'Disponível agora' : 'Indisponível',
    badgeColor: w.is_available ? '#22D31B' : '#94A3B8',
    descricao: w.bio || 'Profissional cadastrado no MoviPay.',
    especialidades: [CATEGORY_LABEL[w.category] || 'Serviços gerais'],
    tempoResposta: 'Em breve',
  };
}

/* ─── PARTICLE BACKGROUND ────────────────────────────────────────────── */
function ParticleBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.parentElement.clientWidth;
    let h = canvas.parentElement.clientHeight || 200;
    canvas.width = w;
    canvas.height = h;

    const pts = Array.from({ length: 28 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: 1 + Math.random() * 1.5,
      a: 0.15 + Math.random() * 0.35,
    }));

    let id;
    function loop() {
      ctx.clearRect(0, 0, w, h);
      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,122,0,${p.a})`;
        ctx.fill();
      });
      pts.forEach((a, i) =>
        pts.slice(i + 1).forEach((b) => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(34,211,27,${0.08 * (1 - d / 90)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        })
      );
      id = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}

/* ─── FLOATING LEAVES ────────────────────────────────────────────────── */
function FloatingLeaf({ delay, x, size, color, duration }) {
  return (
    <motion.div
      className="pointer-events-none absolute top-0"
      style={{ left: x + '%', position: 'fixed', top: 0, zIndex: 0 }}
      initial={{ y: -40, opacity: 0, rotate: 0 }}
      animate={{ y: '110vh', opacity: [0, 0.85, 0.85, 0], rotate: [0, 160, 320, 480] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    >
      <Icon name="leaf" size={size} color={color} />
    </motion.div>
  );
}

/* ─── SPARKLE RAIN ───────────────────────────────────────────────────── */
function SparkleRain() {
  const sparkles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        x: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 3 + Math.random() * 4,
        size: 2 + Math.random() * 3,
        color: i % 3 === 0 ? '#FF7A00' : i % 3 === 1 ? '#22D31B' : '#FFB347',
      })),
    []
  );

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {sparkles.map((s, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: s.x + '%',
            top: '-10%',
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: s.color,
            boxShadow: `0 0 10px ${s.color}`,
            opacity: 0,
          }}
          animate={{
            y: ['0vh', '110vh'],
            opacity: [0, 0.8, 0.8, 0],
            scale: [0.5, 1.5, 0.5],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

/* ─── ACCESSIBILITY MENU ─────────────────────────────────────────────── */
function AccessibilityMenu({ isOpen, onClose, theme }) {
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [protanopia, setProtanopia] = useState(false);
  const [deuteranopia, setDeuteranopia] = useState(false);
  const [tritanopia, setTritanopia] = useState(false);
  const [fontSize, setFontSize] = useState(100);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.style.filter = '';
    html.style.webkitFilter = '';
    html.style.fontSize = '';
    html.dataset.darkMode = String(darkMode);
    html.dataset.highContrast = String(highContrast);
    html.dataset.daltonism = protanopia ? 'protanopia' : deuteranopia ? 'deuteranopia' : tritanopia ? 'tritanopia' : 'none';

    let filters = [];
    if (highContrast) filters.push('contrast(1.8)');
    if (protanopia) filters.push('url(#protanopia)');
    else if (deuteranopia) filters.push('url(#deuteranopia)');
    else if (tritanopia) filters.push('url(#tritanopia)');
    if (filters.length > 0) {
      html.style.filter = filters.join(' ');
      html.style.webkitFilter = filters.join(' ');
    }
    if (fontSize !== 100) html.style.fontSize = fontSize + '%';
    return () => {
      html.style.filter = '';
      html.style.webkitFilter = '';
      html.style.fontSize = '';
      html.dataset.darkMode = 'false';
      html.dataset.highContrast = 'false';
      html.dataset.daltonism = 'none';
    };
  }, [highContrast, protanopia, deuteranopia, tritanopia, fontSize, darkMode]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    let svg = document.getElementById('color-blindness-filters');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'color-blindness-filters';
      svg.style.cssText = 'position:absolute;width:0;height:0;';
      svg.innerHTML = `
        <filter id="protanopia">
          <feColorMatrix type="matrix" values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0"/>
        </filter>
        <filter id="deuteranopia">
          <feColorMatrix type="matrix" values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0"/>
        </filter>
        <filter id="tritanopia">
          <feColorMatrix type="matrix" values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0"/>
        </filter>
      `;
      document.body.prepend(svg);
    }
  }, []);

  const menuItems = [
    { id: 'darkMode', label: 'Modo Escuro', icon: darkMode ? 'sun' : 'moon', active: darkMode, onClick: () => setDarkMode(!darkMode) },
    { id: 'highContrast', label: 'Alto Contraste', icon: 'shield', active: highContrast, onClick: () => setHighContrast(!highContrast) },
    { id: 'protanopia', label: 'Protanopia', icon: 'leaf', active: protanopia, onClick: () => { setProtanopia(!protanopia);
      setDeuteranopia(false);
      setTritanopia(false); } },
    { id: 'deuteranopia', label: 'Deuteranopia', icon: 'leaf', active: deuteranopia, onClick: () => { setDeuteranopia(!deuteranopia);
      setProtanopia(false);
      setTritanopia(false); } },
    { id: 'tritanopia', label: 'Tritanopia', icon: 'leaf', active: tritanopia, onClick: () => { setTritanopia(!tritanopia);
      setProtanopia(false);
      setDeuteranopia(false); } },
  ];

  const fontSizeOptions = [
    { value: 80, label: 'A' },
    { value: 100, label: 'A' },
    { value: 120, label: 'A' },
    { value: 140, label: 'A' },
  ];

  const isActive = protanopia || deuteranopia || tritanopia || highContrast || darkMode || fontSize !== 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 150,
            }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 90,
              right: 20,
              width: 320,
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
              background: theme.cardBg,
              borderRadius: 20,
              border: `1px solid ${theme.cardBorder}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              padding: 24,
              zIndex: 160,
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: theme.text }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><SharedIcon name="accessibility" size={18} /> Acessibilidade</span></h3>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8, color: theme.textMuted }}>
                <Icon name="x" size={20} color={theme.textMuted} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: theme.textMuted, marginBottom: 20 }}>Ajuste a experiência para suas necessidades</p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: 12,
                marginBottom: 12,
                cursor: 'pointer',
                border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              }}
              onClick={() => setDarkMode(!darkMode)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: theme.text }}>
                <Icon name={darkMode ? 'moon' : 'sun'} size={18} color="#FF7A00" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Modo {darkMode ? 'Claro' : 'Escuro'}</span>
              </span>
              <motion.div
                style={{
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  background: darkMode ? '#FF7A00' : '#ccc',
                  position: 'relative',
                  transition: 'background 0.3s',
                }}
              >
                <motion.div
                  style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: 2 }}
                  animate={{ x: darkMode ? 18 : 0 }}
                  transition={{ type: 'spring', damping: 20 }}
                />
              </motion.div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  onClick={item.onClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: item.active ? 'rgba(255,122,0,0.12)' : 'transparent',
                    border: `1px solid ${item.active ? 'rgba(255,122,0,0.3)' : 'transparent'}`,
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: theme.text }}>
                    <Icon name={item.icon} size={16} color={item.active ? '#FF7A00' : theme.textMuted} />
                    <span style={{ fontSize: '0.85rem', fontWeight: item.active ? 700 : 500 }}>{item.label}</span>
                  </span>
                  {item.active && (
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#FF7A00', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem' }}><SharedIcon name="check" size={11} color="#fff" strokeWidth={3} /></span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
              <p style={{ fontSize: '0.8rem', color: theme.textMuted, marginBottom: 10, fontWeight: 600 }}>Tamanho da fonte</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {fontSizeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFontSize(opt.value)}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      borderRadius: 10,
                      border: `2px solid ${fontSize === opt.value ? '#FF7A00' : darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                      background: fontSize === opt.value ? 'rgba(255,122,0,0.1)' : 'transparent',
                      color: fontSize === opt.value ? '#FF7A00' : theme.text,
                      fontSize: `${(opt.value / 100) * 14}px`,
                      fontWeight: fontSize === opt.value ? 800 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setHighContrast(false);
                setProtanopia(false);
                setDeuteranopia(false);
                setTritanopia(false);
                setFontSize(100);
                if (darkMode) setDarkMode(false);
              }}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '10px',
                borderRadius: 12,
                border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                background: 'transparent',
                color: theme.textMuted,
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <SharedIcon name="refresh" size={13} /> Restaurar padrões
            </button>

            <div
              style={{
                marginTop: 12,
                padding: '8px 12px',
                borderRadius: 8,
                background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                fontSize: '0.7rem',
                color: theme.textMuted,
                textAlign: 'center',
              }}
            >
              {isActive ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><SharedIcon name="checkCircle" size={13} /> Configurações personalizadas ativas</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><SharedIcon name="info" size={13} /> Nenhuma configuração ativa</span>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── ACCESSIBILITY BUTTON ──────────────────────────────────────────── */
function AccessibilityBotao({ isOpen, onClick, theme, darkMode }) {
  return (
    <motion.div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 200,
        cursor: 'pointer',
        width: 60,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: darkMode ? 'rgba(255,122,0,0.15)' : 'rgba(255,122,0,0.12)',
        border: `2px solid ${darkMode ? 'rgba(255,122,0,0.4)' : 'rgba(255,122,0,0.3)'}`,
        boxShadow: '0 4px 20px rgba(255,122,0,0.25)',
        backdropFilter: 'blur(8px)',
      }}
      whileHover={{ scale: 1.12, rotate: -5 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      role="button"
      aria-label="Abrir menu de acessibilidade"
      title="Acessibilidade"
    >
      <motion.img
        src="/img/logo.png"
        alt="Acessibilidade"
        style={{ width: 44, height: 44, objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
        animate={isOpen ? { rotate: 180 } : { rotate: 0 }}
        transition={{ duration: 0.4 }}
        draggable={false}
      />
      <motion.div
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: '50%',
          border: '2px solid rgba(255,122,0,0.2)',
          pointerEvents: 'none',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

/* ─── CARD DE CATEGORIA ─────────────────────────────────────────────── */
function CategoryCard({ card, group, onClick, index }) {
  const accentColors = {
    'from-rose-500 via-red-500 to-red-600': ['#F43F5E', '#EF4444', '#DC2626'],
    'from-sky-500 via-cyan-500 to-teal-500': ['#0EA5E9', '#06B6D4', '#14B8A6'],
    'from-violet-500 via-purple-500 to-fuchsia-500': ['#8B5CF6', '#A855F7', '#D946EF'],
    'from-yellow-700 via-amber-600 to-orange-500': ['#B45309', '#D97706', '#F97316'],
    'from-violet-500 via-purple-500 to-indigo-600': ['#8B5CF6', '#A855F7', '#4F46E5'],
    'from-slate-700 via-slate-800 to-slate-900': ['#334155', '#1E293B', '#0F172A'],
    'from-pink-600 via-red-500 to-orange-500': ['#DB2777', '#EF4444', '#F97316'],
    'from-indigo-500 via-blue-500 to-cyan-500': ['#6366F1', '#3B82F6', '#06B6D4'],
  };
  const [c1, c2, c3] = accentColors[card.accent] || ['#FF7A00', '#FF9A33', '#FFB347'];

  return (
    <motion.button
      onClick={() => onClick(card, group)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ y: -8, scale: 1.03, boxShadow: `0 16px 40px ${c1}66` }}
      whileTap={{ scale: 0.97 }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.15)',
        background: `linear-gradient(135deg, ${c1}, ${c2}, ${c3})`,
        padding: '24px',
        textAlign: 'left',
        color: '#fff',
        cursor: 'pointer',
        boxShadow: `0 8px 32px ${c1}44`,
        transition: 'box-shadow 0.25s',
        display: 'block',
        width: '100%',
      }}
    >
      <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
      <div style={{ position: 'absolute', bottom: -30, right: 10, width: 70, height: 70, borderRadius: '50%', background: 'rgba(0,0,0,0.10)' }} />
      <div style={{ position: 'absolute', bottom: 10, left: -15, width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

      <motion.div
        style={{ position: 'relative', zIndex: 1 }}
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <motion.div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
              flexShrink: 0,
            }}
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Icon name={card.icon} size={26} color="#fff" />
          </motion.div>
          <motion.span
            style={{
              background: 'rgba(255,255,255,0.20)',
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: '0.68rem',
              fontFamily: 'var(--mono)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {card.badge}
          </motion.span>
        </div>

        <p style={{ fontFamily: 'var(--display)', fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 6 }}>{card.name}</p>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>{card.subtitle}</p>

        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.85 }}>Ver profissionais</span>
          <motion.div
            animate={{ x: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: '1.1rem' }}
          >
            →
          </motion.div>
        </div>
      </motion.div>
    </motion.button>
  );
}

/* ─── ESTRELAS ───────────────────────────────────────────────────────── */
function Stars({ nota }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={12} color={i <= Math.floor(nota) ? '#FF7A00' : 'rgba(255,122,0,0.2)'} />
      ))}
    </div>
  );
}

/* ─── CARD DE PRESTADOR ─────────────────────────────────────────────── */
function PrestadorCard({ prestador, index, servico }) {
  const router = useRouter();
  const [expandido, setExpandido] = useState(false);
  const [contratado, setContratado] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('Seg, 19 ago');
  const [selectedHour, setSelectedHour] = useState('09:00');
  const [selectedPlan, setSelectedPlan] = useState('Completo');

  const bookingDates = ['Seg, 19 ago', 'Qua, 21 ago', 'Sex, 23 ago'];
  const bookingHours = {
    'Seg, 19 ago': ['09:00', '11:30', '14:00', '18:30'],
    'Qua, 21 ago': ['08:45', '10:15', '13:00', '16:45'],
    'Sex, 23 ago': ['09:30', '12:00', '15:30', '18:00'],
  };
  const servicePlans = [
    { id: 'Completo', title: 'Serviço completo', description: 'Atendimento completo e tudo incluso', price: 'R$ 220,00' },
    { id: 'Básico', title: 'Básico', description: 'Atendimento essencial', price: 'R$ 150,00' },
    { id: 'Premium', title: 'Premium', description: 'Mais reforço e acabamento', price: 'R$ 290,00' },
  ];

  const abrirPerfil = () => {
    router.push(`/cliente/profissionais/${prestador.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 180, damping: 20 }}
      whileHover={{ y: -6, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
      style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 24,
        border: '1px solid rgba(255,122,0,0.12)',
        overflow: 'visible',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.3s, transform 0.3s',
        position: 'relative',
        zIndex: bookingOpen ? 10 : 1,
      }}
    >
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              abrirPerfil();
            }}
            style={{ flexShrink: 0, position: 'relative', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: prestador.avatarGrad,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--display)',
                fontWeight: 700,
                fontSize: '1.3rem',
                color: '#fff',
                boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
              }}
            >
              {prestador.iniciais}
            </div>
            <motion.div
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#22D31B',
                border: '2px solid #fff',
              }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                abrirPerfil();
              }}
              style={{
                fontFamily: 'var(--display)',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#17241A',
                letterSpacing: '-0.02em',
                marginBottom: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              {prestador.nome}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Stars nota={prestador.nota} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', fontWeight: 700, color: '#FF7A00' }}>
                {prestador.nota.toFixed(1)}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#5B6B57' }}>({prestador.avaliacoes} avaliações)</span>
            </div>

            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              style={{
                display: 'inline-flex',
                marginTop: 6,
                background: `${prestador.badgeColor}18`,
                color: prestador.badgeColor,
                border: `1px solid ${prestador.badgeColor}33`,
                borderRadius: 999,
                padding: '3px 10px',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              {prestador.badge}
            </motion.span>
          </div>
        </div>

        <p
          style={{
            marginTop: 14,
            fontSize: '0.85rem',
            color: '#5B6B57',
            lineHeight: 1.65,
          }}
        >
          {expandido ? prestador.descricao : `${prestador.descricao.slice(0, 120)}…`}
        </p>
        <button
          onClick={() => setExpandido((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#FF7A00',
            padding: '4px 0',
            marginTop: 2,
            fontFamily: 'var(--body)',
          }}
        >
          {expandido ? 'Ver menos ↑' : 'Ler mais ↓'}
        </button>

        <AnimatePresence>
          {expandido && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {prestador.especialidades.map((esp) => (
                  <motion.span
                    key={esp}
                    style={{
                      background: 'rgba(34,211,27,0.08)',
                      border: '1px solid rgba(34,211,27,0.2)',
                      color: '#17241A',
                      borderRadius: 8,
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}
                    whileHover={{ scale: 1.05, background: 'rgba(255,122,0,0.1)', borderColor: 'rgba(255,122,0,0.3)' }}
                  >
                    {esp}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ margin: '16px 20px', height: 1, background: 'rgba(23,36,26,0.08)' }} />

      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Distância', value: prestador.distancia, icon: 'mapPin' },
            { label: 'Preço', value: prestador.preco, icon: 'star' },
            { label: 'Resposta', value: prestador.tempoResposta, icon: 'clock' },
          ].map((m) => (
            <motion.div
              key={m.label}
              style={{
                background: '#FAF6EC',
                borderRadius: 12,
                padding: '8px 10px',
                textAlign: 'center',
                border: '1px solid rgba(23,36,26,0.06)',
              }}
              whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
            >
              <div style={{ fontSize: '1rem', marginBottom: 2 }}>
                <Icon name={m.icon} size={16} color="#FF7A00" />
              </div>
              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#17241A',
                  marginBottom: 1,
                }}
              >
                {m.value}
              </p>
              <p style={{ fontSize: '0.62rem', color: '#5B6B57', fontWeight: 500 }}>{m.label}</p>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              abrirPerfil();
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              flex: 1,
              padding: '13px 16px',
              borderRadius: 14,
              border: '1px solid rgba(23,36,26,0.10)',
              background: '#fff',
              color: '#17241A',
              fontFamily: 'var(--body)',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.3s',
            }}
          >
            Ver perfil
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setBookingOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              flex: 2,
              padding: '13px 20px',
              borderRadius: 14,
              border: 'none',
              background: contratado ? 'linear-gradient(135deg, #22D31B, #16A34A)' : 'linear-gradient(135deg, #FF7A00, #FF9A33)',
              color: '#fff',
              fontFamily: 'var(--body)',
              fontSize: '0.9rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: contratado ? '0 6px 20px rgba(34,211,27,0.35)' : '0 6px 20px rgba(255,122,0,0.35)',
              transition: 'all 0.3s',
            }}
          >
            {contratado ? (
              <>
                <Icon name="checkCircle" size={18} color="#fff" />
                <motion.span
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Solicitado! Aguardando confirmação
                </motion.span>
              </>
            ) : (
              <>
                Agendar serviço
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
                  →
                </motion.span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      <Modal open={bookingOpen} onClose={() => setBookingOpen(false)} title={`Agendar serviço com ${prestador.nome}`} size="md">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">1. Escolha a data</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {bookingDates.map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedHour(bookingHours[date][0]);
                  }}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium text-left transition-all ${
                    selectedDate === date ? 'border-client bg-client/5 text-client' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {date}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">2. Horários disponíveis</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {(bookingHours[selectedDate] || []).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedHour(slot)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium text-center transition-all ${
                    selectedHour === slot ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">3. Tipo de serviço</p>
            <div className="space-y-2">
              {servicePlans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition-all ${
                    selectedPlan === plan.id ? 'border-client bg-client/5 text-client' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{plan.title}</p>
                      <p className="text-xs mt-0.5 opacity-80">{plan.description}</p>
                    </div>
                    <span className="text-sm font-bold">{plan.price}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span>Prestador</span>
              <strong className="text-slate-800">{prestador.nome}</strong>
            </div>
            <div className="flex items-center justify-between gap-3 mt-2">
              <span>Data</span>
              <strong className="text-slate-800">{selectedDate}</strong>
            </div>
            <div className="flex items-center justify-between gap-3 mt-2">
              <span>Horário</span>
              <strong className="text-slate-800">{selectedHour}</strong>
            </div>
            <div className="flex items-center justify-between gap-3 mt-2">
              <span>Tipo</span>
              <strong className="text-slate-800">{selectedPlan}</strong>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setBookingOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                setBookingOpen(false);
                setContratado(true);
              }}
              className="px-4 py-2 rounded-xl bg-client text-white font-semibold hover:bg-indigo-600"
            >
              Confirmar agendamento
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

/* ─── TELA: LISTA DE PRESTADORES ─────────────────────────────────────── */
function PrestadoresView({ servico, grupo, onVoltar }) {
  const [prestadores, setPrestadores] = useState([]);
  useEffect(() => {
    const categories = SERVICE_CATEGORY[servico.id];
    if (!categories) { setPrestadores([]); return; }
    api.get('/profissionais')
      .then(r => setPrestadores((r.data?.workers || []).filter(w => categories.includes(w.category)).map(toPrestador)))
      .catch(() => setPrestadores([]));
  }, [servico.id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
    >
      <motion.div
        style={{
          position: 'relative',
          borderRadius: 28,
          overflow: 'hidden',
          marginBottom: 28,
          background: 'linear-gradient(135deg, #17241A, #0D130B)',
          minHeight: 160,
          padding: '28px 28px 24px',
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <ParticleBackground />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <motion.button
            onClick={onVoltar}
            whileHover={{ x: -3 }}
            style={{
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              padding: '8px 14px',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 18,
              fontFamily: 'var(--body)',
            }}
          >
            ← Voltar às categorias
          </motion.button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <motion.div
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                background: 'rgba(255,122,0,0.20)',
                border: '1px solid rgba(255,122,0,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              whileHover={{ rotate: 8, scale: 1.05 }}
            >
              <Icon name={servico.icon} size={28} color="#FF7A00" />
            </motion.div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: 'rgba(255,122,0,0.85)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                {grupo.title} · {servico.badge}
              </div>
              <h1
                style={{
                  fontFamily: 'var(--display)',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#FAF6EC',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                }}
              >
                {servico.name}
              </h1>
              <motion.p
                style={{ fontSize: '0.85rem', color: 'rgba(250,246,236,0.6)', marginTop: 4 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {prestadores.length} profissional{prestadores.length !== 1 ? 'is' : ''} disponíve
                {prestadores.length !== 1 ? 'is' : ''} perto de você
              </motion.p>
            </div>
          </div>
        </div>

        <motion.div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(255,122,0,0.06)',
            pointerEvents: 'none',
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          style={{
            position: 'absolute',
            bottom: -20,
            right: 60,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(34,211,27,0.04)',
            pointerEvents: 'none',
          }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        />
      </motion.div>

      <motion.div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {['Melhor avaliado', 'Mais próximo', 'Menor preço'].map((f, i) => (
          <motion.button
            key={f}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            style={{
              background: i === 0 ? 'rgba(255,122,0,0.12)' : 'rgba(23,36,26,0.05)',
              border: i === 0 ? '1px solid rgba(255,122,0,0.30)' : '1px solid rgba(23,36,26,0.10)',
              borderRadius: 10,
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: i === 0 ? '#FF7A00' : '#5B6B57',
              cursor: 'pointer',
              fontFamily: 'var(--body)',
            }}
          >
            {f}
          </motion.button>
        ))}
      </motion.div>

      {prestadores.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 18,
          }}
        >
          {prestadores.map((p, i) => (
            <PrestadorCard key={`${servico.id}-${p.id}`} prestador={p} index={i} servico={servico} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: 24,
            border: '1px dashed rgba(255,122,0,0.25)',
          }}
        >
          <motion.div
            style={{ fontSize: 48, marginBottom: 16 }}
            animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <SharedIcon name="search" size={48} color="#FF7A00" />
          </motion.div>
          <h3
            style={{
              fontFamily: 'var(--display)',
              fontSize: '1.3rem',
              fontWeight: 700,
              color: '#17241A',
              marginBottom: 8,
            }}
          >
            Ainda sem profissionais cadastrados
          </h3>
          <p style={{ color: '#5B6B57', fontSize: '0.9rem', maxWidth: 320, margin: '0 auto 24px' }}>
            Seja o primeiro a oferecer este serviço na sua região e atraia clientes perto de você.
          </p>
          <motion.button
            style={{
              background: 'linear-gradient(135deg, #FF7A00, #FF9A33)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'var(--body)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Quero ser prestador →
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─── CABEÇALHO COM RADAR ────────────────────────────────────────────── */
function RadarHeader({ query }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #17241A 0%, #0D130B 100%)',
        borderRadius: 28,
        overflow: 'hidden',
        padding: '28px',
        marginBottom: 28,
      }}
    >
      <ParticleBackground />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <motion.div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--mono)',
            fontSize: '0.68rem',
            fontWeight: 600,
            color: 'rgba(255,122,0,0.85)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            style={{ width: 20, height: 1.5, background: '#FF7A00' }}
            animate={{ width: [20, 40, 20] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          MoviPay · Marketplace
        </motion.div>

        <motion.h1
          style={{
            fontFamily: 'var(--display)',
            fontSize: '2.2rem',
            fontWeight: 700,
            color: '#FAF6EC',
            letterSpacing: '-0.03em',
            lineHeight: 1.08,
            marginBottom: 8,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Encontre quem pode
          <br />
          <motion.span
            style={{ color: '#FF7A00', fontStyle: 'italic' }}
            animate={{ color: ['#FF7A00', '#FF9A33', '#FF7A00'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            te ajudar agora.
          </motion.span>
        </motion.h1>

        <motion.p
          style={{ fontSize: '0.88rem', color: 'rgba(250,246,236,0.55)', marginBottom: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Serviços verificados · resposta em até 15 min
        </motion.p>
      </div>

      <motion.div
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 130,
          height: 130,
          borderRadius: '50%',
          border: '1px solid rgba(255,122,0,0.12)',
          pointerEvents: 'none',
        }}
        animate={{ scale: [1, 1.1, 1], rotate: [0, 45, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 70,
          height: 70,
          borderRadius: '50%',
          border: '1px solid rgba(34,211,27,0.10)',
          pointerEvents: 'none',
        }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 6, repeat: Infinity, delay: 1 }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -20,
          right: 80,
          fontFamily: 'var(--mono)',
          fontSize: '4rem',
          fontWeight: 700,
          lineHeight: 1,
          color: 'rgba(255,122,0,0.06)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        ◎
      </div>
    </motion.div>
  );
}

/* ─── TELA: CATEGORIAS ──────────────────────────────────────────────── */
function CategoriasView({ query, onSelect }) {
  const router = useRouter();

  // Profissionais reais (API /profissionais): permite buscar por categoria OU pelo
  // nome de um profissional.
  const [allWorkers, setAllWorkers] = useState([]);
  useEffect(() => {
    api.get('/profissionais').then(r => setAllWorkers(r.data?.workers || [])).catch(() => {});
  }, []);

  const matchedWorkers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allWorkers.filter(w =>
      (w.name || '').toLowerCase().includes(q) ||
      (CATEGORY_LABEL[w.category] || '').toLowerCase().includes(q)
    );
  }, [query, allWorkers]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categoryGroups;
    return categoryGroups
      .map((group) => ({
        ...group,
        cards: group.cards.filter(
          (card) =>
            card.name.toLowerCase().includes(q) ||
            group.title.toLowerCase().includes(q) ||
            card.subtitle.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.cards.length > 0);
  }, [query]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
    >
      <RadarHeader query={query} />

      {matchedWorkers.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,122,0,0.14)', border: '1px solid rgba(255,122,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SharedIcon name="worker" size={18} color="#FF7A00" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--display)', fontSize: '1.5rem', fontWeight: 700, color: '#17241A', letterSpacing: '-0.03em', lineHeight: 1 }}>Profissionais</h2>
              <p style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: '#FF7A00', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
                {matchedWorkers.length} encontrado{matchedWorkers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 14 }}>
            {matchedWorkers.map(w => (
              <button key={w.id} type="button" onClick={() => router.push(`/cliente/profissionais/${w.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(23,36,26,0.1)', borderRadius: 18, padding: 14, cursor: 'pointer', font: 'inherit' }}>
                {w.photo ? (
                  <img src={w.photo} alt={w.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #FF7A00', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #FF7A00', background: 'linear-gradient(135deg, #FF7A00, #FFB066)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', flexShrink: 0 }}>{(w.name || '?').charAt(0)}</div>
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 800, fontSize: '0.88rem', color: '#17241A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</p>
                  <p style={{ fontSize: '0.72rem', color: '#5B6B57', marginTop: 2 }}>{CATEGORY_LABEL[w.category] || 'Profissional'}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.section>
      )}

      {filteredGroups.length === 0 && matchedWorkers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: 24,
            border: '1px dashed rgba(23,36,26,0.15)',
          }}
        >
          <motion.div
            style={{ fontSize: 48, marginBottom: 12 }}
            animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <SharedIcon name="search" size={48} color="#FF7A00" />
          </motion.div>
          <p
            style={{
              fontFamily: 'var(--display)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#17241A',
            }}
          >
            Nenhuma categoria para "{query}"
          </p>
          <p style={{ color: '#5B6B57', fontSize: '0.88rem', marginTop: 6 }}>
            Tente buscar por "limpeza", "pintura" ou "design".
          </p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {filteredGroups.map((group, groupIndex) => (
            <motion.section
              key={group.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.06 }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <motion.div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: group.colorLight,
                    border: `1px solid ${group.colorBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                  whileHover={{ rotate: 8, scale: 1.1 }}
                >
                  <SharedIcon name={group.icon} size={20} color={group.color} />
                </motion.div>
                <div>
                  <h2
                    style={{
                      fontFamily: 'var(--display)',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#17241A',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}
                  >
                    {group.title}
                  </h2>
                  <p
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '0.65rem',
                      color: group.color,
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      marginTop: 2,
                    }}
                  >
                    {group.cards.length} {group.cards.length === 1 ? 'categoria' : 'categorias'}
                  </p>
                </div>

                <motion.div
                  style={{
                    flex: 1,
                    height: 1,
                    background: `linear-gradient(90deg, ${group.colorBorder}, transparent)`,
                    marginLeft: 8,
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3 }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 320px))',
                  justifyContent: 'start',
                  gap: 18,
                }}
              >
                {group.cards.map((card, cardIndex) => (
                  <CategoryCard
                    key={card.id}
                    card={card}
                    group={group}
                    onClick={onSelect}
                    index={groupIndex * 3 + cardIndex}
                  />
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          marginTop: 40,
          background: 'linear-gradient(135deg, rgba(34,211,27,0.07), rgba(255,122,0,0.07))',
          border: '1px solid rgba(34,211,27,0.18)',
          borderRadius: 24,
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
        }}
        whileHover={{ boxShadow: '0 8px 30px rgba(34,211,27,0.1)' }}
      >
        <div>
          <p
            style={{
              fontFamily: 'var(--display)',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#17241A',
              letterSpacing: '-0.02em',
              marginBottom: 4,
            }}
          >
            Você é profissional?
          </p>
          <p style={{ fontSize: '0.83rem', color: '#5B6B57' }}>
            Cadastre seus serviços e apareça aqui para milhares de clientes próximos.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04, y: -2, boxShadow: '0 8px 25px rgba(34,211,27,0.3)' }}
          whileTap={{ scale: 0.97 }}
          style={{
            background: 'linear-gradient(135deg, #22D31B, #16A34A)',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '12px 22px',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'var(--body)',
            boxShadow: '0 6px 20px rgba(34,211,27,0.30)',
            whiteSpace: 'nowrap',
          }}
        >
          Quero ser prestador →
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────── */
export default function ClientServicesPage() {
  const [query, setQuery] = useState('');
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [grupoSelecionado, setGrupoSelecionado] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('movipay-theme');
    if (saved === 'dark') setDarkMode(true);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.darkMode = String(darkMode);
  }, [darkMode]);

  const theme = darkMode
    ? {
        bg: '#121A0F',
        text: '#F3EFE2',
        textMuted: '#8AA085',
        cardBg: 'rgba(26,36,23,0.85)',
        cardBorder: 'rgba(243,239,226,0.09)',
        line: 'rgba(243,239,226,0.13)',
      }
    : {
        bg: '#FFFFFF',
        text: '#17241A',
        textMuted: '#5B6B57',
        cardBg: 'rgba(255,255,255,0.90)',
        cardBorder: 'rgba(23,36,26,0.09)',
        line: 'rgba(23,36,26,0.13)',
      };

  function handleSelect(card, group) {
    setServicoSelecionado(card);
    setGrupoSelecionado(group);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleVoltar() {
    setServicoSelecionado(null);
    setGrupoSelecionado(null);
  }

  const leaves = Array.from({ length: 15 }, (_, i) => ({
    delay: i * 1.0 + 0.5,
    x: (i * 7.5) % 100,
    size: 12 + (i % 3) * 4,
    color: i % 2 === 0 ? '#22D31B' : '#FF9A33',
    duration: 8 + (i % 5),
  }));

  return (
    <LayoutPainel>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700;1,900&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600;700&display=swap');
        :root {
          --display: 'Fraunces', serif;
          --body: 'Inter', sans-serif;
          --mono: 'IBM Plex Mono', monospace;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @media (min-width: 769px) {
          .client-wide-page { max-width: none !important; margin: 0 !important; padding-left: 120px !important; padding-right: 120px !important; }
        }
      `}</style>



      <div
        className="client-wide-page"
        style={{
          width: '100%',
          padding: '20px 24px 80px',
          maxWidth: 'none',
          margin: '0 auto',
          fontFamily: 'var(--body)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <AnimatePresence mode="wait">
          {!servicoSelecionado && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ marginBottom: 24 }}
            >
              <motion.div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#fff',
                  border: '1.5px solid rgba(23,36,26,0.10)',
                  borderRadius: 18,
                  padding: '8px 8px 8px 18px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  maxWidth: 560,
                }}
                whileHover={{ boxShadow: '0 8px 30px rgba(255,122,0,0.1)' }}
                animate={{ borderColor: query ? 'rgba(255,122,0,0.4)' : 'rgba(23,36,26,0.10)' }}
              >
                <Icon name="search" size={20} color="rgba(23,36,26,0.4)" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar serviço, ex: pintura, suporte…"
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    fontSize: '0.95rem',
                    color: '#17241A',
                    outline: 'none',
                    fontFamily: 'var(--body)',
                  }}
                />
                {query && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    onClick={() => setQuery('')}
                    style={{
                      background: 'rgba(23,36,26,0.07)',
                      border: 'none',
                      borderRadius: 8,
                      width: 26,
                      height: 26,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      color: '#5B6B57',
                      fontFamily: 'var(--body)',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="x" size={14} color="#5B6B57" />
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {servicoSelecionado ? (
            <PrestadoresView
              key="prestadores"
              servico={servicoSelecionado}
              grupo={grupoSelecionado}
              onVoltar={handleVoltar}
            />
          ) : (
            <CategoriasView key="categorias" query={query} onSelect={handleSelect} />
          )}
        </AnimatePresence>
      </div>
    </LayoutPainel>
  );
}
