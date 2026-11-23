'use client';

import { useEffect, useState } from 'react';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import api from '@/servicos/clienteApi';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';

export default function ShortsPage() {
  const { darkMode } = usarTema();
  const cores = obterCoresTema(darkMode);
  const [publicacoes, setPublicacoes] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    api.get('/publicacoes', { params: filtro === 'todos' ? {} : { tipo: filtro } })
      .then(r => setPublicacoes(r.data?.publicacoes || []))
      .finally(() => setCarregando(false));
  }, [filtro]);

  return (
    <LayoutPainel>
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '34px 24px 80px', color: cores.text }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'end', flexWrap: 'wrap', marginBottom: 26 }}>
          <div>
            <p style={{ color: '#22A71B', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', fontSize: 12 }}>Portfólios dos profissionais</p>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(2rem,4vw,3.4rem)', margin: '5px 0 8px' }}>Shorts e trabalhos</h1>
            <p style={{ color: cores.textMuted, maxWidth: 650 }}>Fotos e vídeos enviados pelos trabalhadores em seus portfólios.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['todos','Tudo'],['video','Vídeos'],['image','Fotos']].map(([value,label]) => (
              <button key={value} onClick={() => setFiltro(value)} style={{ border: `1px solid ${filtro === value ? '#FF7A00' : cores.cardBorder}`, background: filtro === value ? '#FFF0E3' : cores.cardBg, color: filtro === value ? '#C65A00' : cores.text, padding: '10px 14px', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>{label}</button>
            ))}
          </div>
        </div>

        {carregando ? (
          <p style={{ color: cores.textMuted }}>Carregando portfólios...</p>
        ) : publicacoes.length === 0 ? (
          <section style={{ padding: 36, borderRadius: 24, background: cores.cardBg, border: `1px solid ${cores.cardBorder}`, textAlign: 'center' }}>Nenhum trabalhador adicionou fotos ou vídeos ao portfólio.</section>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 18 }}>
            {publicacoes.map(item => {
              const midia = item.url_miniatura || item.media_urls?.[0];
              const isVideo = item.tipo === 'video';
              return (
                <article key={item.id} style={{ background: cores.cardBg, border: `1px solid ${cores.cardBorder}`, borderRadius: 22, overflow: 'hidden', boxShadow: '0 12px 30px rgba(35,70,20,.06)' }}>
                  {isVideo && midia ? (
                    <video src={midia} controls style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block', background: '#111827' }} />
                  ) : midia ? (
                    <img src={midia} alt={item.caption || 'Portfólio do trabalhador'} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ aspectRatio: '1/1', background: 'linear-gradient(135deg,#EAF7DE,#FFE4C8)', display: 'grid', placeItems: 'center', fontSize: 54 }}>▶</div>
                  )}
                  <div style={{ padding: 16 }}>
                    <p style={{ margin: 0, fontWeight: 800 }}>{item.nome_trabalhador || 'Profissional MoviPay'}</p>
                    <p style={{ color: cores.textMuted, minHeight: 42, margin: '8px 0 0' }}>{item.caption || 'Confira este trabalho.'}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </LayoutPainel>
  );
}
