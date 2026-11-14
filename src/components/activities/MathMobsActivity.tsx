import { NumberDots } from './shared/NumberDots';
import { showsNumberDots } from './shared/numberDotsAge';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { mathMobsHint, mathMobsLabel, parseMathMobs, findMathUnitPair } from '../../lib/activityParsers';
import { Mob } from '../mobs';
import { ActivityProps, OPTION_BASE, arrowNav } from './shared/utils';
import { useAnswerFeedback, optionStateClass, optionStateLabel } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback, CorrectBadge } from './shared/ActivityUI';
import { MathMobsScene } from './shared/MathMobsScene';
import { celebrationMs } from './shared/mathSceneTiming';

const OP_ICON = { '+': '➕', '-': '➖', '×': '✖️', '÷': '➗' } as const;

/**
 * Contas com mobs na tela: a conta aparece desenhada (mobs/blocos) e animada conforme a operação,
 * com o texto embaixo ("2 creepers + 3 creepers = ?") e 3 ou 4 alternativas em blocos.
 */
export function MathMobsActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  const data = useMemo(() => parseMathMobs(activity), [activity]);
  const { problem, unit, options } = data;
  // Item do 2º grupo (igual ao do 1º, a não ser que a pergunta cite outro)
  const unitB = useMemo(() => findMathUnitPair(activity.question, unit)[1], [activity.question, unit]);

  // A comemoração conta os mobs um a um: espera a contagem antes de ir para a próxima
  const correctDelay = celebrationMs(problem);
  const dots = showsNumberDots();
  const fb = useAnswerFeedback({ onCorrect, onWrong }, { correctDelay });

  // Erro: creeper incha e pisca, e a animação repete mais devagar
  const [replay, setReplay] = useState(0);
  const [swell, setSwell] = useState(0);
  const seenWrong = useRef(0);
  useEffect(() => {
    if (fb.wrongCount > seenWrong.current) {
      seenWrong.current = fb.wrongCount;
      setSwell((s) => s + 1);
      setReplay((r) => r + 1);
    }
  }, [fb.wrongCount]);

  return (
    <ActivityCard icon={OP_ICON[problem.op]} question="Quanto dá a conta?" spoken={`Quanto é ${problem.a} ${problem.op} ${problem.b}?`}>
      <div className="relative bg-gradient-to-b from-sky-100 to-green-100 rounded-lg pixel-border p-3 sm:p-4 mb-3 overflow-hidden">
        {/* Creeper "fiscal": incha e pisca no erro, mas não explode */}
        <div className="absolute top-1 right-2" aria-hidden="true">
          <span key={swell} className={swell > 0 ? 'mm-swell' : ''}>
            <Mob type="creeper" size={30} animation="idle" />
          </span>
        </div>
        <MathMobsScene problem={problem} unit={unit} unitB={unitB} celebrate={fb.solved} replay={replay} slow={replay > 0} />
      </div>

      <p className="text-center font-body font-bold text-lg sm:text-xl text-gray-900 mb-5" aria-live="polite">
        {mathMobsLabel(problem, unit).replace('?', fb.solved ? String(problem.answer) : '?')}
      </p>

      <div
        className={`grid ${options.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'} gap-3 max-w-md mx-auto`}
        role="group"
        aria-label="Respostas"
        onKeyDown={arrowNav}
      >
        {options.map((n, index) => {
          const state = fb.stateOf(String(n), n === problem.answer);
          return (
            <motion.button
              key={n}
              type="button"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => fb.answer(String(n), n === problem.answer)}
              disabled={state === 'eliminated' || (fb.locked && state !== 'correct')}
              aria-label={`${n}${optionStateLabel(state)}`}
              className={`
                ${OPTION_BASE} h-20 rounded-md pixel-border font-minecraft text-2xl text-gray-900
                ${state === 'correct' ? 'bg-minecraft-emerald' : state === 'wrong' ? 'bg-red-300' : 'block-pattern bg-stone-300 hover:bg-stone-200'}
                ${optionStateClass(state)}
              `}
            >
              <span className="flex flex-col items-center gap-1">
                {n}
                {dots && <NumberDots n={n} />}
              </span>
              <CorrectBadge show={state === 'correct'} />
            </motion.button>
          );
        })}
      </div>

      <AnswerFeedback
        stage={fb.stage}
        hint={mathMobsHint(problem, unit)}
        revealText={<>A resposta certa está brilhando: <span className="underline">{problem.answer}</span>!</>}
      />
    </ActivityCard>
  );
}
