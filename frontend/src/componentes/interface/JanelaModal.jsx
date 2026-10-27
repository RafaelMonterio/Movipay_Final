'use client';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import Icon from '@/componentes/interface/Icone';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const { darkMode } = usarTema();
  const colors = obterCoresTema(darkMode);
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  // Fecha com ESC
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full ${sizes[size]} rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]`}
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: `1px solid ${colors.line}` }}
            >
              <h2 className="text-lg font-bold" style={{ color: colors.text }}>{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                style={{ color: colors.textMuted }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkMode ? 'rgba(243,239,226,0.08)' : 'rgba(23,36,26,0.06)';
                  e.currentTarget.style.color = colors.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = colors.textMuted;
                }}
              >
                <Icon name="x" size={14} />
              </button>
            </div>
            {/* Content (scrollable) */}
            <div className="px-6 py-5 overflow-auto max-h-[70vh]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
