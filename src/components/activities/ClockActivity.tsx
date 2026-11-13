import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { parseClock } from '../../lib/activityParsers';
import { ActivityProps, OPTION_BASE, arrowNav } from './shared/utils';
import { useAnswerFeedback, optionStateClass, optionStateLabel } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback, CorrectBadge } from './shared/ActivityUI';

/** Relógio de ponteiros (estilo de blocos). */
function Clock({ hour, minute, celebrate }: { hour: number; minute: number; celebrate: boolean }) {
  const hourAngle = ((hour % 12) + minute / 60) * 30;
  const minuteAngle = minute * 6;
  return (
    <motion.svg
      viewBox="-60 -60 120 120"
      className="w-44 h-44 sm:w-52 sm:h-52 drop-shadow-lg"
      animate={celebrate ? { rotate: [0, -6, 6, 0], scale: [1, 1.08, 1] } : undefined}
      transition={{ duration: 0.6 }}
      role="img"
      aria-label="Relógio de ponteiros"
    >
      <rect x="-58" y="-58" width="116" height="116" rx="10" fill="#8B5A2B" />
      <circle r="50" fill="#fff8e7" stroke="#5c3d1e" strokeWidth="4" />
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const ang = (n * 30 * Math.PI) / 180;
        return (
          <text key={n} x={Math.sin(ang) * 38} y={-Math.cos(ang) * 38 + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#3b2a14" fontFamily="Nunito, sans-serif">
            {n}
          </text>
        );
      })}
      {Array.from({ length: 60 }, (_, i) => (
        <line key={i} x1="0" y1="-47" x2="0" y2={i % 5 ? -45 : -43} stroke="#5c3d1e" strokeWidth={i % 5 ? 0.6 : 1.4} transform={`rotate(${i * 6})`} />
      ))}
      {/* ponteiro das horas (curto e grosso) e dos minutos (longo) */}
      <line x1="0" y1="4" x2="0" y2="-24" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" transform={`rotate(${hourAngle})`} />
      <line x1="0" y1="6" x2="0" y2="-38" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${minuteAngle})`} />
      <circle r="4" fill="#3b2a14" />
    </motion.svg>
  );
}

export function ClockActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  const data = useMemo(() => parseClock(activity), [activity]);
  const answer = `${data.hour}:${String(data.minute).padStart(2, '0')}`;
  const fb = useAnswerFeedback({ onCorrect, onWrong });

  return (
    <ActivityCard icon="🕒" question={data.displayQuestion} subtitle="Ponteiro curto (azul) = horas · ponteiro longo (vermelho) = minutos">
      <div className="flex justify-center mb-5">
        <Clock hour={data.hour} minute={data.minute} celebrate={fb.solved} />
      </div>
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto" role="group" aria-label="Respostas" onKeyDown={arrowNav}>
        {data.options.map((opt, i) => {
          const state = fb.stateOf(opt, opt === answer);
          return (
            <motion.button
              key={opt}
              type="button"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.08, type: 'spring' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fb.answer(opt, opt === answer)}
              disabled={state === 'eliminated' || (fb.locked && state !== 'correct')}
              aria-label={`${opt.replace(':', ' e ')}${optionStateLabel(state)}`}
              className={`${OPTION_BASE} min-h-[64px] rounded-lg pixel-border font-minecraft text-xl ${
                state === 'correct' ? 'bg-minecraft-emerald text-gray-900' : state === 'wrong' ? 'bg-red-600 text-white' : 'bg-white hover:bg-amber-50 text-gray-900'
              } ${optionStateClass(state)}`}
            >
              {opt}
              <CorrectBadge show={state === 'correct'} />
            </motion.button>
          );
        })}
      </div>
      <AnswerFeedback
        stage={fb.stage}
        hint="olhe primeiro o ponteiro curto (azul): ele mostra a hora."
        answer={`são ${answer}`}
      />
    </ActivityCard>
  );
}
