import { motion, type PanInfo } from 'framer-motion';
import { useMemo, useRef } from 'react';
import { parseMatching } from '../../lib/activityParsers';
import { ActivityProps, OPTION_BASE, arrowNav } from './shared/utils';
import { useAnswerFeedback, optionStateClass, optionStateLabel } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback, CorrectBadge } from './shared/ActivityUI';

export function MatchingActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  // Figuras, modelo e ordem sorteados cada vez que a atividade abre
  const { items, target } = useMemo(() => parseMatching(activity), [activity]);
  const fb = useAnswerFeedback({ onCorrect, onWrong });
  const justDragged = useRef(false);

  // Soltou o modelo arrastado em cima de uma opção
  const handleDragEnd = (info: PanInfo) => {
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false), 50);
    const x = info.point.x - window.scrollX;
    const y = info.point.y - window.scrollY;
    const el = document
      .elementsFromPoint(x, y)
      .map((e) => e.closest<HTMLElement>('[data-option-id]'))
      .find(Boolean);
    const id = el?.dataset.optionId;
    if (id && !el.hasAttribute('disabled')) fb.answer(id, id === target.id);
  };

  return (
    <ActivityCard
      icon="🔍"
      question={activity.question}
      subtitle="Arraste o modelo até o igual, ou toque nele!"
    >
      {/* Modelo (arrastável) */}
      <div className="flex justify-center mb-6">
        <motion.div
          drag={!fb.solved}
          dragSnapToOrigin
          dragElastic={0.7}
          whileDrag={{ scale: 1.1, zIndex: 30 }}
          onDragEnd={(_, info) => handleDragEnd(info)}
          animate={fb.solved ? { scale: 1 } : { scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: fb.solved ? 0 : Infinity }}
          role="img"
          aria-label={`Modelo: ${target.name}`}
          className="drag-handle cursor-grab active:cursor-grabbing inline-flex flex-col items-center bg-amber-100 rounded-xl p-5 sm:p-6 pixel-border"
        >
          <span className="text-6xl" aria-hidden="true">{target.icon}</span>
          <span className="font-body text-base font-bold mt-2 text-gray-900">{target.name}</span>
        </motion.div>
      </div>

      {/* Options */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-lg mx-auto"
        role="group"
        aria-label="Opções"
        onKeyDown={arrowNav}
      >
        {items.map((item, index) => {
          const state = fb.stateOf(item.id, item.id === target.id);
          return (
            <motion.button
              key={item.id}
              type="button"
              data-option-id={item.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1, type: 'spring' }}
              whileTap={{ scale: 0.92 }}
              onClick={() => !justDragged.current && fb.answer(item.id, item.id === target.id)}
              disabled={state === 'eliminated' || (fb.locked && state !== 'correct')}
              aria-label={`${item.name}${optionStateLabel(state)}`}
              className={`
                ${OPTION_BASE} min-h-[110px] p-3 sm:p-4 rounded-lg pixel-border flex flex-col items-center justify-center
                ${state === 'correct' ? 'bg-green-100' : state === 'wrong' ? 'bg-red-100' : 'bg-gray-50 hover:bg-amber-50'}
                ${optionStateClass(state)}
              `}
            >
              <span className="text-4xl sm:text-5xl mb-1" aria-hidden="true">{item.icon}</span>
              <span className="font-body text-sm font-bold text-gray-900">{item.name}</span>
              <CorrectBadge show={state === 'correct'} />
            </motion.button>
          );
        })}
      </div>

      <AnswerFeedback
        stage={fb.stage}
        hint={`procure o que ${target.hint}.`}
        answer={`${target.icon} ${target.name}`}
      />
    </ActivityCard>
  );
}
