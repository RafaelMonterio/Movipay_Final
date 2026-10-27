'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import { ListEsqueleto } from '@/componentes/interface/Esqueleto';
import { useToast } from '@/componentes/interface/Notificacao';
import { formatarData, formatarMoeda } from '@/utilitarios/formatadores';
import api from '@/servicos/clienteApi';
import Modal from '@/componentes/interface/JanelaModal';
import SharedIcon from '@/componentes/interface/Icone';

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(star => (
        <button key={star}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="text-3xl transition-transform hover:scale-110"
        >
          <SharedIcon name="star" size={32} color={(hover || value) >= star ? '#FBBF24' : '#E2E8F0'} />
        </button>
      ))}
    </div>
  );
}

export default function ClientReviewsPage() {
  const toast = useToast();
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rating, setRating]       = useState(0);
  const [comment, setComment]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/pedidos')
      .then(r => setCompleted(r.data.orders.filter(o => o.status === 'completed')))
      .catch(() => toast('Erro ao carregar pedidos', 'error'))
      .finally(() => setLoading(false));
  }, []);

  function openReview(order) {
    setSelectedOrder(order);
    setRating(0);
    setComment('');
    setReviewModal(true);
  }

  async function handleSubmitReview() {
    if (rating === 0) { toast('Selecione uma nota de 1 a 5', 'warning'); return; }
    try {
      setSubmitting(true);
      await api.post('/avaliacoes', {
        order_id:    selectedOrder.id,
        reviewed_id: selectedOrder.worker_id,
        rating,
        comment,
      });
      toast('Avaliação enviada!', 'success');
      setReviewModal(false);
      // Marca localmente como avaliado
      setCompleted(prev => prev.map(o =>
        o.id === selectedOrder.id ? { ...o, reviewed: true } : o
      ));
    } catch (err) {
      toast(err?.response?.data?.error || 'Erro ao enviar avaliação', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const LABELS = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente!'];

  return (
    <LayoutPainel>
      <div className="p-4 md:p-8 space-y-6">
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800">Avaliações</h1>
          <p className="text-slate-500 mt-1 text-sm">Avalie os serviços concluídos</p>
        </motion.div>

        {loading ? <ListEsqueleto count={3} /> : completed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
            <div className="flex justify-center mb-3"><SharedIcon name="star" size={48} color="#FBBF24" /></div>
            <p className="text-slate-500">Nenhum pedido concluído para avaliar ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completed.map((o, i) => (
              <motion.div key={o.id} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <p className="font-bold text-slate-800">{o.service_title || `Pedido #${o.id}`}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {o.worker_name} · {formatarData(o.completed_at || o.created_at)}
                  </p>
                  <p className="text-lg font-black text-client mt-1">{formatarMoeda(o.price)}</p>
                </div>
                {o.reviewed ? (
                  <span className="text-sm font-semibold text-green-600 bg-green-50 border border-green-200 px-4 py-2 rounded-xl">
                    <SharedIcon name="checkCircle" size={14} className="inline mr-1" /> Avaliado
                  </span>
                ) : (
                  <button onClick={() => openReview(o)}
                    className="bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-amber-600 transition-all text-sm whitespace-nowrap">
                    <SharedIcon name="star" size={14} className="inline mr-1" /> Avaliar
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Review modal */}
      <Modal open={reviewModal} onClose={() => setReviewModal(false)} title="Avaliar serviço" size="sm">
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-3">Como foi o serviço de <strong>{selectedOrder?.worker_name}</strong>?</p>
            <div className="flex justify-center mb-2">
              <StarPicker value={rating} onChange={setRating} />
            </div>
            {rating > 0 && (
              <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="text-sm font-semibold text-amber-500">{LABELS[rating]}</motion.p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">Comentário (opcional)</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              rows={3} placeholder="Descreva sua experiência..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
            />
          </div>

          <button onClick={handleSubmitReview} disabled={submitting || rating === 0}
            className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 transition-all disabled:opacity-50">
            {submitting ? 'Enviando...' : 'Enviar avaliação'}
          </button>
        </div>
      </Modal>
    </LayoutPainel>
  );
}
