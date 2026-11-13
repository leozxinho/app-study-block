import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { parseColor } from '../../lib/activityParsers';
import { ActivityProps, OPTION_BASE, arrowNav } from './shared/utils';
import { useAnswerFeedback, optionStateClass, optionStateLabel } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback, CorrectBadge } from './shared/ActivityUI';

export function ColorIdentificationActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  const fb = useAnswerFeedback({ onCorrect, onWrong });

  // Cor pedida (aceita feminino e 12 cores) e opções embaralhadas: src/lib/activityParsers
  const { target, fromQuestion, options } = useMemo(() => parseColor(activity), [activity]);

  return (
    <ActivityCard
      icon="🌈"
      question={activity.question}
      // Se a pergunta não diz a cor, mostramos qual é
      subtitle={fromQuestion ? undefined : `Encontre a cor: ${target.label}`}
    >
      <div
        className="grid grid-cols-2 gap-3 sm:gap-4 max-w-sm sm:max-w-md mx-auto"
        role="group"
        aria-label="Cores"
        onKeyDown={arrowNav}
      >
        {options.map((color, index) => {
          const state = fb.stateOf(color.name, color.name === target.name);
          return (
            <motion.button
              key={color.name}
              type="button"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.15, type: 'spring' }}
              whileTap={{ scale: 0.92 }}
              onClick={() => fb.answer(color.name, color.name === target.name)}
              disabled={state === 'eliminated' || (fb.locked && state !== 'correct')}
              aria-label={`${color.label}${optionStateLabel(state)}`}
              className={`
                ${OPTION_BASE} w-full h-24 sm:h-28 rounded-lg pixel-border ${color.bg}
                flex items-center justify-center
                ${state === 'idle' ? 'hover:shadow-xl hover:brightness-110' : ''}
                ${optionStateClass(state)}
              `}
            >
              {state === 'correct' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center text-4xl"
                  aria-hidden="true"
                >
                  ✨
                </motion.span>
              )}
              <span className={`font-body text-base sm:text-lg font-bold ${color.text}`}>
                {color.label}
              </span>
              <CorrectBadge show={state === 'correct'} />
            </motion.button>
          );
        })}
      </div>

      <AnswerFeedback
        stage={fb.stage}
        hint={`${target.label.toLowerCase()} é ${target.hint}.`}
        answer={`${target.emoji} ${target.label}`}
      />
    </ActivityCard>
  );
}
