// components/mobile/MobileApp.js
// Versão mobile: topo compacto, conteúdo e menu fixo embaixo com botão "+" central.
'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Home, Receipt, CreditCard, LayoutGrid, Plus, Eye, EyeOff, ChevronLeft,
  ArrowDownRight, ArrowUpRight, ArrowLeftRight, CheckCircle2, Clock, Pencil, Trash2,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import Inicio from './screens/Inicio';
import Extrato from './screens/Extrato';
import Cartoes from './screens/Cartoes';
import Mais from './screens/Mais';
import Metas from './screens/Metas';
import Investimentos from './screens/Investimentos';
import Ponte from './screens/Ponte';
import Ajustes from './screens/Ajustes';
import { Sheet, Money, CategoryIcon, shortDate } from './ui';
import { TransactionSheet, TransferSheet, CardExpenseSheet, ConfirmSheet } from './forms';
import { ToastProvider, haptic } from './feedback';
import { useBackHandler } from './useBackHandler';
import { useQuickActions } from './actions';

const TITLES = {
  dashboard: 'Início', extrato: 'Extrato', cartoes: 'Cartões', mais: 'Mais',
  metas: 'Metas', investimentos: 'Investimentos', ponte: 'A Ponte', configuracoes: 'Ajustes',
};
const SUBPAGES = ['metas', 'investimentos', 'ponte', 'configuracoes'];

function TopBar({ screen, onBack }) {
  const { entityType, setEntityType, hideValues, setHideValues } = useFinancial();
  const isSub = SUBPAGES.includes(screen);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 pt-[env(safe-area-inset-top)] transition-colors ${scrolled ? 'bg-slate-950/85 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-slate-950 border-b border-transparent'}`}>
      <div className="h-14 px-4 flex items-center gap-3">
        {isSub && (
          <button type="button" onClick={onBack} aria-label="Voltar" className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center text-slate-300 active:bg-white/10">
            <ChevronLeft size={22} />
          </button>
        )}
        <h1 className="flex-1 text-[19px] font-extrabold tracking-tight text-white truncate">{TITLES[screen]}</h1>

        {/* PF / PJ */}
        <div className="flex bg-slate-900 border border-white/[0.07] rounded-xl p-0.5" role="group" aria-label="Perfil">
          {['PF', 'PJ'].map(t => (
            <button key={t} type="button" aria-pressed={entityType === t} onClick={() => { haptic(8); setEntityType(t); }}
              className={`relative h-9 px-3 rounded-[10px] text-xs font-bold transition-colors ${entityType === t ? 'text-white' : 'text-slate-500'}`}>
              {entityType === t && (
                <motion.span layoutId="mobile-entity" className={`absolute inset-0 rounded-[10px] ${t === 'PF' ? 'bg-indigo-600' : 'bg-emerald-600'}`} transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
              )}
              <span className="relative">{t}</span>
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setHideValues(!hideValues)} aria-label={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
          className="w-10 h-10 rounded-xl bg-slate-900 border border-white/[0.07] flex items-center justify-center text-slate-400 active:bg-white/10">
          {hideValues ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </header>
  );
}

function NavItem({ id, label, Icon, active, go }) {
  const on = active === id;
  return (
    <button type="button" onClick={() => go(id)} aria-current={on ? 'page' : undefined}
      className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors ${on ? 'text-white' : 'text-slate-500'}`}>
      <Icon size={21} strokeWidth={on ? 2.4 : 1.8} />
      <span className={`text-[10px] ${on ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </button>
  );
}

function BottomNav({ screen, go, onPlus }) {
  const { theme } = useFinancial();
  const active = SUBPAGES.includes(screen) ? 'mais' : screen;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/85 backdrop-blur-xl border-t border-white/[0.06] pb-[env(safe-area-inset-bottom)]" aria-label="Menu principal">
      <div className="h-16 flex items-stretch px-2">
        <NavItem id="dashboard" label="Início" Icon={Home} active={active} go={go} />
        <NavItem id="extrato" label="Extrato" Icon={Receipt} active={active} go={go} />
        <div className="flex-1 flex items-center justify-center">
          <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={onPlus} aria-label="Novo lançamento"
            className={`w-14 h-14 -mt-6 rounded-2xl ${theme.bgPrimary} text-white flex items-center justify-center shadow-lg ${theme.shadow} ring-4 ring-slate-950`}>
            <Plus size={26} strokeWidth={2.6} />
          </motion.button>
        </div>
        <NavItem id="cartoes" label="Cartões" Icon={CreditCard} active={active} go={go} />
        <NavItem id="mais" label="Mais" Icon={LayoutGrid} active={active} go={go} />
      </div>
    </nav>
  );
}

function TxDetailSheet({ tx, onClose, onEdit }) {
  const { accounts, transactions } = useFinancial();
  const { togglePaid, removeTx, canDelete, canToggle } = useQuickActions();
  const [confirm, setConfirm] = useState(false);
  const live = tx ? transactions.find(t => t.id === tx.id) || tx : null;
  const acc = live ? accounts.find(a => a.id === live.accountId) : null;
  const isIncome = live?.type === 'income';

  return (
    <>
      <Sheet open={!!tx} onClose={onClose} title="Lançamento">
        {live && (
          <div className="pb-2">
            <div className="text-center pb-5">
              <div className="flex justify-center"><CategoryIcon name={live.category} isInvoice={live.isInvoicePayment} /></div>
              <p className="text-white font-bold mt-3">{live.desc}</p>
              <Money value={live.amount} className={`block text-[32px] font-extrabold mt-1 ${isIncome ? 'text-emerald-300' : 'text-white'}`} />
              <span className={`inline-flex items-center gap-1 mt-2 text-xs font-bold px-2.5 py-1 rounded-full ${live.status === 'paid' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-300'}`}>
                {live.status === 'paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                {live.status === 'paid' ? (isIncome ? 'Recebido' : 'Pago') : 'Pendente'}
              </span>
            </div>

            <div className="rounded-2xl bg-slate-950/60 border border-white/[0.05] divide-y divide-white/[0.05] text-sm">
              {[
                ['Data', shortDate(live.date)],
                ['Conta', acc?.name || '—'],
                ['Categoria', [live.category, live.subcategory].filter(Boolean).join(' · ')],
                ...(live.notes ? [['Observação', live.notes]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-3">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-200 text-right">{v}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <button type="button" disabled={!canToggle(live)} onClick={() => togglePaid(live)} className="h-16 rounded-2xl bg-white/[0.05] flex flex-col items-center justify-center gap-1 text-xs font-semibold text-slate-200 disabled:opacity-30">
                {live.status === 'paid' ? <Clock size={18} /> : <CheckCircle2 size={18} className="text-emerald-300" />}
                {live.status === 'paid' ? 'Pendente' : isIncome ? 'Recebido' : 'Pago'}
              </button>
              <button type="button" disabled={live.type === 'transfer' || live.isInvoicePayment} onClick={() => onEdit(live)} className="h-16 rounded-2xl bg-white/[0.05] flex flex-col items-center justify-center gap-1 text-xs font-semibold text-slate-200 disabled:opacity-30">
                <Pencil size={18} /> Editar
              </button>
              <button type="button" disabled={!canDelete(live)} onClick={() => setConfirm(true)} className="h-16 rounded-2xl bg-rose-500/10 flex flex-col items-center justify-center gap-1 text-xs font-semibold text-rose-300 disabled:opacity-30">
                <Trash2 size={18} /> Excluir
              </button>
            </div>
            {live.isInvoicePayment && <p className="text-xs text-slate-500 text-center mt-3">Pagamento de fatura: desfaça pela tela Cartões.</p>}
          </div>
        )}
      </Sheet>
      <ConfirmSheet open={confirm} onClose={() => setConfirm(false)} title="Excluir lançamento?" text={`"${live?.desc}" será removido do extrato.`} confirmLabel="Excluir" danger
        onConfirm={async () => { onClose(); await removeTx(live); }} />
    </>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-label="Carregando">
      <div className="h-11 rounded-2xl bg-white/[0.04]" />
      <div className="h-40 rounded-[28px] bg-white/[0.06]" />
      <div className="grid grid-cols-2 gap-3"><div className="h-28 rounded-3xl bg-white/[0.04]" /><div className="h-28 rounded-3xl bg-white/[0.04]" /></div>
      <div className="h-48 rounded-3xl bg-white/[0.04]" />
    </div>
  );
}

function MobileShell() {
  const { loading } = useFinancial();
  const now = new Date();
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() + 1 });
  const [screen, setScreen] = useState('dashboard');
  const [parent, setParent] = useState('mais'); // de onde a subtela foi aberta
  const [params, setParams] = useState({});      // { cardId, tab, category }

  const [plusOpen, setPlusOpen] = useState(false);
  const [txSheet, setTxSheet] = useState(null); // { type, editing }
  const [transferOpen, setTransferOpen] = useState(false);
  const [cardSheet, setCardSheet] = useState(false);
  const [detail, setDetail] = useState(null);

  const go = (id, opts = {}) => {
    setParams(opts);
    if (id === screen) return;
    if (SUBPAGES.includes(id) && !SUBPAGES.includes(screen)) setParent(screen);
    setScreen(id);
  };
  const back = () => setScreen(SUBPAGES.includes(screen) ? parent : 'dashboard');

  // Botão voltar do celular: subtela → tela de origem; abas → Início
  useBackHandler(screen !== 'dashboard' ? screen : null, back);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [screen]);

  const pick = (what) => {
    setPlusOpen(false);
    if (what === 'expense' || what === 'income') setTxSheet({ type: what, editing: null });
    if (what === 'transfer') setTransferOpen(true);
    if (what === 'card') setCardSheet(true);
  };

  const shared = { month, setMonth, go, onOpenTx: setDetail, onNew: () => setPlusOpen(true) };

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <TopBar screen={screen} onBack={back} />

      <main className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+104px)]">
        {loading ? <Skeleton /> : (
          // Sem esperar animação de saída: a nova tela aparece na hora
          <motion.div key={screen} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
              {screen === 'dashboard' && <Inicio {...shared} />}
              {screen === 'extrato' && <Extrato {...shared} initialCategory={params.category} />}
              {screen === 'cartoes' && <Cartoes {...shared} focusCardId={params.cardId} />}
              {screen === 'mais' && <Mais go={go} />}
              {screen === 'metas' && <Metas {...shared} />}
              {screen === 'investimentos' && <Investimentos />}
              {screen === 'ponte' && <Ponte month={month} />}
              {screen === 'configuracoes' && <Ajustes initialTab={params.tab} />}
          </motion.div>
        )}
      </main>

      <BottomNav screen={screen} go={go} onPlus={() => { haptic(8); setPlusOpen(true); }} />

      {/* Menu do botão + */}
      <Sheet open={plusOpen} onClose={() => setPlusOpen(false)} title="Novo lançamento">
        <div className="grid grid-cols-2 gap-3 pb-3">
          {[
            { id: 'expense', label: 'Despesa', Icon: ArrowDownRight, cls: 'bg-rose-500/15 text-rose-300' },
            { id: 'income', label: 'Receita', Icon: ArrowUpRight, cls: 'bg-emerald-500/15 text-emerald-300' },
            { id: 'card', label: 'Compra no cartão', Icon: CreditCard, cls: 'bg-purple-500/15 text-purple-300' },
            { id: 'transfer', label: 'Transferência', Icon: ArrowLeftRight, cls: 'bg-sky-500/15 text-sky-300' },
          ].map(o => (
            <button key={o.id} type="button" onClick={() => pick(o.id)} className="h-28 rounded-3xl bg-slate-950/60 border border-white/[0.06] flex flex-col items-start justify-between p-4 active:scale-[0.97] transition">
              <span className={`w-11 h-11 rounded-2xl ${o.cls} flex items-center justify-center`}><o.Icon size={21} /></span>
              <span className="text-sm font-bold text-white">{o.label}</span>
            </button>
          ))}
        </div>
      </Sheet>

      <TransactionSheet open={!!txSheet} onClose={() => setTxSheet(null)} initialType={txSheet?.type || 'expense'} editing={txSheet?.editing || null} />
      <TransferSheet open={transferOpen} onClose={() => setTransferOpen(false)} />
      <CardExpenseSheet open={cardSheet} onClose={() => setCardSheet(false)} defaultMonth={month} />
      <TxDetailSheet tx={detail} onClose={() => setDetail(null)} onEdit={(t) => { setDetail(null); setTxSheet({ type: t.type, editing: t }); }} />
    </div>
  );
}

export default function MobileApp() {
  return (
    <ToastProvider>
      <MobileShell />
    </ToastProvider>
  );
}
