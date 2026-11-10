'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 767px)';

function subscribe(callback) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

// true no celular, false no desktop, null durante a renderização no servidor
export function useIsMobile() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => null
  );
}
