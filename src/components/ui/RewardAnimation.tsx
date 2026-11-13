import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { Mob, type MobType } from '../mobs';
import { playSound } from '../../lib/sounds';

const CELEBRATING_MOBS: MobType[] = ['steve', 'pig', 'chicken', 'sheep', 'wolf'];

interface RewardAnimationProps {
  show: boolean;
  xpGained: number;
  message?: string;
  /** Estrelas de 1 a 3 (conforme os erros). Sem valor = não mostra. */
  stars?: number;
  onComplete?: () => void;
}

export function RewardAnimation({ show, xpGained, message = 'Muito bem!', stars, onComplete }: RewardAnimationProps) {
  useEffect(() => {
    if (show) playSound('xp');
  }, [show]);

  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-gradient-to-br from-minecraft-gold to-yellow-500 p-8 rounded-lg pixel-border text-center max-w-sm mx-4"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h2 className="font-minecraft text-xl text-white mb-2 drop-shadow-lg">
              {message}
            </h2>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 mt-4"
            >
              <span className="text-3xl">💎</span>
              <span className="font-minecraft text-2xl text-white">+{xpGained} XP</span>
            </motion.div>
            {stars !== undefined && (
              <div
                className="flex justify-center gap-2 mt-3"
                role="img"
                aria-label={`${stars} de 3 estrelas`}
              >
                {[1, 2, 3].map((i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.6 + i * 0.2, type: 'spring' }}
                    className={`text-4xl ${i <= stars ? '' : 'opacity-40 grayscale'}`}
                    aria-hidden="true"
                  >
                    ⭐
                  </motion.span>
                ))}
              </div>
            )}
            {/* Mobs comemorando */}
            <div className="flex justify-center items-end gap-3 mt-5" aria-hidden="true">
              {CELEBRATING_MOBS.map((type, i) => (
                <Mob key={type} type={type} animation="celebrate" size={44} delay={i * 0.15} />
              ))}
            </div>
            {/* Particles */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(i * 30 * Math.PI / 180) * 150,
                  y: Math.sin(i * 30 * Math.PI / 180) * 150,
                  opacity: 0,
                }}
                transition={{ duration: 1.5, delay: 0.2 }}
                className="absolute text-2xl"
                style={{ left: '50%', top: '50%' }}
              >
                ⭐
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
