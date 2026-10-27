'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useScroll, useInView, AnimatePresence } from 'framer-motion';
import { usarAutenticacao } from '@/contexto/contextoAutenticacao';
import { usarTema } from '@/contexto/contextoTema';
import SharedIcon from '@/componentes/interface/Icone';
import FolhasCaindo, { FooterLeafPile, LeafProvider } from '@/componentes/efeitos/FolhasCaindo';

/* ─── ICONS (no emojis anywhere — everything below is hand-drawn SVG) ─── */

function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 1.8, style }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth,
    strokeLinecap: 'round', strokeLinejoin: 'round', style,
  };
  switch (name) {
    case 'search':
      return <svg {...p}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
    case 'star':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" style={style}>
          <polygon points="12 2 15.09 8.63 22 9.24 16.5 14.14 18.18 21 12 17.27 5.82 21 7.5 14.14 2 9.24 8.91 8.63 12 2" />
        </svg>
      );
    case 'chat':
      return <svg {...p}><path d="M4 4h16v12H8l-4 4V4z" /></svg>;
    case 'wrench':
      return <svg {...p}><path d="M21 7l-3.5 3.5a3 3 0 0 1-4.2 0l-1-1a3 3 0 0 1 0-4.2L15.8 2 21 7z" /><path d="M14 10L3 21" /></svg>;
    case 'calendar':
      return <svg {...p}><rect x="3" y="4" width="18" height="17" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case 'shield':
      return <svg {...p}><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" /></svg>;
    case 'bolt':
      return <svg {...p} strokeLinejoin="round"><polygon points="13 2 3 14 11 14 9 22 21 10 13 10 13 2" /></svg>;
    case 'broom':
      return <svg {...p}><line x1="13" y1="2" x2="7" y2="15" /><path d="M7 15l-3.5 6.5 9-2.5 3.5-6.5z" /></svg>;
    case 'paint':
      return <svg {...p}><rect x="3" y="4" width="12" height="6" rx="1" /><line x1="9" y1="10" x2="9" y2="16" /><rect x="6" y="16" width="6" height="5" rx="1" /></svg>;
    case 'pipe':
      return <svg {...p}><path d="M4 4v8a4 4 0 0 0 4 4h9" /><circle cx="18" cy="18" r="2.5" /></svg>;
    case 'leaf':
      return <svg {...p}><path d="M5 21c0-9 6-15 15-15-1 9-7 15-15 15z" /><path d="M5 21c3-3 6-6 9-9" /></svg>;
    case 'monitor':
      return <svg {...p}><rect x="3" y="4" width="18" height="12" rx="2" /><line x1="8" y1="20" x2="16" y2="20" /><line x1="12" y1="16" x2="12" y2="20" /></svg>;
    case 'box':
      return <svg {...p}><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><line x1="12" y1="13" x2="12" y2="21" /></svg>;
    case 'book':
      return <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
    case 'lock':
      return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
    case 'clock':
      return <svg {...p}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" /></svg>;
    case 'arrowRight':
      return <svg {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
    case 'clipboard':
      return <svg {...p}><rect x="6" y="4" width="12" height="16" rx="2" /><rect x="9" y="2" width="6" height="4" rx="1" /></svg>;
    case 'sun':
      return <svg {...p}><circle cx="12" cy="12" r="4.5" /><line x1="12" y1="1.5" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22.5" /><line x1="4.2" y1="4.2" x2="6" y2="6" /><line x1="18" y1="18" x2="19.8" y2="19.8" /><line x1="1.5" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22.5" y2="12" /><line x1="4.2" y1="19.8" x2="6" y2="18" /><line x1="18" y1="6" x2="19.8" y2="4.2" /></svg>;
    case 'moon':
      return <svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
    case 'chevronDown':
      return <svg {...p}><polyline points="6 9 12 15 18 9" /></svg>;
    case 'x':
      return <svg {...p}><line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" /></svg>;
    default:
      return null;
  }
}

/* ─── STICK FIGURE ANT (Accessibility Botao) ────────────────────────── */
function StickFigureAnt({ isOpen, onClick, theme, darkMode }) {
  return (
    <motion.div
      className="stick-ant-container"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
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
        transition: 'all 0.3s ease',
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

      {/* Pulse animation ring */}
      <motion.div
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: '50%',
          border: '2px solid rgba(255,122,0,0.2)',
          pointerEvents: 'none',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 0, 0.6],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

/* ─── ACCESSIBILITY MENU ─────────────────────────────────────────────── */
function AccessibilityMenu({ isOpen, onClose, theme }) {
  const {
    darkMode,
    highContrast,
    daltonism,
    fontSize,
    toggleDarkMode,
    toggleHighContrast,
    setDaltonism,
    setFontSize,
    resetAccessibility,
  } = usarTema();

  const menuItems = [
    { id: 'darkMode', label: 'Modo Escuro', icon: darkMode ? 'sun' : 'moon', active: darkMode, onClick: toggleDarkMode },
    { id: 'highContrast', label: 'Alto Contraste', icon: 'shield', active: highContrast, onClick: toggleHighContrast },
    { id: 'protanopia', label: 'Protanopia (vermelho-verde)', icon: 'leaf', active: daltonism === 'protanopia', onClick: () => setDaltonism('protanopia') },
    { id: 'deuteranopia', label: 'Deuteranopia (verde-vermelho)', icon: 'leaf', active: daltonism === 'deuteranopia', onClick: () => setDaltonism('deuteranopia') },
    { id: 'tritanopia', label: 'Tritanopia (azul-amarelo)', icon: 'leaf', active: daltonism === 'tritanopia', onClick: () => setDaltonism('tritanopia') },
  ];

  const fontSizeOptions = [
    { value: 80, label: 'A' },
    { value: 100, label: 'A' },
    { value: 120, label: 'A' },
    { value: 140, label: 'A' },
  ];

  const isColorBlindnessActive = daltonism !== 'none';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
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

          {/* Menu */}
          <motion.div
            className="accessibility-menu"
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
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: theme.text }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><SharedIcon name="accessibility" size={18} /> Acessibilidade</span>
              </h3>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 8,
                  color: theme.textMuted,
                }}
              >
                <Icon name="x" size={20} color={theme.textMuted} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: theme.textMuted, marginBottom: 20 }}>
              Ajuste a experiência para suas necessidades
            </p>

            {/* Theme toggle */}
            <div style={{
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
            onClick={toggleDarkMode}
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
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: 2,
                    left: 2,
                  }}
                  animate={{ x: darkMode ? 18 : 0 }}
                  transition={{ type: 'spring', damping: 20 }}
                />
              </motion.div>
            </div>

            {/* Menu items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {menuItems.map(item => (
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
                  onMouseEnter={(e) => {
                    if (!item.active) e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    if (!item.active) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: theme.text }}>
                    <Icon name={item.icon} size={16} color={item.active ? '#FF7A00' : theme.textMuted} />
                    <span style={{ fontSize: '0.85rem', fontWeight: item.active ? 700 : 500 }}>{item.label}</span>
                  </span>
                  {item.active && (
                    <span style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#FF7A00',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '0.7rem',
                    }}><SharedIcon name="check" size={11} color="#fff" strokeWidth={3} /></span>
                  )}
                </div>
              ))}
            </div>

            {/* Font size */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
              <p style={{ fontSize: '0.8rem', color: theme.textMuted, marginBottom: 10, fontWeight: 600 }}>
                Tamanho da fonte
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {fontSizeOptions.map(opt => (
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
                      fontSize: `${opt.value / 100 * 14}px`,
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

            {/* Reset button */}
            <button
              onClick={resetAccessibility}
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
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,122,0,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <SharedIcon name="refresh" size={13} /> Restaurar padrões
            </button>

            {/* Status */}
            <div style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 8,
              background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              fontSize: '0.7rem',
              color: theme.textMuted,
              textAlign: 'center',
            }}>
              {isColorBlindnessActive || highContrast || darkMode || fontSize !== 100 ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><SharedIcon name="checkCircle" size={13} /> Configurações personalizadas ativas</span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><SharedIcon name="info" size={13} /> Nenhuma configuração ativa</span>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── DATA ───────────────────────────────────────────────────────────── */

const FEATURES = [
  { icon: 'search',   title: 'Encontre profissionais', body: 'Busque por categoria, leia avaliações e contrate com segurança em segundos.' },
  { icon: 'star',      title: 'Sistema de pontos',       body: 'Ganhe pontos a cada pedido concluído. Suba de nível e desbloqueie benefícios.' },
  { icon: 'chat',      title: 'Chat integrado',           body: 'Converse diretamente com o profissional pelo app, sem sair da plataforma.' },
  { icon: 'wrench',    title: 'Trabalhe também',          body: 'Alterne para o modo trabalhador e ofereça seus serviços quando quiser.' },
  { icon: 'calendar',  title: 'Agendamento simples',      body: 'Organize sua agenda e acompanhe todos os compromissos num só lugar.' },
  { icon: 'shield',    title: 'Pagamento seguro',         body: 'Transações protegidas. Pague só quando o serviço for concluído.' },
];

const TESTIMONIALS = [
  { name: 'Ana Paula', role: 'Cliente', avatar: 'A', text: 'Encontrei um eletricista em 5 minutos. Serviço impecável e ainda ganhei pontos!' },
  { name: 'Bruno Silva', role: 'Trabalhador', avatar: 'B', text: 'Minha agenda encheu em uma semana. A plataforma é simples e os pagamentos são rápidos.' },
  { name: 'Carla Souza', role: 'Cliente', avatar: 'C', text: 'Já usei três vezes. Todo profissional foi pontual e competente. Recomendo demais!' },
];

const CATEGORIES = [
  { icon: 'broom',    name: 'Limpeza',    img: '/img/faxineira.jpg' },
  { icon: 'bolt',     name: 'Elétrica', img: '/img/eletricista.jpg' },
  { icon: 'leaf',     name: 'Jardinagem', img: '/img/jardineiro.jpg' },
  { icon: 'box',      name: 'Mudança', img: '/img/mudanca.jpg' },
  { icon: 'scissors', name: 'Cabeleireiro', img: '/img/cabeleireiro.jpg' },
  { icon: 'hammer',   name: 'Pedreiro', img: '/img/pedreiro.jpg' },
  { icon: 'motorcycle', name: 'Motoboy', img: '/img/motoboy.jpg' },
  { icon: 'sparkle', name: 'Manicure', img: '/img/manicure.jpg' },
];
const STATS = [
  { value: 500,  suffix: '+',  label: 'Profissionais',           decimal: false },
  { value: 2000, suffix: '+',  label: 'Pedidos concluídos',       decimal: false },
  { value: 4.9,  suffix: '/5', label: 'Avaliação média',          decimal: true },
  { value: 15,   suffix: 'min', label: 'Tempo médio de resposta', decimal: false },
];

/* ─── ANIMATED COUNTER ──────────────────────────────────────────────── */
function AnimatedCounter({ target, suffix, decimal }) {
  const spanRef = useRef(null);
  const wrapperRef = useRef(null);
  const inView = useInView(wrapperRef, { once: true, margin: '-50px' });
  const rafRef = useRef(null);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    let start = null;

    function tick(ts) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      if (spanRef.current) {
        spanRef.current.textContent =
          (decimal ? current.toFixed(1) : Math.floor(current).toLocaleString('pt-BR')) + suffix;
      }
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [inView, target, suffix, decimal]);

  return (
    <span ref={wrapperRef}>
      <span ref={spanRef}>{decimal ? '0.0' : '0'}{suffix}</span>
    </span>
  );
}

/* ─── FORMIGA CANVAS COMPONENT ──────────────────────────────────────── */
function FormigaCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = 1200, H = 220;
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');

    class Formiga {
      constructor(y, speed, size, id) {
        this.id = id;
        const startPositions = [30, 180, 330, 480, 630];
        this.x = startPositions[id] + Math.random() * 20;
        this.y = y;
        this.speed = speed;
        this.size = size || 13;
        this.direction = 1;
        this.legPhase = Math.random() * Math.PI * 2;
        this.segmentColors = ['#FF7A00', '#E06900', '#CC5E00'];
        this.eyeColor = '#f5f2e6';
        this.pupilColor = '#0a0a0a';
        this.legLength = this.size * 0.85;
        this.legOffset = this.size * 0.25;
        
        this.state = 'carrying';
        this.cargoX = 0;
        this.cargoY = 0;
        this.depositX = W - 100 + (id * 40) + Math.random() * 30;
        this.depositY = this.y + 4 + Math.random() * 10;
        this.hasDeposited = false;
        this.returnTargetX = 20 + (id * 20) + Math.random() * 20;
        this.turnTimer = 0;
        this.plantColor = this.randomPlantColor();
        this.waitTimer = 0;
        this.isWaiting = false;
        
        this.cargoX = this.x + 8;
        this.cargoY = this.y - 6;
      }

      randomPlantColor() {
        const colors = ['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9', '#FFD54F', '#FFB300', '#FF8F00', '#FDD835', '#FFF176'];
        return colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        switch(this.state) {
          case 'carrying':
            this.x += this.speed;
            this.cargoX = this.x + 8;
            this.cargoY = this.y - 6;
            
            if (this.x >= this.depositX - 5) {
              this.state = 'depositing';
              this.hasDeposited = true;
              this.cargoX = this.depositX;
              this.cargoY = this.depositY;
              this.waitTimer = 15 + Math.random() * 25;
            }
            break;
            
          case 'depositing':
            this.waitTimer--;
            if (this.waitTimer <= 0) {
              this.state = 'returning';
              this.direction = -1;
              this.x = this.depositX;
            }
            break;
            
          case 'returning':
            this.x -= this.speed * 0.7;
            if (this.x <= this.returnTargetX) {
              this.state = 'waiting';
              this.waitTimer = 20 + Math.random() * 40;
              this.direction = 1;
              this.x = this.returnTargetX;
              this.hasDeposited = false;
              this.plantColor = this.randomPlantColor();
              this.depositX = W - 100 + (this.id * 40) + Math.random() * 30;
              this.depositY = this.y + 4 + Math.random() * 10;
            }
            break;
            
          case 'waiting':
            this.waitTimer--;
            if (this.waitTimer <= 0) {
              this.state = 'carrying';
              this.cargoX = this.x + 8;
              this.cargoY = this.y - 6;
              this.hasDeposited = false;
            }
            break;
        }
        
        this.legPhase += 0.12 * this.speed * 0.28;
      }

      draw(ctx) {
        const x = this.x;
        const y = this.y;
        const s = this.size;
        const dir = this.direction;

        if (this.state === 'carrying' || this.hasDeposited) {
          this.drawCargo(ctx, this.cargoX, this.cargoY, this.hasDeposited);
        }

        const abdX = x - dir * s * 0.9;
        const abdY = y;
        ctx.beginPath();
        ctx.ellipse(abdX, abdY, s * 0.8, s * 0.65, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.segmentColors[2];
        ctx.fill();
        ctx.strokeStyle = '#8A4A00';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        const thoraxX = x - dir * s * 0.2;
        const thoraxY = y - 2;
        ctx.beginPath();
        ctx.ellipse(thoraxX, thoraxY, s * 0.6, s * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.segmentColors[1];
        ctx.fill();
        ctx.stroke();

        const headX = x + dir * s * 0.8;
        const headY = y - 3;
        ctx.beginPath();
        ctx.ellipse(headX, headY, s * 0.5, s * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.segmentColors[0];
        ctx.fill();
        ctx.stroke();

        const eyeOffX = dir * s * 0.2;
        const eyeOffY = -s * 0.18;
        ctx.beginPath();
        ctx.arc(headX + eyeOffX - 4 * dir, headY + eyeOffY - 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = this.eyeColor;
        ctx.fill();
        ctx.strokeStyle = '#8A4A00';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(headX + eyeOffX - 3 * dir, headY + eyeOffY - 3, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = this.pupilColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(headX + eyeOffX + 4 * dir, headY + eyeOffY - 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = this.eyeColor;
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(headX + eyeOffX + 5 * dir, headY + eyeOffY - 3, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = this.pupilColor;
        ctx.fill();

        ctx.strokeStyle = '#8A4A00';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(headX + dir * 6, headY - 5);
        ctx.lineTo(headX + dir * 14, headY - 16);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(headX + dir * 4, headY - 8);
        ctx.lineTo(headX + dir * 10, headY - 22);
        ctx.stroke();
        ctx.fillStyle = '#CC7A00';
        ctx.beginPath();
        ctx.arc(headX + dir * 14, headY - 16, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX + dir * 10, headY - 22, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#8A4A00';
        ctx.lineWidth = 2.2;
        this.drawLeg(ctx, thoraxX, thoraxY, dir, -0.9, 0.2, 0.9);
        this.drawLeg(ctx, thoraxX, thoraxY, dir, 0.9, 0.2, 0.9);
        this.drawLeg(ctx, thoraxX, thoraxY, dir, -0.4, 0.5, 1.2);
        this.drawLeg(ctx, thoraxX, thoraxY, dir, 0.4, 0.5, 1.2);
        this.drawLeg(ctx, abdX, abdY, dir, -0.3, -0.1, 1.5);
        this.drawLeg(ctx, abdX, abdY, dir, 0.3, -0.1, 1.5);
      }

      drawLeg(ctx, cx, cy, dir, offsetX, offsetY, phaseMul) {
        const phase = this.legPhase * phaseMul;
        const swing = Math.sin(phase) * 5;
        const startX = cx + offsetX * this.legOffset;
        const startY = cy + offsetY * this.legOffset * 0.6;
        const legDirX = dir * (0.4 + Math.sin(phase) * 0.2);
        const legDirY = 1.0 + Math.sin(phase + 1.2) * 0.3;
        const len = this.legLength * 0.9;
        const endX = startX + legDirX * len + swing * 0.4;
        const endY = startY + legDirY * len * 0.7 + Math.abs(Math.sin(phase)) * 3;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        const kneeX = startX + (endX - startX) * 0.5 + Math.sin(phase + 1.8) * 2;
        const kneeY = startY + (endY - startY) * 0.5 - 3;
        ctx.lineTo(kneeX, kneeY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.fillStyle = '#8A4A00';
        ctx.beginPath();
        ctx.arc(endX, endY, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      drawCargo(ctx, cx, cy, deposited) {
        if (deposited) {
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.beginPath();
          ctx.ellipse(cx + 2, cy + 6, 8, 4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = '#3D8B37';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy - 14);
        ctx.stroke();
        ctx.fillStyle = this.plantColor;
        ctx.beginPath();
        ctx.ellipse(cx - 4, cy - 8, 5, 3, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 4, cy - 10, 5, 3, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.lightenColor(this.plantColor, 20);
        ctx.beginPath();
        ctx.ellipse(cx - 2, cy - 14, 4, 3, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 2, cy - 16, 4, 3, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(cx, cy - 18, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFB300';
        ctx.beginPath();
        ctx.arc(cx, cy - 18, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      lightenColor(color, percent) {
        const num = parseInt(color.replace('#',''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
      }
    }

    const formigas = [];
    const numFormigas = 5;
    const linhaY = H - 18;

    const speeds = [0.6, 1.0, 0.8, 1.3, 0.9];
    const sizes = [13, 11, 14, 12, 13];

    for (let i = 0; i < numFormigas; i++) {
      const formiga = new Formiga(linhaY, speeds[i], sizes[i], i);
      const startPositions = [30, 180, 330, 480, 630];
      formiga.x = startPositions[i] + Math.random() * 15;
      formiga.direction = 1;
      formiga.state = 'carrying';
      formiga.cargoX = formiga.x + 8;
      formiga.cargoY = formiga.y - 6;
      formiga.depositX = W - 100 + (i * 45) + Math.random() * 20;
      formiga.returnTargetX = 20 + (i * 25) + Math.random() * 15;
      formiga.plantColor = formiga.randomPlantColor();
      formiga.waitTimer = i * 10 + Math.random() * 15;
      if (i > 0) formiga.state = 'waiting';
      formigas.push(formiga);
    }

    function drawScene(ctx, W, H) {
      const groundY = H - 16;
      ctx.fillStyle = '#0D3B0D';
      ctx.fillRect(0, groundY, W, 16);
      ctx.fillStyle = '#1A4D1A';
      ctx.fillRect(0, groundY, W, 4);
      ctx.fillStyle = '#2D5A2D';
      for (let i = 0; i < 30; i++) {
        let px = (i * 41 + 17) % W;
        let py = groundY + 6 + (i * 3) % 8;
        ctx.beginPath();
        ctx.arc(px, py, 1.5 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }

      const treePositions = [80, 320, 560, 800, 1040];
      const treeColors = ['#1A4D1A', '#22D31B', '#1E5C1E', '#2D7A2D', '#1A4D1A'];
      treePositions.forEach((x, idx) => {
        const h = 70 + (idx * 3) % 15;
        const baseY = groundY;
        ctx.fillStyle = '#1A3A1A';
        ctx.fillRect(x + 8, baseY - h + 4, 8, h - 4);
        ctx.fillStyle = '#3D2010';
        ctx.fillRect(x + 6, baseY - h, 8, h);
        ctx.fillStyle = '#2D180A';
        ctx.fillRect(x + 8, baseY - h + 8, 4, h - 16);
        const color = treeColors[idx % treeColors.length];
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x + 10, baseY - h - 20, 24, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x + 10, baseY - h - 44, 18, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x + 10, baseY - h - 62, 12, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.ellipse(x + 6, baseY - h - 24, 10, 14, -0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = '#2D7A2D';
      for (let i = 0; i < 50; i++) {
        let gx = (i * 23 + 7) % W;
        let gy = groundY - 2 - (i % 5);
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx - 2, gy - 8 - (i % 4));
        ctx.lineTo(gx + 2, gy - 8 - (i % 4));
        ctx.fill();
      }
    }

    let rafId = null;
    let isActive = true;

    function animar() {
      if (!isActive) return;
      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H);

      for (let f of formigas) {
        f.update();
        f.draw(ctx);
      }

      rafId = requestAnimationFrame(animar);
    }

    rafId = requestAnimationFrame(animar);

    function resizeCanvas() {
      const container = canvas.parentElement;
      if (!container) return;
      const containerWidth = container.clientWidth;
      canvas.style.width = containerWidth + 'px';
      canvas.style.height = (containerWidth * (H / W)) + 'px';
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => {
      isActive = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div style={{ width: '100%', overflow: 'hidden', position: 'relative', marginBottom: -4 }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 'auto', background: 'transparent' }} />
    </div>
  );
}

/* ─── SPARKLE WAVE DIVIDER ───────────────────────────────────────────── */
function SparkleDivider({ theme }) {
  const sparkles = Array.from({ length: 16 }, (_, i) => ({
    xPct: (i * 6.25 + 2) % 100,
    delay: (i % 8) * 0.3,
    size: 4 + (i % 3) * 3,
    color: i % 3 === 0 ? '#FF7A00' : i % 3 === 1 ? '#22D31B' : '#FFB347',
    dur: 2.2 + (i % 4) * 0.5,
  }));

  return (
    <div style={{ background: theme.dividerB, position: 'relative', overflow: 'hidden', transition: 'background 0.4s' }}>
      <svg viewBox="0 0 800 80" style={{ width: '100%', display: 'block' }} preserveAspectRatio="none">
        <rect width="800" height="80" fill={theme.dividerA} />
        <path
          d="M0,52 C90,20 170,80 260,50 C350,20 430,78 520,48 C610,20 690,78 800,50 L800,80 L0,80 Z"
          fill={theme.dividerB}
        />
        <defs>
          <linearGradient id="sparkleWaveGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FF7A00" />
            <stop offset="50%" stopColor="#FFB347" />
            <stop offset="100%" stopColor="#22D31B" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0,52 C90,20 170,80 260,50 C350,20 430,78 520,48 C610,20 690,78 800,50"
          fill="none"
          stroke="url(#sparkleWaveGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3.2, times: [0, 0.45, 0.75, 1], repeat: Infinity, repeatDelay: 0.6, ease: 'easeInOut' }}
        />
      </svg>

      {sparkles.map((s, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: s.xPct + '%',
            top: '38%',
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: s.color,
            filter: `drop-shadow(0 0 5px ${s.color})`,
            pointerEvents: 'none',
          }}
          animate={{ opacity: [0.15, 1, 0.15], scale: [0.5, 1.3, 0.5], y: [0, -10, 0] }}
          transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function RadarCanvas({ darkMode }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 560, H = 560;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const cx = W / 2, cy = H / 2;

    const ORANGE = '#FF7A00';
    const GREEN = '#22D31B';
    const BG = darkMode ? '#121A0F' : '#FAF6EC';
    const RING_STROKE = darkMode ? 'rgba(255,122,0,0.25)' : 'rgba(255,122,0,0.2)';
    const TEXT_COL = darkMode ? 'rgba(243,239,226,0.5)' : 'rgba(23,36,26,0.4)';

    const dots = [
      { r: 95,  angle: 0.4,  label: 'Limpeza', color: ORANGE, size: 7, pulse: true },
      { r: 140, angle: 1.9,  label: 'Elétrica', color: GREEN, size: 6, pulse: false },
      { r: 78,  angle: 3.3,  label: 'Jardim', color: ORANGE, size: 5, pulse: false },
      { r: 170, angle: 4.7,  label: 'Mudança', color: GREEN, size: 8, pulse: true },
      { r: 120, angle: 5.8,  label: 'Motoboy', color: ORANGE, size: 6, pulse: false },
      { r: 55,  angle: 2.5,  label: 'Manicure', color: GREEN, size: 5, pulse: false },
      { r: 195, angle: 0.9,  label: 'Pedreiro', color: ORANGE, size: 7, pulse: true },
      { r: 160, angle: 3.9,  label: 'Cabelo', color: GREEN, size: 5, pulse: false },
    ].map(d => ({ ...d, x: cx + Math.cos(d.angle) * d.r, y: cy + Math.sin(d.angle) * d.r, baseAngle: d.angle, pulsePhase: Math.random() * Math.PI * 2 }));

    let sweep = 0;
    const pings = [];
    let frame = 0;
    let animId;

    function drawRings() {
      [220, 170, 120, 70].forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = RING_STROKE;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.fillStyle = TEXT_COL;
        ctx.font = '500 10px "IBM Plex Mono", monospace';
        const distance = [1.5, 1.0, 0.6, 0.3][i];
        ctx.fillText(`${distance.toFixed(1)}km`, cx + r + 4, cy - 4);
      });

      [0, Math.PI / 2].forEach(a => {
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 220, cy + Math.sin(a) * 220);
        ctx.lineTo(cx - Math.cos(a) * 220, cy - Math.sin(a) * 220);
        ctx.strokeStyle = RING_STROKE;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });
    }

    function drawSweepTrail() {
      const steps = 28;
      for (let i = 0; i < steps; i++) {
        const a = sweep - (i / steps) * (Math.PI * 0.7);
        const alpha = (1 - i / steps) * 0.25;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, 220, a, a + (Math.PI * 0.7) / steps);
        ctx.closePath();
        ctx.fillStyle = darkMode ? `rgba(255,122,0,${alpha * 0.7})` : `rgba(255,122,0,${alpha * 0.5})`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * 222, cy + Math.sin(sweep) * 222);
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx + Math.cos(sweep) * 222, cy + Math.sin(sweep) * 222, 3, 0, Math.PI * 2);
      ctx.fillStyle = ORANGE;
      ctx.fill();
    }

    function drawDots() {
      dots.forEach(d => {
        const drift = Math.sin(frame * 0.008 + d.pulsePhase) * 3;
        const dx = d.x + Math.cos(d.baseAngle + Math.PI / 2) * drift;
        const dy = d.y + Math.sin(d.baseAngle + Math.PI / 2) * drift;

        if (d.pulse) {
          const pulseScale = 1 + 0.5 * Math.abs(Math.sin(frame * 0.04 + d.pulsePhase));
          ctx.beginPath();
          ctx.arc(dx, dy, d.size * pulseScale + 4, 0, Math.PI * 2);
          ctx.strokeStyle = d.color + '44';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(dx, dy, d.size, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.fill();
        ctx.strokeStyle = darkMode ? '#121A0F' : '#FAF6EC';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }

    function drawPings() {
      for (let i = pings.length - 1; i >= 0; i--) {
        const p = pings[i];
        p.life--;
        p.r += 1.4;
        const alpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34,211,27,${alpha * 0.8})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (p.life <= 0) pings.splice(i, 1);
      }
    }

    function drawCenter() {
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fillStyle = darkMode ? '#1A2417' : '#fff';
      ctx.fill();
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = ORANGE;
      ctx.font = '700 8px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('YOU', cx, cy + 3);
      ctx.textAlign = 'left';
    }

    function loop() {
      frame++;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      drawRings();
      drawSweepTrail();

      dots.forEach(d => {
        const da = ((sweep - d.baseAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        if (da < 0.06) {
          pings.push({ x: d.x, y: d.y, r: d.size, life: 48, maxLife: 48 });
        }
      });

      drawPings();
      drawDots();
      drawCenter();

      sweep += 0.018;
      if (sweep > Math.PI * 2) sweep -= Math.PI * 2;

      animId = requestAnimationFrame(loop);
    }

    loop();

    const resize = () => {
      const cw = Math.min(canvas.parentElement?.clientWidth || W, W);
      canvas.style.width = cw + 'px';
      canvas.style.height = cw + 'px';
    };
    window.addEventListener('resize', resize);
    resize();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [darkMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '50%', maxWidth: 560 }}
    />
  );
}

function FloatingCard({ icon, label, rating, dist, delay, x, y, theme }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{ delay, duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', type: 'spring', stiffness: 120 }}
      style={{
        position: 'absolute', left: x, top: y,
        background: 'rgba(255,255,255,0.9)',
        border: '1px solid rgba(23,36,26,0.09)',
        borderRadius: 12, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
        minWidth: 160, zIndex: 3,
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,122,0,0.094)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={17} color="#FF7A00" />
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#17241A', margin: 0 }}>{label}</p>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
          <Icon name="star" size={10} color="#FF7A00" />
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: '#5B6B57' }}>{rating} · {dist}</span>
        </div>
      </div>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22D31B', marginLeft: 'auto', flexShrink: 0 }} />
    </motion.div>
  );
}

function HeroMapPanel({ darkMode, theme }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.25 }}
      style={{ position: 'relative', width: '100%', maxWidth: 560, margin: '0 auto' }}
    >
      <div style={{ position: 'relative', width: '100%', height: 560, borderRadius: 32, overflow: 'hidden', border: 'none', boxShadow: 'none', background: 'transparent', backdropFilter: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'transparent' }} />
        <div style={{ position: 'absolute', inset: 0 }}>
          <RadarCanvas darkMode={darkMode} />
        </div>
      </div>

      <FloatingCard icon="broom" label="Limpeza" rating="4.9" dist="0.3km" delay={1.2} x="-26px" y="58px" theme={theme} />
      <FloatingCard icon="bolt" label="Elétrica" rating="4.8" dist="0.7km" delay={1.5} x="490px" y="110px" theme={theme} />
      <FloatingCard icon="wrench" label="Pedreiro" rating="4.7" dist="1.1km" delay={1.8} x="-18px" y="360px" theme={theme} />
    </motion.div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────── */
export default function LandingPage() {
  const { user, loading } = usarAutenticacao();
  const router = useRouter();
  const { scrollY } = useScroll();
  const [navSolid, setNavSolid] = useState(false);
  const { darkMode, toggleDarkMode } = usarTema();
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push(user.mode === 'worker' ? '/trabalhador' : '/cliente');
    }
  }, [user, loading]);

  useEffect(() => {
    const unsub = scrollY.on('change', (v) => setNavSolid(v > 50));
    return unsub;
  }, [scrollY]);

  function toggleAccessibility() {
    setAccessibilityOpen(prev => !prev);
  }

  const theme = darkMode ? {
    bg: '#0D1F0D', bgAlt: '#0A1A0A',
    text: '#FFFFFF', textMuted: '#7DAA7D',
    cardBg: '#122112', cardBorder: 'rgba(34,211,27,0.12)', cardBorderHover: 'rgba(255,122,0,0.3)',
    navBg: 'rgba(13,31,13,0.92)', navBorder: 'rgba(34,211,27,0.15)',
    navLinkColor: 'rgba(255,255,255,0.75)', navLinkHoverBg: 'rgba(255,255,255,0.08)',
    glowOrange: 'rgba(255,122,0,0.12)', glowGreen: 'rgba(34,211,27,0.1)',
    footerBg: '#060F06', footerBorder: 'rgba(34,211,27,0.1)', footerMuted: '#4A6A4A',
    categoryBg: '#122112', categoryBorder: 'rgba(34,211,27,0.1)',
    toggleBg: '#182A18', toggleBorder: 'rgba(34,211,27,0.3)', toggleIcon: '#FFB347',
    outlineBorder: 'rgba(255,255,255,0.25)', outlineText: '#FFFFFF',
    dividerA: '#0A1A0A', dividerB: '#0D1F0D',
  } : {
    bg: '#FFFFFF', bgAlt: '#F5FBF6',
    text: '#12261B', textMuted: '#4F6A5A',
    cardBg: '#FFFFFF', cardBorder: 'rgba(34,211,27,0.25)', cardBorderHover: 'rgba(255,122,0,0.45)',
    navBg: 'rgba(255,255,255,0.88)', navBorder: 'rgba(34,211,27,0.2)',
    navLinkColor: 'rgba(18,38,27,0.75)', navLinkHoverBg: 'rgba(34,211,27,0.1)',
    glowOrange: 'rgba(255,122,0,0.10)', glowGreen: 'rgba(34,211,27,0.12)',
    footerBg: '#F1F8F2', footerBorder: 'rgba(34,211,27,0.18)', footerMuted: '#6B8577',
    categoryBg: '#FFFFFF', categoryBorder: 'rgba(34,211,27,0.22)',
    toggleBg: '#FFFFFF', toggleBorder: 'rgba(34,211,27,0.35)', toggleIcon: '#FF7A00',
    outlineBorder: 'rgba(18,38,27,0.2)', outlineText: '#12261B',
    dividerA: '#F5FBF6', dividerB: '#FFFFFF',
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg, transition: 'background 0.4s' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
        <img src="/img/logo.png" alt="MoviPay" style={{ width: 200, height: 200, borderRadius: '50%' }} />
      </motion.div>
    </div>
  );

  return (
    <LeafProvider count={24}>
      <div style={{ minHeight: '100vh', overflowX: 'hidden', background: theme.bg, color: theme.text, fontFamily: 'Inter, sans-serif', transition: 'background 0.4s ease, color 0.4s ease', position: 'relative', zIndex: 0 }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        html { scroll-behavior: smooth; }

        .btn-primary {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #FF7A00, #FF9A33);
          color: #fff;
          font-weight: 800;
          border-radius: 16px;
          padding: 16px 36px;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 8px 32px rgba(255,122,0,0.35);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0; left: -75%;
          width: 50%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.45), transparent);
          transform: skewX(-20deg);
          transition: left 0.6s ease;
        }
        .btn-primary:hover::before { left: 130%; }
        .btn-primary:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 16px 40px rgba(255,122,0,0.5);
        }
        .btn-primary:hover .arrow-icon { transform: translateX(4px); }
        .arrow-icon { transition: transform 0.25s; }

        .btn-outline {
          background: transparent;
          color: ${theme.outlineText};
          font-weight: 700;
          border-radius: 16px;
          padding: 14px 34px;
          font-size: 1rem;
          border: 2px solid ${theme.outlineBorder};
          cursor: pointer;
          transition: all 0.2s;
          display: inline-block;
          text-decoration: none;
        }
        .btn-outline:hover {
          border-color: #FF7A00;
          background: rgba(255,122,0,0.08);
          color: #FF7A00;
          transform: translateY(-2px);
        }

        .card {
          background: ${theme.cardBg};
          border: 1px solid ${theme.cardBorder};
          border-radius: 20px;
          transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s, background 0.4s;
        }
        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 60px rgba(34,211,27,0.14);
          border-color: ${theme.cardBorderHover};
        }

        .section-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,122,0,0.12);
          border: 1px solid rgba(255,122,0,0.25);
          color: #FF7A00;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 16px;
          border-radius: 999px;
          margin-bottom: 20px;
        }

        .gradient-text {
          background: linear-gradient(135deg, #FF7A00, #FFB347, #22D31B);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-link {
          color: ${theme.navLinkColor};
          font-weight: 600;
          font-size: 0.9rem;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 10px;
          transition: all 0.2s;
        }
        .nav-link:hover {
          color: #FF7A00;
          background: ${theme.navLinkHoverBg};
        }

        .theme-toggle {
          width: 42px; height: 42px;
          border-radius: 50%;
          background: ${theme.toggleBg};
          border: 1px solid ${theme.toggleBorder};
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.4s, border-color 0.4s, transform 0.2s;
        }
        .theme-toggle:hover { transform: scale(1.08) rotate(-8deg); }

        .category-card {
          background: ${theme.categoryBg};
          border: 1px solid ${theme.categoryBorder};
          border-radius: 16px;
          padding: 20px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          transition: all 0.25s;
          cursor: pointer;
          color: ${theme.textMuted};
        }
        .category-card:hover {
          background: rgba(255,122,0,0.08);
          border-color: rgba(255,122,0,0.4);
          transform: translateY(-5px) scale(1.04);
          box-shadow: 0 12px 40px rgba(255,122,0,0.15);
          color: #FF7A00;
        }
        .category-card:hover .cat-icon { transform: scale(1.2) rotate(-6deg); }
        .cat-icon { transition: transform 0.25s; display: flex; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .floating { animation: float 4s ease-in-out infinite; }

        @keyframes bounce-down {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(8px); opacity: 1; }
        }
        .scroll-hint { animation: bounce-down 2s ease-in-out infinite; }

        @media (max-width: 768px) {
          .hero-title { font-size: 2.4rem !important; }
          .hide-mobile { display: none !important; }
          .grid-3 { grid-template-columns: 1fr !important; }
          .grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .grid-8 { grid-template-columns: repeat(4, 1fr) !important; }
          .accessibility-menu { width: 280px !important; right: 10px !important; top: 80px !important; }
          .stick-ant-container { bottom: 12px !important; right: 12px !important; width: 52px !important; height: 52px !important; top: auto !important; }
        }
      `}</style>

      {/* ── FLOATING LEAVES (CAEM E SE ACUMULAM NO FOOTER) ────────────────── */}
      <FolhasCaindo count={24} />

      {/* ── STICK FIGURE ANT (Accessibility Botao) ──────────────────── */}
      <StickFigureAnt
        isOpen={accessibilityOpen}
        onClick={toggleAccessibility}
        theme={theme}
        darkMode={darkMode}
      />

      {/* ── ACCESSIBILITY MENU ────────────────────────────────────────── */}
      <AccessibilityMenu
        isOpen={accessibilityOpen}
        onClose={() => setAccessibilityOpen(false)}
        theme={theme}
      />

      {/* ── NAVBAR ───────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: navSolid ? `1px solid ${theme.navBorder}` : '1px solid transparent', background: navSolid ? theme.navBg : 'transparent', transition: 'all 0.35s' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.img
              src="/img/logo.png" alt="MoviPay"
              style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
              whileHover={{ scale: 1.1, rotate: 6 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            <span style={{ fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
              <span style={{ color: '#FF7A00' }}>Movi</span>
              <span style={{ color: '#22D31B' }}>Pay</span>
            </span>
          </div>

          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <a href="#categorias" className="nav-link">Serviços</a>
            <a href="#como-funciona" className="nav-link">Como funciona</a>
            <a href="#depoimentos" className="nav-link">Avaliações</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="theme-toggle"
              aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo noturno'}
              title={darkMode ? 'Modo claro' : 'Modo noturno'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={darkMode ? 'sun' : 'moon'}
                  initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: 'flex' }}
                >
                  <Icon name={darkMode ? 'sun' : 'moon'} size={20} color={theme.toggleIcon} />
                </motion.span>
              </AnimatePresence>
            </button>
            <Link href="/entrar" className="btn-outline hide-mobile" style={{ padding: '10px 22px', fontSize: '0.875rem' }}>
              Entrar
            </Link>
            <Link href="/cadastro" className="btn-primary" style={{ padding: '10px 22px', fontSize: '0.875rem' }}>
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: '92vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>

        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <motion.div style={{
            position: 'absolute', top: '10%', left: '20%', width: 500, height: 500,
            background: `radial-gradient(circle, ${theme.glowOrange} 0%, transparent 70%)`,
            borderRadius: '50%',
          }} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 6, repeat: Infinity }} />
          <motion.div style={{
            position: 'absolute', top: '25%', right: '10%', width: 400, height: 400,
            background: `radial-gradient(circle, ${theme.glowGreen} 0%, transparent 70%)`,
            borderRadius: '50%',
          }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity, delay: 1 }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '80px 24px 0', flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)', alignItems: 'center', gap: 40 }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} style={{ textAlign: 'left' }}>

              <motion.div
                className="section-label"
                style={{ margin: '0 0 24px' }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <img src="/img/logo.png" alt="" style={{ width: 18, height: 18, borderRadius: '50%' }} />
                Serviços locais, agora mais simples
              </motion.div>

              <h1
                className="hero-title"
                style={{ fontWeight: 900, fontSize: '4.5rem', lineHeight: 1.08, letterSpacing: '-0.04em', marginBottom: 24 }}
              >
                Conectando quem{' '}
                <span style={{ display: 'block' }}>
                  <span className="gradient-text">precisa com quem sabe</span>
                </span>
              </h1>

              <p style={{ fontSize: '1.2rem', color: theme.textMuted, maxWidth: 560, margin: '0 0 40px', lineHeight: 1.65 }}>
                Encontre profissionais qualificados perto de você em segundos.
                Elétrica, limpeza, pintura e muito mais — com segurança total.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 64 }}>
                <Link href="/cadastro" className="btn-primary" style={{ fontSize: '1.05rem' }}>
                  Começar agora — é grátis
                  <Icon name="arrowRight" size={18} className="arrow-icon" />
                </Link>
                <Link href="/entrar" className="btn-outline" style={{ fontSize: '1.05rem' }}>
                  Já tenho conta
                </Link>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center' }}
              >
                {STATS.map((s, i) => (
                  <div key={i} style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FF7A00', margin: 0 }}>
                      <AnimatedCounter target={s.value} suffix={s.suffix} decimal={s.decimal} />
                    </p>
                    <p style={{ fontSize: '0.8rem', color: theme.textMuted, marginTop: 4, fontWeight: 500 }}>{s.label}</p>
                  </div>
                ))}
              </motion.div>

            </motion.div>

            <HeroMapPanel darkMode={darkMode} theme={theme} />
          </div>
        </div>

        <motion.div
          className="scroll-hint hide-mobile"
          style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', marginBottom: 12 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <Icon name="chevronDown" size={22} color={theme.textMuted} />
        </motion.div>

        <FormigaCanvas />

        <motion.div
          className="floating"
          style={{
            position: 'absolute', bottom: 90, right: '8%', zIndex: 2,
            filter: 'drop-shadow(0 8px 24px rgba(255,122,0,0.4))',
          }}
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 100 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
        />

      </section>

      {/* ── CATEGORIAS ───────────────────────────────────────────────── */}
      <section id="categorias" style={{ background: theme.bg, paddingTop: 80, paddingBottom: 80, transition: 'background 0.4s' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="section-label" style={{ margin: '0 auto 16px' }}>Categorias</div>
            <h2 style={{ fontWeight: 900, fontSize: '2.4rem', letterSpacing: '-0.03em' }}>
              O que você <span style={{ color: '#FF7A00' }}>precisa?</span>
            </h2>
            <p style={{ color: theme.textMuted, marginTop: 10 }}>Encontre o serviço certo pra você agora mesmo.</p>
          </div>

          <div className="grid-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 14 }}>
            {CATEGORIES.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                viewport={{ once: true }}
              >
                <Link href="/cadastro" className="category-card">
                  <span className="cat-icon">
                    {c.img
                      ? <img src={c.img} alt={c.name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', border: '2px solid rgba(255,122,0,0.3)' }} />
                      : <Icon name={c.icon} size={30} />
                    }
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, textAlign: 'center' }}>{c.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section style={{ background: theme.bgAlt, paddingTop: 96, paddingBottom: 96, transition: 'background 0.4s' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="section-label" style={{ margin: '0 auto 16px' }}>Recursos</div>
            <h2 style={{ fontWeight: 900, fontSize: '2.4rem', letterSpacing: '-0.03em' }}>
              Tudo que você <span className="gradient-text">precisa</span>
            </h2>
            <p style={{ color: theme.textMuted, marginTop: 12, maxWidth: 480, margin: '12px auto 0' }}>
              Uma plataforma completa para contratar e oferecer serviços com segurança.
            </p>
          </div>

          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="card"
                style={{ padding: 28 }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
              >
                <div style={{
                  width: 52, height: 52,
                  background: 'rgba(255,122,0,0.1)',
                  border: '1px solid rgba(255,122,0,0.2)',
                  borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18,
                }}>
                  <Icon name={f.icon} size={24} color="#FF7A00" />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: theme.textMuted, lineHeight: 1.65 }}>{f.body}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────────────────── */}
      <section id="como-funciona" style={{ background: theme.bg, paddingTop: 96, paddingBottom: 96, position: 'relative', overflow: 'hidden', transition: 'background 0.4s' }}>

        <div style={{ position: 'absolute', top: '20%', left: '5%', width: 300, height: 300, background: `radial-gradient(circle, ${theme.glowOrange} 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 300, height: 300, background: `radial-gradient(circle, ${theme.glowGreen} 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>

          <div className="section-label" style={{ margin: '0 auto 16px' }}>Processo</div>
          <h2 style={{ fontWeight: 900, fontSize: '2.4rem', letterSpacing: '-0.03em', marginBottom: 12 }}>
            Como <span style={{ color: '#22D31B' }}>funciona?</span>
          </h2>
          <p style={{ color: theme.textMuted, marginBottom: 72 }}>Em 3 passos simples — da busca ao serviço concluído.</p>

          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 40, left: '20%', right: '20%', height: 2,
              background: 'linear-gradient(90deg, #FF7A00, #22D31B)',
              opacity: 0.25, borderRadius: 1,
            }} />

            {[
              { step: '01', icon: 'search',    title: 'Busque',   body: 'Procure o serviço que precisa e veja profissionais disponíveis na sua região.', color: '#FF7A00' },
              { step: '02', icon: 'clipboard', title: 'Contrate', body: 'Escolha o profissional, veja o preço e confirme o pedido em segundos.', color: '#FFB347' },
              { step: '03', icon: 'star',      title: 'Avalie',   body: 'Após o serviço, avalie e ganhe pontos para usar na próxima vez.', color: '#22D31B' },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
              >
                <motion.div
                  whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    width: 80, height: 80,
                    background: s.color === '#22D31B' ? 'rgba(34,211,27,0.12)' : 'rgba(255,122,0,0.12)',
                    border: '2px solid ' + s.color + '33',
                    borderRadius: 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 20,
                    boxShadow: '0 0 30px ' + s.color + '20',
                  }}
                >
                  <Icon name={s.icon} size={32} color={s.color} />
                </motion.div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: s.color, letterSpacing: '0.1em', marginBottom: 8 }}>{s.step}</span>
                <h3 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: '0.875rem', color: theme.textMuted, lineHeight: 1.65 }}>{s.body}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginTop: 64 }}
          >
            <Link href="/cadastro" className="btn-primary" style={{ fontSize: '1rem' }}>
              Quero começar agora
              <Icon name="arrowRight" size={18} className="arrow-icon" />
            </Link>
          </motion.div>
        </div>

      </section>

      {/* ── FLUXO SIMPLES ─────────────────────────────────────────────── */}
      <section style={{ background: theme.bg, paddingTop: 96, paddingBottom: 96, position: 'relative', overflow: 'hidden', transition: 'background 0.4s' }}>
        <div style={{ position: 'absolute', top: '20%', left: '8%', width: 240, height: 240, background: `radial-gradient(circle, ${theme.glowOrange} 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '12%', right: '8%', width: 240, height: 240, background: `radial-gradient(circle, ${theme.glowGreen} 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="section-label" style={{ margin: '0 auto 16px' }}>fluxo simples</div>
          <h2 style={{ fontWeight: 900, fontSize: '2.4rem', letterSpacing: '-0.03em', marginBottom: 12 }}>
            Do pedido ao serviço pronto em <span style={{ color: '#22D31B' }}>3 passos</span>
          </h2>
          <p style={{ color: theme.textMuted, marginBottom: 52 }}>Tudo pensado para ser rápido, simples e confiável.</p>

          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 24 }}>
            {[
              { step: '01', icon: 'search', title: 'Busque', body: 'Descubra o serviço ideal na sua região em poucos segundos.', color: '#FF7A00' },
              { step: '02', icon: 'clipboard', title: 'Contrate', body: 'Compare profissionais, veja avaliações e confirme em instantes.', color: '#FFB347' },
              { step: '03', icon: 'star', title: 'Avalie', body: 'Finalize o serviço e ganhe pontos para descontos futuros.', color: '#22D31B' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.12 }}
                viewport={{ once: true }}
                style={{
                  background: theme.cardBg,
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: 20,
                  padding: 28,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <div style={{ width: 72, height: 72, borderRadius: 18, background: item.color === '#22D31B' ? 'rgba(34,211,27,0.12)' : 'rgba(255,122,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <Icon name={item.icon} size={28} color={item.color} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', color: item.color, marginBottom: 8 }}>{item.step}</span>
                <h3 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: '0.88rem', color: theme.textMuted, lineHeight: 1.7, margin: 0 }}>{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ───────────────────────────────────────────────── */}
      <section id="depoimentos" style={{ background: theme.bgAlt, paddingTop: 96, paddingBottom: 96, transition: 'background 0.4s' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="section-label" style={{ margin: '0 auto 16px' }}>Depoimentos</div>
            <h2 style={{ fontWeight: 900, fontSize: '2.4rem', letterSpacing: '-0.03em' }}>
              O que dizem nossos <span style={{ color: '#22D31B' }}>usuários</span>
            </h2>
          </div>

          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                className="card"
                style={{ padding: 28 }}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Icon key={j} name="star" size={16} color="#FF7A00" />
                  ))}
                </div>
                <p style={{ fontSize: '0.9rem', color: theme.textMuted, lineHeight: 1.7, marginBottom: 24 }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF7A00, #22D31B)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '1rem', color: '#fff', flexShrink: 0,
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '0.875rem' }}>{t.name}</p>
                    <p style={{ fontSize: '0.75rem', color: theme.textMuted, marginTop: 2 }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── SPARKLE WAVE DIVIDER ──────────────────────────────────────── */}
      <SparkleDivider theme={theme} />

      {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
      <section style={{ background: theme.bg, paddingTop: 80, paddingBottom: 100, transition: 'background 0.4s' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="floating"
              style={{ marginBottom: 24, display: 'inline-block' }}
              whileHover={{ scale: 1.12, rotate: 8 }}
            >
              <img
                src="/img/logo.png"
                alt="MoviPay"
                style={{ width: 100, height: 100, objectFit: 'contain', filter: 'drop-shadow(0 8px 32px rgba(255,122,0,0.5))' }}
              />
            </motion.div>

            <h2 style={{ fontWeight: 900, fontSize: '3rem', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 16 }}>
              Pronto para <span className="gradient-text">começar?</span>
            </h2>
            <p style={{ color: theme.textMuted, fontSize: '1.1rem', marginBottom: 40, lineHeight: 1.65 }}>
              Junte-se a milhares de pessoas que já simplificaram sua vida com o MoviPay.
              Grátis, rápido e seguro.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
              <Link href="/cadastro" className="btn-primary" style={{ fontSize: '1.05rem' }}>
                Criar minha conta grátis
                <Icon name="arrowRight" size={18} className="arrow-icon" />
              </Link>
              <Link href="/entrar" className="btn-outline" style={{ fontSize: '1.05rem' }}>
                Já tenho conta
              </Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 40, flexWrap: 'wrap' }}>
              {[
                { icon: 'lock', label: 'Pagamento seguro' },
                { icon: 'clock', label: 'Resposta em 15min' },
                { icon: 'star', label: '4.9 de avaliação' },
              ].map((b, i) => (
                <span key={i} style={{ fontSize: '0.8rem', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <Icon name={b.icon} size={15} color="#22D31B" />
                  {b.label}
                </span>
              ))}
            </div>

          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{ position: 'relative', background: theme.footerBg, borderTop: `1px solid ${theme.footerBorder}`, padding: '40px 24px 44px', transition: 'background 0.4s', overflow: 'hidden', zIndex: 10 }}>
        <FooterLeafPile />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/img/logo.png" alt="MoviPay" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            <span style={{ fontWeight: 900, fontSize: '1rem' }}>
              <span style={{ color: '#FF7A00' }}>Movi</span>
              <span>Pay</span>
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: theme.footerMuted }}>
            © 2026 MoviPay — TCC ETEC Maria Cristina Medeiros
          </p>

          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/entrar" style={{ fontSize: '0.85rem', color: theme.textMuted, textDecoration: 'none', fontWeight: 600 }}>
              Entrar
            </Link>
            <Link href="/cadastro" style={{ fontSize: '0.85rem', color: theme.textMuted, textDecoration: 'none', fontWeight: 600 }}>
              Cadastrar
            </Link>
          </div>

        </div>
      </footer>

    </div>
    </LeafProvider>
  );
}
