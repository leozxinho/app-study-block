import { ItemArt } from './shared/ItemArt';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { playSound } from '../../lib/sounds';
import { ActivityProps, OPTION_BASE, arrowNav, shuffle, shuffleChanged } from './shared/utils';
import { useAnswerFeedback } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback } from './shared/ActivityUI';
import { Mob } from '../mobs';
import { parseWordBuilder } from '../../lib/activityParsers';

const LETTERS = 'ABCDEFGHIJLMNOPRSTUVZ';

export function WordBuilderActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  // Palavra, peças e figura vêm da pergunta e do dicionário src/lib/words.ts
  const puzzle = useMemo(() => parseWordBuilder(activity), [activity]);
  const picture = puzzle.picture;

  // Peças embaralhadas (+ letras extras para pensar no médio/difícil)
  const [bank] = useState(() => {
    const extraCount = puzzle.bySyllable ? 0 : activity.difficulty === 'dificil' ? 2 : activity.difficulty === 'medio' ? 1 : 0;
    const extras = shuffle(LETTERS.split('').filter((l) => !puzzle.word.includes(l))).slice(0, extraCount);
    const all = [...puzzle.pieces, ...extras].map((text, i) => ({ id: String(i), text }));
    return shuffleChanged(all);
  });
  const [placed, setPlaced] = useState<string[]>([]); // ids
  const [shakeId, setShakeId] = useState<string | null>(null);
  const fb = useAnswerFeedback({ onCorrect, onWrong });

  const nextText = puzzle.pieces[placed.length];

  const pick = (id: string, text: string) => {
    if (fb.solved || placed.includes(id)) return;
    // Compara pelo texto: letras repetidas (CASA tem 2 "A") servem em qualquer ordem
    if (text !== nextText) {
      setShakeId(id);
      setTimeout(() => setShakeId(null), 500);
      fb.markWrong();
      return;
    }
    playSound('click');
    const next = [...placed, id];
    setPlaced(next);
    if (next.length === puzzle.pieces.length) fb.markCorrect();
  };

  const nextBankId = bank.find((b) => !placed.includes(b.id) && b.text === nextText)?.id;

  return (
    <ActivityCard
      icon="🔤"
      question={puzzle.displayQuestion}
      subtitle={puzzle.bySyllable ? 'Toque nas sílabas na ordem certa!' : 'Toque nas letras na ordem certa!'}
    >
      {/* Figura */}
      <div className="flex justify-center mb-4">
        <div className="w-28 h-28 bg-sky-100 rounded-xl pixel-border flex items-center justify-center" role="img" aria-label={`Figura: ${puzzle.word.toLowerCase()}`}>
          {picture?.mob ? (
            <Mob type={picture.mob} size={56} animation={fb.solved ? 'celebrate' : 'idle'} title={puzzle.word.toLowerCase()} />
          ) : (
            <span className="item-bob"><ItemArt emoji={picture?.emoji ?? '❓'} size={64} /></span>
          )}
        </div>
      </div>

      {/* Espaços da palavra */}
      <div
        className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-6"
        aria-live="polite"
        aria-label={`Palavra: ${puzzle.pieces.map((p, i) => (i < placed.length ? p : 'vazio')).join(', ')}`}
      >
        {puzzle.pieces.map((piece, i) => {
          const filled = i < placed.length;
          return (
            <div
              key={i}
              className={`
                ${puzzle.bySyllable ? 'min-w-[72px] px-2' : 'w-11 sm:w-14'} h-14 sm:h-16 rounded-md pixel-border
                flex items-center justify-center font-minecraft text-xl sm:text-2xl
                ${fb.solved ? 'bg-green-200 text-gray-900 answer-correct' : filled ? 'bg-amber-200 text-gray-900' : 'bg-gray-100 border-dashed border-2 border-gray-500'}
              `}
            >
              {filled && (
                <motion.span initial={{ scale: 0, y: -20 }} animate={{ scale: 1, y: 0 }}>
                  {piece}
                </motion.span>
              )}
            </div>
          );
        })}
      </div>

      {/* Blocos com letras/sílabas */}
      <div
        className="flex flex-wrap justify-center gap-2 sm:gap-3"
        role="group"
        aria-label={puzzle.bySyllable ? 'Sílabas' : 'Letras'}
        onKeyDown={arrowNav}
      >
        {bank.map((b, index) => {
          const used = placed.includes(b.id);
          return (
            <motion.button
              key={b.id}
              type="button"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: used ? 0.25 : 1 }}
              transition={{ delay: index * 0.06 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => pick(b.id, b.text)}
              disabled={used || fb.solved}
              aria-label={`${puzzle.bySyllable ? 'Sílaba' : 'Letra'} ${b.text}`}
              className={`
                ${OPTION_BASE} ${puzzle.bySyllable ? 'min-w-[88px] px-3' : 'w-16'} h-16 rounded-md pixel-border
                font-minecraft text-xl text-gray-900 bg-amber-100 hover:bg-amber-200
                ${shakeId === b.id ? 'animate-shake ring-4 ring-red-600' : ''}
                ${fb.stage === 'reveal' && b.id === nextBankId ? 'answer-reveal' : ''}
              `}
            >
              {b.text}
            </motion.button>
          );
        })}
      </div>

      <AnswerFeedback
        stage={fb.stage}
        hint={`fale "${puzzle.word.toLowerCase()}" bem devagar e escute cada pedacinho.`}
        answer={puzzle.pieces.join(puzzle.bySyllable ? '-' : ' ')}
        revealAction="O próximo bloco está brilhando!"
      />
    </ActivityCard>
  );
}
