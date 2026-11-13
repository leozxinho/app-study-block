import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AchievementDef } from '../../services/gameStatsService';

interface AchievementToastProps {
  achievements: AchievementDef[];
  onDone: () => void;
}

/** Aviso "Conquista desbloqueada!" no topo da tela. */
export function AchievementToast({ achievements, onDone }: AchievementToastProps) {
  useEffect(() => {
    if (achievements.length === 0) return;
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [achievements, onDone]);

  return (
    <div className="fixed top-16 inset-x-0 z-[70] flex flex-col items-center gap-2 pointer-events-none px-4" role="status" aria-live="polite">
      <AnimatePresence>
        {achievements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: -30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.4 + i * 0.3, type: 'spring' }}
            className="flex items-center gap-3 bg-gray-900/95 text-white rounded-lg pixel-border px-4 py-3 shadow-xl max-w-sm"
          >
            <span className="text-3xl" aria-hidden="true">{a.icon}</span>
            <div>
              <p className="font-minecraft text-[10px] text-minecraft-gold">Conquista desbloqueada!</p>
              <p className="font-body font-bold">{a.name}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
