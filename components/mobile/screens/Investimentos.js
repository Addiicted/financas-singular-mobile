// components/mobile/screens/Investimentos.js
'use client';

import React, { useState } from 'react';
import { TrendingUp, Trash2 } from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { Money, Panel, Sheet, Field, Select, PrimaryButton, inputClass, parseAmount, SectionTitle, EmptyState } from '../ui';
import { ConfirmSheet } from '../forms';

const TYPES = [
  { value: 'Renda Fixa', label: 'Renda Fixa', color: 'bg-emerald-400' },
  { value: 'Ações', label: 'Ações', color: 'bg-indigo-400' },
  { value: 'FIIs', label: 'Fundos Imobiliários', color: 'bg-amber-400' },
  { value: 'Cripto', label: 'Cripto', color: 'bg-orange-400' },
  { value: 'Internacional', label: 'Internacional', color: 'bg-sky-400' },
];
const colorOf = (type) => TYPES.find(t => t.value === type)?.color || 'bg-slate-400';

export default function Investimentos() {
  const { investments, addInvestment, updateInvestment, deleteInvestment } = useFinancial();
  const [form, setForm] = useState(null); // { id?, name, type, investedAmount, currentAmount }
  const [confirm, setConfirm] = useState(null);

  const invested = investments.reduce((a, i) => a + i.investedAmount, 0);
  const current = investments.reduce((a, i) => a + i.currentAmount, 0);
  const gain = current - invested;
  const gainPct = invested ? (gain / invested) * 100 : 0;

  const byType = TYPES.map(t => ({ ...t, value: investments.filter(i => i.type === t.value).reduce((a, i) => a + i.currentAmount, 0) }))
    .filter(t => t.value > 0);
  const other = current - byType.reduce((a, t) => a + t.value, 0);
  if (other > 0.009) byType.push({ label: 'Outros', color: 'bg-slate-400', value: other });

  const openNew = () => setForm({ name: '', type: 'Renda Fixa', investedAmount: '', currentAmount: '' });
  const save = async () => {
    const payload = { name: form.name.trim(), type: form.type, investedAmount: parseAmount(form.investedAmount), currentAmount: parseAmount(form.currentAmount || form.investedAmount) };
    if (form.id) await updateInvestment(form.id, payload); else await addInvestment(payload);
    setForm(null);
  };

  if (investments.length === 0 && !form) {
    return <EmptyState icon={TrendingUp} title="Nenhum investimento" text="Registre seus investimentos e acompanhe a rentabilidade." action="Adicionar investimento" onAction={openNew} />;
  }

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <p className="text-[13px] text-slate-400">Patrimônio investido</p>
        <Money value={current} className="block text-[30px] font-extrabold text-white leading-tight" />
        <div className="flex items-center gap-2 mt-1 text-sm">
          <span className={`font-bold ${gain >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            <Money value={gain} sign /> ({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}%)
          </span>
          <span className="text-slate-500">sobre <Money value={invested} /></span>
        </div>

        {byType.length > 0 && (
          <>
            <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 mt-5">
              {byType.map(t => <div key={t.label} className={t.color} style={{ width: `${(t.value / current) * 100}%` }} />)}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
              {byType.map(t => (
                <div key={t.label} className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${t.color}`} />
                  <span className="text-slate-400 truncate flex-1">{t.label}</span>
                  <span className="text-slate-300 font-semibold">{((t.value / current) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Panel>

      <section>
        <SectionTitle action="Adicionar" onAction={openNew}>Ativos</SectionTitle>
        <Panel className="divide-y divide-white/[0.05]">
          {investments.map(i => {
            const g = i.currentAmount - i.investedAmount;
            const p = i.investedAmount ? (g / i.investedAmount) * 100 : 0;
            return (
              <button key={i.id} type="button" onClick={() => setForm({ ...i, investedAmount: String(i.investedAmount).replace('.', ','), currentAmount: String(i.currentAmount).replace('.', ',') })}
                className="w-full flex items-center gap-3 p-4 text-left active:bg-white/[0.03]">
                <span className={`w-1.5 h-10 rounded-full ${colorOf(i.type)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{i.name}</p>
                  <p className="text-xs text-slate-500">{i.type}</p>
                </div>
                <div className="text-right">
                  <Money value={i.currentAmount} className="block text-sm font-bold text-white" />
                  <span className={`text-xs font-semibold ${g >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{p >= 0 ? '+' : ''}{p.toFixed(1)}%</span>
                </div>
              </button>
            );
          })}
        </Panel>
      </section>

      <Sheet open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Editar investimento' : 'Novo investimento'}
        footer={<PrimaryButton type="button" disabled={!form?.name?.trim() || parseAmount(form?.investedAmount) <= 0} onClick={save}>Salvar</PrimaryButton>}>
        {form && (
          <div className="space-y-4">
            <Field label="Nome"><input className={inputClass} placeholder="Ex: Tesouro Selic 2029" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
            <Field label="Tipo"><Select value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={TYPES} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor aplicado"><input inputMode="decimal" className={inputClass} placeholder="0,00" value={form.investedAmount} onChange={e => setForm(f => ({ ...f, investedAmount: e.target.value }))} /></Field>
              <Field label="Valor atual"><input inputMode="decimal" className={inputClass} placeholder="0,00" value={form.currentAmount} onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))} /></Field>
            </div>
            {form.id && (
              <button type="button" onClick={() => setConfirm({ id: form.id, name: form.name })} className="w-full h-12 rounded-2xl bg-rose-500/15 text-rose-300 font-semibold flex items-center justify-center gap-2">
                <Trash2 size={16} /> Excluir investimento
              </button>
            )}
          </div>
        )}
      </Sheet>

      <ConfirmSheet open={!!confirm} onClose={() => setConfirm(null)} title="Excluir investimento?" text={`"${confirm?.name}" será removido da carteira.`} confirmLabel="Excluir" danger
        onConfirm={async () => { await deleteInvestment(confirm.id); setForm(null); }} />
    </div>
  );
}
