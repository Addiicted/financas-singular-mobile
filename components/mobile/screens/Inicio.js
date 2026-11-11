// components/mobile/screens/Inicio.js
'use client';

import React from 'react';
import {
  ArrowDownRight, ArrowUpRight, CreditCard, Check, Plus, Wallet, Sparkles,
  AlertTriangle, PiggyBank, Flame, CalendarClock, HandCoins, ChevronRight,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { useMonthData, useMonthSeries, useInsights } from '../data';
import { CashFlowChart } from '../charts';
import { useQuickActions } from '../actions';
import {
  Money, Panel, SectionTitle, CategoryIcon, Ring, useCategoryStyle,
  monthKey, shortDate, MONTHS, todayISO,
} from '../ui';

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MONTHS_LOWER = MONTHS.map(m => m.toLowerCase());

const TONE = {
  rose: 'from-rose-500/20 to-rose-500/5 border-rose-400/20 text-rose-300',
  emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-400/20 text-emerald-300',
  amber: 'from-amber-400/20 to-amber-400/5 border-amber-300/20 text-amber-300',
  indigo: 'from-indigo-500/20 to-indigo-500/5 border-indigo-400/20 text-indigo-300',
  purple: 'from-purple-500/20 to-purple-500/5 border-purple-400/20 text-purple-300',
};
const ICONS = { savings: PiggyBank, top: Flame, closing: CalendarClock, receive: HandCoins };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export default function Inicio({ setMonth, go, onOpenTx }) {
  // O Início mostra sempre o mês atual (o seletor de mês fica no Extrato)
  const now = new Date();
  const month = { y: now.getFullYear(), m: now.getMonth() + 1 };
  const { metrics, accounts, cards, getAccountBalance, getInvoiceData, entityType, setExtratoFilterType } = useFinancial();
  const { list, totals, categorySpending, categoryTotal } = useMonthData(month);
  const series = useMonthSeries(month, 6);
  const { items: insights, overdue } = useInsights(month);
  const { togglePaid } = useQuickActions();
  const styleFor = useCategoryStyle();
  const key = monthKey(month);
  const today = todayISO();

  const pending = list
    .filter(t => t.status === 'pending' && t.type === 'expense' && (t.date || '') >= today)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .slice(0, 4);
  // Últimos = o que já aconteceu (contas futuras aparecem em "A pagar")
  const recent = list.filter(t => !t.isSynthesized && (t.date || '') <= today).slice(0, 5);

  const heroGradient = entityType === 'PF'
    ? 'from-indigo-600 via-indigo-700 to-violet-800'
    : 'from-emerald-600 via-emerald-700 to-teal-800';

  const openExtrato = (type, opts) => { setExtratoFilterType(type); go('extrato', opts); };
  const onInsight = (i) => {
    if (i.kind === 'top') go('extrato', { category: i.category });
    if (i.kind === 'closing') go('cartoes', { cardId: i.cardId });
    if (i.kind === 'receive') openExtrato('income');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between px-1">
        <div>
          <p className="text-[13px] text-slate-500">{WEEKDAYS[now.getDay()]}, {now.getDate()} de {MONTHS_LOWER[now.getMonth()]}</p>
          <p className="text-lg font-bold text-white">{greeting()} 👋</p>
        </div>
      </div>

      {/* Saldo principal */}
      <div className={`relative overflow-hidden rounded-[28px] p-5 bg-gradient-to-br ${heroGradient} shadow-xl shadow-black/40`}>
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-6 -bottom-16 w-40 h-40 rounded-full bg-black/20 blur-2xl" />
        <div className="relative">
          <p className="text-[13px] font-medium text-white/70">Saldo em contas</p>
          <Money value={metrics.realBalance} className="block text-[34px] leading-tight font-extrabold text-white mt-1" />
          <div className="mt-4 flex items-center gap-3 bg-black/15 rounded-2xl px-3.5 py-2.5">
            <Sparkles size={16} className="text-white/70 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/60 leading-tight">Previsto após contas e faturas</p>
              <Money value={metrics.projectedBalance} className="block text-[15px] font-bold text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Entradas e saídas do mês */}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="text-left active:scale-[0.98] transition" onClick={() => openExtrato('income')}>
          <Panel className="p-4 h-full">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center mb-3"><ArrowUpRight size={18} /></div>
            <p className="text-xs text-slate-500 font-medium">Receitas</p>
            <Money value={totals.incomeAll} className="block text-[17px] font-bold text-emerald-300 mt-0.5" />
            {totals.pendingIncome > 0 && <p className="text-[11px] text-slate-500 mt-1">a receber <Money value={totals.pendingIncome} /></p>}
          </Panel>
        </button>
        <button type="button" className="text-left active:scale-[0.98] transition" onClick={() => openExtrato('expense')}>
          <Panel className="p-4 h-full">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-300 flex items-center justify-center mb-3"><ArrowDownRight size={18} /></div>
            <p className="text-xs text-slate-500 font-medium">Despesas</p>
            <Money value={totals.expenseAll} className="block text-[17px] font-bold text-rose-300 mt-0.5" />
            {totals.pendingExpense > 0 && <p className="text-[11px] text-slate-500 mt-1">a pagar <Money value={totals.pendingExpense} /></p>}
          </Panel>
        </button>
      </div>

      {/* Contas atrasadas */}
      {overdue.length > 0 && (
        <section className="rounded-3xl border border-rose-400/25 bg-rose-500/[0.07] overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
            <AlertTriangle size={16} className="text-rose-300" />
            <p className="flex-1 text-sm font-bold text-rose-200">{overdue.length} conta{overdue.length > 1 ? 's' : ''} atrasada{overdue.length > 1 ? 's' : ''}</p>
            <Money value={overdue.reduce((s, t) => s + Number(t.amount || 0), 0)} className="text-sm font-bold text-rose-200" />
          </div>
          <div className="divide-y divide-rose-400/10">
            {overdue.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                <button type="button" className="flex-1 min-w-0 text-left" onClick={() => onOpenTx(t)}>
                  <p className="text-sm font-semibold text-white truncate">{t.desc}</p>
                  <p className="text-xs text-rose-300/80">venceu {shortDate(t.date)}</p>
                </button>
                <Money value={t.amount} className="text-sm font-bold text-white" />
                <button type="button" aria-label={`Marcar ${t.desc} como pago`} onClick={() => togglePaid(t)}
                  className="w-9 h-9 rounded-full border border-rose-300/30 flex items-center justify-center text-rose-200 active:bg-emerald-500/30">
                  <Check size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dicas */}
      {insights.filter(i => i.kind !== 'overdue').length > 0 && (
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x scroll-px-4 -mx-4 px-4">
          {insights.filter(i => i.kind !== 'overdue').map(i => {
            const Icon = ICONS[i.kind] || Sparkles;
            return (
              <button key={i.id} type="button" onClick={() => onInsight(i)}
                className={`snap-start flex-shrink-0 w-[72%] max-w-[280px] text-left rounded-3xl border bg-gradient-to-br p-4 ${TONE[i.tone] || TONE.indigo}`}>
                <div className="flex items-center gap-2">
                  <Icon size={16} />
                  <p className="text-[13px] font-bold truncate">{i.title}</p>
                </div>
                <p className="text-xl font-extrabold text-white mt-2">
                  {i.percent !== undefined ? `${i.percent.toFixed(0)}%` : <Money value={i.value} />}
                </p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{i.text}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Fluxo dos últimos meses */}
      <section>
        <SectionTitle>Entradas x saídas</SectionTitle>
        <Panel className="p-4">
          <CashFlowChart series={series} selected={month} onSelect={(m) => { setMonth(m); go('extrato'); }} />
        </Panel>
      </section>

      {/* Contas */}
      <section>
        <SectionTitle action="Gerenciar" onAction={() => go('configuracoes', { tab: 'contas' })}>Contas</SectionTitle>
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x scroll-px-4 -mx-4 px-4 pb-1">
          {accounts.map(a => (
            <Panel key={a.id} className="snap-start flex-shrink-0 w-[44%] min-w-[150px] p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-7 h-7 rounded-xl ${a.color || 'bg-slate-600'} flex items-center justify-center text-[11px] font-bold text-white`}>{(a.name || '?')[0]}</span>
                <span className="text-[13px] font-semibold text-slate-300 truncate">{a.name}</span>
              </div>
              <Money value={getAccountBalance(a.id)} className="block text-base font-bold text-white" />
            </Panel>
          ))}
          <button type="button" onClick={() => go('configuracoes', { tab: 'contas' })} className="snap-start flex-shrink-0 w-28 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-1 text-slate-500 text-xs font-semibold">
            <Plus size={18} /> Nova conta
          </button>
        </div>
      </section>

      {/* Cartões */}
      {cards.length > 0 ? (
        <section>
          <SectionTitle action="Ver faturas" onAction={() => go('cartoes')}>Cartões</SectionTitle>
          <Panel className="divide-y divide-white/[0.05]">
            {cards.map(c => {
              const inv = getInvoiceData(c.id, key);
              const value = inv.status === 'paga' ? 0 : inv.finalAmount;
              const pct = c.limitTotal ? (value / c.limitTotal) * 100 : 0;
              return (
                <button key={c.id} type="button" onClick={() => go('cartoes', { cardId: c.id })} className="w-full flex items-center gap-3 p-4 text-left active:bg-white/[0.03]">
                  <Ring percent={pct} size={46} stroke={5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                    <p className="text-xs text-slate-500">
                      {inv.status === 'paga' ? 'Fatura paga' : inv.status === 'fechada' ? `Fechada · vence dia ${c.dueDay}` : `Aberta · fecha dia ${c.closingDay}`}
                    </p>
                  </div>
                  <Money value={inv.finalAmount} className={`text-sm font-bold ${inv.status === 'paga' ? 'text-emerald-300' : 'text-white'}`} />
                </button>
              );
            })}
          </Panel>
        </section>
      ) : (
        <button type="button" onClick={() => go('cartoes')} className="w-full">
          <Panel className="p-4 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-300 flex items-center justify-center"><CreditCard size={18} /></div>
            <div className="flex-1"><p className="text-sm font-semibold text-white">Adicione seu cartão</p><p className="text-xs text-slate-500">Acompanhe faturas e limite</p></div>
            <ChevronRight size={16} className="text-slate-600" />
          </Panel>
        </button>
      )}

      {/* Próximas contas */}
      {pending.length > 0 && (
        <section>
          <SectionTitle action="Todas" onAction={() => openExtrato('pending')}>Próximas contas</SectionTitle>
          <Panel className="divide-y divide-white/[0.05]">
            {pending.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3.5">
                <CategoryIcon name={t.category} isInvoice={t.isInvoicePayment} size="sm" />
                <button type="button" className="flex-1 min-w-0 text-left" onClick={() => t.isSynthesized ? go('cartoes', { cardId: t.cardId }) : onOpenTx(t)}>
                  <p className="text-sm font-semibold text-white truncate">{t.desc}</p>
                  <p className="text-xs text-amber-300/80">{t.date === today ? 'vence hoje' : `vence ${shortDate(t.date)}`}</p>
                </button>
                <Money value={t.amount} className="text-sm font-bold text-white" />
                {!t.isSynthesized && (
                  <button type="button" aria-label={`Marcar ${t.desc} como pago`} onClick={() => togglePaid(t)}
                    className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-slate-500 active:bg-emerald-500/20 active:text-emerald-300">
                    <Check size={15} />
                  </button>
                )}
              </div>
            ))}
          </Panel>
        </section>
      )}

      {/* Gastos por categoria */}
      <section>
        <SectionTitle action="Metas" onAction={() => go('metas')}>Gastos por categoria</SectionTitle>
        <Panel className="p-4">
          {categorySpending.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Nenhum gasto neste mês.</p>
          ) : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-3">
                {categorySpending.map(c => (
                  <div key={c.name} className={styleFor(c.name).bar} style={{ width: `${c.percent}%` }} />
                ))}
              </div>
              <div className="-mx-2">
                {categorySpending.slice(0, 6).map(c => (
                  <button key={c.name} type="button" onClick={() => go('extrato', { category: c.name })}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-2xl text-left active:bg-white/[0.04]">
                    <CategoryIcon name={c.name} size="sm" />
                    <span className="flex-1 text-sm text-slate-300 truncate">{c.name}</span>
                    <span className="text-xs text-slate-500 tabular-nums">{c.percent.toFixed(0)}%</span>
                    <Money value={c.value} className="text-sm font-semibold text-white w-24 text-right" />
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-500 border-t border-white/[0.05] mt-3 pt-3">
                <span>Total gasto (contas + cartões)</span>
                <Money value={categoryTotal} className="font-semibold text-slate-300" />
              </div>
            </>
          )}
        </Panel>
      </section>

      {/* Últimos lançamentos */}
      <section>
        <SectionTitle action="Extrato" onAction={() => openExtrato('ALL')}>Últimos lançamentos</SectionTitle>
        <Panel className="divide-y divide-white/[0.05]">
          {recent.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-500 flex flex-col items-center gap-2"><Wallet size={20} /> Nada lançado neste mês.</div>
          )}
          {recent.map(t => (
            <button key={t.id} type="button" onClick={() => onOpenTx(t)} className="w-full flex items-center gap-3 p-3.5 text-left active:bg-white/[0.03]">
              <CategoryIcon name={t.category} isInvoice={t.isInvoicePayment} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{t.desc}</p>
                <p className="text-xs text-slate-500 truncate">{t.category} · {shortDate(t.date)}</p>
              </div>
              <Money
                value={t.type === 'expense' ? -t.amount : t.amount}
                sign={t.type !== 'transfer'}
                className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-300' : t.type === 'expense' ? 'text-white' : 'text-slate-400'}`}
              />
            </button>
          ))}
        </Panel>
      </section>
    </div>
  );
}
