import { ItemArt } from './shared/ItemArt';
import { motion, type PanInfo } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { playSound } from '../../lib/sounds';
import { parseDragDrop, type DragItem } from '../../lib/activityParsers';
import { ActivityProps, OPTION_BASE, shuffleChanged } from './shared/utils';
import { useAnswerFeedback } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback } from './shared/ActivityUI';

function ItemFace({ item }: { item: DragItem }) {
  if (item.blockSize) {
    return <span className="grass-block pixel-border block" style={{ width: item.blockSize, height: item.blockSize }} aria-hidden="true" />;
  }
  if (item.emoji) return <ItemArt emoji={item.emoji} size={36} />;
  return <span className="font-minecraft text-lg sm:text-xl text-gray-900">{item.label}</span>;
}

const HINTS = {
  syllables: 'leia as sílabas em voz alta até formar a palavra.',
  numbers: 'comece pelo número menor e vá subindo.',
  sizes: 'comece pelo bloco menor e termine no maior.',
  deliver: 'pense: o que combina com o que está no espaço?',
};

export function DragDropActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  // Modo, peças e espaços vêm da pergunta: src/lib/activityParsers
  const data = useMemo(() => parseDragDrop(activity), [activity]);
  const { items: orderItems, slots: totalSlots, mode } = data;

  // Embaralha cada vez que a atividade abre (nunca já na ordem certa)
  const [shuffledItems] = useState(() => shuffleChanged(orderItems));
  const [placed, setPlaced] = useState<(string | null)[]>(() => Array(totalSlots).fill(null));
  const [shakeSlot, setShakeSlot] = useState<number | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const justDragged = useRef(false);
  const fb = useAnswerFeedback({ onCorrect, onWrong });

  const nextIndex = placed.indexOf(null);
  const nextItem = orderItems.find((i) => i.correctIndex === nextIndex);

  const tryPlace = (itemId: string, slotIndex: number) => {
    if (fb.solved || slotIndex < 0 || placed[slotIndex] || placed.includes(itemId)) return;
    const item = orderItems.find((i) => i.id === itemId)!;
    // Sílabas iguais (NA + NA) servem em qualquer das posições
    const fits = item.correctIndex === slotIndex || (mode === 'syllables' && orderItems[slotIndex]?.label === item.label);

    if (!fits) {
      // Errou: o item volta e o espaço balança (o que já foi colocado fica)
      setShakeSlot(slotIndex);
      setTimeout(() => setShakeSlot(null), 500);
      fb.markWrong();
      return;
    }

    playSound('break');
    const newPlaced = [...placed];
    newPlaced[slotIndex] = itemId;
    setPlaced(newPlaced);
    if (newPlaced.every((slot) => slot !== null)) fb.markCorrect();
  };

  // Soltou o item arrastado: descobre em qual espaço caiu
  const handleDragEnd = (itemId: string, info: PanInfo) => {
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false), 50);
    const x = info.point.x - window.scrollX;
    const y = info.point.y - window.scrollY;
    const slot = slotRefs.current.findIndex((el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });
    if (slot >= 0) tryPlace(itemId, slot);
  };

  // Toque ou Enter: vai para o próximo espaço vazio
  const handleTap = (itemId: string) => {
    if (justDragged.current) return;
    tryPlace(itemId, nextIndex);
  };

  const answerText =
    mode === 'sizes' ? 'do menor para o maior'
    : mode === 'deliver' ? orderItems.find((i) => i.correctIndex === 0)?.label
    : orderItems.filter((i) => i.correctIndex >= 0).map((i) => i.label).join(mode === 'syllables' ? ' + ' : ', ');

  return (
    <ActivityCard icon="📦" question={activity.question} subtitle="Arraste ou toque nos itens, na ordem certa!">
      {/* Slots at top */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 p-3 sm:p-4 bg-brand-sky/20 rounded-lg flex-wrap" role="list" aria-label="Espaços">
        {data.targetEmoji && (
          <div className="flex flex-col items-center mr-2" aria-label={`Alvo: ${data.targetLabel}`}>
            <span className="text-5xl" aria-hidden="true">{data.targetEmoji}</span>
            <span className="font-body text-xs font-bold text-gray-800">{data.targetLabel}</span>
          </div>
        )}
        {placed.map((slotItemId, index) => {
          const item = orderItems.find((i) => i.id === slotItemId);
          return (
            <div
              key={index}
              ref={(el) => { slotRefs.current[index] = el; }}
              role="listitem"
              aria-label={`Espaço ${index + 1}: ${item ? item.label : 'vazio'}`}
              className={`
                min-w-[64px] h-16 sm:min-w-[80px] sm:h-20 px-1 rounded-lg pixel-border flex items-center justify-center
                ${shakeSlot === index ? 'bg-red-200 animate-shake' : ''}
                ${fb.solved ? 'answer-correct bg-green-200' : ''}
                ${shakeSlot !== index && !fb.solved && item ? 'bg-amber-200' : ''}
                ${shakeSlot !== index && !fb.solved && !item ? 'bg-gray-100 border-dashed border-2 border-gray-500' : ''}
                ${index === nextIndex && !fb.solved ? 'ring-2 ring-brand-lapis' : ''}
              `}
            >
              {item ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <ItemFace item={item} />
                </motion.span>
              ) : (
                <span className="text-gray-600 font-minecraft text-sm" aria-hidden="true">{totalSlots > 1 ? index + 1 : '?'}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Items at bottom */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4" role="group" aria-label="Itens">
        {shuffledItems.map((item, index) => {
          if (placed.includes(item.id)) {
            return <div key={item.id} className="min-w-[64px] h-16 sm:min-w-[80px] sm:h-20" aria-hidden="true" />;
          }
          const reveal = fb.stage === 'reveal' && item.id === nextItem?.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              drag={!fb.solved}
              dragSnapToOrigin
              dragElastic={0.6}
              whileDrag={{ scale: 1.15, zIndex: 20 }}
              onDragEnd={(_, info) => handleDragEnd(item.id, info)}
              onClick={() => handleTap(item.id)}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1, type: 'spring' }}
              disabled={fb.solved}
              aria-label={`${item.label}. Toque para colocar no espaço ${nextIndex + 1}`}
              className={`
                ${OPTION_BASE} drag-handle min-h-0 min-w-[64px] h-16 sm:min-w-[80px] sm:h-20 px-2 rounded-lg pixel-border
                flex items-center justify-center cursor-grab active:cursor-grabbing
                bg-amber-100 hover:bg-amber-200 hover:shadow-lg
                ${reveal ? 'answer-reveal' : ''}
              `}
            >
              <ItemFace item={item} />
            </motion.button>
          );
        })}
      </div>

      {fb.solved && (
        <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center mt-4 font-body text-green-800 font-bold text-lg">
          🎉 Perfeito!
        </motion.p>
      )}

      <AnswerFeedback
        stage={fb.stage}
        hint={HINTS[mode]}
        answer={answerText}
        revealAction={nextItem ? 'O próximo está brilhando!' : ''}
      />
    </ActivityCard>
  );
}
