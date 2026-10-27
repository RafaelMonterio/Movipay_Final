'use client';
import { motion } from 'framer-motion';

export default function CartaoEstatistica({ icon, label, value, color = 'client', delay = 0 }) {
  const colors = {
    client: 'bg-client/10 text-client',
    worker: 'bg-worker/10 text-worker',
    green:  'bg-green-100 text-green-600',
    slate:  'bg-slate-100 text-slate-600',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="card p-6 flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </motion.div>
  );
}
