import { Confetti } from '../ui/Confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { MinecraftButton } from '../ui/MinecraftButton';
import { playSfx, playSound } from '../../lib/sounds';
import { playJingle } from '../../lib/audio/music';
import { queueVoiceFile } from '../../lib/voice';

/** Fala gravada de cada destaque: as do mascote ou o nome da conquista (voz/conquistas/<id>). */
function highlightVoice(h: { id: string; kind?: string }): string {
  if (h.kind === 'chest') return 'voz/mascote/meta-cumprida.mp3';
  if (h.id === 'figurinha') return 'voz/mascote/nova-figurinha.mp3';
  if (h.id === 'recorde') return 'voz/mascote/recorde.mp3';
  if (h.id === 'ofensiva') return 'voz/mascote/ofensiva.mp3';
  if (h.id === 'minijogo' || h.id === 'chefe') return ''; // já falados no minijogo e pelo chefe
  return `voz/conquistas/${h.id}.mp3`;
}

/** Efeito gravado de cada destaque do modal (docs/audio/ROTEIRO-AUDIO.txt, 3.5). */
function highlightSfx(h: { id: string; kind?: string }): string {
  if (h.kind === 'chest') return 'bau-abre';
  if (h.id === 'recorde' || h.id === 'figurinha' || h.id === 'ofensiva') return h.id;
  if (h.id === 'chefe') return 'chefe-derrotado';
  if (h.id === 'minijogo') return 'xp-somando';
  if (/^trofeu-fases-(25|50|100)$/.test(h.id)) return 'trofeu-grande';
  return 'conquista';
}

/** Algo ganho na fase que aparece animado no modal, um por vez. */
export interface RewardHighlight {
  id: string;
  icon: string;
  /** Linha pequena dourada (ex.: "Troféu ganho!") */
  label: string;
  title: string;
  text?: string;
  /** chest = baú que treme e abre */
  kind?: 'chest';
}

interface LevelRewardModalProps {
  show: boolean;
  levelNumber: number;
  stars: number;
  xpGained: number;
  worldCompleted: boolean;
  /** Novo nível do jogador, se subiu agora */
  newPlayerLevel?: number | null;
  /** Conquistas, troféus, figurinha, recorde, ofensiva, baú... (um por vez, com animação) */
  highlights?: RewardHighlight[];
  /** Próxima fase (null na última) */
  nextLevel: number | null;
  onNext: () => void;
  onMap: () => void;
}

// Linha do tempo da comemoração (segundos)
const T_STARS = 0.5;
const STAR_GAP = 0.35;
const T_XP = T_STARS + 3 * STAR_GAP + 0.1;
const T_LEVEL_UP = T_XP + 0.9;
const ACH_GAP = 0.6;

/** Número que conta de 0 até o valor (efeito de "somando XP"). */
function CountUp({ to, delay, duration = 0.8 }: { to: number; delay: number; duration?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const startAt = performance.now() + delay * 1000;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - startAt) / (duration * 1000)));
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, delay, duration]);
  return <>{value}</>;
}

/** Explosão de brilhos em volta de um troféu. */
function Burst({ delay }: { delay: number }) {
  const bits = ['✨', '⭐', '✨', '💫', '✨', '⭐', '✨', '💫'];
  return (
    <span className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {bits.map((b, i) => {
        const angle = (i / bits.length) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 text-base"
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{ x: Math.cos(angle) * 70, y: Math.sin(angle) * 45, opacity: [0, 1, 0], scale: [0.4, 1.2, 0.6] }}
            transition={{ delay, duration: 0.9, ease: 'easeOut' }}
          >
            {b}
          </motion.span>
        );
      })}
    </span>
  );
}

/** Cartão de destaque que "cai" girando e brilha (o baú treme e abre). */
function HighlightCard({ item, delay }: { item: RewardHighlight; delay: number }) {
  const [opened, setOpened] = useState(item.kind !== 'chest');
  useEffect(() => {
    if (item.kind !== 'chest') return;
    const t = setTimeout(() => setOpened(true), (delay + 0.7) * 1000);
    return () => clearTimeout(t);
  }, [item.kind, delay]);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: -25, y: -30 }}
      animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 14 }}
      className="relative flex items-center gap-3 bg-gray-900/90 text-white rounded-lg pixel-border px-3 py-2 overflow-hidden"
    >
      <Burst delay={delay + 0.15} />
      {/* faixa de brilho passando */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-y-0 w-10 bg-white/25 skew-x-[-20deg]"
        initial={{ left: '-20%' }}
        animate={{ left: '120%' }}
        transition={{ delay: delay + 0.3, duration: 0.7, ease: 'easeInOut' }}
      />
      <motion.span
        className="text-3xl relative"
        aria-hidden="true"
        animate={
          item.kind === 'chest' && !opened
            ? { rotate: [0, -10, 10, -10, 10, 0] }
            : { scale: [1, 1.3, 1], rotate: [0, -12, 12, 0] }
        }
        transition={{ delay: item.kind === 'chest' && !opened ? delay + 0.1 : 0.05, duration: item.kind === 'chest' && !opened ? 0.6 : 0.8 }}
      >
        {item.kind === 'chest' && !opened ? '📦' : item.icon}
      </motion.span>
      <span className="text-left relative">
        <span className="block font-minecraft text-[10px] text-minecraft-gold">{item.label}</span>
        <span className="block font-body font-bold text-sm">{item.title}</span>
        {item.text && <span className="block font-body text-xs text-gray-300">{item.text}</span>}
      </span>
    </motion.div>
  );
}

export function LevelRewardModal({
  show,
  levelNumber,
  stars,
  xpGained,
  worldCompleted,
  newPlayerLevel = null,
  highlights = [],
  nextLevel,
  onNext,
  onMap,
}: LevelRewardModalProps) {
  const tAch = newPlayerLevel ? T_LEVEL_UP + 1 : T_LEVEL_UP;
  const tWorld = tAch + highlights.length * ACH_GAP;
  // Botões no fim da comemoração, mas sem fazer a criança esperar demais
  const tButtons = Math.min(tWorld + (worldCompleted ? 0.9 : 0.2), 3.5);

  // Sons no mesmo ritmo das animações
  useEffect(() => {
    if (!show) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (s: number, fn: () => void) => timers.push(setTimeout(fn, s * 1000));
    playJingle(worldCompleted ? 'vitoria-chefe' : 'vitoria');
    // Falas gravadas, uma depois da outra: a frase da fase, subiu de nível e cada destaque
    queueVoiceFile(
      nextLevel === null
        ? 'voz/mascote/fim-aventura.mp3'
        : worldCompleted
        ? 'voz/mascote/mundo-concluido.mp3'
        : stars >= 3
        ? 'voz/mascote/tres-estrelas.mp3'
        : 'voz/mascote/fase-concluida.mp3'
    );
    if (newPlayerLevel) queueVoiceFile('voz/mascote/subiu-nivel.mp3');
    highlights.forEach((h) => queueVoiceFile(highlightVoice(h)));
    for (let i = 0; i < 3; i++) if (i < stars) at(T_STARS + (i + 1) * STAR_GAP, () => playSfx(`estrela-${i + 1}`, 'star'));
    at(T_XP, () => playSound('xp'));
    if (newPlayerLevel) at(T_LEVEL_UP, () => playSound('levelup'));
    highlights.forEach((h, i) => {
      const t = tAch + i * ACH_GAP;
      if (h.kind === 'chest') at(t, () => playSfx('bau-treme'));
      at(t + (h.kind === 'chest' ? 0.7 : 0), () => {
        playSfx(highlightSfx(h), h.kind === 'chest' ? 'xp' : 'trophy');
      });
    });
    if (worldCompleted) at(tWorld, () => playSfx('trofeu-grande', 'trophy'));
    return () => timers.forEach(clearTimeout);
  }, [show, stars, newPlayerLevel, highlights, worldCompleted, nextLevel, tAch, tWorld]);

  return (
    <>
    {show && <Confetti />}
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="level-reward-title"
        >
          <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 250, damping: 20 }}
            className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-2xl pixel-border p-5 md:p-8 text-center w-full max-w-sm mx-4 shadow-2xl my-auto"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="text-5xl mb-2"
              aria-hidden="true"
            >
              🎉
            </motion.div>

            <motion.h2
              id="level-reward-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-minecraft text-xl md:text-2xl text-white drop-shadow-lg mb-3"
            >
              Fase {levelNumber} concluída!
            </motion.h2>

            {/* Estrelas: caem uma por vez */}
            <div className="flex justify-center gap-2 mb-3" aria-label={`${stars} de 3 estrelas`} role="img">
              {[1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: -40, scale: 0.3, rotate: -180 }}
                  animate={{ opacity: 1, y: 0, scale: [0.3, 1.4, 1], rotate: 0 }}
                  transition={{ delay: T_STARS + i * STAR_GAP, duration: 0.5 }}
                  className={`text-4xl ${i <= stars ? '' : 'opacity-40 grayscale'}`}
                  aria-hidden="true"
                >
                  {i <= stars ? '⭐' : '☆'}
                </motion.span>
              ))}
            </div>

            {/* XP somando */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: T_XP, type: 'spring', stiffness: 300 }}
              className="flex items-center justify-center gap-2 mb-3 bg-white/20 rounded-lg py-2 px-4"
            >
              <span className="text-2xl" aria-hidden="true">💎</span>
              <span className="font-minecraft text-lg md:text-xl text-white drop-shadow">
                +<CountUp to={xpGained} delay={T_XP} /> XP
              </span>
            </motion.div>

            {/* Subiu de nível */}
            {newPlayerLevel && (
              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: 10 }}
                animate={{ opacity: 1, scale: [0, 1.25, 1], rotate: 0 }}
                transition={{ delay: T_LEVEL_UP, duration: 0.6 }}
                className="relative mb-3 bg-minecraft-emerald/90 rounded-lg py-2 px-4"
              >
                <Burst delay={T_LEVEL_UP + 0.1} />
                <p className="font-minecraft text-sm text-white">⬆️ Subiu para o nível {newPlayerLevel}!</p>
              </motion.div>
            )}

            {/* Conquistas e troféus, um por vez */}
            {highlights.length > 0 && (
              <div className="space-y-2 mb-3">
                {highlights.map((h, i) => (
                  <HighlightCard key={h.id} item={h} delay={tAch + i * ACH_GAP} />
                ))}
              </div>
            )}

            {worldCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: [0, 1.2, 1] }}
                transition={{ delay: tWorld, duration: 0.6 }}
                className="relative mb-3 bg-purple-600/60 rounded-lg py-3 px-4"
              >
                <Burst delay={tWorld + 0.1} />
                <span className="text-3xl" aria-hidden="true">🏆</span>
                <p className="font-minecraft text-sm md:text-base text-white mt-1">Mundo concluído!</p>
              </motion.div>
            )}

            {/* Botões: seguir direto para a próxima fase */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: tButtons }}
              className="space-y-2"
            >
              {nextLevel ? (
                <motion.div
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ delay: tButtons + 0.5, duration: 1.2, repeat: Infinity }}
                >
                  <MinecraftButton variant="gold" size="lg" fullWidth onClick={onNext}>
                    ▶ PRÓXIMA FASE ({nextLevel})
                  </MinecraftButton>
                </motion.div>
              ) : (
                <p className="font-minecraft text-sm text-white">👑 Você terminou a aventura!</p>
              )}
              <MinecraftButton variant="secondary" size="sm" fullWidth onClick={onMap}>
                🗺️ Voltar ao mapa
              </MinecraftButton>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
