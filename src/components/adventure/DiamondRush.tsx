import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { playSfx } from '../../lib/sounds';
import { setMusicOverride } from '../../lib/audio/music';
import { playVoiceFile, speak } from '../../lib/voice';

interface Drop {
  id: number;
  x: number; // % da largura
  fall: number; // segundos
  icon: '💎' | '⭐';
}

interface DiamondRushProps {
  /** Termina com quantos pegou (o XP é somado por quem chamou) */
  onFinish: (collected: number) => void;
  seconds?: number;
}

/** Minijogo entre as perguntas: toque nos diamantes que caem antes que cheguem ao chão. */
export function DiamondRush({ onFinish, seconds = 8 }: DiamondRushProps) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [drops, setDrops] = useState<Drop[]>([]);
  const [collected, setCollected] = useState(0);
  const [left, setLeft] = useState(seconds);
  const nextId = useRef(0);

  // Aviso "Prepare-se!" e depois começa
  useEffect(() => {
    speak('Minijogo! Pegue os diamantes!');
    playSfx('minijogo-comeca');
    setMusicOverride('minijogo');
    const t = setTimeout(() => setPhase('play'), 1500);
    return () => {
      clearTimeout(t);
      setMusicOverride(null);
    };
  }, []);

  // Diamantes caindo + relógio
  useEffect(() => {
    if (phase !== 'play') return;
    const spawn = setInterval(() => {
      const id = nextId.current++;
      setDrops((d) => [...d, { id, x: 5 + Math.random() * 85, fall: 2.6 + Math.random() * 1.4, icon: id % 7 === 6 ? '⭐' : '💎' }]);
    }, 420);
    const clock = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => {
      clearInterval(spawn);
      clearInterval(clock);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === 'play' && left <= 0) {
      setPhase('done');
      playVoiceFile('voz/mascote/minijogo-fim.mp3');
      setDrops([]);
      playSfx('fim-de-tempo', 'trophy');
    }
  }, [left, phase]);

  // Mostra o resultado e devolve (o timer é refeito se o efeito rodar de novo, nunca some)
  useEffect(() => {
    if (phase !== 'done') return;
    const t = setTimeout(() => onFinish(collected), 1800);
    return () => clearTimeout(t);
  }, [phase, collected, onFinish]);

  const grab = (drop: Drop) => {
    setDrops((d) => d.filter((x) => x.id !== drop.id));
    setCollected((c) => c + (drop.icon === '⭐' ? 3 : 1));
    if (drop.icon === '⭐') playSfx('estrela-pega', 'star');
    else playSfx(`diamante-pego-${1 + (drop.id % 3)}`, 'xp');
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-800 to-stone-900 overflow-hidden" role="dialog" aria-modal="true" aria-label="Minijogo: pegue os diamantes">
      <div className="absolute top-3 inset-x-0 flex justify-between px-4 font-minecraft text-white text-sm z-10">
        <span>💎 {collected}</span>
        <span>⏱️ {Math.max(left, 0)}s</span>
      </div>

      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
          >
            <p className="text-6xl mb-3" aria-hidden="true">⛏️💎</p>
            <p className="font-minecraft text-xl text-brand-gold">MINIJOGO!</p>
            <p className="font-body text-white text-lg mt-2">Toque nos diamantes antes que caiam!</p>
            <p className="font-body text-white/80 text-sm mt-1">⭐ vale 3</p>
          </motion.div>
        )}
      </AnimatePresence>

      {drops.map((drop) => (
        <motion.button
          key={drop.id}
          type="button"
          aria-label={drop.icon === '⭐' ? 'Estrela' : 'Diamante'}
          initial={{ y: '-10vh', rotate: 0 }}
          animate={{ y: '105vh', rotate: 360 }}
          transition={{ duration: drop.fall, ease: 'linear' }}
          onAnimationComplete={() => setDrops((d) => d.filter((x) => x.id !== drop.id))}
          onPointerDown={() => grab(drop)}
          className="absolute top-0 w-16 h-16 -ml-8 text-5xl flex items-center justify-center select-none touch-none"
          style={{ left: `${drop.x}%` }}
        >
          <span aria-hidden="true">{drop.icon}</span>
        </motion.button>
      ))}

      <AnimatePresence>
        {phase === 'done' && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
            role="status"
          >
            <p className="text-6xl" aria-hidden="true">💎</p>
            <p className="font-minecraft text-xl text-white mt-2">Você pegou {collected}!</p>
            <p className="font-minecraft text-lg text-brand-gold mt-1">+{Math.min(collected, 10)} XP</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 inset-x-0 h-8 bg-brand-dirt block-pattern" aria-hidden="true" />
    </div>
  );
}
