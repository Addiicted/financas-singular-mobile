// components/mobile/screens/Ponte.js
// A Ponte: repasses da empresa (PJ) para a pessoa física (PF).
'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, User, ArrowDown, ShieldCheck, Plus, RefreshCw } from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { Money, Panel, SectionTitle, PrimaryButton, MONTHS, monthKey, shortDate } from '../ui';
import { BridgeSheet } from '../forms';

const isBridge = (t) =>
  t.category === 'Retirada / Pró-labore' ||
  (t.notes || '').toLowerCase().includes('repasse') ||
  (t.desc || '').toLowerCase().includes('pró-labore');

function Side({ Icon, label, value, cls }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/50 border border-white/[0.05]">
      <span className={`w-11 h-11 rounded-2xl ${cls} flex items-center justify-center`}><Icon size={20} /></span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <Money value={value} className="block text-lg font-bold text-white" />
      </div>
    </div>
  );
}

export default function Ponte({ month }) {
  const { rawAccounts, getAccountBalance, transactions, entityType } = useFinancial();
  const [open, setOpen] = useState(false);

  const pj = rawAccounts.filter(a => a.entity === 'PJ');
  const pf = rawAccounts.filter(a => a.entity === 'PF');
  const pjBalance = pj.reduce((s, a) => s + getAccountBalance(a.id), 0);
  const pfBalance = pf.reduce((s, a) => s + getAccountBalance(a.id), 0);

  // O contexto mostra só os lançamentos do perfil atual: na PJ são as saídas, na PF as entradas
  const history = useMemo(() => transactions.filter(isBridge).sort((a, b) => (b.date || '').localeCompare(a.date || '')), [transactions]);
  const key = monthKey(month);
  const monthTotal = history.filter(t => (t.date || '').startsWith(key)).reduce((s, t) => s + Number(t.amount || 0), 0);
  const yearTotal = history.filter(t => (t.date || '').startsWith(String(month.y))).reduce((s, t) => s + Number(t.amount || 0), 0);

  const byMonth = useMemo(() => {
    const groups = [];
    const map = {};
    history.forEach(t => {
      const k = (t.date || '').slice(0, 7);
      if (!map[k]) { map[k] = { key: k, items: [], total: 0 }; groups.push(map[k]); }
      map[k].items.push(t);
      map[k].total += Number(t.amount || 0);
    });
    return groups;
  }, [history]);


  return (
    <div className="space-y-5">
      <Panel className="p-4 space-y-2">
        <Side Icon={Building2} label={`Empresa (PJ) · ${pj.length} conta${pj.length !== 1 ? 's' : ''}`} value={pjBalance} cls="bg-emerald-500/15 text-emerald-300" />
        <div className="flex items-center justify-center gap-2 h-8 text-xs text-slate-500">
          <motion.span animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} className="text-sky-300"><ArrowDown size={16} /></motion.span>
          repasse
        </div>
        <Side Icon={User} label={`Pessoal (PF) · ${pf.length} conta${pf.length !== 1 ? 's' : ''}`} value={pfBalance} cls="bg-indigo-500/15 text-indigo-300" />
      </Panel>

      <div className="grid grid-cols-2 gap-3">
        <Panel className="p-4">
          <p className="text-xs text-slate-500">Repassado em {MONTHS[month.m - 1].toLowerCase()}</p>
          <Money value={monthTotal} className="block text-lg font-bold text-sky-300 mt-0.5" />
        </Panel>
        <Panel className="p-4">
          <p className="text-xs text-slate-500">Total em {month.y}</p>
          <Money value={yearTotal} className="block text-lg font-bold text-white mt-0.5" />
        </Panel>
      </div>

      <PrimaryButton type="button" onClick={() => setOpen(true)} className="flex items-center justify-center gap-2"><Plus size={18} /> Novo repasse</PrimaryButton>

      <section>
        <SectionTitle>Histórico {entityType === 'PJ' ? '(saídas da PJ)' : '(entradas na PF)'}</SectionTitle>
        {byMonth.length === 0 ? (
          <Panel className="p-6 text-center text-sm text-slate-500 flex flex-col items-center gap-2"><RefreshCw size={20} /> Nenhum repasse ainda.</Panel>
        ) : (
          <div className="space-y-4">
            {byMonth.map(g => {
              const [y, m] = g.key.split('-').map(Number);
              return (
                <div key={g.key}>
                  <div className="flex justify-between px-1 mb-2 text-[13px]">
                    <span className="font-semibold text-slate-400">{MONTHS[m - 1]} {y}</span>
                    <Money value={g.total} className="text-slate-500" />
                  </div>
                  <Panel className="divide-y divide-white/[0.05]">
                    {g.items.map(t => (
                      <div key={t.id} className="flex items-center gap-3 p-3.5">
                        <span className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-300 flex items-center justify-center flex-shrink-0"><RefreshCw size={17} /></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{t.desc}</p>
                          <p className="text-xs text-slate-500">{shortDate(t.date)}</p>
                        </div>
                        <Money value={t.amount} className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-300' : 'text-white'}`} />
                      </div>
                    ))}
                  </Panel>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Panel className="p-4 flex gap-3">
        <ShieldCheck size={20} className="text-emerald-300 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">Cada repasse vira uma <b className="text-slate-200">despesa na PJ</b> e uma <b className="text-slate-200">receita na PF</b>. Assim o dinheiro da empresa e o pessoal nunca se misturam.</p>
      </Panel>

      <BridgeSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
