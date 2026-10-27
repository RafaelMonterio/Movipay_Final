'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import Modal from '@/componentes/interface/JanelaModal';
import { useToast } from '@/componentes/interface/Notificacao';
import { usarAutenticacao } from '@/contexto/contextoAutenticacao';
import api from '@/servicos/clienteApi';
import SharedIcon from '@/componentes/interface/Icone';

const STATUS_STEPS = ['pending', 'accepted', 'in_progress', 'completed'];
const STATUS_LABEL = {
  pending:     { label: 'Aguardando',   icon: 'clock', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  accepted:    { label: 'Aceito',       icon: 'checkCircle', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  in_progress: { label: 'Em andamento', icon: 'wrench', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  completed:   { label: 'Concluído',    icon: 'flag', color: 'text-green-600 bg-green-50 border-green-200' },
  cancelled:   { label: 'Cancelado',    icon: 'xCircle', color: 'text-red-600 bg-red-50 border-red-200' },
};

export default function OrderDetailPage() {
  const { id }    = useParams();
  const router    = useRouter();
  const { user }  = usarAutenticacao();
  const toast     = useToast();

  const [order, setOrder]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [updating, setUpdating]   = useState(false);

  useEffect(() => {
    api.get(`/pedidos/${id}`)
      .then(r => setOrder(r.data))
      .catch(() => toast('Pedido não encontrado', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(newStatus, reason) {
    try {
      setUpdating(true);
      const { data } = await api.patch(`/pedidos/${id}/estado`, {
        status: newStatus,
        cancel_reason: reason,
      });
      setOrder(data);
      toast(`Status atualizado para "${STATUS_LABEL[newStatus].label}"`, 'success');
      setCancelModal(false);
    } catch (err) {
      toast(err?.response?.data?.error || 'Erro ao atualizar status', 'error');
    } finally {
      setUpdating(false);
    }
  }

  const isWorker = user?.mode === 'worker';
  const st = order ? STATUS_LABEL[order.status] : null;
  const stepIndex = STATUS_STEPS.indexOf(order?.status);

  if (loading) return (
    <LayoutPainel>
      <div className="p-8 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    </LayoutPainel>
  );

  if (!order) return (
    <LayoutPainel>
      <div className="p-8 text-center">
        <div className="flex justify-center mb-3"><SharedIcon name="inbox" size={48} color="#94A3B8" /></div>
        <p className="text-slate-500">Pedido não encontrado.</p>
        <button onClick={() => router.back()} className="text-client text-sm font-semibold hover:underline mt-4 inline-block">
          ← Voltar
        </button>
      </div>
    </LayoutPainel>
  );

  return (
    <LayoutPainel>
      <div className="p-8 max-w-2xl space-y-6">
        {/* Back */}
        <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
          ← Voltar
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-800">Pedido #{order.id}</h1>
              <p className="text-slate-500 text-sm mt-1">
                {new Date(order.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
            {st && (
              <span className={`text-sm font-semibold px-4 py-2 rounded-full border ${st.color}`}>
                <SharedIcon name={st.icon} size={14} /> {st.label}
              </span>
            )}
          </div>
        </motion.div>

        {/* Progress bar */}
        {order.status !== 'cancelled' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="card p-5 rounded-2xl border border-slate-100"
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Progresso</p>
            <div className="flex items-center gap-2">
              {STATUS_STEPS.map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    i <= stepIndex
                      ? 'bg-client border-client text-white'
                      : 'border-slate-200 text-slate-300'
                  }`}>
                    {i < stepIndex ? <SharedIcon name="check" size={14} color="#fff" strokeWidth={3} /> : i + 1}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-1 rounded mx-1 transition-all ${i < stepIndex ? 'bg-client' : 'bg-slate-100'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {STATUS_STEPS.map(s => (
                <p key={s} className="text-xs text-slate-400 flex-1 text-center">
                  {STATUS_LABEL[s].label}
                </p>
              ))}
            </div>
          </motion.div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="card p-5 rounded-2xl border border-slate-100"
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Serviço</p>
            <p className="font-bold text-slate-800">{order.service_title || '—'}</p>
            <p className="text-2xl font-black text-client mt-2">
              R$ {parseFloat(order.price).toFixed(2)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            onClick={() => !isWorker && router.push(`/cliente/profissionais/${order.worker_id}`)}
            className={`card p-5 rounded-2xl border border-slate-100 ${!isWorker ? 'cursor-pointer hover:border-client/40 transition-colors' : ''}`}
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              {isWorker ? 'Cliente' : 'Trabalhador'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-client to-violet-400 flex items-center justify-center text-white text-sm font-black">
                {(isWorker ? order.client_name : order.worker_name)?.charAt(0)}
              </div>
              <p className="font-bold text-slate-800">
                {isWorker ? order.client_name : order.worker_name}
              </p>
            </div>
            {!isWorker && <p className="text-xs text-client font-semibold mt-2">Ver perfil →</p>}
          </motion.div>
        </div>

        {/* Cancel reason */}
        {order.status === 'cancelled' && order.cancel_reason && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-red-700 mb-1">Motivo do cancelamento</p>
            <p className="text-sm text-red-600">{order.cancel_reason}</p>
          </div>
        )}

        {/* Actions */}
        {isWorker && order.status !== 'completed' && order.status !== 'cancelled' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="card p-5 rounded-2xl border border-slate-100 space-y-3"
          >
            <p className="text-sm font-semibold text-slate-600">Ações disponíveis</p>
            <div className="flex gap-3">
              {order.status === 'pending' && (
                <button
                  onClick={() => updateStatus('accepted')}
                  disabled={updating}
                  className="flex-1 bg-client text-white font-bold py-3 rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-60"
                >
                  <SharedIcon name="checkCircle" size={15} /> Aceitar pedido
                </button>
              )}
              {order.status === 'accepted' && (
                <button
                  onClick={() => updateStatus('in_progress')}
                  disabled={updating}
                  className="flex-1 bg-indigo-500 text-white font-bold py-3 rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-60"
                >
                  <SharedIcon name="wrench" size={15} /> Iniciar serviço
                </button>
              )}
              {order.status === 'in_progress' && (
                <button
                  onClick={() => updateStatus('completed')}
                  disabled={updating}
                  className="flex-1 bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition-all disabled:opacity-60"
                >
                  <SharedIcon name="flag" size={15} /> Marcar como concluído
                </button>
              )}
              <button
                onClick={() => setCancelModal(true)}
                disabled={updating}
                className="px-5 bg-red-50 text-red-500 font-bold py-3 rounded-xl hover:bg-red-100 transition-all border border-red-200 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Cancel modal */}
      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title="Cancelar pedido" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Informe o motivo do cancelamento:</p>
          <textarea
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            rows={3}
            placeholder="Ex: Cliente não atendeu, problema de agenda..."
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          />
          <div className="flex gap-3">
            <button onClick={() => setCancelModal(false)}
              className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-all">
              Voltar
            </button>
            <button
              onClick={() => updateStatus('cancelled', cancelReason)}
              disabled={updating}
              className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl hover:bg-red-600 transition-all disabled:opacity-60"
            >
              {updating ? '...' : 'Confirmar cancelamento'}
            </button>
          </div>
        </div>
      </Modal>
    </LayoutPainel>
  );
}
