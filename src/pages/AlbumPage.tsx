import { CollectionTabs } from '../components/layout/CollectionTabs';
import { motion } from 'framer-motion';
import { MinecraftHeader } from '../components/layout/MinecraftHeader';
import { ADVENTURE_WORLDS } from '../data/adventureWorlds';
import { WORLD_THEMES } from '../data/worldThemes';
import { adventureService } from '../services/adventureService';
import { useProgressVersion } from '../lib/store';

/** Álbum de figurinhas: cada fase concluída da aventura cola uma figurinha do mundo. */
export function AlbumPage() {
  useProgressVersion();
  const progress = adventureService.getLevelProgress();
  const total = Object.values(progress).filter((p) => p.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 to-orange-200">
      <MinecraftHeader showNav />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <CollectionTabs />
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="font-minecraft text-lg sm:text-2xl text-gray-900">📒 Meu Álbum</h1>
            <p className="font-body text-gray-800">
              {total} de 100 figurinhas. Cada fase concluída cola uma figurinha!
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {ADVENTURE_WORLDS.map((world, w) => {
            const theme = WORLD_THEMES[w];
            const got = theme.stickers.filter((_, i) => progress[w * 10 + i + 1]?.status === 'completed').length;
            const complete = got === 10;
            return (
              <section
                key={world.id}
                aria-label={`${world.name}: ${got} de 10 figurinhas`}
                className={`rounded-xl pixel-border p-4 bg-gradient-to-r ${world.bgColor}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-minecraft text-sm text-white drop-shadow">
                    {world.icon} {world.name}
                  </h2>
                  <span className={`font-body text-xs font-bold rounded px-2 py-1 ${complete ? 'bg-yellow-300 text-gray-900' : 'bg-black/30 text-white'}`}>
                    {complete ? '🏆 Completo!' : `${got}/10`}
                  </span>
                </div>
                <ul className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {theme.stickers.map((sticker, i) => {
                    const n = w * 10 + i + 1;
                    const has = progress[n]?.status === 'completed';
                    return (
                      <li key={n}>
                        <motion.div
                          initial={has ? { rotate: -8, scale: 0.8 } : false}
                          animate={has ? { rotate: (n % 3) - 1, scale: 1 } : undefined}
                          className={`aspect-square rounded-md flex flex-col items-center justify-center text-center ${
                            has ? 'bg-white shadow-md border-2 border-white' : 'bg-black/20 border-2 border-dashed border-white/40'
                          }`}
                          title={has ? sticker.name : `Fase ${n}`}
                        >
                          {has ? (
                            <>
                              <span className="text-2xl sm:text-3xl" aria-hidden="true">{sticker.icon}</span>
                              <span className="sr-only">{sticker.name}</span>
                            </>
                          ) : (
                            <span className="font-minecraft text-[10px] text-white/70">{n}</span>
                          )}
                        </motion.div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
