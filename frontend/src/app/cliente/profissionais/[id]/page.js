'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import LayoutPainel from '@/componentes/layout/LayoutPainel';
import Modal from '@/componentes/interface/JanelaModal';
import Icon, { StarRating } from '@/componentes/interface/Icone';
import api from '@/servicos/clienteApi';
import { formatarMoeda } from '@/utilitarios/formatadores';
import { CENTRO_CIDADE_PADRAO } from '@/componentes/mapa/MapaProfissionais';

const CATEGORY_LABEL = {
  eletrica: 'Elétrica', hidraulica: 'Hidráulica', limpeza: 'Limpeza',
  cabelo: 'Cabelo & Estética', pedreiro: 'Pedreiro & Reformas',
  jardinagem: 'Jardinagem', mudanca: 'Mudanças & Frete',
};

// Catálogo genérico por categoria — usado apenas quando o profissional ainda
// não cadastrou serviços próprios com preço (o formulário de cadastro hoje
// coleta só categoria + bio). Não são pessoas fictícias, são exemplos do
// tipo de serviço que a categoria costuma oferecer.
const CATEGORY_SERVICES = {
  eletrica: [
    { id: 'eletrica-1', title: 'Instalação de tomadas e disjuntores', category: 'Elétrica', category_icon: 'bolt', price: 120 },
    { id: 'eletrica-2', title: 'Revisão do quadro elétrico', category: 'Elétrica', category_icon: 'bolt', price: 180 },
  ],
  hidraulica: [
    { id: 'hidraulica-1', title: 'Conserto de vazamentos', category: 'Hidráulica', category_icon: 'wrench', price: 100 },
    { id: 'hidraulica-2', title: 'Desentupimento', category: 'Hidráulica', category_icon: 'wrench', price: 140 },
  ],
  limpeza: [
    { id: 'limpeza-1', title: 'Faxina residencial completa', category: 'Limpeza', category_icon: 'broom', price: 150 },
    { id: 'limpeza-2', title: 'Limpeza pós-obra', category: 'Limpeza', category_icon: 'broom', price: 220 },
  ],
  cabelo: [
    { id: 'cabelo-1', title: 'Corte de cabelo', category: 'Cabelo & Estética', category_icon: 'scissors', price: 40 },
    { id: 'cabelo-2', title: 'Escova e finalização', category: 'Cabelo & Estética', category_icon: 'scissors', price: 35 },
  ],
  pedreiro: [
    { id: 'pedreiro-1', title: 'Reforma e acabamento', category: 'Pedreiro & Reformas', category_icon: 'hardHat', price: 250 },
    { id: 'pedreiro-2', title: 'Pequenos reparos de alvenaria', category: 'Pedreiro & Reformas', category_icon: 'hardHat', price: 120 },
  ],
  jardinagem: [
    { id: 'jardinagem-1', title: 'Manutenção de jardim', category: 'Jardinagem', category_icon: 'sprout', price: 90 },
    { id: 'jardinagem-2', title: 'Poda e paisagismo', category: 'Jardinagem', category_icon: 'sprout', price: 160 },
  ],
  pintura: [
    { id: 'pintura-1', title: 'Pintura interna', category: 'Pintura', category_icon: 'palette', price: 180 },
    { id: 'pintura-2', title: 'Pintura externa', category: 'Pintura', category_icon: 'palette', price: 260 },
  ],
  encanamento: [
    { id: 'encanamento-1', title: 'Conserto de vazamentos', category: 'Encanamento', category_icon: 'wrench', price: 100 },
    { id: 'encanamento-2', title: 'Instalação de torneiras e chuveiros', category: 'Encanamento', category_icon: 'wrench', price: 130 },
  ],
  informatica: [
    { id: 'informatica-1', title: 'Formatação e limpeza de PC', category: 'Informática', category_icon: 'laptop', price: 120 },
    { id: 'informatica-2', title: 'Configuração de rede Wi-Fi', category: 'Informática', category_icon: 'laptop', price: 90 },
  ],
  reforma: [
    { id: 'reforma-1', title: 'Reforma de banheiro/cozinha', category: 'Reformas', category_icon: 'hardHat', price: 300 },
    { id: 'reforma-2', title: 'Pequenos reparos', category: 'Reformas', category_icon: 'hardHat', price: 120 },
  ],
  'cuidado-pessoal': [
    { id: 'cuidado-1', title: 'Atendimento a domicílio', category: 'Cuidado Pessoal', category_icon: 'spa', price: 80 },
  ],
  aulas: [
    { id: 'aulas-1', title: 'Aula particular (1h)', category: 'Aulas', category_icon: 'book', price: 70 },
  ],
  mudanca: [
    { id: 'mudanca-1', title: 'Mudança residencial', category: 'Mudanças & Frete', category_icon: 'box', price: 280 },
    { id: 'mudanca-2', title: 'Frete e transporte', category: 'Mudanças & Frete', category_icon: 'box', price: 150 },
  ],
};

function resolvePosition(worker) {
  if (Number.isFinite(worker?.lat) && Number.isFinite(worker?.lng)) return [Number(worker.lat), Number(worker.lng)];
  return CENTRO_CIDADE_PADRAO;
}

export default function WorkerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  // Booking defaults (use ISO date for selectedDate to avoid format mismatch)
  const TODAY = new Date();
  const ISO_TODAY = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}-${String(TODAY.getDate()).padStart(2, '0')}`;
  const modalBookingSlots = ['09:00', '11:30', '14:00', '18:30'];
  const [selectedDate, setSelectedDate] = useState(ISO_TODAY);
  const [selectedSlot, setSelectedSlot] = useState(modalBookingSlots[0]);

  function getAvailableSlotsForDate(dateIso) {
    if (!dateIso) return [];
    const parts = String(dateIso).split('-').map(p => Number(p));
    if (parts.length !== 3) return modalBookingSlots;
    const [y, m, d] = parts; // m is 1-based
    if (!worker?.is_available) return [];
    const dow = new Date(y, m - 1, d).getDay();
    if (dow === 0 || dow === 6) return []; // no weekends
    return modalBookingSlots;
  }
  const [selectedServiceType, setSelectedServiceType] = useState('Completo');
  const [scheduled, setScheduled] = useState(false);
  const [folhasBalance, setFolhasBalance] = useState(0);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    api.get('/pontos/saldo').then(r => setFolhasBalance(Number(r.data?.balance || 0))).catch(() => setFolhasBalance(0));
  }, []);

  useEffect(() => {
    if (!params?.id) return;

    api.get(`/profissionais/${params.id}`)
      .then(r => setWorker(r.data))
      .catch(() => setWorker(null))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return (
      <LayoutPainel>
        <div className="p-6 md:p-10">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="h-8 w-48 bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-64 bg-slate-200 rounded-3xl animate-pulse" />
            <div className="grid md:grid-cols-3 gap-4">
              {[0,1,2].map(i => <div key={i} className="h-32 bg-slate-200 rounded-3xl animate-pulse" />)}
            </div>
          </div>
        </div>
      </LayoutPainel>
    );
  }

  if (!worker) {
    return (
      <LayoutPainel>
        <div className="p-6 md:p-10">
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 text-center">
            <div className="flex justify-center mb-3"><Icon name="worker" size={40} color="#94A3B8" /></div>
            <h1 className="text-xl font-black text-slate-800 mb-2">Perfil não encontrado</h1>
            <p className="text-slate-500 text-sm mb-5">Este profissional não está mais disponível ou não existe.</p>
            <button onClick={() => router.push('/cliente/profissionais')} className="bg-client text-white px-5 py-3 rounded-xl font-semibold">Voltar para trabalhadores</button>
          </div>
        </div>
      </LayoutPainel>
    );
  }

  const [lat, lng] = resolvePosition(worker);
  const completionRate = Math.min(99, Math.max(72, Math.round((worker.total_orders || 0) / 6) + 78));
  const services = worker.services || CATEGORY_SERVICES[worker.category] || [{ id: 'geral', title: 'Atendimento personalizado', category: 'Geral', category_icon: 'clipboard', price: null }];
  // Conteúdo ilustrativo genérico (não são pessoas/pedidos fictícios — apenas
  // exemplos de layout, já que o backend real ainda não expõe portfólio e
  // histórico detalhado por profissional).
  const portfolio = worker.portfolio || [
    { id: 1, title: 'Trabalho recente', type: 'Antes e depois', image: 'linear-gradient(135deg, #f59e0b, #f97316)' },
    { id: 2, title: 'Trabalho recente', type: 'Antes e depois', image: 'linear-gradient(135deg, #22C55E, #16A34A)' },
  ];
  const recentJobs = (worker.total_orders || 0) > 0
    ? [{ title: services[0]?.title || 'Serviço concluído', status: 'Concluído', value: services[0]?.price ? formatarMoeda(services[0].price) : '—', date: 'Recente' }]
    : [];
  const workHistory = recentJobs;
  const stats = [
    { label: 'Avaliação', value: worker.avg_rating ? Number(worker.avg_rating).toFixed(1) : 'Novo', icon: 'star' },
    { label: 'Serviços feitos', value: String(worker.total_orders || 0), icon: 'checkCircle' },
  ];

  return (
    <LayoutPainel>
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => router.back()} className="text-sm font-semibold text-slate-600 hover:text-slate-800">
              ← Voltar
            </button>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => router.push(`/cliente/conversas?worker=${worker.id}`)}
                className="border border-slate-200 bg-white text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all"
              >
                Enviar mensagem
              </button>
              <button
                type="button"
              onClick={() => { setSelectedDate(ISO_TODAY); setSelectedSlot(modalBookingSlots[0]); setBookingOpen(true); }}
                className="bg-client text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-all"
              >
                Agendar serviço
              </button>
            </div>
          </div>

          <motion.section initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 md:p-7">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div className="flex items-start gap-4">
                  {worker.avatar_url ? (
                    <img src={worker.avatar_url} alt={worker.name} className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-worker to-amber-400 flex items-center justify-center text-white text-2xl font-black shadow-sm">{worker.name?.charAt(0)}</div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl md:text-3xl font-black text-slate-900 truncate" style={{ fontFamily: 'var(--display)' }}>{worker.name}</h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 max-w-xl">{worker.bio || 'Especialista em serviços domésticos e manutenção com atendimento rápido e acabamento premium.'}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1"><Icon name="star" size={14} color="#FBBF24" /> {worker.avg_rating ? Number(worker.avg_rating).toFixed(1) : 'Novo'}</span>
                      <span>•</span>
                      <span>{worker.total_orders || 0} serviços concluídos</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.section>

          <div className="grid grid-cols-2 gap-3">
            {stats.map((item, index) => (
              <motion.div key={item.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: index * 0.04 }} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="mb-2"><Icon name={item.icon} size={20} color="#FF7A00" /></div>
                <p className="text-xl font-black text-slate-900">{item.value}</p>
                <p className="text-xs text-slate-500 mt-1">{item.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <motion.section initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }} className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-black text-slate-800">Sobre</h2>
                  <span className="text-xs text-slate-500">{completionRate}% de perfil completo</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {worker.bio || 'Atendo clientes com foco em qualidade, pontualidade e conforto. Trabalho com materiais de boa procedência, explico o serviço antes de iniciar e mantenho a comunicação clara durante todo o atendimento.'}
                </p>
                <div className="mt-4 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-client to-amber-500" style={{ width: `${completionRate}%` }} />
                </div>
              </motion.section>

              <motion.section initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }} className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6">
                <h2 className="text-lg font-black text-slate-800 mb-4">Serviços disponíveis</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {services.map(service => (
                    <div key={service.id} className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">{service.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <Icon name={service.category_icon || 'clipboard'} size={12} />
                            {service.category || 'Serviço'}
                          </p>
                        </div>
                        {service.price != null && <span className="font-black text-client text-sm">{formatarMoeda(service.price)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>

              <motion.section initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }} className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-black text-slate-800">Portfólio</h2>
                  <span className="text-xs text-slate-500">Últimos projetos</span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {portfolio.map(item => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedPhoto(item)}
                      className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 text-left transition-all hover:border-client/30 hover:shadow-sm"
                    >
                      <div className="h-32" style={{ background: item.image }} />
                      <div className="p-3">
                        <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{item.type}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.section>

              <motion.section initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-slate-800">Trabalhos recentes</h2>
                  <span className="text-xs text-slate-500">Últimos 3</span>
                </div>
                <div className="space-y-3">
                  {recentJobs.map((job, index) => (
                    <div key={index} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-100">
                      <div>
                        <p className="font-semibold text-slate-800">{job.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{job.status}</p>
                      </div>
                      <span className="text-sm font-black text-client">{job.value}</span>
                    </div>
                  ))}
                </div>
              </motion.section>

              <motion.section initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.22 }} className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6">
                <h2 className="text-lg font-black text-slate-800 mb-4">Histórico de serviços</h2>
                <div className="space-y-4">
                  {workHistory.map((item, index) => (
                    <div key={item.title} className="flex gap-3 items-start">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-client' : index === 1 ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        {index < workHistory.length - 1 && <div className="w-px h-10 bg-slate-200 mt-2" />}
                      </div>
                      <div className="flex-1 rounded-2xl bg-slate-50 border border-slate-100 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-slate-100 text-slate-600">{item.status}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>

              <motion.section initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }} className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6">
                <h2 className="text-lg font-black text-slate-800 mb-4">Avaliações</h2>
                <div className="space-y-3">
                  {(worker.reviews || []).slice(0, 4).map(review => (
                    <div key={review.id} className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-800 text-sm">{review.reviewer_name}</p>
                        <StarRating rating={review.rating} size={12} />
                      </div>
                      {review.comment && <p className="text-sm text-slate-600 mt-2 leading-relaxed">“{review.comment}”</p>}
                    </div>
                  ))}
                  {(!worker.reviews || worker.reviews.length === 0) && (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 text-center">
                      Ainda não há avaliações públicas para este perfil.
                    </div>
                  )}
                </div>
              </motion.section>
            </div>

            <div className="space-y-6">
              <motion.section initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }} className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6">
                <h2 className="text-lg font-black text-slate-800 mb-4">Localização</h2>
                <div className="rounded-2xl overflow-hidden border border-slate-200">
                    {/* Google Maps embed using coordinates (no extra dependency). If you have a Google Maps Embed API key you can switch to the official embed endpoint. */}
                    <div className="w-full h-56 relative">
                      <iframe
                        title="Mapa do trabalhador"
                        className="w-full h-full border-0"
                        src={`https://www.google.com/maps?q=${encodeURIComponent(worker.address || `${lat},${lng}`)}&z=15&output=embed`}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                <div className="mt-4 text-sm text-slate-600 space-y-2">
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5"><Icon name="mapPin" size={14} color="#FF7A00" /> {worker.neighborhood || 'Bairro'}, {worker.city || 'Ribeirão Pires'}</p>
                  <p className="text-xs text-slate-500">Coordenadas: {lat.toFixed(4)}, {lng.toFixed(4)}</p>
                  <p className="text-xs text-slate-500">Atende em até {worker.service_area || '3 km'} da localidade.</p>

                  {/* Link to open location in Google Maps */}
                  <div className="mt-3">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(worker.address || `${lat},${lng}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-client hover:underline"
                    >
                      Ver no Google Maps
                    </a>
                  </div>
                </div>
              </motion.section>

              <motion.section initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12 }} className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6">
                <h2 className="text-lg font-black text-slate-800 mb-4">Resumo</h2>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex justify-between gap-2"><span>Total de pedidos</span><strong className="text-slate-800">{worker.total_orders || 0}</strong></div>
                  <div className="flex justify-between gap-2"><span>Avaliação média</span><strong className="text-slate-800">{worker.avg_rating ? Number(worker.avg_rating).toFixed(1) : '—'}</strong></div>
                  <div className="flex justify-between gap-2"><span>Tempo de resposta</span><strong className="text-slate-800">{worker.response_time || '5 min'}</strong></div>
                  <div className="flex justify-between gap-2"><span>Último check-in</span><strong className="text-slate-800">Hoje</strong></div>
                </div>
              </motion.section>

              <motion.section initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.16 }} className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6">
                <h2 className="text-lg font-black text-slate-800 mb-4">Destaques</h2>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex gap-2 items-center"><Icon name="checkCircle" size={16} color="#22C55E" /><span>Atendimento pontual e respeitoso</span></li>
                  <li className="flex gap-2 items-center"><Icon name="checkCircle" size={16} color="#22C55E" /><span>Materiais e ferramentas profissionais</span></li>
                  <li className="flex gap-2 items-center"><Icon name="checkCircle" size={16} color="#22C55E" /><span>Orçamento claro antes do início</span></li>
                  <li className="flex gap-2 items-center"><Icon name="checkCircle" size={16} color="#22C55E" /><span>Excelente reputação na região</span></li>
                </ul>
              </motion.section>
            </div>
          </div>
        </div>
      </div>

      <Modal open={bookingOpen} onClose={() => setBookingOpen(false)} title={`Agendar serviço com ${worker.name}`} size="md">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">1. Escolha a data</p>
            <div>
               {/* Mini calendar (reuse logic from worker calendar) - full width */}
               <CalendarMini
                 selected={selectedDate}
                 isDateAvailable={(y,m,d) => {
                   if (!worker?.is_available) return false;
                   const dow = new Date(y, m, d).getDay();
                   return dow !== 0 && dow !== 6;
                 }}
                 onSelect={(y,m,d) => {
                   const dayStr = `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                   setSelectedDate(dayStr);
                   setSelectedSlot(modalBookingSlots[0]);
                 }}
               />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">2. Horários disponíveis</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {getAvailableSlotsForDate(selectedDate).length === 0 ? (
                <div className="text-sm text-slate-500">Sem horários disponíveis para esta data.</div>
              ) : (
                getAvailableSlotsForDate(selectedDate).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium text-center transition-all ${
                      selectedSlot === slot ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">3. Tipo de serviço</p>
            <div className="space-y-2">
              {[
                { id: 'Completo', title: 'Serviço completo', description: 'Tudo incluso e atendimento total', price: services?.[0] ? formatarMoeda(services[0].price) : 'Sob consulta' },
                { id: 'Básico', title: 'Básico', description: 'Atendimento essencial com foco no necessário', price: 'R$ 120,00' },
                { id: 'Premium', title: 'Premium', description: 'Mais cuidado, revisão e acabamento refinado', price: 'R$ 220,00' },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedServiceType(option.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition-all ${
                    selectedServiceType === option.id ? 'border-client bg-client/5 text-client' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{option.title}</p>
                      <p className="text-xs mt-0.5 opacity-80">{option.description}</p>
                    </div>
                    <span className="text-sm font-bold">{option.price}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const basePrice = Number(services?.[0]?.price || 0);
            const discount = Math.min(basePrice, folhasBalance * 0.04);
            return (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3"><span>Folhas disponíveis</span><strong className="text-emerald-700">{folhasBalance} folhas</strong></div>
                <div className="flex items-center justify-between gap-3 mt-2"><span>Desconto aplicado</span><strong className="text-emerald-700">-{formatarMoeda(discount)}</strong></div>
                <div className="flex items-center justify-between gap-3 mt-2"><span>Total estimado</span><strong className="text-slate-800">{formatarMoeda(Math.max(0, basePrice - discount))}</strong></div>
              </div>
            );
          })()}

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span>Serviço</span>
              <strong className="text-slate-800">{services?.[0]?.title || 'Atendimento personalizado'}</strong>
            </div>
            <div className="flex items-center justify-between gap-3 mt-2">
              <span>Data</span>
              <strong className="text-slate-800">{selectedDate}</strong>
            </div>
            <div className="flex items-center justify-between gap-3 mt-2">
              <span>Horário</span>
              <strong className="text-slate-800">{selectedSlot}</strong>
            </div>
            <div className="flex items-center justify-between gap-3 mt-2">
              <span>Tipo</span>
              <strong className="text-slate-800">{selectedServiceType}</strong>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setBookingOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium">
              Cancelar
            </button>
            {bookingError && <p className="text-sm text-red-600 mr-auto">{bookingError}</p>}
            <button
              type="button"
              onClick={async () => {
                const basePrice = Number(services?.[0]?.price || 0);
                const discount = Math.min(basePrice, folhasBalance * 0.04);
                try {
                  setBookingSubmitting(true); setBookingError('');
                  await api.post('/pedidos', { service_id: services?.[0]?.id, scheduled_date: selectedDate, scheduled_time: selectedSlot, service_type: selectedServiceType, folhas_used: discount ? Math.ceil(discount / 0.04) : 0, discount_amount: discount, original_price: basePrice, final_price: Math.max(0, basePrice - discount) });
                  setBookingOpen(false); setScheduled(true);
                } catch { setBookingError('Não foi possível enviar o agendamento. Tente novamente.'); }
                finally { setBookingSubmitting(false); }
              }}
              className="px-4 py-2 rounded-xl bg-client text-white font-semibold hover:bg-indigo-600"
            >
              {bookingSubmitting ? 'Enviando...' : 'Confirmar agendamento'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={contractOpen} onClose={() => setContractOpen(false)} title="Confirmar contratação" size="md">
        <div className="space-y-4">
          <div className="rounded-2xl bg-client/5 border border-client/20 p-4">
            <p className="text-sm text-slate-600">Você está prestes a contratar</p>
            <p className="mt-2 text-xl font-black text-slate-800">{worker.name}</p>
            <p className="mt-1 text-sm text-slate-600">{services?.[0]?.title || 'Atendimento personalizado'} · {services?.[0] ? formatarMoeda(services[0].price) : 'Orçamento sob consulta'}</p>
          </div>

          <div className="text-sm text-slate-600 leading-relaxed">
            O profissional será avisado e poderá confirmar disponibilidade. Você também pode agendar um horário após a confirmação.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setContractOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium">
              Voltar
            </button>
            <button
              type="button"
              onClick={() => {
                setContractOpen(false);
                setScheduled(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600"
            >
              Confirmar contratação
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!selectedPhoto} onClose={() => setSelectedPhoto(null)} title={selectedPhoto?.title || 'Projeto'} size="lg">
        {selectedPhoto && (
          <div className="space-y-4">
            <div className="h-72 rounded-2xl" style={{ background: selectedPhoto.image }} />
            <div>
              <p className="text-lg font-black text-slate-800">{selectedPhoto.title}</p>
              <p className="text-sm text-slate-500 mt-1">{selectedPhoto.type}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={scheduled} onClose={() => setScheduled(false)} title="Solicitação enviada" size="sm">
        <div className="space-y-4">
          <div className="text-center">
            <div className="flex justify-center mb-2"><Icon name="checkCircle" size={32} color="#22C55E" /></div>
            <p className="text-slate-700 text-sm">Sua solicitação foi enviada com sucesso.</p>
          </div>
          <button
            type="button"
            onClick={() => setScheduled(false)}
            className="w-full px-4 py-2 rounded-xl bg-client text-white font-semibold hover:bg-indigo-600"
          >
            Entendi
          </button>
        </div>
      </Modal>
    </LayoutPainel>
  );
}

function getMonthDays(year, month) {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  return { first, total };
}

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAYS   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function CalendarMini({ selected, onSelect, isDateAvailable }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  // Sync with external selected ISO date (format YYYY-MM-DD)
  useEffect(() => {
    if (!selected) return;
    const parts = String(selected).split('-').map(p => Number(p));
    if (parts.length !== 3) return;
    const [y, m, d] = parts; // m is 1-based
    setYear(y);
    setMonth(m - 1);
    setSelectedDay(d);
  }, [selected]);

  const { first, total } = getMonthDays(year, month);

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  return (
    <div className="bg-white border rounded-2xl p-3">
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="w-8 h-8 rounded-xl bg-slate-100">‹</button>
        <div className="text-sm font-semibold">{MONTHS[month]} {year}</div>
        <button onClick={nextMonth} className="w-8 h-8 rounded-xl bg-slate-100">›</button>
      </div>
      <div className="grid grid-cols-7 text-xs text-slate-400 mb-2">
        {DAYS.map(d => <div key={d} className="text-center py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {[...Array(first)].map((_, i) => <div key={`b${i}`} />)}
        {[...Array(total)].map((_, i) => {
          const day = i + 1;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSel = day === selectedDay;
          const label = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const available = typeof isDateAvailable === 'function' ? isDateAvailable(year, month, day) : true;
          return (
            <button
              key={label}
              onClick={() => { if (!available) return; setSelectedDay(day); onSelect?.(year, month, day); }}
              disabled={!available}
              className={`aspect-square rounded-xl text-sm flex items-center justify-center ${isSel ? 'bg-amber-500 text-white shadow-md' : isToday ? 'bg-amber-100 text-amber-700' : available ? 'hover:bg-slate-100' : 'opacity-50 text-slate-400 cursor-not-allowed'}`}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
