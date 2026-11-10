// components/mobile/ui.js
// Peças visuais compartilhadas pela versão mobile.
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Layers, RefreshCw, CreditCard } from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { formatCurrency } from '@/utils/formatters';
import { ICON_MAP as CATEGORY_ICONS } from './constants';
import { useBackHandler } from './useBackHandler';
import { haptic } from './feedback';

// ── Datas ────────────────────────────────────────────────────────
export const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const monthKey = ({ y, m }) => `${y}-${String(m).padStart(2, '0')}`;
export const shiftMonth = ({ y, m }, delta) => {
  const d = new Date(y, m - 1 + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
};
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const inMonth = (date, month) => (date || '').startsWith(monthKey(month));

export function dayLabel(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((date - today) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === -1) return 'Ontem';
  if (diff === 1) return 'Amanhã';
  return `${WEEKDAYS[date.getDay()]}, ${d} de ${MONTHS_SHORT[m - 1]}`;
}

export const shortDate = (iso) => {
  if (!iso) return '';
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
};

// Aceita "1.250,50", "1250,5", "2.500" (milhar) ou "1250.5"
export function parseAmount(text) {
  if (typeof text === 'number') return text;
  const s = String(text || '').trim();
  if (!s) return 0;
  let normalized = s;
  if (s.includes(',')) normalized = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) normalized = s.replace(/\./g, ''); // "2.500" = dois mil e quinhentos
  return parseFloat(normalized) || 0;
}

// ── Valores ──────────────────────────────────────────────────────
export function Money({ value, className = '', sign = false, hideable = true }) {
  const { hideValues } = useFinancial();
  if (hideable && hideValues) return <span className={className}>R$ ••••</span>;
  const prefix = sign && value > 0 ? '+ ' : sign && value < 0 ? '- ' : '';
  return <span className={`tabular-nums ${className}`}>{prefix}{formatCurrency(sign ? Math.abs(value) : value)}</span>;
}

// ── Ícones de categoria ──────────────────────────────────────────
const ICON_MAP = { ...CATEGORY_ICONS, RefreshCw, CreditCard };

export const COLOR_MAP = {
  indigo: { text: 'text-indigo-300', bg: 'bg-indigo-500/15', bar: 'bg-indigo-400' },
  emerald: { text: 'text-emerald-300', bg: 'bg-emerald-500/15', bar: 'bg-emerald-400' },
  rose: { text: 'text-rose-300', bg: 'bg-rose-500/15', bar: 'bg-rose-400' },
  amber: { text: 'text-amber-300', bg: 'bg-amber-400/15', bar: 'bg-amber-400' },
  purple: { text: 'text-purple-300', bg: 'bg-purple-500/15', bar: 'bg-purple-400' },
  sky: { text: 'text-sky-300', bg: 'bg-sky-500/15', bar: 'bg-sky-400' },
  pink: { text: 'text-pink-300', bg: 'bg-pink-500/15', bar: 'bg-pink-400' },
  teal: { text: 'text-teal-300', bg: 'bg-teal-500/15', bar: 'bg-teal-400' },
  orange: { text: 'text-orange-300', bg: 'bg-orange-500/15', bar: 'bg-orange-400' },
  slate: { text: 'text-slate-300', bg: 'bg-slate-500/15', bar: 'bg-slate-400' },
};

export function useCategoryStyle() {
  const { categories } = useFinancial();
  return (name, { isInvoice = false } = {}) => {
    if (isInvoice || name === 'Cartão de Crédito') return { Icon: CreditCard, ...COLOR_MAP.purple };
    const cat = categories.find(c => c.name === name);
    return { Icon: ICON_MAP[cat?.icon] || Layers, ...(COLOR_MAP[cat?.iconColor] || COLOR_MAP.slate) };
  };
}

export function CategoryIcon({ name, isInvoice, size = 'md' }) {
  const styleFor = useCategoryStyle();
  const { Icon, text, bg } = styleFor(name, { isInvoice });
  const box = size === 'sm' ? 'w-8 h-8 rounded-xl' : 'w-10 h-10 rounded-2xl';
  return (
    <div className={`${box} ${bg} ${text} flex items-center justify-center flex-shrink-0`}>
      <Icon size={size === 'sm' ? 15 : 18} />
    </div>
  );
}

// ── Seletor de mês ───────────────────────────────────────────────
// Toque nas setas ou arraste o nome do mês para os lados
export function MonthPicker({ month, onChange, className = '' }) {
  const change = (delta) => { haptic(8); onChange(shiftMonth(month, delta)); };
  const now = new Date();
  const isCurrent = month.y === now.getFullYear() && month.m === now.getMonth() + 1;
  return (
    <div className={`flex items-center justify-between bg-white/[0.04] border border-white/[0.06] rounded-2xl p-1 overflow-hidden ${className}`}>
      <button type="button" aria-label="Mês anterior" onClick={() => change(-1)} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 active:bg-white/10">
        <ChevronLeft size={18} />
      </button>
      <motion.button
        type="button"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.35}
        dragSnapToOrigin
        onDragEnd={(_, info) => { if (info.offset.x < -40) change(1); else if (info.offset.x > 40) change(-1); }}
        onClick={() => { if (!isCurrent) onChange({ y: now.getFullYear(), m: now.getMonth() + 1 }); }}
        aria-label={isCurrent ? 'Mês atual' : 'Voltar para o mês atual'}
        className="flex-1 h-10 flex flex-col items-center justify-center touch-pan-y select-none"
      >
        <span className="text-sm font-semibold text-white leading-tight">
          {MONTHS[month.m - 1]} <span className="text-slate-500 font-medium">{month.y}</span>
        </span>
        {!isCurrent && <span className="text-[10px] text-indigo-300 font-semibold leading-tight">toque para voltar a hoje</span>}
      </motion.button>
      <button type="button" aria-label="Próximo mês" onClick={() => change(1)} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 active:bg-white/10">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

// ── Painel que sobe de baixo (bottom sheet) ──────────────────────
export function Sheet({ open, onClose, title, children, footer }) {
  const dragControls = useDragControls();
  useBackHandler(open, onClose);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-label={title}
            className="relative bg-slate-900 border-t border-white/[0.08] rounded-t-[28px] max-h-[92dvh] flex flex-col shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.8)]"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="y" dragListener={false} dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose(); }}
          >
            <div className="pt-3 pb-2 flex justify-center cursor-grab touch-none" onPointerDown={e => dragControls.start(e)}>
              <div className="w-10 h-1.5 rounded-full bg-white/15" />
            </div>
            {title && (
              <div className="flex items-center justify-between px-5 pb-3">
                <h2 className="text-base font-bold text-white">{title}</h2>
                <button type="button" aria-label="Fechar" onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-slate-400">
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="overflow-y-auto overscroll-contain px-5 pb-4">
              {children}
            </div>
            {footer && (
              <div className="px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)] border-t border-white/[0.06] bg-slate-900">
                {footer}
              </div>
            )}
            {!footer && <div className="pb-[env(safe-area-inset-bottom)]" />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Campos de formulário ─────────────────────────────────────────
export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

// text-base (16px): abaixo disso o iPhone dá zoom ao tocar no campo
export const inputClass = 'w-full h-12 px-4 rounded-2xl bg-slate-950/70 border border-white/[0.08] text-base text-white placeholder:text-slate-600 focus:outline-none focus:border-white/25';

export function Select({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} className={`${inputClass} appearance-none pr-10`}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none" />
    </div>
  );
}

export function AmountInput({ value, onChange, tone = 'text-white', autoFocus }) {
  return (
    <div className="flex items-baseline justify-center gap-2 py-4">
      <span className="text-xl font-semibold text-slate-500">R$</span>
      <input
        inputMode="decimal"
        placeholder="0,00"
        value={value}
        autoFocus={autoFocus}
        onChange={e => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
        className={`w-48 bg-transparent text-center text-4xl font-extrabold tabular-nums focus:outline-none placeholder:text-slate-700 ${tone}`}
      />
    </div>
  );
}

export function Segmented({ value, onChange, options, className = '' }) {
  return (
    <div className={`flex bg-slate-950/70 border border-white/[0.06] rounded-2xl p-1 ${className}`}>
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`relative flex-1 h-9 rounded-xl text-[13px] font-semibold transition-colors ${value === o.value ? 'text-white' : 'text-slate-500'}`}
        >
          {value === o.value && (
            <motion.span layoutId={`seg-${options.map(x => x.value).join('')}`} className={`absolute inset-0 rounded-xl ${o.activeClass || 'bg-white/10'}`} transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function PrimaryButton({ children, className = '', ...props }) {
  const { theme } = useFinancial();
  return (
    <button {...props} className={`w-full h-13 py-3.5 rounded-2xl font-bold text-[15px] text-white ${theme.bgPrimary} active:scale-[0.98] transition disabled:opacity-40 ${className}`}>
      {children}
    </button>
  );
}

export function SectionTitle({ children, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-400">{children}</h3>
      {action && (
        <button type="button" onClick={onAction} className="text-[13px] font-semibold text-slate-300 active:opacity-60 flex items-center gap-0.5">
          {action} <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

export function Panel({ children, className = '', ...props }) {
  return (
    <div {...props} className={`rounded-3xl bg-slate-900/70 border border-white/[0.06] ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action, onAction }) {
  return (
    <Panel className="p-8 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.05] flex items-center justify-center text-slate-400 mb-4">
        <Icon size={24} />
      </div>
      <p className="font-bold text-white">{title}</p>
      {text && <p className="text-sm text-slate-500 mt-1">{text}</p>}
      {action && (
        <div className="mt-5"><PrimaryButton type="button" onClick={onAction}>{action}</PrimaryButton></div>
      )}
    </Panel>
  );
}

// Anel de progresso (limite usado, metas)
export function Ring({ percent, size = 56, stroke = 6, colorClass }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent || 0));
  const color = colorClass || (p > 85 ? 'stroke-rose-400' : p > 60 ? 'stroke-amber-400' : 'stroke-emerald-400');
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="stroke-white/[0.07]" fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" strokeLinecap="round"
          className={color} strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (p / 100) * c }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">{Math.round(p)}%</span>
    </div>
  );
}
