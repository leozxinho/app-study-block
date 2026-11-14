import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { useReduceMotion } from '../../lib/motion';

import { applySkin, type MobDef, type PartDef, type PlayerCharacter, type PlayerSkin } from './mobSprites';

// =============================================================
// Boneco 3D (blocos CSS 3D) para ver a skin em 360°.
// Cada parte (cabeça, corpo, braços, pernas) vira um bloco com 6 faces.
// A frente usa o desenho do personagem; costas, lados, topo e base são
// gerados a partir dele (cabelo atrás da cabeça, bordas nos lados...).
// =============================================================

type Grid = string[]; // linhas de caracteres da paleta ('.' = vazio)

interface Box {
  key: string;
  x: number; // em "pixels" do desenho (grade 16 x 32)
  y: number;
  w: number;
  h: number;
  d: number; // profundidade
  z: number; // deslocamento para trás (capa)
  front: Grid;
  back: Grid;
  left: Grid;
  right: Grid;
  top: Grid;
  bottom: Grid;
}

const DEPTH: Record<string, number> = { head: 8, body: 4, 'arm-a': 4, 'arm-b': 4, 'leg-a': 4, 'leg-b': 4 };

const width = (rows: Grid) => Math.max(...rows.map((r) => r.length));
const pad = (rows: Grid, w: number) => rows.map((r) => r.padEnd(w, '.'));
const mirror = (rows: Grid) => rows.map((r) => r.split('').reverse().join(''));
const col = (rows: Grid, c: number) => rows.map((r) => r[c] ?? '.');
const fillCols = (column: string[], n: number) => column.map((ch) => ch.repeat(n));
const fillRows = (row: string, n: number) => Array.from({ length: n }, () => row);

/** Grade -> imagem SVG (data URL) com pixels nítidos. */
function texture(rows: Grid, palette: Record<string, string>): string {
  const h = rows.length;
  const w = width(rows);
  let rects = '';
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = palette[row[x]];
      if (c) rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${c}"/>`;
    }
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

/** Desenha os filhos (máscara, emblema, mechas...) por cima da frente das partes onde eles caem. */
function stamp(target: { x: number; y: number; grid: string[][] }, child: PartDef) {
  child.rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      const ch = row[rx];
      if (ch === '.') continue;
      const gx = child.x + rx - target.x;
      const gy = child.y + ry - target.y;
      if (gy >= 0 && gy < target.grid.length && gx >= 0 && gx < target.grid[0].length) target.grid[gy][gx] = ch;
    }
  });
}

function buildBoxes(def: MobDef): Box[] {
  const main = def.parts.filter((p) => DEPTH[p.role] !== undefined);
  const others = def.parts.filter((p) => DEPTH[p.role] === undefined);
  const children = def.parts.flatMap((p) => (p.children ?? []).filter((c) => c.role !== 'tool'));
  const boxes: Box[] = [];

  // Frentes com os detalhes aplicados
  const fronts = main.map((p) => ({ p, x: p.x, y: p.y, grid: pad(p.rows, width(p.rows)).map((r) => r.split('')) }));
  // Capa (detalhe atrás, mais larga que o corpo) vira uma placa nas costas
  const isCape = (d: PartDef) => d.x < 0 && width(d.rows) > 16;
  for (const d of others) if (!isCape(d)) fronts.forEach((f) => stamp(f, d));
  for (const c of children) {
    const insideSomeBox = fronts.some((f) => c.y >= f.y && c.y < f.y + f.grid.length);
    if (insideSomeBox) fronts.forEach((f) => stamp(f, c));
  }

  for (const f of fronts) {
    const { p } = f;
    const front = f.grid.map((r) => r.join(''));
    const raw = pad(p.rows, width(p.rows));
    const w = width(raw);
    const h = raw.length;
    const d = DEPTH[p.role];
    let back: Grid;
    if (p.role === 'head') {
      // Atrás da cabeça: cabelo (cor do canto de cima), com a nuca nas 2 últimas linhas
      // primeira cor que não é vazio no topo (cabelo espetado começa com '.')
      const hair = (raw[0] + raw[1]).split('').find((ch) => ch !== '.') ?? raw[0][0];
      back = raw.map((row, r) => (r < h - 2 ? hair.repeat(w) : mirror([row])[0]));
    } else {
      back = mirror(raw).map((row, r) => (r === 0 && p.role === 'body' ? row.replace(/S/g, row[0]) : row));
    }
    boxes.push({
      key: p.role,
      x: p.x, y: p.y, w, h, d, z: 0,
      front,
      back,
      left: fillCols(col(raw, 0), d),
      right: fillCols(col(raw, w - 1), d),
      top: fillRows(raw[0], d),
      bottom: fillRows(raw[h - 1], d),
    });
  }

  // Chapéu: o que fica acima da cabeça vira um bloco em cima
  const head = main.find((p) => p.role === 'head');
  const headChildren = head?.children ?? [];
  for (const c of headChildren) {
    if (head && c.y < head.y) {
      const rows = pad(c.rows.slice(0, head.y - c.y), width(c.rows));
      const w = width(rows);
      boxes.push({
        key: `hat-${c.x}`, x: c.x, y: c.y, w, h: rows.length, d: 9, z: 0,
        front: rows, back: mirror(rows),
        left: fillCols(col(rows, 0), 9), right: fillCols(col(rows, w - 1), 9),
        top: fillRows(rows[0].replace(/\./g, rows[rows.length - 1][Math.floor(w / 2)]), 9),
        bottom: fillRows(rows[rows.length - 1], 9),
      });
    }
  }

  // Capa
  for (const c of others.filter(isCape)) {
    const rows = pad(c.rows, width(c.rows));
    const w = width(rows);
    boxes.push({
      key: 'cape', x: c.x, y: c.y, w, h: rows.length, d: 1, z: -2.6,
      front: rows, back: rows,
      left: fillCols(col(rows, 0), 1), right: fillCols(col(rows, w - 1), 1),
      top: fillRows(rows[0], 1), bottom: fillRows(rows[rows.length - 1], 1),
    });
  }
  return boxes;
}

interface Mob3DProps {
  type: PlayerCharacter;
  skin: PlayerSkin;
  /** Tamanho de cada "pixel" do boneco, em px */
  unit?: number;
  /** Ângulo controlado de fora (graus) */
  angle: number;
}

/** Boneco 3D girando no eixo vertical. */
export function Mob3D({ type, skin, unit = 7, angle }: Mob3DProps) {
  const def = useMemo(() => applySkin(type, skin), [type, skin]);
  const boxes = useMemo(() => buildBoxes(def), [def]);
  const tex = useMemo(() => {
    const cache = new Map<string, string>();
    const get = (g: Grid) => {
      const k = g.join('|');
      if (!cache.has(k)) cache.set(k, texture(g, def.palette));
      return cache.get(k)!;
    };
    return get;
  }, [def]);

  return (
    <div className="relative" style={{ width: 20 * unit, height: 40 * unit, perspective: 900 }}>
      <div
        className="absolute left-1/2 top-1/2"
        style={{ transformStyle: 'preserve-3d', transform: `rotateX(-12deg) rotateY(${angle}deg)` }}
      >
        {boxes.map((b) => {
          const cx = (b.x + b.w / 2 - 8) * unit;
          const cy = (b.y + b.h / 2 - 17) * unit;
          const W = b.w * unit;
          const H = b.h * unit;
          const D = b.d * unit;
          const face = (g: Grid, fw: number, fh: number, transform: string): CSSProperties => ({
            position: 'absolute',
            width: fw,
            height: fh,
            left: -fw / 2,
            top: -fh / 2,
            backgroundImage: tex(g),
            backgroundSize: '100% 100%',
            imageRendering: 'pixelated',
            transform,
            backfaceVisibility: 'hidden',
          });
          return (
            <div key={b.key} style={{ position: 'absolute', transformStyle: 'preserve-3d', transform: `translate3d(${cx}px, ${cy}px, ${b.z * unit}px)` }}>
              <div style={face(b.front, W, H, `translateZ(${D / 2}px)`)} />
              <div style={face(b.back, W, H, `rotateY(180deg) translateZ(${D / 2}px)`)} />
              <div style={face(b.right, D, H, `rotateY(90deg) translateZ(${W / 2}px)`)} />
              <div style={face(b.left, D, H, `rotateY(-90deg) translateZ(${W / 2}px)`)} />
              <div style={face(b.top, W, D, `rotateX(90deg) translateZ(${H / 2}px)`)} />
              <div style={face(b.bottom, W, D, `rotateX(-90deg) translateZ(${H / 2}px)`)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface Viewer360Props {
  type: PlayerCharacter;
  skin: PlayerSkin;
  unit?: number;
  label?: string;
}

/** Visualizador 360°: gira sozinho, arrasta com o dedo/mouse, botões e setas do teclado. */
export function Viewer360({ type, skin, unit = 7, label = 'Boneco em 360 graus' }: Viewer360Props) {
  const reduce = useReduceMotion();
  const [angle, setAngle] = useState(-25);
  const [spinning, setSpinning] = useState(!reduce);
  const drag = useRef<{ x: number; a: number } | null>(null);

  // Giro automático (para quando o usuário arrasta)
  useEffect(() => {
    if (!spinning || reduce) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      setAngle((a) => (a + (t - last) * 0.06) % 360);
      last = t;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spinning, reduce]);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    setSpinning(false);
    drag.current = { x: e.clientX, a: angle };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current) setAngle(drag.current.a + (e.clientX - drag.current.x) * 0.8);
  };
  const onUp = () => {
    drag.current = null;
  };

  const turn = (deg: number) => {
    setSpinning(false);
    setAngle((a) => a + deg);
  };

  const btn =
    'min-h-[44px] min-w-[44px] px-3 rounded-md bg-white border-2 border-gray-300 font-body font-bold text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-lapis';

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="img"
        aria-label={`${label}. Arraste para girar.`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') turn(-30);
          if (e.key === 'ArrowRight') turn(30);
        }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="drag-handle cursor-grab active:cursor-grabbing rounded-lg bg-gradient-to-b from-sky-200 to-green-200 pixel-border flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-lapis"
        style={{ width: 24 * unit, height: 44 * unit }}
      >
        <Mob3D type={type} skin={skin} unit={unit} angle={angle} />
      </div>
      <div className="flex gap-2">
        <button type="button" className={btn} onClick={() => turn(-45)} aria-label="Girar para a esquerda">⟲</button>
        <button type="button" className={btn} onClick={() => setAngle(0)} aria-label="Ver de frente">Frente</button>
        <button type="button" className={btn} onClick={() => setAngle(180)} aria-label="Ver de costas">Costas</button>
        <button type="button" className={btn} onClick={() => turn(45)} aria-label="Girar para a direita">⟳</button>
        {!reduce && (
          <button type="button" className={btn} onClick={() => setSpinning((s) => !s)} aria-pressed={spinning} aria-label={spinning ? 'Parar de girar' : 'Girar sozinho'}>
            {spinning ? '⏸' : '▶'}
          </button>
        )}
      </div>
    </div>
  );
}
