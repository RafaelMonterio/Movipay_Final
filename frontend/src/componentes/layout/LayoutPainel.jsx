'use client';
import { useEffect } from 'react';
import { usarAutenticacao } from '@/contexto/contextoAutenticacao';
import { useRouter } from 'next/navigation';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import BarraLateral from './BarraLateral';
import BoasVindasModal from '@/componentes/feedback/BoasVindas';
import LimiteErros from '@/componentes/interface/LimiteErros';
import SinoNotificacoes from '@/componentes/feedback/SinoNotificacoes';
import ControlesAcessibilidade from '@/componentes/acessibilidade/ControlesAcessibilidade';
import FolhasCaindo from '@/componentes/efeitos/FolhasCaindo';
import Icon from '@/componentes/interface/Icone';

export default function LayoutPainel({ children }) {
  const { user, loading } = usarAutenticacao();
  const router = useRouter();
  const { darkMode } = usarTema();
  const themeColors = obterCoresTema(darkMode);

  useEffect(() => {
    if (!loading && !user) router.push('/entrar');
  }, [user, loading, router]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: themeColors.bg, transition: 'background 0.4s' }}>
      <div style={{ textAlign: 'center', spaceY: '12px' }}>
        <div style={{ animation: 'bounce 1s infinite', display: 'flex', justifyContent: 'center' }}><Icon name="ant" size={64} color="#FF7A00" /></div>
        <p style={{ fontSize: '0.875rem', color: themeColors.textMuted }}>Carregando...</p>
      </div>
    </div>
  );

  if (!user) return null;

  const bg = themeColors.bg;
  const headerBg = themeColors.headerBg;
  const headerBorder = themeColors.headerBorder;

  return (
    <div style={{ position: 'relative', zIndex: 0, minHeight: '100vh', background: bg, transition: 'background 0.4s', color: themeColors.text }}>
      <FolhasCaindo />
      <BarraLateral />

      <style>{`
        @media (min-width: 1024px) {
          .dashboard-shell { width: calc(100% - 88px) !important; margin-left: 88px; }
          .dashboard-content { max-width: none !important; }
          .dashboard-content > div { max-width: none !important; margin-left: 0 !important; margin-right: 0 !important; }
        }
      `}</style>
      <div className="dashboard-shell" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
        <header style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: headerBg,
          borderBottom: `1px solid ${headerBorder}`,
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          gap: 8, padding: '0 16px 0 24px', height: 56, flexShrink: 0,
          transition: 'background 0.4s, border-color 0.4s',
        }}>
          <SinoNotificacoes />
        </header>

        <main style={{ flex: 1, overflow: 'auto', paddingBottom: 0 }}>
          <div className="dashboard-content" style={{ width: '100%', maxWidth: 'none', margin: '0 auto' }}>
            <LimiteErros>
              {children}
            </LimiteErros>
          </div>
        </main>
      </div>

      <BoasVindasModal />
      <ControlesAcessibilidade />
    </div>
  );
}
