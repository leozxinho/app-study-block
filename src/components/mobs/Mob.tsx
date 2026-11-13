import { memo, useEffect, useMemo, type CSSProperties } from 'react';
import { useReduceMotion } from '../../lib/motion';

import {
  applySkin,
  getMobPixelSize,
  getPartOrigin,
  type MobAnimation,
  type MobType,
  type PartDef,
  type PlayerSkin,
} from './mobSprites';
import './mobs.css';

interface MobProps {
  type: MobType;
  animation?: MobAnimation;
  /** Altura em px de um humanoide; os outros mobs ficam proporcionais. */
  size?: number;
  facing?: 'left' | 'right';
  /** Quantas vezes a animação roda. Sem valor = sem parar. */
  repeat?: number;
  /** Atraso da animação, em segundos. */
  delay?: number;
  onAnimationEnd?: () => void;
  className?: string;
  /** Texto para leitores de tela. Padrão: nome do mob. */
  title?: string;
  /** Roupa/chapéu (só Steve e Alex). */
  skin?: PlayerSkin;
}

const PARTICLE_COLORS: Partial<Record<MobAnimation, string[]>> = {
  fuse: ['#ffffff', '#d9d9d9', '#7f7f7f', '#4caf3c'],
  teleport: ['#d36cff', '#a03ad6', '#f0c2ff', '#6b1d8f'],
  mine: ['#7f7f7f', '#9b7653', '#5a5a5a'],
  fly: ['#ffd23f', '#ff8c1a', '#fff3b0'],
  power: ['#7df9ff', '#ffffff', '#ffd23f', '#3ad6ff'],
};

const PARTICLE_COUNT = 12;

/** Junta pixels vizinhos da mesma cor numa linha para gerar menos <rect>. */
function PixelGrid({ part, palette }: { part: PartDef; palette: Record<string, string> }) {
  const rects: JSX.Element[] = [];
  part.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === c) run++;
      if (c !== '.' && palette[c]) {
        rects.push(
          <rect
            key={`${x}-${y}`}
            x={part.x + x}
            y={part.y + y}
            width={run}
            height={1}
            fill={palette[c]}
          />
        );
      }
      x += run;
    }
  });
  return <>{rects}</>;
}

function MobPart({ part, palette }: { part: PartDef; palette: Record<string, string> }) {
  const [ox, oy] = getPartOrigin(part);
  return (
    <g
      className={`mob-part mob-${part.role}`}
      style={{ transformOrigin: `${ox}px ${oy}px` }}
    >
      <PixelGrid part={part} palette={palette} />
      {part.children?.map((child, i) => (
        <MobPart key={i} part={child} palette={palette} />
      ))}
    </g>
  );
}

function MobComponent({
  type,
  animation = 'idle',
  size = 64,
  facing = 'right',
  repeat,
  delay = 0,
  onAnimationEnd,
  className = '',
  title,
  skin,
}: MobProps) {
  const def = useMemo(() => applySkin(type, skin), [type, skin]);
  const { width, height } = getMobPixelSize(type, size);
  const reduceMotion = useReduceMotion();

  // Com movimento reduzido as animações CSS não rodam, então avisamos o fim na hora.
  useEffect(() => {
    if (!reduceMotion || repeat === undefined || !onAnimationEnd) return;
    const t = setTimeout(onAnimationEnd, 300);
    return () => clearTimeout(t);
  }, [reduceMotion, repeat, onAnimationEnd, animation]);

  const particles = useMemo(() => {
    const colors = PARTICLE_COLORS[animation];
    const pd = (i: number) => (animation === 'fly' ? (i % 6) * 0.13 : animation === 'teleport' ? (i % 4) * 0.03 : 0);
    if (!colors) return null;
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const dist = animation === 'mine' ? 0.25 + (i % 3) * 0.08 : 0.55 + (i % 3) * 0.15;
      return {
        dx: Math.cos(angle) * width * dist * (animation === 'mine' ? 2 : 1.4),
        dy: Math.sin(angle) * height * dist * (animation === 'mine' ? 0.4 : 0.8),
        color: colors[i % colors.length],
        size: Math.max(3, Math.round(size / (animation === 'power' ? 8 : 12))),
        delay: pd(i),
      };
    });
  }, [animation, width, height, size]);

  const style = {
    width,
    height,
    transform: facing === 'left' ? 'scaleX(-1)' : undefined,
    '--mob-iter': repeat === undefined ? 'infinite' : String(repeat),
    '--mob-delay': `${delay}s`,
  } as CSSProperties;

  return (
    <div
      className={`mob mob-${def.view} mob--${animation} ${className}`}
      style={style}
      role="img"
      aria-label={title ?? def.label}
    >
      <svg
        className="mob-rig"
        viewBox={`0 0 ${def.width} ${def.height}`}
        width={width}
        height={height}
        shapeRendering="crispEdges"
        aria-hidden="true"
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) onAnimationEnd?.();
        }}
      >
        {def.parts.map((part, i) => (
          <MobPart key={i} part={part} palette={def.palette} />
        ))}
      </svg>
      {animation === 'power' && <span className="mob-aura" aria-hidden="true" />}
      {particles?.map((p, i) => (
        <span
          key={i}
          className="mob-particle"
          aria-hidden="true"
          style={
            {
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
              '--pc': p.color,
              '--ps': `${p.size}px`,
              '--pd': `${p.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export const Mob = memo(MobComponent);
