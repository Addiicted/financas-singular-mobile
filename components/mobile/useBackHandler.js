// components/mobile/useBackHandler.js
// Faz o botão "voltar" do celular fechar o painel aberto / voltar de tela,
// em vez de sair do app.
//
// Como funciona: enquanto houver alguma camada aberta (painel ou subtela), o histórico
// do navegador tem UMA entrada extra ("trava"). O voltar consome a trava e fecha só a
// camada do topo; se ainda sobrar camada aberta, a trava é recolocada. Trocar de tela
// não mexe no histórico, então ele nunca fica desalinhado.
'use client';

import { useEffect, useRef } from 'react';

const stack = [];
let trapped = false;
let ignorePops = 0;
let listening = false;
let scheduled = false;

// Ajusta o histórico depois que todas as camadas do mesmo render se registraram
function scheduleSync() {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    if (stack.length > 0 && !trapped) {
      window.history.pushState({ mobileTrap: true }, '');
      trapped = true;
    } else if (stack.length === 0 && trapped) {
      trapped = false;
      ignorePops++;
      window.history.back();
    }
  }, 0);
}

function ensureListener() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('popstate', () => {
    if (ignorePops > 0) { ignorePops--; return; }
    trapped = false; // o navegador acabou de consumir a trava
    const top = stack[stack.length - 1];
    if (top) top.current?.();
    scheduleSync();
  });
}

// `active`: qualquer valor verdadeiro (pode ser uma chave, como o nome da tela)
export function useBackHandler(active, onBack) {
  const cb = useRef(onBack);
  useEffect(() => { cb.current = onBack; });

  useEffect(() => {
    if (!active) return;
    ensureListener();
    const entry = cb;
    stack.push(entry);
    scheduleSync();
    return () => {
      const i = stack.lastIndexOf(entry);
      if (i !== -1) stack.splice(i, 1);
      scheduleSync();
    };
  }, [active]);
}
