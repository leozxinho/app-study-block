import { motion } from 'framer-motion';
import { useMemo, useState, type CSSProperties } from 'react';
import { Activity } from '../../types';
import { playSound } from '../../lib/sounds';
import { ActivityProps, OPTION_BASE, arrowNav, shuffle } from './shared/utils';
import { parseMiningMath, type MathProblem } from '../../lib/activityParsers';
import { useAnswerFeedback, optionStateLabel } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback } from './shared/ActivityUI';
import { PixelArt } from './shared/PixelArt';
import { BLOCKS, getToolSprite } from './shared/pixelSprites';

const WALL_SIZE: Record<Activity['difficulty'], number> = { facil: 6, medio: 8, dificil: 12 };
const WALL_COLS: Record<Activity['difficulty'], string> = {
  facil: 'grid-cols-3',
  medio: 'grid-cols-4',
  dificil: 'grid-cols-4',
};

/** Números da parede: a resposta + vizinhos parecidos (sem repetir, sem negativos). */
function getWall(answer: number, size: number): number[] {
  const nums = new Set<number>([answer]);
  let spread = 2;
  while (nums.size < size) {
    const n = answer + Math.floor(Math.random() * (spread * 2 + 1)) - spread;
    if (n >= 0) nums.add(n);
    spread++;
  }
  return shuffle(Array.from(nums));
}

function getHint(p: MathProblem): string {
  if (p.op === '+') return `comece no ${p.a} e conte mais ${p.b} nos dedos.`;
  if (p.op === '-') return `comece no ${p.a} e volte ${p.b} para trás.`;
  if (p.op === '×') return `${p.a} × ${p.b} é somar o ${p.a}, ${p.b} vezes.`;
  return `reparta ${p.a} em ${p.b} grupos iguais.`;
}

const SHARD_COLORS = ['#8a8a8a', '#a3a3a3', '#6b6b6b', '#c9c9c9'];

export function MiningMathActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  // Conta vem da pergunta: src/lib/activityParsers
  const problem = useMemo(() => parseMiningMath(activity).problem, [activity]);
  // Parede embaralhada cada vez que a atividade abre
  const wall = useMemo(() => getWall(problem.answer, WALL_SIZE[activity.difficulty]), [problem, activity.difficulty]);
  const [swinging, setSwinging] = useState<number | null>(null);
  const fb = useAnswerFeedback({ onCorrect, onWrong });

  const mine = (n: number) => {
    if (fb.locked) return;
    setSwinging(n);
    setTimeout(() => setSwinging(null), 300);
    if (n === problem.answer) playSound('break');
    fb.answer(String(n), n === problem.answer);
  };

  return (
    <ActivityCard icon="⛏️" question={activity.question} subtitle="Minere o bloco com a resposta!">
      {/* Placa com a conta */}
      <div className="flex justify-center mb-5">
        <div
          className="px-6 py-3 rounded-lg pixel-border font-minecraft text-2xl sm:text-3xl text-gray-900"
          style={{ backgroundColor: '#BC9862' }}
          aria-label={`Conta: ${problem.a} ${problem.op === '×' ? 'vezes' : problem.op === '+' ? 'mais' : problem.op === '÷' ? 'dividido por' : 'menos'} ${problem.b}`}
        >
          {problem.a} {problem.op} {problem.b} = <span className="text-white drop-shadow">{fb.solved ? problem.answer : '?'}</span>
        </div>
      </div>

      {/* Parede de blocos */}
      <div
        className={`grid ${WALL_COLS[activity.difficulty]} gap-1.5 sm:gap-2 max-w-xs sm:max-w-sm mx-auto p-2 bg-stone-700 rounded-lg pixel-border`}
        role="group"
        aria-label="Parede de blocos"
        onKeyDown={arrowNav}
      >
        {wall.map((n) => {
          const state = fb.stateOf(String(n), n === problem.answer);
          const broken = state === 'correct';
          return (
            <button
              key={n}
              type="button"
              onClick={() => mine(n)}
              disabled={state === 'eliminated' || fb.locked}
              aria-label={`Bloco ${n}${optionStateLabel(state)}`}
              className={`
                ${OPTION_BASE} min-h-0 aspect-square w-full rounded-sm overflow-visible
                ${state === 'wrong' ? 'animate-shake' : ''}
                ${state === 'eliminated' ? 'opacity-50' : ''}
                ${state === 'reveal' ? 'answer-reveal' : ''}
              `}
            >
              <span className={`absolute inset-0 ${broken ? 'block-break' : ''}`}>
                <PixelArt sprite={BLOCKS.pedra} size={100} className="w-full h-full" />
                {/* Rachaduras no bloco errado */}
                {(state === 'wrong' || state === 'eliminated') && (
                  <span className="absolute inset-0 flex items-center justify-center text-3xl text-gray-900" aria-hidden="true">
                    ✖
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-gray-900/80 text-white font-minecraft text-base sm:text-lg px-2 py-1 rounded-sm">
                    {n}
                  </span>
                </span>
              </span>

              {/* Partículas quando quebra */}
              {broken &&
                Array.from({ length: 10 }).map((_, i) => {
                  const angle = (i / 10) * Math.PI * 2;
                  return (
                    <span
                      key={i}
                      className="block-shard"
                      aria-hidden="true"
                      style={
                        {
                          background: SHARD_COLORS[i % SHARD_COLORS.length],
                          '--dx': `${Math.cos(angle) * 50}px`,
                          '--dy': `${Math.sin(angle) * 40}px`,
                        } as CSSProperties
                      }
                    />
                  );
                })}

              {/* Picareta batendo */}
              {swinging === n && (
                <span className="absolute -top-6 -right-4 pick-swing pointer-events-none" aria-hidden="true">
                  <PixelArt sprite={getToolSprite('picareta', 'pedra')} size={40} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {fb.solved && (
        <motion.p
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center mt-4 font-body text-green-800 font-bold text-lg"
        >
          💎 Você minerou o {problem.answer}!
        </motion.p>
      )}

      <AnswerFeedback
        stage={fb.stage}
        hint={getHint(problem)}
        answer={String(problem.answer)}
        revealAction="Minere o bloco que está brilhando!"
      />
    </ActivityCard>
  );
}
