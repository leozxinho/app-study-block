import { CollectionTabs } from '../components/layout/CollectionTabs';
import { useCallback, useState } from 'react';
import { AchievementToast } from '../components/ui/AchievementToast';
import { MinecraftHeader } from '../components/layout/MinecraftHeader';
import { HOUSE_BLOCKS, HOUSE_COLS, HOUSE_ROWS } from '../data/houseBlocks';
import { adventureService } from '../services/adventureService';
import { gameStatsService, useGameStats, type AchievementDef } from '../services/gameStatsService';
import { playSound } from '../lib/sounds';
import { playVoiceFile } from '../lib/voice';

const SIZE = HOUSE_COLS * HOUSE_ROWS;
const ERASER = '';

/** Minha casa: a criança constrói com os blocos que libera colecionando figurinhas. */
export function HousePage() {
  const stats = useGameStats();
  const stickers = adventureService.countAllLevels().completed;
  const [selected, setSelected] = useState('grama');
  const [earned, setEarned] = useState<AchievementDef[]>([]);
  const clearEarned = useCallback(() => setEarned([]), []);
  const house = Array.from({ length: SIZE }, (_, i) => stats.house[i] ?? '');
  const next = HOUSE_BLOCKS.find((b) => b.unlockAt > stickers);

  const place = (index: number) => {
    const block = HOUSE_BLOCKS.find((b) => b.id === selected);
    if (selected !== ERASER && (!block || block.unlockAt > stickers)) return;
    const updated = [...house];
    updated[index] = updated[index] === selected ? ERASER : selected;
    gameStatsService.saveHouse(updated);
    const got = gameStatsService.checkNewAchievements();
    if (got.length) setEarned(got);
    // A cada 10 blocos colocados, o mascote elogia a casa
    const blocks = updated.filter(Boolean).length;
    if (updated[index] && blocks > 0 && blocks % 10 === 0) playVoiceFile('voz/mascote/casa.mp3');
    playSound(updated[index] ? 'click' : 'break');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-sky to-blue-200">
      <MinecraftHeader showNav />
      <AchievementToast achievements={earned} onDone={clearEarned} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <CollectionTabs />
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="font-minecraft text-lg sm:text-2xl text-gray-900">🏠 Minha Casa</h1>
            <p className="font-body text-gray-800">Escolha um bloco e toque nos quadradinhos para construir.</p>
          </div>
        </div>

        {/* Paleta */}
        <div role="radiogroup" aria-label="Blocos" className="flex flex-wrap gap-2 mb-2">
          {HOUSE_BLOCKS.map((b) => {
            const locked = b.unlockAt > stickers;
            return (
              <button
                key={b.id}
                type="button"
                role="radio"
                aria-checked={selected === b.id}
                disabled={locked}
                onClick={() => setSelected(b.id)}
                title={locked ? `Libera com ${b.unlockAt} figurinhas` : b.name}
                className={`relative w-12 h-12 rounded-md border-4 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-lapis ${
                  selected === b.id ? 'border-brand-gold scale-110' : 'border-gray-700'
                } ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
                style={{ background: b.color }}
              >
                {b.detail && <span className="text-xl" aria-hidden="true">{b.detail}</span>}
                {locked && <span className="absolute -top-2 -right-2 text-sm" aria-hidden="true">🔒</span>}
                <span className="sr-only">{locked ? `${b.name} (libera com ${b.unlockAt} figurinhas)` : b.name}</span>
              </button>
            );
          })}
          <button
            type="button"
            role="radio"
            aria-checked={selected === ERASER}
            onClick={() => setSelected(ERASER)}
            className={`w-12 h-12 rounded-md border-4 bg-white text-xl ${selected === ERASER ? 'border-brand-gold scale-110' : 'border-gray-700'}`}
            title="Apagar"
          >
            <span aria-hidden="true">🧽</span>
            <span className="sr-only">Apagar</span>
          </button>
        </div>
        <p className="font-body text-sm text-gray-800 mb-4">
          Você tem {stickers} figurinhas.
          {next && ` Próximo bloco (${next.name}) com ${next.unlockAt}.`}
        </p>

        {/* Terreno */}
        <div
          className="grid gap-px bg-sky-300 p-1 rounded-lg pixel-border mx-auto"
          style={{ gridTemplateColumns: `repeat(${HOUSE_COLS}, minmax(0, 1fr))`, maxWidth: 640 }}
        >
          {house.map((id, i) => {
            const block = HOUSE_BLOCKS.find((b) => b.id === id);
            return (
              <button
                key={i}
                type="button"
                onClick={() => place(i)}
                aria-label={`Linha ${Math.floor(i / HOUSE_COLS) + 1}, coluna ${(i % HOUSE_COLS) + 1}: ${block ? block.name : 'vazio'}`}
                className="aspect-square flex items-center justify-center text-base sm:text-xl hover:outline hover:outline-2 hover:outline-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-lapis"
                style={{ background: block ? block.color : 'rgba(255,255,255,0.25)' }}
              >
                {block?.detail && <span aria-hidden="true">{block.detail}</span>}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
