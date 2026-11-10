// components/mobile/screens/Mais.js
'use client';

import React, { useState } from 'react';
import { Target, TrendingUp, RefreshCw, Settings, Landmark, CreditCard, Tag, ChevronRight, Monitor, Download, Share, SquarePlus } from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { Money, Panel, Sheet } from '../ui';
import { useInstallPrompt } from '../useInstallPrompt';

function InstallCard() {
  const { canInstall, installed, isIOS, install } = useInstallPrompt();
  const [iosHelp, setIosHelp] = useState(false);
  if (installed || (!canInstall && !isIOS)) return null;

  return (
    <>
      <button type="button" onClick={() => (canInstall ? install() : setIosHelp(true))} className="w-full text-left">
        <div className="relative overflow-hidden rounded-3xl p-4 bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center gap-4">
          <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-white/10" />
          <span className="relative w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-white"><Download size={22} /></span>
          <div className="relative flex-1">
            <p className="font-bold text-white">Instalar o app</p>
            <p className="text-xs text-white/75">Ícone na tela inicial e tela cheia, sem o navegador</p>
          </div>
          <ChevronRight size={18} className="relative text-white/70" />
        </div>
      </button>
      <Sheet open={iosHelp} onClose={() => setIosHelp(false)} title="Instalar no iPhone">
        <ol className="space-y-3 pb-3">
          {[
            [Share, <>Toque em <b className="text-white">Compartilhar</b> na barra do Safari</>],
            [SquarePlus, <>Escolha <b className="text-white">Adicionar à Tela de Início</b></>],
            [Download, <>Confirme em <b className="text-white">Adicionar</b>. Pronto!</>],
          ].map(([Icon, text], i) => (
            <li key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-white/[0.05]">
              <span className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center flex-shrink-0"><Icon size={17} /></span>
              <span className="text-sm text-slate-300">{text}</span>
            </li>
          ))}
        </ol>
      </Sheet>
    </>
  );
}

export default function Mais({ go }) {
  const { metrics, investments, budgets, accounts, cards, categories, entityType } = useFinancial();
  const invested = investments.reduce((a, i) => a + i.currentAmount, 0);

  const tiles = [
    { id: 'metas', label: 'Metas', sub: `${budgets.length} limite${budgets.length !== 1 ? 's' : ''}`, Icon: Target, cls: 'bg-amber-400/15 text-amber-300' },
    { id: 'investimentos', label: 'Investimentos', sub: <Money value={invested} />, Icon: TrendingUp, cls: 'bg-emerald-500/15 text-emerald-300' },
    { id: 'ponte', label: 'A Ponte', sub: 'Repasses PJ → PF', Icon: RefreshCw, cls: 'bg-sky-500/15 text-sky-300' },
    { id: 'configuracoes', label: 'Ajustes', sub: 'Contas e categorias', Icon: Settings, cls: 'bg-slate-500/15 text-slate-300' },
  ];

  const links = [
    { label: 'Contas bancárias', sub: `${accounts.length} cadastrada${accounts.length !== 1 ? 's' : ''}`, Icon: Landmark, tab: 'contas' },
    { label: 'Cartões de crédito', sub: `${cards.length} cadastrado${cards.length !== 1 ? 's' : ''}`, Icon: CreditCard, tab: 'cartoes' },
    { label: 'Categorias', sub: `${categories.filter(c => ['income', 'expense'].includes(c.type)).length} categorias`, Icon: Tag, tab: 'categorias' },
  ];

  return (
    <div className="space-y-5">
      <Panel className="p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center text-xl font-bold text-white">P</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white">Finanças Singular</p>
          <p className="text-xs text-slate-500">{entityType === 'PF' ? 'Perfil pessoal' : 'Perfil empresa'} · saldo <Money value={metrics.realBalance} className="text-slate-300" /></p>
        </div>
      </Panel>

      <InstallCard />

      <div className="grid grid-cols-2 gap-3">
        {tiles.map(t => (
          <button key={t.id} type="button" onClick={() => go(t.id)} className="text-left active:scale-[0.98] transition">
            <Panel className="p-4 h-full">
              <div className={`w-10 h-10 rounded-2xl ${t.cls} flex items-center justify-center mb-4`}><t.Icon size={19} /></div>
              <p className="font-bold text-white text-[15px]">{t.label}</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{t.sub}</p>
            </Panel>
          </button>
        ))}
      </div>

      <Panel className="divide-y divide-white/[0.05]">
        {links.map(l => (
          <button key={l.label} type="button" onClick={() => go('configuracoes', { tab: l.tab })} className="w-full flex items-center gap-3 p-4 text-left active:bg-white/[0.03]">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] text-slate-300 flex items-center justify-center"><l.Icon size={17} /></div>
            <div className="flex-1"><p className="text-sm font-semibold text-white">{l.label}</p><p className="text-xs text-slate-500">{l.sub}</p></div>
            <ChevronRight size={16} className="text-slate-600" />
          </button>
        ))}
      </Panel>

      <p className="text-center text-xs text-slate-600 flex items-center justify-center gap-1.5"><Monitor size={13} /> No computador abre a versão completa</p>
    </div>
  );
}
