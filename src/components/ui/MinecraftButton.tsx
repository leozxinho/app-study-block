import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface MinecraftButtonProps {
  children: ReactNode;
  onClick?: () => void;
  /** Vira um link <a href> (o buscador segue), com o mesmo visual de botão. */
  href?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

const variants = {
  primary: 'bg-minecraft-green hover:bg-minecraft-dark-green border-minecraft-dark-green',
  secondary: 'bg-minecraft-stone hover:bg-minecraft-dark-stone border-minecraft-dark-stone',
  danger: 'bg-minecraft-redstone hover:bg-red-700 border-red-900',
  success: 'bg-minecraft-emerald hover:bg-green-600 border-green-800',
  gold: 'bg-minecraft-gold hover:bg-yellow-500 border-yellow-700',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-4 text-base',
  xl: 'px-10 py-5 text-lg',
};

export function MinecraftButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  fullWidth = false,
  href,
}: MinecraftButtonProps) {
  const look = `
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        font-minecraft text-white
        border-b-4 border-r-2
        rounded-sm
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-lg
        pixel-border
        ${className}
      `;
  if (href) {
    return (
      <Link to={href} onClick={onClick} className={`${look} inline-block text-center transition-transform hover:scale-105 active:scale-95`}>
        {children}
      </Link>
    );
  }
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={look}
    >
      {children}
    </motion.button>
  );
}
