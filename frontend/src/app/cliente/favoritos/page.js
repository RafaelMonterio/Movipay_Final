'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import api from '@/servicos/clienteApi';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import { useToast } from '@/componentes/interface/Notificacao';

export default function FavoritosPage() {
  const { darkMode } = usarTema();
  const cores = obterCoresTema(darkMode);
  const toast = useToast();
  const [favoritos, setFavoritos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    try {
      const { data } = await api.get('/favoritos');
      setFavoritos(data.favoritos || []);
    } catch (erro) {
      toast(erro?.response?.data?.error?.mensagem || 'Não foi possível carregar seus favoritos.', 'error');
    } finally { setCarregando(false); }
  }
  useEffect(() => { carregar(); }, []);

  async function remover(id) {
    try { await api.delete(`/favoritos/${id}`); setFavoritos(lista => lista.filter(item => String(item.trabalhador_id) !== String(id))); toast('Profissional removido dos favoritos.', 'success'); }
    catch { toast('Não foi possível remover o favorito.', 'error'); }
  }

  return <LayoutPainel>
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: '34px 24px 80px', color: cores.text }}>
      <div style={{ marginBottom: 26 }}><p style={{ color: '#FF7A00', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', fontSize: 12 }}>Minha seleção</p><h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(2rem,4vw,3.4rem)', margin: '5px 0 8px' }}>Profissionais favoritos</h1><p style={{ color: cores.textMuted, maxWidth: 650 }}>Guarde os trabalhadores de confiança para encontrar e contratar novamente com poucos cliques.</p></div>
      {carregando ? <p style={{ color: cores.textMuted }}>Carregando favoritos...</p> : favoritos.length === 0 ? <section style={{ padding: 36, borderRadius: 24, background: cores.cardBg, border: `1px solid ${cores.cardBorder}`, textAlign: 'center' }}><h2 style={{ margin: 0 }}>Sua lista ainda está vazia</h2><p style={{ color: cores.textMuted }}>Explore profissionais da sua região e toque no coração para salvar.</p><Link href="/cliente/profissionais" style={{ display: 'inline-block', background: '#FF7A00', color: '#fff', padding: '12px 18px', borderRadius: 12, fontWeight: 800, textDecoration: 'none' }}>Encontrar profissionais</Link></section> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 16 }}>{favoritos.map(item => <article key={item.trabalhador_id} style={{ background: cores.cardBg, border: `1px solid ${cores.cardBorder}`, borderRadius: 22, padding: 20, boxShadow: '0 12px 30px rgba(35,70,20,.06)' }}><div style={{ display: 'flex', gap: 14, alignItems: 'center' }}><img src={item.url_avatar || '/img/logo.png'} alt="" style={{ width: 62, height: 62, borderRadius: '50%', objectFit: 'cover', background: '#EAF7DE' }} /><div><h2 style={{ fontSize: 18, margin: 0 }}>{item.nome}</h2><p style={{ color: cores.textMuted, margin: '4px 0 0' }}>{item.nome_categoria || item.categoria || 'Profissional'}</p></div></div><p style={{ color: cores.textMuted, margin: '18px 0' }}>★ {Number(item.media_avaliacao || 0).toFixed(1)} · {item.esta_disponivel ? 'Disponível agora' : 'Indisponível'}</p><div style={{ display: 'flex', gap: 8 }}><Link href={`/cliente/profissionais/${item.trabalhador_id}`} style={{ flex: 1, textAlign: 'center', padding: 11, borderRadius: 11, background: '#FF7A00', color: '#fff', textDecoration: 'none', fontWeight: 800 }}>Ver perfil</Link><button onClick={() => remover(item.trabalhador_id)} style={{ padding: '0 14px', borderRadius: 11, border: `1px solid ${cores.cardBorder}`, background: 'transparent', color: cores.text, cursor: 'pointer' }}>Remover</button></div></article>)}</div>}
    </main>
  </LayoutPainel>;
}
