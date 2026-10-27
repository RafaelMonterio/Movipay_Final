'use client';

import { useEffect, useState } from 'react';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import api from '@/servicos/clienteApi';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import { useToast } from '@/componentes/interface/Notificacao';

export default function PlanosPage() {
  const { darkMode } = usarTema();
  const cores = obterCoresTema(darkMode);
  const toast = useToast();
  const [planos, setPlanos] = useState([]);
  const [atual, setAtual] = useState(null);
  const [carregando, setCarregando] = useState(true);
  useEffect(() => { Promise.all([api.get('/planos'), api.get('/planos/me')]).then(([lista, minha]) => { setPlanos(lista.data?.planos || []); setAtual(minha.data || null); }).catch(() => toast('Não foi possível carregar os planos.', 'error')).finally(() => setCarregando(false)); }, []);
  async function assinar(slug) { try { const { data } = await api.post(`/planos/${slug}/assinar`, { method: 'pix' }); toast(data?.mensagem || 'Solicitação de plano criada. Confira o pagamento.', 'success'); } catch (erro) { toast(erro?.response?.data?.error?.mensagem || 'Não foi possível solicitar este plano.', 'error'); } }
  return <LayoutPainel><main style={{ maxWidth: 1120, margin: '0 auto', padding: '34px 24px 80px', color: cores.text }}><p style={{ color: '#FF7A00', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', fontSize: 12 }}>Cresça com seu trabalho</p><h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(2rem,4vw,3.4rem)', margin: '5px 0 8px' }}>Planos Formiga VIP</h1><p style={{ color: cores.textMuted, maxWidth: 680 }}>Mais visibilidade, ferramentas e estatísticas para profissionais que querem crescer na região.</p>{atual?.planSlug && <div style={{ margin: '22px 0', padding: 16, borderRadius: 16, background: '#EAF7DE', color: '#315C28', fontWeight: 800 }}>Seu plano atual: {atual.assinatura?.nome || atual.planSlug}</div>}{carregando ? <p>Carregando planos...</p> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 18 }}>{planos.map(plano => <article key={plano.slug} style={{ background: cores.cardBg, border: `1px solid ${plano.slug === 'rainha' ? '#FFB15C' : cores.cardBorder}`, borderRadius: 24, padding: 24, boxShadow: '0 12px 30px rgba(35,70,20,.06)' }}><span style={{ color: '#FF7A00', fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>{plano.badge_label || plano.nome}</span><h2 style={{ margin: '8px 0 4px', fontFamily: 'var(--display)', fontSize: 28 }}>{plano.nome}</h2><p style={{ color: cores.textMuted, minHeight: 46 }}>{plano.tagline}</p><p style={{ fontSize: 28, fontWeight: 900, margin: '18px 0' }}>{Number(plano.price || 0) === 0 ? 'Grátis' : `R$ ${Number(plano.price).toFixed(2).replace('.', ',')}`}<small style={{ fontSize: 13, color: cores.textMuted }}> / mês</small></p><ul style={{ paddingLeft: 18, color: cores.textMuted, lineHeight: 1.8 }}>{(plano.features || []).slice(0, 6).map((feature, index) => <li key={index}>{feature}</li>)}</ul><button onClick={() => assinar(plano.slug)} style={{ width: '100%', marginTop: 16, padding: 13, border: 0, borderRadius: 12, background: plano.slug === 'formiga' ? '#EAF7DE' : '#FF7A00', color: plano.slug === 'formiga' ? '#315C28' : '#fff', fontWeight: 900, cursor: 'pointer' }}>{plano.slug === atual?.planSlug ? 'Plano atual' : plano.price === 0 ? 'Usar plano gratuito' : 'Assinar com Pix'}</button></article>)}</div>}</main></LayoutPainel>;
}
