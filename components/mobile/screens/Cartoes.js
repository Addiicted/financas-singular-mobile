// components/mobile/screens/Cartoes.js
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CreditCard, Plus, Lock, Unlock, RotateCcw, CheckCircle2, Trash2, ShoppingBag, Pencil } from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { formatCurrency } from '@/utils/formatters';
import {
  Money, MonthPicker, Panel, CategoryIcon, Ring, Sheet, Field, Select, PrimaryButton,
  EmptyState, inputClass, monthKey, shortDate, todayISO, parseAmount, SectionTitle, shiftMonth, MONTHS_SHORT,
} from '../ui';
import { CardExpenseSheet, CardSheet, ConfirmSheet } from '../forms';
import SwipeRow from '../SwipeRow';
import { useQuickActions } from '../actions';
import { useToast, haptic } from '../feedback';

const CARD_GRADIENTS = [
  'from-violet-600 via-purple-700 to-fuchsia-800',
  'from-slate-700 via-slate-800 to-zinc-900',
  'from-sky-600 via-blue-700 to-indigo-800',
  'from-orange-500 via-rose-600 to-pink-700',
  'from-emerald-600 via-teal-700 to-cyan-800',
];

// Largura de um cartão no carrossel + espaço entre eles (gap-3 = 12px)
const slideWidth = (el) => (el.children[0]?.offsetWidth || el.clientWidth) + 12;

const STATUS = {
  aberta: { label: 'Aberta', cls: 'bg-sky-400/15 text-sky-300' },
  fechada: { label: 'Fechada', cls: 'bg-amber-400/15 text-amber-300' },
  paga: { label: 'Paga', cls: 'bg-emerald-400/15 text-emerald-300' },
};

export default function Cartoes({ month, setMonth, focusCardId }) {
  const {
    cards, accounts, cardExpenses, getInvoiceData, closeInvoice, reopenInvoice,
    payInvoice, revertInvoicePayment,
  } = useFinancial();
  const { removeCardExpense } = useQuickActions();
  const toast = useToast();
  const [editCard, setEditCard] = useState(null);

  const [index, setIndex] = useState(0);
  const scroller = useRef(null);
  const [sheet, setSheet] = useState(null); // 'expense' | 'card' | 'close' | 'pay'
  const [confirm, setConfirm] = useState(null);
  const [closeValue, setCloseValue] = useState('');
  const [payForm, setPayForm] = useState({ accountId: '', date: todayISO() });
  const [expenseDetail, setExpenseDetail] = useState(null);

  // Abre direto no cartão escolhido na tela Início
  useEffect(() => {
    if (!focusCardId) return;
    const i = cards.findIndex(c => c.id === focusCardId);
    if (i >= 0) {
      setIndex(i);
      requestAnimationFrame(() => {
        const el = scroller.current;
        if (el) el.scrollTo({ left: i * slideWidth(el), behavior: 'instant' });
      });
    }
  }, [focusCardId, cards]);

  const card = cards[Math.min(index, cards.length - 1)];
  const key = monthKey(month);
  const inv = card ? getInvoiceData(card.id, key) : null;
  const expenses = useMemo(
    () => (card ? cardExpenses.filter(e => e.cardId === card.id && e.invoiceMonthYear === key).sort((a, b) => (b.date || '').localeCompare(a.date || '')) : []),
    [cardExpenses, card, key]
  );

  if (cards.length === 0) {
    return (
      <>
        <EmptyState icon={CreditCard} title="Nenhum cartão ainda" text="Cadastre seu cartão para acompanhar faturas, parcelas e limite." action="Cadastrar cartão" onAction={() => setSheet('card')} />
        <CardSheet open={sheet === 'card'} onClose={() => setSheet(null)} />
      </>
    );
  }

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / slideWidth(el));
    if (i !== index && i >= 0 && i < cards.length) setIndex(i);
  };

  const used = inv && inv.status !== 'paga' ? inv.finalAmount : 0;
  const pct = card?.limitTotal ? (used / card.limitTotal) * 100 : 0;
  const status = STATUS[inv?.status] || STATUS.aberta;

  return (
    <div className="space-y-5">
      {/* Carrossel de cartões */}
      <div ref={scroller} onScroll={onScroll} className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-4 -mx-4 px-4">
        {cards.map((c, i) => (
          <div key={c.id} className={`snap-center flex-shrink-0 w-[86%] aspect-[1.6] rounded-[26px] p-5 bg-gradient-to-br ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]} relative overflow-hidden shadow-xl shadow-black/40 transition ${i === index ? 'opacity-100' : 'opacity-60 scale-[0.97]'}`}>
            <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-white/10" />
            <div className="absolute right-10 -bottom-16 w-40 h-40 rounded-full bg-white/5" />
            <div className="relative h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="font-bold text-white text-lg leading-tight">{c.name}</p>
                <button type="button" aria-label={`Editar ${c.name}`} onClick={() => setEditCard(c)} className="w-9 h-9 -mr-1 -mt-1 rounded-xl bg-white/15 flex items-center justify-center text-white active:bg-white/25"><Pencil size={15} /></button>
              </div>
              <div>
                <p className="text-white/60 text-xs">Limite total</p>
                <Money value={c.limitTotal} className="text-white font-bold" />
                <p className="text-white/80 font-mono tracking-[0.2em] text-sm mt-2">•••• {c.lastDigits || '0000'}</p>
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setSheet('card')} className="snap-center flex-shrink-0 w-[40%] rounded-[26px] border border-dashed border-white/15 flex flex-col items-center justify-center gap-2 text-slate-500 text-sm font-semibold">
          <Plus size={22} /> Novo cartão
        </button>
      </div>

      {cards.length > 1 && (
        <div className="flex justify-center gap-1.5 -mt-2">
          {cards.map((c, i) => <span key={c.id} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/20'}`} />)}
        </div>
      )}

      <MonthPicker month={month} onChange={setMonth} />

      {/* Resumo da fatura */}
      <Panel className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[13px] text-slate-400 font-medium">Fatura</p>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
            </div>
            <Money value={inv.finalAmount} className="block text-[28px] font-extrabold text-white leading-tight" />
            <p className="text-xs text-slate-500 mt-1">Fecha dia {card.closingDay} · Vence dia {card.dueDay}</p>
          </div>
          <Ring percent={pct} size={64} stroke={6} />
        </div>

        <div className="mt-4">
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div className={`h-full rounded-full ${pct > 85 ? 'bg-rose-400' : pct > 60 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span className="text-slate-500">Disponível <Money value={Math.max(0, card.limitTotal - used)} className="text-slate-300 font-semibold" /></span>
            <span className="text-slate-500">de <Money value={card.limitTotal} /></span>
          </div>
        </div>

        {/* Ações da fatura */}
        <div className="grid grid-cols-2 gap-2 mt-5">
          {inv.status === 'aberta' && (
            <>
              <button type="button" onClick={() => setSheet('expense')} className="h-11 rounded-2xl bg-white/[0.06] text-sm font-semibold text-white flex items-center justify-center gap-2"><Plus size={16} /> Compra</button>
              <button type="button" disabled={inv.rawSum <= 0} onClick={() => { setCloseValue(String(inv.rawSum.toFixed(2)).replace('.', ',')); setSheet('close'); }} className="h-11 rounded-2xl bg-amber-400/15 text-amber-200 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"><Lock size={15} /> Fechar fatura</button>
            </>
          )}
          {inv.status === 'fechada' && (
            <>
              <button type="button" onClick={() => setConfirm({ title: 'Reabrir fatura?', text: 'A fatura volta a aceitar compras e o valor ajustado é descartado.', label: 'Reabrir', action: () => reopenInvoice(card.id, key) })} className="h-11 rounded-2xl bg-white/[0.06] text-sm font-semibold text-slate-300 flex items-center justify-center gap-2"><Unlock size={15} /> Reabrir</button>
              <button type="button" onClick={() => { setPayForm({ accountId: inv.payingAccountId || card.payingAccountId || accounts[0]?.id || '', date: todayISO() }); setSheet('pay'); }} className="h-11 rounded-2xl bg-emerald-500/20 text-emerald-200 text-sm font-bold flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Pagar</button>
            </>
          )}
          {inv.status === 'paga' && (
            <button type="button" onClick={() => setConfirm({ title: 'Desfazer pagamento?', text: 'O pagamento é removido do extrato e a fatura volta a ficar fechada.', label: 'Desfazer', danger: true, action: () => revertInvoicePayment(card.id, key) })} className="col-span-2 h-11 rounded-2xl bg-white/[0.06] text-sm font-semibold text-slate-300 flex items-center justify-center gap-2"><RotateCcw size={15} /> Desfazer pagamento</button>
          )}
        </div>
      </Panel>

      {/* Próximas faturas (parcelas já comprometidas) */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map(d => {
          const m = shiftMonth(month, d);
          const v = getInvoiceData(card.id, monthKey(m)).finalAmount;
          return (
            <button key={d} type="button" onClick={() => setMonth(m)} className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-3 text-left active:bg-white/[0.08]">
              <p className="text-[11px] text-slate-500 capitalize">{MONTHS_SHORT[m.m - 1]}/{String(m.y).slice(2)}</p>
              <Money value={v} className={`block text-[13px] font-bold mt-0.5 truncate ${v > 0 ? 'text-white' : 'text-slate-600'}`} />
            </button>
          );
        })}
      </div>

      {/* Compras da fatura */}
      <section>
        <SectionTitle>Compras ({expenses.length})</SectionTitle>
        {expenses.length === 0 ? (
          <Panel className="p-6 text-center text-sm text-slate-500 flex flex-col items-center gap-2"><ShoppingBag size={20} /> Nenhuma compra nesta fatura.</Panel>
        ) : (
          <Panel className="divide-y divide-white/[0.05] overflow-hidden">
            {expenses.map(e => (
              <SwipeRow key={e.id} disabled={inv.status !== 'aberta'} onSwipeLeft={() => removeCardExpense(e)} leftLabel="Excluir" LeftIcon={Trash2}>
              <button type="button" onClick={() => setExpenseDetail(e)} className="w-full flex items-center gap-3 p-3.5 text-left active:bg-white/[0.03]">
                <CategoryIcon name={e.category} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{e.desc}</p>
                  <p className="text-xs text-slate-500 truncate">{shortDate(e.date)} · {e.category}</p>
                </div>
                <div className="text-right">
                  <Money value={e.amount} className="block text-sm font-bold text-white" />
                  {e.installment && e.installment !== 'À vista' && <span className="text-[10px] font-semibold text-purple-300">{e.installment}</span>}
                </div>
              </button>
              </SwipeRow>
            ))}
          </Panel>
        )}
      </section>

      {/* Painéis */}
      <CardExpenseSheet open={sheet === 'expense'} onClose={() => setSheet(null)} defaultCardId={card.id} defaultMonth={month} />
      <CardSheet open={sheet === 'card' || !!editCard} onClose={() => { setSheet(null); setEditCard(null); }} editing={editCard} />

      <Sheet open={sheet === 'close'} onClose={() => setSheet(null)} title="Fechar fatura"
        footer={<PrimaryButton type="button" onClick={async () => { await closeInvoice({ cardId: card.id, invoiceMonthYear: key, finalAmount: parseAmount(closeValue) }); haptic(); toast('Fatura fechada'); setSheet(null); }}>Confirmar fechamento</PrimaryButton>}>
        <p className="text-sm text-slate-400 mb-4">Soma das compras: <b className="text-white">{formatCurrency(inv.rawSum)}</b>. Ajuste se o valor do banco for diferente (juros, IOF, estornos).</p>
        <Field label="Valor final da fatura"><input inputMode="decimal" className={inputClass} value={closeValue} onChange={e => setCloseValue(e.target.value)} /></Field>
      </Sheet>

      <Sheet open={sheet === 'pay'} onClose={() => setSheet(null)} title="Pagar fatura"
        footer={<PrimaryButton type="button" disabled={!payForm.accountId} onClick={async () => { await payInvoice({ cardId: card.id, invoiceMonthYear: key, payingAccountId: payForm.accountId, date: payForm.date, finalAmount: inv.finalAmount }); haptic(); toast('Fatura paga'); setSheet(null); }}>Pagar <Money value={inv.finalAmount} hideable={false} /></PrimaryButton>}>
        <div className="space-y-4">
          <Field label="Pagar com a conta"><Select value={payForm.accountId} onChange={v => setPayForm(f => ({ ...f, accountId: v }))} options={accounts.map(a => ({ value: a.id, label: a.name }))} /></Field>
          <Field label="Data do pagamento"><input type="date" className={inputClass} value={payForm.date} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} /></Field>
        </div>
      </Sheet>

      <Sheet open={!!expenseDetail} onClose={() => setExpenseDetail(null)} title="Compra no cartão">
        {expenseDetail && (
          <div className="space-y-4 pb-2">
            <div className="text-center py-2">
              <CategoryIcon name={expenseDetail.category} />
              <p className="text-white font-bold mt-3">{expenseDetail.desc}</p>
              <Money value={expenseDetail.amount} className="block text-3xl font-extrabold text-white mt-1" />
              <p className="text-xs text-slate-500 mt-1">{expenseDetail.installment} · {shortDate(expenseDetail.date)} · {expenseDetail.category}</p>
            </div>
            <button type="button" onClick={() => setConfirm({ title: 'Excluir compra?', text: `"${expenseDetail.desc}" será removida desta fatura. Outras parcelas continuam.`, label: 'Excluir', danger: true, action: async () => { const e = expenseDetail; setExpenseDetail(null); await removeCardExpense(e); } })}
              className="w-full h-12 rounded-2xl bg-rose-500/15 text-rose-300 font-semibold flex items-center justify-center gap-2"><Trash2 size={16} /> Excluir compra</button>
          </div>
        )}
      </Sheet>

      <ConfirmSheet open={!!confirm} onClose={() => setConfirm(null)} title={confirm?.title} text={confirm?.text} confirmLabel={confirm?.label} danger={confirm?.danger} onConfirm={confirm?.action} />
    </div>
  );
}
