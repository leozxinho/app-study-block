import { motion, type PanInfo } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { Activity } from '../../types';
import { playSound } from '../../lib/sounds';
import { ActivityProps, OPTION_BASE, shuffle, shuffleChanged } from './shared/utils';
import { useAnswerFeedback } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback } from './shared/ActivityUI';
import { Mob, MOBS, type MobType } from '../mobs';
import { shadowCount } from '../../lib/activityParsers';

// Mobs com sombras muito parecidas: no máximo um de cada grupo por atividade
const LOOKALIKES: MobType[][] = [['steve', 'alex', 'zombie'], ['pig', 'cow']];
const ANIMALS: MobType[] = ['pig', 'sheep', 'cow', 'chicken', 'wolf'];
const MONSTERS: MobType[] = ['creeper', 'zombie', 'skeleton', 'enderman'];
const ALL: MobType[] = ['steve', 'alex', 'zombie', 'creeper', 'enderman', 'skeleton', 'villager', ...ANIMALS];

const PAIR_COLORS = ['#2563eb', '#16a34a', '#c026d3', '#ea580c', '#0891b2'];

function pickMobs(activity: Activity): MobType[] {
  const q = activity.question.toLowerCase();
  const pool = q.includes('animal') ? ANIMALS : q.includes('monstr') ? MONSTERS : ALL;
  const count = shadowCount(activity);
  const chosen: MobType[] = [];
  for (const m of shuffle(pool)) {
    const group = LOOKALIKES.find((g) => g.includes(m));
    if (group && chosen.some((c) => group.includes(c))) continue;
    chosen.push(m);
    if (chosen.length === count) break;
  }
  return chosen;
}

export function ShadowMatchActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  // Mobs e ordem das sombras sorteados cada vez que a atividade abre
  const mobs = useMemo(() => pickMobs(activity), [activity]);
  const [shadows] = useState(() => shuffleChanged(mobs));
  const [matched, setMatched] = useState<MobType[]>([]);
  const [selected, setSelected] = useState<{ side: 'mob' | 'shadow'; type: MobType } | null>(null);
  const [shake, setShake] = useState<MobType | null>(null);
  const justDragged = useRef(false);
  const fb = useAnswerFeedback({ onCorrect, onWrong });

  const tryMatch = (mob: MobType, shadow: MobType) => {
    setSelected(null);
    if (mob === shadow) {
      playSound('click');
      const next = [...matched, mob];
      setMatched(next);
      if (next.length === mobs.length) fb.markCorrect();
    } else {
      setShake(shadow);
      setTimeout(() => setShake(null), 500);
      fb.markWrong();
    }
  };

  const tap = (side: 'mob' | 'shadow', type: MobType) => {
    if (justDragged.current || fb.solved || matched.includes(type)) return;
    // Toca num lado e depois no outro (em qualquer ordem)
    if (selected && selected.side !== side) {
      const mob = side === 'mob' ? type : selected.type;
      const shadow = side === 'shadow' ? type : selected.type;
      tryMatch(mob, shadow);
      return;
    }
    playSound('click');
    setSelected(selected?.type === type && selected.side === side ? null : { side, type });
  };

  const handleDragEnd = (mob: MobType, info: PanInfo) => {
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false), 50);
    const el = document
      .elementsFromPoint(info.point.x - window.scrollX, info.point.y - window.scrollY)
      .map((e) => e.closest<HTMLElement>('[data-shadow]'))
      .find(Boolean);
    const shadow = el?.dataset.shadow as MobType | undefined;
    if (shadow && !matched.includes(shadow)) tryMatch(mob, shadow);
  };

  // Na "resposta certa", brilha o próximo par que falta
  const revealType = fb.stage === 'reveal' ? (selected?.type ?? mobs.find((m) => !matched.includes(m))) : undefined;
  const colorOf = (t: MobType) => PAIR_COLORS[mobs.indexOf(t) % PAIR_COLORS.length];

  const cell = 'w-full min-h-[96px] sm:min-h-[110px] rounded-lg pixel-border flex items-center justify-center p-2';

  return (
    <ActivityCard
      icon="👤"
      question={activity.question}
      subtitle="Toque num mob e depois na sombra dele (ou arraste)!"
    >
      <div className="grid grid-cols-2 gap-4 sm:gap-8 max-w-md mx-auto">
        {/* Mobs */}
        <div className="flex flex-col gap-3" role="group" aria-label="Mobs">
          <p className="font-body font-bold text-gray-800 text-center">Mobs</p>
          {mobs.map((m) => {
            const done = matched.includes(m);
            const isSel = selected?.side === 'mob' && selected.type === m;
            return (
              <motion.button
                key={m}
                type="button"
                drag={!done && !fb.solved}
                dragSnapToOrigin
                whileDrag={{ scale: 1.1, zIndex: 30 }}
                onDragEnd={(_, info) => handleDragEnd(m, info)}
                onClick={() => tap('mob', m)}
                disabled={done}
                aria-pressed={isSel}
                aria-label={`${MOBS[m].label}${done ? ', ligado à sombra' : ''}`}
                className={`
                  ${OPTION_BASE} drag-handle ${cell}
                  ${done ? 'bg-green-100' : isSel ? 'bg-amber-200 ring-4 ring-minecraft-lapis' : 'bg-sky-50 hover:bg-sky-100'}
                  ${revealType === m && !done ? 'answer-reveal' : ''}
                `}
                style={done ? { boxShadow: `0 0 0 4px ${colorOf(m)}` } : undefined}
              >
                <Mob type={m} size={48} animation={done ? 'celebrate' : 'idle'} repeat={done ? 1 : undefined} />
              </motion.button>
            );
          })}
        </div>

        {/* Sombras */}
        <div className="flex flex-col gap-3" role="group" aria-label="Sombras">
          <p className="font-body font-bold text-gray-800 text-center">Sombras</p>
          {shadows.map((s) => {
            const done = matched.includes(s);
            const isSel = selected?.side === 'shadow' && selected.type === s;
            return (
              <button
                key={s}
                type="button"
                data-shadow={s}
                onClick={() => tap('shadow', s)}
                disabled={done}
                aria-pressed={isSel}
                aria-label={done ? `Sombra do ${MOBS[s].label}` : 'Sombra misteriosa'}
                className={`
                  ${OPTION_BASE} ${cell}
                  ${done ? 'bg-green-100 answer-correct' : isSel ? 'bg-amber-200 ring-4 ring-minecraft-lapis' : 'bg-gray-100 hover:bg-gray-200'}
                  ${shake === s ? 'animate-shake ring-4 ring-red-600' : ''}
                  ${revealType === s && !done ? 'answer-reveal' : ''}
                `}
                style={done ? { boxShadow: `0 0 0 4px ${colorOf(s)}` } : undefined}
              >
                <span className={`mob-shadow ${done ? 'is-revealed' : ''}`}>
                  <Mob type={s} size={48} animation="idle" title={done ? MOBS[s].label : 'sombra'} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AnswerFeedback
        stage={fb.stage}
        hint="olhe o formato: orelhas, rabo, pernas e o tamanho de cada um."
        revealText="O mob e a sombra que combinam estão brilhando!"
      />
    </ActivityCard>
  );
}
