import { motion } from 'framer-motion';
import { LEVELS } from '../../lib/constants';

interface XPBarProps {
  currentXP: number;
  currentLevel: number;
}

export function XPBar({ currentXP, currentLevel }: XPBarProps) {
  const level = LEVELS[currentLevel - 1] || LEVELS[0];
  const nextLevel = LEVELS[currentLevel] || level;
  const xpInLevel = currentXP - level.minXP;
  const xpNeeded = nextLevel.minXP - level.minXP;
  const progress = xpNeeded > 0 ? (xpInLevel / xpNeeded) * 100 : 100;

  return (
    <div className="bg-minecraft-dark-stone/80 rounded-lg p-3 pixel-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{level.icon}</span>
          <div>
            <p className="font-minecraft text-xs text-minecraft-gold">Nível {currentLevel}</p>
            <p className="font-body text-sm text-white font-bold">{level.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-minecraft text-xs text-minecraft-diamond">
            {currentXP} XP
          </p>
        </div>
      </div>
      <div className="w-full h-3 bg-gray-700 rounded-sm overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-minecraft-emerald to-minecraft-diamond rounded-sm"
        />
      </div>
      <p className="text-[10px] font-body text-gray-400 mt-1 text-right">
        {xpInLevel}/{xpNeeded} XP para o próximo nível
      </p>
    </div>
  );
}
