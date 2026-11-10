// Manifesto do app instalável (PWA): ícone na tela inicial e abertura em tela cheia
export default function manifest() {
  return {
    name: 'Finanças Singular',
    short_name: 'Finanças',
    description: 'Controle financeiro pessoal e empresarial',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#020617',
    theme_color: '#020617',
    lang: 'pt-BR',
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
