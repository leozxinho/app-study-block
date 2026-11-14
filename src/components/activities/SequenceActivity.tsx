import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { parseSequence } from '../../lib/activityParsers';
import { ActivityProps, OPTION_BASE, arrowNav } from './shared/utils';
import { useAnswerFeedback, optionStateClass, optionStateLabel } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback, CorrectBadge } from './shared/ActivityUI';

/** Texto curto (até 2 letras) vira figura grande; palavra fica com fonte menor. */
const isShort = (v: string) => Array.from(v).length <= 2 || /^\d+$/.test(v);

export function SequenceActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  // Lê números, figuras (mesmo coladas) ou palavras: src/lib/activityParsers
  const data = useMemo(() => parseSequence(activity), [activity]);
  const options = useMemo(() => data.options.map((o, i) => ({ ...o, id: String(i) })), [data]);
  const fb = useAnswerFeedback({ onCorrect, onWrong });
  const isNumber = Boolean(data.answer.isNumber);

  return (
    <ActivityCard icon="🧩" question={activity.question} subtitle="Complete a sequência!">
      <div
        className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 p-3 sm:p-4 bg-brand-sky/20 rounded-lg flex-wrap"
        role="img"
        aria-label={`Sequência: ${data.pattern.map((p) => p.label).join(', ')}, e qual vem agora?`}
      >
        {[...data.pattern, null].map((item, index) => {
          const filled = !item && fb.solved;
          const shown = item ?? (filled ? data.answer : null);
          return (
            <motion.div
              key={index}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.2, type: 'spring' }}
              className={`
                min-w-[48px] h-12 sm:min-w-[64px] sm:h-16 px-1 rounded-lg pixel-border flex items-center justify-center font-minecraft
                ${filled ? 'bg-green-200 answer-correct' : !item ? 'bg-gray-100 border-dashed border-2 border-gray-500' : isNumber ? 'bg-purple-700 text-white' : 'bg-white'}
              `}
            >
              <span className={shown && !isShort(shown.value) ? 'font-body font-bold text-sm text-gray-900' : 'text-2xl sm:text-3xl'} aria-hidden="true">
                {shown ? shown.value : '?'}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div
        className="grid grid-cols-2 land:grid-cols-4 land:max-w-none land:gap-2 gap-3 sm:gap-4 max-w-xs sm:max-w-sm mx-auto"
        role="group"
        aria-label="Respostas"
        onKeyDown={arrowNav}
      >
        {options.map((option, index) => {
          const right = option.value === data.answer.value;
          const state = fb.stateOf(option.id, right);
          return (
            <motion.button
              key={option.id}
              type="button"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fb.answer(option.id, right)}
              disabled={state === 'eliminated' || (fb.locked && state !== 'correct')}
              aria-label={`${option.label}${optionStateLabel(state)}`}
              className={`
                ${OPTION_BASE} w-full h-20 sm:h-24 rounded-lg pixel-border font-minecraft
                flex flex-col items-center justify-center gap-1
                ${state === 'correct' ? 'bg-green-200' : state === 'wrong' ? 'bg-red-200' : 'bg-amber-100 hover:bg-amber-200'}
                ${optionStateClass(state)}
              `}
            >
              <span className={isShort(option.value) ? 'text-3xl sm:text-4xl text-gray-900' : 'font-body font-bold text-base text-gray-900'} aria-hidden="true">
                {option.value}
              </span>
              {!isNumber && option.label !== option.value && (
                <span className="font-body text-xs font-bold text-gray-800">{option.label}</span>
              )}
              <CorrectBadge show={state === 'correct'} />
            </motion.button>
          );
        })}
      </div>

      <AnswerFeedback stage={fb.stage} hint={data.hint} answer={data.answer.label} />
    </ActivityCard>
  );
}
