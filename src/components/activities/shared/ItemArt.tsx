import { PixelArt } from './PixelArt';
import { spriteForEmoji } from './itemSprites';

/** Item em pixel art quando existe desenho próprio; senão, o emoji. */
export function ItemArt({ emoji, size = 40, label, className = '' }: { emoji: string; size?: number; label?: string; className?: string }) {
  const sprite = spriteForEmoji(emoji);
  if (sprite) return <PixelArt sprite={sprite} size={size} label={label} className={className} />;
  return (
    <span className={className} style={{ fontSize: size * 0.85, lineHeight: 1 }} aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined}>
      {emoji}
    </span>
  );
}
