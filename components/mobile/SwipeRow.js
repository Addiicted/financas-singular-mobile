// components/mobile/SwipeRow.js
// Linha que pode ser arrastada para os lados para revelar ações (como em apps de banco).
// Direita → ação verde (ex: marcar pago). Esquerda → ação vermelha (ex: excluir).
'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { haptic } from './feedback';

export default function SwipeRow({
  children,
  onSwipeRight, rightLabel, RightIcon, rightClass = 'bg-emerald-600',
  onSwipeLeft, leftLabel, LeftIcon, leftClass = 'bg-rose-600',
  disabled = false,
}) {
  const x = useMotionValue(0);
  const ref = useRef(null);
  const moved = useRef(false);
  const armed = useRef(0);

  const rightOpacity = useTransform(x, [0, 40], [0, 1]);
  const leftOpacity = useTransform(x, [-40, 0], [1, 0]);
  const rightScale = useTransform(x, [0, 90], [0.6, 1]);
  const leftScale = useTransform(x, [-90, 0], [1, 0.6]);

  if (disabled || (!onSwipeRight && !onSwipeLeft)) return <div>{children}</div>;

  const threshold = () => (ref.current?.offsetWidth || 320) * 0.35;

  return (
    <div ref={ref} className="relative overflow-hidden">
      {onSwipeRight && (
        <motion.div style={{ opacity: rightOpacity }} className={`absolute inset-0 ${rightClass} flex items-center pl-5 gap-2 text-white text-sm font-bold`}>
          <motion.span style={{ scale: rightScale }} className="flex items-center gap-2">{RightIcon && <RightIcon size={18} />}{rightLabel}</motion.span>
        </motion.div>
      )}
      {onSwipeLeft && (
        <motion.div style={{ opacity: leftOpacity }} className={`absolute inset-0 ${leftClass} flex items-center justify-end pr-5 gap-2 text-white text-sm font-bold`}>
          <motion.span style={{ scale: leftScale }} className="flex items-center gap-2">{leftLabel}{LeftIcon && <LeftIcon size={18} />}</motion.span>
        </motion.div>
      )}

      <motion.div
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: onSwipeLeft ? -9999 : 0, right: onSwipeRight ? 9999 : 0 }}
        dragElastic={0.08}
        dragMomentum={false}
        onDragStart={() => { moved.current = true; armed.current = 0; }}
        onDrag={(_, info) => {
          const t = threshold();
          const state = info.offset.x > t ? 1 : info.offset.x < -t ? -1 : 0;
          if (state !== armed.current && state !== 0) haptic(10);
          armed.current = state;
        }}
        onDragEnd={(_, info) => {
          const t = threshold();
          const width = ref.current?.offsetWidth || 320;
          const goRight = onSwipeRight && (info.offset.x > t || info.velocity.x > 700);
          const goLeft = onSwipeLeft && (info.offset.x < -t || info.velocity.x < -700);
          if (goRight) {
            animate(x, 0, { type: 'spring', stiffness: 400, damping: 35 });
            onSwipeRight();
          } else if (goLeft) {
            animate(x, -width, { duration: 0.18 }).then(() => { onSwipeLeft(); x.set(0); });
          } else {
            animate(x, 0, { type: 'spring', stiffness: 500, damping: 38 });
          }
          setTimeout(() => { moved.current = false; }, 50);
        }}
        onClickCapture={(e) => { if (moved.current) { e.stopPropagation(); e.preventDefault(); } }}
        className="relative bg-slate-900 touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
