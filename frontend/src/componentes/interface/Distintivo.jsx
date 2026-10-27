export default function Badge({ label, color = 'slate' }) {
  const colors = {
    slate:  'bg-slate-100 text-slate-600',
    client: 'bg-client/10 text-client',
    worker: 'bg-worker/10 text-worker',
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
      {label}
    </span>
  );
}
