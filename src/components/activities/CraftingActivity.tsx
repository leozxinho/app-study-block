import { motion, type PanInfo } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { playSound } from '../../lib/sounds';
import { ActivityProps, OPTION_BASE, arrowNav, shuffle } from './shared/utils';
import { useAnswerFeedback } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback } from './shared/ActivityUI';
import { PixelArt } from './shared/PixelArt';
import { ITEMS, getToolSprite, type ItemKind } from './shared/pixelSprites';
import { parseCrafting } from '../../lib/activityParsers';

export function CraftingActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  // Receita vem da pergunta: src/lib/activityParsers
  const recipe = useMemo(() => parseCrafting(activity), [activity]);
  const toolSprite = getToolSprite(recipe.tool, recipe.material);

  // Itens da paleta: os da receita + 1 a mais para pensar (médio/difícil), embaralhados
  const palette = useMemo(() => {
    const needed = Array.from(new Set(recipe.cells.filter(Boolean))) as ItemKind[];
    const extras = (Object.keys(ITEMS) as ItemKind[]).filter((k) => !needed.includes(k));
    const withExtra = activity.difficulty === 'facil' ? needed : [...needed, shuffle(extras)[0]];
    return shuffle(withExtra);
  }, [recipe, activity.difficulty]);

  const [grid, setGrid] = useState<(ItemKind | null)[]>(() => Array(9).fill(null));
  const [selected, setSelected] = useState<ItemKind>(palette[0]);
  const [wrongCells, setWrongCells] = useState<number[]>([]);
  const justDragged = useRef(false);
  const fb = useAnswerFeedback({ onCorrect, onWrong });

  const putItem = (cell: number, item: ItemKind | null) => {
    if (fb.solved) return;
    playSound('click');
    setGrid((g) => g.map((v, i) => (i === cell ? item : v)));
  };

  const handleCell = (cell: number) => {
    if (justDragged.current) return;
    // Tocar de novo no mesmo item tira ele
    putItem(cell, grid[cell] === selected ? null : selected);
  };

  const handleDragEnd = (item: ItemKind, info: PanInfo) => {
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false), 50);
    const el = document
      .elementsFromPoint(info.point.x - window.scrollX, info.point.y - window.scrollY)
      .map((e) => e.closest<HTMLElement>('[data-cell]'))
      .find(Boolean);
    if (el?.dataset.cell) {
      setSelected(item);
      putItem(Number(el.dataset.cell), item);
    }
  };

  const craft = () => {
    if (fb.solved) return;
    const wrong = grid.map((v, i) => (v !== recipe.cells[i] ? i : -1)).filter((i) => i >= 0);
    if (wrong.length === 0) {
      playSound('break');
      fb.markCorrect();
      return;
    }
    setWrongCells(wrong);
    fb.markWrong();
    // Tira só o que está errado; o certo fica
    setTimeout(() => {
      setGrid((g) => g.map((v, i) => (wrong.includes(i) ? null : v)));
      setWrongCells([]);
    }, 900);
  };

  const showGhost = fb.stage === 'reveal';

  return (
    <ActivityCard
      icon="🛠️"
      question={activity.question}
      subtitle="Escolha um item e toque nos quadrados para copiar a receita!"
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8 mb-5">
        {/* Receita */}
        <div className="text-center">
          <p className="font-body font-bold text-gray-800 mb-2">Receita</p>
          <div
            className="grid grid-cols-3 gap-1 p-2 bg-amber-50 rounded-lg pixel-border"
            role="img"
            aria-label={`Receita de ${toolSprite.name}: ${recipe.cells
              .map((c, i) => (c ? `${ITEMS[c].name} na casa ${i + 1}` : null))
              .filter(Boolean)
              .join(', ')}`}
          >
            {recipe.cells.map((c, i) => (
              <div key={i} className="w-8 h-8 sm:w-9 sm:h-9 bg-stone-300 rounded-sm flex items-center justify-center">
                {c && <PixelArt sprite={ITEMS[c]} size={26} />}
              </div>
            ))}
          </div>
        </div>

        {/* Grade 3x3 da criança */}
        <div className="text-center">
          <p className="font-body font-bold text-gray-800 mb-2">Sua mesa</p>
          <div
            className="grid grid-cols-3 gap-1.5 p-2 bg-stone-500 rounded-lg pixel-border"
            role="group"
            aria-label="Mesa de fabricar, 3 por 3"
            onKeyDown={arrowNav}
          >
            {grid.map((item, i) => {
              const ghost = showGhost && !item && recipe.cells[i];
              return (
                <button
                  key={i}
                  type="button"
                  data-cell={i}
                  onClick={() => handleCell(i)}
                  disabled={fb.solved}
                  aria-label={`Casa ${i + 1}: ${item ? ITEMS[item].name : 'vazia'}`}
                  className={`
                    ${OPTION_BASE} min-h-0 w-14 h-14 sm:w-16 sm:h-16 rounded-sm bg-stone-300 hover:bg-stone-200
                    flex items-center justify-center
                    ${wrongCells.includes(i) ? 'animate-shake ring-4 ring-red-600 bg-red-200' : ''}
                    ${ghost ? 'answer-reveal' : ''}
                  `}
                >
                  {item ? (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <PixelArt sprite={ITEMS[item]} size={40} />
                    </motion.span>
                  ) : (
                    ghost && <PixelArt sprite={ITEMS[ghost]} size={40} className="opacity-40" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Resultado */}
        <div className="text-center">
          <p className="font-body font-bold text-gray-800 mb-2">Resultado</p>
          <div
            className={`w-20 h-20 rounded-lg pixel-border flex items-center justify-center
              ${fb.solved ? 'bg-green-200 answer-correct' : 'bg-stone-300'}`}
          >
            <motion.span
              animate={fb.solved ? { scale: [0, 1.3, 1], opacity: 1 } : { opacity: 0.35 }}
              transition={{ duration: 0.5 }}
            >
              <PixelArt sprite={toolSprite} size={52} label={toolSprite.name} />
            </motion.span>
          </div>
        </div>
      </div>

      {/* Paleta de itens */}
      <div
        className="flex flex-wrap justify-center gap-3 mb-4"
        role="group"
        aria-label="Itens: escolha um"
        onKeyDown={arrowNav}
      >
        {palette.map((item) => (
          <motion.button
            key={item}
            type="button"
            drag={!fb.solved}
            dragSnapToOrigin
            whileDrag={{ scale: 1.2, zIndex: 30 }}
            onDragEnd={(_, info) => handleDragEnd(item, info)}
            onClick={() => {
              playSound('click');
              setSelected(item);
            }}
            aria-pressed={selected === item}
            aria-label={ITEMS[item].name}
            className={`
              ${OPTION_BASE} drag-handle w-20 px-2 py-2 rounded-lg pixel-border flex flex-col items-center gap-1
              ${selected === item ? 'bg-amber-200 ring-4 ring-brand-lapis' : 'bg-white hover:bg-amber-50'}
            `}
          >
            <PixelArt sprite={ITEMS[item]} size={36} />
            <span className="font-body text-xs font-bold text-gray-900">{ITEMS[item].name}</span>
          </motion.button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={craft}
          disabled={fb.solved || grid.every((v) => v === null)}
          className={`${OPTION_BASE} px-8 rounded-lg pixel-border bg-brand-dark-green text-white font-minecraft text-sm
            disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110`}
        >
          Criar!
        </button>
      </div>

      <AnswerFeedback
        stage={fb.stage}
        hint="olhe a receita e copie cada quadradinho no mesmo lugar."
        revealText="Os lugares certos estão brilhando na sua mesa!"
      />
    </ActivityCard>
  );
}
