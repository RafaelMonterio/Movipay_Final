'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, ClipboardList, Coins, CreditCard, Heart, Home, LogOut, MessageCircle, PlayCircle, Search, Target, User, Wallet } from 'lucide-react';
import { usarAutenticacao } from '@/contexto/contextoAutenticacao';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';

const clientLinks = [
  { href: '/cliente', icon: Home, label: 'Início' },
  { href: '/cliente/servicos', icon: Search, label: 'Serviços' },
  { href: '/cliente/orcamentos', icon: ClipboardList, label: 'Orçamentos' },
  { href: '/cliente/favoritos', icon: Heart, label: 'Favoritos' },
  { href: '/cliente/publicacoes', icon: PlayCircle, label: 'Shorts' },
  { href: '/cliente/conversas', icon: MessageCircle, label: 'Chat' },
  { href: '/cliente/pontos', icon: Coins, label: 'Folhas' },
  { href: '/cliente/perfil', icon: User, label: 'Perfil' },
];

const workerLinks = [
  { href: '/trabalhador', icon: Home, label: 'Início' },
  { href: '/trabalhador/pedidos', icon: ClipboardList, label: 'Pedidos' },
  { href: '/trabalhador/orcamentos', icon: Target, label: 'Oportunidades' },
  { href: '/trabalhador/agenda', icon: CalendarDays, label: 'Agenda' },
  { href: '/trabalhador/ganhos', icon: Wallet, label: 'Ganhos' },
  { href: '/trabalhador/carteira', icon: CreditCard, label: 'Carteira' },
  { href: '/trabalhador/planos', icon: Heart, label: 'Planos' },
  { href: '/trabalhador/conversas', icon: MessageCircle, label: 'Chat' },
  { href: '/trabalhador/perfil', icon: User, label: 'Perfil' },
];

export default function BarraLateral() {
  const { user, sair } = usarAutenticacao();
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  // BarraLateral is naturally minimized; expand on hover.
  const collapsed = !hovered;
  const { darkMode, highContrast } = usarTema();
  const isWorker = user?.mode === 'worker';
  const links = isWorker ? workerLinks : clientLinks;
  const mobileLinks = isWorker ? workerLinks.slice(0, 5) : [clientLinks[0], clientLinks[1], clientLinks[2], clientLinks[3], clientLinks[4]];

  // Compute colors based on accessibility state — always derived from the
  // same palette used by the rest of the app (obterCoresTema), so the
  // sidebar's dark mode matches every other screen instead of using its
  // own separate (bluish) dark palette.
  const isDark = darkMode || highContrast;
  const themeColors = obterCoresTema(darkMode);

  const panelBg = highContrast
    ? (isDark ? '#09090B' : '#F8FAFC')
    : (darkMode
      ? `linear-gradient(180deg, ${themeColors.bg} 0%, ${themeColors.bgAlt} 100%)`
      : 'linear-gradient(180deg, #FFFDF7 0%, #F5FBEF 100%)');

  const borderColor = highContrast
    ? (isDark ? '#F2F7FF' : '#0F172A')
    : (darkMode ? themeColors.cardBorder : '#E8EEDB');

  const textPrimary = highContrast
    ? (isDark ? '#F8FAFC' : '#0F172A')
    : (darkMode ? themeColors.text : '#17241A');

  const textMuted = highContrast
    ? (isDark ? '#CBD5E1' : '#334155')
    : (darkMode ? themeColors.textMuted : '#5B6B57');

  const activeBg = highContrast
    ? (isDark ? 'rgba(248,250,252,0.14)' : 'rgba(15,23,42,0.08)')
    : (darkMode
      ? 'linear-gradient(135deg, rgba(255,122,0,0.22), rgba(34,211,27,0.18))'
      : 'linear-gradient(135deg, #E8F9D2 0%, #FFE3BD 100%)');

  const activeText = highContrast ? (isDark ? '#F8FAFC' : '#0F172A') : (darkMode ? themeColors.text : '#304b2a');
  const activeBorder = highContrast
    ? (isDark ? '#F8FAFC' : '#0F172A')
    : (darkMode ? 'rgba(255,154,51,0.4)' : '#BCE9A4');

  const buttonStyle = highContrast
    ? { background: isDark ? '#F8FAFC' : '#0F172A', color: isDark ? '#0F172A' : '#F8FAFC' }
    : { background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A33 100%)', color: '#fff' };

  const toggleBotaoBg = darkMode
    ? 'rgba(243,239,226,0.10)'
    : 'linear-gradient(135deg, #EAF7DE 0%, #FFF0D8 100%)';

  const toggleBotaoBorder = darkMode
    ? 'rgba(243,239,226,0.24)'
    : '#B4D3A2';

  const logoRingColor = darkMode ? 'rgba(243,239,226,0.2)' : '#E6F1DD';

  return (
    <>
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="hidden lg:flex fixed left-0 top-0 h-screen flex-col z-40 border-r shadow-xl overflow-hidden"
        style={{
          width: collapsed ? 88 : 250,
          transition: 'width 260ms ease',
          background: panelBg,
          borderColor,
          color: textPrimary,
        }}
      >
        <div className="flex items-center h-20 px-4 flex-shrink-0 border-b relative" style={{ borderColor }}>
          <div className="relative flex items-center justify-center w-full">
            {collapsed ? (
              <div className="flex items-center justify-center">
                <img src="/img/logo.png" alt="" className="w-10 h-10 rounded-full object-cover ring-2" style={{ ringColor: logoRingColor }} />
              </div>
            ) : (
              <span className="flex items-center whitespace-nowrap">
                <img src="/img/logo.png" alt="" className="w-10 h-10 rounded-full object-cover ring-2" style={{ ringColor: logoRingColor }} />
                <span className="ml-3 font-black text-2xl whitespace-nowrap" style={{ color: textPrimary }}>
                  <span style={{ color: '#FF7A00' }}>Movi</span><span style={{ color: '#22D31B' }}>Pay</span>
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Removed manual toggle button: sidebar is collapsed by default and expands on hover. */}

        <nav className="flex-1 px-3 py-2 space-y-1">
          {links.map(l => {
            const active = pathname === l.href ||
              (l.href !== '/cliente' && l.href !== '/trabalhador' && pathname.startsWith(l.href));
            return (
              <Link key={l.href} href={l.href}
                className={`flex items-center ${collapsed ? 'justify-center' : ''} h-12 px-3 rounded-2xl transition-all group relative`}
                title={collapsed ? l.label : undefined}
                style={{
                  background: active ? activeBg : 'transparent',
                  color: active ? activeText : textMuted,
                  border: active ? `1px solid ${activeBorder}` : '1px solid transparent',
                  boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
                }}
              >
                <span className="flex-shrink-0 flex items-center justify-center">
                  <l.icon size={20} strokeWidth={2.2} />
                </span>
                {!collapsed && (
                  <span className="ml-3 text-sm whitespace-nowrap overflow-hidden font-medium" style={{ color: active ? activeText : textMuted }}>
                    {l.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 space-y-2 flex-shrink-0 border-t pt-3" style={{ borderColor }}>
          <button onClick={sair}
            className="flex items-center justify-center h-11 w-full px-3 rounded-2xl transition-all font-bold text-sm shadow-md hover:shadow-lg"
            style={buttonStyle}
            aria-label="Sair"
          >
            {!collapsed && <span className="mr-2">Sair</span>}
            {collapsed && <LogOut size={18} strokeWidth={2.2} />}
          </button>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t flex items-center justify-around px-1 h-16" style={{
        background: panelBg,
        borderColor,
      }}>
        {mobileLinks.map(l => {
          const active = pathname === l.href ||
            (l.href !== '/cliente' && l.href !== '/trabalhador' && pathname.startsWith(l.href));
          const Icon = l.icon;
          return (
            <Link key={l.href} href={l.href}
              className="flex flex-col items-center gap-0.5 flex-1 py-1 rounded-xl transition-all"
              style={{ color: active ? (highContrast ? activeText : '#FF7A00') : textMuted }}
            >
              <span className={`${active ? 'scale-110' : ''} transition-transform flex items-center justify-center`}>
                <Icon size={20} strokeWidth={2.2} />
              </span>
              <span className="text-[10px] font-medium leading-none">{l.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
