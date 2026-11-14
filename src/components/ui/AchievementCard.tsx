import { motion } from 'framer-motion';
import { Achievement } from '../../types';

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
}

export function AchievementCard({ achievement, unlocked }: AchievementCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`
        p-4 rounded-lg pixel-border text-center
        ${unlocked
          ? 'bg-gradient-to-br from-brand-gold/20 to-brand-gold/40 border-brand-gold'
          : 'bg-gray-200/50 border-gray-400 grayscale opacity-60'
        }
      `}
    >
      <div className="text-4xl mb-2">{achievement.icon_url}</div>
      <h3 className="font-minecraft text-xs mb-1">{achievement.name}</h3>
      <p className="font-body text-xs text-gray-600">{achievement.description}</p>
      {unlocked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mt-2 text-brand-gold font-minecraft text-[10px]"
        >
          ✅ Desbloqueado!
        </motion.div>
      )}
    </motion.div>
  );
}
