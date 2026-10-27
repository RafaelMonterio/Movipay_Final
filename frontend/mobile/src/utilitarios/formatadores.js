export function formatCurrency(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(dateLike) {
  if (!dateLike) return '';
  const d = new Date(dateLike);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateLike) {
  if (!dateLike) return '';
  const d = new Date(dateLike);
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às ${d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function formatTime(dateLike) {
  if (!dateLike) return '';
  return new Date(dateLike).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(dateLike) {
  if (!dateLike) return '';
  const diffMs = Date.now() - new Date(dateLike).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `há ${day}d`;
  return formatDate(dateLike);
}

const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function weekdayLabel(idx, short = false) {
  return (short ? WEEKDAY_SHORT : WEEKDAY_LABELS)[idx] || '';
}

export function hourLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}
