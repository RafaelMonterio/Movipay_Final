'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import { formatarData } from '@/utilitarios/formatadores';
import api from '@/servicos/clienteApi';
import SharedIcon, { FolhaCoin } from '@/componentes/interface/Icone';

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

  return (
    <LayoutPainel>
      <div className="p-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-slate-800"><span className="inline-flex items-center gap-2"><FolhaCoin size={32} /> Minhas Folhas</span></h1>
          <p className="text-slate-500 mt-1">Acumule Folhas e use como desconto nos serviços</p>
        </motion.div>

        {/* Balance card */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 text-white shadow-xl"
        >
          <p className="text-amber-100 font-medium mb-1">Saldo atual</p>
          <p className="text-6xl font-black mb-2">{balance}</p>
          <p className="text-amber-100 text-lg">Folhas disponíveis para desconto</p>
        </motion.div>

        {/* Uso das Folhas */}
        <div className="card p-5 flex items-center gap-4">
          <FolhaCoin size={44} />
          <p className="text-sm text-slate-600">Você pode aplicar estas Folhas diretamente no pagamento de um serviço para obter desconto.</p>
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
