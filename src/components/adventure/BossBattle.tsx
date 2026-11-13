import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mob } from '../mobs';
import { MinecraftButton } from '../ui/MinecraftButton';
import type { WorldBoss } from '../../data/worldThemes';
import { playMobSound, playSfx } from '../../lib/sounds';
import { playJingle } from '../../lib/audio/music';
import { playVoiceFile, playVoiceSequence, speak } from '../../lib/voice';
import { WORLD_THEMES } from '../../data/worldThemes';

/** Pasta das falas gravadas do chefe (voz/chefes/01 ... 10). */
function bossDir(boss: WorldBoss): string {
  const n = WORLD_THEMES.findIndex((t) => t.boss === boss) + 1;
  return `voz/chefes/${String(Math.max(n, 1)).padStart(2, '0')}`;
}
import { useGameStats } from '../../services/gameStatsService';

export interface BossEvent {
  /** hit = criança pontuou; laugh = chefe pontuou */
  kind: 'hit' | 'laugh';
  /** Muda a cada evento (dispara a animação de novo) */
  id: number;
}

interface BossBattleProps {
  boss: WorldBoss;
  playerScore: number;
  bossScore: number;
  /** Pergunta atual (1..total) */
  question: number;
  total: number;
  event: BossEvent | null;
  /** A criança venceu a prova: o chefe fala a derrota */
  defeated?: boolean;
}

const LAUGHS = ['Hahaha! Ponto meu!', 'Errou! Hehehe!', 'Hohoho! Essa é minha!', 'Muahaha!'];
const OUCHES = ['Ai! Ponto seu!', 'Uou! Acertou!', 'Grrr! Essa doeu!', 'Nããão!'];

/**
 * Prova do mundo contra o chefe: perguntas sobre as fases do mundo.
 * Acertou de primeira = ponto da criança; errou = ponto do chefe. Vence quem fizer mais pontos.
 */
export function BossBattle({ boss, playerScore, bossScore, question, total, event, defeated = false }: BossBattleProps) {
  const { skin } = useGameStats();
  const [bubble, setBubble] = useState<{ who: 'player' | 'boss'; text: string } | null>(null);
  const dir = bossDir(boss);

  // Chefe entra: tambores, apresentação do chefe e as regras da prova (a pergunta espera a vez)
  useEffect(() => {
    playSfx('chefe-entra');
    const t = setTimeout(() => playVoiceSequence([`${dir}/apresenta.mp3`, 'voz/chefes/prova-regras.mp3']), 600);
    return () => clearTimeout(t);
  }, [dir]);

  // Perdeu a prova: o chefe admite a derrota
  useEffect(() => {
    if (defeated) playVoiceSequence([`${dir}/derrota.mp3`]);
  }, [defeated, dir]);

  useEffect(() => {
    if (!event) return;
    const k = (event.id % 4) + 1;
    if (event.kind === 'hit') {
      playSfx('ponto-crianca', 'break');
      setBubble({ who: 'boss', text: OUCHES[k - 1] });
      playVoiceFile(`${dir}/ai-${k}.mp3`);
    } else {
      playSfx('ponto-chefe');
      playMobSound(boss.type);
      const laugh = LAUGHS[k - 1];
      setBubble({ who: 'boss', text: laugh });
      speak(laugh, { file: `${dir}/ponto-${k}.mp3` });
    }
    const t = setTimeout(() => setBubble(null), 1500);
    return () => clearTimeout(t);
  }, [event, boss.type, dir]);

  const winning = playerScore > bossScore ? 'player' : bossScore > playerScore ? 'boss' : null;

  return (
    <section
      aria-label={`Prova contra ${boss.name}. Pergunta ${question} de ${total}. Você ${playerScore}, chefe ${bossScore}.`}
      className="relative mb-4 bg-gray-900/90 rounded-xl pixel-border px-3 py-3"
    >
      <p className="text-center font-minecraft text-[10px] sm:text-xs text-red-300">
        ⚔️ PROVA DO MUNDO · pergunta {Math.min(question, total)} de {total}
      </p>

      <div className="flex items-end justify-between gap-2 mt-2">
        {/* Criança */}
        <div className="flex flex-col items-center w-24">
          <motion.div
            key={`p-${event?.id ?? 0}`}
            animate={event?.kind === 'hit' ? { x: [0, 18, 0], rotate: [0, 8, 0] } : event?.kind === 'laugh' ? { x: [0, -6, 6, 0] } : undefined}
            transition={{ duration: 0.5 }}
          >
            <Mob type={skin.character} skin={skin} size={52} animation={event?.kind === 'hit' ? 'celebrate' : 'idle'} title="Você" />
          </motion.div>
          <span className="font-body text-xs text-white mt-1">Você</span>
        </div>

        {/* Placar */}
        <div className="flex-1 text-center" aria-hidden="true">
          <div className="font-minecraft text-3xl sm:text-4xl text-white tabular-nums">
            <motion.span key={`ps-${playerScore}`} initial={{ scale: 1.8, color: '#4ade80' }} animate={{ scale: 1, color: '#ffffff' }} className="inline-block">
              {playerScore}
            </motion.span>
            <span className="mx-2 text-white/60">×</span>
            <motion.span key={`bs-${bossScore}`} initial={{ scale: 1.8, color: '#f87171' }} animate={{ scale: 1, color: '#ffffff' }} className="inline-block">
              {bossScore}
            </motion.span>
          </div>
          <p className="font-body text-[11px] text-gray-300 mt-1">
            {winning === 'player' ? 'Você está ganhando! 💪' : winning === 'boss' ? 'O chefe está na frente!' : 'Empatado!'}
          </p>
        </div>

        {/* Chefe */}
        <div className="relative flex flex-col items-center w-24">
          <div style={{ filter: boss.filter }}>
            <motion.div
              key={`b-${event?.id ?? 0}`}
              animate={
                event?.kind === 'hit'
                  ? { x: [0, -10, 10, -6, 6, 0], filter: ['brightness(1)', 'brightness(3) saturate(0)', 'brightness(1)'] }
                  : event?.kind === 'laugh'
                  ? { y: [0, -14, 0, -10, 0], scale: [1, 1.1, 1] }
                  : { y: [0, -3, 0] }
              }
              transition={event ? { duration: 0.6 } : { duration: 2, repeat: Infinity }}
            >
              <Mob type={boss.type} size={64} animation={event?.kind === 'laugh' ? 'jump' : 'idle'} title={boss.name} />
            </motion.div>
          </div>
          <span className="font-body text-xs text-red-200 mt-1 text-center leading-tight">{boss.name}</span>
          <AnimatePresence>
            {bubble && (
              <motion.span
                initial={{ opacity: 0, y: 6, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -top-8 right-0 whitespace-nowrap bg-white text-gray-900 font-body font-bold text-xs px-2 py-1 rounded pixel-border"
                role="status"
              >
                {bubble.text}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      <p className="text-center font-body text-[11px] text-gray-400 mt-2">Acertou de primeira: ponto seu. Errou: ponto do chefe.</p>
    </section>
  );
}

interface BossResultProps {
  boss: WorldBoss;
  playerScore: number;
  bossScore: number;
  onRetry: () => void;
  onMap: () => void;
}

/** Chefe venceu (ou empatou): revanche, sem passar de mundo. */
export function BossDefeat({ boss, playerScore, bossScore, onRetry, onMap }: BossResultProps) {
  const tie = playerScore === bossScore;
  useEffect(() => {
    playMobSound(boss.type);
    playJingle('revanche');
    const dir = bossDir(boss);
    speak(tie ? 'Empate! Vamos de revanche?' : 'O chefe venceu desta vez. Vamos tentar de novo?', {
      file: `${dir}/${tie ? 'empate' : 'vitoria'}.mp3`,
    });
  }, [boss, tie]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="boss-defeat-title"
    >
      <motion.div
        initial={{ scale: 0.6, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-gray-900 pixel-border rounded-2xl p-6 max-w-sm w-full text-center text-white"
      >
        <div className="flex justify-center mb-2" style={{ filter: boss.filter }}>
          <Mob type={boss.type} size={80} animation="celebrate" title={boss.name} />
        </div>
        <h2 id="boss-defeat-title" className="font-minecraft text-lg text-red-300">
          {tie ? 'Empate!' : `${boss.name} venceu!`}
        </h2>
        <p className="font-minecraft text-3xl my-3 tabular-nums">
          {playerScore} × {bossScore}
        </p>
        <p className="font-body text-sm text-gray-300 mb-4">
          {tie ? 'Para passar de mundo é preciso fazer mais pontos que o chefe.' : 'Você precisa fazer mais pontos que o chefe. Olhe as dicas e tente de novo!'}
        </p>
        <div className="space-y-2">
          <MinecraftButton variant="gold" size="lg" fullWidth onClick={onRetry}>
            ⚔️ REVANCHE
          </MinecraftButton>
          <MinecraftButton variant="secondary" size="sm" fullWidth onClick={onMap}>
            🗺️ Voltar ao mapa
          </MinecraftButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
