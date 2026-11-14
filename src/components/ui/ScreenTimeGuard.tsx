import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mob } from '../mobs';
import { MinecraftButton } from './MinecraftButton';
import { adventureService } from '../../services/adventureService';
import { gameStatsService, useGameStats } from '../../services/gameStatsService';
import { useProgressVersion } from '../../lib/store';
import { dayKey } from '../../lib/days';
import { adultChallenge, secondsLeft } from '../../lib/screenTime';
import { stopSpeaking } from '../../lib/voice';

/** Telas onde o tempo conta (as de jogar; não conta na Área dos Pais nem no login). */
const COUNTED = ['/adventure', '/treino', '/album', '/casa', '/loja', '/relampago', '/dashboard'];
const TICK = 15; // segundos entre gravações

/**
 * Tempo de tela: conta o tempo jogando (com a aba visível) e, quando acaba o limite
 * escolhido pelos pais, cobre a tela com "Hora de descansar!".
 */
export function ScreenTimeGuard() {
  useProgressVersion();
  const { pathname } = useLocation();
  const stats = useGameStats();
  const limit = adventureService.getScreenTimeLimit();
  const counted = COUNTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const left = secondsLeft(limit, stats.playTime, dayKey(new Date()));
  const blocked = counted && left !== null && left <= 0;

  useEffect(() => {
    if (!limit || !counted || blocked) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') gameStatsService.addPlayTime(TICK);
    }, TICK * 1000);
    return () => clearInterval(id);
  }, [limit, counted, blocked]);

  useEffect(() => {
    if (blocked) stopSpeaking();
  }, [blocked]);

  if (!blocked) return null;
  return <RestScreen />;
}

function RestScreen() {
  const [asking, setAsking] = useState(false);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState(false);
  const challenge = useMemo(() => adultChallenge(Date.now() % 997), []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (Number(typed) === challenge.answer) gameStatsService.addExtraMinutes(15);
    else setError(true);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-indigo-950/95 px-4" role="dialog" aria-modal="true" aria-labelledby="rest-title">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-sm w-full text-center text-white">
        <div className="text-6xl mb-2" aria-hidden="true">🌙</div>
        <div className="flex justify-center mb-3">
          <Mob type="steve" size={80} animation="sad" title="Personagem descansando" />
        </div>
        <h2 id="rest-title" className="font-minecraft text-lg text-brand-gold mb-2">Hora de descansar!</h2>
        <p className="font-body text-base mb-6">Você jogou bastante hoje. Seu progresso está guardado. Volte amanhã para continuar a aventura!</p>
        {!asking ? (
          <MinecraftButton variant="secondary" size="sm" onClick={() => setAsking(true)}>
            Sou um adulto
          </MinecraftButton>
        ) : (
          <form onSubmit={submit} className="bg-white/10 rounded-lg p-4 space-y-3">
            <label className="block font-body text-sm">
              Para liberar mais 15 minutos: <strong>{challenge.question}</strong>
              <input
                inputMode="numeric"
                value={typed}
                onChange={(e) => {
                  setTyped(e.target.value);
                  setError(false);
                }}
                className="mt-2 w-full rounded px-3 py-2 text-gray-900 font-body text-lg text-center"
                autoFocus
              />
            </label>
            {error && <p role="alert" className="font-body text-sm text-red-300">Resposta errada.</p>}
            <MinecraftButton variant="gold" size="sm" fullWidth>
              Liberar 15 minutos
            </MinecraftButton>
          </form>
        )}
      </motion.div>
    </div>
  );
}
