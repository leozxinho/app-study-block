import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MinecraftHeader } from '../components/layout/MinecraftHeader';
import { MinecraftButton } from '../components/ui/MinecraftButton';
import { generateProblem, problemOptions, type MathProblem } from '../lib/mathGenerator';
import { playSfx, playSound } from '../lib/sounds';
import { setMusicOverride } from '../lib/audio/music';
import { playVoiceFile, speak } from '../lib/voice';
import { gameStatsService, useGameStats } from '../services/gameStatsService';
import { progressService } from '../services/progressService';
import type { Difficulty } from '../types';

const SECONDS = 60;
const MAX_XP = 30;

/** Dificuldade das contas pela faixa etária (os menores ainda não jogam). */
function difficultyForAge(age: string): Difficulty | null {
  if (age === 'pre-escola-1' || age === 'pre-escola-2') return 'facil';
  if (age === 'fundamental-1') return 'medio';
  if (age === 'fundamental-2') return 'dificil';
  return null;
}

function newRound(difficulty: Difficulty) {
  const problem = generateProblem(difficulty);
  return { problem, options: problemOptions(problem) };
}

const opText = (p: MathProblem) => `${p.a} ${p.op} ${p.b} = ?`;

/** Desafio Relâmpago: o máximo de contas certas em 60 segundos. */
export function LightningPage() {
  const navigate = useNavigate();
  const stats = useGameStats();
  const age = (() => {
    try {
      return localStorage.getItem('minecraft_edu_age_group') || 'maternal';
    } catch {
      return 'maternal';
    }
  })();
  const difficulty = difficultyForAge(age);
  const [phase, setPhase] = useState<'ready' | 'play' | 'end'>('ready');
  const [round, setRound] = useState(() => (difficulty ? newRound(difficulty) : null));
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [left, setLeft] = useState(SECONDS);
  const [wrong, setWrong] = useState<number | null>(null);
  const [record, setRecord] = useState(false);

  useEffect(() => {
    if (phase !== 'play') return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    setMusicOverride('relampago');
    return () => {
      clearInterval(t);
      setMusicOverride(null);
    };
  }, [phase]);

  // Últimos 10 segundos: tique de relógio
  useEffect(() => {
    if (phase === 'play' && left > 0 && left <= 10) playSfx('tempo-acabando');
  }, [phase, left]);

  useEffect(() => {
    if (phase === 'play' && left <= 0) {
      setPhase('end');
      const isRecord = gameStatsService.recordLightning(score);
      setRecord(isRecord);
      if (score > 0) progressService.addXP(Math.min(score, MAX_XP));
      playSfx(isRecord ? 'recorde' : 'fim-de-tempo', 'trophy');
      speak(isRecord ? `Novo recorde! ${score} pontos!` : `Fim! ${score} pontos!`, {
        file: isRecord ? 'voz/mascote/recorde.mp3' : 'voz/mascote/relampago-fim.mp3',
      });
    }
  }, [left, phase, score]);

  const start = () => {
    if (!difficulty) return;
    setScore(0);
    setCombo(0);
    setLeft(SECONDS);
    setRecord(false);
    setRound(newRound(difficulty));
    setPhase('play');
    playVoiceFile('voz/mascote/relampago-comeca.mp3');
  };

  const answer = useCallback(
    (value: number) => {
      if (!round || !difficulty || phase !== 'play') return;
      if (value === round.problem.answer) {
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        setScore((s) => s + (nextCombo >= 5 ? 2 : 1)); // 5 seguidas: vale dobrado
        if (nextCombo === 5) {
          playSfx('combo', 'star');
          playVoiceFile('voz/mascote/combo.mp3');
        }
        else playSound(nextCombo >= 5 ? 'star' : 'correct');
        setRound(newRound(difficulty));
        setWrong(null);
      } else {
        setCombo(0);
        setWrong(value);
        playSound('wrong');
      }
    },
    [round, difficulty, phase, combo]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900">
      <MinecraftHeader showNav />
      <main className="max-w-xl mx-auto px-4 py-6 text-center text-white">
        <h1 className="font-minecraft text-xl sm:text-2xl text-minecraft-gold">⚡ Desafio Relâmpago</h1>

        {!difficulty ? (
          <div className="mt-6 bg-white/10 rounded-xl p-6">
            <p className="font-body text-lg">O Desafio Relâmpago é para quem já está na Pré-Escola ou mais.</p>
            <MinecraftButton variant="gold" size="md" className="mt-4" onClick={() => navigate('/adventure')}>
              🗺️ Voltar ao mapa
            </MinecraftButton>
          </div>
        ) : phase === 'ready' ? (
          <div className="mt-6 bg-white/10 rounded-xl p-6 space-y-3">
            <p className="font-body text-lg">Quantas contas você acerta em {SECONDS} segundos?</p>
            <p className="font-body text-sm text-white/80">5 acertos seguidos: cada um vale 2 pontos! 🔥</p>
            <p className="font-minecraft text-sm">🏆 Recorde: {stats.bestLightning}</p>
            <MinecraftButton variant="gold" size="xl" fullWidth onClick={start}>
              ⚡ COMEÇAR
            </MinecraftButton>
          </div>
        ) : phase === 'play' && round ? (
          <div className="mt-4">
            <div className="flex justify-between font-minecraft text-sm mb-3">
              <span>⭐ {score}</span>
              <span className={combo >= 5 ? 'text-orange-300' : ''}>{combo >= 2 ? `🔥 x${combo}` : ''}</span>
              <span className={left <= 10 ? 'text-red-300' : ''}>⏱️ {left}s</span>
            </div>
            <div className="h-2 bg-white/20 rounded mb-5 overflow-hidden" aria-hidden="true">
              <div className="h-full bg-minecraft-gold transition-all duration-1000 ease-linear" style={{ width: `${(left / SECONDS) * 100}%` }} />
            </div>
            <motion.p
              key={opText(round.problem) + score}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-minecraft text-3xl sm:text-4xl mb-6"
              aria-live="polite"
            >
              {opText(round.problem)}
            </motion.p>
            <div className="grid grid-cols-2 gap-3">
              {round.options.map((o) => (
                <motion.button
                  key={o}
                  type="button"
                  onClick={() => answer(o)}
                  animate={wrong === o ? { x: [0, -8, 8, -4, 0] } : undefined}
                  className={`min-h-[64px] rounded-lg pixel-border font-minecraft text-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-minecraft-gold ${
                    wrong === o ? 'bg-red-400 text-white' : 'bg-white text-gray-900 hover:bg-yellow-100'
                  }`}
                >
                  {o}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="mt-6 bg-white/10 rounded-xl p-6 space-y-3" role="status">
            <p className="text-5xl" aria-hidden="true">{record ? '🏆' : '⚡'}</p>
            <p className="font-minecraft text-xl">{record ? 'NOVO RECORDE!' : 'Fim do tempo!'}</p>
            <p className="font-body text-lg">Você fez {score} pontos.</p>
            {score > 0 && <p className="font-minecraft text-minecraft-gold">+{Math.min(score, MAX_XP)} XP</p>}
            <div className="flex flex-col gap-2">
              <MinecraftButton variant="gold" size="lg" fullWidth onClick={start}>
                🔁 Jogar de novo
              </MinecraftButton>
              <MinecraftButton variant="secondary" size="sm" fullWidth onClick={() => navigate('/adventure')}>
                🗺️ Mapa
              </MinecraftButton>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
