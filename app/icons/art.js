// app/icons/art.js
// Desenho do ícone do app (usado pelo manifesto e pelo ícone do iPhone).
import { ImageResponse } from 'next/og';

export function appIcon(size) {
  const glyph = Math.round(size * 0.5);
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%)',
        }}
      >
        <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
          <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
          <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  );
}
