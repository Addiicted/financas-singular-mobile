// components/mobile/data.js
// Cálculos por mês usados pelas telas mobile (mesma regra do Extrato do desktop).
'use client';

import { useMemo } from 'react';
import { useFinancial } from '@/context/FinancialContext';
import { monthKey, inMonth, shiftMonth, todayISO } from './ui';

const sum = (arr) => arr.reduce((acc, t) => acc + Number(t.amount || 0), 0);

// Cálculo puro de um mês: lista (com faturas previstas), totais e gastos por categoria
export function computeMonth(month, { transactions, cards, accounts, cardExpenses, getInvoiceData }) {
  const key = monthKey(month);
  const base = transactions.filter(t => inMonth(t.date, month));

  // Faturas de cartão ainda sem lançamento no extrato entram como previsão
  const invoices = [];
  cards.forEach(card => {
    const hasLinked = base.some(t => t.isInvoicePayment && t.cardId === card.id && t.invoiceMonthYear === key);
    if (hasLinked) return;
    const inv = getInvoiceData(card.id, key);
    if (inv.finalAmount > 0) {
      invoices.push({
        id: `dyn_inv_${card.id}_${key}`,
        isInvoicePayment: true,
        isSynthesized: true,
        cardId: card.id,
        invoiceMonthYear: key,
        desc: `Fatura ${card.name}`,
        amount: inv.finalAmount,
        type: 'expense',
        accountId: card.payingAccountId || accounts[0]?.id,
        category: 'Cartão de Crédito',
        subcategory: inv.status === 'fechada' ? 'Fatura fechada' : 'Fatura aberta',
        status: 'pending',
        date: `${key}-${String(card.dueDay || 1).padStart(2, '0')}`,
      });
    }
  });

  const list = [...invoices, ...base].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const incomes = list.filter(t => t.type === 'income');
  const expenses = list.filter(t => t.type === 'expense');
  const totals = {
    incomePaid: sum(incomes.filter(t => t.status === 'paid')),
    incomeAll: sum(incomes),
    expensePaid: sum(expenses.filter(t => t.status === 'paid')),
    expenseAll: sum(expenses),
    pendingExpense: sum(expenses.filter(t => t.status === 'pending')),
    pendingIncome: sum(incomes.filter(t => t.status === 'pending')),
  };
  totals.balance = totals.incomeAll - totals.expenseAll;

  // Gastos por categoria: despesas do extrato (sem pagamento de fatura) + compras no cartão da fatura do mês
  const byCat = {};
  base.filter(t => t.type === 'expense' && !t.isInvoicePayment).forEach(t => {
    byCat[t.category || 'Outros'] = (byCat[t.category || 'Outros'] || 0) + Number(t.amount || 0);
  });
  cardExpenses.filter(e => e.invoiceMonthYear === key).forEach(e => {
    byCat[e.category || 'Outros'] = (byCat[e.category || 'Outros'] || 0) + Number(e.amount || 0);
  });
  const catTotal = Object.values(byCat).reduce((a, b) => a + b, 0);
  const categorySpending = Object.entries(byCat)
    .map(([name, value]) => ({ name, value, percent: catTotal ? (value / catTotal) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);

  return { list, totals, categorySpending, categoryTotal: catTotal, spendingByCategory: byCat };
}

export function useMonthData(month) {
  const { transactions, cards, accounts, cardExpenses, getInvoiceData } = useFinancial();
  return useMemo(
    () => computeMonth(month, { transactions, cards, accounts, cardExpenses, getInvoiceData }),
    // getInvoiceData também lê o estado das faturas (fechada/paga), que o contexto não expõe
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, cards, accounts, cardExpenses, getInvoiceData, month.y, month.m]
  );
}

// Entradas x saídas dos últimos `n` meses (terminando no mês escolhido)
export function useMonthSeries(endMonth, n = 6) {
  const { transactions, cards, accounts, cardExpenses, getInvoiceData } = useFinancial();
  return useMemo(() => {
    const ctx = { transactions, cards, accounts, cardExpenses, getInvoiceData };
    return Array.from({ length: n }, (_, i) => {
      const month = shiftMonth(endMonth, i - (n - 1));
      const { totals } = computeMonth(month, ctx);
      return { month, income: totals.incomeAll, expense: totals.expenseAll };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, cards, accounts, cardExpenses, getInvoiceData, endMonth.y, endMonth.m, n]);
}

// Dias até a próxima data com aquele "dia do mês" (fechamento de fatura etc.)
function daysUntilDay(day) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  let target = new Date(now.getFullYear(), now.getMonth(), day);
  if (target < now) target = new Date(now.getFullYear(), now.getMonth() + 1, day);
  return Math.round((target - now) / 86400000);
}

// Dicas e alertas do mês
export function useInsights(month) {
  const { transactions, cards, getInvoiceData } = useFinancial();
  const { totals, categorySpending, categoryTotal } = useMonthData(month);

  return useMemo(() => {
    const today = todayISO();
    const items = [];

    const overdue = transactions.filter(t => t.type === 'expense' && t.status === 'pending' && (t.date || '') < today);
    if (overdue.length) {
      items.push({
        id: 'overdue', tone: 'rose', kind: 'overdue',
        title: `${overdue.length} conta${overdue.length > 1 ? 's' : ''} atrasada${overdue.length > 1 ? 's' : ''}`,
        value: sum(overdue), text: 'Toque para ver e marcar como pagas',
      });
    }

    if (totals.incomeAll > 0) {
      const rate = ((totals.incomeAll - totals.expenseAll) / totals.incomeAll) * 100;
      items.push({
        id: 'savings', tone: rate >= 20 ? 'emerald' : rate >= 0 ? 'amber' : 'rose', kind: 'savings',
        title: 'Taxa de poupança', percent: rate,
        text: rate >= 20 ? 'Ótimo! Acima dos 20% recomendados' : rate >= 0 ? 'Meta saudável: guardar 20% ou mais' : 'Você gastou mais do que recebeu',
      });
    }

    if (categorySpending[0]) {
      const top = categorySpending[0];
      items.push({
        id: 'top', tone: 'indigo', kind: 'top', category: top.name,
        title: `Maior gasto: ${top.name}`, value: top.value,
        text: `${top.percent.toFixed(0)}% de tudo que saiu no mês`,
      });
    }

    const nowKey = monthKey({ y: new Date().getFullYear(), m: new Date().getMonth() + 1 });
    const closing = cards
      .map(c => ({ card: c, days: daysUntilDay(c.closingDay || 1), inv: getInvoiceData(c.id, nowKey) }))
      .filter(x => x.inv.status === 'aberta' && x.inv.finalAmount > 0)
      .sort((a, b) => a.days - b.days)[0];
    if (closing) {
      items.push({
        id: 'closing', tone: 'purple', kind: 'closing', cardId: closing.card.id,
        title: closing.days === 0 ? `Fatura ${closing.card.name} fecha hoje` : `Fatura ${closing.card.name} fecha em ${closing.days} dia${closing.days > 1 ? 's' : ''}`,
        value: closing.inv.finalAmount, text: 'Compras depois disso vão para a próxima fatura',
      });
    }

    if (totals.pendingIncome > 0) {
      items.push({ id: 'receive', tone: 'emerald', kind: 'receive', title: 'A receber no mês', value: totals.pendingIncome, text: 'Receitas ainda pendentes' });
    }

    return { items, overdue, categoryTotal };
  },[transactions, cards, getInvoiceData, totals, categorySpending, categoryTotal]);
}

// Agrupa uma lista de lançamentos por dia (mais recente primeiro)
export function groupByDay(list) {
  const groups = [];
  const map = {};
  list.forEach(t => {
    const d = t.date || 'sem-data';
    if (!map[d]) { map[d] = { date: d, items: [], total: 0 }; groups.push(map[d]); }
    map[d].items.push(t);
    map[d].total += (t.type === 'income' ? 1 : t.type === 'expense' ? -1 : 0) * Number(t.amount || 0);
  });
  return groups;
}
