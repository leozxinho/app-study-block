import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useReduceMotion } from '../../../lib/motion';
import { LayoutGroup, motion } from 'framer-motion';
import { Mob, type MobAnimation } from '../../mobs';
import { playCount, playSfx, playSound } from '../../../lib/sounds';
import { mobsOnScreen, type MathProblem } from '../../../lib/mathGenerator';
import type { MathUnit } from '../../../lib/activityParsers';
import { PixelArt } from './PixelArt';
import { BLOCKS } from './pixelSprites';
import { ADD_COUNT_MS, ADD_MERGE_MS, DIV_MOVE_MS, MULT_COUNT_MS, SUB_SMOKE_MS } from './mathSceneTiming';

interface SceneProps {
  problem: MathProblem;
  unit: MathUnit;
  /** Item do 2º grupo, quando é diferente ("2 esmeraldas + 3 rubis") */
  unitB?: MathUnit;
  /** Acertou: comemora (pula, conta um a um, partículas de XP) */
  celebrate: boolean;
  /** Muda para repetir a animação (depois de um erro) */
  replay?: number;
  /** Repete mais devagar */
  slow?: boolean;
  /** Versão menor (dentro da múltipla escolha) */
  compact?: boolean;
}

/** Cena da conta com mobs: cada operação tem sua animação. */
export function MathMobsScene(props: SceneProps) {
  return <SceneInner key={props.replay ?? 0} {...props} />;
}

// ------------------------------------------------------------------
// Figura (mob ou bloco)
// ------------------------------------------------------------------

function Figure({ unit, size, animation = 'idle', facing, repeat }: { unit: MathUnit; size: number; animation?: MobAnimation; facing?: 'left' | 'right'; repeat?: number }) {
  if (unit.mob) {
    return <Mob type={unit.mob} size={size * (unit.sizeFactor ?? 1)} animation={animation} facing={facing} repeat={repeat} title={unit.singular} />;
  }
  return <PixelArt sprite={BLOCKS[unit.block ?? 'grama']} size={Math.round(size * 0.8)} label={unit.singular} />;
}

/** Tamanho da figura: menor quando tem muitos na tela (máximo 20). */
function figureSize(total: number, compact?: boolean) {
  const base = total <= 6 ? 44 : total <= 12 ? 34 : 26;
  return compact ? Math.round(base * 0.75) : base;
}

function SceneInner({ problem, unit, unitB, celebrate, slow, compact }: SceneProps) {
  const reduce = useReduceMotion();
  // Sem movimento: só aparece/some, rápido. Depois de um erro: tudo mais devagar.
  const factor = reduce ? 0.2 : slow ? 2 : 1;
  const total = mobsOnScreen(problem);
  const size = figureSize(total, compact);

  return (
    <div className="relative w-full" aria-hidden="true">
      {problem.op === '+' && <AddScene problem={problem} unit={unit} unitB={unitB ?? unit} size={size} factor={factor} celebrate={celebrate} />}
      {problem.op === '-' && <SubScene problem={problem} unit={unit} size={size} factor={factor} celebrate={celebrate} />}
      {problem.op === '×' && <MultScene problem={problem} unit={unit} size={size} factor={factor} celebrate={celebrate} />}
      {problem.op === '÷' && <DivScene problem={problem} unit={unit} size={size} factor={factor} celebrate={celebrate} />}
      {celebrate && !reduce && <XpBurst />}
    </div>
  );
}

interface OpProps {
  problem: MathProblem;
  unit: MathUnit;
  size: number;
  factor: number;
  celebrate: boolean;
}

const Badge = ({ n }: { n: number }) => (
  <span className="pop-in absolute -top-3 left-1/2 -translate-x-1/2 min-w-[22px] h-[22px] px-1 rounded-sm bg-minecraft-dark-green text-white font-minecraft text-[10px] flex items-center justify-center z-10">
    {n}
  </span>
);

// ------------------------------------------------------------------
// ADIÇÃO: dois grupos separados (cada um com seu número) entram pelos lados.
// No acerto: os grupos se juntam, cada item é contado (1, 2, 3...) e aparece "a + b = total".
// ------------------------------------------------------------------

/**
 * Texto de conta na fonte de blocos, com os sinais × − ÷ na fonte comum
 * (a fonte pixelada não tem esses sinais).
 */
function MathText({ text }: { text: string }) {
  return (
    <>
      {text.split(/([×−÷])/).map((part, i) =>
        /^[×−÷]$/.test(part) ? (
          <span key={i} className="font-body font-black text-[1.4em] leading-none mx-0.5">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/** Moldura de um grupo com o número dele embaixo. */
function Group({ tone, label, children }: { tone: 'a' | 'b' | 'total'; label: ReactNode; children: ReactNode }) {
  const frame =
    tone === 'a'
      ? 'border-sky-500 bg-sky-50/80'
      : tone === 'b'
      ? 'border-pink-500 bg-pink-50/80'
      : 'border-minecraft-gold bg-amber-50/90';
  const chip = tone === 'a' ? 'bg-sky-600' : tone === 'b' ? 'bg-pink-600' : 'bg-minecraft-dark-green';
  return (
    <motion.div layout className="flex flex-col items-center gap-1.5">
      <motion.div
        layout
        className={`flex flex-wrap items-end justify-center gap-x-1 gap-y-4 pt-4 pb-1.5 px-2 rounded-md border-2 border-dashed ${frame}`}
      >
        {children}
      </motion.div>
      <motion.span
        layout
        key={String(label)}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`min-w-[28px] px-2 h-7 rounded-sm text-white font-minecraft text-sm flex items-center justify-center ${chip}`}
      >
        {typeof label === 'string' ? <MathText text={label} /> : label}
      </motion.span>
    </motion.div>
  );
}

function AddScene({ problem, unit, unitB, size, factor, celebrate }: OpProps & { unitB: MathUnit }) {
  const total = problem.a + problem.b;
  const [counted, setCounted] = useState(0);

  // Acertou: espera os grupos se juntarem e conta um por um
  useEffect(() => {
    if (!celebrate) return;
    let i = 0;
    let id = 0;
    const start = window.setTimeout(() => {
      id = window.setInterval(() => {
        i++;
        setCounted(i);
        playCount(i, i === total);
        if (i >= total) clearInterval(id);
      }, ADD_COUNT_MS);
    }, ADD_MERGE_MS * factor);
    return () => {
      clearTimeout(start);
      clearInterval(id);
    };
  }, [celebrate, total, factor]);

  const item = (k: number) => {
    const right = k >= problem.a;
    const delay = (right ? k - problem.a : k) * 0.08 * factor;
    const jumping = counted > k;
    return (
      <motion.div
        key={k}
        layoutId={`add-${k}`}
        className="relative"
        initial={{ x: right ? 160 : -160, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.1 * factor, delay: celebrate ? 0 : delay, layout: { duration: 0.5 * factor } }}
      >
        {jumping && <Badge n={k + 1} />}
        <Figure
          key={jumping ? 'jump' : celebrate ? 'idle' : 'walk-or-idle'}
          unit={right ? unitB : unit}
          size={size}
          animation={jumping ? 'jump' : 'idle'}
          repeat={jumping ? 1 : undefined}
          facing={right ? 'left' : 'right'}
        />
      </motion.div>
    );
  };

  const finished = counted >= total;
  return (
    <LayoutGroup>
      <div className="flex flex-wrap items-center justify-center gap-3 min-h-[96px]">
        {celebrate ? (
          <Group tone="total" label={finished ? `${problem.a} + ${problem.b} = ${total}` : counted || '…'}>
            {Array.from({ length: total }, (_, k) => item(k))}
          </Group>
        ) : (
          <>
            <Group tone="a" label={problem.a}>
              {Array.from({ length: problem.a }, (_, k) => item(k))}
            </Group>
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 * factor }}
              className="font-minecraft text-3xl text-gray-800 px-1"
            >
              +
            </motion.span>
            <Group tone="b" label={problem.b}>
              {Array.from({ length: problem.b }, (_, k) => item(problem.a + k))}
            </Group>
          </>
        )}
      </div>
    </LayoutGroup>
  );
}

// ------------------------------------------------------------------
// SUBTRAÇÃO: um grupo com todos; os que vão sair ficam marcados (✕) e o "− b" aparece ao lado.
// No acerto: os marcados viram fumaça, os que sobram são contados (1, 2, 3...) e aparece "a − b = resto".
// ------------------------------------------------------------------

function SubScene({ problem, unit, size, factor, celebrate }: OpProps) {
  const keep = problem.a - problem.b;
  const [gone, setGone] = useState(false); // fumaça terminou
  const [counted, setCounted] = useState(0);

  useEffect(() => {
    if (!celebrate) return;
    let i = 0;
    let id = 0;
    playSfx('fumaca');
    const smoke = window.setTimeout(() => setGone(true), SUB_SMOKE_MS * factor);
    const start = window.setTimeout(() => {
      if (keep <= 0) return;
      id = window.setInterval(() => {
        i++;
        setCounted(i);
        playCount(i, i === keep);
        if (i >= keep) clearInterval(id);
      }, ADD_COUNT_MS);
    }, (SUB_SMOKE_MS + 200) * factor);
    return () => {
      clearTimeout(smoke);
      clearTimeout(start);
      clearInterval(id);
    };
  }, [celebrate, keep, factor]);

  const finished = celebrate && gone && counted >= keep;
  const label = !celebrate
    ? problem.a
    : finished
    ? `${problem.a} − ${problem.b} = ${keep}`
    : counted || '…';

  return (
    <LayoutGroup>
      <div className="flex flex-wrap items-center justify-center gap-3 min-h-[96px]">
        <Group tone={celebrate ? 'total' : 'a'} label={label}>
          {Array.from({ length: problem.a }).map((_, k) => {
            const removed = k >= keep;
            if (removed && gone) return null;
            if (removed && celebrate) return <Smoke key={k} size={size} />;
            const jumping = !removed && counted > k;
            return (
              <motion.div
                key={k}
                layout
                className={`relative rounded-sm ${removed ? 'bg-red-200/70 ring-2 ring-red-500' : ''}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: celebrate ? 0 : k * 0.05 * factor, duration: 0.3 * factor, layout: { duration: 0.4 * factor } }}
              >
                {jumping && <Badge n={k + 1} />}
                {removed && (
                  <span className="mm-blink absolute inset-0 z-10 flex items-center justify-center font-minecraft text-2xl text-red-600 [text-shadow:0_0_3px_#fff,0_0_3px_#fff]">
                    ✕
                  </span>
                )}
                <Figure
                  key={jumping ? 'jump' : 'idle'}
                  unit={unit}
                  size={size}
                  animation={jumping ? 'jump' : 'idle'}
                  repeat={jumping ? 1 : undefined}
                />
              </motion.div>
            );
          })}
        </Group>
        {!celebrate && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 * factor }}
            className="flex items-center gap-2"
          >
            <span className="font-body font-black text-4xl text-gray-800">−</span>
            <span className="flex flex-col items-center gap-1">
              <span className="font-body text-xs font-bold text-red-700">saem</span>
              <span className="min-w-[28px] px-2 h-7 rounded-sm bg-pink-600 text-white font-minecraft text-sm flex items-center justify-center">
                {problem.b}
              </span>
            </span>
          </motion.div>
        )}
      </div>
    </LayoutGroup>
  );
}

/** Nuvem de fumaça pixelada. */
function Smoke({ size }: { size: number }) {
  const puffs = useMemo(
    () => Array.from({ length: 7 }, (_, i) => ({ dx: Math.cos((i / 7) * 6.28) * 18, dy: Math.sin((i / 7) * 6.28) * 14 - 6 })),
    []
  );
  return (
    <div className="relative" style={{ width: size * 0.7, height: size }}>
      {puffs.map((p, i) => (
        <span key={i} className="mm-smoke" style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px` } as CSSProperties} />
      ))}
    </div>
  );
}

// ------------------------------------------------------------------
// MULTIPLICAÇÃO: fileiras iguais, cada uma com o seu número (b) ao lado; embaixo "a fileiras".
// No acerto: conta um por um, fileira por fileira, e o número de cada fileira vira a soma
// acumulada (3, 6, 9...). No fim aparece "a x b = total".
// ------------------------------------------------------------------

function MultScene({ problem, unit, size, factor, celebrate }: OpProps) {
  const total = problem.a * problem.b;
  const [counted, setCounted] = useState(0);

  useEffect(() => {
    if (!celebrate) return;
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setCounted(i);
      // som mais forte ao fechar cada fileira
      if (i % problem.b === 0 && i !== total) playSound('star');
      else playCount(i, i === total);
      if (i >= total) clearInterval(id);
    }, MULT_COUNT_MS);
    return () => clearInterval(id);
  }, [celebrate, total, problem.b]);

  const finished = celebrate && counted >= total;
  const label = !celebrate ? `${problem.a} fileiras de ${problem.b}` : finished ? `${problem.a} × ${problem.b} = ${total}` : counted || '…';

  return (
    <div className="flex justify-center pt-1">
      <Group tone={celebrate ? 'total' : 'a'} label={label}>
        <div className="flex flex-col items-stretch gap-1.5">
          {Array.from({ length: problem.a }).map((_, row) => {
            const rowDone = counted >= (row + 1) * problem.b;
            return (
              <motion.div
                key={row}
                className={`flex items-end gap-1 rounded-sm px-1 pt-3 pb-0.5 border-2 border-dashed ${rowDone ? 'border-minecraft-gold bg-amber-100/70' : 'border-pink-400 bg-pink-50/70'}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: row * 0.5 * factor, duration: 0.3 * factor }}
              >
                {Array.from({ length: problem.b }).map((__, col) => {
                  const k = row * problem.b + col;
                  const jumping = counted > k;
                  return (
                    <motion.div
                      key={col}
                      className="relative"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: (row * 0.5 + col * 0.08) * factor, type: 'spring' }}
                    >
                      {jumping && <Badge n={k + 1} />}
                      <Figure key={jumping ? 'jump' : 'idle'} unit={unit} size={size} animation={jumping ? 'jump' : 'idle'} repeat={jumping ? 1 : undefined} />
                    </motion.div>
                  );
                })}
                {/* número da fileira: b antes; depois de contar, a soma até aqui */}
                <motion.span
                  key={rowDone ? 'sum' : 'b'}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  className={`ml-1 self-center min-w-[26px] px-1.5 h-6 rounded-sm text-white font-minecraft text-xs flex items-center justify-center ${rowDone ? 'bg-minecraft-dark-green' : 'bg-pink-600'}`}
                >
                  {rowDone ? (row + 1) * problem.b : problem.b}
                </motion.span>
              </motion.div>
            );
          })}
        </div>
      </Group>
    </div>
  );
}

// ------------------------------------------------------------------
// DIVISÃO: todos juntos num grupo (a) e os cercados vazios ao lado ("÷ b cercados").
// No acerto: entram nos cercados um de cada vez, igualmente; cada cercado mostra quantos
// tem e no fim aparece "a : b = cada um".
// ------------------------------------------------------------------

function DivScene({ problem, unit, size, factor, celebrate }: OpProps) {
  const pens = problem.b;
  const [moved, setMoved] = useState(0);

  useEffect(() => {
    if (!celebrate) return;
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setMoved(i);
      if (i === problem.a) playCount(i, true);
      else playSfx('entrar-cercado', 'click');
      if (i >= problem.a) clearInterval(id);
    }, DIV_MOVE_MS * Math.min(factor, 1));
    return () => clearInterval(id);
  }, [celebrate, problem.a, factor]);

  const finished = celebrate && moved >= problem.a;
  const item = (k: number) => (
    <motion.div key={k} layoutId={`div-${k}`} layout transition={{ duration: 0.35 }} className="relative">
      <Figure unit={unit} size={Math.round(size * 0.85)} animation={finished ? 'jump' : 'idle'} repeat={finished ? 1 : undefined} />
    </motion.div>
  );

  return (
    <LayoutGroup>
      <div className="flex flex-wrap items-start justify-center gap-3 pt-1">
        <Group tone="a" label={moved >= problem.a ? 0 : problem.a - moved}>
          <div className="flex flex-wrap justify-center gap-1 min-h-[36px] min-w-[48px] max-w-[220px]">
            {Array.from({ length: problem.a }).map((_, k) => (k >= moved ? item(k) : null))}
          </div>
        </Group>
        <span className="font-body font-black text-4xl text-gray-800 self-center">÷</span>
        <Group tone={finished ? 'total' : 'b'} label={finished ? `${problem.a} ÷ ${pens} = ${problem.answer}` : `${pens} cercados`}>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: pens }).map((_, pen) => {
              const inside = Array.from({ length: moved }, (_, k) => k).filter((k) => k % pens === pen);
              return (
                <div
                  key={pen}
                  className="relative min-w-[56px] min-h-[52px] px-1.5 pt-3 pb-1.5 rounded-sm bg-green-100 border-4 border-amber-700 flex flex-wrap items-end justify-center gap-0.5"
                >
                  {celebrate && inside.length > 0 && <Badge n={inside.length} />}
                  {inside.map((k) => item(k))}
                </div>
              );
            })}
          </div>
        </Group>
      </div>
    </LayoutGroup>
  );
}

// ------------------------------------------------------------------
// Partículas de XP (verdes) no acerto
// ------------------------------------------------------------------

function XpBurst() {
  const orbs = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({ x: 8 + ((i * 53) % 84), d: (i % 7) * 0.08, s: 8 + (i % 3) * 3 })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {orbs.map((o, i) => (
        <span key={i} className="mm-xp" style={{ '--x': `${o.x}%`, '--d': `${o.d}s`, '--s': `${o.s}px` } as CSSProperties} />
      ))}
    </div>
  );
}
