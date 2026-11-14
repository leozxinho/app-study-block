import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { speak } from '../../lib/voice';
import { Mob } from './Mob';
import type { MobType } from './mobSprites';
import { useGameStats } from '../../services/gameStatsService';

export type MascotMood = 'idle' | 'celebrate' | 'sad';

interface MobMascotProps {
  mood: MascotMood;
  /** Sem valor = personagem escolhido pelo jogador (Steve/Alex) com a skin da loja */
  type?: MobType;
  size?: number;
  /** Frase fixa no lugar da sorteada (ex.: "Muito bem! Próxima!") */
  say?: string;
  /** Não fala em voz alta (ex.: quando o modal de fim de fase já está falando) */
  silent?: boolean;
}

const PHRASES: Record<Exclude<MascotMood, 'idle'>, string[]> = {
  celebrate: [
    'Isso aí! 🎉', 'Mandou bem! ⭐', 'Você é demais! 💎', 'Uhuu! Acertou! 🎊', 'Que craque! 🏆', 'Show de bola! ⛏️',
    'Arrasou! 🌟', 'Boa! Continua assim! 👍', 'Acertou em cheio! 🎯', 'Que inteligente! 🧠', 'É isso mesmo! ✅', 'Você aprende rápido! 🚀',
  ],
  sad: [
    'Quase! Tenta de novo 💪', 'Calma, você consegue! 🙂', 'Olha a dica! 👀', 'Não desiste! 💪',
    'Hum... vamos olhar de novo? 🔍', 'Tá pertinho! 🤏', 'Errar faz parte. Bora de novo! 💪', 'Vamos juntos? Olha com calma. 🙂',
  ],
};

/** Mascote fixo no canto: comemora no acerto, anima no erro e fala com a criança (voz opcional). */
export function MobMascot({ mood, type, size = 64, say, silent = false }: MobMascotProps) {
  const { skin } = useGameStats();
  const [phrase, setPhrase] = useState('');

  // Cada acerto/erro sorteia uma fala nova e o mascote fala em voz alta
  useEffect(() => {
    if (mood === 'idle') return;
    const list = PHRASES[mood];
    const next = say ?? list[Math.floor(Math.random() * list.length)];
    setPhrase(next);
    if (!silent) speak(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fala só quando o humor muda
  }, [mood]);
  return (
    <div
      // Celular: canto de cima, menor, balão ao lado (embaixo cobria as respostas). Tela maior: canto de baixo.
      className="fixed top-[64px] right-1 sm:top-auto sm:bottom-3 sm:right-3 z-[60] pointer-events-none flex flex-row-reverse sm:flex-col items-start sm:items-end gap-1 origin-top-right scale-75 sm:scale-100"
      aria-hidden="true"
    >
      <AnimatePresence>
        {mood !== 'idle' && phrase && (
          <motion.div
            key={phrase}
            initial={{ opacity: 0, y: 8, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            className={`mt-3 sm:mt-0 sm:mb-10 bg-white pixel-border rounded-sm px-3 py-1 font-body font-bold text-sm ${
              mood === 'sad' ? 'text-orange-700' : 'text-brand-dark-green'
            }`}
          >
            {phrase}
          </motion.div>
        )}
      </AnimatePresence>
      <Mob
        key={mood}
        type={type ?? skin.character}
        skin={type ? undefined : skin}
        // o herói Faísca flutua parado e solta poder ao comemorar
        animation={(type ?? skin.character) === 'faisca' && mood !== 'sad' ? (mood === 'celebrate' ? 'power' : 'fly') : mood}
        size={size}
      />
    </div>
  );
}
