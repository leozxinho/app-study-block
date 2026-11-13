import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { parseLetter } from '../../lib/activityParsers';
import { ActivityProps, OPTION_BASE, arrowNav } from './shared/utils';
import { useAnswerFeedback, optionStateClass, optionStateLabel } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback, CorrectBadge } from './shared/ActivityUI';

// Tons escuros: letra branca com bom contraste. A cor vem da posição, não da resposta.
const COLORS = ['bg-blue-700', 'bg-green-700', 'bg-purple-700', 'bg-orange-700'];

export function LetterIdentificationActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  // Letras sorteadas e embaralhadas cada vez que a atividade abre
  const data = useMemo(() => parseLetter(activity), [activity]);
  const options = data.options.map((o, i) => ({ ...o, color: COLORS[i % COLORS.length] }));
  const fb = useAnswerFeedback({ onCorrect, onWrong });

  return (
    <ActivityCard icon="🔤" question={activity.question}>
      <div
        className="grid grid-cols-2 gap-3 sm:gap-4 max-w-sm sm:max-w-md mx-auto"
        role="group"
        aria-label="Letras"
        onKeyDown={arrowNav}
      >
        {options.map((option, index) => {
          const id = option.letter + index;
          const state = fb.stateOf(id, option.isCorrect);
          return (
            <motion.button
              key={id}
              type="button"
              initial={{ scale: 0, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: index * 0.15, type: 'spring', stiffness: 180 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => fb.answer(id, option.isCorrect)}
              disabled={state === 'eliminated' || (fb.locked && state !== 'correct')}
              aria-label={`Letra ${option.letter}${optionStateLabel(state)}`}
              className={`
                ${OPTION_BASE} w-full h-24 sm:h-28 rounded-lg pixel-border flex items-center justify-center
                ${state === 'correct' ? 'bg-green-700' : state === 'wrong' ? 'bg-red-700' : `${option.color} hover:brightness-110`}
                ${optionStateClass(state)}
              `}
            >
              <span className="font-minecraft text-4xl sm:text-5xl text-white drop-shadow-lg">
                {option.letter}
              </span>
              <CorrectBadge show={state === 'correct'} />
            </motion.button>
          );
        })}
      </div>

      <AnswerFeedback stage={fb.stage} hint={data.hint} answer={`a letra ${data.correct}`} />
    </ActivityCard>
  );
}
