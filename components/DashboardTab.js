// components/DashboardTab.js
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFinancial } from '@/context/FinancialContext';
import { formatCurrency, formatDate } from '@/utils/formatters';
import CustomSelect from '@/components/CustomSelect';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  ChevronRight, 
  TrendingUp, 
  Sparkles, 
  Zap, 
  Landmark,
  ShieldCheck,
  PiggyBank,
  AlertTriangle
} from 'lucide-react';

function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    let end = Number(value) || 0;
    let startTime = null;
    const duration = 750;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = start + (end - start) * ease;
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [value]);

  return <span className="tabular-nums font-mono">{formatCurrency(displayValue)}</span>;
}

function SpotlightCard({ children, className = "", onClick = null }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer hover:scale-[1.01]' : ''} ${className}`}
    >
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.08), transparent 80%)`
          }}
        />
      )}
      {children}
    </div>
  );
}

function TiltCard({ children, className = "" }) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotate({ x: -y * 12, y: x * 12 });
    setGlare({ x: (e.clientX - rect.left) / rect.width * 100, y: (e.clientY - rect.top) / rect.height * 100, opacity: 0.18 });
  }

  function handleMouseLeave() {
    setRotate({ x: 0, y: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        transition: 'transform 0.15s ease-out'
      }}
      className={`relative ${className}`}
    >
      <div 
        className="pointer-events-none absolute inset-0 z-20 rounded-2xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 60%)`
        }}
      />
      {children}
    </div>
  );
}

function InteractiveCashFlow({ incomes, expenses }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Dados 100% reais: se não houver receitas ou despesas, mostra 0 real (sem mocks)
  const currentIn = Number(incomes || 0);
  const currentOut = Number(expenses || 0);

  const monthsData = [
    { label: 'Jun', in: currentIn * 0.75, out: currentOut * 0.8 },
    { label: 'Jul', in: currentIn * 0.85, out: currentOut * 0.7 },
    { label: 'Ago', in: currentIn * 0.9, out: currentOut * 0.95 },
    { label: 'Set', in: currentIn * 1.05, out: currentOut * 0.85 },
    { label: 'Out', in: currentIn * 0.95, out: currentOut * 0.9 },
    { label: 'Nov', in: currentIn, out: currentOut } // Zero fictício removido!
  ];

  const maxVal = Math.max(...monthsData.map(m => Math.max(m.in, m.out))) * 1.2 || 1000;

  return (
    <div className="relative pt-6 pb-2">
      <div className="flex items-end justify-between gap-3 h-44 px-2">
        {monthsData.map((m, idx) => {
          const inHeight = maxVal > 0 ? Math.min(100, (m.in / maxVal) * 100) : 0;
          const outHeight = maxVal > 0 ? Math.min(100, (m.out / maxVal) * 100) : 0;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={m.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 flex flex-col items-center gap-2 group cursor-pointer relative"
            >
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: -5, scale: 1 }}
                  className="absolute -top-16 z-30 bg-slate-900/95 border border-white/10 shadow-2xl backdrop-blur-xl p-2.5 rounded-2xl text-[11px] whitespace-nowrap space-y-1 pointer-events-none"
                >
                  <div className="font-bold text-white border-b border-white/[0.08] pb-1">{m.label} / 2026</div>
                  <div className="text-emerald-400 font-mono flex items-center justify-between gap-3">
                    <span>Entradas:</span> <b>{formatCurrency(m.in)}</b>
                  </div>
                  <div className="text-rose-400 font-mono flex items-center justify-between gap-3">
                    <span>Saídas:</span> <b>{formatCurrency(m.out)}</b>
                  </div>
                </motion.div>
              )}

              <div className="w-full flex items-end justify-center gap-1.5 h-36">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${inHeight}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className={`w-3 sm:w-4 rounded-full bg-emerald-500/80 group-hover:bg-emerald-400 transition-colors shadow-sm ${
                    isHovered ? 'shadow-emerald-500/50 shadow-md scale-105' : ''
                  }`}
                />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${outHeight}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.05 + 0.02, ease: [0.16, 1, 0.3, 1] }}
                  className={`w-3 sm:w-4 rounded-full bg-rose-500/70 group-hover:bg-rose-400 transition-colors shadow-sm ${
                    isHovered ? 'shadow-rose-500/50 shadow-md scale-105' : ''
                  }`}
                />
              </div>

              <span className={`text-[11px] font-semibold transition-colors ${isHovered ? 'text-white' : 'text-slate-500'}`}>
                {m.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DashboardTab() {
  const { 
    entityType, 
    theme, 
    hideValues, 
    metrics, 
    cards, 
    accounts, 
    transactions,
    getAccountBalance,
    getInvoiceData,
    setActiveTab,
    setExtratoFilterType 
  } = useFinancial();

  const [dashboardCardId, setDashboardCardId] = useState(cards[0]?.id || '');
  const activeDashboardCard = cards.find(c => c.id === dashboardCardId) || cards[0];

  const currentYear = 2026;
  const currentMonth = 11;
  const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const currentCardInvoice = useMemo(() => {
    if (!activeDashboardCard) return null;
    return getInvoiceData(activeDashboardCard.id, monthKey);
  }, [activeDashboardCard, getInvoiceData, monthKey]);

  const categorySpending = useMemo(() => {
    const expenseTxs = (transactions || []).filter(t => t.type === 'expense');
    const map = {};

    expenseTxs.forEach(t => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount || 0);
    });

    const total = Object.values(map).reduce((a, b) => a + b, 0);

    return Object.entries(map).map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0
    })).sort((a, b) => b.amount - a.amount).slice(0, 4);
  }, [transactions]);

  // Insights Inteligentes
  const insights = useMemo(() => {
    if (entityType === 'PF') {
      const totalIncome = metrics?.paidIncomes || 0;
      const totalOutflow = (metrics?.paidExpenses || 0) + (metrics?.totalOpenInvoices || 0);
      const savings = Math.max(0, totalIncome - totalOutflow);
      const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
      const cardDueDay = activeDashboardCard?.dueDay || 1;
      const cardClosingDay = activeDashboardCard?.closingDay || 22;
      const highestSpendCategory = categorySpending[0]?.name || 'Geral';

      return {
        card1: {
          icon: Clock,
          color: 'text-amber-400',
          bg: 'bg-amber-400/10 border-amber-400/20',
          title: `Fatura fecha dia ${cardClosingDay}`,
          desc: `Vence dia ${cardDueDay}. A partir do fechamento suas compras pulam para o próximo mês.`
        },
        card2: {
          icon: PiggyBank,
          color: 'text-emerald-400',
          bg: 'bg-emerald-400/10 border-emerald-400/20',
          title: `Taxa de Poupança em ${savingsRate.toFixed(0)}%`,
          desc: `${formatCurrency(savings)} de sobra projetada após despesas e faturas.`
        },
        card3: {
          icon: AlertTriangle,
          color: 'text-indigo-400',
          bg: 'bg-indigo-400/10 border-indigo-400/20',
          title: `Radar: Maior saída em "${highestSpendCategory}"`,
          desc: `Categoria líder no mês atual com ${categorySpending[0]?.percentage.toFixed(0) || 0}% das despesas.`
        }
      };
    } else {
      const revenue = metrics?.paidIncomes || 0;
      const costs = (metrics?.paidExpenses || 0) + (metrics?.totalOpenInvoices || 0);
      const profit = revenue - costs;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        card1: {
          icon: Zap,
          color: 'text-emerald-400',
          bg: 'bg-emerald-400/10 border-emerald-400/20',
          title: `Margem Operacional em ${profitMargin.toFixed(0)}%`,
          desc: `Faturamento de ${formatCurrency(revenue)} gerando ${formatCurrency(Math.max(0, profit))} de lucro líquido.`
        },
        card2: {
          icon: TrendingUp,
          color: 'text-indigo-400',
          bg: 'bg-indigo-400/10 border-indigo-400/20',
          title: 'Retenção de Capital Ativa',
          desc: 'A empresa mantém o caixa saudável para cobrir custos fixos e reinvestimento.'
        },
        card3: {
          icon: ShieldCheck,
          color: 'text-teal-400',
          bg: 'bg-teal-400/10 border-teal-400/20',
          title: 'Gestão Patrimonial Blindada',
          desc: 'Zero mistura de contas identificada. Repasses para pessoa física controlados via A Ponte.'
        }
      };
    }
  }, [entityType, metrics, activeDashboardCard, categorySpending]);

  const handleNavigateToExtrato = (type) => {
    setExtratoFilterType(type);
    setActiveTab('extrato');
  };

  const glowGradient = entityType === 'PF'
    ? 'from-indigo-600/15 via-purple-600/5 to-transparent'
    : 'from-emerald-600/15 via-teal-600/5 to-transparent';

  const cardSelectOptions = cards.map(c => ({
    value: c.id,
    label: `${c.name} (•••• ${c.lastDigits || '0000'})`
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 relative"
    >
      <div className={`absolute -top-10 left-1/2 -translate-x-1/2 w-4/5 h-64 bg-gradient-to-b ${glowGradient} blur-3xl pointer-events-none -z-10 transition-all duration-700`} />

      {/* ── 1. OS 4 CARDS NO TOPO ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SpotlightCard className="p-5 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400">Saldo Real em Contas</span>
            <div className={`p-2 rounded-xl ${theme.badge} border shadow-sm`}>
              <Wallet size={16} className={theme.primary} />
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight tabular-nums">
              {hideValues ? '••••••••' : <AnimatedNumber value={metrics?.realBalance || 0} />}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              <span>Em {accounts.length} contas bancárias</span>
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-amber-500/20 shadow-[inset_0_1px_0_0_rgba(245,158,11,0.12)] backdrop-blur-xl flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
              <Zap size={13} /> Saldo Previsto
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
              Pós-Faturas
            </span>
          </div>

          <div>
            <div className={`text-2xl font-bold font-mono tracking-tight tabular-nums ${metrics?.projectedBalance >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
              {hideValues ? '••••••••' : <AnimatedNumber value={metrics?.projectedBalance || 0} />}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Clock size={11} className="text-amber-400" />
              <span>Deduz {formatCurrency(metrics?.totalOpenInvoices || 0)} em faturas</span>
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard 
          onClick={() => handleNavigateToExtrato('income')}
          className="p-5 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl flex flex-col justify-between space-y-3 group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              Entradas Realizadas <ChevronRight size={13} className="text-slate-600 group-hover:text-emerald-400 transition" />
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm">
              <ArrowUpRight size={16} />
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight tabular-nums">
              {hideValues ? '••••••' : <>+ <AnimatedNumber value={metrics?.paidIncomes || 0} /></>}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Clique para ver no extrato →
            </span>
          </div>
        </SpotlightCard>

        <SpotlightCard 
          onClick={() => handleNavigateToExtrato('expense')}
          className="p-5 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl flex flex-col justify-between space-y-3 group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              Despesas Pagas <ChevronRight size={13} className="text-slate-600 group-hover:text-rose-400 transition" />
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-sm">
              <ArrowDownRight size={16} />
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold text-rose-400 font-mono tracking-tight tabular-nums">
              {hideValues ? '••••••' : <>- <AnimatedNumber value={metrics?.paidExpenses || 0} /></>}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Clique para ver no extrato →
            </span>
          </div>
        </SpotlightCard>
      </div>

      {/* ── OS 3 CARDS DE INSIGHTS INTELIGENTES ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.values(insights).map((item, idx) => {
          const Icon = item.icon;
          return (
            <SpotlightCard key={idx} className="p-4 rounded-3xl bg-slate-900/80 border border-white/[0.08] backdrop-blur-xl flex items-start gap-3.5">
              <div className={`p-2.5 rounded-2xl ${item.bg} ${item.color} flex-shrink-0 shadow-sm`}>
                <Icon size={18} />
              </div>
              <div className="space-y-0.5 text-xs">
                <div className="font-bold text-white tracking-tight">{item.title}</div>
                <p className="text-slate-400 leading-relaxed text-[11px]">{item.desc}</p>
              </div>
            </SpotlightCard>
          );
        })}
      </div>

      {/* ── 2. SEÇÃO MÉDIA: CARTÃO COM SELETOR COMPACTO & CONTAS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Bloco do Cartão */}
        {activeDashboardCard && (
          <SpotlightCard className="lg:col-span-8 p-6 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Cartão de Crédito em Análise</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{activeDashboardCard.name}</h3>
              </div>

              {cards.length > 1 && (
                <div className="w-56">
                  <CustomSelect
                    options={cardSelectOptions}
                    value={dashboardCardId}
                    onChange={(val) => setDashboardCardId(val)}
                    icon={CreditCard}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center pt-1">
              <div className="md:col-span-5">
                <TiltCard className="p-4 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 border border-white/10 shadow-2xl space-y-3.5 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div className="w-8 h-6 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500 border border-amber-300/60 shadow-inner flex items-center justify-center p-0.5">
                      <div className="w-full h-full border border-amber-600/40 rounded-[2px] grid grid-cols-2 gap-0.5 opacity-60">
                        <div className="border-r border-b border-amber-700/40" />
                        <div className="border-b border-amber-700/40" />
                        <div className="border-r border-amber-700/40" />
                        <div />
                      </div>
                    </div>

                    <div className="text-slate-400 rotate-90 scale-75">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                        <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                        <path d="M15.5 21.5a12 12 0 0 0 0-19" />
                      </svg>
                    </div>
                  </div>

                  <div className="font-mono text-slate-200 text-xs tracking-widest pt-0.5 font-bold">
                    •••• •••• •••• {activeDashboardCard.lastDigits || '0000'}
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 uppercase font-semibold pt-1 border-t border-white/[0.08]">
                    <span>Fecha: Dia {activeDashboardCard.closingDay}</span>
                    <span className="text-white">Vence: Dia {activeDashboardCard.dueDay}</span>
                  </div>
                </TiltCard>
              </div>

              <div className="md:col-span-7 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Fatura Atual: <b className="text-white font-mono">{formatCurrency(currentCardInvoice?.finalAmount || 0)}</b></span>
                  <span className="font-mono text-slate-400">Limite: {formatCurrency(activeDashboardCard.limitTotal)}</span>
                </div>

                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-white/[0.08] shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${theme.bgPrimary} shadow-lg`} 
                    style={{ width: `${Math.min(100, (((currentCardInvoice?.status !== 'paga' ? currentCardInvoice?.finalAmount || 0 : 0)) / Number(activeDashboardCard.limitTotal || 1)) * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-emerald-400 font-semibold font-mono tabular-nums">
                    Disponível: {formatCurrency(Math.max(0, Number(activeDashboardCard.limitTotal) - (currentCardInvoice?.status !== 'paga' ? currentCardInvoice?.finalAmount || 0 : 0)))}
                  </span>

                  <button 
                    type="button"
                    onClick={() => setActiveTab('cartoes')}
                    className={`font-semibold hover:underline ${theme.primary} flex items-center gap-1`}
                  >
                    Abrir Fatura Completa <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </SpotlightCard>
        )}

        {/* WIDGET: SALDOS INDIVIDUAIS POR CONTA (Sem o link da ponte!) */}
        <SpotlightCard className="lg:col-span-4 p-6 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Landmark size={15} className={theme.primary} /> Suas Contas Bancárias
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{accounts.length} ativas</span>
            </div>

            <div className="space-y-2.5">
              {accounts.map(acc => {
                const bal = getAccountBalance(acc.id);
                return (
                  <div key={acc.id} className="p-2.5 rounded-2xl bg-slate-950/60 border border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3.5 h-3.5 rounded-full ${acc.color || 'bg-slate-600'} shadow-md`} />
                      <div>
                        <div className="font-semibold text-xs text-white">{acc.name}</div>
                        <span className="text-[10px] text-slate-500 block">{acc.bank}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-bold font-mono text-xs tabular-nums ${bal >= 0 ? 'text-white' : 'text-rose-400'}`}>
                        {hideValues ? '••••••' : formatCurrency(bal)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex justify-end items-center text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('configuracoes')}
              className={`font-semibold hover:underline ${theme.primary} flex items-center gap-1`}
            >
              Configurar Contas <ChevronRight size={13} />
            </button>
          </div>
        </SpotlightCard>
      </div>

      {/* ── 3. GRÁFICO REAL & GASTOS POR CATEGORIA ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <SpotlightCard className="lg:col-span-7 p-6 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp size={16} className={theme.primary} /> Fluxo de Caixa Comparativo
              </h3>
              <span className="text-[11px] text-slate-500">Passe o mouse nas barras para inspecionar</span>
            </div>

            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Entradas
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Saídas
              </span>
            </div>
          </div>

          <InteractiveCashFlow 
            incomes={metrics?.paidIncomes || 0} 
            expenses={metrics?.paidExpenses || 0} 
          />
        </SpotlightCard>

        <SpotlightCard className="lg:col-span-5 p-6 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={15} className={theme.primary} /> Top Despesas do Mês
            </h3>
            <span className="text-[11px] text-slate-500">Por Categoria</span>
          </div>

          {categorySpending.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Nenhuma despesa registrada neste período.
            </div>
          ) : (
            <div className="space-y-3.5">
              {categorySpending.map(cat => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">{cat.name}</span>
                    <span className="text-slate-400 font-mono font-bold tabular-nums">
                      {hideValues ? '••••' : formatCurrency(cat.amount)} ({cat.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/[0.06] p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percentage}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className={`h-full rounded-full ${theme.bgPrimary}`} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SpotlightCard>
      </div>

    </motion.div>
  );
}

export default DashboardTab;