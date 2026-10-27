'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/componentes/interface/Icone';

export default function CampoEntrada({
  label, type = 'text', value, onChange, onBlur,
  placeholder, error, disabled, icon, className = '',
  hint, required
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
          {label}
          {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          onBlur={() => onBlur?.()}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full border rounded-xl px-4 py-3 text-sm text-slate-800
            placeholder-slate-400 transition-all outline-none
            ${icon ? 'pl-9' : ''}
            ${error
              ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200 focus:border-red-400'
              : 'border-slate-200 bg-white focus:border-client focus:ring-2 focus:ring-client/20'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}
          `}
        />
        {/* Ícone de status */}
        {value && !error && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2"><Icon name="check" size={14} color="#4ADE80" /></span>
        )}
        {error && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2"><Icon name="x" size={14} color="#F87171" /></span>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-red-500 font-medium flex items-center gap-1"
          >
            <Icon name="alertTriangle" size={12} /> {error}
          </motion.p>
        )}
        {hint && !error && (
          <p className="text-xs text-slate-400">{hint}</p>
        )}
      </AnimatePresence>
    </div>
  );
}
