function numeroMonetario(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined || value === '') return 0;
  const raw = String(value).trim().replace(/R\$\s?/gi, '');
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
export const formatarMoeda = v =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numeroMonetario(v));

export const formatarData = iso =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_LABEL = {
  pending: 'Aguardando', accepted: 'Aceito', in_progress: 'Em andamento',
  completed: 'Concluído', cancelled: 'Cancelado',
};

// Ícone (nome do componente <Icon />) associado a cada status de pedido.
export const STATUS_ICON = {
  pending: 'clock', accepted: 'checkCircle', in_progress: 'wrench',
  completed: 'flag', cancelled: 'xCircle',
};

export const formatarStatus = s => STATUS_LABEL[s] || s;
