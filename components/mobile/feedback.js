// components/mobile/feedback.js
// Avisos rápidos (toast) com "Desfazer" e vibração leve.
'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Trash2, Info } from 'lucide-react';

const ToastContext = createContext({ toast: () => {} });

// Vibração curta (só Android; no iPhone é ignorada sem erro)
export function haptic(pattern = 12) {
  try { navigator.vibrate?.(pattern); } catch { /* sem suporte */ }
}

const TONES = {
  success: { Icon: CheckCircle2, cls: 'text-emerald-300' },
  danger: { Icon: Trash2, cls: 'text-rose-300' },
  info: { Icon: Info, cls: 'text-sky-300' },
};

export function ToastProvider({ children }) {
  const [current, setCurrent] = useState(null);
  const timer = useRef(null);

  const toast = useCallback((message, { tone = 'success', actionLabel, onAction, duration = 4000 } = {}) => {
    clearTimeout(timer.current);
    const id = Date.now();
    setCurrent({ id, message, tone, actionLabel, onAction });
    timer.current = setTimeout(() => setCurrent(c => (c?.id === id ? null : c)), duration);
  }, []);

  const tone = TONES[current?.tone] || TONES.success;

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed inset-x-0 z-[70] flex justify-center px-4 pointer-events-none bottom-[calc(env(safe-area-inset-bottom)+92px)]">
        <AnimatePresence>
          {current && (
            <motion.div
              key={current.id}
              role="status"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="pointer-events-auto w-full max-w-sm flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl bg-slate-800/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60"
            >
              <tone.Icon size={18} className={`${tone.cls} flex-shrink-0`} />
              <span className="flex-1 text-sm text-white font-medium py-1.5">{current.message}</span>
              {current.actionLabel && (
                <button
                  type="button"
                  onClick={() => { current.onAction?.(); setCurrent(null); haptic(); }}
                  className="h-9 px-3 rounded-xl text-sm font-bold text-indigo-300 active:bg-white/10"
                >
                  {current.actionLabel}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext).toast;
}
