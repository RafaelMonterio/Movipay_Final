'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usarTema, obterCoresTema } from '@/contexto/contextoTema';
import Icon from '@/componentes/interface/Icone';

const ToastContext = createContext(null);

const ICONS = { success: 'checkCircle', error: 'xCircle', warning: 'alertTriangle', info: 'info' };

// Dark mode toast styles
const DARK_STYLES = {
  success: { bg: 'rgba(34,211,27,0.15)', border: 'rgba(34,211,27,0.4)', text: '#6BE567' },
  error:   { bg: 'rgba(184,58,8,0.18)', border: 'rgba(184,58,8,0.4)', text: '#FF8A6E' },
  warning: { bg: 'rgba(255,122,0,0.15)', border: 'rgba(255,122,0,0.4)', text: '#FFB627' },
  info:    { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', text: '#93C5FD' },
};

// Light mode toast styles
const LIGHT_STYLES = {
  success: { bg: 'rgba(34,211,27,0.08)', border: 'rgba(34,211,27,0.35)', text: '#15803D' },
  error:   { bg: 'rgba(184,58,8,0.08)', border: 'rgba(184,58,8,0.35)', text: '#B91C1C' },
  warning: { bg: 'rgba(255,122,0,0.10)', border: 'rgba(255,122,0,0.35)', text: '#92400E' },
  info:    { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.35)', text: '#1E40AF' },
};

export function ToastProvider({ children }) {
  const { darkMode } = usarTema();
  const colors = obterCoresTema(darkMode);
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const styleMap = darkMode ? DARK_STYLES : LIGHT_STYLES;

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => {
            const style = styleMap[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium pointer-events-auto max-w-sm"
                style={{
                  backgroundColor: style.bg,
                  borderColor: style.border,
                  color: style.text,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Icon name={ICONS[t.type] || 'info'} size={18} />
                <span>{t.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return ctx;
}
