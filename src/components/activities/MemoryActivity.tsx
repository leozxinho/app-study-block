import { useEffect, useRef, useState } from 'react';
import { playSound } from '../../lib/sounds';
import { MEMORY_PAIRS as PAIRS, parseMemory } from '../../lib/activityParsers';
import { Activity } from '../../types';
import { ActivityProps, OPTION_BASE, arrowNav, shuffle } from './shared/utils';
import { useAnswerFeedback } from './shared/useAnswerFeedback';
import { ActivityCard, AnswerFeedback } from './shared/ActivityUI';

const PEEK_MS = 1500;

interface MemoryCard {
  id: number;
  icon: string;
  name: string;
  flipped: boolean;
  matched: boolean;
}

function newDeck(activity: Activity): MemoryCard[] {
  // Figuras do tema da pergunta (floresta, castelo, End...) e cartas embaralhadas a cada vez
  const chosen = parseMemory(activity).icons;
  return shuffle([...chosen, ...chosen]).map((c, index) => ({
    id: index,
    icon: c.icon,
    name: c.name,
    flipped: false,
    matched: false,
  }));
}

export function MemoryActivity({ activity, onCorrect, onWrong }: ActivityProps) {
  const [cards, setCards] = useState<MemoryCard[]>(() => newDeck(activity));
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [canFlip, setCanFlip] = useState(true);
  const [peeking, setPeeking] = useState(false);
  // Cartas que a criança já viu ao menos uma vez
  const seen = useRef(new Set<number>());
  const fb = useAnswerFeedback({ onCorrect, onWrong });

  const matchedPairs = cards.filter((c) => c.matched).length / 2;
  const { markCorrect } = fb;

  useEffect(() => {
    if (matchedPairs === PAIRS) markCorrect();
  }, [matchedPairs, markCorrect]);

  // "Resposta certa" da memória: espiar todas as cartas por um instante
  const peek = () => {
    setPeeking(true);
    setCanFlip(false);
    setTimeout(() => {
      setPeeking(false);
      setCanFlip(true);
    }, PEEK_MS);
  };

  const handleFlip = (cardId: number) => {
    if (!canFlip || peeking) return;
    const card = cards[cardId];
    if (card.flipped || card.matched) return;

    playSound('click');
    const newCards = cards.map((c) => (c.id === cardId ? { ...c, flipped: true } : c));
    setCards(newCards);

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);
    if (newFlipped.length < 2) return;

    setCanFlip(false);
    const [first, second] = newFlipped;

    if (newCards[first].icon === newCards[second].icon) {
      // Match!
      setTimeout(() => {
        playSound('break');
        setCards((cs) => cs.map((c) => (c.id === first || c.id === second ? { ...c, matched: true } : c)));
        setFlippedCards([]);
        setCanFlip(true);
      }, 500);
    } else {
      // Errar faz parte do jogo; só conta como erro se a criança já tinha visto o par da 1ª carta
      const partner = newCards.find((c) => c.id !== first && c.icon === newCards[first].icon)!;
      const isMistake = seen.current.has(partner.id);
      seen.current.add(first);
      seen.current.add(second);

      setTimeout(() => {
        setCards((cs) => cs.map((c) => (c.id === first || c.id === second ? { ...c, flipped: false } : c)));
        setFlippedCards([]);
        setCanFlip(true);
        if (isMistake) {
          fb.markWrong();
          // A partir do 2º erro, mostramos todas as cartas rapidinho
          if (fb.wrongCount + 1 >= 2) peek();
        }
      }, 1000);
    }
  };

  return (
    <ActivityCard
      icon="🧠"
      question={activity.question}
      subtitle={`Pares encontrados: ${matchedPairs} de ${PAIRS}`}
    >
      {/* Memory Grid */}
      <div
        className="grid grid-cols-5 gap-2 sm:gap-3 max-w-sm sm:max-w-lg mx-auto"
        role="group"
        aria-label="Cartas da memória"
        onKeyDown={arrowNav}
      >
        {cards.map((card) => {
          const faceUp = card.flipped || card.matched || peeking;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleFlip(card.id)}
              aria-label={
                card.matched
                  ? `${card.name}, par encontrado`
                  : faceUp
                    ? `Carta ${card.id + 1}: ${card.name}`
                    : `Carta ${card.id + 1}, virada para baixo`
              }
              aria-disabled={card.matched}
              className={`${OPTION_BASE} min-h-0 flip-card aspect-square w-full rounded-lg`}
            >
              <div className={`flip-inner ${faceUp ? 'is-flipped' : ''}`}>
                {/* Verso: bloco de grama */}
                <div className="flip-face block-back rounded-lg pixel-border" />
                {/* Frente: figura */}
                <div
                  className={`flip-face flip-front rounded-lg pixel-border flex items-center justify-center
                    ${card.matched ? 'bg-green-200 answer-correct' : 'bg-amber-100'}`}
                >
                  <span className="text-3xl sm:text-4xl" aria-hidden="true">{card.icon}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <AnswerFeedback
        stage={fb.stage}
        hint="tente lembrar onde você já viu cada figura."
        revealText="Vamos espiar! Olhe bem as cartas enquanto elas aparecem."
      />
    </ActivityCard>
  );
}
