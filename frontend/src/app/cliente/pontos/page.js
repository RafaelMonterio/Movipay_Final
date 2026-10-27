'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import { formatarData } from '@/utilitarios/formatadores';
import api from '@/servicos/clienteApi';
import SharedIcon, { FolhaCoin } from '@/componentes/interface/Icone';

const LEVEL_THRESHOLDS = [0, 300, 1000];
const LEVEL_NAMES      = ['Formiga VIP · Operária', 'Formiga VIP · Voadora', 'Formiga VIP · Rainha'];
const LEVEL_ICONS      = ['sprout', 'sparkle', 'crown'];
const LEVEL_COLORS     = ['#22C55E', '#22D3EE', '#F59E0B'];

function getLevel(pts) {
  let lvl = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (pts >= LEVEL_THRESHOLDS[i]) lvl = i;
  }
  return lvl;
}

export default function ClientPointsPage() {
  const [balance, setBalance]     = useState(0);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/pontos/saldo').then(r => setBalance(r.data.balance)),
      api.get('/pontos/historico').then(r => setHistory(r.data.transactions)),
    ]).finally(() => setLoading(false));
  }, []);

  const level     = getLevel(balance);
  const nextLevel = LEVEL_THRESHOLDS[level + 1];
  const progress  = nextLevel
    ? Math.round(((balance - LEVEL_THRESHOLDS[level]) / (nextLevel - LEVEL_THRESHOLDS[level])) * 100)
    : 100;

  return (
    <LayoutPainel>
      <div className="p-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-slate-800"><span className="inline-flex items-center gap-2"><FolhaCoin size={32} /> Minhas Folhas</span></h1>
          <p className="text-slate-500 mt-1">Acumule Folhas e suba de nível</p>
        </motion.div>

        {/* Balance card */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 text-white shadow-xl"
        >
          <p className="text-amber-100 font-medium mb-1">Saldo atual</p>
          <p className="text-6xl font-black mb-2">{balance}</p>
          <p className="text-amber-100 text-lg">Folhas</p>

          <div className="mt-6 flex items-center gap-3">
            <SharedIcon name={LEVEL_ICONS[level]} size={34} color="#fff" />
            <div className="flex-1">
              <div className="flex justify-between text-sm font-semibold text-amber-100 mb-1">
                <span>{LEVEL_NAMES[level]}</span>
                {nextLevel && <span>{nextLevel - balance} pts para {LEVEL_NAMES[level + 1]}</span>}
              </div>
              <div className="w-full bg-white/30 rounded-full h-2">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ delay: 0.5, duration: 1 }}
                  className="bg-white rounded-full h-2"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Levels grid */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Níveis</h2>
          <div className="grid grid-cols-3 md:grid-cols-3 gap-3">
            {LEVEL_NAMES.map((name, i) => (
              <motion.div key={name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className={`card p-4 text-center ${level >= i ? 'border-amber-300 bg-amber-50' : 'opacity-40'}`}
              >
                <div className="flex justify-center mb-1"><SharedIcon name={LEVEL_ICONS[i]} size={26} color={LEVEL_COLORS[i]} /></div>
                <p className="text-xs font-semibold text-slate-700">{name}</p>
                <p className="text-xs text-slate-400">{LEVEL_THRESHOLDS[i]} pts</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* History */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Histórico</h2>
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="card h-16 animate-pulse bg-slate-100" />)}</div>
          ) : history.length === 0 ? (
            <div className="card p-10 text-center"><p className="text-slate-400">Nenhuma transação ainda.</p></div>
          ) : (
            <div className="space-y-2">
              {history.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="card p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{t.description}</p>
                    <p className="text-xs text-slate-400">{formatarData(t.created_at)}</p>
                  </div>
                  <span className={`text-lg font-black ${(t.points ?? t.amount ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(t.points ?? t.amount ?? 0) >= 0 ? '+' : ''}{t.points ?? t.amount ?? 0} Folhas
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LayoutPainel>
  );
}
