'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usarTema } from '@/contexto/contextoTema';
import SharedIcon from '@/componentes/interface/Icone';

/* ─── SVG ICONS ────────────────────────────────────────────────── */
function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 1.8, style }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth,
    strokeLinecap: 'round', strokeLinejoin: 'round', style,
  };
  switch (name) {
    case 'sun':
      return <svg {...p}><circle cx="12" cy="12" r="4" /><line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="6.34" y2="6.34" /><line x1="17.66" y1="17.66" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="6.34" y2="17.66" /><line x1="17.66" y1="6.34" x2="19.07" y2="4.93" /></svg>;
    case 'moon':
      return <svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
    case 'x':
      return <svg {...p}><line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" /></svg>;
    case 'eye':
      return <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
    case 'shield':
      return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    case 'check':
      return <svg {...p}><polyline points="20 6 9 17 4 12" /></svg>;
    case 'reset':
      return <svg {...p}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>;
    default: return null;
  }
}

/* ─── ACCESSIBILITY FLOATING BUTTON ─────────────────────────────── */
export function AccessibilityBotao({ isOpen, onClick, darkMode }) {
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
      aria-expanded={isOpen}
      title="Acessibilidade"
    >
      <motion.img
        src="/img/logo.png"
        alt=""
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

/* ─── ACCESSIBILITY MENU ─────────────────────────────────────────── */
export function AccessibilityMenu({ isOpen, onClose }) {
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

  const themeColors = {
    text: darkMode ? '#F3EFE2' : '#17241A',
    textMuted: darkMode ? '#8AA085' : '#5B6B57',
    cardBg: darkMode ? 'rgba(26,36,23,0.95)' : 'rgba(255,255,255,0.98)',
    cardBorder: darkMode ? 'rgba(243,239,226,0.15)' : 'rgba(23,36,26,0.10)',
    hoverBg: darkMode ? 'rgba(243,239,226,0.05)' : 'rgba(0,0,0,0.03)',
    line: darkMode ? 'rgba(243,239,226,0.10)' : 'rgba(0,0,0,0.06)',
  };

  const menuItems = [
    {
      id: 'highContrast',
      label: 'Alto Contraste',
      icon: 'shield',
      active: highContrast,
      onClick: toggleHighContrast,
    },
    {
      id: 'protanopia',
      label: 'Protanopia (vermelho-verde)',
      icon: 'eye',
      active: daltonism === 'protanopia',
      onClick: () => setDaltonism('protanopia'),
    },
    {
      id: 'deuteranopia',
      label: 'Deuteranopia (verde-vermelho)',
      icon: 'eye',
      active: daltonism === 'deuteranopia',
      onClick: () => setDaltonism('deuteranopia'),
    },
    {
      id: 'tritanopia',
      label: 'Tritanopia (azul-amarelo)',
      icon: 'eye',
      active: daltonism === 'tritanopia',
      onClick: () => setDaltonism('tritanopia'),
    },
  ];

  const fontSizeOptions = [
    { value: 80, label: 'A' },
    { value: 100, label: 'A' },
    { value: 120, label: 'A' },
    { value: 140, label: 'A' },
  ];

  const isDaltonismActive = daltonism !== 'none';
  const hasAnyActive = isDaltonismActive || highContrast || darkMode || fontSize !== 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'transparent', zIndex: 150 }} onClick={onClose} />

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
              background: themeColors.cardBg,
              borderRadius: 20,
              border: `1px solid ${themeColors.cardBorder}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              padding: 24,
              zIndex: 160,
              backdropFilter: 'blur(12px)',
              color: themeColors.text,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: '1.1rem', color: themeColors.text, margin: 0 }}>
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
                  color: themeColors.textMuted,
                  display: 'flex',
                }}
                aria-label="Fechar menu de acessibilidade"
              >
                <Icon name="x" size={20} color={themeColors.textMuted} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: themeColors.textMuted, marginBottom: 20 }}>
              Ajuste a experiência para suas necessidades
            </p>

            {/* Theme toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: darkMode ? 'rgba(243,239,226,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: 12,
                marginBottom: 12,
                cursor: 'pointer',
                border: `1px solid ${themeColors.line}`,
              }}
              onClick={toggleDarkMode}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleDarkMode();
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: themeColors.text, fontSize: '0.88rem', fontWeight: 600 }}>
                <Icon name={darkMode ? 'sun' : 'moon'} size={18} color="#FF7A00" />
                Modo {darkMode ? 'Claro' : 'Escuro'}
              </span>
              <div
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
              </div>
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
                  onMouseEnter={e => {
                    if (!item.active) e.currentTarget.style.background = themeColors.hoverBg;
                  }}
                  onMouseLeave={e => {
                    if (!item.active) e.currentTarget.style.background = 'transparent';
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      item.onClick();
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: themeColors.text, fontSize: '0.85rem', fontWeight: item.active ? 700 : 500 }}>
                    <Icon name={item.icon} size={15} color={item.active ? '#FF7A00' : themeColors.textMuted} />
                    {item.label}
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
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${themeColors.line}` }}>
              <p style={{ fontSize: '0.78rem', color: themeColors.textMuted, marginBottom: 10, fontWeight: 700, fontFamily: 'var(--body)' }}>
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
                      border: `2px solid ${fontSize === opt.value ? '#FF7A00' : themeColors.line}`,
                      background: fontSize === opt.value ? 'rgba(255,122,0,0.1)' : 'transparent',
                      color: fontSize === opt.value ? '#FF7A00' : themeColors.text,
                      fontSize: `${opt.value / 100 * 14}px`,
                      fontWeight: fontSize === opt.value ? 800 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'var(--body)',
                    }}
                    aria-label={`Tamanho de fonte ${opt.value}%`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={resetAccessibility}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '10px',
                borderRadius: 12,
                border: `1px solid ${themeColors.line}`,
                background: 'transparent',
                color: themeColors.textMuted,
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'var(--body)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,122,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Icon name="reset" size={14} color={themeColors.textMuted} />
              Restaurar padrões
            </button>

            {/* Status */}
            <div style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 8,
              background: darkMode ? 'rgba(243,239,226,0.03)' : 'rgba(0,0,0,0.02)',
              fontSize: '0.7rem',
              color: themeColors.textMuted,
              textAlign: 'center',
            }}>
              {hasAnyActive ? (
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

/* ─── FULL ACCESSIBILITY CONTROLS (Botao + Menu) ──────────────────── */
export default function ControlesAcessibilidade() {
  const [isOpen, setIsOpen] = useState(false);
  const { darkMode } = usarTema();

  return (
    <>
      <AccessibilityBotao
        isOpen={isOpen}
        onClick={() => setIsOpen(o => !o)}
        darkMode={darkMode}
      />
      <AccessibilityMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
