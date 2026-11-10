// components/mobile/screens/Metas.js
'use client';

import React, { useMemo, useState } from 'react';
import { Target, Plus } from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { useMonthData } from '../data';
import { Money, MonthPicker, Panel, CategoryIcon, Ring, Sheet, Field, Select, PrimaryButton, inputClass, parseAmount, SectionTitle, MONTHS } from '../ui';

export default function Metas({ month, setMonth }) {
  const { categories, budgets, saveBudget } = useFinancial();
  const { spendingByCategory } = useMonthData(month);
  const [edit, setEdit] = useState(null); // { categoryName, limit }

  const rows = useMemo(() => categories.filter(c => c.type === 'expense').map(c => {
    const limit = Number(budgets.find(b => b.categoryName === c.name)?.limitAmount || 0);
    const spent = spendingByCategory[c.name] || 0;
    return { name: c.name, limit, spent, pct: limit ? (spent / limit) * 100 : 0 };
  }), [categories, budgets, spendingByCategory]);

  const withBudget = rows.filter(r => r.limit > 0).sort((a, b) => b.pct - a.pct);
  const withoutBudget = rows.filter(r => r.limit === 0);
  const totalLimit = withBudget.reduce((a, r) => a + r.limit, 0);
  const totalSpent = withBudget.reduce((a, r) => a + r.spent, 0);
  const totalPct = totalLimit ? (totalSpent / totalLimit) * 100 : 0;

  const expenseOptions = categories.filter(c => c.type === 'expense').map(c => ({ value: c.name, label: c.name }));

  return (
    <div className="space-y-5">
      <MonthPicker month={month} onChange={setMonth} />

      <Panel className="p-5 flex items-center gap-5">
        <Ring percent={totalPct} size={92} stroke={9} />
        <div className="min-w-0">
          <p className="text-[13px] text-slate-400">Orçamento de {MONTHS[month.m - 1].toLowerCase()}</p>
          <Money value={totalSpent} className="block text-2xl font-extrabold text-white" />
          <p className="text-xs text-slate-500">de <Money value={totalLimit} /> planejados</p>
          <p className={`text-xs font-semibold mt-1 ${totalLimit - totalSpent >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {totalLimit - totalSpent >= 0 ? 'Sobram ' : 'Estourou '}<Money value={Math.abs(totalLimit - totalSpent)} />
          </p>
        </div>
      </Panel>

      <section>
        <SectionTitle action="Nova meta" onAction={() => setEdit({ categoryName: withoutBudget[0]?.name || expenseOptions[0]?.value || '', limit: '' })}>Limites por categoria</SectionTitle>
        {withBudget.length === 0 ? (
          <Panel className="p-6 text-center text-sm text-slate-500 flex flex-col items-center gap-2"><Target size={20} /> Defina limites para controlar seus gastos.</Panel>
        ) : (
          <Panel className="divide-y divide-white/[0.05]">
            {withBudget.map(r => {
              const over = r.pct > 100;
              const bar = r.pct > 100 ? 'bg-rose-400' : r.pct > 80 ? 'bg-amber-400' : 'bg-emerald-400';
              return (
                <button key={r.name} type="button" onClick={() => setEdit({ categoryName: r.name, limit: String(r.limit).replace('.', ',') })} className="w-full p-4 text-left active:bg-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <CategoryIcon name={r.name} size="sm" />
                    <span className="flex-1 text-sm font-semibold text-white truncate">{r.name}</span>
                    <span className={`text-xs font-bold ${over ? 'text-rose-300' : 'text-slate-400'}`}>{r.pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mt-3">
                    <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(100, r.pct)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span><Money value={r.spent} className="text-slate-300 font-semibold" /> de <Money value={r.limit} /></span>
                    <span className={over ? 'text-rose-300' : ''}>{over ? 'passou ' : 'restam '}<Money value={Math.abs(r.limit - r.spent)} /></span>
                  </div>
                </button>
              );
            })}
          </Panel>
        )}
      </section>

      {withoutBudget.length > 0 && (
        <section>
          <SectionTitle>Sem limite definido</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {withoutBudget.map(r => (
              <button key={r.name} type="button" onClick={() => setEdit({ categoryName: r.name, limit: '' })}
                className="h-10 pl-1.5 pr-3 rounded-2xl border border-dashed border-white/10 flex items-center gap-2 text-[13px] text-slate-400">
                <CategoryIcon name={r.name} size="sm" /> {r.name} <Plus size={14} />
              </button>
            ))}
          </div>
        </section>
      )}

      <Sheet open={!!edit} onClose={() => setEdit(null)} title="Limite mensal"
        footer={<PrimaryButton type="button" disabled={!edit?.categoryName || parseAmount(edit?.limit) <= 0} onClick={async () => { await saveBudget({ categoryName: edit.categoryName, limitAmount: parseAmount(edit.limit) }); setEdit(null); }}>Salvar limite</PrimaryButton>}>
        {edit && (
          <div className="space-y-4">
            <Field label="Categoria"><Select value={edit.categoryName} onChange={v => setEdit(e => ({ ...e, categoryName: v }))} options={expenseOptions} /></Field>
            <Field label="Quanto quer gastar por mês"><input autoFocus inputMode="decimal" className={inputClass} placeholder="Ex: 1.500,00" value={edit.limit} onChange={e => setEdit(x => ({ ...x, limit: e.target.value }))} /></Field>
          </div>
        )}
      </Sheet>
    </div>
  );
}
