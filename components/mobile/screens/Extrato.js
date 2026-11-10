// components/mobile/screens/Extrato.js
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Clock, Receipt, SlidersHorizontal, CheckCircle2, Trash2, Hand } from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { useMonthData, groupByDay } from '../data';
import { Money, MonthPicker, Panel, CategoryIcon, dayLabel, EmptyState, Sheet, Field, Select, PrimaryButton, Segmented } from '../ui';
import SwipeRow from '../SwipeRow';
import { useQuickActions } from '../actions';

const TYPES = [
  { value: 'ALL', label: 'Tudo' },
  { value: 'income', label: 'Receitas' },
  { value: 'expense', label: 'Despesas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'transfer', label: 'Transf.' },
];

const HINT_KEY = 'mobile-swipe-hint-seen';

function TxRow({ t, accName, onOpen }) {
  return (
    <button type="button" onClick={onOpen} className="w-full flex items-center gap-3 p-3.5 text-left active:bg-white/[0.03]">
      <CategoryIcon name={t.category} isInvoice={t.isInvoicePayment} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{t.desc}</p>
        <p className="text-xs text-slate-500 truncate">
          {t.isSynthesized ? `${t.subcategory} · prevista` : `${t.category}${accName ? ' · ' + accName : ''}`}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <Money
          value={t.type === 'expense' ? -t.amount : t.amount}
          sign={t.type !== 'transfer'}
          className={`block text-sm font-bold ${t.type === 'income' ? 'text-emerald-300' : t.type === 'expense' ? 'text-white' : 'text-slate-400'}`}
        />
        {t.status === 'pending' && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 mt-0.5"><Clock size={10} /> Pendente</span>
        )}
      </div>
    </button>
  );
}

export default function Extrato({ month, setMonth, onOpenTx, go, onNew, initialCategory }) {
  const { accounts, categories, extratoFilterType, setExtratoFilterType } = useFinancial();
  const { list } = useMonthData(month);
  const { togglePaid, removeTx, canDelete, canToggle } = useQuickActions();

  const [type, setType] = useState('ALL');
  const [filters, setFilters] = useState({ account: '', category: initialCategory || '', status: 'ALL' });
  const [draft, setDraft] = useState(filters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Filtro vindo dos atalhos da tela Início
  useEffect(() => {
    if (extratoFilterType && extratoFilterType !== 'ALL') {
      setType(extratoFilterType);
      setExtratoFilterType('ALL');
    }
  }, [extratoFilterType, setExtratoFilterType]);

  // Dica do gesto de deslizar, só na primeira vez
  useEffect(() => {
    try { if (!localStorage.getItem(HINT_KEY)) setShowHint(true); } catch { /* sem armazenamento */ }
  }, []);
  const dismissHint = () => { setShowHint(false); try { localStorage.setItem(HINT_KEY, '1'); } catch { /* ok */ } };

  const filtered = useMemo(() => list.filter(t => {
    if (type === 'pending' && t.status !== 'pending') return false;
    if (!['ALL', 'pending'].includes(type) && t.type !== type) return false;
    if (filters.account && t.accountId !== filters.account) return false;
    if (filters.category && t.category !== filters.category) return false;
    if (filters.status !== 'ALL' && t.status !== filters.status) return false;
    if (query && !(t.desc || '').toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [list, type, filters, query]);

  const sums = useMemo(() => {
    const s = (tp) => filtered.filter(t => t.type === tp).reduce((a, t) => a + Number(t.amount || 0), 0);
    const inc = s('income'), exp = s('expense');
    return { inc, exp, bal: inc - exp };
  }, [filtered]);

  const groups = groupByDay(filtered);
  const accName = (id) => accounts.find(a => a.id === id)?.name || '';
  const activeCount = (filters.account ? 1 : 0) + (filters.category ? 1 : 0) + (filters.status !== 'ALL' ? 1 : 0);
  const chips = [
    filters.account && { key: 'account', label: accName(filters.account) },
    filters.category && { key: 'category', label: filters.category },
    filters.status !== 'ALL' && { key: 'status', label: filters.status === 'paid' ? 'Pagos' : 'Pendentes', reset: 'ALL' },
  ].filter(Boolean);

  const categoryOptions = [...new Set([...categories.map(c => c.name), ...list.map(t => t.category).filter(Boolean)])].map(n => ({ value: n, label: n }));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <MonthPicker month={month} onChange={setMonth} className="flex-1" />
        <button type="button" aria-label="Buscar" onClick={() => { setSearchOpen(v => !v); setQuery(''); }}
          className={`w-12 rounded-2xl border border-white/[0.06] flex items-center justify-center ${searchOpen ? 'bg-white/10 text-white' : 'bg-white/[0.04] text-slate-400'}`}>
          {searchOpen ? <X size={18} /> : <Search size={18} />}
        </button>
        <button type="button" aria-label="Filtros" onClick={() => { setDraft(filters); setFilterOpen(true); }}
          className={`relative w-12 rounded-2xl border border-white/[0.06] flex items-center justify-center ${activeCount ? 'bg-white/10 text-white' : 'bg-white/[0.04] text-slate-400'}`}>
          <SlidersHorizontal size={18} />
          {activeCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center">{activeCount}</span>}
        </button>
      </div>

      {searchOpen && (
        <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar lançamento..."
          className="w-full h-12 px-4 rounded-2xl bg-slate-900 border border-white/[0.08] text-base text-white placeholder:text-slate-600 focus:outline-none" />
      )}

      {/* Resumo */}
      <Panel className="grid grid-cols-3 divide-x divide-white/[0.05] py-3">
        {[
          ['Entradas', sums.inc, 'text-emerald-300'],
          ['Saídas', sums.exp, 'text-rose-300'],
          ['Resultado', sums.bal, sums.bal >= 0 ? 'text-white' : 'text-rose-300'],
        ].map(([label, v, cls]) => (
          <div key={label} className="px-2 text-center min-w-0">
            <p className="text-[11px] text-slate-500 font-medium">{label}</p>
            <Money value={v} className={`block text-[13px] font-bold mt-0.5 truncate ${cls}`} />
          </div>
        ))}
      </Panel>

      {/* Tipo */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {TYPES.map(f => (
          <button key={f.value} type="button" onClick={() => setType(f.value)} aria-pressed={type === f.value}
            className={`flex-shrink-0 h-9 px-4 rounded-full text-[13px] font-semibold border transition ${type === f.value ? 'bg-white text-slate-950 border-white' : 'border-white/[0.08] text-slate-400'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Filtros ativos */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map(c => (
            <button key={c.key} type="button" onClick={() => setFilters(f => ({ ...f, [c.key]: c.reset ?? '' }))}
              className="h-8 pl-3 pr-2 rounded-xl bg-indigo-500/15 border border-indigo-400/25 text-xs font-semibold text-indigo-200 flex items-center gap-1.5">
              {c.label} <X size={13} />
            </button>
          ))}
          <button type="button" onClick={() => setFilters({ account: '', category: '', status: 'ALL' })} className="h-8 px-2 text-xs font-semibold text-slate-500">Limpar</button>
        </div>
      )}

      {showHint && groups.length > 0 && (
        <button type="button" onClick={dismissHint} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-sky-500/10 border border-sky-400/20 text-left">
          <Hand size={18} className="text-sky-300 flex-shrink-0" />
          <span className="flex-1 text-xs text-sky-100">Deslize um lançamento: <b>→ direita</b> marca como pago, <b>← esquerda</b> exclui.</span>
          <X size={15} className="text-sky-300/70" />
        </button>
      )}

      {/* Lista agrupada por dia */}
      {groups.length === 0 ? (
        <EmptyState icon={Receipt} title="Nenhum lançamento"
          text={query || activeCount ? 'Nada encontrado com esses filtros.' : 'Nada por aqui neste mês.'}
          action={query || activeCount ? null : 'Adicionar lançamento'} onAction={onNew} />
      ) : (
        <div className="space-y-4">
          {groups.map(g => (
            <section key={g.date}>
              <div className="sticky top-[calc(env(safe-area-inset-top)+56px)] z-10 -mx-4 px-5 py-2 bg-slate-950/90 backdrop-blur-md flex justify-between items-baseline">
                <h3 className="text-[13px] font-semibold text-slate-300">{dayLabel(g.date)}</h3>
                <Money value={g.total} sign className="text-xs font-semibold text-slate-500" />
              </div>
              <Panel className="divide-y divide-white/[0.05] overflow-hidden">
                {g.items.map(t => (
                  <SwipeRow
                    key={t.id}
                    disabled={t.isSynthesized}
                    onSwipeRight={canToggle(t) ? () => { dismissHint(); togglePaid(t); } : null}
                    rightLabel={t.status === 'paid' ? 'Pendente' : t.type === 'income' ? 'Recebido' : 'Pago'}
                    RightIcon={t.status === 'paid' ? Clock : CheckCircle2}
                    rightClass={t.status === 'paid' ? 'bg-amber-600' : 'bg-emerald-600'}
                    onSwipeLeft={canDelete(t) ? () => { dismissHint(); removeTx(t); } : null}
                    leftLabel="Excluir"
                    LeftIcon={Trash2}
                  >
                    <TxRow t={t} accName={accName(t.accountId)} onOpen={() => t.isSynthesized ? go('cartoes', { cardId: t.cardId }) : onOpenTx(t)} />
                  </SwipeRow>
                ))}
              </Panel>
            </section>
          ))}
        </div>
      )}

      {/* Painel de filtros */}
      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filtros"
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setDraft({ account: '', category: '', status: 'ALL' })} className="h-12 px-5 rounded-2xl bg-white/[0.06] font-semibold text-slate-300">Limpar</button>
            <PrimaryButton type="button" onClick={() => { setFilters(draft); setFilterOpen(false); }}>Aplicar filtros</PrimaryButton>
          </div>
        }>
        <div className="space-y-4">
          <Field label="Conta"><Select value={draft.account} onChange={v => setDraft(d => ({ ...d, account: v }))} options={accounts.map(a => ({ value: a.id, label: a.name }))} placeholder="Todas as contas" /></Field>
          <Field label="Categoria"><Select value={draft.category} onChange={v => setDraft(d => ({ ...d, category: v }))} options={categoryOptions} placeholder="Todas as categorias" /></Field>
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Situação</span>
            <Segmented value={draft.status} onChange={v => setDraft(d => ({ ...d, status: v }))} options={[
              { value: 'ALL', label: 'Todos' },
              { value: 'paid', label: 'Pagos' },
              { value: 'pending', label: 'Pendentes' },
            ]} />
          </div>
        </div>
      </Sheet>
    </div>
  );
}
