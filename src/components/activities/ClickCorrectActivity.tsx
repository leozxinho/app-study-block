import { ItemArt } from './shared/ItemArt';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { parseClick } from '../../lib/activityParsers';
import { ActivityProps, OPTION_BASE, arrowNav } from './shared/utils';
import { useAnswerFeedback, optionStateClass, optionStateLabel } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback, CorrectBadge } from './shared/ActivityUI';

const bounceAnimation = {
  y: [0, -8, 0],
  transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const },
};

export function ClickCorrectActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  // Itens sorteados e embaralhados cada vez que a atividade abre
  // Alvo e distratores do mesmo grupo: src/lib/activityParsers
  const { items, anyCorrect, target } = useMemo(() => parseClick(activity), [activity]);
  const fb = useAnswerFeedback({ onCorrect, onWrong });

  return (
    <ActivityCard
      icon="👆"
      question={activity.question}
      subtitle={anyCorrect ? 'Toque em qualquer item! 🎉' : undefined}
    >
      <div
        className="grid grid-cols-2 gap-3 sm:gap-5 max-w-sm sm:max-w-md mx-auto"
        role="group"
        aria-label="Itens para tocar"
        onKeyDown={arrowNav}
      >
        {items.map((item, index) => {
          const isRight = item.isCorrect || anyCorrect;
          const state = fb.stateOf(item.id, isRight && !anyCorrect);
          return (
            <motion.button
              key={item.id}
              type="button"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.2, type: 'spring', stiffness: 200 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fb.answer(item.id, isRight)}
              disabled={state === 'eliminated' || (fb.locked && state !== 'correct')}
              aria-label={`${item.label}${optionStateLabel(state)}`}
              className={`
                ${OPTION_BASE} w-full h-28 sm:h-32 rounded-xl pixel-border
                flex flex-col items-center justify-center gap-1
                ${state === 'correct' ? 'bg-green-200' : state === 'wrong' ? 'bg-red-200' : `${item.color} hover:shadow-xl`}
                ${optionStateClass(state)}
              `}
            >
              <motion.span
                animate={fb.picked === null ? bounceAnimation : {}}
                className={`${/^\d+$/.test(item.emoji) ? 'font-minecraft text-4xl sm:text-5xl text-gray-900' : 'text-5xl sm:text-6xl'}`}
                style={item.scale ? { fontSize: `${item.scale * 3}rem` } : undefined}
                aria-hidden="true"
              >
                {/^\d+$/.test(item.emoji) ? item.emoji : <ItemArt emoji={item.emoji} size={Math.round(56 * (item.scale ? item.scale / 1.2 : 1))} />}
              </motion.span>
              <span className="font-body text-sm font-bold text-gray-900">{item.label}</span>
              <CorrectBadge show={state === 'correct'} />
            </motion.button>
          );
        })}
      </div>

      {target && (
        <AnswerFeedback
          stage={fb.stage}
          hint={<>procure este desenho: <span aria-hidden="true">{target.emoji}</span></>}
          answer={`${target.emoji} ${target.label}`}
        />
      )}
    </ActivityCard>
  );
}
