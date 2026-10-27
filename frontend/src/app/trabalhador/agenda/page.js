'use client';

import LayoutPainel from '@/componentes/layout/LayoutPainel';
import CalendarioCompacto from '@/componentes/trabalhador/CalendarioCompacto';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';

export default function WorkerCalendarPage() {
  const { darkMode } = usarTema();
  const tema = obterCoresTema(darkMode);
  return <LayoutPainel><main style={{ maxWidth: 1120, margin: '0 auto', padding: '34px 24px 80px', color: tema.text }}><p style={{ color: '#FF7A00', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', fontSize: 12 }}>Organização do trabalho</p><h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(2rem,4vw,3.4rem)', margin: '5px 0 8px' }}>Minha agenda</h1><p style={{ color: tema.textMuted, maxWidth: 650, marginBottom: 26 }}>Veja os pedidos agendados da sua conta e organize cada atendimento por dia.</p><CalendarioCompacto theme={tema} /></main></LayoutPainel>;
}
