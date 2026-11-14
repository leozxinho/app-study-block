import { NumberDots } from './shared/NumberDots';
import { showsNumberDots } from './shared/numberDotsAge';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { ADD_COUNT_MS } from './shared/mathSceneTiming';

/** Até quantos itens o jogo conta em voz ("um, dois, três...") com as falas contando-NN. */
const VOICED_MAX = 5;
/** Tempo entre um número falado e o próximo (as falas duram ~0,7 s). */
const VOICE_COUNT_MS = 750;
const countFile = (n: number) => `voz/numeros/contando-${String(n).padStart(2, '0')}.mp3`;
import { playVoiceFile, speak, useVoiceEnabled } from '../../lib/voice';
import { hasAudio } from '../../lib/audio/library';
import { playCount, playSound } from '../../lib/sounds';
import { parseCounting, type CountIcon } from '../../lib/activityParsers';
import { Mob } from '../mobs';
import { PixelArt } from './shared/PixelArt';
import { BLOCKS } from './shared/pixelSprites';
import { ItemArt } from './shared/ItemArt';
import { useSceneTheme } from './shared/sceneTheme';
import { ActivityProps, OPTION_BASE, arrowNav } from './shared/utils';
import { useAnswerFeedback, optionStateClass, optionStateLabel } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback, CorrectBadge } from './shared/ActivityUI';

/** Intervalo entre um item e outro aparecer (s). */
const POP_STEP = 0.3;

/** Tamanho dos itens: grandes quando são poucos. */
const itemSize = (count: number) => (count <= 5 ? 52 : count <= 10 ? 44 : 36);

function ItemIcon({ icon, index, size }: { icon: CountIcon; index: number; size: number }) {
  const one = icon.varied ? icon.varied[index % icon.varied.length] : icon;
  if (one.mob) return <Mob type={one.mob} size={size} animation="idle" delay={index * 0.2} />;
  // Blocos e itens parados "respiram" (cada um no seu tempo)
  const style = { animationDelay: `${(index % 5) * 0.35}s` };
  if (one.block) return <span className="item-bob" style={style}><PixelArt sprite={BLOCKS[one.block]} size={Math.round(size * 0.8)} /></span>;
  return <span className="item-bob" style={style}><ItemArt emoji={one.emoji ?? '📦'} size={Math.round(size * 0.85)} /></span>;
}

export function CountingActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  // Quantidade, figura e alternativas vêm da pergunta (src/lib/activityParsers); sorteia a cada vez que abre
  const data = useMemo(() => parseCounting(activity), [activity]);
  const { count, options } = data;

  // Poucos itens: conta em voz (mais devagar, para a fala caber); o último é o "São N!" gravado
  const voiceOn = useVoiceEnabled();
  const voiced = voiceOn && count <= VOICED_MAX && Array.from({ length: count - 1 }, (_, i) => countFile(i + 1)).every(hasAudio);
  const countMs = voiced ? VOICE_COUNT_MS : ADD_COUNT_MS;
  // No acerto o jogo conta junto (1, 2, 3...): espera a contagem antes da próxima pergunta
  const fb = useAnswerFeedback({ onCorrect, onWrong }, { correctDelay: count * countMs + 1300 });
  // A criança pode tocar nos itens para contar; guardamos a ordem dos toques
  const [counted, setCounted] = useState<number[]>([]);
  // Contagem do acerto: quantos já foram contados pelo jogo
  const [shown, setShown] = useState(0);
  const celebrating = fb.solved;
  const dots = showsNumberDots();
  const theme = useSceneTheme();
  const size = itemSize(count);
  const finished = celebrating && shown >= count;

  useEffect(() => {
    if (!celebrating) return;
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setShown(i);
      if (!(voiced && i < count && playVoiceFile(countFile(i)))) playCount(i, i === count);
      if (i >= count) {
        clearInterval(id);
        speak(`São ${count}!`);
      }
    }, countMs);
    return () => clearInterval(id);
  }, [celebrating, count, voiced, countMs]);

  // As respostas só aparecem depois que todos os itens "pularam" na tela
  const optionsDelay = count * POP_STEP + 0.2;

  const countItem = (i: number) => {
    if (counted.includes(i) || fb.solved) return;
    playSound('click');
    setCounted((c) => [...c, i]);
  };

  return (
    <ActivityCard icon="🔢" question={data.displayQuestion} subtitle="Toque em cada item para contar!">
      {/* Itens para contar (num grupo; no acerto o jogo conta junto e mostra o total) */}
      <div className="flex flex-col items-center gap-2 mb-6 sm:mb-8">
      <div
        className={`relative flex flex-wrap items-end justify-center gap-2 sm:gap-3 px-3 sm:px-4 pt-6 pb-7 rounded-lg border-4 overflow-hidden bg-gradient-to-b ${theme.sky} ${
          celebrating ? 'border-minecraft-gold' : 'border-sky-600/60'
        }`}
        role="group"
        aria-label={`Itens para contar. Você já contou ${counted.length}.`}
        onKeyDown={arrowNav}
      >
        {Array.from({ length: count }).map((_, i) => {
          // No acerto vale a contagem do jogo (1, 2, 3... na ordem); antes, a ordem dos toques
          const order = celebrating ? (i < shown ? i : -1) : counted.indexOf(i);
          const jumping = celebrating && i < shown;
          return (
            <button
              key={i}
              type="button"
              onClick={() => countItem(i)}
              aria-label={order >= 0 ? `Item contado: ${order + 1}` : 'Item, toque para contar'}
              style={{ animationDelay: `${i * POP_STEP}s` }}
              className={`
                pop-in ${OPTION_BASE} min-h-0 relative z-[1] rounded-lg p-1
                flex items-center justify-center
                ${order >= 0 ? 'bg-white/70 ring-4 ring-minecraft-emerald' : 'bg-white/25 hover:bg-white/50'}
              `}
            >
              <motion.span
                key={jumping ? 'jump' : 'idle'}
                className="flex items-center justify-center"
                animate={jumping ? { y: [0, -12, 0], scale: [1, 1.15, 1] } : undefined}
                transition={{ duration: 0.35 }}
              >
                <ItemIcon icon={data.icon} index={i} size={size} />
              </motion.span>
              {order >= 0 && (
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-minecraft-dark-green text-white font-minecraft text-[10px] flex items-center justify-center">
                  {order + 1}
                </span>
              )}
            </button>
          );
        })}
        {/* chão do mundo: os itens ficam em cima dele */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-5" style={{ background: theme.ground }} />
      </div>
        {/* Total: "?" antes; contando no acerto; "São N!" no fim */}
        <motion.span
          key={finished ? 'total' : celebrating ? shown : 'q'}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`min-w-[32px] px-3 h-8 rounded-sm text-white font-minecraft text-sm flex items-center justify-center ${
            celebrating ? 'bg-minecraft-dark-green' : 'bg-sky-600'
          }`}
          aria-live="polite"
        >
          {finished ? `São ${count}!` : celebrating ? shown || '…' : '?'}
        </motion.span>
      </div>

      {/* Options */}
      <div
        className="grid grid-cols-4 gap-2 sm:gap-3 max-w-sm mx-auto"
        role="group"
        aria-label="Quantos são?"
        onKeyDown={arrowNav}
      >
        {options.map((num, index) => {
          const state = fb.stateOf(String(num), num === count);
          return (
            <motion.button
              key={num}
              type="button"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: optionsDelay + index * 0.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fb.answer(String(num), num === count)}
              disabled={state === 'eliminated' || (fb.locked && state !== 'correct')}
              aria-label={`${num}${optionStateLabel(state)}`}
              className={`
                ${OPTION_BASE} w-full min-h-[64px] py-2 rounded-lg font-minecraft text-xl pixel-border
                ${state === 'correct'
                  ? 'bg-minecraft-emerald text-gray-900'
                  : state === 'wrong'
                    ? 'bg-red-600 text-white'
                    : 'bg-amber-100 hover:bg-amber-200 text-gray-900'
                }
                ${optionStateClass(state)}
              `}
            >
              <span className="flex flex-col items-center gap-1">
                {num}
                {dots && <NumberDots n={num} />}
              </span>
              <CorrectBadge show={state === 'correct'} />
            </motion.button>
          );
        })}
      </div>

      <AnswerFeedback
        stage={fb.stage}
        hint="toque em cada item e conte em voz alta: 1, 2, 3..."
        answer={`${count} (são ${count} itens)`}
      />
    </ActivityCard>
  );
}
