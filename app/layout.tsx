// app/layout.tsx
import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Finanças - Gestão Financeira',
  description: 'Dashboard Financeiro',
  appleWebApp: { capable: true, title: 'Finanças', statusBarStyle: 'black-translucent' },
};

// Celular: cor da barra do navegador e uso da área segura (notch / barra inferior do iPhone)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#020617',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}