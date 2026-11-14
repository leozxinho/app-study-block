import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Undo2 } from 'lucide-react';
import { playSound } from '../../lib/sounds';
import { parseOrdering, type OrderItem } from '../../lib/activityParsers';
import { ActivityProps, OPTION_BASE, arrowNav, shuffleChanged } from './shared/utils';
import { useAnswerFeedback } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback } from './shared/ActivityUI';

function getHint(items: OrderItem[]): string {
  if (items.some((i) => i.scale)) return 'comece pelo menor de todos e termine no maior.';
  if (items.every((i) => /^\d+$/.test(i.text))) return 'comece pelo número menor e vá subindo.';
  if (items.every((i) => /^[A-Z]$/.test(i.text))) return 'cante o ABC e siga a ordem das letras.';
  return 'leia as partes em voz alta até formar a palavra.';
}

export function OrderingActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  // Peças vêm da pergunta (sílabas com acento, letras, números, tamanhos): src/lib/activityParsers
  const items = useMemo(() => parseOrdering(activity).items, [activity]);
  // Embaralha cada vez que a atividade abre (nunca já na ordem certa)
  const [available, setAvailable] = useState<OrderItem[]>(() => shuffleChanged(items));
  const [placed, setPlaced] = useState<OrderItem[]>([]);
  const [wrongFlash, setWrongFlash] = useState(false);
  const fb = useAnswerFeedback({ onCorrect, onWrong });

  const nextItem = items[placed.length];

  const handleSelect = (item: OrderItem) => {
    if (fb.solved || wrongFlash) return;
    playSound('click');
    const newPlaced = [...placed, item];
    setPlaced(newPlaced);
    setAvailable(available.filter((a) => a.id !== item.id));

    if (newPlaced.length < items.length) return;

    // Compara pelo texto: peças repetidas (ex.: NA + NA) podem ir em qualquer das duas posições
    if (newPlaced.every((p, i) => p.text === items[i].text && (p.scale ?? 0) === (items[i].scale ?? 0))) {
      fb.markCorrect();
    } else {
      setWrongFlash(true);
      fb.markWrong();
      setTimeout(() => {
        setPlaced([]);
        setAvailable(shuffleChanged(items));
        setWrongFlash(false);
      }, 1000);
    }
  };

  const handleRemoveLast = () => {
    if (placed.length === 0 || fb.solved || wrongFlash) return;
    playSound('click');
    const last = placed[placed.length - 1];
    setPlaced(placed.slice(0, -1));
    setAvailable([...available, last]);
  };

  return (
    <ActivityCard icon="📝" question={activity.question} subtitle="Toque nas peças na ordem certa!">
      {/* Placed items */}
      <div
        className={`flex items-center justify-center gap-2 mb-6 min-h-[76px] rounded-lg p-3 pixel-border flex-wrap
          ${wrongFlash ? 'bg-red-100 animate-shake' : fb.solved ? 'bg-green-100 answer-correct' : 'bg-gray-50'}`}
        aria-live="polite"
        aria-label={placed.length ? `Sua resposta: ${placed.map((p) => p.text).join(', ')}` : 'Sua resposta está vazia'}
      >
        {placed.length === 0 ? (
          <p className="font-body text-base text-gray-700">Toque abaixo para começar...</p>
        ) : (
          placed.map((item) => (
            <motion.div
              key={item.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-brand-dark-green text-white px-4 py-3 rounded-lg pixel-border font-minecraft text-lg"
            >
              <span style={item.scale ? { fontSize: `${item.scale * 1.2}rem` } : undefined}>{item.text}</span>
            </motion.div>
          ))
        )}
      </div>

      {/* Available items */}
      <div
        className="flex flex-wrap items-center justify-center gap-3"
        role="group"
        aria-label="Peças"
        onKeyDown={arrowNav}
      >
        {available.map((item, index) => (
          <motion.button
            key={item.id}
            type="button"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSelect(item)}
            disabled={fb.solved || wrongFlash}
            aria-label={item.scale ? `Figura tamanho ${item.order}` : `Peça ${item.text}`}
            className={`
              ${OPTION_BASE} min-w-[72px] px-5 py-3 rounded-lg pixel-border font-minecraft text-xl
              bg-amber-100 hover:bg-amber-200 text-gray-900
              ${fb.stage === 'reveal' && item.id === nextItem?.id ? 'answer-reveal' : ''}
            `}
          >
            <span style={item.scale ? { fontSize: `${item.scale * 1.6}rem` } : undefined}>{item.text}</span>
          </motion.button>
        ))}
      </div>

      {placed.length > 0 && !fb.solved && (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={handleRemoveLast}
            className={`${OPTION_BASE} min-h-[48px] px-4 rounded-lg bg-white border-2 border-red-700 text-red-800 font-body font-bold flex items-center gap-2`}
          >
            <Undo2 size={18} aria-hidden="true" /> Desfazer
          </button>
        </div>
      )}

      <AnswerFeedback
        stage={fb.stage}
        hint={getHint(items)}
        answer={items.map((i) => i.text).join(' → ')}
        revealAction="A próxima peça está brilhando!"
      />
    </ActivityCard>
  );
}
