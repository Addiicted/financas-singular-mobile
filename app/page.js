// app/page.js
'use client';

import { FinancialProvider, useFinancial } from '@/context/FinancialContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import DashboardTab from '@/components/DashboardTab';
import ExtratoTab from '@/components/ExtratoTab';
import CartoesTab from '@/components/CartoesTab';
import MetasTab from '@/components/MetasTab';
import InvestimentosTab from '@/components/InvestimentosTab';
import PonteTab from '@/components/PonteTab';
import ConfiguracoesTab from '@/components/ConfiguracoesTab';
import MobileApp from '@/components/mobile/MobileApp';
import { useIsMobile } from '@/components/mobile/useIsMobile';

function AppContent() {
  const { activeTab } = useFinancial();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">

            {/* Todas as Abas do Sistema Integradas */}
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'extrato' && <ExtratoTab />}
            {activeTab === 'cartoes' && <CartoesTab />}
            {activeTab === 'metas' && <MetasTab />}
            {activeTab === 'investimentos' && <InvestimentosTab />}
            {activeTab === 'ponte' && <PonteTab />}
            {activeTab === 'configuracoes' && <ConfiguracoesTab />}

          </div>
        </main>
      </div>
    </div>
  );
}

// Escolhe a versão: celular (< 768px) usa o app mobile, o resto continua no desktop original
function ResponsiveApp() {
  const isMobile = useIsMobile();
  if (isMobile === null) return <div className="min-h-screen bg-slate-950" />;
  return isMobile ? <MobileApp /> : <AppContent />;
}

export default function Home() {
  return (
    <FinancialProvider>
      <ResponsiveApp />
    </FinancialProvider>
  );
}
