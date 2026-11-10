// components/mobile/useInstallPrompt.js
// Detecta se o app pode ser instalado (Android/Chrome) ou se é iPhone (instruções manuais).
'use client';

import { useEffect, useState } from 'react';

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    // Atualiza depois do primeiro render (a informação só existe no navegador)
    const id = requestAnimationFrame(() => { setInstalled(standalone); setIsIOS(ios); });
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return false;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === 'accepted';
  };

  return { canInstall: !!deferred, installed, isIOS, install };
}
