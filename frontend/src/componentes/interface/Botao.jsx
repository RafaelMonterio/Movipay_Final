'use client';
import { motion } from 'framer-motion';

export default function Botao({ label, onClick, loading, variant = 'primary', className = '', icon, disabled }) {
  const base = 'inline-flex items-center gap-2 font-semibold rounded-xl px-5 py-2.5 text-sm transition-all disabled:opacity-50';
  const variants = {
    primary: 'bg-client text-white hover:bg-client-dark',
    worker:  'bg-worker text-white hover:bg-worker-dark',
    outline: 'border-2 border-client text-client hover:bg-client/5',
    ghost:   'text-slate-600 hover:bg-slate-100',
    danger:  'bg-red-500 text-white hover:bg-red-600',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`${base} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <span className="animate-spin">⏳</span> : icon && <span>{icon}</span>}
      {label}
    </motion.button>
  );
}
