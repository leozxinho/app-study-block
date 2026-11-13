import { motion } from 'framer-motion';
import { getDailyProgress, getDailyStreak, useGameStats } from '../../services/gameStatsService';

/** Ofensiva 🔥 (dias seguidos) e meta do dia com o baú, no topo das telas da criança. */
export function DailyStatus() {
  const stats = useGameStats();
  const streak = getDailyStreak(stats);
  const daily = getDailyProgress(stats);
  const label = `${streak} ${streak === 1 ? 'dia seguido' : 'dias seguidos'}. Meta do dia: ${daily.done} de ${daily.goal} fases${daily.chest ? ', baú aberto' : ''}.`;

  return (
    <div className="flex items-center gap-1.5" role="status" aria-label={label} title={label}>
      <span
        className={`flex items-center gap-0.5 rounded-md px-2 py-1 font-minecraft text-xs ${
          daily.playedToday ? 'bg-orange-500 text-white' : 'bg-black/25 text-white/70'
        }`}
      >
        <motion.span
          aria-hidden="true"
          animate={daily.playedToday ? { scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] } : undefined}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }}
          className={daily.playedToday ? '' : 'grayscale'}
        >
          🔥
        </motion.span>
        {streak}
      </span>
      <span className="flex items-center gap-1 rounded-md bg-black/25 px-2 py-1" aria-hidden="true">
        <span className="flex gap-0.5">
          {Array.from({ length: daily.goal }, (_, i) => (
            <span key={i} className={`w-2 h-3 rounded-sm ${i < daily.done ? 'bg-minecraft-gold' : 'bg-white/30'}`} />
          ))}
        </span>
        <motion.span
          animate={daily.chest ? { y: [0, -3, 0] } : undefined}
          transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
          className={daily.chest ? '' : 'opacity-70'}
        >
          {daily.chest ? '🎁' : '📦'}
        </motion.span>
      </span>
    </div>
  );
}
