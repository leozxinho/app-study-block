import { useCallback, useState, type CSSProperties } from 'react';
import { Mob } from './Mob';
import { MOBS, getMobPixelSize, type MobType } from './mobSprites';
import { playMobSound } from '../../lib/sounds';

interface MobWalkerProps {
  type: MobType;
  size?: number;
  /** Segundos para ir e voltar. */
  duration?: number;
  /** Onde começa no percurso (0 a 1). */
  offset?: number;
  /** Ao tocar, o mob pula e faz um som. */
  interactive?: boolean;
}

/** Mob que anda de um lado para o outro dentro do elemento pai (que deve ser `relative`). */
export function MobWalker({ type, size = 48, duration = 20, offset = 0, interactive = true }: MobWalkerProps) {
  const [jumpCount, setJumpCount] = useState(0);
  const [jumping, setJumping] = useState(false);
  const { width } = getMobPixelSize(type, size);

  const handleEnd = useCallback(() => setJumping(false), []);

  const handleClick = () => {
    playMobSound(type);
    setJumping(true);
    setJumpCount((c) => c + 1);
  };

  const style = {
    '--mob-w': `${width}px`,
    '--walk-duration': `${duration}s`,
    '--walk-delay': `${-offset * duration}s`,
    '--walk-start': `${offset * 80}%`,
  } as CSSProperties;

  const mob = (
    <Mob
      key={jumpCount}
      type={type}
      size={size}
      animation={jumping ? 'jump' : 'walk'}
      repeat={jumping ? 1 : undefined}
      onAnimationEnd={jumping ? handleEnd : undefined}
    />
  );

  return (
    <div className="mob-walker" style={style}>
      {interactive ? (
        <button
          type="button"
          onClick={handleClick}
          aria-label={`${MOBS[type].label}: toque para pular`}
          className="block pointer-events-auto cursor-pointer rounded-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-lapis"
        >
          {mob}
        </button>
      ) : (
        mob
      )}
    </div>
  );
}
