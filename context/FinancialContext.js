// context/FinancialContext.js
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '@/utils/supabase';

const FinancialContext = createContext();

export function FinancialProvider({ children }) {
  const [entityType, setEntityType] = useState('PF');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hideValues, setHideValues] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filtro que o Dashboard envia para o Extrato
  const [extratoFilterType, setExtratoFilterType] = useState('ALL');

  // Estados com dados reais do Supabase (iniciam vazios)
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cardExpenses, setCardExpenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [investments, setInvestments] = useState([]);

  // ── 1. CARREGAMENTO INICIAL 100% DO SUPABASE ──────────────────────
  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        { data: accs },
        { data: crds },
        { data: cats },
        { data: txs },
        { data: cExpenses },
        { data: invs },
        { data: bdgs },
        { data: invsts }
      ] = await Promise.all([
        supabase.from('accounts').select('*').order('created_at', { ascending: true }),
        supabase.from('cards').select('*').order('created_at', { ascending: true }),
        supabase.from('categories').select('*').order('created_at', { ascending: true }),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('card_expenses').select('*').order('date', { ascending: false }),
        supabase.from('invoices').select('*').order('created_at', { ascending: true }),
        supabase.from('budgets').select('*'),
        supabase.from('investments').select('*').order('created_at', { ascending: true })
      ]);

      // Mapeamento snake_case do PostgreSQL para o frontend
      if (accs) {
        setAccounts(accs.map(a => ({
          id: a.id,
          name: a.name,
          bank: a.bank,
          initialBalance: Number(a.initial_balance || 0),
          entity: a.entity,
          color: a.color
        })));
      }

      if (crds) {
        setCards(crds.map(c => ({
          id: c.id,
          name: c.name,
          lastDigits: c.last_digits,
          limitTotal: Number(c.limit_total || 0),
          closingDay: c.closing_day,
          dueDay: c.due_day,
          payingAccountId: c.paying_account_id,
          entity: c.entity
        })));
      }

      // Se não houver categorias no banco, insere as essenciais automaticamente
      if (cats && cats.length > 0) {
        setCategories(cats.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          icon: c.icon,
          iconColor: c.icon_color,
          subcategories: c.subcategories || [],
          entity: c.entity
        })));
      } else {
        // Categorias padrão de largada
        const defaultCategories = [
          { name: 'Moradia', type: 'expense', icon: 'Home', icon_color: 'indigo', subcategories: ['Aluguel', 'Luz', 'Internet'], entity: 'PF' },
          { name: 'Alimentação', type: 'expense', icon: 'Utensils', icon_color: 'amber', subcategories: ['Supermercado', 'Restaurante'], entity: 'PF' },
          { name: 'Receitas Pessoais', type: 'income', icon: 'DollarSign', icon_color: 'emerald', subcategories: ['Pró-labore', 'Rendimentos'], entity: 'PF' },
          { name: 'Custos Operacionais', type: 'expense', icon: 'Briefcase', icon_color: 'sky', subcategories: ['Softwares', 'Contabilidade'], entity: 'PJ' },
          { name: 'Vendas & Receitas PJ', type: 'income', icon: 'TrendingUp', icon_color: 'emerald', subcategories: ['Projetos', 'Contratos'], entity: 'PJ' },
          { name: 'Transferência Interna', type: 'transfer', icon: 'Layers', icon_color: 'slate', subcategories: ['Entre Contas'], entity: 'AMBOS' },
          { name: 'Retirada / Pró-labore', type: 'bridge', icon: 'RefreshCw', icon_color: 'emerald', subcategories: ['Pró-labore Sócios'], entity: 'AMBOS' }
        ];
        const { data: insertedCats } = await supabase.from('categories').insert(defaultCategories).select();
        if (insertedCats) {
          setCategories(insertedCats.map(c => ({
            id: c.id,
            name: c.name,
            type: c.type,
            icon: c.icon,
            iconColor: c.icon_color,
            subcategories: c.subcategories || [],
            entity: c.entity
          })));
        }
      }

      if (txs) {
        setTransactions(txs.map(t => ({
          id: t.id,
          entity: t.entity,
          desc: t.description,
          amount: Number(t.amount || 0),
          type: t.type,
          accountId: t.account_id,
          category: t.category,
          subcategory: t.subcategory,
          status: t.status,
          date: t.date,
          notes: t.notes,
          isInvoicePayment: t.is_invoice_payment,
          cardId: t.card_id,
          invoiceMonthYear: t.invoice_month_year
        })));
      }

      if (cExpenses) {
        setCardExpenses(cExpenses.map(e => ({
          id: e.id,
          cardId: e.card_id,
          desc: e.description,
          amount: Number(e.amount || 0),
          installment: e.installment,
          category: e.category,
          subcategory: e.subcategory,
          date: e.date,
          invoiceMonthYear: e.invoice_month_year,
          entity: e.entity
        })));
      }

      if (invs) {
        setInvoices(invs.map(i => ({
          id: i.id,
          cardId: i.card_id,
          invoiceMonthYear: i.invoice_month_year,
          status: i.status,
          closedAmount: i.closed_amount ? Number(i.closed_amount) : null,
          paidAmount: i.paid_amount ? Number(i.paid_amount) : null,
          payingAccountId: i.paying_account_id,
          paidDate: i.paid_date
        })));
      }

      if (bdgs) {
        setBudgets(bdgs.map(b => ({
          id: b.id,
          entity: b.entity,
          categoryName: b.category_name,
          limitAmount: Number(b.limit_amount || 0)
        })));
      }

      if (invsts) {
        setInvestments(invsts.map(i => ({
          id: i.id,
          entity: i.entity,
          name: i.name,
          type: i.type,
          investedAmount: Number(i.invested_amount || 0),
          currentAmount: Number(i.current_amount || 0)
        })));
      }

    } catch (err) {
      console.error('Erro ao conectar ao Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── 2. CÁLCULO DE SALDO INDIVIDUAL EM TEMPO REAL ──────────────────
  const getAccountBalance = (accountId) => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return 0;
    const initial = Number(acc.initialBalance || 0);

    const paidIncomes = transactions
      .filter(t => t.accountId === accountId && t.type === 'income' && t.status === 'paid')
      .reduce((sum, curr) => sum + Number(curr.amount || 0), 0);

    const paidExpenses = transactions
      .filter(t => t.accountId === accountId && t.type === 'expense' && t.status === 'paid')
      .reduce((sum, curr) => sum + Number(curr.amount || 0), 0);

    return initial + paidIncomes - paidExpenses;
  };

  // ── 3. OPERAÇÕES REAIS NO SUPABASE: CONTAS BANCÁRIAS ──────────────
  const addAccount = async (acc) => {
    const payload = {
      name: acc.name,
      bank: acc.bank,
      initial_balance: parseFloat(acc.initialBalance) || 0,
      entity: entityType,
      color: acc.color || 'bg-purple-600'
    };

    const { data, error } = await supabase.from('accounts').insert([payload]).select();
    if (!error && data?.[0]) {
      const created = {
        id: data[0].id,
        name: data[0].name,
        bank: data[0].bank,
        initialBalance: Number(data[0].initial_balance),
        entity: data[0].entity,
        color: data[0].color
      };
      setAccounts(prev => [...prev, created]);
    }
  };

  const updateAccount = async (id, updated) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));

    const payload = {};
    if (updated.name !== undefined) payload.name = updated.name;
    if (updated.bank !== undefined) payload.bank = updated.bank;
    if (updated.initialBalance !== undefined) payload.initial_balance = parseFloat(updated.initialBalance);
    if (updated.color !== undefined) payload.color = updated.color;

    await supabase.from('accounts').update(payload).eq('id', id);
  };

  const deleteAccount = async (id) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    await supabase.from('accounts').delete().eq('id', id);
  };

  // ── 4. OPERAÇÕES REAIS NO SUPABASE: CARTÕES DE CRÉDITO ─────────────
  const addCard = async (card) => {
    const payload = {
      name: card.name,
      last_digits: card.lastDigits,
      limit_total: parseFloat(card.limitTotal) || 0,
      closing_day: parseInt(card.closingDay) || 1,
      due_day: parseInt(card.dueDay) || 1,
      paying_account_id: card.payingAccountId || null,
      entity: entityType
    };

    const { data, error } = await supabase.from('cards').insert([payload]).select();
    if (!error && data?.[0]) {
      const created = {
        id: data[0].id,
        name: data[0].name,
        lastDigits: data[0].last_digits,
        limitTotal: Number(data[0].limit_total),
        closingDay: data[0].closing_day,
        dueDay: data[0].due_day,
        payingAccountId: data[0].paying_account_id,
        entity: data[0].entity
      };
      setCards(prev => [...prev, created]);
    }
  };

  const updateCard = async (id, updated) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));

    const payload = {};
    if (updated.name !== undefined) payload.name = updated.name;
    if (updated.lastDigits !== undefined) payload.last_digits = updated.lastDigits;
    if (updated.limitTotal !== undefined) payload.limit_total = parseFloat(updated.limitTotal);
    if (updated.closingDay !== undefined) payload.closing_day = parseInt(updated.closingDay);
    if (updated.dueDay !== undefined) payload.due_day = parseInt(updated.dueDay);
    if (updated.payingAccountId !== undefined) payload.paying_account_id = updated.payingAccountId;

    await supabase.from('cards').update(payload).eq('id', id);
  };

  const deleteCard = async (id) => {
    setCards(prev => prev.filter(c => c.id !== id));
    await supabase.from('cards').delete().eq('id', id);
  };

  // ── 5. OPERAÇÕES REAIS NO SUPABASE: CATEGORIAS ─────────────────────
  const addCategory = async (cat) => {
    const payload = {
      name: cat.name,
      type: cat.type,
      icon: cat.icon || 'Tag',
      icon_color: cat.iconColor || 'indigo',
      subcategories: cat.subcategories || [],
      entity: entityType
    };

    const { data, error } = await supabase.from('categories').insert([payload]).select();
    if (!error && data?.[0]) {
      const created = {
        id: data[0].id,
        name: data[0].name,
        type: data[0].type,
        icon: data[0].icon,
        iconColor: data[0].icon_color,
        subcategories: data[0].subcategories || [],
        entity: data[0].entity
      };
      setCategories(prev => [...prev, created]);
    }
  };

  const updateCategory = async (id, updated) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));

    const payload = {};
    if (updated.name !== undefined) payload.name = updated.name;
    if (updated.type !== undefined) payload.type = updated.type;
    if (updated.icon !== undefined) payload.icon = updated.icon;
    if (updated.iconColor !== undefined) payload.icon_color = updated.iconColor;
    if (updated.subcategories !== undefined) payload.subcategories = updated.subcategories;

    await supabase.from('categories').update(payload).eq('id', id);
  };

  const deleteCategory = async (id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    await supabase.from('categories').delete().eq('id', id);
  };

  const addSubcategory = async (catId, subName) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat || cat.subcategories.includes(subName)) return;

    const newSubs = [...cat.subcategories, subName];
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, subcategories: newSubs } : c));
    await supabase.from('categories').update({ subcategories: newSubs }).eq('id', catId);
  };

  const removeSubcategory = async (catId, subName) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;

    const newSubs = cat.subcategories.filter(s => s !== subName);
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, subcategories: newSubs } : c));
    await supabase.from('categories').update({ subcategories: newSubs }).eq('id', catId);
  };

  // ── 6. OPERAÇÕES REAIS NO SUPABASE: COMPRAS NO CARTÃO ──────────────
  const addCardExpense = async (expense) => {
    const payload = {
      card_id: expense.cardId,
      description: expense.desc,
      amount: parseFloat(expense.amount),
      installment: expense.installment || 'À vista',
      category: expense.category,
      subcategory: expense.subcategory,
      date: expense.date,
      invoice_month_year: expense.invoiceMonthYear,
      entity: entityType
    };

    const { data, error } = await supabase.from('card_expenses').insert([payload]).select();
    if (!error && data?.[0]) {
      const created = {
        id: data[0].id,
        cardId: data[0].card_id,
        desc: data[0].description,
        amount: Number(data[0].amount),
        installment: data[0].installment,
        category: data[0].category,
        subcategory: data[0].subcategory,
        date: data[0].date,
        invoiceMonthYear: data[0].invoice_month_year,
        entity: data[0].entity
      };
      setCardExpenses(prev => [created, ...prev]);
    }
  };

  const deleteCardExpense = async (id) => {
    setCardExpenses(prev => prev.filter(e => e.id !== id));
    await supabase.from('card_expenses').delete().eq('id', id);
  };

  // ── 7. OPERAÇÕES REAIS NO SUPABASE: TRANSAÇÕES / EXTRATO ───────────
  const addTransaction = async (tx) => {
    const payload = {
      entity: entityType,
      description: tx.desc,
      amount: parseFloat(tx.amount),
      type: tx.type,
      account_id: tx.accountId || null,
      category: tx.category,
      subcategory: tx.subcategory,
      status: tx.status,
      date: tx.date,
      notes: tx.notes || ''
    };

    const { data, error } = await supabase.from('transactions').insert([payload]).select();
    if (!error && data?.[0]) {
      const created = {
        id: data[0].id,
        entity: data[0].entity,
        desc: data[0].description,
        amount: Number(data[0].amount),
        type: data[0].type,
        accountId: data[0].account_id,
        category: data[0].category,
        subcategory: data[0].subcategory,
        status: data[0].status,
        date: data[0].date,
        notes: data[0].notes
      };
      setTransactions(prev => [created, ...prev]);
    }
  };

  const updateTransaction = async (id, updated) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));

    const payload = {};
    if (updated.desc !== undefined) payload.description = updated.desc;
    if (updated.amount !== undefined) payload.amount = parseFloat(updated.amount);
    if (updated.type !== undefined) payload.type = updated.type;
    if (updated.accountId !== undefined) payload.account_id = updated.accountId;
    if (updated.category !== undefined) payload.category = updated.category;
    if (updated.subcategory !== undefined) payload.subcategory = updated.subcategory;
    if (updated.status !== undefined) payload.status = updated.status;
    if (updated.date !== undefined) payload.date = updated.date;
    if (updated.notes !== undefined) payload.notes = updated.notes;

    await supabase.from('transactions').update(payload).eq('id', id);
  };

  const deleteTransaction = async (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    await supabase.from('transactions').delete().eq('id', id);
  };

  const toggleTransactionStatus = async (id) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    const newStatus = tx.status === 'paid' ? 'pending' : 'paid';
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await supabase.from('transactions').update({ status: newStatus }).eq('id', id);
  };

  const addTransfer = async ({ fromAccountId, toAccountId, amount, date, desc }) => {
    const fromAcc = accounts.find(a => a.id === fromAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);
    const val = parseFloat(amount);

    const payloadOut = {
      entity: entityType,
      description: desc || `Transf. para ${toAcc?.name || 'Conta Externa'}`,
      amount: val,
      type: 'transfer',
      account_id: fromAccountId,
      category: 'Transferência Interna',
      subcategory: 'Entre Contas Próprias',
      status: 'paid',
      date,
      notes: `Transferência enviada para ${toAcc?.name}`
    };

    const payloadIn = {
      entity: entityType,
      description: desc || `Transf. de ${fromAcc?.name || 'Conta Externa'}`,
      amount: val,
      type: 'transfer',
      account_id: toAccountId,
      category: 'Transferência Interna',
      subcategory: 'Entre Contas Próprias',
      status: 'paid',
      date,
      notes: `Transferência recebida de ${fromAcc?.name}`
    };

    const { data } = await supabase.from('transactions').insert([payloadOut, payloadIn]).select();
    if (data) {
      const created = data.map(t => ({
        id: t.id,
        entity: t.entity,
        desc: t.description,
        amount: Number(t.amount),
        type: t.type,
        accountId: t.account_id,
        category: t.category,
        subcategory: t.subcategory,
        status: t.status,
        date: t.date,
        notes: t.notes
      }));
      setTransactions(prev => [...created, ...prev]);
    }
  };

  const addBridgeTransfer = async ({ amount, desc, pjAccountId, pfAccountId, date }) => {
    const val = parseFloat(amount);

    const pjPayload = {
      entity: 'PJ',
      description: desc || 'Retirada de Pró-labore / Dividendos (Para PF)',
      amount: val,
      type: 'expense',
      account_id: pjAccountId,
      category: 'Retirada / Pró-labore',
      subcategory: 'Pró-labore Sócios',
      status: 'paid',
      date,
      notes: 'Repasse empresarial para pessoa física'
    };

    const pfPayload = {
      entity: 'PF',
      description: desc || 'Recebimento de Pró-labore / Lucros da Empresa',
      amount: val,
      type: 'income',
      account_id: pfAccountId,
      category: 'Receitas Pessoais',
      subcategory: 'Pró-labore',
      status: 'paid',
      date,
      notes: 'Recebimento via repasse de lucro/pró-labore'
    };

    const { data } = await supabase.from('transactions').insert([pjPayload, pfPayload]).select();
    if (data) {
      const created = data.map(t => ({
        id: t.id,
        entity: t.entity,
        desc: t.description,
        amount: Number(t.amount),
        type: t.type,
        accountId: t.account_id,
        category: t.category,
        subcategory: t.subcategory,
        status: t.status,
        date: t.date,
        notes: t.notes
      }));
      setTransactions(prev => [...created, ...prev]);
    }
  };

  // ── 8. GESTÃO DE FATURAS & SINCRONIA ──────────────────────────────
  const getInvoiceData = (cardId, invoiceMonthYear) => {
    const rawSum = cardExpenses
      .filter(e => e.cardId === cardId && e.invoiceMonthYear === invoiceMonthYear)
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const linkedTx = transactions.find(t => t.isInvoicePayment && t.cardId === cardId && t.invoiceMonthYear === invoiceMonthYear);
    const savedInv = invoices.find(i => i.cardId === cardId && i.invoiceMonthYear === invoiceMonthYear);

    if (linkedTx) {
      return {
        status: linkedTx.status === 'paid' ? 'paga' : 'fechada',
        rawSum,
        finalAmount: linkedTx.amount,
        payingAccountId: linkedTx.accountId,
        paidDate: linkedTx.date,
        linkedTxId: linkedTx.id
      };
    }

    if (savedInv) {
      return {
        status: savedInv.status,
        rawSum,
        finalAmount: savedInv.closedAmount || rawSum,
        payingAccountId: savedInv.payingAccountId,
        paidDate: savedInv.paidDate,
        linkedTxId: null
      };
    }

    return {
      status: 'aberta',
      rawSum,
      finalAmount: rawSum,
      payingAccountId: null,
      paidDate: null,
      linkedTxId: null
    };
  };

  const closeInvoice = async ({ cardId, invoiceMonthYear, finalAmount }) => {
    const val = parseFloat(finalAmount) || 0;
    const payload = {
      card_id: cardId,
      invoice_month_year: invoiceMonthYear,
      status: 'fechada',
      closed_amount: val
    };

    setInvoices(prev => {
      const exists = prev.find(i => i.cardId === cardId && i.invoiceMonthYear === invoiceMonthYear);
      if (exists) {
        return prev.map(i => i.cardId === cardId && i.invoiceMonthYear === invoiceMonthYear ? { ...i, status: 'fechada', closedAmount: val } : i);
      }
      return [...prev, { cardId, invoiceMonthYear, status: 'fechada', closedAmount: val }];
    });

    await supabase.from('invoices').upsert(payload, { onConflict: 'card_id,invoice_month_year' });
  };

  const reopenInvoice = async (cardId, invoiceMonthYear) => {
    setInvoices(prev => prev.filter(i => !(i.cardId === cardId && i.invoiceMonthYear === invoiceMonthYear)));
    setTransactions(prev => prev.filter(t => !(t.isInvoicePayment && t.cardId === cardId && t.invoiceMonthYear === invoiceMonthYear)));

    await supabase.from('invoices').delete().match({ card_id: cardId, invoice_month_year: invoiceMonthYear });
    await supabase.from('transactions').delete().match({ card_id: cardId, invoice_month_year: invoiceMonthYear, is_invoice_payment: true });
  };

  const payInvoice = async ({ cardId, invoiceMonthYear, payingAccountId, date, finalAmount }) => {
    const card = cards.find(c => c.id === cardId);
    const amount = parseFloat(finalAmount) || 0;

    const txPayload = {
      is_invoice_payment: true,
      card_id: cardId,
      invoice_month_year: invoiceMonthYear,
      entity: card?.entity || entityType,
      description: `Pagamento Fatura ${card?.name || 'Cartão'} (${invoiceMonthYear})`,
      amount,
      type: 'expense',
      account_id: payingAccountId,
      category: 'Cartão de Crédito',
      subcategory: 'Fatura Mensal',
      status: 'paid',
      date,
      notes: 'Débito de fatura'
    };

    const invPayload = {
      card_id: cardId,
      invoice_month_year: invoiceMonthYear,
      status: 'paga',
      paid_amount: amount,
      paying_account_id: payingAccountId,
      paid_date: date
    };

    const [{ data: newTx }] = await Promise.all([
      supabase.from('transactions').insert([txPayload]).select(),
      supabase.from('invoices').upsert(invPayload, { onConflict: 'card_id,invoice_month_year' })
    ]);

    if (newTx?.[0]) {
      setTransactions(prev => [{
        id: newTx[0].id,
        entity: newTx[0].entity,
        desc: newTx[0].description,
        amount: Number(newTx[0].amount),
        type: newTx[0].type,
        accountId: newTx[0].account_id,
        category: newTx[0].category,
        subcategory: newTx[0].subcategory,
        status: newTx[0].status,
        date: newTx[0].date,
        notes: newTx[0].notes,
        isInvoicePayment: true,
        cardId,
        invoiceMonthYear
      }, ...prev]);
    }

    setInvoices(prev => {
      const exists = prev.find(i => i.cardId === cardId && i.invoiceMonthYear === invoiceMonthYear);
      if (exists) {
        return prev.map(i => i.cardId === cardId && i.invoiceMonthYear === invoiceMonthYear ? { ...i, status: 'paga', paidAmount: amount, payingAccountId, paidDate: date } : i);
      }
      return [...prev, { cardId, invoiceMonthYear, status: 'paga', paidAmount: amount, payingAccountId, paidDate: date }];
    });
  };

  const revertInvoicePayment = async (cardId, invoiceMonthYear) => {
    const tx = transactions.find(t => t.isInvoicePayment && t.cardId === cardId && t.invoiceMonthYear === invoiceMonthYear);
    if (tx) {
      setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: 'pending' } : t));
      await supabase.from('transactions').update({ status: 'pending' }).eq('id', tx.id);
    }
  };

  // ── 9. METAS & INVESTIMENTOS REAIS ─────────────────────────────────
  const saveBudget = async (budget) => {
    const payload = {
      entity: entityType,
      category_name: budget.categoryName,
      limit_amount: parseFloat(budget.limitAmount) || 0
    };

    const { data } = await supabase.from('budgets').upsert(payload, { onConflict: 'id' }).select();
    if (data?.[0]) {
      setBudgets(prev => {
        const filtered = prev.filter(b => !(b.categoryName === budget.categoryName && b.entity === entityType));
        return [...filtered, {
          id: data[0].id,
          entity: data[0].entity,
          categoryName: data[0].category_name,
          limitAmount: Number(data[0].limit_amount)
        }];
      });
    }
  };

  const addInvestment = async (inv) => {
    const payload = {
      entity: entityType,
      name: inv.name,
      type: inv.type,
      invested_amount: parseFloat(inv.investedAmount) || 0,
      current_amount: parseFloat(inv.currentAmount) || 0
    };

    const { data } = await supabase.from('investments').insert([payload]).select();
    if (data?.[0]) {
      setInvestments(prev => [...prev, {
        id: data[0].id,
        entity: data[0].entity,
        name: data[0].name,
        type: data[0].type,
        investedAmount: Number(data[0].invested_amount),
        currentAmount: Number(data[0].current_amount)
      }]);
    }
  };

  const updateInvestment = async (id, updated) => {
    setInvestments(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i));

    const payload = {};
    if (updated.name !== undefined) payload.name = updated.name;
    if (updated.type !== undefined) payload.type = updated.type;
    if (updated.investedAmount !== undefined) payload.invested_amount = parseFloat(updated.investedAmount);
    if (updated.currentAmount !== undefined) payload.current_amount = parseFloat(updated.currentAmount);

    await supabase.from('investments').update(payload).eq('id', id);
  };

  const deleteInvestment = async (id) => {
    setInvestments(prev => prev.filter(i => i.id !== id));
    await supabase.from('investments').delete().eq('id', id);
  };

  // ── 10. MÉTRICAS CONSOLIDADAS ──────────────────────────────────────
  const metrics = useMemo(() => {
    const currentEntityAccounts = accounts.filter(a => a.entity === entityType);
    const currentEntityCards = cards.filter(c => c.entity === entityType);
    const currentEntityTxs = transactions.filter(t => t.entity === entityType);

    const initialSum = currentEntityAccounts.reduce((acc, a) => acc + Number(a.initialBalance || 0), 0);
    
    const paidIncomes = currentEntityTxs
      .filter(t => t.type === 'income' && t.status === 'paid')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const paidExpenses = currentEntityTxs
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const realBalance = initialSum + paidIncomes - paidExpenses;

    const pendingExpenses = currentEntityTxs
      .filter(t => t.type === 'expense' && t.status === 'pending')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const pendingIncomes = currentEntityTxs
      .filter(t => t.type === 'income' && t.status === 'pending')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    let unlinkedOpenInvoices = 0;
    let usedLimitTotal = 0;

    currentEntityCards.forEach(card => {
      const months = Array.from(new Set(
        cardExpenses.filter(e => e.cardId === card.id).map(e => e.invoiceMonthYear)
      ));

      months.forEach(mKey => {
        const invData = getInvoiceData(card.id, mKey);
        
        if (invData.status !== 'paga') {
          usedLimitTotal += Number(invData.rawSum);

          const hasLinkedTx = currentEntityTxs.some(t => t.isInvoicePayment && t.cardId === card.id && t.invoiceMonthYear === mKey);
          if (!hasLinkedTx) {
            unlinkedOpenInvoices += Number(invData.finalAmount);
          }
        }
      });
    });

    const projectedBalance = realBalance + pendingIncomes - pendingExpenses - unlinkedOpenInvoices;
    const totalLimit = currentEntityCards.reduce((acc, c) => acc + Number(c.limitTotal || 0), 0);
    const availableLimit = Math.max(0, totalLimit - usedLimitTotal);

    return {
      realBalance,
      projectedBalance,
      paidIncomes,
      paidExpenses,
      pendingExpenses,
      pendingIncomes,
      totalOpenInvoices: unlinkedOpenInvoices || 0,
      totalPendingBills: pendingExpenses + unlinkedOpenInvoices,
      totalLimit,
      usedLimit: usedLimitTotal,
      availableLimit
    };
  }, [accounts, cards, transactions, cardExpenses, invoices, entityType]);

  const theme = entityType === 'PF' 
    ? {
        name: 'Pessoal',
        primary: 'text-indigo-400',
        bgPrimary: 'bg-indigo-600',
        bgHover: 'hover:bg-indigo-700',
        badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        border: 'border-indigo-500/30',
        shadow: 'shadow-indigo-600/20',
      }
    : {
        name: 'Empresa',
        primary: 'text-emerald-400',
        bgPrimary: 'bg-emerald-600',
        bgHover: 'hover:bg-emerald-700',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        border: 'border-emerald-500/30',
        shadow: 'shadow-emerald-600/20',
      };

  return (
    <FinancialContext.Provider value={{
      entityType,
      setEntityType,
      activeTab,
      setActiveTab,
      hideValues,
      setHideValues,
      theme,
      loading,
      accounts: accounts.filter(a => a.entity === entityType),
      rawAccounts: accounts,
      getAccountBalance,
      addAccount,
      updateAccount,
      deleteAccount,
      cards: cards.filter(c => c.entity === entityType),
      rawCards: cards,
      addCard,
      updateCard,
      deleteCard,
      getInvoiceData,
      closeInvoice,
      reopenInvoice,
      payInvoice,
      revertInvoicePayment,
      categories: categories.filter(c => c.entity === entityType || c.entity === 'AMBOS'),
      addCategory,
      updateCategory,
      deleteCategory,
      addSubcategory,
      removeSubcategory,
      cardExpenses: cardExpenses.filter(e => e.entity === entityType),
      addCardExpense,
      deleteCardExpense,
      transactions: transactions.filter(t => t.entity === entityType),
      addTransaction,
      updateTransaction,
      deleteTransaction,
      toggleTransactionStatus,
      addTransfer,
      addBridgeTransfer,
      budgets: budgets.filter(b => b.entity === entityType),
      saveBudget,
      investments: investments.filter(i => i.entity === entityType),
      addInvestment,
      updateInvestment,
      deleteInvestment,
      metrics,
      extratoFilterType,
      setExtratoFilterType
    }}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  return useContext(FinancialContext);
}