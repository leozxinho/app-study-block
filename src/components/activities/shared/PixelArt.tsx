import type { PixelSprite } from './pixelSprites';

// ---------- componente ----------

interface PixelArtProps {
  sprite: PixelSprite;
  size?: number;
  className?: string;
  /** Texto para leitor de tela; sem valor fica decorativo. */
  label?: string;
}

export function PixelArt({ sprite, size = 40, className = '', label }: PixelArtProps) {
  const h = sprite.rows.length;
  const w = Math.max(...sprite.rows.map((r) => r.length));
  const rects: JSX.Element[] = [];
  sprite.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === c) run++;
      if (c !== '.' && sprite.palette[c]) {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={sprite.palette[c]} />);
      }
      x += run;
    }
  });
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={(size * h) / w}
      shapeRendering="crispEdges"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {rects}
    </svg>
  );
}
