import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: string;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

export function ProgressBar({
  value,
  max,
  color = 'bg-minecraft-emerald',
  height = 'h-4',
  showLabel = true,
  label,
  animated = true,
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-sm font-body font-bold text-gray-700">{label}</span>}
          {showLabel && <span className="text-sm font-body font-bold text-gray-600">{percentage}%</span>}
        </div>
      )}
      <div className={`w-full ${height} bg-gray-300 rounded-sm pixel-border overflow-hidden`}>
        <motion.div
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`${height} ${color} rounded-sm relative`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
        </motion.div>
      </div>
    </div>
  );
}
