// components/mobile/charts.js
// Gráfico de entradas x saídas por mês, sem biblioteca extra.
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useFinancial } from '@/context/FinancialContext';
import { MONTHS_SHORT } from './ui';

const compact = (v) => {
  const a = Math.abs(v);
  if (a >= 1e6) return `${(v / 1e6).toFixed(1).replace('.', ',')}mi`;
  if (a >= 1e3) return `${(v / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace('.', ',')}mil`;
  return v.toFixed(0);
};

export function CashFlowChart({ series, selected, onSelect }) {
  const { hideValues } = useFinancial();
  const max = Math.max(1, ...series.flatMap(s => [s.income, s.expense]));
  const H = 110;

  return (
    <div>
      <div className="flex items-end gap-1.5 h-[140px]">
        {series.map(s => {
          const isSel = s.month.y === selected.y && s.month.m === selected.m;
          const hi = (s.income / max) * H;
          const he = (s.expense / max) * H;
          return (
            <button
              key={`${s.month.y}-${s.month.m}`}
              type="button"
              onClick={() => onSelect(s.month)}
              aria-label={`${MONTHS_SHORT[s.month.m - 1]}: entradas ${s.income.toFixed(2)}, saídas ${s.expense.toFixed(2)}`}
              aria-pressed={isSel}
              className={`flex-1 h-full flex flex-col justify-end items-center rounded-xl transition-colors ${isSel ? 'bg-white/[0.06]' : ''}`}
            >
              <div className="flex items-end gap-[3px]" style={{ height: H }}>
                <motion.div initial={{ height: 0 }} animate={{ height: Math.max(2, hi) }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className={`w-2.5 rounded-t-md ${isSel ? 'bg-emerald-400' : 'bg-emerald-400/40'}`} />
                <motion.div initial={{ height: 0 }} animate={{ height: Math.max(2, he) }} transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className={`w-2.5 rounded-t-md ${isSel ? 'bg-rose-400' : 'bg-rose-400/40'}`} />
              </div>
              <span className={`text-[11px] mt-1.5 mb-1.5 ${isSel ? 'text-white font-bold' : 'text-slate-500'}`}>{MONTHS_SHORT[s.month.m - 1]}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-3 text-xs">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Entradas</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" />Saídas</span>
        </div>
        {!hideValues && <span className="text-slate-500">máx. R$ {compact(max)}</span>}
      </div>
    </div>
  );
}
