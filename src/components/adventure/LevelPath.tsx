import { motion } from 'framer-motion';

interface LevelPathProps {
  completed: boolean;
  direction: 'up' | 'down' | 'straight';
}

export function LevelPath({ completed, direction }: LevelPathProps) {
  const getPath = () => {
    switch (direction) {
      case 'up':
        return 'M 12 0 Q 8 20, 12 40';
      case 'down':
        return 'M 12 0 Q 16 20, 12 40';
      case 'straight':
      default:
        return 'M 12 0 L 12 40';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="flex items-center justify-center h-10 md:h-12 w-6"
    >
      <svg
        width="24"
        height="40"
        viewBox="0 0 24 40"
        fill="none"
        className="overflow-visible"
      >
        <path
          d={getPath()}
          stroke={completed ? '#10b981' : '#6b7280'}
          strokeWidth={completed ? 4 : 3}
          strokeLinecap="round"
          strokeDasharray={completed ? 'none' : '6 4'}
          fill="none"
        />
        {completed && (
          <motion.path
            d={getPath()}
            stroke="#34d399"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </svg>
    </motion.div>
  );
}
