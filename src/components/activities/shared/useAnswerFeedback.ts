import { playVoiceSequence } from '../../../lib/voice';
import { useCallback, useEffect, useRef, useState } from 'react';
import { playSound } from '../../../lib/sounds';

/** none = sem ajuda; hint = 1º erro (dica); reveal = 2º erro em diante (mostra a resposta). */
export type FeedbackStage = 'none' | 'hint' | 'reveal';
export type OptionState = 'idle' | 'correct' | 'wrong' | 'eliminated' | 'reveal';

const CORRECT_DELAY = 900;
const WRONG_RESET = 800;

interface Callbacks {
  onCorrect: () => void;
  onWrong: () => void;
}

/**
 * Controla acerto/erro de uma atividade:
 * - acerto: som + animação, e chama onCorrect depois de um instante;
 * - erro: som, chama onWrong, mostra dica no 1º erro e a resposta certa a partir do 2º.
 */
export function useAnswerFeedback({ onCorrect, onWrong }: Callbacks, options: { correctDelay?: number } = {}) {
  const correctDelay = options.correctDelay ?? CORRECT_DELAY;
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [eliminated, setEliminated] = useState<string[]>([]);
  const timers = useRef<number[]>([]);
  const done = useRef(false);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => clearTimeout(t));
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  /** Para atividades com vários passos (memória, ordenar...). */
  const markCorrect = useCallback(() => {
    if (done.current) return;
    done.current = true;
    playSound('correct');
    setResult('correct');
    later(onCorrect, correctDelay);
  }, [later, onCorrect, correctDelay]);

  const wrongs = useRef(0);
  const markWrong = useCallback(() => {
    playSound('wrong');
    wrongs.current++;
    // 2º erro: a resposta certa brilha e a narradora avisa (o mascote fala depois)
    if (wrongs.current === 2) playVoiceSequence(['voz/frases/resposta-brilha.mp3']);
    setWrongCount((c) => c + 1);
    onWrong();
  }, [onWrong]);

  /** Para atividades de escolher uma resposta. */
  const answer = useCallback(
    (id: string, isCorrect: boolean) => {
      if (done.current || result !== null) return;
      setPicked(id);
      if (isCorrect) {
        markCorrect();
        return;
      }
      setResult('wrong');
      setEliminated((list) => [...list, id]);
      markWrong();
      later(() => {
        setPicked(null);
        setResult(null);
      }, WRONG_RESET);
    },
    [result, markCorrect, markWrong, later]
  );

  const stage: FeedbackStage =
    result === 'correct' ? 'none' : wrongCount >= 2 ? 'reveal' : wrongCount === 1 ? 'hint' : 'none';

  const stateOf = (id: string, isCorrect: boolean): OptionState => {
    if (picked === id && result) return result;
    if (result === 'correct') return 'idle';
    if (eliminated.includes(id)) return 'eliminated';
    if (stage === 'reveal' && isCorrect) return 'reveal';
    return 'idle';
  };

  return {
    picked,
    result,
    locked: result !== null,
    solved: result === 'correct',
    wrongCount,
    stage,
    answer,
    stateOf,
    markCorrect,
    markWrong,
  };
}

/** Classes visuais de cada estado de uma opção. */
export function optionStateClass(state: OptionState): string {
  switch (state) {
    case 'correct':
      return 'answer-correct ring-4 ring-minecraft-emerald';
    case 'wrong':
      return 'animate-shake ring-4 ring-red-600';
    case 'eliminated':
      return 'opacity-40 grayscale cursor-not-allowed';
    case 'reveal':
      return 'answer-reveal';
    default:
      return '';
  }
}

/** Texto para leitor de tela. */
export function optionStateLabel(state: OptionState): string {
  switch (state) {
    case 'correct':
      return ', certo!';
    case 'wrong':
    case 'eliminated':
      return ', não é essa';
    case 'reveal':
      return ', resposta certa';
    default:
      return '';
  }
}
