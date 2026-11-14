import { motion } from 'framer-motion';
import { useMemo, type CSSProperties } from 'react';
import { parseShape, type ShapeId } from '../../lib/activityParsers';
import { ActivityProps, OPTION_BASE, arrowNav } from './shared/utils';
import { useAnswerFeedback, optionStateClass, optionStateLabel } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback, CorrectBadge } from './shared/ActivityUI';

// Desenho de cada forma (CSS)
const SHAPE_STYLE: Record<ShapeId, CSSProperties> = {
  quadrado: { width: 70, height: 70, backgroundColor: '#1d4ed8', borderRadius: 4 },
  circulo: { width: 70, height: 70, backgroundColor: '#dc2626', borderRadius: '50%' },
  triangulo: {
    width: 0, height: 0, borderLeft: '40px solid transparent', borderRight: '40px solid transparent',
    borderBottom: '70px solid #15803d', backgroundColor: 'transparent',
  },
  retangulo: { width: 90, height: 55, backgroundColor: '#7e22ce', borderRadius: 4 },
  estrela: {
    width: 76, height: 72, backgroundColor: '#ca8a04',
    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
  },
  losango: { width: 70, height: 70, backgroundColor: '#0e7490', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  hexagono: { width: 76, height: 66, backgroundColor: '#be185d', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
  oval: { width: 56, height: 76, backgroundColor: '#c2410c', borderRadius: '50%' },
};

export function ShapeIdentificationActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  const fb = useAnswerFeedback({ onCorrect, onWrong });

  // Forma pedida (nome, "é um X", "3 lados"...) e opções embaralhadas: src/lib/activityParsers
  const { target, options } = useMemo(() => parseShape(activity), [activity]);

  return (
    <ActivityCard icon="🔷" question={activity.question}>
      <div
        className="grid grid-cols-2 land:grid-cols-4 land:max-w-none land:gap-2 gap-3 sm:gap-6 max-w-sm sm:max-w-md mx-auto"
        role="group"
        aria-label="Formas"
        onKeyDown={arrowNav}
      >
        {options.map((shape, index) => {
          const state = fb.stateOf(shape.id, shape.id === target.id);
          return (
            <motion.button
              key={shape.id}
              type="button"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.15, type: 'spring', stiffness: 200 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => fb.answer(shape.id, shape.id === target.id)}
              disabled={state === 'eliminated' || (fb.locked && state !== 'correct')}
              aria-label={`${shape.label}${optionStateLabel(state)}`}
              className={`
                ${OPTION_BASE} w-full h-32 sm:h-36 rounded-lg pixel-border
                flex flex-col items-center justify-center gap-2
                ${state === 'correct' ? 'bg-green-100' : state === 'wrong' ? 'bg-red-100' : 'bg-gray-50 hover:bg-blue-50'}
                ${optionStateClass(state)}
              `}
            >
              <div style={SHAPE_STYLE[shape.id]} aria-hidden="true" />
              <span className="font-body text-sm font-bold text-gray-900 mt-1">{shape.label}</span>
              {state === 'correct' && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute text-3xl" aria-hidden="true">
                  ✨
                </motion.span>
              )}
              <CorrectBadge show={state === 'correct'} />
            </motion.button>
          );
        })}
      </div>

      <AnswerFeedback stage={fb.stage} hint={target.hint} answer={target.label} />
    </ActivityCard>
  );
}
