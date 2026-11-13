import { motion } from 'framer-motion';
import { MobWalker } from '../mobs';
import type { WorldTheme } from '../../data/worldThemes';

/** Posições dos enfeites flutuando no céu: [esquerda %, topo %, tamanho px, atraso s] */
const SPOTS: [number, number, number, number][] = [
  [3, 14, 44, 0], [86, 10, 52, 1.2], [14, 48, 36, 0.6], [90, 44, 40, 1.8], [48, 6, 32, 2.4], [70, 66, 34, 0.9], [6, 76, 30, 1.5],
];

/** Cenário do mundo atrás da fase: céu, enfeites flutuando, chão e mobs do mundo passeando. */
export function WorldBackdrop({ theme }: { theme: WorldTheme }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.sky}`} />
      {/* estrelinhas nos mundos escuros */}
      {theme.dark &&
        Array.from({ length: 24 }, (_, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 bg-white/60"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 23) % 60}%` }}
          />
        ))}
      {SPOTS.map(([left, top, size, delay], i) => (
        <motion.span
          key={i}
          className="absolute select-none opacity-40"
          style={{ left: `${left}%`, top: `${top}%`, fontSize: size }}
          animate={{ y: [0, -12, 0], rotate: [0, 4, -4, 0] }}
          transition={{ duration: 5 + (i % 3), delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          {theme.decor[i % theme.decor.length]}
        </motion.span>
      ))}
      {/* chão do mundo */}
      <div className="absolute inset-x-0 bottom-0 h-20" style={{ background: theme.ground }} />
      <div className="absolute inset-x-0 bottom-16 h-16">
        {theme.walkers.map((type, i) => (
          <MobWalker key={`${type}-${i}`} type={type} size={40} duration={22 + i * 6} offset={0.15 + i * 0.3} interactive={false} />
        ))}
      </div>
    </div>
  );
}
