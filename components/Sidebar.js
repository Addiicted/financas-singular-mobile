// components/Sidebar.js
'use client';

import React from 'react';
import { useFinancial } from '@/context/FinancialContext';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  CreditCard, 
  Target, 
  TrendingUp, 
  RefreshCw, 
  Settings 
} from 'lucide-react';

function Sidebar() {
  const { activeTab, setActiveTab, entityType, theme } = useFinancial();

  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'extrato', label: 'Extrato & Lançamentos', icon: ArrowLeftRight },
    { id: 'cartoes', label: 'Cartões de Crédito', icon: CreditCard },
    { id: 'metas', label: 'Metas & Orçamento', icon: Target },
    { id: 'investimentos', label: 'Investimentos', icon: TrendingUp },
    { id: 'ponte', label: 'A Ponte (PF ↔ PJ)', icon: RefreshCw },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-white/[0.08] bg-slate-950/60 backdrop-blur-2xl p-4 flex flex-col justify-start sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto select-none flex-shrink-0">
      <nav className="space-y-1.5 relative">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-2">
          Menu {entityType === 'PF' ? 'Pessoal' : 'Empresarial'}
        </div>

        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-medium text-xs relative transition-colors duration-200 ${
                isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Cápsula de Luz Deslizante */}
              {isActive && (
                <motion.div
                  layoutId="activeSidebarPill"
                  className={`absolute inset-0 rounded-2xl ${theme.badge} border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]`}
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}

              <Icon size={17} className={`relative z-10 ${isActive ? theme.primary : 'text-slate-400'}`} />
              <span className="relative z-10">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;