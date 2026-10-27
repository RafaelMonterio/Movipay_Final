'use client';

import { useEffect, useState } from 'react';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import api from '@/servicos/clienteApi';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import { useToast } from '@/componentes/interface/Notificacao';

const moeda = valor => `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`;
export default function CarteiraPage() {
  const { darkMode } = usarTema();
  const cores = obterCoresTema(darkMode);
  const toast = useToast();
  const [carteira, setCarteira] = useState(null);
  useEffect(() => { api.get('/pagamentos/carteira').then(r => setCarteira(r.data)).catch(() => toast('Não foi possível carregar sua carteira.', 'error')); }, []);
  const totais = carteira?.totals || {};
  return <LayoutPainel><main style={{ maxWidth: 1120, margin: '0 auto', padding: '34px 24px 80px', color: cores.text }}><p style={{ color: '#22A71B', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', fontSize: 12 }}>Finanças do profissional</p><h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(2rem,4vw,3.4rem)', margin: '5px 0 8px' }}>Minha carteira</h1><p style={{ color: cores.textMuted, maxWidth: 650 }}>Acompanhe o que está disponível, o que está em custódia e o impacto da comissão da plataforma.</p><section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, margin: '28px 0' }}>{[['Disponível',carteira?.balance,'#EAF7DE'],['Em custódia',carteira?.pendingHeld,'#FFF0D8'],['Bruto recebido',totais.gross,'#EAF7DE'],['Líquido estimado',totais.net,'#DDF2FF']].map(([label,valor,bg]) => <div key={label} style={{ background: bg, borderRadius: 20, padding: 20 }}><p style={{ margin: 0, color: '#53624F', fontSize: 13 }}>{label}</p><strong style={{ display: 'block', marginTop: 8, fontSize: 25 }}>{moeda(valor)}</strong></div>)}</section><section style={{ background: cores.cardBg, border: `1px solid ${cores.cardBorder}`, borderRadius: 22, padding: 22 }}><h2 style={{ marginTop: 0 }}>Extrato de serviços</h2>{!(carteira?.earnings || []).length ? <p style={{ color: cores.textMuted }}>Ainda não há recebimentos para mostrar.</p> : <div style={{ display: 'grid', gap: 10 }}>{carteira.earnings.map(item => <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '13px 0', borderBottom: `1px solid ${cores.cardBorder}` }}><div><strong>{item.titulo_servico || 'Serviço'}</strong><p style={{ margin: '4px 0 0', color: cores.textMuted, fontSize: 13 }}>{item.nome_cliente || 'Cliente'} · {item.estado}</p></div><div style={{ textAlign: 'right' }}><strong>{moeda(item.valor_liquido)}</strong><p style={{ margin: '4px 0 0', color: cores.textMuted, fontSize: 12 }}>bruto {moeda(item.valor_bruto)}</p></div></div>)}</div>}</section></main></LayoutPainel>;
}
