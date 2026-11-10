// components/mobile/actions.js
// Ações rápidas com aviso e "Desfazer" (usadas no deslizar e no detalhe).
'use client';

import { useFinancial } from '@/context/FinancialContext';
import { useToast, haptic } from './feedback';

export function useQuickActions() {
  const { toggleTransactionStatus, deleteTransaction, addTransaction, deleteCardExpense, addCardExpense } = useFinancial();
  const toast = useToast();

  // Pagamento de fatura e transferência têm regras próprias: não excluir pelo gesto
  const canDelete = (t) => !t.isSynthesized && !t.isInvoicePayment && t.type !== 'transfer';
  const canToggle = (t) => !t.isSynthesized && !t.isInvoicePayment;

  const togglePaid = async (t) => {
    haptic();
    const saving = toggleTransactionStatus(t.id);
    const nowPaid = t.status !== 'paid';
    toast(nowPaid ? (t.type === 'income' ? 'Marcado como recebido' : 'Marcado como pago') : 'Voltou para pendente', {
      tone: nowPaid ? 'success' : 'info',
      actionLabel: 'Desfazer',
      onAction: () => toggleTransactionStatus(t.id),
    });
    await saving;
  };

  const removeTx = async (t) => {
    haptic([10, 40, 10]);
    const saving = deleteTransaction(t.id);
    toast('Lançamento excluído', {
      tone: 'danger',
      actionLabel: 'Desfazer',
      onAction: () => addTransaction({
        desc: t.desc, amount: t.amount, type: t.type, accountId: t.accountId, category: t.category,
        subcategory: t.subcategory, status: t.status, date: t.date, notes: t.notes,
      }),
    });
    await saving;
  };

  const removeCardExpense = async (e) => {
    haptic([10, 40, 10]);
    const saving = deleteCardExpense(e.id);
    toast('Compra excluída', {
      tone: 'danger',
      actionLabel: 'Desfazer',
      onAction: () => addCardExpense({
        cardId: e.cardId, desc: e.desc, amount: e.amount, installment: e.installment, category: e.category,
        subcategory: e.subcategory, date: e.date, invoiceMonthYear: e.invoiceMonthYear,
      }),
    });
    await saving;
  };

  return { togglePaid, removeTx, removeCardExpense, canDelete, canToggle };
}
