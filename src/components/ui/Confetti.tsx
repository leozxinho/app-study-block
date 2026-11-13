import { useMemo } from 'react';
import type { CSSProperties } from 'react';

const COLORS = ['#f5c518', '#17dd62', '#4aedd9', '#ff5fa2', '#ff8c1a', '#a855f7', '#ffffff'];

/** Confete de bloquinhos caindo na tela inteira (comemoração do fim de fase). */
export function Confetti({ pieces = 60 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: (i * 37 + 11) % 100,
        delay: (i % 12) * 0.12,
        duration: 2.4 + (i % 5) * 0.4,
        size: 6 + (i % 4) * 3,
        color: COLORS[i % COLORS.length],
        drift: ((i % 7) - 3) * 18,
      })),
    [pieces]
  );
  return (
    <div className="fixed inset-0 z-[55] pointer-events-none overflow-hidden" aria-hidden="true">
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti-bit"
          style={
            {
              left: `${b.left}%`,
              width: b.size,
              height: b.size,
              background: b.color,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.duration}s`,
              '--drift': `${b.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
