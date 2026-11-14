import { playVoiceFile } from '../lib/voice';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MinecraftHeader } from '../components/layout/MinecraftHeader';
import { MinecraftButton } from '../components/ui/MinecraftButton';
import { Mob, Viewer360, SKIN_ITEMS, type PlayerCharacter, type PlayerSkin, type SkinSlot } from '../components/mobs';
import { Modal } from '../components/ui/Modal';
import { gameStatsService, useGameStats } from '../services/gameStatsService';
import { playSound } from '../lib/sounds';

const SLOTS: { id: SkinSlot; label: string; icon: string }[] = [
  { id: 'shirt', label: 'Camisetas', icon: '👕' },
  { id: 'pants', label: 'Calças', icon: '👖' },
  { id: 'hat', label: 'Chapéus', icon: '🎩' },
  { id: 'hero', label: 'Super-heróis', icon: '🦸' },
];

const CHARACTERS: { id: PlayerCharacter; label: string }[] = [
  { id: 'steve', label: 'Téo' },
  { id: 'alex', label: 'Lia' },
  { id: 'luna', label: 'Luna' },
  { id: 'faisca', label: 'Faísca' },
];

// Loja de skins do mascote: só visual, paga com XP (o XP total e o nível não diminuem)
export function ShopPage() {
  const navigate = useNavigate();
  const stats = useGameStats();
  const [slot, setSlot] = useState<SkinSlot>('shirt');
  const [cheer, setCheer] = useState(0);
  // Boneco em 360°: a roupa atual ou um item que a criança quer provar
  const [preview, setPreview] = useState<{ skin: PlayerSkin; title: string } | null>(null);
  const balance = gameStatsService.getXPBalance(stats);

  const celebrate = () => {
    playSound('xp');
    setCheer((c) => c + 1);
  };

  const handleItem = (itemSlot: SkinSlot, id: string) => {
    const owned = gameStatsService.owns(itemSlot, id, stats);
    if (owned) {
      playSound('click');
      gameStatsService.equip(itemSlot, id);
      return;
    }
    if (gameStatsService.buy(itemSlot, id)) {
      celebrate();
      playVoiceFile('voz/mascote/loja-comprou.mp3');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-minecraft-sky via-blue-100 to-green-50">
      <MinecraftHeader showNav />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <h1 className="font-minecraft text-lg sm:text-xl text-gray-900 text-center">🛍️ Loja de Skins</h1>

        {/* Vitrine */}
        <section className="bg-white rounded-xl pixel-border p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-40 h-48 bg-gradient-to-b from-sky-200 to-green-200 rounded-lg pixel-border flex items-end justify-center pb-4">
            <Mob
              key={cheer}
              type={stats.skin.character}
              skin={stats.skin}
              size={110}
              animation={cheer > 0 ? 'celebrate' : 'idle'}
              repeat={cheer > 0 ? 1 : undefined}
              title={`Seu personagem: ${CHARACTERS.find((c) => c.id === stats.skin.character)?.label ?? ''}`}
            />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-4">
            <p className="font-body text-gray-800">
              Você tem{' '}
              <span className="font-minecraft text-lg text-cyan-700" aria-live="polite">
                💎 {balance} XP
              </span>{' '}
              para gastar.
            </p>
            <p className="font-body text-sm text-gray-700">
              Comprar não diminui seu nível. Ganhe mais XP fazendo atividades!
            </p>
            <MinecraftButton variant="primary" size="sm" onClick={() => setPreview({ skin: stats.skin, title: 'Seu personagem' })}>
              👁️ Ver em 360°
            </MinecraftButton>
            <div role="radiogroup" aria-label="Personagem" className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {CHARACTERS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={stats.skin.character === c.id}
                  onClick={() => {
                    playSound('click');
                    gameStatsService.setCharacter(c.id);
                  }}
                  className={`min-h-[48px] px-4 rounded-lg pixel-border font-body font-bold flex items-center gap-2
                    focus:outline-none focus-visible:ring-4 focus-visible:ring-minecraft-lapis
                    ${stats.skin.character === c.id ? 'bg-amber-200 text-gray-900' : 'bg-white text-gray-800 hover:bg-amber-50'}`}
                >
                  <Mob type={c.id} skin={{ ...stats.skin, character: c.id }} size={36} animation="idle" />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Abas */}
        <div role="tablist" aria-label="Tipo de item" className="flex gap-2 justify-center">
          {SLOTS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={slot === s.id}
              onClick={() => setSlot(s.id)}
              className={`min-h-[48px] px-4 rounded-lg font-body font-bold text-sm
                focus:outline-none focus-visible:ring-4 focus-visible:ring-minecraft-lapis
                ${slot === s.id ? 'bg-minecraft-dark-green text-white' : 'bg-white text-gray-800 border border-gray-300'}`}
            >
              <span aria-hidden="true">{s.icon}</span> {s.label}
            </button>
          ))}
        </div>

        {stats.skin.hero && stats.skin.hero !== 'nenhum' && (slot === 'shirt' || slot === 'pants') && (
          <p className="text-center font-body text-sm text-gray-800 bg-amber-50 border border-amber-300 rounded-md px-3 py-2">
            🦸 Você está com um traje de super-herói, que cobre a camiseta e a calça. Escolha "Sem traje" na aba Super-heróis para usar estas.
          </p>
        )}

        {/* Itens */}
        <div role="tabpanel" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {SKIN_ITEMS.filter((i) => i.slot === slot).map((item) => {
            const owned = gameStatsService.owns(item.slot, item.id, stats);
            const equipped = stats.skin[item.slot] === item.id;
            const missing = item.price - balance;
            const label = equipped
              ? 'Vestindo'
              : owned
                ? 'Vestir'
                : missing > 0
                  ? `Faltam ${missing} XP`
                  : `Comprar · ${item.price} XP`;
            return (
              <motion.div
                key={item.id}
                layout
                className={`bg-white rounded-lg pixel-border p-3 flex flex-col items-center gap-2
                  ${equipped ? 'ring-4 ring-minecraft-emerald' : ''}`}
              >
                <div className="h-24 flex items-end justify-center pt-4">
                  <Mob
                    type={stats.skin.character}
                    skin={{ ...stats.skin, [item.slot]: item.id }}
                    size={64}
                    animation="idle"
                    title={item.name}
                  />
                </div>
                <p className="font-body font-bold text-sm text-gray-900 text-center">{item.name}</p>
                <button
                  type="button"
                  onClick={() => setPreview({ skin: { ...stats.skin, [item.slot]: item.id }, title: item.name })}
                  aria-label={`Provar ${item.name} em 360 graus`}
                  className="w-full min-h-[40px] rounded-md border-2 border-gray-300 bg-white font-body font-bold text-sm text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-minecraft-lapis"
                >
                  👁️ Provar em 360°
                </button>
                <button
                  type="button"
                  onClick={() => handleItem(item.slot, item.id)}
                  disabled={equipped || (!owned && missing > 0)}
                  aria-label={`${item.name}: ${label}`}
                  className={`w-full min-h-[44px] rounded-md font-body font-bold text-sm
                    focus:outline-none focus-visible:ring-4 focus-visible:ring-minecraft-lapis
                    disabled:cursor-not-allowed
                    ${equipped
                      ? 'bg-green-100 text-green-900'
                      : owned
                        ? 'bg-minecraft-dark-green text-white hover:brightness-110'
                        : missing > 0
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-minecraft-gold text-gray-900 hover:brightness-105'}`}
                >
                  {label}
                </button>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-center pb-8">
          <MinecraftButton variant="primary" size="lg" onClick={() => navigate('/dashboard')}>
            ← Voltar ao Perfil
          </MinecraftButton>
        </div>
      </div>
      <Modal open={!!preview} onClose={() => setPreview(null)} title="Ver em 360 graus" maxWidth="max-w-sm">
        {preview && (
          <div className="p-6 flex flex-col items-center gap-3">
            <p className="font-minecraft text-sm text-gray-900 pr-8 text-center">{preview.title}</p>
            <Viewer360 type={preview.skin.character} skin={preview.skin} unit={6} label={preview.title} />
            <p className="font-body text-xs text-gray-700 text-center">Arraste para girar · setas do teclado também funcionam</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
