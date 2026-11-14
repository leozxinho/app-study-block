import { motion } from 'framer-motion';
import { LevelStatus } from '../../types';
import { isBossLevel, themeForLevel } from '../../data/worldThemes';
import { Mob } from '../mobs';

interface LevelNodeProps {
  levelNumber: number;
  status: LevelStatus;
  stars: number;
  isCurrentLevel: boolean;
  onClick: () => void;
}

export function LevelNode({
  levelNumber,
  status,
  stars,
  isCurrentLevel,
  onClick,
}: LevelNodeProps) {
  const isInteractive = status === 'available' || status === 'in_progress' || status === 'completed';
  const boss = isBossLevel(levelNumber);
  const bossInfo = themeForLevel(levelNumber).boss;

  const getNodeStyles = () => {
    switch (status) {
      case 'completed':
        return 'bg-brand-emerald border-green-800 text-brand-ink shadow-lg shadow-green-500/30';
      case 'available':
      case 'in_progress':
        return 'bg-brand-gold border-yellow-700 text-brand-ink shadow-lg shadow-yellow-500/40';
      case 'locked':
        return 'bg-gray-600 border-gray-800 text-gray-400 opacity-60';
      default:
        return 'bg-gray-600 border-gray-800 text-gray-400';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'available':
      case 'in_progress':
        return '▶';
      case 'locked':
        return '🔒';
      default:
        return '🔒';
    }
  };

  const renderStars = () => {
    if (status !== 'completed') return null;
    return (
      <div className="flex gap-0.5 mt-1 justify-center">
        {[1, 2, 3].map((i) => (
          <span key={i} className="text-xs md:text-sm">
            {i <= stars ? '⭐' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <motion.div
        whileHover={isInteractive ? { scale: 1.15 } : undefined}
        whileTap={isInteractive ? { scale: 0.9 } : undefined}
        animate={
          isCurrentLevel
            ? {
                boxShadow: [
                  '0 0 0 0px rgba(251, 191, 36, 0.4)',
                  '0 0 0 8px rgba(251, 191, 36, 0)',
                ],
              }
            : status === 'available' || status === 'in_progress'
            ? {
                scale: [1, 1.08, 1],
              }
            : undefined
        }
        transition={
          isCurrentLevel
            ? { duration: 1.5, repeat: Infinity, ease: 'easeOut' }
            : status === 'available' || status === 'in_progress'
            ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
        onClick={isInteractive ? onClick : undefined}
        className={`
          w-16 h-16 md:w-20 md:h-20
          rounded-xl pixel-border border-b-4 border-r-2
          flex flex-col items-center justify-center
          font-minecraft text-sm md:text-base
          transition-all duration-200
          ${getNodeStyles()}
          ${isInteractive ? 'cursor-pointer' : 'cursor-not-allowed'}
          ${isCurrentLevel ? 'ring-4 ring-yellow-400/60 ring-offset-2 ring-offset-transparent' : ''}
          ${(status === 'available' || status === 'in_progress') ? 'scale-110' : ''}
          ${boss ? 'border-red-800 ring-2 ring-red-500/60' : ''}
        `}
      >
        {boss && status !== 'completed' ? (
          <span className="leading-none" style={{ filter: status === 'locked' ? 'grayscale(1)' : bossInfo.filter }}>
            <Mob type={bossInfo.type} size={26} animation="idle" title={bossInfo.name} />
          </span>
        ) : (
          <span className="text-lg md:text-xl leading-none">{getIcon()}</span>
        )}
        <span className="text-xs md:text-sm font-bold mt-0.5">{levelNumber}</span>
      </motion.div>
      {boss && <span className="font-minecraft text-[8px] text-red-700 mt-0.5">CHEFE</span>}

      {renderStars()}
    </div>
  );
}
