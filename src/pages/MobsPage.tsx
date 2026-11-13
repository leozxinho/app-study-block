import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MinecraftButton } from '../components/ui/MinecraftButton';
import { Mob, MobWalker, MOBS, MOB_TYPES, BASE_ANIMATIONS } from '../components/mobs';
import { PixelArt } from '../components/activities/shared/PixelArt';
import { ITEM_SPRITES } from '../components/activities/shared/itemSprites';

// Página só de desenvolvimento para conferir todos os mobs e animações.
export function MobsPage() {
  const navigate = useNavigate();
  const [size, setSize] = useState(64);

  return (
    <div className="min-h-screen bg-gradient-to-b from-minecraft-sky to-blue-100 pb-12">
      <div className="bg-minecraft-dark-green/90 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <MinecraftButton variant="secondary" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft size={14} />
          </MinecraftButton>
          <h1 className="font-minecraft text-xs sm:text-sm text-white">Mobs (dev)</h1>
          <label className="font-body text-white text-sm flex items-center gap-2">
            Tamanho
            <input
              type="range"
              min={32}
              max={128}
              step={8}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
            <span className="w-8">{size}</span>
          </label>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {MOB_TYPES.map((type) => {
          const def = MOBS[type];
          const animations = [...BASE_ANIMATIONS, ...def.special];
          return (
            <section key={type} className="bg-white rounded-xl pixel-border p-4">
              <h2 className="font-minecraft text-xs text-gray-800 mb-4">
                {def.label} <span className="font-body text-gray-400">({type})</span>
              </h2>
              <div className="flex flex-wrap gap-4">
                {animations.map((anim) => (
                  <div
                    key={anim}
                    className="flex flex-col items-center justify-end gap-2 bg-sky-50 rounded-lg p-3 min-w-[96px]"
                    style={{ minHeight: size * 1.9 + 40 }}
                  >
                    <Mob type={type} animation={anim} size={size} />
                    <span
                      className={`font-body text-xs font-bold ${
                        def.special.includes(anim) ? 'text-purple-600' : 'text-gray-600'
                      }`}
                    >
                      {anim}
                    </span>
                  </div>
                ))}
              </div>
              <div className="relative h-24 mt-4 bg-minecraft-green/20 rounded-lg border-b-4 border-minecraft-green overflow-hidden">
                <MobWalker type={type} size={size * 0.75} duration={8} />
              </div>
            </section>
          );
        })}
      </div>

      {/* Itens em pixel art (substituem os emojis nas atividades) */}
      <section id="itens" className="max-w-6xl mx-auto px-4 mt-8">
        <h2 className="font-minecraft text-sm text-gray-900 mb-3">Itens em pixel art</h2>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
          {Object.entries(ITEM_SPRITES).map(([emoji, sprite]) => (
            <div key={emoji} className="bg-white rounded-lg p-2 flex flex-col items-center gap-1">
              <PixelArt sprite={sprite} size={48} label={sprite.name} />
              <span className="font-body text-xs text-gray-700">
                {emoji} {sprite.name}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
