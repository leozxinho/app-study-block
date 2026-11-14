import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface MinecraftButtonProps {
  children: ReactNode;
  onClick?: () => void;
  /** Vira um link <a href> (o buscador segue), com o mesmo visual de botão. */
  href?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'gold' | 'info';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  /** Fonte de leitura fácil (Nunito) no lugar da pixel: para textos longos e para os pais. */
  plain?: boolean;
}

// Cor do texto por fundo (contraste): fundos claros (dourado, esmeralda) usam texto escuro
const variants = {
  primary: 'bg-brand-green hover:bg-brand-dark-green border-brand-dark-green text-white',
  secondary: 'bg-brand-stone hover:bg-brand-dark-stone border-brand-dark-stone text-white',
  danger: 'bg-brand-redstone hover:bg-red-700 border-red-900 text-white',
  success: 'bg-brand-emerald hover:bg-emerald-400 border-green-800 text-brand-ink',
  gold: 'bg-brand-gold hover:bg-amber-300 border-amber-700 text-brand-ink',
  info: 'bg-brand-lapis hover:bg-blue-700 border-blue-900 text-white',
};

// Altura mínima: alvo de toque confortável (44 px; 48 px a partir do médio)
const sizes = {
  sm: 'px-3 py-1.5 text-xs min-h-[44px]',
  md: 'px-5 py-2.5 text-sm min-h-[48px]',
  lg: 'px-8 py-4 text-base min-h-[56px]',
  xl: 'px-10 py-5 text-lg min-h-[64px]',
};
const plainSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-xl' };

export function MinecraftButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  fullWidth = false,
  href,
  plain = false,
}: MinecraftButtonProps) {
  const look = `
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${plain ? `font-body font-extrabold ${plainSizes[size]}` : 'font-minecraft'}
        focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-lapis focus-visible:ring-offset-2
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
      <Link to={href} onClick={onClick} className={`${look} inline-flex items-center justify-center text-center transition-transform hover:scale-105 active:scale-95`}>
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
