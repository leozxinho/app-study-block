import { NumberDots } from './shared/NumberDots';
import { showsNumberDots } from './shared/numberDotsAge';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { findMathUnitPair, parseMultipleChoice, unitByKey } from '../../lib/activityParsers';
import { problemIssue } from '../../lib/mathGenerator';
import { MathMobsScene } from './shared/MathMobsScene';
import { celebrationMs } from './shared/mathSceneTiming';
import { ActivityProps, OPTION_BASE, arrowNav } from './shared/utils';
import { useAnswerFeedback, optionStateClass, optionStateLabel } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback, CorrectBadge } from './shared/ActivityUI';

export function MultipleChoiceActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  // Lê a pergunta (src/lib/activityParsers) e embaralha as alternativas cada vez que abre
  const data = useMemo(() => parseMultipleChoice(activity), [activity]);
  const { options } = data;

  // Contas viram cena com mobs (o que a pergunta cita: porcos, diamantes...) quando cabem na tela
  const scene = useMemo(() => {
    const m = data.math;
    if (!m || problemIssue(m)) return null;
    // Cada grupo com o próprio item ("2 esmeraldas + 3 rubis")
    const [unit, unitB] = findMathUnitPair(activity.question, unitByKey('diamante'));
    return { problem: m, unit, unitB };
  }, [data, activity.question]);
  const correctDelay = scene ? celebrationMs(scene.problem) : undefined;
  const fb = useAnswerFeedback({ onCorrect, onWrong }, { correctDelay });
  const dots = showsNumberDots();

  // Erro: repete a animação mais devagar
  const [replay, setReplay] = useState(0);
  const seenWrong = useRef(0);
  useEffect(() => {
    if (fb.wrongCount > seenWrong.current) {
      seenWrong.current = fb.wrongCount;
      setReplay((r) => r + 1);
    }
  }, [fb.wrongCount]);

  // Respostas curtas (números): as 4 numa linha só, em qualquer tela (cabe sem rolar no celular pequeno)
  const short = options.length === 4 && options.every((o) => o.text.length <= 3);

  return (
    <ActivityCard icon="📝" question={activity.question}>
      {/* Conta desenhada com mobs (animação conforme a operação) */}
      {scene && (
        <div className="bg-gradient-to-b from-sky-100 to-green-100 rounded-lg pixel-border p-3 mb-4 sm:mb-6 overflow-hidden">
          <MathMobsScene problem={scene.problem} unit={scene.unit} unitB={scene.unitB} celebrate={fb.solved} replay={replay} slow={replay > 0} compact />
        </div>
      )}

      {/* Options */}
      <div
        className={`grid ${short ? 'grid-cols-4 gap-2 sm:gap-3' : 'grid-cols-2 land:grid-cols-4 land:max-w-none land:gap-2 gap-3 sm:gap-4'} max-w-md mx-auto`}
        role="group"
        aria-label="Respostas"
        onKeyDown={arrowNav}
      >
        {options.map((option, index) => {
          const state = fb.stateOf(option.id, option.isCorrect);
          return (
            <motion.button
              key={option.id}
              type="button"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1, type: 'spring' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fb.answer(option.id, option.isCorrect)}
              disabled={state === 'eliminated' || (fb.locked && state !== 'correct')}
              aria-label={`${option.text}${optionStateLabel(state)}`}
              className={`
                ${OPTION_BASE} ${short ? 'p-2' : 'p-4'} rounded-lg font-body text-2xl font-bold pixel-border
                ${state === 'correct'
                  ? 'bg-brand-emerald text-gray-900'
                  : state === 'wrong'
                    ? 'bg-red-600 text-white'
                    : 'bg-white hover:bg-amber-50 text-gray-900'
                }
                ${optionStateClass(state)}
              `}
            >
              <span className="flex flex-col items-center gap-1">
                {option.text}
                {dots && /^\d+$/.test(option.text) && <NumberDots n={Number(option.text)} />}
              </span>
              <CorrectBadge show={state === 'correct'} />
            </motion.button>
          );
        })}
      </div>

      <AnswerFeedback stage={fb.stage} hint={data.hint} answer={data.correct} />
    </ActivityCard>
  );
}
