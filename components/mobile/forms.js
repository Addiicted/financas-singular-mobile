// components/mobile/forms.js
// Formulários em painel inferior (bottom sheet) da versão mobile.
'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Trash2, Check, X, Plus, ArrowRight } from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import {
  Sheet, Field, Select, AmountInput, Segmented, PrimaryButton, inputClass,
  parseAmount, todayISO, MONTHS, monthKey, shiftMonth, useCategoryStyle, COLOR_MAP,
} from './ui';
import { ICON_MAP, AVAILABLE_ICONS, ICON_COLORS, ACCOUNT_COLORS } from './constants';
import { useToast, haptic } from './feedback';

// Chips de categoria com ícone (rolagem horizontal)
function CategoryChips({ type, value, onChange }) {
  const { categories } = useFinancial();
  const styleFor = useCategoryStyle();
  const list = categories.filter(c => c.type === type);
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
      {list.map(c => {
        const { Icon, text, bg } = styleFor(c.name);
        const active = value === c.name;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.name)}
            className={`flex-shrink-0 flex items-center gap-2 h-10 pl-1.5 pr-3.5 rounded-2xl border text-[13px] font-semibold transition ${active ? 'border-white/30 bg-white/10 text-white' : 'border-white/[0.06] bg-slate-950/60 text-slate-400'}`}
          >
            <span className={`w-7 h-7 rounded-xl flex items-center justify-center ${bg} ${text}`}><Icon size={14} /></span>
            {c.name}
          </button>
        );
      })}
    </div>
  );
}

function SubcategoryChips({ category, value, onChange }) {
  const { categories } = useFinancial();
  const subs = categories.find(c => c.name === category)?.subcategories || [];
  if (!subs.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {subs.map(s => (
        <button key={s} type="button" onClick={() => onChange(s)}
          className={`h-8 px-3 rounded-xl text-xs font-semibold border transition ${value === s ? 'border-white/30 bg-white/10 text-white' : 'border-white/[0.06] text-slate-500'}`}>
          {s}
        </button>
      ))}
    </div>
  );
}

// ── Despesa / Receita (novo ou edição) ───────────────────────────
export function TransactionSheet({ open, onClose, initialType = 'expense', editing = null }) {
  const { accounts, categories, addTransaction, updateTransaction } = useFinancial();
  const toast = useToast();

  const blank = (type) => {
    const firstCat = categories.find(c => c.type === type);
    return {
      type,
      amount: '',
      desc: '',
      category: firstCat?.name || '',
      subcategory: firstCat?.subcategories?.[0] || '',
      accountId: accounts[0]?.id || '',
      date: todayISO(),
      status: 'paid',
      notes: '',
    };
  };

  const [form, setForm] = useState(blank(initialType));

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        type: editing.type, amount: String(editing.amount).replace('.', ','), desc: editing.desc || '',
        category: editing.category || '', subcategory: editing.subcategory || '', accountId: editing.accountId || '',
        date: editing.date || todayISO(), status: editing.status || 'paid', notes: editing.notes || '',
      });
    } else {
      setForm(blank(initialType));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, initialType]);

  const set = (patch) => setForm(f => ({ ...f, ...patch }));
  const changeType = (type) => {
    const firstCat = categories.find(c => c.type === type);
    set({ type, category: firstCat?.name || '', subcategory: firstCat?.subcategories?.[0] || '' });
  };

  const amount = parseAmount(form.amount);
  const valid = amount > 0 && form.desc.trim() && form.accountId;

  const submit = async (e) => {
    e?.preventDefault();
    if (!valid) return;
    const payload = { ...form, amount, desc: form.desc.trim() };
    if (editing) await updateTransaction(editing.id, payload);
    else await addTransaction(payload);
    haptic();
    toast(editing ? 'Lançamento atualizado' : payload.type === 'income' ? 'Receita adicionada' : 'Despesa adicionada');
    onClose();
  };

  const isIncome = form.type === 'income';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Editar lançamento' : isIncome ? 'Nova receita' : 'Nova despesa'}
      footer={<PrimaryButton type="button" disabled={!valid} onClick={submit}>{editing ? 'Salvar alterações' : 'Adicionar'}</PrimaryButton>}
    >
      <form onSubmit={submit} className="space-y-5">
        {!editing && (
          <Segmented
            value={form.type}
            onChange={changeType}
            options={[
              { value: 'expense', label: 'Despesa', activeClass: 'bg-rose-500/20' },
              { value: 'income', label: 'Receita', activeClass: 'bg-emerald-500/20' },
            ]}
          />
        )}

        <AmountInput value={form.amount} onChange={v => set({ amount: v })} tone={isIncome ? 'text-emerald-300' : 'text-rose-300'} autoFocus={!editing} />

        <Field label="Descrição">
          <input className={inputClass} placeholder={isIncome ? 'Ex: Salário' : 'Ex: Supermercado'} value={form.desc} onChange={e => set({ desc: e.target.value })} />
        </Field>

        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Categoria</span>
          <CategoryChips type={form.type} value={form.category} onChange={name => {
            const sub = categories.find(c => c.name === name)?.subcategories?.[0] || '';
            set({ category: name, subcategory: sub });
          }} />
          <div className="mt-3">
            <SubcategoryChips category={form.category} value={form.subcategory} onChange={s => set({ subcategory: s })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Conta">
            <Select value={form.accountId} onChange={v => set({ accountId: v })} options={accounts.map(a => ({ value: a.id, label: a.name }))} placeholder={accounts.length ? undefined : 'Sem contas'} />
          </Field>
          <Field label="Data">
            <input type="date" className={inputClass} value={form.date} onChange={e => set({ date: e.target.value })} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'paid', label: isIncome ? 'Recebido' : 'Pago', Icon: CheckCircle2, on: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300' },
            { value: 'pending', label: 'Pendente', Icon: Clock, on: 'border-amber-400/40 bg-amber-400/10 text-amber-300' },
          ].map(o => (
            <button key={o.value} type="button" onClick={() => set({ status: o.value })}
              className={`h-12 rounded-2xl border flex items-center justify-center gap-2 text-sm font-semibold transition ${form.status === o.value ? o.on : 'border-white/[0.06] text-slate-500'}`}>
              <o.Icon size={16} /> {o.label}
            </button>
          ))}
        </div>

        <Field label="Observações">
          <textarea rows={2} className={`${inputClass} h-auto py-3 resize-none`} placeholder="Opcional" value={form.notes} onChange={e => set({ notes: e.target.value })} />
        </Field>
      </form>
    </Sheet>
  );
}

// ── Transferência entre contas ───────────────────────────────────
export function TransferSheet({ open, onClose }) {
  const { accounts, addTransfer } = useFinancial();
  const toast = useToast();
  const [form, setForm] = useState({ from: '', to: '', amount: '', date: todayISO(), desc: '' });

  useEffect(() => {
    if (open) setForm({ from: accounts[0]?.id || '', to: accounts[1]?.id || '', amount: '', date: todayISO(), desc: '' });
  }, [open, accounts]);

  const amount = parseAmount(form.amount);
  const valid = amount > 0 && form.from && form.to && form.from !== form.to;
  const options = accounts.map(a => ({ value: a.id, label: a.name }));

  const submit = async () => {
    if (!valid) return;
    await addTransfer({ fromAccountId: form.from, toAccountId: form.to, amount, date: form.date, desc: form.desc || undefined });
    haptic(); toast('Transferência registrada');
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Transferência" footer={<PrimaryButton type="button" disabled={!valid} onClick={submit}>Transferir</PrimaryButton>}>
      <div className="space-y-5">
        <AmountInput value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} autoFocus />
        {accounts.length < 2 && <p className="text-sm text-amber-300 bg-amber-400/10 rounded-2xl p-3">Cadastre pelo menos duas contas para transferir.</p>}
        <Field label="De"><Select value={form.from} onChange={v => setForm(f => ({ ...f, from: v }))} options={options} /></Field>
        <Field label="Para"><Select value={form.to} onChange={v => setForm(f => ({ ...f, to: v }))} options={options} /></Field>
        {form.from && form.from === form.to && <p className="text-xs text-rose-300">Escolha contas diferentes.</p>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data"><input type="date" className={inputClass} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Field>
          <Field label="Descrição"><input className={inputClass} placeholder="Opcional" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} /></Field>
        </div>
      </div>
    </Sheet>
  );
}

// ── Compra no cartão (com parcelas) ──────────────────────────────
const INSTALLMENTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24];

export function CardExpenseSheet({ open, onClose, defaultCardId, defaultMonth }) {
  const { cards, categories, addCardExpense } = useFinancial();
  const toast = useToast();
  const now = new Date();
  const initialMonth = defaultMonth || { y: now.getFullYear(), m: now.getMonth() + 1 };

  const blank = () => {
    const firstCat = categories.find(c => c.type === 'expense');
    return {
      cardId: defaultCardId || cards[0]?.id || '', amount: '', desc: '', installments: 1,
      category: firstCat?.name || '', subcategory: firstCat?.subcategories?.[0] || '',
      date: todayISO(), invoice: initialMonth,
    };
  };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (open) setForm(blank());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultCardId]);

  const set = (patch) => setForm(f => ({ ...f, ...patch }));
  const amount = parseAmount(form.amount);
  const valid = amount > 0 && form.desc.trim() && form.cardId;
  const n = Number(form.installments) || 1;

  const submit = async () => {
    if (!valid) return;
    const per = Math.round((amount / n) * 100) / 100;
    for (let i = 0; i < n; i++) {
      await addCardExpense({
        cardId: form.cardId, desc: form.desc.trim(), amount: n === 1 ? amount : per,
        installment: n === 1 ? 'À vista' : `${i + 1} de ${n}`,
        category: form.category || 'Outros', subcategory: form.subcategory, date: form.date,
        invoiceMonthYear: monthKey(shiftMonth(form.invoice, i)),
      });
    }
    haptic(); toast(n > 1 ? `Compra em ${n}x adicionada` : 'Compra adicionada');
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Compra no cartão" footer={<PrimaryButton type="button" disabled={!valid} onClick={submit}>Adicionar compra</PrimaryButton>}>
      <div className="space-y-5">
        <AmountInput value={form.amount} onChange={v => set({ amount: v })} tone="text-purple-200" autoFocus />
        <Field label="Cartão">
          <Select value={form.cardId} onChange={v => set({ cardId: v })} options={cards.map(c => ({ value: c.id, label: `${c.name} •••• ${c.lastDigits || '0000'}` }))} />
        </Field>
        <Field label="Descrição">
          <input className={inputClass} placeholder="Ex: Mercado Livre" value={form.desc} onChange={e => set({ desc: e.target.value })} />
        </Field>
        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Categoria</span>
          <CategoryChips type="expense" value={form.category} onChange={name => {
            const sub = categories.find(c => c.name === name)?.subcategories?.[0] || '';
            set({ category: name, subcategory: sub });
          }} />
        </div>
        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Parcelas</span>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
            {INSTALLMENTS.map(i => (
              <button key={i} type="button" onClick={() => set({ installments: i })}
                className={`flex-shrink-0 h-10 min-w-12 px-3 rounded-2xl border text-sm font-bold transition ${n === i ? 'border-purple-400/50 bg-purple-500/15 text-purple-200' : 'border-white/[0.06] text-slate-500'}`}>
                {i === 1 ? 'À vista' : `${i}x`}
              </button>
            ))}
          </div>
          {n > 1 && amount > 0 && (
            <p className="text-xs text-slate-400 mt-2">{n}x de <b className="text-white">{(amount / n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b></p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data da compra"><input type="date" className={inputClass} value={form.date} onChange={e => set({ date: e.target.value })} /></Field>
          <Field label="1ª fatura">
            <Select
              value={monthKey(form.invoice)}
              onChange={v => { const [y, m] = v.split('-').map(Number); set({ invoice: { y, m } }); }}
              options={[-1, 0, 1, 2].map(d => { const mm = shiftMonth(initialMonth, d); return { value: monthKey(mm), label: `${MONTHS[mm.m - 1].slice(0, 3)}/${mm.y}` }; })}
            />
          </Field>
        </div>
      </div>
    </Sheet>
  );
}

const toInput = (n) => (n || n === 0 ? String(n).replace('.', ',') : '');

// Botão de excluir no rodapé dos formulários de edição
function DeleteButton({ label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="w-full h-12 rounded-2xl bg-rose-500/10 text-rose-300 font-semibold flex items-center justify-center gap-2">
      <Trash2 size={16} /> {label}
    </button>
  );
}

// ── Cartão (novo ou edição) ──────────────────────────────────────
export function CardSheet({ open, onClose, editing = null }) {
  const { accounts, addCard, updateCard, deleteCard } = useFinancial();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', lastDigits: '', limitTotal: '', closingDay: 20, dueDay: 1, payingAccountId: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing
      ? { name: editing.name || '', lastDigits: editing.lastDigits || '', limitTotal: toInput(editing.limitTotal), closingDay: editing.closingDay || 1, dueDay: editing.dueDay || 1, payingAccountId: editing.payingAccountId || '' }
      : { name: '', lastDigits: '', limitTotal: '', closingDay: 20, dueDay: 1, payingAccountId: accounts[0]?.id || '' });
  }, [open, editing, accounts]);

  const set = (patch) => setForm(f => ({ ...f, ...patch }));
  const valid = form.name.trim();
  const days = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `Dia ${i + 1}` }));

  const submit = async () => {
    if (!valid) return;
    const payload = { ...form, name: form.name.trim(), limitTotal: parseAmount(form.limitTotal) };
    if (editing) await updateCard(editing.id, payload); else await addCard(payload);
    haptic(); toast(editing ? 'Cartão atualizado' : 'Cartão cadastrado');
    onClose();
  };

  return (
    <>
      <Sheet open={open} onClose={onClose} title={editing ? 'Editar cartão' : 'Novo cartão'}
        footer={<PrimaryButton type="button" disabled={!valid} onClick={submit}>{editing ? 'Salvar alterações' : 'Cadastrar cartão'}</PrimaryButton>}>
        <div className="space-y-4">
          <Field label="Nome do cartão"><input className={inputClass} placeholder="Ex: Nubank" value={form.name} onChange={e => set({ name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Final"><input inputMode="numeric" maxLength={4} className={inputClass} placeholder="0000" value={form.lastDigits} onChange={e => set({ lastDigits: e.target.value.replace(/\D/g, '') })} /></Field>
            <Field label="Limite"><input inputMode="decimal" className={inputClass} placeholder="5.000,00" value={form.limitTotal} onChange={e => set({ limitTotal: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fechamento"><Select value={form.closingDay} onChange={v => set({ closingDay: Number(v) })} options={days} /></Field>
            <Field label="Vencimento"><Select value={form.dueDay} onChange={v => set({ dueDay: Number(v) })} options={days} /></Field>
          </div>
          <Field label="Conta que paga a fatura"><Select value={form.payingAccountId} onChange={v => set({ payingAccountId: v })} options={accounts.map(a => ({ value: a.id, label: a.name }))} placeholder="Escolha a conta" /></Field>
          {editing && <DeleteButton label="Excluir cartão" onClick={() => setConfirmDelete(true)} />}
        </div>
      </Sheet>
      <ConfirmSheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir cartão?" danger confirmLabel="Excluir"
        text={`"${editing?.name}" será removido. As compras já lançadas nele podem deixar de aparecer nas faturas.`}
        onConfirm={async () => { await deleteCard(editing.id); toast('Cartão excluído', { tone: 'danger' }); onClose(); }} />
    </>
  );
}
export const NewCardSheet = CardSheet;

// ── Conta bancária (nova ou edição) ──────────────────────────────
export function AccountSheet({ open, onClose, editing = null }) {
  const { addAccount, updateAccount, deleteAccount } = useFinancial();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', bank: '', initialBalance: '', color: ACCOUNT_COLORS[0].value });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing
      ? { name: editing.name || '', bank: editing.bank || '', initialBalance: toInput(editing.initialBalance), color: editing.color || ACCOUNT_COLORS[0].value }
      : { name: '', bank: '', initialBalance: '', color: ACCOUNT_COLORS[0].value });
  }, [open, editing]);

  const set = (patch) => setForm(f => ({ ...f, ...patch }));
  const valid = form.name.trim();

  const submit = async () => {
    if (!valid) return;
    const payload = { ...form, name: form.name.trim(), bank: form.bank.trim(), initialBalance: parseAmount(form.initialBalance) };
    if (editing) await updateAccount(editing.id, payload); else await addAccount(payload);
    haptic(); toast(editing ? 'Conta atualizada' : 'Conta cadastrada');
    onClose();
  };

  return (
    <>
      <Sheet open={open} onClose={onClose} title={editing ? 'Editar conta' : 'Nova conta'}
        footer={<PrimaryButton type="button" disabled={!valid} onClick={submit}>{editing ? 'Salvar alterações' : 'Cadastrar conta'}</PrimaryButton>}>
        <div className="space-y-4">
          {/* Prévia */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-white/[0.05]">
            <span className={`w-11 h-11 rounded-2xl ${form.color} flex items-center justify-center font-bold text-white`}>{(form.name || '?')[0].toUpperCase()}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{form.name || 'Nome da conta'}</p>
              <p className="text-xs text-slate-500 truncate">{form.bank || 'Banco'}</p>
            </div>
          </div>
          <Field label="Nome da conta"><input className={inputClass} placeholder="Ex: Nubank Reserva" value={form.name} onChange={e => set({ name: e.target.value })} /></Field>
          <Field label="Banco / instituição"><input className={inputClass} placeholder="Ex: Nu Pagamentos" value={form.bank} onChange={e => set({ bank: e.target.value })} /></Field>
          <Field label="Saldo inicial"><input inputMode="decimal" className={inputClass} placeholder="0,00" value={form.initialBalance} onChange={e => set({ initialBalance: e.target.value })} /></Field>
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Cor</span>
            <div className="flex flex-wrap gap-2.5">
              {ACCOUNT_COLORS.map(c => (
                <button key={c.value} type="button" aria-label={c.label} onClick={() => set({ color: c.value })}
                  className={`w-10 h-10 rounded-full ${c.value} flex items-center justify-center ring-offset-2 ring-offset-slate-900 transition ${form.color === c.value ? 'ring-2 ring-white' : ''}`}>
                  {form.color === c.value && <Check size={16} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
          {editing && <DeleteButton label="Excluir conta" onClick={() => setConfirmDelete(true)} />}
        </div>
      </Sheet>
      <ConfirmSheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir conta?" danger confirmLabel="Excluir"
        text={`"${editing?.name}" será removida. Os lançamentos ligados a ela ficam sem conta.`}
        onConfirm={async () => { await deleteAccount(editing.id); toast('Conta excluída', { tone: 'danger' }); onClose(); }} />
    </>
  );
}

// ── Categoria (nova ou edição) com ícone, cor e subcategorias ─────
export function CategorySheet({ open, onClose, editing = null, defaultType = 'expense' }) {
  const { addCategory, updateCategory, deleteCategory } = useFinancial();
  const toast = useToast();
  const [form, setForm] = useState({ type: 'expense', name: '', icon: 'Layers', iconColor: 'indigo', subcategories: [] });
  const [subInput, setSubInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubInput('');
    setForm(editing
      ? { type: editing.type, name: editing.name || '', icon: editing.icon || 'Layers', iconColor: editing.iconColor || 'indigo', subcategories: [...(editing.subcategories || [])] }
      : { type: defaultType, name: '', icon: 'Layers', iconColor: 'indigo', subcategories: [] });
  }, [open, editing, defaultType]);

  const set = (patch) => setForm(f => ({ ...f, ...patch }));
  const valid = form.name.trim();
  const addSub = () => {
    const s = subInput.trim();
    if (s && !form.subcategories.includes(s)) set({ subcategories: [...form.subcategories, s] });
    setSubInput('');
  };

  const submit = async () => {
    if (!valid) return;
    const payload = { ...form, name: form.name.trim() };
    if (editing) await updateCategory(editing.id, payload); else await addCategory(payload);
    haptic(); toast(editing ? 'Categoria atualizada' : 'Categoria criada');
    onClose();
  };

  const PreviewIcon = ICON_MAP[form.icon] || ICON_MAP.Layers;
  const color = COLOR_MAP[form.iconColor] || COLOR_MAP.slate;
  const locked = editing && ['transfer', 'bridge'].includes(editing.type);

  return (
    <>
      <Sheet open={open} onClose={onClose} title={editing ? 'Editar categoria' : 'Nova categoria'}
        footer={<PrimaryButton type="button" disabled={!valid} onClick={submit}>{editing ? 'Salvar alterações' : 'Criar categoria'}</PrimaryButton>}>
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-2 py-1">
            <span className={`w-16 h-16 rounded-3xl ${color.bg} ${color.text} flex items-center justify-center`}><PreviewIcon size={28} /></span>
            <p className="text-sm font-semibold text-white">{form.name || 'Nome da categoria'}</p>
          </div>

          {!locked && (
            <Segmented value={form.type} onChange={v => set({ type: v })} options={[
              { value: 'expense', label: 'Despesa', activeClass: 'bg-rose-500/20' },
              { value: 'income', label: 'Receita', activeClass: 'bg-emerald-500/20' },
            ]} />
          )}

          <Field label="Nome"><input className={inputClass} placeholder="Ex: Pets" value={form.name} onChange={e => set({ name: e.target.value })} /></Field>

          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Ícone</span>
            <div className="grid grid-cols-8 gap-2">
              {AVAILABLE_ICONS.map(i => {
                const I = ICON_MAP[i.name];
                const on = form.icon === i.name;
                return (
                  <button key={i.name} type="button" aria-label={i.label} onClick={() => set({ icon: i.name })}
                    className={`aspect-square rounded-xl flex items-center justify-center transition ${on ? `${color.bg} ${color.text} ring-1 ring-white/30` : 'bg-slate-950/60 text-slate-500'}`}>
                    <I size={17} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Cor</span>
            <div className="flex flex-wrap gap-2.5">
              {ICON_COLORS.map(c => (
                <button key={c.name} type="button" aria-label={c.label} onClick={() => set({ iconColor: c.name })}
                  className={`w-9 h-9 rounded-full ${c.circle} flex items-center justify-center ring-offset-2 ring-offset-slate-900 ${form.iconColor === c.name ? 'ring-2 ring-white' : ''}`}>
                  {form.iconColor === c.name && <Check size={15} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Subcategorias</span>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.subcategories.length === 0 && <span className="text-xs text-slate-600">Nenhuma ainda</span>}
              {form.subcategories.map(s => (
                <span key={s} className="h-8 pl-3 pr-1 rounded-xl bg-white/[0.06] text-xs font-semibold text-slate-200 flex items-center gap-1">
                  {s}
                  <button type="button" aria-label={`Remover ${s}`} onClick={() => set({ subcategories: form.subcategories.filter(x => x !== s) })} className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 active:bg-white/10"><X size={13} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className={inputClass} placeholder="Nova subcategoria" value={subInput} onChange={e => setSubInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSub(); } }} />
              <button type="button" onClick={addSub} disabled={!subInput.trim()} aria-label="Adicionar subcategoria" className="w-12 flex-shrink-0 rounded-2xl bg-white/[0.08] text-white flex items-center justify-center disabled:opacity-30"><Plus size={18} /></button>
            </div>
          </div>

          {editing && !locked && <DeleteButton label="Excluir categoria" onClick={() => setConfirmDelete(true)} />}
        </div>
      </Sheet>
      <ConfirmSheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir categoria?" danger confirmLabel="Excluir"
        text={`"${editing?.name}" será removida. Lançamentos antigos mantêm o nome, mas ficam sem ícone.`}
        onConfirm={async () => { await deleteCategory(editing.id); toast('Categoria excluída', { tone: 'danger' }); onClose(); }} />
    </>
  );
}

// ── Repasse da Ponte (PJ → PF) ───────────────────────────────────
export function BridgeSheet({ open, onClose }) {
  const { rawAccounts, addBridgeTransfer } = useFinancial();
  const toast = useToast();
  const pj = rawAccounts.filter(a => a.entity === 'PJ');
  const pf = rawAccounts.filter(a => a.entity === 'PF');
  const [form, setForm] = useState({ amount: '', desc: 'Retirada de Pró-labore', pjAccountId: '', pfAccountId: '', date: todayISO() });

  useEffect(() => {
    if (open) setForm({ amount: '', desc: 'Retirada de Pró-labore', pjAccountId: pj[0]?.id || '', pfAccountId: pf[0]?.id || '', date: todayISO() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (patch) => setForm(f => ({ ...f, ...patch }));
  const amount = parseAmount(form.amount);
  const valid = amount > 0 && form.pjAccountId && form.pfAccountId;

  const submit = async () => {
    if (!valid) return;
    await addBridgeTransfer({ amount, desc: form.desc, pjAccountId: form.pjAccountId, pfAccountId: form.pfAccountId, date: form.date });
    haptic(); toast('Repasse registrado nas duas contas');
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Novo repasse PJ → PF" footer={<PrimaryButton type="button" disabled={!valid} onClick={submit}>Registrar repasse</PrimaryButton>}>
      <div className="space-y-5">
        <AmountInput value={form.amount} onChange={v => set({ amount: v })} tone="text-sky-200" autoFocus />
        {(pj.length === 0 || pf.length === 0) && (
          <p className="text-sm text-amber-300 bg-amber-400/10 rounded-2xl p-3">Cadastre ao menos uma conta PJ e uma PF em Ajustes (troque PF/PJ no topo).</p>
        )}
        <div className="flex items-end gap-2">
          <div className="flex-1"><Field label="Sai da empresa (PJ)"><Select value={form.pjAccountId} onChange={v => set({ pjAccountId: v })} options={pj.map(a => ({ value: a.id, label: a.name }))} placeholder="Conta PJ" /></Field></div>
          <ArrowRight size={18} className="text-slate-500 mb-4 flex-shrink-0" />
          <div className="flex-1"><Field label="Entra na PF"><Select value={form.pfAccountId} onChange={v => set({ pfAccountId: v })} options={pf.map(a => ({ value: a.id, label: a.name }))} placeholder="Conta PF" /></Field></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Retirada de Pró-labore', 'Distribuição de lucros', 'Reembolso de despesas'].map(d => (
            <button key={d} type="button" onClick={() => set({ desc: d })}
              className={`h-8 px-3 rounded-xl text-xs font-semibold border ${form.desc === d ? 'border-white/30 bg-white/10 text-white' : 'border-white/[0.06] text-slate-500'}`}>{d}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Descrição"><input className={inputClass} value={form.desc} onChange={e => set({ desc: e.target.value })} /></Field>
          <Field label="Data"><input type="date" className={inputClass} value={form.date} onChange={e => set({ date: e.target.value })} /></Field>
        </div>
        <p className="text-xs text-slate-500">Lança uma despesa na PJ e uma receita na PF, mantendo as contas separadas.</p>
      </div>
    </Sheet>
  );
}

// ── Confirmação ──────────────────────────────────────────────────
export function ConfirmSheet({ open, onClose, title, text, confirmLabel = 'Confirmar', danger = false, onConfirm }) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="text-sm text-slate-400 mb-5">{text}</p>
      <div className="grid grid-cols-2 gap-3 pb-2">
        <button type="button" onClick={onClose} className="h-12 rounded-2xl bg-white/[0.06] font-semibold text-slate-300">Cancelar</button>
        <button type="button" onClick={async () => { await onConfirm?.(); onClose(); }}
          className={`h-12 rounded-2xl font-bold text-white ${danger ? 'bg-rose-600' : 'bg-indigo-600'}`}>{confirmLabel}</button>
      </div>
    </Sheet>
  );
}
