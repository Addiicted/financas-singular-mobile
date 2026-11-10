// components/mobile/screens/Ajustes.js
// Contas, cartões e categorias do perfil atual (PF ou PJ).
'use client';

import React, { useState } from 'react';
import { Plus, ChevronRight, Landmark, CreditCard, Tag } from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { Money, Panel, Segmented, CategoryIcon, EmptyState } from '../ui';
import { AccountSheet, CardSheet, CategorySheet } from '../forms';

function AddButton({ label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="w-full h-12 rounded-2xl border border-dashed border-white/15 text-sm font-semibold text-slate-300 flex items-center justify-center gap-2 active:bg-white/[0.04]">
      <Plus size={16} /> {label}
    </button>
  );
}

function Contas() {
  const { accounts, getAccountBalance } = useFinancial();
  const [sheet, setSheet] = useState(null); // { editing }
  const total = accounts.reduce((a, c) => a + getAccountBalance(c.id), 0);

  return (
    <div className="space-y-4">
      {accounts.length === 0 ? (
        <EmptyState icon={Landmark} title="Nenhuma conta" text="Cadastre suas contas para acompanhar o saldo de cada uma." action="Cadastrar conta" onAction={() => setSheet({ editing: null })} />
      ) : (
        <>
          <div className="flex justify-between items-baseline px-1">
            <span className="text-[13px] text-slate-400">{accounts.length} conta{accounts.length > 1 ? 's' : ''}</span>
            <span className="text-[13px] text-slate-400">Total <Money value={total} className="font-bold text-white" /></span>
          </div>
          <Panel className="divide-y divide-white/[0.05]">
            {accounts.map(a => (
              <button key={a.id} type="button" onClick={() => setSheet({ editing: a })} className="w-full flex items-center gap-3 p-4 text-left active:bg-white/[0.03]">
                <span className={`w-10 h-10 rounded-2xl ${a.color || 'bg-slate-600'} flex items-center justify-center font-bold text-white flex-shrink-0`}>{(a.name || '?')[0].toUpperCase()}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{a.name}</p>
                  <p className="text-xs text-slate-500 truncate">{a.bank || '—'} · inicial <Money value={a.initialBalance} /></p>
                </div>
                <Money value={getAccountBalance(a.id)} className="text-sm font-bold text-white" />
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            ))}
          </Panel>
          <AddButton label="Nova conta" onClick={() => setSheet({ editing: null })} />
        </>
      )}
      <AccountSheet open={!!sheet} onClose={() => setSheet(null)} editing={sheet?.editing || null} />
    </div>
  );
}

function Cartoes() {
  const { cards, accounts } = useFinancial();
  const [sheet, setSheet] = useState(null);

  return (
    <div className="space-y-4">
      {cards.length === 0 ? (
        <EmptyState icon={CreditCard} title="Nenhum cartão" text="Cadastre seus cartões para controlar faturas e limite." action="Cadastrar cartão" onAction={() => setSheet({ editing: null })} />
      ) : (
        <>
          <Panel className="divide-y divide-white/[0.05]">
            {cards.map(c => (
              <button key={c.id} type="button" onClick={() => setSheet({ editing: c })} className="w-full flex items-center gap-3 p-4 text-left active:bg-white/[0.03]">
                <span className="w-12 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-700 flex items-end justify-end p-1 flex-shrink-0">
                  <span className="text-[8px] font-mono text-white/80">{c.lastDigits || '0000'}</span>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                  <p className="text-xs text-slate-500 truncate">Fecha {c.closingDay} · vence {c.dueDay} · paga com {accounts.find(a => a.id === c.payingAccountId)?.name || '—'}</p>
                </div>
                <Money value={c.limitTotal} className="text-sm font-semibold text-slate-300" />
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            ))}
          </Panel>
          <AddButton label="Novo cartão" onClick={() => setSheet({ editing: null })} />
        </>
      )}
      <CardSheet open={!!sheet} onClose={() => setSheet(null)} editing={sheet?.editing || null} />
    </div>
  );
}

function Categorias() {
  const { categories } = useFinancial();
  const [type, setType] = useState('expense');
  const [sheet, setSheet] = useState(null);
  const list = categories.filter(c => c.type === type);

  return (
    <div className="space-y-4">
      <Segmented value={type} onChange={setType} options={[
        { value: 'expense', label: `Despesas (${categories.filter(c => c.type === 'expense').length})` },
        { value: 'income', label: `Receitas (${categories.filter(c => c.type === 'income').length})` },
      ]} />
      {list.length === 0 ? (
        <EmptyState icon={Tag} title="Nenhuma categoria" text="Crie categorias para organizar seus lançamentos." />
      ) : (
        <Panel className="divide-y divide-white/[0.05]">
          {list.map(c => (
            <button key={c.id} type="button" onClick={() => setSheet({ editing: c })} className="w-full flex items-center gap-3 p-4 text-left active:bg-white/[0.03]">
              <CategoryIcon name={c.name} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                <p className="text-xs text-slate-500 truncate">
                  {c.subcategories?.length ? c.subcategories.slice(0, 3).join(', ') + (c.subcategories.length > 3 ? ` +${c.subcategories.length - 3}` : '') : 'Sem subcategorias'}
                </p>
              </div>
              <ChevronRight size={16} className="text-slate-600" />
            </button>
          ))}
        </Panel>
      )}
      <AddButton label={type === 'expense' ? 'Nova categoria de despesa' : 'Nova categoria de receita'} onClick={() => setSheet({ editing: null })} />
      <CategorySheet open={!!sheet} onClose={() => setSheet(null)} editing={sheet?.editing || null} defaultType={type} />
    </div>
  );
}

export default function Ajustes({ initialTab = 'contas' }) {
  const { entityType } = useFinancial();
  const [tab, setTab] = useState(initialTab);

  return (
    <div className="space-y-5">
      <Segmented value={tab} onChange={setTab} options={[
        { value: 'contas', label: 'Contas' },
        { value: 'cartoes', label: 'Cartões' },
        { value: 'categorias', label: 'Categorias' },
      ]} />
      <p className="text-xs text-slate-500 px-1 -mt-2">
        Mostrando o perfil <b className="text-slate-300">{entityType === 'PF' ? 'Pessoal (PF)' : 'Empresa (PJ)'}</b>. Troque no topo para editar o outro.
      </p>
      {tab === 'contas' && <Contas />}
      {tab === 'cartoes' && <Cartoes />}
      {tab === 'categorias' && <Categorias />}
    </div>
  );
}
