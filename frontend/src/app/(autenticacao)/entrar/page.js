'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { usarAutenticacao } from '@/contexto/contextoAutenticacao';
import { useToast } from '@/componentes/interface/Notificacao';
import { usarFormulario, rules } from '@/ganchos/usarFormulario';
import { usarTema as useSharedTheme } from '@/contexto/contextoTema';
import FolhasCaindo from '@/componentes/efeitos/FolhasCaindo';

/* ─── ICONS (no emojis — hand-drawn SVG, matches the landing page set) ── */
function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8, style }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth,
    strokeLinecap: 'round', strokeLinejoin: 'round', style,
  };
  switch (name) {
    case 'mail':
      return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>;
    case 'lock':
      return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
    case 'alert':
      return <svg {...p}><path d="M12 3l10 18H2L12 3z" /><line x1="12" y1="10" x2="12" y2="14" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
    case 'arrowRight':
      return <svg {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
    case 'sun':
      return <svg {...p}><circle cx="12" cy="12" r="4.5" /><line x1="12" y1="1.5" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22.5" /><line x1="4.2" y1="4.2" x2="6" y2="6" /><line x1="18" y1="18" x2="19.8" y2="19.8" /><line x1="1.5" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22.5" y2="12" /><line x1="4.2" y1="19.8" x2="6" y2="18" /><line x1="18" y1="6" x2="19.8" y2="4.2" /></svg>;
    case 'moon':
      return <svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
    case 'leaf':
      return <svg {...p}><path d="M5 21c0-9 6-15 15-15-1 9-7 15-15 15z" /><path d="M5 21c3-3 6-6 9-9" /></svg>;
    default:
      return null;
  }
}

/* FloatingLeaf: replaced by the shared <FolhasCaindo /> component so this
   page's leaves match every other screen exactly. */

export default function LoginPage() {
  const { user, entrar } = usarAutenticacao();
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();
  // Uses the same shared theme (and same 'movipay-theme' localStorage key)
  // as the rest of the app, instead of its own separate darkMode state that
  // previously wrote a plain 'dark'/'light' string to that key — clobbering
  // the JSON preference object the shared ContextoTema expects and losing
  // the setting when navigating between the entrar page and the dashboard.
  const { darkMode, toggleDarkMode } = useSharedTheme();

  function toggleTheme() {
    toggleDarkMode();
  }

  const form = usarFormulario(
    { email: '', password: '' },
    {
      email:    [rules.required(), rules.email()],
      password: [rules.required(), rules.minLength(6)],
    }
  );

  async function handleSubmit(e) {
    e.preventDefault();
    form.handleBlur('email');
    form.handleBlur('password');
    if (!form.values.email || !form.values.password) return;

    await form.handleSubmit(async values => {
      try {
        await entrar(values.email, values.password);
      } catch (err) {
        toast(err?.response?.data?.error || err?.message || 'Credenciais inválidas', 'error');
      }
    });
  }

  async function fillTest(email) {
    try {
      await entrar(email, '123456');
    } catch (err) {
      toast(err?.message || 'Credenciais inválidas', 'error');
    }
  }

  /* ── THEME TOKENS — light (default) uses #FF7A00 / #FFFFFF / #22D31B ── */
  const theme = darkMode ? {
    bg: '#0D1F0D',
    navBg: 'rgba(13,31,13,0.9)', navBorder: 'rgba(34,211,27,0.15)',
    text: '#FFFFFF', textMuted: '#7DAA7D', textFaint: '#4A6A4A',
    cardBg: '#122112', cardBorder: 'rgba(34,211,27,0.15)',
    inputBg: '#0D1F0D', inputBorder: 'rgba(34,211,27,0.25)', inputText: '#FFFFFF',
    errorBg: 'rgba(255,90,90,0.08)', errorBorder: 'rgba(255,90,90,0.45)', errorText: '#FF8A8A',
    dividerColor: 'rgba(34,211,27,0.15)',
    testCardBg: '#0D1F0D', testCardBorder: 'rgba(34,211,27,0.18)', testCardHoverBg: '#152615',
    toggleBg: '#182A18', toggleBorder: 'rgba(34,211,27,0.3)', toggleIcon: '#FFB347',
    glowOrange: 'rgba(255,122,0,0.10)', glowGreen: 'rgba(34,211,27,0.10)',
  } : {
    bg: '#FFFFFF',
    navBg: 'rgba(255,255,255,0.92)', navBorder: 'rgba(34,211,27,0.15)',
    text: '#12261B', textMuted: '#5C7568', textFaint: '#93A79B',
    cardBg: '#FFFFFF', cardBorder: 'rgba(34,211,27,0.2)',
    inputBg: '#FFFFFF', inputBorder: 'rgba(18,38,27,0.15)', inputText: '#12261B',
    errorBg: '#FEF2F2', errorBorder: '#FCA5A5', errorText: '#DC2626',
    dividerColor: 'rgba(34,211,27,0.18)',
    testCardBg: '#FFFFFF', testCardBorder: 'rgba(18,38,27,0.12)', testCardHoverBg: '#F5FBF6',
    toggleBg: '#FFFFFF', toggleBorder: 'rgba(34,211,27,0.35)', toggleIcon: '#FF7A00',
    glowOrange: 'rgba(255,122,0,0.08)', glowGreen: 'rgba(34,211,27,0.10)',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: theme.bg, color: theme.text, fontFamily: 'Inter, sans-serif', position: 'relative', zIndex: 0, overflow: 'hidden', transition: 'background 0.4s ease, color 0.4s ease' }}>

      <style>{`
        * { box-sizing: border-box; }
        .login-layout { display: flex; align-items: center; gap: 64px; }
        .login-benefits { flex: 1; max-width: 430px; }
        .auth-switch { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: ${darkMode ? '#0D1F0D' : '#F5F8F5'}; border: 1px solid ${theme.cardBorder}; }
        .auth-switch a { flex: 1; padding: 10px 12px; border-radius: 9px; color: ${theme.textMuted}; font-size: 0.82rem; font-weight: 800; text-align: center; text-decoration: none; transition: background 0.2s, color 0.2s; }
        .auth-switch a.active { background: ${darkMode ? '#1A4D1A' : '#FFFFFF'}; color: #FF7A00; box-shadow: 0 3px 10px rgba(18,38,27,0.08); }
        @media (max-width: 780px) { .login-layout { display: block; } .login-benefits { display: none; } }

        .btn-primary {
          position: relative;
          overflow: hidden;
          width: 100%;
          background: linear-gradient(135deg, #FF7A00, #FF9A33);
          color: #fff;
          font-weight: 800;
          border-radius: 14px;
          padding: 14px;
          font-size: 0.95rem;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0 8px 24px rgba(255,122,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0; left: -75%;
          width: 50%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.4), transparent);
          transform: skewX(-20deg);
          transition: left 0.6s ease;
        }
        .btn-primary:hover::before { left: 130%; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(255,122,0,0.42); }
        .btn-primary:disabled { opacity: 0.65; cursor: default; transform: none; }

        .input-field {
          width: 100%;
          background: ${theme.inputBg};
          color: ${theme.inputText};
          border: 1.5px solid ${theme.inputBorder};
          border-radius: 12px;
          padding: 12px 14px 12px 42px;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.4s;
        }
        .input-field:focus {
          border-color: #FF7A00;
          box-shadow: 0 0 0 4px rgba(255,122,0,0.12);
        }
        .input-field.has-error {
          border-color: ${theme.errorBorder};
          background: ${theme.errorBg};
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: ${theme.textFaint};
        }

        .test-account-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid ${theme.testCardBorder};
          background: ${theme.testCardBg};
          cursor: pointer;
          text-align: left;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .test-account-btn:hover {
          background: ${theme.testCardHoverBg};
          border-color: rgba(255,122,0,0.35);
          transform: translateY(-2px);
        }
        .test-account-btn:hover .test-arrow { transform: translateX(3px); opacity: 1; }
        .test-arrow { transition: transform 0.2s, opacity 0.2s; opacity: 0.4; }

        .theme-toggle {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: ${theme.toggleBg};
          border: 1px solid ${theme.toggleBorder};
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.4s, border-color 0.4s, transform 0.2s;
        }
        .theme-toggle:hover { transform: scale(1.08) rotate(-8deg); }

        .nav-link {
          color: ${theme.textMuted};
          font-weight: 600;
          font-size: 0.9rem;
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #FF7A00; }
      `}</style>

      {/* Ambient glow, consistent with the landing page */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <motion.div style={{
          position: 'absolute', top: '-10%', left: '10%', width: 420, height: 420,
          background: `radial-gradient(circle, ${theme.glowOrange} 0%, transparent 70%)`, borderRadius: '50%',
        }} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 7, repeat: Infinity }} />
        <motion.div style={{
          position: 'absolute', bottom: '-10%', right: '8%', width: 380, height: 380,
          background: `radial-gradient(circle, ${theme.glowGreen} 0%, transparent 70%)`, borderRadius: '50%',
        }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 9, repeat: Infinity, delay: 1 }} />
      </div>

      <FolhasCaindo />

      {/* Navbar */}
      <nav style={{
        position: 'relative', zIndex: 2,
        background: theme.navBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.navBorder}`,
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', transition: 'background 0.4s, border-color 0.4s',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <motion.img
            src="/img/logo.png" alt="MoviPay"
            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
            whileHover={{ scale: 1.1, rotate: 6 }}
            transition={{ type: 'spring', stiffness: 300 }}
          />
          <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>
            <span style={{ color: '#FF7A00' }}>Movi</span>
            <span style={{ color: '#22D31B' }}>Pay</span>
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            type="button"
            onClick={toggleTheme}
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
                <Icon name={darkMode ? 'sun' : 'moon'} size={18} color={theme.toggleIcon} />
              </motion.span>
            </AnimatePresence>
          </button>
          <Link href="/cadastro" className="nav-link">
            Criar conta
          </Link>
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        <motion.div className="login-layout" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 980 }}>
          <div className="login-benefits">
            <p style={{ color: '#FF7A00', fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>MoviPay</p>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', lineHeight: 1.05, letterSpacing: '-0.05em', margin: 0 }}>Serviços locais, sem complicação.</h2>
            <p style={{ color: theme.textMuted, lineHeight: 1.7, marginTop: 18, maxWidth: 390 }}>Entre para acompanhar pedidos, conversar com profissionais e encontrar ajuda perto de você.</p>
            <div style={{ display: 'grid', gap: 12, marginTop: 28 }}>
              {['Profissionais da sua região', 'Orçamentos e conversas em um só lugar', 'Recompensas Folhas por usar o MoviPay'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: theme.textMuted, fontSize: '0.88rem' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,211,27,0.14)', color: '#22D31B', fontWeight: 900 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'rgba(255,122,0,0.1)', border: '1px solid rgba(255,122,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <img src="/img/logo.png" alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
            </motion.div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Bem-vindo de volta</h1>
            <p style={{ color: theme.textMuted, fontSize: '0.9rem', marginTop: 4 }}>Entre na sua conta MoviPay</p>
          </div>

          {/* Card */}
          <div style={{
            background: theme.cardBg, border: `1px solid ${theme.cardBorder}`,
            borderRadius: 24, boxShadow: darkMode ? 'none' : '0 20px 50px rgba(18,38,27,0.06)',
            padding: 28, display: 'flex', flexDirection: 'column', gap: 20,
            transition: 'background 0.4s, border-color 0.4s',
          }}>
            <div className="auth-switch" aria-label="Alternar autenticação">
              <Link href="/entrar" className="active">Entrar</Link>
              <Link href="/cadastro">Criar conta</Link>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Email */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>E-mail</label>
                <div style={{ position: 'relative' }}>
                  <span className="input-icon"><Icon name="mail" size={17} /></span>
                  <input
                    type="email"
                    value={form.values.email}
                    onChange={e => form.handleChange('email', e.target.value)}
                    onBlur={() => form.handleBlur('email')}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    className={`input-field ${form.errors.email && form.touched.email ? 'has-error' : ''}`}
                  />
                </div>
                {form.errors.email && form.touched.email && (
                  <p style={{ fontSize: '0.75rem', color: theme.errorText, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="alert" size={13} /> {form.errors.email}
                  </p>
                )}
              </div>

              {/* Senha */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Senha</label>
                  <button type="button" style={{ fontSize: '0.75rem', color: '#FF7A00', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Esqueci a senha
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <span className="input-icon"><Icon name="lock" size={17} /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.values.password}
                    onChange={e => form.handleChange('password', e.target.value)}
                    onBlur={() => form.handleBlur('password')}
                    placeholder="••••••"
                    autoComplete="new-password"
                    className={`input-field ${form.errors.password && form.touched.password ? 'has-error' : ''}`}
                    style={{ paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                  >
                    {showPassword
                      ? <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={theme.textFaint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={theme.textFaint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {form.errors.password && form.touched.password && (
                  <p style={{ fontSize: '0.75rem', color: theme.errorText, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="alert" size={13} /> {form.errors.password}
                  </p>
                )}
              </div>

              <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={form.submitting} className="btn-primary">
                {form.submitting && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }}
                  />
                )}
                {form.submitting ? 'Entrando...' : 'Entrar'}
              </motion.button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: theme.dividerColor }} />
              <span style={{ fontSize: '0.75rem', color: theme.textFaint, fontWeight: 600, whiteSpace: 'nowrap' }}>ou use uma conta de teste</span>
              <div style={{ flex: 1, height: 1, background: theme.dividerColor }} />
            </div>

            {/* Test accounts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button type="button" onClick={() => fillTest('ana@teste.com')} className="test-account-btn">
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'rgba(255,122,0,0.12)', color: '#FF7A00',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '0.85rem', flexShrink: 0,
                }}>A</div>
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>Ana Cliente</p>
                  <p style={{ fontSize: '0.75rem', color: theme.textFaint }}>ana@teste.com</p>
                </div>
                <span className="test-arrow" style={{ marginLeft: 'auto', color: theme.textFaint, display: 'flex' }}>
                  <Icon name="arrowRight" size={15} />
                </span>
              </button>

              <button type="button" onClick={() => fillTest('bruno@teste.com')} className="test-account-btn">
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'rgba(34,211,27,0.12)', color: '#22D31B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '0.85rem', flexShrink: 0,
                }}>B</div>
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>Bruno Trabalhador</p>
                  <p style={{ fontSize: '0.75rem', color: theme.textFaint }}>bruno@teste.com</p>
                </div>
                <span className="test-arrow" style={{ marginLeft: 'auto', color: theme.textFaint, display: 'flex' }}>
                  <Icon name="arrowRight" size={15} />
                </span>
              </button>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: theme.textMuted, marginTop: 20 }}>
            Não tem conta?{' '}
            <Link href="/cadastro" style={{ color: '#FF7A00', fontWeight: 700, textDecoration: 'none' }}>Criar gratuitamente</Link>
          </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
