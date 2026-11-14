import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { parseReading } from '../../lib/activityParsers';
import { ActivityProps, OPTION_BASE, arrowNav } from './shared/utils';
import { useAnswerFeedback, optionStateClass, optionStateLabel } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback, CorrectBadge } from './shared/ActivityUI';
import { ItemArt } from './shared/ItemArt';

/** Leitura: a palavra aparece em blocos (a voz NÃO lê) e a criança toca na figura certa. */
export function ReadingActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  const data = useMemo(() => parseReading(activity), [activity]);
  const fb = useAnswerFeedback({ onCorrect, onWrong });

  return (
    <ActivityCard icon="📖" question={data.displayQuestion} subtitle="Leia sozinho e escolha a figura!">
      {/* Palavra em blocos de letras */}
      <div className="flex justify-center gap-1.5 sm:gap-2 mb-6" aria-label={`Palavra: ${data.word}`} role="img">
        {data.word.split('').map((ch, i) => (
          <motion.span
            key={i}
            initial={{ y: -20, opacity: 0 }}
            animate={fb.solved ? { y: [0, -10, 0], opacity: 1 } : { y: 0, opacity: 1 }}
            transition={{ delay: fb.solved ? i * 0.08 : i * 0.06 }}
            className="w-11 h-12 sm:w-14 sm:h-16 rounded-md pixel-border bg-amber-100 flex items-center justify-center font-minecraft text-xl sm:text-2xl text-gray-900"
            aria-hidden="true"
          >
            {ch}
          </motion.span>
        ))}
      </div>
      <div className="grid grid-cols-2 land:grid-cols-4 land:max-w-none land:gap-2 gap-3 max-w-sm mx-auto" role="group" aria-label="Figuras" onKeyDown={arrowNav}>
        {data.options.map((opt, i) => {
          const ok = opt.word === data.word;
          const state = fb.stateOf(opt.word, ok);
          return (
            <motion.button
              key={opt.word}
              type="button"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08, type: 'spring' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fb.answer(opt.word, ok)}
              disabled={state === 'eliminated' || (fb.locked && state !== 'correct')}
              aria-label={`Figura ${i + 1}${optionStateLabel(state)}`}
              className={`${OPTION_BASE} min-h-[96px] rounded-lg pixel-border flex items-center justify-center ${
                state === 'correct' ? 'bg-green-200' : state === 'wrong' ? 'bg-red-200' : 'bg-white hover:bg-sky-50'
              } ${optionStateClass(state)}`}
            >
              <ItemArt emoji={opt.emoji} size={56} />
              <CorrectBadge show={state === 'correct'} />
            </motion.button>
          );
        })}
      </div>
      <AnswerFeedback stage={fb.stage} hint="leia cada letra devagar e junte os sons." answer={`a figura de ${data.word.toLowerCase()}`} />
    </ActivityCard>
  );
}
