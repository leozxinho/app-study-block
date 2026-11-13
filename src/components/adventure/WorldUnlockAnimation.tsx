import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { playVoiceSequence } from '../../lib/voice';
import { Mob } from '../mobs';

interface WorldUnlockAnimationProps {
  show: boolean;
  worldName: string;
  worldIcon: string;
  onComplete: () => void;
}

const particles = ['⭐', '✨', '🌟', '💫', '🎊', '🎉'];

export function WorldUnlockAnimation({
  show,
  worldName,
  worldIcon,
  onComplete,
}: WorldUnlockAnimationProps) {
  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (show) {
      playVoiceSequence(['voz/mundos/desbloqueado.mp3']);
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
          transition={{ duration: 0.3 }}
          onClick={onComplete}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
        >
          {/* Particle Effects */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.span
              key={i}
              initial={{
                opacity: 1,
                x: 0,
                y: 0,
                scale: 0,
              }}
              animate={{
                opacity: [1, 1, 0],
                x: (Math.random() - 0.5) * 300,
                y: (Math.random() - 0.5) * 400,
                scale: [0, 1.5, 0.5],
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 2.5,
                delay: 0.2 + i * 0.1,
                ease: 'easeOut',
              }}
              className="absolute text-2xl md:text-3xl pointer-events-none"
            >
              {particles[i % particles.length]}
            </motion.span>
          ))}

          {/* Main Card */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
            className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-2xl pixel-border p-8 md:p-12 text-center max-w-sm mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Celebration Emoji */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [-5, 5, -5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="text-5xl md:text-6xl mb-4"
            >
              🎉
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-minecraft text-xl md:text-2xl text-white mb-4 drop-shadow-lg"
            >
              Mundo Concluído!
            </motion.h2>

            {/* World Icon + Enderman se teleportando */}
            <div className="flex items-end justify-center gap-4 mb-4">
              <Mob type="enderman" animation="teleport" size={52} />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                className="text-6xl md:text-7xl"
              >
                {worldIcon}
              </motion.div>
            </div>

            {/* Unlock Message */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="font-body text-base md:text-lg text-white/90"
            >
              Você desbloqueou:{' '}
              <span className="font-minecraft text-yellow-300">
                {worldName}
              </span>
              ! {worldIcon}
            </motion.p>

            {/* Tap to dismiss hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1] }}
              transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
              className="font-body text-xs text-white/50 mt-6"
            >
              Toque para continuar
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
