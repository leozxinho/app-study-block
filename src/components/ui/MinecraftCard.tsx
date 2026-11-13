import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MinecraftCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  gradient?: string;
}

export function MinecraftCard({
  children,
  className = '',
  onClick,
  hoverable = false,
  gradient,
}: MinecraftCardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { scale: 1.03, y: -4 } : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      onClick={onClick}
      className={`
        ${gradient ? `bg-gradient-to-br ${gradient}` : 'bg-white'}
        rounded-lg pixel-border p-4 shadow-lg
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
