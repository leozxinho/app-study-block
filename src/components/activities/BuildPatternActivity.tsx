import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Eraser } from 'lucide-react';
import { Activity } from '../../types';
import { playSound } from '../../lib/sounds';
import { ActivityProps, OPTION_BASE, arrowNav, shuffle } from './shared/utils';
import { useAnswerFeedback } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback } from './shared/ActivityUI';
import { PixelArt } from './shared/PixelArt';
import { BLOCKS, type BlockKind } from './shared/pixelSprites';
import { buildSize } from '../../lib/activityParsers';

type Cell = BlockKind | null;

const COLOR_COUNT: Record<Activity['difficulty'], number> = { facil: 2, medio: 3, dificil: 4 };
const CELL_PX: Record<number, string> = {
  // Abaixo de 360 px de largura: um pouco menores, para o modelo e a construção ficarem lado a lado
  2: 'w-16 h-16 sm:w-20 sm:h-20 land:w-14 land:h-14 [@media(max-width:359px)]:w-12 [@media(max-width:359px)]:h-12',
  3: 'w-14 h-14 sm:w-16 sm:h-16 land:w-11 land:h-11 [@media(max-width:359px)]:w-11 [@media(max-width:359px)]:h-11',
  4: 'w-11 h-11 sm:w-14 sm:h-14 land:w-9 land:h-9 [@media(max-width:359px)]:w-9 [@media(max-width:359px)]:h-9',
};
const MODEL_PX: Record<number, number> = { 2: 44, 3: 34, 4: 26 };

/**
 * Gera uma construção: cada coluna tem uma altura (blocos empilhados de baixo para cima).
 * No 2x2 tudo fica preenchido. Usa pelo menos 2 tipos de bloco.
 */
function makeModel(size: number, colors: BlockKind[]): Cell[] {
  for (;;) {
    const heights = Array.from({ length: size }, () =>
      size === 2 ? 2 : 1 + Math.floor(Math.random() * size)
    );
    const cells: Cell[] = [];
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const fromBottom = size - row;
        cells.push(fromBottom <= heights[col] ? colors[Math.floor(Math.random() * colors.length)] : null);
      }
    }
    if (new Set(cells.filter(Boolean)).size >= Math.min(2, colors.length)) return cells;
  }
}

export function BuildPatternActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  const size = buildSize(activity).size;
  // Cores e construção sorteadas cada vez que a atividade abre
  const colors = useMemo(
    () => shuffle(Object.keys(BLOCKS) as BlockKind[]).slice(0, COLOR_COUNT[activity.difficulty]),
    [activity.difficulty]
  );
  const model = useMemo(() => makeModel(size, colors), [size, colors]);

  const [grid, setGrid] = useState<Cell[]>(() => Array(size * size).fill(null));
  const [brush, setBrush] = useState<Cell>(colors[0]);
  const [wrongCells, setWrongCells] = useState<number[]>([]);
  const fb = useAnswerFeedback({ onCorrect, onWrong });

  const paint = (i: number) => {
    if (fb.solved) return;
    playSound('click');
    // Tocar de novo com o mesmo bloco apaga
    setGrid((g) => g.map((v, j) => (j === i ? (v === brush ? null : brush) : v)));
  };

  const check = () => {
    if (fb.solved) return;
    const wrong = grid.map((v, i) => (v !== model[i] ? i : -1)).filter((i) => i >= 0);
    if (wrong.length === 0) {
      playSound('break');
      fb.markCorrect();
      return;
    }
    setWrongCells(wrong);
    fb.markWrong();
    setTimeout(() => {
      // O que está errado sai; o certo fica
      setGrid((g) => g.map((v, i) => (wrong.includes(i) ? null : v)));
      setWrongCells([]);
    }, 900);
  };

  const describe = (cells: Cell[]) =>
    cells.map((c, i) => `${i + 1}: ${c ? BLOCKS[c].name : 'vazio'}`).join(', ');

  return (
    <ActivityCard
      icon="🧱"
      question={activity.question}
      subtitle={`Copie a construção na grade ${size}x${size}!`}
    >
      <div className="flex flex-row flex-wrap items-end justify-center gap-2 sm:gap-10 mb-5 land:flex-nowrap land:gap-4 land:mb-2">
        {/* Modelo */}
        <div className="text-center">
          <p className="font-body font-bold text-gray-800 mb-2">Modelo</p>
          <div
            className="grid gap-0.5 p-2 bg-sky-200 rounded-lg pixel-border"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
            role="img"
            aria-label={`Modelo ${size} por ${size}. ${describe(model)}`}
          >
            {model.map((c, i) => (
              <div key={i} style={{ width: MODEL_PX[size], height: MODEL_PX[size] }}>
                {c && <PixelArt sprite={BLOCKS[c]} size={MODEL_PX[size]} />}
              </div>
            ))}
          </div>
        </div>

        {/* Grade da criança */}
        <div className="text-center">
          <p className="font-body font-bold text-gray-800 mb-2">Sua construção</p>
          <div
            className={`grid gap-1 p-2 rounded-lg pixel-border ${fb.solved ? 'bg-green-200 answer-correct' : 'bg-sky-100'}`}
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
            role="group"
            aria-label={`Sua construção ${size} por ${size}`}
            onKeyDown={arrowNav}
          >
            {grid.map((c, i) => {
              const ghost = fb.stage === 'reveal' && c !== model[i] ? model[i] : null;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => paint(i)}
                  disabled={fb.solved}
                  aria-label={`Casa ${i + 1}: ${c ? BLOCKS[c].name : 'vazia'}`}
                  className={`
                    ${OPTION_BASE} !min-h-0 ${CELL_PX[size]} rounded-sm bg-white/70 border-2 border-dashed border-sky-400
                    flex items-center justify-center p-0
                    ${wrongCells.includes(i) ? 'animate-shake ring-4 ring-red-600' : ''}
                    ${ghost || (fb.stage === 'reveal' && c !== model[i]) ? 'answer-reveal' : ''}
                  `}
                >
                  {c ? (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-full h-full">
                      <PixelArt sprite={BLOCKS[c]} size={64} className="w-full h-full" />
                    </motion.span>
                  ) : (
                    ghost && <PixelArt sprite={BLOCKS[ghost]} size={64} className="w-full h-full opacity-40" />
                  )}
                  {wrongCells.includes(i) && (
                    <span className="absolute inset-0 flex items-center justify-center text-2xl text-red-700 font-bold" aria-hidden="true">
                      ✖
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Paleta */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 land:mb-2" role="group" aria-label="Blocos: escolha um" onKeyDown={arrowNav}>
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              playSound('click');
              setBrush(c);
            }}
            aria-pressed={brush === c}
            aria-label={BLOCKS[c].name}
            className={`${OPTION_BASE} w-20 py-2 land:py-1 land:min-h-[56px] rounded-lg pixel-border flex flex-col items-center gap-1
              ${brush === c ? 'bg-amber-200 ring-4 ring-brand-lapis' : 'bg-white hover:bg-amber-50'}`}
          >
            <PixelArt sprite={BLOCKS[c]} size={32} />
            <span className="font-body text-xs font-bold text-gray-900">{BLOCKS[c].name}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            playSound('click');
            setBrush(null);
          }}
          aria-pressed={brush === null}
          aria-label="Apagar"
          className={`${OPTION_BASE} w-20 py-2 land:py-1 land:min-h-[56px] rounded-lg pixel-border flex flex-col items-center justify-center gap-1
            ${brush === null ? 'bg-amber-200 ring-4 ring-brand-lapis' : 'bg-white hover:bg-amber-50'}`}
        >
          <Eraser size={28} aria-hidden="true" className="text-gray-800" />
          <span className="font-body text-xs font-bold text-gray-900">Apagar</span>
        </button>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={check}
          disabled={fb.solved || grid.every((v) => v === null)}
          className={`${OPTION_BASE} px-8 rounded-lg pixel-border bg-brand-dark-green text-white font-minecraft text-sm
            disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110`}
        >
          Pronto!
        </button>
      </div>

      <AnswerFeedback
        stage={fb.stage}
        hint="comece pela linha de baixo e vá subindo, um bloco de cada vez."
        revealText="Os blocos que faltam estão aparecendo clarinhos na sua grade!"
      />
    </ActivityCard>
  );
}
