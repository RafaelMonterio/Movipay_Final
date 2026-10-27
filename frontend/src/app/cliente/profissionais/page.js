'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import { GridEsqueleto } from '@/componentes/interface/Esqueleto';
import { useToast } from '@/componentes/interface/Notificacao';
import { formatarMoeda } from '@/utilitarios/formatadores';
import api from '@/servicos/clienteApi';
import SharedIcon, { StarRating } from '@/componentes/interface/Icone';
import { haversineKm } from '@/utilitarios/geolocalizacao';
import { CENTRO_CIDADE_PADRAO } from '@/componentes/mapa/MapaProfissionais';

function WorkersPageContent() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [workers,  setWorkers]  = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState('');
  const [onlyAvail, setOnlyAvail] = useState(false);

  useEffect(() => {
    api.get('/profissionais')
      .then(r => { setWorkers(r.data.workers || []); setFiltered(r.data.workers || []); })
      .catch(() => toast('Erro ao carregar trabalhadores', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const workerId = searchParams.get('workerId');
    if (!workerId || loading || workers.length === 0) return;
    const match = workers.find(w => String(w.id) === workerId);
    if (match) {
      router.push(`/cliente/profissionais/${match.id}`);
    }
  }, [searchParams, loading, workers, router]);

  useEffect(() => {
    let list = workers;
    if (query)      list = list.filter(w => w.name.toLowerCase().includes(query.toLowerCase()) || w.services?.some(s => s.title.toLowerCase().includes(query.toLowerCase())));
    if (onlyAvail)  list = list.filter(w => w.is_available);
    setFiltered(list);
  }, [query, onlyAvail, workers]);

  function openProfile(worker) {
    router.push(`/cliente/profissionais/${worker.id}`);
  }

  function renderStars(r) {
    const n = Math.round(parseFloat(r) || 0);
    return <StarRating rating={n} size={12} />;
  }

  return (
    <LayoutPainel>
      <div className="p-4 md:p-8 space-y-6">
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800">Trabalhadores</h1>
          <p className="text-slate-500 mt-1 text-sm">{filtered.length} profissional{filtered.length !== 1 ? 'is' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
        </motion.div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Buscar por nome ou serviço..."
            value={query} onChange={e => setQuery(e.target.value)}
            className="flex-1 min-w-48 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-client/20 focus:border-client"
          />
          <button onClick={() => setOnlyAvail(!onlyAvail)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              onlyAvail ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            Disponíveis agora
          </button>
        </div>

        {loading ? <GridEsqueleto count={6} /> : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
            <div className="flex justify-center mb-3"><SharedIcon name="worker" size={40} color="#94A3B8" /></div>
            <p className="text-slate-500">Nenhum trabalhador encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((w, i) => (
              <motion.div key={w.id}
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:Math.min(i*0.04, 0.3) }}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all cursor-pointer"
                onClick={() => openProfile(w)}
              >
                {/* Header com avatar */}
                <div className="p-5 flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    {w.avatar_url
                      ? <img src={w.avatar_url} alt={w.name} className="w-12 h-12 rounded-full object-cover" />
                      : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-worker to-amber-400 flex items-center justify-center text-white font-black text-lg">{w.name.charAt(0)}</div>
                    }
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${w.is_available ? 'bg-green-400' : 'bg-slate-300'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-slate-800 truncate">{w.name}</p>
                      {w.is_verified && <span className="text-client" title="Verificado"><SharedIcon name="checkCircle" size={13} /></span>}
                    </div>
                    {w.avg_rating > 0 ? (
                      <p className="text-amber-400 text-xs">
                        {renderStars(w.avg_rating)} <span className="text-slate-400">{parseFloat(w.avg_rating).toFixed(1)} ({w.total_orders || 0})</span>
                      </p>
                    ) : <p className="text-xs text-slate-400">Novo profissional</p>}
                    {w.neighborhood && <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><SharedIcon name="mapPin" size={11} /> {w.neighborhood}</p>}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    w.is_available ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {w.is_available ? 'Disponível' : 'Ocupado'}
                  </span>
                </div>

                {w.bio && <p className="px-5 text-xs text-slate-500 line-clamp-2 -mt-2 mb-3">{w.bio}</p>}

                {/* Serviços */}
                {w.services?.length > 0 && (
                  <div className="px-5 pb-4 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Serviços</p>
                    {w.services.slice(0, 2).map(s => (
                      <div key={s.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 truncate max-w-[140px]">{s.category_icon} {s.title}</span>
                        <span className="font-bold text-client flex-shrink-0">{formatarMoeda(s.price)}</span>
                      </div>
                    ))}
                    {w.services.length > 2 && (
                      <p className="text-xs text-slate-400">+{w.services.length - 2} serviços</p>
                    )}
                  </div>
                )}

                <div className="px-5 pb-4">
                  <div className="text-xs text-slate-400 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1"><SharedIcon name="clipboard" size={12} /> {w.total_orders || 0} pedidos</span>
                    {Number.isFinite(w.lat) && <span className="inline-flex items-center gap-1"><SharedIcon name="mapPin" size={12} /> {haversineKm(CENTRO_CIDADE_PADRAO[0], CENTRO_CIDADE_PADRAO[1], w.lat, w.lng)} km</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </LayoutPainel>
  );
}

export default function WorkersPage() {
  return (
    <Suspense fallback={<LayoutPainel><div className="p-4 md:p-8"><GridEsqueleto count={6} /></div></LayoutPainel>}>
      <WorkersPageContent />
    </Suspense>
  );
}
